// KnowledgeHubPage — Knowledge Hub Share2Inspire (PT/EN/ES unified)
// Sections: Hero, Artigos & Guias, Investigação & Dados, Vídeo, Podcast, E-book, Newsletter, Publicações Externas
import { useState } from "react";
import { Search, Play, ExternalLink, Download, BookOpen, Headphones, Mail } from "lucide-react";
import S2IHeader from "@/components/S2IHeader";
import S2IFooter from "@/components/S2IFooter";
import PromoBanner from "@/components/PromoBanner";
import useTranslation from "@/i18n/useTranslation";

/* ─── DATA ─── */

type ArticleCategory = "todos" | "big4" | "cv" | "salario" | "carreira";

interface Article {
  category: ArticleCategory;
  tag: { pt: string; en: string; es: string };
  title: { pt: string; en: string; es: string };
  excerpt: { pt: string; en: string; es: string };
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
    tag: { pt: "CONSULTORIA & BIG4 · ESTRATÉGIA 2026-2030", en: "CONSULTING & BIG4 · STRATEGY 2026-2030", es: "CONSULTORÍA & BIG4 · ESTRATEGIA 2026-2030" },
    title: { pt: "O Futuro da Consultoria nas Big4: Como te Posicionares para os Próximos 5 Anos", en: "The Future of Big4 Consulting: How to Position Yourself for the Next 5 Years", es: "El Futuro de la Consultoría en las Big4: Cómo Posicionarte para los Próximos 5 Años" },
    excerpt: { pt: "A consultoria está a mudar mais depressa do que as firmas admitem. IA, consolidação de mercado e novas exigências de perfil. O que tens de fazer hoje para seres relevante em 2030.", en: "Consulting is changing faster than firms publicly admit. AI, market consolidation and new profile demands. What you need to do today to remain relevant in 2030.", es: "La consultoría está cambiando más rápido de lo que las firmas admiten. IA, consolidación de mercado y nuevas exigencias de perfil. Lo que necesitas hacer hoy para ser relevante en 2030." },
    author: "Samuel Rolo",
    date: "Abr 2026",
    readTime: "14 min",
    link: "/blog/artigos/futuro-consultoria-big4-2030.html",
    featured: true,
  },
  {
    category: "big4",
    tag: { pt: "BIG4 · DECISÃO DE CARREIRA", en: "BIG4 · CAREER DECISION", es: "BIG4 · DECISIÓN DE CARRERA" },
    title: { pt: "Senior nas Big4: Ficar ou Sair? A Decisão que Define a Próxima Década", en: "Senior at Big4: Stay or Leave? The Decision That Defines the Next Decade", es: "Senior en las Big4: ¿Quedarse o Salir? La Decisión que Define la Próxima Década" },
    excerpt: { pt: "O que muda quando chegas a Senior, o que ganhas se progredires a Manager e o que perdes se ficares demasiado tempo parado.", en: "What changes when you reach Senior, what you gain if you progress to Manager, and what you lose if you stay too long.", es: "Qué cambia cuando llegas a Senior, qué ganas si progresas a Manager y qué pierdes si te quedas demasiado tiempo." },
    author: "Samuel Rolo",
    date: "25 Mar 2026",
    readTime: "12 min",
    link: "/blog/artigos/big4-senior-ficar-ou-sair.html",
    featured: true,
  },
  {
    category: "big4",
    tag: { pt: "BIG4 · INSIDER", en: "BIG4 · INSIDER", es: "BIG4 · INSIDER" },
    title: { pt: "Big4 por Dentro: O que Ninguém te Conta Antes de Entrares", en: "Inside Big4: What Nobody Tells You Before You Join", es: "Big4 por Dentro: Lo que Nadie te Cuenta Antes de Entrar" },
    excerpt: { pt: "10 anos de experiência nas Big4 condensados num artigo. O que realmente acontece dentro das firmas.", en: "10 years of Big4 experience condensed into one article. What really happens inside the firms.", es: "10 años de experiencia en las Big4 condensados en un artículo. Lo que realmente pasa dentro de las firmas." },
    author: "Samuel Rolo",
    date: "24 Mar 2026",
    readTime: "14 min",
    link: "/blog/artigos/big4-insider-10-anos.html",
  },
  {
    category: "big4",
    tag: { pt: "BIG4 · CARREIRA", en: "BIG4 · CAREER", es: "BIG4 · CARRERA" },
    title: { pt: "De Manager a Sénior Manager nas Big4: O Que Ninguém te Conta", en: "From Manager to Senior Manager at Big4: What Nobody Tells You", es: "De Manager a Senior Manager en las Big4: Lo que Nadie te Cuenta" },
    excerpt: { pt: "O que muda realmente quando passas de Manager para Sénior Manager. Responsabilidade, política interna e o peso invisível de liderar sem rede.", en: "What really changes when you move from Manager to Senior Manager. Responsibility, internal politics and the invisible weight of leading without a safety net.", es: "Qué cambia realmente cuando pasas de Manager a Senior Manager. Responsabilidad, política interna y el peso invisible de liderar sin red." },
    author: "Samuel Rolo",
    date: "28 Mar 2026",
    readTime: "12 min",
    link: "/blog/artigos/big4-manager-senior-manager-transicao.html",
  },
  {
    category: "big4",
    tag: { pt: "CONSULTORIA & BIG4", en: "CONSULTING & BIG4", es: "CONSULTORÍA & BIG4" },
    title: { pt: "Recrutamento nas Big4: Guia Completo para Candidatos 2026", en: "Big4 Recruitment: Complete Guide for Candidates 2026", es: "Reclutamiento en las Big4: Guía Completa para Candidatos 2026" },
    excerpt: { pt: "Como entrar na Deloitte, PwC, EY ou KPMG. As 5 fases do processo, o que avaliam e erros a evitar.", en: "How to get into Deloitte, PwC, EY or KPMG. The 5 stages of the process, what they evaluate, and mistakes to avoid.", es: "Cómo entrar en Deloitte, PwC, EY o KPMG. Las 5 fases del proceso, qué evalúan y errores a evitar." },
    author: "Samuel Rolo",
    date: "19 Mar 2026",
    readTime: "12 min",
    link: "/blog/artigos/recrutamento-big4-guia-candidatos.html",
  },
  {
    category: "big4",
    tag: { pt: "DESENVOLVIMENTO DE CARREIRA", en: "CAREER DEVELOPMENT", es: "DESARROLLO DE CARRERA" },
    title: { pt: "As Big4 como Escola de Aprendizagem", en: "Big4 as a School of Learning", es: "Las Big4 como Escuela de Aprendizaje" },
    excerpt: { pt: "Os 6 activos que formas nas Big4 e que nenhuma universidade te dá. O que realmente se aprende na Deloitte, PwC, EY e KPMG.", en: "The 6 assets you build at Big4 that no university gives you. What you really learn at Deloitte, PwC, EY and KPMG.", es: "Los 6 activos que formas en las Big4 y que ninguna universidad te da. Lo que realmente se aprende en Deloitte, PwC, EY y KPMG." },
    author: "Samuel Rolo",
    date: "20 Mar 2026",
    readTime: "12 min",
    link: "/blog/artigos/big4-escola-aprendizagem-carreira.html",
  },
  // CV & Candidaturas
  {
    category: "cv",
    tag: { pt: "EMPREGABILIDADE 2026", en: "EMPLOYABILITY 2026", es: "EMPLEABILIDAD 2026" },
    title: { pt: "O Currículo Não é o Que Parece: 5 Lições sobre Empregabilidade Algorítmica", en: "The CV Is Not What It Seems: 5 Lessons on Algorithmic Employability", es: "El Currículum No Es Lo Que Parece: 5 Lecciones sobre Empleabilidad Algorítmica" },
    excerpt: { pt: "A empregabilidade moderna exige a passagem da perceção para os dados acionáveis.", en: "Modern employability requires moving from perception to actionable data.", es: "La empleabilidad moderna exige pasar de la percepción a los datos accionables." },
    author: "Samuel Rolo",
    readTime: "10 min",
    link: "/blog/artigos/guia-superar-ats-curriculo.html",
    featured: true,
  },
  {
    category: "cv",
    tag: { pt: "LITERACIA ALGORÍTMICA", en: "ALGORITHMIC LITERACY", es: "LITERACIA ALGORÍTMICA" },
    title: { pt: "Guia Definitivo: Como Superar o ATS e Fazer o Teu Currículo Chegar ao Recrutador", en: "The Definitive Guide: How to Beat the ATS and Get Your CV to the Recruiter", es: "Guía Definitiva: Cómo Superar el ATS y Hacer que tu Currículum Llegue al Reclutador" },
    excerpt: { pt: "Estratégias práticas para ultrapassar os filtros automáticos que eliminam 75% dos CVs.", en: "Practical strategies to bypass the automated filters that eliminate 75% of CVs.", es: "Estrategias prácticas para superar los filtros automáticos que eliminan el 75% de los CVs." },
    author: "Samuel Rolo",
    readTime: "12 min",
    link: "/blog/artigos/guia-superar-ats-curriculo.html",
  },
  {
    category: "cv",
    tag: { pt: "CV & CANDIDATURAS", en: "CV & APPLICATIONS", es: "CV & CANDIDATURAS" },
    title: { pt: "Como Transformar um CV Ignorado num CV que Gera Entrevistas", en: "How to Transform an Ignored CV into One That Generates Interviews", es: "Cómo Transformar un CV Ignorado en uno que Genera Entrevistas" },
    excerpt: { pt: "Técnicas comprovadas para tornar o teu currículo num íman de entrevistas.", en: "Proven techniques to turn your resume into an interview magnet.", es: "Técnicas comprobadas para convertir tu currículum en un imán de entrevistas." },
    author: "Samuel Rolo",
    readTime: "10 min",
    link: "/blog/artigos/transformar-cv-ignorado-gerar-entrevistas.html",
  },
  {
    category: "cv",
    tag: { pt: "CV & CANDIDATURAS", en: "CV & APPLICATIONS", es: "CV & CANDIDATURAS" },
    title: { pt: "7 Erros no CV que Fazem Muitos Candidatos Serem Rejeitados", en: "7 CV Mistakes That Get Many Candidates Rejected", es: "7 Errores en el CV que Hacen que Muchos Candidatos Sean Rechazados" },
    excerpt: { pt: "Os erros mais comuns que sabotam candidaturas — e como corrigi-los rapidamente.", en: "The most common mistakes that sabotage applications — and how to fix them quickly.", es: "Los errores más comunes que sabotean candidaturas — y cómo corregirlos rápidamente." },
    author: "Samuel Rolo",
    readTime: "8 min",
    link: "/blog/artigos/7-erros-cv-candidatos-rejeitados.html",
  },
  {
    category: "cv",
    tag: { pt: "ENTREVISTAS", en: "INTERVIEWS", es: "ENTREVISTAS" },
    title: { pt: "Entrevista Presencial vs. Remota: Guia Completo de Preparação", en: "In-Person vs. Remote Interview: Complete Preparation Guide", es: "Entrevista Presencial vs. Remota: Guía Completa de Preparación" },
    excerpt: { pt: "Como te preparares para ambos os formatos e maximizar as tuas hipóteses de sucesso.", en: "How to prepare for both formats and maximise your chances of success.", es: "Cómo prepararte para ambos formatos y maximizar tus posibilidades de éxito." },
    author: "Samuel Rolo",
    readTime: "10 min",
    link: "/blog/artigos/entrevista-presencial-vs-remota.html",
  },
  {
    category: "cv",
    tag: { pt: "IA & CARREIRA", en: "AI & CAREER", es: "IA & CARRERA" },
    title: { pt: "AI Career Path vs Traditional Coaching: Why You're Overpaying", en: "AI Career Path vs Traditional Coaching: Why You're Overpaying", es: "AI Career Path vs Coaching Tradicional: Por Qué Estás Pagando de Más" },
    excerpt: { pt: "Comparação detalhada entre ferramentas de IA e coaching tradicional para decisões de carreira.", en: "Detailed comparison between AI tools and traditional coaching for career decisions.", es: "Comparación detallada entre herramientas de IA y coaching tradicional para decisiones de carrera." },
    author: "Samuel Rolo",
    readTime: "8 min",
    link: "/blog/artigos/ai-career-path-vs-traditional-coaching.html",
  },
  // Salário & Negociação
  {
    category: "salario",
    tag: { pt: "NEGOCIAÇÃO SALARIAL", en: "SALARY NEGOTIATION", es: "NEGOCIACIÓN SALARIAL" },
    title: { pt: "Como Negociar Salário em Portugal: Guia Completo 2026", en: "How to Negotiate Salary in Portugal: Complete Guide 2026", es: "Cómo Negociar Salario en Portugal: Guía Completa 2026" },
    excerpt: { pt: "Quando pedir, o que dizer, como usar dados de mercado e os erros que custam dinheiro. Guia prático com scripts reais.", en: "When to ask, what to say, how to use market data, and the mistakes that cost you money. Practical guide with real scripts.", es: "Cuándo pedir, qué decir, cómo usar datos de mercado y los errores que cuestan dinero. Guía práctica con scripts reales." },
    author: "Samuel Rolo",
    readTime: "9 min",
    link: "/blog/artigos/como-negociar-salario-portugal.html",
    featured: true,
  },
  // Desenvolvimento de Carreira
  {
    category: "carreira",
    tag: { pt: "AVALIAÇÃO DE CARREIRA", en: "CAREER ASSESSMENT", es: "EVALUACIÓN DE CARRERA" },
    title: { pt: "Como Saber se Estás Bem Posicionado no Mercado de Trabalho", en: "How to Know if You're Well Positioned in the Job Market", es: "Cómo Saber si Estás Bien Posicionado en el Mercado Laboral" },
    excerpt: { pt: "Indicadores, benchmarks e clareza sobre os próximos passos da tua carreira.", en: "Indicators, benchmarks and clarity on the next steps of your career.", es: "Indicadores, benchmarks y claridad sobre los próximos pasos de tu carrera." },
    author: "Samuel Rolo",
    readTime: "8 min",
    link: "/blog/artigos/posicionamento-mercado.html",
    featured: true,
  },
  {
    category: "carreira",
    tag: { pt: "VISIBILIDADE ONLINE", en: "ONLINE VISIBILITY", es: "VISIBILIDAD ONLINE" },
    title: { pt: "CV ou LinkedIn: Qual é Mais Importante para a Tua Carreira?", en: "CV or LinkedIn: Which Is More Important for Your Career?", es: "CV o LinkedIn: ¿Cuál es Más Importante para tu Carrera?" },
    excerpt: { pt: "Análise comparativa dos dois pilares da tua presença profissional.", en: "Comparative analysis of the two pillars of your professional presence.", es: "Análisis comparativo de los dos pilares de tu presencia profesional." },
    author: "Samuel Rolo",
    readTime: "8 min",
    link: "/blog/artigos/cv-linkedin-importancia.html",
  },
  {
    category: "carreira",
    tag: { pt: "VISIBILIDADE ONLINE", en: "ONLINE VISIBILITY", es: "VISIBILIDAD ONLINE" },
    title: { pt: "Como Melhorar o Teu LinkedIn para Aparecer nas Pesquisas de Recrutadores", en: "How to Improve Your LinkedIn to Appear in Recruiter Searches", es: "Cómo Mejorar tu LinkedIn para Aparecer en las Búsquedas de Reclutadores" },
    excerpt: { pt: "Pequenos ajustes no perfil que podem aumentar significativamente a tua visibilidade.", en: "Small profile adjustments that can significantly increase your visibility.", es: "Pequeños ajustes en el perfil que pueden aumentar significativamente tu visibilidad." },
    author: "Samuel Rolo",
    readTime: "9 min",
    link: "/blog/artigos/melhorar-linkedin-pesquisas.html",
  },
];

