/**
 * Modèle de données pour le calculateur de moyenne universitaire
 * "SauveMonSemestre".
 *
 * Hiérarchie :
 *   AcademicYear -> Semester (x2) -> UE (Unité d'Enseignement) -> EC (matière)
 *
 * Règles de compensation (système universitaire français classique) :
 * - Chaque UE possède un seuil de validation (par défaut 10/20) et un seuil
 *   d'élimination (par défaut 8/20).
 * - Une UE dont la moyenne est strictement inférieure à son seuil
 *   d'élimination est dite "éliminatoire" : elle bloque toute compensation,
 *   même si la moyenne générale du semestre est >= 10/20.
 * - Une UE dont la moyenne se situe entre le seuil d'élimination et le seuil
 *   de validation peut malgré tout être validée par compensation si la
 *   moyenne du semestre (ou de l'année) atteint 10/20.
 */

/** Note sur l'échelle française standard de 0 à 20. */
export type Grade20 = number;

/**
 * Manière de traiter la note d'un examen qui n'a pas encore eu lieu.
 *
 * - `locked` : la note est considérée comme certaine/définitive (ex : une
 *   note de rattrapage déjà connue, ou une valeur que l'on souhaite
 *   "figer" pendant qu'on explore d'autres scénarios). Elle se comporte
 *   exactement comme une vraie note dans tous les calculs.
 * - `simulated` : une valeur purement hypothétique ("et si j'avais...") qui
 *   permet de prévisualiser l'impact sur la moyenne sans s'engager. Les
 *   composants d'affichage peuvent choisir de la distinguer visuellement
 *   d'une note réelle ou verrouillée.
 */
export type FutureGradeMode = 'locked' | 'simulated';

/** Note hypothétique associée à un examen non encore passé. */
export interface FutureGradeSimulation {
  mode: FutureGradeMode;
  value: Grade20;
}

/**
 * EC = "Élément Constitutif", c'est-à-dire une matière au sein d'une UE.
 */
export interface EC {
  id: string;
  name: string;
  /** Poids de cette matière au sein de son UE. */
  coefficient: number;
  /**
   * Note obtenue sur 20, ou `null` si l'examen n'a pas encore été passé
   * ou noté.
   */
  grade: Grade20 | null;
  /**
   * Verrouillage/simulation optionnel pour un examen non encore passé
   * (`grade === null`). Ignoré si `grade` n'est pas `null`.
   */
  futureGrade?: FutureGradeSimulation | null;
}

/**
 * UE = "Unité d'Enseignement", un regroupement de matières (EC) partageant
 * un coefficient et ses propres seuils de compensation.
 */
export interface UE {
  id: string;
  name: string;
  /** Poids de cette UE au sein de son semestre. */
  coefficient: number;
  ecs: EC[];
  /** Moyenne minimale pour valider l'UE directement (par défaut 10). */
  validationThreshold?: number;
  /**
   * Moyenne d'UE strictement inférieure à cette valeur = note éliminatoire :
   * bloque toute compensation au niveau du semestre/année.
   *
   * - `undefined` : seuil par défaut ({@link DEFAULT_ELIMINATION_THRESHOLD},
   *   8/20) appliqué.
   * - `null` : élimination explicitement désactivée pour cette UE (jamais
   *   éliminatoire, quelle que soit sa moyenne).
   * - un nombre : ce seuil précis.
   */
  eliminationThreshold?: number | null;
}

export interface Semester {
  id: string;
  name: string;
  /** Numéro du semestre (1 ou 2) au sein de l'année universitaire. */
  number: 1 | 2;
  ues: UE[];
}

/** Une année universitaire contient toujours exactement deux semestres. */
export interface AcademicYear {
  id: string;
  name: string;
  semesters: [Semester, Semester];
}

/** Seuils par défaut utilisés lorsqu'une UE ne les surcharge pas. */
export const DEFAULT_VALIDATION_THRESHOLD = 10;
export const DEFAULT_ELIMINATION_THRESHOLD = 8;

/**
 * Statut de validation renvoyé par le calculateur.
 *
 * Deux statuts neutres (ni succès, ni échec) existent pour un semestre pas
 * encore entièrement joué :
 * - `'À simuler'` : aucune note connue nulle part (semestre vide ou aucune
 *   note saisie encore) — rien à évaluer pour l'instant.
 * - `'En cours'` : au moins une note est déjà connue, mais il reste des
 *   examens en attente ; l'objectif reste mathématiquement atteignable.
 *   Ce statut ne devient JAMAIS `'Validé'`/`'Compensé'` tant qu'il reste
 *   des matières sans note effective (réelle ou simulée), même si la
 *   moyenne partielle actuelle dépasse déjà la cible.
 *
 * Ni l'un ni l'autre ne s'affiche jamais comme un échec.
 */
