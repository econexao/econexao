import { expect, test } from '@playwright/test';

const actor = {
  id: 'actor-no-cover', slug: 'actor-no-cover', name: 'Ateliê Tapajós',
  category_slug: 'artesanato', category_label: 'Artesanato', address: 'Alter do Chão, Santarém - PA',
  city: 'Santarém', state_code: 'PA', description: 'Descrição editorial do ator.', phone: '+55 93 99999-0000',
  website: 'https://atelie.example.test', instagram: '@atelietapajos', latitude: -2.505, longitude: -54.953,
  verification_status: 'verified', green_badge_status: 'none', google_rating: 4.7,
  cover_image_url: null, cover_media: null, gallery: [], is_favorite: false, google_place_id: 'place-fixture',
};

const editorialActor = { ...actor, id: 'actor-editorial', name: 'Pousada Editorial', cover_image_url: 'https://cdn.example.test/editorial.jpg', cover_media: {
  id: 'media-1', owner_type: 'actor', owner_id: 'actor-editorial', url: 'https://cdn.example.test/editorial.jpg',
  alt_text: 'Fachada da Pousada Editorial', credit: 'SEMTUR', license_code: 'SEMTUR_INSTITUTIONAL', sort_order: 0,
} };
const FIXTURE_JPEG = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/AP/EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAQUCNP/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8BP//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8BP//EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEABj8Cf//Z', 'base64');

type PhotoMode = 'ready' | 'retry-metadata' | 'empty' | 'metadata-error' | 'image-error';

async function mockContract(page: import('@playwright/test').Page, photoMode: PhotoMode = 'ready', holdMetadata = false) {
  let photoRequests = 0;
  let metadataRequests = 0;
  let imageRequests = 0;
  let releaseMetadata!: () => void;
  const metadataReleased = new Promise<void>((resolve) => { releaseMetadata = resolve; });
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.protocol === 'https:' && !url.hostname.endsWith('example.test') && !url.hostname.includes('supabase.co')) {
      return route.abort('blockedbyclient');
    }
    return route.continue();
  });
  await page.route('**supabase.co/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
    access_token: 'fixture-token', refresh_token: 'fixture-refresh', expires_in: 3600,
    user: { id: 'fixture-user', aud: 'authenticated', role: 'authenticated', email: 'fixture@example.test', app_metadata: {}, user_metadata: {} },
  }) }));
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path === '/api/v1/regions') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ id: 'region-1', name: 'Santarém', state_code: 'PA', is_active: true }] }) });
    if (path === '/api/v1/actor-categories') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ slug: 'artesanato', label: 'Artesanato' }] }) });
    if (path === '/api/v1/routes/route-fixture') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { id: 'route-fixture', title: 'Rota Fixture', region_id: 'region-1', summary: 'Rota de teste', origins: [] } }) });
    if (path.endsWith('/favorite-actors') || path.includes('/bootstrap') || path.includes('/me') || path.includes('/preferences')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    }
    if (path.endsWith('/actors')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [editorialActor, actor], meta: { total: 2, page: 1, limit: 50 } }) });
    }
    if (path.endsWith('/google-photo')) {
      photoRequests += 1;
      if (photoMode === 'retry-metadata' && photoRequests === 1) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ detail: 'Provedor indisponível' }) });
      if (photoMode === 'empty') return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ detail: 'Foto não disponível' }) });
      if (photoMode === 'metadata-error') return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ detail: 'Provedor indisponível' }) });
      if (holdMetadata) await metadataReleased;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {
        proxy_url: photoMode === 'image-error' ? `http://127.0.0.1:8082/fixture-photo.jpg?attempt=${photoRequests}` : 'http://127.0.0.1:8082/fixture-photo.jpg',
        expires_at: Date.now() + 60000, width_px: 800, height_px: 600,
        author_attributions: [{ display_name: 'Ana Fixture', uri: 'https://maps.google.com/maps/contrib/fixture' }],
        google_maps_uri: 'https://www.google.com/maps/place/fixture',
      } }) });
    }
    if (path === '/api/v1/actors/actor-no-cover') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: actor }) });
    if (path === '/api/v1/actors/actor-editorial') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: editorialActor }) });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {} }) });
  });
  await page.route('**/places/photos/**', async (route) => {
    metadataRequests += 1;
    return route.fulfill({ status: 200, contentType: 'image/jpeg', body: FIXTURE_JPEG });
  });
  await page.route('**/fixture-photo.jpg**', (route) => {
    imageRequests += 1;
    return route.fulfill({ status: 200, contentType: 'image/jpeg', body: photoMode === 'image-error' && imageRequests === 1 ? Buffer.from('invalid-image') : FIXTURE_JPEG });
  });
  await page.route('**/editorial.jpg', (route) => route.fulfill({ status: 200, contentType: 'image/jpeg', body: FIXTURE_JPEG }));
  return { get photoRequests() { return photoRequests; }, get metadataRequests() { return metadataRequests; }, get imageRequests() { return imageRequests; }, releaseMetadata };
}

