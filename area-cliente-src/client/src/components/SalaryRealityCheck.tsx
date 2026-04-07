/**
 * SalaryRealityCheck.tsx
 * Stack: React 19 + TypeScript + Tailwind CSS 4
 * Coloca em: area-cliente-src/client/src/components/SalaryRealityCheck.tsx
 */

import { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Loader2, CheckCircle, AlertCircle, TrendingUp, ChevronRight } from 'lucide-react';

const EDGE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co/functions/v1/salary-reality-check';
const SYM: Record<string, string> = { EUR: '€', GBP: '£', USD: '$', CHF: 'CHF' };
const STEPS = ['Contexto', 'Remuneração', 'Benefícios', 'Resultados'];
const COUNTRIES = ['Portugal','Espanha','França','Alemanha','Países Baixos','Reino Unido','Suíça','Irlanda','Estados Unidos','Brasil','Outro'];
const FUNCTIONS = ['HR / People','Finance','Technology / IT','Consulting / Advisory','Marketing','Operations','Legal','Sales / Commercial','Strategy','Engineering','Healthcare / Medical','Other'];
const INDUSTRIES = ['Pharmaceutical / Life Sciences','Financial Services / Banking','Technology / Software','Consulting / Professional Services','FMCG / Retail','Energy / Utilities','Telecomunicações','Healthcare','Manufacturing','Sector Público','Other'];
const SENIORITIES = ['Junior (0-3 anos)','Mid-level (3-6 anos)','Senior IC','Manager / Team Lead','Senior Manager','Director','VP / Head of','C-Suite / Partner'];

interface CompForm {
  country: string; fn: string; seniority: string; industry: string;
  monthly: string; currency: 'EUR'|'GBP'|'USD'|'CHF'; months: '12'|'13'|'14';
  bonus_pct: string; bonus_type: 'commercial'|'non-commercial';
  car: 'none'|'conventional'|'ev_partial'|'ev_full';
  health: 'none'|'self'|'family';
  pension_pct: string; meal: string; flex: string;
}

interface AnalysisResult {
  percentile_base: number; percentile_total: number;
  p25_base: number; p50_base: number; p75_base: number; p90_base: number;
  p25_total: number; p50_total: number; p75_total: number; p90_total: number;
  market_label: string; differentiators: string[];
  strengths: string; considerations: string; strategic_advice: string;
  negotiation_tips?: string; red_flags?: string[]; next_steps?: string[];
  analysis_id?: number; payment_amount?: number;
}

export interface SalaryRealityCheckRef {
  unlockPremium: (analysisId: number) => Promise<void>;
}

interface Props {
  userEmail?: string; userName?: string; isPro?: boolean;
  onPaymentRequest?: (analysisId: number, amount: number, type: string) => void;
}

function fmt(n: number) { return Math.round(n).toLocaleString('pt-PT'); }

function computeCTC(f: CompForm) {
  const base = parseFloat(f.monthly||'0') * parseFloat(f.months);
  const bonus = base * (parseFloat(f.bonus_pct||'0') / 100);
  const car = ({none:0,conventional:6000,ev_partial:9000,ev_full:14000} as Record<string,number>)[f.car];
  const health = ({none:0,self:1200,family:2400} as Record<string,number>)[f.health];
  const pension = base * (parseFloat(f.pension_pct||'0') / 100);
  const meal = parseFloat(f.meal||'0') * 220;
  const flex = parseFloat(f.flex||'0');
  return { base, bonus, car, health, pension, meal, flex, ctc: base+bonus+car+health+pension+meal+flex };
}

