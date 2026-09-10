import { apiClient } from '../api/client';
import { adminQueries, territorialQueries, userQueries } from './queries';

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
    expect(territorialQueries.routes(undefined).enabled).toBe(false);
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
