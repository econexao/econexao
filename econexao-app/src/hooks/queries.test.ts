import { QueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import {
  adminQueries,
  createPlaceholderRouteDetail,
  findCachedRouteSummary,
  prefetchRouteData,
  territorialQueries,
  userQueries,
} from './queries';

describe('territorial query options', () => {
  afterEach(() => jest.restoreAllMocks());

  it('encaminha região e filtros ao client e desempacota o envelope', async () => {
    const envelope = { data: [], meta: { total: 0, limit: 20 } };
    const call = jest.spyOn(apiClient, 'getRoutes').mockResolvedValue(envelope);
    const options = territorialQueries.routes(
      'region-id',
      { q: ' praia ', saved: true },
      'user-id'
    );
    const signal = new AbortController().signal;
    const result = await options.queryFn!({ signal } as never);
    expect(call).toHaveBeenCalledWith(
      {
        region_id: 'region-id',
        q: 'praia',
        saved: true,
      },
      { signal }
    );
    expect(result).toEqual(envelope);
    expect(options.meta).toEqual({ authenticated: true, authUserId: 'user-id' });
  });

  it('desabilita consultas sem identificadores obrigatórios', () => {
    expect(adminQueries.context().enabled).toBe(false);
    expect(adminQueries.context('user-id').enabled).toBe(true);
    expect(territorialQueries.routeDetail('').enabled).toBe(false);
    expect(territorialQueries.routeGeometry('route', '').enabled).toBe(false);
    expect(territorialQueries.routes(undefined).enabled).toBe(true);
    expect(territorialQueries.routes(undefined, { saved: true }).enabled).toBe(false);
    expect(territorialQueries.routes(undefined, { saved: true }, 'user-id').enabled).toBe(true);
    expect(territorialQueries.routes('region', { saved: true }).enabled).toBe(false);
    expect(territorialQueries.routes('region', { saved: true }, 'user-id').enabled).toBe(true);
    expect(territorialQueries.bootstrap('').enabled).toBe(false);
    expect(territorialQueries.bootstrap('user-id').enabled).toBe(true);

    expect(userQueries.profile().enabled).toBe(false);
    expect(userQueries.profile('user-id').enabled).toBe(true);
    expect(userQueries.trips().enabled).toBe(false);
    expect(userQueries.trips('user-id').enabled).toBe(true);
    expect(userQueries.favoriteRoutes().enabled).toBe(false);
    expect(userQueries.favoriteRoutes('user-id').enabled).toBe(true);
    expect(userQueries.favoriteActors().enabled).toBe(false);
    expect(userQueries.favoriteActors('user-id').enabled).toBe(true);
    expect(userQueries.preferences().enabled).toBe(false);
    expect(userQueries.preferences('user-id').enabled).toBe(true);
  });

  it('isola o contexto administrativo por identidade', () => {
    expect(adminQueries.context('user-a').queryKey).not.toEqual(
      adminQueries.context('user-b').queryKey
    );
    expect(adminQueries.context('user-a').meta).toEqual({
      authenticated: true,
      authUserId: 'user-a',
    });
  });
});

describe('route prefetch and placeholder cache helpers', () => {
  it('finds cached route summary from list and infinite query cache', () => {
    const qc = new QueryClient();
    const routeSummary = {
      id: 'route-1',
      slug: 'rota-1',
      title: 'Rota 1',
      city: 'Belém',
      state_code: 'PA',
      status: 'active' as const,
      is_verified: true,
      is_favorite: false,
    };
    qc.setQueryData(['routes', 'infinite', 'all', {}, undefined], {
      pages: [{ data: [routeSummary], meta: { total: 1, limit: 10 } }],
      pageParams: [undefined],
    });

    const foundById = findCachedRouteSummary(qc, 'route-1');
    expect(foundById).toEqual(routeSummary);

    const foundBySlug = findCachedRouteSummary(qc, 'rota-1');
    expect(foundBySlug).toEqual(routeSummary);

    const notFound = findCachedRouteSummary(qc, 'inexistent');
    expect(notFound).toBeUndefined();
  });

  it('creates placeholder route detail from summary with empty origins and gallery', () => {
    const summary = {
      id: 'route-1',
      slug: 'rota-1',
      title: 'Rota 1',
      summary: 'Resumo da rota',
      city: 'Belém',
      state_code: 'PA',
      status: 'active' as const,
      is_verified: true,
      best_season: 'Dry season',
      cover_image_url: 'https://example.com/cover.jpg',
      cover_media: null,
      is_favorite: false,
    };
    const placeholder = createPlaceholderRouteDetail(summary);
    expect(placeholder.id).toBe('route-1');
    expect(placeholder.title).toBe('Rota 1');
    expect(placeholder.origins).toEqual([]);
    expect(placeholder.gallery).toEqual([]);
  });

  it('prefetches route queries when prefetchRouteData is called', () => {
    const qc = new QueryClient();
    const prefetchSpy = jest.spyOn(qc, 'prefetchQuery').mockResolvedValue(undefined);
    prefetchRouteData(qc, 'route-1');
    expect(prefetchSpy).toHaveBeenCalledTimes(4);
  });
});

