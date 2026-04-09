// LandingPage — Share2Inspire Homepage (PT)
// Sections: Hero, Trust Badges, Tools Grid, Target Audience, CTA, Testimonials
import { useEffect } from "react";
import { FileText, Linkedin, Route, Zap, GraduationCap, Rocket, Clock, CheckSquare, BarChart3, User, ArrowRightLeft, Timer } from "lucide-react";
import S2IHeader from "@/components/S2IHeader";
import S2IFooter from "@/components/S2IFooter";
import PromoBanner from "@/components/PromoBanner";

const tools = [
  {
    icon: <FileText className="w-6 h-6" />,
    title: "CV Analyser",
    desc: "Diagnóstico ATS em 30 segundos. Percebe porque não estás a ser chamado.",
    link: "/cv-analyser",
    cta: "Analisar CV",
    color: "#C9A961",
  },
  {
    icon: <Linkedin className="w-6 h-6" />,
    title: "LinkedIn Roaster",
    desc: "Feedback honesto sobre o teu perfil. O que os recrutadores realmente veem.",
    link: "/linkedin-roaster",
    cta: "Analisar perfil",
    color: "#0077B5",
  },
  {
    icon: <Route className="w-6 h-6" />,
    title: "Career Path",
    desc: "Roadmap personalizado com IA. 3 funções ideais, gaps e plano de ação.",
    link: "/career-path",
    cta: "Criar roadmap",
    color: "#C9A961",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Career Intelligence",
    desc: "Comparação estratégica dos 3 caminhos com trade-offs e recomendação final.",
    link: "/career-intelligence",
    cta: "Saber mais",
    color: "#C9A961",
  },
  {
    icon: <GraduationCap className="w-6 h-6" />,
    title: "Pack Estudante",
    desc: "CV Analyser + LinkedIn Roaster num só pack. Diagnóstico completo por 7,99\u20AC.",
    link: "/estudante",
    cta: "Poupar 43%",
    color: "#10b981",
  },
  {
    icon: <Rocket className="w-6 h-6" />,
    title: "KickStart Pro",
    desc: "Sessão estratégica 1:1 para clarificar opções e definir os próximos passos.",
    link: "/servicos",
    cta: "Agendar sessão",
    color: "#C9A961",
  },
];

const testimonials = [
  {
    quote: "Passei de 45 para 82 pontos ATS em 10 minutos. Absolutamente essencial para quem procura emprego.",
    name: "Ana M.",
    role: "Senior Manager",
    initials: "AM",
  },
  {
    quote: "O LinkedIn Roaster deu-me feedback que nunca tinha recebido. O meu perfil está muito mais forte.",
    name: "Diogo S.",
    role: "Software Engineer",
    initials: "DS",
  },
  {
    quote: "Finalmente uma ferramenta que me diz exatamente o que os recrutadores querem ver. Um game-changer.",
    name: "Mariana C.",
    role: "Product Manager",
    initials: "MC",
  },
];

const ctaCards = [
  {
    icon: <FileText className="w-5 h-5" />,
    label: "CV Analyser",
    title: "Queres mais chamadas de recrutadores?",
    desc: "Descobre o teu ATS Score e o que mudas no CV para passares os filtros.",
    link: "/cv-analyser",
    cta: "Analisa o teu CV",
  },
  {
    icon: <Linkedin className="w-5 h-5" />,
    label: "LinkedIn Roaster",
    title: "O teu perfil está a atrair oportunidades?",
    desc: "Recebe um diagnóstico honesto sobre o que os recrutadores realmente veem.",
    link: "/linkedin-roaster",
    cta: "Analisar perfil",
  },
  {
    icon: <Route className="w-5 h-5" />,
    label: "Career Path",
    title: "Queres clareza sobre o teu próximo passo?",
    desc: "Roadmap personalizado com IA: funções ideais, gaps e plano de ação 30-60-90.",
    link: "/career-path",
    cta: "Explorar o meu caminho",
  },
];

