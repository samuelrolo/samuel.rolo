// CV Analyser v2 - Results Page - Build 2026-02-16
// Free report: ATS score, 4 quadrants, benchmarks, recruiter perception, SALARY IN BLUR
// Paid: Everything unlocked + normal curve + detailed analysis + action plan
// Payment: MB WAY + PayPal options

import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import ATSRejectionBlock from "@/components/ATSRejectionBlock";
import QuadrantCard from "@/components/QuadrantCard";
import DimensionBar from "@/components/DimensionBar";
import ScoreGauge from "@/components/ScoreGauge";
import RecruiterPerception from "@/components/RecruiterPerception";
import LockedSection from "@/components/LockedSection";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Home as HomeIcon, FileCheck, Lock, TrendingUp, Euro, Info, BarChart3, Grid2x2, Eye, AlertTriangle, Bot, CreditCard } from "lucide-react";
import type { AnalysisData } from "@/types/analysis";

/* ─── Tooltip reusable ─── */
function Tooltip({ label, text }: { label: string; text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="p-0.5 rounded-full hover:bg-muted transition-colors"
      >
        <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-[#C9A961] transition-colors" />
      </button>
      {show && (
        <div className="absolute left-0 top-6 z-50 w-72 p-3 rounded-lg bg-foreground text-background text-xs leading-relaxed shadow-xl">
          <p className="font-semibold mb-1">{label}</p>
          <p>{text}</p>
          <div className="absolute -top-1.5 left-3 w-3 h-3 bg-foreground rotate-45" />
        </div>
      )}
    </div>
  );
}

/* ─── Gold Icon wrapper (Share2Inspire style) ─── */
function GoldIcon({ children, size = "w-10 h-10" }: { children: React.ReactNode; size?: string }) {
  return (
    <div className={`${size} rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center shrink-0`}>
      {children}
    </div>
  );
}

/* ─── Normal Curve SVG Component ─── */
function NormalCurveChart({ percentile }: { percentile: number }) {
  const width = 400;
  const height = 180;
  const padding = 30;
  const curveWidth = width - padding * 2;
  const curveHeight = height - padding * 2;

  const points = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 100; i++) {
      const x = padding + (i / 100) * curveWidth;
      const z = (i - 50) / 16.67;
      const y = padding + curveHeight - (curveHeight * 0.95 * Math.exp(-0.5 * z * z));
      pts.push(`${x},${y}`);
    }
    return pts.join(' ');
  }, [curveWidth, curveHeight]);

  const fillPoints = useMemo(() => {
    const pts: string[] = [`${padding},${padding + curveHeight}`];
    for (let i = 0; i <= 100; i++) {
      const x = padding + (i / 100) * curveWidth;
      const z = (i - 50) / 16.67;
      const y = padding + curveHeight - (curveHeight * 0.95 * Math.exp(-0.5 * z * z));
      pts.push(`${x},${y}`);
    }
    pts.push(`${padding + curveWidth},${padding + curveHeight}`);
    return pts.join(' ');
  }, [curveWidth, curveHeight]);

  const userX = padding + (percentile / 100) * curveWidth;
  const userZ = (percentile - 50) / 16.67;
  const userY = padding + curveHeight - (curveHeight * 0.95 * Math.exp(-0.5 * userZ * userZ));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-md mx-auto">
      <polygon points={fillPoints} fill="#C9A961" opacity="0.1" />
      <polyline points={points} fill="none" stroke="#C9A961" strokeWidth="2.5" />
      <line x1={userX} y1={userY} x2={userX} y2={padding + curveHeight} stroke="#C9A961" strokeWidth="2" strokeDasharray="4,4" />
      <circle cx={userX} cy={userY} r="6" fill="#C9A961" stroke="white" strokeWidth="2" />
      <text x={userX} y={userY - 14} textAnchor="middle" className="text-xs font-bold fill-[#C9A961]">
        Tu ({percentile}%)
      </text>
      <text x={padding} y={height - 5} textAnchor="start" className="text-[10px] fill-current text-muted-foreground">0%</text>
      <text x={padding + curveWidth / 2} y={height - 5} textAnchor="middle" className="text-[10px] fill-current text-muted-foreground">Média</text>
      <text x={padding + curveWidth} y={height - 5} textAnchor="end" className="text-[10px] fill-current text-muted-foreground">100%</text>
      <line x1={padding} y1={padding + curveHeight} x2={padding + curveWidth} y2={padding + curveHeight} stroke="currentColor" strokeWidth="1" opacity="0.2" />
    </svg>
  );
}

