import { Chrome, ExternalLink } from "lucide-react";
import useTranslation from "@/i18n/useTranslation";

const CHROME_WEB_STORE_URL = "https://chromewebstore.google.com/detail/share2inspire-%E2%80%94-job-saver/depelnoienlhmoolnepgjpdmoaocfdem";

type ChromeExtensionCalloutProps = {
  variant?: "form" | "results";
};

export default function ChromeExtensionCallout({
  variant = "form",
}: ChromeExtensionCalloutProps) {
  const { pick } = useTranslation();
  const isResults = variant === "results";

  return (
    <div
      className={`rounded-2xl border transition-colors ${
        isResults
          ? "border-[#C9A961]/25 bg-gradient-to-r from-[#12392f]/[0.05] via-white to-[#C9A961]/[0.08] p-4 sm:p-5"
          : "border-[#C9A961]/18 bg-[#12392f]/[0.03] p-3.5"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#C9A961]/22 bg-[#12392f] text-[#D7B869] shadow-sm">
            <Chrome className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#C9A961]">
              {pick("Share2Inspire", "Share2Inspire", "Share2Inspire")}
            </p>
            <h3 className={`font-semibold text-foreground ${isResults ? "text-base" : "text-sm"}`}>
              {pick(
                "Extensão Chrome — Job Saver",
                "Chrome Extension — Job Saver",
                "Extensión Chrome — Job Saver"
              )}
            </h3>
            <p className={`mt-1 text-muted-foreground ${isResults ? "text-sm leading-6" : "text-xs leading-5"}`}>
              {pick(
                "Guarda ofertas de emprego diretamente do LinkedIn",
                "Save job offers directly from LinkedIn",
                "Guarda ofertas de empleo directamente desde LinkedIn"
              )}
            </p>
            <p className={`mt-1 text-muted-foreground/80 ${isResults ? "text-xs" : "text-[11px]"}`}>
              {isResults
                ? pick(
                    "Mantém as descrições das vagas guardadas e organiza o teu pipeline depois da análise do CV.",
                    "Keep job descriptions saved and organise your pipeline after your CV analysis.",
                    "Guarda las descripciones de las ofertas y organiza tu pipeline después del análisis del CV."
                  )
                : pick(
                    "Útil para guardar vagas enquanto preparas candidaturas e comparas requisitos com o teu CV.",
                    "Useful for saving jobs while you prepare applications and compare requirements with your CV.",
                    "Útil para guardar ofertas mientras preparas candidaturas y comparas requisitos con tu CV."
                  )}
            </p>
          </div>
        </div>

        <a
          href={CHROME_WEB_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl border border-[#C9A961]/35 bg-white px-4 py-2 text-sm font-semibold text-[#12392f] transition-all hover:border-[#C9A961]/55 hover:bg-[#faf7ef]"
        >
          {pick("Instalar", "Install", "Instalar")}
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
