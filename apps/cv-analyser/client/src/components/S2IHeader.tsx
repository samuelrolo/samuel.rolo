/**
 * S2IHeader — Unified header component for all React pages (PT / EN / ES).
 * Uses a single central navigation configuration for menu items and language switching.
 */
import { useEffect, useRef, useState } from 'react';
import { Globe, Menu, X, ChevronDown } from 'lucide-react';
import PublicLoginModal from '@/components/PublicLoginModal';
import {
  getLanguageLinks,
  getLocalizedPath,
  getLocaleFromPath,
  getMenuItems,
  getMenuLabels,
  normalizeActivePage,
  resolveRoute,
} from '@/config/navigation';

interface S2IHeaderProps {
  activePage?: string;
}

const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
const SUPABASE_STORAGE_KEY = 'sb-cvlumvgrbuolrnwrtrgz-auth-token';

function deriveInitials(firstName: string, lastName: string, email: string): string {
  if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase();
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  if (email) {
    const local = email.split('@')[0];
    const parts = local.split(/[._\-+]/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return local.slice(0, 2).toUpperCase();
  }
  return '';
}

function useUserInitials(): { initials: string; isLoaded: boolean } {
  const [initials, setInitials] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const stored = localStorage.getItem(SUPABASE_STORAGE_KEY);
        if (!stored) {
          setIsLoaded(true);
          return;
        }

        const parsed = JSON.parse(stored);
        const accessToken = parsed?.access_token;
        const userId = parsed?.user?.id;
        const userMeta = parsed?.user?.user_metadata;
        const userEmail = parsed?.user?.email || '';

        if (!accessToken || !userId) {
          setIsLoaded(true);
          return;
        }

        const expiresAt = parsed?.expires_at;
        if (expiresAt && Date.now() / 1000 > expiresAt) {
          setIsLoaded(true);
          return;
        }

        const res = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${userId}&select=first_name,last_name,email`, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (res.ok) {
          const rows = await res.json();
          const row = rows?.[0];
          if (row) {
            const derived = deriveInitials(row.first_name || '', row.last_name || '', row.email || userEmail);
            if (derived) {
              setInitials(derived);
              setIsLoaded(true);
              return;
            }
          }
        }

        const metaFirst = userMeta?.first_name || userMeta?.given_name || '';
        const metaLast = userMeta?.last_name || userMeta?.family_name || '';
        setInitials(deriveInitials(metaFirst, metaLast, userEmail));
      } catch {
        // Ignore and treat as unauthenticated.
      } finally {
        setIsLoaded(true);
      }
    }

    load();
  }, []);

  return { initials, isLoaded };
}

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
  if (!isLoaded) return null;

  if (initials) {
    return (
      <a
        href="/area-cliente"
        title={memberAreaLabel}
        onClick={onClick}
        className={
          isMobile
            ? 'flex items-center justify-center w-9 h-9 rounded-full bg-[#C9A961] text-white text-sm font-bold uppercase tracking-wide shadow-sm hover:bg-[#b8954f] transition-colors'
            : 'flex items-center justify-center w-8 h-8 rounded-full bg-[#C9A961] text-white text-xs font-bold uppercase tracking-wide shadow-sm hover:bg-[#b8954f] transition-colors'
        }
        aria-label={memberAreaLabel}
      >
        {initials}
      </a>
    );
  }

  return isMobile ? (
    <button
      type="button"
      onClick={onClick}
      className="s2i-login-btn block text-center px-5 py-2.5 rounded-lg bg-[#C9A961] hover:bg-[#b8954f] text-white text-sm font-semibold uppercase transition-colors"
    >
      {loginLabel}
    </button>
  ) : (
    <button
      type="button"
      onClick={onClick}
      className="s2i-login-btn px-3.5 py-1.5 rounded-md bg-[#C9A961] hover:bg-[#b8954f] text-white text-[0.7rem] font-semibold tracking-wide uppercase transition-colors"
    >
      {loginLabel}
    </button>
  );
}

export default function S2IHeader({ activePage = '' }: S2IHeaderProps) {
  const currentPath =
    typeof window === 'undefined'
      ? '/'
      : `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const resolvedCurrentRoute = resolveRoute(currentPath);
  const lang = getLocaleFromPath(currentPath);
  const navItems = getMenuItems(lang);
  const langOptions = getLanguageLinks(currentPath, lang);
  const labels = getMenuLabels(lang);
  const currentNavPage = resolvedCurrentRoute?.activeMenuId || normalizeActivePage(activePage) || '';
  const homeHref = getLocalizedPath('home', lang);
  const { initials, isLoaded } = useUserInitials();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [scrolledDown, setScrolledDown] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const desktopLangRef = useRef<HTMLDivElement>(null);
  const mobileLangRef = useRef<HTMLDivElement>(null);
  const mobileLangDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleScroll = () => setScrolledDown(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedDesktop = desktopLangRef.current?.contains(target);
      const clickedMobileTrigger = mobileLangRef.current?.contains(target);
      const clickedMobileDropdown = mobileLangDropdownRef.current?.contains(target);

      if (!clickedDesktop && !clickedMobileTrigger && !clickedMobileDropdown) {
        setLangDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function closeAllMenus() {
    setMobileMenuOpen(false);
    setLangDropdownOpen(false);
  }

  function openLoginModal() {
    closeAllMenus();
    setLoginModalOpen(true);
  }

  function toggleMobileMenu() {
    setLangDropdownOpen(false);
    setMobileMenuOpen(prev => !prev);
  }

  function toggleLangDropdown() {
    setMobileMenuOpen(false);
    setLangDropdownOpen(prev => !prev);
  }

  function LangOption({ opt, isMobile = false }: { opt: (typeof langOptions)[number]; isMobile?: boolean }) {
    const isActive = opt.code === lang;
    const isAvailable = opt.available !== false;
    const href = opt.href;

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

    if (!isAvailable) {
      return isMobile ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-300 cursor-not-allowed">
          {opt.label}
        </span>
      ) : (
        <span className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 cursor-not-allowed">
          <span className="w-2 h-2 rounded-full bg-slate-200" />
          {opt.label}
        </span>
      );
    }

    return isMobile ? (
      <a
        href={href}
        onClick={closeAllMenus}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
      >
        {opt.label}
      </a>
    ) : (
      <a
        href={href}
        onClick={() => setLangDropdownOpen(false)}
        className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-slate-300" />
        {opt.label}
      </a>
    );
  }

  return (
    <>
      <PublicLoginModal open={loginModalOpen} lang={lang} onClose={() => setLoginModalOpen(false)} />
      <header
        className={`sticky top-0 z-50 transition-all duration-300 border-b bg-white/95 backdrop-blur-md border-slate-200/80 ${
          scrolledDown ? 'shadow-sm' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-11 lg:h-14 flex items-center justify-between">
          <a href={homeHref} className="shrink-0">
            <img
              src="/logo-s2i.png"
              alt={labels.logoAlt}
              width="240"
              height="64"
              decoding="async"
              fetchPriority="high"
              className="h-10 lg:h-12 w-auto object-contain"
              style={{ width: 'auto' }}
            />
          </a>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => (
              <a
                key={item.id}
                href={item.href}
                className={`px-3 py-1.5 rounded-md text-[0.75rem] font-medium tracking-wide transition-colors whitespace-nowrap ${
                  currentNavPage === item.id
                    ? 'text-[#C9A961] bg-[#C9A961]/5'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <UserAvatar
              initials={initials}
              isLoaded={isLoaded}
              loginLabel={labels.login}
              memberAreaLabel={labels.memberArea}
              onClick={openLoginModal}
            />

            <div ref={desktopLangRef} className="relative">
              <button
                type="button"
                onClick={toggleLangDropdown}
                aria-haspopup="menu"
                aria-expanded={langDropdownOpen}
                aria-controls="desktop-language-switcher"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[0.7rem] font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                {lang.toUpperCase()}
                <ChevronDown className={`w-3 h-3 transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {langDropdownOpen && (
                <div id="desktop-language-switcher" className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                  {langOptions.map(opt => <LangOption key={opt.code} opt={opt} />)}
                </div>
              )}
            </div>
          </div>

          <div className="lg:hidden flex items-center gap-1" ref={mobileLangRef}>
            <button
              type="button"
              onClick={toggleLangDropdown}
              aria-label={`${labels.langSection}: ${lang.toUpperCase()}`}
              aria-haspopup="menu"
              aria-expanded={langDropdownOpen}
              aria-controls="mobile-language-switcher"
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 bg-white/90 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang.toUpperCase()}
            </button>
            <button
              type="button"
              onClick={toggleMobileMenu}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
              className="p-2 -mr-2 text-slate-500 hover:text-slate-800"
              aria-label={labels.menu}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {langDropdownOpen && !mobileMenuOpen && (
        <div
          id="mobile-language-switcher"
          ref={mobileLangDropdownRef}
          className="lg:hidden fixed top-11 right-3 z-[55] w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1"
        >
          {langOptions.map(opt => <LangOption key={opt.code} opt={opt} isMobile />)}
        </div>
      )}

      {mobileMenuOpen && (
        <div id="mobile-navigation-drawer" className="lg:hidden fixed inset-0 z-[60] bg-white" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
          <div className="flex items-center justify-between px-4 h-11 border-b border-slate-200/80">
            <a href={homeHref} className="shrink-0">
              <img src="/logo-s2i.png" alt={labels.logoAlt} width="240" height="64" decoding="async" className="h-10 w-auto object-contain" style={{ width: 'auto' }} />
            </a>
            <button type="button" onClick={closeAllMenus} className="p-2 -mr-2 text-slate-800" aria-label={labels.closeMenu}>
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
                  currentNavPage === item.id
                    ? 'text-[#C9A961] bg-[#C9A961]/5 font-semibold'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </a>
            ))}

            <div className="pt-4 mt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{labels.langSection}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {langOptions.map(opt => <LangOption key={opt.code} opt={opt} isMobile />)}
              </div>
            </div>

            <div className="pt-3">
              <UserAvatar
                initials={initials}
                isLoaded={isLoaded}
                loginLabel={labels.login}
                memberAreaLabel={labels.memberArea}
                isMobile
                onClick={openLoginModal}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
