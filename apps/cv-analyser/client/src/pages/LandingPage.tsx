// LandingPage — Share2Inspire Homepage (PT/EN/ES unified)
// Sections: Hero, Trust Badges, Tools Grid, Target Audience, CTA, Testimonials
import { useEffect } from "react";
import { FileText, Linkedin, Route, Zap, GraduationCap, Rocket, Clock, CheckSquare, BarChart3, User, ArrowRightLeft, Timer, ArrowRight } from "lucide-react";
import S2IHeader from "@/components/S2IHeader";
import S2IFooter from "@/components/S2IFooter";
import RotatingPromoBanner from "@/components/RotatingPromoBanner";
import useTranslation from "@/i18n/useTranslation";
import { usePageSEO } from "@/lib/seo";
import { pageSeo } from "@/lib/pageSeo";

export default function LandingPage() {
  const { pick, localePath: lp } = useTranslation();
  usePageSEO(pageSeo.landing);

  const tools = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: pick("CV Analyser", "CV Analyser", "CV Analyser"),
      desc: pick(
        "Diagnóstico ATS em 30 segundos. Percebe porque não estás a ser chamado.",
        "ATS diagnosis in 30 seconds. Find out why you're not getting callbacks.",
        "Diagnóstico ATS en 30 segundos. Descubre por qué no te llaman."
      ),
      link: lp("/cv-analyser"),
      cta: pick("Analisar CV", "Analyse my CV", "Analizar CV"),
      color: "#C9A961",
    },
    {
      icon: <Linkedin className="w-6 h-6" />,
      title: pick("LinkedIn Roaster", "LinkedIn Roaster", "LinkedIn Roaster"),
      desc: pick(
        "Feedback honesto sobre o teu perfil. O que os recrutadores realmente veem.",
        "Honest feedback on your profile. What recruiters actually see.",
        "Feedback honesto sobre tu perfil. Lo que los reclutadores realmente ven."
      ),
      link: lp("/linkedin-roaster"),
      cta: pick("Analisar perfil", "Analyse profile", "Analizar perfil"),
      color: "#0077B5",
    },
    {
      icon: <Route className="w-6 h-6" />,
      title: pick("Career Path", "Career Path", "Career Path"),
      desc: pick(
        "Roadmap personalizado com IA. 3 funções ideais, gaps e plano de ação.",
        "AI-powered personalised roadmap. 3 ideal roles, gaps and action plan.",
        "Roadmap personalizado con IA. 3 funciones ideales, gaps y plan de acción."
      ),
      link: lp("/career-path"),
      cta: pick("Criar roadmap", "Build roadmap", "Crear roadmap"),
      color: "#C9A961",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: pick("Career Intelligence", "Career Intelligence", "Career Intelligence"),
      desc: pick(
        "Comparação estratégica dos 3 caminhos com trade-offs e recomendação final.",
        "Strategic comparison of 3 career paths with trade-offs and final recommendation.",
        "Comparación estratégica de 3 caminos con trade-offs y recomendación final."
      ),
      link: lp("/career-intelligence"),
      cta: pick("Saber mais", "Learn more", "Saber más"),
      color: "#C9A961",
    },
    {
      icon: <GraduationCap className="w-6 h-6" />,
      title: pick("Pack Estudante", "Student Pack", "Pack Estudiante"),
      desc: pick(
        "CV Analyser + LinkedIn Roaster num só pack. Diagnóstico completo por 6,99\u20AC.",
        "CV Analyser + LinkedIn Roaster in one pack. Full diagnosis for \u20AC6.99.",
        "CV Analyser + LinkedIn Roaster en un solo pack. Diagnóstico completo por 6,99\u20AC."
      ),
      link: lp("/estudante"),
      cta: pick("Poupar 43%", "Save 43%", "Ahorrar 43%"),
      color: "#10b981",
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      title: pick("KickStart Pro", "KickStart Pro", "KickStart Pro"),
      desc: pick(
        "Sessão estratégica 1:1 para clarificar opções e definir os próximos passos.",
        "1:1 strategic session to clarify options and define your next steps.",
        "Sesión estratégica 1:1 para clarificar opciones y definir los próximos pasos."
      ),
      link: lp("/servicos"),
      cta: pick("Agendar sessão", "Book session", "Agendar sesión"),
      color: "#C9A961",
    },
  ];

  const testimonials = [
    {
      quote: pick(
        "Passei de 45 para 82 pontos ATS em 10 minutos. Absolutamente essencial para quem procura emprego.",
        "I went from 45 to 82 ATS points in 10 minutes. Absolutely essential for job seekers.",
        "Pasé de 45 a 82 puntos ATS en 10 minutos. Absolutamente esencial para quien busca empleo."
      ),
      name: "Ana M.",
      role: pick("Gestora Sénior", "Senior Manager", "Manager Sénior"),
      initials: "AM",
    },
    {
      quote: pick(
        "O LinkedIn Roaster deu-me feedback que nunca tinha recebido. O meu perfil está muito mais forte.",
        "The LinkedIn Roaster gave me feedback I'd never received. My profile is so much stronger now.",
        "El LinkedIn Roaster me dio feedback que nunca había recibido. Mi perfil está mucho más fuerte."
      ),
      name: "Diogo S.",
      role: pick("Engenheiro de Software", "Software Engineer", "Ingeniero de Software"),
      initials: "DS",
    },
    {
      quote: pick(
        "Finalmente uma ferramenta que me diz exatamente o que os recrutadores querem ver. Um game-changer.",
        "Finally a tool that tells me exactly what recruiters want to see. A game-changer.",
        "Por fin una herramienta que me dice exactamente lo que los reclutadores quieren ver. Un game-changer."
      ),
      name: "Mariana C.",
      role: pick("Product Manager", "Product Manager", "Product Manager"),
      initials: "MC",
    },
  ];

  const ctaCards = [
    {
      icon: <FileText className="w-5 h-5" />,
      label: pick("CV Analyser", "CV Analyser", "CV Analyser"),
      title: pick(
        "Queres mais chamadas de recrutadores?",
        "Want more recruiter callbacks?",
        "¿Quieres más llamadas de reclutadores?"
      ),
      desc: pick(
        "Descobre o teu ATS Score e o que mudas no CV para passares os filtros.",
        "Discover your ATS Score and what to change in your CV to pass the filters.",
        "Descubre tu ATS Score y qué cambiar en tu CV para pasar los filtros."
      ),
      link: lp("/cv-analyser"),
      cta: pick("Analisa o teu CV", "Analyse your CV", "Analiza tu CV"),
    },
    {
      icon: <Linkedin className="w-5 h-5" />,
      label: pick("LinkedIn Roaster", "LinkedIn Roaster", "LinkedIn Roaster"),
      title: pick(
        "O teu perfil está a atrair oportunidades?",
        "Is your profile attracting opportunities?",
        "¿Tu perfil está atrayendo oportunidades?"
      ),
      desc: pick(
        "Recebe um diagnóstico honesto sobre o que os recrutadores realmente veem.",
        "Get an honest diagnosis of what recruiters actually see.",
        "Recibe un diagnóstico honesto sobre lo que los reclutadores realmente ven."
      ),
      link: lp("/linkedin-roaster"),
      cta: pick("Analisar perfil", "Analyse profile", "Analizar perfil"),
    },
    {
      icon: <Route className="w-5 h-5" />,
      label: pick("Career Path", "Career Path", "Career Path"),
      title: pick(
        "Queres clareza sobre o teu próximo passo?",
        "Want clarity on your next step?",
        "¿Quieres claridad sobre tu próximo paso?"
      ),
      desc: pick(
        "Roadmap personalizado com IA: funções ideais, gaps e plano de ação 30-60-90.",
        "AI-powered personalised roadmap: ideal roles, gaps and 30-60-90 action plan.",
        "Roadmap personalizado con IA: funciones ideales, gaps y plan de acción 30-60-90."
      ),
      link: lp("/career-path"),
      cta: pick("Explorar o meu caminho", "Explore my path", "Explorar mi camino"),
    },
  ];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <S2IHeader activePage="home" />
      <RotatingPromoBanner />

      {/* ─── HERO ─── */}
      <section
        className="relative flex min-h-[calc(100svh-118px)] items-center justify-center text-center text-white md:min-h-screen"
        style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.5)), url('https://www.share2inspire.pt/images/hero-samuel-blur.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="relative z-10 mx-auto max-w-3xl px-5 py-8 md:px-6 md:py-0">
          <h1 className="text-2xl md:text-5xl font-semibold leading-tight mb-3 md:mb-4" style={{ letterSpacing: "-0.5px" }}>
            {pick(
              <>Constrói a tua carreira com <strong className="text-[#C9A961]">estratégia</strong>,<br className="hidden md:block" /> não por tentativa e erro</>,
              <>Build your career with <strong className="text-[#C9A961]">strategy</strong>,<br className="hidden md:block" /> not trial and error</>,
              <>Construye tu carrera con <strong className="text-[#C9A961]">estrategia</strong>,<br className="hidden md:block" /> no por ensayo y error</>
            )}
          </h1>
          <p className="mx-auto mb-6 max-w-lg text-sm leading-relaxed text-white/70 md:mb-10 md:max-w-xl md:text-lg">
            {pick(
              "Um ecossistema completo para perceberes onde estás, o que ajustar e qual o próximo passo certo.",
              "A complete ecosystem to understand where you are, what to adjust and what the right next step is.",
              "Un ecosistema completo para entender dónde estás, qué ajustar y cuál es el próximo paso correcto."
            )}
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <a href={lp("/cv-analyser")} className="group mx-auto w-full max-w-xs rounded-2xl border border-[#C9A961]/40 bg-[#102720]/88 px-5 py-5 text-left shadow-[0_20px_45px_-28px_rgba(0,0,0,0.7)] transition-all hover:-translate-y-0.5 hover:border-[#d9ba6b] hover:bg-[#143129]/92 hover:shadow-[0_26px_55px_-28px_rgba(0,0,0,0.82)] sm:mx-0 sm:px-6 sm:py-6">
              <h3 className="text-base font-semibold mb-1">
                {pick("Quero melhorar o meu CV", "I want to improve my CV", "Quiero mejorar mi CV")}
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-white/78 sm:mb-5">
                {pick(
                  "Percebe porque não estás a ser chamado e o que mudar.",
                  "Find out why you're not getting callbacks and what to change.",
                  "Descubre por qué no te llaman y qué cambiar."
                )}
              </p>
              <span className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#C9A961] px-4 py-3 text-sm font-extrabold uppercase tracking-[0.18em] text-[#10211c] shadow-[0_16px_28px_-16px_rgba(201,169,97,0.95)] transition-all group-hover:scale-[1.02] group-hover:bg-[#d8ba6a] group-hover:shadow-[0_18px_34px_-16px_rgba(201,169,97,1)]">
                {pick("Analisar o meu CV", "Analyse my CV", "Analizar mi CV")}
                <ArrowRight className="h-4 w-4 shrink-0" />
              </span>
            </a>
            <a href={lp("/career-path")} className="group mx-auto w-full max-w-xs rounded-2xl border border-[#2f6b57]/70 bg-[#0f241f]/90 px-5 py-5 text-left shadow-[0_20px_45px_-28px_rgba(0,0,0,0.7)] transition-all hover:-translate-y-0.5 hover:border-[#4e8d77] hover:bg-[#143129]/94 hover:shadow-[0_26px_55px_-28px_rgba(0,0,0,0.82)] sm:mx-0 sm:px-6 sm:py-6">
              <h3 className="text-base font-semibold mb-1">
                {pick("Quero definir o meu próximo passo", "I want to define my next step", "Quiero definir mi próximo paso")}
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-white/78 sm:mb-5">
                {pick(
                  "Descobre que caminho faz sentido para a tua evolução.",
                  "Discover which path makes sense for your career growth.",
                  "Descubre qué camino tiene sentido para tu evolución."
                )}
              </p>
              <span className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#1f6b52] px-4 py-3 text-sm font-extrabold uppercase tracking-[0.18em] text-white shadow-[0_16px_28px_-16px_rgba(31,107,82,0.95)] transition-all group-hover:scale-[1.02] group-hover:bg-[#267e60] group-hover:shadow-[0_18px_34px_-16px_rgba(31,107,82,1)]">
                {pick("Explorar o meu caminho", "Explore my path", "Explorar mi camino")}
                <ArrowRight className="h-4 w-4 shrink-0" />
              </span>
            </a>
          </div>
        </div>
        {/* Gradient fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ─── TRUST BADGES ─── */}
      <section className="py-10 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          <div className="flex items-center gap-3 text-center md:text-left">
            <Clock className="w-5 h-5 text-[#C9A961] shrink-0" />
            <p className="text-sm text-slate-600">
              {pick("Diagnóstico em segundos, sem complexidade", "Diagnosis in seconds, no complexity", "Diagnóstico en segundos, sin complejidad")}
            </p>
          </div>
          <div className="flex items-center gap-3 text-center md:text-left">
            <CheckSquare className="w-5 h-5 text-[#C9A961] shrink-0" />
            <p className="text-sm text-slate-600">
              {pick("Baseado em critérios reais de recrutamento", "Based on real recruitment criteria", "Basado en criterios reales de reclutamiento")}
            </p>
          </div>
          <div className="flex items-center gap-3 text-center md:text-left">
            <BarChart3 className="w-5 h-5 text-[#C9A961] shrink-0" />
            <p className="text-sm text-slate-600">
              {pick("Recomendações claras e acionáveis", "Clear and actionable recommendations", "Recomendaciones claras y accionables")}
            </p>
          </div>
        </div>
      </section>

      {/* ─── TOOLS GRID ─── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-slate-900 mb-2">
            {pick(
              <>As nossas <strong className="text-[#C9A961]">ferramentas</strong></>,
              <>Our <strong className="text-[#C9A961]">tools</strong></>,
              <>Nuestras <strong className="text-[#C9A961]">herramientas</strong></>
            )}
          </h2>
          <div className="w-10 h-0.5 bg-[#C9A961] mx-auto mb-10" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tools.map((t) => (
              <a
                key={t.title}
                href={t.link}
                className="group block border border-slate-200 rounded-xl p-6 hover:border-[#C9A961]/40 hover:shadow-lg transition-all"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: `${t.color}15`, color: t.color }}
                >
                  {t.icon}
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">{t.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-3">{t.desc}</p>
                <span className="text-xs font-semibold" style={{ color: t.color }}>
                  {t.cta} &rarr;
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TARGET AUDIENCE ─── */}
      <section className="py-20 px-6" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">
            {pick(
              <>Para quem é a <strong className="text-[#C9A961]">Share2Inspire</strong>?</>,
              <>Who is <strong className="text-[#C9A961]">Share2Inspire</strong> for?</>,
              <>¿Para quién es <strong className="text-[#C9A961]">Share2Inspire</strong>?</>
            )}
          </h2>
          <div className="w-10 h-0.5 bg-[#C9A961] mx-auto mb-10" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <User className="w-6 h-6 text-[#C9A961] mx-auto mb-3" />
              <p className="text-sm text-white/70 leading-relaxed">
                {pick(
                  "Profissionais que não estão a ter respostas às candidaturas",
                  "Professionals not getting responses to applications",
                  "Profesionales que no están recibiendo respuestas a sus candidaturas"
                )}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <ArrowRightLeft className="w-6 h-6 text-[#C9A961] mx-auto mb-3" />
              <p className="text-sm text-white/70 leading-relaxed">
                {pick("Pessoas em transição de carreira", "People in career transition", "Personas en transición de carrera")}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <Timer className="w-6 h-6 text-[#C9A961] mx-auto mb-3" />
              <p className="text-sm text-white/70 leading-relaxed">
                {pick(
                  "Quem quer crescer mas sente falta de direção",
                  "Those who want to grow but lack direction",
                  "Quienes quieren crecer pero sienten falta de dirección"
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section className="py-20 px-6" style={{ background: "linear-gradient(180deg, #16213e 0%, #1a1a2e 100%)" }}>
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[0.68rem] font-bold uppercase tracking-[2.5px] text-[#C9A961] mb-3">
            {pick("Começa hoje", "Start today", "Empieza hoy")}
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">
            {pick("Por onde queres começar?", "Where do you want to start?", "¿Por dónde quieres empezar?")}
          </h2>
          <p className="text-sm text-white/45 mb-10">
            {pick("Resultados em menos de 60 segundos. Sem subscrição.", "Results in under 60 seconds. No subscription.", "Resultados en menos de 60 segundos. Sin suscripción.")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {ctaCards.map((c) => (
              <div
                key={c.label}
                className="bg-white/[0.06] border border-[#C9A961]/20 rounded-xl p-6 text-left hover:bg-white/10 hover:border-[#C9A961]/45 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-all"
              >
                <div className="w-11 h-11 bg-[#C9A961]/10 border border-[#C9A961]/20 rounded-lg flex items-center justify-center text-[#C9A961] mb-4">
                  {c.icon}
                </div>
                <p className="text-[0.6rem] font-bold uppercase tracking-[2px] text-[#C9A961]/70 mb-1">{c.label}</p>
                <h3 className="text-base font-semibold text-white mb-2 leading-snug">{c.title}</h3>
                <p className="text-[0.78rem] text-white/50 leading-relaxed mb-5">{c.desc}</p>
                <a
                  href={c.link}
                  className="inline-block bg-gradient-to-r from-[#C9A961] to-[#B8943D] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
                >
                  {c.cta}
                </a>
              </div>
            ))}
          </div>
          <p className="mt-8 text-[0.78rem] text-white/30">
            {pick("Ou", "Or", "O")}{" "}
            <a href={lp("/servicos")} className="text-[#C9A961]/60 hover:text-[#C9A961] transition-colors">
              {pick("vê todos os serviços", "see all services", "ver todos los servicios")} &rarr;
            </a>
          </p>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-20 px-6 bg-[#faf8f4]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-slate-900 mb-2">
            {pick(
              <>O que dizem os nossos <strong className="text-[#C9A961]">utilizadores</strong></>,
              <>What our <strong className="text-[#C9A961]">users</strong> say</>,
              <>Lo que dicen nuestros <strong className="text-[#C9A961]">usuarios</strong></>
            )}
          </h2>
          <div className="w-10 h-0.5 bg-[#C9A961] mx-auto mb-10" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-xl p-6 border border-[#f0ebe0]">
                <p className="text-sm text-slate-500 leading-relaxed mb-5 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#C9A961] rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <S2IFooter />
    </div>
  );
}
