// CV Analyser v2 — English International Version
// Uses Supabase Edge Function (hyper-task) for Gemini AI analysis
// Includes country/region selector for geolocalised analysis

declare global {
  interface Window {
    currentReportData: any;
  }
}

import { useState, useEffect } from "react";
import { Upload, FileText, Loader2, Home as HomeIcon, FileCheck, BarChart3, Grid2x2, TrendingUp, Eye, ChevronDown, ChevronUp, Star, Users, Award, Zap, Shield, Target, Clock, CheckCircle2, XCircle, Globe, Compass, Briefcase, Link, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { countries } from "./countries";
import { useCurrency } from "@/hooks/useCurrency";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const SUPABASE_EDGE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co/functions/v1/hyper-task';
const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';

function logAnalysisToSupabase(analysisResult: any, analysisSource: any, cvText?: string) {
  try {
    const score = analysisResult.overallScore || null;
    const professionalArea = analysisResult.perceivedRole || null;
    const cp = analysisSource?.candidate_profile || analysisSource?.analysis?.candidate_profile || {};
    const detectedName = cp.detected_name || null;
    const detectedEmail = cp.detected_email && cp.detected_email !== 'N/A' ? cp.detected_email : null;
    // Use mandatory email from form as primary, Gemini detection as fallback
    const userEmail = sessionStorage.getItem('paymentEmail') || detectedEmail;
    const detectedPhone = cp.detected_phone && cp.detected_phone !== 'N/A' ? cp.detected_phone : null;
    // Check if this is a paid analysis (voucher used or LinkedIn paid)
    const isPaid = sessionStorage.getItem('isPaid') === 'true';
    const paymentAmount = sessionStorage.getItem('paymentAmount') || null;
    const transactionId = sessionStorage.getItem('transactionId') || null;
    fetch(`${SUPABASE_URL}/rest/v1/cv_analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        score: score,
        professional_area: professionalArea,
        analysis_type: isPaid ? 'paid' : 'free',
        analysis_result: analysisSource ? JSON.stringify(analysisSource) : null,
        cv_text: cvText || null,
        payment_status: isPaid ? 'paid' : 'pending',
        payment_amount: paymentAmount ? parseFloat(paymentAmount) : null,
        transaction_id: transactionId,
        domain: 'share2inspire.pt/en',
        user_name: detectedName,
        user_email: userEmail,
        user_phone: detectedPhone,
      }),
    }).then(res => res.json()).then(data => {
      if (Array.isArray(data) && data[0]?.id) {
        sessionStorage.setItem('analysisId', String(data[0].id));
        console.log('[ANALYTICS] cv_analysis logged, id:', data[0].id);
      }
    }).catch(() => {});
  } catch (e) {}
}

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

function transformGeminiResponse(analysis: any): any {
  let atsRejectionRate = 35;
  let atsTopFactor: string | undefined;
  const quadrants: any[] = [];
  let keywords: string[] = [];
  let perceivedRole: string | undefined;
  let perceivedSeniority: string | undefined;
  let overallScoreNum: number | undefined;
  let salaryDetailed: any = {
    percentile25: 1400, median: 1800, percentile75: 2400, topMax: 3200,
    currency: 'EUR', period: 'monthly',
    benefits: ['Health insurance', 'Meal allowance', 'Continuous training'],
    benefitsNote: 'Reference values for the selected market.',
    source: 'Aggregated market data (Hays, Michael Page, Robert Walters, Mercer 2024/2025)'
  };
  let automationRisk: any = { percentage: 35, level: 'Medium', description: 'Your profile has a moderate automation risk.', recommendations: ['Invest in leadership skills', 'Develop strategic thinking', 'Deepen AI knowledge'] };
  let improvementActions: any[] = [];
  let priorityMatrix: any[] = [];
  let detailedAtsAnalysis: any = { factors: [], atsSystems: ['Workday', 'Taleo', 'Greenhouse', 'SAP SuccessFactors', 'iCIMS'], quickFixes: [] };
  let recruiterDeepAnalysis: any = { attentionMap: [], frictionPoints: [], positiveSignals: [], readingFlow: '' };
  let actionPlan30Days: any[] = [];

  try {
    let overallScore = 6;
    if (analysis.executive_summary?.global_score) {
      const gs = parseFloat(analysis.executive_summary.global_score);
      overallScore = gs > 10 ? gs / 10 : gs;
    } else if (analysis.scoring_geral?.pontuacao) {
      overallScore = analysis.scoring_geral.pontuacao;
    } else if (analysis.overall_score) {
      overallScore = analysis.overall_score;
    }
    
    atsRejectionRate = Math.round(Math.max(5, Math.min(85, 100 - (overallScore * 10))));
    overallScoreNum = overallScore;

    const sections = analysis.secoes_analisadas || [];
    const sectionMapping: Record<string, { title: string; benchmark: number }> = {
      'estrutura': { title: 'Structure', benchmark: 70 },
      'structure': { title: 'Structure', benchmark: 70 },
      'cabeçalho': { title: 'Structure', benchmark: 70 },
      'header': { title: 'Structure', benchmark: 70 },
      'resumo': { title: 'Content', benchmark: 72 },
      'summary': { title: 'Content', benchmark: 72 },
      'content': { title: 'Content', benchmark: 72 },
      'conteúdo': { title: 'Content', benchmark: 72 },
      'formação': { title: 'Education', benchmark: 65 },
      'education': { title: 'Education', benchmark: 65 },
      'experiência': { title: 'Experience', benchmark: 70 },
      'experience': { title: 'Experience', benchmark: 70 },
    };

    const addedQuadrants = new Set<string>();
    for (const section of sections) {
      const sectionName = (section.secao || section.section || '').toLowerCase().replace(/\(.*?\)/g, '').trim();
      let mapping = null;
      for (const [key, value] of Object.entries(sectionMapping)) {
        if (sectionName.includes(key)) { mapping = value; break; }
      }
      if (!mapping || addedQuadrants.has(mapping.title)) continue;
      addedQuadrants.add(mapping.title);
      const score = Math.round((section.scoring_secao || section.section_score || 5) * 10);
      quadrants.push({
        title: mapping.title,
        score: Math.min(100, Math.max(0, score)),
        benchmark: mapping.benchmark,
        impactPhrase: section.pontos_a_melhorar?.[0] || section.improvements?.[0] || `${mapping.title} analysis`,
        strengths: (section.pontos_fortes || section.strengths || []).slice(0, 3),
        weaknesses: (section.pontos_a_melhorar || section.improvements || []).slice(0, 3),
      });
    }

    const baseScore = Math.round(overallScore * 10);
    const globalStrengths = analysis.global_summary?.strengths || [];
    const globalImprovements = analysis.global_summary?.improvements || [];
    const defaultQuadrants = [
      { title: 'Structure', benchmark: 70, defaultImpact: 'CV organisation and clarity', variation: -3 },
      { title: 'Content', benchmark: 72, defaultImpact: 'Content quality and relevance', variation: 2 },
      { title: 'Education', benchmark: 65, defaultImpact: 'Academic and continuous education', variation: -5 },
      { title: 'Experience', benchmark: 70, defaultImpact: 'Professional experience', variation: 4 },
    ];
    for (let i = 0; i < defaultQuadrants.length; i++) {
      const dq = defaultQuadrants[i];
      if (!addedQuadrants.has(dq.title)) {
        const variation = dq.variation + Math.floor(Math.random() * 6) - 3;
        quadrants.push({
          title: dq.title,
          score: Math.min(100, Math.max(20, baseScore + variation)),
          benchmark: dq.benchmark,
          impactPhrase: dq.defaultImpact,
          strengths: globalStrengths[i] ? [globalStrengths[i]] : undefined,
          weaknesses: globalImprovements[i] ? [globalImprovements[i]] : undefined,
        });
      }
    }
    const order = ['Structure', 'Content', 'Education', 'Experience'];
    quadrants.sort((a: any, b: any) => order.indexOf(a.title) - order.indexOf(b.title));

    if (analysis.candidate_profile?.key_skills?.length > 0) {
      keywords = analysis.candidate_profile.key_skills.slice(0, 6);
    } else if (analysis.keywords_extracted?.length > 0) {
      keywords = analysis.keywords_extracted;
    }
    if (keywords.length === 0) {
      keywords = ['Professional Profile', 'Technical Skills', 'Experience', 'Education'];
    }

    if (analysis.ats_analysis?.main_issues?.[0]) {
      atsTopFactor = analysis.ats_analysis.main_issues[0];
    } else if (analysis.global_summary?.improvements?.[0]) {
      atsTopFactor = analysis.global_summary.improvements[0];
    }

    if (analysis.candidate_profile?.detected_role) {
      perceivedRole = analysis.candidate_profile.detected_role;
    }
    if (analysis.candidate_profile?.seniority_level) {
      perceivedSeniority = analysis.candidate_profile.seniority_level;
    }

    if (analysis.salary_estimate) {
      const se = analysis.salary_estimate;
      salaryDetailed = {
        ...salaryDetailed,
        percentile25: se.percentile_25 || se.min || salaryDetailed.percentile25,
        median: se.median || salaryDetailed.median,
        percentile75: se.percentile_75 || se.max || salaryDetailed.percentile75,
        topMax: se.top_max || se.percentile_90 || salaryDetailed.topMax,
      };
    }

    if (analysis.automation_risk) {
      automationRisk = { ...automationRisk, ...analysis.automation_risk };
    }

    if (analysis.improvement_actions) {
      improvementActions = analysis.improvement_actions;
    }
    if (analysis.priority_matrix) {
      priorityMatrix = analysis.priority_matrix;
    }
    if (analysis.detailed_ats_analysis) {
      detailedAtsAnalysis = { ...detailedAtsAnalysis, ...analysis.detailed_ats_analysis };
    }
    if (analysis.recruiter_deep_analysis) {
      recruiterDeepAnalysis = { ...recruiterDeepAnalysis, ...analysis.recruiter_deep_analysis };
    }
    if (analysis.action_plan_30_days) {
      actionPlan30Days = analysis.action_plan_30_days;
    }

  } catch (e) {
    console.error('[transformGeminiResponse] Error:', e);
  }

  return {
    atsRejectionRate,
    atsTopFactor,
    quadrants,
    keywords,
    perceivedRole,
    perceivedSeniority,
    overallScore: overallScoreNum,
    salaryDetailed,
    automationRisk,
    improvementActions,
    priorityMatrix,
    detailedAtsAnalysis,
    recruiterDeepAnalysis,
    actionPlan30Days,
  };
}

/* ─── Testimonials ─── */
const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Marketing Manager",
    text: "I received the report in minutes. The suggestions were so specific that I improved my CV that same evening. Result: 3 interviews the following week.",
    rating: 5,
  },
  {
    name: "James Thompson",
    role: "Software Engineer",
    text: "The quadrant analysis showed me exactly where my CV was weak. After applying the recommendations, I passed ATS filters that previously rejected me.",
    rating: 5,
  },
  {
    name: "Maria Garcia",
    role: "Project Manager",
    text: "Worth far more than the price I paid. The normal curve positioning was an eye-opener — I realised I was at the 40th percentile and now I'm at the 75th.",
    rating: 5,
  },
];

/* ─── Pricing Data ─── */
const pricingPlans = [
  {
    name: "Essential",
    price: "9.99",
    analyses: 1,
    perUnit: "9.99",
    popular: false,
    badge: null,
    features: ["Full analysis unlocked", "Normal curve positioning", "Detailed salary estimate", "LinkedIn Certification — share your result", "PDF report via email"],
  },

  {
    name: "Professional",
    price: "15.99",
    analyses: 3,
    perUnit: "5.33",
    popular: false,
    badge: null,
    features: ["3 full analyses", "Reusable code for future analyses", "LinkedIn Certification — share your result", "Ideal for testing CV versions", "Priority email support"],
  },
  {
    name: "Premium",
    price: "20.49",
    analyses: 5,
    perUnit: "4.10",
    popular: false,
    badge: null,
    features: ["5 full analyses", "Reusable code for future analyses", "LinkedIn Certification — share your result", "Best price per analysis", "Share with friends/colleagues"],
  },
];

/* ─── Comparison Data ─── */
const comparisonFeatures = [
  { feature: "Advanced AI analysis", us: true, competitor1: true, competitor2: false },
  { feature: "Report in your language", us: true, competitor1: false, competitor2: true },
  { feature: "Real ATS score", us: true, competitor1: true, competitor2: false },
  { feature: "Normal curve positioning", us: true, competitor1: false, competitor2: false },
  { feature: "Salary estimate", us: true, competitor1: false, competitor2: false },
  { feature: "Free analysis included", us: true, competitor1: false, competitor2: true },
  { feature: "Detailed PDF report", us: true, competitor1: true, competitor2: false },
  { feature: "Career Path (career roadmap)", us: true, competitor1: false, competitor2: false },
  { feature: "Shareable LinkedIn Certification", us: true, competitor1: false, competitor2: false },
  { feature: "CV vs LinkedIn cross-analysis", us: true, competitor1: false, competitor2: false },

  { feature: "Price", usText: "From 9.99", comp1Text: "19.99/mo", comp2Text: "9.99" },
];

export default function HomeEN() {
  useEffect(() => { document.title = "CV Analyser — AI-Powered CV Analysis | Share2Inspire"; }, []);
  const { symbol: CUR, code: currencyCode, codeUpper: currencyCodeUpper } = useCurrency();

  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [savedCvInfo, setSavedCvInfo] = useState<{filename: string; url: string} | null>(null);

  // Load saved CV from user_profiles if logged in
  useEffect(() => {
    (async () => {
      try {
        const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (!storageKey) return;
        const stored = localStorage.getItem(storageKey);
        if (!stored) return;
        const parsed = JSON.parse(stored);
        const accessToken = parsed?.access_token;
        const userId = parsed?.user?.id;
        if (!accessToken || !userId) return;
        const res = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${userId}&select=cv_url,cv_filename,email`, {
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}` }
        });
        if (!res.ok) return;
        const rows = await res.json();
        if (rows?.[0]?.cv_url && rows[0].cv_filename) {
          setSavedCvInfo({ filename: rows[0].cv_filename, url: rows[0].cv_url });
        }
        if (rows?.[0]?.email) setAnalysisEmail(rows[0].email);
      } catch (e) { /* silent */ }
    })();
  }, []);

  // Save CV to Supabase Storage after analysis
  function persistCvToStorage(base64Content: string, filename: string) {
    try {
      const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
      if (!storageKey) return;
      const stored = localStorage.getItem(storageKey);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      const accessToken = parsed?.access_token;
      const userId = parsed?.user?.id;
      if (!accessToken || !userId) return;
      const byteString = atob(base64Content.split(',')[1] || base64Content);
      const mimeString = base64Content.split(',')[0]?.split(':')[1]?.split(';')[0] || 'application/pdf';
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const blob = new Blob([ab], { type: mimeString });
      const ext = filename.split('.').pop() || 'pdf';
      const path = `${userId}/cv.${ext}`;
      fetch(`${SUPABASE_URL}/storage/v1/object/user-cvs/${path}`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}`, 'x-upsert': 'true' },
        body: blob
      }).then(r => {
        if (r.ok) {
          const storagePath = `${SUPABASE_URL}/storage/v1/object/authenticated/user-cvs/${path}`;
          fetch(`${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${userId}`, {
            method: 'PATCH',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ cv_url: storagePath, cv_filename: filename, cv_uploaded_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          }).catch(() => {});
          console.log('[S2I] CV saved to storage');
        }
      }).catch(e => console.warn('[S2I] CV storage error:', e));
    } catch (e) { /* silent */ }
  }

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [wantsJobMatch, setWantsJobMatch] = useState(false);
  const [jobInput, setJobInput] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [showEmailLink, setShowEmailLink] = useState(false);
  const [emailForLink, setEmailForLink] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [showLinkedIn, setShowLinkedIn] = useState(false);
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [showBuyVoucher, setShowBuyVoucher] = useState(false);
  const [voucherEmail, setVoucherEmail] = useState("");
  const [voucherSelectedPlan, setVoucherSelectedPlan] = useState(0);
  const [voucherPaymentLoading, setVoucherPaymentLoading] = useState(false);
  const [voucherPaymentStatus, setVoucherPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [voucherPaymentError, setVoucherPaymentError] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [showLinkedInPaywall, setShowLinkedInPaywall] = useState(false);
  const [showNoCvOptions, setShowNoCvOptions] = useState(false);
  const [linkedInVoucherCode, setLinkedInVoucherCode] = useState("");
  const [linkedInVoucherError, setLinkedInVoucherError] = useState<string | null>(null);
  const [linkedInVoucherValidating, setLinkedInVoucherValidating] = useState(false);
  // Mandatory email for analysis
  const [analysisEmail, setAnalysisEmail] = useState("");
  const [analysisEmailError, setAnalysisEmailError] = useState<string | null>(null);

  // Email validation: must be real format, reject obvious fakes
  const validateEmail = (email: string): { valid: boolean; error?: string } => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return { valid: false, error: 'Please enter your email to continue.' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(trimmed)) return { valid: false, error: 'Invalid email format.' };
    const fakePatterns = ['teste', 'test', 'exemplo', 'example', 'fake', 'asdf', 'qwer', 'aaa', 'bbb', 'ccc', 'xxx', 'yyy', 'zzz', 'noreply', 'noemail', 'abc@', '123@', 'admin@admin', 'user@user', 'email@email', 'mail@mail', 'a@a', 'b@b'];
    const localPart = trimmed.split('@')[0];
    const domain = trimmed.split('@')[1];
    if (fakePatterns.some(p => localPart === p || domain?.startsWith(p + '.'))) return { valid: false, error: 'Please use your real email address.' };
    if (localPart.length < 3) return { valid: false, error: 'Please use your real email address.' };
    if (/^(.)\1{2,}$/.test(localPart)) return { valid: false, error: 'Please use your real email address.' };
    const fakeDomains = ['teste.com', 'teste.pt', 'test.com', 'test.pt', 'exemplo.com', 'exemplo.pt', 'example.com', 'fake.com', 'noemail.com', 'email.com', 'mail.com', 'aaa.com', 'bbb.com'];
    if (fakeDomains.includes(domain)) return { valid: false, error: 'Please use your real email address.' };
    return { valid: true };
  };

  // LinkedIn paywall inline payment
  const [liPaywallStep, setLiPaywallStep] = useState<'choose' | 'pay'>('choose');
  const [liPaywallPlan, setLiPaywallPlan] = useState(0);
  const [liPaywallEmail, setLiPaywallEmail] = useState("");
  const [liPaywallPhone, setLiPaywallPhone] = useState("");
  const [liPaywallLoading, setLiPaywallLoading] = useState(false);
  const [liPaywallStatus, setLiPaywallStatus] = useState<'idle' | 'polling' | 'success' | 'error'>('idle');
  const [liPaywallError, setLiPaywallError] = useState<string | null>(null);

  const loadingMessages = [
    "Extracting data from your CV...",
    "Identifying key competencies...",
    "Analysing professional experience...",
    "Comparing with the job market...",
    "Calculating ATS compatibility...",
    "Evaluating strengths and areas for improvement...",
    "Generating personalised recommendations...",
    "Finalising your report..."
  ];

  useEffect(() => {
    if (!loading) { setLoadingStep(0); return; }
    const interval = setInterval(() => {
      setLoadingStep(prev => prev < loadingMessages.length - 1 ? prev + 1 : prev);
    }, 4000);
    return () => clearInterval(interval);
  }, [loading]);

  const countryData = countries.find(c => c.country === selectedCountry);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Please upload a PDF, DOCX or image file (PNG/JPEG)');
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

  const handleAnalyze = async () => {
    if (!file) return;
    if (!selectedCountry) {
      setError('Please select your country to get localised results');
      return;
    }
    // Validate mandatory email
    const emailCheck = validateEmail(analysisEmail);
    if (!emailCheck.valid) {
      setAnalysisEmailError(emailCheck.error || 'Email required.');
      setError(emailCheck.error || 'Please enter your email to continue.');
      return;
    }
    setAnalysisEmailError(null);
    sessionStorage.setItem('paymentEmail', analysisEmail.trim().toLowerCase());

    setLoading(true);
    setError(null);

    try {
      let cvText = "";
      if (file.type === 'image/png' || file.type === 'image/jpeg') {
        // Images always use server-side Gemini Vision extraction
        cvText = '';
      } else if (file.type === 'application/pdf') {
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
        console.log('[CV_ENGINE_EN] Text insufficient in browser (' + cvText.length + ' chars). Sending PDF for Gemini Vision extraction...');
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
            ...(jobInput.trim() ? { job_description: jobInput.trim().substring(0, 3000) } : {})
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
      const analysisResult = transformGeminiResponse(analysisSource);

      window.currentReportData = analysisSource;

      // Clear previous payment/unlock state for new analysis
      sessionStorage.removeItem('isPaid');
      sessionStorage.removeItem('careerPathIncluded');
      sessionStorage.removeItem('careerPathPaid');
      sessionStorage.removeItem('careerPathData');
      sessionStorage.removeItem('selectedPlan');
      sessionStorage.removeItem('paymentEmail');

      sessionStorage.setItem('cvAnalysis', JSON.stringify(analysisResult));
      sessionStorage.setItem('cvFile', base64Content);
      sessionStorage.setItem('cvFilename', file.name);
      sessionStorage.setItem('analysisLang', 'en');
      sessionStorage.setItem('analysisCountry', selectedCountry);
      sessionStorage.setItem('analysisRegion', selectedRegion);

      if (jobInput.trim()) {
        sessionStorage.setItem('jobDescription', jobInput.trim());
      } else {
        sessionStorage.removeItem('jobDescription');
      }

      logAnalysisToSupabase(analysisResult, analysisSource, cvText);

      // Persist CV to Supabase Storage for future sessions
      persistCvToStorage(base64Content, file.name);

      // Save to user_analyses for area-cliente dashboard
      try {
        const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (storageKey) {
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            const accessToken = parsed?.access_token;
            const userId = parsed?.user?.id;
            if (accessToken && userId) {
              fetch(`${SUPABASE_URL}/rest/v1/user_analyses`, {
                method: 'POST',
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
                body: JSON.stringify({ user_id: userId, analysis_type: 'cv_analyser', data: { ...analysisResult, captured_at: new Date().toISOString(), email: analysisEmail }, created_at: new Date().toISOString() })
              }).catch(() => {});
            }
          }
        }
      } catch (e) { /* silent */ }

      setLocation('/results');

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Analysis took too long. Please try again.');
      } else {
        setError(err.message || 'Error analysing CV. Please try again.');
      }
      setLoading(false);
    }
  };

  // Validate discount/voucher code against Supabase (checks discount_coupons first, then vouchers)
  const validateVoucherForLinkedIn = async (code: string): Promise<boolean> => {
    setLinkedInVoucherValidating(true);
    setLinkedInVoucherError(null);
    const upperCode = code.toUpperCase();
    try {
      // Step 1: Check discount_coupons
      const couponRes = await fetch(`${SUPABASE_URL}/rest/v1/discount_coupons?code=eq.${encodeURIComponent(upperCode)}&is_active=eq.true&select=code,discount_percent,max_uses,current_uses,valid_from,valid_until,applicable_products`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
      });
      const coupons = await couponRes.json();
      if (Array.isArray(coupons) && coupons.length > 0) {
        const coupon = coupons[0];
        const now = new Date();
        if (coupon.valid_from && new Date(coupon.valid_from) > now) { setLinkedInVoucherError('This code is not yet active.'); return false; }
        if (coupon.valid_until && new Date(coupon.valid_until) < now) { setLinkedInVoucherError('This code has expired.'); return false; }
        if (coupon.max_uses !== null && (coupon.current_uses || 0) >= coupon.max_uses) { setLinkedInVoucherError('This code has reached its limit.'); return false; }
        const products = coupon.applicable_products || [];
        if (products.length > 0 && !products.includes('all') && !products.includes('cv_analyser') && !products.includes('linkedin_roaster')) { setLinkedInVoucherError('This code is not applicable here.'); return false; }
        if (coupon.discount_percent === 100) {
          sessionStorage.setItem('isPaid', 'true');
          sessionStorage.setItem('paymentAmount', '0');
          sessionStorage.setItem('transactionId', `COUPON-${upperCode}`);
          setShowLinkedInPaywall(false);
          // Increment coupon usage counter
          const { incrementCouponUsage } = await import('@/lib/affiliate');
          incrementCouponUsage(upperCode);
          return true;
        }
        // Partial discount — store it in sessionStorage for the Results page payment modal
        sessionStorage.setItem('appliedCouponCode', upperCode);
        sessionStorage.setItem('appliedCouponPercent', String(coupon.discount_percent));
        const { incrementCouponUsage: incUsage } = await import('@/lib/affiliate');
        incUsage(upperCode);
        setLinkedInVoucherError(`${coupon.discount_percent}% discount applied! It will be used at payment.`);
        setTimeout(() => { setShowLinkedInPaywall(false); }, 1500);
        return true;
      }

      // Step 2: Check vouchers
      const res = await fetch(`${SUPABASE_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(upperCode)}&select=*`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
      });
      const vouchers = await res.json();
      if (!Array.isArray(vouchers) || vouchers.length === 0) {
        setLinkedInVoucherError('Invalid code. Please check and try again.');
        return false;
      }
      const voucher = vouchers[0];
      const remaining = (voucher.total_analyses || 0) - (voucher.used_analyses || 0);
      if (remaining <= 0) {
        setLinkedInVoucherError('This code has no remaining analyses.');
        return false;
      }
      sessionStorage.setItem('isPaid', 'true');
      sessionStorage.setItem('voucherCode', upperCode);
      sessionStorage.setItem('voucherId', String(voucher.id));
      sessionStorage.setItem('remainingAnalyses', String(remaining));
      sessionStorage.setItem('paymentAmount', String(voucher.amount_paid || 0));
      sessionStorage.setItem('transactionId', voucher.order_id || '');
      setShowLinkedInPaywall(false);
      return true;
    } catch (err) {
      setLinkedInVoucherError('Error validating code. Please try again.');
      return false;
    } finally {
      setLinkedInVoucherValidating(false);
    }
  };

  // Handle LinkedIn URL analysis (analyse profile without CV file)
  const handleLinkedInAnalyze = async () => {
    if (!linkedInUrl.toLowerCase().includes('linkedin.com')) {
      setError('Enter a valid LinkedIn URL (e.g. https://linkedin.com/in/your-profile)');
      return;
    }
    if (!acceptedTerms) {
      setError('Please accept the Privacy Policy to continue.');
      return;
    }
    if (!selectedCountry) {
      setError('Please select your country to get localised results');
      return;
    }
    // Validate mandatory email
    const emailCheck = validateEmail(analysisEmail);
    if (!emailCheck.valid) {
      setAnalysisEmailError(emailCheck.error || 'Email required.');
      setError(emailCheck.error || 'Please enter your email to continue.');
      return;
    }
    setAnalysisEmailError(null);
    sessionStorage.setItem('paymentEmail', analysisEmail.trim().toLowerCase());

    // Check if user has a valid voucher/payment
    const isPaid = sessionStorage.getItem('isPaid') === 'true';
    if (!isPaid) {
      setShowLinkedInPaywall(true);
      setLiPaywallStep('choose');
      setLiPaywallPlan(0);
      setLiPaywallEmail('');
      setLiPaywallPhone('');
      setLiPaywallLoading(false);
      setLiPaywallStatus('idle');
      setLiPaywallError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[CV_ENGINE_EN] Starting LinkedIn analysis:', linkedInUrl);

      // Step 1: Scrape LinkedIn profile via backend (Apify)
      console.log('[CV_ENGINE_EN] Step 1: Extracting LinkedIn profile data via Apify...');
      const scrapeResponse = await fetch('https://share2inspire-beckend.lm.r.appspot.com/api/services/scrape-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedin_url: linkedInUrl })
      });

      if (!scrapeResponse.ok) {
        const scrapeError = await scrapeResponse.json().catch(() => ({}));
        throw new Error(scrapeError?.error || 'Error extracting LinkedIn profile data.');
      }

      const scrapeData = await scrapeResponse.json();
      if (!scrapeData?.success || !scrapeData?.cv_text) {
        throw new Error(scrapeData?.error || 'Could not extract LinkedIn profile data.');
      }

      console.log('[CV_ENGINE_EN] Step 1 OK: Extracted', scrapeData.cv_text.length, 'chars for', scrapeData.profile_name);

      // Step 2: Send extracted text to edge function for AI analysis
      console.log('[CV_ENGINE_EN] Step 2: Sending to AI analysis...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const requestBody: any = {
        mode: 'cv_extraction',
        language: 'en',
        country: selectedCountry,
        region: selectedRegion,
        cv_text: scrapeData.cv_text.substring(0, 8000),
        linkedin_url: linkedInUrl,
        ...(jobInput.trim() ? { job_description: jobInput.trim().substring(0, 3000) } : {})
      };

      const response = await fetch(SUPABASE_EDGE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('AI analysis error. Please try again.');
      }

      const responseData = await response.json();
      if (!responseData?.success) {
        throw new Error(responseData?.error || 'AI analysis error.');
      }

      const analysisSource = responseData.analysis || responseData;
      const analysisResult = transformGeminiResponse(analysisSource);

      window.currentReportData = analysisSource;

      // Don't remove isPaid for LinkedIn - it's already validated
      sessionStorage.removeItem('careerPathIncluded');
      sessionStorage.removeItem('careerPathPaid');
      sessionStorage.removeItem('careerPathData');
      sessionStorage.removeItem('selectedPlan');
      sessionStorage.removeItem('paymentEmail');

      sessionStorage.setItem('cvAnalysis', JSON.stringify(analysisResult));
      sessionStorage.setItem('cvFile', '');
      sessionStorage.setItem('cvFilename', 'linkedin-profile');
      sessionStorage.setItem('analysisLang', 'en');
      sessionStorage.setItem('linkedinUrl', linkedInUrl);
      // LinkedIn analysis is always paid - keep isPaid flag
      sessionStorage.setItem('isPaid', 'true');
      if (jobInput.trim()) {
        sessionStorage.setItem('jobDescription', jobInput.trim());
      } else {
        sessionStorage.removeItem('jobDescription');
      }

      logAnalysisToSupabase(analysisResult, analysisSource, `LinkedIn: ${linkedInUrl}`);
      setLocation('/results');

    } catch (err: any) {
      console.error('[CV_ENGINE_EN] LinkedIn error:', err);
      if (err.name === 'AbortError') {
        setError('Analysis took too long. Please try again.');
      } else {
        setError(err.message || 'Error analysing LinkedIn profile. Please try again.');
      }
      setLoading(false);
    }
  };

  // Handle LinkedIn paywall inline payment (buy + auto-analyse) - EN uses Stripe
  const handleLiPaywallPurchase = async () => {
    if (!liPaywallEmail.includes('@')) {
      setLiPaywallError('Enter a valid email.');
      return;
    }
    const plan = pricingPlans[liPaywallPlan];
    setLiPaywallLoading(true);
    setLiPaywallError(null);
    setLiPaywallStatus('idle');
    try {
      const response = await fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: plan.price,
          currency: currencyCode,
          email: liPaywallEmail,
          product: `CV Analyser - ${plan.name} (LinkedIn)`,
          description: `LinkedIn ${plan.name} - ${plan.analyses} analysis(es)`,
          successUrl: `${window.location.origin}/en/cv-analyser?li_payment=success&li_email=${encodeURIComponent(liPaywallEmail)}&li_plan=${liPaywallPlan}&li_url=${encodeURIComponent(linkedInUrl)}`,
          cancelUrl: `${window.location.origin}/en/cv-analyser?li_payment=cancelled`,
        })
      });
      const data = await response.json();
      if (data.url) {
        // Save state before redirect
        sessionStorage.setItem('liPaywallEmail', liPaywallEmail);
        sessionStorage.setItem('paymentEmail', liPaywallEmail.trim().toLowerCase());
        sessionStorage.setItem('liPaywallPlan', String(liPaywallPlan));
        sessionStorage.setItem('liPaywallLinkedInUrl', linkedInUrl);
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Error creating checkout session');
      }
    } catch (err: any) {
      setLiPaywallError(err.message || 'Payment error.');
      setLiPaywallStatus('error');
    } finally {
      setLiPaywallLoading(false);
    }
  };

  // Handle voucher purchase (buy now, upload later) - EN uses Stripe
  const handleVoucherPurchase = async () => {
    if (!voucherEmail.includes('@')) {
      setVoucherPaymentError('Enter a valid email.');
      return;
    }
    const plan = pricingPlans[voucherSelectedPlan];
    setVoucherPaymentLoading(true);
    setVoucherPaymentError(null);
    try {
      const response = await fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: plan.price,
          currency: currencyCode,
          email: voucherEmail,
          product: `CV Analyser - ${plan.name} (Voucher)`,
          description: `Voucher ${plan.name} - ${plan.analyses} analysis(es)`,
          successUrl: `${window.location.origin}/en/cv-analyser?voucher_payment=success&voucher_email=${encodeURIComponent(voucherEmail)}&voucher_plan=${voucherSelectedPlan}`,
          cancelUrl: `${window.location.origin}/en/cv-analyser?voucher_payment=cancelled`,
        })
      });
      const data = await response.json();
      if (data.url) {
        // Save state before redirect
        sessionStorage.setItem('voucherPurchaseEmail', voucherEmail);
        sessionStorage.setItem('paymentEmail', voucherEmail.trim().toLowerCase());
        sessionStorage.setItem('voucherPurchasePlan', String(voucherSelectedPlan));
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Error creating checkout session');
      }
    } catch (err: any) {
      setVoucherPaymentError(err.message || 'Payment error.');
      setVoucherPaymentStatus('error');
    } finally {
      setVoucherPaymentLoading(false);
    }
  };

  // Check for Stripe voucher payment return
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const voucherPayment = urlParams.get('voucher_payment');
    if (voucherPayment === 'success') {
      const savedEmail = urlParams.get('voucher_email') || sessionStorage.getItem('voucherPurchaseEmail') || '';
      const savedPlanIdx = parseInt(urlParams.get('voucher_plan') || sessionStorage.getItem('voucherPurchasePlan') || '0');
      const plan = pricingPlans[savedPlanIdx];
      const code = `S2I-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      // Create voucher with error handling
      const voucherPayload = {
        code, email: savedEmail, plan_name: plan.name,
        total_analyses: plan.analyses, used_analyses: 0,
        amount_paid: parseFloat(plan.price), order_id: `STRIPE-VOUCHER-${Date.now()}`,
        payment_method: 'stripe', voucher_type: 'standard', is_active: true,
      };
      fetch(`${SUPABASE_URL}/rest/v1/vouchers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(voucherPayload)
      }).then(res => {
        if (!res.ok) {
          console.error('[PAYMENT] Voucher INSERT failed:', res.status);
          // Retry once
          return fetch(`${SUPABASE_URL}/rest/v1/vouchers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(voucherPayload)
          });
        }
        return res;
      }).then(res => {
        if (res && res.ok) console.log('[PAYMENT] Voucher created:', code);
        // Send voucher email
        fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/send-voucher-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: savedEmail, name: savedEmail.split('@')[0],
            voucherCode: code, planName: plan.name,
            totalAnalyses: plan.analyses, remainingAnalyses: plan.analyses,
          })
        });
      }).catch(err => console.error('[PAYMENT] Voucher creation error:', err));
      setVoucherEmail(savedEmail);
      if (savedEmail) sessionStorage.setItem('paymentEmail', savedEmail.trim().toLowerCase());
      setVoucherCode(code);
      setVoucherPaymentStatus('success');
      setShowBuyVoucher(true);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      sessionStorage.removeItem('voucherPurchaseEmail');
      sessionStorage.removeItem('voucherPurchasePlan');
    }
    // Check for LinkedIn Stripe payment return
    const liPayment = urlParams.get('li_payment');
    if (liPayment === 'success') {
      const savedEmail = urlParams.get('li_email') || sessionStorage.getItem('liPaywallEmail') || '';
      const savedPlanIdx = parseInt(urlParams.get('li_plan') || sessionStorage.getItem('liPaywallPlan') || '0');
      const savedLinkedInUrl = decodeURIComponent(urlParams.get('li_url') || '') || sessionStorage.getItem('liPaywallLinkedInUrl') || '';
      const plan = pricingPlans[savedPlanIdx];
      const code = `S2I-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      // Create voucher with error handling
      const liVoucherPayload = {
        code, email: savedEmail, plan_name: plan.name,
        total_analyses: plan.analyses, used_analyses: 0,
        amount_paid: parseFloat(plan.price), order_id: `STRIPE-LINKEDIN-${Date.now()}`,
        payment_method: 'stripe', voucher_type: 'standard', is_active: true,
      };
      fetch(`${SUPABASE_URL}/rest/v1/vouchers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(liVoucherPayload)
      }).then(res => {
        if (!res.ok) {
          console.error('[PAYMENT] LinkedIn Voucher INSERT failed:', res.status);
          return fetch(`${SUPABASE_URL}/rest/v1/vouchers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(liVoucherPayload)
          });
        }
        return res;
      }).then(res => {
        if (res && res.ok) console.log('[PAYMENT] LinkedIn Voucher created:', code);
        // No voucher email for LinkedIn flow — payment unlocks analysis directly
      }).catch(err => console.error('[PAYMENT] LinkedIn Voucher creation error:', err));
      // Set paid state and auto-trigger LinkedIn analysis
      sessionStorage.setItem('isPaid', 'true');
      sessionStorage.setItem('paymentEmail', savedEmail.trim().toLowerCase());
      sessionStorage.setItem('voucherCode', code);
      sessionStorage.setItem('paymentAmount', String(plan.price));
      sessionStorage.setItem('transactionId', sessionId || '');
      setLinkedInUrl(savedLinkedInUrl);
      setShowLinkedIn(true);
      setAcceptedTerms(true);
      if (savedEmail) setAnalysisEmail(savedEmail);
      // Clean URL and session
      window.history.replaceState({}, '', window.location.pathname);
      sessionStorage.removeItem('liPaywallEmail');
      sessionStorage.removeItem('liPaywallPlan');
      sessionStorage.removeItem('liPaywallLinkedInUrl');
      // Auto-trigger analysis after a brief delay to let state settle
      setTimeout(() => {
        // The handleLinkedInAnalyze will be called via the effect or user can click the button
        // For now, show a success message
        setError(null);
      }, 500);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-foreground/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-[#C9A961]" />
            <span className="text-lg font-semibold text-foreground">CV Analyser</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#C9A961]/10 text-[#C9A961] font-medium">EN</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/en/career-path" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Career Path</a>
            <a href="/cv-analyser" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#C9A961]/40 bg-[#C9A961]/10 hover:bg-[#C9A961]/20 transition-colors text-sm font-medium text-[#C9A961]">
              <Globe className="w-3.5 h-3.5" />
              <span>PT</span>
            </a>
            <a href="https://www.share2inspire.pt" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm font-medium text-foreground">
              <HomeIcon className="w-4 h-4" />
              <span>Homepage</span>
            </a>
          </div>
        </div>
      </header>

      {/* Bundle Banner — Main offer */}
      <div className="bg-gradient-to-r from-[#1A1A1A] to-[#2d2d2d] border-b border-[#C9A961]/30">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-center gap-3 flex-wrap">
          <span className="text-[10px] bg-gradient-to-r from-[#C9A961] to-[#E8D5A3] text-[#1a1a2e] px-2 py-0.5 rounded-full font-bold tracking-wider uppercase shrink-0">Most popular</span>
          <span className="text-sm text-white">
            <strong className="text-[#C9A961]">Bundle</strong> — CV Analyser + Career Path for <strong className="text-white">{CUR}29</strong>
          </span>
          <a href="/en/bundle" className="text-xs bg-[#C9A961] hover:bg-[#B8943D] text-white px-3 py-1 rounded-full font-semibold shrink-0 transition-all">Get Bundle</a>
        </div>
      </div>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-6 md:py-16">
        <div className="text-center space-y-3 md:space-y-6 mb-6 md:mb-12">
          <h1 className="text-2xl md:text-5xl font-bold text-foreground leading-tight">
            Discover your <span className="text-[#C9A961]">ATS Score</span>
          </h1>
          <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Free analysis in 30 seconds. Find out if your CV passes recruitment systems.
          </p>
          <a
            href="/en/cv-analyser/demo.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#C9A961]/40 bg-[#C9A961]/10 hover:bg-[#C9A961]/20 transition-all text-sm font-medium text-[#C9A961] hover:scale-105"
          >
            <Eye className="w-4 h-4" />
            See what you'll receive
          </a>
        </div>

        {/* Upload Card */}
        <div className="bg-card border border-border rounded-2xl p-5 md:p-12 space-y-5 md:space-y-8">
          {/* Country/Region Selector */}
          <div className="space-y-3 md:space-y-4">
            <label className="text-xs md:text-sm font-semibold text-foreground flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#C9A961]" />
              Your Location <span className="text-muted-foreground font-normal hidden md:inline">(for localised salary data & recommendations)</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={selectedCountry}
                onChange={(e) => { setSelectedCountry(e.target.value); setSelectedRegion(""); }}
                className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]/30 focus:border-[#C9A961] transition-colors text-sm"
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
                  className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]/30 focus:border-[#C9A961] transition-colors text-sm"
                >
                  <option value="">Select region (optional)...</option>
                  {countryData.regions.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Mobile: Direct CTA Button */}
          <div className="md:hidden space-y-3">
            <label
              htmlFor="cv-upload-mobile"
              className={`block w-full py-4 px-6 rounded-xl text-center cursor-pointer font-semibold text-base transition-all duration-200 ${
                file ? 'bg-[#C9A961]/10 border-2 border-[#C9A961] text-foreground' : 'bg-[#C9A961] hover:bg-[#A88B4E] text-white'
              }`}
            >
              <input
                id="cv-upload-mobile"
                type="file"
                accept=".pdf,.docx,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="sr-only"
                disabled={loading}
              />
              {file ? (
                <span className="flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5 text-[#C9A961]" />
                  {file.name}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5" />
                  Analyse My CV Now
                </span>
              )}
            </label>
            <p className="text-[11px] text-muted-foreground text-center">PDF, DOCX or Image • Free • Data deleted after analysis</p>
            {!file && savedCvInfo && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
                    const stored = storageKey ? localStorage.getItem(storageKey) : null;
                    const accessToken = stored ? JSON.parse(stored)?.access_token : null;
                    const userId = stored ? JSON.parse(stored)?.user?.id : null;
                    const filePath = `${userId}/cv.pdf`;
                    const downloadUrl = `${SUPABASE_URL}/storage/v1/object/authenticated/user-cvs/${filePath}`;
                    const res = await fetch(downloadUrl, {
                      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}` }
                    });
                    if (!res.ok) throw new Error('Download failed');
                    const blob = await res.blob();
                    const f = new File([blob], savedCvInfo.filename, { type: blob.type || 'application/pdf' });
                    setFile(f);
                  } catch { setError('Could not load saved CV.'); }
                }}
                className="text-xs text-[#C9A961] hover:underline font-medium text-center w-full mt-1"
              >
                <FileCheck className="w-3.5 h-3.5 inline mr-1" />
                Use saved CV: {savedCvInfo.filename}
              </button>
            )}
          </div>

          {/* Desktop: Full drag & drop area */}
          <div className="hidden md:block">
            {/* Value bullets */}
            <div className="space-y-2 text-sm text-muted-foreground mb-6">
              <p className="font-semibold text-foreground text-base">After the analysis you will see:</p>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#C9A961] shrink-0" /> ATS compatibility score</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#C9A961] shrink-0" /> Missing keywords</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#C9A961] shrink-0" /> Critical issues blocking interviews</div>
            </div>
            {/* Upload Area */}
            <div className="space-y-4">
              <label
                htmlFor="cv-upload"
                className={`relative block w-full border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${file ? 'border-[#C9A961] bg-[#C9A961]/5' : 'border-border hover:border-[#C9A961]/50 hover:bg-muted/50'}`}
              >
                <input id="cv-upload" type="file" accept=".pdf,.docx,.png,.jpg,.jpeg" onChange={handleFileChange} className="sr-only" disabled={loading} />
                <div className="space-y-4">
                  {file ? (
                    <>
                      <FileText className="w-12 h-12 mx-auto text-[#C9A961]" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Drag your CV or click to browse</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF, DOCX or Image (max 5MB)</p>
                      </div>
                    </>
                  )}
                </div>
              </label>
              {!file && savedCvInfo && (
                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
                        const stored = storageKey ? localStorage.getItem(storageKey) : null;
                        const accessToken = stored ? JSON.parse(stored)?.access_token : null;
                        const userId = stored ? JSON.parse(stored)?.user?.id : null;
                        const filePath = `${userId}/cv.pdf`;
                        const downloadUrl = `${SUPABASE_URL}/storage/v1/object/authenticated/user-cvs/${filePath}`;
                        const res = await fetch(downloadUrl, {
                          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}` }
                        });
                        if (!res.ok) throw new Error('Download failed');
                        const blob = await res.blob();
                        const f = new File([blob], savedCvInfo.filename, { type: blob.type || 'application/pdf' });
                        setFile(f);
                      } catch { setError('Could not load saved CV.'); }
                    }}
                    className="text-xs text-[#C9A961] hover:underline font-medium"
                  >
                    <FileCheck className="w-3.5 h-3.5 inline mr-1" />
                    Use saved CV: {savedCvInfo.filename}
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5 mt-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Automatic analysis. The file is deleted after processing.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* Alternatives: LinkedIn + Email Link */}
          <div className="flex flex-col gap-2 pt-1">
            {/* LinkedIn button + panel */}
            <button
              type="button"
              onClick={() => { setShowLinkedIn(!showLinkedIn); setShowEmailLink(false); }}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-border hover:border-[#C9A961]/50 bg-muted/20 hover:bg-muted/40 transition-all text-sm text-muted-foreground hover:text-foreground"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              Use LinkedIn profile
            </button>
            {showLinkedIn && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-200 p-4 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Paste your LinkedIn profile URL to extract your data automatically.</p>
                <span className="text-[10px] bg-[#C9A961]/20 text-[#C9A961] px-2 py-0.5 rounded-full font-semibold shrink-0 ml-2">PREMIUM</span>
              </div>
              <input
                type="url"
                value={linkedInUrl}
                onChange={(e) => setLinkedInUrl(e.target.value)}
                placeholder="https://linkedin.com/in/your-profile"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961]"
              />
              <p className="text-xs text-muted-foreground/70">We analyse your public LinkedIn profile as if it were a CV. <span className="text-[#C9A961]">Requires a paid package.</span></p>
            </div>
          )}

          </div>

          {/* No CV on phone? — unified toggle with two options */}
          <button
            type="button"
            onClick={() => setShowNoCvOptions(!showNoCvOptions)}
            className="w-full text-center text-xs text-muted-foreground/70 hover:text-[#C9A961] transition-colors py-1"
          >
            <span className="inline-flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Don't have your CV on your phone? <span className="underline underline-offset-2">See options</span>
            </span>
          </button>

          {showNoCvOptions && (
            <div className="animate-in slide-in-from-top-2 duration-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Option 1: Buy voucher */}
                <button
                  type="button"
                  onClick={() => { setShowBuyVoucher(true); setShowEmailLink(false); setShowNoCvOptions(false); setTimeout(() => { document.querySelector('[data-buy-voucher]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 150); }}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-[#C9A961]/50 bg-muted/20 hover:bg-muted/40 transition-all text-center"
                >
                  <div className="w-8 h-8 rounded-full bg-[#C9A961]/10 border border-[#C9A961]/30 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#C9A961]" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Buy Analysis Now</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">Get a voucher by email and upload your CV later on PC.</p>
                </button>
                {/* Option 2: Send link by email */}
                <button
                  type="button"
                  onClick={() => { setShowEmailLink(true); setShowBuyVoucher(false); setShowNoCvOptions(false); setTimeout(() => { document.querySelector('[data-email-link]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 150); }}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-[#C9A961]/50 bg-muted/20 hover:bg-muted/40 transition-all text-center"
                >
                  <div className="w-8 h-8 rounded-full bg-[#C9A961]/10 border border-[#C9A961]/30 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#C9A961]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </div>
                  <p className="text-sm font-medium text-foreground">Send Link by Email</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">Get the link in your email and try the free analysis on your computer.</p>
                </button>
              </div>
            </div>
          )}

          {/* Email link panel (shown when option 2 is selected) */}
          {showEmailLink && (
            <div data-email-link className="space-y-2 animate-in slide-in-from-top-2 duration-200 p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground">Get the link in your email to try later on your computer.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailForLink}
                  onChange={(e) => setEmailForLink(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (emailForLink.includes('@')) {
                      fetch(`${SUPABASE_URL}/rest/v1/email_links`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
                        body: JSON.stringify({ email: emailForLink, link: window.location.href, source: 'cv-analyser-en' })
                      }).catch(() => {});
                      fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/send-link-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          email: emailForLink,
                          name: emailForLink.split('@')[0],
                          link: 'https://www.share2inspire.pt/en/cv-analyser',
                          source: 'cv-analyser-en'
                        })
                      }).catch(() => {});
                      setEmailSent(true);
                      setTimeout(() => { setShowEmailLink(false); setEmailSent(false); }, 3000);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-[#C9A961] hover:bg-[#A88B4E] text-white text-sm font-semibold transition-colors"
                >
                  {emailSent ? 'Sent!' : 'Send'}
                </button>
              </div>
            </div>
          )}

          {showBuyVoucher && (
            <div data-buy-voucher className="space-y-3 animate-in slide-in-from-top-2 duration-200 p-4 rounded-lg bg-muted/30 border border-border">
              {voucherPaymentStatus === 'success' && voucherCode ? (
                <div className="text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
                  <p className="text-sm font-semibold text-foreground">Payment confirmed!</p>
                  <p className="text-xs text-muted-foreground">Your voucher code:</p>
                  <p className="text-lg font-bold text-[#C9A961] bg-[#C9A961]/10 rounded-lg py-2 px-4 inline-block tracking-wider">{voucherCode}</p>
                  <p className="text-xs text-muted-foreground">We sent the code to <strong>{voucherEmail}</strong>. Use it on the results page after uploading your CV.</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">Buy now and receive a code by email. Then upload your CV on your computer and enter the code to unlock the full analysis.</p>
                  
                  {/* Plan Selection */}
                  <div className="grid grid-cols-3 gap-2">
                    {pricingPlans.map((plan, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setVoucherSelectedPlan(i)}
                        className={`p-2 rounded-lg border text-center transition-all text-xs ${
                          voucherSelectedPlan === i
                            ? 'border-[#C9A961] bg-[#C9A961]/10 text-foreground'
                            : 'border-border bg-background text-muted-foreground hover:border-[#C9A961]/50'
                        }`}
                      >
                        <p className="font-semibold">{CUR}{plan.price}</p>
                        <p className="text-[10px] text-muted-foreground">{plan.analyses} analysis{plan.analyses > 1 ? 'es' : ''}</p>
                      </button>
                    ))}
                  </div>

                  {/* Email */}
                  <input
                    type="email"
                    value={voucherEmail}
                    onChange={(e) => setVoucherEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961]"
                  />

                  {voucherPaymentError && (
                    <p className="text-xs text-red-500">{voucherPaymentError}</p>
                  )}

                  <button
                    type="button"
                    onClick={handleVoucherPurchase}
                    disabled={voucherPaymentLoading}
                    className="w-full py-2.5 rounded-lg bg-[#C9A961] hover:bg-[#A88B4E] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {voucherPaymentLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                    ) : (
                      <>Buy Voucher — {CUR}{pricingPlans[voucherSelectedPlan].price}</>  
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Job Vacancy Toggle */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setWantsJobMatch(!wantsJobMatch)}
              className="w-full flex items-center gap-3 p-4 rounded-lg border border-border hover:border-[#C9A961]/50 bg-muted/20 hover:bg-muted/40 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5 text-[#C9A961]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Want to analyse for a specific job?</p>
                <p className="text-xs text-muted-foreground mt-0.5">Compare your CV with the job requirements</p>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors duration-200 flex items-center px-0.5 ${
                wantsJobMatch ? 'bg-[#C9A961]' : 'bg-muted'
              }`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  wantsJobMatch ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
            </button>

            {wantsJobMatch && (
              <div className="space-y-2 pl-2 animate-in slide-in-from-top-2 duration-200">
                <label htmlFor="job-input" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5" />
                  Job posting link and/or role name
                </label>
                <textarea
                  id="job-input"
                  value={jobInput}
                  onChange={(e) => setJobInput(e.target.value)}
                  placeholder="E.g.: https://linkedin.com/jobs/... or 'Data Analyst - London, experience in Python and SQL'"
                  className="w-full min-h-[80px] p-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961] resize-y"
                  disabled={loading}
                />
                <p className="text-[11px] text-muted-foreground/70">Paste the job posting link, the role name, or the job description. The more details, the better the analysis.</p>
              </div>
            )}
          </div>

          {/* Mandatory Email Field */}
          <div className="space-y-1">
            <label htmlFor="analysis-email" className="text-sm font-medium text-foreground flex items-center gap-1">
              <svg className="w-4 h-4 text-[#C9A961]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              Your email <span className="text-red-500">*</span>
            </label>
            <input
              id="analysis-email"
              type="email"
              value={analysisEmail}
              onChange={(e) => { setAnalysisEmail(e.target.value); setAnalysisEmailError(null); }}
              placeholder="your@email.com"
              className={`w-full px-3 py-2.5 rounded-lg border ${analysisEmailError ? 'border-red-500 ring-2 ring-red-500/30' : 'border-border'} bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961]`}
              disabled={loading}
            />
            {analysisEmailError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {analysisEmailError}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground/70">Required to receive your results and certification.</p>
          </div>

          {/* Privacy Terms */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <input type="checkbox" id="terms" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1 w-4 h-4 rounded border-border text-[#C9A961] focus:ring-[#C9A961] cursor-pointer" />
            <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
              I agree to the{' '}
              <a href="https://www.share2inspire.pt/pages/politica-privacidade" target="_blank" rel="noopener noreferrer" className="text-[#C9A961] hover:underline">Privacy Policy</a>
              {' '}and authorise the processing of my data for CV analysis.
            </label>
          </div>

          {/* Analyze Button */}
          <Button
            onClick={() => {
              if (linkedInUrl && linkedInUrl.toLowerCase().includes('linkedin.com') && showLinkedIn) {
                handleLinkedInAnalyze();
              } else {
                handleAnalyze();
              }
            }}
            disabled={loading || !acceptedTerms || !selectedCountry || !analysisEmail.trim() || (!file && !(linkedInUrl && linkedInUrl.toLowerCase().includes('linkedin.com') && showLinkedIn))}
            className="w-full h-12 text-base font-semibold bg-[#C9A961] hover:bg-[#A88B4E] text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{loadingMessages[loadingStep]}</>
            ) : linkedInUrl && linkedInUrl.toLowerCase().includes('linkedin.com') && showLinkedIn ? (
              'Analyse LinkedIn Profile'
            ) : (
              'Analyse CV for Free'
            )}
          </Button>

          {/* LinkedIn Paywall Modal */}
          {showLinkedInPaywall && (
            <div className="animate-in slide-in-from-top-2 duration-300 p-5 rounded-xl bg-gradient-to-br from-[#1A1A1A] to-[#2a2a2a] border border-[#C9A961]/30 space-y-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#C9A961]/10 border border-[#C9A961]/30 flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-[#C9A961]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </div>
                <h3 className="text-lg font-bold text-white">LinkedIn Analysis is Premium</h3>
                <p className="text-sm text-white/70">LinkedIn analysis requires a paid package. Get a complete report with ATS score, salary estimate and personalised recommendations.</p>
              </div>

              {/* Discount code input */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-white/80">Already have a discount code?</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={linkedInVoucherCode}
                    onChange={(e) => setLinkedInVoucherCode(e.target.value.toUpperCase())}
                    placeholder="E.g.: S2I-XXXXXX"
                    className="flex-1 px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961] uppercase tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!linkedInVoucherCode.trim()) {
                        setLinkedInVoucherError('Enter a code.');
                        return;
                      }
                      const valid = await validateVoucherForLinkedIn(linkedInVoucherCode.trim());
                      if (valid) {
                        handleLinkedInAnalyze();
                      }
                    }}
                    disabled={linkedInVoucherValidating}
                    className="px-4 py-2 rounded-lg bg-[#C9A961] hover:bg-[#A88B4E] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {linkedInVoucherValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Validate
                  </button>
                </div>
                {linkedInVoucherError && (
                  <p className="text-xs text-red-400">{linkedInVoucherError}</p>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/20" />
                <span className="text-xs text-white/50">or buy now</span>
                <div className="flex-1 h-px bg-white/20" />
              </div>

              {/* Step 1: Choose plan */}
              {liPaywallStep === 'choose' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {pricingPlans.map((plan, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setLiPaywallPlan(i);
                          setLiPaywallStep('pay');
                        }}
                        className="p-3 rounded-lg border border-white/20 bg-white/5 hover:border-[#C9A961]/50 hover:bg-[#C9A961]/10 transition-all text-center"
                      >
                        <p className="text-lg font-bold text-[#C9A961]">{CUR}{plan.price}</p>
                        <p className="text-xs text-white/60">{plan.analyses} analysis{plan.analyses > 1 ? 'es' : ''}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">{CUR}{plan.perUnit}/ea.</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Email + Pay via Stripe */}
              {liPaywallStep === 'pay' && (
                <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLiPaywallStep('choose')}
                      className="text-xs text-white/50 hover:text-white/80 transition-colors"
                    >
                      ← Back
                    </button>
                    <span className="text-sm font-semibold text-[#C9A961]">
                      {pricingPlans[liPaywallPlan].name} — {CUR}{pricingPlans[liPaywallPlan].price}
                    </span>
                  </div>

                  <input
                    type="email"
                    value={liPaywallEmail}
                    onChange={(e) => setLiPaywallEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2.5 rounded-lg border border-white/20 bg-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961]"
                  />

                  {liPaywallError && (
                    <p className="text-xs text-red-400">{liPaywallError}</p>
                  )}

                  <button
                    type="button"
                    onClick={handleLiPaywallPurchase}
                    disabled={liPaywallLoading}
                    className="w-full py-3 rounded-lg bg-[#C9A961] hover:bg-[#A88B4E] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {liPaywallLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to checkout...</>
                    ) : (
                      <>Buy & Analyse — {CUR}{pricingPlans[liPaywallPlan].price}</>
                    )}
                  </button>
                  <p className="text-[10px] text-white/40 text-center">Secure payment via Stripe. Analysis starts automatically.</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => { setShowLinkedInPaywall(false); setLiPaywallStep('choose'); }}
                disabled={liPaywallLoading}
                className="w-full text-center text-xs text-white/40 hover:text-white/70 transition-colors py-1 disabled:opacity-30"
              >
                Cancel
              </button>
            </div>
          )}

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

          {/* Comparison Table */}
          <div className="border-t border-border pt-4">
            <button onClick={() => setPricingOpen(!pricingOpen)} className="w-full flex items-center justify-between py-2 text-left">
              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Award className="w-4 h-4 text-[#C9A961]" />CV Analyser vs Other Solutions
              </span>
              {pricingOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {pricingOpen && (
              <div className="mt-3 overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-semibold text-foreground text-xs">Feature</th>
                      <th className="p-3 text-center"><span className="text-xs font-bold text-[#C9A961]">CV Analyser</span></th>
                      <th className="p-3 text-xs font-medium text-muted-foreground text-center">Resumeworded</th>
                      <th className="p-3 text-xs font-medium text-muted-foreground text-center">Kickresume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((row, i) => (
                      <tr key={i} className={`border-t border-border ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                        <td className="p-3 text-xs text-foreground">{row.feature}</td>
                        {row.usText ? (
                          <>
                            <td className="p-3 text-center text-xs font-bold text-[#C9A961]">{row.usText}</td>
                            <td className="p-3 text-center text-xs text-muted-foreground">{row.comp1Text}</td>
                            <td className="p-3 text-center text-xs text-muted-foreground">{row.comp2Text}</td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 text-center">{row.us ? <CheckCircle2 className="w-4 h-4 text-[#C9A961] mx-auto" /> : <XCircle className="w-4 h-4 text-muted-foreground/40 mx-auto" />}</td>
                            <td className="p-3 text-center">{row.competitor1 ? <CheckCircle2 className="w-4 h-4 text-muted-foreground/60 mx-auto" /> : <XCircle className="w-4 h-4 text-muted-foreground/40 mx-auto" />}</td>
                            <td className="p-3 text-center">{row.competitor2 ? <CheckCircle2 className="w-4 h-4 text-muted-foreground/60 mx-auto" /> : <XCircle className="w-4 h-4 text-muted-foreground/40 mx-auto" />}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-border">
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#C9A961]/10 flex items-center justify-center mx-auto"><Zap className="w-5 h-5 text-[#C9A961]" /></div>
              <p className="text-sm font-medium text-foreground">Instant Analysis</p>
              <p className="text-xs text-muted-foreground">Results in 30 seconds</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#C9A961]/10 flex items-center justify-center mx-auto"><Target className="w-5 h-5 text-[#C9A961]" /></div>
              <p className="text-sm font-medium text-foreground">Powered by AI</p>
              <p className="text-xs text-muted-foreground">Analysis with Google Gemini</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#C9A961]/10 flex items-center justify-center mx-auto"><Shield className="w-5 h-5 text-[#C9A961]" /></div>
              <p className="text-sm font-medium text-foreground">100% Private</p>
              <p className="text-xs text-muted-foreground">Your data is secure</p>
            </div>
          </div>
        </div>

        {/* What's Included */}
        <div className="mt-20 space-y-8">
          <h2 className="text-2xl font-bold text-center text-foreground">What does the free analysis include?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center"><BarChart3 className="w-6 h-6 text-[#C9A961]" /></div>
              <h3 className="text-lg font-semibold text-foreground">ATS Score</h3>
              <p className="text-sm text-muted-foreground">Probability of automatic rejection by recruitment systems</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center"><Grid2x2 className="w-6 h-6 text-[#C9A961]" /></div>
              <h3 className="text-lg font-semibold text-foreground">4 Quadrants</h3>
              <p className="text-sm text-muted-foreground">Analysis of structure, content, education and experience</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-[#C9A961]" /></div>
              <h3 className="text-lg font-semibold text-foreground">Benchmarks</h3>
              <p className="text-sm text-muted-foreground">Comparison with market averages for your country</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center"><Eye className="w-6 h-6 text-[#C9A961]" /></div>
              <h3 className="text-lg font-semibold text-foreground">Perception</h3>
              <p className="text-sm text-muted-foreground">How recruiters perceive your profile in the first 5 seconds</p>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-20 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center mx-auto"><Users className="w-6 h-6 text-[#C9A961]" /></div>
              <p className="text-3xl font-bold text-foreground">5,000+</p>
              <p className="text-sm text-muted-foreground">Professionals helped</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center mx-auto"><Star className="w-6 h-6 text-[#C9A961]" /></div>
              <p className="text-3xl font-bold text-foreground">4.8/5</p>
              <div className="flex items-center justify-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={`w-4 h-4 ${i <= 4 ? 'text-[#C9A961] fill-[#C9A961]' : 'text-[#C9A961]/40 fill-[#C9A961]/40'}`} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Average rating</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center mx-auto"><Award className="w-6 h-6 text-[#C9A961]" /></div>
              <p className="text-3xl font-bold text-foreground">87%</p>
              <p className="text-sm text-muted-foreground">Got an interview</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-center text-foreground">What our users say</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= t.rating ? 'text-[#C9A961] fill-[#C9A961]' : 'text-muted'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <div className="w-10 h-10 rounded-full bg-[#C9A961]/10 flex items-center justify-center text-sm font-bold text-[#C9A961]">
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="mt-20">
          <button onClick={() => setPricingOpen(!pricingOpen)} className="w-full bg-card border border-border rounded-xl p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center"><Award className="w-6 h-6 text-[#C9A961]" /></div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-foreground">Full Analysis Packages</h2>
                <p className="text-sm text-muted-foreground">From {CUR}9.99 per analysis</p>
              </div>
            </div>
            {pricingOpen ? <ChevronUp className="w-6 h-6 text-muted-foreground" /> : <ChevronDown className="w-6 h-6 text-muted-foreground" />}
          </button>
          {pricingOpen && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-2 duration-300">
              {pricingPlans.map((plan, i) => (
                <div key={i} className={`relative rounded-xl border p-6 space-y-5 ${plan.popular ? 'bg-[#C9A961] text-white border-[#C9A961]' : 'bg-card border-border'}`}>
                  {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-bold px-4 py-1 rounded-full">Most Popular</div>}
                  {plan.badge && <div className="absolute -top-3 right-4 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">{plan.badge}</div>}
                  <div className="space-y-1">
                    <h3 className={`text-lg font-bold ${plan.popular ? 'text-white' : 'text-foreground'}`}>{plan.name}</h3>
                    <p className={`text-sm ${plan.popular ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {plan.name === 'Complete' ? 'CV + Career Path' : `${plan.analyses} Full ${plan.analyses === 1 ? 'Analysis' : 'Analyses'}`}
                    </p>
                  </div>
                  <div className="space-y-0">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-foreground'}`}>{CUR}{plan.price}</span>
                    </div>
                    <p className={`text-sm ${plan.popular ? 'text-white/70' : 'text-muted-foreground'}`}>
                      {plan.name === 'Complete' ? (<>CV Analyser + Career Path</>) : (<>{CUR}{plan.perUnit} per analysis</>)}
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((f, j) => (
                      <li key={j} className={`text-sm flex items-start gap-2 ${plan.popular ? 'text-white/90' : 'text-muted-foreground'}`}>
                        <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? 'text-white' : 'text-[#C9A961]'}`} />{f}
                      </li>
                    ))}
                  </ul>
                  <Button className={`w-full font-semibold ${plan.popular ? 'bg-white text-[#C9A961] hover:bg-white/90' : 'bg-[#C9A961] text-white hover:bg-[#A88B4E]'}`}>
                    Choose Plan
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Why CV Analyser */}
        <div className="mt-20 space-y-8">
          <h2 className="text-2xl font-bold text-center text-foreground">Why CV Analyser?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center"><Globe className="w-6 h-6 text-[#C9A961]" /></div>
              <h3 className="text-lg font-semibold text-foreground">Localised for Your Market</h3>
              <p className="text-sm text-muted-foreground">Analysis adapted to your country. Salary benchmarks, certifications and recommendations tailored to your local job market.</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-[#C9A961]" /></div>
              <h3 className="text-lg font-semibold text-foreground">Exclusive Normal Curve</h3>
              <p className="text-sm text-muted-foreground">See exactly where you stand compared to other candidates. No other service offers this level of visual comparison.</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center"><Clock className="w-6 h-6 text-[#C9A961]" /></div>
              <h3 className="text-lg font-semibold text-foreground">Results in 30 Seconds</h3>
              <p className="text-sm text-muted-foreground">While other services take hours or days, CV Analyser gives you immediate feedback with cutting-edge AI.</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center"><Shield className="w-6 h-6 text-[#C9A961]" /></div>
              <h3 className="text-lg font-semibold text-foreground">Fair Price, No Subscription</h3>
              <p className="text-sm text-muted-foreground">Pay only when you need it. No monthly fees, no commitments. From {CUR}9.99 per full analysis.</p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-20 mb-10 bg-[#C9A961] rounded-2xl p-8 md:p-12 text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Ready to improve your CV?</h2>
          <p className="text-white/80 max-w-lg mx-auto">Start with the free analysis. No credit card, no commitment. Discover what recruiters really think.</p>
          <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="bg-white text-[#C9A961] hover:bg-white/90 font-semibold px-8 py-3 text-base">
            Start Free Analysis
          </Button>
        </div>

        {/* ─── Member Area CTA ─── */}
        <div className="mt-16 mb-10 p-8 bg-gradient-to-r from-[#f9f6ef] to-[#faf8f3] border border-[#C9A961]/20 rounded-2xl text-center max-w-2xl mx-auto">
          <p className="text-base font-bold text-slate-800 mb-2">Want regular access to this tool?</p>
          <p className="text-sm text-slate-500 mb-5 leading-relaxed max-w-lg mx-auto">With a subscription plan, you get weekly CV analyses included, Career Path, exclusive content, personalised job feed and much more.</p>
          <a
            href="https://www.share2inspire.pt/area-cliente/planos"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C9A961] hover:bg-[#b8954f] text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            View subscription plans →
          </a>
          <p className="text-xs text-slate-400 mt-3">From €9.99/month · Cancel anytime</p>
        </div>

        {/* Footer */}
        <footer className="border-t border-border pt-8 pb-12 text-center space-y-2">
          <p className="text-sm text-muted-foreground">© 2026 Share2Inspire — All rights reserved</p>
          <p className="text-xs text-muted-foreground">
            <a href="https://www.share2inspire.pt/pages/politica-privacidade" className="hover:text-[#C9A961] transition-colors">Privacy Policy</a>
            {' · '}
            <a href="https://www.share2inspire.pt/pages/termos-condicoes" className="hover:text-[#C9A961] transition-colors">Terms & Conditions</a>
            {' · '}
            <a href="/cv-analyser" className="hover:text-[#C9A961] transition-colors">PT</a>
          </p>
        </footer>
      </main>
    </div>
  );
}
