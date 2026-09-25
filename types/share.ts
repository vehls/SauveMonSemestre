/**
 * Format "partageable" d'une grille de semestre : uniquement la structure
 * (UE, matières, coefficients, seuils) — jamais les notes personnelles de
 * l'étudiant qui partage le lien.
 */

export interface SharedEC {
  name: string;
  coefficient: number;
}

export interface SharedUE {
  name: string;
  coefficient: number;
  /** Seuil de validation, uniquement si différent de la valeur par défaut. */
  validationThreshold?: number;
  /**
   * Seuil d'élimination, uniquement si différent de la valeur par défaut.
   * `null` = élimination explicitement désactivée pour cette UE (voir
   * {@link UE.eliminationThreshold}) ; doit être préservé tel quel au
   * round-trip du lien, une promo sans élimination ne doit pas se
   * retrouver avec le seuil par défaut (8) une fois le lien importé.
   */
  eliminationThreshold?: number | null;
  ecs: SharedEC[];
}

/** Version du format, pour permettre une évolution rétrocompatible plus tard. */
export const SHARED_GRID_VERSION = 1 as const;

export interface SharedGrid {
  version: typeof SHARED_GRID_VERSION;
  semesterName?: string;
  ues: SharedUE[];
}
