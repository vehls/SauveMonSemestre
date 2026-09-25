'use client';

import type { ToastState } from '@/hooks/useToast';
import { Alert, Check } from './icons';

interface ToastProps {
  toast: ToastState | null;
}

// Fond commun "flottant" (blanc translucide + flou) pour les trois variantes
// : la couleur se lit désormais sur le texte et l'icône, pas sur un aplat
// plein, pour rester cohérent avec le fond blanc/flou de shadow-float.
const VARIANT_STYLES: Record<ToastState['variant'], string> = {
  success: 'text-emerald-700',
  error: 'text-rose-700',
  info: 'text-slate-700',
};

/**
 * Notification "toast" flottante, positionnée en bas de l'écran. Sous `lg`,
 * elle remonte au-dessus de la bannière publicitaire mobile fixe
 * (`bottom-[calc(4.5rem+env(safe-area-inset-bottom))]`) ; à partir de `lg`
 * (bannière absente), elle reprend sa position classique (`bottom-5`).
 */
export function Toast({ toast }: ToastProps) {
  if (!toast) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`animate-toast-in fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-50 flex max-w-[min(24rem,calc(100%-2rem))] -translate-x-1/2 items-center gap-2 rounded-xl bg-white/80 px-4 py-2.5 text-sm font-medium shadow-float backdrop-blur-md lg:bottom-5 ${VARIANT_STYLES[toast.variant]}`}
    >
      {toast.variant === 'success' && <Check className="shrink-0" />}
      {toast.variant === 'error' && <Alert className="shrink-0" />}
      {toast.variant === 'info' && (
        <span aria-hidden="true" className="shrink-0">
          ℹ️
        </span>
      )}
      <span>{toast.message}</span>
    </div>
  );
}
