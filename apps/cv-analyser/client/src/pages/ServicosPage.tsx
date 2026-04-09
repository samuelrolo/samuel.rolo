// ServicosPage — Serviços Share2Inspire (PT)
// Sections: Hero, Stats, Phase 1 (Diagnosticar), Phase 2 (Decidir), FAQ, CTA Final, Testimonials
import { useState, useEffect } from "react";
import { FileText, Linkedin, Route, Zap, GraduationCap, Rocket, ChevronDown, Star, Check, ArrowRight } from "lucide-react";
import S2IHeader from "@/components/S2IHeader";
import S2IFooter from "@/components/S2IFooter";
import PromoBanner from "@/components/PromoBanner";

/* ─── DATA ─── */
const phase1Services = [
  {
    icon: <FileText className="w-6 h-6" />,
    badge: "GRÁTIS",
    badgeColor: "bg-[#C9A961] text-white",
    title: "CV Analyser",
    desc: "Vê em segundos porque o teu CV não está a gerar entrevistas.",
    features: [
      "Descobre o teu score de empregabilidade",
      "Identifica o que os recrutadores não veem",
      "Recebe um plano de melhoria concreto",
    ],
    detail: "Diagnóstico instantâneo com IA. Score de maturidade 0-100, taxa de rejeição ATS, relatório PDF com 15+ recomendações. Análise gratuita + relatório completo por 9,99\u20AC.",
    price: "Grátis / completo 9,99\u20AC",
    cta: "Analisar o meu CV",
    link: "/cv-analyser",
  },
  {
    icon: <Linkedin className="w-6 h-6" />,
    badge: "NOVO",
    badgeColor: "bg-[#0077B5] text-white",
    title: "LinkedIn Roaster",
    desc: "Descobre o que está a travar a tua visibilidade profissional.",
    features: [
      "Sabe porque não apareces nas pesquisas",
      "Corrige os erros que afastam recrutadores",
      "Recebe headlines e keywords optimizadas",
    ],
    detail: "Auditoria completa do teu perfil LinkedIn. Score de visibilidade 0-10, erros críticos, palavras-chave SEO e recomendação prioritária.",
    price: "3,99\u20AC",
    cta: "Ver o que está a travar-me",
    link: "/linkedin-roaster",
  },
];

const phase1Bundles = [
  {
    icon: <GraduationCap className="w-6 h-6" />,
    badge: "-43%",
    badgeColor: "bg-emerald-500 text-white",
    title: "Pack Estudante",
    desc: "CV Analyser + LinkedIn Roaster juntos. Prepara-te para o primeiro emprego.",
    features: [
      "Análise completa do CV com IA",
      "Auditoria do perfil LinkedIn",
      "Relatório de consistência CV \u2194 LinkedIn (exclusivo)",
      "Plano de acção integrado por semanas",
    ],
    oldPrice: "13,98\u20AC",
    price: "7,99\u20AC",
    saving: "Poupas 43%",
    cta: "Quero o Pack Estudante",
    link: "/estudante",
  },
  {
    badge: "MAIS POPULAR",
    badgeColor: "bg-[#C9A961] text-white",
    title: "CV Analyser + Career Path",
    desc: "Diagnóstico completo + roadmap personalizado. Tudo o que precisas para começar.",
    oldPrice: "38\u20AC",
    price: "29\u20AC",
    saving: "Poupas 9\u20AC",
    cta: "Quero os dois",
    link: "/bundle",
  },
];