interface VideoItem {
  id: string;
  badge?: { pt: string; en: string; es: string };
  title: { pt: string; en: string; es: string };
  desc: { pt: string; en: string; es: string };
  guideLink: string;
  guideLabel: { pt: string; en: string; es: string };
  ytLink: string;
}

const videos: VideoItem[] = [
  {
    id: "cFw11WRjuxM",
    badge: { pt: "NOVO VÍDEO", en: "NEW VIDEO", es: "NUEVO VÍDEO" },
    title: { pt: "O Futuro da Consultoria nas Big4: Sobreviver à Era da IA", en: "The Future of Big4 Consulting: Surviving the AI Era", es: "El Futuro de la Consultoría en las Big4: Sobrevivir a la Era de la IA" },
    desc: { pt: "A IA está a redefinir o trabalho do consultor. Quais os perfis que vão crescer, quais os que vão desaparecer e o que tens de fazer hoje para seres relevante em 2030. Uma análise honesta do mercado de consultoria nas Big4.", en: "AI is redefining the consultant's work. Which profiles will grow, which will disappear, and what you need to do today to remain relevant in 2030. An honest analysis of the Big4 consulting market.", es: "La IA está redefiniendo el trabajo del consultor. Qué perfiles crecerán, cuáles desaparecerán y qué necesitas hacer hoy para ser relevante en 2030. Un análisis honesto del mercado de consultoría en las Big4." },
    guideLink: "/blog/artigos/futuro-consultoria-big4-2030.html",
    guideLabel: { pt: "LER ARTIGO COMPLETO →", en: "READ FULL ARTICLE →", es: "LEER ARTÍCULO COMPLETO →" },
    ytLink: "https://www.youtube.com/watch?v=cFw11WRjuxM",
  },
  {
    id: "LhLmgE1noC8",
    badge: { pt: "NOVO VÍDEO", en: "NEW VIDEO", es: "NUEVO VÍDEO" },
    title: { pt: "Como Vencer o Filtro ATS: Guia Definitivo", en: "How to Beat the ATS Filter: The Definitive Guide", es: "Cómo Vencer el Filtro ATS: Guía Definitiva" },
    desc: { pt: "75% dos currículos são rejeitados automaticamente por software. Descobre o processo passo a passo para otimizar o teu CV, LinkedIn e carta de apresentação para passar nos filtros digitais e conseguir mais entrevistas.", en: "75% of CVs are automatically rejected by software. Discover the step-by-step process to optimise your CV, LinkedIn and cover letter to pass digital filters and get more interviews.", es: "El 75% de los currículums son rechazados automáticamente por software. Descubre el proceso paso a paso para optimizar tu CV, LinkedIn y carta de presentación para pasar los filtros digitales y conseguir más entrevistas." },
    guideLink: "https://www.youtube.com/watch?v=LhLmgE1noC8",
    guideLabel: { pt: "VER GUIA COMPLETO →", en: "VIEW COMPLETE GUIDE →", es: "VER GUÍA COMPLETA →" },
    ytLink: "https://www.youtube.com/watch?v=LhLmgE1noC8",
  },
  {
    id: "6coJJF79Cy0",
    title: { pt: "Como Criar um CV Compatível com ATS em 2026", en: "How to Create an ATS-Compatible CV in 2026", es: "Cómo Crear un CV Compatible con ATS en 2026" },
    desc: { pt: "Candidatas-te a empregos e nunca tens resposta? Aprende a criar um currículo que passa nos filtros automáticos e chega às mãos certas.", en: "Applying for jobs and never hearing back? Learn how to create a CV that passes automated filters and reaches the right hands.", es: "¿Te postulas a empleos y nunca recibes respuesta? Aprende a crear un currículum que pase los filtros automáticos y llegue a las manos correctas." },
    guideLink: "https://www.youtube.com/watch?v=6coJJF79Cy0",
    guideLabel: { pt: "COMO CRIAR CV ATS FRIENDLY →", en: "HOW TO CREATE ATS FRIENDLY CV →", es: "CÓMO CREAR CV ATS FRIENDLY →" },
    ytLink: "https://www.youtube.com/watch?v=6coJJF79Cy0",
  },
  {
    id: "yU_tJV1Ap94",
    badge: { pt: "NOVO VÍDEO", en: "NEW VIDEO", es: "NUEVO VÍDEO" },
    title: { pt: "O Segredo para Maximizar o ROI Pós-Big4: 5 Anos Podem Mudar a Tua Vida?", en: "The Secret to Maximising Post-Big4 ROI: Can 5 Years Change Your Life?", es: "El Secreto para Maximizar el ROI Post-Big4: ¿5 Años Pueden Cambiar tu Vida?" },
    desc: { pt: "Já te perguntaste se o sacrifício de 5 anos nas Big4 realmente vale a pena? Analisamos o ROI real: progressão salarial, horas intermináveis, rede de contactos e custo de oportunidade. Quando sair e como maximizar o teu valor.", en: "Ever wondered if the sacrifice of 5 years at Big4 is really worth it? We analyse the real ROI: salary progression, endless hours, contact network and opportunity cost. When to leave and how to maximise your value.", es: "¿Alguna vez te preguntaste si el sacrificio de 5 años en las Big4 realmente vale la pena? Analizamos el ROI real: progresión salarial, horas interminables, red de contactos y costo de oportunidad. Cuándo salir y cómo maximizar tu valor." },
    guideLink: "https://www.youtube.com/watch?v=yU_tJV1Ap94",
    guideLabel: { pt: "VER GUIA COMPLETO →", en: "VIEW COMPLETE GUIDE →", es: "VER GUÍA COMPLETA →" },
    ytLink: "https://www.youtube.com/watch?v=yU_tJV1Ap94",
  },
  {
    id: "teIBWJiSEFU",
    badge: { pt: "NOVO VÍDEO", en: "NEW VIDEO", es: "NUEVO VÍDEO" },
    title: { pt: "Como Entrar nas Big 4 (Deloitte, PwC, EY, KPMG): Guia Definitivo", en: "How to Get Into the Big 4 (Deloitte, PwC, EY, KPMG): The Definitive Guide", es: "Cómo Entrar en las Big 4 (Deloitte, PwC, EY, KPMG): Guía Definitiva" },
    desc: { pt: "A taxa de aceitação nas Big 4 é apenas de 2–6%. Vê o playbook completo de 5 fases — desde o CV ATS até à entrevista com partner — para conseguires emprego na Deloitte, PwC, EY ou KPMG.", en: "The acceptance rate at Big 4 is only 2–6%. See the complete 5-phase playbook — from ATS CV to partner interview — to land a job at Deloitte, PwC, EY or KPMG.", es: "La tasa de aceptación en las Big 4 es solo del 2–6%. Ve el playbook completo de 5 fases — desde el CV ATS hasta la entrevista con partner — para conseguir empleo en Deloitte, PwC, EY o KPMG." },
    guideLink: "https://www.youtube.com/watch?v=teIBWJiSEFU",
    guideLabel: { pt: "VER GUIA COMPLETO (EN) →", en: "VIEW COMPLETE GUIDE (EN) →", es: "VER GUÍA COMPLETA (EN) →" },
    ytLink: "https://www.youtube.com/watch?v=teIBWJiSEFU",
  },
  {
    id: "T1AKsHV_Vf0",
    badge: { pt: "MAIS RECENTE", en: "LATEST", es: "MÁS RECIENTE" },
    title: { pt: "Porque é que os Melhores Managers Falham na Promoção?", en: "Why the Best Managers Fail at Promotion?", es: "¿Por Qué los Mejores Managers Fallan en la Promoción?" },
    desc: { pt: "As competências que te levaram a Manager não são as mesmas que te farão ter sucesso como Sénior Manager. Descobre o que muda realmente nesta transição crítica e como navegar a complexidade política e estratégica do próximo nível.", en: "The skills that got you to Manager are not the same ones that will make you succeed as Senior Manager. Discover what really changes in this critical transition and how to navigate the political and strategic complexity of the next level.", es: "Las competencias que te llevaron a Manager no son las mismas que te harán tener éxito como Senior Manager. Descubre qué cambia realmente en esta transición crítica y cómo navegar la complejidad política y estratégica del próximo nivel." },
    guideLink: "https://www.youtube.com/watch?v=T1AKsHV_Vf0",
    guideLabel: { pt: "VER GUIA COMPLETO →", en: "VIEW COMPLETE GUIDE →", es: "VER GUÍA COMPLETA →" },
    ytLink: "https://www.youtube.com/watch?v=T1AKsHV_Vf0",
  },
];

