import { useState, useEffect, useRef } from 'react';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { Check, X, ArrowRight, Star, ChevronDown, Sparkles, BarChart3, FileText, Briefcase, Target, Brain, Globe, Shield, Zap, Users, TrendingUp, Lock, Award, Chrome, BookOpen, Video, Newspaper, MapPin, Search, Bell, Bookmark } from 'lucide-react';

/* ──────────────────────────────────────────────────────────
   Design: Gold-themed, Poppins font, light background
   Focus: Área de Membro — what members get access to
   NO Career Advisor — removed per user request
   NO screenshots/prints — removed per user request
   +100 membros (not +500)
   Multi-market: UK, PT, ES, BR, US, NL, DE
   ────────────────────────────────────────────────────────── */

const CDN = {
  logo: 'https://share2inspire.pt/images/logo.webp',
};

const i18n = {
  pt: {
    heroTag: 'Área de Membro',
    heroTitle: 'O teu espaço exclusivo de gestão de carreira.',
    heroSubtitle: 'Acede a ferramentas de IA, análises personalizadas e planeamento estratégico — tudo pensado para te posicionar melhor no mercado.',
    heroCta: 'Entrar na Área de Membro',
    heroCtaSecondary: 'Ver planos',
    heroStat1: '+100',
    heroStat1Label: 'Membros ativos',
    heroStat2: '+23 pts',
    heroStat2Label: 'Melhoria média ATS',
    heroStat3: '5',
    heroStat3Label: 'Ferramentas IA',
    benefitsTag: 'Benefícios',
    benefitsTitle: 'Porquê ser membro?',
    benefits: [
      { icon: 'Lock', title: 'Acesso exclusivo', desc: 'Ferramentas de IA que não estão disponíveis no site público.' },
      { icon: 'Award', title: 'Análises personalizadas', desc: 'Relatórios detalhados sobre o teu CV, perfil LinkedIn e posicionamento.' },
      { icon: 'TrendingUp', title: 'Evolução contínua', desc: 'Acompanha o teu progresso e melhora o teu score ATS semana a semana.' },
      { icon: 'Zap', title: 'Inteligência de mercado', desc: 'Dados de vagas, salários e tendências atualizados para múltiplos mercados.' },
    ],
    featuresTag: 'O que inclui a tua subscrição',
    featuresTitle: 'Ferramentas exclusivas para membros',
    featuresSubtitle: 'Cinco ferramentas de inteligência artificial integradas, disponíveis na tua área de membro.',
    features: [
      {
        icon: 'FileText',
        name: 'CV Maker',
        desc: 'Constrói CVs profissionais com templates otimizados para ATS.',
        details: [
          'Importa dados do LinkedIn automaticamente ou começa do zero',
          'Templates profissionais otimizados para sistemas ATS',
          'Assistência de IA para melhorar descrições de experiência',
          'Exporta em PDF com formatação perfeita',
          'Sugestões de palavras-chave por setor e cargo',
        ],
      },
      {
        icon: 'BarChart3',
        name: 'CV Analyser',
        desc: 'Análise completa e detalhada do teu CV com IA.',
        details: [
          'Score ATS detalhado com breakdown por dimensão',
          'Feedback dimensional: conteúdo, formatação, impacto, keywords',
          'Comparação com benchmarks do mercado',
          'Sugestões de melhoria priorizadas por impacto',
          'Análise de compatibilidade com vagas específicas',
        ],
      },
      {
        icon: 'Target',
        name: 'Career Path',
        desc: 'Planeamento estratégico da tua carreira com dados reais.',
        details: [
          'Próximos cargos recomendados com base no teu perfil',
          'Exercícios de visibilidade e networking personalizados',
          'Ações imediatas para acelerar a progressão',
          'Análise de gaps de competências por cargo-alvo',
          'Powered by NinjaPear — dados de mercado em tempo real',
        ],
      },
      {
        icon: 'Brain',
        name: 'Career Intelligence',
        desc: 'Análise avançada de mercado e posicionamento competitivo.',
        details: [
          'Tendências salariais por cargo, setor e região',
          'Competências mais procuradas no teu setor',
          'Dados de empresas enriquecidos (NinjaPear)',
          'Oportunidades emergentes por mercado',
          'Benchmarking do teu perfil vs. mercado',
        ],
      },
      {
        icon: 'Briefcase',
        name: 'Feed de Vagas + Job Tracker',
        desc: 'Vagas curadas com match inteligente e acompanhamento completo.',
        details: [
          'Feed personalizado com match % por vaga',
          'Estimativa salarial e dados de empresa enriquecidos',
          'Extensão Chrome para guardar vagas de qualquer site',
          'Job Tracker: acompanha candidaturas (aplicado, entrevista, oferta)',
          'Alertas de novas vagas compatíveis com o teu perfil',
        ],
      },
    ],
    extensionTag: 'Extensão Chrome',
    extensionTitle: 'Acompanhamento de emprego integrado',
    extensionSubtitle: 'A extensão Chrome da Share2Inspire permite-te guardar vagas de qualquer site e acompanhar todo o processo de candidatura.',
    extensionSpecs: [
      { icon: 'Chrome', title: 'Extensão Chrome', desc: 'Guarda vagas do LinkedIn, Indeed, Glassdoor e qualquer outro site com um clique.' },
      { icon: 'Bookmark', title: 'Job Tracker', desc: 'Acompanha o estado de cada candidatura: guardada, aplicada, entrevista, oferta, rejeitada.' },
      { icon: 'Bell', title: 'Alertas inteligentes', desc: 'Recebe notificações quando surgem vagas compatíveis com o teu perfil e preferências.' },
      { icon: 'Search', title: 'Match inteligente', desc: 'Cada vaga tem um score de compatibilidade baseado no teu CV e experiência.' },
    ],
    resourcesTag: 'Recursos',
    resourcesTitle: 'Conteúdo exclusivo para membros',
    resourcesSubtitle: 'Além das ferramentas, tens acesso a uma biblioteca de recursos para acelerar a tua evolução profissional.',
    resources: [
      { icon: 'BookOpen', title: 'E-books', desc: 'Guias práticos sobre otimização de CV, entrevistas, negociação salarial e transição de carreira. Atualizados regularmente.', count: '6+' },
      { icon: 'Video', title: 'Vídeos', desc: 'Tutoriais e masterclasses sobre as ferramentas da plataforma, estratégias de carreira e tendências do mercado.', count: '12+' },
      { icon: 'Newspaper', title: 'Artigos', desc: 'Análises aprofundadas sobre o mercado de trabalho, dicas de recrutadores e cases de sucesso de membros.', count: '30+' },
    ],
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
      ['Multi-mercado (PT, UK, ES, BR, US, NL, DE)', true, false, false, false, false],
      ['Bilingue PT + EN', true, false, false, false, false],
      ['Company Enrichment', true, false, false, false, false],
    ],
    compPrice: ['Preço mensal', '9,90€', '$29', '$49,95', '$19', '$24,99'],
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
        cta: 'Começar',
        popular: false,
      },
      {
        name: 'Growth',
        tagline: 'Para evoluíres com mais contexto',
        price: '19,90',
        period: '/mês',
        features: ['Tudo do Essential + mais', 'CV + LinkedIn — 5 análises/semana', 'Feed de Vagas com match inteligente', 'E-books e templates premium', 'Career Bot avançado'],
        highlight: 'Aumenta visualizações de perfil em 40%',
        cta: 'Subscrever',
        popular: true,
      },
      {
        name: 'Pro',
        tagline: 'Para acelerar a tua evolução',
        price: '39,00',
        period: '/mês',
        features: ['Tudo do Growth + acesso total', 'Análises ilimitadas', 'Feed com estimativa salarial', 'Prioridade no processamento', 'Acesso antecipado a novidades'],
        highlight: 'Vagas com salários 15% acima da média',
        cta: 'Subscrever',
        popular: false,
      },
    ],
    plansBilling: 'Semestral -17% · Anual -33%',
    testimonialsTag: 'Testemunhos',
    testimonialsTitle: 'O que dizem os nossos membros',
    testimonials: [
      { name: 'Ana M.', role: 'Senior Manager', text: 'Passei de 45 para 82 pontos ATS em 10 minutos. Absolutamente essencial para quem procura emprego hoje em dia.', stars: 5 },
      { name: 'Diogo S.', role: 'Software Engineer', text: 'O LinkedIn Roaster deu-me feedback que nunca tinha recebido. O meu perfil está muito mais forte e a receber mais visitas.', stars: 5 },
      { name: 'Mariana C.', role: 'Product Manager', text: 'Finalmente uma ferramenta que me diz exatamente o que os recrutadores querem ver. O CV Analyser é um game-changer.', stars: 5 },
    ],
    ctaTitle: 'Pronto para dar o próximo passo?',
    ctaSubtitle: 'Junta-te a mais de 100 membros que já estão a usar as ferramentas da Share2Inspire.',
    ctaButton: 'Criar conta gratuita',
    ctaNote: 'Sem cartão de crédito · Cancela quando quiseres',
    langSwitch: 'EN',
  },
  en: {
    heroTag: 'Member Area',
    heroTitle: 'Your exclusive career management space.',
    heroSubtitle: 'Access AI tools, personalized analyses and strategic planning — all designed to position you better in the market.',
    heroCta: 'Enter Member Area',
    heroCtaSecondary: 'View plans',
    heroStat1: '100+',
    heroStat1Label: 'Active members',
    heroStat2: '+23 pts',
    heroStat2Label: 'Average ATS improvement',
    heroStat3: '5',
    heroStat3Label: 'AI tools',
    benefitsTag: 'Benefits',
    benefitsTitle: 'Why become a member?',
    benefits: [
      { icon: 'Lock', title: 'Exclusive access', desc: 'AI tools not available on the public site.' },
      { icon: 'Award', title: 'Personalized analyses', desc: 'Detailed reports on your CV, LinkedIn profile and positioning.' },
      { icon: 'TrendingUp', title: 'Continuous evolution', desc: 'Track your progress and improve your ATS score week by week.' },
      { icon: 'Zap', title: 'Market intelligence', desc: 'Job data, salaries and trends updated across multiple markets.' },
    ],
    featuresTag: 'What your subscription includes',
    featuresTitle: 'Exclusive tools for members',
    featuresSubtitle: 'Five integrated AI tools, available in your member area.',
    features: [
      {
        icon: 'FileText',
        name: 'CV Maker',
        desc: 'Build professional CVs with ATS-optimized templates.',
        details: [
          'Import data from LinkedIn automatically or start from scratch',
          'Professional templates optimized for ATS systems',
          'AI assistance to improve experience descriptions',
          'Export to PDF with perfect formatting',
          'Keyword suggestions by sector and role',
        ],
      },
      {
        icon: 'BarChart3',
        name: 'CV Analyser',
        desc: 'Complete and detailed CV analysis with AI.',
        details: [
          'Detailed ATS score with dimensional breakdown',
          'Dimensional feedback: content, formatting, impact, keywords',
          'Comparison with market benchmarks',
          'Improvement suggestions prioritized by impact',
          'Compatibility analysis with specific job listings',
        ],
      },
      {
        icon: 'Target',
        name: 'Career Path',
        desc: 'Strategic career planning with real market data.',
        details: [
          'Recommended next roles based on your profile',
          'Personalized visibility and networking exercises',
          'Immediate actions to accelerate progression',
          'Skills gap analysis per target role',
          'Powered by NinjaPear — real-time market data',
        ],
      },
      {
        icon: 'Brain',
        name: 'Career Intelligence',
        desc: 'Advanced market analysis and competitive positioning.',
        details: [
          'Salary trends by role, sector and region',
          'Most in-demand skills in your sector',
          'Enriched company data (NinjaPear)',
          'Emerging opportunities by market',
          'Profile benchmarking vs. market',
        ],
      },
      {
        icon: 'Briefcase',
        name: 'Job Feed + Job Tracker',
        desc: 'Curated jobs with smart matching and full tracking.',
        details: [
          'Personalized feed with match % per job',
          'Salary estimates and enriched company data',
          'Chrome extension to save jobs from any site',
          'Job Tracker: track applications (applied, interview, offer)',
          'Alerts for new jobs matching your profile',
        ],
      },
    ],
    extensionTag: 'Chrome Extension',
    extensionTitle: 'Integrated job tracking',
    extensionSubtitle: 'The Share2Inspire Chrome extension lets you save jobs from any site and track your entire application process.',
    extensionSpecs: [
      { icon: 'Chrome', title: 'Chrome Extension', desc: 'Save jobs from LinkedIn, Indeed, Glassdoor and any other site with one click.' },
      { icon: 'Bookmark', title: 'Job Tracker', desc: 'Track the status of each application: saved, applied, interview, offer, rejected.' },
      { icon: 'Bell', title: 'Smart alerts', desc: 'Get notifications when new jobs matching your profile and preferences appear.' },
      { icon: 'Search', title: 'Smart matching', desc: 'Each job has a compatibility score based on your CV and experience.' },
    ],
    resourcesTag: 'Resources',
    resourcesTitle: 'Exclusive content for members',
    resourcesSubtitle: 'Beyond the tools, you get access to a library of resources to accelerate your professional growth.',
    resources: [
      { icon: 'BookOpen', title: 'E-books', desc: 'Practical guides on CV optimization, interviews, salary negotiation and career transition. Regularly updated.', count: '6+' },
      { icon: 'Video', title: 'Videos', desc: 'Tutorials and masterclasses on platform tools, career strategies and market trends.', count: '12+' },
      { icon: 'Newspaper', title: 'Articles', desc: 'In-depth analyses of the job market, recruiter tips and member success stories.', count: '30+' },
    ],
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
      ['Multi-market (PT, UK, ES, BR, US, NL, DE)', true, false, false, false, false],
      ['Bilingual PT + EN', true, false, false, false, false],
      ['Company Enrichment', true, false, false, false, false],
    ],
    compPrice: ['Monthly price', '€9.90', '$29', '$49.95', '$19', '$24.99'],
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
        cta: 'Get started',
        popular: false,
      },
      {
        name: 'Growth',
        tagline: 'To evolve with more context',
        price: '19.90',
        period: '/mo',
        features: ['Everything in Essential + more', 'CV + LinkedIn — 5 analyses/week', 'Job Feed with smart matching', 'E-books and premium templates', 'Advanced Career Bot'],
        highlight: 'Increase profile views by 40%',
        cta: 'Subscribe',
        popular: true,
      },
      {
        name: 'Pro',
        tagline: 'To accelerate your evolution',
        price: '39.00',
        period: '/mo',
        features: ['Everything in Growth + full access', 'Unlimited analyses', 'Feed with salary estimates', 'Priority processing', 'Early access to new features'],
        highlight: 'Jobs with salaries 15% above average',
        cta: 'Subscribe',
        popular: false,
      },
    ],
    plansBilling: 'Semi-annual -17% · Annual -33%',
    testimonialsTag: 'Testimonials',
    testimonialsTitle: 'What our members say',
    testimonials: [
      { name: 'Ana M.', role: 'Senior Manager', text: 'I went from 45 to 82 ATS points in 10 minutes. Absolutely essential for anyone looking for a job today.', stars: 5 },
      { name: 'Diogo S.', role: 'Software Engineer', text: 'The LinkedIn Roaster gave me feedback I had never received. My profile is much stronger and getting more views.', stars: 5 },
      { name: 'Mariana C.', role: 'Product Manager', text: 'Finally a tool that tells me exactly what recruiters want to see. The CV Analyser is a game-changer.', stars: 5 },
    ],
    ctaTitle: 'Ready to take the next step?',
    ctaSubtitle: 'Join over 100 members already using Share2Inspire tools.',
    ctaButton: 'Create free account',
    ctaNote: 'No credit card · Cancel anytime',
    langSwitch: 'PT',
  },
};

