/**
 * AnalysisDetailRenderer — Renders full analysis details for each tool type
 * Replaces raw HTML / truncated JSON with native React components
 * Supports: cv_analyser, linkedin_roaster, career_intelligence, career_path, career_energy
 */
import { useState, lazy, Suspense } from 'react';
import LiveMatchPanel from './LiveMatchPanel';
import {
  ChevronDown, ChevronUp, Target, BarChart3, AlertTriangle,
  Eye, Euro, Bot, TrendingUp, Layers, Calendar, Briefcase,
  CheckCircle, XCircle, ArrowRight, Star, Globe, Users, Zap,
  FileText, Linkedin, Compass, Award, Lightbulb, Shield,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ScoreCircle({ score, max = 100, size = 56, color = '#C9A961' }: { score: number; max?: number; size?: number; color?: string }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score / max, 1);
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e5e5" strokeWidth={4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
        className="transition-all duration-700" />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        className="text-xs font-bold" fill="#333" fontSize={size * 0.22}>
        {typeof score === 'number' ? Math.round(score) : score}
      </text>
    </svg>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: typeof Target; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="w-6 h-6 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center shrink-0">
        <Icon className="w-3 h-3 text-[#C9A961]" />
      </div>
      <p className="text-[10px] font-semibold tracking-wider text-[#888] uppercase">{title}</p>
    </div>
  );
}

function ProgressBar({ value, max = 100, benchmark, color = '#C9A961' }: { value: number; max?: number; benchmark?: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="relative h-2 rounded-full bg-[#e8e8e6] overflow-visible">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      {benchmark !== undefined && (
        <div className="absolute top-0 h-full w-0.5 bg-[#999]" style={{ left: `${Math.min((benchmark / max) * 100, 100)}%` }}
          title={`Benchmark: ${benchmark}`} />
      )}
    </div>
  );
}

function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#e8e8e6] rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-[#fafaf9] hover:bg-[#f5f5f4] transition-colors">
        <span className="text-[11px] font-medium text-[#555]">{title}</span>
        {open ? <ChevronUp className="w-3 h-3 text-[#999]" /> : <ChevronDown className="w-3 h-3 text-[#999]" />}
      </button>
      {open && <div className="px-3 py-2.5 space-y-2">{children}</div>}
    </div>
  );
}

// ─── CV Analyser Renderer ─────────────────────────────────────────────────────

/** Lightweight wrapper for LiveMatch inside the member area — always full access */
function LiveMatchPanelInline({ cvText }: { cvText: string }) {
  return (
    <LiveMatchPanel
      cvText={cvText}
      lang="pt"
      isPaid={true}
      isMemberArea={true}
    />
  );
}