/* ─── COMPONENT ─── */

export default function KnowledgeHubPage() {
  const { pick, lang } = useTranslation();

  // Helper to pick from {pt,en,es} objects
  const p = (obj: { pt: string; en: string; es: string }) => obj[lang] || obj.pt;

  const categoryLabels: { id: ArticleCategory; label: string }[] = [
    { id: "todos", label: pick("Todos", "All", "Todos") },
    { id: "big4", label: pick("Big4 & Consultoria", "Big4 & Consulting", "Big4 & Consultoría") },
    { id: "cv", label: pick("CV & Candidaturas", "CV & Applications", "CV & Candidaturas") },
    { id: "salario", label: pick("Salário & Negociação", "Salary & Negotiation", "Salario & Negociación") },
    { id: "carreira", label: pick("Desenvolvimento de Carreira", "Career Development", "Desarrollo de Carrera") },
  ];

  const categoryGroupLabels: Record<ArticleCategory, string> = {
    todos: pick("Todos", "All", "Todos"),
    big4: pick("Big4 & Consultoria", "Big4 & Consulting", "Big4 & Consultoría"),
    cv: pick("CV & Candidaturas", "CV & Applications", "CV & Candidaturas"),
    salario: pick("Salário & Negociação", "Salary & Negotiation", "Salario & Negociación"),
    carreira: pick("Desenvolvimento de Carreira", "Career Development", "Desarrollo de Carrera"),
  };

  const [activeCategory, setActiveCategory] = useState<ArticleCategory>("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [subscriberName, setSubscriberName] = useState("");
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const filteredArticles = articles.filter((a) => {
    const matchesCategory = activeCategory === "todos" || a.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      p(a.title).toLowerCase().includes(searchQuery.toLowerCase()) ||
      p(a.tag).toLowerCase().includes(searchQuery.toLowerCase()) ||
      p(a.excerpt).toLowerCase().includes(searchQuery.toLowerCase());
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
      <S2IHeader activePage="knowledge-hub" />
      <PromoBanner />

      {/* ─── HERO ─── */}
      <section className="pt-28 pb-10 text-center bg-[#f9f7f4]">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-light text-[#1a1a2e] mb-3">
            Knowledge <strong className="font-semibold">Hub</strong>
          </h1>
          <p className="text-base text-gray-500 mb-8">
            {pick(
              "Guias práticos, estratégias e insights para a tua carreira. Tudo num só lugar.",
              "Practical guides, strategies and insights for your career. All in one place.",
              "Guías prácticas, estrategias e insights para tu carrera. Todo en un solo lugar."
            )}
          </p>
          {/* Search */}
          <div className="relative max-w-xl mx-auto mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={pick("Procurar artigos, guias e vídeos...", "Search articles, guides and videos...", "Buscar artículos, guías y vídeos...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#C9A961] bg-white"
            />
          </div>
          {/* Nav tabs */}
          <nav className="flex flex-wrap justify-center gap-6 text-xs font-semibold tracking-widest uppercase text-gray-500">
            {[
              { id: "artigos", label: pick("Artigos", "Articles", "Artículos") },
              { id: "video", label: pick("Vídeo", "Video", "Vídeo") },
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
            {pick(
              <>Artigos &amp; <strong className="font-semibold">Guias</strong></>,
              <>Articles &amp; <strong className="font-semibold">Guides</strong></>,
              <>Artículos &amp; <strong className="font-semibold">Guías</strong></>
            )}
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
            <p className="text-gray-400 text-sm py-8 text-center">
              {pick(
                `Nenhum artigo encontrado para "${searchQuery}".`,
                `No articles found for "${searchQuery}".`,
                `Ningún artículo encontrado para "${searchQuery}".`
              )}
            </p>
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
                          {p(article.tag)}
                        </div>
                        <h3 className="text-xl md:text-2xl font-semibold text-white mb-3 group-hover:text-[#C9A961] transition-colors">
                          {p(article.title)}
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">{p(article.excerpt)}</p>
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
                          {p(article.tag)}
                        </div>
                        <h3 className="text-base font-semibold text-[#1a1a2e] mb-2 group-hover:text-[#C9A961] transition-colors">
                          {p(article.title)}
                        </h3>
                        <p className="text-sm text-gray-500 mb-3">{p(article.excerpt)}</p>
                        <div className="text-xs text-gray-400">
                          {article.author}
                          {article.date && <> · {article.date}</>}
                          {" · "}{article.readTime}
                        </div>
                        <div className="mt-3 text-xs font-semibold text-[#C9A961] tracking-wide">
                          {pick("LER ARTIGO →", "READ ARTICLE →", "LEER ARTÍCULO →")}
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
          <div className="mb-2 text-xs font-semibold tracking-widest uppercase text-[#C9A961]">{pick("Estudo", "Study", "Estudio")}</div>
          <h2 className="text-3xl font-light text-[#1a1a2e] mb-8">
            {pick(
              <>Investigação &amp; <strong className="font-semibold">Dados</strong></>,
              <>Research &amp; <strong className="font-semibold">Data</strong></>,
              <>Investigación &amp; <strong className="font-semibold">Datos</strong></>
            )}
          </h2>
          <div className="bg-[#1a1a2e] rounded-xl p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <div className="flex-1">
                <div className="text-xs font-semibold tracking-widest uppercase text-[#C9A961] mb-3">
                  {pick("ESTUDO Q1 2026", "STUDY Q1 2026", "ESTUDIO Q1 2026")}
                </div>
                <h3 className="text-2xl font-light text-white mb-3">
                  {pick(
                    <>O Estado do <span className="text-[#C9A961] font-semibold">LinkedIn</span> em Portugal</>,
                    <>The State of <span className="text-[#C9A961] font-semibold">LinkedIn</span> in Portugal</>,
                    <>El Estado de <span className="text-[#C9A961] font-semibold">LinkedIn</span> en Portugal</>
                  )}
                </h3>
                <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                  {pick(
                    "Uma análise a 500 perfis profissionais revela as oportunidades e os erros mais comuns que ditam o sucesso na maior rede profissional do mundo.",
                    "An analysis of 500 professional profiles reveals the opportunities and most common mistakes that dictate success on the world's largest professional network.",
                    "Un análisis de 500 perfiles profesionales revela las oportunidades y los errores más comunes que dictan el éxito en la mayor red profesional del mundo."
                  )}
                </p>
                <a
                  href="/blog/artigos/estado-linkedin-portugal-2026.html"
                  className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#C9A961] border border-[#C9A961]/30 px-5 py-2.5 rounded-lg hover:bg-[#C9A961]/10 transition-colors"
                >
                  {pick("VER ESTUDO COMPLETO →", "VIEW COMPLETE STUDY →", "VER ESTUDIO COMPLETO →")}
                </a>
              </div>
              <div className="flex flex-row md:flex-col gap-6 md:gap-8 md:text-right">
                <div>
                  <div className="text-3xl font-bold text-[#C9A961]">4.0/10</div>
                  <div className="text-xs text-gray-400 mt-1">{pick("Score médio nacional", "National average score", "Score medio nacional")}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#C9A961]">74%</div>
                  <div className="text-xs text-gray-400 mt-1">{pick("Perfis com score abaixo de 5", "Profiles with score below 5", "Perfiles con score por debajo de 5")}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#C9A961]">0.6%</div>
                  <div className="text-xs text-gray-400 mt-1">{pick("Perfis com score acima de 7", "Profiles with score above 7", "Perfiles con score por encima de 7")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── VÍDEO ─── */}
      <section id="video" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-2 text-xs font-semibold tracking-widest uppercase text-[#C9A961]">{pick("Vídeo", "Video", "Vídeo")}</div>
          <h2 className="text-3xl font-light text-[#1a1a2e] mb-8">
            {pick(
              <>Em <strong className="font-semibold">destaque</strong></>,
              <><strong className="font-semibold">Featured</strong> videos</>,
              <>En <strong className="font-semibold">destaque</strong></>
            )}
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
                          title={p(video.title)}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveVideo(video.id)}
                        className="relative w-full group"
                        style={{ paddingBottom: "56.25%", display: "block" }}
                        aria-label={`${pick("Reproduzir", "Play", "Reproducir")}: ${p(video.title)}`}
                      >
                        <img
                          src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                          alt={p(video.title)}
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
                        {p(video.badge)}
                      </div>
                    )}
                    <h3 className="text-lg md:text-xl font-semibold text-[#1a1a2e] mb-3">
                      {p(video.title)}
                    </h3>
                    <p className="text-sm text-gray-500 mb-5 leading-relaxed">{p(video.desc)}</p>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={video.guideLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold tracking-wide text-[#C9A961] border border-[#C9A961]/30 px-4 py-2 rounded-lg hover:bg-[#C9A961]/10 transition-colors"
                      >
                        {p(video.guideLabel)}
                      </a>
                      <a
                        href={video.ytLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold tracking-wide text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:border-gray-400 transition-colors flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {pick("VER NO YOUTUBE →", "VIEW ON YOUTUBE →", "VER EN YOUTUBE →")}
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
            {pick(
              <>Humanos e <strong className="font-semibold">Máquinas</strong></>,
              <>Humans &amp; <strong className="font-semibold">Machines</strong></>,
              <>Humanos y <strong className="font-semibold">Máquinas</strong></>
            )}
          </h2>
          <p className="text-sm text-gray-500 mb-8 max-w-2xl">
            {pick(
              "A interseção entre a inteligência artificial e a essência humana. Como manter a empatia e o pensamento crítico num mundo cada vez mais automatizado.",
              "The intersection between artificial intelligence and the human essence. How to maintain empathy and critical thinking in an increasingly automated world.",
              "La intersección entre la inteligencia artificial y la esencia humana. Cómo mantener la empatía y el pensamiento crítico en un mundo cada vez más automatizado."
            )}
          </p>
          <div className="rounded-xl overflow-hidden">
            <iframe
              src="https://open.spotify.com/embed/show/2P09p0F3HIR0jXRdCMPOSe?utm_source=generator&theme=0"
              width="100%"
              height="352"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title={pick("Podcast Humanos e Máquinas", "Podcast Humans and Machines", "Podcast Humanos y Máquinas")}
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
            {pick(
              <>Energia para <strong className="font-semibold text-[#C9A961]">Liderar</strong></>,
              <>Energy to <strong className="font-semibold text-[#C9A961]">Lead</strong></>,
              <>Energía para <strong className="font-semibold text-[#C9A961]">Liderar</strong></>
            )}
          </h2>
          <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-center">
            {/* Cover */}
            <div className="flex-shrink-0 text-center">
              <img
                src="/images/ebook-capa.webp"
                alt={pick("Capa do e-book Energia para Liderar", "Energy to Lead e-book cover", "Portada del e-book Energía para Liderar")}
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
                {pick(
                  <>Energia para <strong className="font-semibold">Liderar</strong></>,
                  <>Energy to <strong className="font-semibold">Lead</strong></>,
                  <>Energía para <strong className="font-semibold">Liderar</strong></>
                )}
              </h3>
              <p className="text-sm text-gray-400 mb-4">{pick("O Guia Prático de Performance Mental e Física", "The Practical Guide to Mental and Physical Performance", "La Guía Práctica de Rendimiento Mental y Físico")}</p>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                {pick(
                  "Um guia sobre as quatro dimensões da energia — física, mental, emocional e espiritual — para quem lidera e quer manter a performance de forma sustentável.",
                  "A guide on the four dimensions of energy — physical, mental, emotional and spiritual — for those who lead and want to sustain performance over time.",
                  "Una guía sobre las cuatro dimensiones de la energía — física, mental, emocional y espiritual — para quienes lideran y quieren mantener el rendimiento de forma sostenible."
                )}
              </p>
              <p className="text-xs text-gray-500 mb-6">
                {pick("Por", "By", "Por")} <strong className="text-white">Samuel Rolo</strong> &amp; <strong className="text-white">Marlene Ruivo</strong>
              </p>
              <div className="flex flex-col gap-3 max-w-sm">
                <a
                  href="https://go.hotmart.com/Q104764153P?dp=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#C9A961] border border-[#C9A961]/30 px-5 py-3 rounded-lg hover:bg-[#C9A961]/10 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {pick("DESCARREGAR PREVIEW →", "DOWNLOAD PREVIEW →", "DESCARGAR PREVIEW →")}
                </a>
                <a
                  href="https://go.hotmart.com/Q104764153P?dp=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase bg-[#C9A961] text-[#1a1a2e] px-5 py-3 rounded-lg hover:bg-[#d4af37] transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  {pick("COMPRAR E-BOOK COMPLETO (PT) →", "BUY COMPLETE E-BOOK (PT) →", "COMPRAR E-BOOK COMPLETO (PT) →")}
                </a>
                <p className="text-xs text-gray-600">{pick("Versão em inglês disponível brevemente.", "English version coming soon.", "Versión en inglés disponible próximamente.")}</p>
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
            {pick(
              "Reflexões sobre a interseção entre tecnologia, estratégia e humanidade. Insights práticos para quem desafia o status quo.",
              "Reflections on the intersection of technology, strategy and humanity. Practical insights for those who challenge the status quo.",
              "Reflexiones sobre la intersección entre tecnología, estrategia y humanidad. Insights prácticos para quienes desafían el status quo."
            )}
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
              placeholder={pick("Nome", "Name", "Nombre")}
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
              {pick("SUBSCREVER", "SUBSCRIBE", "SUSCRIBIRSE")}
            </button>
          </form>
          <p className="text-xs text-gray-500 mb-6">{pick("Os dados estão protegidos. Cancelamento a qualquer momento.", "Your data is protected. Cancel at any time.", "Tus datos están protegidos. Cancelación en cualquier momento.")}</p>
          <a
            href="https://www.linkedin.com/build-relation/newsletter-follow?entityUrn=7384145793324085248"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#C9A961] hover:underline"
          >
            <Mail className="w-3 h-3" />
            {pick("TAMBÉM NO LINKEDIN →", "ALSO ON LINKEDIN →", "TAMBIÉN EN LINKEDIN →")}
          </a>
        </div>
      </section>

      {/* ─── PUBLICAÇÕES EXTERNAS ─── */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-2 text-xs font-semibold tracking-widest uppercase text-[#C9A961]">{pick("Outras publicações", "Other publications", "Otras publicaciones")}</div>
          <h2 className="text-3xl font-light text-[#1a1a2e] mb-8">
            {pick(
              <>Publicações <strong className="font-semibold">externas</strong></>,
              <>External <strong className="font-semibold">publications</strong></>,
              <>Publicaciones <strong className="font-semibold">externas</strong></>
            )}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-100 rounded-xl p-6 hover:border-[#C9A961] hover:shadow-sm transition-all">
              <div className="text-xs font-semibold tracking-widest uppercase text-[#C9A961] mb-3">RH MAGAZINE</div>
              <h3 className="text-base font-semibold text-[#1a1a2e] mb-2">
                {pick("Mudam os Tempos, Mudam as Avaliações", "Times Change, Evaluations Change", "Cambian los Tiempos, Cambian las Evaluaciones")}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {pick(
                  "Uma reflexão sobre a evolução dos modelos de avaliação de desempenho e o que realmente importa na gestão de talento.",
                  "A reflection on the evolution of performance evaluation models and what really matters in talent management.",
                  "Una reflexión sobre la evolución de los modelos de evaluación de desempeño y lo que realmente importa en la gestión de talento."
                )}
              </p>
              <a
                href="https://rhmagazine.pt/mudam-os-tempos-mudam-as-avaliacoes/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold tracking-wide text-[#C9A961] hover:underline"
              >
                {pick("LER ARTIGO →", "READ ARTICLE →", "LEER ARTÍCULO →")}
              </a>
            </div>
            <div className="border border-gray-100 rounded-xl p-6 hover:border-[#C9A961] hover:shadow-sm transition-all">
              <div className="text-xs font-semibold tracking-widest uppercase text-[#C9A961] mb-3">DEZANOVE</div>
              <h3 className="text-base font-semibold text-[#1a1a2e] mb-2">
                {pick("Enquanto Houver Vento Há Sentimento", "While There Is Wind There Is Feeling", "Mientras Haya Viento Hay Sentimiento")}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {pick(
                  "Review do livro que explora uma história real de autodescoberta, identidade e resiliência através de várias fases da vida.",
                  "Review of the book that explores a true story of self-discovery, identity and resilience through various stages of life.",
                  "Review del libro que explora una historia real de autodescubrimiento, identidad y resiliencia a través de varias fases de la vida."
                )}
              </p>
              <a
                href="https://dezanove.pt/enquanto-houver-vento-ha-sentimento-de-samuel-rolo-2442105/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold tracking-wide text-[#C9A961] hover:underline"
              >
                {pick("LER REVIEW →", "READ REVIEW →", "LEER REVIEW →")}
              </a>
            </div>
          </div>
        </div>
      </section>

      <S2IFooter />
    </div>
  );
}