const phase2Services = [
  {
    icon: <Route className="w-6 h-6" />,
    badge: "RECOMENDADO",
    badgeColor: "bg-[#C9A961] text-white",
    title: "Career Path",
    desc: "Deixa de andar às cegas. Sabe exactamente qual é o próximo passo.",
    features: [
      "Recebe um roadmap personalizado para a tua carreira",
      "Identifica os gaps que te separam do próximo nível",
      "Sabe quanto podes ganhar em cada etapa",
    ],
    detail: "Percursos de carreira personalizados, análise de gaps de competências, estimativa salarial por etapa, formações recomendadas e plano 30-60-90 dias.",
    price: "19,99\u20AC",
    cta: "Traçar o meu caminho",
    link: "/career-path",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    badge: "COMPLETO",
    badgeColor: "bg-slate-800 text-white",
    title: "Career Intelligence",
    desc: "Toma a decisão certa com base em dados, não em dúvidas.",
    features: [
      "Compara múltiplos caminhos lado a lado",
      "Vê o que ganhas e o que abdicas em cada opção",
      "Recebe uma recomendação fundamentada com dados",
    ],
    detail: "Tudo do Career Path + decisão estratégica. 3 caminhos com probabilidade de sucesso, comparação lado a lado, trade-offs e recomendação final com justificação. Contexto de mercado incluído.",
    upgradeNote: "Ou começa pelo Career Path (19,99\u20AC) e faz upgrade por 29\u20AC.",
    cta: "Tomar a decisão certa",
    link: "/career-intelligence",
  },
  {
    icon: <Rocket className="w-6 h-6" />,
    title: "KickStart Pro",
    desc: "Precisas de clareza agora? 30 minutos com um especialista e sais com um plano.",
    features: [
      "Plano de acção com 3-5 passos concretos",
      "Acompanhamento pós-sessão incluído",
    ],
    price: "desde 35\u20AC",
    cta: "Agendar sessão",
    link: "https://calendly.com/share2inspire",
    isExternal: true,
  },
];

const faqs = [
  {
    q: "O CV Analyser é mesmo gratuito?",
    a: "Sim. A análise inicial com score de maturidade e recomendações-chave é 100% gratuita. Se quiseres o relatório completo com 15+ recomendações detalhadas e taxa ATS, custa 9,99\u20AC.",
  },
  {
    q: "Qual a diferença entre Career Path e Career Intelligence?",
    a: "O Career Path dá-te um roadmap personalizado com o próximo passo ideal. O Career Intelligence vai mais longe: compara múltiplos caminhos, analisa trade-offs e dá-te uma recomendação fundamentada. Se já sabes a direcção, o Career Path basta. Se tens dúvidas entre opções, o Career Intelligence é para ti.",
  },
  {
    q: "Quanto tempo demora a receber os resultados?",
    a: "O CV Analyser e o LinkedIn Roaster são instantâneos — recebes o resultado em segundos. O Career Path e o Career Intelligence são gerados em menos de 5 minutos após o pagamento.",
  },
];

const testimonials = [
  { quote: "A sessão KickStart Pro foi transformadora. Em 30 minutos tinha um plano de acção concreto.", name: "Marta S.", role: "HR Director", initials: "MS" },
  { quote: "O LinkedIn Roaster mudou a forma como me apresento. Recebi 3 contactos na semana seguinte.", name: "João F.", role: "Tech Lead", initials: "JF" },
  { quote: "O Career Path deu-me uma visão clara do próximo passo. Recomendo a qualquer profissional em transição.", name: "Ana M.", role: "Senior Manager", initials: "AM" },
  { quote: "O CV Analyser identificou pontos que eu nunca teria visto. Gratuito e extremamente útil.", name: "Ricardo P.", role: "Consultor", initials: "RP" },
];

