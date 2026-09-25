'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { analyzeRevisionStrategy, calculateSemesterAverage } from '@/lib/calculator-utils';
import { generateId } from '@/lib/id';
import { SEO_TITLE } from '@/lib/site';
import {
  clearShareParamFromUrl,
  extractSharedGridFromLocation,
  sharedGridToSemester,
} from '@/lib/share';
import { isValidSemester, isValidTargetAverage } from '@/lib/validation';
import type { Semester, UE } from '@/types/calculator';
import type { SharedGrid } from '@/types/share';
import { EmptyState } from './EmptyState';
import { Header } from './Header';
import { Alert, Check, Target } from './icons';
import { ImportGridBanner } from './ImportGridBanner';
import { ResultsBar } from './ResultsBar';
import { RevisionStrategy } from './RevisionStrategy';
import { RevisionStrategyTeaser } from './RevisionStrategyTeaser';
import { ShareGrid } from './ShareGrid';
import { UECard } from './UECard';

const STORAGE_KEY_SEMESTER = 'sauvemonsemestre:semester';
const STORAGE_KEY_TARGET = 'sauvemonsemestre:target-average';

function createEmptySemester(): Semester {
  return {
    id: generateId('semester'),
    // Vide par défaut : l'utilisateur renseigne le nom de sa filière/promo
    // via le champ dédié (voir le rendu ci-dessous), un placeholder guide
    // la saisie tant que le champ n'a pas été rempli.
    name: '',
    number: 1,
    ues: [],
  };
}

/**
 * Carte "note minimale à viser" pour une matière en attente. Le calcul
 * (`required`) suppose une note uniforme sur l'ensemble des examens
 * restants du semestre : la même valeur est donc affichée sur chaque
 * carte, mais présentée matière par matière (nom + UE) pour rester
 * ancrée dans la grille plutôt qu'en simple message générique.
 */
function RequiredGradeCard({
  ecId,
  ecName,
  ueName,
  required,
  pendingCount,
}: {
  ecId: string;
  ecName: string;
  ueName: string;
  required: number;
  /**
   * Nombre total de matières encore en attente dans le semestre : la note
   * requise est TOUJOURS une note uniforme à obtenir sur l'ensemble de ces
   * examens (pas un minimum propre à chaque matière prise isolément). Le
   * texte le précise explicitement dès qu'il y a plusieurs matières en
   * attente, pour éviter toute ambiguïté carte par carte.
   */
  pendingCount: number;
}) {
  let cardClassName = 'border-navy-100 bg-navy-50';
  let icon = <Target className="shrink-0 text-navy-600" />;
  let message: ReactNode =
    pendingCount > 1 ? (
      <>
        Vise <span className="font-display text-navy-950">{required.toFixed(2)}</span>/20 ici, la même
        note qu&apos;à chacun des {pendingCount} examens encore en attente.
      </>
    ) : (
      <>
        Vise <span className="font-display text-navy-950">{required.toFixed(2)}</span>/20 ici.
      </>
    );

  if (required <= 0) {
    cardClassName = 'border-emerald-200 bg-emerald-50';
    icon = <Check className="shrink-0 text-emerald-600" />;
    message = <span className="text-emerald-800">Déjà acquis, quel que soit le résultat.</span>;
  } else if (required > 20) {
    cardClassName = 'border-rose-200 bg-rose-50';
    icon = <Alert className="shrink-0 text-rose-600" />;
    message = <span className="text-rose-800">Hors de portée, même à 20/20.</span>;
  }

  return (
    <div key={ecId} className={`flex min-w-0 items-center gap-3 rounded-xl border px-4 py-3 ${cardClassName}`}>
      {icon}
      <div className="min-w-0 break-words text-sm">
        <p className="font-medium text-slate-700">
          {ecName} <span className="text-xs font-normal text-slate-400">({ueName})</span>
        </p>
        <p>{message}</p>
      </div>
    </div>
  );
}

