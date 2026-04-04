import { useState, useEffect, useRef } from 'react';
import { Check, X, ArrowRight, Star, Sparkles, BarChart3, FileText, MessageSquare, Briefcase, Target, Brain, Globe, Shield, Zap, Users, TrendingUp, ChevronRight, Cpu, LineChart, Search, BookOpen, Video, Newspaper } from 'lucide-react';

/* ──────────────────────────────────────────────────────────
   Design: Gold-themed, Poppins font, light background
   Consistent with the S2I area-cliente visual identity
   
   Viberank Feedback Applied:
   - Single, clear CTA repeated strategically ("Start Career Diagnosis")
   - AI differentiation section showcasing unique capabilities
   - Mobile-first: touch-friendly spacing, larger tap targets
   - Strong marketing positioning: "Career Intelligence"
   - No competing CTAs — one primary action throughout
   ────────────────────────────────────────────────────────── */

const i18n = {
  pt: {
    // ─── Hero ───
    heroTag: 'Career Intelligence | Diagnóstico Estratégico de Carreira',
    heroTitle: 'O relatório de carreira mais completo do mercado.',
    heroSubtitle: 'Diagnóstico completo de carreira com IA — análise de mercado, posicionamento estratégico e decisão informada. Tudo numa única plataforma.',
    heroCta: 'Inicia o Diagnóstico de Carreira',
    heroStat1: '+100',
    heroStat1Label: 'Profissionais ativos',
    heroStat2: '+23 pts',
    heroStat2Label: 'Melhoria média ATS',
    heroStat3: '7',
    heroStat3Label: 'Mercados suportados',

    // ─── AI Differentiation ───
    aiTag: 'Inteligência Artificial Avançada',
    aiTitle: 'Não é mais um gerador de CV. É um diagnóstico completo.',
    aiSubtitle: 'A nossa IA analisa o teu perfil em profundidade, cruza com dados reais de mercado e entrega um relatório personalizado que nenhuma ferramenta genérica consegue produzir.',
    aiFeatures: [
      {
        icon: 'Search',
        title: 'Análise de Mercado em Tempo Real',
        desc: 'A IA cruza o teu perfil com tendências salariais, competências em alta e oportunidades reais em 7 mercados — PT, UK, ES, BR, US, NL e DE.',
      },
      {
        icon: 'Cpu',
        title: 'Diagnóstico Personalizado',
        desc: 'Cada relatório é único. A IA avalia as tuas competências individuais, experiência e objetivos para criar um plano de ação específico para ti.',
      },
      {
        icon: 'LineChart',
        title: 'Relatório Abrangente vs. Genérico',
        desc: 'Enquanto outras ferramentas dão um score e param, nós entregamos análise ATS detalhada, matriz de prioridades, ações de melhoria e plano a 30 dias.',
      },
    ],
    aiCompare: 'Ferramentas genéricas dão-te um número. Nós damos-te um plano.',

    // ─── Features ───
    featuresTag: 'Ferramentas Integradas',
    featuresTitle: '6 ferramentas. 1 plataforma. 0 dispersão.',
    featuresSubtitle: 'Cada ferramenta foi desenhada para resolver um problema real na gestão de carreira — e todas trabalham em conjunto.',
    features: [
      {
        icon: 'FileText',
        name: 'CV Maker',
        desc: 'Constrói CVs profissionais com templates otimizados para ATS. Importa dados do LinkedIn, edita em tempo real e exporta em PDF. A IA sugere melhorias de conteúdo e formatação.',
        badge: 'Incluído em todos os planos',
      },
      {
        icon: 'BarChart3',
        name: 'CV Analyser',
        desc: 'Análise completa do teu CV com score ATS, feedback dimensional em 8 categorias, sugestões de melhoria prioritizadas, matriz de competências e plano de ação a 30 dias.',
        badge: 'Até ilimitado',
      },
      {
        icon: 'MessageSquare',
        name: 'Career Advisory',
        desc: 'Assistente pessoal de carreira com IA. Chat inteligente, cartas de apresentação personalizadas, e-mails de networking, posts LinkedIn, headlines e simulação de entrevistas com feedback.',
        badge: 'Chat ilimitado',
      },
      {
        icon: 'Target',
        name: 'Career Path',
        desc: 'Planeamento estratégico da tua carreira. Próximos cargos recomendados, exercícios de visibilidade, estratégias de networking e ações imediatas com dados de empresa enriquecidos.',
        badge: 'Com dados de mercado',
      },
      {
        icon: 'Brain',
        name: 'Career Intelligence',
        desc: 'Análise avançada de mercado e posicionamento estratégico. Tendências salariais por mercado, competências em alta, oportunidades por setor e benchmarking competitivo.',
        badge: 'Premium',
      },
      {
        icon: 'Briefcase',
        name: 'Feed de Vagas + Extensão Chrome',
        desc: 'Vagas curadas com match inteligente, estimativa salarial e dados de empresa enriquecidos. Extensão Chrome para guardar vagas de qualquer site e acompanhar candidaturas.',
        badge: 'Extensão Chrome',
      },
    ],

    // ─── Resources ───
    resourcesTag: 'Recursos Exclusivos',
    resourcesTitle: 'Mais do que ferramentas — conhecimento.',
    resourcesSubtitle: 'Acede a uma biblioteca crescente de conteúdos criados por especialistas em gestão de carreira.',
    resources: [
      { icon: 'BookOpen', count: '6+', label: 'E-books', desc: 'Guias práticos sobre CV, LinkedIn, entrevistas e transição de carreira.' },
      { icon: 'Video', count: '12+', label: 'Vídeos', desc: 'Tutoriais e masterclasses sobre posicionamento profissional.' },
      { icon: 'Newspaper', count: '30+', label: 'Artigos', desc: 'Análises de mercado, tendências e estratégias de carreira.' },
    ],

    // ─── Markets ───
    marketsTag: 'Cobertura Global',
    marketsTitle: 'Dados de mercado de 7 países.',
    markets: ['Portugal', 'Reino Unido', 'Espanha', 'Brasil', 'Estados Unidos', 'Países Baixos', 'Alemanha'],

    // ─── Comparison ───
    comparisonTag: 'Comparação',
    comparisonTitle: 'Porquê a Share2Inspire?',
    comparisonSubtitle: 'Comparámos as nossas ferramentas com as alternativas mais populares do mercado.',
    compHeaders: ['Funcionalidade', 'Share2Inspire', 'Teal', 'Jobscan', 'Kickresume', 'Enhancv'],
    compRows: [
      ['CV Builder com IA', true, true, false, true, true],
      ['Análise ATS detalhada', true, 'Limitado', true, 'Básico', 'Básico'],
      ['Otimização LinkedIn', true, false, 'Básico', false, false],
      ['Career Path Planning', true, false, false, false, false],
      ['Career Intelligence', true, false, false, false, false],
      ['Job Tracker + Extensão', true, true, false, false, false],
      ['Feed de Vagas com Match', true, 'Básico', false, false, false],
      ['Career Coach IA', true, false, false, false, false],
      ['Simulação de Entrevista', true, false, false, false, false],
      ['Dados de 7 mercados', true, false, false, false, false],
      ['Bilingue PT + EN', true, false, false, false, false],
      ['Company Enrichment', true, false, false, false, false],
    ],
    compPrice: ['Preço mensal', '9,90€', '$29', '$49,95', '$19', '$24,99'],

    // ─── Plans ───
    plansTag: 'Planos',
    plansTitle: 'Investe na tua carreira',
    plansSubtitle: 'Preço de fundador — aproveita antes que aumente.',
    plans: [
      {
        name: 'Essential',
        tagline: 'Para melhorares o teu posicionamento',
        price: '9,90',
        period: '/mês',
        features: ['CV Maker com acesso contínuo', 'CV Analyser — 1 análise/semana', 'LinkedIn Roaster — 1 análise/semana', 'Career Bot com respostas base', 'Acompanhamento de progresso'],
        highlight: 'Melhora o teu score ATS em média 23 pontos',
        popular: false,
      },
      {
        name: 'Growth',
        tagline: 'Para evoluíres com mais contexto',
        price: '19,90',
        period: '/mês',
        features: ['Tudo do Essential + mais', 'CV + LinkedIn — 5 análises/semana', 'Feed de Vagas com match inteligente', 'E-books e templates premium', 'Career Bot avançado'],
        highlight: 'Aumenta visualizações de perfil em 40%',
        popular: true,
      },
      {
        name: 'Pro',
        tagline: 'Para acelerar a tua evolução',
        price: '39,00',
        period: '/mês',
        features: ['Tudo do Growth + acesso total', 'Análises ilimitadas', 'Feed com estimativa salarial', 'Prioridade no processamento', 'Acesso antecipado a novidades'],
        highlight: 'Vagas com salários 15% acima da média',
        popular: false,
      },
    ],
    plansBilling: 'Semestral -17% · Anual -33%',
    plansCta: 'Inicia o Diagnóstico de Carreira',

    // ─── Testimonials ───
    testimonialsTag: 'Testemunhos',
    testimonialsTitle: 'O que dizem os nossos utilizadores',
    testimonials: [
      { name: 'Ana M.', role: 'Senior Manager', text: 'Passei de 45 para 82 pontos ATS em 10 minutos. O relatório é incrivelmente detalhado — nada comparável ao que encontrei noutras plataformas.', stars: 5 },
      { name: 'Diogo S.', role: 'Software Engineer', text: 'O Career Intelligence mostrou-me oportunidades em mercados que nem tinha considerado. A análise salarial por país é um diferencial enorme.', stars: 5 },
      { name: 'Mariana C.', role: 'Product Manager', text: 'Finalmente uma ferramenta que me diz exatamente o que os recrutadores querem ver. O plano de ação a 30 dias mudou completamente a minha abordagem.', stars: 5 },
    ],

    // ─── Final CTA ───
    ctaTitle: 'Pronto para o diagnóstico completo da tua carreira?',
    ctaSubtitle: 'Junta-te a mais de 100 profissionais que já estão a usar a Share2Inspire para tomar decisões de carreira informadas.',
    ctaButton: 'Inicia o Diagnóstico de Carreira',
    ctaNote: 'Sem cartão de crédito · Cancela quando quiseres',

    langSwitch: 'EN',
  },
  en: {
    // ─── Hero ───
    heroTag: 'Career Intelligence | Strategic Career Diagnosis',
    heroTitle: 'The most comprehensive career report on the market.',
    heroSubtitle: 'Complete career diagnosis with AI — market analysis, strategic positioning and informed decision. All in one platform.',
    heroCta: 'Start Your Career Diagnosis',
    heroStat1: '100+',
    heroStat1Label: 'Active professionals',
    heroStat2: '+23 pts',
    heroStat2Label: 'Average ATS improvement',
    heroStat3: '7',
    heroStat3Label: 'Markets supported',

    // ─── AI Differentiation ───
    aiTag: 'Advanced Artificial Intelligence',
    aiTitle: 'Not just another CV generator. It\'s a complete diagnosis.',
    aiSubtitle: 'Our AI analyzes your profile in depth, cross-references real market data and delivers a personalized report that no generic tool can produce.',
    aiFeatures: [
      {
        icon: 'Search',
        title: 'Real-Time Market Analysis',
        desc: 'The AI cross-references your profile with salary trends, in-demand skills and real opportunities across 7 markets — PT, UK, ES, BR, US, NL and DE.',
      },
      {
        icon: 'Cpu',
        title: 'Personalized Diagnosis',
        desc: 'Every report is unique. The AI evaluates your individual skills, experience and goals to create a specific action plan for you.',
      },
      {
        icon: 'LineChart',
        title: 'Comprehensive vs. Generic Report',
        desc: 'While other tools give you a score and stop, we deliver detailed ATS analysis, priority matrix, improvement actions and a 30-day plan.',
      },
    ],
    aiCompare: 'Generic tools give you a number. We give you a plan.',

    // ─── Features ───
    featuresTag: 'Integrated Tools',
    featuresTitle: '6 tools. 1 platform. Zero fragmentation.',
    featuresSubtitle: 'Each tool was designed to solve a real career management problem — and they all work together.',
    features: [
      {
        icon: 'FileText',
        name: 'CV Maker',
        desc: 'Build professional CVs with ATS-optimized templates. Import data from LinkedIn, edit in real-time and export as PDF. AI suggests content and formatting improvements.',
        badge: 'Included in all plans',
      },
      {
        icon: 'BarChart3',
        name: 'CV Analyser',
        desc: 'Complete CV analysis with ATS score, dimensional feedback across 8 categories, prioritized improvement suggestions, skills matrix and 30-day action plan.',
        badge: 'Up to unlimited',
      },
      {
        icon: 'MessageSquare',
        name: 'Career Advisory',
        desc: 'Personal career assistant with AI. Smart chat, personalized cover letters, networking emails, LinkedIn posts, headlines and interview simulation with feedback.',
        badge: 'Unlimited chat',
      },
      {
        icon: 'Target',
        name: 'Career Path',
        desc: 'Strategic career planning. Recommended next roles, visibility exercises, networking strategies and immediate actions with enriched company data.',
        badge: 'With market data',
      },
      {
        icon: 'Brain',
        name: 'Career Intelligence',
        desc: 'Advanced market analysis and strategic positioning. Salary trends by market, in-demand skills, opportunities by sector and competitive benchmarking.',
        badge: 'Premium',
      },
      {
        icon: 'Briefcase',
        name: 'Job Feed + Chrome Extension',
        desc: 'Curated jobs with smart matching, salary estimates and enriched company data. Chrome extension to save jobs from any site and track applications.',
        badge: 'Chrome Extension',
      },
    ],

    // ─── Resources ───
    resourcesTag: 'Exclusive Resources',
    resourcesTitle: 'More than tools — knowledge.',
    resourcesSubtitle: 'Access a growing library of content created by career management experts.',
    resources: [
      { icon: 'BookOpen', count: '6+', label: 'E-books', desc: 'Practical guides on CV, LinkedIn, interviews and career transition.' },
      { icon: 'Video', count: '12+', label: 'Videos', desc: 'Tutorials and masterclasses on professional positioning.' },
      { icon: 'Newspaper', count: '30+', label: 'Articles', desc: 'Market analysis, trends and career strategies.' },
    ],

    // ─── Markets ───
    marketsTag: 'Global Coverage',
    marketsTitle: 'Market data from 7 countries.',
    markets: ['Portugal', 'United Kingdom', 'Spain', 'Brazil', 'United States', 'Netherlands', 'Germany'],

    // ─── Comparison ───
    comparisonTag: 'Comparison',
    comparisonTitle: 'Why Share2Inspire?',
    comparisonSubtitle: 'We compared our tools with the most popular alternatives on the market.',
    compHeaders: ['Feature', 'Share2Inspire', 'Teal', 'Jobscan', 'Kickresume', 'Enhancv'],
    compRows: [
      ['AI CV Builder', true, true, false, true, true],
      ['Detailed ATS Analysis', true, 'Limited', true, 'Basic', 'Basic'],
      ['LinkedIn Optimization', true, false, 'Basic', false, false],
      ['Career Path Planning', true, false, false, false, false],
      ['Career Intelligence', true, false, false, false, false],
      ['Job Tracker + Extension', true, true, false, false, false],
      ['Job Feed with Matching', true, 'Basic', false, false, false],
      ['AI Career Coach', true, false, false, false, false],
      ['Interview Simulation', true, false, false, false, false],
      ['Data from 7 markets', true, false, false, false, false],
      ['Bilingual PT + EN', true, false, false, false, false],
      ['Company Enrichment', true, false, false, false, false],
    ],
    compPrice: ['Monthly price', '€9.90', '$29', '$49.95', '$19', '$24.99'],

    // ─── Plans ───
    plansTag: 'Plans',
    plansTitle: 'Invest in your career',
    plansSubtitle: 'Founder pricing — take advantage before it increases.',
    plans: [
      {
        name: 'Essential',
        tagline: 'To improve your positioning',
        price: '9.90',
        period: '/mo',
        features: ['CV Maker with continuous access', 'CV Analyser — 1 analysis/week', 'LinkedIn Roaster — 1 analysis/week', 'Career Bot with basic answers', 'Progress tracking'],
        highlight: 'Improve your ATS score by 23 points on average',
        popular: false,
      },
      {
        name: 'Growth',
        tagline: 'To evolve with more context',
        price: '19.90',
        period: '/mo',
        features: ['Everything in Essential + more', 'CV + LinkedIn — 5 analyses/week', 'Job Feed with smart matching', 'E-books and premium templates', 'Advanced Career Bot'],
        highlight: 'Increase profile views by 40%',
        popular: true,
      },
      {
        name: 'Pro',
        tagline: 'To accelerate your evolution',
        price: '39.00',
        period: '/mo',
        features: ['Everything in Growth + full access', 'Unlimited analyses', 'Feed with salary estimates', 'Priority processing', 'Early access to new features'],
        highlight: 'Jobs with salaries 15% above average',
        popular: false,
      },
    ],
    plansBilling: 'Semi-annual -17% · Annual -33%',
    plansCta: 'Start Your Career Diagnosis',

    // ─── Testimonials ───
    testimonialsTag: 'Testimonials',
    testimonialsTitle: 'What our users say',
    testimonials: [
      { name: 'Ana M.', role: 'Senior Manager', text: 'I went from 45 to 82 ATS points in 10 minutes. The report is incredibly detailed — nothing comparable to what I found on other platforms.', stars: 5 },
      { name: 'Diogo S.', role: 'Software Engineer', text: 'Career Intelligence showed me opportunities in markets I hadn\'t even considered. The salary analysis by country is a huge differentiator.', stars: 5 },
      { name: 'Mariana C.', role: 'Product Manager', text: 'Finally a tool that tells me exactly what recruiters want to see. The 30-day action plan completely changed my approach.', stars: 5 },
    ],

    // ─── Final CTA ───
    ctaTitle: 'Ready for your complete career diagnosis?',
    ctaSubtitle: 'Join over 100 professionals already using Share2Inspire to make informed career decisions.',
    ctaButton: 'Start Your Career Diagnosis',
    ctaNote: 'No credit card · Cancel anytime',

    langSwitch: 'PT',
  },
};

