import type { ImageSourcePropType } from 'react-native';

type RouteCover = {
  id?: string | null;
  slug?: string | null;
  cover_image_url?: string | null;
};

const pindobalCoverImage = require('../../../assets/images/pindobal1.png');
const alterCoverImage = require('../../../assets/images/alter2.png');
const pontaDePedrasCoverImage = require('../../../assets/images/pontadepedras3.png');
const aramanaiCoverImage = require('../../../assets/images/aramanai1.png');

export const isPindobalRoute = (route: RouteCover) =>
  route.id === 'route-pindobal' ||
  route.slug === 'rota-pindobal' ||
  route.slug === 'rota-santarem-pindobal';

/** Keeps editorial covers bundled with the app while other routes use API media. */
export const getRouteCoverImage = (route: RouteCover): ImageSourcePropType | undefined => {
  if (isPindobalRoute(route)) {
    return pindobalCoverImage;
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

