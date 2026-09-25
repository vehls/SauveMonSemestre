'use client';

import { AdSlot } from './AdSlot';

/**
 * Bannière publicitaire fixe en bas d'écran, réservée au mobile
 * (`lg:hidden`). Format "ancre" discret (hauteur réduite, non intrusif) :
 * le contenu de la page prévoit un padding-bottom pour ne jamais passer
 * dessous (voir `app/page.tsx`).
 */
export function MobileAdBanner() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden">
      <AdSlot placement="mobile-bottom" minHeight={50} className="mx-auto max-w-md" />
    </div>
  );
}
