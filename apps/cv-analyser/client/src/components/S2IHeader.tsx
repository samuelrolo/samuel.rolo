/**
 * S2IHeader — Shared header component for all PT React pages.
 * Single source of truth for navigation across the platform.
 * 
 * Props:
 *   activePage: current page identifier for highlighting
 *   langToggleHref: link for the EN version toggle
 */
import { useState } from "react";
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

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
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
              className={`px-3 py-1.5 rounded-md text-[0.75rem] font-medium tracking-wide transition-colors ${
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
            className="px-3.5 py-1.5 rounded-md bg-[#C9A961] hover:bg-[#b8954f] text-white text-[0.7rem] font-semibold tracking-wide uppercase transition-colors"
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
          className="lg:hidden p-2 -mr-2 text-slate-500 hover:text-slate-800 transition-colors"
          aria-label="Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          {navItems.map(item => (
            <a
              key={item.id}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                activePage === item.id
                  ? 'text-[#C9A961] bg-[#C9A961]/5 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </a>
          ))}
          <div className="flex items-center gap-2 pt-2 mt-2 border-t border-slate-100">
            <a
              href="/area-cliente/"
              className="px-3.5 py-1.5 rounded-md bg-[#C9A961] hover:bg-[#b8954f] text-white text-xs font-semibold uppercase transition-colors"
            >
              Login
            </a>
            {langToggleHref && (
              <a
                href={langToggleHref}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-600"
              >
                <Globe className="w-3.5 h-3.5" />
                EN
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
