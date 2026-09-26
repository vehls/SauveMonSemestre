'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { buildShareUrl } from '@/lib/share';
import { buildDiscordMessage, buildWhatsAppMessage } from '@/lib/site';
import type { Semester } from '@/types/calculator';
import { Link } from './icons';
import { Toast } from './Toast';

interface ShareGridProps {
  semester: Semester;
}

/** Copie du texte dans le presse-papiers, avec repli pour les navigateurs/contextes sans API Clipboard. */
async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // On retente avec le repli ci-dessous.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

/**
 * Module de partage de la structure de grille (UE, matières, coefficients)
 * avec la promo, via un lien encodant l'information en paramètre d'URL
 * (aucune note personnelle n'est jamais incluse). Propose un partage direct
 * vers WhatsApp (action principale) et une copie de lien classique (repli).
 */
export function ShareGrid({ semester }: ShareGridProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const { toast, showToast } = useToast();

  /** Construit (ou récupère) le lien de partage ; affiche un message d'erreur explicite si impossible. */
  const ensureShareUrl = (): string | null => {
    if (semester.ues.length === 0) {
      showToast('Ajoute au moins une UE. Sans grille, y’a rien à envoyer.', 'error');
      return null;
    }
    try {
      const url = buildShareUrl(semester);
      setShareUrl(url);
      return url;
    } catch (error) {
      console.error('Impossible de générer le lien de partage', error);
      showToast('Impossible de générer le lien de partage.', 'error');
      return null;
    }
  };

  const handleWhatsAppShare = () => {
    const url = ensureShareUrl();
    if (!url) return;
    const promoName = semester.name.trim() || 'ta promo';
    const message = buildWhatsAppMessage(promoName, url);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDiscordCopy = async () => {
    const url = ensureShareUrl();
    if (!url) return;
    const promoName = semester.name.trim() || 'ta promo';
    const copied = await copyToClipboard(buildDiscordMessage(promoName, url));
    if (copied) {
      showToast('Message Discord copié. Colle-le dans le salon.', 'success');
    } else {
      showToast('Impossible de copier automatiquement. Copie le lien manuellement.', 'error');
    }
  };

  const handleCopy = async () => {
    const url = ensureShareUrl();
    if (!url) return;
    const copied = await copyToClipboard(url);
    if (copied) {
      showToast('Lien copié. Envoie-le à ta promo.', 'success');
    } else {
      showToast('Impossible de copier automatiquement. Copie le lien manuellement.', 'error');
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-rest">
      <div>
        <h2 className="type-section flex items-center gap-2">
          <Link className="h-5 w-5" /> Passe la grille à ta promo
        </h2>
        <p className="type-body">
          UE, matières, coefficients. Jamais tes notes.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={handleWhatsAppShare}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 transition hover:bg-emerald-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy-500/25"
        >
          Envoyer sur WhatsApp
        </button>
        <button
          type="button"
          onClick={handleDiscordCopy}
          className="btn btn-ghost min-h-11 px-4 text-sm"
        >
          Copier pour Discord
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="btn btn-ghost min-h-11 px-4 text-sm"
        >
          Copier le lien
        </button>
      </div>

      {shareUrl && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-3">
          <input
            type="text"
            readOnly
            value={shareUrl}
            onFocus={(event) => event.target.select()}
            aria-label="Lien de partage de la grille"
            className="field min-w-0 flex-1 text-slate-600"
          />
        </div>
      )}

      <Toast toast={toast} />
    </section>
  );
}
