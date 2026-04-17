import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Chrome, GraduationCap } from "lucide-react";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import useTranslation from "@/i18n/useTranslation";

const CHROME_WEB_STORE_URL = "https://chromewebstore.google.com/detail/share2inspire-%E2%80%94-job-saver/depelnoienlhmoolnepgjpdmoaocfdem";

type PromoSlide = {
  id: string;
  eyebrow: string;
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

  const slides = useMemo<PromoSlide[]>(() => [
    {
      id: "chrome-extension",
      eyebrow: pick("Novo no ecossistema Share2Inspire", "New in the Share2Inspire ecosystem", "Nuevo en el ecosistema Share2Inspire"),
      title: pick("Extensão Chrome — Job Saver", "Chrome Extension — Job Saver", "Extensión Chrome — Job Saver"),
      description: pick(
        "Guarda ofertas de emprego diretamente do LinkedIn",
        "Save job offers directly from LinkedIn",
        "Guarda ofertas de empleo directamente desde LinkedIn"
      ),
      cta: pick("Instalar extensão", "Install extension", "Instalar extensión"),
      href: CHROME_WEB_STORE_URL,
      external: true,
      icon: Chrome,
    },
    {
      id: "student-pack",
      eyebrow: pick("Oferta em destaque", "Featured offer", "Oferta destacada"),
      title: pick("Pack Estudante", "Student Pack", "Pack Estudiante"),
      description: pick(
        "CV Analyser + LinkedIn Roaster num formato simples, elegante e pensado para o primeiro emprego.",
        "CV Analyser + LinkedIn Roaster in a simple, elegant format designed for a first job search.",
        "CV Analyser + LinkedIn Roaster en un formato simple, elegante y pensado para la búsqueda del primer empleo."
      ),
      cta: pick("Descobrir pack", "Discover pack", "Descubrir pack"),
      href: localePath("/estudante"),
      icon: GraduationCap,
    },
  ], [localePath, pick]);

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
    if (!api || slides.length <= 1) return;

    const intervalId = window.setInterval(() => {
      const lastIndex = slides.length - 1;
      const nextIndex = api.selectedScrollSnap() >= lastIndex ? 0 : api.selectedScrollSnap() + 1;
      api.scrollTo(nextIndex);
    }, 6000);

    return () => window.clearInterval(intervalId);
  }, [api, slides.length]);

  return (
    <section className="relative z-20 border-b border-[#C9A961]/12 bg-[#0b211c] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
        <Carousel
          setApi={setApi}
          opts={{ loop: slides.length > 1, align: "start" }}
          className="overflow-hidden rounded-[22px] border border-[#C9A961]/18 bg-gradient-to-r from-[#12392f] via-[#0f2f28] to-[#0b241f] shadow-[0_18px_44px_-30px_rgba(0,0,0,0.65)]"
        >
          <CarouselContent className="-ml-0">
            {slides.map((slide) => {
              const Icon = slide.icon;

              return (
                <CarouselItem key={slide.id} className="pl-0">
                  <div className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8 md:py-5">
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#C9A961]/30 bg-[#C9A961]/10 text-[#E4C773]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#D8BC74]">
                          {slide.eyebrow}
                        </p>
                        <h2 className="text-base font-semibold text-white md:text-lg">
                          {slide.title}
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-white/72 md:max-w-2xl">
                          {slide.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 md:justify-end">
                      {slides.length > 1 && (
                        <div className="flex items-center gap-1.5">
                          {slides.map((item, index) => (
                            <button
                              key={item.id}
                              type="button"
                              aria-label={`${pick("Ir para slide", "Go to slide", "Ir a la diapositiva")} ${index + 1}`}
                              onClick={() => api?.scrollTo(index)}
                              className={`h-2.5 rounded-full transition-all ${activeIndex === index ? "w-7 bg-[#C9A961]" : "w-2.5 bg-white/25 hover:bg-white/40"}`}
                            />
                          ))}
                        </div>
                      )}

                      <a
                        href={slide.href}
                        target={slide.external ? "_blank" : undefined}
                        rel={slide.external ? "noopener noreferrer" : undefined}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#C9A961] px-4 py-2.5 text-sm font-semibold text-[#13211c] transition-all hover:bg-[#d6b66a]"
                      >
                        {slide.cta}
                        <ArrowRight className="h-4 w-4" />
                      </a>
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
