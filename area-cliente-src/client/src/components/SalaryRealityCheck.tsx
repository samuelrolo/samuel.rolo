/**
 * SalaryRealityCheck — Ferramenta de benchmark salarial (totalmente gratuita)
 * Passos: Contexto → Remuneração → Benefícios → Resultados
 */
import { useState } from 'react';
import {
  ChevronRight, ChevronLeft, Loader2, AlertCircle,
  CheckCircle, TrendingUp, Plus, Trash2, Smartphone, Wifi,
} from 'lucide-react';

interface SalaryRealityCheckProps {
  userEmail?: string;
  userName?: string;
  isPro?: boolean;
}

interface OtherIncome {
  id: string;
  description: string;
  amount: string;
  period: 'monthly' | 'annual';
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
const SRC_URL = `${SUPABASE_URL}/functions/v1/salary-reality-check`;

const COUNTRIES = ['Portugal','Spain','United Kingdom','France','Germany','Netherlands','Switzerland','Ireland','Belgium','Luxembourg','Brazil','Angola','Mozambique','United States','Canada'];
const FUNCTIONS = ['HR','Finance','Technology','Sales','Marketing','Operations','Legal','Consulting','Engineering','Product','Data/Analytics','Procurement','Risk & Compliance','Other'];
const INDUSTRIES = ['Financial Services','Technology','Consulting','Healthcare','Pharmaceuticals','Energy','Retail','Telecommunications','Automotive','FMCG','Media','Real Estate','Government','Education','Other'];
const SENIORITIES = ['Intern/Trainee','Junior (0-2y)','Mid-Level (2-5y)','Senior (5-10y)','Lead/Principal (7-12y)','Manager','Senior Manager','Director','VP','C-Level'];
const CURRENCIES = ['EUR','GBP','USD','CHF','BRL','AOA'];
const STEPS = ['CONTEXTO','REMUNERAÇÃO','BENEFÍCIOS','RESULTADOS'];

function fmt(n: number, currency = 'EUR') {
  const sym = ({ EUR:'€', GBP:'£', USD:'$', CHF:'CHF', BRL:'R$', AOA:'Kz' } as Record<string,string>)[currency] ?? '€';
  return `${sym}${Math.round(n).toLocaleString('pt-PT')}`;
}

function computeOtherIncomeAnnual(items: OtherIncome[]): number {
  return items.reduce((sum, item) => {
    const val = parseFloat(item.amount) || 0;
    return sum + (item.period === 'monthly' ? val * 12 : val);
  }, 0);
}

function computeCTC(
  monthly: number, months: number, bonusPct: number,
  car: string, health: string,
  pensionPct: number, mealDaily: number, flexAnnual: number,
  phone: string, remote: string, otherIncomeAnnual: number,
) {
  const base    = monthly * months;
  const bonus   = base * (bonusPct / 100);
  const carVal  = ({ none:0, conventional:6000, ev_partial:9000, ev_full:14000 } as Record<string,number>)[car] ?? 0;
  const healthV = ({ none:0, self:1200, family:2400 } as Record<string,number>)[health] ?? 0;
  const pension = base * (pensionPct / 100);
  const meal    = mealDaily * 220;
  const flex    = flexAnnual;
  const phoneV  = phone === 'company' ? 600 : 0;
  const remoteV = ({ presencial:0, hybrid:1200, full_remote:2400 } as Record<string,number>)[remote] ?? 0;
  const other   = otherIncomeAnnual;
  const ctc = base + bonus + carVal + healthV + pension + meal + flex + phoneV + remoteV + other;
  return { base, bonus, car: carVal, health: healthV, pension, meal, flex, phone: phoneV, remote: remoteV, other, ctc };
}

export default function SalaryRealityCheck({ userEmail = '', userName = '' }: SalaryRealityCheckProps) {

  const [step, setStep] = useState(0);

  // Step 0
  const [country, setCountry]     = useState('Portugal');
  const [fn, setFn]               = useState('');
  const [industry, setIndustry]   = useState('');
  const [seniority, setSeniority] = useState('');

  // Step 1
  const [monthly, setMonthly]     = useState('');
  const [months, setMonths]       = useState('14');
  const [currency, setCurrency]   = useState('EUR');
  const [bonusPct, setBonusPct]   = useState('0');
  const [bonusType, setBonusType] = useState('performance');
  const [otherIncome, setOtherIncome] = useState<OtherIncome[]>([]);

  // Step 2
  const [car, setCar]               = useState('none');
  const [health, setHealth]         = useState('none');
  const [pensionPct, setPensionPct] = useState('0');
  const [mealDaily, setMealDaily]   = useState('0');
  const [flexAnnual, setFlexAnnual] = useState('0');
  const [phone, setPhone]           = useState('none');
  const [remote, setRemote]         = useState('presencial');

  // Results
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [result, setResult]     = useState<any>(null);

  const otherAnnual = computeOtherIncomeAnnual(otherIncome);
  const computed = computeCTC(
    parseFloat(monthly) || 0, parseInt(months) || 14,
    parseFloat(bonusPct) || 0,
    car, health,
    parseFloat(pensionPct) || 0,
    parseFloat(mealDaily) || 0,
    parseFloat(flexAnnual) || 0,
    phone, remote, otherAnnual,
  );

  const addOtherIncome = () => setOtherIncome(prev => [
    ...prev, { id: Date.now().toString(), description: '', amount: '', period: 'monthly' },
  ]);
  const removeOtherIncome = (id: string) => setOtherIncome(prev => prev.filter(i => i.id !== id));
  const updateOtherIncome = (id: string, field: keyof OtherIncome, value: string) =>
    setOtherIncome(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));

