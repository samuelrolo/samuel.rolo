// Student Pack EN — CV Analyser + LinkedIn Roaster | Share2Inspire
// Upload CV + LinkedIn → Payment → Both engines run → Integrated Results
// Price EN: $7.99 / €7.99
import { useState, useEffect } from "react";
import { Upload, FileText, Loader2, Target, TrendingUp, CheckCircle2, Linkedin, CreditCard, AlertCircle, Ticket, Sparkles, Shield, Check, ArrowRight, BarChart3, Zap, Globe, Menu, X, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { trackPaymentStart, trackPurchase } from "@/lib/gtag";
import { trackAffiliateConversion, incrementCouponUsage } from "@/lib/affiliate";
import { useCurrency } from "@/hooks/useCurrency";
import { transformGeminiResponse } from "@/lib/transformGeminiResponse";
import { countries } from "./countries";
import S2IFooterEN from "@/components/S2IFooterEN";
import S2IHeader from "@/components/S2IHeader";
import { redirectToCheckout } from '../../lib/webviewPayment';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const SUPABASE_EDGE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co/functions/v1/hyper-task';
const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';
const PRICE_NUM = 7.99;
const PRICE_ORIGINAL = '13.98';

async function extractTextFromPDF(file: File): Promise<string> {
  const ab = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
  let t = "";
  for (let i = 1; i <= pdf.numPages; i++) { const p = await pdf.getPage(i); const c = await p.getTextContent(); t += c.items.map((x: any) => x.str).join(" ") + "\n"; }
  return t.trim();
}
async function extractTextFromDOCX(file: File): Promise<string> {
  const ab = await file.arrayBuffer();
  return (await mammoth.extractRawText({ arrayBuffer: ab })).value.trim();
}

const headlines = [
  { text: "Prepare your CV and LinkedIn to", highlight: "land your first job" },
  { text: "Two AI engines working for you to", highlight: "launch your career" },
  { text: "Discover what recruiters see and", highlight: "fix it before applying" },
];

export default function StudentPackHomeEN() {
  useEffect(() => { document.title = "Student Pack — CV Analyser + LinkedIn Roaster | Share2Inspire"; }, []);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  useEffect(() => { const t = setInterval(() => setHeadlineIndex(i => (i + 1) % headlines.length), 4000); return () => clearInterval(t); }, []);
  const { symbol: CUR, code: currencyCode, codeUpper: currencyCodeUpper } = useCurrency();
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [email, setEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const countryData = countries.find(c => c.country === selectedCountry);
  const [step, setStep] = useState<'hero' | 'upload' | 'payment' | 'analyzing' | 'done'>('hero');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'payment' | 'success'>('payment');
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(null);
  const finalPrice = appliedCoupon ? Math.round(PRICE_NUM * (1 - appliedCoupon.percent / 100) * 100) / 100 : PRICE_NUM;
  const finalPriceStr = finalPrice.toFixed(2);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMsg, setAnalysisMsg] = useState("");
  

  const isValidLinkedinUrl = (url: string) => url.trim().toLowerCase().includes('linkedin.com/in/') && url.trim().length > 25;

  const loadingMessages = ["Extracting CV data...", "Analysing skills and experience...", "Analysing your LinkedIn profile...", "Cross-referencing CV ↔ LinkedIn...", "Generating integrated recommendations...", "Preparing your complete report..."];

  const handleProceedToPayment = async () => {
    if (!file) { setError('Upload your CV (PDF or DOCX)'); return; }
    if (!isValidLinkedinUrl(linkedinUrl)) { setError('Enter a valid LinkedIn URL'); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email'); return; }
    if (!selectedCountry) { setError('Select your country'); return; }
    if (!acceptedTerms) { setError('Accept the Privacy Policy'); return; }
    setError(null);

    // Pre-extract CV text and save to localStorage BEFORE payment redirect
    // IMPORTANT: Safari iOS clears sessionStorage on cross-domain navigation (Stripe)
    // so we must use localStorage for data that needs to survive the redirect
    try {
      let cvText = '';
      if (file.type === 'application/pdf') {
        cvText = await extractTextFromPDF(file);
      } else {
        cvText = await extractTextFromDOCX(file);
      }
      localStorage.setItem('studentPackCvText', cvText);
      localStorage.setItem('studentPackLinkedinUrl', linkedinUrl);
      localStorage.setItem('studentPackEmail', email.trim().toLowerCase());
      localStorage.setItem('studentPackCountry', selectedCountry || '');
      localStorage.setItem('studentPackRegion', selectedRegion || '');
    } catch (e) {
      console.warn('[StudentPackEN] Pre-extraction warning:', e);
    }

    setPaymentStep('payment'); setPaymentError(null); setShowPaymentModal(true);
  };

  const runBothEngines = async () => {
    setStep('analyzing'); setAnalysisProgress(0); setAnalysisMsg(loadingMessages[0]);
    const startTime = Date.now();
    const msgInterval = setInterval(() => { setAnalysisProgress(prev => { const next = Math.min(prev + 1, loadingMessages.length - 1); setAnalysisMsg(loadingMessages[next]); return next; }); }, 4500);
    try {
      // Extract CV text — use file if available, otherwise restore from localStorage (Stripe return)
      // NOTE: We use localStorage because Safari iOS clears sessionStorage on cross-domain redirect
      let cvText = "";
      let base64Content = "";
      if (file) {
        if (file.type === 'application/pdf') cvText = await extractTextFromPDF(file);
        else cvText = await extractTextFromDOCX(file);
        const reader = new FileReader();
        base64Content = await new Promise<string>((resolve, reject) => { reader.onload = () => resolve((reader.result as string).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(file); });
      } else {
        // Stripe return: file lost, use localStorage (fallback to sessionStorage for backwards compat)
        cvText = localStorage.getItem('studentPackCvText') || sessionStorage.getItem('studentPackCvText') || '';
        if (!cvText) {
          throw new Error('CV not available after payment. Please contact support@share2inspire.pt with your receipt.');
        }
      }
      // Also restore other fields from localStorage if lost (fallback to sessionStorage)
      const currentLinkedinUrl = linkedinUrl || localStorage.getItem('studentPackLinkedinUrl') || sessionStorage.getItem('studentPackLinkedinUrl') || '';
      if (currentLinkedinUrl && !linkedinUrl) setLinkedinUrl(currentLinkedinUrl);
      const currentCountry = selectedCountry || localStorage.getItem('studentPackCountry') || sessionStorage.getItem('studentPackCountry') || '';
      const currentRegion = selectedRegion || localStorage.getItem('studentPackRegion') || sessionStorage.getItem('studentPackRegion') || '';
      const currentEmail = email || localStorage.getItem('studentPackEmail') || sessionStorage.getItem('studentPackEmail') || '';
      const useServerExtraction = cvText.length < 50 && !!base64Content;

      // ENGINE 1: CV
      let cvResponseData: any = null;
      for (let attempt = 0; attempt <= 2; attempt++) {
        const ctrl = new AbortController(); const tid = setTimeout(() => ctrl.abort(), 120000);
        try {
          const body: any = { mode: 'cv_extraction', language: 'en', country: currentCountry, region: currentRegion };
          if (useServerExtraction && base64Content) { body.file = base64Content; body.filename = file?.name || 'cv.pdf'; } else { body.cv_text = cvText.substring(0, 8000); }
          const res = await fetch(SUPABASE_EDGE_URL, { method: 'POST', headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal });
          clearTimeout(tid);
          if (res.ok) { cvResponseData = await res.json(); if (cvResponseData.success) break; }
          if (attempt < 2) await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        } catch (e: any) { clearTimeout(tid); if (attempt < 2 && e.name !== 'AbortError') await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); else throw e; }
      }
      if (!cvResponseData?.success) throw new Error('Error analysing CV. Please try again.');

      // ENGINE 2: LinkedIn
      let linkedinResponseData: any = null;
      for (let attempt = 0; attempt <= 2; attempt++) {
        const ctrl = new AbortController(); const tid = setTimeout(() => ctrl.abort(), 120000);
        try {
          const res = await fetch(SUPABASE_EDGE_URL, { method: 'POST', headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'linkedin_roast', linkedin_url: currentLinkedinUrl, language: 'en', country: currentCountry, region: currentRegion }), signal: ctrl.signal });
          clearTimeout(tid);
          if (res.ok) { linkedinResponseData = await res.json(); if (linkedinResponseData.success) break; }
          if (attempt < 2) await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        } catch (e: any) { clearTimeout(tid); if (attempt < 2 && e.name !== 'AbortError') await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); else throw e; }
      }

      const cvAnalysisSource = cvResponseData.analysis || cvResponseData;
      const cvAnalysisResult = transformGeminiResponse(cvAnalysisSource, 'en');

      sessionStorage.setItem('studentPackCvAnalysis', JSON.stringify(cvAnalysisResult));
      sessionStorage.setItem('studentPackCvRaw', JSON.stringify(cvAnalysisSource));
      sessionStorage.setItem('studentPackLinkedinAnalysis', JSON.stringify(linkedinResponseData || {}));
      sessionStorage.setItem('studentPackEmail', currentEmail);
      sessionStorage.setItem('studentPackCountry', currentCountry);
      sessionStorage.setItem('studentPackRegion', currentRegion || '');
      sessionStorage.setItem('studentPackLinkedinUrl', currentLinkedinUrl);
      sessionStorage.setItem('studentPackPaid', 'true');
      sessionStorage.setItem('cvAnalysis', JSON.stringify(cvAnalysisResult));
      sessionStorage.setItem('isPaid', 'true');
      sessionStorage.setItem('analysisLang', 'en');

      try {
        const cp = cvAnalysisSource?.candidate_profile || {};
        fetch(`${SUPABASE_URL}/rest/v1/cv_analysis`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Prefer': 'return=representation' }, body: JSON.stringify({ score: cvAnalysisResult.overallScore || 0, professional_area: cp.detected_role || null, analysis_type: 'student_pack', analysis_result: JSON.stringify(cvAnalysisSource), payment_status: 'paid', payment_amount: finalPrice, transaction_id: `STUDPACK-EN-${Date.now()}`, domain: 'share2inspire.pt', user_name: cp.name || null, user_email: currentEmail, linkedin_url: currentLinkedinUrl }) }).catch(() => {});
      } catch (_) {}

      trackPurchase('student_pack', finalPrice, `STUDPACK-EN-${Date.now()}`);
      const elapsed = Date.now() - startTime;
      if (elapsed < 2800) await new Promise(r => setTimeout(r, 2800 - elapsed));
      clearInterval(msgInterval); setAnalysisMsg("All done! Redirecting..."); setStep('done');
      setTimeout(() => { window.location.href = '/en/student-pack/results'; }, 1500);
    } catch (err: any) { clearInterval(msgInterval); setError(err.message || 'Error. Please try again.'); setStep('upload'); }
  };

  const handleStripePayment = async () => {
    if (!email) { setPaymentError('Enter your email'); return; }
    setPaymentLoading(true); setPaymentError(null);
    try {
      const orderId = `STUDPACK-EN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const res = await fetch(`${BACKEND_URL}/api/payment/stripe-checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, name: email.split('@')[0], amount: finalPrice, currency: currencyCode, product_type: 'student_pack', language: 'en', description: 'Student Pack — CV Analyser + LinkedIn Roaster — Share2Inspire', orderId, success_url: `${window.location.origin}/en/student-pack?paid=true`, cancel_url: `${window.location.origin}/en/student-pack` }) });
      const data = await res.json();
      if (data.url) { localStorage.setItem('studentPackPendingOrderId', orderId); localStorage.setItem('studentPackEmail', email); redirectToCheckout(data.url); }
      else throw new Error(data.error || 'Error creating payment');
    } catch (err: any) { setPaymentError(err.message); } finally { setPaymentLoading(false); }
  };

  const handlePayPalPayment = async () => {
    if (!email) { setPaymentError('Enter your email'); return; }
    trackPaymentStart('student_pack', finalPrice);
    window.open(`https://paypal.me/SamuelRolo/${finalPrice}USD`, '_blank');
    setPaymentStep('success');
    trackPurchase('student_pack', finalPrice, `STUDPACK-PAYPAL-EN-${Date.now()}`);
    trackAffiliateConversion({ product: 'student_pack', amount: finalPrice, currency: currencyCodeUpper, payment_method: 'paypal', customer_email: email, transaction_id: `STUDPACK-PAYPAL-EN-${Date.now()}` });
  };

  const handleDiscountCode = async () => {
    if (!discountCode.trim()) { setDiscountError('Enter a code'); return; }
    setDiscountLoading(true); setDiscountError(null);
    const code = discountCode.trim().toUpperCase();
    try {
      const couponRes = await fetch(`${SUPABASE_URL}/rest/v1/discount_coupons?code=eq.${encodeURIComponent(code)}&is_active=eq.true&select=code,discount_percent,max_uses,current_uses,valid_from,valid_until,applicable_products`, { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } });
      const coupons = await couponRes.json();
      if (Array.isArray(coupons) && coupons.length > 0) {
        const c = coupons[0]; const now = new Date();
        if (c.valid_from && new Date(c.valid_from) > now) { setDiscountError('Code not yet active.'); return; }
        if (c.valid_until && new Date(c.valid_until) < now) { setDiscountError('Code expired.'); return; }
        if (c.max_uses !== null && (c.current_uses || 0) >= c.max_uses) { setDiscountError('Code limit reached.'); return; }
        const products = c.applicable_products || [];
        if (products.length > 0 && !products.includes('all') && !products.includes('student_pack') && !products.includes('student')) { setDiscountError('Code not applicable.'); return; }
        if (c.discount_percent === 100) { incrementCouponUsage(code); setShowDiscountModal(false); runBothEngines(); return; }
        setAppliedCoupon({ code, percent: c.discount_percent }); incrementCouponUsage(code); setShowDiscountModal(false); return;
      }
      const vRes = await fetch(`${SUPABASE_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(code)}&is_active=eq.true`, { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } });
      const vouchers = await vRes.json();
      if (!vouchers?.length) { setDiscountError('Invalid code.'); return; }
      if (vouchers[0].used_analyses >= vouchers[0].total_analyses) { setDiscountError('Code fully used.'); return; }
      setShowDiscountModal(false); runBothEngines();
    } catch { setDiscountError('Error verifying code.'); } finally { setDiscountLoading(false); }
  };

  useEffect(() => { const p = new URLSearchParams(window.location.search); if (p.get('paid') === 'true') { const e = localStorage.getItem('studentPackEmail') || sessionStorage.getItem('studentPackEmail'); if (e) setEmail(e); window.history.replaceState({}, '', '/en/student-pack'); runBothEngines(); } }, []);
  useEffect(() => { if (paymentStep === 'success' && step !== 'analyzing' && step !== 'done') { const t = setTimeout(() => { setShowPaymentModal(false); runBothEngines(); }, 2000); return () => clearTimeout(t); } }, [paymentStep]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-white">
      <S2IHeader activePage="estudante" />

      {step === 'hero' && (
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-20">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 text-emerald-600 text-xs font-bold px-4 py-2 rounded-full border border-emerald-500/20 uppercase tracking-wider"><GraduationCap className="w-4 h-4" /> Student Offer — Save 43%</div>
            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight" key={headlineIndex} style={{animation: 'fadeInUp 0.6s ease-out'}}>{headlines[headlineIndex].text} <span className="text-emerald-600">{headlines[headlineIndex].highlight}</span></h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">CV Analyser + LinkedIn Roaster. Analyse your CV, audit your LinkedIn and discover exactly what to fix — all in one integrated report.</p>
            <div className="flex items-center justify-center gap-4">
              {appliedCoupon ? (<><span className="text-2xl line-through text-slate-400">{CUR}{PRICE_NUM.toFixed(2)}</span><span className="text-4xl font-bold text-green-600">{CUR}{finalPriceStr}</span></>) : (<><span className="text-lg line-through text-slate-400">{CUR}{PRICE_ORIGINAL}</span><span className="text-4xl font-bold text-slate-900">{CUR}{PRICE_NUM.toFixed(2)}</span><span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Save 43%</span></>)}
            </div>
            <Button onClick={() => setStep('upload')} className="h-16 px-12 text-lg font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] mt-4">Get started <ArrowRight className="w-6 h-6 ml-2" /></Button>
            <p className="text-xs text-slate-400">One-time payment · No subscription · Instant results</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto mt-14">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-left space-y-3">
              <div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><BarChart3 className="w-5 h-5 text-blue-600" /></div><div><h3 className="font-bold text-slate-900">CV Analyser</h3><p className="text-xs text-slate-400">Value: {CUR}9.99</p></div></div>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Complete ATS analysis with score</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Top 3 CV issues with solutions</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Detailed salary estimate</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Automation risk assessment</li>
              </ul>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-left space-y-3">
              <div className="flex items-center gap-3"><div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center"><Linkedin className="w-5 h-5 text-purple-600" /></div><div><h3 className="font-bold text-slate-900">LinkedIn Roaster</h3><p className="text-xs text-slate-400">Value: {CUR}3.99</p></div></div>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Complete profile audit</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Headline & About optimization</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> SEO keywords for recruiters</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Visibility score</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 max-w-3xl mx-auto">
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
              <div className="inline-flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider"><Sparkles className="w-4 h-4" /> Student Pack Exclusive</div>
              <h3 className="text-lg font-bold text-slate-900">CV ↔ LinkedIn Consistency Check</h3>
              <p className="text-sm text-slate-600 max-w-lg mx-auto">We automatically cross-reference both reports to detect inconsistencies: missing skills, misaligned headline, experiences missing from LinkedIn — and tell you exactly what to fix.</p>
            </div>
          </div>
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div><p className="text-3xl font-bold text-emerald-600">+500</p><p className="text-xs text-slate-500 mt-1">Professionals helped</p></div>
              <div><p className="text-3xl font-bold text-emerald-600">5★</p><p className="text-xs text-slate-500 mt-1">Average rating</p></div>
              <div><p className="text-3xl font-bold text-emerald-600">43%</p><p className="text-xs text-slate-500 mt-1">Student discount</p></div>
            </div>
          </div>
          <div className="mt-14 text-center">
            <Button onClick={() => setStep('upload')} className="h-16 px-12 text-lg font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]">Get started <ArrowRight className="w-6 h-6 ml-2" /></Button>
          </div>
        </div>
      )}

      {step === 'upload' && (
        <div className="max-w-lg mx-auto px-6 py-10">
          <div className="text-center mb-8"><h2 className="text-2xl font-bold text-slate-900">Enter your details</h2><p className="text-sm text-slate-500 mt-1">CV + LinkedIn — once for both engines</p></div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2"><FileText className="w-4 h-4 inline mr-1" /> CV (PDF or DOCX)</label>
              <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${file ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-emerald-500 bg-white'}`}>
                <input type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
                {file ? <div className="flex items-center gap-2 text-green-700"><CheckCircle2 className="w-5 h-5" /><span className="text-sm font-medium">{file.name}</span></div> : <div className="text-center"><Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" /><p className="text-sm text-slate-500">Click or drag your CV</p></div>}
              </label>
            </div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-2"><Linkedin className="w-4 h-4 inline mr-1" /> LinkedIn Profile</label><input type="url" placeholder="https://linkedin.com/in/your-profile" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all" /></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-2"><CreditCard className="w-4 h-4 inline mr-1" /> Email</label><input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all" /></div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700"><Globe className="w-4 h-4 inline mr-1 text-emerald-600" /> Country</label>
              <select value={selectedCountry} onChange={(e) => { setSelectedCountry(e.target.value); setSelectedRegion(""); }} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all bg-white text-slate-700"><option value="">Select your country...</option>{countries.map(c => <option key={c.code} value={c.country}>{c.country}</option>)}</select>
              {countryData && countryData.regions.length > 1 && (<select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all bg-white text-slate-700"><option value="">Select region (optional)...</option>{countryData.regions.map(r => <option key={r} value={r}>{r}</option>)}</select>)}
            </div>
            <label className="flex items-start gap-3 cursor-pointer"><input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" /><span className="text-xs text-slate-500">I accept the <a href="/en/pages/privacy-policy" target="_blank" className="text-emerald-600 underline">Privacy Policy</a> and <a href="/termos-condicoes" target="_blank" className="text-emerald-600 underline">Terms & Conditions</a>.</span></label>
            {error && <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
            <Button onClick={handleProceedToPayment} disabled={!file || !isValidLinkedinUrl(linkedinUrl) || !email || !selectedCountry || !acceptedTerms} className="w-full h-14 text-base font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-all">{appliedCoupon ? <>Pay — <span className="line-through text-slate-300 mr-1">{CUR}{PRICE_NUM.toFixed(2)}</span> {CUR}{finalPriceStr}</> : <>Pay and analyse — {CUR}{PRICE_NUM.toFixed(2)}</>}</Button>
            {appliedCoupon ? <div className="w-full text-center text-sm text-green-600 bg-green-50 rounded-xl py-2 px-3 flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Coupon <span className="font-bold">{appliedCoupon.code}</span> — {appliedCoupon.percent}% off<button onClick={() => setAppliedCoupon(null)} className="ml-2 text-xs text-slate-400 hover:text-red-500 underline">remove</button></div> : <button onClick={() => { setShowDiscountModal(true); setDiscountCode(''); setDiscountError(null); }} className="w-full text-center text-sm text-slate-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2"><Ticket className="w-4 h-4" /> I have a discount code</button>}
            <button onClick={() => setStep('hero')} className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors">← Back</button>
          </div>
        </div>
      )}

      {(step === 'analyzing' || step === 'done') && (
        <div className="max-w-md mx-auto px-6 py-20 text-center"><div className="space-y-6">
          {step === 'analyzing' ? (<><Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto" /><h2 className="text-xl font-bold text-slate-900">Processing your Student Pack</h2><p className="text-sm text-slate-500">{analysisMsg}</p><div className="w-full bg-slate-200 rounded-full h-2"><div className="bg-emerald-600 h-2 rounded-full transition-all duration-500" style={{ width: `${((analysisProgress + 1) / loadingMessages.length) * 100}%` }} /></div></>) : (<><CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" /><h2 className="text-xl font-bold text-slate-900">All done!</h2><p className="text-sm text-slate-500">Redirecting to your results...</p></>)}
        </div></div>
      )}

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}><DialogContent className="max-w-md"><DialogHeader><DialogTitle className="text-center">{paymentStep === 'payment' ? 'Payment — Student Pack' : 'Payment confirmed!'}</DialogTitle></DialogHeader>
        {paymentStep === 'payment' && (<div className="space-y-4">
          <div className="bg-emerald-50 rounded-xl p-4 text-center"><p className="text-sm text-slate-600">CV Analyser + LinkedIn Roaster</p><div className="flex items-center justify-center gap-3 mt-1">{appliedCoupon ? <><span className="text-lg line-through text-slate-400">{CUR}{PRICE_NUM.toFixed(2)}</span><span className="text-2xl font-bold text-green-600">{CUR}{finalPriceStr}</span></> : <span className="text-2xl font-bold text-slate-900">{CUR}{PRICE_NUM.toFixed(2)}</span>}</div></div>
          <div className="flex gap-2">{(['stripe', 'paypal'] as const).map(m => <button key={m} onClick={() => setPaymentMethod(m)} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${paymentMethod === m ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{m === 'stripe' ? 'Card' : 'PayPal'}</button>)}</div>
          {paymentMethod === 'stripe' && <Button onClick={handleStripePayment} disabled={paymentLoading} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl">{paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pay ${CUR}${finalPriceStr} with Card`}</Button>}
          {paymentMethod === 'paypal' && <Button onClick={handlePayPalPayment} className="w-full h-12 bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold rounded-xl">Pay {CUR}{finalPriceStr} with PayPal</Button>}
          {paymentError && <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl"><AlertCircle className="w-4 h-4 shrink-0" />{paymentError}</div>}
        </div>)}
        {paymentStep === 'success' && <div className="text-center space-y-4 py-4"><CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" /><p className="text-sm text-slate-600">Payment confirmed! Starting analysis...</p></div>}
      </DialogContent></Dialog>

      <Dialog open={showDiscountModal} onOpenChange={setShowDiscountModal}><DialogContent className="max-w-sm"><DialogHeader><DialogTitle className="text-center">Discount code</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <input type="text" placeholder="Enter code" value={discountCode} onChange={(e) => setDiscountCode(e.target.value.toUpperCase())} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm text-center tracking-widest font-mono focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" onKeyDown={(e) => e.key === 'Enter' && handleDiscountCode()} />
          {discountError && <p className="text-red-600 text-sm text-center">{discountError}</p>}
          <Button onClick={handleDiscountCode} disabled={discountLoading} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl">{discountLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Validate code'}</Button>
        </div>
      </DialogContent></Dialog>

      <S2IFooterEN />
    </div>
  );
}
