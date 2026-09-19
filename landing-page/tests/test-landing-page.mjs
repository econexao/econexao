import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

function resolvePlaywright() {
  const candidates = [
    path.resolve(__dirname, "../../econexao-app/node_modules/playwright"),
    path.resolve(__dirname, "../../../eco-nexao-v3/econexao-app/node_modules/playwright"),
    "playwright",
  ];
  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {}
  }
  throw new Error("Could not resolve playwright module");
}

const { chromium } = resolvePlaywright();
const LANDING_PAGE_DIR = path.resolve(__dirname, "..");

let mockScenario = "success_new";

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/v1/newsletter/subscribe" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      res.setHeader("Content-Type", "application/json");

      if (mockScenario === "success_new") {
        res.writeHead(200);
        res.end(
          JSON.stringify({
            data: {
              status: "subscribed",
              message: "Inscrição realizada com sucesso! Você receberá novidades e oportunidades do ECOnexão.",
            },
          })
        );
      } else if (mockScenario === "success_duplicate") {
        res.writeHead(200);
        res.end(
          JSON.stringify({
            data: {
              status: "already_subscribed",
              message: "Tudo certo! Seu e-mail já está cadastrado para receber nossas novidades.",
            },
          })
        );
      } else if (mockScenario === "rate_limit") {
        res.writeHead(429);
        res.end(
          JSON.stringify({
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: "Limite de requisições excedido. Tente novamente mais tarde.",
            },
          })
        );
      } else if (mockScenario === "server_error") {
        res.writeHead(500);
        res.end(
          JSON.stringify({
            error: {
              code: "INTERNAL_SERVER_ERROR",
              message: "Ocorreu um erro interno no servidor.",
            },
          })
        );
      } else if (mockScenario === "network_error") {
        res.destroy();
      }
    });
    return;
  }

  // Static file handler with cleanUrls and rewrites for /Play and /play
  let reqPath = url.pathname;
  if (reqPath === "/Play" || reqPath === "/play" || reqPath === "/Play/" || reqPath === "/play/") {
    reqPath = "/Play.html";
  }

  let filePath = path.join(LANDING_PAGE_DIR, reqPath === "/" ? "index.html" : reqPath);
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + ".html")) {
    filePath = filePath + ".html";
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  const ext = path.extname(filePath);
  const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css",
    ".js": "application/javascript",
    ".png": "image/png",
    ".webp": "image/webp",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
  };

  res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
});

