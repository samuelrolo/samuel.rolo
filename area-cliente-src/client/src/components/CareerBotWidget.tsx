import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || window.__SUPABASE_ANON_KEY__||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
const HYPER_TASK_URL = `${SUPABASE_URL}/functions/v1/hyper-task`;

type Message = {
  role: 'user' | 'assistant';
  content: string;
  type?: 'chat' | 'cover_letter' | 'networking_email' | 'linkedin_post' | 'cv_builder_chat';
};

type WidgetView = 'chat' | 'cover_letter' | 'networking_email' | 'linkedin_post' | 'headline_generator' | 'cv_builder_chat' | 'mock_interview';

// CV Builder types
interface CvData {
  personal_info?: {
    full_name?: string;
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    target_role?: string;
  };
  target_role?: string;
  summary?: string;
  experiences?: Array<{
    company?: string;
    role?: string;
    date_period?: string;
    period?: string;
    bullet_points?: string[];
  }>;
  education?: Array<{
    institution?: string;
    degree?: string;
    year?: string;
    period?: string;
  }>;
  skills?: string[];
}

// Mock Interview feedback type
interface InterviewFeedback {
  transcription_summary?: string;
  duration_feedback?: string;
  delivery_and_tone?: string;
  content_critique?: string;
  improved_answer?: string;
  next_question?: string;
}

function renderMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">$1</a>')
    .replace(/^\s*[-*+]\s+(.*)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul class="list-disc ml-4 my-2">$1</ul>')
    .replace(/\n/g, '<br/>');
}