function PctBar({ label, pct, p25, p50, p75, p90, sym, dark, locked }: {
  label:string; pct:number; p25:number; p50:number; p75:number; p90:number;
  sym:string; dark?:boolean; locked:boolean;
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[11px] text-[#666]">{label}</span>
        {locked
          ? <span className="text-[10px] font-semibold text-[#999] bg-[#f5f5f4] px-2 py-0.5 rounded border border-[#e5e5e5]">🔒 Desbloquear</span>
          : <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20">P{pct}</span>
        }
      </div>
      <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${dark ? 'bg-[#1a1a1a]' : 'bg-gold'}`} style={{width:`${pct}%`}} />
      </div>
      <div className="flex justify-between mt-1">
        {[['P25',p25],['P50',p50],['P75',p75],['P90',p90]].map(([l,v])=>(
          <span key={l as string} className="text-[9px] text-[#ccc]">{l}: {sym}{fmt(v as number)}</span>
        ))}
      </div>
    </div>
  );
}

const SalaryRealityCheck = forwardRef<SalaryRealityCheckRef, Props>(
  ({ userEmail='', userName='', isPro=false, onPaymentRequest }, ref) => {

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CompForm>({
    country:'Portugal', fn:'', seniority:'', industry:'',
    monthly:'', currency:'EUR', months:'14',
    bonus_pct:'', bonus_type:'non-commercial',
    car:'none', health:'none', pension_pct:'', meal:'', flex:'',
  });
  const [loading, setLoading] = useState(false);
  const [freeResult, setFreeResult] = useState<AnalysisResult|null>(null);
  const [premium, setPremium] = useState<AnalysisResult|null>(null);
  const [analysisId, setAnalysisId] = useState<number|null>(null);
  const [error, setError] = useState<string|null>(null);

  const u = useCallback(<K extends keyof CompForm>(k: K, v: CompForm[K]) => {
    setForm(f => ({...f, [k]:v}));
  }, []);

  const c = computeCTC(form);
  const sym = SYM[form.currency] || '€';

  useImperativeHandle(ref, () => ({
    unlockPremium: async (aId: number) => {
      if (!freeResult) return;
      setLoading(true); setError(null);
      try {
        const res = await fetch(EDGE_URL, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            country:form.country, fn:form.fn, industry:form.industry,
            seniority:form.seniority, monthly:parseFloat(form.monthly),
            currency:form.currency, months:parseFloat(form.months),
            bonus_pct:parseFloat(form.bonus_pct||'0'), bonus_type:form.bonus_type,
            car:form.car, health:form.health,
            pension_pct:parseFloat(form.pension_pct||'0'),
            meal_daily:parseFloat(form.meal||'0'),
            flex_annual:parseFloat(form.flex||'0'),
            tier:'premium', analysis_id:aId, payment_method:'stripe',
            user_email:userEmail, user_name:userName,
          }),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error||`HTTP ${res.status}`); }
        setPremium(await res.json());
      } catch(e) {
        setError(e instanceof Error ? e.message : 'Erro ao desbloquear análise premium.');
      }
      setLoading(false);
    },
  }));

  async function analyse() {
    setLoading(true); setError(null);
    try {
      const res = await fetch(EDGE_URL, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          country:form.country, fn:form.fn, industry:form.industry,
          seniority:form.seniority, monthly:parseFloat(form.monthly),
          currency:form.currency, months:parseFloat(form.months),
          bonus_pct:parseFloat(form.bonus_pct||'0'), bonus_type:form.bonus_type,
          car:form.car, health:form.health,
          pension_pct:parseFloat(form.pension_pct||'0'),
          meal_daily:parseFloat(form.meal||'0'),
          flex_annual:parseFloat(form.flex||'0'),
          tier:'free', user_email:userEmail, user_name:userName,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AnalysisResult = await res.json();
      setFreeResult(data);
      if (data.analysis_id) setAnalysisId(data.analysis_id);
      setStep(3);
    } catch { setError('Erro na análise. Verifica os dados e tenta novamente.'); }
    setLoading(false);
  }

  const result = premium || freeResult;

  return (
    <div>
      {/* Step tabs */}
      <div className="flex border-b border-[#e5e5e5] mb-5">
        {STEPS.map((s,i)=>(
          <div key={s} className={`flex-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wider transition-colors ${
            i===step ? 'text-gold border-b-2 border-gold' : i<step ? 'text-[#888]' : 'text-[#ccc]'
          }`}>{s}</div>
        ))}
      </div>

      {/* Step 0 */}
      {step===0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              {label:'País', opts:COUNTRIES, field:'country' as const},
              {label:'Função', opts:FUNCTIONS, field:'fn' as const},
              {label:'Indústria', opts:INDUSTRIES, field:'industry' as const},
              {label:'Senioridade', opts:SENIORITIES, field:'seniority' as const},
            ].map(({label,opts,field})=>(
              <div key={field}>
                <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1">{label}</label>
                <select value={form[field]} onChange={e=>u(field, e.target.value)}
                  className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-xs text-[#1a1a1a] focus:border-gold/30 focus:outline-none bg-white">
                  {field!=='country' && <option value="">Seleciona...</option>}
                  {opts.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button onClick={()=>setStep(1)} disabled={!form.fn||!form.industry||!form.seniority}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[#1a1a1a] to-[#333] text-white text-xs font-medium rounded-lg disabled:opacity-40 hover:from-[#333] hover:to-[#444] transition-all">
              Continuar <ChevronRight className="w-3.5 h-3.5"/>
            </button>
          </div>
        </div>
      )}

      {/* Step 1 */}
      {step===1 && (
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1">Salário mensal bruto</label>
            <div className="flex border border-[#e5e5e5] rounded overflow-hidden focus-within:border-gold/30">
              <span className="bg-[#fafaf9] px-3 flex items-center text-xs text-[#999] border-r border-[#e5e5e5]">{sym}</span>
              <input type="number" placeholder="0" value={form.monthly} onChange={e=>u('monthly',e.target.value)}
                className="flex-1 px-3 py-2 text-sm outline-none bg-white"/>
              <select value={form.currency} onChange={e=>u('currency',e.target.value as CompForm['currency'])}
                className="bg-[#fafaf9] border-l border-[#e5e5e5] px-2 text-xs outline-none w-20">
                {['EUR','GBP','USD','CHF'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1.5">Meses de salário</label>
            <div className="flex gap-2">
              {(['12','13','14'] as const).map(m=>(
                <button key={m} onClick={()=>u('months',m)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${form.months===m ? 'bg-gold text-[#1a1a1a] border-gold' : 'bg-white text-[#666] border-[#e5e5e5] hover:border-gold/40'}`}>
                  {m} meses
                </button>
              ))}
            </div>
          </div>
          {form.monthly && parseFloat(form.monthly)>0 && (
            <div className="flex items-center justify-between bg-[#1a1a1a] rounded-lg px-4 py-3">
              <span className="text-[10px] text-white/50 uppercase tracking-wider">Base anual estimada</span>
              <span className="text-base font-bold text-gold">{sym}{fmt(c.base)}</span>
            </div>
          )}
          <div className="h-px bg-[#f0f0f0]"/>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1">Bónus target (%)</label>
              <div className="flex border border-[#e5e5e5] rounded overflow-hidden focus-within:border-gold/30">
                <input type="number" placeholder="0" value={form.bonus_pct} onChange={e=>u('bonus_pct',e.target.value)}
                  className="flex-1 px-3 py-2 text-sm outline-none bg-white"/>
                <span className="bg-[#fafaf9] px-3 flex items-center text-xs text-[#999] border-l border-[#e5e5e5]">%</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1.5">Tipo</label>
              <div className="flex gap-2">
                {[{v:'commercial',l:'Comercial'},{v:'non-commercial',l:'Não-comercial'}].map(({v,l})=>(
                  <button key={v} onClick={()=>u('bonus_type',v as CompForm['bonus_type'])}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${form.bonus_type===v ? 'bg-gold text-[#1a1a1a] border-gold' : 'bg-white text-[#666] border-[#e5e5e5] hover:border-gold/40'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-between">
            <button onClick={()=>setStep(0)} className="text-xs text-[#999] hover:text-[#1a1a1a]">← Voltar</button>
            <button onClick={()=>setStep(2)} disabled={!form.monthly||parseFloat(form.monthly)<=0}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[#1a1a1a] to-[#333] text-white text-xs font-medium rounded-lg disabled:opacity-40 hover:from-[#333] hover:to-[#444] transition-all">
              Continuar <ChevronRight className="w-3.5 h-3.5"/>
            </button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step===2 && (
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1.5">Viatura de empresa</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[{v:'none',t:'Sem viatura',s:'—'},{v:'conventional',t:'Convencional',s:'~€6k/ano'},{v:'ev_partial',t:'EV parcial',s:'~€9k/ano'},{v:'ev_full',t:'EV full use',s:'~€14k/ano'}].map(({v,t,s})=>(
                <button key={v} onClick={()=>u('car',v as CompForm['car'])}
                  className={`text-left rounded-lg border p-2.5 text-xs transition-all ${form.car===v ? 'border-gold/50 bg-gold/5' : 'border-[#e5e5e5] hover:border-gold/30'}`}>
                  <div className={`font-semibold ${form.car===v?'text-gold':'text-[#1a1a1a]'}`}>{t}</div>
                  <div className="text-[#999] mt-0.5">{s}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1.5">Seguro de saúde</label>
            <div className="grid grid-cols-3 gap-2">
              {[{v:'none',t:'Sem seguro',s:'—'},{v:'self',t:'Colaborador',s:'~€1.2k/ano'},{v:'family',t:'Família',s:'~€2.4k/ano'}].map(({v,t,s})=>(
                <button key={v} onClick={()=>u('health',v as CompForm['health'])}
                  className={`text-left rounded-lg border p-2.5 text-xs transition-all ${form.health===v ? 'border-gold/50 bg-gold/5' : 'border-[#e5e5e5] hover:border-gold/30'}`}>
                  <div className={`font-semibold ${form.health===v?'text-gold':'text-[#1a1a1a]'}`}>{t}</div>
                  <div className="text-[#999] mt-0.5">{s}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[{label:'PPR empresa (%)',field:'pension_pct' as const,suffix:'%'},{label:'Alim. (€/dia)',field:'meal' as const,prefix:sym},{label:'Flex (€/ano)',field:'flex' as const,prefix:sym}].map(({label,field,suffix,prefix})=>(
              <div key={field}>
                <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1">{label}</label>
                <div className="flex border border-[#e5e5e5] rounded overflow-hidden focus-within:border-gold/30">
                  {prefix && <span className="bg-[#fafaf9] px-2 flex items-center text-xs text-[#999] border-r border-[#e5e5e5]">{prefix}</span>}
                  <input type="number" placeholder="0" value={form[field]} onChange={e=>u(field,e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs outline-none bg-white"/>
                  {suffix && <span className="bg-[#fafaf9] px-2 flex items-center text-xs text-[#999] border-l border-[#e5e5e5]">{suffix}</span>}
                </div>
              </div>
            ))}
          </div>
          {c.ctc>0 && (
            <div className="flex items-center justify-between bg-[#1a1a1a] rounded-lg px-4 py-3">
              <span className="text-[10px] text-white/50 uppercase tracking-wider">Pacote total estimado</span>
              <span className="text-base font-bold text-gold">{sym}{fmt(c.ctc)}</span>
            </div>
          )}
          {error && <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2"><AlertCircle className="w-3.5 h-3.5 shrink-0"/>{error}</div>}
          <div className="flex justify-between">
            <button onClick={()=>setStep(1)} className="text-xs text-[#999] hover:text-[#1a1a1a]">← Voltar</button>
            <button onClick={analyse} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#1a1a1a] to-[#333] text-white text-xs font-medium rounded-lg disabled:opacity-40 hover:from-[#333] hover:to-[#444] transition-all">
              {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/> A analisar...</> : <><TrendingUp className="w-3.5 h-3.5"/> Ver posicionamento</>}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step===3 && (
        <div>
          {loading && <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin text-gold mx-auto mb-2"/><p className="text-xs text-[#999]">A calcular o teu posicionamento...</p></div>}
          {!loading && result && (
            <>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[{l:'Base Anual',v:sym+fmt(c.base),d:false},{l:'CTC Total',v:sym+fmt(c.ctc),d:true},{l:'Bónus',v:sym+fmt(c.bonus),d:false}].map(m=>(
                  <div key={m.l} className={`rounded-lg p-3 ${m.d ? 'bg-[#1a1a1a]' : 'bg-[#fafaf9] border border-[#e5e5e5]'}`}>
                    <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${m.d?'text-white/40':'text-[#999]'}`}>{m.l}</div>
                    <div className={`text-base font-bold ${m.d?'text-gold':'text-[#1a1a1a]'}`}>{m.v}</div>
                  </div>
                ))}
              </div>
              <div className="bg-[#fafaf9] border-l-2 border-gold rounded-lg px-4 py-3 mb-4">
                <div className="text-[10px] text-[#999] uppercase tracking-wider mb-1">Leitura de mercado</div>
                <div className="text-sm font-semibold text-[#1a1a1a]">{result.market_label}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(result.differentiators||[]).map((d,i)=>(
                    <span key={i} className="bg-gold/10 text-gold/80 border border-gold/20 rounded-full px-2.5 py-0.5 text-[10px] font-medium">{d}</span>
                  ))}
                </div>
              </div>
              <div className="text-[10px] text-[#999] uppercase tracking-wider mb-3">Posicionamento · {form.country}</div>
              <PctBar label={`Base anual · ${form.fn}`} pct={result.percentile_base} p25={result.p25_base} p50={result.p50_base} p75={result.p75_base} p90={result.p90_base} sym={sym} dark locked={!premium}/>
              <PctBar label="Pacote total (CTC)" pct={result.percentile_total} p25={result.p25_total} p50={result.p50_total} p75={result.p75_total} p90={result.p90_total} sym={sym} locked={!premium}/>

              {premium ? (
                <div className="space-y-3 mt-4 pt-4 border-t border-[#f0f0f0]">
                  <div className="flex items-center gap-2 text-xs text-emerald-600 mb-2"><CheckCircle className="w-3.5 h-3.5"/> Análise premium desbloqueada</div>
                  {[{t:'Pontos fortes',c:premium.strengths,navy:false},{t:'A ter em conta',c:premium.considerations,navy:false},{t:'Conselho estratégico',c:premium.strategic_advice,navy:true}].map((s,i)=>(
                    <div key={i} className={`p-3 rounded-lg border text-xs leading-relaxed ${s.navy ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white/70' : 'bg-[#fafaf9] border-[#e5e5e5] text-[#555]'}`}>
                      <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${s.navy?'text-gold':'text-[#999]'}`}>{s.t}</div>
                      {s.c}
                    </div>
                  ))}
                  {premium.negotiation_tips && (
                    <div className="p-3 bg-[#fafaf9] border border-[#e5e5e5] rounded-lg text-xs text-[#555] leading-relaxed">
                      <div className="text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-1">Tips de negociação</div>
                      {premium.negotiation_tips}
                    </div>
                  )}
                  {(premium.next_steps||[]).length>0 && (
                    <div className="p-3 bg-[#fafaf9] border border-[#e5e5e5] rounded-lg">
                      <div className="text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-2">Próximos passos</div>
                      <ol className="space-y-1">{premium.next_steps!.map((s,i)=>(<li key={i} className="flex items-start gap-2 text-xs text-[#555]"><span className="text-gold font-bold shrink-0">{i+1}.</span>{s}</li>))}</ol>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 border border-gold/30 rounded-xl overflow-hidden">
                  <div className="p-4 filter blur-sm pointer-events-none select-none">
                    <div className="grid grid-cols-3 gap-2">
                      {[{t:'Pontos fortes',c:freeResult?.strengths||''},{t:'A ter em conta',c:freeResult?.considerations||''},{t:'Conselho estratégico',c:freeResult?.strategic_advice||''}].map((s,i)=>(
                        <div key={i} className={`p-2.5 rounded-lg text-xs leading-relaxed ${i===2 ? 'bg-[#1a1a1a] text-white/60' : 'bg-[#fafaf9] border border-[#e5e5e5] text-[#555]'}`}>
                          <div className={`text-[10px] font-bold uppercase mb-1 ${i===2?'text-gold':'text-[#999]'}`}>{s.t}</div>
                          {s.c}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 justify-center mt-3">
                      <span className="text-xs font-bold text-gold bg-gold/10 px-3 py-1 rounded">P{freeResult?.percentile_base} base</span>
                      <span className="text-xs font-bold text-gold bg-gold/10 px-3 py-1 rounded">P{freeResult?.percentile_total} CTC</span>
                    </div>
                  </div>
                  <div className="bg-[#1a1a1a] px-5 py-4 text-center">
                    <div className="text-gold font-bold text-sm mb-1">✦ Desbloqueia a análise completa</div>
                    <div className="text-white/50 text-xs mb-3">Percentil exacto · Análise detalhada · Conselho estratégico · Tips de negociação</div>
                    <div className="text-white/40 text-[11px] mb-3">A partir de <strong className="text-gold">€4,99</strong> · Acesso imediato{isPro && <span className="ml-2 text-emerald-400">· -50% Pro</span>}</div>
                    <button onClick={()=>analysisId && onPaymentRequest?.(analysisId, freeResult?.payment_amount||4.99, 'salary_reality_check')}
                      className="w-full py-2.5 bg-gold text-[#1a1a1a] font-bold text-sm rounded-lg hover:bg-gold/90 transition-colors">
                      Ver análise completa →
                    </button>
                  </div>
                </div>
              )}

              {error && <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mt-3"><AlertCircle className="w-3.5 h-3.5 shrink-0"/>{error}</div>}
              <div className="mt-4 pt-3 border-t border-[#f0f0f0]">
                <button onClick={()=>{setStep(0);setFreeResult(null);setPremium(null);setAnalysisId(null);setError(null);}} className="text-xs text-[#999] hover:text-[#1a1a1a] underline">← Nova análise</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
});

SalaryRealityCheck.displayName = 'SalaryRealityCheck';
export default SalaryRealityCheck;