test.describe('ECO-2613 fotos e perfil', () => {
  test('cards usam editorial/placeholder e não consultam fotos Google', async ({ page }) => {
    const counters = await mockContract(page);
    await page.goto('/route/route-fixture/catalog');
    await expect(page.getByText('Pousada Editorial')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Ateliê Tapajós').last()).toBeVisible();
    await expect(page.getByLabel('Imagem não disponível para Ateliê Tapajós')).toBeVisible();
    await expect(page.getByLabel('Fachada da Pousada Editorial')).toBeVisible();
    await expect.poll(async () => page.getByAltText('Fachada da Pousada Editorial').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    expect(counters.photoRequests).toBe(0);
    expect(counters.metadataRequests).toBe(0);
    expect(counters.imageRequests).toBeGreaterThanOrEqual(0);
  });

  test('detalhe consulta proxy, mantém conteúdo durante metadata lenta e recupera falhas', async ({ page }) => {
    const counters = await mockContract(page);
    await page.goto('/route/route-fixture/catalog');
    await expect(page.getByText('Ateliê Tapajós').first()).toBeVisible({ timeout: 15000 });
    await page.getByText('Ateliê Tapajós').first().click();
    await expect(page).toHaveURL(/\/actor\/actor-no-cover/);
    await expect(page.getByText('Ateliê Tapajós').last()).toBeVisible();
    await expect(page.getByText('Descrição editorial do ator.')).toBeVisible();
    await expect(page.getByText('Contatos e Localização')).toBeVisible();
    counters.releaseMetadata();
    await expect(page.getByText('Ana Fixture')).toBeVisible({ timeout: 15000 });
    await expect.poll(async () => page.getByAltText('Foto de Ateliê Tapajós').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    await expect(page.getByRole('button', { name: 'Ver no Google Maps' })).toBeVisible();
    expect(counters.photoRequests).toBe(1);
    expect(counters.metadataRequests).toBe(0);
    await page.getByRole('button', { name: 'Voltar' }).click();
    await expect(page).toHaveURL(/\/route\/route-fixture\/catalog/);
  });

  for (const mode of ['retry-metadata', 'image-error'] as const) {
    test(`detalhe falha na primeira tentativa e recupera ${mode} no retry`, async ({ page }) => {
      const counters = await mockContract(page, mode);
      await page.goto('/actor/actor-no-cover');
      await expect(page.getByText('Não foi possível exibir esta foto.')).toBeVisible({ timeout: 15000 });
      const retry = page.getByRole('button', { name: 'Tentar novamente' });
      await expect(retry).toBeVisible();
      await retry.click();
      expect(counters.photoRequests).toBe(2);
      await expect(page.getByText('Não foi possível exibir esta foto.')).toHaveCount(0);
      await expect(page.getByText('Ana Fixture')).toBeVisible({ timeout: 15000 });
      await expect.poll(async () => page.getByAltText('Foto de Ateliê Tapajós').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    });
  }

  test('detalhe mantém conteúdo visível enquanto metadata permanece pendente', async ({ page }) => {
    const counters = await mockContract(page, 'ready', true);
    await page.goto('/actor/actor-no-cover');
    await expect(page.getByText('Ateliê Tapajós').last()).toBeVisible();
    await expect(page.getByText('Descrição editorial do ator.')).toBeVisible();
    await expect(page.getByText('Contatos e Localização')).toBeVisible();
    expect(counters.photoRequests).toBe(1);
    counters.releaseMetadata();
    await expect(page.getByText('Ana Fixture')).toBeVisible({ timeout: 15000 });
  });
});
