import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion as useWebReducedMotion } from './useReducedMotion.web';
import { useReducedMotion as useNativeReducedMotion } from './useReducedMotion.native';
import { useReducedMotion } from './useReducedMotion';

describe('useReducedMotion Hook (ECO-2701)', () => {
  const originalMatchMedia = typeof window !== 'undefined' ? window.matchMedia : undefined;

  afterEach(() => {
    if (typeof window !== 'undefined') {
      window.matchMedia = originalMatchMedia as any;
    }
    jest.restoreAllMocks();
  });

  describe('Web Implementation (useReducedMotion.web)', () => {
    it('returns false when matchMedia reports matches: false', () => {
      let state: boolean | null = null;
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const Consumer = () => {
        state = useWebReducedMotion();
        return null;
      };

      act(() => {
        renderer.create(<Consumer />);
      });

      expect(state).toBe(false);
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });

    it('returns true when matchMedia reports matches: true', () => {
      let state: boolean | null = null;
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const Consumer = () => {
        state = useWebReducedMotion();
        return null;
      };

      act(() => {
        renderer.create(<Consumer />);
      });

      expect(state).toBe(true);
    });

    it('updates dynamically on runtime change and cleans up listeners on unmount', () => {
      let state: boolean | null = null;
      let changeHandler: ((e: any) => void) | null = null;
      const removeEventListenerMock = jest.fn();

      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn((event, handler) => {
          if (event === 'change') changeHandler = handler;
        }),
        removeEventListener: removeEventListenerMock,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const Consumer = () => {
        state = useWebReducedMotion();
        return null;
      };

      let component: any;
      act(() => {
        component = renderer.create(<Consumer />);
      });

      expect(state).toBe(false);

      // Simula alteração no sistema operacional em runtime
      act(() => {
        if (changeHandler) {
          changeHandler({ matches: true });
        }
      });
      expect(state).toBe(true);

      // Unmount deve remover o listener
      act(() => {
        component.unmount();
      });
      expect(removeEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  describe('Native Implementation (useReducedMotion.native)', () => {
    it('queries AccessibilityInfo.isReduceMotionEnabled and sets state', async () => {
      let state: boolean | null = null;
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
      const removeSubMock = jest.fn();
      jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove: removeSubMock } as any);

      const Consumer = () => {
        state = useNativeReducedMotion();
        return null;
      };

      await act(async () => {
        renderer.create(<Consumer />);
      });

      expect(state).toBe(true);
    });

    it('updates dynamically on reduceMotionChanged event and cleans up subscription on unmount', async () => {
      let state: boolean | null = null;
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
      let listenerHandler: ((enabled: boolean) => void) | null = null;
      const removeSubMock = jest.fn();

      jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((event: string, handler: any) => {
        if (event === 'reduceMotionChanged') {
          listenerHandler = handler;
        }
        return { remove: removeSubMock } as any;
      });

      const Consumer = () => {
        state = useNativeReducedMotion();
        return null;
      };

      let component: any;
      await act(async () => {
        component = renderer.create(<Consumer />);
      });

      expect(state).toBe(false);

      // Simula evento nativo em runtime
      act(() => {
        if (listenerHandler) {
          listenerHandler(true);
        }
      });
      expect(state).toBe(true);

      act(() => {
        component.unmount();
      });
      expect(removeSubMock).toHaveBeenCalled();
    });
  });

  describe('Unified Hook (useReducedMotion)', () => {
    it('returns a boolean safely without throwing', () => {
      let state: boolean | null = null;
      const Consumer = () => {
        state = useReducedMotion();
        return null;
      };

      act(() => {
        renderer.create(<Consumer />);
      });

      expect(typeof state).toBe('boolean');
    });
  });
});
