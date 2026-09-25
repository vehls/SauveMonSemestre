interface RevisionStrategyTeaserProps {
  /** Au moins une UE a été ajoutée. */
  hasUE?: boolean;
  /** Au moins une note (réelle, verrouillée ou simulée) a été saisie. */
  hasGrade?: boolean;
}

/**
 * Aperçu du module Stratégie de révision, affiché en bas de page (bloc
 * discret façon footer) tant que les conditions ne sont pas réunies : il
 * faut au moins une note saisie ET au moins une matière encore en attente.
 *
 * La piste à 2 segments reflète la progression réelle (UE ajoutée / note
 * saisie) plutôt qu'un simple cadenas : le bloc reste engageant (fond
 * blanc, texte normal), pas "désactivé".
 */
export function RevisionStrategyTeaser({ hasUE = false, hasGrade = false }: RevisionStrategyTeaserProps) {
  return (
    <section className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white px-5 py-4 shadow-rest">
      <div className="flex w-14 shrink-0 gap-1.5" aria-hidden="true">
        <span className={`h-1.5 flex-1 rounded-full ${hasUE ? 'bg-navy-900' : 'bg-slate-200'}`} />
        <span className={`h-1.5 flex-1 rounded-full ${hasGrade ? 'bg-navy-900' : 'bg-slate-200'}`} />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">Où réviser en premier</p>
        <p className="text-xs text-slate-500">
          Saisis une note et laisse un examen en attente pour voir où réviser en priorité.
        </p>
      </div>
    </section>
  );
}
