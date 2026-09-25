'use client';

import { useEffect, useRef, useState } from 'react';
import { GraduationCap, Plus, RotateCcw } from './icons';

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
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white shadow-sm shadow-navy-900/30"
        >
          <GraduationCap />
        </div>
        <div>
          <h1 className="font-display text-xl tracking-tight text-navy-950">SauveMonSemestre</h1>
          <p className="text-xs font-medium text-slate-500">
            Ta moyenne. Ta compensation. La note qu&apos;il te faut.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2.5">
        <button
          type="button"
          onClick={onAddUE}
          className="btn btn-primary min-h-11 w-full px-4 py-2.5 text-sm sm:w-auto"
        >
          <Plus className="h-4 w-4" /> Ajouter une UE
        </button>
        <button
          ref={resetButtonRef}
          type="button"
          onClick={handleResetClick}
          className={`btn min-h-11 w-full px-4 py-2.5 text-sm sm:w-auto ${
            isConfirmingReset ? 'bg-rose-50 text-rose-700' : 'btn-ghost'
          }`}
        >
          <RotateCcw className="h-4 w-4" /> {isConfirmingReset ? 'Confirmer ?' : 'Réinitialiser'}
        </button>
      </div>
    </header>
  );
}
