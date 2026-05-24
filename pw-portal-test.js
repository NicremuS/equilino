const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, 'pw-shots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', e => errors.push('PAGE ERROR: ' + e.message));

  // 1. Portal page loads
  await page.goto('http://localhost:3000/portal', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUT, 'portal-01-login.png') });
  console.log('✓ Portal login page loaded');

  // 2. Verify tenant-specific UI
  const heading = await page.locator('text=Portal do').isVisible();
  if (!heading) throw new Error('Portal heading not found');
  const backLink = await page.locator('text=Área do locador').isVisible();
  if (!backLink) throw new Error('Back link not found');
  console.log('✓ Tenant branding visible');

  // 3. Demo login works
  await page.locator('button:has-text("Inquilino Demo")').click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(OUT, 'portal-02-app.png') });
  const tenantBadge = await page.locator('text=Locatário').first().isVisible();
  if (!tenantBadge) throw new Error('Tenant app badge not found after login');
  console.log('✓ Demo tenant login → app loaded');

  // 4. No session in localStorage
  const session = await page.evaluate(() => localStorage.getItem('equilino-session'));
  if (session && JSON.parse(session)?.user?.role === 'tenant') {
    throw new Error('FAIL: tenant session persisted to localStorage');
  }
  console.log('✓ No tenant session in localStorage');

  // 5. Wrong role blocked (try to login as landlord on /portal)
  // First go back to login
  await page.evaluate(() => localStorage.removeItem('equilino-session'));
  await page.goto('http://localhost:3000/portal', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'demo@equilino.app');
  await page.fill('input[type="password"]', 'demo1234');
  await page.click('button:has-text("Entrar no portal")');
  await page.waitForTimeout(1500);
  const errorMsg = await page.locator('text=exclusivo para inquilinos').isVisible();
  if (!errorMsg) throw new Error('Expected role error for landlord login on /portal');
  await page.screenshot({ path: path.join(OUT, 'portal-03-wrong-role.png') });
  console.log('✓ Landlord blocked from tenant portal with error message');

  // 6. Back link goes to landlord login
  await page.locator('text=Área do locador').click();
  await page.waitForURL('http://localhost:3000/', { timeout: 5000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT, 'portal-04-back-to-landlord.png') });
  console.log('✓ Back link → landlord login page');

  // 7. Landlord login has "Sou inquilino" link pointing to /portal
  const tenantLink = await page.locator('a[href="/portal"]').isVisible();
  if (!tenantLink) throw new Error('"Sou inquilino" link not found on landlord login');
  console.log('✓ "Sou inquilino" link visible on landlord login page');

  await browser.close();

  if (errors.length) {
    console.error('\n❌ Console errors:', errors.slice(0, 5));
    process.exit(1);
  }
  console.log('\n✅ Tenant portal flow fully working');
})();
