import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Chrome, PlayCircle, type LucideIcon } from 'lucide-react';
import type { Lang } from '@/lib/i18n';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';

const CHROME_WEB_STORE_URL = 'https://chromewebstore.google.com/detail/share2inspire-%E2%80%94-job-saver/depelnoienlhmoolnepgjpdmoaocfdem';
const TUTORIAL_PT_URL = '/assets/downloads/extension/tutorial-extensao-pt.mp4';
const TUTORIAL_EN_URL = '/assets/downloads/extension/tutorial-extensao-en.mp4';

type MemberBannerSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  external?: boolean;
  icon: LucideIcon;
};

export default function MemberRotatingBanner({ lang }: { lang: Lang }) {
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const tt = (pt: string, en: string, es?: string) => lang === 'pt' ? pt : lang === 'es' ? (es ?? en) : en;

  const slides = useMemo<MemberBannerSlide[]>(() => [
    {
      id: 'install-extension',
      eyebrow: tt('Novo no teu dashboard', 'New in your dashboard', 'Nuevo en tu dashboard'),
      title: tt('Extensão Chrome — Job Saver', 'Chrome Extension — Job Saver', 'Extensión Chrome — Job Saver'),
      description: tt(
        'Guarda ofertas de emprego diretamente do LinkedIn',
        'Save job offers directly from LinkedIn',
        'Guarda ofertas de empleo directamente desde LinkedIn'
      ),
      cta: tt('Instalar na Chrome Web Store', 'Install on Chrome Web Store', 'Instalar en Chrome Web Store'),
      href: CHROME_WEB_STORE_URL,
      external: true,
      icon: Chrome,
    },
    {
      id: 'watch-tutorial',
      eyebrow: tt('Ativação rápida', 'Quick setup', 'Configuración rápida'),
      title: tt('Tutorial de instalação', 'Installation tutorial', 'Tutorial de instalación'),
      description: tt(
        'Vê como ligar a extensão ao dashboard e começar a guardar vagas em poucos minutos.',
        'See how to connect the extension to your dashboard and start saving jobs in a few minutes.',
        'Mira cómo conectar la extensión a tu dashboard y empezar a guardar ofertas en pocos minutos.'
      ),
      cta: tt('Ver tutorial', 'Watch tutorial', 'Ver tutorial'),
      href: lang === 'pt' ? TUTORIAL_PT_URL : TUTORIAL_EN_URL,
      external: true,
      icon: PlayCircle,
    },
  ], [lang]);

  useEffect(() => {
    if (!api) return;

    const handleSelect = () => setActiveIndex(api.selectedScrollSnap());
    handleSelect();
    api.on('select', handleSelect);

    return () => {
      api.off('select', handleSelect);
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
    <section className="mb-8">
      <Carousel
        setApi={setApi}
        opts={{ loop: slides.length > 1, align: 'start' }}
        className="overflow-hidden rounded-[24px] border border-[#BF9A33]/20 bg-gradient-to-r from-[#112e27] via-[#0f2923] to-[#0b201b] shadow-[0_24px_60px_-38px_rgba(15,23,42,0.55)]"
      >
        <CarouselContent className="-ml-0">
          {slides.map((slide) => {
            const Icon = slide.icon;

            return (
              <CarouselItem key={slide.id} className="pl-0">
                <div className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-7">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#BF9A33]/30 bg-[#BF9A33]/10 text-[#D7B869]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#D7B869]">
                        {slide.eyebrow}
                      </p>
                      <h2 className="text-base font-semibold text-white md:text-lg">
                        {slide.title}
                      </h2>
                      <p className="mt-1 max-w-2xl text-sm leading-6 text-white/72">
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
                            aria-label={`${tt('Ir para slide', 'Go to slide', 'Ir a la diapositiva')} ${index + 1}`}
                            onClick={() => api?.scrollTo(index)}
                            className={`h-2.5 rounded-full transition-all ${activeIndex === index ? 'w-7 bg-[#BF9A33]' : 'w-2.5 bg-white/25 hover:bg-white/40'}`}
                          />
                        ))}
                      </div>
                    )}

                    <a
                      href={slide.href}
                      target={slide.external ? '_blank' : undefined}
                      rel={slide.external ? 'noopener noreferrer' : undefined}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#BF9A33] px-4 py-2.5 text-sm font-semibold text-[#11211d] transition-all hover:bg-[#d3af54] no-underline"
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
    </section>
  );
}
