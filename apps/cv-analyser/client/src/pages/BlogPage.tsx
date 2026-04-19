import { useEffect, useMemo, useState } from "react";
import { useRoute } from "wouter";
import S2IHeader from "@/components/S2IHeader";
import S2IFooter from "@/components/S2IFooter";
import useTranslation from "@/i18n/useTranslation";

const BACKEND_URL = "https://share2inspire-beckend.lm.r.appspot.com";

type BlogArticleSummary = {
  id: number;
  title: string;
  slug: string;
  meta_description: string | null;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  language_code: string | null;
  status: string | null;
  published_at: string | null;
  updated_at: string | null;
  created_at: string | null;
  received_at: string | null;
};

type BlogArticleDetail = BlogArticleSummary & {
  content_html: string | null;
  content_markdown: string | null;
  infographic_image_url: string | null;
  keywords: string[] | null;
  meta_keywords: string | null;
  faq_schema: Array<{ question?: string; answer?: string }> | null;
};

function formatArticleDate(dateValue: string | null | undefined, locale: string) {
  if (!dateValue) return "";

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return "";

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function BlogListCard({
  article,
  locale,
  ctaLabel,
  href,
}: {
  article: BlogArticleSummary;
  locale: string;
  ctaLabel: string;
  href: string;
}) {
  const publishedLabel = formatArticleDate(article.published_at || article.created_at, locale);

  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-[#111111] shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-[#C9A961]/40 hover:shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div className="grid lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="relative min-h-[240px] overflow-hidden bg-[#151515]">
          {article.hero_image_url ? (
            <img
              src={article.hero_image_url}
              alt={article.hero_image_alt || article.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full min-h-[240px] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(201,169,97,0.25),transparent_48%),linear-gradient(180deg,#181818_0%,#0f0f0f_100%)] px-10 text-center text-sm uppercase tracking-[0.28em] text-[#C9A961]/70">
              Share2Inspire
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
          <div className="absolute left-6 top-6">
            <span className="inline-flex rounded-full border border-[#C9A961]/35 bg-black/45 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#F0D9A0] backdrop-blur-sm">
              {article.language_code?.toUpperCase() || "PT"}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between p-8 lg:p-10">
          <div>
            {publishedLabel ? <p className="text-sm font-medium text-[#C9A961]">{publishedLabel}</p> : null}
            <h2 className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-3xl">
              {article.title}
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/72 sm:text-lg">
              {article.meta_description || ""}
            </p>
          </div>

          <div className="mt-8">
            <a
              href={href}
              className="inline-flex items-center justify-center rounded-xl bg-[#C9A961] px-5 py-3 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#d8b56a]"
            >
              {ctaLabel}
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function BlogPage() {
  const { pick, lang, localePath } = useTranslation();
  const [isArticleRoute, params] = useRoute<{ slug: string }>("/:slug");
  const [articles, setArticles] = useState<BlogArticleSummary[]>([]);
  const [article, setArticle] = useState<BlogArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const locale = useMemo(() => {
    if (lang === "en") return "en-GB";
    if (lang === "es") return "es-ES";
    return "pt-PT";
  }, [lang]);

  const listTitle = pick(
    "Artigos para quem quer posicionar melhor a sua carreira.",
    "Articles for people who want to position their career more strategically.",
    "Artículos para quienes quieren posicionar su carrera con más estrategia.",
  );

  const listIntro = pick(
    "Aqui encontras conteúdos sobre LinkedIn, empregabilidade, carreira e posicionamento profissional — com uma linguagem directa, rigor estratégico e foco em execução.",
    "Here you will find content on LinkedIn, employability, career growth and professional positioning — with direct language, strategic rigour and a focus on execution.",
    "Aquí encontrarás contenidos sobre LinkedIn, empleabilidad, carrera y posicionamiento profesional, con un lenguaje directo, rigor estratégico y foco en la ejecución.",
  );

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    async function loadBlogData() {
      setLoading(true);
      setError(null);

      try {
        if (isArticleRoute && params?.slug) {
          const response = await fetch(
            `${BACKEND_URL}/api/blog/articles?slug=${encodeURIComponent(params.slug)}&lang=${encodeURIComponent(lang)}`,
            { signal: controller.signal },
          );

          if (response.status === 404) {
            if (!isCancelled) {
              setArticle(null);
              setArticles([]);
            }
            return;
          }

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const payload = await response.json();
          if (!isCancelled) {
            setArticle(payload.article || null);
            setArticles([]);
          }
          return;
        }

        const response = await fetch(
          `${BACKEND_URL}/api/blog/articles?lang=${encodeURIComponent(lang)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        if (!isCancelled) {
          setArticles(Array.isArray(payload.articles) ? payload.articles : []);
          setArticle(null);
        }
      } catch (err) {
        if (controller.signal.aborted || isCancelled) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    void loadBlogData();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [isArticleRoute, params?.slug, lang]);

  const articleDate = formatArticleDate(article?.published_at || article?.created_at, locale);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <S2IHeader activePage="blog" />

      <main>
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(201,169,97,0.18),transparent_45%),linear-gradient(180deg,#111111_0%,#0a0a0a_100%)]">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
            <div className="max-w-4xl">
              <span className="inline-flex items-center rounded-full border border-[#C9A961]/40 bg-[#C9A961]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[#C9A961]">
                {pick("Share2Inspire Blog", "Share2Inspire Blog", "Blog de Share2Inspire")}
              </span>

              {isArticleRoute ? (
                <>
                  <a
                    href={localePath("/blog")}
                    className="mt-8 inline-flex items-center text-sm font-medium text-[#C9A961] transition-colors hover:text-[#e0bf74]"
                  >
                    {pick("← Voltar ao blog", "← Back to blog", "← Volver al blog")}
                  </a>
                  <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                    {article?.title || pick("Artigo", "Article", "Artículo")}
                  </h1>
                  {articleDate ? (
                    <p className="mt-6 text-sm font-medium uppercase tracking-[0.24em] text-[#C9A961]">
                      {articleDate}
                    </p>
                  ) : null}
                  {article?.meta_description ? (
                    <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">{article.meta_description}</p>
                  ) : null}
                </>
              ) : (
                <>
                  <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                    {listTitle}
                  </h1>
                  <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">{listIntro}</p>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-[#111111] px-8 py-20 text-center text-white/70">
              {pick("A carregar artigos...", "Loading articles...", "Cargando artículos...")}
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-8 py-12 text-center">
              <h2 className="text-2xl font-semibold text-white">
                {pick("Não foi possível carregar o blog.", "We could not load the blog.", "No se pudo cargar el blog.")}
              </h2>
              <p className="mt-4 text-white/70">
                {pick(
                  "Tenta novamente dentro de alguns minutos.",
                  "Please try again in a few minutes.",
                  "Vuelve a intentarlo dentro de unos minutos.",
                )}
              </p>
              <p className="mt-2 text-sm text-white/40">{error}</p>
            </div>
          ) : isArticleRoute ? (
            article ? (
              <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#111111] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                {article.hero_image_url ? (
                  <div className="border-b border-white/10 bg-[#151515]">
                    <img
                      src={article.hero_image_url}
                      alt={article.hero_image_alt || article.title}
                      className="h-auto max-h-[520px] w-full object-cover"
                    />
                  </div>
                ) : null}

                <div className="px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
                  <div
                    className="prose prose-invert max-w-none prose-headings:text-white prose-headings:font-semibold prose-p:text-white/78 prose-p:leading-8 prose-a:text-[#C9A961] prose-a:no-underline hover:prose-a:text-[#e0bf74] prose-strong:text-white prose-li:text-white/78 prose-blockquote:border-l-[#C9A961] prose-blockquote:text-white/72 prose-img:rounded-2xl prose-hr:border-white/10"
                    dangerouslySetInnerHTML={{ __html: article.content_html || "" }}
                  />
                </div>
              </article>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-[#111111] px-8 py-20 text-center text-white/70">
                <h2 className="text-2xl font-semibold text-white">
                  {pick("Artigo não encontrado.", "Article not found.", "Artículo no encontrado.")}
                </h2>
                <p className="mt-4">
                  {pick(
                    "Este artigo ainda não está disponível neste idioma.",
                    "This article is not available in this language yet.",
                    "Este artículo todavía no está disponible en este idioma.",
                  )}
                </p>
              </div>
            )
          ) : (
            <>
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-[#C9A961]">
                    {pick("Artigos publicados", "Published articles", "Artículos publicados")}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
                    {pick("Biblioteca dinâmica do blog", "Dynamic blog library", "Biblioteca dinámica del blog")}
                  </h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/65">
                  {pick(
                    `${articles.length} artigo${articles.length === 1 ? "" : "s"}`,
                    `${articles.length} article${articles.length === 1 ? "" : "s"}`,
                    `${articles.length} artículo${articles.length === 1 ? "" : "s"}`,
                  )}
                </div>
              </div>

              {articles.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-[#111111] px-8 py-20 text-center text-white/70">
                  {pick(
                    "Ainda não existem artigos publicados neste idioma.",
                    "There are no published articles in this language yet.",
                    "Todavía no hay artículos publicados en este idioma.",
                  )}
                </div>
              ) : (
                <div className="grid gap-8">
                  {articles.map((currentArticle) => (
                    <BlogListCard
                      key={`${currentArticle.language_code || "pt"}-${currentArticle.slug}`}
                      article={currentArticle}
                      locale={locale}
                      ctaLabel={pick("Ler artigo completo", "Read full article", "Leer artículo completo")}
                      href={localePath(`/blog/${currentArticle.slug}`)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <S2IFooter />
    </div>
  );
}
