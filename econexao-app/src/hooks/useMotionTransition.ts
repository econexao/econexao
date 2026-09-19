import { useRef, useEffect } from 'react';
import { Animated, Platform } from 'react-native';
import { motion } from '../theme/motion';
import { useReducedMotion } from './useReducedMotion';

export interface UseMotionTransitionConfig {
  initialValue?: number;
  duration?: number;
  easing?: (value: number) => number;
  useNativeDriver?: boolean;
  reducedValue?: number;
  onComplete?: () => void;
}

/**
 * Hook para gerenciar transições suaves via Animated.Value com suporte a:
 * - Cancelamento e salto imediato quando a preferência do usuário mudar para movimento reduzido (A3)
 * - Cleanup e cancelamento de timers/callbacks no unmount (A4)
 * - Integração direta com tokens de motion (A1)
 */
export function useMotionTransition(
  targetValue: number,
  config?: UseMotionTransitionConfig
): Animated.Value {
  const prefersReducedMotion = useReducedMotion();
  const initial = config?.initialValue ?? targetValue;
  const animValueRef = useRef<Animated.Value>(new Animated.Value(initial));
  const activeAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const prevTargetRef = useRef<number>(initial);
  const prevReducedRef = useRef<boolean>(prefersReducedMotion);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (activeAnimationRef.current) {
        activeAnimationRef.current.stop();
        activeAnimationRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const finalValue = prefersReducedMotion ? (config?.reducedValue ?? targetValue) : targetValue;

    // Se movimento reduzido estiver ativado
    if (prefersReducedMotion) {
      if (activeAnimationRef.current) {
        activeAnimationRef.current.stop();
        activeAnimationRef.current = null;
      }
      animValueRef.current.setValue(finalValue);
      prevTargetRef.current = finalValue;
      prevReducedRef.current = true;
      if (config?.onComplete && isMountedRef.current) {
        config.onComplete();
      }
      return;
    }

    // Se acabou de transitar de reduced para normal ou se targetValue mudou
    const targetChanged = prevTargetRef.current !== targetValue;
    const reducedChanged = prevReducedRef.current !== prefersReducedMotion;

    if (!targetChanged && !reducedChanged) {
      return;
    }

    prevTargetRef.current = targetValue;
    prevReducedRef.current = prefersReducedMotion;

    if (activeAnimationRef.current) {
      activeAnimationRef.current.stop();
      activeAnimationRef.current = null;
    }

    const duration = config?.duration ?? motion.durations.blockEnter;
    const easing = config?.easing ?? (motion.easings.easeOut as any);
    const useNativeDriver = config?.useNativeDriver ?? (Platform.OS !== 'web');

    const animation = Animated.timing(animValueRef.current, {
      toValue: targetValue,
      duration,
      easing,
      useNativeDriver,
    });

    activeAnimationRef.current = animation;

    animation.start(({ finished }) => {
      if (isMountedRef.current) {
        activeAnimationRef.current = null;
        if (finished && config?.onComplete) {
          config.onComplete();
        }
      }
    });

    return () => {
      if (activeAnimationRef.current) {
        activeAnimationRef.current.stop();
        activeAnimationRef.current = null;
      }
    };
  }, [targetValue, prefersReducedMotion, config?.duration, config?.easing, config?.useNativeDriver, config?.reducedValue]);

  return animValueRef.current;
}
