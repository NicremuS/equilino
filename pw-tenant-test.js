const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // 1. Login as tenant (Locatário demo)
  await page.goto('http://localhost:3000');
  await page.waitForSelector('button:has-text("Locat")', { timeout: 15000 });
  // click the tenant button (second demo button)
  const demoButtons = page.locator('.grid.grid-cols-2 button');
  await demoButtons.nth(1).click();
  await page.waitForTimeout(2500);
  console.log('✓ Tenant demo login clicked, URL:', page.url());

  // 2. Confirm NO tenant session in localStorage
  const session = await page.evaluate(() => localStorage.getItem('equilino-session'));
  if (session) {
    const parsed = JSON.parse(session);
    if (parsed?.user?.role === 'tenant') {
      console.error('FAIL: tenant session was persisted to localStorage!');
      process.exit(1);
    }
  }
  console.log('✓ Tenant session NOT stored in localStorage');

  // 3. Reload — should land on login screen, not auto-login
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  // Login screen has the splash/login buttons; app shell has nav
  const loginVisible = await page.locator('text=Acesso demo').isVisible().catch(() => false);
  if (!loginVisible) {
    console.error('FAIL: tenant was auto-logged in after reload!');
    process.exit(1);
  }
  console.log('✓ After reload: login screen shown, tenant was NOT auto-logged in');

  await browser.close();
  console.log('\n✅ Tenant session isolation working correctly');
})();
