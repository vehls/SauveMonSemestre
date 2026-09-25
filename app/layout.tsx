import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';
import { OG_DESCRIPTION, OG_TITLE, SEO_DESCRIPTION, SEO_KEYWORDS, SEO_TITLE, SITE_NAME } from '@/lib/site';
import './globals.css';

/**
 * Police de texte courant (UI, corps de texte). Chargée en polices
 * statiques next/font (auto-hébergées, sans requête réseau externe) pour
 * les graisses réellement utilisées dans l'interface.
 */
const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

/**
 * Police "display", réservée au wordmark ("SauveMonSemestre") et au
 * chiffre de la moyenne générale — jamais au texte courant.
 */
const fraunces = Fraunces({
  weight: ['600'],
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

/**
 * URL publique du site, utilisée pour générer des URLs absolues (OpenGraph,
 * Twitter Card, sitemap...). À définir via `NEXT_PUBLIC_SITE_URL` une fois
 * le site déployé (voir `.env.example`) ; retombe sur `localhost` en dev.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SEO_TITLE,
    template: `%s — ${SITE_NAME}`,
  },
  description: SEO_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [...SEO_KEYWORDS],
  authors: [{ name: 'SauveMonSemestre' }],
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: '/',
    siteName: SITE_NAME,
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    // Ajoute une image `public/og-image.png` (1200x630) puis décommente pour
    // un aperçu illustré sur les réseaux sociaux :
    // images: [{ url: '/og-image.png', width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary',
    title: OG_TITLE,
    description: OG_DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${plusJakartaSans.variable} ${fraunces.variable}`}>
      <body className="min-h-screen text-slate-900 antialiased">
        {children}

        {/* Script AdSense global : ne se charge que si un identifiant éditeur
            est configuré (voir .env.example), pour ne rien injecter en dev. */}
        {ADSENSE_CLIENT_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
