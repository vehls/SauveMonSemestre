'use client';

import type { SharedGrid } from '@/types/share';
import { Link } from './icons';

interface ImportGridBannerProps {
  grid: SharedGrid;
  onAccept: () => void;
  onDismiss: () => void;
}

/**
 * Bandeau affiché lorsqu'une grille partagée est détectée dans l'URL
 * (`?grid=...`). Propose de la charger (en remplaçant la grille actuelle)
 * ou de l'ignorer.
 */
export function ImportGridBanner({ grid, onAccept, onDismiss }: ImportGridBannerProps) {
  const ueCount = grid.ues.length;
  const ecCount = grid.ues.reduce((sum, ue) => sum + ue.ecs.length, 0);
  const promoName = grid.semesterName || 'ta promo';

  return (
    <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-rest">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="flex min-w-0 items-center gap-2 break-words text-lg font-bold text-amber-900">
            <Link /> Grille de {promoName} reçue
          </h2>
          <p className="mt-1 min-w-0 break-words text-sm text-amber-800">
            {ueCount} UE, {ecCount} matière{ecCount > 1 ? 's' : ''}. La charger remplace ta grille
            actuelle. Aucune note n&apos;a voyagé avec le lien.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onAccept}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-amber-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy-500/25"
          >
            Utiliser cette grille
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100"
          >
            Garder la mienne
          </button>
        </div>
      </div>
    </section>
  );
}
