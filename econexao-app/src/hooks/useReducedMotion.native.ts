import { useState, useEffect, useRef } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Hook para detectar e reagir à preferência de movimento reduzido no ambiente Nativo (Android/iOS).
 * Utiliza AccessibilityInfo.isReduceMotionEnabled() e listener de reduceMotionChanged com cleanup.
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Consulta assíncrona inicial
    if (typeof AccessibilityInfo?.isReduceMotionEnabled === 'function') {
      AccessibilityInfo.isReduceMotionEnabled()
        .then((enabled) => {
          if (isMountedRef.current) {
            setPrefersReducedMotion(Boolean(enabled));
          }
        })
        .catch(() => {
          // Fallback seguro em caso de erro no bridge nativo
        });
    }

    const handleChange = (enabled: boolean) => {
      if (isMountedRef.current) {
        setPrefersReducedMotion(Boolean(enabled));
      }
    };

    let subscription: { remove: () => void } | null = null;
    if (typeof AccessibilityInfo?.addEventListener === 'function') {
      try {
        subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', handleChange) as any;
      } catch {
        // Fallback para assinaturas legadas
      }
    }

    return () => {
      isMountedRef.current = false;
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      } else if (typeof (AccessibilityInfo as any)?.removeEventListener === 'function') {
        try {
          (AccessibilityInfo as any).removeEventListener('reduceMotionChanged', handleChange);
        } catch {
          // Silencioso em cleanup
        }
      }
    };
  }, []);

  return prefersReducedMotion;
}