const iconMap: Record<string, React.ElementType> = {
  FileText, BarChart3, Target, Brain, Briefcase, Lock, Award, TrendingUp, Zap, Chrome, BookOpen, Video, Newspaper, MapPin, Search, Bell, Bookmark,
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
  const [expandedFeat, setExpandedFeat] = useState<number | null>(null);
  const t = i18n[lang];

  const toggleLang = () => {
    const next = lang === 'pt' ? 'en' : 'pt';
    setLang(next);
    localStorage.setItem('s2i-lang', next);
  };

  const basePath = window.location.pathname.startsWith('/area-cliente') ? '/area-cliente' : '';
  const { openLoginModal } = useLoginModal();

  return (
    <div className="bg-[#FAFAF9] text-[#1a1a1a] font-[Poppins,sans-serif] overflow-x-hidden">

      {/* ─── Hero ─── */}
      <section className="relative py-20 sm:py-28 lg:py-36">
        <div className="absolute inset-0 bg-gradient-to-br from-[#faf8f3] via-[#FAFAF9] to-[#f5f0e8]" />
        <div className="absolute top-20 right-0 w-96 h-[55px]6 bg-[#C9A961]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#C9A961]/8 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A961]/10 text-[#C9A961] text-xs font-semibold tracking-wide uppercase mb-6">
                <Lock className="w-3.5 h-3.5" /> {t.heroTag}
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-[#1a1a1a] mb-6">
                {t.heroTitle}
              </h1>
              <p className="text-lg sm:text-xl text-[#666] leading-relaxed mb-8 max-w-2xl">
                {t.heroSubtitle}
              </p>
              <div className="flex flex-wrap gap-3 mb-12">
                <button onClick={openLoginModal} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#C9A961] to-[#D4B96E] text-white font-semibold text-sm shadow-lg shadow-[#C9A961]/20 hover:shadow-xl hover:shadow-[#C9A961]/30 transition-all hover:-translate-y-0.5 cursor-pointer">
                  {t.heroCta} <ArrowRight className="w-4 h-4" />
                </button>
                <a href="#plans" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-[#e5e5e0] text-[#555] font-semibold text-sm hover:bg-[#f5f5f0] transition-all">
                  {t.heroCtaSecondary} <ChevronDown className="w-4 h-4" />
                </a>
              </div>
              <div className="flex flex-wrap gap-8 sm:gap-12">
                {[
                  { val: t.heroStat1, label: t.heroStat1Label, icon: Users },
                  { val: t.heroStat2, label: t.heroStat2Label, icon: TrendingUp },
                  { val: t.heroStat3, label: t.heroStat3Label, icon: Zap },
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

      {/* ─── Benefits (Why become a member) ─── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A961]/10 text-[#C9A961] text-xs font-semibold tracking-wide uppercase mb-4">
                {t.benefitsTag}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a] mb-4">{t.benefitsTitle}</h2>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {t.benefits.map((b, i) => {
              const Icon = iconMap[b.icon] || Lock;
              return (
                <FadeIn key={i} delay={i * 100}>
                  <div className="bg-[#FAFAF9] rounded-2xl p-6 border border-[#e5e5e0] hover:shadow-md transition-shadow text-center">
                    <div className="w-12 h-12 rounded-xl bg-[#C9A961]/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-[#C9A961]" />
                    </div>
                    <h3 className="font-semibold text-sm text-[#1a1a1a] mb-2">{b.title}</h3>
                    <p className="text-xs text-[#666] leading-relaxed">{b.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Features — Expandable Cards (NO screenshots) ─── */}
      <section id="features" className="py-20 sm:py-28 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A961]/10 text-[#C9A961] text-xs font-semibold tracking-wide uppercase mb-4">
                {t.featuresTag}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a] mb-4">{t.featuresTitle}</h2>
              <p className="text-[#666] text-lg max-w-2xl mx-auto">{t.featuresSubtitle}</p>
            </div>
          </FadeIn>

          <div className="max-w-4xl mx-auto space-y-4">
            {t.features.map((f, i) => {
              const Icon = iconMap[f.icon] || FileText;
              const isOpen = expandedFeat === i;
              return (
                <FadeIn key={i} delay={i * 80}>
                  <div className={`rounded-2xl border transition-all duration-300 ${isOpen ? 'bg-white border-[#C9A961]/30 shadow-lg' : 'bg-white border-[#e5e5e0] hover:shadow-md'}`}>
                    <button
                      onClick={() => setExpandedFeat(isOpen ? null : i)}
                      className="w-full text-left p-6 flex items-start gap-4"
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isOpen ? 'bg-[#C9A961] text-white' : 'bg-[#C9A961]/10 text-[#C9A961]'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-base text-[#1a1a1a]">{f.name}</h3>
                          <ChevronDown className={`w-5 h-5 text-[#999] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                        <p className="text-sm text-[#666] mt-1">{f.desc}</p>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6 pt-0">
                        <div className="ml-15 pl-4 border-l-2 border-[#C9A961]/20">
                          <ul className="space-y-3">
                            {f.details.map((d, di) => (
                              <li key={di} className="flex items-start gap-2.5 text-sm text-[#555]">
                                <Check className="w-4 h-4 text-[#C9A961] shrink-0 mt-0.5" />
                                {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Chrome Extension & Job Tracking ─── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A961]/10 text-[#C9A961] text-xs font-semibold tracking-wide uppercase mb-4">
                {t.extensionTag}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a] mb-4">{t.extensionTitle}</h2>
              <p className="text-[#666] text-lg max-w-2xl mx-auto">{t.extensionSubtitle}</p>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {t.extensionSpecs.map((spec, i) => {
              const Icon = iconMap[spec.icon] || Chrome;
              return (
                <FadeIn key={i} delay={i * 100}>
                  <div className="bg-[#FAFAF9] rounded-2xl p-6 border border-[#e5e5e0] hover:shadow-md hover:border-[#C9A961]/20 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-[#C9A961]/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-[#C9A961]" />
                    </div>
                    <h3 className="font-semibold text-sm text-[#1a1a1a] mb-2">{spec.title}</h3>
                    <p className="text-xs text-[#666] leading-relaxed">{spec.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Resources (E-books, Videos, Articles) ─── */}
      <section className="py-16 sm:py-20 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A961]/10 text-[#C9A961] text-xs font-semibold tracking-wide uppercase mb-4">
                {t.resourcesTag}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a] mb-4">{t.resourcesTitle}</h2>
              <p className="text-[#666] text-lg max-w-2xl mx-auto">{t.resourcesSubtitle}</p>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {t.resources.map((res, i) => {
              const Icon = iconMap[res.icon] || BookOpen;
              return (
                <FadeIn key={i} delay={i * 120}>
                  <div className="bg-white rounded-2xl p-8 border border-[#e5e5e0] hover:shadow-lg hover:border-[#C9A961]/20 transition-all text-center group">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C9A961]/15 to-[#C9A961]/5 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform">
                      <Icon className="w-7 h-7 text-[#C9A961]" />
                    </div>
                    <div className="text-2xl font-bold text-[#C9A961] mb-1">{res.count}</div>
                    <h3 className="font-bold text-base text-[#1a1a1a] mb-3">{res.title}</h3>
                    <p className="text-xs text-[#666] leading-relaxed">{res.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Comparison Table ─── */}
      <section id="comparison" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A961]/10 text-[#C9A961] text-xs font-semibold tracking-wide uppercase mb-4">
                {t.comparisonTag}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a] mb-4">{t.comparisonTitle}</h2>
              <p className="text-[#666] text-lg max-w-2xl mx-auto">{t.comparisonSubtitle}</p>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <div className="overflow-x-auto rounded-2xl border border-[#e5e5e0] bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e0]">
                    {t.compHeaders.map((h, i) => (
                      <th key={i} className={`px-4 py-4 text-left font-semibold ${
                        i === 1 ? 'bg-[#C9A961]/5 text-[#C9A961]' : 'text-[#999]'
                      } ${i === 0 ? 'min-w-[180px]' : 'min-w-[100px] text-center'}`}>
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
                        <td key={ci} className={`px-4 py-3 ${ci === 0 ? 'font-medium text-[#1a1a1a]' : 'text-center'} ${ci === 1 ? 'bg-[#C9A961]/5' : ''}`}>
                          {ci === 0 ? (
                            cell as string
                          ) : cell === true ? (
                            <Check className="w-4.5 h-4.5 text-emerald-500 mx-auto" />
                          ) : cell === false ? (
                            <X className="w-4.5 h-4.5 text-[#ccc] mx-auto" />
                          ) : (
                            <span className="text-xs text-[#999]">{cell as string}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Price row */}
                  <tr className="bg-[#faf8f3]">
                    {t.compPrice.map((p, i) => (
                      <td key={i} className={`px-4 py-4 font-bold ${
                        i === 0 ? 'text-[#1a1a1a]' : 'text-center'
                      } ${i === 1 ? 'bg-[#C9A961]/10 text-[#C9A961] text-lg' : 'text-[#666]'}`}>
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
      <section id="plans" className="py-20 sm:py-28 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A961]/10 text-[#C9A961] text-xs font-semibold tracking-wide uppercase mb-4">
                {t.plansTag}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a] mb-4">{t.plansTitle}</h2>
              <p className="text-[#666] text-lg">{t.plansSubtitle}</p>
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
                    href={`${basePath}/planos`}
                    className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                      plan.popular
                        ? 'bg-gradient-to-r from-[#C9A961] to-[#D4B96E] text-white shadow-lg shadow-[#C9A961]/20 hover:shadow-xl'
                        : 'border border-[#C9A961] text-[#C9A961] hover:bg-[#C9A961]/5'
                    }`}
                  >
                    {plan.cta} <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
                  </a>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A961]/10 text-[#C9A961] text-xs font-semibold tracking-wide uppercase mb-4">
                {t.testimonialsTag}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a] mb-4">{t.testimonialsTitle}</h2>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {t.testimonials.map((test, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="bg-[#FAFAF9] rounded-2xl p-6 border border-[#e5e5e0] shadow-sm hover:shadow-md transition-shadow">
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
      <section className="py-20 sm:py-28 bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t.ctaTitle}</h2>
            <p className="text-white/60 text-lg mb-8">{t.ctaSubtitle}</p>
            <button onClick={openLoginModal} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#C9A961] to-[#D4B96E] text-white font-semibold shadow-lg shadow-[#C9A961]/30 hover:shadow-xl hover:shadow-[#C9A961]/40 transition-all hover:-translate-y-0.5 cursor-pointer">
              {t.ctaButton} <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-white/40 text-xs mt-4">{t.ctaNote}</p>
          </FadeIn>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-8 bg-[#1a1a1a] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <img src={CDN.logo} alt="S2I" className="h-5 w-auto opacity-40" />
            Share2Inspire &copy; {new Date().getFullYear()}
          </div>
          <div className="flex gap-6 text-white/40 text-xs">
            <a href="https://share2inspire.pt/privacidade" className="hover:text-white/60 transition-colors">{lang === 'pt' ? 'Privacidade' : 'Privacy'}</a>
            <a href="https://share2inspire.pt/termos" className="hover:text-white/60 transition-colors">{lang === 'pt' ? 'Termos' : 'Terms'}</a>
            <a href="https://share2inspire.pt" className="hover:text-white/60 transition-colors">{lang === 'pt' ? 'Site principal' : 'Main site'}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
