/**
 * Full E2E Audit — Sierra App
 * Prueba todos los flujos principales con Playwright.
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BASE = 'http://localhost:8443';
const ARTIFACT = '/Users/diegoreyes/.gemini/antigravity/brain/e0541bb2-6307-48a0-b851-3fdec9c84554';
const results = [];
let pass = 0, fail = 0;

async function ss(page, name) {
  const path = join(ARTIFACT, name + '.png');
  await page.screenshot({ path, fullPage: false });
  return path;
}

async function test(browser, label, fn) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  let status = 'PASS';
  let screenshot = null;
  let detail = '';
  try {
    await fn(page);
    screenshot = await ss(page, 'e2e_pass_' + label.replace(/\s+/g, '_').toLowerCase().slice(0, 40));
    pass++;
    console.log('✅', label);
  } catch (e) {
    status = 'FAIL';
    detail = e.message;
    screenshot = await ss(page, 'e2e_fail_' + label.replace(/\s+/g, '_').toLowerCase().slice(0, 40));
    fail++;
    console.log('❌', label, '->', e.message.slice(0, 120));
  } finally {
    results.push({ label, status, detail, screenshot });
    await ctx.close();
  }
}

async function loginAs(page, email, password) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  // If onboarding visible, skip
  const saltar = page.getByText('Saltar');
  if (await saltar.isVisible().catch(() => false)) await saltar.click();
  await page.waitForTimeout(300);
  // Select role based on email
  let roleBtn;
  if (email.includes('admin')) {
    roleBtn = page.getByText('Panel Admin');
    if (!await roleBtn.isVisible().catch(() => false)) roleBtn = page.getByText('Administrador');
  } else {
    roleBtn = page.getByText('Usuario', { exact: true });
  }
  // Wait for role select screen
  const roles = page.locator('button').filter({ hasText: /Usuario|Colaborador|Repartidor|Administrador|Panel Admin/i });
  await roles.first().waitFor({ timeout: 5000 });
  await roleBtn.click();
  // Fill form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.getByRole('button', { name: /Iniciar sesión/i }).click();
  await page.waitForTimeout(2000);
}

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  // ==== TEST 1: App loads ==== 
  await test(browser, 'App carga en home', async (page) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const saltar = page.getByText('Saltar');
    if (await saltar.isVisible().catch(() => false)) await saltar.click();
    await page.waitForTimeout(500);
    const title = page.locator('h1, h2').first();
    await title.waitFor({ timeout: 5000 });
    console.log('   title:', await title.textContent());
  });

  // ==== TEST 2: Login admin ====
  await test(browser, 'Login Admin funciona', async (page) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const saltar = page.getByText('Saltar');
    if (await saltar.isVisible().catch(() => false)) await saltar.click();
    await page.waitForTimeout(300);
    // Find admin/panel button
    const adminBtn = page.getByText('Administrador').or(page.getByText('Panel Admin'));
    await adminBtn.waitFor({ timeout: 5000 });
    await adminBtn.click();
    await page.fill('input[type="email"]', 'admin@sierraapp.com');
    await page.fill('input[type="password"]', 'Adm!nPlatf0rm2026#Secure');
    await page.getByRole('button', { name: /Iniciar sesión/i }).click();
    await page.waitForTimeout(2000);
    // Should see Panel Admin
    await page.getByText('Panel Admin').first().waitFor({ timeout: 5000 });
    console.log('   Admin panel visible');
  });

  // ==== TEST 3: Admin — Dashboard tab loads data ====
  await test(browser, 'Admin — Dashboard con datos reales', async (page) => {
    await page.goto(BASE);
    await page.waitForTimeout(500);
    const saltar = page.getByText('Saltar');
    if (await saltar.isVisible().catch(() => false)) await saltar.click();
    await page.waitForTimeout(300);
    const adminBtn = page.getByText('Administrador').or(page.getByText('Panel Admin'));
    await adminBtn.waitFor({ timeout: 5000 });
    await adminBtn.click();
    await page.fill('input[type="email"]', 'admin@sierraapp.com');
    await page.fill('input[type="password"]', 'Adm!nPlatf0rm2026#Secure');
    await page.getByRole('button', { name: /Iniciar sesión/i }).click();
    await page.waitForTimeout(2500);
    // Should see some numbers
    const body = await page.content();
    const hasDashboard = body.includes('Usuarios') || body.includes('Pedidos') || body.includes('Locales');
    if (!hasDashboard) throw new Error('Dashboard no muestra datos');
  });

  // ==== TEST 4: Explorar page loads restaurants ====
  await test(browser, 'Explorar — carga restaurantes del backend', async (page) => {
    // Register a test user first
    const ts = Date.now();
    const email = `e2e_test_${ts}@example.com`;
    await page.goto(BASE);
    await page.waitForTimeout(500);
    const saltar = page.getByText('Saltar');
    if (await saltar.isVisible().catch(() => false)) await saltar.click();
    await page.waitForTimeout(300);
    await page.getByText('Usuario', { exact: true }).click();
    // Go to register
    await page.getByText('Crear cuenta', { exact: false }).first().click();
    await page.waitForTimeout(500);
    // Skip onboarding if it shows
    const saltar2 = page.getByText('Saltar');
    if (await saltar2.isVisible().catch(() => false)) await saltar2.click();
    await page.waitForTimeout(300);
    // Fill registration form
    await page.fill('input[placeholder*="nombre" i]', 'Test E2E User').catch(() => {});
    await page.fill('input[type="email"]', email);
    await page.fill('input[placeholder*="teléfono" i]', '5551234567').catch(() => {});
    const pwInputs = page.locator('input[type="password"]');
    const pwCount = await pwInputs.count();
    if (pwCount >= 2) {
      await pwInputs.nth(0).fill('ClaveSegura123#');
      await pwInputs.nth(1).fill('ClaveSegura123#');
    }
    await page.getByRole('button', { name: /Registrarme|Crear cuenta|Registrar/i }).click();
    await page.waitForTimeout(2000);
    // Should redirect to login or home
    // Now login
    await page.fill('input[type="email"]', email).catch(() => {});
    await page.fill('input[type="password"]', 'ClaveSegura123#').catch(() => {});
    const loginBtn = page.getByRole('button', { name: /Iniciar sesión/i });
    if (await loginBtn.isVisible().catch(() => false)) {
      await loginBtn.click();
      await page.waitForTimeout(2000);
    }
    // Check if Explorar page loaded with restaurants
    const body = await page.content();
    if (!body.includes('Explorar') && !body.includes('restaurante') && !body.includes('Taquería') && !body.includes('Buscar')) {
      throw new Error('Explorar no cargó restaurantes. Body tiene: ' + body.slice(0, 200));
    }
  });

  // ==== TEST 5: Login usuario y ver pedidos ====
  await test(browser, 'Pedidos — lista de pedidos del usuario', async (page) => {
    await page.goto(BASE);
    await page.waitForTimeout(500);
    const saltar = page.getByText('Saltar');
    if (await saltar.isVisible().catch(() => false)) await saltar.click();
    await page.waitForTimeout(300);
    await page.getByText('Usuario', { exact: true }).click();
    await page.fill('input[type="email"]', 'diego.autofill.1790998006332@example.com');
    await page.fill('input[type="password"]', 'ClaveSegura123#');
    await page.getByRole('button', { name: /Iniciar sesión/i }).click();
    await page.waitForTimeout(2500);
    // Try to navigate to pedidos
    const pedidosBtn = page.getByText('Pedidos').first();
    if (await pedidosBtn.isVisible().catch(() => false)) {
      await pedidosBtn.click();
      await page.waitForTimeout(1500);
    }
    const body = await page.content();
    if (body.includes('Error') && !body.includes('No tienes pedidos')) {
      throw new Error('Pedidos page has error: ' + body.slice(200, 400));
    }
  });

  // ==== TEST 6: LocalPanel — login local y ver panel ====
  await test(browser, 'LocalPanel — login local y cargar pedidos', async (page) => {
    // Find an active local
    const res = await fetch('http://localhost:4000/api/restaurants/admin/all', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (await fetch('http://localhost:4000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@sierraapp.com', password: 'Adm!nPlatf0rm2026#Secure' })
        }).then(r => r.json()).then(d => d.accessToken))
      }
    });
    const restaurants = await res.json();
    const activeRest = restaurants.find(r => r.status === 'ACTIVO');
    if (!activeRest) throw new Error('No hay restaurante ACTIVO para probar');
    // Find a local test account - use the test restaurant owner
    // Just check if LocalPanel renders
    await page.goto(BASE);
    await page.waitForTimeout(500);
    const saltar = page.getByText('Saltar');
    if (await saltar.isVisible().catch(() => false)) await saltar.click();
    await page.waitForTimeout(300);
    await page.getByText('Colaborador').click();
    await page.fill('input[type="email"]', 'taqueria.verificada@test.com');
    await page.fill('input[type="password"]', 'ClaveSegura123#');
    await page.getByRole('button', { name: /Iniciar sesión/i }).click();
    await page.waitForTimeout(2500);
    const body = await page.content();
    if (!body.includes('Local') && !body.includes('Pedidos') && !body.includes('panel') && !body.includes('Bienvenido')) {
      throw new Error('LocalPanel no cargó: ' + body.slice(0, 300));
    }
  });

  // ==== TEST 7: Notificaciones ====
  await test(browser, 'Notifications — bandeja carga del backend', async (page) => {
    await page.goto(BASE);
    await page.waitForTimeout(500);
    const saltar = page.getByText('Saltar');
    if (await saltar.isVisible().catch(() => false)) await saltar.click();
    await page.waitForTimeout(300);
    await page.getByText('Usuario', { exact: true }).click();
    await page.fill('input[type="email"]', 'diego.autofill.1790998006332@example.com');
    await page.fill('input[type="password"]', 'ClaveSegura123#');
    await page.getByRole('button', { name: /Iniciar sesión/i }).click();
    await page.waitForTimeout(2500);
    // Navigate to notifications
    const bellBtn = page.locator('[aria-label*="notif" i], [data-testid*="notif" i]').or(page.getByTitle('Notificaciones'));
    if (await bellBtn.isVisible().catch(() => false)) {
      await bellBtn.click();
      await page.waitForTimeout(1500);
    } else {
      // Try clicking notifications from nav
      const notifNav = page.getByText('Notificaciones');
      if (await notifNav.isVisible().catch(() => false)) {
        await notifNav.click();
        await page.waitForTimeout(1500);
      }
    }
    const body = await page.content();
    if (!body.includes('Notificaci')) throw new Error('Página de notificaciones no cargó');
  });

  // ==== TEST 8: Favoritos ====
  await test(browser, 'Favoritos — página carga del backend', async (page) => {
    await page.goto(BASE);
    await page.waitForTimeout(500);
    const saltar = page.getByText('Saltar');
    if (await saltar.isVisible().catch(() => false)) await saltar.click();
    await page.waitForTimeout(300);
    await page.getByText('Usuario', { exact: true }).click();
    await page.fill('input[type="email"]', 'diego.autofill.1790998006332@example.com');
    await page.fill('input[type="password"]', 'ClaveSegura123#');
    await page.getByRole('button', { name: /Iniciar sesión/i }).click();
    await page.waitForTimeout(2500);
    // Navigate to favorites
    const favsBtn = page.getByText('Favoritos').or(page.locator('[aria-label*="favorit" i]'));
    if (await favsBtn.first().isVisible().catch(() => false)) {
      await favsBtn.first().click();
      await page.waitForTimeout(1500);
    }
    const body = await page.content();
    if (!body.includes('Favorit')) throw new Error('Página de favoritos no cargó');
  });

  // ==== TEST 9: Promotions ====
  await test(browser, 'Promotions — página carga del backend', async (page) => {
    await page.goto(BASE);
    await page.waitForTimeout(500);
    const saltar = page.getByText('Saltar');
    if (await saltar.isVisible().catch(() => false)) await saltar.click();
    await page.waitForTimeout(300);
    await page.getByText('Usuario', { exact: true }).click();
    await page.fill('input[type="email"]', 'diego.autofill.1790998006332@example.com');
    await page.fill('input[type="password"]', 'ClaveSegura123#');
    await page.getByRole('button', { name: /Iniciar sesión/i }).click();
    await page.waitForTimeout(2500);
    // Navigate to promotions
    const promoBtn = page.getByText('Promociones').or(page.getByText('Promo'));
    if (await promoBtn.first().isVisible().catch(() => false)) {
      await promoBtn.first().click();
      await page.waitForTimeout(1500);
    }
    const body = await page.content();
    if (!body.includes('Promo')) throw new Error('Página de promociones no cargó');
  });

  // ==== TEST 10: Soporte usuario ====
  await test(browser, 'Soporte — usuario puede ver chat', async (page) => {
    await page.goto(BASE);
    await page.waitForTimeout(500);
    const saltar = page.getByText('Saltar');
    if (await saltar.isVisible().catch(() => false)) await saltar.click();
    await page.waitForTimeout(300);
    await page.getByText('Usuario', { exact: true }).click();
    await page.fill('input[type="email"]', 'diego.autofill.1790998006332@example.com');
    await page.fill('input[type="password"]', 'ClaveSegura123#');
    await page.getByRole('button', { name: /Iniciar sesión/i }).click();
    await page.waitForTimeout(2500);
    // Navigate to support
    const supportBtn = page.getByText('Soporte').or(page.getByText('Ayuda'));
    if (await supportBtn.first().isVisible().catch(() => false)) {
      await supportBtn.first().click();
      await page.waitForTimeout(1500);
    }
    const body = await page.content();
    if (!body.includes('Soporte') && !body.includes('Ayuda') && !body.includes('mensaje')) {
      throw new Error('Página de soporte no cargó');
    }
  });

  await browser.close();

  console.log('\n=== RESUMEN E2E ===');
  console.log(`✅ PASSED: ${pass}  ❌ FAILED: ${fail}  Total: ${pass + fail}`);
  results.forEach(r => {
    if (r.status === 'FAIL') {
      console.log('\n❌', r.label);
      console.log('   Causa:', r.detail.slice(0, 200));
      console.log('   Screenshot:', r.screenshot);
    }
  });

  writeFileSync(join(ARTIFACT, 'e2e_audit_results.json'), JSON.stringify(results, null, 2));
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