  function buildPackage() {
    return {
      country, fn, industry, seniority,
      monthly: parseFloat(monthly) || 0,
      months: parseInt(months) || 14,
      currency,
      bonus_pct: parseFloat(bonusPct) || 0,
      bonus_type: bonusType,
      car, health,
      pension_pct: parseFloat(pensionPct) || 0,
      meal_daily: parseFloat(mealDaily) || 0,
      flex_annual: parseFloat(flexAnnual) || 0,
      phone,
      remote,
      other_income_annual: Math.round(otherAnnual),
      other_income_items: otherIncome
        .filter(i => i.description && i.amount)
        .map(i => ({
          description: i.description,
          amount_annual: i.period === 'monthly' ? (parseFloat(i.amount) || 0) * 12 : parseFloat(i.amount) || 0,
        })),
      tier: 'premium',
      user_email: userEmail,
      user_name: userName,
    };
  }

  const runAnalysis = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(SRC_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPackage()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na análise');
      setResult(data);
      setStep(3);
    } catch (e: any) {
      setError(e.message || 'Erro na análise. Verifica os dados e tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  const step0Valid = !!(fn && industry && seniority);
  const step1Valid = parseFloat(monthly) > 0;

  const inputCls = "w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-xs text-[#1a1a1a] focus:border-[#C8A02A]/40 focus:outline-none bg-white placeholder:text-[#bbb]";
  const cardBtn = (active: boolean) =>
    `p-3 border rounded-lg text-left transition-all cursor-pointer ${active ? 'border-[#C8A02A] bg-[#C8A02A]/5' : 'border-[#e5e5e5] hover:border-[#C8A02A]/30 bg-white'}`;
  const sym = ({ EUR:'€', GBP:'£', USD:'$', CHF:'CHF', BRL:'R$', AOA:'Kz' } as Record<string,string>)[currency] ?? '€';

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className={`flex-1 h-1 rounded-full transition-all ${i <= step ? 'bg-[#C8A02A]' : 'bg-[#e5e5e5]'}`} />
        ))}
      </div>
      <div className="flex gap-1 mb-2">
        {STEPS.map((s, i) => (
          <span key={s} className={`flex-1 text-center text-[9px] font-medium uppercase tracking-wider transition-colors ${i === step ? 'text-[#C8A02A]' : 'text-[#ccc]'}`}>{s}</span>
        ))}
      </div>

      {/* STEP 0: CONTEXTO */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">País</label>
            <select value={country} onChange={e => setCountry(e.target.value)} className={inputCls}>
              {COUNTRIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">Função / Área</label>
            <select value={fn} onChange={e => setFn(e.target.value)} className={inputCls}>
              <option value="">Seleccionar...</option>
              {FUNCTIONS.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">Indústria</label>
            <select value={industry} onChange={e => setIndustry(e.target.value)} className={inputCls}>
              <option value="">Seleccionar...</option>
              {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">Senioridade</label>
            <select value={seniority} onChange={e => setSeniority(e.target.value)} className={inputCls}>
              <option value="">Seleccionar...</option>
              {SENIORITIES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <button
            onClick={() => setStep(1)}
            disabled={!step0Valid}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#C8A02A] to-[#a07c1e] text-white text-sm font-medium rounded-lg disabled:opacity-40 transition-all hover:opacity-90">
            Continuar <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 1: REMUNERAÇÃO */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">Salário base mensal</label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-[#999]">{sym}</span>
                <input type="number" value={monthly} onChange={e => setMonthly(e.target.value)}
                  placeholder="0" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">Meses/ano</label>
              <select value={months} onChange={e => setMonths(e.target.value)} className={inputCls}>
                {['12','13','14'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">Moeda</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)} className={inputCls}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">Bónus (%)</label>
              <div className="flex items-center gap-1">
                <input type="number" value={bonusPct} onChange={e => setBonusPct(e.target.value)}
                  placeholder="0" className={inputCls} />
                <span className="text-xs text-[#999]">%</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">Tipo de bónus</label>
              <select value={bonusType} onChange={e => setBonusType(e.target.value)} className={inputCls}>
                <option value="performance">Performance</option>
                <option value="guaranteed">Garantido</option>
                <option value="discretionary">Discricionário</option>
              </select>
            </div>
          </div>

          {/* Outros rendimentos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-[#999] uppercase tracking-wider">Outros rendimentos</label>
              <button onClick={addOtherIncome} className="flex items-center gap-1 text-[10px] text-[#C8A02A] hover:opacity-80">
                <Plus className="w-3 h-3" /> Adicionar
              </button>
            </div>
            {otherIncome.map(item => (
              <div key={item.id} className="flex gap-2 mb-2 items-center">
                <input type="text" placeholder="Descrição" value={item.description}
                  onChange={e => updateOtherIncome(item.id, 'description', e.target.value)}
                  className={`${inputCls} flex-1`} />
                <input type="number" placeholder="Valor" value={item.amount}
                  onChange={e => updateOtherIncome(item.id, 'amount', e.target.value)}
                  className={`${inputCls} w-20`} />
                <select value={item.period} onChange={e => updateOtherIncome(item.id, 'period', e.target.value as any)}
                  className={`${inputCls} w-24`}>
                  <option value="monthly">Mensal</option>
                  <option value="annual">Anual</option>
                </select>
                <button onClick={() => removeOtherIncome(item.id)} className="text-[#bbb] hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(0)}
              className="flex items-center gap-1 px-3 py-2.5 text-xs text-[#666] border border-[#e5e5e5] rounded-lg hover:bg-[#f5f5f4] transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" /> Voltar
            </button>
            <button onClick={() => setStep(2)} disabled={!step1Valid}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#C8A02A] to-[#a07c1e] text-white text-sm font-medium rounded-lg disabled:opacity-40 transition-all hover:opacity-90">
              Continuar <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: BENEFÍCIOS */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Viatura */}
          <div>
            <p className="text-[10px] text-[#999] uppercase tracking-wider mb-2">Viatura de empresa</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key:'none', label:'Sem viatura', sub:'—' },
                { key:'conventional', label:'Convencional', sub:'~€6k/ano' },
                { key:'ev_partial', label:'Eléctrico parcial', sub:'~€9k/ano' },
                { key:'ev_full', label:'Eléctrico total', sub:'~€14k/ano' },
              ].map(o => (
                <button key={o.key} onClick={() => setCar(o.key)} className={cardBtn(car === o.key)}>
                  <p className={`text-xs font-medium ${car === o.key ? 'text-[#C8A02A]' : 'text-[#1a1a1a]'}`}>{o.label}</p>
                  <p className="text-[10px] text-[#999] mt-0.5">{o.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Saúde */}
          <div>
            <p className="text-[10px] text-[#999] uppercase tracking-wider mb-2">Seguro de saúde</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key:'none', label:'Sem seguro', sub:'—' },
                { key:'self', label:'Colaborador', sub:'~€1.2k/ano' },
                { key:'family', label:'Família', sub:'~€2.4k/ano' },
              ].map(o => (
                <button key={o.key} onClick={() => setHealth(o.key)} className={cardBtn(health === o.key)}>
                  <p className={`text-xs font-medium ${health === o.key ? 'text-[#C8A02A]' : 'text-[#1a1a1a]'}`}>{o.label}</p>
                  <p className="text-[10px] text-[#999] mt-0.5">{o.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Telemóvel */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Smartphone className="w-3 h-3 text-[#999]" />
              <p className="text-[10px] text-[#999] uppercase tracking-wider">Telemóvel de empresa</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key:'none', label:'Sem telemóvel', sub:'—' },
                { key:'company', label:'Telemóvel empresa', sub:'~€600/ano' },
              ].map(o => (
                <button key={o.key} onClick={() => setPhone(o.key)} className={cardBtn(phone === o.key)}>
                  <p className={`text-xs font-medium ${phone === o.key ? 'text-[#C8A02A]' : 'text-[#1a1a1a]'}`}>{o.label}</p>
                  <p className="text-[10px] text-[#999] mt-0.5">{o.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Trabalho remoto */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Wifi className="w-3 h-3 text-[#999]" />
              <p className="text-[10px] text-[#999] uppercase tracking-wider">Trabalho Remoto</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key:'presencial', label:'Presencial', sub:'—' },
                { key:'hybrid', label:'Híbrido', sub:'~€100/mês' },
                { key:'full_remote', label:'Full Remote', sub:'~€200/mês' },
              ].map(o => (
                <button key={o.key} onClick={() => setRemote(o.key)} className={cardBtn(remote === o.key)}>
                  <p className={`text-xs font-medium ${remote === o.key ? 'text-[#C8A02A]' : 'text-[#1a1a1a]'}`}>{o.label}</p>
                  <p className="text-[10px] text-[#999] mt-0.5">{o.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* PPR + Meal + Flex */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">PPR Empresa (%)</label>
              <div className="flex items-center gap-1">
                <input type="number" value={pensionPct} onChange={e => setPensionPct(e.target.value)}
                  placeholder="0" className={inputCls} />
                <span className="text-xs text-[#999]">%</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">Alim. (€/dia)</label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-[#999]">€</span>
                <input type="number" value={mealDaily} onChange={e => setMealDaily(e.target.value)}
                  placeholder="0" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">Flex (€/ano)</label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-[#999]">€</span>
                <input type="number" value={flexAnnual} onChange={e => setFlexAnnual(e.target.value)}
                  placeholder="0" className={inputCls} />
              </div>
            </div>
          </div>

          {/* CTC total */}
          <div className="p-4 bg-[#0B1929] text-white rounded-xl flex items-center justify-between">
            <p className="text-xs font-medium text-white/70">Pacote Total Estimado</p>
            <p className="text-lg font-bold">{fmt(computed.ctc, currency)}</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>{error}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setStep(1)}
              className="flex items-center gap-1 px-3 py-2.5 text-xs text-[#666] border border-[#e5e5e5] rounded-lg hover:bg-[#f5f5f4] transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" /> Voltar
            </button>
            <button onClick={runAnalysis} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#C8A02A] to-[#a07c1e] text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-all hover:opacity-90">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> A analisar...</>
                : <><TrendingUp className="w-4 h-4" /> Ver análise completa — GRÁTIS</>
              }
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: RESULTADOS */}
      {step === 3 && result && (
        <div className="space-y-4">
          {/* Badge gratuito */}
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-700 font-medium">Análise completa — <strong>GRÁTIS</strong> para membros</p>
          </div>

          {/* CTC breakdown */}
          <div className="p-4 bg-[#0B1929] text-white rounded-xl">
            <p className="text-[10px] text-white/60 uppercase tracking-wider mb-1">Pacote Total Calculado</p>
            <p className="text-2xl font-bold">{fmt(computed.ctc, currency)}</p>
            <div className="mt-3 space-y-1">
              {([
                { label: 'Base anual', val: computed.base },
                computed.bonus > 0 ? { label: 'Bónus', val: computed.bonus } : null,
                computed.car > 0 ? { label: 'Viatura', val: computed.car } : null,
                computed.health > 0 ? { label: 'Saúde', val: computed.health } : null,
                computed.pension > 0 ? { label: 'PPR', val: computed.pension } : null,
                computed.meal > 0 ? { label: 'Refeição', val: computed.meal } : null,
                computed.flex > 0 ? { label: 'Flex', val: computed.flex } : null,
                computed.phone > 0 ? { label: 'Telemóvel', val: computed.phone } : null,
                computed.remote > 0 ? { label: 'Trabalho remoto', val: computed.remote } : null,
                computed.other > 0 ? { label: 'Outros rendimentos', val: computed.other } : null,
              ] as Array<{label:string;val:number}|null>).filter(Boolean).map((item) => (
                <div key={item!.label} className="flex justify-between text-[11px]">
                  <span className="text-white/60">{item!.label}</span>
                  <span className="text-white/90 font-medium">{fmt(item!.val, currency)}</span>
                </div>
              ))}
            </div>
          </div>

          {result.market_label && (
            <div className="p-3 bg-[#C8A02A]/5 border border-[#C8A02A]/20 rounded-lg">
              <p className="text-[10px] text-[#C8A02A] uppercase tracking-wider mb-0.5 font-medium">Posicionamento de mercado</p>
              <p className="text-sm text-[#1a1a1a] font-semibold">{result.market_label}</p>
            </div>
          )}

          {result.p50_base && (
            <div className="p-4 border border-[#e5e5e5] rounded-lg bg-white space-y-3">
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] text-[#999] uppercase tracking-wider font-medium">Benchmark — Base anual</p>
                <div className="relative group">
                  <svg className="w-3.5 h-3.5 text-[#bbb] cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 rounded-lg bg-[#333] text-white text-[10px] leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 z-50 shadow-lg">
                    Os percentis mostram como o teu salário se compara ao mercado: <strong>P25</strong> = 25% ganham menos, <strong>P50</strong> = mediana, <strong>P75</strong> = apenas 25% ganham mais, <strong>P90</strong> = top 10%.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#333]" />
                  </div>
                </div>
              </div>

              {[
                { label:'P25', val: result.p25_base, desc: '25% do mercado ganha abaixo deste valor' },
                { label:'P50', val: result.p50_base, desc: 'Mediana — valor central do mercado' },
                { label:'P75', val: result.p75_base, desc: 'Apenas 25% ganha acima deste valor' },
                { label:'P90', val: result.p90_base, desc: 'Top 10% — os mais bem pagos' },
              ].map(b => (
                <div key={b.label}>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-[#999] font-medium" title={b.desc}>{b.label}</span>
                    <span className="font-medium text-[#666]">{fmt(b.val, currency)}</span>
                  </div>
                  <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                    <div className="h-full bg-[#C8A02A]/40 rounded-full"
                      style={{ width: `${Math.min(100, (b.val / (result.p90_base * 1.1)) * 100)}%` }} />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-[#f0f0f0]">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-[#C8A02A] font-semibold">O teu pacote (base)</span>
                  <span className="font-bold text-[#C8A02A]">{fmt(computed.base, currency)}</span>
                </div>
                <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                  <div className="h-full bg-[#C8A02A] rounded-full"
                    style={{ width: `${Math.min(100, (computed.base / (result.p90_base * 1.1)) * 100)}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* Percentil total (premium) */}
          {result.percentile_total !== undefined && (
            <div className="p-4 bg-[#C8A02A]/5 border border-[#C8A02A]/20 rounded-xl text-center">
              <p className="text-[10px] text-[#C8A02A] uppercase tracking-wider mb-1">Percentil no mercado (CTC total)</p>
              <p className="text-3xl font-bold text-[#1a1a1a]">P{result.percentile_total}</p>
              <p className="text-xs text-[#666] mt-1">Estás acima de {result.percentile_total}% dos profissionais com este perfil</p>
            </div>
          )}

          {result.differentiators && (
            <div className="p-4 border border-[#e5e5e5] rounded-lg bg-white space-y-2">
              <p className="text-[10px] text-[#999] uppercase tracking-wider font-medium">Diferenciais detectados</p>
              {result.differentiators.map((d: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs text-[#555]">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /><span>{d}</span>
                </div>
              ))}
            </div>
          )}

          {result.strengths && (
            <div className="p-4 border border-[#e5e5e5] rounded-lg bg-white">
              <p className="text-[10px] text-emerald-700 uppercase tracking-wider font-medium mb-2">Pontos fortes do pacote</p>
              <p className="text-xs text-[#555] leading-relaxed">{result.strengths}</p>
            </div>
          )}

          {result.considerations && (
            <div className="p-4 border border-[#e5e5e5] rounded-lg bg-white">
              <p className="text-[10px] text-amber-700 uppercase tracking-wider font-medium mb-2">Considerações</p>
              <p className="text-xs text-[#555] leading-relaxed">{result.considerations}</p>
            </div>
          )}

          {result.strategic_advice && (
            <div className="p-4 border border-[#e5e5e5] rounded-lg bg-white">
              <p className="text-[10px] text-[#999] uppercase tracking-wider font-medium mb-1">Conselho estratégico</p>
              <p className="text-xs text-[#555] leading-relaxed">{result.strategic_advice}</p>
            </div>
          )}

          {result.negotiation_tips && (
            <div className="p-4 border border-[#C8A02A]/20 bg-[#C8A02A]/3 rounded-lg">
              <p className="text-[10px] text-[#C8A02A] uppercase tracking-wider font-medium mb-2">Dicas de negociação</p>
              <p className="text-xs text-[#555] leading-relaxed">{result.negotiation_tips}</p>
            </div>
          )}

          {result.red_flags && result.red_flags.length > 0 && result.red_flags[0] && (
            <div className="p-4 border border-red-100 bg-red-50/50 rounded-lg">
              <p className="text-[10px] text-red-700 uppercase tracking-wider font-medium mb-2">Red flags</p>
              {result.red_flags.map((f: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs text-red-700 mb-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>{f}</span>
                </div>
              ))}
            </div>
          )}

          {result.next_steps && result.next_steps.length > 0 && (
            <div className="p-4 border border-[#e5e5e5] rounded-lg bg-white">
              <p className="text-[10px] text-[#999] uppercase tracking-wider font-medium mb-2">Próximos passos</p>
              {result.next_steps.map((s: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs text-[#555] mb-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#0B1929]/10 flex items-center justify-center shrink-0 text-[9px] font-bold text-[#0B1929]">{i+1}</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => { setStep(0); setResult(null); setError(null); }}
            className="w-full text-[11px] text-[#999] hover:text-[#C8A02A] transition-colors py-1">
            ← Nova análise
          </button>
        </div>
      )}
    </div>
  );
}
