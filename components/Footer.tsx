import Link from 'next/link';
import { isAdsenseEnabled } from '@/lib/ads';
import { Coffee } from './icons';

/**
 * Footer discret : mention légale minimale + bouton de don.
 * Composant serveur statique (aucune interactivité requise).
 */
export function Footer() {
  const donationUrl = process.env.NEXT_PUBLIC_DONATION_URL?.trim();
  const year = new Date().getFullYear();

  return (
    <footer
      className={`mx-auto mt-12 max-w-6xl px-4 pt-6 sm:px-6 lg:px-8 ${
        isAdsenseEnabled() ? 'pb-20 lg:pb-6' : 'pb-6'
      }`}
    >
      <div className="flex flex-col items-center justify-center gap-3 border-t border-slate-200 pt-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-xs text-slate-400">
          © {year} {' '}
          <span className="font-medium text-slate-500">SauveMonSemestre</span> — gratuit, sans
          compte. Tes notes restent dans ton navigateur.{' '}
          <Link href="/mentions-legales" className="underline-offset-2 hover:text-slate-600 hover:underline">
            Mentions légales
          </Link>
        </p>
        {donationUrl ? (
          <a
            href={donationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/30"
          >
            <Coffee className="h-4 w-4" /> Offrir un café
          </a>
        ) : null}
      </div>
    </footer>
  );
}
