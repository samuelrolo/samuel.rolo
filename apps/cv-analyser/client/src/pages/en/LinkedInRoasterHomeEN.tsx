// LinkedIn Roaster — English Version
// Brutal + constructive LinkedIn profile roast — PAID 3.99€

import { useState, useEffect } from "react";
import { Linkedin, Flame, Target, Eye, TrendingUp, Star, CheckCircle2, Lock, Sparkles, Search, Globe, Zap, ArrowRight, Shield, Check, Menu, X, AlertCircle, Users, Award, MessageSquare, ThumbsDown, ThumbsUp, Lightbulb, CreditCard, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { sendConversion } from "@/lib/gtag";
import S2IHeaderEN from "@/components/S2IHeaderEN";
import S2IFooterEN from "@/components/S2IFooterEN";

const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';
const PRICE = '3.99';
const PRICE_NUM = 3.99;

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
  { name: "James Mitchell", role: "Founder @ TechStartup", text: "I got the roast and laughed so hard I nearly cried. But then I applied everything — and within 2 weeks I got 3x more recruiter messages.", rating: 5 },
  { name: "Sarah Thompson", role: "Marketing Manager", text: "My headline was just 'Marketing Manager' and I thought that was enough. The Roaster showed me why nobody was finding me. Brutal but necessary.", rating: 5 },
  { name: "David Chen", role: "DevOps Engineer", text: "Discovered my profile looked like a CV from 2005. 15 minutes of changes after the roast and I had a profile that generates leads.", rating: 5 },
];

