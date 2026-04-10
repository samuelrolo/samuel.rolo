/**
 * S2IHeaderEN — Shared header component for all EN React pages.
 * Now uses the central i18n module for language detection and URL switching.
 */
import { useState, useEffect, useRef } from "react";
import { Globe, Menu, X, ChevronDown } from "lucide-react";
import { getLang, type Lang } from "@/i18n";
import { switchLangUrl, localePath } from "@/i18n/useTranslation";

interface S2IHeaderENProps {
  activePage?: 'cv-analyser' | 'career-path' | 'career-intelligence' | 'linkedin-roaster' | 'bundle' | 'student-pack' | 'services' | 'knowledge-hub' | 'about' | 'contact' | 'home' | '';
  langToggleHref?: string;
  esHref?: string;
}

function pick(lang: Lang, pt: string, en: string, es: string): string {
  return lang === 'en' ? en : lang === 'es' ? es : pt;
}

const navItems = [
  { href: "https://www.share2inspire.pt/en/pages/home", label: "Home", id: "home" },
  { href: "/en/cv-analyser", label: "CV Analyser", id: "cv-analyser" },
  { href: "/en/career-path", label: "Career Path", id: "career-path" },
  { href: "/en/career-intelligence", label: "Career Intelligence", id: "career-intelligence" },
  { href: "/en/linkedin-roaster", label: "LinkedIn Roaster", id: "linkedin-roaster" },
  { href: "/en/bundle", label: "Bundle", id: "bundle" },
  { href: "/en/student-pack", label: "Student Pack", id: "student-pack" },
  { href: "https://www.share2inspire.pt/en/pages/services", label: "Services", id: "services" },
  { href: "https://www.share2inspire.pt/en/pages/knowledge", label: pick("Knowledge Hub", "Knowledge Hub", "Hub de Conocimiento"), id: "knowledge-hub" },
  { href: "https://www.share2inspire.pt/en/pages/about", label: "About", id: "about" },
  { href: "https://www.share2inspire.pt/en/pages/contact", label: "Contact", id: "contact" },
];

export default function S2IHeaderEN({ activePage = '', langToggleHref, esHref }: S2IHeaderENProps) {
  const lang = getLang();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const loginLabel = pick(lang, 'Login', 'Login', 'Login');
  const menuLabel = pick(lang, 'Menu', 'Menu', 'Menú');
  const closeMenuLabel = pick(lang, 'Fechar menu', 'Close menu', 'Cerrar menú');
  const languageLabel = pick(lang, 'Idioma', 'Language', 'Idioma');
  const logoAlt = pick(lang, 'Share2Inspire', 'Share2Inspire', 'Share2Inspire');
  const ptHref = langToggleHref || switchLangUrl('pt');
  const esHrefResolved = esHref || switchLangUrl('es');
  const [scrolledDown, setScrolledDown] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

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

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 border-b bg-white/95 backdrop-blur-md border-slate-200/80 ${
          scrolledDown ? 'lg:visible invisible h-0 lg:h-auto overflow-hidden lg:overflow-visible' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-11 lg:h-14 flex items-center justify-between">
          <a href="https://www.share2inspire.pt/en/pages/home" className="shrink-0">
            <img src="https://www.share2inspire.pt/images/logo-s.png" alt={logoAlt} className="h-6 lg:h-8" style={{ width: "auto" }} />
          </a>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => (
              <a key={item.id} href={item.href} className={`px-3 py-1.5 rounded-md text-[0.75rem] font-medium tracking-wide transition-colors whitespace-nowrap ${activePage === item.id ? 'text-[#C9A961] bg-[#C9A961]/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>{item.label}</a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <a href="/area-cliente/" className="px-3.5 py-1.5 rounded-md bg-[#C9A961] hover:bg-[#b8954f] text-white text-[0.7rem] font-semibold tracking-wide uppercase transition-colors">{loginLabel}</a>
            {/* Desktop Language Dropdown */}
            <div ref={langDropdownRef} className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[0.7rem] font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                EN
                <ChevronDown className={`w-3 h-3 transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {langDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                  {/* PT */}
                  <a href={ptHref} className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    {pick(lang, 'PT — Português', 'PT — Portuguese', 'PT — Portugués')}
                  </a>
                  {/* EN — active */}
                  <span className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#C9A961] bg-[#C9A961]/5 cursor-default">
                    <span className="w-2 h-2 rounded-full bg-[#C9A961]" />
                    {pick(lang, 'EN — Inglês', 'EN — English', 'EN — Inglés')}
                  </span>
                  {/* ES */}
                  <a href={esHrefResolved} className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    {pick(lang, 'ES — Espanhol', 'ES — Spanish', 'ES — Español')}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Actions — inside header (visible when not scrolled) */}
          <div className="lg:hidden flex items-center gap-1">
            {/* Mobile Language Button (inline, before hamburger) */}
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              EN
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -mr-2 text-slate-500 hover:text-slate-800"
              aria-label={menuLabel}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {scrolledDown && !mobileMenuOpen && (
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden fixed top-3 right-3 z-[60] p-2.5 bg-white/95 shadow-lg border border-slate-100 rounded-xl text-slate-800"
          aria-label={menuLabel}
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Mobile Language Dropdown — shown inline below header when globe is tapped */}
      {langDropdownOpen && !mobileMenuOpen && (
        <div className="lg:hidden fixed top-11 right-3 z-[55] w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1">
          <a href={ptHref} className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            {pick(lang, 'PT — Português', 'PT — Portuguese', 'PT — Portugués')}
          </a>
          <span className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#C9A961] bg-[#C9A961]/5 cursor-default">
            <span className="w-2 h-2 rounded-full bg-[#C9A961]" />
            {pick(lang, 'EN — Inglês', 'EN — English', 'EN — Inglés')}
          </span>
          <a href={esHrefResolved} className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            {pick(lang, 'ES — Espanhol', 'ES — Spanish', 'ES — Español')}
          </a>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-white" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
          <div className="flex items-center justify-between px-4 h-11 border-b border-slate-200/80">
            <a href="https://www.share2inspire.pt/en/pages/home" className="shrink-0">
              <img src="https://www.share2inspire.pt/images/logo-s.png" alt={logoAlt} className="h-6" style={{ width: "auto" }} />
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
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{languageLabel}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={ptHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {pick(lang, 'PT — Português', 'PT — Portuguese', 'PT — Portugués')}
                </a>
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#C9A961]/10 border border-[#C9A961]/30 text-sm font-semibold text-[#C9A961] cursor-default">
                  {pick(lang, 'EN — Inglês', 'EN — English', 'EN — Inglés')}
                </span>
                <a
                  href={esHrefResolved}
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {pick(lang, 'ES — Espanhol', 'ES — Spanish', 'ES — Español')}
                </a>
              </div>
            </div>
            {/* Login Button */}
            <div className="pt-3">
              <a
                href="/area-cliente/"
                className="block text-center px-5 py-2.5 rounded-lg bg-[#C9A961] hover:bg-[#b8954f] text-white text-sm font-semibold uppercase transition-colors"
              >
                {loginLabel}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
