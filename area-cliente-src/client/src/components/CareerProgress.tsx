/**
 * Career Progress System — "O Meu Perfil de Carreira"
 * Scale: 0 → 1000 points across 5 levels
 * Calculates score from real user_analyses data + profile completeness
 */
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// ─── Types ──────────────────────────────────────────────────────────────────
type AnalysisRecord = {
  id: string;
  analysis_type: string;
  data: Record<string, any>;
  created_at: string;
};

// ─── Level Configuration ────────────────────────────────────────────────────
const LEVELS = [
  { name: 'Explorador', icon: '🌱', min: 0, max: 199, color: '#7A7A7A', bg: '#F1EFE8', desc: 'Estás a dar os primeiros passos. Faz a tua primeira análise para começar a subir.' },
  { name: 'Consciente', icon: '🔍', min: 200, max: 399, color: '#185FA5', bg: '#E6F1FB', desc: 'Já tens uma visão clara do ponto de partida. Continua a explorar as ferramentas.' },
  { name: 'Ativo', icon: '⚡', min: 400, max: 599, color: '#3B6D11', bg: '#EAF3DE', desc: 'Estás em movimento. As tuas análises mostram progressos concretos.' },
  { name: 'Estratégico', icon: '🚀', min: 600, max: 799, color: '#854F0B', bg: '#FAEEDA', desc: 'Tens uma estratégia definida. O mercado reconhece o teu posicionamento.' },
  { name: 'Elite', icon: '💎', min: 800, max: 1000, color: '#72243E', bg: '#FBEAF0', desc: 'Perfil de referência. Estás no topo do posicionamento de carreira.' },
];

const UNLOCKS = [
  { lv: 0, text: 'Acesso à plataforma e primeiros recursos' },
  { lv: 1, text: 'Badge no perfil + dicas personalizadas' },
  { lv: 2, text: 'Templates premium desbloqueados' },
  { lv: 3, text: 'Relatório PDF consolidado do perfil' },
  { lv: 4, text: 'Destaque na comunidade + desconto 1:1' },
];

