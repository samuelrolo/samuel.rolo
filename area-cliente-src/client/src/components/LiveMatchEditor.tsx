/**
 * LiveMatchEditor — "Spell-checker for ATS" component.
 *
 * Renders the CV text with inline highlights:
 * - Green underline: keyword found (exact match)
 * - Amber underline: keyword partially matched (synonym/stem)
 * - Red wavy underline: missing keyword suggestion zone
 *
 * Clicking a highlight shows a tooltip with the keyword info and suggestion.
 */
import { useState, useRef, useCallback, useMemo } from 'react';
import type { Annotation, MatchedKeyword } from '../lib/liveMatchEngine';
import type { Lang } from '@/lib/i18n';
import { CheckCircle, AlertTriangle, XCircle, Lightbulb, Copy, ChevronDown, ChevronUp } from 'lucide-react';

interface LiveMatchEditorProps {
  cvText: string;
  annotations: Annotation[];
  missingKeywords: MatchedKeyword[];
  lang: Lang;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  annotation?: Annotation;
  missingKw?: MatchedKeyword;
}

export default function LiveMatchEditor({ cvText, annotations, missingKeywords, lang }: LiveMatchEditorProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0 });
  const [showAllMissing, setShowAllMissing] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const pick = ({ pt, en, es }: { pt: string; en: string; es: string }) => lang === 'pt' ? pt : lang === 'es' ? es : en;

  // Build annotated segments
  const segments = useMemo(() => {
    if (!cvText || annotations.length === 0) {
      return [{ text: cvText, type: 'plain' as const, annotation: undefined }];
    }

    const result: { text: string; type: 'plain' | 'found' | 'partial'; annotation?: Annotation }[] = [];
    let lastEnd = 0;

    for (const ann of annotations) {
      // Add plain text before this annotation
      if (ann.start > lastEnd) {
        result.push({ text: cvText.slice(lastEnd, ann.start), type: 'plain' });
      }
      // Add annotated text
      result.push({
        text: cvText.slice(ann.start, ann.end),
        type: ann.type === 'found' ? 'found' : 'partial',
        annotation: ann,
      });
      lastEnd = ann.end;
    }

    // Add remaining plain text
    if (lastEnd < cvText.length) {
      result.push({ text: cvText.slice(lastEnd), type: 'plain' });
    }

    return result;
  }, [cvText, annotations]);

  const handleHighlightClick = useCallback((e: React.MouseEvent, ann: Annotation) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const editorRect = editorRef.current?.getBoundingClientRect();
    if (!editorRect) return;

    setTooltip({
      visible: true,
      x: rect.left - editorRect.left + rect.width / 2,
      y: rect.top - editorRect.top - 8,
      annotation: ann,
    });
  }, []);

  const handleMissingClick = useCallback((e: React.MouseEvent, kw: MatchedKeyword) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const editorRect = editorRef.current?.getBoundingClientRect();
    if (!editorRect) return;

    setTooltip({
      visible: true,
      x: rect.left - editorRect.left + rect.width / 2,
      y: rect.top - editorRect.top - 8,
      missingKw: kw,
    });
  }, []);

  const closeTooltip = useCallback(() => {
    setTooltip({ visible: false, x: 0, y: 0 });
  }, []);

  const copySuggestion = useCallback((text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  }, []);

  const visibleMissing = showAllMissing ? missingKeywords : missingKeywords.slice(0, 5);

  return (
    <div className="relative" ref={editorRef}>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mb-3 px-1">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 bg-green-500 rounded" />
          <span className="text-[10px] text-[#888]">{pick({ pt: 'Encontrada', en: 'Found', es: 'Encontrada' })}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 bg-amber-500 rounded" />
          <span className="text-[10px] text-[#888]">{pick({ pt: 'Parcial', en: 'Partial', es: 'Parcial' })}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-1 rounded" style={{ background: 'repeating-linear-gradient(90deg, #ef4444 0, #ef4444 2px, transparent 2px, transparent 4px)', backgroundSize: '4px 2px' }} />
          <span className="text-[10px] text-[#888]">{pick({ pt: 'Em falta', en: 'Missing', es: 'Faltante' })}</span>
        </div>
      </div>

      {/* CV Text Editor */}
      <div
        className="relative bg-white border border-[#e8e8e6] rounded-lg p-4 font-mono text-[12px] leading-[1.8] text-[#333] max-h-[400px] overflow-y-auto whitespace-pre-wrap break-words cursor-text"
        style={{ fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, monospace" }}
        onClick={(e) => { if (e.target === e.currentTarget) closeTooltip(); }}
      >
        {segments.map((seg, i) => {
          if (seg.type === 'plain') {
            return <span key={i}>{seg.text}</span>;
          }

          const isFound = seg.type === 'found';
          return (
            <span
              key={i}
              className={`cursor-pointer relative inline transition-colors ${
                isFound
                  ? 'bg-green-50 border-b-2 border-green-400 hover:bg-green-100'
                  : 'bg-amber-50 border-b-2 border-amber-400 hover:bg-amber-100'
              }`}
              style={{ borderBottomStyle: isFound ? 'solid' : 'dashed' }}
              onClick={(e) => { e.stopPropagation(); seg.annotation && handleHighlightClick(e, seg.annotation); }}
              title={seg.annotation?.keyword}
            >
              {seg.text}
            </span>
          );
        })}
      </div>

      {/* Missing Keywords Panel */}
      {missingKeywords.length > 0 && (
        <div className="mt-3 border border-red-200 bg-red-50/50 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-red-50 border-b border-red-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-[11px] font-medium text-red-700">
                {pick({ pt: `${missingKeywords.length} keywords em falta`, en: `${missingKeywords.length} missing keywords`, es: `${missingKeywords.length} keywords faltantes` })}
              </span>
            </div>
            {missingKeywords.length > 5 && (
              <button
                onClick={() => setShowAllMissing(!showAllMissing)}
                className="flex items-center gap-0.5 text-[10px] text-red-600 hover:text-red-800 transition-colors"
              >
                {showAllMissing ? pick({ pt: 'Ver menos', en: 'Show less', es: 'Ver menos' }) : pick({ pt: `Ver todas (${missingKeywords.length})`, en: `Show all (${missingKeywords.length})`, es: `Ver todas (${missingKeywords.length})` })}
                {showAllMissing ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
          <div className="divide-y divide-red-100">
            {visibleMissing.map((kw, i) => (
              <div
                key={i}
                className="px-3 py-2 hover:bg-red-50 transition-colors cursor-pointer"
                onClick={(e) => handleMissingClick(e, kw)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-[#333]">{kw.keyword}</span>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${
                      kw.importance === 'high' ? 'bg-red-100 text-red-600 border-red-200' :
                      kw.importance === 'medium' ? 'bg-amber-100 text-amber-600 border-amber-200' :
                      'bg-gray-100 text-gray-500 border-gray-200'
                    }`}>
                      {kw.importance === 'high' ? pick({ pt: 'Alta', en: 'High', es: 'Alta' }) : kw.importance === 'medium' ? pick({ pt: 'Média', en: 'Medium', es: 'Media' }) : pick({ pt: 'Baixa', en: 'Low', es: 'Baja' })}
                    </span>
                  </div>
                  {kw.suggestion && (
                    <button
                      onClick={(e) => { e.stopPropagation(); copySuggestion(kw.suggestion!, i); }}
                      className="flex items-center gap-0.5 text-[9px] text-[#888] hover:text-[#C9A961] transition-colors"
                      title={pick({ pt: 'Copiar sugestão', en: 'Copy suggestion', es: 'Copiar sugerencia' })}
                    >
                      <Copy className="w-2.5 h-2.5" />
                      {copiedIdx === i ? pick({ pt: 'Copiado!', en: 'Copied!', es: 'Copiado!' }) : ''}
                    </button>
                  )}
                </div>
                {kw.suggestion && (
                  <div className="flex items-start gap-1 mt-1">
                    <Lightbulb className="w-2.5 h-2.5 mt-0.5 shrink-0 text-amber-500" />
                    <span className="text-[10px] text-[#666] font-light">{kw.suggestion}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Tooltip */}
      {tooltip.visible && (tooltip.annotation || tooltip.missingKw) && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeTooltip} />
          <div
            className="absolute z-50 bg-white border border-[#e8e8e6] rounded-lg shadow-lg p-3 max-w-[280px] animate-in fade-in-0 zoom-in-95 duration-150"
            style={{
              left: Math.min(tooltip.x - 140, (editorRef.current?.offsetWidth || 300) - 290),
              top: tooltip.y - 10,
              transform: 'translateY(-100%)',
            }}
          >
            {tooltip.annotation && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  {tooltip.annotation.type === 'found'
                    ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  }
                  <span className="text-[11px] font-medium text-[#333]">{tooltip.annotation.keyword}</span>
                  <span className={`text-[9px] font-semibold px-1 py-0.5 rounded ${
                    tooltip.annotation.importance === 'high' ? 'bg-red-50 text-red-600' :
                    tooltip.annotation.importance === 'medium' ? 'bg-amber-50 text-amber-600' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    {tooltip.annotation.importance === 'high' ? pick({ pt: 'Alta', en: 'High', es: 'Alta' }) : tooltip.annotation.importance === 'medium' ? pick({ pt: 'Média', en: 'Medium', es: 'Media' }) : pick({ pt: 'Baixa', en: 'Low', es: 'Baja' })}
                  </span>
                </div>
                <p className="text-[10px] text-[#666]">
                  {tooltip.annotation.type === 'found'
                    ? pick({ pt: 'Keyword encontrada no CV — ATS irá detectar.', en: 'Keyword found in CV — ATS will detect.', es: 'Palabra clave encontrada en CV — ATS detectará.' })
                    : pick({ pt: 'Match parcial — considere usar o termo exacto.', en: 'Partial match — consider using the exact term.', es: 'Coincidencia parcial — considere usar el término exacto.' })
                  }
                </p>
                {tooltip.annotation.suggestion && (
                  <div className="flex items-start gap-1 p-1.5 bg-[#C9A961]/5 rounded">
                    <Lightbulb className="w-2.5 h-2.5 mt-0.5 shrink-0 text-amber-500" />
                    <span className="text-[10px] text-[#666]">{tooltip.annotation.suggestion}</span>
                  </div>
                )}
              </div>
            )}
            {tooltip.missingKw && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-[11px] font-medium text-[#333]">{tooltip.missingKw.keyword}</span>
                </div>
                <p className="text-[10px] text-red-600 font-medium">
                  {pick({ pt: 'Keyword não encontrada no CV', en: 'Keyword not found in CV', es: 'Palabra clave no encontrada en CV' })}
                </p>
                {tooltip.missingKw.suggestion && (
                  <div className="flex items-start gap-1 p-1.5 bg-[#C9A961]/5 rounded">
                    <Lightbulb className="w-2.5 h-2.5 mt-0.5 shrink-0 text-amber-500" />
                    <span className="text-[10px] text-[#666]">{tooltip.missingKw.suggestion}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
