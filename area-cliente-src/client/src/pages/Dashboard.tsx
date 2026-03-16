/*
 * Design: Consultoria de Luxo Silenciosa
 * Dashboard com perfil pessoal, repositório de análises guardadas, upload de CV e estado da subscrição
 * As análises são carregadas da tabela user_analyses do Supabase
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Link } from 'wouter';
import {
  Loader2, Upload, Download, FileText, Check, ArrowRight,
  BarChart3, FileSearch, Compass, Clock, Trash2,
  Linkedin, RefreshCw, BookOpen, Lock,
} from 'lucide-react';

type SavedAnalysis = {
  id: string;
  user_id: string;
  analysis_type: string;
  data: Record<string, any>;
  created_at: string;
};

const TOOL_CONFIG: Record<string, { label: string; icon: typeof FileSearch; color: string; link: string }> = {
  cv_analyser: { label: 'CV Analyser', icon: FileSearch, color: 'text-blue-400', link: 'https://share2inspire.pt/cv-analyser' },
  career_path: { label: 'Career Path', icon: Compass, color: 'text-emerald-400', link: 'https://share2inspire.pt/career-path' },
  linkedin_roaster: { label: 'LinkedIn Roaster', icon: Linkedin, color: 'text-amber-400', link: 'https://share2inspire.pt/linkedin-roaster' },
  career_energy: { label: 'Career Energy Score', icon: BarChart3, color: 'text-purple-400', link: 'https://share2inspire.pt/#career-energy' },
};

export default function Dashboard() {
  const { t } = useI18n();
  const { profile, subscription, updateProfile, refreshProfile, hasActiveSubscription } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [linkedin, setLinkedin] = useState(profile?.linkedin_url || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cvUploaded, setCvUploaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'analyses' | 'profile' | 'subscription' | 'resources'>('analyses');

  // Saved analyses state
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load saved analyses from Supabase
  const loadAnalyses = async () => {
    if (!profile?.id) return;
    setLoadingAnalyses(true);
    try {
      const { data, error } = await supabase
        .from('user_analyses')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setAnalyses(data as SavedAnalysis[]);
      }
    } catch (e) {
      console.error('Error loading analyses:', e);
    }
    setLoadingAnalyses(false);
  };

  const [initialLoadDone] = useState(() => false);
  useEffect(() => {
    if (profile?.id && !initialLoadDone) {
      loadAnalyses();
    }
  }, [profile?.id]);

  // Delete an analysis
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await supabase.from('user_analyses').delete().eq('id', id);
      setAnalyses(prev => prev.filter(a => a.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (e) {
      console.error('Error deleting analysis:', e);
    }
    setDeletingId(null);
  };

  // Group analyses by type
  const groupedAnalyses = useMemo(() => {
    const groups: Record<string, SavedAnalysis[]> = {};
    analyses.forEach(a => {
      const type = a.analysis_type || 'unknown';
      if (!groups[type]) groups[type] = [];
      groups[type].push(a);
    });
    return groups;
  }, [analyses]);

  // Count by tool
  const toolCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    analyses.forEach(a => {
      const type = a.analysis_type || 'unknown';
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [analyses]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await updateProfile({ first_name: firstName, last_name: lastName, phone, address, linkedin_url: linkedin });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleCvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (file.size > 10 * 1024 * 1024) return;
    setUploading(true);
    setCvUploaded(false);
    try {
      const userId = profile.user_id || profile.id;
      const ext = file.name.split('.').pop();
      const path = `${userId}/cv.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('user-cvs')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('user-cvs').getPublicUrl(path);
      await updateProfile({
        cv_url: urlData.publicUrl,
        cv_filename: file.name,
        cv_uploaded_at: new Date().toISOString(),
      } as any);
      await refreshProfile();
      setCvUploaded(true);
      setTimeout(() => setCvUploaded(false), 3000);
    } catch (err) {
      console.error('CV upload error:', err);
    } finally {
      setUploading(false);
    }
  }

  const planLabels: Record<string, string> = {
    monthly: t('sub.monthly'),
    semiannual: t('sub.semiannual'),
    annual: t('sub.annual'),
  };

  const tabs = [
    { key: 'analyses' as const, label: 'As minhas análises', icon: BarChart3 },
    { key: 'resources' as const, label: 'Recursos', icon: BookOpen },
    { key: 'profile' as const, label: t('dash.personalInfo'), icon: FileText },
    { key: 'subscription' as const, label: t('dash.subscription'), icon: Compass },
  ];

  // Resources data
  const resources = [
    {
      id: 'ebook-cv-vencedor',
      title: 'Ebook: Como Criar um CV Vencedor',
      description: 'Guia completo com dicas práticas para construíres um CV que se destaca no mercado de trabalho.',
      type: 'PDF',
      size: '155 KB',
      url: 'https://d2xsxph8kpxj0f.cloudfront.net/105354394/92yTmUfG3DeUMDKSZxzXKb/Ebook_Como_Criar_um_CV_Vencedor_861d8b44.pdf',
      icon: FileText,
    },
  ];

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString('pt-PT', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  // Strip HTML tags and return plain text preview
  function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function getAnalysisSummary(analysis: SavedAnalysis): string {
    const data = analysis.data;
    if (!data) return '';

    if (analysis.analysis_type === 'cv_analyser') {
      if (data.score) return `Score ATS: ${data.score}/100`;
      if (data.analysis?.score !== undefined) return `Score ATS: ${data.analysis.score}/100`;
      if (data.analysis?.atsScore !== undefined) return `Score ATS: ${data.analysis.atsScore}/100`;
      if (data.analysis?.overall_score !== undefined) return `Score ATS: ${data.analysis.overall_score}/100`;
      if (data.results_html) return stripHtml(data.results_html).substring(0, 80) + '...';
    }
    if (analysis.analysis_type === 'linkedin_roaster') {
      if (data.score) return `Score: ${data.score}`;
      if (data.analysis?.teaser?.nota_geral) return `Nota: ${data.analysis.teaser.nota_geral}`;
      if (data.results_text) return data.results_text.substring(0, 80) + '...';
      if (data.email_used) return `Perfil: ${data.email_used}`;
    }
    if (analysis.analysis_type === 'career_path') {
      if (data.career_path?.title) return data.career_path.title;
      if (data.career_path?.summary) return data.career_path.summary.substring(0, 80) + '...';
      if (data.results_html) return stripHtml(data.results_html).substring(0, 80) + '...';
    }
    if (analysis.analysis_type === 'career_energy') {
      if (data.total_score) return `Score: ${data.total_score}${data.level ? ` — ${data.level}` : ''}`;
    }
    if (data.tool_label) return data.tool_label;
    return '';
  }

  // All available tools for the overview cards
  const allTools = [
    { type: 'cv_analyser', label: 'CV Analyser', icon: FileSearch, link: 'https://share2inspire.pt/cv-analyser' },
    { type: 'linkedin_roaster', label: 'LinkedIn Roaster', icon: Linkedin, link: 'https://share2inspire.pt/linkedin-roaster' },
    { type: 'career_path', label: 'Career Path', icon: Compass, link: 'https://share2inspire.pt/career-path' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Title */}
        <div className="mb-8">
          <p className="text-gold text-xs font-light tracking-[0.15em] uppercase mb-2">{t('dash.title')}</p>
          <h1 className="text-2xl font-semibold text-[#1a1a1a]">
            {profile?.first_name ? `Olá, ${profile.first_name}` : t('dash.title')}
          </h1>
          <p className="text-sm text-[#999] font-light mt-1">
            Aqui encontras todas as tuas análises e informações de conta.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-[#e5e5e5]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-light transition-all duration-300 border-b-2 -mb-[1px] ${
                activeTab === tab.key
                  ? 'border-gold text-gold'
                  : 'border-transparent text-[#999] hover:text-[#1a1a1a]/60'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Analyses Repository */}
        {activeTab === 'analyses' && (
          <div className="space-y-6">
            {/* Explanation */}
            <div className="p-4 bg-gold/5 border border-gold/10 rounded-lg">
              <p className="text-xs text-gold/80 font-light leading-relaxed">
                A tua conta <span className="font-medium">gratuita</span> guarda todas as análises que fizeres enquanto autenticado.
                Usa as ferramentas e clica em <span className="font-medium">"Guardar na minha conta"</span> para as ver aqui.
              </p>
            </div>

            {/* Tool Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {allTools.map((tool) => {
                const count = toolCounts[tool.type] || 0;
                const config = TOOL_CONFIG[tool.type];
                const ToolIcon = tool.icon;
                return (
                  <div key={tool.type} className="border border-[#e5e5e5] rounded-lg p-5 hover:border-[#ddd] transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 bg-gold/10 rounded flex items-center justify-center">
                        <ToolIcon className={`w-4 h-4 ${config?.color || 'text-gold/70'}`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-[#1a1a1a]">{tool.label}</h3>
                        <p className="text-[10px] text-[#aaa] font-light">
                          {count > 0 ? `${count} análise${count > 1 ? 's' : ''} guardada${count > 1 ? 's' : ''}` : 'Sem análises'}
                        </p>
                      </div>
                    </div>

                    {count > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs text-[#999] font-light">
                          <Clock className="w-3 h-3" />
                          <span>Última: {formatDate(groupedAnalyses[tool.type]?.[0]?.created_at || '')}</span>
                        </div>
                        <button
                          onClick={() => {
                            const el = document.getElementById(`saved-${tool.type}`);
                            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                          className="flex items-center gap-1.5 text-xs text-gold hover:text-gold-light transition-colors"
                        >
                          Ver resultados <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-[#aaa] font-light">Ainda sem análises guardadas</p>
                        <a
                          href={tool.link}
                          className="inline-flex items-center gap-1.5 text-xs text-gold/60 hover:text-gold transition-colors"
                        >
                          Fazer análise <ArrowRight className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Saved Analyses List */}
            {loadingAnalyses ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 text-gold/40 animate-spin" />
                <span className="ml-2 text-sm text-[#999] font-light">A carregar análises...</span>
              </div>
            ) : analyses.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-[#1a1a1a]">
                    Análises guardadas ({analyses.length})
                  </h2>
                  <button
                    onClick={loadAnalyses}
                    className="flex items-center gap-1.5 text-xs text-[#999] hover:text-gold transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Atualizar
                  </button>
                </div>

                {Object.entries(groupedAnalyses).map(([type, items]) => {
                  const config = TOOL_CONFIG[type];
                  const ToolIcon = config?.icon || FileText;
                  return (
                    <div key={type} id={`saved-${type}`} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <ToolIcon className={`w-4 h-4 ${config?.color || 'text-gold/70'}`} />
                        <h3 className="text-xs font-medium text-[#555] uppercase tracking-wider">
                          {config?.label || type} ({items.length})
                        </h3>
                      </div>

                      {items.map((analysis) => (
                        <div
                          key={analysis.id}
                          className="border border-[#e5e5e5] rounded-lg hover:border-[#ddd] transition-all duration-300 overflow-hidden"
                        >
                          <div
                            className="flex items-center justify-between p-4 cursor-pointer"
                            onClick={() => setExpandedId(expandedId === analysis.id ? null : analysis.id)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-[#999] font-light">
                                  {formatDate(analysis.created_at)}
                                </span>
                              </div>
                              <p className="text-sm text-[#333] font-light truncate">
                                {getAnalysisSummary(analysis) || 'Análise guardada'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(analysis.id);
                                }}
                                disabled={deletingId === analysis.id}
                                className="p-1.5 text-[#aaa] hover:text-red-400 transition-colors"
                                title="Eliminar análise"
                              >
                                {deletingId === analysis.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <ArrowRight
                                className={`w-3.5 h-3.5 text-[#aaa] transition-transform duration-200 ${
                                  expandedId === analysis.id ? 'rotate-90' : ''
                                }`}
                              />
                            </div>
                          </div>

                          {/* Expanded details */}
                          {expandedId === analysis.id && (
                            <div className="px-4 pb-4 border-t border-[#e5e5e5]">
                              <div className="pt-3 space-y-3">
                                {/* Score summary line */}
                                {analysis.data?.score && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-[#888] font-light">Score:</span>
                                    <span className="text-sm font-medium text-gold">{analysis.data.score}/100</span>
                                  </div>
                                )}
                                {analysis.data?.total_score && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-[#888] font-light">Score:</span>
                                    <span className="text-sm font-medium text-gold">{analysis.data.total_score}{analysis.data.level ? ` — ${analysis.data.level}` : ''}</span>
                                  </div>
                                )}
                                {analysis.data?.archetype && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-[#888] font-light">Arquétipo:</span>
                                    <span className="text-sm font-medium text-gold">{analysis.data.archetype}</span>
                                  </div>
                                )}

                                {/* Render captured HTML results */}
                                {analysis.data?.results_html && (
                                  <div className="mt-3">
                                    <div
                                      className="s2i-results-render rounded-lg overflow-hidden bg-[#F0F0EE] border border-[#e5e5e5] p-4"
                                      style={{ maxHeight: '600px', overflowY: 'auto' }}
                                      dangerouslySetInnerHTML={{ __html: analysis.data.results_html }}
                                    />
                                  </div>
                                )}

                                {/* Fallback: structured data when no HTML */}
                                {!analysis.data?.results_html && analysis.analysis_type === 'cv_analyser' && analysis.data?.analysis && (
                                  <div className="space-y-2">
                                    {analysis.data.analysis.keywords && (
                                      <div>
                                        <span className="text-xs text-[#888] font-light block mb-1">Palavras-chave:</span>
                                        <p className="text-xs text-[#666] font-light">
                                          {Array.isArray(analysis.data.analysis.keywords)
                                            ? analysis.data.analysis.keywords.slice(0, 8).join(', ')
                                            : String(analysis.data.analysis.keywords).substring(0, 200)}
                                        </p>
                                      </div>
                                    )}
                                    {analysis.data.analysis.recommendations && (
                                      <div>
                                        <span className="text-xs text-[#888] font-light block mb-1">Recomendações:</span>
                                        <ul className="space-y-0.5">
                                          {(Array.isArray(analysis.data.analysis.recommendations)
                                            ? analysis.data.analysis.recommendations
                                            : []
                                          ).slice(0, 3).map((r: string, i: number) => (
                                            <li key={i} className="text-xs text-[#666] font-light pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-gold/40">
                                              {typeof r === 'string' ? r.substring(0, 150) : JSON.stringify(r).substring(0, 150)}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Fallback: Career Path structured data */}
                                {!analysis.data?.results_html && analysis.analysis_type === 'career_path' && analysis.data?.career_path_json && (
                                  <div className="space-y-2">
                                    {analysis.data.career_path_json.title && (
                                      <p className="text-xs text-[#555] font-medium">{analysis.data.career_path_json.title}</p>
                                    )}
                                    {analysis.data.career_path_json.summary && (
                                      <p className="text-xs text-[#888] font-light leading-relaxed line-clamp-4">
                                        {analysis.data.career_path_json.summary.substring(0, 400)}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Fallback: Career Energy structured data */}
                                {!analysis.data?.results_html && analysis.analysis_type === 'career_energy' && analysis.data?.dimensions && (
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                      {Object.entries(analysis.data.dimensions as Record<string, number | null>).map(([dim, val]) => (
                                        val !== null && (
                                          <div key={dim} className="flex items-center justify-between text-xs">
                                            <span className="text-[#888] font-light capitalize">{dim}:</span>
                                            <span className="text-[#555] font-medium">{val}</span>
                                          </div>
                                        )
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Fallback: results_text when no HTML */}
                                {!analysis.data?.results_html && analysis.data?.results_text && (
                                  <div>
                                    <span className="text-xs text-[#888] font-light block mb-1">Resumo:</span>
                                    <p className="text-xs text-[#888] font-light leading-relaxed">
                                      {analysis.data.results_text.substring(0, 800)}
                                    </p>
                                  </div>
                                )}

                                {/* Link to tool */}
                                {config?.link && (
                                  <a
                                    href={config.link}
                                    className="inline-flex items-center gap-1.5 text-xs text-gold/60 hover:text-gold transition-colors mt-2"
                                  >
                                    Fazer nova análise <ArrowRight className="w-3 h-3" />
                                  </a>
                                )}

                                {/* Captured at */}
                                {analysis.data?.captured_at && (
                                  <p className="text-[10px] text-[#bbb] font-light">
                                    Capturado: {formatDate(analysis.data.captured_at)}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 border border-[#e5e5e5] rounded-lg">
                <BarChart3 className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
                <p className="text-sm text-[#999] font-light mb-1">Ainda sem análises guardadas</p>
                <p className="text-xs text-[#bbb] font-light mb-4">
                  Usa as ferramentas e clica em "Guardar na minha conta" para as ver aqui.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {allTools.map(tool => (
                    <a
                      key={tool.type}
                      href={tool.link}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gold/60 border border-gold/10 rounded hover:border-gold/30 hover:text-gold transition-all"
                    >
                      <tool.icon className="w-3 h-3" />
                      {tool.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* CV Upload */}
            <div className="border border-[#e5e5e5] rounded-lg p-6">
              <h2 className="text-sm font-medium text-[#1a1a1a] mb-4">{t('dash.cv')}</h2>
              {(profile?.cv_url || profile?.cv_file_url) ? (
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-sm text-[#555]">
                    <FileText className="w-4 h-4 text-gold/60" />
                    <span className="font-light">{profile.cv_filename || 'CV carregado'}</span>
                  </div>
                  <a href={profile.cv_url || profile.cv_file_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-gold hover:text-gold-light transition-colors">
                    <Download className="w-3.5 h-3.5" />
                    {t('dash.downloadCv')}
                  </a>
                  <button onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs text-[#999] hover:text-[#1a1a1a]/60 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    {t('dash.replaceCv')}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-[#999] font-light mb-3">{t('dash.noCv')}</p>
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2 border border-[#ddd] rounded text-sm text-[#555] hover:border-gold/30 hover:text-[#1a1a1a] transition-all duration-300">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {t('dash.uploadCv')}
                  </button>
                </div>
              )}
              {cvUploaded && <p className="text-xs text-gold mt-2 font-light">{t('dash.cvUploaded')}</p>}
              <p className="text-[10px] text-[#aaa] mt-2 font-light">{t('dash.maxFileSize')}</p>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleCvUpload} className="hidden" />
            </div>

            {/* Upgrade CTA if no subscription */}
            {(!subscription || !hasActiveSubscription()) && (
              <div className="border border-gold/10 rounded-lg p-6 bg-gold/[0.02]">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center shrink-0">
                    <Compass className="w-5 h-5 text-gold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-[#1a1a1a] mb-1">Queres acesso a todas as ferramentas?</h3>
                    <p className="text-xs text-[#999] font-light mb-3">
                      Com um plano ativo, tens acesso ilimitado ao CV Maker, Career Advisory Bot, LinkedIn Roster, e-books exclusivos e muito mais.
                    </p>
                    <Link href="/planos"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-[#1a1a1a] text-sm font-medium rounded hover:bg-gold-light transition-all duration-300">
                      Ver planos <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Profile */}
        {activeTab === 'profile' && (
          <div className="border border-[#e5e5e5] rounded-lg p-6 md:p-8">
            <h2 className="text-sm font-medium text-[#1a1a1a] mb-6">{t('dash.personalInfo')}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#888] font-light mb-1.5">{t('auth.firstName')}</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f5f5f4] border border-[#ddd] rounded text-sm text-[#1a1a1a] focus:border-gold/60 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-[#888] font-light mb-1.5">{t('auth.lastName')}</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f5f5f4] border border-[#ddd] rounded text-sm text-[#1a1a1a] focus:border-gold/60 focus:outline-none transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#888] font-light mb-1.5">{t('auth.email')}</label>
                <input type="email" value={profile?.email || ''} disabled
                  className="w-full px-3 py-2.5 bg-white/[0.02] border border-[#e5e5e5] rounded text-sm text-[#888] cursor-not-allowed" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#888] font-light mb-1.5">{t('dash.phone')}</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+351 9XX XXX XXX"
                    className="w-full px-3 py-2.5 bg-[#f5f5f4] border border-[#ddd] rounded text-sm text-[#1a1a1a] placeholder-white/15 focus:border-gold/60 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-[#888] font-light mb-1.5">{t('dash.linkedin')}</label>
                  <input type="url" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..."
                    className="w-full px-3 py-2.5 bg-[#f5f5f4] border border-[#ddd] rounded text-sm text-[#1a1a1a] placeholder-white/15 focus:border-gold/60 focus:outline-none transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#888] font-light mb-1.5">{t('dash.address')}</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#f5f5f4] border border-[#ddd] rounded text-sm text-[#1a1a1a] focus:border-gold/60 focus:outline-none transition-colors" />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={saving}
                  className="px-6 py-2.5 bg-gold text-[#1a1a1a] text-sm font-medium rounded hover:bg-gold-light disabled:opacity-50 transition-all duration-300 flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
                  {saved ? t('dash.saved') : t('dash.save')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab: Resources */}
        {activeTab === 'resources' && (
          <div className="space-y-6">
            {hasActiveSubscription() ? (
              <>
                <div className="p-4 bg-gold/5 border border-gold/10 rounded-lg">
                  <p className="text-xs text-gold/80 font-light leading-relaxed">
                    Recursos exclusivos para subscritores. Faz download dos materiais que te ajudam a evoluir na carreira.
                  </p>
                </div>
                <div className="space-y-3">
                  {resources.map((resource) => {
                    const ResIcon = resource.icon;
                    return (
                      <div key={resource.id} className="border border-[#e5e5e5] rounded-lg p-5 hover:border-gold/30 transition-all duration-300">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <ResIcon className="w-5 h-5 text-gold" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-[#1a1a1a] mb-1">{resource.title}</h3>
                              <p className="text-xs text-[#999] font-light leading-relaxed mb-2">{resource.description}</p>
                              <div className="flex items-center gap-3">
                                <span className="px-2 py-0.5 bg-[#f5f5f5] rounded text-[10px] text-[#999] font-medium">{resource.type}</span>
                                <span className="text-[10px] text-[#ccc]">{resource.size}</span>
                              </div>
                            </div>
                          </div>
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="flex items-center gap-2 px-4 py-2 bg-gold text-[#1a1a1a] text-xs font-medium rounded hover:bg-gold-light transition-all duration-300 flex-shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="border border-[#e5e5e5] rounded-lg p-8 text-center">
                <div className="w-14 h-14 bg-[#f5f5f5] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6 text-[#ccc]" />
                </div>
                <h3 className="text-base font-semibold text-[#1a1a1a] mb-2">Recursos exclusivos para subscritores</h3>
                <p className="text-sm text-[#999] font-light mb-6 max-w-md mx-auto">
                  Ativa a tua subscrição para aceder a ebooks, guias e materiais exclusivos que te ajudam a evoluir na carreira.
                </p>
                <Link href="/planos"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-[#1a1a1a] text-sm font-medium rounded hover:bg-gold-light transition-all duration-300">
                  Ver planos <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab: Subscription */}
        {activeTab === 'subscription' && (
          <div className="border border-[#e5e5e5] rounded-lg p-6 md:p-8">
            <h2 className="text-sm font-medium text-[#1a1a1a] mb-4">{t('dash.subscription')}</h2>
            {subscription && hasActiveSubscription() ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-gold/10 border border-gold/20 rounded text-xs text-gold font-medium">
                    {planLabels[subscription.plan] || subscription.plan}
                  </span>
                  <span className="text-xs text-green-400/80 font-light">{t('dash.active')}</span>
                </div>
                <p className="text-xs text-[#999] font-light">
                  {t('dash.validUntil')}: {new Date(subscription.end_date).toLocaleDateString('pt-PT')}
                </p>
                <Link href="/membros" className="inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold-light transition-colors mt-2">
                  {t('nav.member')} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-xs text-[#999] font-light mb-1">{t('dash.noSubscription')}</p>
                <p className="text-xs text-[#aaa] font-light mb-4">
                  A tua conta gratuita permite guardar análises. Para aceder a todas as ferramentas premium, subscreve um plano.
                </p>
                <Link href="/planos"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-[#1a1a1a] text-sm font-medium rounded hover:bg-gold-light transition-all duration-300">
                  {t('dash.seePlans')} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
