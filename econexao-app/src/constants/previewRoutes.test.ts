import { PREVIEW_ROUTES, isPreviewRoute, mergeRoutesWithPreviews } from './previewRoutes';
import type { RouteSummary } from '../api/types';

describe('previewRoutes', () => {
  it('contains the 4 requested routes in the expected order', () => {
    expect(PREVIEW_ROUTES).toHaveLength(4);
    expect(PREVIEW_ROUTES[0].title).toBe('Praia do Amor (Alter do Chão)');
    expect(PREVIEW_ROUTES[0].city).toBe('Santarém');
    expect(PREVIEW_ROUTES[1].title).toBe('Ponta de Pedras');
    expect(PREVIEW_ROUTES[1].city).toBe('Santarém');
    expect(PREVIEW_ROUTES[2].title).toBe('Vila Socorro');
    expect(PREVIEW_ROUTES[2].city).toBe('Santarém');
    expect(PREVIEW_ROUTES[3].title).toBe('Aramanai');
    expect(PREVIEW_ROUTES[3].city).toBe('Belterra');
  });

  it('correctly identifies preview routes', () => {
    expect(isPreviewRoute({ id: 'preview-route-alter-do-chao' })).toBe(true);
    expect(isPreviewRoute({ slug: 'rota-ponta-de-pedras' })).toBe(true);
    expect(isPreviewRoute({ slug: 'rota-pindobal' })).toBe(false);
  });

  it('merges Pindobal at #1 and the 4 previews at #2 through #5', () => {
    const apiPindobal: RouteSummary = {
      id: 'd437d9db-e5be-465b-9f8a-07ce64229305',
      slug: 'rota-pindobal',
      title: 'Pindobal',
      city: 'Belterra',
      state_code: 'PA',
      status: 'active',
      is_verified: true,
      best_season: null,
      cover_image_url: null,
      cover_media: null,
      is_favorite: false,
    };

    const merged = mergeRoutesWithPreviews([apiPindobal]);
    expect(merged).toHaveLength(5);
    expect(merged[0].slug).toBe('rota-pindobal');
    expect(merged[1].slug).toBe('rota-alter-do-chao');
    expect(merged[2].slug).toBe('rota-ponta-de-pedras');
    expect(merged[3].slug).toBe('rota-vila-socorro');
    expect(merged[4].slug).toBe('rota-aramanai');
  });

  it('isolates Altamira routes when isAltamiraRegion is true or only Altamira routes exist', () => {
    const apiPedral: RouteSummary = {
      id: 'a17a314a-0000-4000-8000-000000000002',
      slug: 'rota-pedral',
      title: 'Rota do Pedral',
      city: 'Altamira',
      state_code: 'PA',
      status: 'active',
      is_verified: false,
      best_season: null,
      cover_image_url: null,
      cover_media: null,
      is_favorite: false,
    };

    const merged = mergeRoutesWithPreviews([apiPedral], { isAltamiraRegion: true });
    expect(merged).toHaveLength(1);
    expect(merged[0].slug).toBe('rota-pedral');
  });

  it('preserves Santarém previews when viewing Todas as regiões (both Pindobal and Pedral present)', () => {
    const apiPindobal: RouteSummary = {
      id: 'd437d9db-e5be-465b-9f8a-07ce64229305',
      slug: 'rota-pindobal',
      title: 'Pindobal',
      city: 'Belterra',
      state_code: 'PA',
      status: 'active',
      is_verified: true,
      best_season: null,
      cover_image_url: null,
      cover_media: null,
      is_favorite: false,
    };
    const apiPedral: RouteSummary = {
      id: 'a17a314a-0000-4000-8000-000000000002',
      slug: 'rota-pedral',
      title: 'Rota do Pedral',
      city: 'Altamira',
      state_code: 'PA',
      status: 'active',
      is_verified: false,
      best_season: null,
      cover_image_url: null,
      cover_media: null,
      is_favorite: false,
    };

    // Neither isAltamiraRegion is true: this is the aggregated "Todas" view
    const merged = mergeRoutesWithPreviews([apiPindobal, apiPedral]);
    // #1 Pindobal, #2-5 Previews, #6 Pedral
    expect(merged).toHaveLength(6);
    expect(merged[0].slug).toBe('rota-pindobal');
    expect(merged[1].slug).toBe('rota-alter-do-chao');
    expect(merged[2].slug).toBe('rota-ponta-de-pedras');
    expect(merged[3].slug).toBe('rota-vila-socorro');
    expect(merged[4].slug).toBe('rota-aramanai');
    expect(merged[5].slug).toBe('rota-pedral');
  });
});