const iconMap: Record<string, React.ElementType> = {
  FileText, BarChart3, MessageSquare, Target, Brain, Briefcase, Search, Cpu, LineChart, BookOpen, Video, Newspaper,
};

function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function ClientAreaLanding() {
  const [lang, setLang] = useState<'pt' | 'en'>(() => {
    const stored = localStorage.getItem('s2i-lang');
    return stored === 'en' ? 'en' : 'pt';
  });
  const t = i18n[lang];

  const toggleLang = () => {
    const next = lang === 'pt' ? 'en' : 'pt';
    setLang(next);
    localStorage.setItem('s2i-lang', next);
  };

  const basePath = window.location.pathname.startsWith('/area-cliente') ? '/area-cliente' : '';
  const ctaHref = `${basePath}/auth`;

  return (
    <div className="bg-[#FAFAF9] text-[#1a1a1a] font-[Poppins,sans-serif] overflow-x-hidden">

      {/* ─── Hero ─── */}
      <section className="relative py-16 sm:py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-[#faf8f3] via-[#FAFAF9] to-[#f5f0e8]" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-[#C9A961]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#C9A961]/8 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center lg:text-left lg:mx-0">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C9A961]/10 text-[#C9A961] text-xs font-semibold tracking-wide uppercase mb-6">
                <Sparkles className="w-3.5 h-3.5" /> {t.heroTag}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.1] tracking-tight text-[#1a1a1a] mb-6">
                {t.heroTitle}
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-[#666] leading-relaxed mb-8 max-w-2xl mx-auto lg:mx-0">
                {t.heroSubtitle}
              </p>
              
              {/* Single Primary CTA — above the fold */}
              <div className="mb-12">
                <a href={ctaHref} className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-[#C9A961] to-[#D4B96E] text-white font-semibold text-base shadow-lg shadow-[#C9A961]/20 hover:shadow-xl hover:shadow-[#C9A961]/30 transition-all hover:-translate-y-0.5 min-h-[52px]">
                  {t.heroCta} <ArrowRight className="w-5 h-5" />
                </a>
              </div>

              <div className="flex flex-wrap justify-center lg:justify-start gap-6 sm:gap-10">
                {[
                  { val: t.heroStat1, label: t.heroStat1Label, icon: Users },
                  { val: t.heroStat2, label: t.heroStat2Label, icon: TrendingUp },
                  { val: t.heroStat3, label: t.heroStat3Label, icon: Globe },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#C9A961]/10 flex items-center justify-center">
                      <s.icon className="w-5 h-5 text-[#C9A961]" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-[#1a1a1a]">{s.val}</div>
                      <div className="text-xs text-[#999]">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── AI Differentiation Section ─── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C9A961]/10 text-[#C9A961] text-xs font-semibold tracking-wide uppercase mb-4">
                <Cpu className="w-3.5 h-3.5" /> {t.aiTag}
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1a1a1a] mb-4">{t.aiTitle}</h2>
              <p className="text-[#666] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">{t.aiSubtitle}</p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-12">
            {t.aiFeatures.map((feat, i) => {
              const Icon = iconMap[feat.icon] || Cpu;
              return (
                <FadeIn key={i} delay={i * 120}>
                  <div className="relative p-6 sm:p-8 rounded-2xl border border-[#e5e5e0] bg-[#FAFAF9] hover:border-[#C9A961]/30 hover:shadow-lg transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C9A961] to-[#D4B96E] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-[#1a1a1a] mb-3">{feat.title}</h3>
                    <p className="text-sm text-[#666] leading-relaxed">{feat.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>

          <FadeIn delay={200}>
            <div className="text-center">
              <p className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1a1a1a] text-white text-sm font-medium">
                <Zap className="w-4 h-4 text-[#C9A961]" />
                {t.aiCompare}
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Features Showcase ─── */}
      <section id="features" className="py-16 sm:py-24 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C9A961]/10 text-[#C9A961] text-xs font-semibold tracking-wide uppercase mb-4">
                {t.featuresTag}
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1a1a1a] mb-4">{t.featuresTitle}</h2>
              <p className="text-[#666] text-base sm:text-lg max-w-2xl mx-auto">{t.featuresSubtitle}</p>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {t.features.map((f, i) => {
              const Icon = iconMap[f.icon] || FileText;
              return (
                <FadeIn key={i} delay={i * 80}>
                  <div className="p-6 rounded-2xl bg-white border border-[#e5e5e0] hover:border-[#C9A961]/30 hover:shadow-lg transition-all h-full flex flex-col">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-[#C9A961]/10 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-[#C9A961]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[#1a1a1a]">{f.name}</h3>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#C9A961]/10 text-[#C9A961] text-[10px] font-semibold">
                          {f.badge}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-[#666] leading-relaxed flex-1">{f.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>

          {/* Mid-page CTA repetition */}
          <FadeIn delay={300}>
            <div className="text-center mt-12">
              <a href={ctaHref} className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-[#C9A961] to-[#D4B96E] text-white font-semibold text-base shadow-lg shadow-[#C9A961]/20 hover:shadow-xl hover:shadow-[#C9A961]/30 transition-all hover:-translate-y-0.5 min-h-[52px]">
                {t.heroCta} <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Resources ─── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C9A961]/10 text-[#C9A961] text-xs font-semibold tracking-wide uppercase mb-4">
                <BookOpen className="w-3.5 h-3.5" /> {t.resourcesTag}
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1a1a1a] mb-4">{t.resourcesTitle}</h2>
              <p className="text-[#666] text-base sm:text-lg max-w-2xl mx-auto">{t.resourcesSubtitle}</p>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {t.resources.map((r, i) => {
              const Icon = iconMap[r.icon] || BookOpen;
              return (
                <FadeIn key={i} delay={i * 100}>
                  <div className="text-center p-6 rounded-2xl border border-[#e5e5e0] bg-[#FAFAF9] hover:border-[#C9A961]/30 hover:shadow-md transition-all">
                    <div className="w-14 h-14 rounded-xl bg-[#C9A961]/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-7 h-7 text-[#C9A961]" />
                    </div>
                    <div className="text-3xl font-bold text-[#C9A961] mb-1">{r.count}</div>
                    <div className="font-semibold text-[#1a1a1a] mb-2">{r.label}</div>
                    <p className="text-xs text-[#666] leading-relaxed">{r.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Markets ─── */}
      <section className="py-12 sm:py-16 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C9A961]/10 text-[#C9A961] text-xs font-semibold tracking-wide uppercase mb-3">
                <Globe className="w-3.5 h-3.5" /> {t.marketsTag}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a]">{t.marketsTitle}</h2>
            </div>
            <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
              {t.markets.map((m, i) => (
                <span key={i} className="px-4 py-2.5 rounded-xl border border-[#e5e5e0] bg-white text-sm font-medium text-[#555] hover:border-[#C9A961]/30 hover:text-[#C9A961] transition-colors min-h-[44px] flex items-center">
                  {m}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Comparison Table ─── */}
      <section id="comparison" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C9A961]/10 text-[#C9A961] text-xs font-semibold tracking-wide uppercase mb-4">
                {t.comparisonTag}
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1a1a1a] mb-4">{t.comparisonTitle}</h2>
              <p className="text-[#666] text-base sm:text-lg max-w-2xl mx-auto">{t.comparisonSubtitle}</p>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <div className="overflow-x-auto rounded-2xl border border-[#e5e5e0] bg-white shadow-sm -mx-4 sm:mx-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e0]">
                    {t.compHeaders.map((h, i) => (
                      <th key={i} className={`px-3 sm:px-4 py-4 text-left font-semibold text-xs sm:text-sm ${
                        i === 1 ? 'bg-[#C9A961]/5 text-[#C9A961]' : 'text-[#999]'
                      } ${i === 0 ? 'min-w-[140px] sm:min-w-[180px]' : 'min-w-[80px] sm:min-w-[100px] text-center'}`}>
                        {i === 1 && <Shield className="w-3.5 h-3.5 inline mr-1 mb-0.5" />}
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {t.compRows.map((row, ri) => (
                    <tr key={ri} className="border-b border-[#f5f5f0] hover:bg-[#faf8f3] transition-colors">
                      {row.map((cell, ci) => (
                        <td key={ci} className={`px-3 sm:px-4 py-3 ${ci === 0 ? 'font-medium text-[#1a1a1a] text-xs sm:text-sm' : 'text-center'} ${ci === 1 ? 'bg-[#C9A961]/5' : ''}`}>
                          {ci === 0 ? (
                            cell as string
                          ) : cell === true ? (
                            <Check className="w-4.5 h-4.5 text-emerald-500 mx-auto" />
                          ) : cell === false ? (
                            <X className="w-4.5 h-4.5 text-[#ccc] mx-auto" />
                          ) : (
                            <span className="text-[10px] sm:text-xs text-[#999]">{cell as string}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="bg-[#faf8f3]">
                    {t.compPrice.map((p, i) => (
                      <td key={i} className={`px-3 sm:px-4 py-4 font-bold text-xs sm:text-sm ${
                        i === 0 ? 'text-[#1a1a1a]' : 'text-center'
                      } ${i === 1 ? 'bg-[#C9A961]/10 text-[#C9A961] text-base sm:text-lg' : 'text-[#666]'}`}>
                        {p}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Plans ─── */}
      <section id="plans" className="py-16 sm:py-24 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C9A961]/10 text-[#C9A961] text-xs font-semibold tracking-wide uppercase mb-4">
                {t.plansTag}
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1a1a1a] mb-4">{t.plansTitle}</h2>
              <p className="text-[#666] text-base sm:text-lg">{t.plansSubtitle}</p>
              <p className="text-xs text-[#999] mt-2">{t.plansBilling}</p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {t.plans.map((plan, i) => (
              <FadeIn key={i} delay={i * 120}>
                <div className={`relative rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl ${
                  plan.popular
                    ? 'bg-gradient-to-b from-[#C9A961]/5 to-white border-2 border-[#C9A961] shadow-lg'
                    : 'bg-white border border-[#e5e5e0] shadow-sm'
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full bg-[#C9A961] text-white text-[10px] font-bold uppercase tracking-wider">
                        {lang === 'pt' ? 'Recomendado' : 'Recommended'}
                      </span>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="font-bold text-lg text-[#1a1a1a]">{plan.name}</h3>
                    <p className="text-xs text-[#999] mt-1">{plan.tagline}</p>
                  </div>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-[#1a1a1a]">{plan.price}€</span>
                    <span className="text-sm text-[#999]">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2 text-sm text-[#555]">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="p-3 rounded-lg bg-[#C9A961]/5 text-xs text-[#C9A961] font-medium mb-6">
                    {plan.highlight}
                  </div>
                  <a
                    href={ctaHref}
                    className={`block w-full text-center py-3.5 rounded-xl font-semibold text-sm transition-all min-h-[48px] flex items-center justify-center ${
                      plan.popular
                        ? 'bg-gradient-to-r from-[#C9A961] to-[#D4B96E] text-white shadow-lg shadow-[#C9A961]/20 hover:shadow-xl'
                        : 'border border-[#C9A961] text-[#C9A961] hover:bg-[#C9A961]/5'
                    }`}
                  >
                    {t.plansCta} <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
                  </a>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C9A961]/10 text-[#C9A961] text-xs font-semibold tracking-wide uppercase mb-4">
                {t.testimonialsTag}
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1a1a1a] mb-4">{t.testimonialsTitle}</h2>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {t.testimonials.map((test, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="bg-[#FAFAF9] rounded-2xl p-6 border border-[#e5e5e0] hover:shadow-md transition-shadow">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: test.stars }).map((_, si) => (
                      <Star key={si} className="w-4 h-4 fill-[#C9A961] text-[#C9A961]" />
                    ))}
                  </div>
                  <p className="text-sm text-[#555] leading-relaxed mb-6 italic">"{test.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A961] to-[#D4B96E] flex items-center justify-center text-white font-bold text-sm">
                      {test.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[#1a1a1a]">{test.name}</div>
                      <div className="text-xs text-[#999]">{test.role}</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">{t.ctaTitle}</h2>
            <p className="text-white/60 text-base sm:text-lg mb-8">{t.ctaSubtitle}</p>
            <a href={ctaHref} className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-[#C9A961] to-[#D4B96E] text-white font-semibold text-base shadow-lg shadow-[#C9A961]/30 hover:shadow-xl hover:shadow-[#C9A961]/40 transition-all hover:-translate-y-0.5 min-h-[52px]">
              {t.ctaButton} <ArrowRight className="w-5 h-5" />
            </a>
            <p className="text-white/40 text-xs mt-4">{t.ctaNote}</p>
          </FadeIn>
        </div>
      </section>


    </div>
  );
}
