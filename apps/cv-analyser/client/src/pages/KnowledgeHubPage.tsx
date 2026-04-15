// KnowledgeHubPage — Knowledge Hub Share2Inspire (PT/EN/ES unified)
// Sections: Hero, Artigos & Guias, Investigação & Dados, Vídeo, Podcast, E-book, Newsletter, Publicações Externas
import { useState } from "react";
import { Search, Play, ExternalLink, Download, BookOpen, Headphones, Mail } from "lucide-react";
import S2IHeader from "@/components/S2IHeader";
import S2IFooter from "@/components/S2IFooter";
import PromoBanner from "@/components/PromoBanner";
import useTranslation from "@/i18n/useTranslation";
import { usePageSEO } from "@/lib/seo";
import { pageSeo } from "@/lib/pageSeo";

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

const buildArticles = (pick: <T,>(pt: T, en: T, es: T) => T): Article[] => [
  // IA & Liderança
  {
    category: "carreira",
    tag: pick("IA & LIDERANÇA · PRODUTIVIDADE", "AI & LEADERSHIP · PRODUCTIVITY", "IA & LIDERAZGO · PRODUCTIVIDAD"),
    title: pick("O Paradoxo de Produtividade da IA: Porque a Liderança Humana é o Elo que Falta", "The AI Productivity Paradox: Why Human Leadership is the Missing Link", "La Paradoja de Productividad de la IA: Por Qué el Liderazgo Humano es el Eslabón Perdido"),
    excerpt: pick("As ferramentas de IA multiplicam a capacidade individual. Mas as organizações que mais investiram em IA não são as mais produtivas. O problema não é a tecnologia. É a liderança.", "AI tools multiply individual capacity. But the organisations that have invested most in AI are not the most productive. The problem is not the technology. It is leadership.", "Las herramientas de IA multiplican la capacidad individual. Pero las organizaciones que más invirtieron en IA no son las más productivas. El problema no es la tecnología. Es el liderazgo."),
    author: "Samuel Rolo",
    date: "Abr 2026",
    readTime: "12 min",
    link: "/blog/artigos/ai-productivity-paradox/",
    featured: true,
  },
  // Big4 & Consultoria
  {
    category: "big4",
    tag: pick("CONSULTORIA & BIG4 · ESTRATÉGIA 2026-2030", "CONSULTING & BIG4 · STRATEGY 2026-2030", "CONSULTORÍA & BIG4 · ESTRATEGIA 2026-2030"),
    title: pick("O Futuro da Consultoria nas Big4: Como te Posicionares para os Próximos 5 Anos", "The Future of Big4 Consulting: How to Position Yourself for the Next 5 Years", "El Futuro de la Consultoría en las Big4: Cómo Posicionarte para los Próximos 5 Años"),
    excerpt: pick("A consultoria está a mudar mais depressa do que as firmas admitem. IA, consolidação de mercado e novas exigências de perfil. O que tens de fazer hoje para seres relevante em 2030.", "Consulting is changing faster than firms publicly admit. AI, market consolidation and new profile demands. What you need to do today to remain relevant in 2030.", "La consultoría está cambiando más rápido de lo que las firmas admiten. IA, consolidación de mercado y nuevas exigencias de perfil. Lo que necesitas hacer hoy para ser relevante en 2030."),
    author: "Samuel Rolo",
    date: "Abr 2026",
    readTime: "14 min",
    link: "/blog/artigos/futuro-consultoria-big4-2030/",
    featured: true,
  },
  {
    category: "big4",
    tag: pick("BIG4 · ENTREVISTA FINAL", "BIG4 · FINAL INTERVIEW", "BIG4 · ENTREVISTA FINAL"),
    title: pick("A Entrevista com o Partner das Big 4 Já Não É o Que Pensas", "The Big 4 Partner Interview Is Not Testing What You Think", "La Entrevista con el Socio de las Big 4 No Evalúa lo que Crees"),
    excerpt: pick("A entrevista final não testa apenas fit cultural. Avalia pensamento crítico, empatia operacional, resiliência e o tipo de profissional que serás quando a pressão aumenta.", "The final interview is not just about cultural fit. It evaluates critical thinking, operational empathy, resilience and the kind of professional you become when pressure rises.", "La entrevista final no evalúa solo encaje cultural. Mide pensamiento crítico, empatía operativa, resiliencia y el tipo de profesional que serás cuando la presión aumente."),
    author: "Samuel Rolo",
    date: "Abr 2026",
    readTime: "8 min",
    link: pick("/blog/artigos/big4-entrevista-partner-comportamental/", "/en/blog/artigos/big4-partner-interview-behavioural/", "/es/blog/artigos/big4-entrevista-socio-comportamental/"),
  },
  {
    category: "big4",
    tag: pick("BIG4 · DECISÃO DE CARREIRA", "BIG4 · CAREER DECISION", "BIG4 · DECISIÓN DE CARRERA"),
    title: pick("Senior nas Big4: Ficar ou Sair? A Decisão que Define a Próxima Década", "Senior at Big4: Stay or Leave? The Decision That Defines the Next Decade", "Senior en las Big4: ¿Quedarse o Salir? La Decisión que Define la Próxima Década"),
    excerpt: pick("O que muda quando chegas a Senior, o que ganhas se progredires a Manager e o que perdes se ficares demasiado tempo parado.", "What changes when you reach Senior, what you gain if you progress to Manager, and what you lose if you stay too long.", "Qué cambia cuando llegas a Senior, qué ganas si progresas a Manager y qué pierdes si te quedas demasiado tiempo."),
    author: "Samuel Rolo",
    date: "25 Mar 2026",
    readTime: "12 min",
    link: "/blog/artigos/big4-senior-ficar-ou-sair/",
    featured: true,
  },
  {
    category: "big4",
    tag: pick("BIG4 · INSIDER", "BIG4 · INSIDER", "BIG4 · INSIDER"),
    title: pick("Big4 por Dentro: O que Ninguém te Conta Antes de Entrares", "Inside Big4: What Nobody Tells You Before You Join", "Big4 por Dentro: Lo que Nadie te Cuenta Antes de Entrar"),
    excerpt: pick("10 anos de experiência nas Big4 condensados num artigo. O que realmente acontece dentro das firmas.", "10 years of Big4 experience condensed into one article. What really happens inside the firms.", "10 años de experiencia en las Big4 condensados en un artículo. Lo que realmente pasa dentro de las firmas."),
    author: "Samuel Rolo",
    date: "24 Mar 2026",
    readTime: "14 min",
    link: "/blog/artigos/big4-insider-10-anos/",
  },
  {
    category: "big4",
    tag: pick("BIG4 · CARREIRA", "BIG4 · CAREER", "BIG4 · CARRERA"),
    title: pick("De Manager a Sénior Manager nas Big4: O Que Ninguém te Conta", "From Manager to Senior Manager at Big4: What Nobody Tells You", "De Manager a Senior Manager en las Big4: Lo que Nadie te Cuenta"),
    excerpt: pick("O que muda realmente quando passas de Manager para Sénior Manager. Responsabilidade, política interna e o peso invisível de liderar sem rede.", "What really changes when you move from Manager to Senior Manager. Responsibility, internal politics and the invisible weight of leading without a safety net.", "Qué cambia realmente cuando pasas de Manager a Senior Manager. Responsabilidad, política interna y el peso invisible de liderar sin red."),
    author: "Samuel Rolo",
    date: "28 Mar 2026",
    readTime: "12 min",
    link: "/blog/artigos/big4-manager-senior-manager-transicao/",
  },
  {
    category: "big4",
    tag: pick("CONSULTORIA & BIG4", "CONSULTING & BIG4", "CONSULTORÍA & BIG4"),
    title: pick("Recrutamento nas Big4: Guia Completo para Candidatos 2026", "Big4 Recruitment: Complete Guide for Candidates 2026", "Reclutamiento en las Big4: Guía Completa para Candidatos 2026"),
    excerpt: pick("Como entrar na Deloitte, PwC, EY ou KPMG. As 5 fases do processo, o que avaliam e erros a evitar.", "How to get into Deloitte, PwC, EY or KPMG. The 5 stages of the process, what they evaluate, and mistakes to avoid.", "Cómo entrar en Deloitte, PwC, EY o KPMG. Las 5 fases del proceso, qué evalúan y errores a evitar."),
    author: "Samuel Rolo",
    date: "19 Mar 2026",
    readTime: "12 min",
    link: "/blog/artigos/recrutamento-big4-guia-candidatos/",
  },
  {
    category: "big4",
    tag: pick("DESENVOLVIMENTO DE CARREIRA", "CAREER DEVELOPMENT", "DESARROLLO DE CARRERA"),
    title: pick("As Big4 como Escola de Aprendizagem", "Big4 as a School of Learning", "Las Big4 como Escuela de Aprendizaje"),
    excerpt: pick("Os 6 activos que formas nas Big4 e que nenhuma universidade te dá. O que realmente se aprende na Deloitte, PwC, EY e KPMG.", "The 6 assets you build at Big4 that no university gives you. What you really learn at Deloitte, PwC, EY and KPMG.", "Los 6 activos que formas en las Big4 y que ninguna universidad te da. Lo que realmente se aprende en Deloitte, PwC, EY y KPMG."),
    author: "Samuel Rolo",
    date: "20 Mar 2026",
    readTime: "12 min",
    link: "/blog/artigos/big4-escola-aprendizagem-carreira/",
  },
  // CV & Candidaturas
  {
    category: "cv",
    tag: pick("EMPREGABILIDADE 2026", "EMPLOYABILITY 2026", "EMPLEABILIDAD 2026"),
    title: pick("O Currículo Não é o Que Parece: 5 Lições sobre Empregabilidade Algorítmica", "The CV Is Not What It Seems: 5 Lessons on Algorithmic Employability", "El Currículum No Es Lo Que Parece: 5 Lecciones sobre Empleabilidad Algorítmica"),
    excerpt: pick("A empregabilidade moderna exige a passagem da perceção para os dados acionáveis.", "Modern employability requires moving from perception to actionable data.", "La empleabilidad moderna exige pasar de la percepción a los datos accionables."),
    author: "Samuel Rolo",
    readTime: "10 min",
    link: "/blog/artigos/guia-superar-ats-curriculo/",
    featured: true,
  },
  {
    category: "cv",
    tag: pick("LITERACIA ALGORÍTMICA", "ALGORITHMIC LITERACY", "LITERACIA ALGORÍTMICA"),
    title: pick("Guia Definitivo: Como Superar o ATS e Fazer o Teu Currículo Chegar ao Recrutador", "The Definitive Guide: How to Beat the ATS and Get Your CV to the Recruiter", "Guía Definitiva: Cómo Superar el ATS y Hacer que tu Currículum Llegue al Reclutador"),
    excerpt: pick("Estratégias práticas para ultrapassar os filtros automáticos que eliminam 75% dos CVs.", "Practical strategies to bypass the automated filters that eliminate 75% of CVs.", "Estrategias prácticas para superar los filtros automáticos que eliminan el 75% de los CVs."),
    author: "Samuel Rolo",
    readTime: "12 min",
    link: "/blog/artigos/guia-superar-ats-curriculo/",
  },
  {
    category: "cv",
    tag: pick("CV & CANDIDATURAS", "CV & APPLICATIONS", "CV & CANDIDATURAS"),
    title: pick("Como Transformar um CV Ignorado num CV que Gera Entrevistas", "How to Transform an Ignored CV into One That Generates Interviews", "Cómo Transformar un CV Ignorado en uno que Genera Entrevistas"),
    excerpt: pick("Técnicas comprovadas para tornar o teu currículo num íman de entrevistas.", "Proven techniques to turn your resume into an interview magnet.", "Técnicas comprobadas para convertir tu currículum en un imán de entrevistas."),
    author: "Samuel Rolo",
    readTime: "10 min",
    link: "/blog/artigos/transformar-cv-ignorado-gerar-entrevistas/",
  },
  {
    category: "cv",
    tag: pick("CV & CANDIDATURAS", "CV & APPLICATIONS", "CV & CANDIDATURAS"),
    title: pick("7 Erros no CV que Fazem Muitos Candidatos Serem Rejeitados", "7 CV Mistakes That Get Many Candidates Rejected", "7 Errores en el CV que Hacen que Muchos Candidatos Sean Rechazados"),
    excerpt: pick("Os erros mais comuns que sabotam candidaturas — e como corrigi-los rapidamente.", "The most common mistakes that sabotage applications — and how to fix them quickly.", "Los errores más comunes que sabotean candidaturas — y cómo corregirlos rápidamente."),
    author: "Samuel Rolo",
    readTime: "8 min",
    link: "/blog/artigos/7-erros-cv-candidatos-rejeitados/",
  },
  {
    category: "cv",
    tag: pick("ENTREVISTAS", "INTERVIEWS", "ENTREVISTAS"),
    title: pick("Entrevista Presencial vs. Remota: Guia Completo de Preparação", "In-Person vs. Remote Interview: Complete Preparation Guide", "Entrevista Presencial vs. Remota: Guía Completa de Preparación"),
    excerpt: pick("Como te preparares para ambos os formatos e maximizar as tuas hipóteses de sucesso.", "How to prepare for both formats and maximise your chances of success.", "Cómo prepararte para ambos formatos y maximizar tus posibilidades de éxito."),
    author: "Samuel Rolo",
    readTime: "10 min",
    link: "/blog/artigos/entrevista-presencial-vs-remota/",
  },
  {
    category: "cv",
    tag: pick("IA & CARREIRA", "AI & CAREER", "IA & CARRERA"),
    title: pick("AI Career Path vs Traditional Coaching: Why You're Overpaying", "AI Career Path vs Traditional Coaching: Why You're Overpaying", "AI Career Path vs Coaching Tradicional: Por Qué Estás Pagando de Más"),
    excerpt: pick("Comparação detalhada entre ferramentas de IA e coaching tradicional para decisões de carreira.", "Detailed comparison between AI tools and traditional coaching for career decisions.", "Comparación detallada entre herramientas de IA y coaching tradicional para decisiones de carrera."),
    author: "Samuel Rolo",
    readTime: "8 min",
    link: "/blog/artigos/ai-career-path-vs-traditional-coaching/",
  },
  // Salário & Negociação
  {
    category: "salario",
    tag: pick("NEGOCIAÇÃO SALARIAL", "SALARY NEGOTIATION", "NEGOCIACIÓN SALARIAL"),
    title: pick("Como Negociar Salário em Portugal: Guia Completo 2026", "How to Negotiate Salary in Portugal: Complete Guide 2026", "Cómo Negociar Salario en Portugal: Guía Completa 2026"),
    excerpt: pick("Quando pedir, o que dizer, como usar dados de mercado e os erros que custam dinheiro. Guia prático com scripts reais.", "When to ask, what to say, how to use market data, and the mistakes that cost you money. Practical guide with real scripts.", "Cuándo pedir, qué decir, cómo usar datos de mercado y los errores que cuestan dinero. Guía práctica con scripts reales."),
    author: "Samuel Rolo",
    readTime: "9 min",
    link: "/blog/artigos/como-negociar-salario-portugal/",
    featured: true,
  },
  // Desenvolvimento de Carreira
  {
    category: "carreira",
    tag: pick("AVALIAÇÃO DE CARREIRA", "CAREER ASSESSMENT", "EVALUACIÓN DE CARRERA"),
    title: pick("Como Saber se Estás Bem Posicionado no Mercado de Trabalho", "How to Know if You're Well Positioned in the Job Market", "Cómo Saber si Estás Bien Posicionado en el Mercado Laboral"),
    excerpt: pick("Indicadores, benchmarks e clareza sobre os próximos passos da tua carreira.", "Indicators, benchmarks and clarity on the next steps of your career.", "Indicadores, benchmarks y claridad sobre los próximos pasos de tu carrera."),
    author: "Samuel Rolo",
    readTime: "8 min",
    link: "/blog/artigos/posicionamento-mercado/",
    featured: true,
  },
  {
    category: "carreira",
    tag: pick("VISIBILIDADE ONLINE", "ONLINE VISIBILITY", "VISIBILIDAD ONLINE"),
    title: pick("CV ou LinkedIn: Qual é Mais Importante para a Tua Carreira?", "CV or LinkedIn: Which Is More Important for Your Career?", "CV o LinkedIn: ¿Cuál es Más Importante para tu Carrera?"),
    excerpt: pick("Análise comparativa dos dois pilares da tua presença profissional.", "Comparative analysis of the two pillars of your professional presence.", "Análisis comparativo de los dos pilares de tu presencia profesional."),
    author: "Samuel Rolo",
    readTime: "8 min",
    link: "/blog/artigos/cv-linkedin-importancia/",
  },
  {
    category: "carreira",
    tag: pick("VISIBILIDADE ONLINE", "ONLINE VISIBILITY", "VISIBILIDAD ONLINE"),
    title: pick("Como Melhorar o Teu LinkedIn para Aparecer nas Pesquisas de Recrutadores", "How to Improve Your LinkedIn to Appear in Recruiter Searches", "Cómo Mejorar tu LinkedIn para Aparecer en las Búsquedas de Reclutadores"),
    excerpt: pick("Pequenos ajustes no perfil que podem aumentar significativamente a tua visibilidade.", "Small profile adjustments that can significantly increase your visibility.", "Pequeños ajustes en el perfil que pueden aumentar significativamente tu visibilidad."),
    author: "Samuel Rolo",
    readTime: "9 min",
    link: "/blog/artigos/melhorar-linkedin-pesquisas/",
  },
];

