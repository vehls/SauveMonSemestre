'use client';

import type { SemesterAverageRange, ValidationStatus } from '@/types/calculator';
import { ProgressGauge } from './ProgressGauge';

interface ResultsBarProps {
  generalAverage: number | null;
  averageRange?: SemesterAverageRange | null;
  targetAverage: number;
  onTargetChange: (value: number) => void;
  status: ValidationStatus;
}

const STATUS_STYLES: Record<ValidationStatus, string> = {
  'À simuler': 'bg-slate-100 text-slate-500',
  'En cours': 'bg-status-info-50 text-status-info-700',
  Validé: 'bg-status-ok-50 text-status-ok-700',
  Compensé: 'bg-status-warn-50 text-status-warn-700',
  'Non validé': 'bg-status-danger-50 text-status-danger-700',
};

/**
 * Note cible saisie : une chaîne vide ou non convertible en nombre fini
 * retombe sur `10` (valeur par défaut), jamais `NaN`. Une valeur finie
 * mais hors de l'échelle est ramenée dans `[0, 20]` plutôt que rejetée en
 * bloc, pour rester tolérant à une frappe ou un collage imprécis.
 */
function sanitizeTargetAverage(raw: string): number {
  const parsed = Number(raw);
  if (raw === '' || !Number.isFinite(parsed)) {
    return 10;
  }
  return Math.min(20, Math.max(0, parsed));
}

/**
 * Barre de résultats sticky : reste visible en haut de la zone de contenu
 * pendant le défilement (comme un sous-en-tête d'application SaaS). Ligne
 * unique et slim : moyenne + jauge, note cible, statut. Le détail de la
 * note minimale à viser (une carte par matière en attente) vit désormais
 * juste sous cette barre, dans SemesterSimulator.
 */
export function ResultsBar({
  generalAverage,
  averageRange = null,
  targetAverage,
  onTargetChange,
  status,
}: ResultsBarProps) {
  return (
    <div className="sticky top-[7.5rem] z-30 flex flex-col items-stretch gap-3 rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-float backdrop-blur-md sm:top-3 sm:gap-2 sm:px-5 sm:py-3.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
        <div className="sm:min-w-[220px] sm:flex-1">
          <ProgressGauge average={generalAverage} range={averageRange} targetAverage={targetAverage} />
        </div>

        <div className="flex items-center justify-between gap-3 sm:contents">
          <div className="flex items-center gap-1.5">
            <label htmlFor="target-average" className="text-xs font-medium text-slate-500">
              Note cible
            </label>
            <input
              id="target-average"
              type="number"
              inputMode="decimal"
              min={0}
              max={20}
              step={0.25}
              value={targetAverage}
              onChange={(event) => onTargetChange(sanitizeTargetAverage(event.target.value))}
              className="field w-16 font-medium"
            />
            <span className="text-xs text-slate-400">/20</span>
          </div>

          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}>
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}
