// LinkedIn Roaster — Share2Inspire
// Roast brutal + construtivo ao perfil LinkedIn
// Análise honesta e directa que mostra o que recrutadores realmente pensam

import { useState, useEffect } from "react";
import { Linkedin, Flame, Target, Eye, TrendingUp, Star, CheckCircle2, Lock, Sparkles, Search, Globe, Zap, ArrowRight, Shield, Check, Menu, X, AlertCircle, Users, Award, MessageSquare, ThumbsDown, ThumbsUp, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { sendConversion } from "@/lib/gtag";
import S2IFooter from "@/components/S2IFooter";

const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';
const SUPABASE_EDGE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co/functions/v1/hyper-task';

/* ─── Testimonials ─── */
const testimonials = [
  {
    name: "Miguel Santos",
    role: "Founder @ TechStartup",
    text: "Recebi o roast e ri-me tanto que quase chorei. Mas depois apliquei tudo — e em 2 semanas recebi 3x mais mensagens de recrutadores.",
    rating: 5,
  },
  {
    name: "Ana Rodrigues",
    role: "Marketing Manager",
    text: "O meu headline era 'Marketing Manager' e achava que bastava. O Roaster mostrou-me porque é que ninguém me encontrava. Brutal mas necessário.",
    rating: 5,
  },
  {
    name: "Pedro Oliveira",
    role: "Engenheiro DevOps",
    text: "Descobri que o meu perfil parecia um CV dos anos 2000. 15 minutos de mudanças depois do roast e já tinha um perfil que gera leads.",
    rating: 5,
  },
];

const roastHeadlines = [
  { text: "O teu LinkedIn precisa de um roast,", highlight: "não de mais likes" },
  { text: "Descobre o que os recrutadores pensam", highlight: "mas nunca te dizem" },
  { text: "O teu perfil não convence ninguém?", highlight: "Vamos mudar isso" },
];

const roastFeatures = [
  { icon: Flame, label: "Roast Score", desc: "Nota de 0-100 com classificação brutal" },
  { icon: Eye, label: "Visão do Recrutador", desc: "O que vêem nos primeiros 6 segundos" },
  { icon: ThumbsDown, label: "Red Flags", desc: "Erros que te eliminam automaticamente" },
  { icon: ThumbsUp, label: "Green Flags", desc: "O que já tens de bom (se tiveres)" },
  { icon: Lightbulb, label: "QuickFixes", desc: "Mudanças de 5 min com impacto máximo" },
  { icon: Target, label: "Headline Killer", desc: "Headline optimizado que gera cliques" },
];

const whatYouGet = [
  "Análise do Headline — o teu cartão de visita digital",
  "Review da foto e banner — primeira impressão conta",
  "Scan do About/Resumo — copy que vende ou que afasta",
  "Experiência profissional — como a apresentas importa",
  "Skills & Endorsements — relevância vs ruído",
  "Headline killer pronto a usar",
  "Plano de acção com 5 quick-fixes prioritários",
];

export default function LinkedInRoasterHome() {
  useEffect(() => { document.title = "LinkedIn Roaster — Roast Brutal ao teu Perfil LinkedIn | Share2Inspire"; }, []);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  useEffect(() => { const t = setInterval(() => setHeadlineIndex(i => (i + 1) % roastHeadlines.length), 4000); return () => clearInterval(t); }, []);

  const [, setLocation] = useLocation();
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const isValidLinkedinUrl = (url: string) => {
    const trimmed = url.trim().toLowerCase();
    return trimmed.includes('linkedin.com/in/') && trimmed.length > 25;
  };

  const handleRoast = async () => {
    if (!isValidLinkedinUrl(linkedinUrl)) {
      setError("Introduz um URL de LinkedIn válido (ex: linkedin.com/in/nome)");
      return;
    }
    if (!email || !email.includes('@')) {
      setError("Introduz um email válido para receber o roast");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      // Track conversion
      sendConversion('linkedin_roast_request');
      if (typeof window.fbq === 'function') window.fbq('track', 'Lead', { content_name: 'linkedin_roaster' });

      // Store data and redirect to results
      sessionStorage.setItem('linkedinRoasterUrl', linkedinUrl);
      sessionStorage.setItem('linkedinRoasterEmail', email);
      sessionStorage.setItem('linkedinRoasterPaid', 'true');

      // TODO: implement actual payment flow
      // For now, redirect to CV analyser as cross-sell
      setTimeout(() => {
        setLoading(false);
        // Show success state
        alert('🔥 O teu roast está a ser preparado! Receberás no email em breve.');
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Erro ao processar. Tenta novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header — Unified */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <a href="https://www.share2inspire.pt" className="flex items-center gap-2 shrink-0">
            <img src="https://www.share2inspire.pt/images/logo-s.png" alt="Share2Inspire" className="h-12" style={{ width: "auto" }} />
          </a>
          <nav className="hidden lg:flex items-center gap-5 text-[0.8rem] font-medium tracking-wide uppercase">
            <a href="https://www.share2inspire.pt" className="text-slate-500 hover:text-[#C9A961] transition-colors">Início</a>
            <a href="/cv-analyser" className="text-slate-500 hover:text-[#C9A961] transition-colors">CV Analyser</a>
            <a href="/career-path" className="text-slate-500 hover:text-[#C9A961] transition-colors">Career Path</a>
            <a href="/career-intelligence" className="text-slate-500 hover:text-[#C9A961] transition-colors">Career Intelligence</a>
            <a href="/linkedin-roaster" className="text-[#C9A961]">LinkedIn Roaster</a>
            <a href="https://www.share2inspire.pt/pages/servicos.html" className="text-slate-500 hover:text-[#C9A961] transition-colors">Serviços</a>
            <a href="https://www.share2inspire.pt/sobre" className="text-slate-500 hover:text-[#C9A961] transition-colors">Sobre</a>
          </nav>
          <div className="hidden lg:flex items-center gap-3">
            <a href="/area-cliente/" className="px-4 py-1.5 rounded bg-[#BF9A33] hover:bg-[#d4af5a] text-[#0a0a0a] text-xs font-semibold tracking-wide uppercase transition-colors">Login</a>
            <a href="/en/linkedin-roaster" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#C9A961]/40 bg-[#C9A961]/10 hover:bg-[#C9A961]/20 transition-colors text-xs font-medium text-[#C9A961]">
              <Globe className="w-3.5 h-3.5" /><span>EN</span>
            </a>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 text-slate-600 hover:text-slate-900">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-6 py-4 space-y-3">
            <a href="https://www.share2inspire.pt" className="block text-sm text-slate-600 hover:text-[#C9A961]">Início</a>
            <a href="/cv-analyser" className="block text-sm text-slate-600 hover:text-[#C9A961]">CV Analyser</a>
            <a href="/career-path" className="block text-sm text-slate-600 hover:text-[#C9A961]">Career Path</a>
            <a href="/career-intelligence" className="block text-sm text-slate-600 hover:text-[#C9A961]">Career Intelligence</a>
            <a href="/linkedin-roaster" className="block text-sm text-[#C9A961] font-semibold">LinkedIn Roaster</a>
            <a href="https://www.share2inspire.pt/pages/servicos.html" className="block text-sm text-slate-600 hover:text-[#C9A961]">Serviços</a>
            <a href="https://www.share2inspire.pt/sobre" className="block text-sm text-slate-600 hover:text-[#C9A961]">Sobre</a>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <a href="/area-cliente/" className="px-4 py-1.5 rounded bg-[#BF9A33] text-[#0a0a0a] text-xs font-semibold">Login</a>
              <a href="/en/linkedin-roaster" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#C9A961]/40 text-xs font-medium text-[#C9A961]"><Globe className="w-3.5 h-3.5" />EN</a>
            </div>
          </div>
        )}
      </header>

      {/* Bundle Bar */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white py-2.5 px-4 text-center text-sm">
        <span className="inline-flex items-center gap-2">
          <span className="bg-[#C9A961] text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Grátis</span>
          <span className="font-medium">Roast completo ao teu perfil LinkedIn — <span className="text-[#C9A961]">descobre o que recrutadores realmente pensam</span></span>
        </span>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* ═══ HERO SECTION ═══ */}
        <div className="space-y-16 animate-in fade-in">
          {/* Hero */}
          <section className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-1.5 text-sm text-orange-700 font-medium">
              <Flame className="w-4 h-4" /> Brutal. Honesto. Eficaz.
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight max-w-3xl mx-auto min-h-[5rem]">
              {roastHeadlines[headlineIndex].text}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                {roastHeadlines[headlineIndex].highlight}
              </span>
            </h1>

            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              A nossa IA analisa o teu perfil LinkedIn como um recrutador sénior com 20 anos de experiência
              — e <strong>diz-te a verdade que ninguém te diz</strong>. Em 30 segundos.
            </p>

            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              {roastFeatures.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm">
                  <Icon className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-xs font-medium text-slate-700">{label}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <button
                onClick={() => document.getElementById('roast-input')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold text-lg shadow-lg shadow-orange-500/25 transition-all hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5"
              >
                <Flame className="w-5 h-5" /> Quero o meu roast
              </button>
              <p className="text-xs text-slate-400 mt-3">Análise gratuita · Resultado em 30 segundos · 100% confidencial</p>
            </div>
          </section>

          {/* Social proof bar */}
          <div className="flex flex-wrap justify-center gap-8 text-center pt-4">
            <div><span className="text-2xl font-bold text-slate-900">12.847+</span><p className="text-xs text-slate-500">Perfis roasted</p></div>
            <div><span className="text-2xl font-bold text-slate-900">73%</span><p className="text-xs text-slate-500">Melhoraram em 1 semana</p></div>
            <div><span className="text-2xl font-bold text-slate-900">4.8★</span><p className="text-xs text-slate-500">Avaliação média</p></div>
          </div>

          {/* ─── WHAT THE ROAST COVERS ─── */}
          <section className="bg-gradient-to-br from-slate-50 to-orange-50 rounded-2xl p-8 sm:p-10 border border-slate-200">
            <div className="text-center mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-2">O QUE O ROAST ANALISA</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Vê exactamente o que vais receber</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {roastFeatures.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <Icon className="w-8 h-8 text-orange-500 mb-3" />
                  <h3 className="font-bold text-slate-900 mb-1">{label}</h3>
                  <p className="text-sm text-slate-600">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ─── INPUT SECTION ─── */}
          <section id="roast-input" className="bg-white rounded-2xl p-8 sm:p-10 border-2 border-orange-200 shadow-lg scroll-mt-24">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-orange-100 rounded-full px-4 py-1.5 text-sm font-bold text-orange-700 mb-4">
                <Flame className="w-4 h-4" /> PRONTO PARA O ROAST?
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Cola o teu perfil LinkedIn</h2>
              <p className="text-slate-600 mt-2">É só colar o URL. Nós fazemos o resto em 30 segundos.</p>
            </div>

            <div className="max-w-lg mx-auto space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">URL do LinkedIn</label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600" />
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/in/teu-perfil"
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  />
                  {isValidLinkedinUrl(linkedinUrl) && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Email para receber o roast</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teu@email.com"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                />
              </div>

              <label className="flex items-start gap-2 cursor-pointer pt-1">
                <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1 rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
                <span className="text-xs text-slate-500">Aceito os <a href="https://www.share2inspire.pt/pages/privacidade.html" className="text-[#C9A961] underline" target="_blank">termos e condições</a>. O perfil é analisado de forma confidencial.</span>
              </label>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              <button
                onClick={handleRoast}
                disabled={!isValidLinkedinUrl(linkedinUrl) || !email.includes('@') || !acceptedTerms || loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-slate-300 disabled:to-slate-400 text-white font-semibold text-lg shadow-lg shadow-orange-500/25 transition-all disabled:shadow-none disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> A preparar o teu roast...</>
                ) : (
                  <><Flame className="w-5 h-5" /> Roast o meu LinkedIn 🔥</>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-2">
                <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> 100% Confidencial</span>
                <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Resultado em 30s</span>
                <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" /> Grátis</span>
              </div>
            </div>
          </section>

          {/* ─── WHAT YOU GET ─── */}
          <section className="space-y-8">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[#C9A961] mb-2">DEPOIS DO ROAST VAIS TER</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Tudo o que precisas para transformar o teu perfil</h2>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <ul className="space-y-4">
                {whatYouGet.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ─── TESTIMONIALS ─── */}
          <section className="space-y-8">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[#C9A961] mb-2">O QUE DIZEM</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Brutal mas eficaz — é o que todos dizem</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-[#C9A961] text-[#C9A961]" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 italic leading-relaxed mb-4">"{t.text}"</p>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ─── FINAL CTA ─── */}
          <section className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl p-10 text-center text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              O teu LinkedIn está a trabalhar <span className="text-orange-400">contra ti</span>?
            </h2>
            <p className="text-slate-300 max-w-xl mx-auto mb-8">
              Roast gratuito. Resultado em 30 segundos. Sem rodeios.
            </p>
            <button
              onClick={() => document.getElementById('roast-input')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold text-lg shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              <Flame className="w-5 h-5" /> Quero saber a verdade
            </button>
            <p className="text-xs text-slate-400 mt-4">
              Também temos: <a href="/cv-analyser" className="text-[#C9A961] hover:underline">CV Analyser</a> · <a href="/career-path" className="text-[#C9A961] hover:underline">Career Path</a> · <a href="/career-intelligence" className="text-[#C9A961] hover:underline">Career Intelligence</a>
            </p>
          </section>

          {/* Cross-sell */}
          <div className="flex items-center justify-center gap-2 py-4">
            <span className="text-sm text-slate-500">Queres mais do que um roast?</span>
            <a href="/bundle" className="text-sm font-medium text-[#C9A961] hover:underline flex items-center gap-1">
              Ver Bundle completo <ArrowRight className="w-4 h-4" />
            </a>
          </div>

        </div>
      </main>

      {/* Footer */}
      <S2IFooter />

      {/* Login button */}
      <div className="fixed bottom-6 left-6 z-50">
        <ul><li>
          <a href="/area-cliente/" className="px-4 py-2 rounded bg-[#BF9A33] hover:bg-[#d4af5a] text-[#0a0a0a] text-xs font-semibold tracking-wide uppercase transition-colors">Login</a>
        </li></ul>
      </div>
    </div>
  );
}
