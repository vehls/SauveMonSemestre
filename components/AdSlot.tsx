'use client';

import { useEffect, useRef } from 'react';
import { isAdsenseEnabled } from '@/lib/ads';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export type AdPlacement = 'sidebar' | 'mobile-bottom';

/**
 * Correspondance emplacement -> variable d'environnement contenant l'ID du
 * bloc AdSense (`data-ad-slot`). Sans identifiant éditeur, l'emplacement
 * n'est pas rendu. Si l'éditeur est configuré mais pas le slot, une zone
 * réservée neutre est affichée (aucune requête publicitaire n'est faite).
 */
const SLOT_ENV_VARS: Record<AdPlacement, string | undefined> = {
  sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR,
  'mobile-bottom': process.env.NEXT_PUBLIC_ADSENSE_SLOT_MOBILE,
};

interface AdSlotProps {
  placement: AdPlacement;
  /** Hauteur minimale réservée (en px), pour éviter tout saut de layout (CLS). */
  minHeight: number;
  className?: string;
}

/**
 * Emplacement publicitaire Google AdSense.
 *
 * - Sans `NEXT_PUBLIC_ADSENSE_CLIENT_ID`, ne rend rien.
 * - Si l'identifiant éditeur et le slot correspondant à `placement` sont
 *   configurés, affiche un vrai bloc `<ins class="adsbygoogle">` et
 *   déclenche son chargement.
 * - Si l'éditeur est configuré mais pas le slot, affiche une zone réservée
 *   ("Espace publicitaire") pour garder la place du bloc.
 */
export function AdSlot({ placement, minHeight, className = '' }: AdSlotProps) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim();
  const slot = SLOT_ENV_VARS[placement];
  const insRef = useRef<HTMLModElement>(null);
  const hasRequestedAd = useRef(false);

  useEffect(() => {
    if (!clientId || !slot || hasRequestedAd.current) {
      return;
    }
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      hasRequestedAd.current = true;
    } catch (error) {
      console.warn("AdSense : impossible d'initialiser le bloc publicitaire", error);
    }
  }, [clientId, slot]);

  if (!isAdsenseEnabled()) {
    return null;
  }

  if (!slot) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-400 ${className}`}
        style={{ minHeight }}
        aria-hidden="true"
      >
        Espace publicitaire
      </div>
    );
  }

  return (
    <div className={className} style={{ minHeight }}>
      <span className="mb-1 block text-center text-xs uppercase tracking-wide text-slate-400">
        Publicité
      </span>
      <ins
        ref={insRef}
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
