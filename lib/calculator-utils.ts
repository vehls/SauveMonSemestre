import {
  DEFAULT_ELIMINATION_THRESHOLD,
  DEFAULT_VALIDATION_THRESHOLD,
  type EC,
  type RevisionAdvice,
  type RevisionPriority,
  type Semester,
  type SemesterCalculationResult,
  type UE,
  type UEResult,
  type ValidationStatus,
} from '../types/calculator';

/** Arrondit à 2 décimales pour un affichage propre des moyennes. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Arrondit la note minimale requise au centième SUPÉRIEUR, jamais en
 * dessous du besoin réel : un `Math.round` classique pourrait ramener un
 * besoin réel de 20,004 à 20,00, une note que l'étudiant pourrait obtenir
 * tout en restant, en réalité, sous sa cible. `raw <= 0` renvoie
 * explicitement `0` (objectif déjà acquis, quel que soit le résultat des
 * examens restants) plutôt qu'un `Math.ceil` de valeur négative qui ne
 * donnerait pas forcément 0 exactement.
 */
function roundRequiredGradeUp(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) {
    return 0;
  }
  return Math.ceil(raw * 100) / 100;
}

/** `coefficient` s'il est un nombre fini, sinon un poids nul (voir bug "NaN"). */
function safeCoefficient(coefficient: number): number {
  return Number.isFinite(coefficient) ? coefficient : 0;
}

/** `grade` s'il est un nombre fini, sinon `null` (traité comme "en attente"). */
function safeGrade(grade: number | null): number | null {
  return grade !== null && Number.isFinite(grade) ? grade : null;
}

/**
 * Retourne la note "effective" d'une matière, utilisée dans tous les
 * calculs de moyenne en temps réel :
 * - la note réelle si l'examen a été passé et noté,
 * - sinon la note verrouillée ou simulée (`ec.futureGrade`, quel que soit
 *   son `mode`) si l'utilisateur en a saisi une pour cet examen à venir,
 * - sinon `null` (examen réellement en attente, sans aucune valeur saisie).
 *
 * C'est ce mécanisme qui permet à la moyenne générale et à la stratégie de
 * révision de réagir immédiatement lorsqu'une note est simulée depuis
 * `UECard`, sans attendre que l'examen ait réellement eu lieu.
 */
function getEffectiveGrade(ec: EC): number | null {
  if (ec.grade !== null) {
    return ec.grade;
  }
  if (ec.futureGrade) {
    return ec.futureGrade.value;
  }
  return null;
}

/**
 * Calcule la moyenne d'une UE à partir des notes effectives de ses
 * matières, pondérées par leur coefficient.
 *
 * `isComplete` indique si toutes les matières ont une note effective
 * (aucun examen en attente). Si `isComplete` est `false`, `average`
 * reflète uniquement les matières déjà connues et doit être interprété
 * comme une moyenne partielle/provisoire.
 */
function computeUEAverage(ue: UE): { average: number | null; isComplete: boolean } {
  let weightedSum = 0;
  let weightSum = 0;
  let hasPending = false;

  for (const ec of ue.ecs) {
    const grade = safeGrade(getEffectiveGrade(ec));
    const coefficient = safeCoefficient(ec.coefficient);
    if (grade === null) {
      hasPending = true;
      continue;
    }
    weightedSum += grade * coefficient;
    weightSum += coefficient;
  }

  // `weightSum` ne peut plus devenir NaN (coefficients invalides déjà
  // ramenés à 0 ci-dessus) : un simple `<= 0` suffit à couvrir à la fois
  // "aucune matière notée" et "toutes les matières notées ont un
  // coefficient nul/invalide" — dans les deux cas, aucune moyenne fiable
  // ne peut en être tirée.
  if (weightSum <= 0) {
    return { average: null, isComplete: false };
  }

  return { average: weightedSum / weightSum, isComplete: !hasPending };
}

/**
 * Calcule, pour une UE, les moyennes minimale et maximale
 * mathématiquement atteignables une fois toutes ses matières notées :
 * - `minPossible` : chaque matière encore en attente compte pour 0/20.
 * - `maxPossible` : chaque matière encore en attente compte pour 20/20.
 *
 * Contrairement à {@link computeUEAverage} (qui ne pondère que les
 * matières déjà notées, pour donner une moyenne partielle lisible),
 * `weightSum` compte ici TOUTES les matières de l'UE, notées ou non : ce
 * sont ces bornes qui permettent de savoir si l'issue de l'UE est déjà
 * verrouillée (voir {@link calculateSemesterAverage}), pas seulement sa
 * valeur partielle actuelle.
 *
 * Retourne `{ null, null }` si l'UE n'a aucune matière à poids positif
 * (aucune matière, ou coefficients tous nuls/invalides) : aucune borne
 * fiable ne peut en être tirée.
 */
