import { chromium, webkit } from 'playwright';
import fs from 'fs';
import path from 'path';

const STAGING_WEB_URL = 'https://econexao-app-staging.vercel.app';
const STAGING_API_URL = 'https://econexao-backend-staging-30dt.onrender.com';
const EVIDENCE_DIR = path.resolve('..', 'docs', 'finalization', 'evidence', 'ECO-2003');

async function runAudit() {
  console.log('================================================================');
  console.log('ECO-2003: INICIANDO AUDITORIA BROWSER E SEGURANÇA EM STAGING');
  console.log(`Frontend URL: ${STAGING_WEB_URL}`);
  console.log(`Backend URL:  ${STAGING_API_URL}`);
  console.log('================================================================\n');

  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }

  const results = {
    timestamp: new Date().toISOString(),
    desktopChromium: { passed: false, status: 0, title: '', consoleErrors: [], failedRequests: [], screenshot: '' },
    mobileWebKit: { passed: false, status: 0, title: '', consoleErrors: [], failedRequests: [], screenshot: '' },
  };

  // 1. Desktop Chromium Validation
  console.log('[1/2] Executando validação Desktop com Chromium (1280x800)...');
  const chromiumBrowser = await chromium.launch({ headless: true });
  const desktopContext = await chromiumBrowser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const desktopPage = await desktopContext.newPage();

  desktopPage.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error(`  [Desktop Chromium Console Error]: ${msg.text()}`);
      results.desktopChromium.consoleErrors.push(msg.text());
    }
  });
  desktopPage.on('requestfailed', (req) => {
    const failure = `${req.method()} ${req.url()} - ${req.failure()?.errorText || 'Unknown'}`;
    console.error(`  [Desktop Chromium Request Failed]: ${failure}`);
    results.desktopChromium.failedRequests.push(failure);
  });

  const respDesktop = await desktopPage.goto(STAGING_WEB_URL, { waitUntil: 'networkidle', timeout: 30000 });
  results.desktopChromium.status = respDesktop ? respDesktop.status() : 0;
  await desktopPage.waitForTimeout(3000);
  results.desktopChromium.title = await desktopPage.title();

  const desktopScreenshot = path.join(EVIDENCE_DIR, '01_home_screen_desktop_chromium.png');
  await desktopPage.screenshot({ path: desktopScreenshot, fullPage: true });
  results.desktopChromium.screenshot = path.relative(path.resolve('..'), desktopScreenshot).replace(/\\/g, '/');
  console.log(`  -> Status HTTP: ${results.desktopChromium.status}`);
  console.log(`  -> Page Title: "${results.desktopChromium.title}"`);
  console.log(`  -> Screenshot: ${results.desktopChromium.screenshot}`);
  console.log(`  -> Console Errors: ${results.desktopChromium.consoleErrors.length}`);
  console.log(`  -> Failed Requests: ${results.desktopChromium.failedRequests.length}`);

  results.desktopChromium.passed = (
    results.desktopChromium.status === 200 &&
    results.desktopChromium.consoleErrors.length === 0 &&
    results.desktopChromium.failedRequests.length === 0
  );
  await desktopContext.close();
  await chromiumBrowser.close();

  // 2. Mobile WebKit Validation (Real WebKit Engine - Safari / iPhone)
  console.log('\n[2/2] Executando validação Mobile com WebKit real (390x844 - iPhone Safari)...');
  const webkitBrowser = await webkit.launch({ headless: true });
  const mobileContext = await webkitBrowser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();

  mobilePage.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error(`  [Mobile WebKit Console Error]: ${msg.text()}`);
      results.mobileWebKit.consoleErrors.push(msg.text());
    }
  });
  mobilePage.on('requestfailed', (req) => {
    const failure = `${req.method()} ${req.url()} - ${req.failure()?.errorText || 'Unknown'}`;
    console.error(`  [Mobile WebKit Request Failed]: ${failure}`);
    results.mobileWebKit.failedRequests.push(failure);
  });

  const respMobile = await mobilePage.goto(STAGING_WEB_URL, { waitUntil: 'networkidle', timeout: 30000 });
  results.mobileWebKit.status = respMobile ? respMobile.status() : 0;
  await mobilePage.waitForTimeout(3000);
  results.mobileWebKit.title = await mobilePage.title();

  const mobileScreenshot = path.join(EVIDENCE_DIR, '02_home_screen_mobile_webkit.png');
  await mobilePage.screenshot({ path: mobileScreenshot, fullPage: true });
  results.mobileWebKit.screenshot = path.relative(path.resolve('..'), mobileScreenshot).replace(/\\/g, '/');
  console.log(`  -> Status HTTP: ${results.mobileWebKit.status}`);
  console.log(`  -> Page Title: "${results.mobileWebKit.title}"`);
  console.log(`  -> Screenshot: ${results.mobileWebKit.screenshot}`);
  console.log(`  -> Console Errors: ${results.mobileWebKit.consoleErrors.length}`);
  console.log(`  -> Failed Requests: ${results.mobileWebKit.failedRequests.length}`);

  results.mobileWebKit.passed = (
    results.mobileWebKit.status === 200 &&
    results.mobileWebKit.consoleErrors.length === 0 &&
    results.mobileWebKit.failedRequests.length === 0
  );
  await mobileContext.close();
  await webkitBrowser.close();

  console.log('\n================== RESUMO DA AUDITORIA ECO-2003 ==================');
  console.log(`Desktop Chromium (1280x800): ${results.desktopChromium.passed ? 'APROVADO (200 OK, 0 erros console/rede)' : 'FALHOU'}`);
  console.log(`Mobile WebKit (390x844):     ${results.mobileWebKit.passed ? 'APROVADO (200 OK, 0 erros console/rede)' : 'FALHOU'}`);
  console.log('===================================================================\n');

  if (!results.desktopChromium.passed || !results.mobileWebKit.passed) {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error('[ERRO FATAL NA AUDITORIA]:', err);
  process.exit(1);
});
