import { infiniteQueryOptions, queryOptions, useInfiniteQuery, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { apiClient } from '../api/client';
import { normalizeQueryValue, queryKeys } from '../api/queryKeys';
import type { GetRouteActorsQuery, GetRouteMapQuery, ListRoutesQuery, RouteDetail, RouteListEnvelope, RouteSummary } from '../api/types';
import { useAuth } from './useAuth';

export function flattenUniquePages<T extends { id: string }>(
  pages: Array<{ data: T[] }> | undefined
): T[] {
  const unique = new Map<string, T>();
  for (const page of pages ?? []) {
    for (const item of page.data) unique.set(item.id, item);
  }
  return [...unique.values()];
}

export function findCachedRouteSummary(
  queryClient: QueryClient,
  routeId: string
): RouteSummary | undefined {
  if (!routeId) return undefined;
  const queries = queryClient.getQueryCache().findAll({ queryKey: ['routes'] });
  for (const q of queries) {
    const data = q.state.data as any;
    if (!data) continue;
    let list: RouteSummary[] = [];
    if (Array.isArray(data.data)) {
      list = data.data;
    } else if (Array.isArray(data.pages)) {
      for (const p of data.pages) {
        if (Array.isArray(p?.data)) {
          list.push(...p.data);
        }
      }
    }
    const found = list.find((r) => r && (r.id === routeId || r.slug === routeId));
    if (found) return found;
  }
  return undefined;
}

export function createPlaceholderRouteDetail(
  summary: Partial<RouteSummary> & Pick<RouteSummary, 'id' | 'slug' | 'title' | 'city' | 'state_code' | 'status' | 'is_verified'>
): RouteDetail {
  return {
    id: summary.id,
    slug: summary.slug,
    title: summary.title,
    summary: summary.summary ?? null,
    city: summary.city,
    state_code: summary.state_code,
    status: summary.status,
    is_verified: summary.is_verified,
    best_season: summary.best_season ?? null,
    cover_image_url: summary.cover_image_url ?? null,
    cover_media: summary.cover_media ?? null,
    is_favorite: (summary as any).is_favorite ?? false,
    verified_at: null,
    connectivity: null,
    road_access: null,
    payment_info: null,
    gallery: [],
    origins: [],
  };
}

export function prefetchRouteData(queryClient: QueryClient, routeId: string): void {
  if (!queryClient || !routeId) return;
  void queryClient.prefetchQuery(territorialQueries.routeDetail(routeId));
  void queryClient.prefetchQuery(territorialQueries.routeMap(routeId, {}));
  void queryClient.prefetchQuery(territorialQueries.routeAlerts(routeId));
  void queryClient.prefetchQuery(territorialQueries.routeActors(routeId, { limit: 6 }));
}

export const adminQueries = {
  context: (userId?: string) =>
    queryOptions({
      queryKey: ['admin', 'context', userId],
      queryFn: ({ signal }) => apiClient.getAdminContext({ signal }),
      select: (envelope) => envelope.data,
      enabled: Boolean(userId),
      retry: false,
      meta: { authenticated: true, authUserId: userId },
    }),
};

export const territorialQueries = {
  bootstrap: (userId: string) =>
    queryOptions({
      queryKey: queryKeys.bootstrap(userId),
      queryFn: ({ signal }) => apiClient.getBootstrap({ signal }),
      select: (envelope) => envelope.data,
      enabled: Boolean(userId),
      meta: { authenticated: true, authUserId: userId },
    }),
  regions: () =>
    queryOptions({
      queryKey: queryKeys.regions(),
      queryFn: () => apiClient.getRegions(),
      select: (envelope) => envelope.data,
      staleTime: 1000 * 60 * 10, // 10 minutes
      gcTime: process.env.NODE_ENV === 'test' ? Infinity : 1000 * 60 * 60, // 1 hour
    }),
  routes: (regionId: string | null | undefined, params: ListRoutesQuery = {}, userId?: string) => {
    const isAll = !regionId || regionId === 'all';
    const request = {
      ...params,
      region_id: isAll ? undefined : normalizeQueryValue(regionId),
      q: normalizeQueryValue(params.q),
      cursor: normalizeQueryValue(params.cursor),
    };
    return queryOptions({
      queryKey: queryKeys.routes.list(isAll ? undefined : regionId, request, userId),
      queryFn: ({ signal }) => (signal ? apiClient.getRoutes(request, { signal }) : apiClient.getRoutes(request)),
      enabled: !params.saved || Boolean(userId),
      meta: { authenticated: params.saved === true, authUserId: params.saved ? userId : undefined },
      staleTime: 1000 * 60 * 2, // 2 minutes
    });
  },
  routeDetail: (routeId: string) =>
    queryOptions({
      queryKey: queryKeys.routes.detail(routeId),
      queryFn: () => apiClient.getRouteDetail(routeId),
      select: (e) => e.data,
      enabled: Boolean(routeId),
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
  routeOrigins: (routeId: string) =>
    queryOptions({ queryKey: queryKeys.routes.origins(routeId), queryFn: () => apiClient.getRouteOrigins(routeId), select: (e) => e.data, enabled: Boolean(routeId) }),
  routeGeometry: (routeId: string, originId: string) =>
    queryOptions({ queryKey: queryKeys.routes.geometry(routeId, originId), queryFn: () => apiClient.getRouteGeometry(routeId, originId), select: (e) => e.data, enabled: Boolean(routeId && originId) }),
  routeAlerts: (routeId: string) =>
    queryOptions({ queryKey: queryKeys.routes.alerts(routeId), queryFn: () => apiClient.getRouteAlerts(routeId), select: (e) => e.data, enabled: Boolean(routeId) }),
  routeActors: (routeId: string, params: GetRouteActorsQuery = {}) => {
    const request = {
      ...params,
      q: normalizeQueryValue(params.q),
      category: normalizeQueryValue(params.category),
      origin_id: normalizeQueryValue(params.origin_id),
      cursor: normalizeQueryValue(params.cursor),
    };
    return queryOptions({
      queryKey: queryKeys.routes.actors(routeId, request),
      queryFn: ({ signal }) => (signal ? apiClient.getRouteActors(routeId, request, { signal }) : apiClient.getRouteActors(routeId, request)),
      enabled: Boolean(routeId),
      staleTime: 1000 * 60 * 3,
    });
  },
  routeMap: (routeId: string, params: GetRouteMapQuery = {}) => {
    const request: GetRouteMapQuery = {
      origin_id: normalizeQueryValue(params.origin_id),
      layer: params.layer ?? undefined,
      category: normalizeQueryValue(params.category),
    };
    return queryOptions({
      queryKey: queryKeys.routes.map(routeId, request),
      queryFn: ({ signal }) => apiClient.getRouteMapPayload(routeId, request, { signal }),
      select: (e) => e.data,
      enabled: Boolean(routeId),
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'OFFLINE') {
          return false;
        }
        return failureCount < 1;
      },
    });
  },
  actorCategories: () =>
    queryOptions({
      queryKey: queryKeys.actorCategories(),
      queryFn: () => apiClient.getActorCategories(),
      select: (e) => e.data,
      staleTime: 1000 * 60 * 15, // 15 minutes
      gcTime: process.env.NODE_ENV === 'test' ? Infinity : 1000 * 60 * 60, // 1 hour
    }),
  actorDetail: (actorId: string) =>
    queryOptions({ queryKey: queryKeys.actorDetail(actorId), queryFn: () => apiClient.getActorDetail(actorId), select: (e) => e.data, enabled: Boolean(actorId) }),
};

export const useAdminContextQuery = (isAuthenticated = true) => {
  const { user } = useAuth();
  return useQuery(adminQueries.context(isAuthenticated ? user?.id : undefined));
};

export const useRegionsQuery = () => useQuery(territorialQueries.regions());
export const useRoutesQuery = (
  regionId: string | null | undefined,
  params?: ListRoutesQuery,
  userId?: string
) => useQuery(territorialQueries.routes(regionId, params, userId));
export const useRouteDetailQuery = (routeId: string) => {
  let queryClient: QueryClient | undefined;
  try {
    queryClient = useQueryClient();
  } catch {
    queryClient = undefined;
  }

  return useQuery({
    ...territorialQueries.routeDetail(routeId),
    placeholderData: (previousData) => {
      if (previousData) return previousData;
      if (!queryClient || !routeId) return undefined;
      const cached = findCachedRouteSummary(queryClient, routeId);
      if (cached) {
        return { data: createPlaceholderRouteDetail(cached) };
      }
      return undefined;
    },
  });
};
export const useRouteOriginsQuery = (routeId: string) => useQuery(territorialQueries.routeOrigins(routeId));
export const useRouteGeometryQuery = (routeId: string, originId: string) => useQuery(territorialQueries.routeGeometry(routeId, originId));
export const useRouteAlertsQuery = (routeId: string) => useQuery(territorialQueries.routeAlerts(routeId));
export const useRouteActorsQuery = (routeId: string, params?: GetRouteActorsQuery) => useQuery(territorialQueries.routeActors(routeId, params));
export const useRouteMapQuery = (routeId: string, params?: GetRouteMapQuery) =>
  useQuery(territorialQueries.routeMap(routeId, params));
export const useActorCategoriesQuery = () => useQuery(territorialQueries.actorCategories());
export const useActorDetailQuery = (actorId: string) => useQuery(territorialQueries.actorDetail(actorId));
export const useBootstrapQuery = (userId: string) => useQuery(territorialQueries.bootstrap(userId));

export const useInfiniteRoutesQuery = (
  regionId: string | null | undefined,
  params: ListRoutesQuery = {},
  userId?: string
) => {
  let queryClient: QueryClient | undefined;
  try {
    queryClient = useQueryClient();
  } catch {
    queryClient = undefined;
  }
  const isAll = !regionId || regionId === 'all';
  return useInfiniteQuery({
    queryKey: ['routes', 'infinite', isAll ? 'all' : regionId, params, userId],
    queryFn: ({ pageParam, signal }) =>
      apiClient.getRoutes(
        {
          ...params,
          region_id: isAll ? undefined : normalizeQueryValue(regionId),
          cursor: pageParam ? String(pageParam) : undefined,
        },
        { signal }
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.next_cursor ?? undefined,
    enabled: !params.saved || Boolean(userId),
    meta: { authenticated: params.saved === true, authUserId: params.saved ? userId : undefined },
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: (previousData) => {
      if (previousData) return previousData;
      if (!queryClient) return undefined;
      const cached =
        queryClient.getQueryData<RouteListEnvelope>(
          queryKeys.routes.list(isAll ? undefined : regionId, { limit: 10 })
        ) ||
        queryClient.getQueryData<RouteListEnvelope>(
          queryKeys.routes.list(isAll ? undefined : regionId, {})
        );
      if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
        return {
          pages: [cached],
          pageParams: [undefined],
        };
      }
      return undefined;
    },
  });
};

export const useInfiniteRouteActorsQuery = (
  routeId: string,
  params: GetRouteActorsQuery = {}
) =>
  useInfiniteQuery({
    queryKey: ['routes', 'actors', 'infinite', routeId, params],
    queryFn: ({ pageParam, signal }) =>
      apiClient.getRouteActors(
        routeId,
        {
          ...params,
          cursor: pageParam ? String(pageParam) : undefined,
        },
        { signal }
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.next_cursor ?? undefined,
    enabled: Boolean(routeId),
  });

export const userQueries = {
  profile: (userId?: string) =>
    queryOptions({
      queryKey: queryKeys.myProfile(userId),
      queryFn: ({ signal }) => apiClient.getMyProfile({ signal }),
      select: (e) => e.data,
      enabled: Boolean(userId),
      meta: { authenticated: true, authUserId: userId },
    }),
  trips: (userId?: string) =>
    queryOptions({
      queryKey: queryKeys.myTrips(userId),
      queryFn: ({ signal }) => apiClient.getMyTrips({ signal }),
      select: (e) => e.data,
      enabled: Boolean(userId),
      meta: { authenticated: true, authUserId: userId },
    }),
  favoriteRoutes: (userId?: string) =>
    queryOptions({
      queryKey: queryKeys.myFavoriteRoutes(userId),
      queryFn: ({ signal }) => apiClient.getMyFavoriteRoutes({ signal }),
      select: (e) => e.data,
      enabled: Boolean(userId),
      meta: { authenticated: true, authUserId: userId },
    }),
  favoriteActors: (userId?: string) =>
    queryOptions({
      queryKey: queryKeys.favoriteActors(userId),
      queryFn: ({ signal }) => apiClient.getMyFavoriteActors({ signal }),
      select: (e) => e.data,
      enabled: Boolean(userId),
      meta: { authenticated: true, authUserId: userId },
    }),
  preferences: (userId?: string) =>
    queryOptions({
      queryKey: queryKeys.myPreferences(userId),
      queryFn: ({ signal }) => apiClient.getMyPreferences({ signal }),
      select: (e) => e.data,
      enabled: Boolean(userId),
      meta: { authenticated: true, authUserId: userId },
    }),
  supportContent: () =>
    queryOptions({
      queryKey: queryKeys.supportContent(),
      queryFn: () => apiClient.getSupportContent(),
      select: (e) => e.data,
    }),
};

export const useMyProfileQuery = (userId?: string) => useQuery(userQueries.profile(userId));
export const useMyTripsQuery = (userId?: string) => useQuery(userQueries.trips(userId));
export const useMyFavoriteRoutesQuery = (userId?: string) => useQuery(userQueries.favoriteRoutes(userId));
export const useMyFavoriteActorsQuery = (userId?: string) => useQuery(userQueries.favoriteActors(userId));
export const useMyPreferencesQuery = (userId?: string) => useQuery(userQueries.preferences(userId));
export const useSupportContentQuery = () => useQuery(userQueries.supportContent());
