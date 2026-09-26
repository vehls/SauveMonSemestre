import type { UEResult, ValidationStatus } from '../types/calculator';

export type VerdictGroupId = 'acquired' | 'compensated' | 'retake';

export interface VerdictUe {
  id: string;
  name: string;
}

export interface VerdictGroup {
  id: VerdictGroupId;
  title: string;
  text: string;
  ues: VerdictUe[];
}

export interface VerdictGroupsView {
  groups: VerdictGroup[];
  /** Semestre incomplet et au moins une UE sans verdict verrouillé. */
  othersCanStillMove: boolean;
}

const GROUP_COPY: Record<VerdictGroupId, { title: string; text: string }> = {
  acquired: {
    title: 'Acquises',
    text: "Tu les gardes, même si le semestre n'est pas validé.",
  },
  compensated: {
    title: 'Compensées seulement si le semestre passe',
    text: "Acquises uniquement si le semestre (ou l'année) est validé. Sinon tu les repasses.",
  },
  retake: {
    title: 'À repasser',
    text: 'Sous le plancher : non acquises, et elles bloquent la compensation.',
  },
};

interface NamedUe {
  id: string;
  name: string;
}

/**
 * Regroupe les UE dont le verdict est déjà verrouillé.
 * `isValidated` / `needsCompensation` / `isEliminatory` suffisent : une
 * moyenne partielle au-dessus de 10, sur une UE encore ouverte, ne compte
 * pas comme une acquisition.
 */
export function buildVerdictGroups(
  ues: NamedUe[],
  ueResults: UEResult[],
  status: ValidationStatus,
  semesterIncomplete: boolean,
): VerdictGroupsView {
  const byId = new Map(ueResults.map((result) => [result.ueId, result]));
  const uesWhere = (predicate: (result: UEResult) => boolean): VerdictUe[] =>
    ues.flatMap((ue) => {
      const result = byId.get(ue.id);
      return result && predicate(result) ? [{ id: ue.id, name: ue.name }] : [];
    });

  const blockedByEliminatory =
    status === 'Non validé' && ueResults.some((result) => result.isEliminatory);

  const groups: VerdictGroup[] = (
    [
      ['acquired', (result: UEResult) => result.isValidated && !result.isEliminatory],
      [
        'compensated',
        (result: UEResult) => result.needsCompensation && !blockedByEliminatory,
      ],
      ['retake', (result: UEResult) => result.isEliminatory],
    ] as const
  ).flatMap(([id, predicate]) => {
    const matched = uesWhere(predicate);
    if (matched.length === 0) return [];
    return [{ id, ...GROUP_COPY[id], ues: matched }];
  });

  const hasOpenUe = ues.some((ue) => {
    const result = byId.get(ue.id);
    if (!result) return true;
    return !result.isValidated && !result.needsCompensation && !result.isEliminatory;
  });

  return {
    groups,
    othersCanStillMove: semesterIncomplete && hasOpenUe && groups.length > 0,
  };
}
