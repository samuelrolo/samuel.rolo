// KnowledgeHubPageEN — Knowledge Hub Share2Inspire (EN)
// Sections: Hero, Articles & Guides, Research & Data, Video, Podcast, E-book, Newsletter, External Publications
import { useState } from "react";
import { Search, Play, ExternalLink, Download, BookOpen, Headphones, Mail } from "lucide-react";
import S2IHeaderEN from "@/components/S2IHeaderEN";
import S2IFooter from "@/components/S2IFooter";

/* ─── DATA ─── */

type ArticleCategory = "all" | "big4" | "cv" | "salary" | "career";

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
  // Big4 & Consulting
  {
    category: "big4",
    tag: "BIG4 · CAREER DECISION",
    title: "Senior at Big4: Stay or Leave? The Decision That Defines the Next Decade",
    excerpt: "What changes when you reach Senior, what you gain by progressing to Manager, and what you lose by staying too long.",
    author: "Samuel Rolo",
    date: "25 Mar 2026",
    readTime: "12 min",
    link: "/blog/artigos/big4-senior-ficar-ou-sair.html",
    featured: true,
  },
  {
    category: "big4",
    tag: "BIG4 · INSIDER",
    title: "Inside Big4: What Nobody Tells You Before You Join",
    excerpt: "10 years of Big4 experience condensed into one article. What really happens inside the firms.",
    author: "Samuel Rolo",
    date: "24 Mar 2026",
    readTime: "14 min",
    link: "/blog/artigos/big4-insider-10-anos.html",
  },
  {
    category: "big4",
    tag: "BIG4 · CAREER",
    title: "From Manager to Senior Manager at Big4: What Nobody Tells You",
    excerpt: "What really changes when you move from Manager to Senior Manager. Responsibility, internal politics and the invisible weight of leading without a safety net.",
    author: "Samuel Rolo",
    date: "28 Mar 2026",
    readTime: "12 min",
    link: "/blog/artigos/big4-manager-senior-manager-transicao.html",
  },
  {
    category: "big4",
    tag: "CONSULTING & BIG4",
    title: "Big4 Recruitment: Complete Guide for Candidates 2026",
    excerpt: "How to get into Deloitte, PwC, EY or KPMG. The 5 stages of the process, what they evaluate, and mistakes to avoid.",
    author: "Samuel Rolo",
    date: "19 Mar 2026",
    readTime: "12 min",
    link: "/blog/artigos/recrutamento-big4-guia-candidatos.html",
  },
  {
    category: "big4",
    tag: "CAREER DEVELOPMENT",
    title: "Big4 as a School of Learning",
    excerpt: "The 6 assets you build at Big4 that no university gives you. What you really learn at Deloitte, PwC, EY and KPMG.",
    author: "Samuel Rolo",
    date: "20 Mar 2026",
    readTime: "12 min",
    link: "/blog/artigos/big4-escola-aprendizagem-carreira.html",
  },
  // CV & Applications
  {
    category: "cv",
    tag: "EMPLOYABILITY 2026",
    title: "The CV Is Not What It Seems: 5 Lessons on Algorithmic Employability",
    excerpt: "Modern employability requires moving from perception to actionable data.",
    author: "Samuel Rolo",
    readTime: "10 min",
    link: "/blog/artigos/guia-superar-ats-curriculo.html",
    featured: true,
  },
  {
    category: "cv",
    tag: "ALGORITHMIC LITERACY",
    title: "The Definitive Guide: How to Beat the ATS and Get Your CV to the Recruiter",
    excerpt: "Practical strategies to bypass the automated filters that eliminate 75% of CVs.",
    author: "Samuel Rolo",
    readTime: "12 min",
    link: "/blog/artigos/guia-superar-ats-curriculo.html",
  },
  {
    category: "cv",
    tag: "CV & APPLICATIONS",
    title: "How to Transform an Ignored CV into One That Generates Interviews",
    excerpt: "Proven techniques to turn your resume into an interview magnet.",
    author: "Samuel Rolo",
    readTime: "10 min",
    link: "/blog/artigos/transformar-cv-ignorado-gerar-entrevistas.html",
  },
  {
    category: "cv",
    tag: "CV & APPLICATIONS",
    title: "7 CV Mistakes That Get Many Candidates Rejected",
    excerpt: "The most common mistakes that sabotage applications — and how to fix them quickly.",
    author: "Samuel Rolo",
    readTime: "8 min",
    link: "/blog/artigos/7-erros-cv-candidatos-rejeitados.html",
  },
  {
    category: "cv",
    tag: "INTERVIEWS",
    title: "In-Person vs. Remote Interview: Complete Preparation Guide",
    excerpt: "How to prepare for both formats and maximise your chances of success.",
    author: "Samuel Rolo",
    readTime: "10 min",
    link: "/blog/artigos/entrevista-presencial-vs-remota.html",
  },
  {
    category: "cv",
    tag: "AI & CAREER",
    title: "AI Career Path vs Traditional Coaching: Why You're Overpaying",
    excerpt: "Detailed comparison between AI tools and traditional coaching for career decisions.",
    author: "Samuel Rolo",
    readTime: "8 min",
    link: "/blog/artigos/ai-career-path-vs-traditional-coaching.html",
  },
  // Salary & Negotiation
  {
    category: "salary",
    tag: "SALARY NEGOTIATION",
    title: "How to Negotiate Salary in Portugal: Complete Guide 2026",
    excerpt: "When to ask, what to say, how to use market data, and the mistakes that cost you money. Practical guide with real scripts.",
    author: "Samuel Rolo",
    readTime: "9 min",
    link: "/blog/artigos/como-negociar-salario-portugal.html",
    featured: true,
  },
  // Career Development
  {
    category: "career",
    tag: "CAREER ASSESSMENT",
    title: "How to Know if You're Well Positioned in the Job Market",
    excerpt: "Indicators, benchmarks and clarity about the next steps in your career.",
    author: "Samuel Rolo",
    readTime: "8 min",
    link: "/blog/artigos/posicionamento-mercado.html",
    featured: true,
  },
  {
    category: "career",
    tag: "ONLINE VISIBILITY",
    title: "CV or LinkedIn: Which Is More Important for Your Career?",
    excerpt: "Comparative analysis of the two pillars of your professional presence.",
    author: "Samuel Rolo",
    readTime: "8 min",
    link: "/blog/artigos/cv-linkedin-importancia.html",
  },
  {
    category: "career",
    tag: "ONLINE VISIBILITY",
    title: "How to Improve Your LinkedIn to Appear in Recruiter Searches",
    excerpt: "Small profile adjustments that can significantly increase your visibility.",
    author: "Samuel Rolo",
    readTime: "9 min",
    link: "/blog/artigos/melhorar-linkedin-pesquisas.html",
  },
];

