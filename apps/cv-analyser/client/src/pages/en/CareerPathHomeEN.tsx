// Career Path — English International Version
// Upload CV + LinkedIn URL → Payment → AI Career Analysis
// Includes country/region selector for geolocalised analysis

import { useState, useEffect } from "react";
import { Upload, FileText, Loader2, Home as HomeIcon, Compass, Target, TrendingUp, Award, Users, Star, CheckCircle2, XCircle, ChevronDown, ChevronUp, Linkedin, Globe, CreditCard, AlertCircle, Ticket, Unlock, Briefcase, BookOpen, Calendar, ExternalLink, Sparkles, Search, DollarSign, Zap, Lock, ArrowRight, Shield, Check, Eye, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { countries } from "./countries";
import { sendConversion, trackCVUpload, trackAnalysisStart, trackPaymentStart, trackPurchase } from "@/lib/gtag";
import { trackAffiliateConversion } from "@/lib/affiliate";
import { useCurrency } from "@/hooks/useCurrency";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const SUPABASE_EDGE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co/functions/v1/hyper-task';
const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(" ") + "\n";
  }
  return text;
}

async function extractTextFromDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/* ─── Testimonials ─── */
const testimonials = [
  {
    name: "Catherine Mitchell",
    role: "HR Manager",
    text: "Career Path showed me exactly what I needed to do to reach HR Director in 3 years. The roadmap was surgical and realistic.",
    rating: 5,
  },
  {
    name: "Ryan Thompson",
    role: "Software Engineer",
    text: "I was lost in my transition to Product Manager. The career plan identified the right gaps and the certifications that actually matter.",
    rating: 5,
  },
  {
    name: "Sofia Garcia",
    role: "Strategy Consultant",
    text: "I never thought AI could cross-reference my CV with LinkedIn and figure out what I was missing for the next level. Impressive.",
    rating: 5,
  },
];

