import React from 'react';
import * as ReactNative from 'react-native';
import renderer, { act } from 'react-test-renderer';
import {
  calculateResponsiveLayout,
  useResponsiveLayout,
  type ResponsiveLayoutState,
} from './useResponsiveLayout';

describe('useResponsiveLayout & calculateResponsiveLayout', () => {
  describe('pure calculation across breakpoints', () => {
    it('returns mobile layout for viewport < 768px (e.g. 375x812)', () => {
      const state = calculateResponsiveLayout(375, 812);
      expect(state).toEqual({
        width: 375,
        height: 812,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isWide: false,
        columns: 1,
        contentMaxWidth: 1200,
        horizontalMargin: 16,
      });
    });

    it('returns mobile layout at 767px boundary', () => {
      const state = calculateResponsiveLayout(767, 900);
      expect(state.isMobile).toBe(true);
      expect(state.isTablet).toBe(false);
      expect(state.isDesktop).toBe(false);
      expect(state.isWide).toBe(false);
      expect(state.columns).toBe(1);
      expect(state.horizontalMargin).toBe(16);
    });

    it('returns tablet layout at 768px lower boundary', () => {
      const state = calculateResponsiveLayout(768, 1024);
      expect(state).toEqual({
        width: 768,
        height: 1024,
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        isWide: true,
        columns: 2,
        contentMaxWidth: 1200,
        horizontalMargin: 24,
      });
    });

    it('returns tablet layout at 1023px upper boundary', () => {
      const state = calculateResponsiveLayout(1023, 768);
      expect(state.isMobile).toBe(false);
      expect(state.isTablet).toBe(true);
      expect(state.isDesktop).toBe(false);
      expect(state.isWide).toBe(true);
      expect(state.columns).toBe(2);
      expect(state.horizontalMargin).toBe(24);
    });

    it('returns desktop layout at 1024px boundary', () => {
      const state = calculateResponsiveLayout(1024, 768);
      expect(state).toEqual({
        width: 1024,
        height: 768,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isWide: true,
        columns: 3,
        contentMaxWidth: 1200,
        horizontalMargin: 64,
      });
    });

    it('returns desktop layout for wide monitor (1920x1080)', () => {
      const state = calculateResponsiveLayout(1920, 1080);
      expect(state).toEqual({
        width: 1920,
        height: 1080,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isWide: true,
        columns: 3,
        contentMaxWidth: 1200,
        horizontalMargin: 64,
      });
    });

    it('supports custom contentMaxWidth override (e.g. 800 for profile)', () => {
      const state = calculateResponsiveLayout(1280, 800, { contentMaxWidth: 800 });
      expect(state.contentMaxWidth).toBe(800);
      expect(state.isDesktop).toBe(true);
    });
  });

  describe('useResponsiveLayout hook integration', () => {
    it('integrates with useWindowDimensions to provide responsive state', () => {
      const dimensionsSpy = jest
        .spyOn(ReactNative.Dimensions, 'get')
        .mockReturnValue({ width: 1280, height: 800, scale: 1, fontScale: 1 } as any);

      let capturedState: ResponsiveLayoutState | null = null;
      const TestConsumer: React.FC = () => {
        capturedState = useResponsiveLayout();
        return null;
      };

      act(() => {
        renderer.create(React.createElement(TestConsumer));
      });

      expect(capturedState).not.toBeNull();
      const state = capturedState!;
      expect(state.isDesktop).toBe(true);
      expect(state.columns).toBe(3);
      expect(state.horizontalMargin).toBe(64);
      expect(state.contentMaxWidth).toBe(1200);

      dimensionsSpy.mockRestore();
    });
  });
});
