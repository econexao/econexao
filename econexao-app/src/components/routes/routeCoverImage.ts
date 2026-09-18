import type { ImageSourcePropType } from 'react-native';

type RouteCover = {
  id?: string | null;
  slug?: string | null;
  cover_image_url?: string | null;
};

type RouteGallery = RouteCover & {
  gallery?: Array<{
    url: string;
    derivatives?: Record<string, string>;
    alt_text?: string | null;
  }>;
};

const pindobalCoverImage = require('../../../assets/images/pindobal1.png');
const pedralCoverImage = require('../../../assets/images/pedral_route_hero.png');
const pindobalGalleryImages = [
  require('../../../assets/images/pindobal1.png'),
  require('../../../assets/images/pindobal2.png'),
  require('../../../assets/images/pindobal3.png'),
  require('../../../assets/images/pindobal4.png'),
];
const alterCoverImage = require('../../../assets/images/alter2.png');
const pontaDePedrasCoverImage = require('../../../assets/images/pontadepedras3.png');
const aramanaiCoverImage = require('../../../assets/images/aramanai1.png');

export const isPindobalRoute = (route: RouteCover) =>
  route.id === 'route-pindobal' ||
  route.slug === 'rota-pindobal' ||
  route.slug === 'rota-santarem-pindobal';

export const isPedralRoute = (route: RouteCover) =>
  route.id === 'a17a314a-0000-4000-8000-000000000002' ||
  route.id === 'route-pedral' ||
  route.slug === 'rota-pedral';

/** Keeps editorial covers bundled with the app while other routes use API media. */
export const getRouteCoverImage = (route: RouteCover): ImageSourcePropType | undefined => {
  if (isPindobalRoute(route)) {
    return pindobalCoverImage;
  }
  if (isPedralRoute(route)) {
    return pedralCoverImage;
  }
  if (
    route.slug === 'rota-alter-do-chao' ||
    route.slug === 'rota-praia-do-amor' ||
    route.id === 'preview-route-alter-do-chao'
  ) {
    return alterCoverImage;
  }
  if (
    route.slug === 'rota-ponta-de-pedras' ||
    route.id === 'preview-route-ponta-de-pedras'
  ) {
    return pontaDePedrasCoverImage;
  }
  if (
    route.slug === 'rota-aramanai' ||
    route.id === 'preview-route-aramanai'
  ) {
    return aramanaiCoverImage;
  }

  return route.cover_image_url ? { uri: route.cover_image_url } : undefined;
};

export const getPindobalCoverImage = (route: RouteCover): ImageSourcePropType | undefined =>
  isPindobalRoute(route) ? pindobalCoverImage : undefined;

export const getPedralCoverImage = (route: RouteCover): ImageSourcePropType | undefined =>
  isPedralRoute(route) ? pedralCoverImage : undefined;

export const getRouteGalleryImages = (route: RouteGallery) => {
  if (route.gallery?.length) {
    return route.gallery.map((media, index) => ({
      key: media.url,
      source: { uri: media.derivatives?.card ?? media.url } as ImageSourcePropType,
      alt: media.alt_text || `Foto ${index + 1} da rota ${route.slug || ''}`.trim(),
    }));
  }

  if (isPindobalRoute(route)) {
    return pindobalGalleryImages.map((source, index) => ({
      key: `pindobal-${index + 1}`,
      source: source as ImageSourcePropType,
      alt: `Foto ${index + 1} da Praia de Pindobal`,
    }));
  }

  if (isPedralRoute(route)) {
    return [
      {
        key: 'pedral-1',
        source: pedralCoverImage as ImageSourcePropType,
        alt: 'Foto do Balneário Luiz do Pedral e Rio Xingu',
      },
    ];
  }

  return [];
};

/**
 * Standardizes the display name of routes across cards and detail screens.
 * Specifically canonicalizes the Pedral route to "Balneário Luiz do Pedral".
 */
export const getRouteDisplayName = (
  route?: (RouteCover & { title?: string | null }) | null
): string => {
  if (!route) return '';
  if (
    isPedralRoute(route) ||
    route.slug === 'rota-pedral' ||
    route.title === 'Rota do Pedral'
  ) {
    return 'Balneário Luiz do Pedral';
  }
  return route.title ?? '';
};