/** Interface principale du simulateur : header, barre de résultats sticky, et liste d'UE. */
export function SemesterSimulator() {
  const [semester, setSemester] = useLocalStorage<Semester>(
    STORAGE_KEY_SEMESTER,
    createEmptySemester(),
    isValidSemester,
  );
  const [targetAverage, setTargetAverage] = useLocalStorage<number>(
    STORAGE_KEY_TARGET,
    10,
    isValidTargetAverage,
  );

  // Grille partagée détectée dans l'URL (?grid=...), en attente de
  // confirmation par l'utilisateur. Recherchée uniquement après le montage
  // (et non pendant le rendu initial) pour éviter tout mismatch d'hydratation
  // entre le rendu serveur et le rendu client.
  const [importCandidate, setImportCandidate] = useState<SharedGrid | null>(null);

  useEffect(() => {
    const grid = extractSharedGridFromLocation();
    if (grid) {
      setImportCandidate(grid);
    }
  }, []);

  const handleAcceptImport = () => {
    if (!importCandidate) return;
    setSemester(sharedGridToSemester(importCandidate));
    setImportCandidate(null);
    clearShareParamFromUrl();
  };

  const handleDismissImport = () => {
    setImportCandidate(null);
    clearShareParamFromUrl();
  };

  // Calcul en temps réel à chaque changement de note, coefficient ou objectif.
  const result = useMemo(
    () => calculateSemesterAverage(semester, targetAverage),
    [semester, targetAverage],
  );

  // Stratégie de révision : hiérarchise les matières en attente par impact
  // sur la moyenne générale du semestre.
  const revisionAdvice = useMemo(
    () => analyzeRevisionStrategy(semester, targetAverage),
    [semester, targetAverage],
  );

  // Nombre de matières sans note réelle ni note verrouillée/simulée. Sert
  // uniquement à savoir s'il reste des examens en attente (le calcul de
  // note requise, lui, ne suppose plus une note "par matière" mais une
  // moyenne uniforme globale — voir ResultsBar).
  const pendingSubjectCount = useMemo(() => {
    let count = 0;
    for (const ue of semester.ues) {
      for (const ec of ue.ecs) {
        const hasEffectiveGrade = ec.grade !== null || Boolean(ec.futureGrade);
        if (!hasEffectiveGrade) {
          count += 1;
        }
      }
    }
    return count;
  }, [semester]);

  // Au moins une note (réelle, verrouillée ou simulée) a été saisie quelque
  // part dans le semestre. Sert à ne jamais afficher un statut d'échec ou
  // une stratégie de révision avant que l'utilisateur n'ait commencé.
  const hasAnyGrade = useMemo(
    () => semester.ues.some((ue) => ue.ecs.some((ec) => ec.grade !== null || Boolean(ec.futureGrade))),
    [semester],
  );

  // La stratégie de révision complète ne s'affiche que si l'utilisateur a
  // commencé à saisir des notes ET qu'il reste au moins un examen en attente.
  const showRevisionStrategy = hasAnyGrade && pendingSubjectCount > 0;

  // Titre d'onglet dynamique : reflète la moyenne et le statut affiché en
  // temps réel (le <title> statique défini dans app/layout.tsx sert de
  // valeur par défaut pour le SEO/les aperçus de partage).
  useEffect(() => {
    if (semester.ues.length === 0 || result.generalAverage === null) {
      document.title = SEO_TITLE;
      return;
    }
    const averageLabel = result.generalAverage !== null ? `${result.generalAverage.toFixed(2)}/20` : '—/20';
    document.title = `${averageLabel} · ${result.status} — SauveMonSemestre`;
  }, [result.generalAverage, result.status, semester.ues.length]);

  const addUE = () => {
    const newUE: UE = {
      id: generateId('ue'),
      name: `UE ${semester.ues.length + 1}`,
      coefficient: 1,
      ecs: [],
    };
    setSemester({ ...semester, ues: [...semester.ues, newUE] });
  };

  const updateUE = (updated: UE) => {
    setSemester({
      ...semester,
      ues: semester.ues.map((ue) => (ue.id === updated.id ? updated : ue)),
    });
  };

  /** Nom de la filière/promo, inclus dans le lien de partage (voir lib/share.ts). */
  const updateSemesterName = (name: string) => {
    setSemester({ ...semester, name });
  };

  const removeUE = (ueId: string) => {
    setSemester({ ...semester, ues: semester.ues.filter((ue) => ue.id !== ueId) });
  };

  // La confirmation (2 clics) est désormais gérée directement dans
  // Header : ce callback n'est appelé qu'une fois l'utilisateur confirmé,
  // il effectue donc la réinitialisation sans nouvelle vérification.
  const handleReset = () => {
    setSemester(createEmptySemester());
    setTargetAverage(10);
  };

  return (
    <div className="space-y-6">
      <Header onAddUE={addUE} onReset={handleReset} />

      {/* Nom de la filière/promo : inclus dans le lien de partage pour que
          la personne qui le reçoit sache immédiatement de quelle grille il
          s'agit (voir ShareGrid et lib/share.ts). */}
      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-rest">
        <label htmlFor="semester-name" className="block text-xs font-semibold text-slate-500">
          Ta promo
        </label>
        <input
          id="semester-name"
          type="text"
          value={semester.name}
          onChange={(e) => updateSemesterName(e.target.value)}
          placeholder="L3 Psycho — Semestre 5"
          className="field mt-1.5"
        />
      </div>

      {/* Proposition de chargement d'une grille reçue par lien */}
      {importCandidate && (
        <ImportGridBanner
          grid={importCandidate}
          onAccept={handleAcceptImport}
          onDismiss={handleDismissImport}
        />
      )}

      {/* Barre de résultats sticky : reste visible pendant le défilement. */}
      <ResultsBar
        generalAverage={result.generalAverage}
        targetAverage={targetAverage}
        onTargetChange={setTargetAverage}
        status={result.status}
      />

      {/* Note minimale à viser : une carte par matière en attente (même
          valeur uniforme partout, mais ancrée matière par matière plutôt
          qu'en simple message générique). Ne s'affiche qu'une fois que
          l'utilisateur a commencé à saisir des notes. */}
      {hasAnyGrade &&
        pendingSubjectCount > 0 &&
        result.requiredGradeForPendingExams !== null &&
        revisionAdvice.length > 0 && (
          <section className="space-y-2">
            <h2 className="px-1 text-sm font-semibold text-slate-600">Note minimale à viser</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {revisionAdvice.map((item) => (
                <RequiredGradeCard
                  key={item.ecId}
                  ecId={item.ecId}
                  ecName={item.ecName}
                  ueName={item.ueName}
                  required={result.requiredGradeForPendingExams as number}
                  pendingCount={revisionAdvice.length}
                />
              ))}
            </div>
          </section>
        )}

      {/* Liste des UE, ou état vide illustré */}
      {semester.ues.length === 0 ? (
        <EmptyState onAddFirstUE={addUE} />
      ) : (
        <section className="space-y-4">
          {semester.ues.map((ue) => (
            <UECard
              key={ue.id}
              ue={ue}
              result={result.ueResults.find((r) => r.ueId === ue.id)}
              onChange={updateUE}
              onRemove={() => removeUE(ue.id)}
            />
          ))}
        </section>
      )}

      {/* Bloc "footer" : stratégie de révision (ou son aperçu grisé) puis
          partage, une fois qu'il y a effectivement une grille à partager. */}
      <div className="space-y-4 border-t border-slate-200/70 pt-6">
        {showRevisionStrategy ? (
          <RevisionStrategy advice={revisionAdvice} />
        ) : (
          <RevisionStrategyTeaser hasUE={semester.ues.length > 0} hasGrade={hasAnyGrade} />
        )}
        {semester.ues.length > 0 && <ShareGrid semester={semester} />}
      </div>
    </div>
  );
}
