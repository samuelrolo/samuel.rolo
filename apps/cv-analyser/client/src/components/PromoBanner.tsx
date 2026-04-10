import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getLang, pick } from "@/i18n";
import { localePath } from "@/i18n/useTranslation";

const STORAGE_KEY = "s2i_promo_banner_dismissed_estudante_v1";

export default function PromoBanner() {
  const [visible, setVisible] = useState(false);
  const lang = getLang();

  const badge = pick("PACK ESTUDANTE", "STUDENT PACK", "PACK ESTUDIANTE");
  const text = pick(
    "Ferramentas de carreira por 7,99€",
    "Career tools for €7.99",
    "Herramientas de carrera por 7,99€"
  );
  const discount = pick("(-43%)", "(-43%)", "(-43%)");
  const cta = pick("Descobrir →", "Discover →", "Descubrir →");
  const bannerAriaLabel = pick("Promoção Pack Estudante", "Student Pack promotion", "Promoción Pack Estudiante");
  const closeLabel = pick("Fechar banner", "Close banner", "Cerrar banner");

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
      aria-label={bannerAriaLabel}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <span className="hidden sm:inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase whitespace-nowrap">
          {badge}
        </span>

        <p className="flex-1 text-center text-sm font-medium">
          <span className="sm:hidden font-semibold">{badge} — </span>
          {text}{" "}
          <span className="font-bold">{discount}</span>
        </p>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={localePath('/estudante', lang)}
            className="inline-flex items-center rounded-md bg-white text-emerald-700 font-semibold text-xs px-3 py-1 hover:bg-emerald-50 transition-colors whitespace-nowrap"
          >
            {cta}
          </a>
          <button
            onClick={dismiss}
            aria-label={closeLabel}
            className="p-1 rounded hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
