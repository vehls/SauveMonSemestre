import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';
import type { EC, Semester, UE } from '../types/calculator';
import { SHARED_GRID_VERSION, type SharedEC, type SharedGrid, type SharedUE } from '../types/share';
import { generateId } from './id';

/** Nom du paramètre de requête utilisé pour transporter la grille partagée. */
const SHARE_PARAM = 'grid';

/** Retire toute donnée personnelle (note, verrouillage/simulation) d'une matière. */
function stripEC(ec: EC): SharedEC {
  return { name: ec.name, coefficient: ec.coefficient };
}

/**
 * Retire toute note personnelle d'une UE, ne garde que la structure.
 *
 * `eliminationThreshold` est transmis tel quel dès qu'il n'est pas
 * `undefined` — y compris `null` (élimination désactivée) — pour que ce
 * choix survive au partage : une promo sans élimination ne doit pas se
 * retrouver avec le seuil par défaut (8) une fois le lien importé.
 */
function stripUE(ue: UE): SharedUE {
  return {
    name: ue.name,
    coefficient: ue.coefficient,
    ...(ue.validationThreshold !== undefined ? { validationThreshold: ue.validationThreshold } : {}),
    ...(ue.eliminationThreshold !== undefined ? { eliminationThreshold: ue.eliminationThreshold } : {}),
    ecs: ue.ecs.map(stripEC),
  };
}

/**
 * Construit la structure partageable d'un semestre : UE, matières et
 * coefficients uniquement, sans aucune note personnelle. Le nom de la
 * filière/promo (`semesterName`) est inclus dans le payload lz-string pour
 * que la personne qui reçoit le lien sache immédiatement de quelle grille
 * il s'agit.
 */
export function buildSharedGrid(semester: Semester): SharedGrid {
  const trimmedName = semester.name.trim();
  return {
    version: SHARED_GRID_VERSION,
    ...(trimmedName ? { semesterName: trimmedName } : {}),
    ues: semester.ues.map(stripUE),
  };
}

/** Compresse une grille partageable en une chaîne compacte, sûre pour une URL. */
export function encodeSharedGrid(grid: SharedGrid): string {
  return compressToEncodedURIComponent(JSON.stringify(grid));
}

function isSharedEC(value: unknown): value is SharedEC {
  if (!value || typeof value !== 'object') return false;
  const ec = value as Partial<SharedEC>;
  return typeof ec.name === 'string' && typeof ec.coefficient === 'number';
}

function isSharedUE(value: unknown): value is SharedUE {
  if (!value || typeof value !== 'object') return false;
  const ue = value as Partial<SharedUE>;
  return (
    typeof ue.name === 'string' &&
    typeof ue.coefficient === 'number' &&
    // Les seuils personnalisés sont optionnels, mais s'ils sont présents
    // (ex : lien construit par une version future, ou lien altéré), ils
    // doivent être des nombres pour être acceptés. `eliminationThreshold`
    // accepte aussi explicitement `null` (élimination désactivée pour
    // cette UE), qui doit survivre au round-trip du lien.
    (ue.validationThreshold === undefined || typeof ue.validationThreshold === 'number') &&
    (ue.eliminationThreshold === undefined ||
      ue.eliminationThreshold === null ||
      typeof ue.eliminationThreshold === 'number') &&
    Array.isArray(ue.ecs) &&
    ue.ecs.every(isSharedEC)
  );
}

/** Valide qu'une valeur désérialisée a bien la forme attendue d'une {@link SharedGrid}. */
function isSharedGrid(value: unknown): value is SharedGrid {
  if (!value || typeof value !== 'object') return false;
  const grid = value as Partial<SharedGrid>;
  return Array.isArray(grid.ues) && grid.ues.every(isSharedUE);
}

/**
 * Décompresse et valide une chaîne encodée en {@link SharedGrid}.
 * Retourne `null` si la chaîne est invalide, corrompue, ou d'un format
 * inattendu (ex : lien altéré, provenant d'une autre application).
 */
export function decodeSharedGrid(encoded: string): SharedGrid | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const parsed: unknown = JSON.parse(json);
    return isSharedGrid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Construit l'URL de partage complète (page courante + grille encodée en
 * paramètre de requête `grid`), à partir du semestre actuel de l'utilisateur.
 * Ne doit être appelé que côté client (utilise `window.location`).
 */
export function buildShareUrl(semester: Semester): string {
  const grid = buildSharedGrid(semester);
  const encoded = encodeSharedGrid(grid);
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set(SHARE_PARAM, encoded);
  return url.toString();
}

/**
 * Cherche une grille partagée dans l'URL courante (`?grid=...`) et la
 * décode si présente et valide. Retourne `null` côté serveur, si le
 * paramètre est absent, ou si son contenu est invalide.
 */
/**
 * Cœur de {@link extractSharedGridFromLocation}, isolé de `window.location`
 * pour rester testable sans environnement DOM : décode le paramètre `grid`
 * à partir d'une chaîne de requête brute (ex : `location.search`), en
 * passant par exactement le même chemin (`URLSearchParams` puis
 * restauration des « + », voir {@link restorePlusFromSpaces}) que la
 * lecture réelle d'une URL partagée.
 */
export function decodeSharedGridFromSearch(search: string): SharedGrid | null {
  const params = new URLSearchParams(search);
  const encoded = params.get(SHARE_PARAM);
  if (!encoded) return null;
  return decodeSharedGrid(restorePlusFromSpaces(encoded));
}

export function extractSharedGridFromLocation(): SharedGrid | null {
  if (typeof window === 'undefined') return null;
  return decodeSharedGridFromSearch(window.location.search);
}

/**
 * Restaure les « + » d'une chaîne compressée par lz-string
 * (`compressToEncodedURIComponent`) après un aller-retour par
 * `URLSearchParams`/un intermédiaire (aperçu de lien, redirection...) qui
 * aurait réécrit la query en interprétant un « + » non encodé comme un
 * espace (convention `application/x-www-form-urlencoded`).
 *
 * Sûr car l'alphabet de `compressToEncodedURIComponent` (A–Z a–z 0–9 + - $)
 * ne contient jamais d'espace : tout espace rencontré ici ne peut donc être
 * qu'un « + » mal interprété en amont, jamais un caractère légitime de la
 * chaîne compressée.
 */
function restorePlusFromSpaces(encoded: string): string {
  return encoded.replace(/ /g, '+');
}

/**
 * Retire le paramètre `grid` de l'URL affichée (sans recharger la page),
 * une fois la proposition d'import traitée (acceptée ou ignorée).
 */
export function clearShareParamFromUrl(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.delete(SHARE_PARAM);
  window.history.replaceState({}, '', url.toString());
}

/**
 * Convertit une grille partagée en un {@link Semester} complet et prêt à
 * l'emploi : nouveaux identifiants générés localement, toutes les notes
 * initialisées à `null` (aucune note personnelle n'est jamais transmise).
 */
export function sharedGridToSemester(grid: SharedGrid): Semester {
  return {
    id: generateId('semester'),
    name: grid.semesterName || 'Semestre partagé',
    number: 1,
    ues: grid.ues.map((ue) => ({
      id: generateId('ue'),
      name: ue.name,
      coefficient: ue.coefficient,
      validationThreshold: ue.validationThreshold,
      eliminationThreshold: ue.eliminationThreshold,
      ecs: ue.ecs.map((ec) => ({
        id: generateId('ec'),
        name: ec.name,
        coefficient: ec.coefficient,
        grade: null,
      })),
    })),
  };
}
