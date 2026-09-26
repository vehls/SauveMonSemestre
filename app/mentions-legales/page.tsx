import type { Metadata } from 'next';
import Link from 'next/link';
import { LogoMark } from '@/components/LogoMark';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description:
    'SauveMonSemestre est édité à titre personnel par Louis Valles et hébergé par Vercel Inc. Aucun cookie publicitaire. Les notes restent dans le navigateur.',
  alternates: { canonical: '/mentions-legales' },
};

export default function MentionsLegalesPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold tracking-tight text-slate-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy-500/25"
      >
        <LogoMark className="h-5 w-5" />
        SauveMonSemestre
      </Link>

      <h1 className="mt-6 text-sm font-semibold text-slate-700">Mentions légales</h1>

      <div className="mt-4 space-y-4 text-xs leading-relaxed text-slate-500">
        <section>
          <h2 className="font-medium text-slate-600">Éditeur du site</h2>
          <p className="mt-1">
            Le site SauveMonSemestre est édité à titre personnel par Louis Valles.
          </p>
          <p className="mt-1">
            Contact :{' '}
            <a
              href="mailto:louisvallesp@gmail.com"
              className="text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-slate-800"
            >
              louisvallesp@gmail.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="font-medium text-slate-600">Hébergeur</h2>
          <p className="mt-1">Le site est hébergé par Vercel Inc.</p>
          <p className="mt-1">Adresse : 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</p>
          <p className="mt-1">
            Site web :{' '}
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-slate-800"
            >
              vercel.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="font-medium text-slate-600">Données</h2>
          <p className="mt-1">Aucun cookie publicitaire ni traceur n&apos;est déposé.</p>
          <p className="mt-1">
            Les notes sont stockées à 100&nbsp;% en local dans le navigateur (localStorage). Elles
            restent sur ton appareil.
          </p>
        </section>
      </div>
    </main>
  );
}
