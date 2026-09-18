import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// 12 Categorias Canônicas
const CANONICAL_CATEGORIES = [
  { slug: 'alimentacao', label: 'Alimentação', color: '#D97706', icon: 'utensils' },
  { slug: 'atrativos', label: 'Atrativos', color: '#059669', icon: 'compass' },
  { slug: 'hospedagem', label: 'Hospedagem', color: '#2563EB', icon: 'bed' },
  { slug: 'artesanato', label: 'Artesanato', color: '#7C3AED', icon: 'palette' },
  { slug: 'comercio', label: 'Comércio Local & Lojas', color: '#EA580C', icon: 'store' },
  { slug: 'experiencias', label: 'Experiências & Passeios', color: '#0D9488', icon: 'boat' },
  { slug: 'vida_noturna', label: 'Vida Noturna & Eventos', color: '#9333EA', icon: 'beer' },
  { slug: 'servicos_turisticos', label: 'Serviços Turísticos & Guias', color: '#4F46E5', icon: 'briefcase' },
  { slug: 'transporte', label: 'Transporte', color: '#0891B2', icon: 'bus' },
  { slug: 'saude', label: 'Saúde', color: '#DC2626', icon: 'heart-pulse' },
  { slug: 'seguranca', label: 'Segurança', color: '#1E3A8A', icon: 'shield' },
  { slug: 'outros', label: 'Outros', color: '#6B7280', icon: 'help-circle' },
];

const MOCK_REGIONS = [
  { id: 'reg-santarem-belterra', name: 'Santarém / Belterra', state_code: 'PA', is_active: true },
  { id: 'reg-altamira-xingu', name: 'Altamira / Rio Xingu', state_code: 'PA', is_active: true },
];

// 3 Origens Pindobal
const PINDOBAL_ORIGINS = [
  {
    id: 'origin-porto',
    code: 'porto',
    name: 'Porto de Santarém',
    latitude: -2.428482,
    longitude: -54.701835,
    description: 'Terminal Hidroviário de Santarém (45,2 km até Pindobal)',
    distance_m: 45229,
    duration_s: 3600,
  },
  {
    id: 'origin-aeroporto',
    code: 'aeroporto',
    name: 'Aeroporto Internacional de Santarém',
    latitude: -2.42478,
    longitude: -54.78583,
    description: 'Aeroporto Maestro Wilson Fonseca (41,5 km até Pindobal)',
    distance_m: 41451,
    duration_s: 3200,
  },
  {
    id: 'origin-rodoviaria',
    code: 'rodoviaria',
    name: 'Terminal Rodoviário de Santarém',
    latitude: -2.443185,
    longitude: -54.730652,
    description: 'Terminal Rodoviário de Santarém (42,3 km até Pindobal)',
    distance_m: 42318,
    duration_s: 3400,
  },
];

// 4 Origens Pedral
const PEDRAL_ORIGINS = [
  {
    id: 'a17a314a-0000-4000-8000-000000000011',
    code: 'rodoviaria',
    name: 'Terminal Rodoviário de Altamira',
    latitude: -3.205732,
    longitude: -52.2198928,
    description: 'Terminal Rodoviário de Altamira (10,5 km até Balneário Luiz do Pedral)',
    distance_m: 10516,
    duration_s: 962,
  },
  {
    id: 'a17a314a-0000-4000-8000-000000000012',
    code: 'aeroporto',
    name: 'Aeroporto de Altamira',
    latitude: -3.2534371,
    longitude: -52.2480994,
    description: 'Aeroporto de Altamira (5,5 km até Balneário Luiz do Pedral)',
    distance_m: 5464,
    duration_s: 504,
  },
  {
    id: 'a17a314a-0000-4000-8000-000000000013',
    code: 'terminal_fluvial',
    name: 'Terminal Fluvial / Cais da Orla',
    latitude: -3.2058603,
    longitude: -52.2054132,
    description: 'Terminal Fluvial de Altamira (10,6 km até Balneário Luiz do Pedral)',
    distance_m: 10642,
    duration_s: 980,
  },
  {
    id: 'a17a314a-0000-4000-8000-000000000014',
    code: 'centro',
    name: 'Centro (Praça da Matriz)',
    latitude: -3.205289,
    longitude: -52.206082,
    description: 'Centro de Altamira (10,5 km até Balneário Luiz do Pedral)',
    distance_m: 10477,
    duration_s: 965,
  },
];

