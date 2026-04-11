import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FileText, Send, Download, Loader2, Plus, Trash2, ChevronDown, ChevronUp, MessageSquare, Edit3, Eye, Palette, GripVertical, Globe, Award, User, Briefcase, GraduationCap, Star, Languages } from 'lucide-react';
import jsPDF from 'jspdf';

// ─── Types ──────────────────────────────────────────────────────────────────
interface CvPersonalInfo {
  name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
  target_role?: string;
}

interface CvExperience {
  company?: string;
  role?: string;
  period?: string;
  date_period?: string;
  location?: string;
  bullet_points?: string[];
}

interface CvEducation {
  institution?: string;
  degree?: string;
  field?: string;
  period?: string;
  year?: string;
  grade?: string;
}

interface CvLanguage {
  language: string;
  level: string;
  native?: boolean;
  certificate?: string;
}

interface CvCertification {
  name: string;
  issuer?: string;
  date?: string;
  url?: string;
}

export interface CvMakerData {
  personal_info?: CvPersonalInfo;
  target_role?: string;
  summary?: string;
  experiences?: CvExperience[];
  education?: CvEducation[];
  skills?: string[];
  languages?: CvLanguage[];
  certifications?: CvCertification[];
}

interface CvMakerMessage {
  role: 'user' | 'assistant';
  content: string;
}

type CvTemplate = 'classic' | 'modern' | 'executive';
type CvTab = 'chat' | 'form' | 'preview';

interface CvMakerProps {
  lang: string;
  onLangChange?: (lang: string) => void;
  supabaseUrl: string;
  supabaseAnonKey: string;
  hyperTaskUrl: string;
  profileName?: string;
  userId?: string;
}

// ─── Template Configs ───────────────────────────────────────────────────────
const TEMPLATES: Record<CvTemplate, { label: string; labelEn: string; labelEs: string; accent: string; bg: string; headerBg: string; sectionColor: string; textColor: string; subtextColor: string; borderColor: string; chipBg: string; chipText: string }> = {
  classic: {
    label: 'Clássico', labelEn: 'Classic', labelEs: 'Clásico',
    accent: '#2C3E50', bg: '#FFFFFF', headerBg: '#2C3E50', sectionColor: '#2C3E50',
    textColor: '#333333', subtextColor: '#666666', borderColor: '#D1D5DB',
    chipBg: '#E5E7EB', chipText: '#374151'
  },
  modern: {
    label: 'Moderno', labelEn: 'Modern', labelEs: 'Moderno',
    accent: '#BFA14A', bg: '#FAFAF8', headerBg: '#1A1A1A', sectionColor: '#BFA14A',
    textColor: '#1A1A1A', subtextColor: '#888888', borderColor: '#E5E0D5',
    chipBg: '#BFA14A1A', chipText: '#8F7A3A'
  },
  executive: {
    label: 'Executivo', labelEn: 'Executive', labelEs: 'Ejecutivo',
    accent: '#1B4D3E', bg: '#FFFFFF', headerBg: '#1B4D3E', sectionColor: '#1B4D3E',
    textColor: '#1A1A1A', subtextColor: '#555555', borderColor: '#C8D6D0',
    chipBg: '#1B4D3E15', chipText: '#1B4D3E'
  }
};