/* ─── Salary Blur Block ─── */
function SalaryBlock({ blurred }: { blurred: boolean }) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-3">
        <GoldIcon>
          <Euro className="w-5 h-5 text-[#C9A961]" />
        </GoldIcon>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground">ESTIMATIVA SALARIAL</p>
            <Tooltip
              label="Como é calculada a estimativa?"
              text="Estimativa baseada no perfil profissional detectado, nível de senioridade, competências identificadas e dados salariais do mercado português. Os valores são indicativos e podem variar conforme a região, setor e dimensão da empresa."
            />
          </div>
          <p className="text-xs text-muted-foreground">Com base no perfil e mercado português</p>
        </div>
      </div>

      <div className="relative">
        {blurred && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md rounded-lg">
            <Lock className="w-8 h-8 text-[#C9A961] mb-2" />
            <p className="text-sm font-semibold text-foreground">Desbloqueia para ver o valor exacto</p>
            <p className="text-xs text-muted-foreground mt-1">Disponível no relatório completo</p>
          </div>
        )}
        <div className={blurred ? 'select-none' : ''}>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Mínimo</p>
              <p className="text-2xl font-bold text-foreground">€1.200</p>
              <p className="text-xs text-muted-foreground">/mês</p>
            </div>
            <div className="text-center p-4 bg-[#C9A961]/10 rounded-lg border border-[#C9A961]/20">
              <p className="text-xs text-muted-foreground mb-1">Estimativa</p>
              <p className="text-2xl font-bold text-[#C9A961]">€1.650</p>
              <p className="text-xs text-muted-foreground">/mês</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Máximo</p>
              <p className="text-2xl font-bold text-foreground">€2.100</p>
              <p className="text-xs text-muted-foreground">/mês</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Valores estimados com base em dados do mercado português para o teu perfil
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Automation Risk - INVERTED: higher = worse ─── */
function AutomationRiskPreview() {
  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-3">
        <GoldIcon>
          <Bot className="w-5 h-5 text-[#C9A961]" />
        </GoldIcon>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground">POTENCIAL DE AUTOMAÇÃO</p>
            <Tooltip
              label="O que é o Potencial de Automação?"
              text="Estimativa da probabilidade de as tarefas associadas ao teu perfil profissional serem automatizadas por IA ou robótica nos próximos 5-10 anos. Quanto MAIOR o valor, MAIOR o risco de automação."
            />
          </div>
          <p className="text-xs text-muted-foreground">Risco de automação da tua função — quanto maior, pior</p>
        </div>
      </div>

      {/* Blurred preview */}
      <div className="relative">
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md rounded-lg">
          <Lock className="w-6 h-6 text-[#C9A961] mb-2" />
          <p className="text-sm font-semibold text-foreground">Disponível no relatório completo</p>
          <p className="text-xs text-muted-foreground mt-1">Descobre o risco de automação da tua função</p>
        </div>
        <div className="select-none space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Baixo risco</span>
            <span className="text-xs text-muted-foreground">Alto risco</span>
          </div>
          <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-green-400 to-yellow-400 w-1/2" />
          </div>
          <p className="text-sm text-muted-foreground">→ Análise detalhada do risco de automação para o teu perfil</p>
        </div>
      </div>
    </div>
  );
}

/* ─── PayPal SVG Icon ─── */
function PayPalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
    </svg>
  );
}

