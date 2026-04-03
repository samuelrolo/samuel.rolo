// Career Intelligence — Standalone EN (€49)
// Upload CV + LinkedIn URL → Payment → Full analysis with strategic decision
// Includes everything from Career Path + comparison, trade-offs, final recommendation

import { useState, useEffect } from "react";
import { Upload, FileText, Loader2, Home as HomeIcon, Compass, Target, TrendingUp, Award, Users, Star, CheckCircle2, Lock, ChevronDown, Linkedin, CreditCard, AlertCircle, Ticket, Unlock, Briefcase, BookOpen, Calendar, ExternalLink, Sparkles, Search, Globe, DollarSign, Zap, ArrowRight, Shield, Check, Eye, Scale, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { sendConversion, trackCVUpload, trackAnalysisStart, trackPaymentStart, trackPurchase } from "@/lib/gtag";
import { trackAffiliateConversion } from "@/lib/affiliate";
import { getMemberPlanTier } from "@/lib/memberAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { countries } from "./countries";
import S2IFooterEN from "@/components/S2IFooterEN";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const SUPABASE_EDGE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co/functions/v1/hyper-task';
const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';

async function saveToUserAnalyses(analysisType: string, data: Record<string, any>) {
  try {
    const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (!storageKey) return;
    const stored = localStorage.getItem(storageKey);
    if (!stored) return;
    const parsed = JSON.parse(stored);
    const accessToken = parsed?.access_token;
    const userId = parsed?.user?.id;
    if (!accessToken || !userId) return;
    const dedupKey = `s2i_saved_${analysisType}_${Date.now()}`;
    if (sessionStorage.getItem(dedupKey)) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_analyses`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify({ user_id: userId, analysis_type: analysisType, data: { ...data, captured_at: new Date().toISOString() }, created_at: new Date().toISOString() })
    });
    if (res.ok) { sessionStorage.setItem(dedupKey, 'true'); console.log('[S2I] Analysis saved to user_analyses:', analysisType); }
  } catch (e) { console.warn('[S2I] Error saving to user_analyses:', e); }
}
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

const testimonials = [
  {
    name: "Catherine M.",
    role: "HR Manager",
    text: "Career Intelligence showed me exactly which of the 3 paths had the highest success probability. The side-by-side comparison was decisive.",
    rating: 5,
  },
  {
    name: "James R.",
    role: "Software Engineer",
    text: "I was torn between Product Manager and Engineering Manager. The trade-off analysis and final recommendation gave me the clarity I needed.",
    rating: 5,
  },
  {
    name: "Sophie L.",
    role: "Strategy Consultant",
    text: "I never thought AI could compare career paths with this level of detail. The final recommendation was surgical.",
    rating: 5,
  },
];

const PRICE_BASE = '49.00';
const PRICE_NUM_BASE = 49.00;
const PRICE_DISPLAY_UPGRADE = '$29';
const PRICE_UPGRADE = '29.00';
const PRICE_NUM_UPGRADE = 29.00;
const PRICE_DISPLAY_MEMBER_PRO = '$9.99';
const PRICE_MEMBER_PRO = '9.99';
const PRICE_NUM_MEMBER_PRO = 9.99;

const ciHeadlinesEN = [
  { text: "Make career decisions with data,", highlight: "not intuition" },
  { text: "See where the market is heading", highlight: "before everyone else" },
  { text: "Turn information into a real advantage", highlight: "in your professional growth" },
];

export default function CareerIntelligenceHomeEN() {
  useEffect(() => { document.title = "Career Intelligence — Strategic Career Decision with AI | Share2Inspire"; }, []);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  useEffect(() => { const t = setInterval(() => setHeadlineIndex(i => (i + 1) % ciHeadlinesEN.length), 4000); return () => clearInterval(t); }, []);
  const { symbol: CUR, code: currencyCode, codeUpper: currencyCodeUpper } = useCurrency();
  const PRICE_DISPLAY_BASE = `${CUR}49`;

  // Detect upgrade from Career Path
  const isUpgrade = (() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgrade') === 'careerpath') return true;
    return false;
  })();

  // Member Pro pricing (75% discount)
  const memberTier = getMemberPlanTier();
  const isMemberPro = memberTier === 'pro';

  const PRICE_DISPLAY = isMemberPro ? PRICE_DISPLAY_MEMBER_PRO : isUpgrade ? PRICE_DISPLAY_UPGRADE : PRICE_DISPLAY_BASE;
  const PRICE = isMemberPro ? PRICE_MEMBER_PRO : isUpgrade ? PRICE_UPGRADE : PRICE_BASE;
  const PRICE_NUM = isMemberPro ? PRICE_NUM_MEMBER_PRO : isUpgrade ? PRICE_NUM_UPGRADE : PRICE_NUM_BASE;
  const memberProductType = isMemberPro ? 'career_intelligence_member_pro' : 'career_intelligence_full';

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
  const [step, setStep] = useState<'hero' | 'upload' | 'preview' | 'analyzing' | 'results'>('hero');
  const [careerGoal, setCareerGoal] = useState<string>('');
  const [country, setCountry] = useState<string>('Portugal');
  const [region, setRegion] = useState<string>('');
  const countryData = countries.find(c => c.country === country);
  const [previewData, setPreviewData] = useState<any>(null);

  const loadingMessages = [
    "Extracting your professional profile...",
    "Mapping skills and experience...",
    "Analysing market trends...",
    "Identifying career opportunities...",
    "Comparing strategic paths...",
    "Calculating success probabilities...",
    "Analysing trade-offs per path...",
    "Building final recommendation...",
    "Finalising your Career Intelligence..."
  ];

  useEffect(() => {
    if (!loading) { setLoadingStep(0); return; }
    const interval = setInterval(() => {
      setLoadingStep(prev => prev < loadingMessages.length - 1 ? prev + 1 : prev);
    }, 4000);
    return () => clearInterval(interval);
  }, [loading]);

  // Sync country/region to sessionStorage in real-time.
  // This ensures CareerIntelligenceResults always uses the country the user
  // selected in THIS form, overriding any value left by a previous Career Path
  // session — which is the root cause of the upgrade-flow country bug.
  useEffect(() => {
    sessionStorage.setItem('analysisCountry', country);
    sessionStorage.setItem('analysisRegion', region || '');
  }, [country, region]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mbway' | 'stripe' | 'paypal'>('stripe');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'payment' | 'polling' | 'success'>('payment');
  const [pollingMsg, setPollingMsg] = useState('');
  const [pollingExpired, setPollingExpired] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  // Unified discount code state (checks discount_coupons then vouchers)
  const [discountCode, setDiscountCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountValid, setDiscountValid] = useState(false);
  const [discountType, setDiscountType] = useState<'coupon' | 'voucher' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const FINAL_PRICE = discountPercent > 0 ? PRICE_NUM * (1 - discountPercent / 100) : PRICE_NUM;
  const FINAL_PRICE_DISPLAY = FINAL_PRICE.toFixed(2);

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
        setError('File must not exceed 5MB');
        setFile(null);
        return;
      }
      setError(null);
      setFile(selectedFile);
      trackCVUpload();
    }
  };

  /* ─── Unified discount code validation (checks coupons first, then vouchers) ─── */
  const handleDiscountValidate = async () => {
    if (!discountCode.trim()) return;
    setDiscountLoading(true);
    setDiscountError(null);
    const code = discountCode.trim().toUpperCase();
    try {
      // Step 1: Check discount_coupons via backend
      const couponRes = await fetch(`${BACKEND_URL}/api/payment/validate-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, product: 'career_intelligence_full' }),
      });
      const couponData = await couponRes.json();
      if (couponData.valid && couponData.discount_percent > 0) {
        setDiscountPercent(couponData.discount_percent);
        setDiscountValid(true);
        setDiscountType('coupon');
        return;
      }

      // Step 2: Check vouchers table directly
      const voucherRes = await fetch(
        `${SUPABASE_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(code)}&select=*`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const rows = await voucherRes.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const v = rows[0];
        if (!v.is_active) { setDiscountError('This code has already been used'); return; }
        if (v.used_analyses >= v.total_analyses) { setDiscountError('This code has no remaining uses'); return; }
        if (v.voucher_type !== 'career_intelligence_full' && v.voucher_type !== 'career_intelligence_pro' && v.voucher_type !== 'complete' && !v.includes_career_intelligence_pro) {
          setDiscountError('This code is not valid for Career Intelligence'); return;
        }
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
        sessionStorage.setItem('careerIntelligenceProPaid', 'true');
        sessionStorage.setItem('careerIntelligenceFull', 'true');
        sessionStorage.setItem('ciNeedsRegeneration', 'true');
        sessionStorage.removeItem('careerPathData');
        sessionStorage.setItem('cpOrderId', `CI-VOUCHER-${v.code}`);
        if (v.email) sessionStorage.setItem('cpPaymentEmail', v.email);
        trackAffiliateConversion({ product: 'career_intelligence_full', amount: 0, currency: currencyCodeUpper, payment_method: 'voucher', customer_email: v.email || '', transaction_id: `CI-VOUCHER-${v.code}` });
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
    trackAnalysisStart('career_intelligence_full');
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

      let response: Response | null = null;
      let responseData: any = null;
      const maxRetries = 2;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);
        try {
          const requestBody: any = { mode: 'cv_extraction' };
          if (useServerExtraction) {
            requestBody.file = base64Content;
            requestBody.filename = file.name;
          } else {
            requestBody.cv_text = cvText.substring(0, 8000);
          }
          response = await fetch(SUPABASE_EDGE_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (response.ok) {
            responseData = await response.json();
            if (responseData.success) break;
          }
          if (attempt < maxRetries) await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (attempt < maxRetries && fetchError.name !== 'AbortError') {
            await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          } else throw fetchError;
        }
      }

      if (!response?.ok) throw new Error('AI analysis error. Please try again.');
      if (!responseData?.success) throw new Error(responseData?.error || 'AI analysis error.');

      const analysisSource = responseData.analysis || responseData;
      if (useServerExtraction && analysisSource.raw_text) cvText = analysisSource.raw_text;

      sessionStorage.setItem('careerPathCvAnalysis', JSON.stringify(analysisSource));
      sessionStorage.setItem('careerPathCvText', (cvText || '').substring(0, 8000));
      sessionStorage.setItem('careerPathCvFile', base64Content);
      sessionStorage.setItem('careerPathCvFilename', file.name);
      sessionStorage.setItem('analysisLang', 'en');
      sessionStorage.setItem('analysisCountry', country);
      sessionStorage.setItem('analysisRegion', region || '');
      if (linkedinUrl) sessionStorage.setItem('careerPathLinkedinUrl', linkedinUrl);

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

  const handleMBWayPayment = async () => {
    if (!email) { setPaymentError('Enter your email'); return; }
    if (!phone) { setPaymentError('Enter your phone number'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setPaymentError('Invalid email'); return; }

    // If price is 0 (100% discount), skip payment entirely
    if (FINAL_PRICE <= 0) {
      const orderId = `CI-FREE-${Date.now()}`;
      sessionStorage.setItem('cpOrderId', orderId);
      sessionStorage.setItem('cpPaymentEmail', email);
      handlePaymentSuccess();
      return;
    }

    setPaymentLoading(true);
    if (typeof window.fbq === 'function') window.fbq('track', 'AddPaymentInfo');
    setPaymentError(null);
    try {
      const orderId = `CI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('cpOrderId', orderId);
      sessionStorage.setItem('cpPaymentEmail', email);
      const response = await fetch(`${BACKEND_URL}/api/payment/mbway`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, phone: (() => { const p = phone.replace(/\D/g, '').replace(/^(\+?351)/, ''); return `351${p}`; })(),
          orderId, amount: FINAL_PRICE.toFixed(2), paymentMethod: 'mbway',
          description: 'Share2Inspire - Career Intelligence', name: email.split('@')[0],
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Payment error');
      setPaymentStep('polling');
      setPollingMsg('Confirm payment in your MB WAY app...');
      startPolling(orderId);
    } catch (err: any) {
      setPaymentError(err.message || 'Payment error');
    } finally { setPaymentLoading(false); }
  };

  const handlePayPalPayment = async () => {
    if (!email) { setPaymentError('Enter your email'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setPaymentError('Invalid email'); return; }

    // If price is 0 (100% discount), skip payment entirely
    if (FINAL_PRICE <= 0) {
      sessionStorage.setItem('cpPaymentEmail', email);
      handlePaymentSuccess();
      return;
    }

    sessionStorage.setItem('cpPaymentEmail', email);
    trackPaymentStart('career_intelligence_full', FINAL_PRICE);
    window.open(`https://paypal.me/SamuelRolo/${FINAL_PRICE.toFixed(2)}USD`, '_blank');
    setPaymentStep('success');
    if (typeof window.fbq === 'function') window.fbq('track', 'Purchase', {value: FINAL_PRICE, currency: currencyCodeUpper});
    const txId = `CI-PAYPAL-${Date.now()}`;
    trackPurchase('career_intelligence_full', FINAL_PRICE, txId);
    trackAffiliateConversion({ product: 'career_intelligence_full', amount: FINAL_PRICE, currency: currencyCodeUpper, payment_method: 'paypal', customer_email: email, transaction_id: txId });
  };

  const handleStripePayment = async () => {
    if (!email) { setPaymentError('Enter your email'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setPaymentError('Invalid email'); return; }

    // If price is 0 (100% discount), skip payment entirely
    if (FINAL_PRICE <= 0) {
      sessionStorage.setItem('cpPaymentEmail', email);
      handlePaymentSuccess();
      return;
    }

    setPaymentLoading(true);
    if (typeof window.fbq === 'function') window.fbq('track', 'AddPaymentInfo');
    setPaymentError(null);
    try {
      const orderId = `CI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const response = await fetch(`${BACKEND_URL}/api/payment/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, name: email.split('@')[0], product_type: memberProductType,
          orderId, language: 'en', country, region, currency: currencyCode, amount: FINAL_PRICE,
        })
      });
      const data = await response.json();
      if (!data.success || !data.url) throw new Error(data.error || 'Error creating payment session');
      sessionStorage.setItem('cpOrderId', orderId);
      sessionStorage.setItem('cpPaymentEmail', email);
      sessionStorage.setItem('stripeSessionId', data.sessionId);
      window.location.href = data.url;
    } catch (err: any) {
      setPaymentError(err.message || 'Payment error');
    } finally { setPaymentLoading(false); }
  };

  const startPolling = (orderId: string) => {
    let attempts = 0;
    const maxAttempts = 60;
    let consecutiveErrors = 0;
    const startTime = Date.now();
    const MIN_BEFORE_EXPIRED = 90000;
    setCurrentOrderId(orderId);
    setPollingExpired(false);
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${BACKEND_URL}/api/payment/check-payment-status`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });
        if (!res.ok) { consecutiveErrors++; if (consecutiveErrors >= 8) { clearInterval(interval); setPollingExpired(true); setPollingMsg('Could not verify. Use the "I already paid" button.'); } return; }
        consecutiveErrors = 0;
        const data = await res.json();
        if (data.paid) { clearInterval(interval); unlockAndRedirect(orderId); return; }
        const elapsed = Date.now() - startTime;
        if (data.expired) {
          if (elapsed < MIN_BEFORE_EXPIRED) { setPollingMsg('Verifying payment... Confirm in MB WAY app.'); }
          else { clearInterval(interval); setPollingExpired(true); setPollingMsg('Payment expired. Use the button below if you already paid.'); }
          return;
        }
        if (elapsed < 30000) setPollingMsg('Confirm payment in your MB WAY app...');
        else if (elapsed < 60000) setPollingMsg('Still waiting... Check your MB WAY app.');
        else setPollingMsg('Waiting for confirmation... If you already approved, wait a few more seconds.');
        if (attempts >= maxAttempts) { clearInterval(interval); setPollingExpired(true); setPollingMsg('Timeout. If you already paid, use the button below.'); }
      } catch { consecutiveErrors++; }
    }, 5000);
  };

  const unlockAndRedirect = (orderId: string) => {
    setShowPaymentModal(false);
    sessionStorage.setItem('careerPathPaid', 'true');
    sessionStorage.setItem('careerIntelligenceProPaid', 'true');
    sessionStorage.setItem('careerIntelligenceFull', 'true');
    sessionStorage.setItem('ciNeedsRegeneration', 'true');
    sessionStorage.removeItem('careerPathData');
    trackPurchase('career_intelligence_full', FINAL_PRICE, orderId);
    trackAffiliateConversion({ product: 'career_intelligence_full', amount: FINAL_PRICE, currency: currencyCodeUpper, payment_method: paymentMethod, customer_email: email, transaction_id: orderId });
    try {
      const cvAnalysis = sessionStorage.getItem('careerPathCvAnalysis');
      const p = cvAnalysis ? JSON.parse(cvAnalysis) : {};
      saveToUserAnalyses('career_intelligence', {
        strategic_paths: p.strategic_paths || [],
        decision_recommendation: p.decision_recommendation || {},
        candidate_profile: p.candidate_profile || {},
        career_goal: careerGoal,
        payment_id: orderId,
      });
    } catch (e) { console.warn('[S2I] Error saving career intelligence:', e); }
    setTimeout(() => { setLocation('/results'); }, 400);
  };

  const handleManualCheck = async () => {
    if (!currentOrderId) return;
    setPollingMsg('Verifying payment...');
    setPollingExpired(false);
    try {
      const res = await fetch(`${BACKEND_URL}/api/payment/check-payment-status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: currentOrderId }),
      });
      const data = await res.json();
      if (data.paid) { unlockAndRedirect(currentOrderId); }
      else { setPollingExpired(true); setPollingMsg('Payment not confirmed yet. Wait a few seconds and try again.'); startPolling(currentOrderId); }
    } catch { setPollingExpired(true); setPollingMsg('Verification error. Try again in a few seconds.'); }
  };

  const handlePaymentSuccess = () => {
    if (currentOrderId) { unlockAndRedirect(currentOrderId); }
    else { setShowPaymentModal(false); sessionStorage.setItem('careerPathPaid', 'true'); sessionStorage.setItem('careerIntelligenceProPaid', 'true'); sessionStorage.setItem('careerIntelligenceFull', 'true'); sessionStorage.setItem('ciNeedsRegeneration', 'true'); sessionStorage.removeItem('careerPathData'); setTimeout(() => { setLocation('/results'); }, 400); }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header — Unified */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <a href="https://www.share2inspire.pt/en/pages/home" className="flex items-center gap-2 shrink-0">
            <img src="https://www.share2inspire.pt/images/logo.webp" alt="Share2Inspire" className="h-8" />
          </a>
          <nav className="hidden lg:flex items-center gap-5 text-[0.8rem] font-medium tracking-wide uppercase">
            <a href="https://www.share2inspire.pt/en/pages/home" className="text-slate-500 hover:text-[#C9A961] transition-colors">Home</a>
            <a href="/en/cv-analyser" className="text-slate-500 hover:text-[#C9A961] transition-colors">CV Analyser</a>
            <a href="/en/career-path" className="text-slate-500 hover:text-[#C9A961] transition-colors">Career Path</a>
            <a href="/en/career-intelligence" className="text-[#C9A961]">Career Intelligence</a>
            <a href="https://www.share2inspire.pt/en/pages/services" className="text-slate-500 hover:text-[#C9A961] transition-colors">Services</a>
            <a href="https://www.share2inspire.pt/en/knowledge-hub" className="text-slate-500 hover:text-[#C9A961] transition-colors">Knowledge Hub</a>
            <a href="https://www.share2inspire.pt/en/pages/about" className="text-slate-500 hover:text-[#C9A961] transition-colors">About</a>
            <a href="https://www.share2inspire.pt/en/pages/contacts" className="text-slate-500 hover:text-[#C9A961] transition-colors">Contacts</a>
          </nav>
          <div className="hidden lg:flex items-center gap-3">
            <a href="/area-cliente/" className="px-4 py-1.5 rounded bg-[#BF9A33] hover:bg-[#d4af5a] text-[#0a0a0a] text-xs font-semibold tracking-wide uppercase transition-colors">Client Area</a>
            <a href="/career-intelligence" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#C9A961]/40 bg-[#C9A961]/10 hover:bg-[#C9A961]/20 transition-colors text-xs font-medium text-[#C9A961]">
              <Globe className="w-3.5 h-3.5" /><span>PT</span>
            </a>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 text-slate-600 hover:text-slate-900">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-6 py-4 space-y-3">
            <a href="https://www.share2inspire.pt/en/pages/home" className="block text-sm text-slate-600 hover:text-[#C9A961]">Home</a>
            <a href="/en/cv-analyser" className="block text-sm text-slate-600 hover:text-[#C9A961]">CV Analyser</a>
            <a href="/en/career-path" className="block text-sm text-slate-600 hover:text-[#C9A961]">Career Path</a>
            <a href="/en/career-intelligence" className="block text-sm text-[#C9A961] font-semibold">Career Intelligence</a>
            <a href="https://www.share2inspire.pt/en/pages/services" className="block text-sm text-slate-600 hover:text-[#C9A961]">Services</a>
            <a href="https://www.share2inspire.pt/en/knowledge-hub" className="block text-sm text-slate-600 hover:text-[#C9A961]">Knowledge Hub</a>
            <a href="https://www.share2inspire.pt/en/pages/about" className="block text-sm text-slate-600 hover:text-[#C9A961]">About</a>
            <a href="https://www.share2inspire.pt/en/pages/contacts" className="block text-sm text-slate-600 hover:text-[#C9A961]">Contacts</a>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <a href="/area-cliente/" className="px-4 py-1.5 rounded bg-[#BF9A33] text-[#0a0a0a] text-xs font-semibold">Client Area</a>
              <a href="/career-intelligence" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#C9A961]/40 text-xs font-medium text-[#C9A961]"><Globe className="w-3.5 h-3.5" />PT</a>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        {step === 'hero' && (
          <div className="space-y-16 animate-in fade-in">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C9A961]/10 border border-[#C9A961]/20 text-sm font-medium text-[#C9A961]">
                <Scale className="w-4 h-4" />Powered by Advanced AI
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight" key={headlineIndex} style={{animation: 'fadeInUp 0.6s ease-out'}}>
                {ciHeadlinesEN[headlineIndex].text} <span className="text-[#C9A961]">{ciHeadlinesEN[headlineIndex].highlight}</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our AI analyses your CV and LinkedIn, compares the 3 career paths with the highest potential, and delivers a final recommendation — with data, not intuition.
              </p>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-foreground">Everything included. One analysis. One decision.</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 p-5 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-muted-foreground" />
                    <p className="text-sm font-semibold text-muted-foreground">Diagnosis (included)</p>
                  </div>
                  {["Personalised career roadmap", "Skills gap analysis", "Salary estimate per stage", "Recommended training & certifications", "Networking strategy", "30-60-90 day plan"].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="w-4 h-4 text-green-500 shrink-0" />{item}</div>
                  ))}
                </div>
                <div className="space-y-3 p-5 rounded-xl bg-gradient-to-b from-[#C9A961]/5 to-[#C9A961]/10 border-2 border-[#C9A961]/30">
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-[#C9A961]" />
                    <p className="text-sm font-semibold text-[#C9A961]">Strategic Decision (exclusive)</p>
                  </div>
                  {["3 paths with success probability", "Side-by-side comparison of all 3 paths", "Trade-offs: what you gain vs what you give up", "Final recommendation with justification", "Action plan per path", "Market context (companies, demand)"].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-foreground font-medium"><Sparkles className="w-4 h-4 text-[#C9A961] shrink-0" />{item}</div>
                  ))}
                </div>
              </div>
              <div className="text-center space-y-4 pt-4">
                <Button onClick={() => setStep('upload')} className="h-auto min-h-[3.5rem] px-4 sm:px-10 py-3 text-sm sm:text-base font-semibold rounded-xl bg-[#C9A961] hover:bg-[#b8954f] text-white transition-all whitespace-normal">
                  <Scale className="w-5 h-5 mr-2 flex-shrink-0" />Get my career recommendation
                </Button>
                <p className="text-xs text-muted-foreground">Full analysis for {PRICE_DISPLAY} · One-time payment · Result in {'<'} 1 minute{isUpgrade && <span className="ml-1 text-green-600 font-medium">(Career Path upgrade)</span>}</p>
                {/* Demo button */}
                <a
                  href="/en/career-intelligence/demo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-[#C9A961]/60 hover:bg-[#C9A961]/10 text-[#C9A961] font-semibold text-sm transition-all group"
                  style={{ background: 'rgba(201,169,97,0.07)' }}
                >
                  <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  See what you’ll receive
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </a>
                <p className="text-xs text-muted-foreground">Only need the diagnosis? <a href="/en/career-path" className="text-[#C9A961] hover:underline">Career Path for {CUR}19.99 →</a></p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[{ icon: <Shield className="w-5 h-5" />, label: "100% private data" }, { icon: <Zap className="w-5 h-5" />, label: "Result in < 1 minute" }, { icon: <Award className="w-5 h-5" />, label: "Built by HR experts" }].map((badge, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30 text-center">
                  <span className="text-[#C9A961]">{badge.icon}</span>
                  <span className="text-xs font-medium text-muted-foreground">{badge.label}</span>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-foreground">3 steps. 1 minute. 1 decision.</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { step: "1", title: "Upload your CV", desc: "Upload your CV and share your LinkedIn.", time: "30 sec" },
                  { step: "2", title: "AI analyses everything", desc: "We cross-reference experience, skills, market and probabilities.", time: "30 sec" },
                  { step: "3", title: "Get the recommendation", desc: "3 paths compared + final recommendation with justification.", time: "Instant" },
                ].map((item, i) => (
                  <div key={i} className="relative p-5 rounded-xl bg-card border border-border text-center space-y-2">
                    <div className="w-8 h-8 rounded-full bg-[#C9A961]/10 border border-[#C9A961]/30 flex items-center justify-center mx-auto">
                      <span className="text-sm font-bold text-[#C9A961]">{item.step}</span>
                    </div>
                    <p className="font-semibold text-foreground text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                    <span className="text-[10px] text-[#C9A961] font-medium">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-[#C9A961]/20 text-center">
              <Scale className="w-8 h-8 text-[#C9A961] mx-auto" />
              <h3 className="text-lg font-bold text-white">The equivalent of a strategic coaching session.</h3>
              <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                A career coach charges between $300 and $600 per session to help you decide. Career Intelligence delivers the same analysis — with objective data, structured comparison and a justified recommendation — for <strong className="text-[#C9A961]">{PRICE_DISPLAY}</strong>.
              </p>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-foreground">What users say</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {testimonials.map((t, i) => (
                  <div key={i} className="p-5 rounded-xl bg-card border border-border space-y-3">
                    <div className="flex gap-0.5">{Array.from({ length: t.rating }).map((_, j) => (<Star key={j} className="w-4 h-4 fill-[#C9A961] text-[#C9A961]" />))}</div>
                    <p className="text-sm text-muted-foreground italic">"{t.text}"</p>
                    <div><p className="text-sm font-semibold text-foreground">{t.name}</p><p className="text-xs text-muted-foreground">{t.role}</p></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center space-y-4 p-8 rounded-2xl bg-[#C9A961]/5 border border-[#C9A961]/20">
              <h2 className="text-2xl font-bold text-foreground">You don't need more options. You need to know which one to choose.</h2>
              <p className="text-muted-foreground">Full diagnosis + strategic decision for {PRICE_DISPLAY}. One-time payment. No subscription.</p>
              <Button onClick={() => setStep('upload')} className="h-auto min-h-[3.5rem] px-4 sm:px-10 py-3 text-sm sm:text-base font-semibold rounded-xl bg-[#C9A961] hover:bg-[#b8954f] text-white transition-all whitespace-normal">
                <Scale className="w-5 h-5 mr-2 flex-shrink-0" />Get my career recommendation
              </Button>
              <p className="text-xs text-muted-foreground">Only need the diagnosis? <a href="/en/career-path" className="text-[#C9A961] hover:underline">Career Path for {CUR}19.99 →</a></p>
            </div>
          </div>
        )}

        {step === 'upload' && (
          <div className="max-w-xl mx-auto space-y-8 animate-in fade-in">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-foreground">Career Intelligence</h2>
              <p className="text-sm text-muted-foreground">Upload your CV and share your LinkedIn for the full analysis with recommendation.</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">1. Upload your CV</label>
                <label htmlFor="ci-cv-upload-en" className={`relative block w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${file ? 'border-[#C9A961] bg-[#C9A961]/5' : 'border-border hover:border-[#C9A961]/50 hover:bg-muted/50'}`}>
                  <input id="ci-cv-upload-en" type="file" accept=".pdf,.docx" onChange={handleFileChange} className="sr-only" disabled={loading} />
                  <div className="space-y-2">
                    {file ? (<><FileText className="w-8 h-8 mx-auto text-[#C9A961]" /><p className="text-sm font-semibold text-foreground">{file.name}</p><p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p></>) : (<><Upload className="w-8 h-8 mx-auto text-muted-foreground" /><p className="text-sm font-semibold text-foreground">Drag your CV or click to choose</p><p className="text-xs text-muted-foreground">PDF or DOCX (max 5MB)</p></>)}
                  </div>
                </label>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2"><Linkedin className="w-4 h-4 text-[#0077B5]" />2. LinkedIn <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="url" placeholder="https://linkedin.com/in/your-profile" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} disabled={loading} className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]/30 focus:border-[#C9A961] transition-colors text-sm" />
                </div>
                <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                  <p className="text-xs font-semibold text-blue-600 mb-1.5 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> The system will automatically analyse:</p>
                  <div className="grid grid-cols-2 gap-1">
                    {['Professional experience', 'Area of expertise', 'Identified skills', 'Role evolution'].map((item, i) => (
                      <p key={i} className="text-[11px] text-muted-foreground flex items-center gap-1"><Check className="w-3 h-3 text-blue-500 shrink-0" /> {item}</p>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 italic">No data will be published or shared.</p>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">3. What is your main career goal? <span className="text-muted-foreground font-normal">(optional)</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ value: 'grow', label: 'Grow in current area' }, { value: 'change', label: 'Change field' }, { value: 'responsibility', label: 'More responsibility' }, { value: 'salary', label: 'Increase salary' }, { value: 'tech', label: 'Technology / Innovation' }, { value: 'leadership', label: 'Leadership' }].map((goal) => (
                    <button key={goal.value} onClick={() => setCareerGoal(careerGoal === goal.value ? '' : goal.value)} className={`p-2.5 rounded-lg border text-xs font-medium transition-all text-left ${careerGoal === goal.value ? 'border-[#C9A961] bg-[#C9A961]/10 text-[#C9A961]' : 'border-border text-muted-foreground hover:border-[#C9A961]/40'}`}>{goal.label}</button>
                  ))}
                </div>
              </div>

              {/* Country & Region */}
              <div className="space-y-3">
                <p className="text-sm font-medium">4. Country and region <span className="text-red-500">*</span></p>
                <div className="grid grid-cols-1 gap-3">
                  <select
                    value={country}
                    onChange={(e) => { setCountry(e.target.value); setRegion(''); }}
                    className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]/40"
                  >
                    <option value="">Select your country...</option>
                    {countries.map(c => (
                      <option key={c.code} value={c.country}>{c.country}</option>
                    ))}
                  </select>
                  {countryData && countryData.regions.length > 1 && (
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]/40"
                    >
                      <option value="">Select region (optional)...</option>
                      {countryData.regions.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  )}
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
                <input type="checkbox" id="ci-terms-en" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} disabled={loading} className="mt-0.5 w-4 h-4 rounded border-border accent-[#C9A961]" />
                <label htmlFor="ci-terms-en" className="text-sm text-muted-foreground cursor-pointer">
                  I agree with the <a href="https://www.share2inspire.pt/en/pages/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#C9A961] hover:underline">Privacy Policy</a> and authorise the processing of my data for career analysis.
                </label>
              </div>
              {error && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
              <Button onClick={handleAnalyze} disabled={!file || !acceptedTerms || !isValidLinkedinUrl(linkedinUrl) || !email || !country || loading} className="w-full h-14 text-base font-semibold rounded-xl bg-[#C9A961] hover:bg-[#b8954f] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                {loading ? (<span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />{loadingMessages[loadingStep]}</span>) : "Start analysis"}
              </Button>
              {loading && (<div className="space-y-3 animate-in fade-in"><div className="w-full bg-muted rounded-full h-1.5 overflow-hidden"><div className="h-full bg-[#C9A961] rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(((loadingStep + 1) / loadingMessages.length) * 100, 95)}%` }} /></div><p className="text-center text-sm text-muted-foreground animate-pulse">{loadingMessages[loadingStep]}</p></div>)}
              <button onClick={() => setStep('hero')} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center">← Back</button>
            </div>
          </div>
        )}

        {step === 'preview' && previewData && (
          <div className="max-w-xl mx-auto space-y-6 animate-in fade-in">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-500/20"><CheckCircle2 className="w-3.5 h-3.5" />Analysis complete</div>
              <h2 className="text-xl font-bold text-foreground">Your profile as seen by AI</h2>
              <p className="text-sm text-muted-foreground">This is what recruiters see when they analyse your CV</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="text-center pb-4 border-b border-border"><p className="text-lg font-bold text-foreground">{previewData.name}</p><p className="text-sm text-[#C9A961] font-semibold">{previewData.role}</p></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/30 rounded-lg text-center"><p className="text-[10px] font-semibold text-muted-foreground tracking-wider mb-1">SENIORITY</p><p className="text-sm font-bold text-foreground">{previewData.seniority}</p></div>
                <div className="p-3 bg-muted/30 rounded-lg text-center"><p className="text-[10px] font-semibold text-muted-foreground tracking-wider mb-1">EXPERIENCE</p><p className="text-sm font-bold text-foreground">{previewData.experience}</p></div>
              </div>
              <div><p className="text-[10px] font-semibold text-muted-foreground tracking-wider mb-2">TOP DETECTED SKILLS</p><div className="flex flex-wrap gap-2">{previewData.skills.map((skill: string, i: number) => (<span key={i} className="text-xs font-medium bg-[#C9A961]/10 text-[#C9A961] px-3 py-1 rounded-full border border-[#C9A961]/20">{skill}</span>))}</div></div>
              {previewData.nextRole && (<div className="p-4 bg-gradient-to-r from-[#C9A961]/5 to-[#C9A961]/10 rounded-xl border border-[#C9A961]/20"><p className="text-[10px] font-semibold text-[#C9A961] tracking-wider mb-1">MOST LIKELY NEXT CAREER STEP</p><p className="text-base font-bold text-foreground">{previewData.nextRole}</p><p className="text-xs text-muted-foreground mt-1">Discover the full roadmap + final recommendation ↓</p></div>)}
            </div>
            <div className="relative bg-card border border-border rounded-2xl p-6 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white z-10" />
              <div className="filter blur-sm select-none"><p className="text-xs font-semibold text-muted-foreground tracking-wider mb-3">STRATEGIC COMPARISON OF 3 PATHS</p><div className="space-y-2"><div className="h-4 bg-muted rounded w-3/4" /><div className="h-4 bg-muted rounded w-1/2" /><div className="h-4 bg-muted rounded w-2/3" /><div className="h-3 bg-muted rounded w-full mt-3" /><div className="h-3 bg-muted rounded w-5/6" /></div></div>
              <div className="absolute inset-0 flex items-center justify-center z-20"><div className="text-center"><Lock className="w-6 h-6 text-[#C9A961] mx-auto mb-2" /><p className="text-sm font-semibold text-foreground">Full analysis locked</p></div></div>
            </div>
            <div className="space-y-3">
              <Button onClick={() => { setPaymentStep('payment'); setPaymentError(null); setShowPaymentModal(true); }} className="w-full h-14 text-base font-semibold rounded-xl bg-[#C9A961] hover:bg-[#b8954f] text-white transition-all">
                <Scale className="w-5 h-5 mr-2" />Unlock Career Intelligence — {PRICE_DISPLAY}
              </Button>
              <p className="text-center text-[10px] text-muted-foreground">Diagnosis + 3 paths + comparison + trade-offs + final recommendation</p>
              <button onClick={() => setStep('upload')} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center">← Back</button>
            </div>
          </div>
        )}
      </main>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Scale className="w-5 h-5 text-[#C9A961]" />Career Intelligence — Payment</DialogTitle></DialogHeader>
          {paymentStep === 'payment' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#C9A961]/5 rounded-lg border border-[#C9A961]/20 flex items-center justify-between">
                <div><p className="text-sm font-semibold text-foreground">Career Intelligence</p><p className="text-xs text-muted-foreground">Diagnosis + Strategic Decision</p></div>
                <div className="text-right">
                  {discountPercent > 0 ? (<><p className="text-xs text-muted-foreground line-through">{PRICE_DISPLAY}</p><p className="text-lg font-bold text-[#C9A961]">{CUR}{FINAL_PRICE_DISPLAY}</p><p className="text-[10px] text-green-600 font-semibold">-{discountPercent}%</p></>) : (<p className="text-lg font-bold text-[#C9A961]">{PRICE_DISPLAY}</p>)}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Discount code (optional)</label>
                <div className="flex gap-2">
                  <input type="text" value={discountCode} onChange={(e) => { setDiscountCode(e.target.value.toUpperCase()); setDiscountError(null); setDiscountValid(false); setDiscountPercent(0); setDiscountType(null); }} placeholder="CODE" className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]" onKeyDown={(e) => e.key === 'Enter' && handleDiscountValidate()} />
                  <Button onClick={handleDiscountValidate} disabled={discountLoading || !discountCode.trim() || discountValid} variant="outline" className="text-sm">{discountLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : discountValid ? <Check className="w-4 h-4 text-green-500" /> : 'Apply'}</Button>
                </div>
                {discountError && <p className="text-xs text-red-500">{discountError}</p>}
                {discountValid && <p className="text-xs text-green-600 font-semibold">{discountPercent}% discount applied!</p>}
              </div>
              <div className="space-y-1"><label className="text-xs font-semibold text-foreground">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]" /></div>
              {FINAL_PRICE > 0 ? (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">Payment method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['stripe', 'paypal', 'mbway'] as const).map((method) => (
                        <button key={method} onClick={() => setPaymentMethod(method)} className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${paymentMethod === method ? 'border-[#C9A961] bg-[#C9A961]/5 text-foreground' : 'border-border text-muted-foreground hover:border-[#C9A961]/50'}`}>
                          {method === 'mbway' ? 'MB WAY' : method === 'stripe' ? 'Card' : 'PayPal'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {paymentMethod === 'mbway' && (<div className="space-y-1"><label className="text-xs font-semibold text-foreground">Phone (MB WAY)</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9XXXXXXXX" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]" /></div>)}
                  {paymentError && (<p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4 shrink-0" />{paymentError}</p>)}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowPaymentModal(false)} className="flex-1">Back</Button>
                    <Button onClick={paymentMethod === 'stripe' ? handleStripePayment : paymentMethod === 'mbway' ? handleMBWayPayment : handlePayPalPayment} disabled={paymentLoading} className={`flex-1 font-semibold text-white ${paymentMethod === 'stripe' ? 'bg-[#635BFF] hover:bg-[#5046E5]' : 'bg-[#C9A961] hover:bg-[#A88B4E]'}`}>
                      {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pay ${CUR}${FINAL_PRICE_DISPLAY}`}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowPaymentModal(false)} className="flex-1">Back</Button>
                  <Button
                    onClick={() => {
                      setShowPaymentModal(false);
                      sessionStorage.setItem('careerPathPaid', 'true');
                      sessionStorage.setItem('careerIntelligenceProPaid', 'true');
                      sessionStorage.setItem('careerIntelligenceFull', 'true');
                      sessionStorage.setItem('ciNeedsRegeneration', 'true');
                      sessionStorage.removeItem('careerPathData');
                      sessionStorage.setItem('cpOrderId', `CI-FREE-${discountCode || 'PROMO'}`);
                      if (email) sessionStorage.setItem('cpPaymentEmail', email);
                      setLocation('/results');
                    }}
                    className="flex-1 font-semibold text-white bg-green-600 hover:bg-green-700"
                  >
                    <Unlock className="w-4 h-4 mr-2" /> Unlock free
                  </Button>
                </div>
              )}

            </div>
          )}
          {paymentStep === 'polling' && (<div className="text-center space-y-4 py-4">{!pollingExpired ? <Loader2 className="w-10 h-10 animate-spin text-[#C9A961] mx-auto" /> : <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />}<p className="text-sm font-semibold text-foreground">{pollingMsg}</p>{!pollingExpired && <p className="text-xs text-muted-foreground">Waiting for payment confirmation...</p>}{pollingExpired && (<Button onClick={handleManualCheck} className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold"><CheckCircle2 className="w-4 h-4 mr-2" />I already paid — check again</Button>)}</div>)}
          {paymentStep === 'success' && (<div className="text-center space-y-4 py-4"><CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" /><p className="text-base font-bold text-foreground">Payment confirmed!</p><p className="text-sm text-muted-foreground">Generating your full Career Intelligence...</p><Button onClick={handlePaymentSuccess} className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold">Generate Career Intelligence</Button></div>)}
        </DialogContent>
      </Dialog>



      {/* ─── Member Area CTA ─── */}
      <div className="max-w-4xl mx-auto px-6 mt-12 mb-8">
        <div className="p-6 bg-gradient-to-r from-[#f9f6ef] to-[#faf8f3] border border-[#C9A961]/20 rounded-2xl text-center">
          <p className="text-base font-bold text-slate-800 mb-2">Want regular access to Career Intelligence?</p>
          <p className="text-sm text-slate-500 mb-4 leading-relaxed">With the Pro plan, you get Career Intelligence included monthly + all other tools, exclusive content and much more.</p>
          <a
            href="https://www.share2inspire.pt/area-cliente/planos"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C9A961] hover:bg-[#b8954f] text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            View subscription plans →
          </a>
          <p className="text-xs text-slate-400 mt-3">Career Intelligence included in the Pro plan (€39.99/month)</p>
        </div>
      </div>
      <S2IFooterEN />
    </div>
  );
}
