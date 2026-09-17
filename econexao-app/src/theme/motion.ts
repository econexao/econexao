import { Easing } from 'react-native';

/**
 * Tokens centralizados de animação e acessibilidade de movimento do ECOnexão.
 * Fonte normativa: docs/motion_design/implementation_plan.md
 */
export const motion = {
  durations: {
    instant: 0,
    pressIn: 100,
    pressOut: 140,
    hover: 140,
    pinSelectedMin: 160,
    pinSelectedMax: 200,
    pinEnter: 180,
    blockEnter: 180,
    photoFade: 180,
    favoritePulse: 180,
    geometrySwap: 180,
    modalEnter: 220,
    modalExit: 160,
    galleryStep: 240,
    sheetEnter: 280,
    sheetExit: 180,
    cameraPan: 300,
    sequenceMaxTotal: 300,
    routeHighlight: 650,
    routeHighlightMax: 700,
  },
  intervals: {
    sequenceStagger: 35,
    sequenceMaxItems: 4,
  },
  easings: {
    // Curvas nominais Web CSS
    easeOutCss: 'cubic-bezier(0, 0, 0.2, 1)',
    enterBlockCss: 'cubic-bezier(0.2, 0, 0, 1)',
    linearCss: 'linear',

    // Curvas equivalentes React Native Easing
    easeOut: Easing.bezier(0, 0, 0.2, 1),
    enterBlock: Easing.bezier(0.2, 0, 0, 1),
    linear: Easing.linear,
  },
  transforms: {
    pressScale: 0.98,
    hoverTranslateY: -2,
    blockEnterTranslateY: 8,
    pinEnterScale: 0.9,
    pinSelectedScale: 0.98,
    favoritePulseScale: 1.12,
    modalEnterTranslateY: 8,
  },
  reduced: {
    duration: 0,
    scale: 1,
    translateY: 0,
    opacity: 1,
  },
} as const;

export type MotionTheme = typeof motion;
