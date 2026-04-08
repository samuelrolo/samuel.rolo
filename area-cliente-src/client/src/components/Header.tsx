/*
 * Design: Consultoria de Luxo Silenciosa
 * Header — navbar limpa e consistente
 * Nav: Início (→ site principal) · Planos · Área de Membro · Meu Perfil
 * "← Site" removido — "Início" já leva ao site principal
 */
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { useI18n } from '@/lib/i18n';
import { Link, useLocation } from 'wouter';
import { useState } from 'react';
import { Menu, X, User, LogOut, Globe, CreditCard, Home, Users } from 'lucide-react';

export default function Header() {
  const { user, signOut } = useAuth();
  const { openLoginModal } = useLoginModal();
  const { t, lang, setLang } = useI18n();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => location === href;

  /* Nav links internos da área de cliente */
  const navLinks = [
    { href: '/planos', label: t('nav.plans'), icon: CreditCard },
    { href: '/membros', label: lang === 'pt' ? 'Área de Membro' : 'Member Area', icon: Users },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAF9]/95 backdrop-blur-md">
      <div className="container flex items-center h-16">
        {/* Left: Logo */}
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/perfil" className="flex items-center group">
            <img
              src="https://share2inspire.pt/images/logo.webp"
              alt="Share2Inspire"
              className="h-[55px] w-auto object-contain group-hover:opacity-80 transition-opacity duration-300"
            />
          </Link>
        </div>

        <nav className="hidden xl:flex items-center gap-0.5 mx-auto">
          {/* Início → site principal */}
          <a
            href="https://share2inspire.pt"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] xl:text-[12px] font-light tracking-wide transition-all duration-300 text-[#666] hover:text-[#1a1a1a] hover:bg-[#f0f0ef]"
          >
            {lang === 'pt' ? 'Início' : 'Home'}
          </a>
          <a
            href="/cv-analyser"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] xl:text-[12px] font-light tracking-wide transition-all duration-300 text-[#666] hover:text-[#1a1a1a] hover:bg-[#f0f0ef]"
          >
            CV Analyser
          </a>
          <a
            href="/career-path"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] xl:text-[12px] font-light tracking-wide transition-all duration-300 text-[#666] hover:text-[#1a1a1a] hover:bg-[#f0f0ef]"
          >
            Career Path
          </a>
          <a
            href="/career-intelligence"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] xl:text-[12px] font-light tracking-wide transition-all duration-300 text-[#666] hover:text-[#1a1a1a] hover:bg-[#f0f0ef]"
          >
            Career Intelligence
          </a>
          <a
            href="/linkedin-roaster"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] xl:text-[12px] font-light tracking-wide transition-all duration-300 text-[#666] hover:text-[#1a1a1a] hover:bg-[#f0f0ef]"
          >
            LinkedIn Roaster
          </a>
          <a
            href="/estudante"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] xl:text-[12px] font-light tracking-wide transition-all duration-300 text-[#666] hover:text-[#1a1a1a] hover:bg-[#f0f0ef]"
          >
            {lang === 'pt' ? 'Pack Estudante' : 'Student Pack'}
          </a>
          <a
            href="https://share2inspire.pt/servicos"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] xl:text-[12px] font-light tracking-wide transition-all duration-300 text-[#666] hover:text-[#1a1a1a] hover:bg-[#f0f0ef]"
          >
            {lang === 'pt' ? 'Serviços' : 'Services'}
          </a>
          <a
            href="https://share2inspire.pt/sobre"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] xl:text-[12px] font-light tracking-wide transition-all duration-300 text-[#666] hover:text-[#1a1a1a] hover:bg-[#f0f0ef]"
          >
            {lang === 'pt' ? 'Sobre' : 'About'}
          </a>
          <a
            href="https://share2inspire.pt/contactos"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] xl:text-[12px] font-light tracking-wide transition-all duration-300 text-[#666] hover:text-[#1a1a1a] hover:bg-[#f0f0ef]"
          >
            {lang === 'pt' ? 'Contactos' : 'Contact'}
          </a>

          <div className="w-[1px] h-4 bg-slate-200 mx-2" />

          {navLinks.map(link => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] xl:text-[12px] font-bold tracking-wide transition-all duration-300 ${
                  isActive(link.href)
                    ? 'text-gold bg-gold/5'
                    : 'text-[#666] hover:text-[#1a1a1a] hover:bg-[#f0f0ef]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Lang + Profile + Logout */}
        <div className="hidden md:flex items-center gap-2 shrink-0 ml-auto">
          <button
            onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-light text-[#999] hover:text-[#666] hover:bg-[#f0f0ef] transition-all duration-300"
          >
            <Globe className="w-3 h-3" />
            {lang === 'pt' ? 'PT' : 'EN'}
          </button>

          {user ? (
            <div className="flex items-center gap-1.5">
              <Link
                href="/perfil"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-light transition-all duration-300 ${
                  isActive('/perfil')
                    ? 'text-gold bg-gold/5'
                    : 'text-[#666] hover:text-[#1a1a1a] hover:bg-[#f0f0ef]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                {lang === 'pt' ? 'Meu perfil' : 'My profile'}
              </Link>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1 px-2 py-1.5 rounded text-[11px] font-light text-[#bbb] hover:text-red-500 hover:bg-red-50 transition-all duration-300"
                title={t('nav.logout')}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="px-4 py-1.5 text-[13px] font-medium text-[#1a1a1a] bg-gold hover:bg-gold-light rounded transition-all duration-300"
            >
              {t('nav.login')}
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-[#333] hover:text-[#1a1a1a] transition-colors ml-auto"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Gold line */}
      <div className="gold-line" />

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#FAFAF9]/98 backdrop-blur-md border-t border-[#e5e5e5] animate-in slide-in-from-top-2 duration-200">
          <div className="container py-4 flex flex-col gap-1">
            {/* Início → site principal */}
            <a href="https://share2inspire.pt" className="px-3 py-2 text-sm text-[#555] hover:bg-[#f0f0ef] rounded-md transition-all">
              {lang === 'pt' ? 'Início' : 'Home'}
            </a>
            <a href="/cv-analyser" className="px-3 py-2 text-sm text-[#555] hover:bg-[#f0f0ef] rounded-md transition-all">CV Analyser</a>
            <a href="/career-path" className="px-3 py-2 text-sm text-[#555] hover:bg-[#f0f0ef] rounded-md transition-all">Career Path</a>
            <a href="/career-intelligence" className="px-3 py-2 text-sm text-[#555] hover:bg-[#f0f0ef] rounded-md transition-all">Career Intelligence</a>
            <a href="/linkedin-roaster" className="px-3 py-2 text-sm text-[#555] hover:bg-[#f0f0ef] rounded-md transition-all">LinkedIn Roaster</a>
            <a href="/estudante" className="px-3 py-2 text-sm text-[#555] hover:bg-[#f0f0ef] rounded-md transition-all">
              {lang === 'pt' ? 'Pack Estudante' : 'Student Pack'}
            </a>
            <a href="https://share2inspire.pt/servicos" className="px-3 py-2 text-sm text-[#555] hover:bg-[#f0f0ef] rounded-md transition-all">
              {lang === 'pt' ? 'Serviços' : 'Services'}
            </a>
            <a href="https://share2inspire.pt/sobre" className="px-3 py-2 text-sm text-[#555] hover:bg-[#f0f0ef] rounded-md transition-all">
              {lang === 'pt' ? 'Sobre' : 'About'}
            </a>
            <a href="https://share2inspire.pt/contactos" className="px-3 py-2 text-sm text-[#555] hover:bg-[#f0f0ef] rounded-md transition-all">
              {lang === 'pt' ? 'Contactos' : 'Contact'}
            </a>

            <div className="h-px bg-slate-100 my-1 mx-3" />

            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`px-3 py-2 text-sm font-semibold rounded-md transition-all ${
                  isActive(link.href)
                    ? 'text-gold bg-gold/5'
                    : 'text-[#555] hover:bg-[#f0f0ef]'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {user && (
              <Link
                href="/perfil"
                onClick={() => setMenuOpen(false)}
                className={`px-3 py-2 text-sm font-semibold rounded-md transition-all ${
                  isActive('/perfil')
                    ? 'text-gold bg-gold/5'
                    : 'text-[#555] hover:bg-[#f0f0ef]'
                }`}
              >
                {lang === 'pt' ? 'Meu perfil' : 'My profile'}
              </Link>
            )}

            <div className="gold-line my-2" />

            <div className="flex items-center justify-between px-3 py-2">
              <button
                onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
                className="flex items-center gap-1.5 text-xs text-[#888]"
              >
                <Globe className="w-3.5 h-3.5" />
                {lang === 'pt' ? 'Português' : 'English'}
              </button>
              {user ? (
                <button
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  className="flex items-center gap-1.5 text-sm text-[#999] hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {t('nav.logout')}
                </button>
              ) : (
                <button
                  onClick={() => { openLoginModal(); setMenuOpen(false); }}
                  className="px-4 py-2 text-sm font-medium text-[#1a1a1a] bg-gold rounded"
                >
                  {t('nav.login')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
