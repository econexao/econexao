import { expect, test, type Page } from '@playwright/test';

const actor = {
  id: 'actor-no-cover', slug: 'actor-no-cover', name: 'Ateliê Tapajós',
  category_slug: 'artesanato', category_label: 'Artesanato', address: 'Alter do Chão, Santarém - PA',
  city: 'Santarém', state_code: 'PA', description: 'Descrição editorial do ator.', phone: '+55 93 99999-0000',
  website: 'https://atelie.example.test', instagram: '@atelietapajos', latitude: -2.505, longitude: -54.953,
  verification_status: 'verified', green_badge_status: 'none', google_rating: 4.7,
  cover_image_url: null, cover_media: null, gallery: [], is_favorite: false,
};

const route = { id: 'route-fixture', title: 'Rota Fixture', summary: 'Rota de teste', region_id: 'region-1', is_favorite: false };

async function mockApi(page: Page, options: { anonymous?: boolean; failNextFavorite?: boolean } = {}) {
  const calls: string[] = [];
  let favoriteActor = false;
  let favoriteRoute = false;
  let failNextFavorite = options.failNextFavorite ?? false;

  await page.addInitScript(() => localStorage.clear());
  await page.route('**/api/v1/**', async (routeRequest) => {
    const request = routeRequest.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const json = (data: unknown, status = 200) => routeRequest.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (path.endsWith('/regions')) return json({ data: [{ id: 'region-1', name: 'Santarém', state_code: 'PA', is_active: true }] });
    if (path.endsWith('/actor-categories')) return json({ data: [{ slug: 'artesanato', label: 'Artesanato' }] });
    if (path.endsWith('/actors/actor-no-cover')) return json({ data: { ...actor, is_favorite: favoriteActor } });
    if (path.endsWith('/routes/route-fixture')) return json({ data: { ...route, is_favorite: favoriteRoute } });
    if (path.endsWith('/routes/route-fixture/actors')) return json({ data: [{ ...actor, is_favorite: favoriteActor }], meta: { total: 1, limit: 20, next_cursor: null } });
    if (path.endsWith('/routes') && request.method() === 'GET') return json({ data: [{ ...route, is_favorite: favoriteRoute }], meta: { total: 1, limit: 20, next_cursor: null } });
    if (path.endsWith('/me/favorite-actors') && request.method() === 'GET') return json({ data: favoriteActor ? [{ ...actor, is_favorite: true }] : [], meta: { total: favoriteActor ? 1 : 0, limit: 20, next_cursor: null } });
    if (path.endsWith('/me/favorite-routes') && request.method() === 'GET') return json({ data: favoriteRoute ? [{ ...route, is_favorite: true }] : [], meta: { total: favoriteRoute ? 1 : 0, limit: 20, next_cursor: null } });
    if (path.includes('/favorite-actors/') || path.includes('/favorite-routes/')) {
      calls.push(`${request.method()}:${path}`);
      if (failNextFavorite) { failNextFavorite = false; return json({ error: { code: 'FIXTURE_FAILURE', message: 'Falha controlada' } }, 503); }
      const isActor = path.includes('favorite-actors');
      if (isActor) favoriteActor = request.method() === 'PUT'; else favoriteRoute = request.method() === 'PUT';
      return json({ data: { success: true } });
    }
    return json({ data: [] });
  });
  const authFixture = (routeRequest: import('@playwright/test').Route) => routeRequest.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ access_token: options.anonymous ? 'guest-token' : 'account-token', refresh_token: 'fixture-refresh', expires_in: 3600, user: {
      id: options.anonymous ? 'guest-user' : 'account-user', aud: 'authenticated', role: 'authenticated',
      email: options.anonymous ? undefined : 'account@example.test', is_anonymous: options.anonymous ?? false, app_metadata: {}, user_metadata: {},
    } }),
  });
  await page.route('**supabase.co/**', authFixture);
  await page.route('**/auth/v1/**', authFixture);
  return { calls, getFavoriteActor: () => favoriteActor, getFavoriteRoute: () => favoriteRoute };
}

test.describe('ECO-1901 — ECOnexão real com fixtures contratuais', () => {
  test.skip(!process.env.ECO1901_E2E_ENABLED, 'Requer build web com EXPO_PUBLIC_API_URL e habilitação explícita; staging real permanece gate separado.');
  test('abre detalhe real, salva/remove ator e restaura o favorito após reload', async ({ page }) => {
    const fixture = await mockApi(page);
    await page.goto('/actor/actor-no-cover');
    await expect(page.getByText('Ateliê Tapajós').last()).toBeVisible({ timeout: 15000 });
    const save = page.getByRole('button', { name: 'Salvar nos favoritos' });
    await expect(save).toBeVisible();
    await save.click();
    await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toBeVisible();
    expect(fixture.calls.some((call) => call.includes('PUT') && call.includes('favorite-actors'))).toBe(true);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toBeVisible();
    await page.getByRole('button', { name: 'Remover dos favoritos' }).click();
    await expect(page.getByRole('button', { name: 'Salvar nos favoritos' })).toBeVisible();
  });

  test('exercita rota real, ator real e rollback de mutation sem provedor externo', async ({ page }) => {
    const fixture = await mockApi(page, { failNextFavorite: true });
    await page.goto('/route/route-fixture/catalog');
    await expect(page.getByText('Ateliê Tapajós').first()).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Salvar ator nos favoritos' }).first().click();
    await expect(page.getByRole('button', { name: 'Salvar ator nos favoritos' }).first()).toBeVisible();
    expect(fixture.getFavoriteActor()).toBe(false);
    await page.goto('/routes');
    await expect(page.getByText('Rota Fixture')).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Salvar rota nos favoritos' }).click();
    await expect(page.getByRole('button', { name: 'Remover rota dos favoritos' })).toBeVisible();
    await page.getByRole('button', { name: 'Remover rota dos favoritos' }).click();
    expect(fixture.getFavoriteRoute()).toBe(false);
  });

  test('mantém visitante/guest/conta e não afirma homologação sem Supabase real', async ({ page }) => {
    const guest = await mockApi(page, { anonymous: true });
    await page.goto('/actor/actor-no-cover');
    await expect(page.getByRole('button', { name: 'Salvar nos favoritos' })).toBeVisible({ timeout: 15000 });
    expect(guest.calls.some((call) => call.includes('favorite-actors'))).toBe(false);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Salvar nos favoritos' })).toBeVisible();
    // Guest/account continuity and A/B isolation require real Supabase identities; this remains a staging gate.
  });
});
