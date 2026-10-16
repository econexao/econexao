import * as ReactNative from 'react-native';

export interface ResponsiveLayoutState {
  width: number;
  height: number;
  isMobile: boolean; // width < 768
  isTablet: boolean; // width >= 768 && width < 1024
  isDesktop: boolean; // width >= 1024
  isWide: boolean; // width >= 768 (tablet or desktop)
  columns: number; // 1 (mobile), 2 (tablet), 3 (desktop)
  contentMaxWidth: number; // 1200 for standard screens, 800 for profile
  horizontalMargin: number; // 16 (mobile), 24 (tablet), 64 (desktop)
}

export interface UseResponsiveLayoutOptions {
  contentMaxWidth?: number;
}

export function calculateResponsiveLayout(
  width: number,
  height: number,
  options?: UseResponsiveLayoutOptions
): ResponsiveLayoutState {
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;
  const isWide = width >= 768;

  const columns = isMobile ? 1 : isTablet ? 2 : 3;
  const horizontalMargin = isMobile ? 16 : isTablet ? 24 : 64;
  const contentMaxWidth = options?.contentMaxWidth ?? 1200;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    columns,
    contentMaxWidth,
    horizontalMargin,
  };
}

/**
 * Standardized responsive breakpoint hook for desktop web and mobile adaptation.
 */
export function useResponsiveLayout(options?: UseResponsiveLayoutOptions): ResponsiveLayoutState {
  const { width, height } = ReactNative.useWindowDimensions();
  return calculateResponsiveLayout(width, height, options);
}
