interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Comment fonctionne la compensation entre matières dans une UE ?',
    answer:
      "Dans une UE, tes matières ne sont pas jugées une par une. On calcule une moyenne pondérée par les coefficients : une mauvaise note peut être rattrapée par une meilleure dans la même UE, tant que la moyenne de l'UE atteint le seuil (souvent 10/20). C'est la compensation intra-UE.",
  },
  {
    question: "C'est quoi la compensation entre UE ?",
    answer:
      "Si ta moyenne générale de semestre atteint 10/20, une UE sous son propre seuil peut quand même être acquise grâce aux autres. On dit qu'elle est compensée : c'est la compensation inter-UE, et le statut « Compensé » du simulateur. Une UE éliminatoire bloque ce mécanisme.",
  },
  {
    question: "C'est quoi une note éliminatoire à la fac ?",
    answer:
      "C'est un plancher, souvent 8/20, sous lequel la compensation ne joue plus. Si une UE passe sous ce seuil, le semestre est non validé, même avec une moyenne générale au-dessus de 10. Ici, une UE éliminatoire bloque tout le semestre.",
  },
  {
    question: 'Comment calculer sa moyenne générale de semestre ?',
    answer:
      "En deux temps. D'abord la moyenne de chaque UE : notes des matières pondérées par leur coefficient. Ensuite la moyenne du semestre : moyennes des UE pondérées par le coefficient de chaque UE. Le résultat se met à jour à chaque note saisie.",
  },
  {
    question: 'Validé, compensé ou non validé : quelle différence ?',
    answer:
      "Validé : chaque UE atteint son seuil. Compensé : la moyenne du semestre atteint l'objectif (souvent 10/20) alors qu'une ou plusieurs UE sont en dessous, sans note éliminatoire. Non validé : la moyenne générale est trop basse, ou une UE éliminatoire bloque la compensation. Une UE acquise se capitalise : tu la gardes même si le semestre n'est pas validé ; une UE seulement compensée ne l'est que si le semestre ou l'année est validé, sinon tu la repasses. C'est le règlement le plus courant, vérifie le tien.",
  },
  {
    question: 'Quelle note minimale faut-il pour valider son semestre ?',
    answer:
      "Ça dépend de tes coefficients et des notes déjà obtenues. Le simulateur calcule une note cible uniforme, la même sur chaque matière encore en blanc, pour atteindre ton objectif. S'il est déjà sûr, ou mathématiquement impossible, il te le dit aussi.",
  },
  {
    question: 'Les seuils 10/20 et 8/20 sont-ils les mêmes dans toutes les facs ?',
    answer:
      "Non. Ce sont les règles les plus courantes, pas une loi. Ton UFR peut fixer d'autres seuils. Vérifie le règlement des études, puis ajuste-les sur chaque UE avec l'icône réglages.",
  },
  {
    question: 'Est-ce que mes notes sont envoyées sur un serveur ?',
    answer:
      "Non. UE, matières, coefficients et notes restent dans le localStorage de ton navigateur, sur ton appareil. Le lien de partage n'encode que la structure de la grille — jamais tes notes.",
  },
];

/**
 * Section FAQ statique expliquant le fonctionnement de la compensation
 * universitaire (intra-UE, inter-UE, notes éliminatoires). Utilise des
 * éléments HTML natifs `<details>/<summary>` : accessible et indexable par
 * les moteurs de recherche sans JavaScript. Le schéma JSON-LD `FAQPage`
 * associé permet à Google d'afficher un extrait enrichi dans les résultats
 * de recherche.
 */
export function Faq() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <section aria-labelledby="faq-heading" className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-rest">
      <h2 id="faq-heading" className="type-section">
        Compensation universitaire : comment ta moyenne est vraiment calculée
      </h2>
      <p className="type-body mt-1">
        Compensation, note éliminatoire, validé ou compensé. Ce que le règlement des études dit
        en 40 pages, en clair.
      </p>

      <div className="mt-4 divide-y divide-slate-100">
        {FAQ_ITEMS.map((item) => (
          <details key={item.question} className="group py-3 first:pt-0 last:pb-0">
            <summary className="btn btn-ghost min-h-11 w-full cursor-pointer list-none justify-between px-4 text-sm marker:content-none">
              {item.question}
              <span
                aria-hidden="true"
                className="shrink-0 text-slate-400 transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.answer}</p>
          </details>
        ))}
      </div>

      {/* Rich snippet FAQPage pour les moteurs de recherche */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}