interface VideoItem {
  id: string;
  badge?: string;
  title: string;
  desc: string;
  guideLink: string;
  guideLabel: string;
  ytLink: string;
  featured?: boolean;
}

const buildVideos = (pick: <T,>(pt: T, en: T, es: T) => T): VideoItem[] => [
  {
    id: "Tribuqg2Hzk",
    badge: pick("NOVO VÍDEO", "NEW VIDEO", "NUEVO VÍDEO"),
    title: pick("O Paradoxo de Produtividade da IA: Porque a Liderança Humana é o Elo que Falta", "The AI Productivity Paradox: Why Human Leadership is the Missing Link", "La Paradoja de Productividad de la IA: Por Qué el Liderazgo Humano es el Eslabón Perdido"),
    desc: pick("As ferramentas de IA multiplicam a capacidade individual. Mas as organizações que mais investiram em IA não são as mais produtivas. O problema não é a tecnologia. É a liderança.", "AI tools multiply individual capacity. But the organisations that have invested most in AI are not the most productive. The problem is not the technology. It is leadership.", "Las herramientas de IA multiplican la capacidad individual. Pero las organizaciones que más invirtieron en IA no son las más productivas. El problema no es la tecnología. Es el liderazgo."),
    guideLink: "/blog/artigos/ai-productivity-paradox/",
    guideLabel: pick("LER ARTIGO COMPLETO →", "READ FULL ARTICLE →", "LEER ARTÍCULO COMPLETO →"),
    ytLink: "https://www.youtube.com/watch?v=Tribuqg2Hzk",
    featured: true,
  },
  {
    id: "cFw11WRjuxM",
    badge: pick("NOVO VÍDEO", "NEW VIDEO", "NUEVO VÍDEO"),
    title: pick("O Futuro da Consultoria nas Big4: Sobreviver à Era da IA", "The Future of Big4 Consulting: Surviving the AI Era", "El Futuro de la Consultoría en las Big4: Sobrevivir a la Era de la IA"),
    desc: pick("A IA está a redefinir o trabalho do consultor. Quais os perfis que vão crescer, quais os que vão desaparecer e o que tens de fazer hoje para seres relevante em 2030. Uma análise honesta do mercado de consultoria nas Big4.", "AI is redefining the consultant's work. Which profiles will grow, which will disappear, and what you need to do today to remain relevant in 2030. An honest analysis of the Big4 consulting market.", "La IA está redefiniendo el trabajo del consultor. Qué perfiles crecerán, cuáles desaparecerán y qué necesitas hacer hoy para ser relevante en 2030. Un análisis honesto del mercado de consultoría en las Big4."),
    guideLink: "/blog/artigos/futuro-consultoria-big4-2030/",
    guideLabel: pick("LER ARTIGO COMPLETO →", "READ FULL ARTICLE →", "LEER ARTÍCULO COMPLETO →"),
    ytLink: "https://www.youtube.com/watch?v=cFw11WRjuxM",
    featured: true,
  },
  {
    id: "Zt_0M_VGYso",
    badge: pick("NOVO VÍDEO", "NEW VIDEO", "NUEVO VÍDEO"),
    title: pick("A Entrevista com o Partner das Big 4 Já Não É o Que Pensas", "The Big 4 Partner Interview Is Not Testing What You Think", "La Entrevista con el Socio de las Big 4 No Evalúa lo que Crees"),
    desc: pick("O vídeo está em inglês, mas foi integrado nas três versões do artigo. Explica os sinais comportamentais que os partners avaliam na entrevista final e como demonstrar julgamento sob pressão.", "This video is in English, but it is embedded in all three article versions. It explains the behavioural signals partners assess in the final interview and how to demonstrate judgment under pressure.", "El vídeo está en inglés, pero está integrado en las tres versiones del artículo. Explica las señales conductuales que los partners evalúan en la entrevista final y cómo demostrar criterio bajo presión."),
    guideLink: pick("/blog/artigos/big4-entrevista-partner-comportamental/", "/en/blog/artigos/big4-partner-interview-behavioural/", "/es/blog/artigos/big4-entrevista-socio-comportamental/"),
    guideLabel: pick("LER ARTIGO COMPLETO →", "READ FULL ARTICLE →", "LEER ARTÍCULO COMPLETO →"),
    ytLink: "https://www.youtube.com/watch?v=Zt_0M_VGYso",
  },
  {
    id: "LhLmgE1noC8",
    badge: pick("NOVO VÍDEO", "NEW VIDEO", "NUEVO VÍDEO"),
    title: pick("Como Vencer o Filtro ATS: Guia Definitivo", "How to Beat the ATS Filter: The Definitive Guide", "Cómo Vencer el Filtro ATS: Guía Definitiva"),
    desc: pick("75% dos currículos são rejeitados automaticamente por software. Descobre o processo passo a passo para otimizar o teu CV, LinkedIn e carta de apresentação para passar nos filtros digitais e conseguir mais entrevistas.", "75% of CVs are automatically rejected by software. Discover the step-by-step process to optimise your CV, LinkedIn and cover letter to pass digital filters and get more interviews.", "El 75% de los currículums son rechazados automáticamente por software. Descubre el proceso paso a paso para optimizar tu CV, LinkedIn y carta de presentación para pasar los filtros digitales y conseguir más entrevistas."),
    guideLink: "https://www.youtube.com/watch?v=LhLmgE1noC8",
    guideLabel: pick("VER GUIA COMPLETO →", "VIEW COMPLETE GUIDE →", "VER GUÍA COMPLETA →"),
    ytLink: "https://www.youtube.com/watch?v=LhLmgE1noC8",
  },
  {
    id: "6coJJF79Cy0",
    title: pick("Como Criar um CV Compatível com ATS em 2026", "How to Create an ATS-Compatible CV in 2026", "Cómo Crear un CV Compatible con ATS en 2026"),
    desc: pick("Candidatas-te a empregos e nunca tens resposta? Aprende a criar um currículo que passa nos filtros automáticos e chega às mãos certas.", "Applying for jobs and never hearing back? Learn how to create a CV that passes automated filters and reaches the right hands.", "¿Te postulas a empleos y nunca recibes respuesta? Aprende a crear un currículum que pase los filtros automáticos y llegue a las manos correctas."),
    guideLink: "https://www.youtube.com/watch?v=6coJJF79Cy0",
    guideLabel: pick("COMO CRIAR CV ATS FRIENDLY →", "HOW TO CREATE ATS FRIENDLY CV →", "CÓMO CREAR CV ATS FRIENDLY →"),
    ytLink: "https://www.youtube.com/watch?v=6coJJF79Cy0",
  },
  {
    id: "yU_tJV1Ap94",
    badge: pick("NOVO VÍDEO", "NEW VIDEO", "NUEVO VÍDEO"),
    title: pick("O Segredo para Maximizar o ROI Pós-Big4: 5 Anos Podem Mudar a Tua Vida?", "The Secret to Maximising Post-Big4 ROI: Can 5 Years Change Your Life?", "El Secreto para Maximizar el ROI Post-Big4: ¿5 Años Pueden Cambiar tu Vida?"),
    desc: pick("Já te perguntaste se o sacrifício de 5 anos nas Big4 realmente vale a pena? Analisamos o ROI real: progressão salarial, horas intermináveis, rede de contactos e custo de oportunidade. Quando sair e como maximizar o teu valor.", "Ever wondered if the sacrifice of 5 years at Big4 is really worth it? We analyse the real ROI: salary progression, endless hours, contact network and opportunity cost. When to leave and how to maximise your value.", "¿Alguna vez te preguntaste si el sacrificio de 5 años en las Big4 realmente vale la pena? Analizamos el ROI real: progresión salarial, horas interminables, red de contactos y costo de oportunidad. Cuándo salir y cómo maximizar tu valor."),
    guideLink: "https://www.youtube.com/watch?v=yU_tJV1Ap94",
    guideLabel: pick("VER GUIA COMPLETO →", "VIEW COMPLETE GUIDE →", "VER GUÍA COMPLETA →"),
    ytLink: "https://www.youtube.com/watch?v=yU_tJV1Ap94",
  },
  {
    id: "teIBWJiSEFU",
    badge: pick("NOVO VÍDEO", "NEW VIDEO", "NUEVO VÍDEO"),
    title: pick("Como Entrar nas Big 4 (Deloitte, PwC, EY, KPMG): Guia Definitivo", "How to Get Into the Big 4 (Deloitte, PwC, EY, KPMG): The Definitive Guide", "Cómo Entrar en las Big 4 (Deloitte, PwC, EY, KPMG): Guía Definitiva"),
    desc: pick("A taxa de aceitação nas Big 4 é apenas de 2–6%. Vê o playbook completo de 5 fases — desde o CV ATS até à entrevista com partner — para conseguires emprego na Deloitte, PwC, EY ou KPMG.", "The acceptance rate at Big 4 is only 2–6%. See the complete 5-phase playbook — from ATS CV to partner interview — to land a job at Deloitte, PwC, EY or KPMG.", "La tasa de aceptación en las Big 4 es solo del 2–6%. Ve el playbook completo de 5 fases — desde el CV ATS hasta la entrevista con partner — para conseguir empleo en Deloitte, PwC, EY o KPMG."),
    guideLink: "https://www.youtube.com/watch?v=teIBWJiSEFU",
    guideLabel: pick("VER GUIA COMPLETO (EN) →", "VIEW COMPLETE GUIDE (EN) →", "VER GUÍA COMPLETA (EN) →"),
    ytLink: "https://www.youtube.com/watch?v=teIBWJiSEFU",
  },
  {
    id: "T1AKsHV_Vf0",
    badge: pick("MAIS RECENTE", "LATEST", "MÁS RECIENTE"),
    title: pick("Porque é que os Melhores Managers Falham na Promoção?", "Why the Best Managers Fail at Promotion?", "¿Por Qué los Mejores Managers Fallan en la Promoción?"),
    desc: pick("As competências que te levaram a Manager não são as mesmas que te farão ter sucesso como Sénior Manager. Descobre o que muda realmente nesta transição crítica e como navegar a complexidade política e estratégica do próximo nível.", "The skills that got you to Manager are not the same ones that will make you succeed as Senior Manager. Discover what really changes in this critical transition and how to navigate the political and strategic complexity of the next level.", "Las competencias que te llevaron a Manager no son las mismas que te harán tener éxito como Senior Manager. Descubre qué cambia realmente en esta transición crítica y cómo navegar la complejidad política y estratégica del próximo nivel."),
    guideLink: "https://www.youtube.com/watch?v=T1AKsHV_Vf0",
    guideLabel: pick("VER GUIA COMPLETO →", "VIEW COMPLETE GUIDE →", "VER GUÍA COMPLETA →"),
    ytLink: "https://www.youtube.com/watch?v=T1AKsHV_Vf0",
  },
];

