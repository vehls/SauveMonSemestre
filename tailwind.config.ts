import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Police de texte courant : Plus Jakarta Sans (via next/font, voir
        // app/layout.tsx), avec repli système standard.
        sans: ['var(--font-jakarta)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Bleu marine profond : accents de fond, boutons primaires, branding.
        navy: {
          50: '#eef2f9',
          100: '#d9e2f1',
          200: '#b3c5e3',
          300: '#8ca8d5',
          400: '#5f85c1',
          500: '#3d63a3',
          600: '#2c4c82',
          700: '#233d68',
          800: '#1b2e4f',
          900: '#13203a',
          950: '#0b1526',
        },
        // Corail doux : encadrés d'information / stratégie de révision.
        coral: {
          50: '#fff5f2',
          100: '#ffe8e1',
          200: '#ffd0c2',
          300: '#ffb09b',
          400: '#ff8a6b',
          500: '#f96f4c',
          600: '#e35435',
          700: '#bd4128',
          800: '#963526',
          900: '#7a2e23',
        },
        // Statuts de validation et de simulation. Pas d'autre palette
        // que navy, corail et ces cinq rôles.
        status: {
          ok: { 50: '#ecfdf5', 500: '#10b981', 700: '#047857' },
          warn: { 50: '#fffbeb', 500: '#f59e0b', 700: '#b45309' },
          danger: { 50: '#fff1f2', 500: '#f43f5e', 700: '#be123c' },
          info: { 50: '#f0f9ff', 500: '#0ea5e9', 700: '#0369a1' },
          sim: { 50: '#f5f3ff', 500: '#7c3aed', 700: '#6d28d9' },
        },
      },
      boxShadow: {
        // Ombre "premium" douce, à deux niveaux, pour un rendu SaaS soigné.
        premium:
          '0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 28px -8px rgba(15, 23, 42, 0.12)',
        'premium-lg':
          '0 2px 4px rgba(15, 23, 42, 0.05), 0 20px 40px -12px rgba(15, 23, 42, 0.16)',
        // Ombre "au repos" : très discrète, pour les blocs secondaires qui ne
        // doivent pas concurrencer visuellement les cartes principales.
        rest: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.04)',
        // Ombre "flottante" : plus marquée, pour les éléments qui se
        // détachent au-dessus du contenu (barre sticky, toasts).
        float:
          '0 1px 2px rgba(15, 23, 42, 0.06), 0 16px 40px -12px rgba(19, 32, 58, 0.22)',
      },
    },
  },
  plugins: [],
};

export default config;
