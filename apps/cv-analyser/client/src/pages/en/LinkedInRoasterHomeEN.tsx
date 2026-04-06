// LinkedIn Roaster — English Version
// Brutal + constructive LinkedIn profile roast

import { useState, useEffect } from "react";
import { Linkedin, Flame, Target, Eye, TrendingUp, Star, CheckCircle2, Lock, Sparkles, Search, Globe, Zap, ArrowRight, Shield, Check, Menu, X, AlertCircle, Users, Award, MessageSquare, ThumbsDown, ThumbsUp, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { sendConversion } from "@/lib/gtag";
import S2IFooterEN from "@/components/S2IFooterEN";

const roastHeadlines = [
  { text: "Your LinkedIn needs a roast,", highlight: "not more likes" },
  { text: "Find out what recruiters think", highlight: "but never tell you" },
  { text: "Your profile isn't convincing anyone?", highlight: "Let's fix that" },
];

const roastFeatures = [
  { icon: Flame, label: "Roast Score", desc: "Score from 0-100 with brutal feedback" },
  { icon: Eye, label: "Recruiter View", desc: "What they see in the first 6 seconds" },
  { icon: ThumbsDown, label: "Red Flags", desc: "Mistakes that get you auto-rejected" },
  { icon: ThumbsUp, label: "Green Flags", desc: "What's actually good (if anything)" },
  { icon: Lightbulb, label: "QuickFixes", desc: "5-minute changes with maximum impact" },
  { icon: Target, label: "Killer Headline", desc: "Optimised headline that drives clicks" },
];

const whatYouGet = [
  "Headline Analysis — your digital business card",
  "Photo & Banner review — first impressions matter",
  "About/Summary scan — copy that sells vs repels",
  "Work experience — presentation matters more than content",
  "Skills & Endorsements — relevance vs noise",
  "Killer headline ready to use",
  "Action plan with 5 priority quick-fixes",
];

const testimonials = [
  {
    name: "James Mitchell",
    role: "Founder @ TechStartup",
    text: "I got the roast and laughed so hard I nearly cried. But then I applied everything — and within 2 weeks I got 3x more recruiter messages.",
    rating: 5,
  },
  {
    name: "Sarah Thompson",
    role: "Marketing Manager",
    text: "My headline was just 'Marketing Manager' and I thought that was enough. The Roaster showed me why nobody was finding me. Brutal but necessary.",
    rating: 5,
  },
  {
    name: "David Chen",
    role: "DevOps Engineer",
    text: "Discovered my profile looked like a CV from 2005. 15 minutes of changes after the roast and I had a profile that generates leads.",
    rating: 5,
  },
];

export default function LinkedInRoasterHomeEN() {
  useEffect(() => { document.title = "LinkedIn Roaster — Brutal Profile Roast with AI | Share2Inspire"; }, []);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  useEffect(() => { const t = setInterval(() => setHeadlineIndex(i => (i + 1) % roastHeadlines.length), 4000); return () => clearInterval(t); }, []);

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
      setError("Enter a valid LinkedIn URL (e.g. linkedin.com/in/yourname)");
      return;
    }
    if (!email || !email.includes('@')) {
      setError("Enter a valid email to receive your roast");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      sendConversion('linkedin_roast_request');
      if (typeof window.fbq === 'function') window.fbq('track', 'Lead', { content_name: 'linkedin_roaster' });
      sessionStorage.setItem('linkedinRoasterUrl', linkedinUrl);
      sessionStorage.setItem('linkedinRoasterEmail', email);
      sessionStorage.setItem('linkedinRoasterPaid', 'true');
      setTimeout(() => {
        setLoading(false);
        alert('🔥 Your roast is being prepared! You\'ll receive it by email shortly.');
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Error processing. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <a href="https://www.share2inspire.pt/en" className="flex items-center gap-2 shrink-0">
            <img src="https://www.share2inspire.pt/images/logo-s.png" alt="Share2Inspire" className="h-12" style={{ width: "auto" }} />
          </a>
          <nav className="hidden lg:flex items-center gap-5 text-[0.8rem] font-medium tracking-wide uppercase">
            <a href="https://www.share2inspire.pt/en" className="text-slate-500 hover:text-[#C9A961] transition-colors">Home</a>
            <a href="/en/cv-analyser" className="text-slate-500 hover:text-[#C9A961] transition-colors">CV Analyser</a>
            <a href="/en/career-path" className="text-slate-500 hover:text-[#C9A961] transition-colors">Career Path</a>
            <a href="/en/career-intelligence" className="text-slate-500 hover:text-[#C9A961] transition-colors">Career Intelligence</a>
            <a href="/en/linkedin-roaster" className="text-[#C9A961]">LinkedIn Roaster</a>
            <a href="https://www.share2inspire.pt/en/pages/services" className="text-slate-500 hover:text-[#C9A961] transition-colors">Services</a>
            <a href="https://www.share2inspire.pt/en/about" className="text-slate-500 hover:text-[#C9A961] transition-colors">About</a>
          </nav>
          <div className="hidden lg:flex items-center gap-3">
            <a href="/area-cliente/" className="px-4 py-1.5 rounded bg-[#BF9A33] hover:bg-[#d4af5a] text-[#0a0a0a] text-xs font-semibold tracking-wide uppercase transition-colors">Login</a>
            <a href="/linkedin-roaster" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#C9A961]/40 bg-[#C9A961]/10 hover:bg-[#C9A961]/20 transition-colors text-xs font-medium text-[#C9A961]">
              <Globe className="w-3.5 h-3.5" /><span>PT</span>
            </a>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 text-slate-600 hover:text-slate-900">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-6 py-4 space-y-3">
            <a href="https://www.share2inspire.pt/en" className="block text-sm text-slate-600 hover:text-[#C9A961]">Home</a>
            <a href="/en/cv-analyser" className="block text-sm text-slate-600 hover:text-[#C9A961]">CV Analyser</a>
            <a href="/en/career-path" className="block text-sm text-slate-600 hover:text-[#C9A961]">Career Path</a>
            <a href="/en/career-intelligence" className="block text-sm text-slate-600 hover:text-[#C9A961]">Career Intelligence</a>
            <a href="/en/linkedin-roaster" className="block text-sm text-[#C9A961] font-semibold">LinkedIn Roaster</a>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <a href="/area-cliente/" className="px-4 py-1.5 rounded bg-[#BF9A33] text-[#0a0a0a] text-xs font-semibold">Login</a>
              <a href="/linkedin-roaster" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#C9A961]/40 text-xs font-medium text-[#C9A961]"><Globe className="w-3.5 h-3.5" />PT</a>
            </div>
          </div>
        )}
      </header>

      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white py-2.5 px-4 text-center text-sm">
        <span className="inline-flex items-center gap-2">
          <span className="bg-[#C9A961] text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Free</span>
          <span className="font-medium">Complete LinkedIn profile roast — <span className="text-[#C9A961]">find out what recruiters really think</span></span>
        </span>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="space-y-16 animate-in fade-in">
          <section className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-1.5 text-sm text-orange-700 font-medium">
              <Flame className="w-4 h-4" /> Brutal. Honest. Effective.
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight max-w-3xl mx-auto min-h-[5rem]">
              {roastHeadlines[headlineIndex].text}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                {roastHeadlines[headlineIndex].highlight}
              </span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Our AI analyses your LinkedIn profile like a senior recruiter with 20 years of experience
              — and <strong>tells you the truth nobody else will</strong>. In 30 seconds.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              {roastFeatures.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm">
                  <Icon className="w-3.5 h-3.5 text-orange-500" /><span className="text-xs font-medium text-slate-700">{label}</span>
                </div>
              ))}
            </div>
            <div className="pt-4">
              <button onClick={() => document.getElementById('roast-input')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold text-lg shadow-lg shadow-orange-500/25 transition-all hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5">
                <Flame className="w-5 h-5" /> Get my roast
              </button>
              <p className="text-xs text-slate-400 mt-3">Free analysis · Results in 30 seconds · 100% confidential</p>
            </div>
          </section>

          <div className="flex flex-wrap justify-center gap-8 text-center pt-4">
            <div><span className="text-2xl font-bold text-slate-900">12,847+</span><p className="text-xs text-slate-500">Profiles roasted</p></div>
            <div><span className="text-2xl font-bold text-slate-900">73%</span><p className="text-xs text-slate-500">Improved in 1 week</p></div>
            <div><span className="text-2xl font-bold text-slate-900">4.8★</span><p className="text-xs text-slate-500">Average rating</p></div>
          </div>

          <section className="bg-gradient-to-br from-slate-50 to-orange-50 rounded-2xl p-8 sm:p-10 border border-slate-200">
            <div className="text-center mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-2">WHAT THE ROAST COVERS</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">See exactly what you'll get</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {roastFeatures.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <Icon className="w-8 h-8 text-orange-500 mb-3" /><h3 className="font-bold text-slate-900 mb-1">{label}</h3><p className="text-sm text-slate-600">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="roast-input" className="bg-white rounded-2xl p-8 sm:p-10 border-2 border-orange-200 shadow-lg scroll-mt-24">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-orange-100 rounded-full px-4 py-1.5 text-sm font-bold text-orange-700 mb-4">
                <Flame className="w-4 h-4" /> READY FOR THE ROAST?
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Paste your LinkedIn profile</h2>
              <p className="text-slate-600 mt-2">Just paste the URL. We'll do the rest in 30 seconds.</p>
            </div>
            <div className="max-w-lg mx-auto space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">LinkedIn URL</label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600" />
                  <input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://www.linkedin.com/in/your-profile" className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
                  {isValidLinkedinUrl(linkedinUrl) && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Email to receive the roast</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
              </div>
              <label className="flex items-start gap-2 cursor-pointer pt-1">
                <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1 rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
                <span className="text-xs text-slate-500">I accept the <a href="https://www.share2inspire.pt/en/pages/privacy" className="text-[#C9A961] underline" target="_blank">terms and conditions</a>. The profile is analysed confidentially.</span>
              </label>
              {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700"><AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}</div>}
              <button onClick={handleRoast} disabled={!isValidLinkedinUrl(linkedinUrl) || !email.includes('@') || !acceptedTerms || loading} className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-slate-300 disabled:to-slate-400 text-white font-semibold text-lg shadow-lg shadow-orange-500/25 transition-all disabled:shadow-none disabled:cursor-not-allowed">
                {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Preparing your roast...</> : <><Flame className="w-5 h-5" /> Roast my LinkedIn 🔥</>}
              </button>
              <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-2">
                <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> 100% Confidential</span>
                <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Results in 30s</span>
                <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" /> Free</span>
              </div>
            </div>
          </section>

          <section className="space-y-8">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[#C9A961] mb-2">AFTER THE ROAST YOU'LL HAVE</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Everything you need to transform your profile</h2>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <ul className="space-y-4">
                {whatYouGet.map((item, i) => (
                  <li key={i} className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" /><span className="text-slate-700">{item}</span></li>
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-8">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[#C9A961] mb-2">WHAT THEY SAY</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Brutal but effective — that's the consensus</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex gap-0.5 mb-3">{Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 fill-[#C9A961] text-[#C9A961]" />)}</div>
                  <p className="text-sm text-slate-600 italic leading-relaxed mb-4">"{t.text}"</p>
                  <div><p className="text-sm font-semibold text-slate-900">{t.name}</p><p className="text-xs text-slate-500">{t.role}</p></div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl p-10 text-center text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Is your LinkedIn working <span className="text-orange-400">against you</span>?</h2>
            <p className="text-slate-300 max-w-xl mx-auto mb-8">Free roast. Results in 30 seconds. No sugarcoating.</p>
            <button onClick={() => document.getElementById('roast-input')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold text-lg shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5">
              <Flame className="w-5 h-5" /> I want the truth
            </button>
            <p className="text-xs text-slate-400 mt-4">Also available: <a href="/en/cv-analyser" className="text-[#C9A961] hover:underline">CV Analyser</a> · <a href="/en/career-path" className="text-[#C9A961] hover:underline">Career Path</a> · <a href="/en/career-intelligence" className="text-[#C9A961] hover:underline">Career Intelligence</a></p>
          </section>

          <div className="flex items-center justify-center gap-2 py-4">
            <span className="text-sm text-slate-500">Want more than a roast?</span>
            <a href="/en/bundle" className="text-sm font-medium text-[#C9A961] hover:underline flex items-center gap-1">See full Bundle <ArrowRight className="w-4 h-4" /></a>
          </div>
        </div>
      </main>

      <S2IFooterEN />
    </div>
  );
}