export default function LandingPage() {
  useEffect(() => {
    document.title = "Share2Inspire | Career Intelligence Platform";
  }, []);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <S2IHeader activePage="home" langToggleHref="/en" />
      <PromoBanner />

      {/* ─── HERO ─── */}
      <section
        className="relative flex items-center justify-center text-center text-white"
        style={{
          minHeight: "100vh",
          backgroundImage: "linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.5)), url('https://www.share2inspire.pt/images/hero-samuel-blur.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="relative z-10 px-6 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-semibold leading-tight mb-4" style={{ letterSpacing: "-0.5px" }}>
            Constrói a tua carreira com <strong className="text-[#C9A961]">estratégia</strong>,
            <br className="hidden md:block" /> não por tentativa e erro
          </h1>
          <p className="text-base md:text-lg text-white/70 mb-10 max-w-xl mx-auto leading-relaxed">
            Um ecossistema completo para perceberes onde estás, o que ajustar e qual o próximo passo certo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/cv-analyser" className="group bg-white/10 backdrop-blur border border-white/20 rounded-xl px-6 py-5 text-left hover:bg-white/15 hover:border-[#C9A961]/40 transition-all max-w-xs">
              <h3 className="text-base font-semibold mb-1">Quero melhorar o meu CV</h3>
              <p className="text-sm text-white/50 mb-3">Percebe porque não estás a ser chamado e o que mudar.</p>
              <span className="text-xs font-bold uppercase tracking-widest text-[#C9A961]">Analisar o meu CV &rarr;</span>
            </a>
            <a href="/career-path" className="group bg-white/10 backdrop-blur border border-white/20 rounded-xl px-6 py-5 text-left hover:bg-white/15 hover:border-[#C9A961]/40 transition-all max-w-xs">
              <h3 className="text-base font-semibold mb-1">Quero definir o meu próximo passo</h3>
              <p className="text-sm text-white/50 mb-3">Descobre que caminho faz sentido para a tua evolução.</p>
              <span className="text-xs font-bold uppercase tracking-widest text-[#C9A961]">Explorar o meu caminho &rarr;</span>
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
            <p className="text-sm text-slate-600">Diagnóstico em segundos, sem complexidade</p>
          </div>
          <div className="flex items-center gap-3 text-center md:text-left">
            <CheckSquare className="w-5 h-5 text-[#C9A961] shrink-0" />
            <p className="text-sm text-slate-600">Baseado em critérios reais de recrutamento</p>
          </div>
          <div className="flex items-center gap-3 text-center md:text-left">
            <BarChart3 className="w-5 h-5 text-[#C9A961] shrink-0" />
            <p className="text-sm text-slate-600">Recomendações claras e acionáveis</p>
          </div>
        </div>
      </section>

      {/* ─── TOOLS GRID ─── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-slate-900 mb-2">
            As nossas <strong className="text-[#C9A961]">ferramentas</strong>
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
            Para quem é o <strong className="text-[#C9A961]">Share2Inspire</strong>?
          </h2>
          <div className="w-10 h-0.5 bg-[#C9A961] mx-auto mb-10" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <User className="w-6 h-6 text-[#C9A961] mx-auto mb-3" />
              <p className="text-sm text-white/70 leading-relaxed">Profissionais que não estão a ter respostas às candidaturas</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <ArrowRightLeft className="w-6 h-6 text-[#C9A961] mx-auto mb-3" />
              <p className="text-sm text-white/70 leading-relaxed">Pessoas em transição de carreira</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <Timer className="w-6 h-6 text-[#C9A961] mx-auto mb-3" />
              <p className="text-sm text-white/70 leading-relaxed">Quem quer crescer mas sente falta de direção</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section className="py-20 px-6" style={{ background: "linear-gradient(180deg, #16213e 0%, #1a1a2e 100%)" }}>
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[0.68rem] font-bold uppercase tracking-[2.5px] text-[#C9A961] mb-3">Começa hoje</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">Por onde queres começar?</h2>
          <p className="text-sm text-white/45 mb-10">Resultados em menos de 60 segundos. Sem subscrição.</p>
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
            Ou <a href="/servicos" className="text-[#C9A961]/60 hover:text-[#C9A961] transition-colors">vê todos os serviços &rarr;</a>
          </p>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-20 px-6 bg-[#faf8f4]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-slate-900 mb-2">
            O que dizem os nossos <strong className="text-[#C9A961]">utilizadores</strong>
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
