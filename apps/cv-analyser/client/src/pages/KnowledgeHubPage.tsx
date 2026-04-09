// KnowledgeHubPage — Knowledge Hub Share2Inspire (PT)
// Sections: Hero, Artigos & Guias, Investigação & Dados, Vídeo, Podcast, E-book, Newsletter, Publicações Externas
import { useState } from "react";
import { Search, Play, ExternalLink, Download, BookOpen, Headphones, Mail } from "lucide-react";
import S2IHeader from "@/components/S2IHeader";
import S2IFooter from "@/components/S2IFooter";
import PromoBanner from "@/components/PromoBanner";

/* ─── DATA ─── */

type ArticleCategory = "todos" | "big4" | "cv" | "salario" | "carreira";

interface Article {
  category: ArticleCategory;
  tag: string;
  title: string;
  excerpt: string;
  author: string;
  date?: string;
  readTime: string;
  link: string;
  featured?: boolean;
}

const articles: Article[] = [
  // Big4 & Consultoria
  {
    category: "big4",
    tag: "BIG4 · DECISÃO DE CARREIRA",
    title: "Senior nas Big4: Ficar ou Sair? A Decisão que Define a Próxima Década",
    excerpt: "O que muda quando chegas a Senior, o que ganhas se progredires a Manager e o que perdes se ficares demasiado tempo parado.",
    author: "Samuel Rolo",
    date: "25 Mar 2026",
    readTime: "12 min",
    link: "/blog/artigos/big4-senior-ficar-ou-sair.html",
    featured: true,
  },
  {
    category: "big4",
    tag: "BIG4 · INSIDER",
    title: "Big4 por Dentro: O que Ninguém te Conta Antes de Entrares",
    excerpt: "10 anos de experiência nas Big4 condensados num artigo. O que realmente acontece dentro das firmas.",
    author: "Samuel Rolo",
    date: "24 Mar 2026",
    readTime: "14 min",
    link: "/blog/artigos/big4-insider-10-anos.html",
  },
  {
    category: "big4",
    tag: "BIG4 · CARREIRA",
    title: "De Manager a Sénior Manager nas Big4: O Que Ninguém te Conta",
    excerpt: "O que muda realmente quando passas de Manager para Sénior Manager. Responsabilidade, política interna e o peso invisível de liderar sem rede.",
    author: "Samuel Rolo",
    date: "28 Mar 2026",
    readTime: "12 min",
    link: "/blog/artigos/big4-manager-senior-manager-transicao.html",
  },
  {
    category: "big4",
    tag: "CONSULTORIA & BIG4",
    title: "Recrutamento nas Big4: Guia Completo para Candidatos 2026",
    excerpt: "Como entrar na Deloitte, PwC, EY ou KPMG. As 5 fases do processo, o que avaliam e erros a evitar.",
    author: "Samuel Rolo",
    date: "19 Mar 2026",
    readTime: "12 min",
    link: "/blog/artigos/recrutamento-big4-guia-candidatos.html",
  },
  {
    category: "big4",
    tag: "DESENVOLVIMENTO DE CARREIRA",
    title: "As Big4 como Escola de Aprendizagem",
    excerpt: "Os 6 activos que formas nas Big4 e que nenhuma universidade te dá. O que realmente se aprende na Deloitte, PwC, EY e KPMG.",
    author: "Samuel Rolo",
    date: "20 Mar 2026",
    readTime: "12 min",
    link: "/blog/artigos/big4-escola-aprendizagem-carreira.html",
  },
  // CV & Candidaturas
  {
    category: "cv",
    tag: "EMPREGABILIDADE 2026",
    title: "O Currículo Não é o Que Parece: 5 Lições sobre Empregabilidade Algorítmica",
    excerpt: "A empregabilidade moderna exige a passagem da perceção para os dados acionáveis.",
    author: "Samuel Rolo",
    readTime: "10 min",
    link: "/blog/artigos/guia-superar-ats-curriculo.html",
    featured: true,
  },
  {
    category: "cv",
    tag: "LITERACIA ALGORÍTMICA",
    title: "Guia Definitivo: Como Superar o ATS e Fazer o Teu Currículo Chegar ao Recrutador",
    excerpt: "Estratégias práticas para ultrapassar os filtros automáticos que eliminam 75% dos CVs.",
    author: "Samuel Rolo",
    readTime: "12 min",
    link: "/blog/artigos/guia-superar-ats-curriculo.html",
  },
  {
    category: "cv",
    tag: "CV & CANDIDATURAS",
    title: "Como Transformar um CV Ignorado num CV que Gera Entrevistas",
    excerpt: "Técnicas comprovadas para tornar o teu currículo num íman de entrevistas.",
    author: "Samuel Rolo",
    readTime: "10 min",
    link: "/blog/artigos/transformar-cv-ignorado-gerar-entrevistas.html",
  },
  {
    category: "cv",
    tag: "CV & CANDIDATURAS",
    title: "7 Erros no CV que Fazem Muitos Candidatos Serem Rejeitados",
    excerpt: "Os erros mais comuns que sabotam candidaturas — e como corrigi-los rapidamente.",
    author: "Samuel Rolo",
    readTime: "8 min",
    link: "/blog/artigos/7-erros-cv-candidatos-rejeitados.html",
  },
  {
    category: "cv",
    tag: "ENTREVISTAS",
    title: "Entrevista Presencial vs. Remota: Guia Completo de Preparação",
    excerpt: "Como te preparares para ambos os formatos e maximizar as tuas hipóteses de sucesso.",
    author: "Samuel Rolo",
    readTime: "10 min",
    link: "/blog/artigos/entrevista-presencial-vs-remota.html",
  },
  {
    category: "cv",
    tag: "IA & CARREIRA",
    title: "AI Career Path vs Traditional Coaching: Why You're Overpaying",
    excerpt: "Comparação detalhada entre ferramentas de IA e coaching tradicional para decisões de carreira.",
    author: "Samuel Rolo",
    readTime: "8 min",
    link: "/blog/artigos/ai-career-path-vs-traditional-coaching.html",
  },
  // Salário & Negociação
  {
    category: "salario",
    tag: "NEGOCIAÇÃO SALARIAL",
    title: "Como Negociar Salário em Portugal: Guia Completo 2026",
    excerpt: "Quando pedir, o que dizer, como usar dados de mercado e os erros que custam dinheiro. Guia prático com scripts reais.",
    author: "Samuel Rolo",
    readTime: "9 min",
    link: "/blog/artigos/como-negociar-salario-portugal.html",
    featured: true,
  },
  // Desenvolvimento de Carreira
  {
    category: "carreira",
    tag: "AVALIAÇÃO DE CARREIRA",
    title: "Como Saber se Estás Bem Posicionado no Mercado de Trabalho",
    excerpt: "Indicadores, benchmarks e clareza sobre os próximos passos da tua carreira.",
    author: "Samuel Rolo",
    readTime: "8 min",
    link: "/blog/artigos/posicionamento-mercado.html",
    featured: true,
  },
  {
    category: "carreira",
    tag: "VISIBILIDADE ONLINE",
    title: "CV ou LinkedIn: Qual é Mais Importante para a Tua Carreira?",
    excerpt: "Análise comparativa dos dois pilares da tua presença profissional.",
    author: "Samuel Rolo",
    readTime: "8 min",
    link: "/blog/artigos/cv-linkedin-importancia.html",
  },
  {
    category: "carreira",
    tag: "VISIBILIDADE ONLINE",
    title: "Como Melhorar o Teu LinkedIn para Aparecer nas Pesquisas de Recrutadores",
    excerpt: "Pequenos ajustes no perfil que podem aumentar significativamente a tua visibilidade.",
    author: "Samuel Rolo",
    readTime: "9 min",
    link: "/blog/artigos/melhorar-linkedin-pesquisas.html",
  },
];

