import { expect, test, type Page, type Route } from '@playwright/test';

const trips = [
  { id: 'trip-active', user_id: 'user-e2e', route_id: 'route-pindobal', route_title: 'Pindobal', status: 'active', created_at: '2026-09-14T10:00:00Z' },
  { id: 'trip-completed', user_id: 'user-e2e', route_id: 'route-jamaraqua', route_title: 'Trilha do Jamaraquá', status: 'completed', created_at: '2026-08-10T10:00:00Z' },
];

const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

async function setupMocks(page: Page) {
  await page.addInitScript(() => localStorage.clear());
  await page.route('**supabase.co/**', (route) => json(route, {
    access_token: 'fixture-token', refresh_token: 'fixture-refresh', expires_in: 3600,
    user: { id: 'user-e2e', aud: 'authenticated', role: 'authenticated', email: 'fixture@example.test', app_metadata: {}, user_metadata: {} },
  }));
  await page.route('**/api/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace(/\/+$/, '');
    if (path.endsWith('/regions')) return json(route, { data: [{ id: 'region-1', name: 'Santarém', state_code: 'PA', is_active: true }] });
    if (path.endsWith('/bootstrap')) return json(route, { data: { active_region: null, supported_regions: [], feature_flags: {} } });
    if (path.endsWith('/me/trips')) return json(route, { data: trips });
    return json(route, { data: [] });
  });
}

test.describe('Histórico de viagens — redesign Stitch', () => {
  test('renderiza os campos contratuais e filtra ativas e concluídas', async ({ page }) => {
    await setupMocks(page);
    await page.goto('/trips');

    await expect(page.getByText('Histórico de viagens').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Pindobal')).toBeVisible();
    await expect(page.getByText('Trilha do Jamaraquá')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pausar viagem' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Finalizar viagem' })).toBeVisible();
    if (process.env.CAPTURE_TRIPS_SCREEN) {
      await page.screenshot({ path: '../.tmp/trips-history-mobile.png', fullPage: true });
    }

    await page.getByRole('tab', { name: 'Concluídas, 1' }).click();
    await expect(page.getByText('Trilha do Jamaraquá')).toBeVisible();
    await expect(page.getByText('Pindobal')).toBeHidden();

    await page.getByRole('tab', { name: 'Ativas, 1' }).click();
    await expect(page.getByText('Pindobal')).toBeVisible();
    await expect(page.getByText('Trilha do Jamaraquá')).toBeHidden();
  });
});
