import React, { useLayoutEffect, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { View, StyleSheet, ModalProps, StyleProp, ViewStyle } from 'react-native';
import { motion } from '../../theme/motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface AccessibleModalProps extends ModalProps {
  visible: boolean;
  onClose: () => void;
  initialFocusRef?: React.RefObject<any>;
  returnFocusRef?: React.RefObject<any>;
  accessibilityLabel?: string;
  contentStyle?: StyleProp<ViewStyle>;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  visible,
  onClose,
  initialFocusRef,
  returnFocusRef,
  accessibilityLabel,
  contentStyle,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setExiting(false);
      return;
    }
    setExiting(true);
    if (prefersReducedMotion) {
      setMounted(false);
      setExiting(false);
      return;
    }
    const timeout = setTimeout(() => {
      setMounted(false);
      setExiting(false);
    }, motion.durations.modalExit);
    return () => clearTimeout(timeout);
  }, [prefersReducedMotion, visible]);

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return;

    if (visible && mounted && !exiting) {
      if (document.activeElement instanceof HTMLElement) {
        previousActiveElementRef.current = document.activeElement;
        document.activeElement.blur();
      }

      const focusTimer = setTimeout(() => {
        if (initialFocusRef?.current) {
          const node = (initialFocusRef.current as any)?.node || initialFocusRef.current;
          if (node && typeof node.focus === 'function') {
            node.focus();
            return;
          }
        }
        if (containerRef.current) {
          const firstFocusable = containerRef.current.querySelector<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (firstFocusable && typeof firstFocusable.focus === 'function') {
            firstFocusable.focus();
          } else {
            containerRef.current.focus();
          }
        }
      }, 0);

      return () => {
        clearTimeout(focusTimer);
      };
    }
  }, [exiting, initialFocusRef, mounted, returnFocusRef, visible]);

  useEffect(() => {
    if (mounted || !previousActiveElementRef.current) return;
    const targetToRestore = returnFocusRef?.current || previousActiveElementRef.current;
    const node = (targetToRestore as any)?.node || targetToRestore;
    if (node && typeof node.focus === 'function') setTimeout(() => node.focus(), 0);
    previousActiveElementRef.current = null;
  }, [mounted, returnFocusRef]);

  useEffect(() => {
    if (!mounted || typeof document === 'undefined') return;
    const rootNode = document.getElementById('root') || document.querySelector('[data-testid="root"]') || document.body.firstElementChild;
    if (rootNode && rootNode !== containerRef.current) {
      rootNode.setAttribute('aria-hidden', 'true');
      if ('inert' in rootNode) (rootNode as any).inert = true;
    }
    return () => {
      if (rootNode) {
        rootNode.removeAttribute('aria-hidden');
        if ('inert' in rootNode) (rootNode as any).inert = false;
      }
    };
  }, [mounted]);

  useEffect(() => {
    if (visible || typeof document === 'undefined') return;
    const rootNode = document.getElementById('root') || document.querySelector('[data-testid="root"]') || document.body.firstElementChild;
    // aria-hidden may be released as soon as close is requested; inert remains
    // owned by the mounted modal until the exit fallback completes.
    rootNode?.removeAttribute('aria-hidden');
  }, [visible]);

  useEffect(() => {
    if (!mounted || typeof document === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
        return;
      }

      if (exiting && e.key === 'Tab') {
        e.preventDefault();
        containerRef.current?.focus();
        return;
      }

      if (e.key === 'Tab' && containerRef.current) {
        const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) {
          e.preventDefault();
          containerRef.current.focus();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || document.activeElement === containerRef.current) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [exiting, mounted, onClose]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={accessibilityLabel || 'Janela modal'}
      aria-hidden={exiting ? undefined : false}
      tabIndex={-1}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        outline: 'none',
        opacity: exiting ? 0 : 1,
        transform: exiting ? 'translateY(8px)' : 'translateY(0)',
        transition: `opacity ${motion.durations.modalExit}ms ${motion.easings.easeOutCss}, transform ${motion.durations.modalExit}ms ${motion.easings.easeOutCss}`,
        pointerEvents: exiting ? 'none' : 'auto',
      }}
    >
      <View style={[styles.fullScreen, contentStyle]}>
        {children}
      </View>
    </div>,
    document.body
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
});
