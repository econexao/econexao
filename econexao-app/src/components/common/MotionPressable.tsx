import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  Animated,
  StyleProp,
  ViewStyle,
  Platform,
  GestureResponderEvent,
} from 'react-native';
import { motion } from '../../theme/motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface MotionPressableProps extends Omit<TouchableOpacityProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  scalePressed?: number;
  pressInDuration?: number;
  pressOutDuration?: number;
  disabled?: boolean;
}

/**
 * Componente Pressable interativo com feedback de escala e toque suave baseado nos tokens de motion.
 * - Quando pressionado: escala 1.0 -> 0.98 (100 ms, ease-out)
 * - Ao soltar: escala 0.98 -> 1.0 (140 ms, ease-out)
 * - Em movimento reduzido: mantém escala 1.0 estática e sem atraso (A1/A2/A3/A6)
 * - Preserva compatibilidade e semântica de acessibilidade de TouchableOpacity.
 */
export const MotionPressable: React.FC<MotionPressableProps> = ({
  children,
  style,
  scalePressed = motion.transforms.pressScale,
  pressInDuration = motion.durations.pressIn,
  pressOutDuration = motion.durations.pressOut,
  disabled = false,
  activeOpacity = 0.85,
  onPressIn,
  onPressOut,
  ...restProps
}) => {
  const prefersReducedMotion = useReducedMotion();
  const scaleAnim = useRef<Animated.Value>(new Animated.Value(1)).current;
  const isMountedRef = useRef<boolean>(true);
  const activeAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (activeAnimRef.current) {
        activeAnimRef.current.stop();
        activeAnimRef.current = null;
      }
    };
  }, []);

  // Se a preferência mudar para reduced motion durante interação, força escala 1 imediatamente
  useEffect(() => {
    if (prefersReducedMotion) {
      if (activeAnimRef.current) {
        activeAnimRef.current.stop();
        activeAnimRef.current = null;
      }
      scaleAnim.setValue(1);
    }
  }, [prefersReducedMotion, scaleAnim]);

  const handlePressIn = (event: GestureResponderEvent) => {
    if (!disabled && !prefersReducedMotion) {
      if (activeAnimRef.current) {
        activeAnimRef.current.stop();
      }
      const anim = Animated.timing(scaleAnim, {
        toValue: scalePressed,
        duration: pressInDuration,
        easing: motion.easings.easeOut as any,
        useNativeDriver: Platform.OS !== 'web',
      });
      activeAnimRef.current = anim;
      anim.start(() => {
        if (isMountedRef.current) {
          activeAnimRef.current = null;
        }
      });
    }
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    if (!disabled && !prefersReducedMotion) {
      if (activeAnimRef.current) {
        activeAnimRef.current.stop();
      }
      const anim = Animated.timing(scaleAnim, {
        toValue: 1,
        duration: pressOutDuration,
        easing: motion.easings.easeOut as any,
        useNativeDriver: Platform.OS !== 'web',
      });
      activeAnimRef.current = anim;
      anim.start(() => {
        if (isMountedRef.current) {
          activeAnimRef.current = null;
        }
      });
    } else if (prefersReducedMotion) {
      scaleAnim.setValue(1);
    }
    onPressOut?.(event);
  };

  const animatedStyle: ViewStyle = prefersReducedMotion
    ? {}
    : {
        transform: [{ scale: scaleAnim as any }],
      };

  return (
    <TouchableOpacity
      disabled={disabled}
      activeOpacity={prefersReducedMotion ? 1 : activeOpacity}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...restProps}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children as any}
      </Animated.View>
    </TouchableOpacity>
  );
};