const videos = [
  {
    id: "LhLmgE1noC8",
    badge: "NEW VIDEO",
    title: "How to Beat the ATS Filter: The Ultimate Guide",
    desc: "75% of CVs are automatically rejected by software. Discover the step-by-step process to optimise your CV, LinkedIn and cover letter to pass digital filters and get more interviews.",
    guideLink: "https://www.youtube.com/watch?v=LhLmgE1noC8",
    guideLabel: "VIEW COMPLETE GUIDE →",
    ytLink: "https://www.youtube.com/watch?v=LhLmgE1noC8",
  },
  {
    id: "6coJJF79Cy0",
    title: "How to Create an ATS-Compatible CV in 2026",
    desc: "Applying for jobs and never getting a response? Learn how to create a CV that passes automated filters and reaches the right people.",
    guideLink: "https://www.youtube.com/watch?v=6coJJF79Cy0",
    guideLabel: "HOW TO CREATE ATS FRIENDLY CV →",
    ytLink: "https://www.youtube.com/watch?v=6coJJF79Cy0",
  },
  {
    id: "yU_tJV1Ap94",
    badge: "NEW VIDEO",
    title: "The Secret to Maximising Post-Big4 ROI: Can 5 Years Change Your Life?",
    desc: "Have you ever wondered if the 5-year Big4 sacrifice is really worth it? We analyse the real ROI: salary progression, endless hours, contact network and opportunity cost. When to leave and how to maximise your value.",
    guideLink: "https://www.youtube.com/watch?v=yU_tJV1Ap94",
    guideLabel: "VIEW COMPLETE GUIDE →",
    ytLink: "https://www.youtube.com/watch?v=yU_tJV1Ap94",
  },
  {
    id: "teIBWJiSEFU",
    badge: "NEW VIDEO",
    title: "How to Get Into the Big 4 (Deloitte, PwC, EY, KPMG): The Definitive Guide",
    desc: "The acceptance rate at Big 4 is only 2–6%. See the complete 5-phase playbook — from ATS CV to partner interview — to land a job at Deloitte, PwC, EY or KPMG.",
    guideLink: "https://www.youtube.com/watch?v=teIBWJiSEFU",
    guideLabel: "VIEW COMPLETE GUIDE (EN) →",
    ytLink: "https://www.youtube.com/watch?v=teIBWJiSEFU",
  },
  {
    id: "T1AKsHV_Vf0",
    badge: "LATEST",
    title: "Why the Best Managers Fail at Promotion?",
    desc: "The skills that got you to Manager are not the same ones that will make you succeed as Senior Manager. Discover what really changes in this critical transition and how to navigate the political and strategic complexity of the next level.",
    guideLink: "https://www.youtube.com/watch?v=T1AKsHV_Vf0",
    guideLabel: "VIEW COMPLETE GUIDE →",
    ytLink: "https://www.youtube.com/watch?v=T1AKsHV_Vf0",
  },
];