export default function CareerPathHomeEN() {
  useEffect(() => { document.title = "Career Path — AI-Powered Career Roadmap | Share2Inspire"; }, []);

  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const isValidLinkedinUrl = (url: string) => {
    const trimmed = url.trim().toLowerCase();
    return trimmed.includes('linkedin.com/in/') && trimmed.length > 25;
  };
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [step, setStep] = useState<'hero' | 'upload' | 'preview' | 'analyzing' | 'results'>('hero');
  const [careerGoal, setCareerGoal] = useState<string>('');
  const [previewData, setPreviewData] = useState<any>(null);

  const loadingMessages = [
    "Extracting your professional profile...",
    "Mapping competencies and experience...",
    "Analysing market trends...",
    "Identifying career opportunities...",
    "Calculating automation risk...",
    "Estimating salary ranges...",
    "Building your development roadmap...",
    "Generating training recommendations...",
    "Finalising your Career Path..."
  ];

  useEffect(() => {
    if (!loading) { setLoadingStep(0); return; }
    const interval = setInterval(() => {
      setLoadingStep(prev => prev < loadingMessages.length - 1 ? prev + 1 : prev);
    }, 4000);
    return () => clearInterval(interval);
  }, [loading]);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [email, setEmail] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'payment' | 'success'>('payment');

  // Unified discount code state
  const [discountCode, setDiscountCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountValid, setDiscountValid] = useState(false);

  const PRICE = '19.99';
  const PRICE_NUM = 19.99;
  const FINAL_PRICE = discountPercent > 0 ? PRICE_NUM * (1 - discountPercent / 100) : PRICE_NUM;
  const FINAL_PRICE_DISPLAY = FINAL_PRICE.toFixed(2);
  const { symbol: CUR, code: currencyCode, codeUpper: currencyCodeUpper } = useCurrency();

  const countryData = countries.find(c => c.country === selectedCountry);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Please upload a PDF or DOCX file');
        setFile(null);
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size cannot exceed 5MB');
        setFile(null);
        return;
      }
      setError(null);
      setFile(selectedFile);
    }
  };

  /* ─── Unified discount code validation (checks coupons first, then vouchers) ─── */
  const handleDiscountValidate = async () => {
    if (!discountCode.trim()) return;
    setDiscountLoading(true);
    setDiscountError(null);
    const code = discountCode.trim().toUpperCase();
    try {
      // Step 1: Check discount_coupons
      const couponRes = await fetch(
        `${SUPABASE_URL}/rest/v1/discount_coupons?code=eq.${encodeURIComponent(code)}&is_active=eq.true&select=code,discount_percent,partner_name,max_uses,current_uses,valid_from,valid_until,applicable_products`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const coupons = await couponRes.json();
      if (Array.isArray(coupons) && coupons.length > 0) {
        const coupon = coupons[0];
        const now = new Date();
        if (coupon.valid_from && new Date(coupon.valid_from) > now) { setDiscountError('This code is not yet active.'); return; }
        if (coupon.valid_until && new Date(coupon.valid_until) < now) { setDiscountError('This code has expired.'); return; }
        if (coupon.max_uses !== null && (coupon.current_uses || 0) >= coupon.max_uses) { setDiscountError('This code has reached its usage limit.'); return; }
        const products = coupon.applicable_products || [];
        if (products.length > 0 && !products.includes('all') && !products.includes('career_path')) { setDiscountError('This code is not applicable to Career Path.'); return; }
        setDiscountPercent(coupon.discount_percent);
        setDiscountValid(true);
        return;
      }

      // Step 2: Check vouchers table
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(code)}&select=*`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const v = rows[0];
        if (!v.is_active) { setDiscountError('This code has already been used'); return; }
        if (v.used_analyses >= v.total_analyses) { setDiscountError('This code has no remaining uses'); return; }
        if (v.voucher_type !== 'career_path' && !v.includes_career_path) { setDiscountError('This code is not valid for Career Path'); return; }
        await fetch(
          `${SUPABASE_URL}/rest/v1/vouchers?id=eq.${v.id}`,
          {
            method: 'PATCH',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify({ used_analyses: v.used_analyses + 1, is_active: (v.used_analyses + 1) < v.total_analyses }),
          }
        );
        setShowPaymentModal(false);
        sessionStorage.setItem('careerPathPaid', 'true');
        setTimeout(() => { setLocation('/results'); }, 400);
        return;
      }

      setDiscountError('Invalid or expired code');
    } catch {
      setDiscountError('Error validating code');
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    if (!isValidLinkedinUrl(linkedinUrl)) {
      setError('Please enter your LinkedIn profile URL (e.g. https://linkedin.com/in/your-profile)');
      return;
    }
    if (!selectedCountry) {
      setError('Please select your country to get localised results');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let cvText = "";
      if (file.type === 'application/pdf') {
        cvText = await extractTextFromPDF(file);
      } else {
        cvText = await extractTextFromDOCX(file);
      }

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const base64Content = await base64Promise;

      const useServerExtraction = cvText.length < 50;
      if (useServerExtraction) {
        console.log('[CAREER_PATH_EN] Text insufficient in browser (' + cvText.length + ' chars). Sending PDF for Gemini Vision extraction...');
      }

      let response: Response | null = null;
      let responseData: any = null;
      const maxRetries = 2;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        try {
          const requestBody: any = {
            mode: 'cv_extraction',
            language: 'en',
            country: selectedCountry,
            region: selectedRegion || undefined,
          };
          if (useServerExtraction) {
            requestBody.file = base64Content;
            requestBody.filename = file.name;
          } else {
            requestBody.cv_text = cvText.substring(0, 8000);
          }

          response = await fetch(SUPABASE_EDGE_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (response.ok) {
            responseData = await response.json();
            if (responseData.success) break;
          }
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (attempt < maxRetries && fetchError.name !== 'AbortError') {
            await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          } else {
            throw fetchError;
          }
        }
      }

      if (!response?.ok) {
        throw new Error('AI analysis error. Please try again.');
      }
      if (!responseData?.success) {
        throw new Error(responseData?.error || 'AI analysis error.');
      }

      const analysisSource = responseData.analysis || responseData;

      sessionStorage.setItem('careerPathCvAnalysis', JSON.stringify(analysisSource));
      sessionStorage.setItem('careerPathCvText', cvText.substring(0, 8000));
      sessionStorage.setItem('careerPathCvFile', base64Content);
      sessionStorage.setItem('careerPathCvFilename', file.name);
      sessionStorage.setItem('careerPathLang', 'en');
      sessionStorage.setItem('careerPathCountry', selectedCountry);
      sessionStorage.setItem('careerPathRegion', selectedRegion);
      sessionStorage.setItem('analysisLang', 'en');
      sessionStorage.setItem('analysisCountry', selectedCountry);
      sessionStorage.setItem('analysisRegion', selectedRegion);
      if (linkedinUrl) {
        sessionStorage.setItem('careerPathLinkedinUrl', linkedinUrl);
      }

      const profile = analysisSource.candidate_profile || {};
      setPreviewData({
        name: profile.detected_name || 'N/A',
        role: profile.detected_role || 'N/A',
        seniority: profile.seniority || 'N/A',
        experience: profile.total_years_exp || 'N/A',
        skills: (profile.key_skills || []).slice(0, 5),
        nextRole: profile.likely_next_role || null,
      });
      setLoading(false);
      setStep('preview');

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Analysis took too long. Please try again.');
      } else {
        setError(err.message || 'Error analysing CV. Please try again.');
      }
      setLoading(false);
    }
  };

  /* ─── Payment handlers ─── */
  const handleStripePayment = async () => {
    if (!email) { setPaymentError('Please enter your email'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setPaymentError('Invalid email'); return; }
    setPaymentLoading(true);
    if (typeof window.fbq === 'function') window.fbq('track', 'AddPaymentInfo');
    setPaymentError(null);
    try {
      const orderId = `CP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const response = await fetch(`${BACKEND_URL}/api/payment/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: email.split('@')[0],
          product_type: 'career_path',
          orderId,
          language: 'en',
          country: selectedCountry,
          region: selectedRegion,
          currency: currencyCode,
          amount: PRICE_NUM,
        })
      });
      const data = await response.json();
      if (!data.success || !data.url) {
        throw new Error(data.error || 'Error creating payment session');
      }
      sessionStorage.setItem('cpOrderId', orderId);
      sessionStorage.setItem('cpPaymentEmail', email);
      sessionStorage.setItem('stripeSessionId', data.sessionId);
      window.location.href = data.url;
    } catch (err: any) {
      setPaymentError(err.message || 'Error processing payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePayPalPayment = async () => {
    if (!email) { setPaymentError('Please enter your email'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setPaymentError('Invalid email'); return; }
    sessionStorage.setItem('cpPaymentEmail', email);
    window.open(`https://paypal.me/SamuelRolo/${PRICE_NUM}USD`, '_blank');
    setPaymentStep('success');
    if (typeof window.fbq === 'function') window.fbq('track', 'Purchase', {value: PRICE_NUM, currency: currencyCodeUpper});
    trackPurchase('career_path', 19.99, `CP-PAYPAL-${Date.now()}`);
    trackAffiliateConversion({ product: 'career_path', amount: 19.99, currency: currencyCodeUpper, payment_method: 'paypal', customer_email: email, transaction_id: `CP-PAYPAL-${Date.now()}` });
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    sessionStorage.setItem('careerPathPaid', 'true');
    setTimeout(() => { setLocation('/results'); }, 400);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-foreground/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-[#C9A961]" />
            <span className="text-lg font-semibold text-foreground">Career Path</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#C9A961]/10 text-[#C9A961] font-medium">EN</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/en/cv-analyser" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">CV Analyser</a>
            <a href="/career-path" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#C9A961]/40 bg-[#C9A961]/10 hover:bg-[#C9A961]/20 transition-colors text-sm font-medium text-[#C9A961]">
              <Globe className="w-3.5 h-3.5" />
              <span>PT</span>
            </a>
            <a href="https://www.share2inspire.pt" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm font-medium text-foreground">
              <HomeIcon className="w-4 h-4" /><span>Homepage</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">

        {/* ═══ STEP 1: HERO — Compact, conversion-focused ═══ */}
        {step === 'hero' && (
          <div className="space-y-12 animate-in fade-in">

            {/* ── Hero: Headline + CTA immediately visible ── */}
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C9A961]/10 border border-[#C9A961]/20 text-sm font-medium text-[#C9A961]">
                <Compass className="w-4 h-4" />
                Powered by Advanced AI
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                Your career has <span className="text-[#C9A961]">3 possible paths</span>.<br />Find out which ones.
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Upload your CV, get a personalised roadmap with gap analysis, salary estimates, and an action plan — in under 1 minute.
              </p>

              {/* Primary CTA */}
              <div className="flex flex-col items-center gap-3 pt-2">
                <Button
                  onClick={() => setStep('upload')}
                  className="h-14 px-10 text-base font-semibold rounded-xl bg-[#C9A961] hover:bg-[#b8954f] text-white transition-all shadow-lg shadow-[#C9A961]/20"
                >
                  <Compass className="w-5 h-5 mr-2" />
                  Start my Career Path — {CUR}{PRICE}
                </Button>
                <p className="text-xs text-muted-foreground">One-time payment · No subscription · Results in under 1 minute</p>
              </div>

              {/* Trust badges — inline */}
              <div className="flex flex-wrap justify-center gap-6 pt-2">
                {[
                  { icon: <Shield className="w-4 h-4" />, label: "100% private" },
                  { icon: <Zap className="w-4 h-4" />, label: "Results in < 1 min" },
                  { icon: <Award className="w-4 h-4" />, label: "Created by HR experts" },
                ].map((badge, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="text-[#C9A961]">{badge.icon}</span>
                    {badge.label}
                  </div>
                ))}
              </div>
            </div>

            {/* ── What you'll receive — compact grid ── */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-center text-foreground">What you'll receive</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { icon: <Compass className="w-4 h-4" />, title: "Career Roadmap", desc: "Step-by-step plan for 1-3 years" },
                  { icon: <Target className="w-4 h-4" />, title: "Gap Analysis", desc: "Skills for the next level" },
                  { icon: <DollarSign className="w-4 h-4" />, title: "Salary Estimate", desc: "Progression per stage" },
                  { icon: <BookOpen className="w-4 h-4" />, title: "Training Plan", desc: "High-impact certifications" },
                  { icon: <Users className="w-4 h-4" />, title: "Networking Strategy", desc: "Who to meet and how" },
                  { icon: <Calendar className="w-4 h-4" />, title: "30-60-90 Day Plan", desc: "Concrete actions" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-2.5 p-3 rounded-xl bg-card border border-border">
                    <span className="text-[#C9A961] mt-0.5 shrink-0">{item.icon}</span>
                    <div>
                      <p className="font-semibold text-foreground text-xs">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Example — kept but compact ── */}
            <div className="rounded-2xl border border-[#C9A961]/20 bg-gradient-to-b from-[#C9A961]/5 to-transparent overflow-hidden">
              <div className="p-6 md:p-8 space-y-4">
                <div className="text-center space-y-2">
                  <p className="text-xs font-semibold tracking-wider text-[#C9A961] uppercase">Real Result Example</p>
                  <h2 className="text-xl font-bold text-foreground">See exactly what you'll receive</h2>
                  <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                    Personalised career roadmap, gap analysis, recommended roles with % fit, training, certifications, networking strategy and action plan.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <a
                      href="/en/career-path/example/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 h-10 px-5 text-sm font-medium rounded-lg bg-white text-[#9a7d3e] border border-[#C9A961]/30 hover:border-[#C9A961] transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      See Example
                    </a>
                    <button
                      onClick={() => setStep('upload')}
                      className="inline-flex items-center gap-2 h-10 px-5 text-sm font-semibold rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white transition-all"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      Discover my Career Path
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Real report generated by our AI</p>
                </div>
              </div>
            </div>

            {/* ── Career Intelligence Upsell — clear options ── */}
            <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/50 to-[#C9A961]/5 overflow-hidden">
              <div className="p-6 md:p-8 space-y-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-bold text-foreground">Want more than a roadmap?</h3>
                </div>
                <p className="text-sm text-muted-foreground text-center max-w-xl mx-auto">
                  <strong className="text-foreground">Career Intelligence</strong> compares multiple strategic career directions side-by-side, analyses trade-offs, and gives you a justified recommendation — so you decide with confidence.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {/* Option 1: Upgrade after Career Path */}
                  <div className="p-4 rounded-xl bg-white border border-border space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#C9A961] bg-[#C9A961]/10 px-2 py-0.5 rounded-full tracking-wider">SAVE</span>
                      <span className="text-sm font-semibold text-foreground">Start with Career Path</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Get your Career Path for {CUR}{PRICE}, then upgrade to Career Intelligence for just {CUR}29.</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-bold text-[#C9A961]">{CUR}{PRICE}</span>
                      <span className="text-xs text-muted-foreground">then +{CUR}29 upgrade</span>
                    </div>
                  </div>
                  {/* Option 2: Full Career Intelligence */}
                  <div className="p-4 rounded-xl bg-white border border-purple-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full tracking-wider">FULL</span>
                      <span className="text-sm font-semibold text-foreground">Career Intelligence</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Everything in Career Path + strategic comparison, trade-offs, and final recommendation.</p>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-purple-600">{CUR}49</span>
                      <a
                        href="/en/career-intelligence"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors"
                      >
                        Learn more <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Testimonials — compact ── */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-center text-foreground">What our users say</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {testimonials.map((t, i) => (
                  <div key={i} className="p-4 rounded-xl bg-card border border-border space-y-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} className="w-3.5 h-3.5 fill-[#C9A961] text-[#C9A961]" />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground italic leading-relaxed">"{t.text}"</p>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Bottom CTA ── */}
            <div className="text-center space-y-3 p-6 rounded-2xl bg-[#C9A961]/5 border border-[#C9A961]/20">
              <h2 className="text-xl font-bold text-foreground">Ready to discover your Career Path?</h2>
              <p className="text-sm text-muted-foreground">Full analysis for {CUR}{PRICE}. One-time payment. Results in under 1 minute.</p>
              <Button
                onClick={() => setStep('upload')}
                className="h-12 px-8 text-sm font-semibold rounded-xl bg-[#C9A961] hover:bg-[#b8954f] text-white transition-all"
              >
                <Compass className="w-5 h-5 mr-2" />
                Start my Career Path
              </Button>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: UPLOAD — CV + LinkedIn + Country + Career Goal ═══ */}
        {step === 'upload' && (
          <div className="max-w-xl mx-auto space-y-8 animate-in fade-in">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-foreground">Generate your Career Path</h2>
              <p className="text-sm text-muted-foreground">Upload your CV and share your LinkedIn for a complete analysis.</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
              {/* Country/Region Selector */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#C9A961]" />
                  Your Location <span className="text-muted-foreground font-normal">(for localised salary data)</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    value={selectedCountry}
                    onChange={(e) => { setSelectedCountry(e.target.value); setSelectedRegion(""); }}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]/30 focus:border-[#C9A961] transition-colors text-sm"
                  >
                    <option value="">Select country...</option>
                    {countries.map(c => (
                      <option key={c.code} value={c.country}>{c.country}</option>
                    ))}
                  </select>
                  {countryData && countryData.regions.length > 1 && (
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]/30 focus:border-[#C9A961] transition-colors text-sm"
                    >
                      <option value="">Select region (optional)...</option>
                      {countryData.regions.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* CV Upload */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">1. Upload your CV</label>
                <label
                  htmlFor="cp-cv-upload"
                  className={`relative block w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${file ? 'border-[#C9A961] bg-[#C9A961]/5' : 'border-border hover:border-[#C9A961]/50 hover:bg-muted/50'}`}
                >
                  <input id="cp-cv-upload" type="file" accept=".pdf,.docx" onChange={handleFileChange} className="sr-only" disabled={loading} />
                  <div className="space-y-2">
                    {file ? (
                      <>
                        <FileText className="w-8 h-8 mx-auto text-[#C9A961]" />
                        <p className="text-sm font-semibold text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                        <p className="text-sm font-semibold text-foreground">Drag your CV or click to browse</p>
                        <p className="text-xs text-muted-foreground">PDF or DOCX (max 5MB)</p>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {/* LinkedIn URL */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-[#0077B5]" />
                  2. LinkedIn <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/your-profile"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]/30 focus:border-[#C9A961] transition-colors text-sm"
                  />
                </div>
                <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                  <p className="text-xs font-semibold text-blue-600 mb-1.5 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> The system will automatically analyse:</p>
                  <div className="grid grid-cols-2 gap-1">
                    {['Professional experience', 'Industry & role', 'Identified skills', 'Career progression'].map((item, i) => (
                      <p key={i} className="text-[11px] text-muted-foreground flex items-center gap-1"><Check className="w-3 h-3 text-blue-500 shrink-0" /> {item}</p>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 italic">No data will be published or shared.</p>
                </div>
              </div>

              {/* Career Goal */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">3. What is your main career goal? <span className="text-muted-foreground font-normal">(optional)</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'grow', label: 'Grow in current field' },
                    { value: 'change', label: 'Change career' },
                    { value: 'responsibility', label: 'More responsibility' },
                    { value: 'salary', label: 'Increase salary' },
                    { value: 'tech', label: 'Tech / Innovation' },
                    { value: 'leadership', label: 'Leadership' },
                  ].map((goal) => (
                    <button
                      key={goal.value}
                      onClick={() => setCareerGoal(careerGoal === goal.value ? '' : goal.value)}
                      className={`p-2.5 rounded-lg border text-xs font-medium transition-all text-left ${
                        careerGoal === goal.value
                          ? 'border-[#C9A961] bg-[#C9A961]/10 text-[#C9A961]'
                          : 'border-border text-muted-foreground hover:border-[#C9A961]/40'
                      }`}
                    >
                      {goal.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <p className="text-sm font-medium">5. E-mail <span className="text-red-500">*</span></p>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]/40"
                />
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3">
                <input type="checkbox" id="cp-terms" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} disabled={loading} className="mt-0.5 w-4 h-4 rounded border-border accent-[#C9A961]" />
                <label htmlFor="cp-terms" className="text-sm text-muted-foreground cursor-pointer">
                  I agree to the{" "}
                  <a href="https://www.share2inspire.pt/pages/politica-privacidade.html" target="_blank" rel="noopener noreferrer" className="text-[#C9A961] hover:underline">Privacy Policy</a>
                  {" "}and authorise the processing of my data for career analysis.
                </label>
              </div>

              {/* Error */}
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
              )}

              {/* Submit */}
              <Button
                onClick={handleAnalyze}
                disabled={!file || !acceptedTerms || !isValidLinkedinUrl(linkedinUrl) || loading || !selectedCountry || !email}
                className="w-full h-14 text-base font-semibold rounded-xl bg-[#C9A961] hover:bg-[#b8954f] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />{loadingMessages[loadingStep]}</span>
                ) : (
                  "Start analysis"
                )}
              </Button>

              {loading && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-[#C9A961] rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(((loadingStep + 1) / loadingMessages.length) * 100, 95)}%` }} />
                  </div>
                  <p className="text-center text-sm text-muted-foreground animate-pulse">
                    {loadingMessages[loadingStep]}
                  </p>
                </div>
              )}

              {/* Back button */}
              <button
                onClick={() => setStep('hero')}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 2.5: PREVIEW — Psychological funnel before payment ═══ */}
        {step === 'preview' && previewData && (
          <div className="max-w-xl mx-auto space-y-6 animate-in fade-in">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Analysis complete
              </div>
              <h2 className="text-xl font-bold text-foreground">Your AI-perceived profile</h2>
              <p className="text-sm text-muted-foreground">This is what recruiters see when they analyse your CV</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="text-center pb-4 border-b border-border">
                <p className="text-lg font-bold text-foreground">{previewData.name}</p>
                <p className="text-sm text-[#C9A961] font-semibold">{previewData.role}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/30 rounded-lg text-center">
                  <p className="text-[10px] font-semibold text-muted-foreground tracking-wider mb-1">SENIORITY</p>
                  <p className="text-sm font-bold text-foreground">{previewData.seniority}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg text-center">
                  <p className="text-[10px] font-semibold text-muted-foreground tracking-wider mb-1">EXPERIENCE</p>
                  <p className="text-sm font-bold text-foreground">{previewData.experience}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground tracking-wider mb-2">TOP DETECTED SKILLS</p>
                <div className="flex flex-wrap gap-2">
                  {previewData.skills.map((skill: string, i: number) => (
                    <span key={i} className="text-xs font-medium bg-[#C9A961]/10 text-[#C9A961] px-3 py-1 rounded-full border border-[#C9A961]/20">{skill}</span>
                  ))}
                </div>
              </div>
              {previewData.nextRole && (
                <div className="p-4 bg-gradient-to-r from-[#C9A961]/5 to-[#C9A961]/10 rounded-xl border border-[#C9A961]/20">
                  <p className="text-[10px] font-semibold text-[#C9A961] tracking-wider mb-1">MOST LIKELY NEXT CAREER STEP</p>
                  <p className="text-base font-bold text-foreground">{previewData.nextRole}</p>
                  <p className="text-xs text-muted-foreground mt-1">Discover the full roadmap to get there ↓</p>
                </div>
              )}
            </div>

            {/* Blurred teaser */}
            <div className="relative bg-card border border-border rounded-2xl p-6 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white z-10" />
              <div className="filter blur-sm select-none">
                <p className="text-xs font-semibold text-muted-foreground tracking-wider mb-3">5-YEAR CAREER ROADMAP</p>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-full mt-3" />
                  <div className="h-3 bg-muted rounded w-5/6" />
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="text-center">
                  <Lock className="w-6 h-6 text-[#C9A961] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">Full roadmap locked</p>
                </div>
              </div>
            </div>

            {/* Payment CTAs — Career Path + Career Intelligence option */}
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setPaymentStep('payment');
                  setPaymentError(null);
                  setShowPaymentModal(true);
                }}
                className="w-full h-14 text-base font-semibold rounded-xl bg-[#C9A961] hover:bg-[#b8954f] text-white transition-all"
              >
                <Compass className="w-5 h-5 mr-2" />
                Unlock Career Path — {CUR}{PRICE}
              </Button>

              {/* Career Intelligence upsell */}
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-foreground">Want the full strategic analysis?</span>
                </div>
                <p className="text-xs text-muted-foreground">Career Intelligence includes everything in Career Path + side-by-side comparison, trade-offs, and a justified recommendation.</p>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-purple-600">{CUR}49</span>
                  <a
                    href="/en/career-intelligence"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors ml-auto"
                  >
                    Get Career Intelligence <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <p className="text-center text-[10px] text-muted-foreground">Or upgrade to Career Intelligence after your Career Path results for just {CUR}29</p>
              <button
                onClick={() => setStep('upload')}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                ← Back
              </button>
            </div>
          </div>
        )}

      </main>

      {/* ─── Payment Modal ─── */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#C9A961]" />
              Career Path — Payment
            </DialogTitle>
          </DialogHeader>

          {paymentStep === 'payment' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#C9A961]/5 rounded-lg border border-[#C9A961]/20 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Career Path</p>
                  <p className="text-xs text-muted-foreground">Personalised career map</p>
                </div>
                <div className="text-right">
                  {discountPercent > 0 ? (
                    <>
                      <p className="text-xs text-muted-foreground line-through">{CUR}{PRICE}</p>
                      <p className="text-lg font-bold text-[#C9A961]">{CUR}{FINAL_PRICE_DISPLAY}</p>
                      <p className="text-[10px] text-green-600 font-semibold">-{discountPercent}%</p>
                    </>
                  ) : (
                    <p className="text-lg font-bold text-[#C9A961]">{CUR}{PRICE}</p>
                  )}
                </div>
              </div>

              {/* Unified discount code */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Discount code (optional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => { setDiscountCode(e.target.value.toUpperCase()); setDiscountError(null); setDiscountValid(false); setDiscountPercent(0); }}
                    placeholder="CODE"
                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                    onKeyDown={(e) => e.key === 'Enter' && handleDiscountValidate()}
                  />
                  <Button
                    onClick={handleDiscountValidate}
                    disabled={discountLoading || !discountCode.trim() || discountValid}
                    variant="outline"
                    className="text-sm"
                  >
                    {discountLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : discountValid ? <Check className="w-4 h-4 text-green-500" /> : 'Apply'}
                  </Button>
                </div>
                {discountError && <p className="text-xs text-red-500">{discountError}</p>}
                {discountValid && <p className="text-xs text-green-600 font-semibold">{discountPercent}% discount applied!</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Payment method</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['stripe', 'paypal'] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        paymentMethod === method
                          ? 'border-[#C9A961] bg-[#C9A961]/5 text-foreground'
                          : 'border-border text-muted-foreground hover:border-[#C9A961]/50'
                      }`}
                    >
                      {method === 'stripe' ? 'Card' : 'PayPal'}
                    </button>
                  ))}
                </div>
              </div>

              {paymentError && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />{paymentError}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={paymentMethod === 'stripe' ? handleStripePayment : handlePayPalPayment}
                  disabled={paymentLoading}
                  className={`flex-1 font-semibold text-white ${
                    paymentMethod === 'stripe' ? 'bg-[#635BFF] hover:bg-[#5046E5]' : 'bg-[#C9A961] hover:bg-[#A88B4E]'
                  }`}
                >
                  {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pay ${CUR}${FINAL_PRICE_DISPLAY}`}
                </Button>
              </div>


            </div>
          )}

          {paymentStep === 'success' && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-base font-bold text-foreground">Payment confirmed!</p>
              <p className="text-sm text-muted-foreground">Generating your personalised Career Path...</p>
              <Button
                onClick={handlePaymentSuccess}
                className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold"
              >
                Generate Career Path
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>



      {/* Footer */}
      <footer className="border-t border-foreground/10 py-8 px-6 mt-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 Share2Inspire. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="https://www.share2inspire.pt/pages/politica-privacidade.html" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="https://www.share2inspire.pt/pages/termos-condicoes.html" className="hover:text-foreground transition-colors">Terms</a>
            <a href="/en/cv-analyser" className="hover:text-foreground transition-colors">CV Analyser</a>
            <a href="/career-path" className="hover:text-foreground transition-colors">PT</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
