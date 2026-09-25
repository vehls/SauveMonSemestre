interface EmptyStateIllustrationProps {
  className?: string;
}

/**
 * Illustration vectorielle "faite maison" (SVG inline, aucune dépendance
 * externe) : une pile de livres et un crayon, dans la palette de l'app.
 */
export function EmptyStateIllustration({ className = 'h-40 w-40' }: EmptyStateIllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 200"
      className={className}
      role="img"
      aria-label="Illustration d'une pile de livres et d'un crayon"
    >
      {/* Animations très discrètes (6s, ease-in-out, alternate) : le halo
          respire légèrement, le crayon flotte de quelques pixels. Coupées
          si l'utilisateur préfère un mouvement réduit (déjà couvert
          globalement par app/globals.css, répété ici pour que ce
          composant reste correct même isolé). */}
      <style>
        {`
          .empty-illustration-halo {
            transform-box: fill-box;
            transform-origin: center;
            animation: empty-illustration-halo-pulse 6s ease-in-out infinite alternate;
          }
          .empty-illustration-pencil {
            animation: empty-illustration-pencil-float 6s ease-in-out infinite alternate;
          }
          @keyframes empty-illustration-halo-pulse {
            from { transform: scale(1); }
            to { transform: scale(1.03); }
          }
          @keyframes empty-illustration-pencil-float {
            from { transform: translateY(0); }
            to { transform: translateY(-3px); }
          }
          @media (prefers-reduced-motion: reduce) {
            .empty-illustration-halo,
            .empty-illustration-pencil {
              animation: none;
            }
          }
        `}
      </style>

      {/* Halo de fond */}
      <circle cx="120" cy="112" r="92" fill="#EEF2F9" className="empty-illustration-halo" />
      <circle cx="182" cy="52" r="7" fill="#FFD0C2" opacity="0.9" />
      <circle cx="52" cy="146" r="5" fill="#A7F3D0" opacity="0.9" />
      <circle cx="196" cy="128" r="4" fill="#8CA8D5" opacity="0.7" />

      {/* Pile de livres */}
      <rect x="48" y="140" width="144" height="24" rx="5" fill="#1B2E4F" />
      <rect x="60" y="140" width="120" height="6" rx="3" fill="#233D68" opacity="0.6" />

      <g transform="rotate(-3 120 128)">
        <rect x="58" y="116" width="124" height="24" rx="5" fill="#10B981" />
        <rect x="70" y="116" width="100" height="6" rx="3" fill="#059669" opacity="0.5" />
      </g>

      <g transform="rotate(4 120 106)">
        <rect x="68" y="94" width="104" height="24" rx="5" fill="#FF8A6B" />
        <rect x="80" y="94" width="80" height="6" rx="3" fill="#E35435" opacity="0.5" />
      </g>

      {/* Crayon posé en diagonale sur la pile. L'animation (translateY)
          est portée par un groupe englobant distinct : appliquer un
          `transform` CSS directement sur cet élément aurait sinon écrasé
          l'attribut SVG `transform="rotate(...)"` ci-dessous plutôt que
          de s'y composer. */}
      <g className="empty-illustration-pencil">
        <g transform="rotate(-36 168 66)">
          <rect x="160" y="18" width="12" height="76" rx="3" fill="#FCD34D" />
          <rect x="160" y="18" width="12" height="10" rx="2" fill="#FF8A6B" />
          <path d="M160 94 L172 94 L166 108 Z" fill="#E8C27A" />
          <path d="M164 100 L168 100 L166 108 Z" fill="#475569" />
        </g>
      </g>
    </svg>
  );
}
