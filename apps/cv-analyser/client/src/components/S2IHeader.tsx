/**
 * S2IHeader — Unified header component for all React pages (PT / EN / ES).
 * Detects language from URL via getLang() and renders nav items, labels,
 * and language switcher accordingly.
 *
 * Props:
 *   activePage: current page identifier for highlighting
 *
 * Auth: When the user is authenticated via Supabase, the LOGIN button is
 * replaced with a circle showing the user's initials (e.g. "SR" for Samuel Rolo).
 * Clicking the avatar links to the member area (/area-cliente/membros).
 */
import { useState, useEffect, useRef } from "react";
import { Globe, Menu, X, ChevronDown } from "lucide-react";
import { getLang, type Lang } from "@/i18n";
import { switchLangUrl, localePath } from "@/i18n/useTranslation";

interface S2IHeaderProps {
  activePage?: string;
}

/* ── Supabase constants (same project as area-cliente) ── */
const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
const SUPABASE_STORAGE_KEY = 'sb-cvlumvgrbuolrnwrtrgz-auth-token';

/* ── Helper: derive initials from a full name or email ── */
function deriveInitials(firstName: string, lastName: string, email: string): string {
  if (firstName && lastName) {
    return (firstName[0] + lastName[0]).toUpperCase();
  }
  if (firstName) {
    return firstName.slice(0, 2).toUpperCase();
  }
  if (email) {
    const local = email.split('@')[0];
    const parts = local.split(/[._\-+]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return local.slice(0, 2).toUpperCase();
  }
  return '';
}

/* ── Hook: read Supabase session from localStorage and fetch user initials ── */
function useUserInitials(): { initials: string; isLoaded: boolean } {
  const [initials, setInitials] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const stored = localStorage.getItem(SUPABASE_STORAGE_KEY);
        if (!stored) { setIsLoaded(true); return; }

        const parsed = JSON.parse(stored);
        const accessToken = parsed?.access_token;
        const userId = parsed?.user?.id;
        const userMeta = parsed?.user?.user_metadata;
        const userEmail = parsed?.user?.email || '';

        if (!accessToken || !userId) { setIsLoaded(true); return; }

        // Check token expiry
        const expiresAt = parsed?.expires_at;
        if (expiresAt && Date.now() / 1000 > expiresAt) { setIsLoaded(true); return; }

        // Try to fetch profile for first_name / last_name
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${userId}&select=first_name,last_name,email`,
          {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (res.ok) {
          const rows = await res.json();
          const row = rows?.[0];
          if (row) {
            const derived = deriveInitials(row.first_name || '', row.last_name || '', row.email || userEmail);
            if (derived) { setInitials(derived); setIsLoaded(true); return; }
          }
        }

        // Fallback: use user_metadata from the JWT payload
        const metaFirst = userMeta?.first_name || userMeta?.given_name || '';
        const metaLast = userMeta?.last_name || userMeta?.family_name || '';
        const derived = deriveInitials(metaFirst, metaLast, userEmail);
        setInitials(derived);
      } catch {
        // silently ignore — treat as unauthenticated
      } finally {
        setIsLoaded(true);
      }
    }
    load();
  }, []);

  return { initials, isLoaded };
}

/* ── Nav item definitions per language ── */
type NavItem = { href: string; label: string; id: string };

function pick(lang: Lang, pt: string, en: string, es: string): string {
  return lang === 'en' ? en : lang === 'es' ? es : pt;
}

function getNavItems(lang: Lang): NavItem[] {
  const lp = (ptPath: string) => localePath(ptPath, lang);
  const homeHref = lp('/');
  const servicesHref = lp('/servicos');
  const knowledgeHref = lp('/conhecimento');

  return [
    { href: homeHref, label: pick(lang, "Início", "Home", "Inicio"), id: "home" },
    { href: lp('/cv-analyser'), label: pick(lang, "CV Analyser", "CV Analyser", "CV Analyser"), id: "cv-analyser" },
    { href: lp('/career-path'), label: pick(lang, "Career Path", "Career Path", "Career Path"), id: "career-path" },
    { href: lp('/career-intelligence'), label: pick(lang, "Career Intelligence", "Career Intelligence", "Career Intelligence"), id: "career-intelligence" },
    { href: lp('/linkedin-roaster'), label: pick(lang, "LinkedIn Roaster", "LinkedIn Roaster", "LinkedIn Roaster"), id: "linkedin-roaster" },
    { href: lp('/bundle'), label: pick(lang, "Bundle", "Bundle", "Bundle"), id: "bundle" },
    { href: lp('/estudante'), label: pick(lang, "Pack Estudante", "Student Pack", "Pack Estudiante"), id: "estudante" },
    { href: servicesHref, label: pick(lang, "Serviços", "Services", "Servicios"), id: "servicos" },
    { href: knowledgeHref, label: pick(lang, "Knowledge Hub", "Knowledge Hub", "Hub de Conocimiento"), id: "knowledge-hub" },
    { href: lp('/sobre'), label: pick(lang, "Sobre", "About", "Acerca de"), id: "sobre" },
    { href: lp('/contactos'), label: pick(lang, "Contactos", "Contact", "Contacto"), id: "contactos" },
  ];
}

function getLangOptions(lang: Lang): { code: Lang; label: string }[] {
  return [
    { code: 'pt', label: pick(lang, 'PT — Português', 'PT — Portuguese', 'PT — Portugués') },
    { code: 'en', label: pick(lang, 'EN — Inglês', 'EN — English', 'EN — Inglés') },
    { code: 'es', label: pick(lang, 'ES — Espanhol', 'ES — Spanish', 'ES — Español') },
  ];
}

function getHomeUrl(lang: Lang): string {
  if (lang === 'en') return localePath('/', 'en');
  if (lang === 'es') return localePath('/', 'es');
  return localePath('/', 'pt');
}

/* ── UserAvatar: circle with initials or LOGIN button ── */
function UserAvatar({
  initials,
  isLoaded,
  loginLabel,
  memberAreaLabel,
  isMobile = false,
  onClick,
}: {
  initials: string;
  isLoaded: boolean;
  loginLabel: string;
  memberAreaLabel: string;
  isMobile?: boolean;
  onClick?: () => void;
}) {
  // While loading, render nothing to avoid flash of LOGIN button
  if (!isLoaded) return null;

  if (initials) {
    // Authenticated: show avatar circle linking to member area
    return (
      <a
        href="/area-cliente/membros"
        title={memberAreaLabel}
        onClick={onClick}
        className={
          isMobile
            ? "flex items-center justify-center w-9 h-9 rounded-full bg-[#C9A961] text-white text-sm font-bold uppercase tracking-wide shadow-sm hover:bg-[#b8954f] transition-colors"
            : "flex items-center justify-center w-8 h-8 rounded-full bg-[#C9A961] text-white text-xs font-bold uppercase tracking-wide shadow-sm hover:bg-[#b8954f] transition-colors"
        }
        aria-label={memberAreaLabel}
      >
        {initials}
      </a>
    );
  }

  // Not authenticated: show LOGIN button
  return isMobile ? (
    <a
      href="/area-cliente/"
      onClick={onClick}
      className="s2i-login-btn block text-center px-5 py-2.5 rounded-lg bg-[#C9A961] hover:bg-[#b8954f] text-white text-sm font-semibold uppercase transition-colors"
    >
      {loginLabel}
    </a>
  ) : (
    <a
      href="/area-cliente/"
      className="s2i-login-btn px-3.5 py-1.5 rounded-md bg-[#C9A961] hover:bg-[#b8954f] text-white text-[0.7rem] font-semibold tracking-wide uppercase transition-colors"
    >
      {loginLabel}
    </a>
  );
}

export default function S2IHeader({ activePage = '' }: S2IHeaderProps) {
  const lang = getLang();
  const navItems = getNavItems(lang);
  const langOptions = getLangOptions(lang);
  const { initials, isLoaded } = useUserInitials();

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
  const closeMenuLabel = pick(lang, 'Fechar menu', 'Close menu', 'Cerrar menú');
  const langSectionLabel = pick(lang, 'Idioma', 'Language', 'Idioma');
  const loginLabel = pick(lang, 'Login', 'Login', 'Login');
  const memberAreaLabel = pick(lang, 'Área de Membro', 'Member Area', 'Área de Miembro');
  const menuLabel = pick(lang, 'Menu', 'Menu', 'Menú');
  const logoAlt = pick(lang, 'Share2Inspire', 'Share2Inspire', 'Share2Inspire');

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
              src="/logo-s2i.png"
              alt={logoAlt}
              className="h-10 lg:h-12 w-auto object-contain"
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
            {/* LOGIN button or user avatar */}
            <UserAvatar
              initials={initials}
              isLoaded={isLoaded}
              loginLabel={loginLabel}
              memberAreaLabel={memberAreaLabel}
            />

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
              aria-label={menuLabel}
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
          aria-label={menuLabel}
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
              <img src="/logo-s2i.png" alt={logoAlt} className="h-10 w-auto object-contain" style={{ width: "auto" }} />
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
            {/* Login Button or User Avatar */}
            <div className="pt-3">
              <UserAvatar
                initials={initials}
                isLoaded={isLoaded}
                loginLabel={loginLabel}
                memberAreaLabel={memberAreaLabel}
                isMobile
                onClick={() => setMobileMenuOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
