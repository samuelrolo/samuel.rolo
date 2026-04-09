// LandingPageEN — Share2Inspire Homepage (EN)
// Sections: Hero, Trust Badges, Tools Grid, Target Audience, CTA, Testimonials
import { useEffect } from "react";
import { FileText, Linkedin, Route, Zap, GraduationCap, Rocket, Clock, CheckSquare, BarChart3, User, ArrowRightLeft, Timer } from "lucide-react";
import S2IHeaderEN from "@/components/S2IHeaderEN";
import S2IFooterEN from "@/components/S2IFooterEN";
import PromoBanner from "@/components/PromoBanner";

const tools = [
  {
    icon: <FileText className="w-6 h-6" />,
    title: "CV Analyser",
    desc: "ATS diagnosis in 30 seconds. Find out why you're not getting callbacks.",
    link: "/en/cv-analyser",
    cta: "Analyse my CV",
    color: "#C9A961",
  },
  {
    icon: <Linkedin className="w-6 h-6" />,
    title: "LinkedIn Roaster",
    desc: "Honest feedback on your profile. What recruiters actually see.",
    link: "/en/linkedin-roaster",
    cta: "Analyse profile",
    color: "#0077B5",
  },
  {
    icon: <Route className="w-6 h-6" />,
    title: "Career Path",
    desc: "AI-powered personalised roadmap. 3 ideal roles, gaps and action plan.",
    link: "/en/career-path",
    cta: "Build roadmap",
    color: "#C9A961",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Career Intelligence",
    desc: "Strategic comparison of 3 career paths with trade-offs and final recommendation.",
    link: "/en/career-intelligence",
    cta: "Learn more",
    color: "#C9A961",
  },
  {
    icon: <GraduationCap className="w-6 h-6" />,
    title: "Student Pack",
    desc: "CV Analyser + LinkedIn Roaster in one pack. Full diagnosis for \u20AC7.99.",
    link: "/en/student-pack",
    cta: "Save 43%",
    color: "#10b981",
  },
  {
    icon: <Rocket className="w-6 h-6" />,
    title: "KickStart Pro",
    desc: "1:1 strategic session to clarify options and define your next steps.",
    link: "/en/services",
    cta: "Book session",
    color: "#C9A961",
  },
];

const testimonials = [
  {
    quote: "I went from 45 to 82 ATS points in 10 minutes. Absolutely essential for job seekers.",
    name: "Ana M.",
    role: "Senior Manager",
    initials: "AM",
  },
  {
    quote: "The LinkedIn Roaster gave me feedback I'd never received. My profile is so much stronger now.",
    name: "Diogo S.",
    role: "Software Engineer",
    initials: "DS",
  },
  {
    quote: "Finally a tool that tells me exactly what recruiters want to see. A game-changer.",
    name: "Mariana C.",
    role: "Product Manager",
    initials: "MC",
  },
];

const ctaCards = [
  {
    icon: <FileText className="w-5 h-5" />,
    title: "Want more recruiter callbacks?",
    desc: "Discover your ATS Score and what to change in your CV to pass the filters.",
    link: "/en/cv-analyser",
    label: "CV Analyser",
    cta: "Analyse your CV",
  },
  {
    icon: <Linkedin className="w-5 h-5" />,
    title: "Is your profile attracting opportunities?",
    desc: "Get an honest diagnosis of what recruiters actually see.",
    link: "/en/linkedin-roaster",
    label: "LinkedIn Roaster",
    cta: "Analyse profile",
  },
  {
    icon: <Route className="w-5 h-5" />,
    title: "Want clarity on your next step?",
    desc: "AI-powered personalised roadmap: ideal roles, gaps and 30-60-90 action plan.",
    link: "/en/career-path",
    label: "Career Path",
    cta: "Explore my path",
  },
];