/* ─── COMPONENT ─── */

export default function KnowledgeHubPage() {
  const { pick, lang } = useTranslation();

  const articles = buildArticles(pick);

  const videos = buildVideos(pick);

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
              aria-label={pick('Pesquisar artigos, guias e vídeos', 'Search articles, guides and videos', 'Buscar artículos, guías y vídeos')}
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
                  href="/blog/artigos/estado-linkedin-portugal-2026/"
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

      {/* ─── VÍDEO — NETFLIX LAYOUT ─── */}
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

          {/* ── FEATURED / HERO VIDEOS (large cards) ── */}
          <div className="space-y-8 mb-12">
            {videos.filter(v => v.featured).map((video, idx) => (
              <div key={idx} className="bg-[#f9f7f4] rounded-xl overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-3/5 flex-shrink-0">
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
                        aria-label={`${pick("Reproduzir", "Play", "Reproducir")}: ${video.title}`}
                      >
                        <img
                          src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                          alt={video.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                            <Play className="w-7 h-7 text-[#1a1a2e] ml-1" />
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                  <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                    {video.badge && (
                      <div className="text-xs font-semibold tracking-widest uppercase text-[#C9A961] mb-3">
                        {video.badge}
                      </div>
                    )}
                    <h3 className="text-xl md:text-2xl font-semibold text-[#1a1a2e] mb-3">
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
                        {pick("VER NO YOUTUBE →", "VIEW ON YOUTUBE →", "VER EN YOUTUBE →")}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── REMAINING VIDEOS (smaller thumbnail grid) ── */}
          {videos.filter(v => !v.featured).length > 0 && (
            <>
              <h3 className="text-xl font-semibold text-[#1a1a2e] mb-6">
                {pick("Mais vídeos", "More videos", "Más vídeos")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.filter(v => !v.featured).map((video, idx) => (
                  <div key={idx} className="bg-[#f9f7f4] rounded-xl overflow-hidden group hover:shadow-md transition-shadow">
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
                        className="relative w-full"
                        style={{ paddingBottom: "56.25%", display: "block" }}
                        aria-label={`${pick("Reproduzir", "Play", "Reproducir")}: ${video.title}`}
                      >
                        <img
                          src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                          alt={video.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                            <Play className="w-5 h-5 text-[#1a1a2e] ml-0.5" />
                          </div>
                        </div>
                      </button>
                    )}
                    <div className="p-4">
                      {video.badge && (
                        <div className="text-[10px] font-semibold tracking-widest uppercase text-[#C9A961] mb-2">
                          {video.badge}
                        </div>
                      )}
                      <h4 className="text-sm font-semibold text-[#1a1a2e] mb-2 line-clamp-2">
                        {video.title}
                      </h4>
                      <div className="flex gap-2">
                        <a
                          href={video.ytLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-semibold tracking-wide text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-400 transition-colors flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          YouTube
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
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
                aria-label={pick('Nome para subscrição da newsletter', 'Name for newsletter subscription', 'Nombre para la suscripción a la newsletter')}
                placeholder={pick("Nome", "Name", "Nombre")}
                value={subscriberName}
              onChange={(e) => setSubscriberName(e.target.value)}
              className="px-4 py-3 rounded-lg text-sm bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A961] flex-1"
            />
              <input
                type="email"
                aria-label={pick('Email para subscrição da newsletter', 'Email for newsletter subscription', 'Email para la suscripción a la newsletter')}
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