export default function Results() {
  const [, setLocation] = useLocation();
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'confirm' | 'payment' | 'success'>('confirm');
  const [paymentMethod, setPaymentMethod] = useState<'mbway' | 'paypal'>('mbway');
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: string; analyses: number }>({
    name: 'Essencial',
    price: '2,99',
    analyses: 1,
  });

  useEffect(() => {
    const data = sessionStorage.getItem('cvAnalysis');
    if (!data) {
      setLocation('/');
      return;
    }
    try {
      setAnalysisData(JSON.parse(data));
    } catch (err) {
      console.error('Error parsing analysis data:', err);
      setLocation('/');
    }
  }, [setLocation]);

  const openPaymentModal = (plan?: { name: string; price: string; analyses: number }) => {
    if (plan) setSelectedPlan(plan);
    setPaymentStep('confirm');
    setPaymentError(null);
    setShowPaymentModal(true);
  };

  const handleMBWayPayment = async () => {
    if (!email || !phone) {
      setPaymentError('Por favor, preencha todos os campos');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setPaymentError('Por favor, introduza um email válido');
      return;
    }

    const phoneRegex = /^(9[1236]\d{7}|2\d{8})$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setPaymentError('Por favor, introduza um número de telemóvel válido');
      return;
    }

    setLoading(true);
    setPaymentError(null);

    try {
      const cvFile = sessionStorage.getItem('cvFile');
      const analysisDataStr = sessionStorage.getItem('cvAnalysis');
      
      if (!cvFile || !analysisDataStr) {
        throw new Error('Dados do CV não encontrados');
      }

      const parsedAnalysis = JSON.parse(analysisDataStr);
      const priceNum = parseFloat(selectedPlan.price.replace(',', '.'));
      const orderId = `CVA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const response = await fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          phone: phone,
          orderId: orderId,
          amount: priceNum.toFixed(2),
          paymentMethod: 'mbway',
          description: `CV Analyser - ${selectedPlan.name}`,
          name: email.split('@')[0],
          analysisData: parsedAnalysis
        })
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        console.error('[PAYMENT] Backend error:', data);
        throw new Error(data.error || 'Erro ao processar pagamento. Tenta novamente.');
      }
      
      sessionStorage.setItem('orderId', orderId);
      // Store requestId for polling (backend returns it from IfthenPay)
      if (data.requestId) {
        sessionStorage.setItem('requestId', data.requestId);
      }
      setPaymentStep('success');
      startPolling(orderId);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalPayment = async () => {
    if (!email) {
      setPaymentError('Por favor, introduza o seu email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setPaymentError('Por favor, introduza um email válido');
      return;
    }

    setLoading(true);
    setPaymentError(null);

    try {
      const priceNum = parseFloat(selectedPlan.price.replace(',', '.'));
      
      // Abrir PayPal.me directamente com o valor do plano
      window.open(`https://paypal.me/SamuelRolo/${priceNum}EUR`, '_blank');
      setPaymentStep('success');
    } catch (err) {
      setPaymentError('Erro ao abrir PayPal. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    if (paymentMethod === 'mbway') {
      handleMBWayPayment();
    } else {
      handlePayPalPayment();
    }
  };

  const startPolling = (orderId: string) => {
    let attempts = 0;
    const maxAttempts = 24; // 24 * 10s = 4 minutes max
    let consecutiveErrors = 0;
    
    const pollInterval = setInterval(async () => {
      attempts++;
      try {
        const response = await fetch(
          `https://share2inspire-beckend.lm.r.appspot.com/api/payment/check-payment-status`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId })
          }
        );
        if (!response.ok) {
          consecutiveErrors++;
          console.warn(`[POLLING] Erro ${response.status} (tentativa ${attempts}/${maxAttempts})`);
          if (consecutiveErrors >= 3) {
            console.warn('[POLLING] 3 erros consecutivos, a parar polling');
            clearInterval(pollInterval);
          }
          return;
        }
        consecutiveErrors = 0;
        const data = await response.json();
        if (data.paid && data.delivered) {
          console.log('[POLLING] Pagamento confirmado e relatório entregue!');
          clearInterval(pollInterval);
        } else if (data.paid && !data.delivered) {
          console.log('[POLLING] Pagamento confirmado, a aguardar entrega...');
        } else if (attempts >= maxAttempts) {
          console.warn('[POLLING] Timeout atingido');
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Erro no polling:', err);
        consecutiveErrors++;
        if (consecutiveErrors >= 3) {
          clearInterval(pollInterval);
        }
      }
    }, 10000); // Poll every 10 seconds instead of 5
  };

  if (!analysisData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A961]" />
      </div>
    );
  }

  const avgScore = analysisData.quadrants.reduce((sum, q) => sum + q.score, 0) / analysisData.quadrants.length;
  const percentile = Math.round(Math.min(95, Math.max(5, avgScore * 0.95)));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-foreground/10 px-6 py-4 sticky top-0 bg-background/90 backdrop-blur-lg z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation('/')}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            <div className="flex items-center gap-2">
              <GoldIcon size="w-7 h-7">
                <FileCheck className="w-3.5 h-3.5 text-[#C9A961]" />
              </GoldIcon>
              <span className="text-base font-semibold text-foreground">CV Analyser</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => openPaymentModal()}
              className="bg-[#C9A961] hover:bg-[#A88B4E] text-white text-sm font-semibold px-5 py-2"
            >
              Obter Relatório Completo
            </Button>
            <a 
              href="https://www.share2inspire.pt" 
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm font-medium text-foreground"
            >
              <HomeIcon className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Free Report Label */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-[#C9A961]" />
          <span>Relatório Gratuito — Análise resumida do teu CV</span>
        </div>

        {/* ═══ ATS Rejection ═══ */}
        <ATSRejectionBlock rejectionRate={analysisData.atsRejectionRate} topFactor={analysisData.atsTopFactor} />

        {/* ═══ 4 Quadrantes ═══ */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <GoldIcon size="w-8 h-8">
              <Grid2x2 className="w-4 h-4 text-[#C9A961]" />
            </GoldIcon>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground">ANÁLISE POR QUADRANTE</p>
              <Tooltip
                label="O que são os Quadrantes?"
                text="O teu CV é avaliado em 4 dimensões independentes: Estrutura (organização visual), Conteúdo (qualidade do texto), Formação (apresentação académica) e Experiência (descrição profissional). Cada uma é comparada com o benchmark do mercado."
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {analysisData.quadrants.map((q, i) => (
              <QuadrantCard
                key={i}
                title={q.title}
                score={q.score}
                benchmark={q.benchmark}
                insight={q.impactPhrase}
                strengths={q.strengths}
                weaknesses={q.weaknesses}
              />
            ))}
          </div>
        </div>

        {/* ═══ Factores de Avaliação ═══ */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-5">
          <div className="flex items-center gap-3">
            <GoldIcon>
              <BarChart3 className="w-5 h-5 text-[#C9A961]" />
            </GoldIcon>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">FACTORES DE AVALIAÇÃO</p>
                <Tooltip
                  label="O que são os Factores de Avaliação?"
                  text="Representação visual de cada dimensão do CV em barra horizontal. A linha vertical indica o benchmark (média do mercado) para o mesmo nível de senioridade. Valores acima do benchmark são positivos."
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Cada factor é comparado com a média do mercado. A linha vertical na barra indica o benchmark.</p>
            </div>
          </div>
          <div className="space-y-5">
            {analysisData.quadrants.map((q, i) => (
              <DimensionBar key={i} label={q.title} score={q.score} benchmark={q.benchmark} insight={q.impactPhrase} />
            ))}
          </div>
          <div className="pt-4 border-t border-border">
            <div className="relative">
              <p className="text-sm text-muted-foreground mb-2">
                → O teu CV está {avgScore >= 70 ? 'acima' : 'abaixo'} da média global do mercado ({Math.round(avgScore)} vs 69)
              </p>
              <div className="relative">
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
                  <Button
                    onClick={() => openPaymentModal()}
                    size="sm"
                    className="bg-[#C9A961] hover:bg-[#A88B4E] text-white"
                  >
                    Ver Análise Detalhada por Dimensão
                  </Button>
                </div>
                <div className="select-none space-y-1 text-sm text-muted-foreground">
                  <p>→ Análise cruzada entre dimensões e impacto no score global</p>
                  <p>→ Recomendações específicas para cada dimensão</p>
                  <p>→ Comparação com perfis do mesmo nível de senioridade</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Compatibilidade ATS ═══ */}
        <div className="bg-card border border-border rounded-lg p-8 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <GoldIcon>
              <AlertTriangle className="w-5 h-5 text-[#C9A961]" />
            </GoldIcon>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">COMPATIBILIDADE ATS</p>
                <Tooltip
                  label="O que é a Compatibilidade ATS?"
                  text="Applicant Tracking System — software usado por 75% das empresas para filtrar CVs automaticamente. Este score indica a probabilidade do teu CV passar esses filtros. Quanto maior, melhor."
                />
              </div>
              <p className="text-xs text-muted-foreground">Probabilidade do teu CV passar filtros automáticos</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <ScoreGauge score={100 - analysisData.atsRejectionRate} size={160} strokeWidth={8} />
            <p className="text-sm text-muted-foreground text-center max-w-md">
              O teu CV tem <span className="font-semibold text-foreground">{100 - analysisData.atsRejectionRate}%</span> de compatibilidade com sistemas ATS. {100 - analysisData.atsRejectionRate >= 70 ? 'Boa compatibilidade.' : 'Vê o relatório completo para saber como melhorar.'}
            </p>
          </div>
        </div>

        {/* ═══ Percepção do Recrutador ═══ */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <GoldIcon size="w-8 h-8">
              <Eye className="w-4 h-4 text-[#C9A961]" />
            </GoldIcon>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground">PERCEPÇÃO DO RECRUTADOR</p>
              <Tooltip
                label="O que é a Percepção do Recrutador?"
                text="Simulação do que um recrutador retém do teu CV nos primeiros 5-10 segundos de leitura. Inclui o perfil profissional percebido, nível de senioridade e competências-chave identificadas."
              />
            </div>
          </div>
          <RecruiterPerception roles={analysisData.keywords} perceivedRole={analysisData.perceivedRole} perceivedSeniority={analysisData.perceivedSeniority} />
        </div>

        {/* ═══ Salary in Blur ═══ */}
        <SalaryBlock blurred={true} />

        {/* ═══ Normal Curve - Values visible, chart blurred ═══ */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <GoldIcon>
              <TrendingUp className="w-5 h-5 text-[#C9A961]" />
            </GoldIcon>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">POSICIONAMENTO NO MERCADO</p>
                <Tooltip
                  label="O que é a Curva Normal?"
                  text="Distribuição estatística que mostra onde o teu CV se posiciona face a todos os CVs analisados na nossa plataforma. O percentil indica a percentagem de CVs que o teu supera."
                />
              </div>
              <p className="text-xs text-muted-foreground">Curva normal — onde te posicionas face a outros candidatos</p>
            </div>
          </div>

          {/* Values VISIBLE */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Percentil</p>
              <p className="text-xl font-bold text-foreground">{percentile}%</p>
            </div>
            <div className="text-center p-3 bg-[#C9A961]/10 rounded-lg border border-[#C9A961]/20">
              <p className="text-xs text-muted-foreground">Posição</p>
              <p className="text-xl font-bold text-[#C9A961]">Top {100 - percentile}%</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Score Global</p>
              <p className="text-xl font-bold text-foreground">{Math.round(avgScore)}/100</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            → Estás no <span className="font-semibold text-foreground">percentil {percentile}</span>, o que significa que o teu CV é melhor que {percentile}% dos CVs analisados no mercado.
          </p>

          {/* Chart BLURRED */}
          <div className="relative">
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md rounded-lg">
              <Lock className="w-6 h-6 text-[#C9A961] mb-2" />
              <p className="text-sm font-semibold text-foreground">Gráfico completo no Relatório Pago</p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">Vê a curva de distribuição e a tua posição exacta</p>
              <Button
                onClick={() => openPaymentModal()}
                size="sm"
                className="bg-[#C9A961] hover:bg-[#A88B4E] text-white"
              >
                Desbloquear por €2,99
              </Button>
            </div>
            <div className="select-none">
              <NormalCurveChart percentile={percentile} />
            </div>
          </div>
        </div>

        {/* ═══ Potencial de Automação - preview blurred ═══ */}
        <AutomationRiskPreview />

        {/* ═══ Matriz de Oportunidades ═══ */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold tracking-wider text-muted-foreground">MATRIZ DE OPORTUNIDADES — RELATÓRIO COMPLETO</p>
            <p className="text-xs text-muted-foreground mt-1">O relatório completo inclui estas 4 secções detalhadas. Aqui podes ver o que cada uma cobre.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LockedSection
              title="Análise detalhada por quadrante"
              visibleHint="Breakdown completo de cada dimensão com pontos fortes e fracos identificados."
              previewItems={[
                "Estrutura visual e hierarquia de informação",
                "Alinhamento entre competências e função-alvo",
                "Keywords e compatibilidade com filtros ATS",
                "Posicionamento face ao mercado",
              ]}
            />
            <LockedSection
              title="Comparação com perfis top 25%"
              visibleHint="Vê como o teu CV se compara com os melhores do teu setor."
              previewItems={[
                "Benchmark contra os melhores CVs do setor",
                "Competências diferenciadoras em falta",
                "Posicionamento face a concorrentes",
                "Gap analysis com recomendações",
              ]}
            />
            <LockedSection
              title="Recomendações específicas (15+)"
              visibleHint="Mais de 15 micro-insights com acções concretas para melhorar o teu CV."
              previewItems={[
                "Reescrita otimizada do resumo profissional",
                "Reformulação com métricas de impacto",
                "Otimização de keywords para ATS",
                "Sugestões de formatação visual",
              ]}
            />
            <LockedSection
              title="Plano de acção (30 dias)"
              visibleHint="Plano estruturado com 3-5 acções prioritárias e timeline de implementação."
              previewItems={[
                "3-5 acções prioritárias ordenadas",
                "Timeline de implementação",
                "Checklist de melhorias rápidas",
                "Estratégia de candidatura",
              ]}
            />
          </div>
        </div>

        {/* ═══ Pricing CTA ═══ */}
        <div className="bg-card border-2 border-[#C9A961]/30 rounded-2xl p-8 text-center space-y-5">
          <p className="text-xs font-semibold tracking-wider text-[#C9A961]">RELATÓRIO COMPLETO</p>
          <p className="text-5xl font-bold text-foreground">2,99 €</p>
          <p className="text-sm text-muted-foreground">PDF de 16 páginas enviado por email</p>
          <div className="space-y-2 text-sm text-muted-foreground max-w-sm mx-auto">
            <p className="flex items-center gap-2 justify-center"><span className="text-[#C9A961]">✓</span> Diagnóstico detalhado por quadrante</p>
            <p className="flex items-center gap-2 justify-center"><span className="text-[#C9A961]">✓</span> Curva normal de posicionamento</p>
            <p className="flex items-center gap-2 justify-center"><span className="text-[#C9A961]">✓</span> Estimativa salarial detalhada</p>
            <p className="flex items-center gap-2 justify-center"><span className="text-[#C9A961]">✓</span> Potencial de automação da função</p>
            <p className="flex items-center gap-2 justify-center"><span className="text-[#C9A961]">✓</span> 15+ recomendações personalizadas</p>
            <p className="flex items-center gap-2 justify-center"><span className="text-[#C9A961]">✓</span> Plano de acção de 30 dias</p>
          </div>
          <Button
            onClick={() => openPaymentModal()}
            className="bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold px-10 py-3 text-base mt-2"
          >
            Obter Relatório Completo
          </Button>
          <p className="text-xs text-muted-foreground">Pagamento seguro via MB WAY ou PayPal</p>
        </div>
      </main>

      {/* ═══ Payment Modal - 3 Steps: Confirm → Payment → Success ═══ */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {paymentStep === 'confirm' && 'Confirmar Pacote'}
              {paymentStep === 'payment' && 'Dados de Pagamento'}
              {paymentStep === 'success' && 'Pagamento Iniciado'}
            </DialogTitle>
          </DialogHeader>

          {/* Step 1: Choose Plan & Confirm */}
          {paymentStep === 'confirm' && (
            <div className="space-y-5 py-4">
              {/* Plan selector - 3 options */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Escolhe o teu pacote:</p>
                <div className="space-y-2">
                  {[
                    { name: 'Essencial', price: '2,99', analyses: 1, perUnit: '2,99' },
                    { name: 'Profissional', price: '6,99', analyses: 3, perUnit: '2,33' },
                    { name: 'Premium', price: '9,99', analyses: 5, perUnit: '2,00' },
                  ].map((plan) => (
                    <button
                      key={plan.name}
                      onClick={() => setSelectedPlan(plan)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedPlan.name === plan.name
                          ? 'border-[#C9A961] bg-[#C9A961]/5'
                          : 'border-border hover:border-[#C9A961]/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedPlan.name === plan.name ? 'border-[#C9A961]' : 'border-muted-foreground/40'
                          }`}>
                            {selectedPlan.name === plan.name && (
                              <div className="w-2 h-2 rounded-full bg-[#C9A961]" />
                            )}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-foreground">{plan.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {plan.analyses} {plan.analyses === 1 ? 'análise' : 'análises'}
                            </span>
                            {plan.name === 'Profissional' && (
                              <span className="ml-2 text-[10px] font-bold bg-[#C9A961] text-white px-1.5 py-0.5 rounded">POPULAR</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-[#C9A961]">€{plan.price}</span>
                          {plan.analyses > 1 && (
                            <p className="text-[10px] text-muted-foreground">€{plan.perUnit}/análise</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* What's included */}
              <div className="space-y-1.5 text-sm text-muted-foreground border-t border-border pt-4">
                <p className="text-xs font-semibold text-foreground mb-2">Cada análise inclui:</p>
                <p>→ Relatório PDF completo (16 páginas)</p>
                <p>→ Curva normal de posicionamento</p>
                <p>→ Estimativa salarial detalhada</p>
                <p>→ Potencial de automação da função</p>
                <p>→ 15+ recomendações personalizadas</p>
                <p>→ Plano de acção de 30 dias</p>
              </div>

              <Button
                onClick={() => setPaymentStep('payment')}
                className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold"
              >
                Continuar para Pagamento — €{selectedPlan.price}
              </Button>
            </div>
          )}

          {/* Step 2: Payment */}
          {paymentStep === 'payment' && (
            <div className="space-y-4 py-4">
              {/* Payment method selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Método de Pagamento</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('mbway')}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      paymentMethod === 'mbway'
                        ? 'border-[#C9A961] bg-[#C9A961]/5'
                        : 'border-border hover:border-[#C9A961]/30'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 text-[#C9A961]" />
                    <span className="text-sm font-semibold text-foreground">MB WAY</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('paypal')}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      paymentMethod === 'paypal'
                        ? 'border-[#0070BA] bg-[#0070BA]/5'
                        : 'border-border hover:border-[#0070BA]/30'
                    }`}
                  >
                    <PayPalIcon className="w-6 h-6 text-[#0070BA]" />
                    <span className="text-sm font-semibold text-foreground">PayPal</span>
                  </button>
                </div>
              </div>

              {/* Email (always required) */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email <span className="text-xs text-muted-foreground">(para envio do relatório)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                />
              </div>

              {/* Phone (only for MB WAY) */}
              {paymentMethod === 'mbway' && (
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-foreground">
                    Telemóvel (MB WAY)
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="912345678"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                  />
                </div>
              )}

              {paymentError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-500">{paymentError}</p>
                </div>
              )}

              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm border-t border-border pt-3">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-lg font-bold text-foreground">€{selectedPlan.price}</span>
                </div>
                <Button
                  onClick={handlePayment}
                  disabled={loading}
                  className={`w-full font-semibold ${
                    paymentMethod === 'paypal'
                      ? 'bg-[#0070BA] hover:bg-[#005EA6] text-white'
                      : 'bg-[#C9A961] hover:bg-[#A88B4E] text-white'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      A processar...
                    </>
                  ) : paymentMethod === 'mbway' ? (
                    'Pagar com MB WAY'
                  ) : (
                    <>
                      <PayPalIcon className="w-4 h-4 mr-2" />
                      Pagar com PayPal
                    </>
                  )}
                </Button>
                <button
                  onClick={() => setPaymentStep('confirm')}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Voltar
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {paymentStep === 'success' && (
            <div className="space-y-5 py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[#C9A961]/10 flex items-center justify-center mx-auto">
                <FileCheck className="w-8 h-8 text-[#C9A961]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">Pagamento iniciado!</h3>
                {paymentMethod === 'mbway' ? (
                  <p className="text-sm text-muted-foreground">
                    Verifique o seu telemóvel para aprovar o pagamento MB WAY.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Complete o pagamento na janela do PayPal que foi aberta.
                  </p>
                )}
              </div>
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-[#C9A961]" />
                  <span className="text-sm text-muted-foreground">A aguardar confirmação...</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Após aprovação, receberá o relatório por email em poucos minutos.
                </p>
              </div>
              <Button
                onClick={() => setShowPaymentModal(false)}
                variant="outline"
                className="w-full"
              >
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