function CvAnalyserDetail({ data }: { data: Record<string, any> }) {
  const score = data.overallScore ?? data.score ?? data.analysis?.score ?? 0;
  const quadrants = data.quadrants || data.analysis?.quadrants || [];
  const keywords = data.keywords || data.analysis?.keywords || [];
  const cvProblems = data.cvProblems || [];
  const improvementActions = data.improvementActions || [];
  const actionPlan = data.actionPlan30Days || [];
  const atsRate = data.atsRejectionRate ?? data.analysis?.atsRejectionRate;
  const atsFactor = data.atsTopFactor || data.analysis?.atsTopFactor || '';
  const role = data.perceivedRole || data.analysis?.perceivedRole || '';
  const seniority = data.perceivedSeniority || data.analysis?.perceivedSeniority || '';
  const salary = data.salaryDetailed || data.analysis?.salaryDetailed;
  const automationRisk = data.automationRisk || data.analysis?.automationRisk;
  const recruiterAnalysis = data.recruiterDeepAnalysis || data.analysis?.recruiterDeepAnalysis;
  const priorityMatrix = data.priorityMatrix || data.analysis?.priorityMatrix || [];
  const atsDetailed = data.detailedAtsAnalysis || data.analysis?.detailedAtsAnalysis;
  const atsDeepScan = data.atsDeepScan || data.analysis?.atsDeepScan;
  const cvText = data.cvText || data.analysis?.cvText || data.cv_text || '';

  // If we have results_html and NO structured data, render HTML
  if (data.results_html && !quadrants.length && !score) {
    return <HtmlRenderer html={data.results_html} />;
  }

  // If we only have analysis.teaser (old format), show what we can
  const teaser = data.analysis?.teaser || data.analysis;

  return (
    <div className="space-y-3">
      {/* Score Global */}
      {score > 0 && (
        <div className="flex items-center gap-3 p-3 bg-[#fafaf9] rounded-lg border border-[#e8e8e6]">
          <ScoreCircle score={score} />
          <div>
            <p className="text-[10px] text-[#888] font-light">Pontuação global</p>
            <p className="text-sm font-semibold text-[#333]">{score}/100</p>
            {role && <p className="text-[10px] text-[#999] font-light">{role}{seniority ? ` · ${seniority}` : ''}</p>}
          </div>
        </div>
      )}

      {/* Keywords */}
      {keywords.length > 0 && (
        <div>
          <SectionHeader icon={Target} title="Competências-chave" />
          <div className="flex flex-wrap gap-1.5">
            {(Array.isArray(keywords) ? keywords : []).slice(0, 10).map((k: string, i: number) => (
              <span key={i} className="px-2 py-0.5 text-[10px] bg-[#f5f5f4] border border-[#e0e0e0] rounded-full text-[#555]">{k}</span>
            ))}
          </div>
        </div>
      )}

      {/* Quadrants */}
      {quadrants.length > 0 && (
        <CollapsibleSection title={`Análise por Quadrante (${quadrants.length} dimensões)`} defaultOpen={true}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quadrants.map((q: any, i: number) => (
              <div key={i} className="p-2.5 bg-white border border-[#e8e8e6] rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#333]">{q.title}</span>
                  <span className="text-[11px] font-semibold text-[#C9A961]">{q.score}/100</span>
                </div>
                <ProgressBar value={q.score} benchmark={q.benchmark} />
                {q.impactPhrase && <p className="text-[10px] text-[#999] font-light">{q.impactPhrase}</p>}
                {q.strengths?.length > 0 && (
                  <div className="space-y-0.5">
                    {q.strengths.map((s: string, si: number) => (
                      <p key={si} className="text-[10px] text-green-700 font-light flex items-start gap-1">
                        <CheckCircle className="w-2.5 h-2.5 mt-0.5 shrink-0" /> {s}
                      </p>
                    ))}
                  </div>
                )}
                {q.weaknesses?.length > 0 && (
                  <div className="space-y-0.5">
                    {q.weaknesses.map((w: string, wi: number) => (
                      <p key={wi} className="text-[10px] text-amber-700 font-light flex items-start gap-1">
                        <AlertTriangle className="w-2.5 h-2.5 mt-0.5 shrink-0" /> {w}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* ATS Analysis */}
      {atsRate !== undefined && (
        <CollapsibleSection title={`Compatibilidade ATS — ${100 - atsRate}%`}>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <ScoreCircle score={100 - atsRate} size={48} color={atsRate > 50 ? '#ef4444' : atsRate > 30 ? '#f59e0b' : '#22c55e'} />
              <div>
                <p className="text-[11px] font-medium text-[#333]">{100 - atsRate}% compatibilidade</p>
                <p className="text-[10px] text-[#888] font-light">Taxa de rejeição: {atsRate}%</p>
              </div>
            </div>
            {atsFactor && <p className="text-[10px] text-[#888] font-light">Principal factor: {atsFactor}</p>}
            {atsDetailed?.quickFixes?.length > 0 && (
              <div>
                <p className="text-[10px] text-[#888] font-light mb-1">Correções rápidas:</p>
                <ul className="space-y-0.5">
                  {atsDetailed.quickFixes.map((f: string, i: number) => (
                    <li key={i} className="text-[10px] text-[#666] font-light flex items-start gap-1">
                      <Zap className="w-2.5 h-2.5 mt-0.5 shrink-0 text-amber-500" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* CV Problems */}
      {cvProblems.length > 0 && (
        <CollapsibleSection title={`Problemas Identificados (${cvProblems.length})`}>
          <div className="space-y-2">
            {cvProblems.map((p: any, i: number) => (
              <div key={i} className="p-2 bg-red-50 border border-red-100 rounded-lg space-y-1">
                <p className="text-[11px] font-medium text-red-800">{p.title}</p>
                <p className="text-[10px] text-red-700 font-light leading-relaxed">{p.description}</p>
                {p.fullExplanation && <p className="text-[10px] text-[#666] font-light leading-relaxed">{p.fullExplanation}</p>}
                {p.rewriteSuggestion && (
                  <div className="mt-1 p-1.5 bg-green-50 border border-green-100 rounded">
                    <p className="text-[10px] text-green-800 font-light leading-relaxed">
                      <strong className="font-medium">Sugestão:</strong> {p.rewriteSuggestion}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Improvement Actions */}
      {improvementActions.length > 0 && (
        <CollapsibleSection title={`Ações de Melhoria (${improvementActions.length})`}>
          <div className="space-y-2">
            {improvementActions.map((a: any, i: number) => (
              <div key={i} className="p-2 bg-[#fafaf9] border border-[#e8e8e6] rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#333]">{a.dimension}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    a.impact === 'Alto' ? 'bg-red-100 text-red-700' : a.impact === 'Médio' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                  }`}>{a.impact}</span>
                </div>
                <p className="text-[10px] text-[#666] font-light">{a.action}</p>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-[#999]">{a.before}</span>
                  <ArrowRight className="w-2.5 h-2.5 text-[#C9A961]" />
                  <span className="text-green-700 font-medium">{a.after}</span>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Recruiter Perception */}
      {recruiterAnalysis && (
        <CollapsibleSection title="Percepção do Recrutador">
          <div className="space-y-2">
            {recruiterAnalysis.readingFlow && (
              <p className="text-[10px] text-[#666] font-light leading-relaxed">{recruiterAnalysis.readingFlow}</p>
            )}
            {recruiterAnalysis.attentionMap?.length > 0 && (
              <div>
                <p className="text-[10px] text-[#888] font-light mb-1">Mapa de atenção:</p>
                <ol className="space-y-0.5">
                  {recruiterAnalysis.attentionMap.map((step: string, i: number) => (
                    <li key={i} className="text-[10px] text-[#666] font-light flex items-start gap-1.5">
                      <span className="text-[#C9A961] font-semibold shrink-0">{i+1}.</span> {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {recruiterAnalysis.positiveSignals?.length > 0 && (
              <div>
                <p className="text-[10px] text-[#888] font-light mb-1">Sinais positivos:</p>
                {recruiterAnalysis.positiveSignals.map((s: string, i: number) => (
                  <p key={i} className="text-[10px] text-green-700 font-light flex items-start gap-1">
                    <CheckCircle className="w-2.5 h-2.5 mt-0.5 shrink-0" /> {s}
                  </p>
                ))}
              </div>
            )}
            {recruiterAnalysis.frictionPoints?.length > 0 && (
              <div>
                <p className="text-[10px] text-[#888] font-light mb-1">Pontos de fricção:</p>
                {recruiterAnalysis.frictionPoints.map((f: string, i: number) => (
                  <p key={i} className="text-[10px] text-amber-700 font-light flex items-start gap-1">
                    <XCircle className="w-2.5 h-2.5 mt-0.5 shrink-0" /> {f}
                  </p>
                ))}
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Salary Estimate */}
      {salary && (
        <CollapsibleSection title="Estimativa Salarial">
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {salary.percentile25 && (
                <div className="text-center p-2 bg-[#f5f5f4] rounded">
                  <p className="text-[10px] text-[#888]">P25</p>
                  <p className="text-sm font-semibold text-[#333]">€{salary.percentile25}</p>
                </div>
              )}
              <div className="text-center p-2 bg-[#C9A961]/10 rounded border border-[#C9A961]/20">
                <p className="text-[10px] text-[#888]">Mediana</p>
                <p className="text-sm font-semibold text-[#C9A961]">€{salary.median}</p>
              </div>
              {salary.percentile75 && (
                <div className="text-center p-2 bg-[#f5f5f4] rounded">
                  <p className="text-[10px] text-[#888]">P75</p>
                  <p className="text-sm font-semibold text-[#333]">€{salary.percentile75}</p>
                </div>
              )}
            </div>
            {salary.topMax && <p className="text-[10px] text-[#888] font-light">Máximo: €{salary.topMax}/mês · {salary.period || 'mensal'}</p>}
            {salary.benefits?.length > 0 && (
              <div>
                <p className="text-[10px] text-[#888] font-light mb-1">Benefícios típicos:</p>
                <div className="flex flex-wrap gap-1">
                  {salary.benefits.slice(0, 6).map((b: string, i: number) => (
                    <span key={i} className="text-[9px] px-1.5 py-0.5 bg-[#f5f5f4] border border-[#e0e0e0] rounded text-[#666]">{b}</span>
                  ))}
                </div>
              </div>
            )}
            {salary.source && <p className="text-[9px] text-[#bbb] font-light">Fonte: {salary.source}</p>}
          </div>
        </CollapsibleSection>
      )}

      {/* Automation Risk */}
      {automationRisk && (
        <CollapsibleSection title="Potencial de Automação">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#C9A961]" />
              <span className={`text-[11px] font-medium ${
                automationRisk.level === 'Baixo' ? 'text-green-700' : automationRisk.level === 'Moderado' ? 'text-amber-700' : 'text-red-700'
              }`}>{automationRisk.level} ({automationRisk.percentage}%)</span>
            </div>
            {automationRisk.description && <p className="text-[10px] text-[#666] font-light leading-relaxed">{automationRisk.description}</p>}
            {automationRisk.recommendations?.length > 0 && (
              <ul className="space-y-0.5">
                {automationRisk.recommendations.map((r: string, i: number) => (
                  <li key={i} className="text-[10px] text-[#666] font-light flex items-start gap-1">
                    <Lightbulb className="w-2.5 h-2.5 mt-0.5 shrink-0 text-amber-500" /> {r}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* 30-Day Action Plan */}
      {actionPlan.length > 0 && (
        <CollapsibleSection title="Plano de Ação 30 Dias">
          <div className="space-y-2">
            {actionPlan.map((week: any, i: number) => (
              <div key={i} className="p-2 bg-[#fafaf9] border border-[#e8e8e6] rounded-lg space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-[#C9A961]" />
                  <span className="text-[11px] font-medium text-[#333]">{week.week}: {week.title}</span>
                </div>
                <ul className="space-y-0.5 ml-5">
                  {week.actions?.map((a: string, ai: number) => (
                    <li key={ai} className="text-[10px] text-[#666] font-light list-disc">{a}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* ATS Deep Scan */}
      {atsDeepScan && atsDeepScan.keywords?.length > 0 && (
        <CollapsibleSection title={`ATS Deep Scan — ${atsDeepScan.overallATSScore ?? '?'}/100`} defaultOpen={false}>
          <div className="space-y-3">
            {/* Score summary */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-[#fafaf9] rounded border border-[#e8e8e6]">
                <p className="text-[10px] text-[#888]">ATS Global</p>
                <p className="text-sm font-semibold text-[#333]">{atsDeepScan.overallATSScore}/100</p>
              </div>
              <div className="text-center p-2 bg-[#C9A961]/10 rounded border border-[#C9A961]/20">
                <p className="text-[10px] text-[#888]">Keywords</p>
                <p className="text-sm font-semibold text-[#C9A961]">{atsDeepScan.keywordScore}/100</p>
              </div>
              <div className="text-center p-2 bg-[#fafaf9] rounded border border-[#e8e8e6]">
                <p className="text-[10px] text-[#888]">Formato</p>
                <p className="text-sm font-semibold text-[#333]">{atsDeepScan.formatScore}/100</p>
              </div>
            </div>

            {/* Keywords table */}
            <div>
              <p className="text-[10px] text-[#888] font-light mb-1.5">Keywords analisadas ({atsDeepScan.keywords.length}):</p>
              <div className="border border-[#e8e8e6] rounded-lg overflow-hidden">
                {atsDeepScan.keywords.map((kw: any, i: number) => (
                  <div key={i} className={`flex items-center justify-between px-2.5 py-1.5 ${i % 2 === 0 ? 'bg-white' : 'bg-[#fafaf9]'} ${i < atsDeepScan.keywords.length - 1 ? 'border-b border-[#e8e8e6]' : ''}`}>
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      {kw.status === 'found' ? <CheckCircle className="w-3 h-3 text-green-500 shrink-0" /> : kw.status === 'partial' ? <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" /> : <XCircle className="w-3 h-3 text-red-500 shrink-0" />}
                      <span className="text-[11px] text-[#333] truncate">{kw.keyword}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${
                        kw.importance === 'high' ? 'bg-red-50 text-red-600 border-red-200' :
                        kw.importance === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        'bg-gray-50 text-gray-500 border-gray-200'
                      }`}>{kw.importance === 'high' ? 'Alta' : kw.importance === 'medium' ? 'Média' : 'Baixa'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions for missing/partial keywords */}
            {atsDeepScan.keywords.filter((k: any) => k.suggestion).length > 0 && (
              <div>
                <p className="text-[10px] text-[#888] font-light mb-1.5">Sugestões de reformulação:</p>
                <div className="space-y-1.5">
                  {atsDeepScan.keywords.filter((k: any) => k.suggestion).map((kw: any, i: number) => (
                    <div key={i} className="p-2 bg-[#C9A961]/5 border border-[#C9A961]/15 rounded-lg">
                      <p className="text-[10px] font-medium text-[#555]">{kw.keyword}</p>
                      <p className="text-[10px] text-[#666] font-light mt-0.5">{kw.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Format checks */}
            {atsDeepScan.formatChecks?.length > 0 && (
              <div>
                <p className="text-[10px] text-[#888] font-light mb-1.5">Checklist de formato ATS:</p>
                <div className="space-y-1">
                  {atsDeepScan.formatChecks.map((fc: any, i: number) => (
                    <div key={i} className={`p-2 rounded-lg border ${
                      fc.status === 'pass' ? 'border-green-200 bg-green-50' :
                      fc.status === 'warning' ? 'border-amber-200 bg-amber-50' :
                      'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex items-start gap-1.5">
                        {fc.status === 'pass' ? <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" /> : fc.status === 'warning' ? <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" /> : <XCircle className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />}
                        <div>
                          <p className="text-[11px] font-medium text-[#333]">{fc.check}</p>
                          <p className="text-[10px] text-[#666] font-light">{fc.detail}</p>
                          {fc.fix && <p className="text-[10px] text-[#C9A961] font-light mt-0.5">→ {fc.fix}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Live Match */}
      {cvText && (
        <CollapsibleSection title="Live Match — ATS Keyword Matching" defaultOpen={false}>
          <LiveMatchPanelInline cvText={cvText} />
        </CollapsibleSection>
      )}

      {/* Priority Matrix */}
      {priorityMatrix.length > 0 && (
        <CollapsibleSection title="Matriz de Prioridades">
          <div className="space-y-1.5">
            {priorityMatrix.map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                <span className="font-medium text-[#333] w-20">{p.dimension}</span>
                <span className="text-[#888]">{p.currentScore}</span>
                <ArrowRight className="w-2.5 h-2.5 text-[#C9A961]" />
                <span className="text-green-700 font-medium">{p.potentialScore}</span>
                <span className={`px-1 py-0.5 rounded text-[9px] ${
                  p.urgency === 'Alta' ? 'bg-red-100 text-red-700' : p.urgency === 'Média' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                }`}>{p.urgency}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}

// ─── LinkedIn Roaster Renderer ────────────────────────────────────────────────

function LinkedinRoasterDetail({ data }: { data: Record<string, any> }) {
  // Parse results_text which may be a JSON string
  let parsed: any = null;
  if (data.results_text) {
    try {
      parsed = typeof data.results_text === 'string' ? JSON.parse(data.results_text) : data.results_text;
    } catch { parsed = null; }
  }

  const analysis = data.analysis || {};
  const notaGeral = analysis.nota_geral || analysis.teaser?.nota_geral || '';
  const hookVendas = analysis.hook_vendas || analysis.teaser?.hook_vendas || '';

  // Merge parsed data
  const sumario = parsed?.sumario_executivo || '';
  const visibilidade = parsed?.visibilidade_algoritmo || '';
  const dimensoes = parsed?.dimensoes || {};

  const dimEntries = Object.entries(dimensoes) as [string, any][];

  const dimLabels: Record<string, string> = {
    headline_sumario: 'Headline & Sumário',
    experiencia_conteudo: 'Experiência & Conteúdo',
    formacao_certificacoes: 'Formação & Certificações',
    networking_atividade: 'Networking & Atividade',
    recomendacoes_competencias: 'Recomendações & Competências',
    media_publicacoes: 'Media & Publicações',
  };

  return (
    <div className="space-y-3">
      {/* Score */}
      {notaGeral && (
        <div className="flex items-center gap-3 p-3 bg-[#fafaf9] rounded-lg border border-[#e8e8e6]">
          <ScoreCircle score={parseFloat(notaGeral)} max={10} size={56} />
          <div>
            <p className="text-[10px] text-[#888] font-light">Nota geral</p>
            <p className="text-sm font-semibold text-[#333]">{notaGeral}</p>
          </div>
        </div>
      )}

      {/* Hook Vendas */}
      {hookVendas && (
        <div className="p-2.5 bg-[#C9A961]/5 border border-[#C9A961]/20 rounded-lg">
          <SectionHeader icon={Zap} title="Hook de Vendas" />
          <p className="text-[11px] text-[#555] font-light leading-relaxed">{hookVendas}</p>
        </div>
      )}

      {/* Executive Summary */}
      {sumario && (
        <CollapsibleSection title="Sumário Executivo" defaultOpen={true}>
          <p className="text-[10px] text-[#666] font-light leading-relaxed">{sumario}</p>
        </CollapsibleSection>
      )}

      {/* Algorithm Visibility */}
      {visibilidade && (
        <CollapsibleSection title="Visibilidade Algorítmica">
          <p className="text-[10px] text-[#666] font-light leading-relaxed">{visibilidade}</p>
        </CollapsibleSection>
      )}

      {/* Dimensions */}
      {dimEntries.length > 0 && (
        <CollapsibleSection title={`Análise por Dimensão (${dimEntries.length})`} defaultOpen={true}>
          <div className="space-y-2">
            {dimEntries.map(([key, dim]) => (
              <div key={key} className="p-2 bg-white border border-[#e8e8e6] rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#333]">{dimLabels[key] || key.replace(/_/g, ' ')}</span>
                  {dim.score !== undefined && (
                    <span className="text-[11px] font-semibold text-[#C9A961]">{dim.score}/10</span>
                  )}
                </div>
                {dim.score !== undefined && <ProgressBar value={dim.score} max={10} />}
                {dim.analise && <p className="text-[10px] text-[#666] font-light leading-relaxed">{dim.analise}</p>}
                {dim.melhorias?.length > 0 && (
                  <div className="space-y-0.5 mt-1">
                    <p className="text-[10px] text-[#888] font-light">Melhorias:</p>
                    {dim.melhorias.map((m: string, i: number) => (
                      <p key={i} className="text-[10px] text-amber-700 font-light flex items-start gap-1">
                        <Lightbulb className="w-2.5 h-2.5 mt-0.5 shrink-0" /> {m}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Fallback: show results_text as text if no parsed data */}
      {!parsed && !hookVendas && data.results_text && (
        <div className="p-2 bg-[#fafaf9] rounded-lg border border-[#e8e8e6]">
          <p className="text-[10px] text-[#666] font-light leading-relaxed whitespace-pre-wrap">{data.results_text}</p>
        </div>
      )}
    </div>
  );
}

// ─── Career Intelligence Renderer ─────────────────────────────────────────────

function CareerIntelligenceDetail({ data }: { data: Record<string, any> }) {
  const strategicPaths = data.strategic_paths || [];
  const market = data.market_context || {};
  const recommendation = data.decision_recommendation || {};
  const score = data.career_potential_score;

  // If we only have results_html and no structured data, render HTML
  if (data.results_html && !strategicPaths.length && !recommendation.recommended_path) {
    return <HtmlRenderer html={data.results_html} />;
  }

  return (
    <div className="space-y-3">
      {/* Recommendation */}
      {recommendation.recommended_path && (
        <div className="p-3 bg-[#C9A961]/5 border border-[#C9A961]/20 rounded-lg space-y-1.5">
          <SectionHeader icon={Award} title="Caminho Recomendado" />
          <p className="text-[12px] font-semibold text-[#333]">{recommendation.recommended_path}</p>
          {recommendation.justification && (
            <p className="text-[10px] text-[#666] font-light leading-relaxed">{recommendation.justification}</p>
          )}
          {recommendation.why_better_than_others && (
            <p className="text-[10px] text-[#888] font-light leading-relaxed mt-1">
              <strong className="font-medium text-[#666]">Porquê este:</strong> {recommendation.why_better_than_others}
            </p>
          )}
          {recommendation.when_to_switch && (
            <p className="text-[10px] text-[#888] font-light leading-relaxed">
              <strong className="font-medium text-[#666]">Quando mudar:</strong> {recommendation.when_to_switch}
            </p>
          )}
        </div>
      )}

      {/* Market Context */}
      {(market.demand_level || market.competitiveness) && (
        <CollapsibleSection title="Contexto de Mercado" defaultOpen={true}>
          <div className="space-y-2">
            {market.demand_level && (
              <div>
                <p className="text-[10px] text-[#888] font-light mb-0.5">Nível de procura:</p>
                <p className="text-[10px] text-[#666] font-light leading-relaxed">{market.demand_level}</p>
              </div>
            )}
            {market.competitiveness && (
              <div>
                <p className="text-[10px] text-[#888] font-light mb-0.5">Competitividade:</p>
                <p className="text-[10px] text-[#666] font-light leading-relaxed">{market.competitiveness}</p>
              </div>
            )}
            {market.differentiator && (
              <div>
                <p className="text-[10px] text-[#888] font-light mb-0.5">Diferenciador:</p>
                <p className="text-[10px] text-[#666] font-light leading-relaxed">{market.differentiator}</p>
              </div>
            )}
            {market.aligned_companies?.length > 0 && (
              <div>
                <p className="text-[10px] text-[#888] font-light mb-1">Empresas alinhadas:</p>
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(market.aligned_companies) ? market.aligned_companies : []).map((c: string, i: number) => (
                    <span key={i} className="text-[9px] px-1.5 py-0.5 bg-[#f5f5f4] border border-[#e0e0e0] rounded text-[#555]">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Strategic Paths */}
      {strategicPaths.length > 0 && (
        <CollapsibleSection title={`Caminhos Estratégicos (${strategicPaths.length})`} defaultOpen={true}>
          <div className="space-y-2">
            {strategicPaths.map((path: any, i: number) => (
              <div key={i} className="p-2.5 bg-white border border-[#e8e8e6] rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#333]">
                    <span className="text-[#C9A961] mr-1">#{i+1}</span>
                    {path.name || path.title}
                  </span>
                  {path.success_probability !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                      {path.success_probability}% sucesso
                    </span>
                  )}
                </div>
                {path.logic && <p className="text-[10px] text-[#666] font-light leading-relaxed">{path.logic}</p>}
                {path.ideal_for && (
                  <p className="text-[10px] text-[#888] font-light leading-relaxed">
                    <strong className="font-medium text-[#666]">Ideal para:</strong> {path.ideal_for}
                  </p>
                )}
                {path.associated_roles?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {path.associated_roles.map((r: string, ri: number) => (
                      <span key={ri} className="text-[9px] px-1.5 py-0.5 bg-[#C9A961]/10 border border-[#C9A961]/20 rounded text-[#a57b0a]">{r}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}

// ─── Career Path Renderer ─────────────────────────────────────────────────────

function CareerPathDetail({ data }: { data: Record<string, any> }) {
  const careerPath = data.career_path_json || data.career_path || {};

  // If we only have results_html and no structured data, render HTML
  if (data.results_html && !Object.keys(careerPath).length) {
    return <HtmlRenderer html={data.results_html} />;
  }

  // If we have results_html AND structured data, prefer structured
  // but also offer HTML as fallback
  return (
    <div className="space-y-3">
      {careerPath.title && (
        <div className="p-3 bg-[#fafaf9] rounded-lg border border-[#e8e8e6]">
          <p className="text-[12px] font-semibold text-[#333]">{careerPath.title}</p>
          {careerPath.summary && <p className="text-[10px] text-[#666] font-light leading-relaxed mt-1">{careerPath.summary}</p>}
        </div>
      )}

      {/* If we have results_html, render it since Career Path has rich visual content */}
      {data.results_html && <HtmlRenderer html={data.results_html} />}

      {data.linkedin_url && (
        <p className="text-[10px] text-[#888] font-light">
          LinkedIn: <a href={data.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[#C9A961] hover:underline">{data.linkedin_url}</a>
        </p>
      )}
    </div>
  );
}

// ─── Career Energy Renderer ───────────────────────────────────────────────────

function CareerEnergyDetail({ data }: { data: Record<string, any> }) {
  const totalScore = data.total_score;
  const level = data.level;
  const archetype = data.archetype;
  const dimensions = data.dimensions || {};

  return (
    <div className="space-y-3">
      {totalScore && (
        <div className="flex items-center gap-3 p-3 bg-[#fafaf9] rounded-lg border border-[#e8e8e6]">
          <ScoreCircle score={totalScore} size={56} />
          <div>
            <p className="text-[10px] text-[#888] font-light">Score total</p>
            <p className="text-sm font-semibold text-[#333]">{totalScore}{level ? ` — ${level}` : ''}</p>
            {archetype && <p className="text-[10px] text-[#C9A961] font-medium">{archetype}</p>}
          </div>
        </div>
      )}

      {Object.keys(dimensions).length > 0 && (
        <div className="space-y-1.5">
          <SectionHeader icon={BarChart3} title="Dimensões" />
          {Object.entries(dimensions as Record<string, number | null>).map(([dim, val]) => (
            val !== null && (
              <div key={dim} className="flex items-center gap-2">
                <span className="text-[10px] text-[#888] font-light capitalize w-24">{dim}</span>
                <div className="flex-1">
                  <ProgressBar value={val as number} />
                </div>
                <span className="text-[10px] font-medium text-[#555] w-8 text-right">{val}</span>
              </div>
            )
          ))}
        </div>
      )}

      {data.results_html && <HtmlRenderer html={data.results_html} />}
    </div>
  );
}

// ─── HTML Renderer (sanitized fallback) ───────────────────────────────────────

function HtmlRenderer({ html }: { html: string }) {
  const clean = sanitizeHtml(html);
  return (
    <div className="s2i-results-render rounded-lg overflow-hidden bg-[#F0F0EE] border border-[#e5e5e5] p-4"
      style={{ maxHeight: 600, overflowY: 'auto' }}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

function sanitizeHtml(html: string): string {
  if (!html) return '';
  let clean = html;
  // Remove notification sections
  clean = clean.replace(/<section[^>]*aria-label=["']Notifications[^"']*["'][^>]*>[\s\S]*?<\/section>/gi, '');
  clean = clean.replace(/<section[^>]*aria-live=["']polite["'][^>]*>[\s\S]*?<\/section>/gi, '');
  // Remove data-loc debug attributes
  clean = clean.replace(/\s*data-loc="[^"]*"/g, '');
  // Remove empty sections
  clean = clean.replace(/<section[^>]*>\s*<\/section>/gi, '');
  return clean.trim();
}

// ─── Main Export ──────────────────────────────────────────────────────────────

interface AnalysisDetailRendererProps {
  analysisType: string;
  data: Record<string, any>;
}

export default function AnalysisDetailRenderer({ analysisType, data }: AnalysisDetailRendererProps) {
  if (!data) return null;

  switch (analysisType) {
    case 'cv_analyser':
      return <CvAnalyserDetail data={data} />;
    case 'linkedin_roaster':
      return <LinkedinRoasterDetail data={data} />;
    case 'career_intelligence':
      return <CareerIntelligenceDetail data={data} />;
    case 'career_path':
      return <CareerPathDetail data={data} />;
    case 'career_energy':
      return <CareerEnergyDetail data={data} />;
    default:
      // Generic fallback
      if (data.results_html) return <HtmlRenderer html={data.results_html} />;
      if (data.results_text) {
        return (
          <div className="p-2 bg-[#fafaf9] rounded-lg border border-[#e8e8e6]">
            <p className="text-[10px] text-[#666] font-light leading-relaxed whitespace-pre-wrap">
              {typeof data.results_text === 'string' ? data.results_text : JSON.stringify(data.results_text, null, 2)}
            </p>
          </div>
        );
      }
      return (
        <p className="text-[10px] text-[#999] font-light">Sem dados de análise disponíveis.</p>
      );
  }
}