export default function LandingPageEN() {
  useEffect(() => {
    document.title = "Share2Inspire | Career Intelligence Platform";
  }, []);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <S2IHeaderEN activePage="home" langToggleHref="/" />
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
            Build your career with <strong className="text-[#C9A961]">strategy</strong>,
            <br className="hidden md:block" /> not trial and error
          </h1>
          <p className="text-base md:text-lg text-white/70 mb-10 max-w-xl mx-auto leading-relaxed">
            A complete ecosystem to understand where you are, what to adjust and what the right next step is.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/en/cv-analyser" className="group bg-white/10 backdrop-blur border border-white/20 rounded-xl px-6 py-5 text-left hover:bg-white/15 hover:border-[#C9A961]/40 transition-all max-w-xs">
              <h3 className="text-base font-semibold mb-1">I want to improve my CV</h3>
              <p className="text-sm text-white/50 mb-3">Find out why you're not getting callbacks and what to change.</p>
              <span className="text-xs font-bold uppercase tracking-widest text-[#C9A961]">Analyse my CV &rarr;</span>
            </a>
            <a href="/en/career-path" className="group bg-white/10 backdrop-blur border border-white/20 rounded-xl px-6 py-5 text-left hover:bg-white/15 hover:border-[#C9A961]/40 transition-all max-w-xs">
              <h3 className="text-base font-semibold mb-1">I want to define my next step</h3>
              <p className="text-sm text-white/50 mb-3">Discover which path makes sense for your career growth.</p>
              <span className="text-xs font-bold uppercase tracking-widest text-[#C9A961]">Explore my path &rarr;</span>
            </a>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ─── TRUST BADGES ─── */}
      <section className="py-10 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          <div className="flex items-center gap-3 text-center md:text-left">
            <Clock className="w-5 h-5 text-[#C9A961] shrink-0" />
            <p className="text-sm text-slate-600">Diagnosis in seconds, no complexity</p>
          </div>
          <div className="flex items-center gap-3 text-center md:text-left">
            <CheckSquare className="w-5 h-5 text-[#C9A961] shrink-0" />
            <p className="text-sm text-slate-600">Based on real recruitment criteria</p>
          </div>
          <div className="flex items-center gap-3 text-center md:text-left">
            <BarChart3 className="w-5 h-5 text-[#C9A961] shrink-0" />
            <p className="text-sm text-slate-600">Clear and actionable recommendations</p>
          </div>
        </div>
      </section>

      {/* ─── TOOLS GRID ─── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-slate-900 mb-2">
            Our <strong className="text-[#C9A961]">tools</strong>
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
            Who is <strong className="text-[#C9A961]">Share2Inspire</strong> for?
          </h2>
          <div className="w-10 h-0.5 bg-[#C9A961] mx-auto mb-10" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <User className="w-6 h-6 text-[#C9A961] mx-auto mb-3" />
              <p className="text-sm text-white/70 leading-relaxed">Professionals not getting responses to applications</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <ArrowRightLeft className="w-6 h-6 text-[#C9A961] mx-auto mb-3" />
              <p className="text-sm text-white/70 leading-relaxed">People in career transition</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <Timer className="w-6 h-6 text-[#C9A961] mx-auto mb-3" />
              <p className="text-sm text-white/70 leading-relaxed">Those who want to grow but lack direction</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section className="py-20 px-6" style={{ background: "linear-gradient(180deg, #16213e 0%, #1a1a2e 100%)" }}>
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[0.68rem] font-bold uppercase tracking-[2.5px] text-[#C9A961] mb-3">Start today</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">Where do you want to start?</h2>
          <p className="text-sm text-white/45 mb-10">Results in under 60 seconds. No subscription.</p>
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
            Or <a href="/en/services" className="text-[#C9A961]/60 hover:text-[#C9A961] transition-colors">see all services &rarr;</a>
          </p>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-20 px-6 bg-[#faf8f4]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-slate-900 mb-2">
            What our <strong className="text-[#C9A961]">users</strong> say
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

      <S2IFooterEN />
    </div>
  );
}