function computeUEMinMaxPossible(ue: UE): { minPossible: number | null; maxPossible: number | null } {
  let minWeightedSum = 0;
  let maxWeightedSum = 0;
  let weightSum = 0;
  const MAX_GRADE = 20;

  for (const ec of ue.ecs) {
    const coefficient = safeCoefficient(ec.coefficient);
    const grade = safeGrade(getEffectiveGrade(ec));
    weightSum += coefficient;
    if (grade === null) {
      // minWeightedSum += 0 * coefficient (no-op, explicite pour la lecture).
      maxWeightedSum += MAX_GRADE * coefficient;
    } else {
      minWeightedSum += grade * coefficient;
      maxWeightedSum += grade * coefficient;
    }
  }

  if (!Number.isFinite(weightSum) || weightSum <= 0) {
    return { minPossible: null, maxPossible: null };
  }

  return { minPossible: minWeightedSum / weightSum, maxPossible: maxWeightedSum / weightSum };
}

/**
 * Calcule la moyenne maximale mathématiquement atteignable si toutes les
 * matières encore en attente obtenaient la note maximale (20/20). Sert à
 * distinguer un semestre réellement compromis d'un semestre simplement
 * incomplet (voir {@link calculateSemesterAverage}).
 */
function computeMaxPossibleAverage(
  knownWeightedSum: number,
  knownWeight: number,
  pendingWeight: number,
): number | null {
  const totalWeight = knownWeight + pendingWeight;
  if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
    return null;
  }
  const MAX_GRADE = 20;
  return (knownWeightedSum + pendingWeight * MAX_GRADE) / totalWeight;
}

/** Une matière "aplatie" à l'échelle du semestre, avec son poids normalisé. */
interface FlattenedEC {
  ec: EC;
  ue: UE;
  /**
   * Poids normalisé de cette matière dans la moyenne générale du semestre :
   * `(coeff EC / somme des coeff EC de l'UE) * coeff UE`.
   */
  normalizedWeight: number;
  /** Note effective (réelle/verrouillée/simulée), ou `null` si en attente. */
  effectiveGrade: number | null;
}

/**
 * "Aplatit" la double pondération EC → UE → semestre en une liste plate de
 * matières avec leur poids normalisé, ainsi que les agrégats nécessaires au
 * calcul de la moyenne générale (voir {@link calculateSemesterAverage}).
 *
 * Partagé entre `calculateSemesterAverage` et `analyzeRevisionStrategy` pour
 * garantir que les deux fonctions raisonnent avec exactement la même
 * pondération.
 */
function flattenSemester(semester: Semester): {
  items: FlattenedEC[];
  knownWeightedSum: number;
  knownWeight: number;
  pendingWeight: number;
} {
  const items: FlattenedEC[] = [];
  let knownWeightedSum = 0;
  let knownWeight = 0;
  let pendingWeight = 0;

  for (const ue of semester.ues) {
    const ueCoefficient = safeCoefficient(ue.coefficient);
    const ueECCoefficientSum = ue.ecs.reduce((sum, ec) => sum + safeCoefficient(ec.coefficient), 0);
    if (!Number.isFinite(ueECCoefficientSum) || ueECCoefficientSum <= 0) {
      continue;
    }

    for (const ec of ue.ecs) {
      const grade = safeGrade(getEffectiveGrade(ec));
      const ecCoefficient = safeCoefficient(ec.coefficient);
      const normalizedWeight = (ecCoefficient / ueECCoefficientSum) * ueCoefficient;

      items.push({ ec, ue, normalizedWeight, effectiveGrade: grade });

      if (grade === null) {
        pendingWeight += normalizedWeight;
      } else {
        knownWeightedSum += grade * normalizedWeight;
        knownWeight += normalizedWeight;
      }
    }
  }

  return { items, knownWeightedSum, knownWeight, pendingWeight };
}

