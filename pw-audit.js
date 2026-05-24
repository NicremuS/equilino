const { chromium } = require('./node_modules/playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const screenshotsDir = path.join(__dirname, 'audit-screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir);

  async function screenshot(page, name) {
    await page.screenshot({ path: path.join(screenshotsDir, `${name}.png`), fullPage: true });
    console.log(`Captured: ${name}`);
  }

  async function doLogin(page, email, password) {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    // Wait for splash to finish
    await page.waitForTimeout(3000);
    // Wait for login form
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("Entrar")');
    await page.waitForTimeout(3000);
  }

  // ── DARK MODE ────────────────────────────────────────────────────────────────
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Force dark mode
  await page.addInitScript(() => {
    localStorage.setItem('equilino-theme', 'dark');
  });

  await page.goto(BASE);
  await page.waitForTimeout(1500);
  await screenshot(page, '00-splash-dark');
  await page.waitForTimeout(2000);
  await screenshot(page, '01-login-dark');

  // Login as landlord
  await doLogin(page, 'demo@equilino.app', 'demo1234');
  await screenshot(page, '02-dashboard-dark');

  // Navigate through screens
  const tabs = [
    ['payments', '03-payments-dark'],
    ['properties', '04-properties-dark'],
    ['contracts', '05-contracts-dark'],
    ['digital-contracts', '06-digital-contracts-dark'],
    ['tenants', '07-tenants-dark'],
    ['maintenance', '08-maintenance-dark'],
    ['inspections', '09-inspections-dark'],
    ['notices', '10-notices-dark'],
    ['reports', '11-reports-dark'],
    ['notifications', '12-notifications-dark'],
    ['settings', '13-settings-dark'],
  ];

  for (const [tab, name] of tabs) {
    await page.evaluate((t) => {
      window.__NEXT_DATA__; // just accessing it
      // trigger zustand store
      const event = new CustomEvent('equilino-nav', { detail: t });
      window.dispatchEvent(event);
    }, tab);

    // Find and click sidebar nav
    await page.evaluate((tabId) => {
      // Access zustand store
      const store = window.__equilinoStore;
      if (store) store.getState().setActiveTab(tabId);
    }, tab);

    // Try clicking sidebar button directly
    const buttons = await page.$$('aside button, nav button');
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (!text) continue;
    }

    await page.waitForTimeout(1000);
    await screenshot(page, name);
  }

  await context.close();

  // ── LIGHT MODE ───────────────────────────────────────────────────────────────
  const ctxLight = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pageLight = await ctxLight.newPage();

  await pageLight.addInitScript(() => {
    localStorage.setItem('equilino-theme', 'light');
  });

  await pageLight.goto(BASE);
  await pageLight.waitForTimeout(3500);
  await screenshot(pageLight, '20-login-light');

  await doLogin(pageLight, 'demo@equilino.app', 'demo1234');
  await screenshot(pageLight, '21-dashboard-light');

  // Light mode key screens
  for (const [tab, name] of [
    ['payments', '22-payments-light'],
    ['properties', '23-properties-light'],
    ['notifications', '24-notifications-light'],
  ]) {
    await pageLight.evaluate((tabId) => {
      const store = window.__equilinoStore;
      if (store) store.getState().setActiveTab(tabId);
    }, tab);
    await pageLight.waitForTimeout(1000);
    await screenshot(pageLight, name);
  }

  await ctxLight.close();

  // ── MOBILE VIEW ──────────────────────────────────────────────────────────────
  const ctxMobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pageMobile = await ctxMobile.newPage();

  await pageMobile.addInitScript(() => {
    localStorage.setItem('equilino-theme', 'dark');
  });

  await pageMobile.goto(BASE);
  await pageMobile.waitForTimeout(3500);
  await screenshot(pageMobile, '30-login-mobile');

  await doLogin(pageMobile, 'ana@equilino.app', 'demo1234');
  await screenshot(pageMobile, '31-tenant-home-mobile');

  await ctxMobile.close();
  await browser.close();

  console.log('\nAll screenshots saved to:', screenshotsDir);
})();
