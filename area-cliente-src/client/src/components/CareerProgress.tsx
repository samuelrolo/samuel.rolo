/**
 * Career Progress System — "O Meu Perfil de Carreira"
 * Scale: 0 → 1000 points across 5 levels
 * Calculates score from real user_analyses data + profile completeness
 * Supports two variants:
 *   - compact: shows only level badge, score ring, description (for MemberArea)
 *   - detailed: shows full breakdown with factors and badge (for Dashboard/Profile)
 * Includes "i" info popup explaining levels and Elite rewards
 * Fully i18n-aware via lang prop
 */
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { Info, X, Gift, Trophy, Award } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
type AnalysisRecord = {
  id: string;
  analysis_type: string;
  data: Record<string, any>;
  created_at: string;
};

type CareerProgressProps = {
  variant?: 'compact' | 'detailed';
};

// ─── Level Configuration ────────────────────────────────────────────────────
const LEVEL_KEYS = ['explorer', 'aware', 'active', 'strategic', 'elite'] as const;
const LEVEL_ICONS = ['🌱', '🔍', '⚡', '🚀', '💎'];
const LEVEL_RANGES = [
  { min: 0, max: 199 },
  { min: 200, max: 399 },
  { min: 400, max: 599 },
  { min: 600, max: 799 },
  { min: 800, max: 1000 },
];
const LEVEL_COLORS = [
  { color: '#7A7A7A', bg: '#F1EFE8' },
  { color: '#185FA5', bg: '#E6F1FB' },
  { color: '#3B6D11', bg: '#EAF3DE' },
  { color: '#854F0B', bg: '#FAEEDA' },
  { color: '#72243E', bg: '#FBEAF0' },
];

// ─── Score Calculation ──────────────────────────────────────────────────────
function calculateScore(analyses: AnalysisRecord[], profile: any, t: (key: string) => string) {
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
    { label: t('cp.task.firstAnalysis'), pts: 50, done: hasCvAnalysis },
    { label: t('cp.task.cvScore60'), pts: 75, done: cvScore >= 60 },
    { label: t('cp.task.cvScore85'), pts: 125, done: cvScore >= 85 },
    { label: t('cp.task.secondAnalysis'), pts: 50, done: hasCvImprovement, bonus: true },
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
    { label: t('cp.task.firstAnalysis'), pts: 50, done: hasLiAnalysis },
    { label: t('cp.task.liScore60'), pts: 75, done: liScore >= 60 },
    { label: t('cp.task.liScore85'), pts: 125, done: liScore >= 85 },
    { label: t('cp.task.liReanalysed'), pts: 50, done: hasLiImprovement, bonus: true },
  ];

  // ── Career Path (max 200) ──
  const cpAnalyses = analyses.filter(a => a.analysis_type === 'career_path');
  const hasCp1 = cpAnalyses.length >= 1;
  const hasCp2 = cpAnalyses.length >= 2;
  const cpMonths = new Set(cpAnalyses.map(a => new Date(a.created_at).toISOString().slice(0, 7)));
  const cpMultiMonth = cpMonths.size >= 2;

  factors.cp.tasks = [
    { label: t('cp.task.analysisCompleted'), pts: 75, done: hasCp1 },
    { label: t('cp.task.multiScenario'), pts: 75, done: hasCp2 },
    { label: t('cp.task.repeatMonths'), pts: 50, done: cpMultiMonth, bonus: true },
  ];

  // ── Career Intelligence (max 150) ──
  const ciAnalyses = analyses.filter(a => a.analysis_type === 'career_intelligence');
  const hasCi1 = ciAnalyses.length >= 1;
  const hasCi2 = ciAnalyses.length >= 2;

  factors.ci.tasks = [
    { label: t('cp.task.firstCi'), pts: 75, done: hasCi1 },
    { label: t('cp.task.secondCi'), pts: 75, done: hasCi2 },
  ];

  // ── Consistency & Engagement (max 150) ──
  const toolsUsed = new Set(analyses.map(a => a.analysis_type));
  const usedTools = ['cv_analyser', 'linkedin_roaster', 'career_path', 'career_intelligence'].filter(t => toolsUsed.has(t));
  const used2 = usedTools.length >= 2;
  const usedAll = usedTools.length >= 4;

  const dates = analyses.map(a => new Date(a.created_at).getTime()).sort();
  const returned30 = dates.length >= 2 && (dates[dates.length - 1] - dates[0]) >= 30 * 24 * 60 * 60 * 1000;

  const profileComplete = !!(
    profile?.first_name &&
    profile?.last_name &&
    profile?.phone &&
    profile?.address &&
    profile?.linkedin_url &&
    profile?.cv_filename
  );

  factors.eng.tasks = [
    { label: t('cp.task.used2tools'), pts: 30, done: used2 },
    { label: t('cp.task.usedAll'), pts: 50, done: usedAll },
    { label: t('cp.task.returned30'), pts: 30, done: returned30, bonus: true },
    { label: t('cp.task.profileComplete'), pts: 40, done: profileComplete },
  ];

  // Calculate totals
  Object.values(factors).forEach(f => {
    f.tasks.forEach(t => {
      if (t.done) f.earned += t.pts;
    });
  });
  const score = Object.values(factors).reduce((s, f) => s + f.earned, 0);

  return { score, factors, profileComplete };
}

