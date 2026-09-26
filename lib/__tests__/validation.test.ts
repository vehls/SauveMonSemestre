import { describe, expect, it } from 'vitest';
import { isValidSemester, sanitizeCoefficient, sanitizeGrade, sanitizeSimulatedGrade } from '../validation';

describe('saisie des notes et des coefficients', () => {
  it('ramène une note finie dans [0, 20] et vide le champ réel en null', () => {
    expect(sanitizeGrade('')).toBeNull();
    expect(sanitizeGrade('25')).toBe(20);
    expect(sanitizeGrade('-3')).toBe(0);
    expect(sanitizeGrade('12.5')).toBe(12.5);
    expect(sanitizeGrade('.')).toBeNull();
  });

  it('vide le champ SIM en annulant la simulation, jamais en écrivant 0', () => {
    expect(sanitizeSimulatedGrade('')).toBeNull();
    expect(sanitizeSimulatedGrade('-')).toBeUndefined();
    expect(sanitizeSimulatedGrade('25')).toBe(20);
    expect(sanitizeSimulatedGrade('-3')).toBe(0);
  });

  it('ramène un coefficient vide, non fini ou négatif à 0', () => {
    expect(sanitizeCoefficient('')).toBe(0);
    expect(sanitizeCoefficient('-1')).toBe(0);
    expect(sanitizeCoefficient('.')).toBe(0);
    expect(sanitizeCoefficient('2.5')).toBe(2.5);
  });
});

describe('isValidSemester', () => {
  it('accepte une grille déjà stockée avec une note hors barème et un coefficient négatif', () => {
    expect(
      isValidSemester({
        id: 's',
        name: 'Semestre stocké',
        number: 1,
        ues: [
          {
            id: 'u',
            name: 'UE',
            coefficient: -1,
            ecs: [
              {
                id: 'e',
                name: 'Matière',
                coefficient: -1,
                grade: 25,
                futureGrade: { mode: 'simulated', value: -3 },
              },
            ],
          },
        ],
      }),
    ).toBe(true);
  });
});
