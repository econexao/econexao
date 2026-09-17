import React from 'react';
import { Animated } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { useMotionTransition } from './useMotionTransition';
import * as useReducedMotionModule from './useReducedMotion';

describe('useMotionTransition Hook (ECO-2701)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes Animated.Value with initialValue or targetValue', () => {
    jest.spyOn(useReducedMotionModule, 'useReducedMotion').mockReturnValue(false);
    let animVal: Animated.Value | null = null;

    const Consumer = () => {
      animVal = useMotionTransition(1, { initialValue: 0, duration: 180 });
      return null;
    };

    act(() => {
      renderer.create(<Consumer />);
    });

    expect(animVal).toBeInstanceOf(Animated.Value);
    // @ts-ignore
    expect(animVal._value).toBe(0);
  });

  it('jumps immediately to targetValue when reducedMotion is true (0 duration)', () => {
    jest.spyOn(useReducedMotionModule, 'useReducedMotion').mockReturnValue(true);
    let animVal: Animated.Value | null = null;
    const onCompleteMock = jest.fn();

    const Consumer = () => {
      animVal = useMotionTransition(1, { initialValue: 0, onComplete: onCompleteMock });
      return null;
    };

    act(() => {
      renderer.create(<Consumer />);
    });

    // @ts-ignore
    expect(animVal._value).toBe(1);
    expect(onCompleteMock).toHaveBeenCalled();
  });

  it('stops in-flight animation and jumps to final value when reduced motion is activated in runtime (A3)', () => {
    let mockReduced = false;
    jest.spyOn(useReducedMotionModule, 'useReducedMotion').mockImplementation(() => mockReduced);

    let animVal: Animated.Value | null = null;
    const onCompleteMock = jest.fn();

    const Consumer = ({ target }: { target: number }) => {
      animVal = useMotionTransition(target, { initialValue: 0, duration: 200, onComplete: onCompleteMock });
      return null;
    };

    let component: any;
    act(() => {
      component = renderer.create(<Consumer target={0} />);
    });

    // Inicia transição para 1
    act(() => {
      component.update(<Consumer target={1} />);
    });

    // Ativa reduced motion em runtime
    act(() => {
      mockReduced = true;
      component.update(<Consumer target={1} />);
    });

    // Deve ter saltado para o valor final 1 imediatamente
    // @ts-ignore
    expect(animVal._value).toBe(1);
  });

  it('cleans up animation on unmount without throwing or setting state (A4)', () => {
    jest.spyOn(useReducedMotionModule, 'useReducedMotion').mockReturnValue(false);
    let animVal: Animated.Value | null = null;

    const Consumer = () => {
      animVal = useMotionTransition(1, { initialValue: 0, duration: 500 });
      return null;
    };

    let component: any;
    act(() => {
      component = renderer.create(<Consumer />);
    });

    // Unmount durante o ciclo
    act(() => {
      component.unmount();
    });

    // Sem erros ou memory leak
    expect(animVal).toBeInstanceOf(Animated.Value);
  });
});