// ─── Score Calculation ──────────────────────────────────────────────────────
function calculateScore(analyses: AnalysisRecord[], profile: any) {
  let score = 0;
  const factors: Record<string, { earned: number; max: number; tasks: { label: string; pts: number; done: boolean; bonus?: boolean }[] }> = {
    cv: { earned: 0, max: 250, tasks: [] },
    li: { earned: 0, max: 250, tasks: [] },
    cp: { earned: 0, max: 200, tasks: [] },
    ci: { earned: 0, max: 150, tasks: [] },
    eng: { earned: 0, max: 150, tasks: [] },
  };

  // ── CV (max 250) ──
  const cvAnalyses = analyses.filter(a => a.analysis_type === 'cv_analyser');
  const hasCvAnalysis = cvAnalyses.length > 0;
  const cvScore = cvAnalyses.reduce((best, a) => {
    const s = a.data?.overall_score || a.data?.score || a.data?.ats_score || 0;
    return Math.max(best, typeof s === 'number' ? s : 0);
  }, 0);
  const hasCvImprovement = cvAnalyses.length >= 2;

  factors.cv.tasks = [
    { label: 'Primeira análise feita', pts: 50, done: hasCvAnalysis },
    { label: 'Score do CV ≥ 60%', pts: 75, done: cvScore >= 60 },
    { label: 'Score do CV ≥ 85%', pts: 125, done: cvScore >= 85 },
    { label: 'Segunda análise (melhoria)', pts: 50, done: hasCvImprovement, bonus: true },
  ];

  // ── LinkedIn (max 250) ──
  const liAnalyses = analyses.filter(a => a.analysis_type === 'linkedin_roaster');
  const hasLiAnalysis = liAnalyses.length > 0;
  const liScore = liAnalyses.reduce((best, a) => {
    const s = a.data?.overall_score || a.data?.score || 0;
    return Math.max(best, typeof s === 'number' ? s : 0);
  }, 0);
  const hasLiImprovement = liAnalyses.length >= 2;

  factors.li.tasks = [
    { label: 'Primeira análise feita', pts: 50, done: hasLiAnalysis },
    { label: 'Score LinkedIn ≥ 60%', pts: 75, done: liScore >= 60 },
    { label: 'Score LinkedIn ≥ 85%', pts: 125, done: liScore >= 85 },
    { label: 'Perfil reanalisado após melhorias', pts: 50, done: hasLiImprovement, bonus: true },
  ];

  // ── Career Path (max 200) ──
  const cpAnalyses = analyses.filter(a => a.analysis_type === 'career_path');
  const hasCpAnalysis = cpAnalyses.length > 0;
  const cpMultiScenario = cpAnalyses.some(a => {
    const scenarios = a.data?.scenarios || a.data?.paths || [];
    return Array.isArray(scenarios) && scenarios.length > 1;
  });
  // Check if analyses in different months
  const cpMonths = new Set(cpAnalyses.map(a => a.created_at?.slice(0, 7)));
  const cpDifferentMonths = cpMonths.size >= 2;

  factors.cp.tasks = [
    { label: 'Análise feita', pts: 100, done: hasCpAnalysis },
    { label: 'Mais de 1 cenário explorado', pts: 50, done: cpMultiScenario },
    { label: 'Análise repetida em meses diferentes', pts: 50, done: cpDifferentMonths, bonus: true },
  ];

  // ── Career Intelligence (max 150) ──
  const ciAnalyses = analyses.filter(a => a.analysis_type === 'career_intelligence');
  const hasCi1 = ciAnalyses.length >= 1;
  const hasCi2 = ciAnalyses.length >= 2;

  factors.ci.tasks = [
    { label: 'Primeira análise', pts: 75, done: hasCi1 },
    { label: 'Segunda análise', pts: 75, done: hasCi2 },
  ];

  // ── Consistency & Engagement (max 150) ──
  const toolsUsed = new Set(analyses.map(a => a.analysis_type));
  const usedTools = ['cv_analyser', 'linkedin_roaster', 'career_path', 'career_intelligence'].filter(t => toolsUsed.has(t));
  const used2 = usedTools.length >= 2;
  const usedAll = usedTools.length >= 4;

  // Check if user returned after 30 days
  const dates = analyses.map(a => new Date(a.created_at).getTime()).sort();
  const returned30 = dates.length >= 2 && (dates[dates.length - 1] - dates[0]) >= 30 * 24 * 60 * 60 * 1000;

  // Profile completeness
  const profileComplete = !!(
    profile?.first_name &&
    profile?.last_name &&
    profile?.phone &&
    profile?.address &&
    profile?.linkedin_url &&
    profile?.cv_filename
  );

  factors.eng.tasks = [
    { label: 'Usou 2 ferramentas diferentes', pts: 30, done: used2 },
    { label: 'Usou todas as 4 ferramentas', pts: 50, done: usedAll },
    { label: 'Regressou após 30 dias', pts: 30, done: returned30, bonus: true },
    { label: 'Perfil 100% preenchido', pts: 40, done: profileComplete },
  ];

  // Calculate totals
  Object.values(factors).forEach(f => {
    f.tasks.forEach(t => {
      if (t.done) f.earned += t.pts;
    });
  });
  score = Object.values(factors).reduce((s, f) => s + f.earned, 0);

  return { score, factors, profileComplete };
}

function getLevelIndex(score: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (score >= LEVELS[i].min) return i;
  }
  return 0;
}

// ─── Factor Config ──────────────────────────────────────────────────────────
const FACTOR_META: Record<string, { name: string; icon: string; iconBg: string; color: string }> = {
  cv: { name: 'CV Analyser', icon: '📄', iconBg: '#EFF5FC', color: '#185FA5' },
  li: { name: 'LinkedIn Roaster', icon: '🔗', iconBg: '#EDF7F1', color: '#3B6D11' },
  cp: { name: 'Career Path', icon: '🗺️', iconBg: '#FBF3E7', color: '#854F0B' },
  ci: { name: 'Career Intelligence', icon: '🧠', iconBg: '#FBF0F4', color: '#72243E' },
  eng: { name: 'Consistência & Engajamento', icon: '⚡', iconBg: '#EEF7E8', color: '#27500A' },
};

