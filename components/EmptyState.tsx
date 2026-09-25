import { EmptyStateIllustration } from './EmptyStateIllustration';

interface EmptyStateProps {
  onAddFirstUE: () => void;
}

/**
 * État vide "premium" affiché tant qu'aucune UE n'a été ajoutée : illustration
 * vectorielle + message rassurant + action principale bien visible.
 */
export function EmptyState({ onAddFirstUE }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-3xl border border-slate-200/70 bg-white px-6 py-14 text-center shadow-premium">
      <EmptyStateIllustration className="h-40 w-40" />

      <div className="max-w-sm space-y-1.5">
        <h2 className="text-lg font-bold text-slate-800">Calcule ta moyenne avant les résultats</h2>
        <p className="text-sm text-slate-500">
          Pose tes UE, tes coeffs, tes notes. Tu vois si tu valides, si tu compenses, et la note
          minimale qu&apos;il te reste à avoir.
        </p>
      </div>

      {/* Les 3 étapes du premier usage : purement indicatif (aucun état
          réel suivi ici), la 2e est mise en avant car c'est l'action que
          le CTA ci-dessous déclenche directement. */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-navy-50 px-3 py-1 text-navy-700">1. Nomme ta filière</span>
        <span className="rounded-full bg-navy-900 px-3 py-1 text-white">2. Ajoute une UE</span>
        <span className="rounded-full bg-navy-50 px-3 py-1 text-navy-700">3. Saisis une note</span>
      </div>

      <button
        type="button"
        onClick={onAddFirstUE}
        className="btn btn-primary px-6 py-3 text-sm hover:-translate-y-0.5 hover:shadow-xl hover:shadow-navy-900/30"
      >
        <span aria-hidden="true">+</span> Ajouter ma première UE
      </button>
    </div>
  );
}
