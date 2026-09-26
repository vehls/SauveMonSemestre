'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, RotateCcw } from './icons';
import { LogoMark } from './LogoMark';

interface HeaderProps {
  onAddUE: () => void;
  onReset: () => void;
}

/** En-tête épuré : logo/titre à gauche, actions principales à droite. */
export function Header({ onAddUE, onReset }: HeaderProps) {
  // Confirmation de réinitialisation en 2 temps, sans window.confirm : le
  // premier clic bascule le bouton en état "Confirmer ?" pendant 3s ; un
  // second clic dans cette fenêtre déclenche réellement onReset. Un clic
  // ailleurs sur la page, ou l'expiration du délai, annule silencieusement.
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const resetButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isConfirmingReset) return;

    const timeoutId = setTimeout(() => setIsConfirmingReset(false), 3000);

    const handlePointerDownOutside = (event: PointerEvent) => {
      if (resetButtonRef.current && !resetButtonRef.current.contains(event.target as Node)) {
        setIsConfirmingReset(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDownOutside);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('pointerdown', handlePointerDownOutside);
    };
  }, [isConfirmingReset]);

  const handleResetClick = () => {
    if (isConfirmingReset) {
      setIsConfirmingReset(false);
      onReset();
    } else {
      setIsConfirmingReset(true);
    }
  };

  return (
    <header className="sticky top-0 z-20 -mx-4 flex flex-col gap-4 border-b border-slate-200/70 bg-white/80 px-4 py-2 backdrop-blur-md sm:static sm:z-auto sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:border-b-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
      <a
        href="#haut"
        onClick={(event) => {
          event.preventDefault();
          const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        }}
        className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy-500/25"
      >
        <LogoMark className="h-8 w-8 shrink-0" />
        <h1 className="type-wordmark min-w-0 truncate">SauveMonSemestre</h1>
        <span className="sr-only">Retour en haut de la page</span>
      </a>

      <div className="flex items-center gap-2 sm:gap-2.5">
        <button
          type="button"
          onClick={onAddUE}
          className="btn btn-primary min-h-11 flex-1 px-4 py-2.5 text-sm sm:w-auto sm:flex-none"
        >
          <Plus className="h-4 w-4" /> Ajouter une UE
        </button>
        <button
          ref={resetButtonRef}
          type="button"
          onClick={handleResetClick}
          aria-label={isConfirmingReset ? 'Confirmer la réinitialisation' : 'Réinitialiser'}
          className={`btn min-h-11 shrink-0 px-3 py-2.5 text-sm sm:px-4 ${
            isConfirmingReset ? 'btn-danger' : 'btn-ghost'
          }`}
        >
          <RotateCcw className="h-4 w-4" />
          <span>{isConfirmingReset ? 'Confirmer ?' : 'Réinitialiser'}</span>
        </button>
      </div>
    </header>
  );
}
