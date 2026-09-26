'use client';

import type { ToastState } from '@/hooks/useToast';
import { isAdsenseEnabled } from '@/lib/ads';
import { Alert, Check, Info } from './icons';

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
 * Notification "toast" flottante, positionnée en bas de l'écran. Quand la
 * bannière publicitaire mobile est montée, elle remonte au-dessus ; sinon
 * elle reste en `bottom-5`.
 */
export function Toast({ toast }: ToastProps) {
  if (!toast) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`animate-toast-in fixed left-1/2 z-50 flex max-w-[min(24rem,calc(100%-2rem))] -translate-x-1/2 items-center gap-2 rounded-xl bg-white/80 px-4 py-2.5 text-sm font-medium shadow-float backdrop-blur-md ${
        isAdsenseEnabled()
          ? 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:bottom-5'
          : 'bottom-5'
      } ${VARIANT_STYLES[toast.variant]}`}
    >
      {toast.variant === 'success' && <Check className="shrink-0" />}
      {toast.variant === 'error' && <Alert className="shrink-0" />}
      {toast.variant === 'info' && <Info className="shrink-0" />}
      <span>{toast.message}</span>
    </div>
  );
}