/* ─── COMPONENTS ─── */
function ServiceCard({ svc, featured }: { svc: any; featured?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border ${featured ? "border-[#C9A961] shadow-lg ring-1 ring-[#C9A961]/20" : "border-[#f0ebe0]"} p-6 flex flex-col h-full hover:shadow-md transition-shadow`}>
      {svc.badge && (
        <span className={`inline-block text-[0.6rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-4 self-start ${svc.badgeColor}`}>
          {svc.badge}
        </span>
      )}
      {svc.icon && <div className="text-[#C9A961] mb-3">{svc.icon}</div>}
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{svc.title}</h3>
      <p className="text-sm text-slate-500 mb-4 leading-relaxed">{svc.desc}</p>
      {svc.features && (
        <ul className="space-y-2 mb-4 flex-1">
          {svc.features.map((f: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
              <Check className="w-4 h-4 text-[#C9A961] shrink-0 mt-0.5" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
      {svc.detail && <p className="text-xs text-slate-400 leading-relaxed mb-4">{svc.detail}</p>}
      {svc.upgradeNote && <p className="text-xs text-[#C9A961] mb-4">{svc.upgradeNote}</p>}
      <div className="mt-auto">
        {svc.oldPrice && (
          <p className="text-sm text-slate-400 mb-1">
            <span className="line-through">{svc.oldPrice}</span>
            {svc.saving && <span className="ml-2 text-emerald-600 text-xs font-medium">{svc.saving}</span>}
          </p>
        )}
        {svc.price && <p className="text-lg font-bold text-slate-900 mb-3">{svc.price}</p>}
        <a
          href={svc.link}
          {...(svc.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C9A961] to-[#B8943D] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          {svc.cta} <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

function FaqItem({ faq }: { faq: { q: string; a: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-5 text-left group">
        <span className="text-sm font-semibold text-slate-900 group-hover:text-[#C9A961] transition-colors">{faq.q}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="text-sm text-slate-500 leading-relaxed pb-5 -mt-1">{faq.a}</p>}
    </div>
  );
}

/* ─── PAGE ─── */
export default function ServicosPage() {
  useEffect(() => {
    document.title = "Serviços | CV com IA, Career Path e Career Intelligence | Share2Inspire";
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans">
      <S2IHeader activePage="servicos" langToggleHref="/en/pages/services" />
      <PromoBanner />

      {/* ─── HERO ─── */}
      <section className="pt-28 pb-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-light text-slate-900 mb-2 leading-tight">
            Para de adivinhar.
          </h1>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            Toma o controlo da tua carreira.
          </h2>
          <p className="text-base text-slate-500 max-w-xl mx-auto mb-8 leading-relaxed">
            Do diagnóstico à decisão estratégica. Ferramentas de IA que te mostram onde estás, para onde podes ir e qual o melhor caminho.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <a
              href="/cv-analyser"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C9A961] to-[#B8943D] text-white font-semibold px-7 py-3 rounded-full hover:opacity-90 transition-opacity"
            >
              Analisar o meu CV — Grátis <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#servicos"
              className="inline-flex items-center gap-2 border border-slate-200 text-slate-600 font-medium px-7 py-3 rounded-full hover:border-[#C9A961] hover:text-[#C9A961] transition-colors"
            >
              Ver os serviços <ChevronDown className="w-4 h-4" />
            </a>
          </div>
          <p className="text-xs text-slate-400">
            <span className="text-[#C9A961]">⚡</span> Resultado em segundos &middot; Sem cartão de crédito &middot; Sem compromisso
          </p>
        </div>
      </section>

      {/* ─── PHASE STEPPER ─── */}
      <section id="servicos" className="pb-6 px-6">
        <div className="max-w-md mx-auto flex items-center justify-center gap-8">
          <a href="#fase1" className="flex flex-col items-center gap-1 group">
            <span className="w-10 h-10 rounded-full border-2 border-[#C9A961] flex items-center justify-center text-sm font-bold text-[#C9A961] group-hover:bg-[#C9A961] group-hover:text-white transition-all">1</span>
            <span className="text-xs text-slate-500">Diagnosticar</span>
          </a>
          <div className="w-16 h-px bg-slate-200" />
          <a href="#fase2" className="flex flex-col items-center gap-1 group">
            <span className="w-10 h-10 rounded-full border-2 border-[#C9A961] flex items-center justify-center text-sm font-bold text-[#C9A961] group-hover:bg-[#C9A961] group-hover:text-white transition-all">2</span>
            <span className="text-xs text-slate-500">Decidir</span>
          </a>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="py-10 px-6 border-y border-slate-100">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-12 flex-wrap">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#C9A961]">+500</p>
            <p className="text-xs text-slate-400">Profissionais ajudados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#C9A961]">5 <Star className="w-4 h-4 inline text-[#C9A961] -mt-1" /></p>
            <p className="text-xs text-slate-400">Avaliação média</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#C9A961]">98%</p>
            <p className="text-xs text-slate-400">Taxa de satisfação</p>
          </div>
        </div>
      </section>

      {/* ─── PHASE 1: DIAGNOSTICAR ─── */}
      <section id="fase1" className="py-20 px-6 scroll-mt-20" style={{ background: "linear-gradient(180deg, #ffffff 0%, #faf8f4 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-8 rounded-full bg-[#C9A961]/10 border border-[#C9A961]/30 flex items-center justify-center text-xs font-bold text-[#C9A961]">1</span>
            <span className="text-[0.65rem] font-bold uppercase tracking-[2.5px] text-[#C9A961]">Fase</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">
            Percebe <strong className="text-[#C9A961]">onde estás</strong>
          </h2>
          <p className="text-sm text-slate-500 mb-10 max-w-xl leading-relaxed">
            Antes de decidir para onde ir, precisas de saber o ponto de partida. Estas ferramentas dão-te essa clareza — em minutos.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {phase1Services.map((svc) => (
              <ServiceCard key={svc.title} svc={svc} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {phase1Bundles.map((svc) => (
              <ServiceCard key={svc.title} svc={svc} featured={svc.badge === "MAIS POPULAR"} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRANSITION ─── */}
      <section className="py-8 px-6 text-center bg-[#faf8f4]">
        <a href="#fase2" className="inline-flex items-center gap-2 text-sm font-semibold text-[#C9A961] hover:underline">
          Já sabes onde estás? Decide para onde vais <ArrowRight className="w-4 h-4" />
        </a>
      </section>

      {/* ─── PHASE 2: DECIDIR ─── */}
      <section id="fase2" className="py-20 px-6 scroll-mt-20" style={{ background: "linear-gradient(180deg, #faf8f4 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-8 rounded-full bg-[#C9A961]/10 border border-[#C9A961]/30 flex items-center justify-center text-xs font-bold text-[#C9A961]">2</span>
            <span className="text-[0.65rem] font-bold uppercase tracking-[2.5px] text-[#C9A961]">Fase</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">
            Decide <strong className="text-[#C9A961]">para onde vais</strong>
          </h2>
          <p className="text-sm text-slate-500 mb-10 max-w-xl leading-relaxed">
            Não basta saber onde estás. Precisas de saber para onde ir — e qual o melhor caminho para lá chegar.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {phase2Services.map((svc) => (
              <ServiceCard key={svc.title} svc={svc} featured={svc.badge === "RECOMENDADO"} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2 text-center">
            Perguntas <strong className="text-[#C9A961]">frequentes</strong>
          </h2>
          <div className="w-10 h-0.5 bg-[#C9A961] mx-auto mb-10" />
          <div className="bg-white rounded-2xl border border-[#f0ebe0] p-6">
            {faqs.map((faq, i) => (
              <FaqItem key={i} faq={faq} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="py-20 px-6" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">
            Pronto para parar de <strong className="text-[#C9A961]">adivinhar</strong>?
          </h2>
          <p className="text-sm text-white/50 mb-6 leading-relaxed">
            Começa pelo diagnóstico gratuito. Em 30 segundos sabes onde estás — e o que fazer a seguir.
          </p>
          <p className="text-xs text-white/30 mb-8">O que dizem os nossos clientes</p>
          <div className="flex items-center justify-center gap-8 flex-wrap mb-10">
            <div className="text-center">
              <p className="text-xl font-bold text-[#C9A961]">+500</p>
              <p className="text-[0.65rem] text-white/40">Profissionais ajudados</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#C9A961]">5<Star className="w-3 h-3 inline text-[#C9A961] -mt-0.5 ml-0.5" /></p>
              <p className="text-[0.65rem] text-white/40">Avaliação média</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#C9A961]">98%</p>
              <p className="text-[0.65rem] text-white/40">Taxa de satisfação</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/cv-analyser"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C9A961] to-[#B8943D] text-white font-semibold px-7 py-3 rounded-full hover:opacity-90 transition-opacity"
            >
              Analisar o meu CV — Grátis
            </a>
            <a
              href="/career-path"
              className="inline-flex items-center gap-2 border border-white/20 text-white font-medium px-7 py-3 rounded-full hover:border-[#C9A961] hover:text-[#C9A961] transition-colors"
            >
              Traçar o meu caminho — 19,99\u20AC
            </a>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-20 px-6 bg-[#faf8f4]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-slate-900 mb-2">
            O que dizem os nossos <strong className="text-[#C9A961]">utilizadores</strong>
          </h2>
          <div className="w-10 h-0.5 bg-[#C9A961] mx-auto mb-10" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-xl p-5 border border-[#f0ebe0]">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-[#C9A961] fill-[#C9A961]" />
                  ))}
                </div>
                <p className="text-sm text-slate-500 leading-relaxed mb-4 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#C9A961] rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0">
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
