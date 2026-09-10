import type { RouteSummary } from '../api/types';
import { isPindobalRoute } from '../components/routes/routeCoverImage';

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

export const isPreviewRoute = (route: { id?: string | null; slug?: string | null }) => {
  return (
    route.id?.startsWith('preview-route-') ||
    route.slug === 'rota-alter-do-chao' ||
    route.slug === 'rota-praia-do-amor' ||
    route.slug === 'rota-ponta-de-pedras' ||
    route.slug === 'rota-vila-socorro' ||
    route.slug === 'rota-aramanai'
  );
};

/**
 * Merges API routes with preview routes ensuring the canonical #1 to #5 order:
 * #1 Pindobal - Belterra/PA
 * #2 Praia do Amor (Alter do Chão) - Santarém/PA
 * #3 Ponta de Pedras - Santarém/PA
 * #4 Vila Socorro - Santarém/PA
 * #5 Aramanai - Belterra/PA
 */
export function mergeRoutesWithPreviews(apiRoutes: RouteSummary[] = []): RouteSummary[] {
  const pindobal = apiRoutes.find((r) => isPindobalRoute(r));
  const otherApiRoutes = apiRoutes.filter((r) => !isPindobalRoute(r));

  const existingSlugs = new Set(apiRoutes.map((r) => r.slug));
  const missingPreviews = PREVIEW_ROUTES.filter((p) => !existingSlugs.has(p.slug));

  const result: RouteSummary[] = [];

  // #1 Pindobal
  if (pindobal) {
    result.push(pindobal);
  } else if (apiRoutes.length > 0) {
    result.push(apiRoutes[0]);
  }

  // Previews (#2, #3, #4, #5)
  for (const preview of missingPreviews) {
    result.push(preview);
  }

  // Any other routes from the API
  for (const other of otherApiRoutes) {
    if (!result.some((r) => r.id === other.id || r.slug === other.slug)) {
      result.push(other);
    }
  }

  return result;
}
