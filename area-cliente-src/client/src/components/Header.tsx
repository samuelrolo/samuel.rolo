/*
 * Design: Consultoria de Luxo Silenciosa
 * Header — navbar limpa e consistente
 * Nav: Início · Planos · Área de Membro · Meu Perfil
 * "Painel" removido — era redundante
 */
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';
import { Link, useLocation } from 'wouter';
import { useState } from 'react';
import { Menu, X, User, LogOut, Globe, ArrowLeft, CreditCard, Home, Users } from 'lucide-react';

export default function Header() {
  const { user, signOut } = useAuth();
  const { t, lang, setLang } = useI18n();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => location === href;

  /* Nav links — sem "Painel", Área de Membro visível para todos os logados */
  const navLinks = [
    { href: '/', label: lang === 'pt' ? 'Início' : 'Home', icon: Home },
    { href: '/planos', label: t('nav.plans'), icon: CreditCard },
    ...(user ? [{ href: '/membros', label: lang === 'pt' ? 'Área de Membro' : 'Member Area', icon: Users }] : []),
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAF9]/95 backdrop-blur-md">
      <div className="container flex items-center h-16">
        {/* Left: Logo + back to site */}
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/" className="flex items-center group">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/105354394/92yTmUfG3DeUMDKSZxzXKb/logo-white_baacc2e7.png"
              alt="Share2Inspire"
              className="h-9 w-auto object-contain group-hover:opacity-80 transition-opacity duration-300"
            />
          </Link>
          <a
            href="https://share2inspire.pt"
            className="flex items-center gap-1 text-[11px] font-light text-[#aaa] hover:text-[#666] transition-colors duration-300"
            title={lang === 'pt' ? 'Voltar ao site' : 'Back to site'}
          >
            <ArrowLeft className="w-3 h-3" />
            <span className="hidden sm:inline">{lang === 'pt' ? 'Site' : 'Site'}</span>
          </a>
        </div>

        {/* Center: Nav */}
        <nav className="hidden md:flex items-center gap-0.5 mx-auto">
          {navLinks.map(link => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[13px] font-light tracking-wide transition-all duration-300 ${
                  isActive(link.href)
                    ? 'text-gold bg-gold/5'
                    : 'text-[#666] hover:text-[#1a1a1a] hover:bg-[#f0f0ef]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
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
            <Link
              href="/auth"
              className="px-4 py-1.5 text-[13px] font-medium text-[#1a1a1a] bg-gold hover:bg-gold-light rounded transition-all duration-300"
            >
              {t('nav.login')}
            </Link>
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
            <a
              href="https://share2inspire.pt"
              className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-light text-[#888] hover:text-[#555] hover:bg-[#f0f0ef] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              {lang === 'pt' ? 'Voltar ao site principal' : 'Back to main site'}
            </a>

            <div className="gold-line my-2" />

            {navLinks.map(link => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-light transition-all ${
                    isActive(link.href)
                      ? 'text-gold bg-gold/5'
                      : 'text-[#555] hover:bg-[#f0f0ef]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}

            {user && (
              <Link
                href="/perfil"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-light transition-all ${
                  isActive('/perfil')
                    ? 'text-gold bg-gold/5'
                    : 'text-[#555] hover:bg-[#f0f0ef]'
                }`}
              >
                <User className="w-4 h-4" />
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
                <Link
                  href="/auth"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-[#1a1a1a] bg-gold rounded"
                >
                  {t('nav.login')}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
