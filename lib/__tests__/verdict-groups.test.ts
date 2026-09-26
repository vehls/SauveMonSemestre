import { describe, expect, it } from 'vitest';
import { buildVerdictGroups } from '../verdict-groups';
import type { UEResult, ValidationStatus } from '../../types/calculator';

function result(partial: Partial<UEResult> & { ueId: string }): UEResult {
  return {
    ueId: partial.ueId,
    average: partial.average ?? null,
    isComplete: partial.isComplete ?? true,
    isEliminatory: partial.isEliminatory ?? false,
    isValidated: partial.isValidated ?? false,
    needsCompensation: partial.needsCompensation ?? false,
  };
}

function names(status: ValidationStatus, results: UEResult[], incomplete = false) {
  const ues = results.map((item) => ({ id: item.ueId, name: item.ueId }));
  return buildVerdictGroups(ues, results, status, incomplete);
}

describe('buildVerdictGroups', () => {
  it('met une UE validée dans Acquises, pas une UE incomplète seulement au-dessus de 10', () => {
    const view = names('En cours', [
      result({ ueId: 'Algo', isValidated: true, isComplete: true, average: 12 }),
      result({
        ueId: 'Droit',
        isComplete: false,
        average: 14,
        isValidated: false,
        needsCompensation: false,
        isEliminatory: false,
      }),
    ], true);

    expect(view.groups.map((group) => group.id)).toEqual(['acquired']);
    expect(view.groups[0]?.ues.map((ue) => ue.name)).toEqual(['Algo']);
    expect(view.groups[0]?.text).toBe("Tu les gardes, même si le semestre n'est pas validé.");
    expect(view.othersCanStillMove).toBe(true);
  });

  it('garde une UE incomplète dont le verdict est déjà verrouillé au-dessus du seuil', () => {
    const view = names(
      'En cours',
      [result({ ueId: 'Maths', isValidated: true, isComplete: false, average: 15 })],
      true,
    );

    expect(view.groups[0]?.ues.map((ue) => ue.name)).toEqual(['Maths']);
    expect(view.othersCanStillMove).toBe(false);
  });

  it('affiche les UE à compenser tant qu\'une éliminatoire n\'a pas déjà invalidé le semestre', () => {
    const open = names('Compensé', [
      result({ ueId: 'Philo', needsCompensation: true, average: 9 }),
      result({ ueId: 'Sport', isValidated: true, average: 14 }),
    ]);

    expect(open.groups.map((group) => group.id)).toEqual(['acquired', 'compensated']);
    expect(open.groups[1]?.title).toBe('Compensées seulement si le semestre passe');
    expect(open.groups[1]?.ues.map((ue) => ue.name)).toEqual(['Philo']);
    expect(open.othersCanStillMove).toBe(false);
  });

  it('masque le groupe compensé quand le semestre est non validé à cause d\'une éliminatoire', () => {
    const blocked = names('Non validé', [
      result({ ueId: 'Philo', needsCompensation: true, average: 9 }),
      result({ ueId: 'Physique', isEliminatory: true, average: 6 }),
    ]);

    expect(blocked.groups.map((group) => group.id)).toEqual(['retake']);
    expect(blocked.groups[0]?.ues.map((ue) => ue.name)).toEqual(['Physique']);
    expect(blocked.groups[0]?.text).toBe(
      'Sous le plancher : non acquises, et elles bloquent la compensation.',
    );
  });

  it('laisse voir les UE à compenser si le semestre est non validé sans éliminatoire', () => {
    const low = names('Non validé', [
      result({ ueId: 'Philo', needsCompensation: true, average: 9 }),
    ]);

    expect(low.groups.map((group) => group.id)).toEqual(['compensated']);
  });

  it('classe une UE à la fois validée et éliminatoire dans À repasser seulement', () => {
    const view = names('Non validé', [
      result({ ueId: 'Seuil', isValidated: true, isEliminatory: true, average: 9 }),
    ]);

    expect(view.groups.map((group) => group.id)).toEqual(['retake']);
  });

  it('ne renvoie rien quand aucun verdict n\'est verrouillé', () => {
    const view = names(
      'En cours',
      [result({ ueId: 'Droit', isComplete: false, average: 14 })],
      true,
    );

    expect(view.groups).toEqual([]);
    expect(view.othersCanStillMove).toBe(false);
  });
});
