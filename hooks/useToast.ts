'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastState {
  message: string;
  variant: ToastVariant;
}

const DEFAULT_DURATION_MS = 3000;

/**
 * Hook minimaliste de notification "toast" : un seul message affiché à la
 * fois, qui disparaît automatiquement après `durationMs`.
 *
 * Chaque composant qui appelle `useToast()` a sa propre instance de toast ;
 * c'est volontairement simple (pas de contexte global) puisqu'un seul
 * endroit de l'UI en a besoin pour l'instant.
 */
export function useToast(durationMs: number = DEFAULT_DURATION_MS) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setToast({ message, variant });
      timeoutRef.current = setTimeout(() => setToast(null), durationMs);
    },
    [durationMs],
  );

  return { toast, showToast };
}
