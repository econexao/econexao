import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { radii } from './radii';
import { shadows } from './shadows';
import { motion } from './motion';

export const theme = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  motion,
};

export type Theme = typeof theme;
export { motion } from './motion';
export type { MotionTheme } from './motion';
export { useAppTheme } from './useAppTheme';