const videos = [
  {
    id: "LhLmgE1noC8",
    badge: "NOVO VÍDEO",
    title: "Como Vencer o Filtro ATS: Guia Definitivo",
    desc: "75% dos currículos são rejeitados automaticamente por software. Descobre o processo passo a passo para otimizar o teu CV, LinkedIn e carta de apresentação para passar nos filtros digitais e conseguir mais entrevistas.",
    guideLink: "https://www.youtube.com/watch?v=LhLmgE1noC8",
    guideLabel: "VER GUIA COMPLETO →",
    ytLink: "https://www.youtube.com/watch?v=LhLmgE1noC8",
  },
  {
    id: "6coJJF79Cy0",
    title: "Como Criar um CV Compatível com ATS em 2026",
    desc: "Candidatas-te a empregos e nunca tens resposta? Aprende a criar um currículo que passa nos filtros automáticos e chega às mãos certas.",
    guideLink: "https://www.youtube.com/watch?v=6coJJF79Cy0",
    guideLabel: "COMO CRIAR CV ATS FRIENDLY →",
    ytLink: "https://www.youtube.com/watch?v=6coJJF79Cy0",
  },
  {
    id: "yU_tJV1Ap94",
    badge: "NOVO VÍDEO",
    title: "O Segredo para Maximizar o ROI Pós-Big4: 5 Anos Podem Mudar a Tua Vida?",
    desc: "Já te perguntaste se o sacrifício de 5 anos nas Big4 realmente vale a pena? Analisamos o ROI real: progressão salarial, horas intermináveis, rede de contactos e custo de oportunidade. Quando sair e como maximizar o teu valor.",
    guideLink: "https://www.youtube.com/watch?v=yU_tJV1Ap94",
    guideLabel: "VER GUIA COMPLETO →",
    ytLink: "https://www.youtube.com/watch?v=yU_tJV1Ap94",
  },
  {
    id: "teIBWJiSEFU",
    badge: "NOVO VÍDEO",
    title: "Como Entrar nas Big 4 (Deloitte, PwC, EY, KPMG): Guia Definitivo",
    desc: "A taxa de aceitação nas Big 4 é apenas de 2–6%. Vê o playbook completo de 5 fases — desde o CV ATS até à entrevista com partner — para conseguires emprego na Deloitte, PwC, EY ou KPMG.",
    guideLink: "https://www.youtube.com/watch?v=teIBWJiSEFU",
    guideLabel: "VER GUIA COMPLETO (EN) →",
    ytLink: "https://www.youtube.com/watch?v=teIBWJiSEFU",
  },
  {
    id: "T1AKsHV_Vf0",
    badge: "MAIS RECENTE",
    title: "Porque é que os Melhores Managers Falham na Promoção?",
    desc: "As competências que te levaram a Manager não são as mesmas que te farão ter sucesso como Sénior Manager. Descobre o que muda realmente nesta transição crítica e como navegar a complexidade política e estratégica do próximo nível.",
    guideLink: "https://www.youtube.com/watch?v=T1AKsHV_Vf0",
    guideLabel: "VER GUIA COMPLETO →",
    ytLink: "https://www.youtube.com/watch?v=T1AKsHV_Vf0",
  },
];

