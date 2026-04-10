/*
 * Design: Consultoria de Luxo Silenciosa
 * Header — navbar limpa e consistente
 * Nav: Início (→ site principal) · Planos · Área de Membro · Meu Perfil
 * "← Site" removido — "Início" já leva ao site principal
 * i18n: supports PT / EN / ES via lang selector
 */
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { useI18n, type Lang } from '@/lib/i18n';
import { Link, useLocation } from 'wouter';
import { useState, useRef, useEffect } from 'react';
import { Menu, X, User, LogOut, Globe, CreditCard, Home, Users } from 'lucide-react';

/* Helper: cycle to the next language */
const LANGS: Lang[] = ['pt', 'en', 'es'];
const LANG_LABELS: Record<Lang, string> = {
  pt: 'Português',
  en: pick('Inglês', 'English', 'Inglés'),
  es: pick('Espanhol', 'Spanish', 'Español'),
};
const LANG_SHORT: Record<Lang, string> = { pt: 'PT', en: 'EN', es: 'ES' };

/* Helper: pick a value based on the current language */
function pick(lang: Lang, pt: string, en: string, es: string): string {
  if (lang === 'pt') return pt;
  if (lang === 'es') return es;
  return en;
}

export default function Header() {
  const { user, signOut } = useAuth();
  const { openLoginModal } = useLoginModal();
  const { t, lang, setLang } = useI18n();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileLangDropdownOpen, setMobileLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => location === href;

  /* Close dropdown on outside click */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* Nav links internos da área de cliente */
  const navLinks = [
    { href: '/planos', label: t('nav.plans'), icon: CreditCard },
    { href: '/membros', label: pick(lang, 'Área de Membro', 'Member Area', 'Área de Miembro'), icon: Users },
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
            {pick(lang, 'Início', 'Home', 'Inicio')}
          </a>
          <a
            href="/cv-analyser"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] xl:text-[12px] font-light tracking-wide transition-all duration-300 text-[#666] hover:text-[#1a1a1a] hover:bg-[#f0f0ef]"
          >
            {pick(lang, 'CV Analyser', 'CV Analyser', 'CV Analyser')}
          </a>
          <a
            href="/career-path"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] xl:text-[12px] font-light tracking-wide transition-all duration-300 text-[#666] hover:text-[#1a1a1a] hover:bg-[#f0f0ef]"
          >
            {pick(lang, 'Career Path', 'Career Path', 'Career Path')}
          </a>
          <a
            href="/career-intelligence"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] xl:text-[12px] font-light tracking-wide transition-all duration-300 text-[#666] hover:text-[#1a1a1a] hover:bg-[#f0f0ef]"
          >
            {pick(lang, 'Career Intelligence', 'Career Intelligence', 'Career Intelligence')}
          </a>
          <a
            href="/linkedin-roaster"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] xl:text-[12px] font-light tracking-wide transition-all duration-300 text-[#666] hover:text-[#1a1a1a] hover:bg-[#f0f0ef]"
          >
            {pick(lang, 'LinkedIn Roaster', 'LinkedIn Roaster', 'LinkedIn Roaster')}
          </a>
          <a
            href="/estudante"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] xl:text-[12px] font-light tracking-wide transition-all duration-300 text-[#666] hover:text-[#1a1a1a] hover:bg-[#f0f0ef]"
          >
            {pick(lang, 'Pack Estudante', 'Student Pack', 'Pack Estudiante')}
          </a>
          <a
            href="https://share2inspire.pt/servicos"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] xl:text-[12px] font-light tracking-wide transition-all duration-300 text-[#666] hover:text-[#1a1a1a] hover:bg-[#f0f0ef]"
          >
            {pick(lang, 'Serviços', 'Services', 'Servicios')}
          </a>
          <a
            href="https://share2inspire.pt/sobre"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] xl:text-[12px] font-light tracking-wide transition-all duration-300 text-[#666] hover:text-[#1a1a1a] hover:bg-[#f0f0ef]"
          >
            {pick(lang, 'Sobre', 'About', 'Acerca de')}
          </a>
          <a
            href="https://share2inspire.pt/contactos"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] xl:text-[12px] font-light tracking-wide transition-all duration-300 text-[#666] hover:text-[#1a1a1a] hover:bg-[#f0f0ef]"
          >
            {pick(lang, 'Contactos', 'Contact', 'Contacto')}
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
          {/* Language selector dropdown */}
          <div className="relative" ref={langDropdownRef}>
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-light text-[#999] hover:text-[#666] hover:bg-[#f0f0ef] transition-all duration-300"
            >
              <Globe className="w-3 h-3" />
              {LANG_SHORT[lang]}
            </button>
            {langDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-[#e5e5e5] rounded-md shadow-lg py-1 min-w-[120px] z-50">
                {LANGS.map(l => (
                  <button
                    key={l}
                    onClick={() => { setLang(l); setLangDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-[12px] transition-all duration-200 ${
                      l === lang
                        ? 'text-gold font-medium bg-gold/5'
                        : 'text-[#666] hover:text-[#1a1a1a] hover:bg-[#f0f0ef]'
                    }`}
                  >
                    {LANG_SHORT[l]} — {LANG_LABELS[l]}
                  </button>
                ))}
              </div>
            )}
          </div>

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
                {pick(lang, 'Meu perfil', 'My profile', 'Mi perfil')}
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
              {pick(lang, 'Início', 'Home', 'Inicio')}
            </a>
            <a href="/cv-analyser" className="px-3 py-2 text-sm text-[#555] hover:bg-[#f0f0ef] rounded-md transition-all">{pick(lang, 'CV Analyser', 'CV Analyser', 'CV Analyser')}</a>
            <a href="/career-path" className="px-3 py-2 text-sm text-[#555] hover:bg-[#f0f0ef] rounded-md transition-all">{pick(lang, 'Career Path', 'Career Path', 'Career Path')}</a>
            <a href="/career-intelligence" className="px-3 py-2 text-sm text-[#555] hover:bg-[#f0f0ef] rounded-md transition-all">{pick(lang, 'Career Intelligence', 'Career Intelligence', 'Career Intelligence')}</a>
            <a href="/linkedin-roaster" className="px-3 py-2 text-sm text-[#555] hover:bg-[#f0f0ef] rounded-md transition-all">{pick(lang, 'LinkedIn Roaster', 'LinkedIn Roaster', 'LinkedIn Roaster')}</a>
            <a href="/estudante" className="px-3 py-2 text-sm text-[#555] hover:bg-[#f0f0ef] rounded-md transition-all">
              {pick(lang, 'Pack Estudante', 'Student Pack', 'Pack Estudiante')}
            </a>
            <a href="https://share2inspire.pt/servicos" className="px-3 py-2 text-sm text-[#555] hover:bg-[#f0f0ef] rounded-md transition-all">
              {pick(lang, 'Serviços', 'Services', 'Servicios')}
            </a>
            <a href="https://share2inspire.pt/sobre" className="px-3 py-2 text-sm text-[#555] hover:bg-[#f0f0ef] rounded-md transition-all">
              {pick(lang, 'Sobre', 'About', 'Acerca de')}
            </a>
            <a href="https://share2inspire.pt/contactos" className="px-3 py-2 text-sm text-[#555] hover:bg-[#f0f0ef] rounded-md transition-all">
              {pick(lang, 'Contactos', 'Contact', 'Contacto')}
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
                {pick(lang, 'Meu perfil', 'My profile', 'Mi perfil')}
              </Link>
            )}

            <div className="gold-line my-2" />

            <div className="flex items-center justify-between px-3 py-2">
              {/* Mobile language selector — inline buttons */}
              <div className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-[#888]" />
                {LANGS.map(l => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-2 py-0.5 text-xs rounded transition-all duration-200 ${
                      l === lang
                        ? 'text-gold font-medium bg-gold/10'
                        : 'text-[#888] hover:text-[#555]'
                    }`}
                  >
                    {LANG_SHORT[l]}
                  </button>
                ))}
              </div>
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