/**
 * Fonction pure calculant, pour un semestre donné :
 * - la moyenne générale (basée sur les notes réelles/verrouillées/simulées),
 * - le statut de validation (Validé, Compensé, Non validé, ou À simuler),
 * - la note minimale requise aux examens non encore passés pour atteindre
 *   `targetAverage` (10/20 par défaut) au semestre.
 *
 * Aucune mutation n'est effectuée sur les objets fournis en entrée.
 *
 * Hypothèses de calcul :
 * - La moyenne de chaque matière (EC) est pondérée par son coefficient au
 *   sein de son UE ; la moyenne de chaque UE est ensuite pondérée par son
 *   coefficient au sein du semestre (double pondération classique).
 * - Le verdict de chaque UE (`isEliminatory`/`isValidated`/
 *   `needsCompensation` dans {@link UEResult}) repose sur ses moyennes
 *   minimale et maximale mathématiquement atteignables
 *   ({@link computeUEMinMaxPossible}), pas seulement sur sa moyenne
 *   partielle actuelle : un verdict n'est retenu que lorsque l'issue est
 *   **verrouillée**, c'est-à-dire certaine quel que soit le résultat des
 *   matières encore en attente de cette UE.
 *   - Éliminatoire : élimination active pour cette UE (seuil non `null`)
 *     ET (UE complète avec moyenne sous le seuil, OU moyenne maximale
 *     déjà sous le seuil — condamnée même incomplète).
 *   - Validée : moyenne minimale déjà au niveau du seuil de validation
 *     (couvre aussi, trivialement, une UE complète déjà au-dessus).
 *   - À compenser : élimination non déclenchée ET moyenne maximale sous
 *     le seuil de validation — cette UE aura besoin d'être compensée par
 *     le reste du semestre, quoi qu'il arrive dans ses propres matières
 *     en attente.
 *   - Sinon, l'issue de l'UE reste ouverte (aucun des trois booléens).
 * - Une UE éliminatoire (y compris incomplète mais déjà condamnée) rend
 *   tout le semestre "Non validé", même si la moyenne générale atteint
 *   encore `targetAverage` : l'élimination bloque la compensation.
 * - Si aucune UE n'est éliminatoire et que la moyenne générale (calculée
 *   sur les notes déjà connues) atteint `targetAverage`, le statut est
 *   "Validé" si aucune UE n'a besoin d'être compensée, sinon "Compensé"
 *   (au moins une UE à l'issue verrouillée sous son seuil de validation
 *   est repêchée grâce à la compensation).
 * - "Validé" et "Compensé" ne sont **jamais** renvoyés tant qu'il reste au
 *   moins une matière sans note effective (réelle ou simulée) — même si la
 *   moyenne partielle actuelle dépasse déjà `targetAverage` : rien n'est
 *   acquis avant que le semestre soit entièrement joué (ou simulé).
 * - S'il reste des matières en attente, on ne renvoie **pas** pour autant
 *   immédiatement "Non validé" : on calcule la moyenne maximale
 *   mathématiquement atteignable en supposant 20/20 à tous les examens
 *   restants (`maxPossibleAverage`).
 *   - Si cette moyenne maximale est strictement inférieure à
 *     `targetAverage`, l'objectif est mathématiquement hors de portée :
 *     le statut est "Non validé".
 *   - Sinon, l'objectif reste possible : le statut est "En cours" si au
 *     moins une note est déjà connue, ou "À simuler" si aucune note n'a
 *     encore été saisie nulle part dans le semestre.
 * - Un semestre entièrement vide (aucune matière, ou aucune UE) renvoie
 *   également "À simuler" plutôt qu'un "Non validé" trompeur.
 * - La note minimale requise aux examens en attente est calculée en
 *   supposant une note uniforme sur l'ensemble de ces examens ; elle peut
 *   être `null` (rien en attente), `0` (objectif déjà acquis) ou
 *   supérieure à 20 (objectif mathématiquement inatteignable).
 */