export default function CareerBotWidget() {
  const { user, profile, subscription, hasActiveSubscription } = useAuth();
  const { t, lang, setLang } = useI18n();
  const pick = (pt: string, en: string, es: string) => lang === 'pt' ? pt : lang === 'es' ? es : en;
  const nextLang = ({ pt: 'en', en: 'es', es: 'pt' } as const)[lang as 'pt' | 'en' | 'es'] ?? 'pt';
  const languageSwitchTitleKey = ({ pt: 'bot.switchToEnglish', en: 'bot.switchToSpanish', es: 'bot.switchToPortuguese' } as const)[lang as 'pt' | 'en' | 'es'] ?? 'bot.switchToEnglish';

  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [view, setView] = useState<WidgetView>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Cover letter fields
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [coverLetterNotes, setCoverLetterNotes] = useState('');

  // Networking email fields
  const [netRecipient, setNetRecipient] = useState('');
  const [netPurpose, setNetPurpose] = useState('');
  const [netNotes, setNetNotes] = useState('');

  // LinkedIn post fields
  const [liNewCompany, setLiNewCompany] = useState('');
  const [liNewRole, setLiNewRole] = useState('');
  const [liTone, setLiTone] = useState('profissional');
  const [liNotes, setLiNotes] = useState('');

  // Headline generator fields
  const [headlineNotes, setHeadlineNotes] = useState('');

  // CV Builder fields
  const [cvMessages, setCvMessages] = useState<Message[]>([]);
  const [cvInput, setCvInput] = useState('');
  const [cvLoading, setCvLoading] = useState(false);
  const [cvData, setCvData] = useState<CvData | null>(null);
  const [isGeneratingCv, setIsGeneratingCv] = useState(false);

  // Mock Interview fields
  const [interviewStep, setInterviewStep] = useState<'intro' | 'recording' | 'feedback'>('intro');
  const [interviewQuestion, setInterviewQuestion] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [interviewFeedback, setInterviewFeedback] = useState<InterviewFeedback | null>(null);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const cvScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (cvScrollRef.current) {
      cvScrollRef.current.scrollTop = cvScrollRef.current.scrollHeight;
    }
  }, [cvMessages, cvLoading]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const sendMessage = async (overrideMessage?: string) => {
    const msg = overrideMessage || input;
    if (!msg.trim() || loading) return;

    if (!overrideMessage) {
      setMessages(prev => [...prev, { role: 'user', content: msg }]);
      setInput('');
    }
    setLoading(true);

    try {
      const profileCtx = profile ? {
        name: profile.full_name,
        headline: profile.headline,
        summary: profile.summary,
        experience: profile.experience,
        education: profile.education,
        skills: profile.skills,
      } : {};

      const body: any = {
        mode: 'career_coach',
        message: msg,
        language: lang,
        history: messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
        ...profileCtx,
      };

      if (view === 'cover_letter' && company && role && !overrideMessage?.startsWith('__SKIP__')) {
        body.cover_letter = true;
        body.target_company = company;
        body.target_role = role;
        body.notes = coverLetterNotes;
      } else if (view === 'networking_email' && netRecipient && netPurpose && !overrideMessage?.startsWith('__SKIP__')) {
        body.networking_email = true;
        body.recipient = netRecipient;
        body.purpose = netPurpose;
        body.notes = netNotes;
      } else if (view === 'linkedin_post' && liNewCompany && liNewRole && !overrideMessage?.startsWith('__SKIP__')) {
        body.linkedin_post = true;
        body.new_company = liNewCompany;
        body.new_role = liNewRole;
        body.tone = liTone;
        body.notes = liNotes;
      } else if (view === 'headline_generator' && !overrideMessage?.startsWith('__SKIP__')) {
        body.headline_generator = true;
        body.notes = headlineNotes;
      }

      const response = await fetch(HYPER_TASK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success && data.reply) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply,
          type: data.type || 'chat',
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: t('bot.errorGeneric'),
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: t('bot.errorConnection'),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const sendCvMessage = async () => {
    if (!cvInput.trim() || cvLoading) return;

    const msg = cvInput;
    setCvMessages(prev => [...prev, { role: 'user', content: msg }]);
    setCvInput('');
    setCvLoading(true);

    try {
      const response = await fetch(HYPER_TASK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          mode: 'cv_builder',
          message: msg,
          language: lang,
          history: cvMessages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
          cv_data: cvData,
        }),
      });

      const data = await response.json();
      if (data.success && data.reply) {
        setCvMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply,
          type: 'cv_builder_chat',
        }]);
        // Update CV data from the JSON response
        if (data.cv_data && typeof data.cv_data === 'object' && Object.keys(data.cv_data).length > 0) {
          setCvData(prev => {
            const newData = { ...prev, ...data.cv_data };
            // Ensure experiences have bullet_points as array
            if (newData.experiences) {
              newData.experiences = newData.experiences.map((exp: any) => ({
                ...exp,
                bullet_points: Array.isArray(exp.bullet_points) ? exp.bullet_points : []
              }));
            }
            return newData;
          });
        }
      } else {
        setCvMessages(prev => [...prev, {
          role: 'assistant',
          content: t('bot.errorGeneric'),
        }]);
      }
    } catch {
      setCvMessages(prev => [...prev, {
        role: 'assistant',
        content: t('bot.errorConnection'),
      }]);
    } finally {
      setCvLoading(false);
    }
  };

  const startInterview = async () => {
    setInterviewLoading(true);
    try {
      const response = await fetch(HYPER_TASK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          mode: 'mock_interview',
          action: 'start',
          language: lang,
          profile: profile,
        }),
      });
      const data = await response.json();
      if (data.success && data.question) {
        setInterviewQuestion(data.question);
        setInterviewStep('recording');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInterviewLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const submitInterviewAnswer = async () => {
    if (!audioBlob) return;
    setInterviewLoading(true);

    try {
      // 1. Get signed URL for upload
      const fileName = `interview_${user?.id}_${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await fetch(`${SUPABASE_URL}/storage/v1/object/recordings/${fileName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'audio/webm',
        },
        body: audioBlob
      }).then(res => res.json().then(d => ({ data: d, error: res.ok ? null : d })));

      if (uploadError) throw uploadError;

      // 2. Call hyper-task for feedback
      const response = await fetch(HYPER_TASK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          mode: 'mock_interview',
          action: 'feedback',
          language: lang,
          question: interviewQuestion,
          audio_url: fileName,
        }),
      });

      const data = await response.json();
      if (data.success && data.feedback) {
        setInterviewFeedback(data.feedback);
        setInterviewStep('feedback');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInterviewLoading(false);
    }
  };

  const generateCvPdf = async () => {
    if (!cvData || isGeneratingCv) return;
    setIsGeneratingCv(true);
    try {
      const response = await fetch(HYPER_TASK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          mode: 'cv_generator',
          cv_data: cvData,
          language: lang,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Curriculum_${cvData.personal_info?.name || 'Profissional'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingCv(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#BFA14A] text-white rounded-full shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center z-50 group"
      >
        <svg className="w-7 h-7 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span className="absolute -top-2 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
      </button>
    );
  }

  return (
    <div className={`fixed ${isFullscreen ? 'inset-4' : 'bottom-6 right-6 w-[420px] h-[640px]'} bg-white rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-100 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8`}>
      {/* Header */}
      <div className="bg-[#BFA14A] p-4 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">Samuel Rolo</h3>
            <p className="text-[10px] opacity-80 uppercase tracking-wider font-medium">Career AI Coach</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLang(nextLang)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-xs font-medium"
            title={t(languageSwitchTitleKey)}
          >
            {lang.toUpperCase()}
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isFullscreen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex border-b border-gray-100 bg-gray-50/50 p-1 shrink-0 overflow-x-auto no-scrollbar">
        {[
          { id: 'chat', icon: '💬', label: t('bot.navChat') },
          { id: 'cv_builder_chat', icon: '📄', label: t('bot.navCV') },
          { id: 'mock_interview', icon: '🎙️', label: t('bot.navInterview') },
          { id: 'cover_letter', icon: '✉️', label: t('bot.navCoverLetter') },
          { id: 'networking_email', icon: '🤝', label: t('bot.navNetworking') },
          { id: 'linkedin_post', icon: '📢', label: t('bot.navLinkedIn') },
          { id: 'headline_generator', icon: '✍️', label: t('bot.navHeadline') },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as WidgetView)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              view === item.id
                ? 'bg-white text-[#BFA14A] shadow-sm ring-1 ring-black/5'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative bg-white">
        {view === 'chat' && (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 animate-in fade-in zoom-in duration-500">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">👋</div>
                  <div>
                    <h4 className="font-bold text-gray-800">{t('bot.welcomeTitle')}</h4>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">{t('bot.welcomeSubtitle')}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 w-full max-w-[280px]">
                    {[
                      t('bot.suggest1'),
                      t('bot.suggest2'),
                      t('bot.suggest3')
                    ].map((text, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(text)}
                        className="text-left p-3 text-xs text-gray-600 bg-gray-50 hover:bg-[#BFA14A]/5 hover:text-[#BFA14A] rounded-xl border border-gray-100 transition-all active:scale-95"
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#BFA14A] text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}>
                    {(msg.type === 'cover_letter' || msg.type === 'networking_email' || msg.type === 'linkedin_post') && msg.role === 'assistant' && (
                      <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-gray-200/50">
                        <span className="text-xs">
                          {msg.type === 'cover_letter' ? '✉️' : msg.type === 'networking_email' ? '🤝' : '📢'}
                        </span>
                        <span className="text-xs font-medium opacity-70">
                          {msg.type === 'cover_letter' ? t('bot.coverLetterLabel') : msg.type === 'networking_email' ? t('bot.networkingEmailLabel') : t('bot.linkedinPostLabel')}
                        </span>
                        <button onClick={() => copyToClipboard(msg.content)}
                          className="ml-auto p-1 rounded hover:bg-black/10 transition-colors" title={t('bot.copy')}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                    {msg.role === 'assistant' && !msg.type && (
                      <button onClick={() => copyToClipboard(msg.content)}
                        className="mt-1.5 p-1 rounded hover:bg-black/10 transition-colors opacity-40 hover:opacity-70" title={t('bot.copy')}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-white shrink-0">
              <div className="relative flex items-end gap-2 bg-gray-50 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-[#BFA14A]/20 transition-all">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={t('bot.inputPlaceholder')}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-2 resize-none max-h-32 min-h-[40px]"
                  rows={1}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 bg-[#BFA14A] text-white rounded-xl flex items-center justify-center disabled:opacity-40 disabled:grayscale transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2 font-medium uppercase tracking-tighter">Powered by Samuel Rolo AI</p>
            </div>
          </>
        )}

        {view === 'cv_builder_chat' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div ref={cvScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {cvMessages.length === 0 && (
                <div className="text-center p-6 space-y-4">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mx-auto">📄</div>
                  <h4 className="font-bold text-gray-800">{t('bot.cvBuilderTitle')}</h4>
                  <p className="text-sm text-gray-500">{t('bot.cvBuilderSubtitle')}</p>
                  <button
                    onClick={() => {
                      setCvMessages([{ role: 'assistant', content: t('bot.cvBuilderStart') }]);
                    }}
                    className="bg-[#BFA14A] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-[#BFA14A]/20 hover:scale-105 transition-all"
                  >
                    {t('bot.cvBuilderBtn')}
                  </button>
                </div>
              )}

              {cvMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#BFA14A] text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}>
                    <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                  </div>
                </div>
              ))}

              {cvLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
            </div>

            {cvData && (
              <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{t('bot.cvDataReady')}</span>
                <button
                  onClick={generateCvPdf}
                  disabled={isGeneratingCv}
                  className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isGeneratingCv ? (
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4m4-10l5 5 5-5m-5-4v14"/></svg>
                  )}
                  {t('bot.downloadCV')}
                </button>
              </div>
            )}

            <div className="p-4 border-t border-gray-100 bg-white">
              <div className="relative flex items-end gap-2 bg-gray-50 rounded-2xl p-2">
                <textarea
                  value={cvInput}
                  onChange={(e) => setCvInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendCvMessage();
                    }
                  }}
                  placeholder={t('bot.cvInputPlaceholder')}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-2 resize-none max-h-32 min-h-[40px]"
                  rows={1}
                />
                <button
                  onClick={sendCvMessage}
                  disabled={!cvInput.trim() || cvLoading}
                  className="w-10 h-10 bg-[#BFA14A] text-white rounded-xl flex items-center justify-center disabled:opacity-40 transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'mock_interview' && (
          <div className="flex-1 p-6 flex flex-col overflow-y-auto">
            {interviewStep === 'intro' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center text-4xl shadow-inner">🎙️</div>
                <div className="space-y-2">
                  <h4 className="font-bold text-xl text-gray-800">{t('bot.interviewTitle')}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{t('bot.interviewSubtitle')}</p>
                </div>
                <button
                  onClick={startInterview}
                  disabled={interviewLoading}
                  className="w-full bg-[#BFA14A] text-white py-4 rounded-2xl font-bold shadow-xl shadow-[#BFA14A]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {interviewLoading ? t('bot.loading') : t('bot.interviewStartBtn')}
                </button>
              </div>
            )}

            {interviewStep === 'recording' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 w-full">
                  <span className="text-[10px] font-bold text-[#BFA14A] uppercase tracking-widest mb-2 block">{t('bot.interviewQuestionLabel')}</span>
                  <p className="text-lg font-medium text-gray-800 leading-relaxed">{interviewQuestion}</p>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isRecording
                        ? 'bg-red-500 animate-pulse scale-110 shadow-2xl shadow-red-200'
                        : 'bg-[#BFA14A] shadow-xl shadow-[#BFA14A]/20 hover:scale-110'
                    }`}
                  >
                    {isRecording ? (
                      <div className="w-8 h-8 bg-white rounded-sm"></div>
                    ) : (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                    )}
                  </button>
                  <p className="text-sm font-medium text-gray-500">
                    {isRecording ? t('bot.recording') : audioBlob ? t('bot.recorded') : t('bot.tapToRecord')}
                  </p>
                </div>

                {audioBlob && !isRecording && (
                  <button
                    onClick={submitInterviewAnswer}
                    disabled={interviewLoading}
                    className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-900 transition-all disabled:opacity-50"
                  >
                    {interviewLoading ? t('bot.analyzing') : t('bot.submitAnswer')}
                  </button>
                )}
              </div>
            )}

            {interviewStep === 'feedback' && interviewFeedback && (
              <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-lg text-gray-800">{t('bot.feedbackTitle')}</h4>
                  <button
                    onClick={() => setInterviewStep('intro')}
                    className="text-xs font-bold text-[#BFA14A] hover:underline"
                  >
                    {t('bot.tryAgain')}
                  </button>
                </div>

                <div className="space-y-4">
                  {[
                    { label: t('bot.feedbackTone'), content: interviewFeedback.delivery_and_tone, icon: '🎭' },
                    { label: t('bot.feedbackContent'), content: interviewFeedback.content_critique, icon: '💡' },
                    { label: t('bot.feedbackImproved'), content: interviewFeedback.improved_answer, icon: '✨', highlight: true },
                  ].map((item, i) => (
                    <div key={i} className={`p-4 rounded-2xl border ${item.highlight ? 'bg-[#BFA14A]/5 border-[#BFA14A]/20' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.label}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(item.content || '') }} />
                    </div>
                  ))}
                </div>

                <button
                  onClick={startInterview}
                  className="w-full bg-[#BFA14A] text-white py-4 rounded-2xl font-bold shadow-lg shadow-[#BFA14A]/20 hover:scale-[1.02] transition-all"
                >
                  {t('bot.nextQuestion')}
                </button>
              </div>
            )}
          </div>
        )}

        {(view === 'cover_letter' || view === 'networking_email' || view === 'linkedin_post' || view === 'headline_generator') && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div className="bg-[#BFA14A]/5 p-4 rounded-2xl border border-[#BFA14A]/10">
                <h4 className="font-bold text-gray-800 text-sm mb-1">
                  {view === 'cover_letter' ? t('bot.coverLetterTitle') :
                   view === 'networking_email' ? t('bot.networkingTitle') :
                   view === 'linkedin_post' ? t('bot.linkedinTitle') :
                   t('bot.headlineTitle')}
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {view === 'cover_letter' ? t('bot.coverLetterSubtitle') :
                   view === 'networking_email' ? t('bot.networkingSubtitle') :
                   view === 'linkedin_post' ? t('bot.linkedinSubtitle') :
                   t('bot.headlineSubtitle')}
                </p>
              </div>

              <div className="space-y-3">
                {view === 'cover_letter' && (
                  <>
                    <input
                      type="text"
                      placeholder={t('bot.companyPlaceholder')}
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full bg-gray-50 border-gray-100 rounded-xl text-sm focus:ring-[#BFA14A] focus:border-[#BFA14A]"
                    />
                    <input
                      type="text"
                      placeholder={t('bot.rolePlaceholder')}
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-gray-50 border-gray-100 rounded-xl text-sm focus:ring-[#BFA14A] focus:border-[#BFA14A]"
                    />
                    <textarea
                      placeholder={t('bot.notesPlaceholder')}
                      value={coverLetterNotes}
                      onChange={(e) => setCoverLetterNotes(e.target.value)}
                      className="w-full bg-gray-50 border-gray-100 rounded-xl text-sm focus:ring-[#BFA14A] focus:border-[#BFA14A] h-24 resize-none"
                    />
                  </>
                )}

                {view === 'networking_email' && (
                  <>
                    <input
                      type="text"
                      placeholder={t('bot.recipientPlaceholder')}
                      value={netRecipient}
                      onChange={(e) => setNetRecipient(e.target.value)}
                      className="w-full bg-gray-50 border-gray-100 rounded-xl text-sm focus:ring-[#BFA14A] focus:border-[#BFA14A]"
                    />
                    <input
                      type="text"
                      placeholder={t('bot.purposePlaceholder')}
                      value={netPurpose}
                      onChange={(e) => setNetPurpose(e.target.value)}
                      className="w-full bg-gray-50 border-gray-100 rounded-xl text-sm focus:ring-[#BFA14A] focus:border-[#BFA14A]"
                    />
                    <textarea
                      placeholder={t('bot.notesPlaceholder')}
                      value={netNotes}
                      onChange={(e) => setNetNotes(e.target.value)}
                      className="w-full bg-gray-50 border-gray-100 rounded-xl text-sm focus:ring-[#BFA14A] focus:border-[#BFA14A] h-24 resize-none"
                    />
                  </>
                )}

                {view === 'linkedin_post' && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder={t('bot.newCompanyPlaceholder')}
                        value={liNewCompany}
                        onChange={(e) => setLiNewCompany(e.target.value)}
                        className="w-full bg-gray-50 border-gray-100 rounded-xl text-sm focus:ring-[#BFA14A] focus:border-[#BFA14A]"
                      />
                      <input
                        type="text"
                        placeholder={t('bot.newRolePlaceholder')}
                        value={liNewRole}
                        onChange={(e) => setLiNewRole(e.target.value)}
                        className="w-full bg-gray-50 border-gray-100 rounded-xl text-sm focus:ring-[#BFA14A] focus:border-[#BFA14A]"
                      />
                    </div>
                    <select
                      value={liTone}
                      onChange={(e) => setLiTone(e.target.value)}
                      className="w-full bg-gray-50 border-gray-100 rounded-xl text-sm focus:ring-[#BFA14A] focus:border-[#BFA14A]"
                    >
                      <option value="profissional">{t('bot.toneProfessional')}</option>
                      <option value="entusiasta">{t('bot.toneEnthusiastic')}</option>
                      <option value="humilde">{t('bot.toneHumble')}</option>
                    </select>
                    <textarea
                      placeholder={t('bot.notesPlaceholder')}
                      value={liNotes}
                      onChange={(e) => setLiNotes(e.target.value)}
                      className="w-full bg-gray-50 border-gray-100 rounded-xl text-sm focus:ring-[#BFA14A] focus:border-[#BFA14A] h-24 resize-none"
                    />
                  </>
                )}

                {view === 'headline_generator' && (
                  <textarea
                    placeholder={t('bot.headlineNotesPlaceholder')}
                    value={headlineNotes}
                    onChange={(e) => setHeadlineNotes(e.target.value)}
                    className="w-full bg-gray-50 border-gray-100 rounded-xl text-sm focus:ring-[#BFA14A] focus:border-[#BFA14A] h-32 resize-none"
                  />
                )}

                <button
                  onClick={() => {
                    sendMessage('__SKIP__');
                    setView('chat');
                  }}
                  disabled={loading}
                  className="w-full bg-[#BFA14A] text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-[#BFA14A]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? t('bot.generating') : t('bot.generateBtn')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
