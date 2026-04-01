/**
 * SavedJobsTracker — Dashboard de vagas guardadas (tipo Teal)
 * Funcionalidades: funil de status, tabela editável inline, filtros, pesquisa,
 * ordenação, notas, follow-up, entusiasmo, exportar CSV, adicionar manualmente, arquivar
 * Disponível para TODOS os utilizadores (incluindo gratuitos)
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Briefcase, Search, Plus, Download, ChevronDown, ChevronUp,
  ExternalLink, Trash2, Archive, Star, Calendar, StickyNote,
  CheckCircle, Clock, Phone, Award, XCircle, Filter,
  ArrowUpDown, Edit3, Save, X, MoreHorizontal, Chrome,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
type JobStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected' | 'archived';

type SavedJob = {
  id: string;
  user_id: string;
  title: string;
  company: string | null;
  location: string | null;
  salary: string | null;
  employment_type: string | null;
  description: string | null;
  url: string;
  source: string | null;
  status: JobStatus;
  notes: string | null;
  priority: number | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
};

type SortField = 'created_at' | 'title' | 'company' | 'status' | 'priority' | 'follow_up_date';
type SortDir = 'asc' | 'desc';

// ─── Status Config ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<JobStatus, { labelPt: string; labelEn: string; color: string; bgColor: string; borderColor: string; icon: typeof Briefcase }> = {
  saved:     { labelPt: 'Guardada',    labelEn: 'Saved',     color: 'text-blue-700',    bgColor: 'bg-blue-50',    borderColor: 'border-blue-200', icon: Briefcase },
  applied:   { labelPt: 'Candidatada', labelEn: 'Applied',   color: 'text-amber-700',   bgColor: 'bg-amber-50',   borderColor: 'border-amber-200', icon: CheckCircle },
  interview: { labelPt: 'Entrevista',  labelEn: 'Interview', color: 'text-violet-700',  bgColor: 'bg-violet-50',  borderColor: 'border-violet-200', icon: Phone },
  offer:     { labelPt: 'Oferta',      labelEn: 'Offer',     color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', icon: Award },
  rejected:  { labelPt: 'Rejeitada',   labelEn: 'Rejected',  color: 'text-red-700',     bgColor: 'bg-red-50',     borderColor: 'border-red-200', icon: XCircle },
  archived:  { labelPt: 'Arquivada',   labelEn: 'Archived',  color: 'text-gray-500',    bgColor: 'bg-gray-50',    borderColor: 'border-gray-200', icon: Archive },
};

const ACTIVE_STATUSES: JobStatus[] = ['saved', 'applied', 'interview', 'offer', 'rejected'];
const ALL_STATUSES: JobStatus[] = [...ACTIVE_STATUSES, 'archived'];

const SOURCE_ICONS: Record<string, string> = {
  linkedin: '🔗',
  indeed: '📋',
  glassdoor: '🏢',
  other: '🌐',
};

// ─── Component ──────────────────────────────────────────────────────────────
type Props = { lang: 'pt' | 'en' };

export default function SavedJobsTracker({ lang }: Props) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<JobStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<SavedJob>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', company: '', location: '', salary: '', url: '', employment_type: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showExtensionBanner, setShowExtensionBanner] = useState(true);

  // ─── Fetch jobs ─────────────────────────────────────────────────────────
  const fetchJobs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) setJobs(data as SavedJob[]);
    } catch (e) {
      console.error('Error fetching saved jobs:', e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // ─── Counts by status ──────────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    ALL_STATUSES.forEach(s => { counts[s] = 0; });
    jobs.forEach(j => {
      if (j.status !== 'archived') counts.all++;
      counts[j.status] = (counts[j.status] || 0) + 1;
    });
    return counts;
  }, [jobs]);

  // ─── Filtered & sorted ─────────────────────────────────────────────────
  const filteredJobs = useMemo(() => {
    let result = jobs.filter(j => {
      if (filterStatus === 'all') return j.status !== 'archived';
      return j.status === filterStatus;
    });
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(j =>
        j.title.toLowerCase().includes(q) ||
        (j.company || '').toLowerCase().includes(q) ||
        (j.location || '').toLowerCase().includes(q) ||
        (j.notes || '').toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      let va: any = a[sortField];
      let vb: any = b[sortField];
      if (va == null) va = '';
      if (vb == null) vb = '';
      if (sortField === 'priority') {
        va = a.priority || 0;
        vb = b.priority || 0;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [jobs, filterStatus, searchQuery, sortField, sortDir]);

  // ─── Update job field ───────────────────────────────────────────────────
  const updateJob = async (id: string, updates: Partial<SavedJob>) => {
    const { error } = await supabase
      .from('saved_jobs')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user?.id);
    if (!error) {
      setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
    }
  };

  // ─── Delete job ─────────────────────────────────────────────────────────
  const deleteJob = async (id: string) => {
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('id', id)
      .eq('user_id', user?.id);
    if (!error) {
      setJobs(prev => prev.filter(j => j.id !== id));
    }
  };

  // ─── Add job manually ──────────────────────────────────────────────────
  const addJob = async () => {
    if (!newJob.title.trim() || !user) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('saved_jobs')
      .insert({
        user_id: user.id,
        title: newJob.title.trim(),
        company: newJob.company.trim() || null,
        location: newJob.location.trim() || null,
        salary: newJob.salary.trim() || null,
        url: newJob.url.trim() || window.location.href,
        employment_type: newJob.employment_type || null,
        notes: newJob.notes.trim() || null,
        source: 'manual',
        status: 'saved',
      })
      .select();
    if (!error && data) {
      setJobs(prev => [data[0] as SavedJob, ...prev]);
      setNewJob({ title: '', company: '', location: '', salary: '', url: '', employment_type: '', notes: '' });
      setShowAddForm(false);
    }
    setSaving(false);
  };

  // ─── Export CSV ─────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ['Title', 'Company', 'Location', 'Salary', 'Type', 'Status', 'Source', 'URL', 'Notes', 'Priority', 'Follow-up Date', 'Saved At'];
    const rows = filteredJobs.map(j => [
      j.title, j.company || '', j.location || '', j.salary || '', j.employment_type || '',
      j.status, j.source || '', j.url, j.notes || '', j.priority || '',
      j.follow_up_date || '', j.created_at,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `share2inspire_saved_jobs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Sort toggle ────────────────────────────────────────────────────────
  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  // ─── Inline edit ────────────────────────────────────────────────────────
  const startEdit = (job: SavedJob) => {
    setEditingId(job.id);
    setEditData({ title: job.title, company: job.company, location: job.location, salary: job.salary, notes: job.notes, follow_up_date: job.follow_up_date });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await updateJob(editingId, editData);
    setEditingId(null);
    setEditData({});
  };

  const cancelEdit = () => { setEditingId(null); setEditData({}); };

  // ─── Priority stars ───────────────────────────────────────────────────
  const PriorityStars = ({ value, jobId }: { value: number | null; jobId: string }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} onClick={() => updateJob(jobId, { priority: value === i ? null : i })}
          className="p-0 border-0 bg-transparent cursor-pointer">
          <Star className={`w-3.5 h-3.5 transition-colors ${i <= (value || 0) ? 'fill-[#BF9A33] text-[#BF9A33]' : 'text-[#ddd]'}`} />
        </button>
      ))}
    </div>
  );

  // ─── Render ─────────────────────────────────────────────────────────────
  const tt = (pt: string, en: string) => lang === 'pt' ? pt : en;

  if (!user) return null;

  return (
    <section className="mb-8">
      {/* ── Extension Download Banner ── */}
      {showExtensionBanner && (
        <div className="mb-6 p-4 border border-[#BF9A33]/30 rounded-xl bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] shadow-lg relative">
          <button onClick={() => setShowExtensionBanner(false)} className="absolute top-3 right-3 text-[#999] hover:text-white transition-colors"><X className="w-4 h-4" /></button>
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-[#BF9A33] rounded-lg flex items-center justify-center">
                  <span className="text-[#1a1a1a] font-bold text-sm">S</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{tt('Extensão Chrome — Job Saver', 'Chrome Extension — Job Saver')}</h3>
                  <p className="text-[10px] text-[#BF9A33]">{tt('Guarda vagas com 1 clique', 'Save jobs with 1 click')}</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mb-3 max-w-md">
                {tt(
                  'Instala a extensão Share2Inspire no Chrome para guardar vagas automaticamente enquanto navegas no LinkedIn, Indeed ou Glassdoor. Os dados aparecem aqui no teu dashboard.',
                  'Install the Share2Inspire extension on Chrome to automatically save jobs while browsing LinkedIn, Indeed or Glassdoor. Data appears here in your dashboard.'
                )}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <a href="/assets/downloads/extension/share2inspire-job-saver.zip" download
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-semibold bg-[#BF9A33] text-[#1a1a1a] rounded-lg hover:bg-[#d4ad3a] transition-all no-underline">
                  <Download className="w-3.5 h-3.5" /> {tt('Descarregar Extensão (.zip)', 'Download Extension (.zip)')}
                </a>
                <a href="/assets/downloads/extension/tutorial-extensao.mp4" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium text-[#BF9A33] border border-[#BF9A33]/50 rounded-lg hover:bg-[#BF9A33]/10 transition-all no-underline">
                  <Chrome className="w-3.5 h-3.5" /> {tt('Ver Tutorial de Instalação', 'Watch Installation Tutorial')}
                </a>
              </div>
            </div>
            <div className="lg:w-64 shrink-0">
              <video controls className="w-full rounded-lg border border-[#333] shadow-md" preload="metadata">
                <source src="/assets/downloads/extension/tutorial-extensao.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-[#1a1a1a] flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#BF9A33]" />
            {tt('Vagas Guardadas', 'Saved Jobs')}
            <span className="text-[10px] font-normal text-[#999] bg-[#f5f5f4] px-2 py-0.5 rounded-full">{statusCounts.all}</span>
          </h2>
          <p className="text-[11px] text-[#999] mt-0.5">
            {tt('Gere as tuas candidaturas num só lugar. Usa a ', 'Manage your applications in one place. Use the ')}
            <Chrome className="w-3 h-3 inline text-[#BF9A33]" />
            {tt(' extensão Chrome para guardar vagas automaticamente.', ' Chrome extension to save jobs automatically.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-[#1a1a1a] text-[#BF9A33] border border-[#BF9A33] rounded-lg hover:bg-[#BF9A33] hover:text-[#1a1a1a] transition-all">
            <Plus className="w-3 h-3" /> {tt('Adicionar', 'Add Job')}
          </button>
          {filteredJobs.length > 0 && (
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-[#666] border border-[#e5e5e5] rounded-lg hover:border-[#BF9A33] hover:text-[#BF9A33] transition-all">
              <Download className="w-3 h-3" /> CSV
            </button>
          )}
        </div>
      </div>

      {/* ── Status Funnel ── */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        <button onClick={() => { setFilterStatus('all'); setShowArchived(false); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold rounded-full border transition-all whitespace-nowrap ${
            filterStatus === 'all' ? 'bg-[#1a1a1a] text-[#BF9A33] border-[#BF9A33]' : 'bg-white text-[#666] border-[#e5e5e5] hover:border-[#BF9A33]'
          }`}>
          {tt('Todas', 'All')} <span className="opacity-70">{statusCounts.all}</span>
        </button>
        {ACTIVE_STATUSES.map(s => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button key={s} onClick={() => { setFilterStatus(s); setShowArchived(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold rounded-full border transition-all whitespace-nowrap ${
                filterStatus === s ? `${cfg.bgColor} ${cfg.color} ${cfg.borderColor}` : 'bg-white text-[#666] border-[#e5e5e5] hover:border-[#BF9A33]'
              }`}>
              <cfg.icon className="w-3 h-3" />
              {lang === 'pt' ? cfg.labelPt : cfg.labelEn}
              <span className="opacity-70">{statusCounts[s] || 0}</span>
            </button>
          );
        })}
        <button onClick={() => { setFilterStatus('archived'); setShowArchived(true); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold rounded-full border transition-all whitespace-nowrap ${
            filterStatus === 'archived' ? 'bg-gray-100 text-gray-600 border-gray-300' : 'bg-white text-[#999] border-[#e5e5e5] hover:border-gray-400'
          }`}>
          <Archive className="w-3 h-3" />
          {tt('Arquivo', 'Archived')} <span className="opacity-70">{statusCounts.archived || 0}</span>
        </button>
      </div>

      {/* ── Search ── */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#999]" />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder={tt('Pesquisar por título, empresa, localização...', 'Search by title, company, location...')}
          className="w-full pl-9 pr-4 py-2 text-xs border border-[#e5e5e5] rounded-lg bg-white focus:outline-none focus:border-[#BF9A33] focus:ring-2 focus:ring-[#BF9A33]/10 transition-all"
        />
      </div>

      {/* ── Add Job Form ── */}
      {showAddForm && (
        <div className="mb-4 p-4 border border-[#BF9A33]/30 rounded-xl bg-white shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-[#1a1a1a]">{tt('Adicionar vaga manualmente', 'Add job manually')}</h3>
            <button onClick={() => setShowAddForm(false)} className="text-[#999] hover:text-[#1a1a1a]"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input value={newJob.title} onChange={e => setNewJob(p => ({ ...p, title: e.target.value }))}
              placeholder={tt('Título da vaga *', 'Job title *')}
              className="px-3 py-2 text-xs border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#BF9A33]" />
            <input value={newJob.company} onChange={e => setNewJob(p => ({ ...p, company: e.target.value }))}
              placeholder={tt('Empresa', 'Company')}
              className="px-3 py-2 text-xs border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#BF9A33]" />
            <input value={newJob.location} onChange={e => setNewJob(p => ({ ...p, location: e.target.value }))}
              placeholder={tt('Localização', 'Location')}
              className="px-3 py-2 text-xs border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#BF9A33]" />
            <input value={newJob.salary} onChange={e => setNewJob(p => ({ ...p, salary: e.target.value }))}
              placeholder={tt('Salário', 'Salary')}
              className="px-3 py-2 text-xs border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#BF9A33]" />
            <input value={newJob.url} onChange={e => setNewJob(p => ({ ...p, url: e.target.value }))}
              placeholder="URL"
              className="px-3 py-2 text-xs border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#BF9A33]" />
            <select value={newJob.employment_type} onChange={e => setNewJob(p => ({ ...p, employment_type: e.target.value }))}
              className="px-3 py-2 text-xs border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#BF9A33] text-[#666]">
              <option value="">{tt('Tipo...', 'Type...')}</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">{tt('Contrato', 'Contract')}</option>
              <option value="freelance">Freelance</option>
              <option value="internship">{tt('Estágio', 'Internship')}</option>
            </select>
          </div>
          <textarea value={newJob.notes} onChange={e => setNewJob(p => ({ ...p, notes: e.target.value }))}
            placeholder={tt('Notas...', 'Notes...')} rows={2}
            className="w-full px-3 py-2 text-xs border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#BF9A33] mb-3 resize-none" />
          <div className="flex gap-2">
            <button onClick={addJob} disabled={!newJob.title.trim() || saving}
              className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-semibold bg-[#1a1a1a] text-[#BF9A33] border border-[#BF9A33] rounded-lg hover:bg-[#BF9A33] hover:text-[#1a1a1a] transition-all disabled:opacity-50">
              <Save className="w-3 h-3" /> {saving ? '...' : tt('Guardar', 'Save')}
            </button>
            <button onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-[11px] text-[#666] border border-[#e5e5e5] rounded-lg hover:border-[#999] transition-all">
              {tt('Cancelar', 'Cancel')}
            </button>
          </div>
        </div>
      )}

      {/* ── Jobs Table ── */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="w-6 h-6 border-2 border-[#BF9A33] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#999]">{tt('A carregar...', 'Loading...')}</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-[#e5e5e5] rounded-xl bg-[#fafaf9]">
          <Briefcase className="w-10 h-10 text-[#ddd] mx-auto mb-3" />
          <h3 className="text-sm font-medium text-[#1a1a1a] mb-1">
            {searchQuery ? tt('Nenhum resultado', 'No results') : tt('Sem vagas guardadas', 'No saved jobs')}
          </h3>
          <p className="text-[11px] text-[#999] max-w-xs mx-auto mb-4">
            {searchQuery
              ? tt('Tenta outra pesquisa.', 'Try a different search.')
              : tt('Instala a extensão Chrome Share2Inspire para guardar vagas enquanto navegas no LinkedIn, Indeed ou Glassdoor.', 'Install the Share2Inspire Chrome extension to save jobs while browsing LinkedIn, Indeed or Glassdoor.')
            }
          </p>
          {!searchQuery && (
            <button onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium bg-[#1a1a1a] text-[#BF9A33] border border-[#BF9A33] rounded-lg hover:bg-[#BF9A33] hover:text-[#1a1a1a] transition-all">
              <Plus className="w-3 h-3" /> {tt('Adicionar manualmente', 'Add manually')}
            </button>
          )}
        </div>
      ) : (
        <div className="border border-[#e5e5e5] rounded-xl overflow-hidden bg-white shadow-sm overflow-x-auto">
          {/* Table Header */}
          <div className="hidden lg:grid lg:grid-cols-[minmax(180px,1fr)_120px_95px_85px_70px_85px_60px] gap-1 px-3 py-2.5 bg-[#f8f8f7] border-b border-[#e5e5e5] text-[10px] font-semibold text-[#999] uppercase tracking-wider">
            <button onClick={() => toggleSort('title')} className="flex items-center gap-1 text-left hover:text-[#1a1a1a] transition-colors">
              {tt('Vaga', 'Job')} <ArrowUpDown className="w-2.5 h-2.5" />
            </button>
            <button onClick={() => toggleSort('company')} className="flex items-center gap-1 text-left hover:text-[#1a1a1a] transition-colors">
              {tt('Empresa', 'Company')} <ArrowUpDown className="w-2.5 h-2.5" />
            </button>
            <button onClick={() => toggleSort('status')} className="flex items-center gap-1 text-left hover:text-[#1a1a1a] transition-colors">
              Status <ArrowUpDown className="w-2.5 h-2.5" />
            </button>
            <button onClick={() => toggleSort('created_at')} className="flex items-center gap-1 text-left hover:text-[#1a1a1a] transition-colors">
              {tt('Data', 'Date')} <ArrowUpDown className="w-2.5 h-2.5" />
            </button>
            <button onClick={() => toggleSort('priority')} className="flex items-center gap-1 text-left hover:text-[#1a1a1a] transition-colors">
              <Star className="w-2.5 h-2.5" /> <ArrowUpDown className="w-2.5 h-2.5" />
            </button>
            <span>{tt('Follow-up', 'Follow-up')}</span>
            <span></span>
          </div>

          {/* Table Rows */}
          {filteredJobs.map(job => {
            const cfg = STATUS_CONFIG[job.status];
            const isEditing = editingId === job.id;
            const sourceIcon = SOURCE_ICONS[job.source || 'other'] || '🌐';
            const isNotesExpanded = expandedNotes === job.id;

            return (
              <div key={job.id} className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fdfcfa] transition-colors">
                {/* Desktop row */}
                <div className="hidden lg:grid lg:grid-cols-[minmax(180px,1fr)_120px_95px_85px_70px_85px_60px] gap-1 px-3 py-3 items-center">
                  {/* Title + Source */}
                  <div className="min-w-0">
                    {isEditing ? (
                      <input value={editData.title || ''} onChange={e => setEditData(p => ({ ...p, title: e.target.value }))}
                        className="w-full px-2 py-1 text-xs border border-[#BF9A33] rounded focus:outline-none" />
                    ) : (
                      <div className="flex items-start gap-2">
                        <span className="text-sm" title={job.source || ''}>{sourceIcon}</span>
                        <div className="min-w-0">
                          <a href={job.url} target="_blank" rel="noopener noreferrer"
                            className="text-[12px] font-semibold text-[#1a1a1a] hover:text-[#BF9A33] transition-colors truncate block no-underline">
                            {job.title}
                          </a>
                          {job.location && <span className="text-[10px] text-[#999]">{job.location}</span>}
                          {job.salary && <span className="text-[10px] text-emerald-600 ml-2">{job.salary}</span>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Company */}
                  <div className="text-[11px] text-[#666] truncate">
                    {isEditing ? (
                      <input value={editData.company || ''} onChange={e => setEditData(p => ({ ...p, company: e.target.value }))}
                        className="w-full px-2 py-1 text-xs border border-[#BF9A33] rounded focus:outline-none" />
                    ) : job.company || '—'}
                  </div>

                  {/* Status */}
                  <select value={job.status} onChange={e => updateJob(job.id, { status: e.target.value as JobStatus })}
                    className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${cfg.bgColor} ${cfg.color} ${cfg.borderColor} cursor-pointer focus:outline-none`}>
                    {ALL_STATUSES.map(s => (
                      <option key={s} value={s}>{lang === 'pt' ? STATUS_CONFIG[s].labelPt : STATUS_CONFIG[s].labelEn}</option>
                    ))}
                  </select>

                  {/* Date */}
                  <div className="text-[10px] text-[#999]">
                    <div>{new Date(job.created_at).toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  </div>

                  {/* Priority */}
                  <PriorityStars value={job.priority} jobId={job.id} />

                  {/* Follow-up */}
                  <div>
                    <input type="date" value={job.follow_up_date || ''}
                      onChange={e => updateJob(job.id, { follow_up_date: e.target.value || null })}
                      className="text-[10px] text-[#666] border border-transparent hover:border-[#e5e5e5] rounded px-1 py-0.5 focus:outline-none focus:border-[#BF9A33] bg-transparent w-full" />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <button onClick={saveEdit} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" title="Save"><Save className="w-3.5 h-3.5" /></button>
                        <button onClick={cancelEdit} className="p-1 text-[#999] hover:bg-[#f5f5f4] rounded" title="Cancel"><X className="w-3.5 h-3.5" /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(job)} className="p-1 text-[#999] hover:text-[#BF9A33] hover:bg-[#BF9A33]/5 rounded transition-colors" title={tt('Editar', 'Edit')}><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setExpandedNotes(isNotesExpanded ? null : job.id)} className="p-1 text-[#999] hover:text-[#BF9A33] hover:bg-[#BF9A33]/5 rounded transition-colors" title={tt('Notas', 'Notes')}><StickyNote className="w-3.5 h-3.5" /></button>
                        <button onClick={() => updateJob(job.id, { status: 'archived' })} className="p-1 text-[#999] hover:text-gray-600 hover:bg-gray-50 rounded transition-colors" title={tt('Arquivar', 'Archive')}><Archive className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { if (confirm(tt('Apagar esta vaga?', 'Delete this job?'))) deleteJob(job.id); }} className="p-1 text-[#999] hover:text-red-500 hover:bg-red-50 rounded transition-colors" title={tt('Apagar', 'Delete')}><Trash2 className="w-3.5 h-3.5" /></button>
                      </>
                    )}
                  </div>
                </div>

                {/* Mobile card */}
                <div className="lg:hidden px-4 py-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm">{sourceIcon}</span>
                        <a href={job.url} target="_blank" rel="noopener noreferrer"
                          className="text-[12px] font-semibold text-[#1a1a1a] hover:text-[#BF9A33] truncate no-underline">
                          {job.title}
                        </a>
                      </div>
                      <div className="text-[11px] text-[#666]">{job.company || ''}{job.location ? ` · ${job.location}` : ''}</div>
                      {job.salary && <div className="text-[10px] text-emerald-600 mt-0.5">{job.salary}</div>}
                    </div>
                    <select value={job.status} onChange={e => updateJob(job.id, { status: e.target.value as JobStatus })}
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bgColor} ${cfg.color} ${cfg.borderColor} cursor-pointer focus:outline-none shrink-0`}>
                      {ALL_STATUSES.map(s => (
                        <option key={s} value={s}>{lang === 'pt' ? STATUS_CONFIG[s].labelPt : STATUS_CONFIG[s].labelEn}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <PriorityStars value={job.priority} jobId={job.id} />
                      <span className="text-[10px] text-[#999]">{new Date(job.created_at).toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'en-GB', { day: '2-digit', month: 'short' })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setExpandedNotes(isNotesExpanded ? null : job.id)} className="p-1 text-[#999] hover:text-[#BF9A33] rounded"><StickyNote className="w-3.5 h-3.5" /></button>
                      <button onClick={() => updateJob(job.id, { status: 'archived' })} className="p-1 text-[#999] hover:text-gray-600 rounded"><Archive className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm(tt('Apagar?', 'Delete?'))) deleteJob(job.id); }} className="p-1 text-[#999] hover:text-red-500 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>

                {/* Expanded Notes */}
                {isNotesExpanded && (
                  <div className="px-4 pb-3 animate-in fade-in duration-200">
                    <div className="p-3 bg-[#fafaf9] border border-[#e5e5e5] rounded-lg">
                      <label className="text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-1 block">{tt('Notas', 'Notes')}</label>
                      <textarea value={job.notes || ''} rows={3}
                        onChange={e => {
                          const val = e.target.value;
                          setJobs(prev => prev.map(j => j.id === job.id ? { ...j, notes: val } : j));
                        }}
                        onBlur={e => updateJob(job.id, { notes: e.target.value || null })}
                        placeholder={tt('Adiciona notas sobre esta vaga...', 'Add notes about this job...')}
                        className="w-full text-xs text-[#333] bg-white border border-[#e5e5e5] rounded-lg px-3 py-2 focus:outline-none focus:border-[#BF9A33] resize-none" />
                      <div className="flex gap-2 mt-2">
                        <div className="flex-1">
                          <label className="text-[9px] font-semibold text-[#999] uppercase mb-0.5 block">{tt('Follow-up', 'Follow-up')}</label>
                          <input type="date" value={job.follow_up_date || ''}
                            onChange={e => updateJob(job.id, { follow_up_date: e.target.value || null })}
                            className="w-full text-[10px] border border-[#e5e5e5] rounded px-2 py-1 focus:outline-none focus:border-[#BF9A33]" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
