/**
 * S2IHeader — Unified header component for all React pages (PT / EN / ES).
 * Detects language from URL via getLang() and renders nav items, labels,
 * and language switcher accordingly.
 *
 * Props:
 *   activePage: current page identifier for highlighting
 */
import { useState, useEffect, useRef } from "react";
import { Globe, Menu, X, ChevronDown } from "lucide-react";
import { getLang, type Lang } from "@/i18n";
import { switchLangUrl, localePath } from "@/i18n/useTranslation";

interface S2IHeaderProps {
  activePage?: string;
}

/* ── Nav item definitions per language ── */
type NavItem = { href: string; label: string; id: string };

function getNavItems(lang: Lang): NavItem[] {
  const lp = (ptPath: string) => localePath(ptPath, lang);
  if (lang === 'en') {
    return [
      { href: "https://www.share2inspire.pt/en/pages/home", label: "Home", id: "home" },
      { href: lp('/cv-analyser'), label: "CV Analyser", id: "cv-analyser" },
      { href: lp('/career-path'), label: "Career Path", id: "career-path" },
      { href: lp('/career-intelligence'), label: "Career Intelligence", id: "career-intelligence" },
      { href: lp('/linkedin-roaster'), label: "LinkedIn Roaster", id: "linkedin-roaster" },
      { href: lp('/bundle'), label: "Bundle", id: "bundle" },
      { href: lp('/estudante'), label: "Student Pack", id: "estudante" },
      { href: "https://www.share2inspire.pt/en/pages/services", label: "Services", id: "servicos" },
      { href: "https://www.share2inspire.pt/en/pages/knowledge", label: "Knowledge Hub", id: "knowledge-hub" },
      { href: "https://www.share2inspire.pt/en/pages/about", label: "About", id: "sobre" },
      { href: "https://www.share2inspire.pt/en/pages/contact", label: "Contact", id: "contactos" },
    ];
  }
  if (lang === 'es') {
    return [
      { href: lp('/'), label: "Inicio", id: "home" },
      { href: lp('/cv-analyser'), label: "CV Analyser", id: "cv-analyser" },
      { href: lp('/career-path'), label: "Career Path", id: "career-path" },
      { href: lp('/career-intelligence'), label: "Career Intelligence", id: "career-intelligence" },
      { href: lp('/linkedin-roaster'), label: "LinkedIn Roaster", id: "linkedin-roaster" },
      { href: lp('/bundle'), label: "Bundle", id: "bundle" },
      { href: lp('/estudante'), label: "Pack Estudiante", id: "estudante" },
      { href: lp('/servicos'), label: "Servicios", id: "servicos" },
      { href: lp('/conhecimento'), label: "Knowledge Hub", id: "knowledge-hub" },
      { href: lp('/sobre'), label: "Acerca de", id: "sobre" },
      { href: lp('/contactos'), label: "Contacto", id: "contactos" },
    ];
  }
  // PT (default)
  return [
    { href: "https://www.share2inspire.pt", label: "Início", id: "home" },
    { href: "/cv-analyser", label: "CV Analyser", id: "cv-analyser" },
    { href: "/career-path", label: "Career Path", id: "career-path" },
    { href: "/career-intelligence", label: "Career Intelligence", id: "career-intelligence" },
    { href: "/linkedin-roaster", label: "LinkedIn Roaster", id: "linkedin-roaster" },
    { href: "/bundle", label: "Bundle", id: "bundle" },
    { href: "/estudante", label: "Pack Estudante", id: "estudante" },
    { href: "/servicos", label: "Serviços", id: "servicos" },
    { href: "/conhecimento", label: "Knowledge Hub", id: "knowledge-hub" },
    { href: "/sobre", label: "Sobre", id: "sobre" },
    { href: "/contactos", label: "Contactos", id: "contactos" },
  ];
}

const langOptions: { code: Lang; label: string }[] = [
  { code: 'pt', label: 'PT — Português' },
  { code: 'en', label: 'EN — English' },
  { code: 'es', label: 'ES — Español' },
];

function getHomeUrl(lang: Lang): string {
  if (lang === 'en') return "https://www.share2inspire.pt/en/pages/home";
  return "https://www.share2inspire.pt";
}