export function calculateSemesterAverage(
  semester: Semester,
  targetAverage: number = 10,
): SemesterCalculationResult {
  const ueResults: UEResult[] = [];
  let hasEliminatoryUE = false;
  let hasCompensatedUE = false;

  // La moyenne générale affichée doit rester cohérente avec les moyennes de
  // carte UE que l'utilisateur voit à l'écran : elle pondère la moyenne
  // (déjà arrondie à 2 décimales, comme sur la carte) de chaque UE par son
  // coefficient — pas les matières une par une, ce qui donnerait un chiffre
  // différent dès qu'une UE contient plusieurs matières partiellement
  // notées (le poids des examens en attente y serait alors implicitement
  // retiré du dénominateur de CETTE UE plutôt que du semestre entier).
  // Une UE sans aucune note effective (average === null), ou dont le
  // coefficient n'est pas un nombre fini, est exclue du calcul (poids nul).
  let generalAverageNumerator = 0;
  let generalAverageDenominator = 0;

  for (const ue of semester.ues) {
    const validationThreshold = ue.validationThreshold ?? DEFAULT_VALIDATION_THRESHOLD;
    // Règle du seuil d'élimination :
    // - `undefined` -> seuil par défaut (8/20) appliqué.
    // - `null` -> élimination explicitement désactivée pour cette UE.
    // - un nombre -> ce seuil précis.
    const eliminationThreshold =
      ue.eliminationThreshold === undefined ? DEFAULT_ELIMINATION_THRESHOLD : ue.eliminationThreshold;
    const eliminationActive = eliminationThreshold !== null;

    const { average: ueAverage, isComplete } = computeUEAverage(ue);
    const { minPossible, maxPossible } = computeUEMinMaxPossible(ue);

    // Verdict verrouillé uniquement : chacun de ces trois booléens ne
    // devient vrai que si l'issue de l'UE est déjà certaine, quel que soit
    // le résultat de ses matières encore en attente (voir la doc de
    // {@link UEResult} et de cette fonction).
    const isEliminatory =
      eliminationActive &&
      ((isComplete && ueAverage !== null && ueAverage < eliminationThreshold) ||
        (maxPossible !== null && maxPossible < eliminationThreshold));
    const isValidated = minPossible !== null && minPossible >= validationThreshold;
    const needsCompensation = !isEliminatory && maxPossible !== null && maxPossible < validationThreshold;

    if (isEliminatory) {
      hasEliminatoryUE = true;
    } else if (needsCompensation) {
      // Issue verrouillée sous le seuil de validation (sans élimination) :
      // cette UE aura besoin d'être compensée par le reste du semestre.
      hasCompensatedUE = true;
    }

    const roundedUEAverage = ueAverage !== null ? round2(ueAverage) : null;

    if (roundedUEAverage !== null) {
      const ueCoefficient = safeCoefficient(ue.coefficient);
      generalAverageNumerator += roundedUEAverage * ueCoefficient;
      generalAverageDenominator += ueCoefficient;
    }

    ueResults.push({
      ueId: ue.id,
      average: roundedUEAverage,
      isComplete,
      isEliminatory,
      isValidated,
      needsCompensation,
    });
  }

  const generalAverage =
    Number.isFinite(generalAverageDenominator) && generalAverageDenominator > 0
      ? generalAverageNumerator / generalAverageDenominator
      : null;

  // La note minimale requise, elle, doit rester basée sur le poids
  // normalisé de chaque MATIÈRE dans le semestre complet (via
  // `flattenSemester`, partagé avec `analyzeRevisionStrategy`) : c'est ce
  // niveau de détail qui permet de savoir exactement combien de poids
  // reste "en attente" au semestre, indépendamment de la moyenne
  // provisoire (et arrondie) affichée par UE ci-dessus.
  const { knownWeightedSum, knownWeight, pendingWeight } = flattenSemester(semester);
  const maxPossibleAverage = computeMaxPossibleAverage(knownWeightedSum, knownWeight, pendingWeight);

  let requiredGradeForPendingExams: number | null = null;
  if (pendingWeight > 0) {
    const totalWeight = knownWeight + pendingWeight;
    const rawRequired = (targetAverage * totalWeight - knownWeightedSum) / pendingWeight;
    requiredGradeForPendingExams = roundRequiredGradeUp(rawRequired);
  }

  let status: ValidationStatus;
  if (hasEliminatoryUE) {
    // Une note finale éliminatoire bloque tout, quoi qu'il arrive ailleurs,
    // y compris si d'autres matières sont encore en attente.
    status = 'Non validé';
  } else if (pendingWeight > 0) {
    // Semestre incomplet : au moins une matière n'a ni note réelle ni
    // simulation. On ne tranche JAMAIS "Validé"/"Compensé" ici, même si la
    // moyenne partielle actuelle atteint déjà la cible — seul un semestre
    // entièrement joué (ou simulé) peut être validé.
    if (maxPossibleAverage !== null && maxPossibleAverage < targetAverage) {
      // Même 20/20 partout ne suffirait pas : l'objectif est déjà hors de
      // portée mathématiquement, pas besoin d'attendre la suite.
      status = 'Non validé';
    } else if (generalAverage === null) {
      // Aucune note connue nulle part encore : rien à évaluer pour l'instant.
      status = 'À simuler';
    } else {
      // Au moins une note connue, objectif encore atteignable, mais
      // semestre pas encore complet : statut provisoire "en cours".
      status = 'En cours';
    }
  } else if (generalAverage !== null && generalAverage >= targetAverage) {
    // Semestre complet (toutes les notes sont connues, réelles ou
    // simulées) et la moyenne atteint l'objectif.
    status = hasCompensatedUE ? 'Compensé' : 'Validé';
  } else if (generalAverage === null) {
    // Semestre entièrement vide (aucune matière, ou aucune UE) : rien à
    // évaluer pour l'instant.
    status = 'À simuler';
  } else {
    // Toutes les notes sont connues et la moyenne reste sous l'objectif.
    status = 'Non validé';
  }

  return {
    generalAverage: generalAverage !== null ? round2(generalAverage) : null,
    status,
    requiredGradeForPendingExams,
    ueResults,
  };
}

