'use client';

interface ProgressGaugeProps {
  /** Moyenne générale du semestre sur 20 (`null` si aucune note connue). */
  average: number | null;
  /** Note cible affichée comme repère sur la jauge. */
  targetAverage: number;
}

/**
 * Couleur de la barre selon la moyenne :
 * - corail si < 10
 * - ambre si entre 10 et 11.99
 * - émeraude si >= 12
 */
function getBarColor(average: number | null): string {
  if (average === null) return 'bg-slate-300';
  if (average < 10) return 'bg-rose-400';
  if (average < 12) return 'bg-amber-400';
  return 'bg-emerald-500';
}

function getTextColor(average: number | null): string {
  if (average === null) return 'text-slate-400';
  if (average < 10) return 'text-rose-600';
  if (average < 12) return 'text-amber-600';
  return 'text-emerald-600';
}

/**
 * Jauge slim de la moyenne générale du semestre, pensée pour la barre de
 * résultats sticky : une seule ligne, avec un repère visuel (petit trait)
 * indiquant où se situe la note cible sur la barre.
 */
export function ProgressGauge({ average, targetAverage }: ProgressGaugeProps) {
  const percent = average === null ? 0 : Math.min(100, Math.max(0, (average / 20) * 100));
  const targetPercent = Math.min(100, Math.max(0, (targetAverage / 20) * 100));

  return (
    <div className="flex w-full items-center gap-3">
      <div className="relative flex-1">
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${getBarColor(average)}`}
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={average ?? 0}
            aria-valuemin={0}
            aria-valuemax={20}
            aria-label="Moyenne générale du semestre"
          />
        </div>
        <div
          className="absolute -top-1 h-0 w-0 -translate-x-1/2 border-l-[3px] border-r-[3px] border-t-[6px] border-l-transparent border-r-transparent border-t-navy-900/70"
          style={{ left: `${targetPercent}%` }}
          title={`Objectif : ${targetAverage}/20`}
        />
      </div>
      <div className="flex flex-wrap items-baseline gap-1.5">
        <span className="font-sans text-xs font-medium text-slate-400">Moyenne</span>
        <span className={`font-display text-lg tabular-nums ${getTextColor(average)}`}>
          {average !== null ? `${average.toFixed(2)}/20` : '—/20'}
        </span>
      </div>
    </div>
  );
}
