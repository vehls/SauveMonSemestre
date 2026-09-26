interface LogoMarkProps {
  className?: string;
}

/**
 * Marque compacte : pastille navy et arc de jauge, le même dessin que
 * `app/icon.svg`. Le point corail reprend le repère de note cible.
 */
export function LogoMark({ className = 'h-8 w-8' }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="8" fill="#13203a" />
      <path
        d="M9 19 A7 7 0 0 1 23 19"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="21.36" cy="14.5" r="2.5" fill="#f96f4c" />
    </svg>
  );
}