export default function S2IHeader({ activePage = '' }: S2IHeaderProps) {
  const lang = getLang();
  const navItems = getNavItems(lang);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolledDown, setScrolledDown] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // Scroll-to-hide logo on mobile (only hamburger stays)
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolledDown(currentY > 60);
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close desktop lang dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const langLabel = lang.toUpperCase();
  const closeMenuLabel = lang === 'en' ? 'Close menu' : lang === 'es' ? 'Cerrar menú' : 'Fechar menu';
  const langSectionLabel = lang === 'en' ? 'Language' : lang === 'es' ? 'Idioma' : 'Idioma';

  /* ── Render a language option (shared between desktop dropdown and mobile dropdown) ── */
  function LangOption({ opt, isMobile = false }: { opt: typeof langOptions[0]; isMobile?: boolean }) {
    const isActive = opt.code === lang;
    if (isActive) {
      return isMobile ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#C9A961]/10 border border-[#C9A961]/30 text-sm font-semibold text-[#C9A961] cursor-default">
          {opt.label}
        </span>
      ) : (
        <span className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#C9A961] bg-[#C9A961]/5 cursor-default">
          <span className="w-2 h-2 rounded-full bg-[#C9A961]" />
          {opt.label}
        </span>
      );
    }
    const href = switchLangUrl(opt.code);
    return isMobile ? (
      <a
        href={href}
        onClick={() => setMobileMenuOpen(false)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
      >
        {opt.label}
      </a>
    ) : (
      <a href={href} className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors">
        <span className="w-2 h-2 rounded-full bg-slate-300" />
        {opt.label}
      </a>
    );
  }

  return (
    <>
      {/* Header — on mobile when scrolled: completely hidden (height 0), only hamburger floats */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 border-b bg-white/95 backdrop-blur-md border-slate-200/80 ${
          scrolledDown ? 'lg:visible invisible h-0 lg:h-auto overflow-hidden lg:overflow-visible' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-11 lg:h-14 flex items-center justify-between">
          {/* Logo */}
          <a href={getHomeUrl(lang)} className="shrink-0">
            <img
              src="https://www.share2inspire.pt/images/logo-s.png"
              alt="Share2Inspire"
              className="h-6 lg:h-8"
              style={{ width: "auto" }}
            />
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => (
              <a
                key={item.id}
                href={item.href}
                className={`px-3 py-1.5 rounded-md text-[0.75rem] font-medium tracking-wide transition-colors whitespace-nowrap ${
                  activePage === item.id
                    ? 'text-[#C9A961] bg-[#C9A961]/5'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <a
              href="/area-cliente/"
              className="s2i-login-btn px-3.5 py-1.5 rounded-md bg-[#C9A961] hover:bg-[#b8954f] text-white text-[0.7rem] font-semibold tracking-wide uppercase transition-colors"
            >
              Login
            </a>
            {/* Desktop Language Dropdown */}
            <div ref={langDropdownRef} className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[0.7rem] font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                {langLabel}
                <ChevronDown className={`w-3 h-3 transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {langDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                  {langOptions.map(opt => <LangOption key={opt.code} opt={opt} />)}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Actions — inside header (visible when not scrolled) */}
          <div className="lg:hidden flex items-center gap-1">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              {langLabel}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -mr-2 text-slate-500 hover:text-slate-800"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Floating hamburger — only on mobile when scrolled and menu is closed */}
      {scrolledDown && !mobileMenuOpen && (
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden fixed top-3 right-3 z-[60] p-2.5 bg-white/95 shadow-lg border border-slate-100 rounded-xl text-slate-800"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Mobile Language Dropdown — shown inline below header when globe is tapped */}
      {langDropdownOpen && !mobileMenuOpen && (
        <div className="lg:hidden fixed top-11 right-3 z-[55] w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1">
          {langOptions.map(opt => <LangOption key={opt.code} opt={opt} />)}
        </div>
      )}

      {/* Mobile Menu - Full screen overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-white" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
          <div className="flex items-center justify-between px-4 h-11 border-b border-slate-200/80">
            <a href={getHomeUrl(lang)} className="shrink-0">
              <img src="https://www.share2inspire.pt/images/logo-s.png" alt="Share2Inspire" className="h-6" style={{ width: "auto" }} />
            </a>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 text-slate-800" aria-label={closeMenuLabel}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-4 py-4 space-y-1">
            {navItems.map(item => (
              <a
                key={item.id}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-base transition-colors ${
                  activePage === item.id
                    ? 'text-[#C9A961] bg-[#C9A961]/5 font-semibold'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </a>
            ))}
            {/* Mobile Language Selector */}
            <div className="pt-4 mt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{langSectionLabel}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {langOptions.map(opt => <LangOption key={opt.code} opt={opt} isMobile />)}
              </div>
            </div>
            {/* Login Button */}
            <div className="pt-3">
              <a
                href="/area-cliente/"
                className="s2i-login-btn block text-center px-5 py-2.5 rounded-lg bg-[#C9A961] hover:bg-[#b8954f] text-white text-sm font-semibold uppercase transition-colors"
              >
                Login
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