// ─── Component ──────────────────────────────────────────────────────────────
export default function CareerProgress() {
  const { profile } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('user_analyses')
          .select('id, analysis_type, data, created_at')
          .eq('user_id', profile.id);
        if (data) setAnalyses(data as AnalysisRecord[]);
      } catch (e) {
        console.error('Error loading analyses for progress:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [profile?.id]);

  const { score, factors, profileComplete } = useMemo(
    () => calculateScore(analyses, profile),
    [analyses, profile]
  );

  const lvIdx = getLevelIndex(score);
  const lv = LEVELS[lvIdx];
  const next = LEVELS[lvIdx + 1];
  const lvProg = next ? Math.min((score - lv.min) / (next.min - lv.min), 1) * 100 : 100;

  // SVG ring
  const R = 42;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC - (score / 1000) * CIRC;

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="w-5 h-5 border-2 border-[#BFA14A]/30 border-t-[#BFA14A] rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Score Card */}
      <div className="bg-white border border-[#e5e5e5] rounded-xl p-5 shadow-sm">
        <div className="flex gap-5 items-center mb-5">
          {/* Ring */}
          <div className="relative w-[90px] h-[90px] flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-[90px] h-[90px]" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r={R} fill="none" stroke="#e5e5e5" strokeWidth="8" />
              <circle
                cx="50" cy="50" r={R} fill="none"
                stroke={lv.color} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={CIRC.toFixed(1)}
                strokeDashoffset={offset.toFixed(1)}
                style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1)' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-semibold text-[#1a1a1a]">{score}</span>
              <span className="text-[10px] text-[#999]">/ 1000</span>
            </div>
          </div>

          {/* Level Info */}
          <div className="flex-1">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-1"
              style={{ background: lv.bg, color: lv.color }}
            >
              {lv.icon} Nível {lvIdx + 1}
            </span>
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-0.5" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {lv.name}
            </h3>
            <p className="text-[11px] text-[#999] leading-relaxed mb-2">{lv.desc}</p>
            {next ? (
              <div className="flex items-center gap-2 text-[10px] text-[#999]">
                <span>{score}</span>
                <div className="flex-1 h-1 bg-[#e5e5e5] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${lvProg.toFixed(0)}%`, background: lv.color, transition: 'width 0.9s cubic-bezier(.4,0,.2,1)' }} />
                </div>
                <span>{next.min} · {next.name}</span>
              </div>
            ) : (
              <span className="text-[11px] font-semibold" style={{ color: lv.color }}>Nível máximo atingido ★</span>
            )}
          </div>
        </div>

        {/* Level Pips */}
        <div className="flex gap-1.5 mb-4">
          {LEVELS.map((l, i) => {
            const achieved = score >= l.min;
            const current = i === lvIdx;
            return (
              <div
                key={l.name}
                className={`flex-1 py-1.5 px-1 border rounded-lg text-center transition-all ${current ? 'border-2' : ''} ${achieved ? '' : 'opacity-35'}`}
                style={current ? { borderColor: l.color } : {}}
              >
                <div className="text-xs leading-none mb-0.5">{l.icon}</div>
                <div className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: achieved ? l.color : '' }}>{l.name}</div>
                <div className="text-[7px] text-[#999] mt-0.5">{l.min}–{l.max}</div>
              </div>
            );
          })}
        </div>

        {/* Unlocks */}
        <div className="text-[9px] font-semibold uppercase tracking-widest text-[#999] mb-2">O que cada nível desbloqueia</div>
        {UNLOCKS.map((u) => {
          const achieved = lvIdx >= u.lv;
          const l = LEVELS[u.lv];
          return (
            <div key={u.lv} className="flex items-center gap-2 py-1.5 border-t border-[#f0f0f0] first:border-t-0 text-[11px]">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: achieved ? l.color : '#e5e5e5' }} />
              <span className="flex-1" style={{ opacity: achieved ? 1 : 0.45 }}>{u.text}</span>
              <span
                className="text-[8px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{ background: achieved ? l.bg : '#f5f5f4', color: achieved ? l.color : '#999' }}
              >
                {l.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Factors */}
      <div className="text-[9px] font-semibold uppercase tracking-widest text-[#999] mb-1">Fatores de pontuação</div>
      {Object.entries(factors).map(([key, f]) => {
        const meta = FACTOR_META[key];
        const pct = f.max > 0 ? Math.round((f.earned / f.max) * 100) : 0;
        return (
          <div key={key} className="bg-white border border-[#e5e5e5] rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ background: meta.iconBg }}>
                {meta.icon}
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-[#1a1a1a]">{meta.name}</div>
                <div className="text-[10px] text-[#999]">{pct}% completo</div>
              </div>
              <div className="text-sm font-semibold text-[#1a1a1a]">
                {f.earned}<span className="text-[10px] text-[#999] font-normal"> / {f.max} pts</span>
              </div>
            </div>
            <div className="h-1 bg-[#e5e5e5] rounded-full overflow-hidden mb-3">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: meta.color, transition: 'width 0.7s cubic-bezier(.4,0,.2,1)' }} />
            </div>
            <div className="space-y-0">
              {f.tasks.map((t) => (
                <div key={t.label} className="flex items-center gap-2 py-1.5 border-t border-[#f5f5f4] first:border-t-0 text-[11px] text-[#999]">
                  <div
                    className="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0"
                    style={t.done ? { background: meta.color, borderColor: 'transparent' } : { borderColor: '#e5e5e5' }}
                  >
                    {t.done && (
                      <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                        <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className={`flex-1 ${t.done ? 'line-through text-[#ccc]' : ''}`}>
                    {t.label}
                    {t.bonus && <span className="ml-1 text-[9px] bg-[#f5f5f4] px-1.5 py-0.5 rounded text-[#999]">bónus</span>}
                  </span>
                  <span
                    className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: t.done ? meta.iconBg : '#f5f5f4', color: t.done ? meta.color : '#999' }}
                  >
                    +{t.pts}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* LinkedIn Badge */}
      {profileComplete && score >= 200 && (
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#0A66C2]/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="#0A66C2" className="w-4 h-4">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-[#1a1a1a]">Badge de Carreira</div>
              <div className="text-[10px] text-[#999]">Partilha o teu progresso no LinkedIn</div>
            </div>
          </div>
          {/* Badge Preview */}
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] rounded-lg p-4 text-center mb-3">
            <div className="text-2xl mb-1">{lv.icon}</div>
            <div className="text-white text-sm font-semibold mb-0.5">{profile?.first_name} {profile?.last_name}</div>
            <div className="text-[10px] font-medium mb-1" style={{ color: lv.color === '#7A7A7A' ? '#ccc' : lv.color }}>
              {lv.icon} {lv.name} · {score} pts
            </div>
            <div className="text-[9px] text-gray-400">Share2Inspire Career Profile</div>
            {/* Mini progress bar */}
            <div className="mt-2 mx-auto w-32 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(score / 1000) * 100}%`, background: lv.color === '#7A7A7A' ? '#ccc' : lv.color }} />
            </div>
          </div>
          <button
            onClick={() => {
              const text = `${lv.icon} Nível ${lv.name} na Share2Inspire!\n\nEstou a investir no meu posicionamento de carreira com a Share2Inspire. Já alcancei ${score}/1000 pontos no meu Perfil de Carreira.\n\n#Share2Inspire #CarreiraComEstratégia #DesenvolvimentoProfissional`;
              const url = 'https://share2inspire.pt';
              window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`, '_blank');
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90"
            style={{ background: '#0A66C2' }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Partilhar no LinkedIn
          </button>
        </div>
      )}
    </div>
  );
}