/**
 * Seuil (en proportion de l'impact maximal observé) au-delà duquel une
 * matière en attente est considérée comme "Priorité Haute".
 */
const HIGH_PRIORITY_IMPACT_RATIO = 0.75;

/**
 * Module "Stratégie de révision" : analyse toutes les matières sans note
 * réelle ni note verrouillée/simulée (examen à venir ou pas encore saisi)
 * et les classe par ordre d'impact décroissant sur la moyenne générale du
 * semestre.
 *
 * Pour chaque matière en attente :
 * - `impactPerPoint` = gain sur la moyenne générale du semestre pour
 *   **+1 point** obtenu dans cette matière (dérivée partielle de la
 *   moyenne générale par rapport à la note de cette matière, toutes
 *   choses égales par ailleurs). Ce gain dépend directement du coefficient
 *   de la matière au sein de son UE et du coefficient de l'UE au sein du
 *   semestre : plus il est élevé, plus chaque point compte.
 * - `gainPerTwoPoints` = le même gain pour **+2 points** ("rendement
 *   d'effort"), pour visualiser concrètement l'intérêt de pousser un peu
 *   plus fort sur telle ou telle matière.
 * - `priority` vaut `'Priorité Haute'` pour les matières dont l'impact par
 *   point atteint au moins {@link HIGH_PRIORITY_IMPACT_RATIO} (75 %) de
 *   l'impact maximal observé parmi les matières en attente ; les autres
 *   sont classées `'Priorité normale'`.
 *
 * Le résultat est trié par impact décroissant (les priorités les plus
 * rentables en premier). Retourne un tableau vide si toutes les notes sont
 * déjà connues ou si le semestre ne contient aucune matière.
 *
 * Fonction pure : aucune mutation du semestre fourni en entrée.
 */
export function analyzeRevisionStrategy(
  semester: Semester,
  targetAverage: number = 10,
): RevisionAdvice[] {
  // targetAverage est accepté pour cohérence avec calculateSemesterAverage
  // et un usage futur (ex: pondérer la priorité par l'urgence de l'objectif),
  // mais l'impact par point ne dépend pas de la cible : il ne dépend que
  // des poids relatifs des matières dans la moyenne du semestre.
  void targetAverage;

  const { items, knownWeight, pendingWeight } = flattenSemester(semester);
  const totalWeight = knownWeight + pendingWeight;

  const pendingItems = items.filter((item) => item.effectiveGrade === null);
  if (pendingItems.length === 0 || totalWeight === 0) {
    return [];
  }

  const rawImpacts = pendingItems.map((item) => item.normalizedWeight / totalWeight);
  const maxImpact = Math.max(...rawImpacts);

  return pendingItems
    .map((item, index) => {
      const impactPerPoint = rawImpacts[index];
      const priority: RevisionPriority =
        maxImpact > 0 && impactPerPoint >= maxImpact * HIGH_PRIORITY_IMPACT_RATIO
          ? 'Priorité Haute'
          : 'Priorité normale';

      return {
        ecId: item.ec.id,
        ecName: item.ec.name,
        ueId: item.ue.id,
        ueName: item.ue.name,
        weight: round2(item.normalizedWeight),
        impactPerPoint: round2(impactPerPoint),
        gainPerTwoPoints: round2(impactPerPoint * 2),
        priority,
      };
    })
    .sort((a, b) => b.impactPerPoint - a.impactPerPoint);
}
