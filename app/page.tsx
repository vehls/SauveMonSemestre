import { AdSlot } from '@/components/AdSlot';
import { Faq } from '@/components/Faq';
import { Footer } from '@/components/Footer';
import { MobileAdBanner } from '@/components/MobileAdBanner';
import { SemesterSimulator } from '@/components/SemesterSimulator';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function Home() {
  // Rich snippet WebApplication : aide les moteurs de recherche à
  // comprendre qu'il s'agit d'un outil web gratuit (bonus SEO).
  const webAppJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'SauveMonSemestre',
    url: SITE_URL,
    applicationCategory: 'EducationApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    description:
      'Simulateur gratuit de moyenne universitaire : compensation entre matières, compensation entre UE, et note minimale pour valider le semestre.',
    featureList: [
      'Calcul de moyenne pondérée en temps réel',
      'Compensation intra-UE et inter-UE',
      'Détection des notes éliminatoires',
      'Note minimale pour les examens restants',
    ],
  };

  return (
    <>
      <main className="mx-auto max-w-6xl px-4 py-8 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pb-8">
        <div className="flex items-start gap-8">
          <div className="min-w-0 flex-1 space-y-8">
            <SemesterSimulator />
            <Faq />
          </div>

          {/* Sidebar publicitaire, réservée au desktop : ne perturbe jamais
              la mise en page ni l'usage sur mobile/tablette. */}
          <aside className="hidden w-[300px] shrink-0 lg:block">
            <div className="sticky top-8">
              <AdSlot placement="sidebar" minHeight={600} className="w-[300px]" />
            </div>
          </aside>
        </div>
      </main>

      <Footer />

      {/* Bannière publicitaire mobile, en dehors du flux (fixed) : le
          padding-bottom du <main> et du <footer> ci-dessus l'empêche de
          recouvrir du contenu. */}
      <MobileAdBanner />

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
    </>
  );
}
