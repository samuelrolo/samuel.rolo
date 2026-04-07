/**
 * S2IHeaderEN — Shared header component for all EN React pages.
 * Single source of truth for English navigation.
 */
import { useState, useEffect, useRef } from "react";
import { Globe, Menu, X } from "lucide-react";

interface S2IHeaderENProps {
  activePage?: 'cv-analyser' | 'career-path' | 'career-intelligence' | 'linkedin-roaster' | 'bundle' | 'student-pack' | 'services' | 'about' | 'home' | '';
  langToggleHref?: string;
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
];

export default function S2IHeaderEN({ activePage = '', langToggleHref }: S2IHeaderENProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolledDown, setScrolledDown] = useState(false);
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

  // Scroll-to-hide logo on mobile
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > 60) {
        setScrolledDown(true);
      } else {
        setScrolledDown(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80" style={{ overflowX: 'hidden' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-11 lg:h-14 flex items-center justify-between">
        {/* Logo — hidden on mobile when scrolled */}
        <a
          href="https://www.share2inspire.pt/en/pages/home"
          className="shrink-0 transition-all duration-300 lg:opacity-100 lg:w-auto"
          style={{
            opacity: scrolledDown ? 0 : 1,
            width: scrolledDown ? 0 : 'auto',
            overflow: 'hidden',
          }}
        >
          <img src="https://www.share2inspire.pt/images/logo-s.png" alt="Share2Inspire" className="h-6 lg:h-8" style={{ width: "auto" }} />
        </a>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map(item => (
            <a key={item.id} href={item.href} className={`px-3 py-1.5 rounded-md text-[0.75rem] font-medium tracking-wide transition-colors whitespace-nowrap ${activePage === item.id ? 'text-[#C9A961] bg-[#C9A961]/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>{item.label}</a>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-2">
          <a href="/area-cliente/" className="px-3.5 py-1.5 rounded-md bg-[#C9A961] hover:bg-[#b8954f] text-white text-[0.7rem] font-semibold tracking-wide uppercase transition-colors">Login</a>
          {langToggleHref && (
            <a href={langToggleHref} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[0.7rem] font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"><Globe className="w-3.5 h-3.5" />PT</a>
          )}
        </div>

        {/* Mobile Actions — lang toggle + hamburger always visible */}
        <div className="lg:hidden flex items-center gap-1">
          {langToggleHref && (
            <a
              href={langToggleHref}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              PT
            </a>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 -mr-2 transition-all duration-300 pointer-events-auto z-[60] ${scrolledDown ? 'bg-white/95 shadow-md border border-slate-100 rounded-xl' : 'text-slate-500 hover:text-slate-800'}`}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-slate-800" /> : <Menu className={`w-5 h-5 ${scrolledDown ? 'text-slate-800' : ''}`} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu - Full screen overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 top-[57px] bg-white z-50 pointer-events-auto"
          style={{ overflowY: 'auto', overflowX: 'hidden' }}
        >
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
            <div className="flex items-center gap-3 pt-4 mt-4 border-t border-slate-200">
              <a
                href="/area-cliente/"
                className="px-5 py-2.5 rounded-lg bg-[#C9A961] hover:bg-[#b8954f] text-white text-sm font-semibold uppercase transition-colors"
              >
                Login
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
