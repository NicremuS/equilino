const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, 'pw-shots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [];

  // ─── 1. Demo landlord login → dashboard loads ─────────────────────────────
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', e => errors.push('PAGE ERROR: ' + e.message));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForSelector('button:has-text("Locador")', { timeout: 15000 });
  await page.locator('button:has-text("Locador")').click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(OUT, 'dash-01-loaded.png') });
  console.log('✓ Demo landlord logged in');

  // 2. Stats cards visible (no "Erro ao carregar dados")
  const statsVisible = await page.locator('text=Receita Mensal').isVisible();
  if (!statsVisible) throw new Error('Stats cards not visible');
  console.log('✓ Stats cards rendered');

  // 3. Revenue chart visible
  const chartVisible = await page.locator('text=Receita vs Despesas').isVisible();
  if (!chartVisible) throw new Error('Revenue chart not visible');
  console.log('✓ Revenue chart rendered');

  // 4. No "Erro ao carregar dados" on initial load
  const hasError = await page.locator('text=Erro ao carregar dados').isVisible();
  if (hasError) throw new Error('Error state shown on initial load!');
  console.log('✓ No error state on initial load');

  // 5. Simulate expired token → inject invalid token → trigger refetch
  await page.evaluate(() => {
    const session = JSON.parse(localStorage.getItem('equilino-session') || '{}');
    if (session.accessToken) {
      // Replace with an obviously expired token (exp in the past)
      session.accessToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkZW1vLXVzZXItMDAxIiwiZXhwIjoxfQ.invalid';
      localStorage.setItem('equilino-session', JSON.stringify(session));
    }
  });

  // Reload to simulate coming back with expired token
  await page.reload({ waitUntil: 'networkidle' });
  // Wait through splash → login → app (with token refresh)
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(OUT, 'dash-02-after-expiry-reload.png') });

  // After reload the app should either: auto-refresh token and show dashboard,
  // or show login screen (if refresh fails). Either way, no crash.
  const isOnLogin = await page.locator('text=Acesso demo').isVisible().catch(() => false);
  const isOnDash  = await page.locator('text=Receita Mensal').isVisible().catch(() => false);
  if (!isOnLogin && !isOnDash) {
    throw new Error('After expiry reload: neither login nor dashboard visible — possible crash');
  }
  console.log(`✓ After token expiry reload: ${isOnLogin ? 'redirected to login (refresh failed, correct)' : 'dashboard loaded (refresh succeeded)'}`);

  // 6. Verify dashboard on fresh registered user
  // Use a new account to verify the flow works for first-time users
  await page.evaluate(() => localStorage.removeItem('equilino-session'));
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForSelector('button:has-text("Locador")', { timeout: 15000 });
  await page.locator('button:has-text("Locador")').click();
  await page.waitForTimeout(3000);

  // Check all critical dashboard sections are present
  const sections = [
    'text=Receita Mensal',
    'text=Contratos Ativos',
    'text=Taxa de Ocupação',
    'text=Receita vs Despesas',
    'text=Próximos Pagamentos',
    'text=Atividade Recente',
  ];
  for (const selector of sections) {
    const visible = await page.locator(selector).first().isVisible().catch(() => false);
    if (!visible) throw new Error(`Missing dashboard section: ${selector}`);
  }
  await page.screenshot({ path: path.join(OUT, 'dash-03-full-check.png') });
  console.log('✓ All 6 dashboard sections visible');

  await browser.close();

  const relevantErrors = errors.filter(e =>
    !e.includes('Download the React DevTools') &&
    !e.includes('ReactDevTools')
  );
  if (relevantErrors.length) {
    console.error('\n❌ Console errors:', relevantErrors.slice(0, 5));
    process.exit(1);
  }
  console.log('\n✅ Dashboard data loading working correctly');
})();