export type ValidationStatus = 'Validé' | 'Compensé' | 'Non validé' | 'À simuler' | 'En cours';

/**
 * Détail du résultat de calcul pour une UE donnée.
 *
 * `isEliminatory`, `isValidated` et `needsCompensation` reposent sur les
 * moyennes minimale/maximale mathématiquement atteignables par l'UE
 * (examens restants respectivement à 0 et 20/20), pas uniquement sur sa
 * moyenne partielle actuelle : chacun de ces trois booléens ne devient
 * `true` que lorsque l'issue est **verrouillée**, c'est-à-dire certaine
 * quel que soit le résultat des matières encore en attente. Tant qu'aucun
 * des trois n'est vrai, l'issue de l'UE reste ouverte (badge "En cours"),
 * même si sa moyenne partielle est déjà connue.
 */
export interface UEResult {
  ueId: string;
  /** Moyenne (partielle) de l'UE, ou `null` si aucune note n'est encore connue. */
  average: number | null;
  /** `true` si toutes les matières de l'UE ont une note effective. */
  isComplete: boolean;
  /**
   * `true` si l'élimination est active pour cette UE ET que son issue est
   * verrouillée sous le seuil d'élimination : soit l'UE est complète avec
   * une moyenne sous le seuil, soit même 20/20 à toutes les matières
   * restantes ne suffirait pas à repasser au-dessus (`maxPossible` sous le
   * seuil) — dans ce dernier cas, l'UE est déjà condamnée bien qu'encore
   * incomplète.
   */
  isEliminatory: boolean;
  /**
   * `true` si l'issue est verrouillée AU-DESSUS du seuil de validation :
   * même 0/20 à toutes les matières restantes suffirait encore
   * (`minPossible` atteint déjà le seuil). Couvre aussi, trivialement, le
   * cas d'une UE complète déjà au-dessus de son seuil.
   */
  isValidated: boolean;
  /**
   * `true` si l'élimination n'est pas déclenchée mais que l'issue est
   * verrouillée SOUS le seuil de validation : même 20/20 à toutes les
   * matières restantes ne suffirait pas à l'atteindre (`maxPossible` sous
   * le seuil). Cette UE aura besoin d'être compensée par le reste du
   * semestre, quoi qu'il arrive dans ses propres matières encore en
   * attente.
   */
  needsCompensation: boolean;
}

/** Résultat complet du calcul de moyenne d'un semestre. */
export interface SemesterCalculationResult {
  /**
   * Moyenne générale pondérée du semestre, calculée à partir des notes
   * connues (réelles, verrouillées ou simulées). `null` si aucune note
   * n'est encore connue.
   */
  generalAverage: number | null;
  /** Statut de validation dérivé des seuils d'UE et des règles de compensation. */
  status: ValidationStatus;
  /**
   * Note minimale (sur 20) qu'il faudrait obtenir uniformément à tous les
   * examens non encore passés (ceux sans note réelle ni note
   * verrouillée/simulée) pour atteindre 10/20 au semestre.
   *
   * - `null` : il n'y a plus aucun examen en attente.
   * - `0` : l'objectif est déjà acquis quel que soit le résultat des
   *   examens restants.
   * - une valeur > 20 signale un objectif mathématiquement inatteignable,
   *   même avec 20/20 partout.
   */
  requiredGradeForPendingExams: number | null;
  /** Détail par UE, utile pour l'affichage. */
  ueResults: UEResult[];
}

/**
 * Niveau de priorité d'un conseil de révision.
 *
 * - `'Priorité Haute'` : la matière fait partie de celles dont 1 point
 *   gagné a le plus d'impact sur la moyenne générale du semestre (gros
 *   coefficient et/ou UE peu fournie en matières).
 * - `'Priorité normale'` : la matière reste à réviser mais son impact
 *   marginal sur la moyenne est plus faible que les priorités hautes.
 */
export type RevisionPriority = 'Priorité Haute' | 'Priorité normale';

/**
 * Conseil de révision pour une matière sans note réelle ni note
 * verrouillée/simulée (examen à venir ou non encore saisi).
 */
export interface RevisionAdvice {
  ecId: string;
  ecName: string;
  ueId: string;
  ueName: string;
  /** Poids normalisé de cette matière dans la moyenne générale du semestre. */
  weight: number;
  /**
   * Gain sur la moyenne générale du semestre pour +1 point obtenu dans
   * cette matière (toutes choses égales par ailleurs).
   */
  impactPerPoint: number;
  /**
   * Gain sur la moyenne générale du semestre pour +2 points obtenus dans
   * cette matière ("rendement d'effort").
   */
  gainPerTwoPoints: number;
  priority: RevisionPriority;
}
