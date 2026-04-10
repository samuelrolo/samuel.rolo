import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getLang } from "@/i18n";
import { localePath } from "@/i18n/useTranslation";

const STORAGE_KEY = "s2i_promo_banner_dismissed_estudante_v1";

const copy = {
  pt: {
    badge: "PACK ESTUDANTE",
    text: "Ferramentas de carreira por 7,99€",
    discount: "(-43%)",
    cta: "Descobrir →",
  },
  en: {
    badge: "STUDENT PACK",
    text: "Career tools for €7.99",
    discount: "(-43%)",
    cta: "Discover →",
  },
  es: {
    badge: "PACK ESTUDIANTE",
    text: "Herramientas de carrera por 7,99€",
    discount: "(-43%)",
    cta: "Descubrir →",
  },
};

export default function PromoBanner() {
  const [visible, setVisible] = useState(false);
  const lang = getLang();
  const t = copy[lang] ?? copy.pt;

  useEffect(() => {
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="w-full bg-emerald-600 text-white py-2 px-4"
      role="banner"
      aria-label="Promoção Pack Estudante"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Left: badge */}
        <span className="hidden sm:inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase whitespace-nowrap">
          {t.badge}
        </span>

        {/* Center: text */}
        <p className="flex-1 text-center text-sm font-medium">
          <span className="sm:hidden font-semibold">{t.badge} — </span>
          {t.text}{" "}
          <span className="font-bold">{t.discount}</span>
        </p>

        {/* Right: CTA + dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={localePath('/estudante', lang)}
            className="inline-flex items-center rounded-md bg-white text-emerald-700 font-semibold text-xs px-3 py-1 hover:bg-emerald-50 transition-colors whitespace-nowrap"
          >
            {t.cta}
          </a>
          <button
            onClick={dismiss}
            aria-label="Fechar banner"
            className="p-1 rounded hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
