import { describe, expect, it } from 'vitest';
import { calculateSemesterAverage } from '../calculator-utils';
import { sanitizeSimulatedGrade } from '../validation';
import type { EC, Semester, UE } from '../../types/calculator';

/** Petit constructeur pour garder les scénarios de test courts et lisibles. */
function makeSemester(ues: UE[]): Semester {
  return { id: 'semester-test', name: 'Semestre de test', number: 1, ues };
}

function makeEC(overrides: Partial<EC> & { id: string }): EC {
  return {
    id: overrides.id,
    name: overrides.name ?? overrides.id,
    coefficient: overrides.coefficient ?? 1,
    grade: overrides.grade ?? null,
    futureGrade: overrides.futureGrade ?? null,
  };
}

function makeUE(overrides: Partial<UE> & { id: string; ecs: EC[] }): UE {
  return {
    id: overrides.id,
    name: overrides.name ?? overrides.id,
    coefficient: overrides.coefficient ?? 1,
    ecs: overrides.ecs,
    validationThreshold: overrides.validationThreshold,
    eliminationThreshold: overrides.eliminationThreshold,
  };
}

describe('calculateSemesterAverage', () => {
  it('renvoie "À simuler" pour un semestre entièrement vide (aucune UE)', () => {
    const result = calculateSemesterAverage(makeSemester([]), 10);

    expect(result.generalAverage).toBeNull();
    expect(result.averageRange).toBeNull();
    expect(result.status).toBe('À simuler');
    expect(result.requiredGradeForPendingExams).toBeNull();
  });

  it(
    'un semestre incomplet dont la moyenne partielle atteint déjà la cible ' +
      'doit renvoyer "En cours", jamais "Validé"',
    () => {
      // Une matière notée à 14 (déjà au-dessus de la cible de 10), et une
      // autre matière encore en attente : rien n'est acquis avant la fin.
      const semester = makeSemester([
        makeUE({
          id: 'ue1',
          coefficient: 1,
          ecs: [
            makeEC({ id: 'ec1', coefficient: 1, grade: 14 }),
            makeEC({ id: 'ec2', coefficient: 1, grade: null }),
          ],
        }),
      ]);

      const result = calculateSemesterAverage(semester, 10);

      // Poids réel : 14 et un examen à 0 donnent 7,00 ; à 20, 17,00.
      // Pas de chiffre unique tant que le semestre est incomplet.
      expect(result.generalAverage).toBeNull();
      expect(result.averageRange).toEqual({ floor: 7, ceiling: 17 });
      expect(result.status).toBe('En cours');
      expect(result.status).not.toBe('Validé');
      expect(result.status).not.toBe('Compensé');
    },
  );

  it(
    'un semestre incomplet mathématiquement irrécupérable (même 20/20 ne suffit pas) ' +
      'doit renvoyer "Non validé"',
    () => {
      // Note connue très basse à fort coefficient, une seule matière encore
      // en attente à faible coefficient : même 20/20 dedans ne peut pas
      // remonter suffisamment la moyenne pour atteindre 10/20.
      const semester = makeSemester([
        makeUE({
          id: 'ue1',
          coefficient: 1,
          ecs: [
            makeEC({ id: 'ec1', coefficient: 3, grade: 2 }),
            makeEC({ id: 'ec2', coefficient: 1, grade: null }),
          ],
        }),
      ]);

      const result = calculateSemesterAverage(semester, 10);

      // Moyenne max possible = (2*3 + 20*1) / 4 = 6.5, sous la cible de 10.
      expect(result.status).toBe('Non validé');
    },
  );

  it('un semestre entièrement complet avec une moyenne >= cible doit renvoyer "Validé"', () => {
    const semester = makeSemester([
      makeUE({
        id: 'ue1',
        coefficient: 1,
        ecs: [makeEC({ id: 'ec1', coefficient: 1, grade: 15 })],
      }),
      makeUE({
        id: 'ue2',
        coefficient: 1,
        ecs: [makeEC({ id: 'ec2', coefficient: 1, grade: 13 })],
      }),
    ]);

    const result = calculateSemesterAverage(semester, 10);

    expect(result.generalAverage).toBe(14);
    expect(result.averageRange).toBeNull();
    expect(result.status).toBe('Validé');
    expect(result.requiredGradeForPendingExams).toBeNull();
  });

  it(
    'un semestre complet avec une UE entre le seuil d\'élimination et le seuil de ' +
      'validation doit renvoyer "Compensé"',
    () => {
      const semester = makeSemester([
        // UE1 : moyenne 9 -> entre l'élimination (8) et la validation (10),
        // a besoin d'être compensée par le reste du semestre.
        makeUE({
          id: 'ue1',
          coefficient: 1,
          ecs: [makeEC({ id: 'ec1', coefficient: 1, grade: 9 })],
        }),
        // UE2 : très bonne moyenne, suffisante pour compenser UE1 et faire
        // dépasser la moyenne générale de 10/20.
        makeUE({
          id: 'ue2',
          coefficient: 1,
          ecs: [makeEC({ id: 'ec2', coefficient: 1, grade: 15 })],
        }),
      ]);

      const result = calculateSemesterAverage(semester, 10);

      expect(result.generalAverage).toBe(12);
      expect(result.status).toBe('Compensé');
      expect(result.ueResults.find((r) => r.ueId === 'ue1')?.isValidated).toBe(false);
      expect(result.ueResults.find((r) => r.ueId === 'ue1')?.isEliminatory).toBe(false);
    },
  );

  it(
    'une UE complète sous le seuil d\'élimination doit déclencher "Non validé", ' +
      'même si la moyenne générale dépasse la cible',
    () => {
      const semester = makeSemester([
        // UE1 : moyenne 6, complète, sous le seuil d'élimination par défaut (8).
        makeUE({
          id: 'ue1',
          coefficient: 1,
          ecs: [makeEC({ id: 'ec1', coefficient: 1, grade: 6 })],
        }),
        // UE2 : moyenne excellente, qui ferait largement dépasser 10/20 en
        // moyenne générale si la compensation était possible.
        makeUE({
          id: 'ue2',
          coefficient: 3,
          ecs: [makeEC({ id: 'ec2', coefficient: 1, grade: 18 })],
        }),
      ]);

      const result = calculateSemesterAverage(semester, 10);

      expect(result.generalAverage).toBeGreaterThanOrEqual(10);
      expect(result.ueResults.find((r) => r.ueId === 'ue1')?.isEliminatory).toBe(true);
      expect(result.status).toBe('Non validé');
    },
  );

  it(
    'une UE incomplète sous le seuil d\'élimination ne doit PAS être éliminatoire ' +
      '(l\'élimination n\'est déclenchée que par une note finale)',
    () => {
      const semester = makeSemester([
        makeUE({
          id: 'ue1',
          coefficient: 1,
          ecs: [
            makeEC({ id: 'ec1', coefficient: 1, grade: 5 }), // sous 8, mais UE incomplète
            makeEC({ id: 'ec2', coefficient: 1, grade: null }),
          ],
        }),
      ]);

      const result = calculateSemesterAverage(semester, 10);

      expect(result.ueResults.find((r) => r.ueId === 'ue1')?.isEliminatory).toBe(false);
      expect(result.status).not.toBe('Non validé');
    },
  );

  it('une note simulée (futureGrade) compte comme une note effective pour compléter le semestre', () => {
    const semester = makeSemester([
      makeUE({
        id: 'ue1',
        coefficient: 1,
        ecs: [
          makeEC({ id: 'ec1', coefficient: 1, grade: 14 }),
          makeEC({
            id: 'ec2',
            coefficient: 1,
            grade: null,
            futureGrade: { mode: 'simulated', value: 12 },
          }),
        ],
      }),
    ]);

    const result = calculateSemesterAverage(semester, 10);

    // Plus aucune matière en attente : la moyenne (13) est définitive.
    expect(result.generalAverage).toBe(13);
    expect(result.status).toBe('Validé');
    expect(result.requiredGradeForPendingExams).toBeNull();
  });

  it('calcule une note requise cohérente pour les examens en attente', () => {
    const semester = makeSemester([
      makeUE({
        id: 'ue1',
        coefficient: 1,
        ecs: [
          makeEC({ id: 'ec1', coefficient: 1, grade: 8 }),
          makeEC({ id: 'ec2', coefficient: 1, grade: null }),
        ],
      }),
    ]);

    const result = calculateSemesterAverage(semester, 10);

    // (8*1 + x*1) / 2 = 10  =>  x = 12
    expect(result.requiredGradeForPendingExams).toBe(12);
    expect(result.status).toBe('En cours');
  });

  // Semestre incomplet : la barre n'affiche pas la projection « moyennes
  // partielles d'UE à coefficient plein » (ici 13). Elle affiche la
  // fourchette sur le poids réel de chaque matière.
  it(
    'une UE partielle à 10 et une UE complète à 16 donnent la fourchette ' +
      '10,50–15,50, pas un chiffre unique 13',
    () => {
      const semester = makeSemester([
        makeUE({
          id: 'ue1',
          coefficient: 1,
          ecs: [
            makeEC({ id: 'ec1', coefficient: 1, grade: 10 }),
            makeEC({ id: 'ec2', coefficient: 1, grade: null }),
          ],
        }),
        makeUE({
          id: 'ue2',
          coefficient: 1,
          ecs: [makeEC({ id: 'ec3', coefficient: 1, grade: 16 })],
        }),
      ]);

      const result = calculateSemesterAverage(semester, 10);

      // Plancher (examen blanc à 0) : (10×0,5 + 16×1) / 2 = 10,50.
      // Plafond (examen blanc à 20) : (10×0,5 + 20×0,5 + 16×1) / 2 = 15,50.
      expect(result.generalAverage).toBeNull();
      expect(result.averageRange).toEqual({ floor: 10.5, ceiling: 15.5 });
      expect(result.ueResults.find((r) => r.ueId === 'ue1')?.average).toBe(10);
      expect(result.ueResults.find((r) => r.ueId === 'ue2')?.average).toBe(16);
      expect(result.status).toBe('En cours');
    },
  );

  it(
    'une UE à 18 plus un examen blanc, et une UE à 4, donnent la fourchette ' +
      '6,50–11,50 : pas une moyenne acquise de 11',
    () => {
      const semester = makeSemester([
        makeUE({
          id: 'ue1',
          coefficient: 1,
          ecs: [
            makeEC({ id: 'ec1', coefficient: 1, grade: 18 }),
            makeEC({ id: 'ec2', coefficient: 1, grade: null }),
          ],
        }),
        // Élimination désactivée : une UE complète à 4 sous le seuil par
        // défaut (8) rendrait le semestre « Non validé ». Ici le cas
        // verrouille la fourchette d'un semestre encore ouvert.
        makeUE({
          id: 'ue2',
          coefficient: 1,
          eliminationThreshold: null,
          ecs: [makeEC({ id: 'ec3', coefficient: 1, grade: 4 })],
        }),
      ]);

      const result = calculateSemesterAverage(semester, 10);

      // Ancienne projection (moyennes partielles à coefficient plein) : 11.
      // Poids réel : plancher (18×0,5 + 4) / 2 = 6,50 ; plafond
      // (18×0,5 + 20×0,5 + 4) / 2 = 11,50.
      expect(result.generalAverage).toBeNull();
      expect(result.generalAverage).not.toBe(11);
      expect(result.averageRange).toEqual({ floor: 6.5, ceiling: 11.5 });
      expect(result.ueResults.find((r) => r.ueId === 'ue1')?.average).toBe(18);
      expect(result.ueResults.find((r) => r.ueId === 'ue1')?.isComplete).toBe(false);
      expect(result.ueResults.find((r) => r.ueId === 'ue2')?.average).toBe(4);
      expect(result.ueResults.find((r) => r.ueId === 'ue2')?.isEliminatory).toBe(false);
      expect(result.status).toBe('En cours');
    },
  );

  // Bug 2 — la note minimale requise doit être arrondie au centième
  // SUPÉRIEUR (jamais en dessous du besoin réel), et rester cohérente avec
  // le statut "Non validé" quand elle dépasse 20/20.
  it(
    'arrondit la note minimale requise au centième supérieur (jamais en ' +
      'dessous du besoin réel)',
    () => {
      const semester = makeSemester([
        makeUE({
          id: 'ue1',
          coefficient: 1,
          ecs: [
            makeEC({ id: 'ec1', coefficient: 1, grade: 7.876 }),
            makeEC({ id: 'ec2', coefficient: 1, grade: null }),
          ],
        }),
      ]);

      const result = calculateSemesterAverage(semester, 10);

      // Besoin brut : (10*1 - 7.876*0.5) / 0.5 = 12.124 -> arrondi au
      // centième supérieur = 12.13 (jamais 12.12, qui laisserait l'objectif
      // hors de portée malgré une note affichée comme suffisante).
      expect(result.requiredGradeForPendingExams).not.toBeNull();
      expect(result.requiredGradeForPendingExams as number).toBeGreaterThanOrEqual(12.124);
      expect(result.requiredGradeForPendingExams).toBeCloseTo(12.13, 5);
      expect(result.status).toBe('En cours');
    },
  );

  it(
    'la note minimale requise reste strictement supérieure à 20 quand ' +
      'l\'objectif est mathématiquement hors de portée',
    () => {
      const semester = makeSemester([
        makeUE({
          id: 'ue1',
          coefficient: 1,
          ecs: [
            makeEC({ id: 'ec1', coefficient: 3, grade: 0 }),
            makeEC({ id: 'ec2', coefficient: 1, grade: null }),
          ],
        }),
      ]);

      const result = calculateSemesterAverage(semester, 10);

      expect(result.requiredGradeForPendingExams).not.toBeNull();
      expect(result.requiredGradeForPendingExams as number).toBeGreaterThan(20);
      expect(result.status).toBe('Non validé');
    },
  );

  // Bug 3 — un coefficient ou une note invalide (ex : `Number('.')`, qui
  // vaut `NaN`) ne doit jamais produire de moyenne `NaN`, ni côté UE ni
  // côté semestre : la matière/UE concernée doit simplement être traitée
  // comme un poids nul plutôt que de corrompre le calcul.
  it(
    'un coefficient invalide (NaN) ne produit jamais de moyenne NaN, ' +
      'ni pour l\'UE ni pour le semestre',
    () => {
      const semester = makeSemester([
        makeUE({
          id: 'ue1',
          coefficient: 1,
          ecs: [makeEC({ id: 'ec1', coefficient: Number('.'), grade: 10 })],
        }),
      ]);

      const result = calculateSemesterAverage(semester, 10);

      expect(result.generalAverage).not.toBeNaN();
      // Poids nul partout (coefficient invalide traité comme 0) : aucune
      // moyenne fiable ne peut en être tirée, ni pour l'UE ni pour le
      // semestre.
      expect(result.generalAverage).toBeNull();
      const ue1 = result.ueResults.find((r) => r.ueId === 'ue1');
      expect(ue1?.average).not.toBeNaN();
      expect(ue1?.average).toBeNull();
    },
  );

  // Verdict d'UE honnête — isValidated/isEliminatory/needsCompensation ne
  // reflètent que des issues VERROUILLÉES (certaines quel que soit le
  // résultat des matières encore en attente), jamais une moyenne partielle
  // qui pourrait encore bouger dans un sens ou dans l'autre.

  it(
    'une UE incomplète à 12/vide (coeffs égaux) n\'est ni validée ni à ' +
      'compenser : l\'issue reste ouverte, le semestre est "En cours"',
    () => {
      const semester = makeSemester([
        makeUE({
          id: 'ue1',
          coefficient: 1,
          ecs: [
            makeEC({ id: 'ec1', coefficient: 1, grade: 12 }),
            makeEC({ id: 'ec2', coefficient: 1, grade: null }),
          ],
        }),
      ]);

      const result = calculateSemesterAverage(semester, 10);

      // minPossible = (12+0)/2 = 6 < 10 -> pas validée.
      // maxPossible = (12+20)/2 = 16 >= 10 -> pas à compenser, pas éliminatoire.
      const ue1 = result.ueResults.find((r) => r.ueId === 'ue1');
      expect(ue1?.isValidated).toBe(false);
      expect(ue1?.needsCompensation).toBe(false);
      expect(ue1?.isEliminatory).toBe(false);
      expect(result.status).toBe('En cours');
    },
  );

  it(
    'une UE incomplète à 9/vide dont le maximum atteignable reste >= au ' +
      'seuil de validation n\'est pas encore "à compenser", et pas éliminatoire',
    () => {
      const semester = makeSemester([
        makeUE({
          id: 'ue1',
          coefficient: 1,
          ecs: [
            makeEC({ id: 'ec1', coefficient: 1, grade: 9 }),
            makeEC({ id: 'ec2', coefficient: 1, grade: null }),
          ],
        }),
      ]);

      const result = calculateSemesterAverage(semester, 10);

      // maxPossible = (9+20)/2 = 14.5 >= 10 -> issue encore ouverte.
      const ue1 = result.ueResults.find((r) => r.ueId === 'ue1');
      expect(ue1?.needsCompensation).toBe(false);
      expect(ue1?.isEliminatory).toBe(false);
    },
  );

  it(
    'une UE incomplète dont le maximum atteignable est déjà sous le seuil ' +
      "d'élimination est éliminatoire (condamnée) et le semestre est " +
      '"Non validé", même si une autre UE pourrait encore faire 20/20',
    () => {
      const semester = makeSemester([
        // UE1 : ec1 à 0 (fort coeff), ec2 en attente (faible coeff) ->
        // maxPossible = (0*3 + 20*1) / 4 = 5, déjà sous le seuil (8).
        makeUE({
          id: 'ue1',
          coefficient: 1,
          ecs: [
            makeEC({ id: 'ec1', coefficient: 3, grade: 0 }),
            makeEC({ id: 'ec2', coefficient: 1, grade: null }),
          ],
        }),
        // UE2 : entièrement en attente, pourrait encore faire 20/20.
        makeUE({
          id: 'ue2',
          coefficient: 1,
          ecs: [makeEC({ id: 'ec3', coefficient: 1, grade: null })],
        }),
      ]);

      const result = calculateSemesterAverage(semester, 10);

      const ue1 = result.ueResults.find((r) => r.ueId === 'ue1');
      expect(ue1?.isComplete).toBe(false);
      expect(ue1?.isEliminatory).toBe(true);
      expect(result.status).toBe('Non validé');
    },
  );

  it(
    'eliminationThreshold: null désactive l\'élimination pour cette UE : ' +
      'une UE complète à 7 compensée par une autre UE donne "Compensé"',
    () => {
      const semester = makeSemester([
        // UE1 : complète à 7, élimination désactivée -> jamais éliminatoire,
        // même sous le seuil par défaut (8).
        makeUE({
          id: 'ue1',
          coefficient: 1,
          eliminationThreshold: null,
          ecs: [makeEC({ id: 'ec1', coefficient: 1, grade: 7 })],
        }),
        // UE2 : compense largement UE1 pour amener la moyenne générale à 12.
        makeUE({
          id: 'ue2',
          coefficient: 1,
          ecs: [makeEC({ id: 'ec2', coefficient: 1, grade: 17 })],
        }),
      ]);

      const result = calculateSemesterAverage(semester, 10);

      const ue1 = result.ueResults.find((r) => r.ueId === 'ue1');
      expect(ue1?.isEliminatory).toBe(false);
      expect(ue1?.needsCompensation).toBe(true);
      expect(result.generalAverage).toBe(12);
      expect(result.status).toBe('Compensé');
    },
  );

  it(
    'eliminationThreshold: undefined applique toujours le seuil par ' +
      "défaut (8) : une UE complète à 7 reste éliminatoire",
    () => {
      const semester = makeSemester([
        makeUE({
          id: 'ue1',
          coefficient: 1,
          ecs: [makeEC({ id: 'ec1', coefficient: 1, grade: 7 })],
        }),
      ]);

      const result = calculateSemesterAverage(semester, 10);

      const ue1 = result.ueResults.find((r) => r.ueId === 'ue1');
      expect(ue1?.isEliminatory).toBe(true);
      expect(result.status).toBe('Non validé');
    },
  );

  // Les seuils comparent le centième affiché (half up), pas la moyenne brute.
  it(
    'une UE complète à 9,995 s\'affiche 10,00 : validée pour un seuil de 10, pas à compenser',
    () => {
      const semester = makeSemester([
        makeUE({
          id: 'ue1',
          coefficient: 1,
          validationThreshold: 10,
          ecs: [makeEC({ id: 'ec1', coefficient: 1, grade: 9.995 })],
        }),
      ]);

      const result = calculateSemesterAverage(semester, 10);
      const ue1 = result.ueResults.find((r) => r.ueId === 'ue1');

      expect(ue1?.isComplete).toBe(true);
      expect(ue1?.average).toBe(10);
      expect(ue1?.isValidated).toBe(true);
      expect(ue1?.needsCompensation).toBe(false);
    },
  );

  it(
    'une UE complète à 7,996 s\'affiche 8,00 : pas éliminatoire pour un seuil de 8',
    () => {
      const semester = makeSemester([
        makeUE({
          id: 'ue1',
          coefficient: 1,
          eliminationThreshold: 8,
          ecs: [makeEC({ id: 'ec1', coefficient: 1, grade: 7.996 })],
        }),
      ]);

      const result = calculateSemesterAverage(semester, 10);
      const ue1 = result.ueResults.find((r) => r.ueId === 'ue1');

      expect(ue1?.isComplete).toBe(true);
      expect(ue1?.average).toBe(8);
      expect(ue1?.isEliminatory).toBe(false);
    },
  );

  it(
    'deux UE déjà au centième 9,99 et 10,00 affichent un semestre à 10,00, compensé, jamais non validé',
    () => {
      const semester = makeSemester([
        makeUE({
          id: 'ue1',
          coefficient: 1,
          ecs: [makeEC({ id: 'ec1', coefficient: 1, grade: 9.99 })],
        }),
        makeUE({
          id: 'ue2',
          coefficient: 1,
          ecs: [makeEC({ id: 'ec2', coefficient: 1, grade: 10 })],
        }),
      ]);

      const result = calculateSemesterAverage(semester, 10);
      const ue1 = result.ueResults.find((r) => r.ueId === 'ue1');
      const ue2 = result.ueResults.find((r) => r.ueId === 'ue2');

      expect(ue1?.average).toBe(9.99);
      expect(ue1?.needsCompensation).toBe(true);
      expect(ue2?.average).toBe(10);
      expect(ue2?.isValidated).toBe(true);
      expect(result.generalAverage).toBe(10);
      expect(result.status).toBe('Compensé');
      expect(result.status).not.toBe('Non validé');
    },
  );

  it('une note 25 et une note -3 ne participent pas à la moyenne', () => {
    const semester = makeSemester([
      makeUE({
        id: 'ue1',
        coefficient: 1,
        ecs: [
          makeEC({ id: 'ec-high', coefficient: 1, grade: 25 }),
          makeEC({ id: 'ec-low', coefficient: 1, grade: -3 }),
          makeEC({ id: 'ec-ok', coefficient: 1, grade: 12 }),
          makeEC({
            id: 'ec-sim',
            coefficient: 1,
            grade: null,
            futureGrade: { mode: 'simulated', value: 25 },
          }),
        ],
      }),
    ]);

    const result = calculateSemesterAverage(semester, 10);
    const ue1 = result.ueResults.find((r) => r.ueId === 'ue1');

    // Seule la note 12 compte. 25, -3 et une simulation à 25 sont en attente.
    expect(ue1?.average).toBe(12);
    expect(ue1?.isComplete).toBe(false);
    expect(result.generalAverage).toBeNull();
    expect(result.status).toBe('En cours');
  });

  it('un coefficient -1 est un poids nul et ne fait pas baisser la moyenne', () => {
    const semester = makeSemester([
      makeUE({
        id: 'ue1',
        coefficient: 1,
        ecs: [
          makeEC({ id: 'ec1', coefficient: 1, grade: 18 }),
          makeEC({ id: 'ec2', coefficient: -1, grade: 0 }),
        ],
      }),
      makeUE({
        id: 'ue2',
        coefficient: -1,
        ecs: [makeEC({ id: 'ec3', coefficient: 1, grade: 12 })],
      }),
    ]);

    const result = calculateSemesterAverage(semester, 10);

    expect(result.ueResults.find((r) => r.ueId === 'ue1')?.average).toBe(18);
    expect(result.generalAverage).toBe(18);
    expect(result.status).toBe('Validé');
  });

  it(
    'effacer le champ SIM retire la simulation : le semestre redevient incomplet et un 0 n\'est pas compté',
    () => {
      const cleared = sanitizeSimulatedGrade('');
      expect(cleared).toBeNull();

      const semester = makeSemester([
        makeUE({
          id: 'ue1',
          coefficient: 1,
          ecs: [
            makeEC({ id: 'ec1', coefficient: 1, grade: 16 }),
            makeEC({ id: 'ec2', coefficient: 1, grade: null, futureGrade: null }),
          ],
        }),
      ]);

      const result = calculateSemesterAverage(semester, 10);
      const ue1 = result.ueResults.find((r) => r.ueId === 'ue1');

      // (16 + 0) / 2 = 8 serait la moyenne si le champ vidé écrivait 0.
      expect(ue1?.average).toBe(16);
      expect(ue1?.isComplete).toBe(false);
      expect(result.generalAverage).toBeNull();
      expect(result.averageRange).toEqual({ floor: 8, ceiling: 18 });
      expect(result.status).toBe('En cours');
    },
  );
});
