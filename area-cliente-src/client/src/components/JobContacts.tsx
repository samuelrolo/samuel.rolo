/**
 * JobContacts — Secção de contactos (recrutadores/hiring managers) no pipeline de vagas
 * Permite associar contactos a vagas, com lembretes de follow-up.
 * Especialmente valioso para o mercado português onde o networking é crucial.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users, Plus, Search, Edit3, Save, X, Trash2, ExternalLink,
  Calendar, Bell, CheckCircle, Clock, Mail, Phone, Linkedin,
  ChevronDown, ChevronUp, ArrowUpDown, UserPlus, Building2,
  MessageSquare, AlertCircle, Filter,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
type FollowUpStatus = 'pending' | 'done' | 'skipped';

type JobContact = {
  id: string;
  user_id: string;
  job_id: string | null;
  name: string;
  role: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  relationship: string | null;
  notes: string | null;
  last_contact_date: string | null;
  next_follow_up: string | null;
  follow_up_status: FollowUpStatus;
  created_at: string;
  updated_at: string;
};

type SavedJobRef = {
  id: string;
  title: string;
  company: string | null;
};

type SortField = 'name' | 'company' | 'next_follow_up' | 'created_at';
type SortDir = 'asc' | 'desc';

// ─── Role & Relationship presets ────────────────────────────────────────────
const ROLE_OPTIONS_PT = ['Recrutador', 'Hiring Manager', 'RH', 'Referência', 'Head of Department', 'CEO/Fundador', 'Outro'];
const ROLE_OPTIONS_EN = ['Recruiter', 'Hiring Manager', 'HR', 'Referral', 'Head of Department', 'CEO/Founder', 'Other'];
const ROLE_OPTIONS_ES = ['Reclutador', 'Hiring Manager', 'RRHH', 'Referencia', 'Head of Department', 'CEO/Fundador', 'Otro'];

const RELATIONSHIP_OPTIONS_PT = ['Contacto direto', 'Referência', 'Recrutador externo', 'LinkedIn', 'Evento/Conferência', 'Outro'];
const RELATIONSHIP_OPTIONS_EN = ['Direct contact', 'Referral', 'External recruiter', 'LinkedIn', 'Event/Conference', 'Other'];
const RELATIONSHIP_OPTIONS_ES = ['Contacto directo', 'Referencia', 'Reclutador externo', 'LinkedIn', 'Evento/Conferencia', 'Otro'];

// ─── Follow-up status config ────────────────────────────────────────────────
const FOLLOWUP_CONFIG: Record<FollowUpStatus, { labelPt: string; labelEn: string; labelEs: string; color: string; bgColor: string; borderColor: string; icon: typeof Clock }> = {
  pending: { labelPt: 'Pendente', labelEn: 'Pending', labelEs: 'Pendiente', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', icon: Clock },
  done:    { labelPt: 'Feito',    labelEn: 'Done',    labelEs: 'Hecho',     color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', icon: CheckCircle },
  skipped: { labelPt: 'Ignorado', labelEn: 'Skipped', labelEs: 'Omitido',   color: 'text-gray-500', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', icon: X },
};

// ─── Component ──────────────────────────────────────────────────────────────
type Props = { lang: 'pt' | 'en' | 'es' };

export default function JobContacts({ lang }: Props) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<JobContact[]>([]);
  const [jobs, setJobs] = useState<SavedJobRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFollowUp, setFilterFollowUp] = useState<FollowUpStatus | 'all' | 'overdue'>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<JobContact>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '', role: '', company: '', email: '', phone: '', linkedin_url: '',
    relationship: '', notes: '', job_id: '', next_follow_up: '', last_contact_date: '',
  });

  const tt = (pt: string, en: string, es?: string) => lang === 'pt' ? pt : lang === 'es' ? (es ?? en) : en;
  const roleOptions = lang === 'pt' ? ROLE_OPTIONS_PT : lang === 'es' ? ROLE_OPTIONS_ES : ROLE_OPTIONS_EN;
  const relationshipOptions = lang === 'pt' ? RELATIONSHIP_OPTIONS_PT : lang === 'es' ? RELATIONSHIP_OPTIONS_ES : RELATIONSHIP_OPTIONS_EN;

  // ─── Fetch contacts ─────────────────────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) setContacts(data as JobContact[]);
    } catch (e) {
      console.error('Error fetching contacts:', e);
    }
    setLoading(false);
  }, [user]);

  // ─── Fetch saved jobs for association ──────────────────────────────────
  const fetchJobs = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('saved_jobs')
        .select('id, title, company')
        .eq('user_id', user.id)
        .neq('status', 'archived')
        .order('created_at', { ascending: false });
      if (!error && data) setJobs(data as SavedJobRef[]);
    } catch (e) {
      console.error('Error fetching jobs:', e);
    }
  }, [user]);

  useEffect(() => { fetchContacts(); fetchJobs(); }, [fetchContacts, fetchJobs]);

  // ─── Counts ────────────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      all: contacts.length,
      pending: contacts.filter(c => c.follow_up_status === 'pending' && c.next_follow_up).length,
      overdue: contacts.filter(c => c.follow_up_status === 'pending' && c.next_follow_up && c.next_follow_up <= today).length,
      done: contacts.filter(c => c.follow_up_status === 'done').length,
    };
  }, [contacts]);

  // ─── Filtered & sorted ─────────────────────────────────────────────────
  const filteredContacts = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    let result = contacts;

    // Filter by follow-up status
    if (filterFollowUp === 'overdue') {
      result = result.filter(c => c.follow_up_status === 'pending' && c.next_follow_up && c.next_follow_up <= today);
    } else if (filterFollowUp !== 'all') {
      result = result.filter(c => c.follow_up_status === filterFollowUp);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q) ||
        (c.role || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.notes || '').toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let va: any = a[sortField];
      let vb: any = b[sortField];
      if (va == null) va = '';
      if (vb == null) vb = '';
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [contacts, filterFollowUp, searchQuery, sortField, sortDir]);

  // ─── CRUD ──────────────────────────────────────────────────────────────
  const addContact = async () => {
    if (!newContact.name.trim() || !user) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('job_contacts')
      .insert({
        user_id: user.id,
        name: newContact.name.trim(),
        role: newContact.role || null,
        company: newContact.company.trim() || null,
        email: newContact.email.trim() || null,
        phone: newContact.phone.trim() || null,
        linkedin_url: newContact.linkedin_url.trim() || null,
        relationship: newContact.relationship || null,
        notes: newContact.notes.trim() || null,
        job_id: newContact.job_id || null,
        next_follow_up: newContact.next_follow_up || null,
        last_contact_date: newContact.last_contact_date || null,
        follow_up_status: 'pending',
      })
      .select();
    if (!error && data) {
      setContacts(prev => [data[0] as JobContact, ...prev]);
      setNewContact({ name: '', role: '', company: '', email: '', phone: '', linkedin_url: '', relationship: '', notes: '', job_id: '', next_follow_up: '', last_contact_date: '' });
      setShowAddForm(false);
    }
    setSaving(false);
  };

  const updateContact = async (id: string, updates: Partial<JobContact>) => {
    const { error } = await supabase
      .from('job_contacts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user?.id);
    if (!error) {
      setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    }
  };

  const deleteContact = async (id: string) => {
    const { error } = await supabase
      .from('job_contacts')
      .delete()
      .eq('id', id)
      .eq('user_id', user?.id);
    if (!error) {
      setContacts(prev => prev.filter(c => c.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
  };

  const startEdit = (contact: JobContact) => {
    setEditingId(contact.id);
    setEditData({
      name: contact.name, role: contact.role, company: contact.company,
      email: contact.email, phone: contact.phone, linkedin_url: contact.linkedin_url,
      relationship: contact.relationship, notes: contact.notes,
      job_id: contact.job_id, next_follow_up: contact.next_follow_up,
      last_contact_date: contact.last_contact_date,
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await updateContact(editingId, editData);
    setEditingId(null);
    setEditData({});
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  // ─── Helper: get job label ─────────────────────────────────────────────
  const getJobLabel = (jobId: string | null) => {
    if (!jobId) return null;
    const job = jobs.find(j => j.id === jobId);
    return job ? `${job.title}${job.company ? ` — ${job.company}` : ''}` : null;
  };

  // ─── Helper: is overdue ────────────────────────────────────────────────
  const isOverdue = (contact: JobContact) => {
    if (!contact.next_follow_up || contact.follow_up_status !== 'pending') return false;
    return contact.next_follow_up <= new Date().toISOString().slice(0, 10);
  };

  // ─── Helper: days until follow-up ──────────────────────────────────────
  const daysUntilFollowUp = (date: string | null) => {
    if (!date) return null;
    const diff = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (!user) return null;

  return (
    <section className="mb-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-[#1a1a1a] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#BF9A33]" />
            {tt('Contactos', 'Contacts', 'Contactos')}
            <span className="text-[10px] font-normal text-[#999] bg-[#f5f5f4] px-2 py-0.5 rounded-full">{counts.all}</span>
            {counts.overdue > 0 && (
              <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {counts.overdue} {tt('atrasado(s)', 'overdue')}
              </span>
            )}
          </h2>
          <p className="text-[11px] text-[#999] mt-0.5">
            {tt(
              'Gere os teus contactos de recrutadores e hiring managers. Associa-os a vagas e define lembretes de follow-up.',
              'Manage your recruiter and hiring manager contacts. Link them to jobs and set follow-up reminders.'
            )}
          </p>
        </div>
        <button onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-[#1a1a1a] text-[#BF9A33] border border-[#BF9A33] rounded-lg hover:bg-[#BF9A33] hover:text-[#1a1a1a] transition-all">
          <UserPlus className="w-3 h-3" /> {tt('Adicionar Contacto', 'Add Contact', 'Añadir Contacto')}
        </button>
      </div>

      {/* ── Filter pills ── */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        <button onClick={() => setFilterFollowUp('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold rounded-full border transition-all whitespace-nowrap ${
            filterFollowUp === 'all' ? 'bg-[#1a1a1a] text-[#BF9A33] border-[#BF9A33]' : 'bg-white text-[#666] border-[#e5e5e5] hover:border-[#BF9A33]'
          }`}>
          {tt('Todos', 'All')} <span className="opacity-70">{counts.all}</span>
        </button>
        {counts.overdue > 0 && (
          <button onClick={() => setFilterFollowUp('overdue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold rounded-full border transition-all whitespace-nowrap ${
              filterFollowUp === 'overdue' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-red-500 border-[#e5e5e5] hover:border-red-300'
            }`}>
            <AlertCircle className="w-3 h-3" /> {tt('Atrasados', 'Overdue')} <span className="opacity-70">{counts.overdue}</span>
          </button>
        )}
        <button onClick={() => setFilterFollowUp('pending')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold rounded-full border transition-all whitespace-nowrap ${
            filterFollowUp === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-[#666] border-[#e5e5e5] hover:border-[#BF9A33]'
          }`}>
          <Clock className="w-3 h-3" /> {tt('Pendentes', 'Pending')} <span className="opacity-70">{counts.pending}</span>
        </button>
        <button onClick={() => setFilterFollowUp('done')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold rounded-full border transition-all whitespace-nowrap ${
            filterFollowUp === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-[#666] border-[#e5e5e5] hover:border-[#BF9A33]'
          }`}>
          <CheckCircle className="w-3 h-3" /> {tt('Feitos', 'Done')} <span className="opacity-70">{counts.done}</span>
        </button>
      </div>

      {/* ── Search ── */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#999]" />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder={tt('Pesquisar por nome, empresa, cargo...', 'Search by name, company, role...', 'Buscar por nombre, empresa, cargo...')}
          className="w-full pl-9 pr-4 py-2 text-xs border border-[#e5e5e5] rounded-lg bg-white focus:outline-none focus:border-[#BF9A33] focus:ring-2 focus:ring-[#BF9A33]/10 transition-all"
        />
      </div>

      {/* ── Add Contact Form ── */}
      {showAddForm && (
        <div className="mb-4 p-4 border border-[#BF9A33]/30 rounded-xl bg-white shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-[#1a1a1a] flex items-center gap-2">
              <UserPlus className="w-3.5 h-3.5 text-[#BF9A33]" />
              {tt('Novo Contacto', 'New Contact')}
            </h3>
            <button onClick={() => setShowAddForm(false)} className="text-[#999] hover:text-[#1a1a1a]"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input value={newContact.name} onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))}
              placeholder={tt('Nome *', 'Name *')}
              className="px-3 py-2 text-xs border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#BF9A33]" />
            <select value={newContact.role} onChange={e => setNewContact(p => ({ ...p, role: e.target.value }))}
              className="px-3 py-2 text-xs border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#BF9A33] text-[#666]">
              <option value="">{tt('Cargo...', 'Role...')}</option>
              {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <input value={newContact.company} onChange={e => setNewContact(p => ({ ...p, company: e.target.value }))}
              placeholder={tt('Empresa', 'Company', 'Empresa')}
              className="px-3 py-2 text-xs border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#BF9A33]" />
            <input value={newContact.email} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))}
              placeholder="Email"
              className="px-3 py-2 text-xs border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#BF9A33]" />
            <input value={newContact.phone} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))}
              placeholder={tt('Telefone', 'Phone', 'Teléfono')}
              className="px-3 py-2 text-xs border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#BF9A33]" />
            <input value={newContact.linkedin_url} onChange={e => setNewContact(p => ({ ...p, linkedin_url: e.target.value }))}
              placeholder="LinkedIn URL"
              className="px-3 py-2 text-xs border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#BF9A33]" />
            <select value={newContact.relationship} onChange={e => setNewContact(p => ({ ...p, relationship: e.target.value }))}
              className="px-3 py-2 text-xs border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#BF9A33] text-[#666]">
              <option value="">{tt('Tipo de relação...', 'Relationship...', 'Tipo de relación...')}</option>
              {relationshipOptions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={newContact.job_id} onChange={e => setNewContact(p => ({ ...p, job_id: e.target.value }))}
              className="px-3 py-2 text-xs border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#BF9A33] text-[#666]">
              <option value="">{tt('Associar a vaga...', 'Link to job...', 'Vincular a empleo...')}</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title}{j.company ? ` — ${j.company}` : ''}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[9px] font-semibold text-[#999] uppercase tracking-wider mb-1 block">
                {tt('Último contacto', 'Last contact', 'Último contacto')}
              </label>
              <input type="date" value={newContact.last_contact_date} onChange={e => setNewContact(p => ({ ...p, last_contact_date: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#BF9A33]" />
            </div>
            <div>
              <label className="text-[9px] font-semibold text-[#999] uppercase tracking-wider mb-1 block">
                {tt('Próximo follow-up', 'Next follow-up', 'Próximo seguimiento')}
              </label>
              <input type="date" value={newContact.next_follow_up} onChange={e => setNewContact(p => ({ ...p, next_follow_up: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#BF9A33]" />
            </div>
          </div>

          <textarea value={newContact.notes} onChange={e => setNewContact(p => ({ ...p, notes: e.target.value }))}
            placeholder={tt('Notas (contexto da conversa, próximos passos...)', 'Notes (conversation context, next steps...)', 'Notas (contexto de la conversación, próximos pasos...)')} rows={2}
            className="w-full px-3 py-2 text-xs border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#BF9A33] mb-3 resize-none" />

          <div className="flex gap-2">
            <button onClick={addContact} disabled={!newContact.name.trim() || saving}
              className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-semibold bg-[#1a1a1a] text-[#BF9A33] border border-[#BF9A33] rounded-lg hover:bg-[#BF9A33] hover:text-[#1a1a1a] transition-all disabled:opacity-50">
              <Save className="w-3 h-3" /> {saving ? '...' : tt('Guardar', 'Save', 'Guardar')}
            </button>
            <button onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-[11px] text-[#666] border border-[#e5e5e5] rounded-lg hover:border-[#999] transition-all">
              {tt('Cancelar', 'Cancel', 'Cancelar')}
            </button>
          </div>
        </div>
      )}

      {/* ── Contacts List ── */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="w-6 h-6 border-2 border-[#BF9A33] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#999]">{tt('A carregar...', 'Loading...', 'Cargando...')}</p>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-[#e5e5e5] rounded-xl bg-[#fafaf9]">
          <Users className="w-10 h-10 text-[#ddd] mx-auto mb-3" />
          <h3 className="text-sm font-medium text-[#1a1a1a] mb-1">
            {searchQuery ? tt('Nenhum resultado', 'No results', 'Sin resultados') : tt('Sem contactos', 'No contacts yet', 'Sin contactos aún')}
          </h3>
          <p className="text-[11px] text-[#999] max-w-xs mx-auto mb-4">
            {searchQuery
              ? tt('Tenta outra pesquisa.', 'Try a different search.', 'Prueba otra búsqueda.')
              : tt(
                  'Adiciona recrutadores, hiring managers e outros contactos importantes para acompanhar as tuas candidaturas.',
                  'Add recruiters, hiring managers and other key contacts to track your applications.'
                )
            }
          </p>
          {!searchQuery && (
            <button onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium bg-[#1a1a1a] text-[#BF9A33] border border-[#BF9A33] rounded-lg hover:bg-[#BF9A33] hover:text-[#1a1a1a] transition-all">
              <UserPlus className="w-3 h-3" /> {tt('Adicionar contacto', 'Add contact', 'Añadir contacto')}
            </button>
          )}
        </div>
      ) : (
        <div className="border border-[#e5e5e5] rounded-xl overflow-hidden bg-white shadow-sm">
          {/* Table Header */}
          <div className="hidden lg:grid lg:grid-cols-[25%_15%_15%_15%_15%_15%] px-3 py-2.5 bg-[#f8f8f7] border-b border-[#e5e5e5] text-[10px] font-semibold text-[#999] uppercase tracking-wider">
            <button onClick={() => toggleSort('name')} className="flex items-center gap-1 text-left hover:text-[#1a1a1a] transition-colors">
              {tt('Nome', 'Name', 'Nombre')} <ArrowUpDown className="w-2.5 h-2.5" />
            </button>
            <button onClick={() => toggleSort('company')} className="flex items-center gap-1 text-left hover:text-[#1a1a1a] transition-colors">
              {tt('Empresa', 'Company', 'Empresa')} <ArrowUpDown className="w-2.5 h-2.5" />
            </button>
            <span>{tt('Cargo', 'Role', 'Cargo')}</span>
            <span>{tt('Vaga Associada', 'Linked Job', 'Empleo Vinculado')}</span>
            <button onClick={() => toggleSort('next_follow_up')} className="flex items-center gap-1 text-left hover:text-[#1a1a1a] transition-colors">
              Follow-up <ArrowUpDown className="w-2.5 h-2.5" />
            </button>
            <span></span>
          </div>

          {/* Contact Rows */}
          {filteredContacts.map(contact => {
            const isExpanded = expandedId === contact.id;
            const isEditing = editingId === contact.id;
            const overdue = isOverdue(contact);
            const days = daysUntilFollowUp(contact.next_follow_up);
            const jobLabel = getJobLabel(contact.job_id);
            const fuCfg = FOLLOWUP_CONFIG[contact.follow_up_status];

            return (
              <div key={contact.id} className={`border-b border-[#f0f0f0] last:border-b-0 transition-colors ${overdue ? 'bg-red-50/30' : 'hover:bg-[#fdfcfa]'}`}>
                {/* Desktop row */}
                <div className="hidden lg:grid lg:grid-cols-[25%_15%_15%_15%_15%_15%] px-3 py-3 items-center">
                  {/* Name + contact icons */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#BF9A33]/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-[#BF9A33]">{contact.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[12px] font-semibold text-[#1a1a1a] block truncate">{contact.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {contact.email && (
                            <a href={`mailto:${contact.email}`} className="text-[#999] hover:text-[#BF9A33] transition-colors" title={contact.email}>
                              <Mail className="w-3 h-3" />
                            </a>
                          )}
                          {contact.phone && (
                            <a href={`tel:${contact.phone}`} className="text-[#999] hover:text-[#BF9A33] transition-colors" title={contact.phone}>
                              <Phone className="w-3 h-3" />
                            </a>
                          )}
                          {contact.linkedin_url && (
                            <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[#999] hover:text-[#0077B5] transition-colors" title="LinkedIn">
                              <Linkedin className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Company */}
                  <div className="text-[11px] text-[#666] truncate">{contact.company || '—'}</div>

                  {/* Role */}
                  <div className="text-[11px] text-[#666] truncate">
                    {contact.role && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#f5f5f4] text-[#666] border border-[#e5e5e5]">
                        {contact.role}
                      </span>
                    )}
                    {!contact.role && '—'}
                  </div>

                  {/* Linked Job */}
                  <div className="text-[10px] text-[#999] truncate" title={jobLabel || ''}>
                    {jobLabel ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        <Building2 className="w-2.5 h-2.5" />
                        <span className="truncate max-w-[100px]">{jobLabel}</span>
                      </span>
                    ) : (
                      <span className="text-[#ccc]">—</span>
                    )}
                  </div>

                  {/* Follow-up */}
                  <div>
                    {contact.next_follow_up ? (
                      <div className="flex flex-col gap-0.5">
                        <div className={`flex items-center gap-1 text-[10px] font-medium ${overdue ? 'text-red-600' : days !== null && days <= 2 ? 'text-amber-600' : 'text-[#666]'}`}>
                          {overdue ? <AlertCircle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                          {new Date(contact.next_follow_up).toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'en-GB', { day: '2-digit', month: 'short' })}
                        </div>
                        {overdue && <span className="text-[9px] text-red-500 font-medium">{tt('Atrasado', 'Overdue', 'Atrasado')}</span>}
                        {!overdue && days !== null && days >= 0 && (
                          <span className="text-[9px] text-[#999]">
                            {days === 0 ? tt('Hoje', 'Today', 'Hoy') : days === 1 ? tt('Amanhã', 'Tomorrow', 'Mañana') : `${days} ${tt('dias', 'days', 'días')}`}
                          </span>
                        )}
                        <select value={contact.follow_up_status}
                          onChange={e => updateContact(contact.id, { follow_up_status: e.target.value as FollowUpStatus })}
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${fuCfg.bgColor} ${fuCfg.color} ${fuCfg.borderColor} cursor-pointer focus:outline-none mt-0.5`}>
                          {(['pending', 'done', 'skipped'] as FollowUpStatus[]).map(s => (
                            <option key={s} value={s}>{lang === 'pt' ? FOLLOWUP_CONFIG[s].labelPt : lang === 'es' ? FOLLOWUP_CONFIG[s].labelEs : FOLLOWUP_CONFIG[s].labelEn}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <input type="date"
                        onChange={e => updateContact(contact.id, { next_follow_up: e.target.value || null })}
                        className="text-[10px] text-[#999] border border-transparent hover:border-[#e5e5e5] rounded px-1 py-0.5 focus:outline-none focus:border-[#BF9A33] bg-transparent w-full"
                        title={tt('Definir follow-up', 'Set follow-up', 'Establecer seguimiento')}
                      />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => setExpandedId(isExpanded ? null : contact.id)}
                      className="p-1 text-[#999] hover:text-[#BF9A33] hover:bg-[#BF9A33]/5 rounded transition-colors"
                      title={tt('Detalhes', 'Details', 'Detalles')}>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => startEdit(contact)}
                      className="p-1 text-[#999] hover:text-[#BF9A33] hover:bg-[#BF9A33]/5 rounded transition-colors"
                      title={tt('Editar', 'Edit', 'Editar')}>
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { if (confirm(tt('Apagar este contacto?', 'Delete this contact?', '¿Eliminar este contacto?'))) deleteContact(contact.id); }}
                      className="p-1 text-[#999] hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title={tt('Apagar', 'Delete', 'Eliminar')}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Mobile card */}
                <div className="lg:hidden px-4 py-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-[#BF9A33]/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-[#BF9A33]">{contact.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[12px] font-semibold text-[#1a1a1a] block truncate">{contact.name}</span>
                        <div className="text-[10px] text-[#666]">
                          {contact.role && <span>{contact.role}</span>}
                          {contact.role && contact.company && <span> · </span>}
                          {contact.company && <span>{contact.company}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {contact.email && <a href={`mailto:${contact.email}`} className="p-1 text-[#999] hover:text-[#BF9A33]"><Mail className="w-3.5 h-3.5" /></a>}
                      {contact.linkedin_url && <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-1 text-[#999] hover:text-[#0077B5]"><Linkedin className="w-3.5 h-3.5" /></a>}
                    </div>
                  </div>
                  {/* Mobile follow-up + actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {contact.next_follow_up && (
                        <span className={`text-[10px] font-medium flex items-center gap-1 ${overdue ? 'text-red-600' : 'text-[#666]'}`}>
                          {overdue ? <AlertCircle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                          {new Date(contact.next_follow_up).toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'en-GB', { day: '2-digit', month: 'short' })}
                          {overdue && <span className="text-red-500 ml-1">{tt('Atrasado', 'Overdue', 'Atrasado')}</span>}
                        </span>
                      )}
                      {jobLabel && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 truncate max-w-[120px]">
                          {jobLabel}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setExpandedId(isExpanded ? null : contact.id)} className="p-1 text-[#999] hover:text-[#BF9A33] rounded">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => { if (confirm(tt('Apagar?', 'Delete?', '¿Eliminar?'))) deleteContact(contact.id); }} className="p-1 text-[#999] hover:text-red-500 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded details / Edit form */}
                {isExpanded && (
                  <div className="px-4 pb-3 animate-in fade-in duration-200">
                    <div className="p-3 bg-[#fafaf9] border border-[#e5e5e5] rounded-lg">
                      {isEditing ? (
                        /* ── Inline Edit Form ── */
                        <div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="text-[9px] font-semibold text-[#999] uppercase mb-0.5 block">{tt('Nome', 'Name', 'Nombre')}</label>
                              <input value={editData.name || ''} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))}
                                className="w-full px-2 py-1.5 text-xs border border-[#BF9A33] rounded-lg focus:outline-none" />
                            </div>
                            <div>
                              <label className="text-[9px] font-semibold text-[#999] uppercase mb-0.5 block">{tt('Cargo', 'Role', 'Cargo')}</label>
                              <select value={editData.role || ''} onChange={e => setEditData(p => ({ ...p, role: e.target.value || null }))}
                                className="w-full px-2 py-1.5 text-xs border border-[#BF9A33] rounded-lg focus:outline-none">
                                <option value="">{tt('Selecionar...', 'Select...', 'Seleccionar...')}</option>
                                {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-[9px] font-semibold text-[#999] uppercase mb-0.5 block">{tt('Empresa', 'Company', 'Empresa')}</label>
                              <input value={editData.company || ''} onChange={e => setEditData(p => ({ ...p, company: e.target.value || null }))}
                                className="w-full px-2 py-1.5 text-xs border border-[#BF9A33] rounded-lg focus:outline-none" />
                            </div>
                            <div>
                              <label className="text-[9px] font-semibold text-[#999] uppercase mb-0.5 block">Email</label>
                              <input value={editData.email || ''} onChange={e => setEditData(p => ({ ...p, email: e.target.value || null }))}
                                className="w-full px-2 py-1.5 text-xs border border-[#BF9A33] rounded-lg focus:outline-none" />
                            </div>
                            <div>
                              <label className="text-[9px] font-semibold text-[#999] uppercase mb-0.5 block">{tt('Telefone', 'Phone', 'Teléfono')}</label>
                              <input value={editData.phone || ''} onChange={e => setEditData(p => ({ ...p, phone: e.target.value || null }))}
                                className="w-full px-2 py-1.5 text-xs border border-[#BF9A33] rounded-lg focus:outline-none" />
                            </div>
                            <div>
                              <label className="text-[9px] font-semibold text-[#999] uppercase mb-0.5 block">LinkedIn</label>
                              <input value={editData.linkedin_url || ''} onChange={e => setEditData(p => ({ ...p, linkedin_url: e.target.value || null }))}
                                className="w-full px-2 py-1.5 text-xs border border-[#BF9A33] rounded-lg focus:outline-none" />
                            </div>
                            <div>
                              <label className="text-[9px] font-semibold text-[#999] uppercase mb-0.5 block">{tt('Relação', 'Relationship', 'Relación')}</label>
                              <select value={editData.relationship || ''} onChange={e => setEditData(p => ({ ...p, relationship: e.target.value || null }))}
                                className="w-full px-2 py-1.5 text-xs border border-[#BF9A33] rounded-lg focus:outline-none">
                                <option value="">{tt('Selecionar...', 'Select...', 'Seleccionar...')}</option>
                                {relationshipOptions.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-[9px] font-semibold text-[#999] uppercase mb-0.5 block">{tt('Vaga associada', 'Linked job', 'Empleo vinculado')}</label>
                              <select value={editData.job_id || ''} onChange={e => setEditData(p => ({ ...p, job_id: e.target.value || null }))}
                                className="w-full px-2 py-1.5 text-xs border border-[#BF9A33] rounded-lg focus:outline-none">
                                <option value="">{tt('Nenhuma', 'None', 'Ninguno')}</option>
                                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}{j.company ? ` — ${j.company}` : ''}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-[9px] font-semibold text-[#999] uppercase mb-0.5 block">{tt('Último contacto', 'Last contact', 'Último contacto')}</label>
                              <input type="date" value={editData.last_contact_date || ''}
                                onChange={e => setEditData(p => ({ ...p, last_contact_date: e.target.value || null }))}
                                className="w-full px-2 py-1.5 text-xs border border-[#BF9A33] rounded-lg focus:outline-none" />
                            </div>
                            <div>
                              <label className="text-[9px] font-semibold text-[#999] uppercase mb-0.5 block">{tt('Próximo follow-up', 'Next follow-up', 'Próximo seguimiento')}</label>
                              <input type="date" value={editData.next_follow_up || ''}
                                onChange={e => setEditData(p => ({ ...p, next_follow_up: e.target.value || null }))}
                                className="w-full px-2 py-1.5 text-xs border border-[#BF9A33] rounded-lg focus:outline-none" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] font-semibold text-[#999] uppercase mb-0.5 block">{tt('Notas', 'Notes', 'Notas')}</label>
                            <textarea value={editData.notes || ''} rows={3}
                              onChange={e => setEditData(p => ({ ...p, notes: e.target.value || null }))}
                              className="w-full px-2 py-1.5 text-xs border border-[#BF9A33] rounded-lg focus:outline-none resize-none mb-3" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={saveEdit} className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold bg-[#1a1a1a] text-[#BF9A33] border border-[#BF9A33] rounded-lg hover:bg-[#BF9A33] hover:text-[#1a1a1a] transition-all">
                              <Save className="w-3 h-3" /> {tt('Guardar', 'Save', 'Guardar')}
                            </button>
                            <button onClick={() => { setEditingId(null); setEditData({}); }}
                              className="px-3 py-1.5 text-[11px] text-[#666] border border-[#e5e5e5] rounded-lg hover:border-[#999] transition-all">
                              {tt('Cancelar', 'Cancel', 'Cancelar')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── Read-only details ── */
                        <div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                            {contact.email && (
                              <div>
                                <span className="text-[9px] font-semibold text-[#999] uppercase block mb-0.5">Email</span>
                                <a href={`mailto:${contact.email}`} className="text-[11px] text-[#1a1a1a] hover:text-[#BF9A33] transition-colors">{contact.email}</a>
                              </div>
                            )}
                            {contact.phone && (
                              <div>
                                <span className="text-[9px] font-semibold text-[#999] uppercase block mb-0.5">{tt('Telefone', 'Phone', 'Teléfono')}</span>
                                <a href={`tel:${contact.phone}`} className="text-[11px] text-[#1a1a1a] hover:text-[#BF9A33] transition-colors">{contact.phone}</a>
                              </div>
                            )}
                            {contact.linkedin_url && (
                              <div>
                                <span className="text-[9px] font-semibold text-[#999] uppercase block mb-0.5">LinkedIn</span>
                                <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#0077B5] hover:underline flex items-center gap-1">
                                  <ExternalLink className="w-3 h-3" /> {tt('Ver perfil', 'View profile', 'Ver perfil')}
                                </a>
                              </div>
                            )}
                            {contact.relationship && (
                              <div>
                                <span className="text-[9px] font-semibold text-[#999] uppercase block mb-0.5">{tt('Relação', 'Relationship', 'Relación')}</span>
                                <span className="text-[11px] text-[#666]">{contact.relationship}</span>
                              </div>
                            )}
                            {contact.last_contact_date && (
                              <div>
                                <span className="text-[9px] font-semibold text-[#999] uppercase block mb-0.5">{tt('Último contacto', 'Last contact', 'Último contacto')}</span>
                                <span className="text-[11px] text-[#666]">
                                  {new Date(contact.last_contact_date).toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            )}
                            {jobLabel && (
                              <div>
                                <span className="text-[9px] font-semibold text-[#999] uppercase block mb-0.5">{tt('Vaga associada', 'Linked job', 'Empleo vinculado')}</span>
                                <span className="text-[11px] text-blue-700 flex items-center gap-1"><Building2 className="w-3 h-3" /> {jobLabel}</span>
                              </div>
                            )}
                          </div>
                          {contact.notes && (
                            <div className="mb-3">
                              <span className="text-[9px] font-semibold text-[#999] uppercase block mb-0.5">{tt('Notas', 'Notes', 'Notas')}</span>
                              <p className="text-[11px] text-[#666] whitespace-pre-wrap leading-relaxed">{contact.notes}</p>
                            </div>
                          )}
                          <button onClick={() => startEdit(contact)}
                            className="flex items-center gap-1 text-[10px] text-[#BF9A33] hover:underline font-medium">
                            <Edit3 className="w-3 h-3" /> {tt('Editar contacto', 'Edit contact', 'Editar contacto')}
                          </button>
                        </div>
                      )}
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
