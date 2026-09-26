/**
 * Validateurs de forme pour les données lues depuis `localStorage`
 * (voir `hooks/useLocalStorage.ts`). Un `JSON.parse` réussi ne garantit en
 * rien que la valeur obtenue a la forme attendue : une clé corrompue, un
 * ancien format, ou une valeur écrite par une autre application peut
 * produire `null`, `{}`, un nombre, etc. Ces fonctions servent de garde
 * avant d'accepter la valeur lue comme état initial de l'app.
 */

import type { EC, FutureGradeSimulation, Semester, UE } from '@/types/calculator';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function clampGrade(value: number): number {
  return Math.min(20, Math.max(0, value));
}

/**
 * Note réelle saisie. Vide ou non convertible → `null` (examen non noté).
 * Un nombre fini est ramené dans `[0, 20]`.
 */
export function sanitizeGrade(raw: string): number | null {
  if (raw === '') return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? clampGrade(parsed) : null;
}

/**
 * Saisie du champ de simulation.
 * - vide → `null` : la simulation est annulée, jamais remplacée par 0 ;
 * - frappe non finie (`"."`, `"-"`) → `undefined` : on garde la valeur
 *   précédente ;
 * - nombre fini → clampé à `[0, 20]`.
 */
export function sanitizeSimulatedGrade(raw: string): number | null | undefined {
  if (raw === '') return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return undefined;
  return clampGrade(parsed);
}

/**
 * Coefficient d'UE ou de matière. Vide, non fini ou négatif → `0`
 * (poids nul). Même règle des deux côtés.
 */
export function sanitizeCoefficient(raw: string): number {
  const parsed = Number(raw);
  if (raw === '' || !Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function isValidFutureGrade(value: unknown): value is FutureGradeSimulation {
  if (!value || typeof value !== 'object') return false;
  const futureGrade = value as Partial<FutureGradeSimulation>;
  return (
    (futureGrade.mode === 'locked' || futureGrade.mode === 'simulated') &&
    isFiniteNumber(futureGrade.value)
  );
}

function isValidEC(value: unknown): value is EC {
  if (!value || typeof value !== 'object') return false;
  const ec = value as Partial<EC>;
  if (typeof ec.id !== 'string' || typeof ec.name !== 'string') return false;
  if (!isFiniteNumber(ec.coefficient)) return false;
  if (!(ec.grade === null || isFiniteNumber(ec.grade))) return false;
  // `futureGrade` est optionnel ; s'il est présent et non `null`, il doit
  // avoir la forme attendue.
  if (ec.futureGrade !== undefined && ec.futureGrade !== null && !isValidFutureGrade(ec.futureGrade)) {
    return false;
  }
  return true;
}

function isValidUE(value: unknown): value is UE {
  if (!value || typeof value !== 'object') return false;
  const ue = value as Partial<UE>;
  if (typeof ue.id !== 'string' || typeof ue.name !== 'string') return false;
  if (!isFiniteNumber(ue.coefficient)) return false;
  if (!Array.isArray(ue.ecs) || !ue.ecs.every(isValidEC)) return false;
  if (ue.validationThreshold !== undefined && !isFiniteNumber(ue.validationThreshold)) return false;
  // `null` est une valeur valide et distincte d'`undefined` pour
  // `eliminationThreshold` : elle signifie "élimination désactivée pour
  // cette UE", à préserver telle quelle (voir `types/calculator.ts`).
  if (
    ue.eliminationThreshold !== undefined &&
    ue.eliminationThreshold !== null &&
    !isFiniteNumber(ue.eliminationThreshold)
  ) {
    return false;
  }
  return true;
}

/**
 * Valide qu'une valeur désérialisée depuis `localStorage` a bien la forme
 * complète attendue d'un {@link Semester}. Retourne `false` pour `null`,
 * `{}`, un nombre, un tableau, ou toute UE/EC malformée.
 *
 * Une note hors `[0, 20]` ou un coefficient négatif déjà stockés restent
 * acceptés : la grille n'est pas effacée. Le calcul les neutralise à la
 * lecture (`safeGrade`, `safeCoefficient`).
 */
export function isValidSemester(value: unknown): value is Semester {
  if (!value || typeof value !== 'object') return false;
  const semester = value as Partial<Semester>;
  return (
    typeof semester.id === 'string' &&
    typeof semester.name === 'string' &&
    (semester.number === 1 || semester.number === 2) &&
    Array.isArray(semester.ues) &&
    semester.ues.every(isValidUE)
  );
}

/**
 * Valide qu'une valeur désérialisée depuis `localStorage` est une note
 * cible plausible : un nombre fini entre 0 et 20.
 */
export function isValidTargetAverage(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0 && value <= 20;
}
