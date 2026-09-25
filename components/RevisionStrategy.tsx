'use client';

import type { RevisionAdvice } from '@/types/calculator';
import { Target } from './icons';

interface RevisionStrategyProps {
  advice: RevisionAdvice[];
}

const CARD_STYLES: Record<RevisionAdvice['priority'], string> = {
  'Priorité Haute': 'border-coral-300 bg-coral-100/60',
  'Priorité normale': 'border-slate-200 bg-white',
};

const BADGE_STYLES: Record<RevisionAdvice['priority'], string> = {
  'Priorité Haute': 'bg-coral-600 text-white',
  'Priorité normale': 'bg-slate-100 text-slate-600',
};

/**
 * Module "Stratégie de révision" : encadré motivant qui met en avant, parmi
 * les matières sans note encore saisie, celles où réviser rapporte le plus
 * sur la moyenne générale du semestre.
 */
export function RevisionStrategy({ advice }: RevisionStrategyProps) {
  if (advice.length === 0) {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-premium">
        <h2 className="flex items-center gap-2 text-lg font-bold text-emerald-800">
          <Target /> Où réviser en premier
        </h2>
        <p className="mt-1 text-sm text-emerald-700">
          Toutes tes notes sont rentrées. Plus rien à préparer.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-coral-200 bg-gradient-to-br from-coral-50 to-white p-5 shadow-premium">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-coral-900">
          <Target /> Où réviser en premier
        </h2>
        <p className="text-sm text-coral-700">
          On classe tes exams encore en blanc par impact sur ta moyenne.
        </p>
      </div>

      <div className="space-y-3">
        {advice.map((item, index) => (
          <div
            key={item.ecId}
            className={`rounded-xl border p-4 transition-shadow hover:shadow-md ${CARD_STYLES[item.priority]}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2 break-words">
                <span className="shrink-0 text-sm font-bold text-slate-400">#{index + 1}</span>
                <span className="min-w-0 break-words font-semibold text-slate-800">{item.ecName}</span>
                <span className="min-w-0 break-words text-xs text-slate-500">({item.ueName})</span>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_STYLES[item.priority]}`}
              >
                {item.priority === 'Priorité Haute' && <span aria-hidden="true">🔥</span>}
                {item.priority}
              </span>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <p className="text-sm text-slate-700">
                <span aria-hidden="true">⚡</span>{' '}
                <span className="font-medium">+1 point</span> ici ={' '}
                <span className="font-semibold text-coral-700">
                  +{item.impactPerPoint.toFixed(2)}
                </span>{' '}
                sur ta moyenne.
              </p>
              <p className="text-sm text-slate-700">
                <span aria-hidden="true">💪</span>{' '}
                <span className="font-medium">+2 points</span> ⇒{' '}
                <span className="font-semibold text-coral-700">
                  +{item.gainPerTwoPoints.toFixed(2)}
                </span>{' '}
                points de moyenne.
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
