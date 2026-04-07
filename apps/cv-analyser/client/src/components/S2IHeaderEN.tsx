/**
 * S2IHeaderEN — Shared header component for all EN React pages.
 * Single source of truth for English navigation.
 */
import { useState } from "react";
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

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-11 lg:h-14 flex items-center justify-between">
        <a href="https://www.share2inspire.pt/en/pages/home" className="shrink-0">
          <img src="https://www.share2inspire.pt/images/logo-s.png" alt="Share2Inspire" className="h-6 lg:h-8" style={{ width: "auto" }} />
        </a>
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map(item => (
            <a key={item.id} href={item.href} className={`px-3 py-1.5 rounded-md text-[0.75rem] font-medium tracking-wide transition-colors ${activePage === item.id ? 'text-[#C9A961] bg-[#C9A961]/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>{item.label}</a>
          ))}
        </nav>
        <div className="hidden lg:flex items-center gap-2">
          <a href="/area-cliente/" className="px-3.5 py-1.5 rounded-md bg-[#C9A961] hover:bg-[#b8954f] text-white text-[0.7rem] font-semibold tracking-wide uppercase transition-colors">Login</a>
          {langToggleHref && (
            <a href={langToggleHref} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[0.7rem] font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"><Globe className="w-3.5 h-3.5" />PT</a>
          )}
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 -mr-2 text-slate-500 hover:text-slate-800 transition-colors" aria-label="Menu">
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          {navItems.map(item => (
            <a key={item.id} href={item.href} className={`block px-3 py-2 rounded-md text-sm transition-colors ${activePage === item.id ? 'text-[#C9A961] bg-[#C9A961]/5 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>{item.label}</a>
          ))}
          <div className="flex items-center gap-2 pt-2 mt-2 border-t border-slate-100">
            <a href="/area-cliente/" className="px-3.5 py-1.5 rounded-md bg-[#C9A961] hover:bg-[#b8954f] text-white text-xs font-semibold uppercase transition-colors">Login</a>
            {langToggleHref && <a href={langToggleHref} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-600"><Globe className="w-3.5 h-3.5" />PT</a>}
          </div>
        </div>
      )}
    </header>
  );
}