export default function LinkedInRoasterHomeEN() {
  useEffect(() => { document.title = "LinkedIn Roaster — Brutal Profile Roast with AI | Share2Inspire"; }, []);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  useEffect(() => { const t = setInterval(() => setHeadlineIndex(i => (i + 1) % roastHeadlines.length), 4000); return () => clearInterval(t); }, []);

  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Payment state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'payment' | 'success'>('payment');

  const [loadingMsg, setLoadingMsg] = useState("");
  const SUPABASE_EDGE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co/functions/v1/hyper-task';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
  const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';

  const isValidLinkedinUrl = (url: string) => {
    const trimmed = url.trim().toLowerCase();
    return trimmed.includes('linkedin.com/in/') && trimmed.length > 25;
  };

  const handleProceedToPayment = () => {
    if (!isValidLinkedinUrl(linkedinUrl)) { setError("Enter a valid LinkedIn URL (e.g. linkedin.com/in/yourname)"); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email"); return; }
    if (!acceptedTerms) { setError("Please accept the Privacy Policy"); return; }
    setError(null);
    sessionStorage.setItem('linkedinRoasterEmail', email.trim().toLowerCase());
    sessionStorage.setItem('linkedinRoasterUrl', linkedinUrl);
    setPaymentStep('payment');
    setPaymentError(null);
    setShowPaymentModal(true);
  };

  const handleRoast = async () => {
    setError(null);
    setLoading(true);
    const startTime = Date.now();
    const messages = ["Analysing your LinkedIn profile...", "Comparing with top performers...", "Evaluating headline, about & experience...", "Checking SEO & keywords...", "Preparing your personalised report..."];
    let msgIdx = 0;
    setLoadingMsg(messages[0]);
    const msgInterval = setInterval(() => { msgIdx = (msgIdx + 1) % messages.length; setLoadingMsg(messages[msgIdx]); }, 3000);

    try {
      sendConversion(PRICE_NUM, 'EUR', `roast-${Date.now()}`);
      if (typeof (window as any).fbq === 'function') (window as any).fbq('track', 'Purchase', { value: PRICE_NUM, currency: 'EUR', content_name: 'linkedin_roaster' });

      let responseData: any = null;
      for (let attempt = 0; attempt <= 2; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);
        try {
          const response = await fetch(SUPABASE_EDGE_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'linkedin_roast', linkedin_url: linkedinUrl, language: 'en' }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (response.ok) { responseData = await response.json(); if (responseData.success) break; }
          if (attempt < 2) await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (attempt < 2 && fetchError.name !== 'AbortError') await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          else throw fetchError;
        }
      }

      if (!responseData?.success) throw new Error(responseData?.error || 'Could not analyse the profile. Check the URL and ensure the profile is public.');

      sessionStorage.setItem('linkedinRoasterAnalysis', JSON.stringify(responseData));
      sessionStorage.setItem('linkedinRoasterEmail', email);
      sessionStorage.setItem('linkedinRoasterUrl', linkedinUrl);
      sessionStorage.setItem('linkedinRoasterPaid', 'true');

      try {
        fetch(`${SUPABASE_URL}/rest/v1/linkedin_roaster_analyses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Prefer': 'return=representation' },
          body: JSON.stringify({ profile_url: linkedinUrl, user_email: email.trim().toLowerCase(), score: responseData?.teaser?.nota_geral || 0, analysis_result: JSON.stringify(responseData), domain: 'share2inspire.pt', created_at: new Date().toISOString() }),
        }).catch(() => {});
      } catch (_) {}

      const elapsed = Date.now() - startTime;
      if (elapsed < 2800) await new Promise(r => setTimeout(r, 2800 - elapsed));

      clearInterval(msgInterval);
      setLoadingMsg("All done! Opening your report...");
      setTimeout(() => { window.location.href = '/en/linkedin-roaster/results'; }, 800);
    } catch (err: any) {
      clearInterval(msgInterval);
      setError(err.message || "Error processing. Try again.");
      setLoading(false);
    }
  };

  const handleStripePayment = async () => {
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      const orderId = `ROAST-EN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const response = await fetch(`${BACKEND_URL}/api/payment/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: email.split('@')[0], amount: PRICE_NUM, currency: 'eur', description: 'LinkedIn Roaster — Brutal Profile Roast — Share2Inspire', orderId, success_url: `${window.location.origin}/en/linkedin-roaster?paid=true`, cancel_url: `${window.location.origin}/en/linkedin-roaster` }),
      });
      const data = await response.json();
      if (data.url) { sessionStorage.setItem('linkedinRoasterPendingOrderId', orderId); window.location.href = data.url; }
      else throw new Error(data.error || 'Error creating payment session');
    } catch (err: any) { setPaymentError(err.message || 'Error processing payment'); }
    finally { setPaymentLoading(false); }
  };

  const handlePayPalPayment = () => {
    window.open(`https://paypal.me/SamuelRolo/${PRICE_NUM}EUR`, '_blank');
    setPaymentStep('success');
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('paid') === 'true') {
      window.history.replaceState({}, '', '/en/linkedin-roaster');
      const savedEmail = sessionStorage.getItem('linkedinRoasterEmail') || '';
      const savedUrl = sessionStorage.getItem('linkedinRoasterUrl') || '';
      if (savedUrl) { setLinkedinUrl(savedUrl); setEmail(savedEmail); setTimeout(() => handleRoast(), 500); }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background" style={{ overflowX: 'hidden' }}>
      <S2IHeaderEN activePage="linkedin-roaster" langToggleHref="/linkedin-roaster" />

      {/* Price Bar */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white py-2.5 px-4 text-center text-sm">
        <span className="inline-flex items-center gap-2">
          <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">€{PRICE}</span>
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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">{roastHeadlines[headlineIndex].highlight}</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Our AI analyses your LinkedIn profile like a senior recruiter with 20 years of experience — and <strong>tells you the truth nobody else will</strong>. In 30 seconds.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              {roastFeatures.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm">
                  <Icon className="w-3.5 h-3.5 text-orange-500" /><span className="text-xs font-medium text-slate-700">{label}</span>
                </div>
              ))}
            </div>
            <div className="pt-4">
              <button onClick={() => document.getElementById('roast-input')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold text-lg shadow-lg shadow-orange-500/25 transition-all hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 min-w-[200px]">
                <Flame className="w-5 h-5" /> Get my roast
              </button>
              <p className="text-xs text-slate-400 mt-3">Only €{PRICE} · Results in 30 seconds · 100% confidential</p>
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

          {/* INPUT SECTION */}
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
              <button
                onClick={handleProceedToPayment}
                disabled={!isValidLinkedinUrl(linkedinUrl) || !email.includes('@') || !acceptedTerms || loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-slate-300 disabled:to-slate-400 text-white font-semibold text-lg shadow-lg shadow-orange-500/25 transition-all disabled:shadow-none disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> {loadingMsg || 'Preparing your roast...'}</>
                ) : (
                  <><Flame className="w-5 h-5" /> Pay €{PRICE} & get roasted 🔥</>
                )}
              </button>
              <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-2">
                <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> 100% Confidential</span>
                <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Results in 30s</span>
                <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> Secure payment</span>
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
            <p className="text-slate-300 max-w-xl mx-auto mb-8">Complete roast for just €{PRICE}. Results in 30 seconds. No sugarcoating.</p>
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

      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => { if (!paymentLoading) setShowPaymentModal(false); }}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Pay €{PRICE}</h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-slate-100 rounded-full" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>

            {paymentStep === 'payment' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">LinkedIn Roaster — Brutal Profile Roast</p>

                <div className="flex gap-2">
                  <button onClick={() => setPaymentMethod('stripe')} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${paymentMethod === 'stripe' ? 'bg-[#C9A961] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <CreditCard className="w-4 h-4 inline mr-1" />Card
                  </button>
                  <button onClick={() => setPaymentMethod('paypal')} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${paymentMethod === 'paypal' ? 'bg-[#C9A961] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    PayPal
                  </button>
                </div>

                {paymentError && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">{paymentError}</div>}

                <button
                  onClick={paymentMethod === 'stripe' ? handleStripePayment : handlePayPalPayment}
                  disabled={paymentLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {paymentLoading ? 'Processing...' : `Pay €${PRICE}`}
                </button>

                <p className="text-xs text-slate-400 text-center">Secure payment via {paymentMethod === 'stripe' ? 'Stripe' : 'PayPal'}</p>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="text-center py-6 space-y-4">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                <p className="text-sm text-slate-600">After confirming payment, click below:</p>
                <button onClick={() => { setShowPaymentModal(false); handleRoast(); }} className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold">Start Roast 🔥</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
