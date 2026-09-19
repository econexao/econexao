import { useState, useEffect } from 'react';

/**
 * Hook para detectar e reagir à preferência de movimento reduzido no ambiente Web.
 * Utiliza matchMedia('(prefers-reduced-motion: reduce)') com suporte a alteração em runtime e cleanup.
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      try {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      } catch {
        return false;
      }
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    let mediaQueryList: MediaQueryList | null = null;
    try {
      mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
    } catch {
      return;
    }

    if (!mediaQueryList) return;

    // Atualiza o estado síncrono com o valor atual da media query
    setPrefersReducedMotion(mediaQueryList.matches);

    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setPrefersReducedMotion(event.matches);
    };

    if (typeof mediaQueryList.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', handleChange);
    } else if (typeof (mediaQueryList as any).addListener === 'function') {
      (mediaQueryList as any).addListener(handleChange);
    }

    return () => {
      if (!mediaQueryList) return;
      if (typeof mediaQueryList.removeEventListener === 'function') {
        mediaQueryList.removeEventListener('change', handleChange);
      } else if (typeof (mediaQueryList as any).removeListener === 'function') {
        (mediaQueryList as any).removeListener(handleChange);
      }
    };
  }, []);

  return prefersReducedMotion;
}
