/*
 * Design: Consultoria de Luxo Silenciosa
 * Footer com navegação da área de cliente, links ao site principal e legal
 */
import { Link } from 'wouter';
import { useI18n } from '@/lib/i18n';
import { ArrowLeft } from 'lucide-react';

export default function Footer() {
  const { lang } = useI18n();

  return (
    <footer className="mt-auto">
      <div className="gold-line" />
      <div className="container py-8">
        {/* Top row: back to site + nav */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <a
            href="https://share2inspire.pt"
            className="flex items-center gap-1.5 text-xs font-light text-[#999] hover:text-[#555] transition-colors duration-300"
          >
            <ArrowLeft className="w-3 h-3" />
            {lang === 'pt' ? 'Voltar ao site principal' : 'Back to main site'}
          </a>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs font-light text-[#999] hover:text-[#555] transition-colors duration-300">
              {lang === 'pt' ? 'Início' : 'Home'}
            </Link>
            <Link href="/planos" className="text-xs font-light text-[#999] hover:text-[#555] transition-colors duration-300">
              {lang === 'pt' ? 'Planos' : 'Plans'}
            </Link>
            <Link href="/perfil" className="text-xs font-light text-[#999] hover:text-[#555] transition-colors duration-300">
              {lang === 'pt' ? 'Perfil' : 'Profile'}
            </Link>
          </div>
        </div>

        {/* Bottom row: copyright + legal */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#e5e5e5]">
          <p className="text-xs font-light text-[#bbb] tracking-wide">
            &copy; {new Date().getFullYear()} Share2Inspire. {lang === 'pt' ? 'Todos os direitos reservados.' : 'All rights reserved.'}
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://share2inspire.pt/pages/politica-privacidade.html"
              className="text-xs font-light text-[#bbb] hover:text-[#888] transition-colors duration-300"
            >
              {lang === 'pt' ? 'Privacidade' : 'Privacy'}
            </a>
            <a
              href="https://share2inspire.pt/pages/termos.html"
              className="text-xs font-light text-[#bbb] hover:text-[#888] transition-colors duration-300"
            >
              {lang === 'pt' ? 'Termos' : 'Terms'}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
