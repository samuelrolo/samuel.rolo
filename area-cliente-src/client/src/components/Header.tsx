/*
 * Design: Consultoria de Luxo Silenciosa
 * Header minimalista com logo S2I, navegação, seletor de idioma e estado de auth
 * Linha dourada fina no fundo do header
 */
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';
import { Link, useLocation } from 'wouter';
import { useState } from 'react';
import { Menu, X, User, LogOut, Globe } from 'lucide-react';

export default function Header() {
  const { user, signOut, hasActiveSubscription } = useAuth();
  const { t, lang, setLang } = useI18n();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/planos', label: t('nav.plans') },
    ...(user && hasActiveSubscription() ? [{ href: '/membros', label: t('nav.member') }] : []),
  ];

  const isActive = (href: string) => location === href;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAF9]/95 backdrop-blur-md">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/105354394/92yTmUfG3DeUMDKSZxzXKb/logo-white_baacc2e7.png"
            alt="Share2Inspire"
            className="h-12 w-auto object-contain group-hover:opacity-80 transition-opacity duration-300"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-light tracking-wide transition-colors duration-300 ${
                isActive(link.href) ? 'text-gold' : 'text-[#333] hover:text-[#1a1a1a]'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://share2inspire.pt"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-light tracking-wide text-[#888] hover:text-[#1a1a1a]/70 transition-colors duration-300"
          >
            {t('nav.site')}
          </a>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
            className="flex items-center gap-1.5 text-xs font-light text-[#666] hover:text-[#1a1a1a]/80 transition-colors duration-300"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang === 'pt' ? 'EN' : 'PT'}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/perfil"
                className="flex items-center gap-2 text-sm font-light text-[#333] hover:text-[#1a1a1a] transition-colors duration-300"
              >
                <User className="w-4 h-4" />
                {t('nav.profile')}
              </Link>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 text-sm font-light text-[#888] hover:text-[#1a1a1a]/60 transition-colors duration-300"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="px-5 py-2 text-sm font-medium text-[#1a1a1a] bg-gold hover:bg-gold-light rounded transition-all duration-300"
            >
              {t('nav.login')}
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-[#333] hover:text-[#1a1a1a] transition-colors"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Gold line */}
      <div className="gold-line" />

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#FAFAF9]/98 backdrop-blur-md border-t border-[#e5e5e5]">
          <div className="container py-6 flex flex-col gap-4">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`text-sm font-light tracking-wide py-2 ${
                  isActive(link.href) ? 'text-gold' : 'text-[#333]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="gold-line my-2" />
            <div className="flex items-center justify-between">
              <button
                onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
                className="flex items-center gap-1.5 text-xs text-[#666]"
              >
                <Globe className="w-3.5 h-3.5" />
                {lang === 'pt' ? 'English' : 'Português'}
              </button>
              {user ? (
                <div className="flex items-center gap-4">
                  <Link href="/perfil" onClick={() => setMenuOpen(false)} className="text-sm text-[#333]">
                    {t('nav.profile')}
                  </Link>
                  <button onClick={() => { signOut(); setMenuOpen(false); }} className="text-sm text-[#888]">
                    {t('nav.logout')}
                  </button>
                </div>
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
