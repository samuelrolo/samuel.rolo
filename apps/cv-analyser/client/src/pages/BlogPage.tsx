import S2IHeader from "@/components/S2IHeader";
import S2IFooter from "@/components/S2IFooter";
import useTranslation from "@/i18n/useTranslation";

type BlogArticle = {
  title: string;
  date: string;
  excerpt: string;
  href: string;
  thumbnail: string;
  category: string;
  cta: string;
};

export default function BlogPage() {
  const { pick } = useTranslation();

  const articles: BlogArticle[] = [
    {
      title: pick(
        "Posicionamento de Perfil no LinkedIn: Como Ganhar Clareza, Relevância e Atracção Profissional",
        "LinkedIn Profile Positioning: How to Build Clarity, Relevance and Professional Traction",
        "Posicionamiento de Perfil en LinkedIn: Cómo Ganar Claridad, Relevancia y Tracción Profesional",
      ),
      date: pick("Abril 2026", "April 2026", "Abril 2026"),
      excerpt: pick(
        "Um guia prático para melhorares o posicionamento do teu perfil no LinkedIn, comunicares melhor o teu valor e aumentares a tua visibilidade junto de recrutadores e decisores.",
        "A practical guide to improving your LinkedIn profile positioning, communicating your value more clearly and increasing your visibility with recruiters and decision-makers.",
        "Una guía práctica para mejorar el posicionamiento de tu perfil en LinkedIn, comunicar mejor tu valor y aumentar tu visibilidad ante reclutadores y decisores.",
      ),
      href: pick(
        "/blog/artigos/posicionamento-perfil-linkedin",
        "/en/blog/artigos/linkedin-profile-positioning",
        "/es/blog/artigos/posicionamiento-perfil-linkedin",
      ),
      thumbnail: "/images/og-share2inspire.png",
      category: pick("LinkedIn & Marca Profissional", "LinkedIn & Professional Branding", "LinkedIn & Marca Profesional"),
      cta: pick("Ler artigo completo", "Read full article", "Leer artículo completo"),
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <S2IHeader activePage="blog" />

      <main>
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(201,169,97,0.18),transparent_45%),linear-gradient(180deg,#111111_0%,#0a0a0a_100%)]">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <span className="inline-flex items-center rounded-full border border-[#C9A961]/40 bg-[#C9A961]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[#C9A961]">
                {pick("Share2Inspire Blog", "Share2Inspire Blog", "Blog de Share2Inspire")}
              </span>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {pick(
                  "Artigos para quem quer posicionar melhor a sua carreira.",
                  "Articles for people who want to position their career more strategically.",
                  "Artículos para quienes quieren posicionar su carrera con más estrategia.",
                )}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
                {pick(
                  "Aqui encontras conteúdos sobre LinkedIn, empregabilidade, carreira e posicionamento profissional — com uma linguagem directa, rigor estratégico e foco em execução.",
                  "Here you will find content on LinkedIn, employability, career growth and professional positioning — with direct language, strategic rigour and a focus on execution.",
                  "Aquí encontrarás contenidos sobre LinkedIn, empleabilidad, carrera y posicionamiento profesional, con un lenguaje directo, rigor estratégico y foco en la ejecución.",
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[#C9A961]">
                {pick("Artigos publicados", "Published articles", "Artículos publicados")}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
                {pick("Biblioteca inicial do blog", "Initial blog library", "Biblioteca inicial del blog")}
              </h2>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/65">
              {pick("1 artigo", "1 article", "1 artículo")}
            </div>
          </div>

          <div className="grid gap-8">
            {articles.map((article) => (
              <article
                key={article.href}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-[#111111] shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-[#C9A961]/40 hover:shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
              >
                <div className="grid lg:grid-cols-[360px_minmax(0,1fr)]">
                  <div className="relative min-h-[240px] overflow-hidden bg-[#151515]">
                    <img
                      src={article.thumbnail}
                      alt={article.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                    <div className="absolute left-6 top-6">
                      <span className="inline-flex rounded-full border border-[#C9A961]/35 bg-black/45 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#F0D9A0] backdrop-blur-sm">
                        {article.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between p-8 lg:p-10">
                    <div>
                      <p className="text-sm font-medium text-[#C9A961]">{article.date}</p>
                      <h3 className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-3xl">
                        {article.title}
                      </h3>
                      <p className="mt-5 max-w-3xl text-base leading-8 text-white/72 sm:text-lg">
                        {article.excerpt}
                      </p>
                    </div>

                    <div className="mt-8">
                      <a
                        href={article.href}
                        className="inline-flex items-center justify-center rounded-xl bg-[#C9A961] px-5 py-3 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#d8b56a]"
                      >
                        {article.cta}
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <S2IFooter />
    </div>
  );
}
