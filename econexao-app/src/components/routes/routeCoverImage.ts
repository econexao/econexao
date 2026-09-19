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
const massanoriCoverImage = require('../../../assets/images/massanori_route_hero.png');
const ambeCoverImage = require('../../../assets/images/ambe_route_hero.png');
const pindobalGalleryImages = [
  require('../../../assets/images/pindobal1.png'),
  require('../../../assets/images/pindobal2.png'),
  require('../../../assets/images/pindobal3.png'),
  require('../../../assets/images/pindobal4.png'),
];
const alterCoverImage = require('../../../assets/images/alter2.png');
const pontaDePedrasCoverImage = require('../../../assets/images/pontadepedras3.png');
const vilaSocorroCoverImage = require('../../../assets/images/vila-socorro-1.png');
const aramanaiCoverImage = require('../../../assets/images/aramanai-1.png');

export const isPindobalRoute = (route: RouteCover) =>
  route.id === 'route-pindobal' ||
  route.slug === 'rota-pindobal' ||
  route.slug === 'rota-santarem-pindobal';

export const isPedralRoute = (route: RouteCover) =>
  route.id === 'a17a314a-0000-4000-8000-000000000002' ||
  route.id === 'route-pedral' ||
  route.slug === 'rota-pedral';

export const isMassanoriRoute = (route: RouteCover) =>
  route.id === 'a17a314a-0000-4000-8000-000000000003' ||
  route.id === 'route-massanori' ||
  route.slug === 'rota-massanori' ||
  route.slug === 'rota-macanori';

export const isAmbeRoute = (route: RouteCover) =>
  route.id === 'a17a314a-0000-4000-8000-000000000004' ||
  route.id === 'route-ambe' ||
  route.slug === 'rota-ambe' ||
  route.slug === 'rota-ambe-floresta-park';

/** Keeps editorial covers bundled with the app while other routes use API media. */
export const getRouteCoverImage = (route: RouteCover): ImageSourcePropType | undefined => {
  if (isPindobalRoute(route)) {
    return pindobalCoverImage;
  }
  if (isPedralRoute(route)) {
    return pedralCoverImage;
  }
  if (isMassanoriRoute(route)) {
    return massanoriCoverImage;
  }
  if (isAmbeRoute(route)) {
    return ambeCoverImage;
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
    route.slug === 'rota-vila-socorro' ||
    route.id === 'preview-route-vila-socorro'
  ) {
    return vilaSocorroCoverImage;
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

export const getMassanoriCoverImage = (route: RouteCover): ImageSourcePropType | undefined =>
  isMassanoriRoute(route) ? massanoriCoverImage : undefined;

export const getAmbeCoverImage = (route: RouteCover): ImageSourcePropType | undefined =>
  isAmbeRoute(route) ? ambeCoverImage : undefined;

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

  if (isMassanoriRoute(route)) {
    return [
      {
        key: 'massanori-1',
        source: massanoriCoverImage as ImageSourcePropType,
        alt: 'Foto da Praia do Massanori e Rio Xingu',
      },
    ];
  }

  if (isAmbeRoute(route)) {
    return [
      {
        key: 'ambe-1',
        source: ambeCoverImage as ImageSourcePropType,
        alt: 'Foto do Ambé Floresta Park e igarapé natural',
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
  if (
    isMassanoriRoute(route) ||
    route.slug === 'rota-massanori' ||
    route.slug === 'rota-macanori' ||
    route.title === 'Rota Massanori' ||
    route.title === 'Rota Praia do Massanori'
  ) {
    return 'Praia do Massanori';
  }
  if (
    isAmbeRoute(route) ||
    route.slug === 'rota-ambe' ||
    route.slug === 'rota-ambe-floresta-park' ||
    route.title === 'Rota Ambé' ||
    route.title === 'Rota Ambé Floresta Park'
  ) {
    return 'Ambé Floresta Park';
  }
  return route.title ?? '';
};

/**
 * Returns a curated, concise location description (max 250 characters)
 * for destination routes like Pedral, Massanori and Pindobal.
 */
export const getRouteDescription = (
  route?: (RouteCover & { description?: string | null; summary?: string | null }) | null
): string => {
  if (!route) return '';

  if (isPedralRoute(route) || route.slug === 'rota-pedral') {
    return 'Refúgio natural às margens do Rio Xingu, o Balneário Luiz do Pedral encanta pelas águas cristalinas entre pedrais dourados, formando piscinas naturais perfeitas para banho e contemplação da Amazônia.';
  }

  if (isMassanoriRoute(route) || route.slug === 'rota-massanori' || route.slug === 'rota-macanori') {
    return 'Banhada pelas águas do Rio Xingu, a Praia do Massanori encanta com sua ampla faixa de areia dourada na estiagem, águas refrescantes, quiosques com peixes típicos e um visual deslumbrante em Altamira.';
  }

  if (isAmbeRoute(route) || route.slug === 'rota-ambe' || route.slug === 'rota-ambe-floresta-park') {
    return 'O Ambé Floresta Park combina a exuberância da floresta amazônica com piscinas naturais de igarapé, gastronomia regional e trilhas ecológicas, oferecendo lazer e descanso em Altamira.';
  }

  if (isPindobalRoute(route)) {
    return 'Com areias brancas e águas calmas do Rio Tapajós, a Praia de Pindobal é famosa por suas charmosas cabanas de palha à beira-rio, gastronomia regional e um inesquecível pôr do sol amazônico.';
  }

  if (
    route.slug === 'rota-alter-do-chao' ||
    route.slug === 'rota-praia-do-amor' ||
    route.id === 'preview-route-alter-do-chao'
  ) {
    return 'Localizada em Alter do Chão, no Rio Tapajós, a Praia do Amor se destaca por seus bancos de areia branca, águas doces e mornas, e quiosques com vista privilegiada para o paraíso amazônico.';
  }

  if (
    route.slug === 'rota-ponta-de-pedras' ||
    route.id === 'preview-route-ponta-de-pedras'
  ) {
    return 'Com formações rochosas singulares e águas tranquilas do Tapajós, Ponta de Pedras oferece uma praia rústica e preservada, ideal para relaxar e saborear peixes típicos da região.';
  }

  if (
    route.slug === 'rota-vila-socorro' ||
    route.id === 'preview-route-vila-socorro'
  ) {
    return 'Comunidade tradicional ribeirinha na região do Tapajós, Vila Socorro combina turismo comunitário, vivência cultural amazônica e trilhas na floresta nativa.';
  }

  if (
    route.slug === 'rota-aramanai' ||
    route.id === 'preview-route-aramanai'
  ) {
    return 'Praia tranquila de Belterra com faixa de areia dourada e vegetação preservada, Aramanaí é um refúgio acolhedor para desfrutar da natureza e da brisa do Tapajós.';
  }

  return route.description || route.summary || '';
};