async function runTests() {
  await new Promise((resolve) => server.listen(8099, "127.0.0.1", resolve));
  console.log("Mock server running on http://127.0.0.1:8099");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // ==========================================
    // PARTE 1: TESTES DA LANDING PAGE ORIGINAL
    // ==========================================
    await page.goto("http://127.0.0.1:8099/");
    console.log("✓ Page loaded successfully");

    const form = page.locator("#signup-form");
    await form.waitFor({ state: "visible" });
    const emailInput = page.locator("#email");
    const statusMsg = page.locator("#form-status");

    // 1. Accessibility attributes verification
    const roleAttr = await statusMsg.getAttribute("role");
    const ariaLiveAttr = await statusMsg.getAttribute("aria-live");
    if (roleAttr !== "status" || ariaLiveAttr !== "polite") {
      throw new Error(`Accessibility mismatch: role=${roleAttr}, aria-live=${ariaLiveAttr}`);
    }
    console.log("✓ Accessibility attributes verified (role=status, aria-live=polite)");

    // 1b. Hero CTA button pointing to app.econexaoturismo.com in a new tab
    const heroBtn = page.locator(".hero__copy .button");
    const heroHref = await heroBtn.getAttribute("href");
    const heroTarget = await heroBtn.getAttribute("target");
    const heroRel = await heroBtn.getAttribute("rel");
    if (heroHref !== "https://app.econexaoturismo.com/" || heroTarget !== "_blank" || !heroRel?.includes("noopener")) {
      throw new Error(`Hero button attributes mismatch: href=${heroHref}, target=${heroTarget}, rel=${heroRel}`);
    }
    console.log("✓ Hero CTA button points to https://app.econexaoturismo.com/ (target=_blank, rel=noopener noreferrer)");

    // 2. Client-side invalid email submission
    await emailInput.fill("invalid-email");
    await form.locator("button[type='submit']").click();
    await page.waitForTimeout(100);

    const isInvalid = await emailInput.getAttribute("aria-invalid");
    const errorText = await statusMsg.textContent();
    if (isInvalid !== "true" || !errorText.includes("válido")) {
      throw new Error(`Invalid email check failed: aria-invalid=${isInvalid}, text=${errorText}`);
    }
    console.log("✓ Client-side validation test passed");

    // 3. Fail-closed test when API Base URL is unresolvable / empty
    await page.evaluate(() => {
      window._originalGetApiBaseUrl = window.getApiBaseUrl;
      window.getApiBaseUrl = () => "";
    });

    await emailInput.fill("teste.unconfigured@exemplo.com");
    await form.locator("button[type='submit']").click();
    await page.waitForTimeout(100);

    const unconfiguredStatus = await statusMsg.textContent();
    if (!unconfiguredStatus.includes("indisponível")) {
      throw new Error(`Fail-closed unconfigured API test failed: text=${unconfiguredStatus}`);
    }
    console.log("✓ Fail-closed unconfigured API base URL handled safely");

    // Re-configure target URL for API mock testing
    await page.evaluate(() => {
      window.ECONEXAO_API_BASE_URL = "http://127.0.0.1:8099";
      window.getApiBaseUrl = () => "http://127.0.0.1:8099";
    });

    // 4. New subscription happy path
    mockScenario = "success_new";
    await emailInput.fill("turista@santarem.com");
    await form.locator("button[type='submit']").click();

    await page.waitForFunction(() => {
      const el = document.querySelector("#form-status");
      return el && el.textContent.includes("sucesso");
    });
    console.log("✓ New subscription success flow passed");

    // 5. Duplicate subscription flow
    mockScenario = "success_duplicate";
    await emailInput.fill("turista@santarem.com");
    await form.locator("button[type='submit']").click();

    await page.waitForFunction(() => {
      const el = document.querySelector("#form-status");
      return el && el.textContent.includes("já está cadastrado");
    });
    console.log("✓ Duplicate subscription idempotent flow passed");

    // 6. Rate limit handling
    mockScenario = "rate_limit";
    await emailInput.fill("turista@santarem.com");
    await form.locator("button[type='submit']").click();

    await page.waitForFunction(() => {
      const el = document.querySelector("#form-status");
      return el && el.textContent.includes("Muitas tentativas");
    });
    console.log("✓ Rate limit 429 response handled properly");

    // 7. Server error handling
    mockScenario = "server_error";
    await emailInput.fill("turista@santarem.com");
    await form.locator("button[type='submit']").click();

    await page.waitForFunction(() => {
      const el = document.querySelector("#form-status");
      return el && el.textContent.includes("Não foi possível registrar");
    });
    console.log("✓ Server error 500 response handled properly");

    // 8. Network error / retry handling
    mockScenario = "network_error";
    await emailInput.fill("turista@santarem.com");
    await form.locator("button[type='submit']").click();

    await page.waitForFunction(() => {
      const el = document.querySelector("#form-status");
      return el && el.textContent.includes("conectar ao servidor");
    });
    console.log("✓ Network disconnect / retry flow passed");

    // ==========================================
    // PARTE 2: TESTES DA APRESENTAÇÃO PLAY (/Play)
    // ==========================================
    console.log("\n--- INICIANDO TESTES DO PLAY (/Play) ---");

    // 9. Entrada pelo botão "▶" na navegação da Landing Page
    const playBtn = page.locator(".nav__play");
    const ariaLabel = await playBtn.getAttribute("aria-label");
    if (!ariaLabel || !ariaLabel.includes("apresentação")) {
      throw new Error(`Play button missing accessible aria-label: ${ariaLabel}`);
    }
    await playBtn.click();
    await page.waitForURL("**/Play*");
    console.log("✓ Play button click navigated to /Play");

    // 10. Acesso direto a /Play e verificação de slide inicial
    await page.goto("http://127.0.0.1:8099/Play");
    await page.locator("#slide-1").waitFor({ state: "visible" });
    const slide1Active = await page.locator("#slide-1").evaluate((el) => el.classList.contains("is-active"));
    const counterText = await page.locator("#current-slide-num").textContent();
    const prevBtnDisabled = await page.locator("#btn-prev").isDisabled();
    if (!slide1Active || counterText !== "01" || !prevBtnDisabled) {
      throw new Error(`Slide 1 init state mismatch: active=${slide1Active}, counter=${counterText}, prevDisabled=${prevBtnDisabled}`);
    }
    console.log("✓ Direct /Play access initialized on slide 01 with prev button disabled");

    // Native fullscreen must preserve the active slide, update controls and recover from denial.
    await page.getByRole("button", { name: "Entrar em tela cheia" }).click();
    await page.waitForFunction(() => Boolean(document.fullscreenElement));
    await page.getByRole("button", { name: "Sair da tela cheia" }).waitFor();
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(() => document.querySelector("#slide-2").classList.contains("is-active"));
    await page.getByRole("button", { name: "Sair da tela cheia" }).focus();
    await page.keyboard.press("Space");
    await page.waitForFunction(() => !document.fullscreenElement);
    if (!page.url().includes("slide-2")) throw new Error("Fullscreen exit lost active slide");
    await page.evaluate(() => document.dispatchEvent(new Event("fullscreenchange")));
    await page.getByRole("button", { name: "Entrar em tela cheia" }).waitFor();
    await page.evaluate(() => { document.documentElement.requestFullscreen = () => Promise.reject(new Error("Denied")); });
    await page.getByRole("button", { name: "Entrar em tela cheia" }).click();
    await page.getByText("Não foi possível ativar a tela cheia.", { exact: false }).waitFor();
    await page.reload();
    await page.evaluate(() => Object.defineProperty(document, "fullscreenEnabled", { value: false, configurable: true }));
    await page.getByRole("button", { name: "Entrar em tela cheia" }).click();
    await page.getByText("Tela cheia indisponível", { exact: false }).waitFor();
    await page.goto("http://127.0.0.1:8099/Play");
    console.log("✓ Native fullscreen, keyboard exit, preserved slide, denied and unsupported states");

    // 11. Navegação sequencial (próximo e anterior)
    await page.locator("#btn-next").click();
    await page.waitForFunction(() => document.querySelector("#slide-2")?.classList.contains("is-active"));
    const slide2Counter = await page.locator("#current-slide-num").textContent();
    if (slide2Counter !== "02" || !page.url().includes("#slide-2")) {
      throw new Error(`Slide 2 navigation failed: counter=${slide2Counter}, url=${page.url()}`);
    }
    console.log("✓ Next button navigated to slide 02 and updated URL hash to #slide-2");

    // 12. Navegação direta pelos pontos indicadores (Dots)
    const dot5 = page.locator('.nav-dot[aria-label="Slide 5"]');
    await dot5.click();
    await page.waitForFunction(() => document.querySelector("#slide-5")?.classList.contains("is-active"));
    const slide5Counter = await page.locator("#current-slide-num").textContent();
    if (slide5Counter !== "05") {
      throw new Error(`Dot jump to slide 5 failed: counter=${slide5Counter}`);
    }
    console.log("✓ Nav dot click jumped to slide 05");

    // 13. Limite final (Slide 8) e validação do QR Code e CTAs
    const dot8 = page.locator('.nav-dot[aria-label="Slide 8"]');
    await dot8.click();
    await page.waitForFunction(() => document.querySelector("#slide-8")?.classList.contains("is-active"));
    const nextBtnDisabled = await page.locator("#btn-next").isDisabled();
    const qrImg = page.locator('.qr-box img');
    await qrImg.waitFor({ state: "visible" });
    const qrAlt = await qrImg.getAttribute("alt");
    if (!nextBtnDisabled || !qrAlt?.includes("app.econexaoturismo.com")) {
      throw new Error(`Slide 8 end limit / QR code check failed: nextDisabled=${nextBtnDisabled}, qrAlt=${qrAlt}`);
    }
    console.log("✓ Slide 08 reached, next button disabled and QR code verified");

    // 14. Navegação por Teclado (ArrowLeft, ArrowRight, Home, End, Escape)
    await page.keyboard.press("Home");
    await page.waitForFunction(() => document.querySelector("#slide-1")?.classList.contains("is-active"));
    console.log("✓ Keyboard 'Home' key returned to slide 01");

    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(() => document.querySelector("#slide-2")?.classList.contains("is-active"));
    console.log("✓ Keyboard 'ArrowRight' key advanced to slide 02");

    await page.keyboard.press("ArrowLeft");
    await page.waitForFunction(() => document.querySelector("#slide-1")?.classList.contains("is-active"));
    console.log("✓ Keyboard 'ArrowLeft' key returned to slide 01");

    // 15. Refresh e persistência de slide via hash
    await page.goto("http://127.0.0.1:8099/Play#slide-4");
    await page.reload();
    await page.waitForFunction(() => document.querySelector("#slide-4")?.classList.contains("is-active"));
    const refreshedCounter = await page.locator("#current-slide-num").textContent();
    if (refreshedCounter !== "04") {
      throw new Error(`Refresh persistence failed: counter=${refreshedCounter}`);
    }
    console.log("✓ Page refresh preserved active slide 04 from hash");

    // 16. Botão Sair retornando para a landing page
    const exitBtn = page.locator(".btn-exit");
    await exitBtn.click();
    await page.waitForURL("http://127.0.0.1:8099/");
    console.log("✓ Exit button successfully returned to landing page root");

    // 17. Simulação Mobile e Gestos de Toque (Swipe)
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto("http://127.0.0.1:8099/");

    // Abrir menu móvel e clicar em Play
    await mobilePage.locator(".menu-button").click();
    await mobilePage.locator("#menu-principal").waitFor({ state: "visible" });
    await mobilePage.locator("#menu-principal .nav__play").click();
    await mobilePage.waitForURL("**/Play*");
    console.log("✓ Mobile menu drawer opened and navigated to /Play via Play button");

    // Simular swipe left (avançar)
    await mobilePage.evaluate(() => {
      const touchStart = new Touch({ identifier: 1, target: document.body, clientX: 300, clientY: 300 });
      const touchEnd = new Touch({ identifier: 1, target: document.body, clientX: 100, clientY: 300 });
      window.dispatchEvent(new TouchEvent("touchstart", { touches: [touchStart], changedTouches: [touchStart] }));
      window.dispatchEvent(new TouchEvent("touchend", { touches: [], changedTouches: [touchEnd] }));
    });
    await mobilePage.waitForFunction(() => document.querySelector("#slide-2")?.classList.contains("is-active"));
    console.log("✓ Mobile touch swipe-left advanced from slide 01 to slide 02");

    // Simular swipe right (voltar)
    await mobilePage.evaluate(() => {
      const touchStart = new Touch({ identifier: 2, target: document.body, clientX: 100, clientY: 300 });
      const touchEnd = new Touch({ identifier: 2, target: document.body, clientX: 300, clientY: 300 });
      window.dispatchEvent(new TouchEvent("touchstart", { touches: [touchStart], changedTouches: [touchStart] }));
      window.dispatchEvent(new TouchEvent("touchend", { touches: [], changedTouches: [touchEnd] }));
    });
    await mobilePage.waitForFunction(() => document.querySelector("#slide-1")?.classList.contains("is-active"));
    console.log("✓ Mobile touch swipe-right returned from slide 02 to slide 01");

    await mobileContext.close();

    // =========================================================================
    // PARTE 3: VALIDAÇÃO DE FULLSCREEN REAL & RESPONSIVIDADE (1920, 1366, 390, 320)
    // =========================================================================
    const screenshotDir = process.env.PLAY_SCREENSHOT_DIR || path.resolve(__dirname, "../screenshots");
    fs.mkdirSync(screenshotDir, { recursive: true });

    const viewportsToTest = [
      { width: 1920, height: 1080, name: "1920x1080" },
      { width: 1366, height: 768, name: "1366x768" },
      { width: 390, height: 844, name: "390x844" },
      { width: 320, height: 568, name: "320x568" },
    ];

    for (const vp of viewportsToTest) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, reducedMotion: "reduce" });
      const fsPage = await context.newPage();
      const errors = [];
      fsPage.on("pageerror", error => errors.push(error.message));
      fsPage.on("console", message => { if (message.type() === "error") errors.push(message.text()); });

      await fsPage.goto("http://127.0.0.1:8099/Play");
      await fsPage.locator("#slide-1").waitFor({ state: "visible" });

      // Entrar em fullscreen
      await fsPage.getByRole("button", { name: "Entrar em tela cheia" }).click();
      await fsPage.waitForFunction(() => Boolean(document.fullscreenElement));

      for (let i = 1; i <= 8; i++) {
        await fsPage.getByRole("button", { name: `Slide ${i}`, exact: true }).click();
        await fsPage.waitForFunction((slideNum) => {
          const el = document.getElementById(`slide-${slideNum}`);
          return el && el.classList.contains("is-active");
        }, i);

        // Validação geométrica e de integridade em tela cheia
        const fsState = await fsPage.evaluate(async (slideNum) => {
          const active = document.getElementById(`slide-${slideNum}`);
          await Promise.all([...active.querySelectorAll("img")].map(img => img.decode()));

          const rect = active.getBoundingClientRect();
          const header = document.querySelector(".presentation-header");
          const nav = document.querySelector(".presentation-nav");
          const stage = document.querySelector(".stage");
          const deck = document.querySelector(".slide-deck");
          const headerStyle = getComputedStyle(header);
          const navStyle = getComputedStyle(nav);
          const activeStyle = getComputedStyle(active);
          const stageStyle = getComputedStyle(stage);
          const nodes = [...active.querySelectorAll("h1,h2,h3,p,li,figure,.qr-box,.cta-buttons,.altamira-points")];
          const clipped = nodes.filter(node => {
            const box = node.getBoundingClientRect();
            return box.left < -1 || box.right > innerWidth + 1;
          }).map(node => node.tagName);

          return {
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            viewportWidth: innerWidth,
            viewportHeight: innerHeight,
            borderRadius: activeStyle.borderTopLeftRadius,
            headerPosition: headerStyle.position,
            navPosition: navStyle.position,
            scrollWidthExceeds: document.documentElement.scrollWidth > innerWidth,
            clipped,
          };
        }, i);

        // Asserções para Fullscreen
        if (Math.abs(fsState.x) > 1 || Math.abs(fsState.y) > 1) {
          throw new Error(`Slide ${i} at ${vp.name} not positioned at x=0, y=0: x=${fsState.x}, y=${fsState.y}`);
        }
        if (Math.abs(fsState.width - vp.width) > 2) {
          throw new Error(`Slide ${i} at ${vp.name} width does not match viewport: slideWidth=${fsState.width}, viewportWidth=${vp.width}`);
        }
        if (fsState.height < vp.height - 1) {
          throw new Error(`Slide ${i} at ${vp.name} height is less than viewport: slideHeight=${fsState.height}, viewportHeight=${vp.height}`);
        }
        if (fsState.borderRadius !== "0px") {
          throw new Error(`Slide ${i} at ${vp.name} has non-zero border-radius in fullscreen: ${fsState.borderRadius}`);
        }
        if (fsState.headerPosition !== "fixed" || fsState.navPosition !== "fixed") {
          throw new Error(`Controls not fixed overlay in fullscreen at ${vp.name}: header=${fsState.headerPosition}, nav=${fsState.navPosition}`);
        }
        if (fsState.scrollWidthExceeds) {
          throw new Error(`Slide ${i} at ${vp.name} has horizontal overflow (scrollWidth > innerWidth)`);
        }
        if (fsState.clipped.length > 0) {
          throw new Error(`Slide ${i} at ${vp.name} has clipped elements: ${fsState.clipped.join(", ")}`);
        }

        // Salvar screenshot para inspeção visual
        await fsPage.screenshot({
          path: path.join(screenshotDir, `fullscreen-${vp.name}-slide-${i}.png`),
          fullPage: false,
        });
      }

      // Testar saída do Fullscreen e restauração do layout normal
      await fsPage.getByRole("button", { name: "Sair da tela cheia" }).click();
      await fsPage.waitForFunction(() => !document.fullscreenElement);

      const restoredState = await fsPage.evaluate(() => {
        const active = document.querySelector(".slide.is-active");
        const header = document.querySelector(".presentation-header");
        const headerStyle = getComputedStyle(header);
        const activeStyle = getComputedStyle(active);
        return {
          borderRadius: activeStyle.borderTopLeftRadius,
          headerPosition: headerStyle.position,
        };
      });

      if (restoredState.headerPosition === "fixed" && vp.width > 760) {
        throw new Error(`Header position not restored to static after exiting fullscreen at ${vp.name}`);
      }
      if (restoredState.borderRadius !== "12px" && vp.width > 760) {
        throw new Error(`Slide border-radius not restored to 12px after exiting fullscreen at ${vp.name}: ${restoredState.borderRadius}`);
      }

      if (errors.length) throw new Error(`Browser errors at ${vp.name}: ${errors.join("; ")}`);
      console.log(`✓ Fullscreen verified for all 8 slides at ${vp.name} (x=0, y=0, width=${vp.width}, no-border-radius, fixed overlay controls, clean exit)`);
      await context.close();
    }

    console.log("\n========================================================");
    console.log("TODOS OS TESTES (LANDING + PLAY + 32 SLIDE/VIEWPORT CHECKS) FORAM APROVADOS");
    console.log("========================================================");
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
