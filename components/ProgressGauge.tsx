'use client';

import type { SemesterAverageRange } from '@/types/calculator';

interface ProgressGaugeProps {
  /** Chiffre unique du semestre complet (`null` s'il est incomplet ou vide). */
  average: number | null;
  /** Fourchette [plancher, plafond] d'un semestre incomplet. */
  range?: SemesterAverageRange | null;
  /** Note cible affichée comme repère sur la jauge. */
  targetAverage: number;
}

type GaugeTone = 'empty' | 'ok' | 'warn' | 'danger';

/**
 * Couleur selon la cible, jamais selon 10 ou 12 figés.
 * - émeraude : le plancher (ou le chiffre unique) atteint déjà la cible ;
 * - rose : même le plafond reste sous la cible ;
 * - ambre : la cible est encore dans la fourchette.
 */
function gaugeTone(floor: number | null, ceiling: number | null, targetAverage: number): GaugeTone {
  if (floor === null || ceiling === null) return 'empty';
  if (floor >= targetAverage) return 'ok';
  if (ceiling < targetAverage) return 'danger';
  return 'warn';
}

const BAR_COLOR: Record<GaugeTone, string> = {
  empty: 'bg-slate-300',
  ok: 'bg-status-ok-500',
  warn: 'bg-status-warn-500',
  danger: 'bg-status-danger-500',
};

const TEXT_COLOR: Record<GaugeTone, string> = {
  empty: 'text-slate-400',
  ok: 'text-status-ok-700',
  warn: 'text-status-warn-700',
  danger: 'text-status-danger-700',
};

function formatHundredth(value: number): string {
  return value.toFixed(2);
}

/**
 * Jauge slim de la moyenne du semestre, pensée pour la barre de résultats
 * sticky : une seule ligne, avec un repère visuel (petit trait) indiquant
 * où se situe la note cible. Semestre complet : un chiffre. Semestre
 * incomplet : la barre suit le plancher et le texte montre la fourchette.
 */
export function ProgressGauge({ average, range = null, targetAverage }: ProgressGaugeProps) {
  const hasRange = range !== null;
  const floor = hasRange ? range.floor : average;
  const ceiling = hasRange ? range.ceiling : average;
  const tone = gaugeTone(floor, ceiling, targetAverage);
  const percent = floor === null ? 0 : Math.min(100, Math.max(0, (floor / 20) * 100));
  const targetPercent = Math.min(100, Math.max(0, (targetAverage / 20) * 100));
  const valueLabel = hasRange
    ? `${formatHundredth(range.floor)}–${formatHundredth(range.ceiling)}`
    : average !== null
      ? `${formatHundredth(average)}/20`
      : '—/20';
  const valueText = hasRange
    ? `Fourchette de ${formatHundredth(range.floor)} à ${formatHundredth(range.ceiling)} sur 20`
    : average !== null
      ? `${formatHundredth(average)} sur 20`
      : 'Aucune moyenne';

  return (
    <div className="flex w-full items-center gap-3">
      <div className="relative flex-1">
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${BAR_COLOR[tone]}`}
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={floor ?? 0}
            aria-valuemin={0}
            aria-valuemax={20}
            aria-valuetext={valueText}
            aria-label={hasRange ? 'Fourchette de moyenne du semestre' : 'Moyenne générale du semestre'}
          />
        </div>
        <div
          className="absolute -top-1 h-0 w-0 -translate-x-1/2 border-l-[3px] border-r-[3px] border-t-[6px] border-l-transparent border-r-transparent border-t-navy-900/70"
          style={{ left: `${targetPercent}%` }}
          title={`Objectif : ${targetAverage}/20`}
        />
      </div>
      <div className="flex flex-wrap items-baseline gap-1.5">
        <span className="type-meta">Moyenne</span>
        <span className={`font-sans text-2xl font-semibold tabular-nums lining-nums leading-none ${TEXT_COLOR[tone]}`}>
          {valueLabel}
        </span>
      </div>
    </div>
  );
}