const MOCK_ROUTE_PINDOBAL = {
  id: 'rota-santarem-pindobal',
  region_id: 'reg-santarem-belterra',
  slug: 'rota-santarem-pindobal',
  title: 'Rota Santarém → Praia de Pindobal',
  summary: 'Percurso ecoturístico conectando o centro histórico, Alter do Chão e a praia de Pindobal.',
  description: 'Percurso de 45 km ao longo da Rodovia Everaldo Martins (PA-457) e Estrada de Pindobal.',
  distance_km: 45.2,
  duration_hours: 1.0,
  difficulty: 'facil',
  city: 'Belterra',
  state_code: 'PA',
  status: 'active',
  is_verified: true,
  is_active: true,
  origins: PINDOBAL_ORIGINS,
  bounds: { min_lat: -2.57, max_lat: -2.42, min_lng: -54.99, max_lng: -54.7 },
  city_bounds: { min_lat: -2.6, max_lat: -2.4, min_lng: -55.02, max_lng: -54.68 },
};

const MOCK_ROUTE_PEDRAL = {
  id: 'a17a314a-0000-4000-8000-000000000002',
  region_id: 'reg-altamira-xingu',
  slug: 'rota-pedral',
  title: 'Rota do Pedral (Altamira)',
  summary: 'Percurso ao longo do Rio Xingu até o Balneário Luiz do Pedral.',
  description: 'Acesso às margens e balneários de Altamira com 4 origens oficiais.',
  distance_km: 10.5,
  duration_hours: 0.3,
  difficulty: 'facil',
  city: 'Altamira',
  state_code: 'PA',
  status: 'active',
  is_verified: true,
  is_active: true,
  origins: PEDRAL_ORIGINS,
  bounds: { min_lat: -3.258951, max_lat: -3.205203, min_lng: -52.248099, max_lng: -52.205413 },
  city_bounds: { min_lat: -3.3, max_lat: -3.15, min_lng: -52.3, max_lng: -52.15 },
};

// 175 pins para Pindobal
const PINDOBAL_PINS = Array.from({ length: 175 }, (_, i) => {
  const isPousada = i === 125;
  const cat = isPousada
    ? CANONICAL_CATEGORIES.find((c) => c.slug === 'hospedagem')!
    : CANONICAL_CATEGORIES[i % CANONICAL_CATEGORIES.length];
  let baseLat = -2.43;
  let baseLng = -54.71;
  let zoneName = 'Santarém';

  if (i >= 55 && i < 120) {
    baseLat = -2.505;
    baseLng = -54.953;
    zoneName = 'Alter do Chão';
  } else if (i >= 120) {
    baseLat = -2.558;
    baseLng = -54.978;
    zoneName = 'Pindobal';
  }

  const isCoincident = i % 8 === 0;
  const latOffset = isCoincident ? 0 : Math.sin(i * 1.7) * 0.006;
  const lngOffset = isCoincident ? 0 : Math.cos(i * 1.7) * 0.006;

  return {
    id: `pin-${i + 1}`,
    actor_id: `actor-${i + 1}`,
    name: isPousada ? 'Pousada Pindobal Encanto' : `${cat.label} ${zoneName} ${i + 1}`,
    category_slug: cat.slug,
    category_label: cat.label,
    color: cat.color,
    icon: cat.icon,
    latitude: baseLat + latOffset,
    longitude: baseLng + lngOffset,
    distance_from_origin_m: 500 + i * 250,
    layer: i % 10 === 9 ? 'citywide_essential' : 'route_corridor',
  };
});

