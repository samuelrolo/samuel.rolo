/**
 * SalaryRealityCheck — Ferramenta de benchmark salarial
 * Passos: Contexto → Remuneração → Benefícios → Resultados
 */
import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Plus,
  Trash2,
} from 'lucide-react';

interface SalaryRealityCheckProps {
  userEmail?: string;
  userName?: string;
  isPro?: boolean;
  onPaymentRequest?: (analysisId: number, amount: number) => void;
}

export interface SalaryRealityCheckRef {
  unlockPremium: (analysisId: number) => void;
}

interface OtherIncome {
  id: string;
  description: string;
  amount: string;
  period: 'monthly' | 'annual';
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const browserAnonKey = (window as Window & { __SUPABASE_ANON_KEY__?: string }).__SUPABASE_ANON_KEY__;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || browserAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
const SRC_URL = `${SUPABASE_URL}/functions/v1/salary-reality-check`;

const COUNTRIES = ['Portugal', 'Spain', 'United Kingdom', 'France', 'Germany', 'Netherlands', 'Switzerland', 'Ireland', 'Belgium', 'Luxembourg', 'Brazil', 'Angola', 'Mozambique', 'United States', 'Canada'];
const FUNCTIONS = ['HR', 'Finance', 'Technology', 'Sales', 'Marketing', 'Operations', 'Legal', 'Consulting', 'Engineering', 'Product', 'Data/Analytics', 'Procurement', 'Risk & Compliance', 'Other'];
const INDUSTRIES = ['Financial Services', 'Technology', 'Consulting', 'Healthcare', 'Pharmaceuticals', 'Energy', 'Retail', 'Telecommunications', 'Automotive', 'FMCG', 'Media', 'Real Estate', 'Government', 'Education', 'Other'];
const SENIORITIES = ['Intern/Trainee', 'Junior (0-2y)', 'Mid-Level (2-5y)', 'Senior (5-10y)', 'Lead/Principal (7-12y)', 'Manager', 'Senior Manager', 'Director', 'VP', 'C-Level'];
const CURRENCIES = ['EUR', 'GBP', 'USD', 'CHF', 'BRL', 'AOA'];
const STEPS = ['context', 'compensation', 'benefits', 'results'] as const;

function fmt(n: number, currency = 'EUR', locale = 'pt-PT') {
  const sym = ({ EUR: '€', GBP: '£', USD: '$', CHF: 'CHF', BRL: 'R$', AOA: 'Kz' } as Record<string, string>)[currency] ?? '€';
  return `${sym}${Math.round(Number(n) || 0).toLocaleString(locale)}`;
}

function computeOtherIncomeAnnual(items: OtherIncome[]) {
  return items.reduce((sum, item) => {
    const val = parseFloat(item.amount) || 0;
    return sum + (item.period === 'monthly' ? val * 12 : val);
  }, 0);
}

function computeCTC(
  monthly: number,
  months: number,
  bonusPct: number,
  hasCar: boolean,
  hasHealth: boolean,
  pensionPct: number,
  mealDaily: number,
  flexAnnual: number,
  hasPhone: boolean,
  hasRemote: boolean,
  otherIncomeAnnual: number,
) {
  const base = monthly * months;
  const bonus = base * (bonusPct / 100);
  const car = hasCar ? 9000 : 0;
  const health = hasHealth ? 2400 : 0;
  const pension = base * (pensionPct / 100);
  const meal = mealDaily * 220;
  const flex = flexAnnual;
  const phone = hasPhone ? 600 : 0;
  const remote = hasRemote ? 1200 : 0;
  const other = otherIncomeAnnual;
  const ctc = base + bonus + car + health + pension + meal + flex + phone + remote + other;

  return { base, bonus, car, health, pension, meal, flex, phone, remote, other, ctc };
}

const SalaryRealityCheck = forwardRef<SalaryRealityCheckRef, SalaryRealityCheckProps>(function SalaryRealityCheck(
  { userEmail = '', userName = '', isPro = false, onPaymentRequest }: SalaryRealityCheckProps,
  ref,
) {
  const { lang } = useI18n();
  const pick = (pt: string, en: string, es: string) => ({ pt, en, es } as const)[lang as 'pt' | 'en' | 'es'] ?? en;
  const locale = pick('pt-PT', 'en-US', 'es-ES');
  const steps = STEPS.map((stepKey) => ({
    context: pick('CONTEXTO', 'CONTEXT', 'CONTEXTO'),
    compensation: pick('REMUNERAÇÃO', 'COMPENSATION', 'REMUNERACIÓN'),
    benefits: pick('BENEFÍCIOS', 'BENEFITS', 'BENEFICIOS'),
    results: pick('RESULTADOS', 'RESULTS', 'RESULTADOS'),
  }[stepKey]));

  const supportsPremiumUpgrade = Boolean(onPaymentRequest) && !isPro;

  const [step, setStep] = useState(0);

  // Step 0
  const [country, setCountry] = useState('Portugal');
  const [fn, setFn] = useState('');
  const [industry, setIndustry] = useState('');
  const [seniority, setSeniority] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [dependents, setDependents] = useState('0');
  const [disabilitySelf, setDisabilitySelf] = useState(false);
  const [disabilityDependent, setDisabilityDependent] = useState(false);

  // Step 1
  const [monthly, setMonthly] = useState('');
  const [months, setMonths] = useState('14');
  const [currency, setCurrency] = useState('EUR');
  const [bonusPct, setBonusPct] = useState('0');
  const [bonusType, setBonusType] = useState('performance');
  const [otherIncome, setOtherIncome] = useState<OtherIncome[]>([]);

  // Step 2
  const [hasCar, setHasCar] = useState(false);
  const [hasPhone, setHasPhone] = useState(false);
  const [hasHealth, setHasHealth] = useState(false);
  const [hasRemote, setHasRemote] = useState(false);
  const [pensionPct, setPensionPct] = useState('0');
  const [mealDaily, setMealDaily] = useState('0');
  const [flexAnnual, setFlexAnnual] = useState('0');

  // Results
  const [loading, setLoading] = useState(false);
  const [unlockingPremium, setUnlockingPremium] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [submittedBasePackage, setSubmittedBasePackage] = useState<Record<string, unknown> | null>(null);

  const otherAnnual = useMemo(() => computeOtherIncomeAnnual(otherIncome), [otherIncome]);
  const computed = useMemo(() => computeCTC(
    parseFloat(monthly) || 0,
    parseInt(months) || 14,
    parseFloat(bonusPct) || 0,
    hasCar,
    hasHealth,
    parseFloat(pensionPct) || 0,
    parseFloat(mealDaily) || 0,
    parseFloat(flexAnnual) || 0,
    hasPhone,
    hasRemote,
    otherAnnual,
  ), [monthly, months, bonusPct, hasCar, hasHealth, pensionPct, mealDaily, flexAnnual, hasPhone, hasRemote, otherAnnual]);

  const addOtherIncome = () => setOtherIncome((prev) => [
    ...prev,
    { id: Date.now().toString(), description: '', amount: '', period: 'monthly' },
  ]);

  const removeOtherIncome = (id: string) => setOtherIncome((prev) => prev.filter((i) => i.id !== id));
  const updateOtherIncome = (id: string, field: keyof OtherIncome, value: string) => {
    setOtherIncome((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  function buildBasePackage() {
    return {
      country,
      fn,
      industry,
      seniority,
      years_experience: parseFloat(yearsExperience) || 0,
      marital_status: 'single',
      dependents: Math.max(0, parseInt(dependents) || 0),
      disability_self: disabilitySelf,
      disability_dependent: disabilityDependent,
      monthly: parseFloat(monthly) || 0,
      months: parseInt(months) || 14,
      currency,
      bonus_pct: parseFloat(bonusPct) || 0,
      bonus_type: bonusType,
      car: hasCar ? 'company' : 'none',
      health: hasHealth ? 'family' : 'none',
      pension_pct: parseFloat(pensionPct) || 0,
      meal_daily: parseFloat(mealDaily) || 0,
      flex_annual: parseFloat(flexAnnual) || 0,
      phone: hasPhone ? 'company' : 'none',
      remote: hasRemote ? 'hybrid' : 'presencial',
      other_income_annual: Math.round(otherAnnual),
      other_income_items: otherIncome
        .filter((i) => i.description && i.amount)
        .map((i) => ({
          description: i.description,
          amount_annual: i.period === 'monthly' ? (parseFloat(i.amount) || 0) * 12 : parseFloat(i.amount) || 0,
        })),
      user_email: userEmail,
      user_name: userName,
    };
  }

  const runAnalysis = async (tier: 'free' | 'premium', analysisId?: number) => {
    setLoading(true);
    setError(null);
    setUnlockingPremium(tier === 'premium' && Boolean(analysisId));

    try {
      const basePackage = tier === 'premium' && submittedBasePackage ? submittedBasePackage : buildBasePackage();
      if (tier === 'free' || !submittedBasePackage) {
        setSubmittedBasePackage(basePackage);
      }

      const payload = {
        ...basePackage,
        tier,
        ...(analysisId ? { analysis_id: analysisId } : {}),
      };

      const res = await fetch(SRC_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || pick('Erro na análise', 'Analysis error', 'Error en el análisis'));
      }

      setResult(data);
      setStep(3);
    } catch (e: any) {
      setError(e.message || pick(
        'Erro na análise. Verifica os dados e tenta novamente.',
        'Analysis error. Check your data and try again.',
        'Error en el análisis. Revisa tus datos e inténtalo de nuevo.',
      ));
    } finally {
      setLoading(false);
      setUnlockingPremium(false);
    }
  };

  useImperativeHandle(ref, () => ({
    unlockPremium: (analysisId: number) => {
      if (!analysisId) return;
      void runAnalysis('premium', analysisId);
    },
  }), [submittedBasePackage]);

  const step0Valid = !!(fn && industry && seniority && yearsExperience !== '' && parseFloat(yearsExperience) >= 0);
  const step1Valid = parseFloat(monthly) > 0;

  const inputCls = 'w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-xs text-[#1a1a1a] focus:border-[#C8A02A]/40 focus:outline-none bg-white placeholder:text-[#bbb]';
  const sectionCard = 'p-4 border border-[#e5e5e5] rounded-lg bg-white';
  const sym = ({ EUR: '€', GBP: '£', USD: '$', CHF: 'CHF', BRL: 'R$', AOA: 'Kz' } as Record<string, string>)[currency] ?? '€';
  const resultComputed = result?.computed ?? computed;
  const benchmarkMedian = Number(result?.benchmark_median_total ?? result?.p50_total ?? resultComputed.ctc ?? 0);
  const benchmarkLow = Number(result?.benchmark_low_total ?? Math.round(benchmarkMedian * 0.7));
  const benchmarkHigh = Number(result?.benchmark_high_total ?? Math.round(benchmarkMedian * 1.3));
  const benchmarkPosition = Number(result?.ctc_position_percent ?? 50);
  const ctcGap = Math.round((resultComputed.ctc || 0) - benchmarkMedian);
  const canRequestPremium = supportsPremiumUpgrade && result?.analysis_id && typeof onPaymentRequest === 'function';
  const isPremiumResult = result?.meta?.tier === 'premium' || (!supportsPremiumUpgrade && result);

  const benefitRows = [
    { label: pick('Base anual', 'Annual base', 'Base anual'), val: resultComputed.base },
    resultComputed.bonus > 0 ? { label: pick('Bónus', 'Bonus', 'Bonus'), val: resultComputed.bonus } : null,
    resultComputed.car > 0 ? { label: pick('Carro da empresa', 'Company car', 'Coche de empresa'), val: resultComputed.car } : null,
    resultComputed.health > 0 ? { label: pick('Seguro de saúde', 'Health insurance', 'Seguro de salud'), val: resultComputed.health } : null,
    resultComputed.pension > 0 ? { label: 'PPR', val: resultComputed.pension } : null,
    resultComputed.meal > 0 ? { label: pick('Refeição', 'Meal', 'Comida'), val: resultComputed.meal } : null,
    resultComputed.flex > 0 ? { label: 'Flex', val: resultComputed.flex } : null,
    resultComputed.phone > 0 ? { label: pick('Telemóvel da empresa', 'Company phone', 'Teléfono de empresa'), val: resultComputed.phone } : null,
    resultComputed.remote > 0 ? { label: pick('Trabalho remoto / híbrido', 'Remote / hybrid work', 'Trabajo remoto / híbrido'), val: resultComputed.remote } : null,
    resultComputed.other > 0 ? { label: pick('Outros rendimentos', 'Other income', 'Otros ingresos'), val: resultComputed.other } : null,
  ].filter(Boolean) as Array<{ label: string; val: number }>;

  const checkboxOption = (
    checked: boolean,
    onChange: (value: boolean) => void,
    title: string,
    subtitle: string,
  ) => (
    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${checked ? 'border-[#C8A02A] bg-[#C8A02A]/5' : 'border-[#e5e5e5] bg-white hover:border-[#C8A02A]/30'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-[#d8d8d8] text-[#C8A02A] focus:ring-[#C8A02A]/30"
      />
      <div>
        <p className={`text-xs font-medium ${checked ? 'text-[#C8A02A]' : 'text-[#1a1a1a]'}`}>{title}</p>
        <p className="text-[10px] text-[#999] mt-0.5">{subtitle}</p>
      </div>
    </label>
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {steps.map((s, i) => (
          <div key={s} className={`flex-1 h-1 rounded-full transition-all ${i <= step ? 'bg-[#C8A02A]' : 'bg-[#e5e5e5]'}`} />
        ))}
      </div>
      <div className="flex gap-1 mb-2">
        {steps.map((s, i) => (
          <span key={s} className={`flex-1 text-center text-[9px] font-medium uppercase tracking-wider transition-colors ${i === step ? 'text-[#C8A02A]' : 'text-[#ccc]'}`}>{s}</span>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">{pick('Localização', 'Location', 'Ubicación')}</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls}>
              {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">{pick('Área de mercado / função', 'Market area / role', 'Área de mercado / función')}</label>
            <select value={fn} onChange={(e) => setFn(e.target.value)} className={inputCls}>
              <option value="">{pick('Selecionar...', 'Select...', 'Seleccionar...')}</option>
              {FUNCTIONS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">{pick('Indústria', 'Industry', 'Industria')}</label>
            <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputCls}>
              <option value="">{pick('Selecionar...', 'Select...', 'Seleccionar...')}</option>
              {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">{pick('Senioridade', 'Seniority', 'Senioridad')}</label>
              <select value={seniority} onChange={(e) => setSeniority(e.target.value)} className={inputCls}>
                <option value="">{pick('Selecionar...', 'Select...', 'Seleccionar...')}</option>
                {SENIORITIES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">{pick('Anos de experiência', 'Years of experience', 'Años de experiencia')}</label>
              <input
                type="number"
                min="0"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                placeholder="0"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">{pick('N.º de dependentes', 'Number of dependents', 'N.º de dependientes')}</label>
              <input
                type="number"
                min="0"
                value={dependents}
                onChange={(e) => setDependents(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="p-3 rounded-lg border border-dashed border-[#e5e5e5] bg-[#fafafa] flex items-center">
              <p className="text-[11px] text-[#666] leading-relaxed">
                {pick('Usamos estes dados para estimar o líquido mensal com retenção simplificada de IRS em Portugal.', 'We use this data to estimate monthly net salary with simplified Portuguese tax withholding.', 'Usamos estos datos para estimar el neto mensual con retención simplificada de Portugal.')}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {checkboxOption(
              disabilitySelf,
              setDisabilitySelf,
              pick('Tenho incapacidade igual ou superior a 65%', 'I have a disability of 65% or more', 'Tengo una discapacidad igual o superior al 65%'),
              pick('Aplicado apenas para estimativa fiscal do salário líquido.', 'Used only for the net salary tax estimate.', 'Se usa solo para la estimación fiscal del salario neto.'),
            )}
            {checkboxOption(
              disabilityDependent,
              setDisabilityDependent,
              pick('Tenho dependente com incapacidade igual ou superior a 65%', 'I have a dependent with a disability of 65% or more', 'Tengo un dependiente con una discapacidad igual o superior al 65%'),
              pick('Ajusta a estimativa fiscal mensal de forma simplificada.', 'Adjusts the monthly tax estimate in a simplified way.', 'Ajusta la estimación fiscal mensual de forma simplificada.'),
            )}
          </div>

          <button
            onClick={() => setStep(1)}
            disabled={!step0Valid}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#C8A02A] to-[#a07c1e] text-white text-sm font-medium rounded-lg disabled:opacity-40 transition-all hover:opacity-90"
          >
            {pick('Continuar', 'Continue', 'Continuar')} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">{pick('Salário base mensal', 'Monthly base salary', 'Salario base mensual')}</label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-[#999]">{sym}</span>
                <input type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} placeholder="0" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">{pick('Meses/ano', 'Months/year', 'Meses/año')}</label>
              <select value={months} onChange={(e) => setMonths(e.target.value)} className={inputCls}>
                {['12', '13', '14'].map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">{pick('Moeda', 'Currency', 'Moneda')}</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">{pick('Bónus (%)', 'Bonus (%)', 'Bonus (%)')}</label>
              <div className="flex items-center gap-1">
                <input type="number" value={bonusPct} onChange={(e) => setBonusPct(e.target.value)} placeholder="0" className={inputCls} />
                <span className="text-xs text-[#999]">%</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">{pick('Tipo de bónus', 'Bonus type', 'Tipo de bonus')}</label>
              <select value={bonusType} onChange={(e) => setBonusType(e.target.value)} className={inputCls}>
                <option value="performance">{pick('Performance', 'Performance', 'Desempeño')}</option>
                <option value="guaranteed">{pick('Garantido', 'Guaranteed', 'Garantizado')}</option>
                <option value="discretionary">{pick('Discricionário', 'Discretionary', 'Discrecional')}</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-[#999] uppercase tracking-wider">{pick('Outros rendimentos', 'Other income', 'Otros ingresos')}</label>
              <button onClick={addOtherIncome} className="flex items-center gap-1 text-[10px] text-[#C8A02A] hover:opacity-80">
                <Plus className="w-3 h-3" /> {pick('Adicionar', 'Add', 'Añadir')}
              </button>
            </div>
            {otherIncome.map((item) => (
              <div key={item.id} className="flex gap-2 mb-2 items-center">
                <input
                  type="text"
                  placeholder={pick('Descrição', 'Description', 'Descripción')}
                  value={item.description}
                  onChange={(e) => updateOtherIncome(item.id, 'description', e.target.value)}
                  className={`${inputCls} flex-1`}
                />
                <input
                  type="number"
                  placeholder={pick('Valor', 'Amount', 'Valor')}
                  value={item.amount}
                  onChange={(e) => updateOtherIncome(item.id, 'amount', e.target.value)}
                  className={`${inputCls} w-20`}
                />
                <select value={item.period} onChange={(e) => updateOtherIncome(item.id, 'period', e.target.value as OtherIncome['period'])} className={`${inputCls} w-24`}>
                  <option value="monthly">{pick('Mensal', 'Monthly', 'Mensual')}</option>
                  <option value="annual">{pick('Anual', 'Annual', 'Anual')}</option>
                </select>
                <button onClick={() => removeOtherIncome(item.id)} className="text-[#bbb] hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(0)} className="flex items-center gap-1 px-3 py-2.5 text-xs text-[#666] border border-[#e5e5e5] rounded-lg hover:bg-[#f5f5f4] transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" /> {pick('Voltar', 'Back', 'Volver')}
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!step1Valid}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#C8A02A] to-[#a07c1e] text-white text-sm font-medium rounded-lg disabled:opacity-40 transition-all hover:opacity-90"
            >
              {pick('Continuar', 'Continue', 'Continuar')} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {checkboxOption(
              hasCar,
              setHasCar,
              pick('Carro da empresa', 'Company car', 'Coche de empresa'),
              pick('Valorizado internamente em ~€9.000/ano.', 'Internally valued at ~€9,000/year.', 'Valorado internamente en ~€9.000/año.'),
            )}
            {checkboxOption(
              hasPhone,
              setHasPhone,
              pick('Telemóvel da empresa', 'Company phone', 'Teléfono de empresa'),
              pick('Valorizado internamente em ~€600/ano.', 'Internally valued at ~€600/year.', 'Valorado internamente en ~€600/año.'),
            )}
            {checkboxOption(
              hasHealth,
              setHasHealth,
              pick('Seguro de saúde', 'Health insurance', 'Seguro de salud'),
              pick('Usamos cobertura família (~€2.400/ano).', 'We use family coverage (~€2,400/year).', 'Usamos cobertura familiar (~€2.400/año).'),
            )}
            {checkboxOption(
              hasRemote,
              setHasRemote,
              pick('Trabalho remoto / híbrido', 'Remote / hybrid work', 'Trabajo remoto / híbrido'),
              pick('Valorizado internamente como híbrido (~€1.200/ano).', 'Internally valued as hybrid (~€1,200/year).', 'Valorado internamente como híbrido (~€1.200/año).'),
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">{pick('PPR empresa (%)', 'Company pension (%)', 'Plan de pensiones de empresa (%)')}</label>
              <div className="flex items-center gap-1">
                <input type="number" value={pensionPct} onChange={(e) => setPensionPct(e.target.value)} placeholder="0" className={inputCls} />
                <span className="text-xs text-[#999]">%</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">{pick('Alimentação (€/dia)', 'Meal allowance (€/day)', 'Comida (€/día)')}</label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-[#999]">€</span>
                <input type="number" value={mealDaily} onChange={(e) => setMealDaily(e.target.value)} placeholder="0" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">{pick('Flex (€/ano)', 'Flex (€ / year)', 'Flex (€ / año)')}</label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-[#999]">€</span>
                <input type="number" value={flexAnnual} onChange={(e) => setFlexAnnual(e.target.value)} placeholder="0" className={inputCls} />
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#0B1929] text-white rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white/70">{pick('Pacote total estimado', 'Estimated total package', 'Paquete total estimado')}</p>
              <p className="text-[11px] text-white/50 mt-0.5">{pick('Baseado no CTC total, incluindo benefícios valorizados internamente.', 'Based on total CTC, including internally valued benefits.', 'Basado en el CTC total, incluyendo beneficios valorados internamente.')}</p>
            </div>
            <p className="text-lg font-bold">{fmt(computed.ctc, currency, locale)}</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>{error}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex items-center gap-1 px-3 py-2.5 text-xs text-[#666] border border-[#e5e5e5] rounded-lg hover:bg-[#f5f5f4] transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" /> {pick('Voltar', 'Back', 'Volver')}
            </button>
            <button
              onClick={() => void runAnalysis(supportsPremiumUpgrade ? 'free' : 'premium')}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#C8A02A] to-[#a07c1e] text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-all hover:opacity-90"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {pick('A analisar...', 'Analyzing...', 'Analizando...')}</>
              ) : (
                <><TrendingUp className="w-4 h-4" /> {supportsPremiumUpgrade ? pick('Ver análise base', 'View base analysis', 'Ver análisis base') : pick('Ver análise completa — GRÁTIS', 'View full analysis — FREE', 'Ver análisis completo — GRATIS')}</>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 3 && result && (
        <div className="space-y-4">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isPremiumResult ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            <CheckCircle className={`w-4 h-4 shrink-0 ${isPremiumResult ? 'text-emerald-600' : 'text-amber-600'}`} />
            <p className={`text-xs font-medium ${isPremiumResult ? 'text-emerald-700' : 'text-amber-700'}`}>
              {isPremiumResult
                ? pick('Análise completa disponível.', 'Full analysis available.', 'Análisis completo disponible.')
                : pick('Análise base pronta. Podes desbloquear a versão premium com negociação e insights adicionais.', 'Base analysis ready. You can unlock the premium version with negotiation insights and additional detail.', 'Análisis base listo. Puedes desbloquear la versión premium con negociación e insights adicionales.')}
            </p>
          </div>

          <div className="p-4 bg-[#0B1929] text-white rounded-xl">
            <p className="text-[10px] text-white/60 uppercase tracking-wider mb-1">{pick('Pacote total calculado', 'Calculated total package', 'Paquete total calculado')}</p>
            <p className="text-2xl font-bold">{fmt(resultComputed.ctc, currency, locale)}</p>
            <div className="mt-3 space-y-1">
              {benefitRows.map((item) => (
                <div key={item.label} className="flex justify-between text-[11px]">
                  <span className="text-white/60">{item.label}</span>
                  <span className="text-white/90 font-medium">{fmt(item.val, currency, locale)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={sectionCard}>
              <p className="text-[10px] text-[#999] uppercase tracking-wider mb-1">{pick('Bruto mensal', 'Gross monthly', 'Bruto mensual')}</p>
              <p className="text-lg font-semibold text-[#1a1a1a]">{fmt(Number(result.gross_monthly || resultComputed.gross_monthly || 0), currency, locale)}</p>
            </div>
            <div className={sectionCard}>
              <p className="text-[10px] text-[#999] uppercase tracking-wider mb-1">{pick('Líquido mensal estimado', 'Estimated monthly net', 'Neto mensual estimado')}</p>
              <p className="text-lg font-semibold text-[#1a1a1a]">{fmt(Number(result.net_monthly || resultComputed.net_monthly || 0), currency, locale)}</p>
            </div>
            <div className={sectionCard}>
              <p className="text-[10px] text-[#999] uppercase tracking-wider mb-1">{pick('Segurança Social', 'Social Security', 'Seguridad Social')}</p>
              <p className="text-lg font-semibold text-[#1a1a1a]">{fmt(Number(result.ss_contribution || resultComputed.ss_contribution || 0), currency, locale)}</p>
              <p className="text-[10px] text-[#999] mt-1">{pick('Contribuição mensal do colaborador (11%).', 'Employee monthly contribution (11%).', 'Contribución mensual del empleado (11%).')}</p>
            </div>
            <div className={sectionCard}>
              <p className="text-[10px] text-[#999] uppercase tracking-wider mb-1">{pick('Taxa efectiva de IRS', 'Effective PIT rate', 'Tasa efectiva de IRPF')}</p>
              <p className="text-lg font-semibold text-[#1a1a1a]">{Number(result.irs_rate || resultComputed.irs_rate || 0).toFixed(1)}%</p>
              <p className="text-[10px] text-[#999] mt-1">{pick('Estimativa simplificada para Portugal 2025/2026.', 'Simplified estimate for Portugal 2025/2026.', 'Estimación simplificada para Portugal 2025/2026.')}</p>
            </div>
          </div>

          {result.market_label && (
            <div className="p-3 bg-[#C8A02A]/5 border border-[#C8A02A]/20 rounded-lg">
              <p className="text-[10px] text-[#C8A02A] uppercase tracking-wider mb-0.5 font-medium">{pick('Posicionamento de mercado', 'Market positioning', 'Posicionamiento de mercado')}</p>
              <p className="text-sm text-[#1a1a1a] font-semibold">{result.market_label}</p>
            </div>
          )}

          <div className="p-4 border border-[#e5e5e5] rounded-lg bg-white space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-[10px] text-[#999] uppercase tracking-wider font-medium">{pick('Benchmark simplificado — CTC total', 'Simplified benchmark — total CTC', 'Benchmark simplificado — CTC total')}</p>
                <p className="text-sm text-[#1a1a1a] font-semibold">{pick('Faixa baixa, mediana e faixa alta com base na mediana de mercado.', 'Low range, median and high range based on the market median.', 'Rango bajo, mediana y rango alto basados en la mediana del mercado.')}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#999] uppercase tracking-wider">{pick('A tua posição', 'Your position', 'Tu posición')}</p>
                <p className="text-sm font-semibold text-[#1a1a1a]">{result.position_label || pick('Dentro da faixa', 'Within range', 'Dentro del rango')}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-[#f8f7f4] p-3">
                <p className="text-[10px] text-[#999] uppercase tracking-wider mb-1">{pick('Mediana -30%', 'Median -30%', 'Mediana -30%')}</p>
                <p className="text-base font-semibold text-[#1a1a1a]">{fmt(benchmarkLow, currency, locale)}</p>
              </div>
              <div className="rounded-lg bg-[#C8A02A]/8 p-3 border border-[#C8A02A]/20">
                <p className="text-[10px] text-[#999] uppercase tracking-wider mb-1">{pick('Mediana', 'Median', 'Mediana')}</p>
                <p className="text-base font-semibold text-[#1a1a1a]">{fmt(benchmarkMedian, currency, locale)}</p>
              </div>
              <div className="rounded-lg bg-[#f8f7f4] p-3">
                <p className="text-[10px] text-[#999] uppercase tracking-wider mb-1">{pick('Mediana +30%', 'Median +30%', 'Mediana +30%')}</p>
                <p className="text-base font-semibold text-[#1a1a1a]">{fmt(benchmarkHigh, currency, locale)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] text-[#777] font-medium">
                <span>{pick('Faixa baixa', 'Low range', 'Rango bajo')}</span>
                <span>{pick('Mediana', 'Median', 'Mediana')}</span>
                <span>{pick('Faixa alta', 'High range', 'Rango alto')}</span>
              </div>
              <div className="relative h-3 rounded-full bg-gradient-to-r from-[#ece8da] via-[#C8A02A]/30 to-[#ece8da]">
                <div className="absolute inset-y-0 left-1/2 w-px bg-[#C8A02A]/50" />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#0B1929] border-2 border-white shadow"
                  style={{ left: `calc(${Math.max(2, Math.min(98, benchmarkPosition))}% - 8px)` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#555]">
                <span>{pick('O teu pacote total', 'Your total package', 'Tu paquete total')} <strong>{fmt(resultComputed.ctc, currency, locale)}</strong></span>
                <span className={`${ctcGap >= 0 ? 'text-emerald-700' : 'text-amber-700'} font-medium`}>
                  {ctcGap >= 0 ? '+' : ''}{fmt(ctcGap, currency, locale)} {pick('vs mediana', 'vs median', 'vs mediana')}
                </span>
              </div>
            </div>
          </div>

          {result.differentiators && (
            <div className="p-4 border border-[#e5e5e5] rounded-lg bg-white space-y-2">
              <p className="text-[10px] text-[#999] uppercase tracking-wider font-medium">{pick('Diferenciais detectados', 'Detected differentiators', 'Diferenciales detectados')}</p>
              {result.differentiators.map((d: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs text-[#555]">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /><span>{d}</span>
                </div>
              ))}
            </div>
          )}

          {result.market_context && (
            <div className={sectionCard}>
              <p className="text-[10px] text-[#0B1929] uppercase tracking-wider font-medium mb-2">{pick('Contexto de mercado', 'Market context', 'Contexto de mercado')}</p>
              <p className="text-xs text-[#555] leading-relaxed whitespace-pre-line">{result.market_context}</p>
            </div>
          )}

          {result.strengths && (
            <div className={sectionCard}>
              <p className="text-[10px] text-emerald-700 uppercase tracking-wider font-medium mb-2">{pick('Pontos fortes do pacote', 'Package strengths', 'Puntos fuertes del paquete')}</p>
              <p className="text-xs text-[#555] leading-relaxed whitespace-pre-line">{result.strengths}</p>
            </div>
          )}

          {result.considerations && (
            <div className={sectionCard}>
              <p className="text-[10px] text-amber-700 uppercase tracking-wider font-medium mb-2">{pick('Considerações', 'Considerations', 'Consideraciones')}</p>
              <p className="text-xs text-[#555] leading-relaxed whitespace-pre-line">{result.considerations}</p>
            </div>
          )}

          {result.strategic_advice && (
            <div className={sectionCard}>
              <p className="text-[10px] text-[#999] uppercase tracking-wider font-medium mb-1">{pick('Conselho estratégico', 'Strategic advice', 'Consejo estratégico')}</p>
              <p className="text-xs text-[#555] leading-relaxed whitespace-pre-line">{result.strategic_advice}</p>
            </div>
          )}

          {result.negotiation_tips && (
            <div className="p-4 border border-[#C8A02A]/20 bg-[#C8A02A]/3 rounded-lg">
              <p className="text-[10px] text-[#C8A02A] uppercase tracking-wider font-medium mb-2">{pick('Dicas de negociação', 'Negotiation tips', 'Consejos de negociación')}</p>
              <p className="text-xs text-[#555] leading-relaxed whitespace-pre-line">{result.negotiation_tips}</p>
            </div>
          )}

          {result.red_flags && result.red_flags.length > 0 && result.red_flags[0] && (
            <div className="p-4 border border-red-100 bg-red-50/50 rounded-lg">
              <p className="text-[10px] text-red-700 uppercase tracking-wider font-medium mb-2">{pick('Alertas', 'Red flags', 'Alertas')}</p>
              {result.red_flags.map((f: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs text-red-700 mb-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>{f}</span>
                </div>
              ))}
            </div>
          )}

          {result.next_steps && result.next_steps.length > 0 && (
            <div className={sectionCard}>
              <p className="text-[10px] text-[#999] uppercase tracking-wider font-medium mb-2">{pick('Próximos passos', 'Next steps', 'Próximos pasos')}</p>
              {result.next_steps.map((s: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs text-[#555] mb-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#0B1929]/10 flex items-center justify-center shrink-0 text-[9px] font-bold text-[#0B1929]">{i + 1}</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}

          {canRequestPremium && !result.negotiation_tips && (
            <div className="p-4 border border-[#C8A02A]/20 bg-[#C8A02A]/5 rounded-xl space-y-3">
              <div>
                <p className="text-[10px] text-[#C8A02A] uppercase tracking-wider font-medium mb-1">{pick('Upgrade premium', 'Premium upgrade', 'Upgrade premium')}</p>
                <p className="text-sm text-[#1a1a1a] font-semibold">{pick('Desbloqueia dicas de negociação e uma leitura premium do teu posicionamento.', 'Unlock negotiation tips and a premium interpretation of your positioning.', 'Desbloquea consejos de negociación y una lectura premium de tu posicionamiento.')}</p>
              </div>
              <button
                onClick={() => onPaymentRequest?.(Number(result.analysis_id), Number(result.payment_amount || 4.99))}
                disabled={loading || unlockingPremium}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#C8A02A] to-[#a07c1e] text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-all hover:opacity-90"
              >
                {unlockingPremium
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> {pick('A desbloquear...', 'Unlocking...', 'Desbloqueando...')}</>
                  : <>{pick('Desbloquear análise premium', 'Unlock premium analysis', 'Desbloquear análisis premium')}</>}
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>{error}</span>
            </div>
          )}

          <button
            onClick={() => {
              setStep(0);
              setResult(null);
              setError(null);
              setSubmittedBasePackage(null);
              setUnlockingPremium(false);
            }}
            className="w-full text-[11px] text-[#999] hover:text-[#C8A02A] transition-colors py-1"
          >
            ← {pick('Nova análise', 'New analysis', 'Nuevo análisis')}
          </button>
        </div>
      )}
    </div>
  );
});

export default SalaryRealityCheck;