function getLevelIndex(score: number) {
  for (let i = LEVEL_RANGES.length - 1; i >= 0; i--) {
    if (score >= LEVEL_RANGES[i].min) return i;
  }
  return 0;
}

// ─── Info Popup Component ──────────────────────────────────────────────────
function CareerScoreInfoPopup({ onClose, levels, t }: {
  onClose: () => void;
  levels: { name: string; icon: string; min: number; max: number; color: string; bg: string; desc: string }[];
  t: (key: string) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#f0f0f0] px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5 text-gold" />
            </div>
            <h3 className="text-sm font-semibold text-[#1a1a1a]">{t('cp.info.title')}</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-[#f5f5f4] flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-[#999]" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Description */}
          <p className="text-xs text-[#666] leading-relaxed">{t('cp.info.desc')}</p>

          {/* How to earn */}
          <div className="p-3 bg-[#fafaf9] border border-[#f0f0f0] rounded-xl">
            <p className="text-[10px] text-[#999] uppercase tracking-wider font-medium mb-1.5">{t('cp.info.howToEarn')}</p>
            <p className="text-[11px] text-[#666] leading-relaxed">{t('cp.info.howToEarnDesc')}</p>
          </div>

          {/* Levels */}
          <div>
            <p className="text-[10px] text-[#999] uppercase tracking-wider font-medium mb-3">{t('cp.info.levels')}</p>
            <div className="space-y-2">
              {levels.map((lv, i) => (
                <div
                  key={lv.name}
                  className="flex items-center gap-3 p-2.5 rounded-lg border transition-all"
                  style={{
                    borderColor: i === 4 ? lv.color + '40' : '#f0f0f0',
                    background: i === 4 ? lv.bg : 'transparent',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                    style={{ background: lv.bg }}
                  >
                    {lv.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold" style={{ color: lv.color }}>{lv.name}</span>
                      <span className="text-[9px] text-[#bbb]">{lv.min}–{lv.max} pts</span>
                    </div>
                    <p className="text-[10px] text-[#999] leading-snug mt-0.5 line-clamp-2">{lv.desc}</p>
                  </div>
                  {i === 4 && <Gift className="w-4 h-4 shrink-0" style={{ color: lv.color }} />}
                </div>
              ))}
            </div>
          </div>

          {/* Elite Reward */}
          <div className="p-4 bg-gradient-to-br from-[#FBEAF0] to-[#FBF0F4] border border-[#72243E]/15 rounded-xl">
            <div className="flex items-center gap-2 mb-2.5">
              <Award className="w-4 h-4 text-[#72243E]" />
              <span className="text-xs font-semibold text-[#72243E]">{t('cp.info.eliteReward')}</span>
            </div>
            <p className="text-[11px] text-[#72243E]/70 mb-3">{t('cp.info.eliteRewardDesc')}</p>
            <div className="space-y-2">
              {['cp.info.reward1', 'cp.info.reward2', 'cp.info.reward3'].map(key => (
                <div key={key} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#72243E]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                      <path d="M2 5l2.5 2.5L8 3" stroke="#72243E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-[11px] text-[#72243E]/80">{t(key)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-[#f0f0f0] px-5 py-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#1a1a1a] text-white text-xs font-medium rounded-lg hover:bg-[#333] transition-colors"
          >
            {t('cp.info.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function CareerProgress({ variant = 'detailed' }: CareerProgressProps) {
  const { profile } = useAuth();
  const { t, lang } = useI18n();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  // Build translated level data
  const LEVELS = useMemo(() => LEVEL_KEYS.map((key, i) => ({
    name: t(`cp.lv.${key}`),
    icon: LEVEL_ICONS[i],
    min: LEVEL_RANGES[i].min,
    max: LEVEL_RANGES[i].max,
    color: LEVEL_COLORS[i].color,
    bg: LEVEL_COLORS[i].bg,
    desc: t(`cp.lv.${key}.desc`),
  })), [t, lang]);

  // Factor meta with translated consistency label
  const FACTOR_META: Record<string, { name: string; icon: string; iconBg: string; color: string }> = useMemo(() => ({
    cv: { name: 'CV Analyser', icon: '📄', iconBg: '#EFF5FC', color: '#185FA5' },
    li: { name: 'LinkedIn Roaster', icon: '🔗', iconBg: '#EDF7F1', color: '#3B6D11' },
    cp: { name: 'Career Path', icon: '🗺️', iconBg: '#FBF3E7', color: '#854F0B' },
    ci: { name: 'Career Intelligence', icon: '🧠', iconBg: '#FBF0F4', color: '#72243E' },
    eng: { name: t('cp.consistency'), icon: '⚡', iconBg: '#EEF7E8', color: '#27500A' },
  }), [t, lang]);

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
    () => calculateScore(analyses, profile, t),
    [analyses, profile, t]
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

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPACT VARIANT — level + score + description + progress bar + info icon
  // ═══════════════════════════════════════════════════════════════════════════
  if (variant === 'compact') {
    return (
      <>
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 shadow-sm">
          <div className="flex gap-4 items-center">
            {/* Small Ring */}
            <div className="relative w-[64px] h-[64px] flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-[64px] h-[64px]" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r={R} fill="none" stroke="#e5e5e5" strokeWidth="9" />
                <circle
                  cx="50" cy="50" r={R} fill="none"
                  stroke={lv.color} strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={CIRC.toFixed(1)}
                  strokeDashoffset={offset.toFixed(1)}
                  style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1)' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-semibold text-[#1a1a1a]">{score}</span>
                <span className="text-[8px] text-[#999]">/ 1000</span>
              </div>
            </div>

            {/* Level Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider"
                  style={{ background: lv.bg, color: lv.color }}
                >
                  {lv.icon} {lv.name}
                </span>
                {/* Info / Learn more button */}
                <button
                  onClick={() => setShowInfo(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f5f5f4] hover:bg-gold/10 border border-transparent hover:border-gold/20 transition-all text-[9px] font-medium text-[#888] hover:text-gold"
                  title={t('cp.info.title')}
                >
                  <Info className="w-3 h-3" />
                  <span>{t('cp.learnMore')}</span>
                </button>
              </div>
              <p className="text-[11px] text-[#666] leading-relaxed mb-2 line-clamp-2">{lv.desc}</p>
              {next && (
                <div className="flex items-center gap-2 text-[10px] text-[#999]">
                  <span>{score}</span>
                  <div className="flex-1 h-1 bg-[#e5e5e5] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${lvProg.toFixed(0)}%`, background: lv.color, transition: 'width 0.9s cubic-bezier(.4,0,.2,1)' }} />
                  </div>
                  <span>{next.min} · {next.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        {showInfo && <CareerScoreInfoPopup onClose={() => setShowInfo(false)} levels={LEVELS} t={t} />}
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DETAILED VARIANT — full breakdown with factors and badge
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <>
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
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                  style={{ background: lv.bg, color: lv.color }}
                >
                  {lv.icon} {t('cp.level')} {lvIdx + 1}
                </span>
                {/* Info / Learn more button */}
                <button
                  onClick={() => setShowInfo(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f5f5f4] hover:bg-gold/10 border border-transparent hover:border-gold/20 transition-all text-[10px] font-medium text-[#888] hover:text-gold"
                  title={t('cp.info.title')}
                >
                  <Info className="w-3 h-3" />
                  <span>{t('cp.learnMore')}</span>
                </button>
              </div>
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
                <span className="text-[11px] font-semibold" style={{ color: lv.color }}>{t('cp.maxLevel')}</span>
              )}
            </div>
          </div>

          {/* Level Pips */}
          <div className="flex gap-1.5">
            {LEVELS.map((l, i) => {
              const achieved = score >= l.min;
              const current = i === lvIdx;
              return (
                <div
                  key={l.name}
                  className={`flex-1 py-1.5 px-1 border rounded-lg text-center transition-all ${current ? 'border-2' : ''} ${achieved ? '' : 'opacity-35'}`}
                  style={{ borderColor: current ? l.color : achieved ? l.color + '40' : '#e5e5e5', background: current ? l.bg : 'transparent' }}
                >
                  <div className="text-xs leading-none mb-0.5">{l.icon}</div>
                  <div className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: achieved ? l.color : '' }}>{l.name}</div>
                  <div className="text-[7px] text-[#999] mt-0.5">{l.min}–{l.max}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Factors */}
        <div className="text-[9px] font-semibold uppercase tracking-widest text-[#999] mb-1">{t('cp.scoringFactors')}</div>
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
                  <div className="text-[10px] text-[#999]">{pct}% {t('cp.complete')}</div>
                </div>
                <div className="text-sm font-semibold text-[#1a1a1a]">
                  {f.earned}<span className="text-[10px] text-[#999] font-normal"> / {f.max} pts</span>
                </div>
              </div>
              <div className="h-1 bg-[#e5e5e5] rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: meta.color, transition: 'width 0.7s cubic-bezier(.4,0,.2,1)' }} />
              </div>
              <div className="space-y-0">
                {f.tasks.map((task) => (
                  <div key={task.label} className="flex items-center gap-2 py-1.5 border-t border-[#f5f5f4] first:border-t-0 text-[11px] text-[#999]">
                    <div
                      className="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0"
                      style={task.done ? { background: meta.color, borderColor: 'transparent' } : { borderColor: '#e5e5e5' }}
                    >
                      {task.done && (
                        <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                          <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className={`flex-1 ${task.done ? 'line-through text-[#ccc]' : ''}`}>
                      {task.label}
                      {task.bonus && <span className="ml-1 text-[9px] bg-[#f5f5f4] px-1.5 py-0.5 rounded text-[#999]">{t('cp.task.bonus')}</span>}
                    </span>
                    <span
                      className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: task.done ? meta.iconBg : '#f5f5f4', color: task.done ? meta.color : '#999' }}
                    >
                      +{task.pts}
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
                <div className="text-xs font-semibold text-[#1a1a1a]">{t('cp.careerBadge')}</div>
                <div className="text-[10px] text-[#999]">{t('cp.shareDesc')}</div>
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
              <div className="mt-2 mx-auto w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(score / 1000) * 100}%`, background: lv.color === '#7A7A7A' ? '#ccc' : lv.color }} />
              </div>
            </div>
            <button
              onClick={() => {
                const shareText = t('cp.linkedin.shareText')
                  .replace('${icon}', lv.icon)
                  .replace('${name}', lv.name)
                  .replace('${score}', String(score));
                const url = 'https://share2inspire.pt';
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(shareText)}`, '_blank');
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90"
              style={{ background: '#0A66C2' }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              {t('cp.shareLinkedin')}
            </button>
          </div>
        )}
      </div>
      {showInfo && <CareerScoreInfoPopup onClose={() => setShowInfo(false)} levels={LEVELS} t={t} />}
    </>
  );
}
