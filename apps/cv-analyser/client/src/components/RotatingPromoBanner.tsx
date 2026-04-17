import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Chrome, GraduationCap, X } from "lucide-react";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import useTranslation from "@/i18n/useTranslation";

const CHROME_WEB_STORE_URL = "https://chromewebstore.google.com/detail/share2inspire-%E2%80%94-job-saver/depelnoienlhmoolnepgjpdmoaocfdem";
const STORAGE_KEY = "s2i_rotating_promo_banner_dismissed_v1";

type PromoSlide = {
  id: string;
  badge: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  external?: boolean;
  icon: typeof Chrome;
};

export default function RotatingPromoBanner() {
  const { pick, localePath } = useTranslation();
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  const slides = useMemo<PromoSlide[]>(() => [
    {
      id: "chrome-extension",
      badge: pick("NOVO", "NEW", "NUEVO"),
      title: pick("Extensão Chrome — Job Saver", "Chrome Extension — Job Saver", "Extensión Chrome — Job Saver"),
      description: pick(
        "Guarda ofertas de emprego diretamente do LinkedIn",
        "Save job offers directly from LinkedIn",
        "Guarda ofertas de empleo directamente desde LinkedIn"
      ),
      cta: pick("Instalar", "Install", "Instalar"),
      href: CHROME_WEB_STORE_URL,
      external: true,
      icon: Chrome,
    },
    {
      id: "student-pack",
      badge: pick("DESTAQUE", "FEATURED", "DESTACADO"),
      title: pick("Pack Estudante", "Student Pack", "Pack Estudiante"),
      description: pick(
        "CV Analyser + LinkedIn Roaster num formato simples e pensado para o primeiro emprego.",
        "CV Analyser + LinkedIn Roaster in a simple format designed for a first job search.",
        "CV Analyser + LinkedIn Roaster en un formato simple pensado para la búsqueda del primer empleo."
      ),
      cta: pick("Descobrir", "Discover", "Descubrir"),
      href: localePath("/estudante"),
      icon: GraduationCap,
    },
  ], [localePath, pick]);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  useEffect(() => {
    if (!api) return;

    const handleSelect = () => setActiveIndex(api.selectedScrollSnap());
    handleSelect();
    api.on("select", handleSelect);

    return () => {
      api.off("select", handleSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!api || slides.length <= 1 || !visible) return;

    const intervalId = window.setInterval(() => {
      const lastIndex = slides.length - 1;
      const nextIndex = api.selectedScrollSnap() >= lastIndex ? 0 : api.selectedScrollSnap() + 1;
      api.scrollTo(nextIndex);
    }, 6000);

    return () => window.clearInterval(intervalId);
  }, [api, slides.length, visible]);

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <section className="relative z-20 border-b border-[#C9A961]/12 bg-[#0b211c] text-white">
      <div className="mx-auto max-w-6xl px-3 py-2 sm:px-6">
        <Carousel
          setApi={setApi}
          opts={{ loop: slides.length > 1, align: "start" }}
          className="overflow-hidden rounded-xl border border-[#C9A961]/18 bg-gradient-to-r from-[#12392f] via-[#103129] to-[#0d2722] shadow-[0_12px_28px_-24px_rgba(0,0,0,0.7)]"
        >
          <CarouselContent className="-ml-0">
            {slides.map((slide) => {
              const Icon = slide.icon;

              return (
                <CarouselItem key={slide.id} className="pl-0">
                  <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4">
                    <span className="hidden sm:inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#C9A961]/25 bg-[#C9A961]/10 text-[#D8BC74]">
                      <Icon className="h-4 w-4" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex rounded-full bg-white/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D8BC74]">
                          {slide.badge}
                        </span>
                        {slides.length > 1 && (
                          <div className="hidden items-center gap-1 md:flex">
                            {slides.map((item, index) => (
                              <button
                                key={item.id}
                                type="button"
                                aria-label={`${pick("Ir para slide", "Go to slide", "Ir a la diapositiva")} ${index + 1}`}
                                onClick={() => api?.scrollTo(index)}
                                className={`h-1.5 rounded-full transition-all ${activeIndex === index ? "w-5 bg-[#C9A961]" : "w-1.5 bg-white/30 hover:bg-white/45"}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-1 flex min-w-0 flex-col sm:flex-row sm:items-center sm:gap-2">
                        <p className="truncate text-sm font-semibold text-white">
                          {slide.title}
                        </p>
                        <p className="hidden truncate text-sm text-white/72 sm:block">
                          — {slide.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                      <a
                        href={slide.href}
                        target={slide.external ? "_blank" : undefined}
                        rel={slide.external ? "noopener noreferrer" : undefined}
                        className="inline-flex min-h-[34px] items-center gap-1 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-[#12392f] transition-all hover:bg-[#f6f2e6] sm:min-h-[36px]"
                      >
                        {slide.cta}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={dismiss}
                        aria-label={pick("Fechar banner", "Close banner", "Cerrar banner")}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
