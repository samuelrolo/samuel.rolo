/**
 * S2IHeader — Shared header component for all PT React pages.
 * Single source of truth for navigation across the platform.
 * 
 * Props:
 *   activePage: current page identifier for highlighting
 *   langToggleHref: link for the EN version toggle
 */
import { useState, useEffect } from "react";
import { Globe, Menu, X } from "lucide-react";

interface S2IHeaderProps {
  activePage?: 'cv-analyser' | 'career-path' | 'career-intelligence' | 'linkedin-roaster' | 'bundle' | 'estudante' | 'servicos' | 'sobre' | 'home' | '';
  langToggleHref?: string;
}

const navItems = [
  { href: "https://www.share2inspire.pt", label: "Início", id: "home" },
  { href: "/cv-analyser", label: "CV Analyser", id: "cv-analyser" },
  { href: "/career-path", label: "Career Path", id: "career-path" },
  { href: "/career-intelligence", label: "Career Intelligence", id: "career-intelligence" },
  { href: "/linkedin-roaster", label: "LinkedIn Roaster", id: "linkedin-roaster" },
  { href: "/bundle", label: "Bundle", id: "bundle" },
  { href: "/estudante", label: "Pack Estudante", id: "estudante" },
  { href: "https://www.share2inspire.pt/pages/servicos.html", label: "Serviços", id: "servicos" },
];

export default function S2IHeader({ activePage = '', langToggleHref }: S2IHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80" style={{ overflowX: 'hidden' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <a href="https://www.share2inspire.pt" className="shrink-0">
          <img
            src="https://www.share2inspire.pt/images/logo-s.png"
            alt="Share2Inspire"
            className="h-8"
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
          {langToggleHref && (
            <a
              href={langToggleHref}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[0.7rem] font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              EN
            </a>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 -mr-2 text-slate-500 hover:text-slate-800 transition-colors z-[60]"
          aria-label="Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu - Full screen overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 top-[57px] bg-white z-50"
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
                className="s2i-login-btn px-5 py-2.5 rounded-lg bg-[#C9A961] hover:bg-[#b8954f] text-white text-sm font-semibold uppercase transition-colors"
              >
                Login
              </a>
              {langToggleHref && (
                <a
                  href={langToggleHref}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm text-slate-500 hover:text-slate-700 border border-slate-200"
                >
                  <Globe className="w-4 h-4" />
                  EN
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
