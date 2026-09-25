import { Coffee } from './icons';

/**
 * Footer discret : mention légale minimale + bouton de don.
 * Composant serveur statique (aucune interactivité requise).
 */
export function Footer() {
  const donationUrl = process.env.NEXT_PUBLIC_DONATION_URL || 'https://www.buymeacoffee.com/';
  const year = new Date().getFullYear();

  return (
    <footer className="mx-auto mt-12 max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">
      <div className="flex flex-col items-center justify-center gap-3 border-t border-slate-200 pt-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-xs text-slate-400">
          © {year} {' '}
          <span className="font-medium text-slate-500">SauveMonSemestre</span> — gratuit, sans
          compte. Tes notes restent dans ton navigateur.
        </p>
        <a
          href={donationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
        >
          <Coffee className="h-4 w-4" /> Offrir un café
        </a>
      </div>
    </footer>
  );
}
