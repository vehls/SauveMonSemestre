'use client';

import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_ELIMINATION_THRESHOLD,
  DEFAULT_VALIDATION_THRESHOLD,
  type EC,
  type UE,
  type UEResult,
} from '@/types/calculator';
import { generateId } from '@/lib/id';
import { sanitizeCoefficient, sanitizeGrade, sanitizeSimulatedGrade } from '@/lib/validation';
import { Plus, Sliders, Sparkles, X } from './icons';

interface UECardProps {
  ue: UE;
  /** Résultat calculé pour cette UE (moyenne, statut), fourni par le parent. */
  result?: UEResult;
  onChange: (updated: UE) => void;
  onRemove: () => void;
}

/**
 * Le badge ne reflète que des verdicts **verrouillés** (issue certaine
 * quel que soit le résultat des matières encore en attente de cette UE,
 * voir `UEResult`) : une moyenne partielle dont l'issue reste ouverte
 * affiche "En cours", jamais "Validée" ni "À compenser".
 */
function StatusBadge({ result }: { result?: UEResult }) {
  if (!result || result.average === null) {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
        Pas encore notée
      </span>
    );
  }
  if (result.isEliminatory) {
    return (
      <span className="rounded-full bg-status-danger-50 px-2 py-0.5 text-xs font-medium text-status-danger-700">
        Éliminatoire
      </span>
    );
  }
  if (result.isValidated) {
    return (
      <span className="rounded-full bg-status-ok-50 px-2 py-0.5 text-xs font-medium text-status-ok-700">
        Validée
      </span>
    );
  }
  if (result.needsCompensation) {
    return (
      <span className="rounded-full bg-status-warn-50 px-2 py-0.5 text-xs font-medium text-status-warn-700">
        À compenser
      </span>
    );
  }
  return (
    <span className="rounded-full bg-status-info-50 px-2 py-0.5 text-xs font-medium text-status-info-700">
      En cours
    </span>
  );
}

/**
 * Couleur de la bande d'accent (bord gauche) et du chiffre de moyenne :
 * reflète le même statut que le badge, pour un repérage visuel instantané
 * même quand la carte est repliée/scrollée hors du badge.
 */
function getAccentClassName(result?: UEResult): string {
  if (!result || result.average === null) return 'border-l-slate-200';
  if (result.isEliminatory) return 'border-l-status-danger-500';
  if (result.isValidated) return 'border-l-status-ok-500';
  if (result.needsCompensation) return 'border-l-status-warn-500';
  return 'border-l-status-info-500';
}

function getAverageTextClassName(result?: UEResult): string {
  if (!result || result.average === null) return 'text-slate-400';
  if (result.isEliminatory) return 'text-status-danger-700';
  if (result.isValidated) return 'text-status-ok-700';
  if (result.needsCompensation) return 'text-status-warn-700';
  return 'text-status-info-700';
}