// ─── Section Collapse Helper ────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, isOpen, onToggle, count }: { icon: any; title: string; isOpen: boolean; onToggle: () => void; count?: number }) {
  return (
    <button onClick={onToggle} className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[#f9f9f7] transition-colors group">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-[#BFA14A]" />
        <span className="text-sm font-semibold text-[#1a1a1a]">{title}</span>
        {count !== undefined && count > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#BFA14A]/10 text-[#BFA14A] font-medium">{count}</span>}
      </div>
      {isOpen ? <ChevronUp className="w-4 h-4 text-[#ccc] group-hover:text-[#999]" /> : <ChevronDown className="w-4 h-4 text-[#ccc] group-hover:text-[#999]" />}
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function CvMaker({ lang, onLangChange, supabaseUrl, supabaseAnonKey, hyperTaskUrl, profileName, userId }: CvMakerProps) {
  const pick = useCallback(
    (pt: string, en: string, es: string) => ({ pt, en, es } as const)[lang as 'pt' | 'en' | 'es'] ?? en,
    [lang]
  );
  const nextLang = ({ pt: 'en', en: 'es', es: 'pt' } as const)[lang as 'pt' | 'en' | 'es'] ?? 'en';
  const languageSwitchTitle = ({ pt: 'Switch to English', en: 'Cambiar a Español', es: 'Mudar para Português' } as const)[lang as 'pt' | 'en' | 'es'] ?? 'Switch language';

  // Data
  const [cvData, setCvData] = useState<CvMakerData>({});
  const [template, setTemplate] = useState<CvTemplate>('modern');
  const [activeTab, setActiveTab] = useState<CvTab>('chat');

  // Chat
  const [messages, setMessages] = useState<CvMakerMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Form sections open/close
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ personal: true, summary: false, experience: false, education: false, skills: false, languages: false, certifications: false });

  // PDF
  const [pdfGenerating, setPdfGenerating] = useState(false);

  // New item inputs
  const [newSkill, setNewSkill] = useState('');
  const [newLang, setNewLang] = useState<CvLanguage>({ language: '', level: 'B2' });
  const [newCert, setNewCert] = useState<CvCertification>({ name: '', issuer: '', date: '' });

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Toggle section ──────────────────────────────────────────────────────
  const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  // ─── Update helpers ──────────────────────────────────────────────────────
  const updatePersonalInfo = (field: keyof CvPersonalInfo, value: string) => {
    setCvData(prev => ({ ...prev, personal_info: { ...(prev.personal_info || {}), [field]: value } }));
  };

  const updateExperience = (index: number, field: keyof CvExperience, value: any) => {
    setCvData(prev => {
      const exps = [...(prev.experiences || [])];
      exps[index] = { ...exps[index], [field]: value };
      return { ...prev, experiences: exps };
    });
  };

  const addExperience = () => {
    setCvData(prev => ({ ...prev, experiences: [...(prev.experiences || []), { company: '', role: '', period: '', bullet_points: [''] }] }));
    setOpenSections(prev => ({ ...prev, experience: true }));
  };

  const removeExperience = (index: number) => {
    setCvData(prev => ({ ...prev, experiences: (prev.experiences || []).filter((_, i) => i !== index) }));
  };

  const updateBulletPoint = (expIdx: number, bpIdx: number, value: string) => {
    setCvData(prev => {
      const exps = [...(prev.experiences || [])];
      const bps = [...(exps[expIdx]?.bullet_points || [])];
      bps[bpIdx] = value;
      exps[expIdx] = { ...exps[expIdx], bullet_points: bps };
      return { ...prev, experiences: exps };
    });
  };

  const addBulletPoint = (expIdx: number) => {
    setCvData(prev => {
      const exps = [...(prev.experiences || [])];
      exps[expIdx] = { ...exps[expIdx], bullet_points: [...(exps[expIdx]?.bullet_points || []), ''] };
      return { ...prev, experiences: exps };
    });
  };

  const removeBulletPoint = (expIdx: number, bpIdx: number) => {
    setCvData(prev => {
      const exps = [...(prev.experiences || [])];
      exps[expIdx] = { ...exps[expIdx], bullet_points: (exps[expIdx]?.bullet_points || []).filter((_, i) => i !== bpIdx) };
      return { ...prev, experiences: exps };
    });
  };

  const updateEducation = (index: number, field: keyof CvEducation, value: string) => {
    setCvData(prev => {
      const edus = [...(prev.education || [])];
      edus[index] = { ...edus[index], [field]: value };
      return { ...prev, education: edus };
    });
  };

  const addEducation = () => {
    setCvData(prev => ({ ...prev, education: [...(prev.education || []), { institution: '', degree: '', field: '', period: '' }] }));
    setOpenSections(prev => ({ ...prev, education: true }));
  };

  const removeEducation = (index: number) => {
    setCvData(prev => ({ ...prev, education: (prev.education || []).filter((_, i) => i !== index) }));
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setCvData(prev => ({ ...prev, skills: [...(prev.skills || []), newSkill.trim()] }));
    setNewSkill('');
  };

  const removeSkill = (index: number) => {
    setCvData(prev => ({ ...prev, skills: (prev.skills || []).filter((_, i) => i !== index) }));
  };

  const addLanguage = () => {
    if (!newLang.language.trim()) return;
    setCvData(prev => ({ ...prev, languages: [...(prev.languages || []), { ...newLang }] }));
    setNewLang({ language: '', level: 'B2' });
  };

  const removeLanguage = (index: number) => {
    setCvData(prev => ({ ...prev, languages: (prev.languages || []).filter((_, i) => i !== index) }));
  };

  const addCertification = () => {
    if (!newCert.name.trim()) return;
    setCvData(prev => ({ ...prev, certifications: [...(prev.certifications || []), { ...newCert }] }));
    setNewCert({ name: '', issuer: '', date: '' });
  };

  const removeCertification = (index: number) => {
    setCvData(prev => ({ ...prev, certifications: (prev.certifications || []).filter((_, i) => i !== index) }));
  };

  // ─── Send Chat Message ───────────────────────────────────────────────────
  const sendMessage = useCallback(async (overrideMsg?: string) => {
    const msg = overrideMsg || chatInput.trim();
    if (!msg) return;
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const body = {
        mode: 'cv_builder_chat',
        message: msg,
        language: lang,
        history: messages.map(m => ({ role: m.role, content: m.content })),
        current_cv: Object.keys(cvData).length > 0 ? cvData : undefined,
        profile_name: profileName || '',
        user_id: userId || '',
      };
      const response = await fetch(hyperTaskUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${supabaseAnonKey}` },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (data.success && data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        if (data.cv_data && typeof data.cv_data === 'object' && Object.keys(data.cv_data).length > 0) {
          const cd = data.cv_data;
          const hasRealPersonalInfo = cd.personal_info && Object.values(cd.personal_info).some((v: any) => typeof v === 'string' && v.trim());
          const hasRealData = hasRealPersonalInfo || cd.target_role?.trim() || cd.summary?.trim() || cd.experiences?.some((e: any) => e.company || e.role) || cd.education?.some((e: any) => e.institution || e.degree) || cd.skills?.some((s: string) => s?.trim());
          if (hasRealData) {
            setCvData(prev => {
              const merged = { ...prev };
              if (cd.personal_info) {
                const filteredPI: Record<string, string> = {};
                for (const [k, v] of Object.entries(cd.personal_info)) { if (typeof v === 'string' && v.trim()) filteredPI[k] = v as string; }
                if (Object.keys(filteredPI).length > 0) merged.personal_info = { ...(prev.personal_info || {}), ...filteredPI };
              }
              if (cd.target_role?.trim()) { merged.target_role = cd.target_role; if (!merged.personal_info) merged.personal_info = {}; merged.personal_info.target_role = cd.target_role; }
              if (cd.summary?.trim()) merged.summary = cd.summary;
              if (cd.experiences?.length > 0) { const valid = cd.experiences.filter((e: any) => e.company || e.role); if (valid.length > 0) merged.experiences = valid; }
              if (cd.education?.length > 0) { const valid = cd.education.filter((e: any) => e.institution || e.degree); if (valid.length > 0) merged.education = valid; }
              if (cd.skills?.length > 0) { const valid = cd.skills.filter((s: string) => s?.trim()); if (valid.length > 0) merged.skills = valid; }
              if (cd.languages?.length > 0) merged.languages = cd.languages;
              if (cd.certifications?.length > 0) merged.certifications = cd.certifications;
              return merged;
            });
          }
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: pick('Desculpa, ocorreu um erro. Tenta novamente.', 'Sorry, an error occurred. Please try again.', 'Lo siento, ocurrió un error. Inténtalo de nuevo.') }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: pick('Erro de ligação. Tenta novamente.', 'Connection error. Please try again.', 'Error de conexión. Inténtalo de nuevo.') }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, messages, cvData, lang, hyperTaskUrl, supabaseAnonKey, profileName, userId, pick]);

  // ─── Has CV Data ─────────────────────────────────────────────────────────
  const hasCvData = (() => {
    const pi = cvData.personal_info;
    return !!(pi && (pi.name || pi.full_name || pi.email || pi.phone || pi.location || pi.linkedin)) ||
      !!cvData.summary?.trim() ||
      !!(cvData.experiences?.some(e => e.company || e.role)) ||
      !!(cvData.education?.some(e => e.institution || e.degree)) ||
      !!(cvData.skills?.some(s => s?.trim()));
  })();

  // ─── Generate PDF ────────────────────────────────────────────────────────
  const generatePdf = async () => {
    if (!cvData || pdfGenerating) return;
    setPdfGenerating(true);
    try {
      const t = TEMPLATES[template];
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const marginL = 18, marginR = 18;
      const contentW = pageW - marginL - marginR;
      let y = 0;

      const checkPage = (needed: number) => {
        if (y + needed > pageH - 15) { doc.addPage(); y = 18; }
      };

      // Header
      doc.setFillColor(t.headerBg);
      doc.rect(0, 0, pageW, 42, 'F');
      doc.setTextColor('#FFFFFF');
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      const name = cvData.personal_info?.full_name || cvData.personal_info?.name || '';
      doc.text(name, marginL, 18);

      const targetRole = cvData.personal_info?.target_role || cvData.target_role || '';
      if (targetRole) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#FFFFFF');
        doc.text(targetRole.substring(0, 80), marginL, 26);
      }

      // Contact line
      const contactParts: string[] = [];
      const pi = cvData.personal_info;
      if (pi?.email) contactParts.push(pi.email);
      if (pi?.phone) contactParts.push(pi.phone);
      if (pi?.location) contactParts.push(pi.location);
      if (pi?.linkedin) contactParts.push(pi.linkedin);
      if (pi?.website) contactParts.push(pi.website);
      if (contactParts.length > 0) {
        doc.setFontSize(8.5);
        doc.setTextColor('#CCCCCC');
        doc.text(contactParts.join('  |  '), marginL, 34);
      }

      y = 52;

      // Section helper
      const addSection = (title: string) => {
        checkPage(15);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(t.sectionColor);
        doc.text(title.toUpperCase(), marginL, y);
        y += 1.5;
        doc.setDrawColor(t.sectionColor);
        doc.setLineWidth(0.5);
        doc.line(marginL, y, marginL + contentW, y);
        y += 5;
      };

      // Summary
      if (cvData.summary?.trim()) {
        addSection(pick('Resumo Profissional', 'Professional Summary', 'Resumen profesional'));
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(t.subtextColor);
        const summaryLines = doc.splitTextToSize(cvData.summary, contentW);
        for (const line of summaryLines) {
          checkPage(5);
          doc.text(line, marginL, y);
          y += 4.5;
        }
        y += 3;
      }

      // Experience
      if (cvData.experiences && cvData.experiences.length > 0) {
        addSection(pick('Experiência Profissional', 'Professional Experience', 'Experiencia profesional'));
        for (const exp of cvData.experiences) {
          checkPage(18);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(t.textColor);
          doc.text(`${exp.role || ''}${exp.company ? ` — ${exp.company}` : ''}`, marginL, y);
          y += 4.5;
          if (exp.period || exp.date_period || exp.location) {
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(t.subtextColor);
            const meta = [exp.date_period || exp.period, exp.location].filter(Boolean).join(' | ');
            doc.text(meta, marginL, y);
            y += 4;
          }
          if (exp.bullet_points) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(t.textColor);
            for (const bp of exp.bullet_points) {
              if (!bp?.trim()) continue;
              checkPage(5);
              const bpLines = doc.splitTextToSize(`• ${bp}`, contentW - 4);
              for (const line of bpLines) {
                doc.text(line, marginL + 2, y);
                y += 4;
              }
            }
          }
          y += 3;
        }
      }

      // Education
      if (cvData.education && cvData.education.length > 0) {
        addSection(pick('Formação Académica', 'Education', 'Formación académica'));
        for (const edu of cvData.education) {
          checkPage(12);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(t.textColor);
          const degreeText = [edu.degree, edu.field].filter(Boolean).join(' — ');
          doc.text(degreeText || edu.institution || '', marginL, y);
          y += 4.5;
          if (edu.institution || edu.period || edu.year) {
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(t.subtextColor);
            const meta = [edu.institution, edu.period || edu.year, edu.grade].filter(Boolean).join(' | ');
            doc.text(meta, marginL, y);
            y += 4;
          }
          y += 2;
        }
      }

      // Skills
      if (cvData.skills && cvData.skills.length > 0) {
        addSection(pick('Competências', 'Skills', 'Competencias'));
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(t.textColor);
        const skillsText = cvData.skills.join('  ·  ');
        const skillLines = doc.splitTextToSize(skillsText, contentW);
        for (const line of skillLines) {
          checkPage(5);
          doc.text(line, marginL, y);
          y += 4.5;
        }
        y += 3;
      }

      // Languages
      if (cvData.languages && cvData.languages.length > 0) {
        addSection(pick('Idiomas', 'Languages', 'Idiomas'));
        for (const l of cvData.languages) {
          checkPage(6);
          doc.setFontSize(9.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(t.textColor);
          const langText = `${l.language} — ${l.level}${l.native ? ` (${pick('Nativo', 'Native', 'Nativo')})` : ''}${l.certificate ? ` | ${l.certificate}` : ''}`;
          doc.text(langText, marginL, y);
          y += 5;
        }
        y += 2;
      }

      // Certifications
      if (cvData.certifications && cvData.certifications.length > 0) {
        addSection(pick('Certificações', 'Certifications', 'Certificaciones'));
        for (const c of cvData.certifications) {
          checkPage(8);
          doc.setFontSize(9.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(t.textColor);
          doc.text(c.name, marginL, y);
          y += 4.5;
          if (c.issuer || c.date) {
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(t.subtextColor);
            doc.text([c.issuer, c.date].filter(Boolean).join(' | '), marginL, y);
            y += 4;
          }
          y += 2;
        }
      }

      // Footer
      doc.setFontSize(7);
      doc.setTextColor('#CCCCCC');
      doc.text(`${pick('Gerado com', 'Generated with', 'Generado con')} Share2Inspire CV Maker`, marginL, pageH - 8);

      const fileName = `CV_${(name || pick('documento', 'document', 'documento')).replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setPdfGenerating(false);
    }
  };

  // ─── Render: Tab Bar ─────────────────────────────────────────────────────
  const renderTabBar = () => (
    <div className="flex items-center border-b border-[#e5e5e5] mb-3">
      {([
        { key: 'chat' as CvTab, icon: MessageSquare, label: pick('Chat IA', 'AI Chat', 'Chat IA') },
        { key: 'form' as CvTab, icon: Edit3, label: pick('Formulário', 'Form', 'Formulario') },
        { key: 'preview' as CvTab, icon: Eye, label: pick('Pré-visualização', 'Preview', 'Vista previa') },
      ]).map(tab => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all border-b-2 -mb-[1px] ${
            activeTab === tab.key
              ? 'border-[#BFA14A] text-[#BFA14A]'
              : 'border-transparent text-[#999] hover:text-[#666]'
          }`}
        >
          <tab.icon className="w-3.5 h-3.5" />
          {tab.label}
        </button>
      ))}
      <div className="ml-auto flex items-center gap-1.5 pr-1">
        {onLangChange && (
          <button
            onClick={() => onLangChange(nextLang)}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold tracking-wider rounded-lg border border-[#BFA14A]/30 text-[#BFA14A] hover:bg-[#BFA14A]/10 transition-all"
            title={languageSwitchTitle}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            {lang.toUpperCase()}
          </button>
        )}
        {hasCvData && (
          <button
            onClick={generatePdf}
            disabled={pdfGenerating}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium rounded-lg border border-[#BFA14A]/30 text-[#BFA14A] hover:bg-[#BFA14A]/10 transition-all disabled:opacity-50"
          >
            {pdfGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            PDF
          </button>
        )}
      </div>
    </div>
  );

  // ─── Render: Template Selector ───────────────────────────────────────────
  const renderTemplateSelector = () => (
    <div className="flex items-center gap-2 mb-3 px-1">
      <Palette className="w-3.5 h-3.5 text-[#999]" />
      <span className="text-[10px] text-[#999] font-medium uppercase tracking-wider">{pick('Template', 'Template', 'Plantilla')}:</span>
      {(Object.keys(TEMPLATES) as CvTemplate[]).map(key => {
        const t = TEMPLATES[key];
        const isActive = template === key;
        return (
          <button
            key={key}
            onClick={() => setTemplate(key)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              isActive ? 'bg-[#1a1a1a] text-white shadow-sm' : 'bg-[#f5f5f4] text-[#666] hover:bg-[#eee]'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.accent }} />
            {pick(t.label, t.labelEn, t.labelEs)}
          </button>
        );
      })}
    </div>
  );

  // ─── Render: Chat Tab ────────────────────────────────────────────────────
  const renderChat = () => (
    <div className="flex flex-col" style={{ minHeight: '380px', maxHeight: '520px' }}>
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1" style={{ maxHeight: '400px' }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 bg-gradient-to-br from-[#BFA14A]/20 to-[#BFA14A]/5">
              <FileText className="w-6 h-6 text-[#BFA14A]" />
            </div>
            <h4 className="font-semibold text-[#1a1a1a] text-sm mb-1">CV Maker</h4>
            <p className="text-xs text-[#999] mb-4 px-2 max-w-md">
              {pick('Constrói o teu CV passo a passo com ajuda da IA. Cola o teu link do LinkedIn para importar automaticamente ou começa do zero.', 'Build your CV step by step with AI help. Paste your LinkedIn link to auto-import or start from scratch.', 'Construye tu CV paso a paso con ayuda de IA. Pega tu enlace de LinkedIn para importarlo automáticamente o empieza desde cero.')}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={() => sendMessage(pick('Olá, quero começar a construir o meu CV.', 'Hi, I want to start building my CV.', 'Hola, quiero empezar a construir mi CV.'))} className="px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 bg-gradient-to-r from-[#BFA14A] to-[#8F7A3A]">
                {pick('Começar a construir CV', 'Start building CV', 'Empezar a crear el CV')}
              </button>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              msg.role === 'user' ? 'bg-[#BFA14A] text-white rounded-br-md' : 'bg-[#f5f5f4] text-[#1a1a1a] rounded-bl-md border border-[#e5e5e5]'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {chatLoading && (
          <div className="flex justify-start">
            <div className="bg-[#f5f5f4] border border-[#e5e5e5] rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-[#ccc] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-[#ccc] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-[#ccc] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={chatInputRef}
          type="text"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder={pick('Descreve a tua experiência, formação ou cola o teu LinkedIn...', 'Describe your experience, education or paste your LinkedIn...', 'Describe tu experiencia, formación o pega tu LinkedIn...')}
          disabled={chatLoading}
          className="flex-1 px-3 py-2.5 text-sm border border-[#e5e5e5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A] disabled:opacity-50"
        />
        <button
          onClick={() => sendMessage()}
          disabled={!chatInput.trim() || chatLoading}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
          style={{ background: chatInput.trim() ? 'linear-gradient(135deg, #BFA14A 0%, #8F7A3A 100%)' : '#e5e7eb' }}
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );

  // ─── Render: Form Tab ────────────────────────────────────────────────────
  const inputClass = "w-full px-3 py-2 text-sm border border-[#e5e5e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A] bg-white";
  const labelClass = "text-[11px] font-medium text-[#888] uppercase tracking-wider mb-1 block";

  const renderForm = () => (
    <div className="space-y-1 overflow-y-auto pr-1" style={{ maxHeight: '520px' }}>
      {/* Personal Info */}
      <SectionHeader icon={User} title={pick('Dados Pessoais', 'Personal Info', 'Datos personales')} isOpen={openSections.personal} onToggle={() => toggleSection('personal')} />
      {openSections.personal && (
        <div className="pl-6 pr-2 pb-3 space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div><label className={labelClass}>{pick('Nome Completo', 'Full Name', 'Nombre completo')}</label><input className={inputClass} value={cvData.personal_info?.name || cvData.personal_info?.full_name || ''} onChange={e => updatePersonalInfo('name', e.target.value)} /></div>
            <div><label className={labelClass}>{pick('Cargo-alvo', 'Target Role', 'Puesto objetivo')}</label><input className={inputClass} value={cvData.personal_info?.target_role || cvData.target_role || ''} onChange={e => { updatePersonalInfo('target_role', e.target.value); setCvData(prev => ({ ...prev, target_role: e.target.value })); }} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div><label className={labelClass}>Email</label><input type="email" className={inputClass} value={cvData.personal_info?.email || ''} onChange={e => updatePersonalInfo('email', e.target.value)} /></div>
            <div><label className={labelClass}>{pick('Telefone', 'Phone', 'Teléfono')}</label><input className={inputClass} value={cvData.personal_info?.phone || ''} onChange={e => updatePersonalInfo('phone', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div><label className={labelClass}>{pick('Localização', 'Location', 'Ubicación')}</label><input className={inputClass} value={cvData.personal_info?.location || ''} onChange={e => updatePersonalInfo('location', e.target.value)} /></div>
            <div><label className={labelClass}>LinkedIn</label><input className={inputClass} value={cvData.personal_info?.linkedin || ''} onChange={e => updatePersonalInfo('linkedin', e.target.value)} /></div>
          </div>
          <div><label className={labelClass}>Website</label><input className={inputClass} value={cvData.personal_info?.website || ''} onChange={e => updatePersonalInfo('website', e.target.value)} /></div>
        </div>
      )}

      {/* Summary */}
      <SectionHeader icon={FileText} title={pick('Apresentação / Resumo', 'Summary', 'Presentación / Resumen')} isOpen={openSections.summary} onToggle={() => toggleSection('summary')} />
      {openSections.summary && (
        <div className="pl-6 pr-2 pb-3">
          <textarea
            className={`${inputClass} min-h-[100px] resize-y`}
            value={cvData.summary || ''}
            onChange={e => setCvData(prev => ({ ...prev, summary: e.target.value }))}
            placeholder={pick('Escreve um resumo profissional...', 'Write a professional summary...', 'Escribe un resumen profesional...')}
          />
        </div>
      )}

      {/* Experience */}
      <SectionHeader icon={Briefcase} title={pick('Experiência Profissional', 'Work Experience', 'Experiencia profesional')} isOpen={openSections.experience} onToggle={() => toggleSection('experience')} count={cvData.experiences?.length} />
      {openSections.experience && (
        <div className="pl-6 pr-2 pb-3 space-y-4">
          {(cvData.experiences || []).map((exp, i) => (
            <div key={i} className="border border-[#e5e5e5] rounded-lg p-3 relative group">
              <button onClick={() => removeExperience(i)} className="absolute top-2 right-2 p-1 rounded-md text-[#ccc] hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div><label className={labelClass}>{pick('Cargo', 'Role', 'Puesto')}</label><input className={inputClass} value={exp.role || ''} onChange={e => updateExperience(i, 'role', e.target.value)} /></div>
                <div><label className={labelClass}>{pick('Empresa', 'Company', 'Empresa')}</label><input className={inputClass} value={exp.company || ''} onChange={e => updateExperience(i, 'company', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div><label className={labelClass}>{pick('Período', 'Period', 'Periodo')}</label><input className={inputClass} value={exp.period || exp.date_period || ''} onChange={e => updateExperience(i, 'period', e.target.value)} placeholder={pick('Jan 2020 - Presente', 'Jan 2020 - Present', 'Ene 2020 - Actualidad')} /></div>
                <div><label className={labelClass}>{pick('Local', 'Location', 'Ubicación')}</label><input className={inputClass} value={exp.location || ''} onChange={e => updateExperience(i, 'location', e.target.value)} /></div>
              </div>
              <label className={labelClass}>{pick('Realizações', 'Achievements', 'Logros')}</label>
              {(exp.bullet_points || []).map((bp, j) => (
                <div key={j} className="flex items-start gap-1.5 mb-1.5">
                  <span className="text-[#ccc] text-xs mt-2.5">•</span>
                  <input className={`${inputClass} flex-1`} value={bp} onChange={e => updateBulletPoint(i, j, e.target.value)} />
                  <button onClick={() => removeBulletPoint(i, j)} className="p-1.5 text-[#ccc] hover:text-red-500 mt-1"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
              <button onClick={() => addBulletPoint(i)} className="text-[11px] text-[#BFA14A] hover:text-[#8F7A3A] font-medium flex items-center gap-1 mt-1"><Plus className="w-3 h-3" />{pick('Adicionar realização', 'Add achievement', 'Añadir logro')}</button>
            </div>
          ))}
          <button onClick={addExperience} className="w-full py-2 rounded-lg border-2 border-dashed border-[#e5e5e5] text-sm text-[#999] hover:border-[#BFA14A] hover:text-[#BFA14A] transition-all flex items-center justify-center gap-1.5">
            <Plus className="w-4 h-4" />{pick('Adicionar experiência', 'Add experience', 'Añadir experiencia')}
          </button>
        </div>
      )}

      {/* Education */}
      <SectionHeader icon={GraduationCap} title={pick('Formação Académica', 'Education', 'Formación académica')} isOpen={openSections.education} onToggle={() => toggleSection('education')} count={cvData.education?.length} />
      {openSections.education && (
        <div className="pl-6 pr-2 pb-3 space-y-3">
          {(cvData.education || []).map((edu, i) => (
            <div key={i} className="border border-[#e5e5e5] rounded-lg p-3 relative group">
              <button onClick={() => removeEducation(i)} className="absolute top-2 right-2 p-1 rounded-md text-[#ccc] hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div><label className={labelClass}>{pick('Instituição', 'Institution', 'Institución')}</label><input className={inputClass} value={edu.institution || ''} onChange={e => updateEducation(i, 'institution', e.target.value)} /></div>
                <div><label className={labelClass}>{pick('Grau', 'Degree', 'Título')}</label><input className={inputClass} value={edu.degree || ''} onChange={e => updateEducation(i, 'degree', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className={labelClass}>{pick('Área', 'Field', 'Área')}</label><input className={inputClass} value={edu.field || ''} onChange={e => updateEducation(i, 'field', e.target.value)} /></div>
                <div><label className={labelClass}>{pick('Período', 'Period', 'Periodo')}</label><input className={inputClass} value={edu.period || edu.year || ''} onChange={e => updateEducation(i, 'period', e.target.value)} /></div>
                <div><label className={labelClass}>{pick('Nota', 'Grade', 'Nota')}</label><input className={inputClass} value={edu.grade || ''} onChange={e => updateEducation(i, 'grade', e.target.value)} /></div>
              </div>
            </div>
          ))}
          <button onClick={addEducation} className="w-full py-2 rounded-lg border-2 border-dashed border-[#e5e5e5] text-sm text-[#999] hover:border-[#BFA14A] hover:text-[#BFA14A] transition-all flex items-center justify-center gap-1.5">
            <Plus className="w-4 h-4" />{pick('Adicionar formação', 'Add education', 'Añadir formación')}
          </button>
        </div>
      )}

      {/* Skills */}
      <SectionHeader icon={Star} title={pick('Competências', 'Skills', 'Competencias')} isOpen={openSections.skills} onToggle={() => toggleSection('skills')} count={cvData.skills?.length} />
      {openSections.skills && (
        <div className="pl-6 pr-2 pb-3">
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {(cvData.skills || []).map((skill, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#BFA14A]/10 text-[#8F7A3A] text-xs font-medium group">
                {skill}
                <button onClick={() => removeSkill(i)} className="text-[#BFA14A]/40 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input className={`${inputClass} flex-1`} value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} placeholder={pick('Nova competência...', 'New skill...', 'Nueva competencia...')} />
            <button onClick={addSkill} className="px-3 py-2 rounded-lg bg-[#BFA14A] text-white text-sm hover:bg-[#8F7A3A] transition-colors"><Plus className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Languages */}
      <SectionHeader icon={Languages} title={pick('Idiomas', 'Languages', 'Idiomas')} isOpen={openSections.languages} onToggle={() => toggleSection('languages')} count={cvData.languages?.length} />
      {openSections.languages && (
        <div className="pl-6 pr-2 pb-3">
          {(cvData.languages || []).map((l, i) => (
            <div key={i} className="flex items-center gap-2 mb-2 text-sm">
              <Globe className="w-3.5 h-3.5 text-[#BFA14A]" />
              <span className="font-medium text-[#1a1a1a]">{l.language}</span>
              <span className="text-[#888]">— {l.level}</span>
              {l.native && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#BFA14A]/10 text-[#BFA14A]">{pick('Nativo', 'Native', 'Nativo')}</span>}
              {l.certificate && <span className="text-[10px] text-[#999]">({l.certificate})</span>}
              <button onClick={() => removeLanguage(i)} className="ml-auto text-[#ccc] hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
          <div className="flex gap-2 items-end mt-2">
            <div className="flex-1"><label className={labelClass}>{pick('Idioma', 'Language', 'Idioma')}</label><input className={inputClass} value={newLang.language} onChange={e => setNewLang(prev => ({ ...prev, language: e.target.value }))} /></div>
            <div className="w-20"><label className={labelClass}>{pick('Nível', 'Level', 'Nivel')}</label>
              <select className={inputClass} value={newLang.level} onChange={e => setNewLang(prev => ({ ...prev, level: e.target.value }))}>
                <option value="A1">A1</option><option value="A2">A2</option><option value="B1">B1</option><option value="B2">B2</option><option value="C1">C1</option><option value="C2">C2</option><option value="Nativo">{pick('Nativo', 'Native', 'Nativo')}</option>
              </select>
            </div>
            <button onClick={addLanguage} className="px-3 py-2 rounded-lg bg-[#BFA14A] text-white text-sm hover:bg-[#8F7A3A] transition-colors mb-[1px]"><Plus className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Certifications */}
      <SectionHeader icon={Award} title={pick('Certificações', 'Certifications', 'Certificaciones')} isOpen={openSections.certifications} onToggle={() => toggleSection('certifications')} count={cvData.certifications?.length} />
      {openSections.certifications && (
        <div className="pl-6 pr-2 pb-3">
          {(cvData.certifications || []).map((c, i) => (
            <div key={i} className="flex items-center gap-2 mb-2 text-sm">
              <Award className="w-3.5 h-3.5 text-[#BFA14A]" />
              <span className="font-medium text-[#1a1a1a]">{c.name}</span>
              {c.issuer && <span className="text-[#888]">— {c.issuer}</span>}
              {c.date && <span className="text-[10px] text-[#999]">({c.date})</span>}
              <button onClick={() => removeCertification(i)} className="ml-auto text-[#ccc] hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
          <div className="flex gap-2 items-end mt-2">
            <div className="flex-1"><label className={labelClass}>{pick('Nome', 'Name', 'Nombre')}</label><input className={inputClass} value={newCert.name} onChange={e => setNewCert(prev => ({ ...prev, name: e.target.value }))} /></div>
            <div className="flex-1"><label className={labelClass}>{pick('Entidade', 'Issuer', 'Entidad')}</label><input className={inputClass} value={newCert.issuer || ''} onChange={e => setNewCert(prev => ({ ...prev, issuer: e.target.value }))} /></div>
            <div className="w-28"><label className={labelClass}>{pick('Data', 'Date', 'Fecha')}</label><input className={inputClass} value={newCert.date || ''} onChange={e => setNewCert(prev => ({ ...prev, date: e.target.value }))} placeholder={pick('2024', '2024', '2024')} /></div>
            <button onClick={addCertification} className="px-3 py-2 rounded-lg bg-[#BFA14A] text-white text-sm hover:bg-[#8F7A3A] transition-colors mb-[1px]"><Plus className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Render: Preview Tab ─────────────────────────────────────────────────
  const renderPreview = () => {
    const t = TEMPLATES[template];
    const pi = cvData.personal_info;
    const name = pi?.full_name || pi?.name || '';

    if (!hasCvData) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Eye className="w-10 h-10 text-[#ddd] mb-3" />
          <p className="text-sm text-[#999]">{pick('Preenche os dados no chat ou formulário para ver o preview.', 'Fill in data via chat or form to see the preview.', 'Completa los datos en el chat o formulario para ver la vista previa.')}</p>
        </div>
      );
    }

    return (
      <div className="overflow-y-auto" style={{ maxHeight: '540px' }}>
        {/* CV Preview Card */}
        <div className="rounded-xl overflow-hidden shadow-md border" style={{ borderColor: t.borderColor, backgroundColor: t.bg }}>
          {/* Header */}
          <div className="px-5 py-4" style={{ backgroundColor: t.headerBg }}>
            <h2 className="text-lg font-bold text-white leading-tight">{name || '—'}</h2>
            {(pi?.target_role || cvData.target_role) && (
              <p className="text-xs text-white/70 mt-0.5">{pi?.target_role || cvData.target_role}</p>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2">
              {pi?.email && <span className="text-[10px] text-white/60">{pi.email}</span>}
              {pi?.phone && <span className="text-[10px] text-white/60">{pi.phone}</span>}
              {pi?.location && <span className="text-[10px] text-white/60">{pi.location}</span>}
              {pi?.linkedin && <span className="text-[10px] text-white/60">{pi.linkedin}</span>}
              {pi?.website && <span className="text-[10px] text-white/60">{pi.website}</span>}
            </div>
          </div>

          <div className="px-5 py-4 space-y-4">
            {/* Summary */}
            {cvData.summary?.trim() && (
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: t.sectionColor }}>{pick('Resumo Profissional', 'Professional Summary', 'Resumen profesional')}</h3>
                <div className="w-8 h-0.5 mb-2" style={{ backgroundColor: t.sectionColor }} />
                <p className="text-xs leading-relaxed" style={{ color: t.subtextColor }}>{cvData.summary}</p>
              </div>
            )}

            {/* Experience */}
            {cvData.experiences && cvData.experiences.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: t.sectionColor }}>{pick('Experiência Profissional', 'Professional Experience', 'Experiencia profesional')}</h3>
                <div className="w-8 h-0.5 mb-2" style={{ backgroundColor: t.sectionColor }} />
                {cvData.experiences.map((exp, i) => (
                  <div key={i} className="mb-3 pl-3" style={{ borderLeft: `2px solid ${t.accent}30` }}>
                    <p className="text-xs font-semibold" style={{ color: t.textColor }}>{exp.role}{exp.company ? ` — ${exp.company}` : ''}</p>
                    {(exp.period || exp.date_period || exp.location) && (
                      <p className="text-[10px] italic" style={{ color: t.subtextColor }}>{[exp.date_period || exp.period, exp.location].filter(Boolean).join(' | ')}</p>
                    )}
                    {exp.bullet_points?.filter(bp => bp?.trim()).map((bp, j) => (
                      <p key={j} className="text-[10px] mt-0.5 ml-1" style={{ color: t.textColor }}>• {bp}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Education */}
            {cvData.education && cvData.education.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: t.sectionColor }}>{pick('Formação Académica', 'Education', 'Formación académica')}</h3>
                <div className="w-8 h-0.5 mb-2" style={{ backgroundColor: t.sectionColor }} />
                {cvData.education.map((edu, i) => (
                  <div key={i} className="mb-2">
                    <p className="text-xs font-semibold" style={{ color: t.textColor }}>{[edu.degree, edu.field].filter(Boolean).join(' — ') || edu.institution}</p>
                    <p className="text-[10px]" style={{ color: t.subtextColor }}>{[edu.institution, edu.period || edu.year, edu.grade].filter(Boolean).join(' | ')}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Skills */}
            {cvData.skills && cvData.skills.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: t.sectionColor }}>{pick('Competências', 'Skills', 'Competencias')}</h3>
                <div className="w-8 h-0.5 mb-2" style={{ backgroundColor: t.sectionColor }} />
                <div className="flex flex-wrap gap-1.5">
                  {cvData.skills.map((skill, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-md font-medium" style={{ backgroundColor: t.chipBg, color: t.chipText }}>{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {cvData.languages && cvData.languages.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: t.sectionColor }}>{pick('Idiomas', 'Languages', 'Idiomas')}</h3>
                <div className="w-8 h-0.5 mb-2" style={{ backgroundColor: t.sectionColor }} />
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {cvData.languages.map((l, i) => (
                    <span key={i} className="text-[10px]" style={{ color: t.textColor }}>
                      <strong>{l.language}</strong> — {l.level}{l.native ? ` (${pick('Nativo', 'Native', 'Nativo')})` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {cvData.certifications && cvData.certifications.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: t.sectionColor }}>{pick('Certificações', 'Certifications', 'Certificaciones')}</h3>
                <div className="w-8 h-0.5 mb-2" style={{ backgroundColor: t.sectionColor }} />
                {cvData.certifications.map((c, i) => (
                  <div key={i} className="mb-1">
                    <p className="text-[10px] font-semibold" style={{ color: t.textColor }}>{c.name}</p>
                    {(c.issuer || c.date) && <p className="text-[10px]" style={{ color: t.subtextColor }}>{[c.issuer, c.date].filter(Boolean).join(' | ')}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-2 border-t text-center" style={{ borderColor: t.borderColor }}>
            <p className="text-[8px]" style={{ color: t.subtextColor }}>{pick('Gerado com', 'Generated with', 'Generado con')} Share2Inspire CV Maker</p>
          </div>
        </div>
      </div>
    );
  };

  // ─── Main Render ─────────────────────────────────────────────────────────
  return (
    <div>
      {renderTabBar()}
      {activeTab === 'preview' && renderTemplateSelector()}
      {activeTab === 'chat' && renderChat()}
      {activeTab === 'form' && renderForm()}
      {activeTab === 'preview' && renderPreview()}
    </div>
  );
}
