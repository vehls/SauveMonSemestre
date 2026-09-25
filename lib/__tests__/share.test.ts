import { describe, expect, it } from 'vitest';
import { buildSharedGrid, decodeSharedGrid, decodeSharedGridFromSearch, encodeSharedGrid } from '../share';
import type { Semester } from '../../types/calculator';
import type { SharedGrid } from '../../types/share';

/**
 * Grille volontairement assez riche (plusieurs UE/matières, noms variés)
 * pour que son payload compressé par lz-string contienne de façon fiable
 * au moins un « + » — condition nécessaire pour que le test reproduise
 * effectivement le bug (une grille trop petite/simple peut compresser en
 * une chaîne qui n'en contient aucun, ce qui ne prouverait rien).
 */
function makeGrid(): SharedGrid {
  return {
    version: 1,
    semesterName: 'L3 Test Promo Longue Avec Beaucoup De Caractères Variés 0123456789',
    ues: Array.from({ length: 8 }, (_, i) => ({
      name: `UE${i} Nom Long Varié`,
      coefficient: i + 1,
      ecs: Array.from({ length: 5 }, (_, j) => ({
        name: `Matière ${i}-${j} xyzXYZ`,
        coefficient: j + 1,
      })),
    })),
  };
}

// Bug 5 — l'alphabet de `compressToEncodedURIComponent` (A–Z a–z 0–9 + - $)
// contient un « + » qu'`URLSearchParams` interprète comme un espace s'il
// n'est pas correctement pourcent-encodé (convention
// `application/x-www-form-urlencoded`). Un aperçu de lien ou une
// redirection qui réécrit la query sans ré-encoder transforme donc
// silencieusement le payload compressé, faisant échouer le décodage.
describe('partage de grille : robustesse au "+" de lz-string', () => {
  it(
    'décode correctement une grille même si les « + » du payload compressé ' +
      'ont été remplacés par des espaces (aperçu de lien / redirection qui ' +
      'réécrit la query sans ré-encoder)',
    () => {
      const grid = makeGrid();
      const encoded = encodeSharedGrid(grid);

      // Le test ne prouverait rien si le payload ne contenait aucun « + »
      // à corrompre : on vérifie donc explicitement sa présence.
      expect(encoded).toContain('+');

      const corrupted = encoded.replace(/\+/g, ' ');
      expect(corrupted).not.toBe(encoded);

      // Simule le chemin réel de lecture d'URL : une query string où le
      // paramètre `grid` contient déjà des espaces littéraux (ni « + », ni
      // « %20 ») — exactement ce qu'un aperçu ou une redirection produirait
      // en réécrivant la query sans ré-encoder.
      const decoded = decodeSharedGridFromSearch(`?grid=${corrupted}`);

      expect(decoded).toEqual(grid);
    },
  );

  it(
    'un aller-retour URLSearchParams.set / .get reste identique ' +
      '(le même navigateur, lui, encode bien le "+" en %2B)',
    () => {
      const grid = makeGrid();
      const encoded = encodeSharedGrid(grid);

      const params = new URLSearchParams();
      params.set('grid', encoded);
      const roundTripped = params.get('grid');

      expect(roundTripped).toBe(encoded);
      expect(decodeSharedGrid(roundTripped ?? '')).toEqual(grid);
    },
  );
});

// Verdict d'UE honnête — `eliminationThreshold: null` (élimination
// désactivée pour cette UE) doit survivre tel quel au partage : une promo
// sans élimination ne doit jamais se retrouver avec le seuil par défaut
// (8) une fois le lien importé par quelqu'un d'autre.
describe('partage de grille : préservation de eliminationThreshold: null', () => {
  it(
    "conserve eliminationThreshold: null (distinct d'undefined, qui " +
      'retomberait sur le seuil par défaut) au round-trip encode/décode',
    () => {
      const semester: Semester = {
        id: 'semester-test',
        name: 'Semestre test',
        number: 1,
        ues: [
          {
            id: 'ue1',
            name: 'UE élimination désactivée',
            coefficient: 1,
            eliminationThreshold: null,
            ecs: [{ id: 'ec1', name: 'Matière', coefficient: 1, grade: 7 }],
          },
          {
            id: 'ue2',
            name: 'UE seuil par défaut',
            coefficient: 1,
            // `eliminationThreshold` absent -> undefined -> seuil par défaut.
            ecs: [{ id: 'ec2', name: 'Matière', coefficient: 1, grade: 12 }],
          },
        ],
      };

      const grid = buildSharedGrid(semester);
      const decoded = decodeSharedGrid(encodeSharedGrid(grid));

      expect(decoded?.ues[0]?.eliminationThreshold).toBeNull();
      expect(decoded?.ues[1]?.eliminationThreshold).toBeUndefined();
    },
  );
});