const categoryLabels: { id: ArticleCategory; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "big4", label: "Big4 & Consultoria" },
  { id: "cv", label: "CV & Candidaturas" },
  { id: "salario", label: "Salário & Negociação" },
  { id: "carreira", label: "Desenvolvimento de Carreira" },
];

const categoryGroupLabels: Record<ArticleCategory, string> = {
  todos: "Todos",
  big4: "Big4 & Consultoria",
  cv: "CV & Candidaturas",
  salario: "Salário & Negociação",
  carreira: "Desenvolvimento de Carreira",
};

/* ─── COMPONENT ─── */

export default function KnowledgeHubPage() {
  const [activeCategory, setActiveCategory] = useState<ArticleCategory>("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [subscriberName, setSubscriberName] = useState("");
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const filteredArticles = articles.filter((a) => {
    const matchesCategory = activeCategory === "todos" || a.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const groupedArticles = categoryLabels
    .filter((c) => c.id !== "todos")
    .map((c) => ({
      ...c,
      items: filteredArticles.filter((a) => a.category === c.id),
    }))
    .filter((g) => g.items.length > 0);

  const displayGroups =
    activeCategory === "todos"
      ? groupedArticles
      : groupedArticles.filter((g) => g.id === activeCategory);

  return (
    <div className="min-h-screen bg-white font-sans">
      <S2IHeader activePage="conhecimento" langToggleHref="/en/pages/knowledge" />
      <PromoBanner />

      {/* ─── HERO ─── */}
      <section className="pt-28 pb-10 text-center bg-[#f9f7f4]">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-light text-[#1a1a2e] mb-3">
            Knowledge <strong className="font-semibold">Hub</strong>
          </h1>
          <p className="text-base text-gray-500 mb-8">
            Guias práticos, estratégias e insights para a tua carreira. Tudo num só lugar.
          </p>
          {/* Search */}
          <div className="relative max-w-xl mx-auto mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Procurar artigos, guias e vídeos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#C9A961] bg-white"
            />
          </div>
          {/* Nav tabs */}
          <nav className="flex flex-wrap justify-center gap-6 text-xs font-semibold tracking-widest uppercase text-gray-500">
            {[
              { id: "artigos", label: "Artigos" },
              { id: "video", label: "Vídeo" },
              { id: "podcast", label: "Podcast" },
              { id: "ebook", label: "E-book" },
              { id: "newsletter", label: "Newsletter" },
            ].map((tab) => (
              <a
                key={tab.id}
                href={`#${tab.id}`}
                className="hover:text-[#C9A961] transition-colors"
              >
                {tab.label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* ─── ARTIGOS & GUIAS ─── */}
      <section id="artigos" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-2 text-xs font-semibold tracking-widest uppercase text-[#C9A961]">Blog</div>
          <h2 className="text-3xl font-light text-[#1a1a2e] mb-8">
            Artigos &amp; <strong className="font-semibold">Guias</strong>
          </h2>
          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mb-10">
            {categoryLabels.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  activeCategory === c.id
                    ? "bg-[#1a1a2e] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {filteredArticles.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">Nenhum artigo encontrado para "{searchQuery}".</p>
          ) : (
            displayGroups.map((group) => (
              <div key={group.id} className="mb-12">
                {activeCategory === "todos" && (
                  <div className="flex items-center gap-2 mb-6">
                    <span className="w-2 h-2 rounded-full bg-[#C9A961] inline-block" />
                    <span className="text-sm font-semibold text-[#1a1a2e]">{categoryGroupLabels[group.id]}</span>
                  </div>
                )}
                <div className="space-y-4">
                  {group.items.map((article, idx) => (
                    article.featured ? (
                      <a
                        key={idx}
                        href={article.link}
                        className="block bg-[#1a1a2e] rounded-xl p-6 md:p-8 hover:bg-[#252545] transition-colors group"
                      >
                        <div className="text-xs font-semibold tracking-widest uppercase text-[#C9A961] mb-3">
                          {article.tag}
                        </div>
                        <h3 className="text-xl md:text-2xl font-semibold text-white mb-3 group-hover:text-[#C9A961] transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">{article.excerpt}</p>
                        <div className="text-xs text-gray-500">
                          {article.author}
                          {article.date && <> · {article.date}</>}
                          {" · "}{article.readTime}
                        </div>
                      </a>
                    ) : (
                      <a
                        key={idx}
                        href={article.link}
                        className="block border border-gray-100 rounded-xl p-5 hover:border-[#C9A961] hover:shadow-sm transition-all group"
                      >
                        <div className="text-xs font-semibold tracking-widest uppercase text-[#C9A961] mb-2">
                          {article.tag}
                        </div>
                        <h3 className="text-base font-semibold text-[#1a1a2e] mb-2 group-hover:text-[#C9A961] transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-3">{article.excerpt}</p>
                        <div className="text-xs text-gray-400">
                          {article.author}
                          {article.date && <> · {article.date}</>}
                          {" · "}{article.readTime}
                        </div>
                        <div className="mt-3 text-xs font-semibold text-[#C9A961] tracking-wide">
                          LER ARTIGO →
                        </div>
                      </a>
                    )
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ─── INVESTIGAÇÃO & DADOS ─── */}
      <section className="py-16 bg-[#f9f7f4]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-2 text-xs font-semibold tracking-widest uppercase text-[#C9A961]">Estudo</div>
          <h2 className="text-3xl font-light text-[#1a1a2e] mb-8">
            Investigação &amp; <strong className="font-semibold">Dados</strong>
          </h2>
          <div className="bg-[#1a1a2e] rounded-xl p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <div className="flex-1">
                <div className="text-xs font-semibold tracking-widest uppercase text-[#C9A961] mb-3">
                  ESTUDO Q1 2026
                </div>
                <h3 className="text-2xl font-light text-white mb-3">
                  O Estado do <span className="text-[#C9A961] font-semibold">LinkedIn</span> em Portugal
                </h3>
                <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                  Uma análise a 500 perfis profissionais revela as oportunidades e os erros mais comuns que ditam o sucesso na maior rede profissional do mundo.
                </p>
                <a
                  href="/blog/artigos/estado-linkedin-portugal-2026.html"
                  className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#C9A961] border border-[#C9A961]/30 px-5 py-2.5 rounded-lg hover:bg-[#C9A961]/10 transition-colors"
                >
                  VER ESTUDO COMPLETO →
                </a>
              </div>
              <div className="flex flex-row md:flex-col gap-6 md:gap-8 md:text-right">
                <div>
                  <div className="text-3xl font-bold text-[#C9A961]">4.0/10</div>
                  <div className="text-xs text-gray-400 mt-1">Score médio nacional</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#C9A961]">74%</div>
                  <div className="text-xs text-gray-400 mt-1">Perfis com score abaixo de 5</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#C9A961]">0.6%</div>
                  <div className="text-xs text-gray-400 mt-1">Perfis com score acima de 7</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── VÍDEO ─── */}
      <section id="video" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-2 text-xs font-semibold tracking-widest uppercase text-[#C9A961]">Vídeo</div>
          <h2 className="text-3xl font-light text-[#1a1a2e] mb-8">
            Em <strong className="font-semibold">destaque</strong>
          </h2>
          <div className="space-y-8">
            {videos.map((video, idx) => (
              <div key={idx} className="bg-[#f9f7f4] rounded-xl overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Video embed */}
                  <div className="md:w-2/5 flex-shrink-0">
                    {activeVideo === video.id ? (
                      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                        <iframe
                          className="absolute inset-0 w-full h-full"
                          src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                          title={video.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveVideo(video.id)}
                        className="relative w-full group"
                        style={{ paddingBottom: "56.25%", display: "block" }}
                        aria-label={`Reproduzir: ${video.title}`}
                      >
                        <img
                          src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                          alt={video.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                            <Play className="w-6 h-6 text-[#1a1a2e] ml-1" />
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                    {video.badge && (
                      <div className="text-xs font-semibold tracking-widest uppercase text-[#C9A961] mb-3">
                        {video.badge}
                      </div>
                    )}
                    <h3 className="text-lg md:text-xl font-semibold text-[#1a1a2e] mb-3">
                      {video.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-5 leading-relaxed">{video.desc}</p>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={video.guideLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold tracking-wide text-[#C9A961] border border-[#C9A961]/30 px-4 py-2 rounded-lg hover:bg-[#C9A961]/10 transition-colors"
                      >
                        {video.guideLabel}
                      </a>
                      <a
                        href={video.ytLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold tracking-wide text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:border-gray-400 transition-colors flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        VER NO YOUTUBE →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PODCAST ─── */}
      <section id="podcast" className="py-16 bg-[#f9f7f4]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-2 text-xs font-semibold tracking-widest uppercase text-[#C9A961]">Podcast</div>
          <h2 className="text-3xl font-light text-[#1a1a2e] mb-4">
            Humanos e <strong className="font-semibold">Máquinas</strong>
          </h2>
          <p className="text-sm text-gray-500 mb-8 max-w-2xl">
            A interseção entre a inteligência artificial e a essência humana. Como manter a empatia e o pensamento crítico num mundo cada vez mais automatizado.
          </p>
          <div className="rounded-xl overflow-hidden">
            <iframe
              src="https://open.spotify.com/embed/show/2P09p0F3HIR0jXRdCMPOSe?utm_source=generator&theme=0"
              width="100%"
              height="352"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Podcast Humanos e Máquinas"
              style={{ borderRadius: "12px" }}
            />
          </div>
        </div>
      </section>

      {/* ─── E-BOOK ─── */}
      <section id="ebook" className="py-16 bg-[#1a1a2e]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-2 text-xs font-semibold tracking-widest uppercase text-[#C9A961]">E-book</div>
          <h2 className="text-3xl font-light text-white mb-8">
            Energia para <strong className="font-semibold text-[#C9A961]">Liderar</strong>
          </h2>
          <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-center">
            {/* Cover */}
            <div className="flex-shrink-0 text-center">
              <img
                src="/images/ebook-capa.webp"
                alt="Capa do e-book Energia para Liderar"
                className="max-h-80 rounded-lg shadow-2xl mx-auto"
                loading="lazy"
              />
            </div>
            {/* Info */}
            <div className="flex-1">
              <div className="inline-block text-xs font-semibold tracking-widest uppercase text-[#C9A961] border border-[#C9A961]/30 px-3 py-1 rounded-full mb-4">
                E-BOOK
              </div>
              <h3 className="text-2xl font-light text-white mb-1">
                Energia para <strong className="font-semibold">Liderar</strong>
              </h3>
              <p className="text-sm text-gray-400 mb-4">O Guia Prático de Performance Mental e Física</p>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                Um guia sobre as quatro dimensões da energia — física, mental, emocional e espiritual — para quem lidera e quer manter a performance de forma sustentável.
              </p>
              <p className="text-xs text-gray-500 mb-6">
                Por <strong className="text-white">Samuel Rolo</strong> &amp; <strong className="text-white">Marlene Ruivo</strong>
              </p>
              <div className="flex flex-col gap-3 max-w-sm">
                <a
                  href="https://go.hotmart.com/Q104764153P?dp=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#C9A961] border border-[#C9A961]/30 px-5 py-3 rounded-lg hover:bg-[#C9A961]/10 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  DESCARREGAR PREVIEW →
                </a>
                <a
                  href="https://go.hotmart.com/Q104764153P?dp=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase bg-[#C9A961] text-[#1a1a2e] px-5 py-3 rounded-lg hover:bg-[#d4af37] transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  COMPRAR E-BOOK COMPLETO (PT) →
                </a>
                <p className="text-xs text-gray-600">Versão em inglês disponível brevemente.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── NEWSLETTER ─── */}
      <section id="newsletter" className="py-16 bg-[#252545]">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="mb-2 text-xs font-semibold tracking-widest uppercase text-[#C9A961]">Newsletter</div>
          <h2 className="text-3xl font-light text-white mb-3">
            The Mindset <strong className="font-semibold text-[#C9A961]">Maverick</strong>
          </h2>
          <p className="text-sm text-gray-400 mb-8 leading-relaxed">
            Reflexões sobre a interseção entre tecnologia, estratégia e humanidade. Insights práticos para quem desafia o status quo.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-3 justify-center mb-4"
            onSubmit={(e) => {
              e.preventDefault();
              window.open(
                `https://www.linkedin.com/build-relation/newsletter-follow?entityUrn=7384145793324085248`,
                "_blank"
              );
            }}
          >
            <input
              type="text"
              placeholder="Nome"
              value={subscriberName}
              onChange={(e) => setSubscriberName(e.target.value)}
              className="px-4 py-3 rounded-lg text-sm bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A961] flex-1"
            />
            <input
              type="email"
              placeholder="E-mail"
              value={subscriberEmail}
              onChange={(e) => setSubscriberEmail(e.target.value)}
              className="px-4 py-3 rounded-lg text-sm bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A961] flex-1"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-[#C9A961] text-[#1a1a2e] text-xs font-semibold tracking-widest uppercase rounded-lg hover:bg-[#d4af37] transition-colors whitespace-nowrap"
            >
              SUBSCREVER
            </button>
          </form>
          <p className="text-xs text-gray-500 mb-6">Os dados estão protegidos. Cancelamento a qualquer momento.</p>
          <a
            href="https://www.linkedin.com/build-relation/newsletter-follow?entityUrn=7384145793324085248"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#C9A961] hover:underline"
          >
            <Mail className="w-3 h-3" />
            TAMBÉM NO LINKEDIN →
          </a>
        </div>
      </section>

      {/* ─── PUBLICAÇÕES EXTERNAS ─── */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-2 text-xs font-semibold tracking-widest uppercase text-[#C9A961]">Outras publicações</div>
          <h2 className="text-3xl font-light text-[#1a1a2e] mb-8">
            Publicações <strong className="font-semibold">externas</strong>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-100 rounded-xl p-6 hover:border-[#C9A961] hover:shadow-sm transition-all">
              <div className="text-xs font-semibold tracking-widest uppercase text-[#C9A961] mb-3">RH MAGAZINE</div>
              <h3 className="text-base font-semibold text-[#1a1a2e] mb-2">
                Mudam os Tempos, Mudam as Avaliações
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Uma reflexão sobre a evolução dos modelos de avaliação de desempenho e o que realmente importa na gestão de talento.
              </p>
              <a
                href="https://rhmagazine.pt/mudam-os-tempos-mudam-as-avaliacoes/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold tracking-wide text-[#C9A961] hover:underline"
              >
                LER ARTIGO →
              </a>
            </div>
            <div className="border border-gray-100 rounded-xl p-6 hover:border-[#C9A961] hover:shadow-sm transition-all">
              <div className="text-xs font-semibold tracking-widest uppercase text-[#C9A961] mb-3">DEZANOVE</div>
              <h3 className="text-base font-semibold text-[#1a1a2e] mb-2">
                Enquanto Houver Vento Há Sentimento
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Review do livro que explora uma história real de autodescoberta, identidade e resiliência através de várias fases da vida.
              </p>
              <a
                href="https://dezanove.pt/enquanto-houver-vento-ha-sentimento-de-samuel-rolo-2442105/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold tracking-wide text-[#C9A961] hover:underline"
              >
                LER REVIEW →
              </a>
            </div>
          </div>
        </div>
      </section>

      <S2IFooter />
    </div>
  );
}
