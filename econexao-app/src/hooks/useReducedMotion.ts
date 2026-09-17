import { Platform } from 'react-native';
import { useReducedMotion as useWebReducedMotion } from './useReducedMotion.web';
import { useReducedMotion as useNativeReducedMotion } from './useReducedMotion.native';

/**
 * Hook unificado de detecção e observação da preferência de movimento reduzido.
 * Seleciona automaticamente a implementação adequada à plataforma (Web ou Native).
 */
export function useReducedMotion(): boolean {
  if (Platform.OS === 'web' || typeof window !== 'undefined') {
    return useWebReducedMotion();
  }
  return useNativeReducedMotion();
}
