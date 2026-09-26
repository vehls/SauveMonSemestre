export const SITE_NAME = 'SauveMonSemestre';

/** Titre indexable : marque en tête, mot-clé conservé, moins de 60 caractères. */
export const SEO_TITLE = 'SauveMonSemestre — calcul moyenne universitaire';

/** ~150 caractères : bénéfice + différenciateur + confiance. */
export const SEO_DESCRIPTION =
  'Simule ta moyenne de semestre, la compensation entre UE et la note minimale pour valider. Gratuit, sans compte : tes notes restent sur ton appareil.';

/** Accroche sociale, distincte du title SEO. */
export const OG_TITLE = 'Tu valides ou tu compenses ? Calcule-le avant les résultats.';

export const OG_DESCRIPTION =
  'Moyenne, compensation, note minimale. Gratuit, et tes notes ne quittent pas ton téléphone.';

export const SEO_KEYWORDS = [
  'calcul moyenne semestre',
  'calcul moyenne universitaire',
  'simulateur moyenne fac',
  'compensation UE',
  'compensation inter UE',
  'note éliminatoire université',
  'note minimale pour valider',
  'moyenne pondérée université',
  'rattrapage semestre',
  'calculateur ECTS',
];

/** Message WhatsApp : court, saut de ligne, lien seul pour l'aperçu. */
export function buildWhatsAppMessage(promoName: string, url: string): string {
  return [
    `la grille de ${promoName} est prête.`,
    '',
    'tu rentres tes notes → moyenne, compensation, note mini pour valider :',
    url,
    '',
    'tes notes restent sur ton tel.',
  ].join('\n');
}

/** Message Discord : markdown léger, même promesse, ton salon de promo. */
export function buildDiscordMessage(promoName: string, url: string): string {
  return [
    `**${promoName}** — qui valide, qui compense ?`,
    '',
    'Balance tes notes, ça te sort ta moyenne et la note mini qu’il te faut :',
    url,
    '',
    '_Tes notes ne partent nulle part. Le lien ne contient que la grille (UE + coeffs)._',
  ].join('\n');
}