// 25 pins para Pedral
const PEDRAL_PINS = Array.from({ length: 25 }, (_, i) => {
  const cat = CANONICAL_CATEGORIES[i % CANONICAL_CATEGORIES.length];
  return {
    id: `pin-pedral-${i + 1}`,
    actor_id: `actor-pedral-${i + 1}`,
    name: `Ponto Pedral ${cat.label} ${i + 1}`,
    category_slug: cat.slug,
    category_label: cat.label,
    color: cat.color,
    icon: cat.icon,
    latitude: -3.21 - i * 0.0018,
    longitude: -52.21 - i * 0.0015,
    distance_from_origin_m: 400 + i * 380,
    layer: i === 24 ? 'citywide_essential' : 'route_corridor',
  };
});

const SVG_TILE = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <rect width="256" height="256" fill="#F3EFE6" />
  <path d="M0 60 Q64 40 128 80 T256 60 L256 120 Q192 100 128 140 T0 120 Z" fill="#D5E8D4" opacity="0.7"/>
  <path d="M30 0 C50 70 170 150 210 256" stroke="#E6D7B8" stroke-width="3" fill="none"/>
  <path d="M0 160 C70 170 150 200 256 190" stroke="#BFD9E8" stroke-width="6" fill="none"/>
</svg>`;

async function setupBaselineMocks(page: import('@playwright/test').Page) {
  // Tile requests
  await page.route('**/*.tile.openstreetmap.org/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: SVG_TILE });
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

    if (pathname.includes('/preferences') || pathname.includes('/me') || pathname.includes('/bootstrap')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { active_region_id: 'reg-santarem-belterra', favorites: [] } }),
      });
      return;
    }

    if (pathname.includes('/favorite-actors') || pathname.includes('/favorite-routes')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], meta: { total: 0, page: 1, limit: 50 } }),
      });
      return;
    }

    if (pathname.endsWith('/map')) {
      const isPedral = pathname.includes('pedral');
      const routeSlug = isPedral ? 'rota-pedral' : 'rota-santarem-pindobal';
      const routeData = isPedral ? MOCK_ROUTE_PEDRAL : MOCK_ROUTE_PINDOBAL;
      const origins = isPedral ? PEDRAL_ORIGINS : PINDOBAL_ORIGINS;
      const pins = isPedral ? PEDRAL_PINS : PINDOBAL_PINS;
      const urlObj = new URL(url);
      const originId = urlObj.searchParams.get('origin_id') || origins[0].id;
      const selectedOrigin = origins.find((o) => o.id === originId) || origins[0];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            route_id: routeSlug,
            selected_origin_id: originId,
            origin_distance_m: selectedOrigin.distance_m,
            origin_duration_s: selectedOrigin.duration_s,
            bounds: routeData.bounds,
            city_bounds: routeData.city_bounds,
            pins: pins,
            legend: CANONICAL_CATEGORIES.map((c, idx) => ({
              category_slug: c.slug,
              label: c.label,
              color: c.color,
              icon: c.icon,
              count: pins.filter((p) => p.category_slug === c.slug).length,
              sort_order: idx + 1,
            })),
            geometry: {
              id: `geom-${originId}`,
              route_origin_id: originId,
              provider: 'osrm',
              geojson: {
                type: 'LineString',
                coordinates: [
                  [selectedOrigin.longitude, selectedOrigin.latitude],
                  isPedral ? [-52.23, -3.23] : [-54.85, -2.48],
                  isPedral ? [-52.2194072, -3.255088] : [-54.978, -2.558],
                ],
              },
              encoded_polyline: null,
              distance_m: selectedOrigin.distance_m,
              duration_s: selectedOrigin.duration_s,
            },
          },
        }),
      });
      return;
    }

    if (pathname.endsWith('/origins')) {
      const isPedral = pathname.includes('pedral');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: isPedral ? PEDRAL_ORIGINS : PINDOBAL_ORIGINS }),
      });
      return;
    }

    if (pathname.endsWith('/actors') || pathname.endsWith('/catalog')) {
      const isPedral = pathname.includes('pedral');
      const pins = isPedral ? PEDRAL_PINS : PINDOBAL_PINS;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: pins.map((p) => ({
            id: p.actor_id,
            name: p.name,
            category_slug: p.category_slug,
            category_label: p.category_label,
            color: p.color,
            icon: p.icon,
            location: { latitude: p.latitude, longitude: p.longitude },
            address: `${p.name}, Margem`,
            description: 'Ponto turístico comunitário.',
            is_verified: true,
          })),
          meta: { total: pins.length, page: 1, limit: 200 },
        }),
      });
      return;
    }

    if (pathname.startsWith('/api/v1/routes/') && pathname !== '/api/v1/routes') {
      const isPedral = pathname.includes('pedral');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: isPedral ? MOCK_ROUTE_PEDRAL : MOCK_ROUTE_PINDOBAL }),
      });
      return;
    }

    if (pathname === '/api/v1/routes') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [MOCK_ROUTE_PINDOBAL, MOCK_ROUTE_PEDRAL],
          meta: { total: 2, page: 1, limit: 10, total_pages: 1 },
        }),
      });
      return;
    }

    if (pathname.endsWith('/google-photo')) {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ detail: 'Foto não disponível' }) });
      return;
    }

    if (pathname.startsWith('/api/v1/actors/')) {
      const actorId = pathname.split('/').pop();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: actorId,
            name: 'Pousada Pindobal Encanto',
            category_slug: 'hospedagem',
            category_label: 'Hospedagem',
            color: '#2563EB',
            icon: 'bed',
            location: { latitude: -2.558, longitude: -54.978 },
            address: 'Praia de Pindobal, Belterra - PA',
            description: 'Pousada rústica e sustentável à beira do Rio Tapajós.',
            is_verified: true,
            gallery: [
              { id: 'act-img-1', url: '/assets/images/pindobal3.png', caption: 'Quartos com vista' },
              { id: 'act-img-2', url: '/assets/images/pindobal4.png', caption: 'Área externa' },
            ],
          },
        }),
      });
      return;
    }

    if (pathname === '/api/v1/trips' || pathname.startsWith('/api/v1/trips')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'trip-1',
              route_id: 'rota-santarem-pindobal',
              route_title: 'Rota Santarém → Praia de Pindobal',
              status: 'in_progress',
              started_at: '2026-09-17T10:00:00Z',
              completed_at: null,
            },
            {
              id: 'trip-2',
              route_id: 'a17a314a-0000-4000-8000-000000000002',
              route_title: 'Rota do Pedral (Altamira)',
              status: 'completed',
              started_at: '2026-09-10T08:00:00Z',
              completed_at: '2026-09-10T11:30:00Z',
            },
          ],
        }),
      });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {} }) });
  });
}

test.describe('ECO-2700: Motion Baseline, Inventory & Isolation', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('BROWSER CONSOLE ERROR:', msg.text());
      }
    });
    page.on('pageerror', (err) => {
      console.log('PAGE ERROR:', err.message);
    });
    await setupBaselineMocks(page);
  });

  test('Jornada Contínua e Perfil de Desempenho Baseline: Rota -> Mapa -> Seleção -> Categoria -> Pedral -> Galeria -> Histórico', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90000);
    const isMobile = testInfo.project.name === 'chromium-mobile';
    const capturesDir = path.resolve(process.cwd(), '.tmp-baseline-captures', testInfo.project.name);
    fs.mkdirSync(capturesDir, { recursive: true });

    // 1. Iniciar monitoramento de métricas RAF e Long Tasks na página
    await page.addInitScript(() => {
      (window as any).__baselineMetrics = {
        rafDeltas: [] as number[],
        longTasks: [] as number[],
        startTime: performance.now(),
      };
      let lastRaf = performance.now();
      function measureRaf(now: number) {
        const delta = now - lastRaf;
        lastRaf = now;
        (window as any).__baselineMetrics.rafDeltas.push(delta);
        requestAnimationFrame(measureRaf);
      }
      requestAnimationFrame(measureRaf);

      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.duration > 50) {
                (window as any).__baselineMetrics.longTasks.push(entry.duration);
              }
            }
          });
          observer.observe({ entryTypes: ['longtask'] });
        } catch {
          // fallback
        }
      }
    });

    // 2. Acessar Rota / Explore
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(capturesDir, '01_explore_routes.png') });

    // 3. Abrir Mapa da Rota Pindobal
    await page.goto('/route/rota-santarem-pindobal/map');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.leaflet-container', { state: 'visible', timeout: 15000 });
    
    // Aguardar pins individuais teardrop carregarem
    const teardropPin = page.locator('.leaflet-marker-icon.econexao-teardrop-wrapper').first();
    await expect(teardropPin).toBeVisible({ timeout: 10000 });

    const pinCount = await page.locator('.leaflet-marker-icon').count();
    expect(pinCount).toBeGreaterThanOrEqual(1); // Pins presentes

    await page.screenshot({ path: path.join(capturesDir, '02_pindobal_map_pins.png') });

    // 4. Seleção de Pin e Popup Card
    await teardropPin.click({ force: true });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(capturesDir, '03_pindobal_pin_selected.png') });

    // 5. Alternar Categoria no Mapa
    const filterBtn = page.getByRole('button', { name: /Hospedagem/i }).first();
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(capturesDir, '04_map_category_filter.png') });
    }

    // 6. Rota do Pedral com 4 Origens Oficiais
    await page.goto('/route/rota-pedral/map');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.leaflet-container', { state: 'visible', timeout: 15000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(capturesDir, '05_pedral_map_rodoviaria.png') });

    // Alternar para a origem Aeroporto do Pedral
    const originBtn = page.getByRole('button', { name: /Origem|Partida|Terminal Rodoviário/i }).first();
    if (await originBtn.isVisible()) {
      await originBtn.click();
      await page.waitForTimeout(300);
      const aeroOption = page.getByRole('button', { name: /Aeroporto de Altamira/i }).first();
      if (await aeroOption.isVisible()) {
        await aeroOption.click();
        await page.waitForTimeout(400);
      }
    }
    await page.screenshot({ path: path.join(capturesDir, '06_pedral_origin_switch.png') });

    // 7. Galeria da Rota (Detalhes de Pindobal)
    await page.goto('/route/rota-santarem-pindobal');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(capturesDir, '07_route_gallery.png') });

    // 8. Galeria do Ator
    await page.goto('/actor/actor-125');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(capturesDir, '08_actor_gallery.png') });

    // 9. Histórico de Viagens
    await page.goto('/trips');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(capturesDir, '09_trips_history.png') });

    // 10. Coletar Métricas de Desempenho
    const metrics = await page.evaluate(() => {
      const data = (window as any).__baselineMetrics || {};
      const deltas: number[] = data.rafDeltas || [];
      deltas.sort((a, b) => a - b);

      const median = deltas.length ? deltas[Math.floor(deltas.length * 0.5)] : 16.6;
      const p95 = deltas.length ? deltas[Math.floor(deltas.length * 0.95)] : 16.6;
      const longTasks: number[] = data.longTasks || [];

      return {
        sampleCount: deltas.length,
        rafMedianMs: Number(median.toFixed(2)),
        rafP95Ms: Number(p95.toFixed(2)),
        longTasksCount: longTasks.length,
        maxLongTaskMs: longTasks.length ? Math.max(...longTasks) : 0,
        domElementsCount: document.querySelectorAll('*').length,
        leafletMarkersCount: document.querySelectorAll('.leaflet-marker-icon').length,
      };
    });

    // Gravar métricas capturadas em arquivo JSON
    fs.writeFileSync(
      path.join(capturesDir, 'baseline_metrics.json'),
      JSON.stringify({ device: isMobile ? 'chromium-mobile (400x832)' : 'chromium-desktop (1280x800)', metrics }, null, 2)
    );

    // Validações de sanidade do baseline
    expect(metrics.sampleCount).toBeGreaterThan(20);
    expect(metrics.rafMedianMs).toBeLessThan(40);
  });
});
