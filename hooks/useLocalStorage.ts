'use client';

import { useEffect, useState } from 'react';

/**
 * Vérifie récursivement qu'une valeur ne contient aucun nombre non fini
 * (`NaN`/`Infinity`/`-Infinity`). `JSON.stringify` ne lève jamais d'erreur
 * sur ces valeurs : il les sérialise silencieusement en `null`, ce qui
 * corromprait la donnée persistée sans qu'on s'en rende compte au
 * rechargement (une note ou un coefficient invalide disparaîtrait ou
 * deviendrait `null`). On préfère donc refuser explicitement d'écrire une
 * valeur qui en contient, plutôt que de la sérialiser telle quelle.
 */
function containsNonFiniteNumber(value: unknown): boolean {
  if (typeof value === 'number') {
    return !Number.isFinite(value);
  }
  if (Array.isArray(value)) {
    return value.some(containsNonFiniteNumber);
  }
  if (value && typeof value === 'object') {
    return Object.values(value).some(containsNonFiniteNumber);
  }
  return false;
}

/**
 * Hook générique pour synchroniser un état React avec le `localStorage` du
 * navigateur, sans jamais provoquer de rechargement de page.
 *
 * - SSR-safe : `window`/`localStorage` ne sont touchés que dans des
 *   `useEffect`, jamais pendant le rendu (aucun risque de mismatch
 *   d'hydratation Next.js).
 * - Lecture au montage : si une valeur existe déjà sous `key`, elle
 *   remplace `initialValue` juste après le premier rendu — mais seulement
 *   si `isValid` (quand fourni) confirme qu'elle a la forme attendue.
 *   Une valeur corrompue, d'un ancien format, ou d'un type inattendu
 *   (`null`, `{}`, un nombre à la place d'un objet...) est ignorée :
 *   `initialValue` est conservée en mémoire ET réécrite dans `localStorage`
 *   à la place, pour que l'app ne reste jamais bloquée par une clé
 *   corrompue tant qu'on ne la vide pas manuellement.
 * - Sauvegarde automatique : chaque changement de `value` (via le setter
 *   retourné) est immédiatement persisté en JSON dans `localStorage` — sauf
 *   si cette valeur contient un `NaN`/`Infinity`, auquel cas l'écriture est
 *   ignorée (voir {@link containsNonFiniteNumber}) plutôt que de persister
 *   une donnée silencieusement tronquée.
 *
 * Remarque d'implémentation : le flag d'hydratation ci-dessous est un
 * `useState` (pas un simple `useRef`). C'est important : un `ref` est
 * mis à jour de façon synchrone et serait déjà "vrai" quand l'effet de
 * sauvegarde s'exécute juste après l'effet de lecture lors du même rendu,
 * ce qui écraserait la valeur tout juste lue depuis le storage avec
 * `initialValue`. En passant par du state, l'effet de sauvegarde ne "voit"
 * `isHydrated = true` qu'au rendu suivant, une fois la valeur lue appliquée.
 *
 * @param key Clé unique utilisée dans `localStorage`.
 * @param initialValue Valeur par défaut utilisée tant que rien n'est
 *   trouvé en storage (ou côté serveur), ou si la valeur trouvée est
 *   invalide.
 * @param isValid Garde de forme optionnelle : si fournie, une valeur lue
 *   depuis `localStorage` n'est acceptée que si elle la satisfait.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  isValid?: (value: unknown) => value is T,
) {
  const [value, setValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // Lecture unique au montage (par clé).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        const parsed: unknown = JSON.parse(stored);
        if (!isValid || isValid(parsed)) {
          setValue(parsed as T);
        } else {
          console.warn(
            `useLocalStorage: donnée invalide pour la clé "${key}", réinitialisation à la valeur par défaut.`,
          );
          window.localStorage.setItem(key, JSON.stringify(initialValue));
        }
      }
    } catch (error) {
      console.warn(`useLocalStorage: lecture impossible pour la clé "${key}"`, error);
      try {
        window.localStorage.setItem(key, JSON.stringify(initialValue));
      } catch {
        // Rien de plus à faire si l'écriture de secours échoue aussi
        // (ex : localStorage plein ou désactivé) : on continue avec
        // `initialValue` en mémoire uniquement.
      }
    } finally {
      setIsHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Sauvegarde à chaque changement de valeur, une fois la lecture initiale faite.
  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    if (containsNonFiniteNumber(value)) {
      console.warn(
        `useLocalStorage: valeur non persistée pour la clé "${key}" (contient NaN/Infinity).`,
      );
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`useLocalStorage: écriture impossible pour la clé "${key}"`, error);
    }
  }, [key, value, isHydrated]);

  return [value, setValue] as const;
}