/** Carte éditable représentant une UE et la liste de ses matières (EC). */
export function UECard({ ue, result, onChange, onRemove }: UECardProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsPanelRef = useRef<HTMLDivElement>(null);

  // `inert` n'est pas encore reconnu comme prop JSX par React 18 (support
  // natif seulement à partir de React 19) : la prop `inert={...}` serait
  // silencieusement ignorée. On synchronise donc la propriété DOM à la
  // main, pour retirer réellement le panneau replié du tabIndex et de
  // l'arbre d'accessibilité (sans quoi ses champs resteraient focusables
  // au clavier malgré une hauteur visuelle de 0).
  useEffect(() => {
    const panel = settingsPanelRef.current;
    if (panel) {
      panel.inert = !isSettingsOpen;
    }
  }, [isSettingsOpen]);

  const updateValidationThreshold = (raw: string) => {
    const parsed = Number(raw);
    onChange({
      ...ue,
      validationThreshold: raw === '' || !Number.isFinite(parsed) ? DEFAULT_VALIDATION_THRESHOLD : parsed,
    });
  };

  /**
   * Seuil d'élimination : optionnel. Vider le champ désactive explicitement
   * l'élimination pour cette UE (`null`), comme l'indique le texte d'aide
   * ("laisse vide pour désactiver") — ça n'écrit surtout pas `undefined`,
   * qui retomberait silencieusement sur le seuil par défaut (8) toujours
   * actif.
   */
  const updateEliminationThreshold = (raw: string) => {
    const parsed = Number(raw);
    onChange({ ...ue, eliminationThreshold: raw === '' || !Number.isFinite(parsed) ? null : parsed });
  };

  const updateEC = (ecId: string, patch: Partial<EC>) => {
    onChange({
      ...ue,
      ecs: ue.ecs.map((ec) => (ec.id === ecId ? { ...ec, ...patch } : ec)),
    });
  };

  const addEC = () => {
    const newEC: EC = {
      id: generateId('ec'),
      name: `Matière ${ue.ecs.length + 1}`,
      coefficient: 1,
      grade: null,
    };
    onChange({ ...ue, ecs: [...ue.ecs, newEC] });
  };

  const removeEC = (ecId: string) => {
    onChange({ ...ue, ecs: ue.ecs.filter((ec) => ec.id !== ecId) });
  };

  /**
   * Active/désactive le mode simulation pour un examen à venir. Uniquement
   * disponible tant qu'aucune note réelle n'a été saisie : une fois la note
   * réelle connue, elle prime et la simulation n'a plus de sens.
   */
  const toggleSimulation = (ec: EC) => {
    if (ec.grade !== null) return;
    if (ec.futureGrade) {
      updateEC(ec.id, { futureGrade: null });
    } else {
      updateEC(ec.id, { futureGrade: { mode: 'simulated', value: 10 } });
    }
  };

  // Bouton "+ Ajouter une matière" : partagé entre l'état vide (dans
  // l'encadré en pointillés) et la liste déjà peuplée (sous les cartes),
  // pour garder exactement le même style aux deux endroits.
  const addECButtonClassName =
    'mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-navy-300 hover:text-navy-700 sm:w-auto';

  const averageValue =
    result?.average !== null && result?.average !== undefined ? result.average.toFixed(2) : null;
  const averageTextClassName = getAverageTextClassName(result);
  const isProvisional = Boolean(result && !result.isComplete && result.average !== null);

  const iconButtonClassName =
    'flex min-h-11 min-w-11 items-center justify-center rounded-xl p-1.5 transition-colors';

  return (
    <div
      className={`animate-rise rounded-2xl border border-slate-200/70 bg-white p-5 shadow-premium border-l-4 ${getAccentClassName(
        result,
      )}`}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        {/* Ligne 1 (sous sm) : nom en pleine largeur. À partir de sm, le
            badge rejoint ce même bloc pour reformer la disposition
            d'origine (nom + badge à gauche). */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={ue.name}
            onChange={(e) => onChange({ ...ue, name: e.target.value })}
            className="type-card-title w-full rounded-lg border border-transparent bg-transparent px-1 py-1 shadow-none outline-none transition focus:border-slate-200 focus:bg-white focus:ring-4 focus:ring-navy-500/15 sm:w-auto"
            aria-label="Nom de l'UE"
          />
          <span className="hidden sm:inline-flex">
            <StatusBadge result={result} />
          </span>
        </div>

        {/* Ligne 2 (sous sm uniquement) : badge + moyenne alignés. Se
            masque à partir de sm, où le badge rejoint le nom et la
            moyenne rejoint le bloc actions ci-dessous. */}
        <div className="flex items-center gap-3 sm:hidden">
          <StatusBadge result={result} />
          {averageValue !== null && (
            <span className="inline-flex items-baseline gap-1.5">
              <span className={`font-sans text-sm font-semibold tabular-nums lining-nums ${averageTextClassName}`}>
                {averageValue}/20
              </span>
              {isProvisional && <span className="type-meta">provisoire</span>}
            </span>
          )}
        </div>

        {/* Ligne 3 (sous sm) / bloc droit (à partir de sm) : coeff,
            moyenne (desktop), réglages, supprimer. */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 text-sm text-slate-500">
            Coeff. UE
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              value={ue.coefficient}
              onChange={(e) => onChange({ ...ue, coefficient: sanitizeCoefficient(e.target.value) })}
              className="field w-16"
            />
          </label>
          {averageValue !== null && (
            <span className="hidden items-baseline gap-1.5 sm:inline-flex">
              <span className={`font-sans text-sm font-semibold tabular-nums lining-nums ${averageTextClassName}`}>
                {averageValue}/20
              </span>
              {isProvisional && <span className="type-meta">provisoire</span>}
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsSettingsOpen((prev) => !prev)}
            aria-pressed={isSettingsOpen}
            aria-label="Personnaliser les seuils de l'UE"
            title="Seuils de validation et d'élimination"
            className={`${iconButtonClassName} ${
              isSettingsOpen
                ? 'bg-navy-50 text-navy-600'
                : 'text-slate-400 hover:bg-navy-50 hover:text-navy-600'
            }`}
          >
            <Sliders />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className={`${iconButtonClassName} text-slate-400 hover:bg-rose-50 hover:text-rose-600`}
            aria-label="Supprimer l'UE"
            title="Supprimer l'UE"
          >
            <X />
          </button>
        </div>
      </div>

      {/* Panneau de seuils : toujours monté, animé via un truc CSS grid
          (grid-template-rows 0fr -> 1fr + overflow-hidden sur l'enfant),
          plutôt que d'apparaître/disparaître brutalement. Sans transition
          si prefers-reduced-motion (règle globale dans globals.css). */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          isSettingsOpen ? 'mb-4 grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden" ref={settingsPanelRef}>
          <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
              Seuil de validation
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={20}
                step={0.5}
                value={ue.validationThreshold ?? DEFAULT_VALIDATION_THRESHOLD}
                onChange={(e) => updateValidationThreshold(e.target.value)}
                className="field"
              />
              <span className="text-xs font-normal text-slate-400">
                Par défaut : {DEFAULT_VALIDATION_THRESHOLD}/20
              </span>
            </label>

            <div className="flex flex-col gap-1 text-xs font-medium text-slate-500">
              <span className="flex items-center justify-between">
                Seuil d&apos;élimination
                {ue.eliminationThreshold !== null && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...ue, eliminationThreshold: null })}
                    className="inline-flex min-h-11 items-center px-2 text-xs font-normal text-rose-500 hover:underline"
                  >
                    Désactiver
                  </button>
                )}
              </span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={20}
                step={0.5}
                value={ue.eliminationThreshold ?? ''}
                placeholder={
                  ue.eliminationThreshold === null ? 'Désactivée' : `${DEFAULT_ELIMINATION_THRESHOLD} (défaut)`
                }
                onChange={(e) => updateEliminationThreshold(e.target.value)}
                className="field"
              />
              <span className="text-xs font-normal text-slate-400">
                {ue.eliminationThreshold === null
                  ? 'Élimination désactivée pour cette UE : entre une valeur pour la réactiver.'
                  : `Par défaut : ${DEFAULT_ELIMINATION_THRESHOLD}/20 — laisse vide pour désactiver.`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {ue.ecs.length === 0 ? (
        // État vide : encadré en pointillés invitant à ajouter la première
        // matière, avec le bouton d'action centré dessous.
        <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
          <Plus className="h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">Ajoute la première matière de cette UE.</p>
          <button type="button" onClick={addEC} className={addECButtonClassName}>
            + Ajouter une matière
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {ue.ecs.map((ec) => {
              const isSimulating = ec.grade === null && Boolean(ec.futureGrade);
              const isRealGrade = ec.grade !== null;
              const toggleAriaLabel = isSimulating
                ? 'Annuler la simulation'
                : "Simuler la note d'un examen à venir";
              const toggleTitle = isRealGrade
                ? 'Supprime la note réelle pour pouvoir simuler cet examen'
                : toggleAriaLabel;

              return (
                <div
                  key={ec.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0"
                >
                  <div className="grid grid-cols-2 items-start gap-2 sm:grid-cols-12 sm:items-center">
                    {/* Nom : ligne 1 pleine largeur sous sm, 5/12 à partir de sm */}
                    <input
                      type="text"
                      value={ec.name}
                      onChange={(e) => updateEC(ec.id, { name: e.target.value })}
                      placeholder="Nom de la matière"
                      aria-label="Nom de la matière"
                      className="field col-span-2 text-base sm:col-span-5 sm:text-sm"
                    />

                    {/* Coefficient : moitié de la ligne 2 sous sm, 2/12 à partir de sm */}
                    <label className="flex flex-col gap-1 sm:col-span-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-400 sm:hidden">
                        Coeff.
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={0.5}
                        value={ec.coefficient}
                        onChange={(e) => updateEC(ec.id, { coefficient: sanitizeCoefficient(e.target.value) })}
                        placeholder="Coeff"
                        aria-label="Coefficient de la matière"
                        className="field"
                      />
                    </label>

                    {/* Note : moitié de la ligne 2 sous sm, 3/12 à partir de sm.
                        Un chip "SIM" en surimpression remplace la ligne de
                        texte "Scénario : X/20" pour ne pas doubler la hauteur
                        de la carte sur mobile. */}
                    <label className="flex flex-col gap-1 sm:col-span-3">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-400 sm:hidden">
                        Note /20
                      </span>
                      <div className="relative">
                        <input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={20}
                          step={0.25}
                          value={isSimulating ? ec.futureGrade?.value ?? '' : ec.grade ?? ''}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (isSimulating) {
                              const parsed = sanitizeSimulatedGrade(raw);
                              // `undefined` : frappe incomplète, on garde
                              // la simulation en cours. `null` : champ
                              // vidé, la simulation est annulée (jamais 0).
                              if (parsed === undefined) return;
                              updateEC(ec.id, {
                                futureGrade: parsed === null ? null : { mode: 'simulated', value: parsed },
                              });
                            } else {
                              updateEC(ec.id, { grade: sanitizeGrade(raw) });
                            }
                          }}
                          placeholder="Note /20"
                          aria-label={isSimulating ? 'Note simulée de la matière' : 'Note de la matière'}
                          className={`field ${
                            isSimulating
                              ? 'border-dashed border-status-sim-500 bg-status-sim-50 pr-10 text-status-sim-700 focus:border-status-sim-700'
                              : ''
                          }`}
                        />
                        {isSimulating && (
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-status-sim-500 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white"
                          >
                            SIM
                          </span>
                        )}
                      </div>
                    </label>

                    {/* Actions : rangée pleine largeur de 2 boutons texte+icône
                        sous sm ; le wrapper se "dissout" (display:contents) à
                        partir de sm pour laisser chaque bouton icône reprendre
                        sa propre cellule de grille (1/12 chacun). */}
                    <div className="col-span-2 flex gap-2 sm:contents">
                      <button
                        type="button"
                        onClick={() => toggleSimulation(ec)}
                        disabled={isRealGrade}
                        aria-pressed={isSimulating}
                        aria-label={toggleAriaLabel}
                        title={toggleTitle}
                        className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-medium transition-colors sm:col-span-1 sm:min-h-11 sm:flex-none sm:w-auto sm:p-1.5 sm:text-base ${
                          isRealGrade
                            ? 'cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-300 sm:border-0 sm:bg-transparent sm:text-slate-200'
                            : isSimulating
                              ? 'border border-status-sim-500 bg-status-sim-50 text-status-sim-700 hover:bg-status-sim-500/10 sm:border-0'
                              : 'border border-slate-200 bg-white text-slate-600 hover:border-status-sim-500 hover:bg-status-sim-50 hover:text-status-sim-700 sm:border-0 sm:bg-transparent sm:text-slate-400'
                        }`}
                      >
                        <Sparkles />
                        <span className="sm:hidden">{isSimulating ? 'Annuler' : 'Simuler'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeEC(ec.id)}
                        aria-label="Supprimer la matière"
                        title="Supprimer la matière"
                        className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 sm:col-span-1 sm:min-h-11 sm:flex-none sm:w-auto sm:border-0 sm:bg-transparent sm:p-1.5 sm:text-base sm:text-slate-400"
                      >
                        <X />
                        <span className="sm:hidden">Retirer</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button type="button" onClick={addEC} className={addECButtonClassName}>
            + Ajouter une matière
          </button>
        </>
      )}
    </div>
  );
}
