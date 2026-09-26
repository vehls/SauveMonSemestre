/**
 * Jeu minimal d'icônes inline (aucune dépendance externe) : remplace les
 * emojis décoratifs à travers l'app par des SVG nets à toute résolution.
 *
 * Toutes partagent le même gabarit — 20×20, `stroke="currentColor"`,
 * `fill="none"`, `strokeWidth={1.75}`, `aria-hidden` — pour un rendu
 * cohérent ; la couleur suit donc le `text-*` de l'élément englobant, et la
 * taille peut être ajustée via `className` (ex. `h-4 w-4`) comme n'importe
 * quelle icône Tailwind classique.
 */

interface IconProps {
  className?: string;
}

const BASE_SVG_PROPS = {
  viewBox: '0 0 24 24',
  width: 20,
  height: 20,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const,
};

export function GraduationCap({ className }: IconProps) {
  return (
    <svg {...BASE_SVG_PROPS} className={className}>
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
      <path d="M22 10.5v5.5" />
      <path d="M6.5 12.5V17a1 1 0 0 0 .38.78 7.5 7.5 0 0 0 10.24 0A1 1 0 0 0 17.5 17v-4.5" />
    </svg>
  );
}

export function Plus({ className }: IconProps) {
  return (
    <svg {...BASE_SVG_PROPS} className={className}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function RotateCcw({ className }: IconProps) {
  return (
    <svg {...BASE_SVG_PROPS} className={className}>
      <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

export function Sliders({ className }: IconProps) {
  return (
    <svg {...BASE_SVG_PROPS} className={className}>
      <line x1="4" x2="4" y1="21" y2="14" />
      <line x1="4" x2="4" y1="10" y2="3" />
      <line x1="12" x2="12" y1="21" y2="12" />
      <line x1="12" x2="12" y1="8" y2="3" />
      <line x1="20" x2="20" y1="21" y2="16" />
      <line x1="20" x2="20" y1="12" y2="3" />
      <line x1="2" x2="6" y1="14" y2="14" />
      <line x1="10" x2="14" y1="8" y2="8" />
      <line x1="18" x2="22" y1="16" y2="16" />
    </svg>
  );
}

export function X({ className }: IconProps) {
  return (
    <svg {...BASE_SVG_PROPS} className={className}>
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

export function Sparkles({ className }: IconProps) {
  return (
    <svg {...BASE_SVG_PROPS} className={className}>
      <path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.13-1.58a.5.5 0 0 1 0-.96l6.13-1.58A2 2 0 0 0 9.94 8.5l1.58-6.13a.5.5 0 0 1 .96 0L14.06 8.5a2 2 0 0 0 1.44 1.44l6.13 1.58a.5.5 0 0 1 0 .96l-6.13 1.58a2 2 0 0 0-1.44 1.44l-1.58 6.13a.5.5 0 0 1-.96 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
      <path d="M4 17v2" />
      <path d="M5 18H3" />
    </svg>
  );
}

export function Link({ className }: IconProps) {
  return (
    <svg {...BASE_SVG_PROPS} className={className}>
      <path d="M9 17H7A5 5 0 0 1 7 7h2" />
      <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
      <line x1="8" x2="16" y1="12" y2="12" />
    </svg>
  );
}

export function Target({ className }: IconProps) {
  return (
    <svg {...BASE_SVG_PROPS} className={className}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Coffee({ className }: IconProps) {
  return (
    <svg {...BASE_SVG_PROPS} className={className}>
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" x2="6" y1="2" y2="4" />
      <line x1="10" x2="10" y1="2" y2="4" />
      <line x1="14" x2="14" y1="2" y2="4" />
    </svg>
  );
}

export function Check({ className }: IconProps) {
  return (
    <svg {...BASE_SVG_PROPS} className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function Flame({ className }: IconProps) {
  return (
    <svg {...BASE_SVG_PROPS} className={className}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

export function Zap({ className }: IconProps) {
  return (
    <svg {...BASE_SVG_PROPS} className={className}>
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </svg>
  );
}

export function Dumbbell({ className }: IconProps) {
  return (
    <svg {...BASE_SVG_PROPS} className={className}>
      <path d="M14.4 14.4 9.6 9.6" />
      <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z" />
      <path d="m21.5 21.5-1.4-1.4" />
      <path d="M3.9 3.9 2.5 2.5" />
      <path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z" />
    </svg>
  );
}

export function Info({ className }: IconProps) {
  return (
    <svg {...BASE_SVG_PROPS} className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export function Alert({ className }: IconProps) {
  return (
    <svg {...BASE_SVG_PROPS} className={className}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
