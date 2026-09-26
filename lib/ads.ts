/** Vrai seulement si un identifiant éditeur AdSense est configuré. */
export function isAdsenseEnabled(): boolean {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  return typeof clientId === 'string' && clientId.trim().length > 0;
}
