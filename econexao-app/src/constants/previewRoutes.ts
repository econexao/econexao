import type { RouteSummary } from '../api/types';
import { isPindobalRoute, getRoutePhotoCount } from '../components/routes/routeCoverImage';

export const PREVIEW_ROUTES: RouteSummary[] = [
  {
    id: 'preview-route-alter-do-chao',
    slug: 'rota-alter-do-chao',
    title: 'Praia do Amor (Alter do Chão)',
    summary: 'Praia do Amor e corredor de Alter do Chão.',
    city: 'Santarém',
    state_code: 'PA',
    status: 'active',
    is_verified: false,
    best_season: null,
    cover_image_url: null,
    cover_media: null,
    is_favorite: false,
  },
  {
    id: 'preview-route-ponta-de-pedras',
    slug: 'rota-ponta-de-pedras',
    title: 'Ponta de Pedras',
    summary: 'Praia fluvial e formações rochosas de Ponta de Pedras.',
    city: 'Santarém',
    state_code: 'PA',
    status: 'active',
    is_verified: false,
    best_season: null,
    cover_image_url: null,
    cover_media: null,
    is_favorite: false,
  },
  {
    id: 'preview-route-vila-socorro',
    slug: 'rota-vila-socorro',
    title: 'Vila Socorro',
    summary: 'Comunidade tradicional e ecoturismo em Vila Socorro.',
    city: 'Santarém',
    state_code: 'PA',
    status: 'active',
    is_verified: false,
    best_season: null,
    cover_image_url: null,
    cover_media: null,
    is_favorite: false,
  },
  {
    id: 'preview-route-aramanai',
    slug: 'rota-aramanai',
    title: 'Aramanai',
    summary: 'Praia de Aramanaí às margens do Rio Tapajós.',
    city: 'Belterra',
    state_code: 'PA',
    status: 'active',
    is_verified: false,
    best_season: null,
    cover_image_url: null,
    cover_media: null,
    is_favorite: false,
  },
];

export const isPreviewRoute = (route: { id?: string | null; slug?: string | null }): boolean => {
  return Boolean(
    route.id?.startsWith('preview-route-') ||
    route.slug === 'rota-alter-do-chao' ||
    route.slug === 'rota-praia-do-amor' ||
    route.slug === 'rota-ponta-de-pedras' ||
    route.slug === 'rota-vila-socorro' ||
    route.slug === 'rota-aramanai'
  );
};

export type RouteAvailability = 'available' | 'upcoming' | 'temporarily_unavailable';

export function getRouteAvailability(route: {
  id?: string | null;
  slug?: string | null;
  status?: string | null;
}): RouteAvailability {
  if (isPreviewRoute(route)) {
    return 'upcoming';
  }
  if (route.status && route.status !== 'active') {
    return 'temporarily_unavailable';
  }
  return 'available';
}

export function isRouteAvailable(route: {
  id?: string | null;
  slug?: string | null;
  status?: string | null;
}): boolean {
  return getRouteAvailability(route) === 'available';
}

export interface MergeRoutesOptions {
  isAltamiraRegion?: boolean;
}

const sortRoutesByGalleryPhotoCount = (routes: RouteSummary[]): RouteSummary[] => {
  return [...routes].sort((a, b) => getRoutePhotoCount(b) - getRoutePhotoCount(a));
};

/**
 * Merges API routes with preview routes:
 * 1. Available active API routes are prioritized first, ordered by gallery photo count.
 * 2. Inactive / temporarily unavailable API routes follow active ones.
 * 3. Preview routes ("Em breve") are positioned strictly at the end of the list.
 *
 * When isAltamiraRegion is true, Santarém previews are isolated and only Altamira routes are returned.
 * When viewing Santarém or Todas as regiões, Santarém previews are appended at the end of API routes.
 */
export function mergeRoutesWithPreviews(
  apiRoutes: RouteSummary[] = [],
  options?: MergeRoutesOptions
): RouteSummary[] {
  // If explicitly flagged as Altamira region, return only the API routes sorted by photo count
  if (options?.isAltamiraRegion) {
    return sortRoutesByGalleryPhotoCount(apiRoutes);
  }

  // If no option was explicitly passed, check if routes are strictly Altamira without Santarém/Belterra
  const hasAltamira = apiRoutes.some(
    (r) =>
      r.slug === 'rota-pedral' ||
      r.slug === 'rota-massanori' ||
      r.slug === 'rota-ambe' ||
      r.slug === 'rota-queda-dagua' ||
      r.slug === 'rota-raizes-do-xingu' ||
      r.city?.toLowerCase() === 'altamira' ||
      r.city?.toLowerCase() === 'brasil novo'
  );
  const hasSantarem = apiRoutes.some(
    (r) =>
      isPindobalRoute(r) ||
      r.city?.toLowerCase() === 'santarém' ||
      r.city?.toLowerCase() === 'santarem' ||
      r.city?.toLowerCase() === 'belterra'
  );

  if (hasAltamira && !hasSantarem && apiRoutes.length > 0) {
    return sortRoutesByGalleryPhotoCount(apiRoutes);
  }

  const existingSlugs = new Set(apiRoutes.map((r) => r.slug));
  const missingPreviews = PREVIEW_ROUTES.filter((p) => !existingSlugs.has(p.slug));

  const activeApiRoutes = apiRoutes.filter((r) => !isPreviewRoute(r) && r.status === 'active');
  const inactiveApiRoutes = apiRoutes.filter((r) => !isPreviewRoute(r) && r.status !== 'active');

  const sortedActiveApiRoutes = sortRoutesByGalleryPhotoCount(activeApiRoutes);
  const sortedInactiveApiRoutes = sortRoutesByGalleryPhotoCount(inactiveApiRoutes);

  return [...sortedActiveApiRoutes, ...sortedInactiveApiRoutes, ...missingPreviews];
}
