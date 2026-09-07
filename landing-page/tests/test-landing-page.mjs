import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require(path.resolve(__dirname, "../../econexao-app/node_modules/playwright"));
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

  // Static file handler
  let filePath = path.join(LANDING_PAGE_DIR, url.pathname === "/" ? "index.html" : url.pathname);
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
      // Mock getApiBaseUrl directly to return empty string
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

    console.log("\n==========================================");
    console.log("ALL LANDING PAGE TESTS PASSED (8/8)");
    console.log("==========================================");
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
