/*
 * Design: Consultoria de Luxo Silenciosa
 * Footer — logo + slogan traduzido + assinatura da marca
 */
import { useI18n, type Lang } from '@/lib/i18n';

function pick(lang: Lang, pt: string, en: string, es: string): string {
  if (lang === 'pt') return pt;
  if (lang === 'es') return es;
  return en;
}

export default function Footer() {
  const { lang } = useI18n();
  const slogan = pick(
    lang,
    'Partilhar conhecimento, Inspirar Carreiras!',
    'Share Knowledge, Inspire Careers!',
    'Compartir Conocimiento, ¡Inspirar Carreras!',
  );

  return (
    <footer className="mt-auto bg-[#1a1a1a] text-white">
      <div className="gold-line" />
      <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <img src="/logo-s2i.webp" alt="Share2Inspire" className="h-9 sm:h-10 w-auto object-contain" />
          <div>
            <p className="text-sm font-semibold text-white">Share2Inspire</p>
            <p className="text-sm text-white">{slogan}</p>
          </div>
        </div>
        <p className="text-xs text-white/40">© {new Date().getFullYear()} Share2Inspire</p>
      </div>
    </footer>
  );
}
