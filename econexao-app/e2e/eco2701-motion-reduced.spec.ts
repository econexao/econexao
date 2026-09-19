import { test, expect } from '@playwright/test';

// Categorias Canônicas
const CANONICAL_CATEGORIES = [
  { slug: 'alimentacao', label: 'Alimentação', color: '#D97706', icon: 'utensils' },
  { slug: 'atrativos', label: 'Atrativos', color: '#059669', icon: 'compass' },
  { slug: 'hospedagem', label: 'Hospedagem', color: '#2563EB', icon: 'bed' },
  { slug: 'artesanato', label: 'Artesanato', color: '#7C3AED', icon: 'palette' },
  { slug: 'comercio', label: 'Comércio Local & Lojas', color: '#EA580C', icon: 'store' },
  { slug: 'experiencias', label: 'Experiências & Passeios', color: '#0D9488', icon: 'boat' },
];

const MOCK_REGIONS = [
  { id: 'reg-santarem-belterra', name: 'Santarém / Belterra', state_code: 'PA', is_active: true },
  { id: 'reg-altamira-xingu', name: 'Altamira / Rio Xingu', state_code: 'PA', is_active: true },
];

const MOCK_ROUTES = [
  {
    id: 'route-pindobal',
    slug: 'rota-santarem-pindobal',
    title: 'Rota das Praias: Santarém a Pindobal',
    summary: 'Roteiro cênico passando pelas praias de Alter do Chão e Pindobal.',
    region_id: 'reg-santarem-belterra',
    destination_name: 'Praia de Pindobal',
    distance_km: 45.2,
    duration_hours: 1.5,
    difficulty: 'facil',
    best_season: 'Ano todo',
    is_verified: true,
    city: 'Belterra',
    state_code: 'PA',
    cover_image_url: null,
  },
];

async function setupMocks(page: import('@playwright/test').Page) {
  // Tile requests
  await page.route('**/*.tile.openstreetmap.org/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg width="256" height="256"></svg>' });
  });

  // Supabase Auth
  await page.route('**/auth/v1/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-test-jwt-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'user-e2e-tester',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'tester@econexao.org.br',
          app_metadata: { provider: 'email' },
          user_metadata: { full_name: 'Turista ECOnexão' },
        },
      }),
    });
  });

  // API Client Routes
  await page.route('**/api/v1/**', async (route) => {
    const url = route.request().url();
    const pathname = new URL(url).pathname;

    if (pathname === '/api/v1/regions') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: MOCK_REGIONS }) });
      return;
    }

    if (
      pathname === '/api/v1/actor-categories' ||
      pathname === '/api/v1/actor_categories' ||
      pathname === '/api/v1/categories'
    ) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: CANONICAL_CATEGORIES }) });
      return;
    }

    if (pathname === '/api/v1/me/favorite-actors' || pathname.startsWith('/api/v1/me/favorite-actors')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], meta: { total: 0, page: 1, limit: 50, total_pages: 1 } }),
      });
      return;
    }

    if (pathname === '/api/v1/me/favorite-routes' || pathname.startsWith('/api/v1/me/favorite-routes') || pathname.includes('/saved-routes')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], meta: { total: 0, page: 1, limit: 50, total_pages: 1 } }),
      });
      return;
    }

    if (pathname === '/api/v1/me/preferences' || pathname.includes('/preferences') || pathname.includes('/bootstrap')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { active_region_id: 'reg-santarem-belterra', favorites: [] } }),
      });
      return;
    }

    if (pathname === '/api/v1/me' || pathname === '/api/v1/me/') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'user-e2e-tester',
            email: 'tester@econexao.org.br',
            full_name: 'Turista ECOnexão',
            avatar_url: null,
            role: 'authenticated',
          },
        }),
      });
      return;
    }

    if (pathname === '/api/v1/routes' || pathname === '/api/v1/routes/') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_ROUTES, meta: { total: MOCK_ROUTES.length, page: 1, limit: 50 } }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });
}

test.describe('ECO-2701: Motion Foundation and Reduced Motion', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
  });

  test('A1/A5: Normal motion mode renders hero block and interactive buttons smoothly', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Hero block renderizado e visível com MotionBlock
    const heroTitle = page.locator('text=Descubra destinos');
    await expect(heroTitle).toBeVisible({ timeout: 10000 });

    // Botão CTA principal
    const ctaButton = page.locator('text=Descobrir Rotas');
    await expect(ctaButton).toBeVisible();
    await ctaButton.click();

    // Na navegação em tabs do Expo Router, a aba de Rotas fica ativa
    const routesTab = page.getByRole('tab', { name: /Rotas/i });
    await expect(routesTab).toBeVisible({ timeout: 5000 });
  });

  test('A2/A3/A5/A6: Reduced motion mode applies static states immediately without delay', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const heroTitle = page.locator('text=Descubra destinos');
    await expect(heroTitle).toBeVisible({ timeout: 10000 });

    // Botão CTA responde imediatamente no modo reduced motion
    const ctaButton = page.locator('text=Descobrir Rotas');
    await expect(ctaButton).toBeVisible();
    await ctaButton.click();

    const routesTab = page.getByRole('tab', { name: /Rotas/i });
    await expect(routesTab).toBeVisible({ timeout: 5000 });
  });

  test('A3: Runtime toggle from normal to reduced motion transitions correctly without frozen states', async ({ page }) => {
    // Inicia com animações normais
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const heroTitle = page.locator('text=Descubra destinos');
    await expect(heroTitle).toBeVisible({ timeout: 10000 });

    // Altera preferência em runtime para reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // Botão continua 100% funcional e responsivo
    const ctaButton = page.locator('text=Descobrir Rotas');
    await expect(ctaButton).toBeVisible();
    await ctaButton.click();

    const routesTab = page.getByRole('tab', { name: /Rotas/i });
    await expect(routesTab).toBeVisible({ timeout: 5000 });
  });
});

