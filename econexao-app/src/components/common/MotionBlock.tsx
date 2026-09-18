import React, { useRef, useEffect } from 'react';
import { Animated, StyleProp, ViewStyle, Platform } from 'react-native';
import { motion } from '../../theme/motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface MotionBlockProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  staggerIndex?: number;
  duration?: number;
  initialTranslateY?: number;
}

/**
 * Container de bloco com animação de entrada suave (fade + slide-up curto)
 * - Entrada: opacity 0 -> 1, translateY 8 -> 0 px em 180 ms (curva cubic-bezier(0.2, 0, 0, 1))
 * - Sequência opcional: staggerIndex * 35 ms (limite total 300 ms)
 * - Em movimento reduzido: renderiza estado final estático (opacity 1, translateY 0) imediatamente (A1/A2/A3/A6)
 * - Cancelamento seguro e cleanup no unmount (A3/A4)
 */
export const MotionBlock: React.FC<MotionBlockProps> = ({
  children,
  style,
  staggerIndex,
  duration = motion.durations.blockEnter,
  initialTranslateY = motion.transforms.blockEnterTranslateY,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const isMountedRef = useRef<boolean>(true);
  const animValue = useRef<Animated.Value>(new Animated.Value(prefersReducedMotion ? 1 : 0)).current;
  const activeAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      if (activeAnimRef.current) {
        activeAnimRef.current.stop();
        activeAnimRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Se movimento reduzido estiver ativado ou ativado durante a transição
    if (prefersReducedMotion) {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      if (activeAnimRef.current) {
        activeAnimRef.current.stop();
        activeAnimRef.current = null;
      }
      animValue.setValue(1);
      return;
    }

    const delay = typeof staggerIndex === 'number'
      ? Math.min(staggerIndex * motion.intervals.sequenceStagger, motion.durations.sequenceMaxTotal)
      : 0;

    const startTransition = () => {
      if (!isMountedRef.current) return;
      const anim = Animated.timing(animValue, {
        toValue: 1,
        duration,
        easing: motion.easings.enterBlock as any,
        useNativeDriver: Platform.OS !== 'web',
      });
      activeAnimRef.current = anim;
      anim.start(() => {
        if (isMountedRef.current) {
          activeAnimRef.current = null;
        }
      });
    };

    if (delay > 0) {
      timeoutIdRef.current = setTimeout(startTransition, delay);
    } else {
      startTransition();
    }

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      if (activeAnimRef.current) {
        activeAnimRef.current.stop();
        activeAnimRef.current = null;
      }
    };
  }, [prefersReducedMotion, staggerIndex, duration]);

  // Keep content perceptible and focusable during the entrance; never hide a
  // live interactive block with opacity: 0 while waiting for its animation.
  const opacity = animValue.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] });
  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [initialTranslateY, 0],
  });

  const animatedStyle: ViewStyle = prefersReducedMotion
    ? { opacity: 1, transform: [{ translateY: 0 }] }
    : {
        opacity: opacity as any,
        transform: [{ translateY: translateY as any }],
      };

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};