const categoryLabels: { id: ArticleCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "big4", label: "Big4 & Consulting" },
  { id: "cv", label: "CV & Applications" },
  { id: "salary", label: "Salary & Negotiation" },
  { id: "career", label: "Career Development" },
];

const categoryGroupLabels: Record<ArticleCategory, string> = {
  all: "All",
  big4: "Big4 & Consulting",
  cv: "CV & Applications",
  salary: "Salary & Negotiation",
  career: "Career Development",
};

/* ─── COMPONENT ─── */

export default function KnowledgeHubPageEN() {
  const [activeCategory, setActiveCategory] = useState<ArticleCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [subscriberName, setSubscriberName] = useState("");
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const filteredArticles = articles.filter((a) => {
    const matchesCategory = activeCategory === "all" || a.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const groupedArticles = categoryLabels
    .filter((c) => c.id !== "all")
    .map((c) => ({
      ...c,
      items: filteredArticles.filter((a) => a.category === c.id),
    }))
    .filter((g) => g.items.length > 0);

  const displayGroups =
    activeCategory === "all"
      ? groupedArticles
      : groupedArticles.filter((g) => g.id === activeCategory);

  return (
    <div className="min-h-screen bg-white font-sans">
      <S2IHeaderEN activePage="conhecimento" langToggleHref="/conhecimento" />

      {/* ─── HERO ─── */}
      <section className="pt-28 pb-10 text-center bg-[#f9f7f4]">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-light text-[#1a1a2e] mb-3">
            Knowledge <strong className="font-semibold">Hub</strong>
          </h1>
          <p className="text-base text-gray-500 mb-8">
            Practical guides, strategies and insights for your career. All in one place.
          </p>
          {/* Search */}
          <div className="relative max-w-xl mx-auto mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles, guides and videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#C9A961] bg-white"
            />
          </div>
          {/* Nav tabs */}
          <nav className="flex flex-wrap justify-center gap-6 text-xs font-semibold tracking-widest uppercase text-gray-500">
            {[
              { id: "articles", label: "Articles" },
              { id: "video", label: "Video" },
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

      {/* ─── ARTICLES & GUIDES ─── */}
      <section id="articles" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-2 text-xs font-semibold tracking-widest uppercase text-[#C9A961]">Blog</div>
          <h2 className="text-3xl font-light text-[#1a1a2e] mb-8">
            Articles &amp; <strong className="font-semibold">Guides</strong>
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
            <p className="text-gray-400 text-sm py-8 text-center">No articles found for "{searchQuery}".</p>
          ) : (
            displayGroups.map((group) => (
              <div key={group.id} className="mb-12">
                {activeCategory === "all" && (
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
                          READ ARTICLE →
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

      {/* ─── RESEARCH & DATA ─── */}
      <section className="py-16 bg-[#f9f7f4]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-2 text-xs font-semibold tracking-widest uppercase text-[#C9A961]">Study</div>
          <h2 className="text-3xl font-light text-[#1a1a2e] mb-8">
            Research &amp; <strong className="font-semibold">Data</strong>
          </h2>
          <div className="bg-[#1a1a2e] rounded-xl p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <div className="flex-1">
                <div className="text-xs font-semibold tracking-widest uppercase text-[#C9A961] mb-3">
                  STUDY Q1 2026
                </div>
                <h3 className="text-2xl font-light text-white mb-3">
                  The State of <span className="text-[#C9A961] font-semibold">LinkedIn</span> in Portugal
                </h3>
                <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                  An analysis of 500 professional profiles reveals the opportunities and most common mistakes that determine success on the world's largest professional network.
                </p>
                <a
                  href="/blog/artigos/estado-linkedin-portugal-2026.html"
                  className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#C9A961] border border-[#C9A961]/30 px-5 py-2.5 rounded-lg hover:bg-[#C9A961]/10 transition-colors"
                >
                  VIEW COMPLETE STUDY →
                </a>
              </div>
              <div className="flex flex-row md:flex-col gap-6 md:gap-8 md:text-right">
                <div>
                  <div className="text-3xl font-bold text-[#C9A961]">4.0/10</div>
                  <div className="text-xs text-gray-400 mt-1">National average score</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#C9A961]">74%</div>
                  <div className="text-xs text-gray-400 mt-1">Profiles with score below 5</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#C9A961]">0.6%</div>
                  <div className="text-xs text-gray-400 mt-1">Profiles with score above 7</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── VIDEO ─── */}
      <section id="video" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-2 text-xs font-semibold tracking-widest uppercase text-[#C9A961]">Video</div>
          <h2 className="text-3xl font-light text-[#1a1a2e] mb-8">
            <strong className="font-semibold">Featured</strong> videos
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
                        aria-label={`Play: ${video.title}`}
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
                        VIEW ON YOUTUBE →
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
            Humans &amp; <strong className="font-semibold">Machines</strong>
          </h2>
          <p className="text-sm text-gray-500 mb-8 max-w-2xl">
            The intersection between artificial intelligence and the human essence. How to maintain empathy and critical thinking in an increasingly automated world.
          </p>
          <div className="rounded-xl overflow-hidden">
            <iframe
              src="https://open.spotify.com/embed/show/2P09p0F3HIR0jXRdCMPOSe?utm_source=generator&theme=0"
              width="100%"
              height="352"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Podcast Humans and Machines"
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
            Energy to <strong className="font-semibold text-[#C9A961]">Lead</strong>
          </h2>
          <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-center">
            {/* Cover */}
            <div className="flex-shrink-0 text-center">
              <img
                src="/images/ebook-capa.webp"
                alt="Energy to Lead e-book cover"
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
                Energy to <strong className="font-semibold">Lead</strong>
              </h3>
              <p className="text-sm text-gray-400 mb-4">The Practical Guide to Mental and Physical Performance</p>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                A guide on the four dimensions of energy — physical, mental, emotional and spiritual — for those who lead and want to sustain performance over time.
              </p>
              <p className="text-xs text-gray-500 mb-6">
                By <strong className="text-white">Samuel Rolo</strong> &amp; <strong className="text-white">Marlene Ruivo</strong>
              </p>
              <div className="flex flex-col gap-3 max-w-sm">
                <a
                  href="https://go.hotmart.com/Q104764153P?dp=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#C9A961] border border-[#C9A961]/30 px-5 py-3 rounded-lg hover:bg-[#C9A961]/10 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  DOWNLOAD PREVIEW →
                </a>
                <a
                  href="https://go.hotmart.com/Q104764153P?dp=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase bg-[#C9A961] text-[#1a1a2e] px-5 py-3 rounded-lg hover:bg-[#d4af37] transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  BUY COMPLETE E-BOOK (PT) →
                </a>
                <p className="text-xs text-gray-600">English version coming soon.</p>
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
            Reflections on the intersection of technology, strategy and humanity. Practical insights for those who challenge the status quo.
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
              placeholder="Name"
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
              SUBSCRIBE
            </button>
          </form>
          <p className="text-xs text-gray-500 mb-6">Your data is protected. Cancel at any time.</p>
          <a
            href="https://www.linkedin.com/build-relation/newsletter-follow?entityUrn=7384145793324085248"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#C9A961] hover:underline"
          >
            <Mail className="w-3 h-3" />
            ALSO ON LINKEDIN →
          </a>
        </div>
      </section>

      {/* ─── EXTERNAL PUBLICATIONS ─── */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-2 text-xs font-semibold tracking-widest uppercase text-[#C9A961]">Other publications</div>
          <h2 className="text-3xl font-light text-[#1a1a2e] mb-8">
            External <strong className="font-semibold">publications</strong>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-100 rounded-xl p-6 hover:border-[#C9A961] hover:shadow-sm transition-all">
              <div className="text-xs font-semibold tracking-widest uppercase text-[#C9A961] mb-3">RH MAGAZINE</div>
              <h3 className="text-base font-semibold text-[#1a1a2e] mb-2">
                Times Change, Evaluations Change
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                A reflection on the evolution of performance evaluation models and what really matters in talent management.
              </p>
              <a
                href="https://rhmagazine.pt/mudam-os-tempos-mudam-as-avaliacoes/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold tracking-wide text-[#C9A961] hover:underline"
              >
                READ ARTICLE →
              </a>
            </div>
            <div className="border border-gray-100 rounded-xl p-6 hover:border-[#C9A961] hover:shadow-sm transition-all">
              <div className="text-xs font-semibold tracking-widest uppercase text-[#C9A961] mb-3">DEZANOVE</div>
              <h3 className="text-base font-semibold text-[#1a1a2e] mb-2">
                While There Is Wind There Is Feeling
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Review of the book that explores a true story of self-discovery, identity and resilience through various stages of life.
              </p>
              <a
                href="https://dezanove.pt/enquanto-houver-vento-ha-sentimento-de-samuel-rolo-2442105/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold tracking-wide text-[#C9A961] hover:underline"
              >
                READ REVIEW →
              </a>
            </div>
          </div>
        </div>
      </section>

      <S2IFooter />
    </div>
  );
}
