import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
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
  const [hlCargo, setHlCargo] = useState('');
  const [hlArea, setHlArea] = useState('');
  const [hlAnos, setHlAnos] = useState('');
  const [hlValor, setHlValor] = useState('');
  const [hlPublico, setHlPublico] = useState('');
  const [hlKeywords, setHlKeywords] = useState('');
  const [hlTone, setHlTone] = useState('profissional');
  const [hlLang, setHlLang] = useState('pt');
  const [hlNum, setHlNum] = useState('5');
  const [hlResults, setHlResults] = useState<string[]>([]);
  const [hlCopied, setHlCopied] = useState<number | null>(null);

  // ─── CV Builder Chat state ───
  const [cvMessages, setCvMessages] = useState<Message[]>([]);
  const [cvInput, setCvInput] = useState('');
  const [cvData, setCvData] = useState<CvData>({});
  const [cvLoading, setCvLoading] = useState(false);
  const [showCvPreview, setShowCvPreview] = useState(false);

  // ─── Mock Interview state ───
  const [mockTargetRole, setMockTargetRole] = useState('');
  const [mockTargetCompany, setMockTargetCompany] = useState('');
  const [mockStarted, setMockStarted] = useState(false);
  const [mockCurrentQuestion, setMockCurrentQuestion] = useState('');
  const [mockRecording, setMockRecording] = useState(false);
  const [mockAnalyzing, setMockAnalyzing] = useState(false);
  const [mockFeedback, setMockFeedback] = useState<InterviewFeedback | null>(null);
  const [mockHistory, setMockHistory] = useState<Array<{ question: string; feedback: InterviewFeedback }>>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cvMessagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  const scrollCvToBottom = () => {
    cvMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    scrollCvToBottom();
  }, [cvMessages]);

  useEffect(() => {
    if (isOpen && view === 'cv_builder_chat' && cvInputRef.current) {
      cvInputRef.current.focus();
    } else if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, view]);

  // Build profile context for the API
  const getProfileContext = useCallback(() => {
    return {
      profile_name: profile ? `${profile.first_name} ${profile.last_name}` : '',
      profile_linkedin: profile?.linkedin_url || '',
      user_id: user?.id || '',
    };
  }, [profile, user]);

  // External event listeners
  useEffect(() => {
    const openCoverLetter = () => { setIsOpen(true); setView('cover_letter'); };
    const openChat = () => { setIsOpen(true); setView('chat'); };
    const openNetworkingEmail = () => { setIsOpen(true); setView('networking_email'); };
    const openLinkedinPost = () => { setIsOpen(true); setView('linkedin_post'); };
    const openHeadlineGenerator = () => { setIsOpen(true); setView('headline_generator'); };
    const openCvBuilder = () => { setIsOpen(true); setView('cv_builder_chat'); };
    const openMockInterview = () => { setIsOpen(true); setView('mock_interview'); };

    window.addEventListener('open-career-bot', openChat);
    window.addEventListener('open-career-bot-cover-letter', openCoverLetter);
    window.addEventListener('open-career-bot-networking-email', openNetworkingEmail);
    window.addEventListener('open-career-bot-linkedin-post', openLinkedinPost);
    window.addEventListener('open-headline-generator', openHeadlineGenerator);
    window.addEventListener('open-cv-builder', openCvBuilder);
    window.addEventListener('open-mock-interview', openMockInterview);

    return () => {
      window.removeEventListener('open-career-bot', openChat);
      window.removeEventListener('open-career-bot-cover-letter', openCoverLetter);
      window.removeEventListener('open-career-bot-networking-email', openNetworkingEmail);
      window.removeEventListener('open-career-bot-linkedin-post', openLinkedinPost);
      window.removeEventListener('open-headline-generator', openHeadlineGenerator);
      window.removeEventListener('open-cv-builder', openCvBuilder);
      window.removeEventListener('open-mock-interview', openMockInterview);
    };
  }, []);

  // Don't render if no active subscription — MUST be after all hooks
  if (!user || !hasActiveSubscription()) return null;

  // ─── CHAT: sendMessage (existing career_coach mode) ───
  const sendMessage = async (overrideMessage?: string, displayMessage?: string) => {
    const msg = overrideMessage || input.trim();
    if (!msg && view === 'chat') return;

    const userMsg: Message = { role: 'user', content: displayMessage || msg || '...' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const profileCtx = getProfileContext();
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
      }

      const response = await fetch(HYPER_TASK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─── CV BUILDER CHAT: sendCvMessage ───
  const sendCvMessage = async (overrideMsg?: string) => {
    const msg = overrideMsg || cvInput.trim();
    if (!msg) return;
    const userMessage: Message = { role: 'user', content: msg };
    setCvMessages(prev => [...prev, userMessage]);
    setCvInput('');
    setCvLoading(true);
    try {
      const body = {
        mode: 'cv_builder_chat',
        message: msg,
        language: lang,
        history: cvMessages.map(m => ({ role: m.role, content: m.content })),
        current_cv: Object.keys(cvData).length > 0 ? cvData : undefined,
        profile_name: profile ? `${profile.first_name} ${profile.last_name}` : '',
        user_id: user?.id || '',
      };
      const response = await fetch(HYPER_TASK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(body),
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
            const merged = { ...prev };
            const cd = data.cv_data;
            // Deep merge: personal_info
            if (cd.personal_info) {
              merged.personal_info = { ...(prev.personal_info || {}), ...cd.personal_info };
            }
            // target_role can be at root level (new format) or inside personal_info (old format)
            if (cd.target_role) {
              merged.target_role = cd.target_role;
              if (!merged.personal_info) merged.personal_info = {};
              merged.personal_info.target_role = cd.target_role;
            }
            // summary
            if (cd.summary) merged.summary = cd.summary;
            // experiences — replace if provided (filter out empty entries)
            if (cd.experiences && cd.experiences.length > 0) {
              const validExps = cd.experiences.filter((e: any) => e.company || e.role);
              if (validExps.length > 0) merged.experiences = validExps;
            }
            // education — replace if provided (filter out empty entries)
            if (cd.education && cd.education.length > 0) {
              const validEdu = cd.education.filter((e: any) => e.institution || e.degree);
              if (validEdu.length > 0) merged.education = validEdu;
            }
            // skills — replace if provided (filter out empty strings)
            if (cd.skills && cd.skills.length > 0) {
              const validSkills = cd.skills.filter((s: string) => s && s.trim() !== '');
              if (validSkills.length > 0) merged.skills = validSkills;
            }
            return merged;
          });
          setShowCvPreview(true);
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

  const handleCvKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendCvMessage();
    }
  };

  // ─── MOCK INTERVIEW: Audio recording & analysis ───
  const startMockInterview = () => {
    if (!mockTargetRole.trim()) return;
    setMockStarted(true);
    setMockFeedback(null);
    setMockHistory([]);
    const defaultQ = t('bot.mockDefaultQuestion');
    setMockCurrentQuestion(defaultQ);
  };

  const startRecording = async () => {
    try {
      // Check if mediaDevices API is available (requires HTTPS)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert(t('bot.audioNotSupported'));
        return;
      }
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (permErr: any) {
        console.error('Microphone permission error:', permErr);
        if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
          alert(t('bot.micPermDenied'));
        } else if (permErr.name === 'NotFoundError') {
          alert(t('bot.micNotFound'));
        } else {
          alert(pick(`Erro ao aceder ao microfone: ${permErr.message || permErr.name}. Verifica as permissões do browser.`, `Error accessing microphone: ${permErr.message || permErr.name}. Check browser permissions.`, `Error al acceder al micrófono: ${permErr.message || permErr.name}. Verifica los permisos del navegador.`));
        }
        return;
      }
      // Try supported mimeTypes in order of preference
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', ''];
      let selectedMime = '';
      for (const mime of mimeTypes) {
        if (mime === '' || MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }
      const options: MediaRecorderOptions = selectedMime ? { mimeType: selectedMime } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setMockRecording(true);
    } catch (err: any) {
      console.error('Microphone/MediaRecorder error:', err);
      alert(pick(`Erro ao iniciar a gravação: ${err.message || 'erro desconhecido'}. Tenta usar o Chrome.`, `Error starting recording: ${err.message || 'unknown error'}. Try using Chrome.`, `Error al iniciar la grabación: ${err.message || 'error desconocido'}. Intenta usar Chrome.`));
    }
  };

  const stopAndSend = async () => {
    if (!mediaRecorderRef.current) return;
    setMockRecording(false);
    setMockAnalyzing(true);

    mediaRecorderRef.current.stop();
    // Stop all tracks to release the microphone
    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

    mediaRecorderRef.current.onstop = async () => {
      const actualMime = mediaRecorderRef.current?.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: actualMime });
      // Convert to Base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];

        // Fetch cv_text from Supabase (same pattern as existing code)
        let cvText = '';
        if (user?.id || user?.email) {
          try {
            const cvUrl = `${SUPABASE_URL}/rest/v1/cv_analysis?select=cv_text&order=created_at.desc&limit=1`;
            const userIdFilter = user.id ? `&user_id=eq.${user.id}` : '';
            const emailFilter = !user.id && user.email ? `&user_email=eq.${encodeURIComponent(user.email)}` : '';
            const cvRes = await fetch(`${cvUrl}${userIdFilter || emailFilter}`, {
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              },
            });
            const cvRows = await cvRes.json();
            if (cvRows?.[0]?.cv_text) {
              cvText = cvRows[0].cv_text;
            }
          } catch { /* silently continue without CV */ }
        }

        try {
          const response = await fetch(HYPER_TASK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              mode: 'mock_interview',
              audio_base64: base64Audio,
              mime_type: actualMime,
              current_question: mockCurrentQuestion,
              cv_text: cvText,
              target_role: mockTargetRole,
              target_company: mockTargetCompany,
              language: lang,
            }),
          });
          const data = await response.json();
          if (data.success && data.feedback) {
            const fb = data.feedback as InterviewFeedback;
            setMockFeedback(fb);
            setMockHistory(prev => [...prev, { question: mockCurrentQuestion, feedback: fb }]);
            if (fb.next_question) {
              setMockCurrentQuestion(fb.next_question);
            }
          } else {
            setMockFeedback({
              transcription_summary: t('bot.errorGeneric'),
              content_critique: data.error || '',
            } as InterviewFeedback);
          }
        } catch {
          setMockFeedback({
            transcription_summary: t('bot.errorConnection'),
          } as InterviewFeedback);
        } finally {
          setMockAnalyzing(false);
        }
      };
    };
  };

  // ─── COVER LETTER ───
  const handleCoverLetterSubmit = () => {
    if (!company.trim() || !role.trim()) return;
    const profileName = profile ? `${profile.first_name} ${profile.last_name}` : '';
    
    const msg = pick(
      `Carta de apresentação em PT-PT. Candidato: ${profileName}. Empresa: ${company}. Função: ${role}.${profile?.linkedin_url ? ` LinkedIn: ${profile.linkedin_url}.` : ''}${profile?.cv_filename ? ` CV: ${profile.cv_filename}.` : ''}${coverLetterNotes ? ` Notas: ${coverLetterNotes}.` : ''}

Estrutura: saudação formal personalizada → abertura com conhecimento da empresa → 2-3 realizações quantificáveis alinhadas com a função → fit cultural (porquê esta empresa) → fecho com call-to-action → despedida.
Tom: profissional com personalidade, confiante, verbos de ação fortes, PT-PT rigoroso.
Proibido: "Venho por este meio", linguagem genérica, repetir CV. Máx 400 palavras. Incluir dados quantificáveis.
Gera APENAS a carta.`,
      `Cover letter in English. Candidate: ${profileName}. Company: ${company}. Role: ${role}.${profile?.linkedin_url ? ` LinkedIn: ${profile.linkedin_url}.` : ''}${profile?.cv_filename ? ` CV: ${profile.cv_filename}.` : ''}${coverLetterNotes ? ` Notes: ${coverLetterNotes}.` : ''}

Structure: personalised formal greeting → opening with company knowledge → 2-3 quantifiable achievements aligned with the role → cultural fit (why this company) → closing with call-to-action → sign-off.
Tone: professional with personality, confident, strong action verbs.
Forbidden: "I am writing to", generic language, repeating CV. Max 400 words. Include quantifiable data.
Generate ONLY the letter.`,
      `Carta de presentación en español. Candidato: ${profileName}. Empresa: ${company}. Puesto: ${role}.${profile?.linkedin_url ? ` LinkedIn: ${profile.linkedin_url}.` : ''}${profile?.cv_filename ? ` CV: ${profile.cv_filename}.` : ''}${coverLetterNotes ? ` Notas: ${coverLetterNotes}.` : ''}

Estructura: saludo formal personalizado → apertura con conocimiento de la empresa → 2-3 logros cuantificables alineados con el puesto → encaje cultural (por qué esta empresa) → cierre con call-to-action → despedida.
Tono: profesional con personalidad, seguro, verbos de acción fuertes.
Prohibido: "Me dirijo a usted", lenguaje genérico, repetir CV. Máx 400 palabras. Incluir datos cuantificables.
Genera SOLO la carta.`);

    const display = pick(
      `✉️ Gerar carta de apresentação para ${role} na ${company}${coverLetterNotes ? ` (${coverLetterNotes})` : ''}`,
      `✉️ Generate cover letter for ${role} at ${company}${coverLetterNotes ? ` (${coverLetterNotes})` : ''}`,
      `✉️ Generar carta de presentación para ${role} en ${company}${coverLetterNotes ? ` (${coverLetterNotes})` : ''}`);
    setView('chat');
    sendMessage(msg, display);
  };

  // ─── NETWORKING EMAIL ───
  const handleNetworkingEmailSubmit = () => {
    if (!netRecipient.trim() || !netPurpose.trim()) return;
    const profileName = profile ? `${profile.first_name} ${profile.last_name}` : '';
    
    const msg = pick(
      `E-mail de networking em PT-PT. De: ${profileName}. Para: ${netRecipient}. Objetivo: ${netPurpose}.${profile?.linkedin_url ? ` LinkedIn: ${profile.linkedin_url}.` : ''}${netNotes ? ` Contexto: ${netNotes}.` : ''}

Estrutura: assunto curto e específico → saudação → referência concreta ao trabalho do destinatário → motivo do contacto direto → pedido específico (15min conversa, conselho) → facilitar resposta → assinatura.
Tom: respeitoso sem ser subserviente, direto, valor mútuo, autêntico, PT-PT rigoroso.
Proibido: "Espero que o encontre bem", ser vago, pedir desculpa por contactar. Máx 200 palavras no corpo. Incluir razão concreta para o contacto.
Gera APENAS o e-mail com assunto.`,
      `Networking email in English. From: ${profileName}. To: ${netRecipient}. Purpose: ${netPurpose}.${profile?.linkedin_url ? ` LinkedIn: ${profile.linkedin_url}.` : ''}${netNotes ? ` Context: ${netNotes}.` : ''}

Structure: short specific subject line → greeting → concrete reference to recipient's work → reason for direct contact → specific ask (15min chat, advice) → make it easy to reply → signature.
Tone: respectful without being subservient, direct, mutual value, authentic.
Forbidden: "I hope this finds you well", being vague, apologising for reaching out. Max 200 words in body. Include concrete reason for contact.
Generate ONLY the email with subject line.`,
      `E-mail de networking en español. De: ${profileName}. Para: ${netRecipient}. Objetivo: ${netPurpose}.${profile?.linkedin_url ? ` LinkedIn: ${profile.linkedin_url}.` : ''}${netNotes ? ` Contexto: ${netNotes}.` : ''}

Estructura: asunto corto y específico → saludo → referencia concreta al trabajo del destinatario → motivo del contacto directo → petición específica (15min conversación, consejo) → facilitar respuesta → firma.
Tono: respetuoso sin ser servil, directo, valor mutuo, auténtico.
Prohibido: "Espero que se encuentre bien", ser vago, pedir disculpas por contactar. Máx 200 palabras en el cuerpo. Incluir razón concreta para el contacto.
Genera SOLO el e-mail con asunto.`);

    const display = pick(
      `🤝 Gerar e-mail de networking para ${netRecipient} — ${netPurpose}${netNotes ? ` (${netNotes})` : ''}`,
      `🤝 Generate networking email to ${netRecipient} — ${netPurpose}${netNotes ? ` (${netNotes})` : ''}`,
      `🤝 Generar e-mail de networking para ${netRecipient} — ${netPurpose}${netNotes ? ` (${netNotes})` : ''}`);
    setView('chat');
    sendMessage(msg, display);
  };

  // ─── LINKEDIN POST ───
  const handleLinkedinPostSubmit = () => {
    if (!liNewCompany.trim() || !liNewRole.trim()) return;
    const profileName = profile ? `${profile.first_name} ${profile.last_name}` : '';
    const toneDescriptions: Record<string, Record<string, string>> = {
      'profissional': { pt: 'Profissional e sóbrio, com confiança discreta', en: 'Professional and sober, with understated confidence', es: 'Profesional y sobrio, con confianza discreta' },
      'entusiasmado': { pt: 'Entusiasmado e energético, com emoção genuína mas sem exagero', en: 'Enthusiastic and energetic, with genuine emotion but no exaggeration', es: 'Entusiasmado y enérgico, con emoción genuina pero sin exageración' },
      'humilde e grato': { pt: 'Humilde e grato, reconhecendo quem ajudou no percurso', en: 'Humble and grateful, acknowledging those who helped along the way', es: 'Humilde y agradecido, reconociendo a quienes ayudaron en el camino' },
      'inspirador': { pt: 'Inspirador e motivacional, partilhando lições aprendidas', en: 'Inspiring and motivational, sharing lessons learned', es: 'Inspirador y motivacional, compartiendo lecciones aprendidas' },
      'casual e autêntico': { pt: 'Casual e autêntico, como se falasse com um amigo próximo', en: 'Casual and authentic, as if talking to a close friend', es: 'Casual y auténtico, como si hablaras con un amigo cercano' },
    };
    const toneDesc = toneDescriptions[liTone]?.[lang] || liTone;
    
    const msg = pick(
      `Post LinkedIn em PT-PT a anunciar mudança profissional. Autor: ${profileName}. Nova empresa: ${liNewCompany}. Nova função: ${liNewRole}. Tom: ${toneDesc}.${profile?.linkedin_url ? ` LinkedIn: ${profile.linkedin_url}.` : ''}${liNotes ? ` Notas: ${liNotes}.` : ''}

Estrutura: gancho forte na 1ª linha (LinkedIn mostra só 2 linhas antes do "ver mais") → percurso anterior → anúncio da nova posição → reflexão genuína sobre transições → agradecimento específico → call-to-action → 3-5 hashtags.
Tom: ${toneDesc}. Autêntico, parágrafos curtos (1-2 frases), momento de vulnerabilidade, PT-PT rigoroso.
Proibido: "Tenho o prazer de anunciar", emojis em excesso (máx 3), comunicado de imprensa. 150-250 palavras. Espaçamento entre parágrafos.
Gera APENAS o post.`,
      `LinkedIn post in English announcing a career change. Author: ${profileName}. New company: ${liNewCompany}. New role: ${liNewRole}. Tone: ${toneDesc}.${profile?.linkedin_url ? ` LinkedIn: ${profile.linkedin_url}.` : ''}${liNotes ? ` Notes: ${liNotes}.` : ''}

Structure: strong hook in the 1st line (LinkedIn shows only 2 lines before "see more") → previous journey → new position announcement → genuine reflection on transitions → specific thanks → call-to-action → 3-5 hashtags.
Tone: ${toneDesc}. Authentic, short paragraphs (1-2 sentences), moment of vulnerability.
Forbidden: "I am pleased to announce", excessive emojis (max 3), press release style. 150-250 words. Spacing between paragraphs.
Generate ONLY the post.`,
      `Post LinkedIn en español anunciando cambio profesional. Autor: ${profileName}. Nueva empresa: ${liNewCompany}. Nuevo puesto: ${liNewRole}. Tono: ${toneDesc}.${profile?.linkedin_url ? ` LinkedIn: ${profile.linkedin_url}.` : ''}${liNotes ? ` Notas: ${liNotes}.` : ''}

Estructura: gancho fuerte en la 1ª línea (LinkedIn muestra solo 2 líneas antes de "ver más") → recorrido anterior → anuncio de la nueva posición → reflexión genuina sobre transiciones → agradecimiento específico → call-to-action → 3-5 hashtags.
Tono: ${toneDesc}. Auténtico, párrafos cortos (1-2 frases), momento de vulnerabilidad.
Prohibido: "Me complace anunciar", emojis en exceso (máx 3), estilo comunicado de prensa. 150-250 palabras. Espaciado entre párrafos.
Genera SOLO el post.`);

    const display = pick(
      `📢 Gerar post LinkedIn: ${liNewRole} na ${liNewCompany} (tom: ${liTone})${liNotes ? ` — ${liNotes}` : ''}`,
      `📢 Generate LinkedIn post: ${liNewRole} at ${liNewCompany} (tone: ${liTone})${liNotes ? ` — ${liNotes}` : ''}`,
      `📢 Generar post LinkedIn: ${liNewRole} en ${liNewCompany} (tono: ${liTone})${liNotes ? ` — ${liNotes}` : ''}`);
    setView('chat');
    sendMessage(msg, display);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // ─── HEADLINE GENERATOR ───
  const handleHeadlineGenerate = async () => {
    if (!hlCargo.trim() && !hlArea.trim() && !hlValor.trim()) return;
    setLoading(true);
    setHlResults([]);

    const toneMap: Record<string, Record<string, string>> = {
      profissional: { pt: 'profissional e confiante', en: 'professional and confident', es: 'profesional y seguro' },
      criativo: { pt: 'criativo e original, com metáforas ou estruturas não convencionais', en: 'creative and original, with unconventional structures', es: 'creativo y original, con metáforas o estructuras no convencionales' },
      direto: { pt: 'direto e impactante, sem floreados', en: 'direct and impactful, no fluff', es: 'directo e impactante, sin relleno' },
      inspirador: { pt: 'inspirador e com impacto emocional', en: 'inspiring and emotionally impactful', es: 'inspirador y con impacto emocional' },
    };

    const headlinePrompt = pick(
      `Escreve TODAS as headlines em Português (Portugal), não em inglês.\n\nGera exatamente ${hlNum} headlines para perfil LinkedIn. Cada headline deve ter no máximo 220 caracteres (o limite do LinkedIn).\n\nDados da pessoa:\n- Nome: ${profile?.first_name || 'não fornecido'} ${profile?.last_name || ''}\n- Cargo atual: ${hlCargo || 'não fornecido'}\n- Área/Setor: ${hlArea || 'não fornecido'}\n- Experiência: ${hlAnos || 'não fornecido'}\n- O que faz / valor que traz: ${hlValor || 'não fornecido'}\n- Público-alvo: ${hlPublico || 'não fornecido'}\n${hlKeywords ? `- Incluir palavras-chave: ${hlKeywords}` : ''}\n\nTom desejado: ${toneMap[hlTone]?.pt || hlTone}\n\nInstruções importantes:\n1. Cada headline deve ser única e usar estruturas diferentes\n2. Mistura abordagens: orientada a resultados, focada no cliente, baseada em identidade, focada em transformação\n3. Usa separadores como | · — quando fizer sentido\n4. NÃO incluas o nome da pessoa na headline\n5. NÃO uses clichês como "apaixonado por" ou "guru"\n6. Máximo ABSOLUTO: 220 caracteres por headline\n\nResponde APENAS com um JSON válido neste formato (sem markdown, sem texto extra):\n{"headlines": ["headline 1", "headline 2", "headline 3"]}`,
      `Write ALL headlines in English.\n\nGenerate exactly ${hlNum} headlines for a LinkedIn profile. Each headline must be no more than 220 characters (LinkedIn's limit).\n\nPerson details:\n- Name: ${profile?.first_name || 'not provided'} ${profile?.last_name || ''}\n- Current role: ${hlCargo || 'not provided'}\n- Area/Sector: ${hlArea || 'not provided'}\n- Experience: ${hlAnos || 'not provided'}\n- What they do / value they bring: ${hlValor || 'not provided'}\n- Target audience: ${hlPublico || 'not provided'}\n${hlKeywords ? `- Include keywords: ${hlKeywords}` : ''}\n\nDesired tone: ${toneMap[hlTone]?.en || hlTone}\n\nImportant instructions:\n1. Each headline must be unique and use different structures\n2. Mix approaches: results-oriented, client-focused, identity-based, transformation-focused\n3. Use separators like | · — when helpful\n4. DO NOT include the person's name in the headline\n5. DO NOT use clichés like "passionate about" or "guru"\n6. ABSOLUTE maximum: 220 characters per headline\n\nReply ONLY with valid JSON in this format (no markdown, no extra text):\n{"headlines": ["headline 1", "headline 2", "headline 3"]}`,
      `Escribe TODOS los titulares en español.\n\nGenera exactamente ${hlNum} titulares para un perfil de LinkedIn. Cada titular debe tener un máximo de 220 caracteres (el límite de LinkedIn).\n\nDatos de la persona:\n- Nombre: ${profile?.first_name || 'no proporcionado'} ${profile?.last_name || ''}\n- Puesto actual: ${hlCargo || 'no proporcionado'}\n- Área/Sector: ${hlArea || 'no proporcionado'}\n- Experiencia: ${hlAnos || 'no proporcionado'}\n- Lo que hace / valor que aporta: ${hlValor || 'no proporcionado'}\n- Público objetivo: ${hlPublico || 'no proporcionado'}\n${hlKeywords ? `- Incluir palabras clave: ${hlKeywords}` : ''}\n\nTono deseado: ${toneMap[hlTone]?.es || hlTone}\n\nInstrucciones importantes:\n1. Cada titular debe ser único y usar estructuras diferentes\n2. Mezcla enfoques: orientado a resultados, centrado en el cliente, basado en identidad, centrado en la transformación\n3. Usa separadores como | · — cuando tenga sentido\n4. NO incluyas el nombre de la persona en el titular\n5. NO uses clichés como "apasionado por" o "gurú"\n6. Máximo ABSOLUTO: 220 caracteres por titular\n\nResponde SOLO con JSON válido en este formato (sin markdown, sin texto extra):\n{"headlines": ["headline 1", "headline 2", "headline 3"]}`
    );

    const prompt = headlinePrompt;

    try {
      const response = await fetch(HYPER_TASK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          mode: 'career_coach',
          message: prompt,
          language: lang,
          history: [],
          profile_name: profile ? `${profile.first_name} ${profile.last_name}` : '',
          profile_linkedin: profile?.linkedin_url || '',
          user_id: user?.id || '',
        }),
      });

      const data = await response.json();
      console.log('[Headline] Raw reply:', data.reply);
      if (data.success && data.reply) {
        let headlines: string[] = [];
        let replyStr = typeof data.reply === 'object' ? JSON.stringify(data.reply) : String(data.reply);
        let raw = replyStr
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .replace(/^\s*\n/gm, '')
          .trim();

        const tryParse = (str: string): string[] | null => {
          try {
            const parsed = JSON.parse(str);
            if (Array.isArray(parsed?.headlines)) return parsed.headlines;
            if (Array.isArray(parsed)) return parsed;
            for (const key of Object.keys(parsed || {})) {
              if (Array.isArray(parsed[key])) return parsed[key];
            }
          } catch {}
          return null;
        };

        headlines = tryParse(raw) || [];
        if (headlines.length === 0) {
          const jsonObjMatch = raw.match(/\{[\s\S]*\[[\s\S]*\][\s\S]*\}/);
          if (jsonObjMatch) headlines = tryParse(jsonObjMatch[0]) || [];
        }
        if (headlines.length === 0) {
          const arrMatch = raw.match(/\[[\s\S]*\]/);
          if (arrMatch) headlines = tryParse(arrMatch[0]) || [];
        }
        if (headlines.length === 0) {
          const quotedStrings: string[] = [];
          const quoteRegex = /"([^"]{15,220})"/g;
          let m;
          while ((m = quoteRegex.exec(raw)) !== null) {
            const val = m[1].trim();
            if (val === 'headlines' || val.length < 15) continue;
            quotedStrings.push(val);
          }
          if (quotedStrings.length > 0) headlines = quotedStrings.slice(0, parseInt(hlNum));
        }
        if (headlines.length === 0) {
          const lines = raw.split(/\n/)
            .map((l: string) => l.replace(/^\d+[\.)\-:\s]+/, '').replace(/^"|"$/g, '').replace(/^[\-\*]\s*/, '').trim())
            .filter((l: string) => l.length > 15 && l.length <= 250 && !l.startsWith('{') && !l.startsWith('['));
          headlines = lines.slice(0, parseInt(hlNum));
        }
        if (headlines.length === 0) {
          const cleaned = raw.replace(/[{}\[\]"]/g, '').replace(/^headlines\s*:?\s*/i, '').trim();
          const parts = cleaned.split(/,\s*/).filter((p: string) => p.trim().length > 15);
          if (parts.length >= 2) headlines = parts.slice(0, parseInt(hlNum));
        }
        headlines = headlines
          .map((h: any) => String(h).replace(/^"|"$/g, '').replace(/^\d+[\.)\-]\s*/, '').replace(/[\[\]{}]/g, '').replace(/^"|"$/g, '').replace(/,\s*$/, '').trim())
          .filter((h: string) => h.length > 10 && h.toLowerCase() !== 'headlines');
        
        console.log('[Headline] Parsed headlines:', headlines);
        setHlResults(headlines.length > 0 ? headlines : [t('bot.headlineError')]);
      }
    } catch {
      setHlResults([]);
    } finally {
      setLoading(false);
    }
  };

  const copyHeadline = (idx: number) => {
    const hl = hlResults[idx];
    if (!hl) return;
    navigator.clipboard.writeText(hl);
    setHlCopied(idx);
    setTimeout(() => setHlCopied(null), 2000);
  };

  const resetChat = () => {
    setMessages([]);
    setView('chat');
    setCompany(''); setRole(''); setCoverLetterNotes('');
    setNetRecipient(''); setNetPurpose(''); setNetNotes('');
    setLiNewCompany(''); setLiNewRole(''); setLiTone('profissional'); setLiNotes('');
    setHlCargo(''); setHlArea(''); setHlAnos(''); setHlValor(''); setHlPublico('');
    setHlKeywords(''); setHlTone('profissional'); setHlLang('pt'); setHlNum('5'); setHlResults([]);
    setCvMessages([]); setCvInput(''); setCvData({}); setShowCvPreview(false);
    setMockTargetRole(''); setMockStarted(false); setMockCurrentQuestion('');
    setMockRecording(false); setMockAnalyzing(false); setMockFeedback(null); setMockHistory([]);
  };

  // Tab labels for the view switcher — using i18n
  const tabs: { key: WidgetView; label: string; icon: string }[] = [
    { key: 'chat', label: t('bot.tabChat'), icon: '💬' },
    { key: 'cover_letter', label: t('bot.tabCoverLetter'), icon: '✉️' },
    { key: 'networking_email', label: t('bot.tabNetworking'), icon: '🤝' },
    { key: 'linkedin_post', label: t('bot.tabLinkedinPost'), icon: '📢' },
    { key: 'headline_generator', label: t('bot.tabHeadline'), icon: '✦' },
    { key: 'mock_interview', label: t('bot.tabMockInterview'), icon: '🎙️' },
  ];

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 hover:shadow-xl"
          style={{ background: 'linear-gradient(135deg, #BFA14A 0%, #8F7A3A 100%)' }}
          title={t('member.careerBot')}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className={`fixed z-50 bg-white shadow-2xl flex flex-col overflow-hidden border border-gray-200 transition-all duration-300 ${
          isFullscreen
            ? 'inset-0 sm:inset-4 md:inset-8 lg:inset-12 rounded-none sm:rounded-2xl'
            : 'bottom-6 right-6 w-[400px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-3rem)] rounded-2xl'
        }`}
        style={isFullscreen ? { maxWidth: '900px', margin: '0 auto', left: 0, right: 0 } : undefined}>
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between shrink-0" style={{ background: 'linear-gradient(135deg, #BFA14A 0%, #8F7A3A 100%)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a7 7 0 0 1 7 7c0 3-2 5.5-4 7l-3 3.5L9 16c-2-1.5-4-4-4-7a7 7 0 0 1 7-7z" />
                  <circle cx="12" cy="9" r="1.5" />
                </svg>
              </div>
              <div>
                <h3 className="text-white text-sm font-semibold leading-tight">{t('member.careerBot')}</h3>
                <p className="text-white/60 text-[10px]">Share2Inspire AI</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setLang(nextLang)}
                className="px-2 py-1 rounded-lg hover:bg-white/20 transition-colors text-white/80 hover:text-white text-[10px] font-bold tracking-wider flex items-center gap-1 border border-white/20"
                title={t(languageSwitchTitleKey)}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                {lang.toUpperCase()}
              </button>
              <button onClick={resetChat} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/70 hover:text-white" title={t('bot.newChat')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </button>
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/70 hover:text-white">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {isFullscreen ? <><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" /></> : <><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></>}
                </svg>
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/70 hover:text-white">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          </div>

          {/* Back to tools button — only visible when in a tool view */}
          {view !== 'chat' && (
            <div className="border-b border-gray-100 shrink-0 px-3 py-1.5">
              <button
                onClick={() => setView('chat')}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#BFA14A] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                {t('bot.backToTools')}
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* VIEW: Cover Letter Form */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {view === 'cover_letter' && (
            <div className="p-4 flex-1 overflow-y-auto">
              <div className={`space-y-4 ${isFullscreen ? 'max-w-3xl mx-auto' : ''}`}>
                <p className="text-sm text-gray-600 mb-2">
                  {t('bot.coverLetterDesc')}
                </p>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('bot.company')} *</label>
                  <input type="text" value={company} onChange={e => setCompany(e.target.value)}
                    placeholder={t('bot.companyPlaceholder')}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('bot.role')} *</label>
                  <input type="text" value={role} onChange={e => setRole(e.target.value)}
                    placeholder={t('bot.rolePlaceholder')}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('bot.additionalNotes')}</label>
                  <textarea value={coverLetterNotes} onChange={e => setCoverLetterNotes(e.target.value)}
                    placeholder={t('bot.coverLetterNotesPlaceholder')}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A] resize-none" />
                </div>
                <button onClick={handleCoverLetterSubmit}
                  disabled={!company.trim() || !role.trim() || loading}
                  className="w-full py-2.5 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: company.trim() && role.trim() ? 'linear-gradient(135deg, #BFA14A 0%, #8F7A3A 100%)' : '#ccc' }}>
                  {loading ? <span className="flex items-center justify-center gap-2"><LoadingSpinner /> {t('bot.generating')}</span> : `✉️ ${t('bot.generateCoverLetter')}`}
                </button>
                {profile && (
                  <p className="text-xs text-gray-400 text-center">
                    {t('bot.personalizedWith')} {profile.first_name} {profile.last_name}
                    {profile.linkedin_url ? ` ${t('bot.andLinkedin')}` : ''}
                    {profile.cv_filename ? ` ${t('bot.andCv')} (${profile.cv_filename})` : ''}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* VIEW: Networking Email Form */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {view === 'networking_email' && (
            <div className="p-4 flex-1 overflow-y-auto">
              <div className={`space-y-4 ${isFullscreen ? 'max-w-3xl mx-auto' : ''}`}>
                <p className="text-sm text-gray-600 mb-2">
                  {t('bot.networkingDesc')}
                </p>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('bot.recipient')} *</label>
                  <input type="text" value={netRecipient} onChange={e => setNetRecipient(e.target.value)}
                    placeholder={t('bot.recipientPlaceholder')}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('bot.purpose')} *</label>
                  <select value={netPurpose} onChange={e => setNetPurpose(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A] bg-white">
                    <option value="">{t('bot.purposeSelect')}</option>
                    <option value={t('bot.purposeAdvice')}>{t('bot.purposeAdvice')}</option>
                    <option value={t('bot.purposeCoffee')}>{t('bot.purposeCoffee')}</option>
                    <option value={t('bot.purposeOpportunities')}>{t('bot.purposeOpportunities')}</option>
                    <option value={t('bot.purposeReference')}>{t('bot.purposeReference')}</option>
                    <option value={t('bot.purposeReconnect')}>{t('bot.purposeReconnect')}</option>
                    <option value={t('bot.purposeThank')}>{t('bot.purposeThank')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('bot.additionalContext')}</label>
                  <textarea value={netNotes} onChange={e => setNetNotes(e.target.value)}
                    placeholder={t('bot.networkingNotesPlaceholder')}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A] resize-none" />
                </div>
                <button onClick={handleNetworkingEmailSubmit}
                  disabled={!netRecipient.trim() || !netPurpose.trim() || loading}
                  className="w-full py-2.5 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: netRecipient.trim() && netPurpose.trim() ? 'linear-gradient(135deg, #BFA14A 0%, #8F7A3A 100%)' : '#ccc' }}>
                  {loading ? <span className="flex items-center justify-center gap-2"><LoadingSpinner /> {t('bot.generating')}</span> : `🤝 ${t('bot.generateNetworkingEmail')}`}
                </button>
                {profile && (
                  <p className="text-xs text-gray-400 text-center">
                    {t('bot.personalizedWith')} {profile.first_name} {profile.last_name}
                    {profile.linkedin_url ? ` ${t('bot.andLinkedin')}` : ''}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* VIEW: LinkedIn Post Form */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {view === 'linkedin_post' && (
            <div className="p-4 flex-1 overflow-y-auto">
              <div className={`space-y-4 ${isFullscreen ? 'max-w-3xl mx-auto' : ''}`}>
                <p className="text-sm text-gray-600 mb-2">
                  {t('bot.linkedinPostDesc')}
                </p>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('bot.newCompany')} *</label>
                  <input type="text" value={liNewCompany} onChange={e => setLiNewCompany(e.target.value)}
                    placeholder={t('bot.newCompanyPlaceholder')}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('bot.newRole')} *</label>
                  <input type="text" value={liNewRole} onChange={e => setLiNewRole(e.target.value)}
                    placeholder={t('bot.newRolePlaceholder')}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('bot.tone')}</label>
                  <select value={liTone} onChange={e => setLiTone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A] bg-white">
                    <option value="profissional">{t('bot.toneProfessional')}</option>
                    <option value="entusiasmado">{t('bot.toneEnthusiastic')}</option>
                    <option value="humilde e grato">{t('bot.toneHumble')}</option>
                    <option value="inspirador">{t('bot.toneInspiring')}</option>
                    <option value="casual e autêntico">{t('bot.toneCasual')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('bot.additionalNotes')}</label>
                  <textarea value={liNotes} onChange={e => setLiNotes(e.target.value)}
                    placeholder={t('bot.linkedinNotesPlaceholder')}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A] resize-none" />
                </div>
                <button onClick={handleLinkedinPostSubmit}
                  disabled={!liNewCompany.trim() || !liNewRole.trim() || loading}
                  className="w-full py-2.5 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: liNewCompany.trim() && liNewRole.trim() ? 'linear-gradient(135deg, #BFA14A 0%, #8F7A3A 100%)' : '#ccc' }}>
                  {loading ? <span className="flex items-center justify-center gap-2"><LoadingSpinner /> {t('bot.generating')}</span> : `📢 ${t('bot.generateLinkedinPost')}`}
                </button>
                {profile && (
                  <p className="text-xs text-gray-400 text-center">
                    {t('bot.personalizedWith')} {profile.first_name} {profile.last_name}
                    {profile.linkedin_url ? ` ${t('bot.andLinkedin')}` : ''}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* VIEW: Headline Generator Form */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {view === 'headline_generator' && (
            <div className="p-4 flex-1 overflow-y-auto">
              <div className={`space-y-3 ${isFullscreen ? 'max-w-3xl mx-auto' : ''}`}>
                <p className="text-sm text-gray-600 mb-1">
                  {t('bot.headlineDesc')}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">{t('bot.currentRole')} *</label>
                    <input type="text" value={hlCargo} onChange={e => setHlCargo(e.target.value)}
                      placeholder={t('bot.placeholderRoleExample')}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">{t('bot.sector')} *</label>
                    <input type="text" value={hlArea} onChange={e => setHlArea(e.target.value)}
                      placeholder={t('bot.placeholderSector')}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">{t('bot.experience')}</label>
                    <select value={hlAnos} onChange={e => setHlAnos(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A] bg-white">
                      <option value="">{t('bot.selectExperience')}</option>
                      <option value={t('bot.expLessThan2')}>&lt; 2 {t('bot.years')}</option>
                      <option value={t('bot.exp2to5')}>2–5 {t('bot.years')}</option>
                      <option value={t('bot.exp5to10')}>5–10 {t('bot.years')}</option>
                      <option value={t('bot.exp10to15')}>10–15 {t('bot.years')}</option>
                      <option value={t('bot.expMoreThan15')}>&gt; 15 {t('bot.years')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">{t('bot.targetAudience')}</label>
                    <input type="text" value={hlPublico} onChange={e => setHlPublico(e.target.value)}
                      placeholder={t('bot.placeholderAudience')}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A]" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">{t('bot.valueProposition')}</label>
                  <textarea value={hlValor} onChange={e => setHlValor(e.target.value)}
                    placeholder={t('bot.placeholderBio')}
                    rows={2}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A] resize-none" />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">{t('bot.keywords')}</label>
                  <input type="text" value={hlKeywords} onChange={e => setHlKeywords(e.target.value)}
                    placeholder={t('bot.placeholderKeywords')}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A]" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">{t('bot.tone')}</label>
                    <select value={hlTone} onChange={e => setHlTone(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A] bg-white">
                      <option value="profissional">{t('bot.toneProfessional')}</option>
                      <option value="criativo">{t('bot.toneCreative')}</option>
                      <option value="direto">{t('bot.toneDirect')}</option>
                      <option value="inspirador">{t('bot.toneInspiring')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">{t('bot.headlineLanguage')}</label>
                    <select value={hlLang} onChange={e => setHlLang(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A] bg-white">
                      <option value="pt">PT</option>
                      <option value="en">EN</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">{t('bot.headlineCount')}</label>
                    <select value={hlNum} onChange={e => setHlNum(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A] bg-white">
                      <option value="3">3</option>
                      <option value="5">5</option>
                      <option value="8">8</option>
                      <option value="10">10</option>
                    </select>
                  </div>
                </div>

                <button onClick={handleHeadlineGenerate}
                  disabled={(!hlCargo.trim() && !hlArea.trim() && !hlValor.trim()) || loading}
                  className="w-full py-2 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: (hlCargo.trim() || hlArea.trim() || hlValor.trim()) ? 'linear-gradient(135deg, #0A66C2 0%, #004182 100%)' : '#ccc' }}>
                  {loading ? <span className="flex items-center justify-center gap-2"><LoadingSpinner /> {t('bot.generating')}</span> : `✦ ${t('bot.generateHeadlines')}`}
                </button>

                {/* Results */}
                {hlResults.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{hlResults.length} {t('bot.headlinesGenerated')}</span>
                    </div>
                    {hlResults.map((hl, i) => {
                      const charCount = hl.length;
                      const charColor = charCount <= 180 ? 'text-green-600 bg-green-50' : charCount <= 220 ? 'text-yellow-700 bg-yellow-50' : 'text-red-600 bg-red-50';
                      return (
                        <div key={i} className="p-2.5 border border-gray-100 rounded-lg hover:border-[#0A66C2]/20 transition-all">
                          <div className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#0A66C2]/10 text-[#0A66C2] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                            <p className="text-xs text-gray-800 leading-relaxed flex-1">{hl}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-2 ml-7">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${charColor} font-medium`}>{charCount}/220</span>
                            <button onClick={() => copyHeadline(i)}
                              className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                                hlCopied === i
                                  ? 'border-green-300 text-green-600 bg-green-50'
                                  : 'border-gray-200 text-gray-500 hover:border-[#0A66C2]/30 hover:text-[#0A66C2]'
                              }`}>
                              {hlCopied === i ? `✓ ${t('bot.copied')}` : t('bot.copy')}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* VIEW: CV Builder Chat (NEW) */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {view === 'cv_builder_chat' && (
            <>
              <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${isFullscreen ? 'max-w-4xl mx-auto w-full' : ''}`}>
                {/* Welcome screen */}
                {cvMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, #BFA14A20 0%, #8F7A3A20 100%)' }}>
                      <span className="text-2xl">📄</span>
                    </div>
                    <h4 className="font-semibold text-gray-800 text-sm mb-1">{t('bot.tabCvMaker')}</h4>
                    <p className="text-xs text-gray-500 mb-4 px-2">{t('bot.cvMakerDesc')}</p>
                    <button
                      onClick={() => sendCvMessage(t('bot.cvMakerStartMsg'))}
                      className="px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #BFA14A 0%, #8F7A3A 100%)' }}
                    >
                      {t('bot.cvMakerStartBtn')}
                    </button>
                  </div>
                )}

                {/* CV Chat Messages */}
                {cvMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#BFA14A] text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-800 rounded-bl-md'
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      {msg.role === 'assistant' && (
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

                {cvLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={cvMessagesEndRef} />

                {/* CV Preview Panel (inline, collapsible) */}
                {showCvPreview && Object.keys(cvData).length > 0 && (
                  <div className="mt-3 border border-[#BFA14A]/30 rounded-xl bg-[#BFA14A]/5 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-[#BFA14A] uppercase tracking-wider">{t('bot.cvPreviewTitle')}</span>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(cvData, null, 2));
                        }} className="text-[10px] px-2 py-0.5 rounded border border-[#BFA14A]/30 text-[#BFA14A] hover:bg-[#BFA14A]/10 transition-all">
                          {t('bot.copy')} JSON
                        </button>
                        <button onClick={() => setShowCvPreview(false)} className="text-[10px] px-2 py-0.5 rounded border border-gray-200 text-gray-400 hover:text-gray-600 transition-all">
                          {t('bot.close')}
                        </button>
                      </div>
                    </div>
                    {cvData.personal_info && (
                      <div className="mb-2.5 pb-2 border-b border-[#BFA14A]/15">
                        <p className="text-sm font-semibold text-gray-800">{cvData.personal_info.full_name || cvData.personal_info.name || '—'}</p>
                        {(cvData.personal_info.target_role || cvData.target_role) && <p className="text-[11px] text-[#BFA14A] font-medium">{cvData.personal_info.target_role || cvData.target_role}</p>}
                        <div className="flex flex-wrap gap-2 mt-1">
                          {cvData.personal_info.email && <span className="text-[10px] text-gray-500">{cvData.personal_info.email}</span>}
                          {cvData.personal_info.phone && <span className="text-[10px] text-gray-500">| {cvData.personal_info.phone}</span>}
                          {cvData.personal_info.location && <span className="text-[10px] text-gray-500">| {cvData.personal_info.location}</span>}
                        </div>
                      </div>
                    )}
                    {cvData.summary && (
                      <div className="mb-2.5 pb-2 border-b border-[#BFA14A]/15">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">{t('bot.professionalSummary')}</p>
                        <p className="text-[11px] text-gray-700 leading-relaxed">{cvData.summary}</p>
                      </div>
                    )}
                    {cvData.experiences && cvData.experiences.length > 0 && (
                      <div className="mb-2.5 pb-2 border-b border-[#BFA14A]/15">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{t('bot.workExperience')}</p>
                        {cvData.experiences.map((exp, i) => (
                          <div key={i} className="mb-2 pl-2 border-l-2 border-[#BFA14A]/30">
                            <p className="text-[11px] font-semibold text-gray-800">{exp.role}{exp.company ? ` — ${exp.company}` : ''}</p>
                            {(exp.date_period || exp.period) && <p className="text-[10px] text-gray-400">{exp.date_period || exp.period}</p>}
                            {exp.bullet_points && exp.bullet_points.map((bp, j) => (
                              <p key={j} className="text-[10px] text-gray-600 ml-1">• {bp}</p>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                    {cvData.education && cvData.education.length > 0 && (
                      <div className="mb-2.5 pb-2 border-b border-[#BFA14A]/15">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">{t('bot.education')}</p>
                        {cvData.education.map((edu, i) => (
                          <p key={i} className="text-[11px] text-gray-700">{edu.degree}{edu.institution ? ` — ${edu.institution}` : ''}{(edu.year || edu.period) ? ` (${edu.year || edu.period})` : ''}</p>
                        ))}
                      </div>
                    )}
                    {cvData.skills && cvData.skills.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{t('bot.skills')}</p>
                        <div className="flex flex-wrap gap-1">
                          {cvData.skills.map((skill, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[#BFA14A]/10 text-[#BFA14A] font-medium">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* CV Builder Input */}
              <div className="p-3 border-t border-gray-100 shrink-0">
                <div className={`flex items-center gap-2 ${isFullscreen ? 'max-w-4xl mx-auto w-full' : ''}`}>
                  {Object.keys(cvData).length > 0 && (
                    <button onClick={() => setShowCvPreview(!showCvPreview)} className={`p-2 rounded-lg transition-colors ${showCvPreview ? 'bg-[#BFA14A]/10 text-[#BFA14A]' : 'hover:bg-gray-100 text-gray-400'}`} title={t('bot.cvPreviewTitle')}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                      </svg>
                    </button>
                  )}
                  <input
                    ref={cvInputRef}
                    type="text"
                    value={cvInput}
                    onChange={e => setCvInput(e.target.value)}
                    onKeyDown={handleCvKeyDown}
                    placeholder={t('bot.cvMakerInputPlaceholder')}
                    disabled={cvLoading}
                    className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A] disabled:opacity-50"
                  />
                  <button
                    onClick={() => sendCvMessage()}
                    disabled={!cvInput.trim() || cvLoading}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                    style={{ background: cvInput.trim() ? 'linear-gradient(135deg, #BFA14A 0%, #8F7A3A 100%)' : '#e5e7eb' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* VIEW: Mock Interview (NEW) */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {view === 'mock_interview' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Setup Phase */}
              {!mockStarted && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, #BFA14A20 0%, #8F7A3A20 100%)' }}>
                    <span className="text-2xl">🎙️</span>
                  </div>
                  <h4 className="font-semibold text-gray-800 text-sm mb-1">{t('bot.tabMockInterview')}</h4>
                  <p className="text-xs text-gray-500 mb-4 px-2">{t('bot.mockInterviewDesc')}</p>
                  <div className="w-full max-w-[280px] mb-3">
                    <label className="block text-[10px] font-medium text-gray-700 mb-1 text-left">{t('bot.mockTargetRole')}</label>
                    <input
                      value={mockTargetRole}
                      onChange={e => setMockTargetRole(e.target.value)}
                      placeholder={t('bot.mockTargetRolePlaceholder')}
                      className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A]"
                    />
                  </div>
                  <div className="w-full max-w-[280px] mb-3">
                    <label className="block text-[10px] font-medium text-gray-700 mb-1 text-left">{t('bot.mockTargetCompany')}</label>
                    <input
                      value={mockTargetCompany}
                      onChange={e => setMockTargetCompany(e.target.value)}
                      placeholder={t('bot.mockTargetCompanyPlaceholder')}
                      className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A]"
                    />
                  </div>
                  <button
                    onClick={startMockInterview}
                    disabled={!mockTargetRole.trim()}
                    className="px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: mockTargetRole.trim() ? 'linear-gradient(135deg, #BFA14A 0%, #8F7A3A 100%)' : '#ccc' }}
                  >
                    {t('bot.mockStartInterview')}
                  </button>
                </div>
              )}

              {/* Interview Active Phase */}
              {mockStarted && (
                <>
                  {/* Current Question */}
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-bold text-[#BFA14A] uppercase tracking-wider">{t('bot.mockCurrentQuestion')}</span>
                      <div className="flex items-center gap-2">
                        {mockHistory.length > 0 && (
                          <span className="text-[9px] text-gray-400">{mockHistory.length} {t('bot.answered')}</span>
                        )}
                        <button onClick={() => { setMockStarted(false); setMockFeedback(null); setMockHistory([]); }} className="text-[9px] text-gray-400 hover:text-gray-600 transition-colors">
                          {t('bot.mockNewSession')}
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed italic">"{mockCurrentQuestion}"</p>
                  </div>

                  {/* Recording Controls */}
                  <div className="flex justify-center gap-3 py-2">
                    {!mockRecording && !mockAnalyzing && (
                      <button
                        onClick={startRecording}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
                      >
                        <span className="w-3 h-3 rounded-full bg-white/80" />
                        {t('bot.mockRecord')}
                      </button>
                    )}
                    {mockRecording && (
                      <button
                        onClick={stopAndSend}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all"
                        style={{ background: 'linear-gradient(135deg, #BFA14A 0%, #8F7A3A 100%)' }}
                      >
                        <span className="w-3 h-3 rounded-sm bg-white animate-pulse" />
                        {t('bot.mockStopAndSend')}
                      </button>
                    )}
                    {mockAnalyzing && (
                      <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm">
                        <LoadingSpinner />
                        {t('bot.mockAnalyzing')}
                      </div>
                    )}
                  </div>

                  {/* Feedback Display */}
                  {mockFeedback && (
                    <div className="space-y-2 mt-1">
                      {mockFeedback.transcription_summary && (
                        <FeedbackCard icon="📝" title={t('bot.mockTranscription')} content={mockFeedback.transcription_summary} />
                      )}
                      {mockFeedback.duration_feedback && (
                        <FeedbackCard icon="⏱️" title={t('bot.mockDuration')} content={mockFeedback.duration_feedback} />
                      )}
                      {mockFeedback.delivery_and_tone && (
                        <FeedbackCard icon="🎯" title={t('bot.mockDelivery')} content={mockFeedback.delivery_and_tone} />
                      )}
                      {mockFeedback.content_critique && (
                        <FeedbackCard icon="📊" title={t('bot.mockContent')} content={mockFeedback.content_critique} />
                      )}
                      {mockFeedback.improved_answer && (
                        <FeedbackCard icon="✨" title={t('bot.mockImproved')} content={mockFeedback.improved_answer} accent />
                      )}
                      {mockFeedback.next_question && (
                        <div className="bg-[#BFA14A]/5 border border-[#BFA14A]/20 rounded-xl p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs">➡️</span>
                            <span className="text-[10px] font-bold text-[#BFA14A] uppercase tracking-wider">{t('bot.mockNextQuestion')}</span>
                          </div>
                          <p className="text-xs text-gray-800 italic mb-2">"{mockFeedback.next_question}"</p>
                          <button
                            onClick={() => {
                              setMockFeedback(null);
                            }}
                            className="text-[11px] px-3 py-1 rounded-lg text-white font-medium transition-all hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg, #BFA14A 0%, #8F7A3A 100%)' }}
                          >
                            {t('bot.mockAskNext')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* VIEW: Chat Messages (existing) */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {view === 'chat' && (
            <>
              <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${isFullscreen ? 'max-w-4xl mx-auto w-full' : ''}`}>
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2" style={{ background: 'linear-gradient(135deg, #BFA14A20 0%, #8F7A3A20 100%)' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#BFA14A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a7 7 0 0 1 7 7c0 3-2 5.5-4 7l-3 3.5L9 16c-2-1.5-4-4-4-7a7 7 0 0 1 7-7z" />
                        <circle cx="12" cy="9" r="1.5" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-800 text-sm mb-0.5">{t('bot.greeting')} {profile?.first_name || t('bot.greetingUser')}!</h4>
                    <p className="text-[11px] text-gray-400 mb-4">
                      {t('bot.subtitle')}
                    </p>

                    {/* ── Quick chat prompts ── */}
                    <div className="flex flex-wrap justify-center gap-1.5 mb-4 w-full">
                      {[
                        { icon: '🎯', label: t('bot.strategy'), msg: t('bot.strategyMsg') },
                        { icon: '💰', label: t('bot.salary'), msg: t('bot.salaryMsg') },
                      ].map((item) => (
                        <button
                          key={item.label}
                          onClick={() => sendMessage(item.msg)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-100 hover:border-[#BFA14A]/30 hover:bg-[#BFA14A]/5 transition-all text-left text-[11px] text-gray-500"
                        >
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* ── Tool chips (centred) ── */}
                    <div className="w-full">
                      <p className="text-[10px] uppercase tracking-wider text-gray-300 font-medium mb-2">
                        {t('bot.toolsLabel')}
                      </p>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {tabs.filter(t => t.key !== 'chat').map(tab => (
                          <button
                            key={tab.key}
                            onClick={() => setView(tab.key)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-100 hover:border-[#BFA14A]/40 hover:bg-[#BFA14A]/5 transition-all text-[11px] text-gray-500 hover:text-gray-700"
                          >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                          </button>
                        ))}
                      </div>
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
                      <div className="whitespace-pre-wrap">{msg.content}</div>
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
                    <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 border-t border-gray-100 shrink-0">
                <div className={`flex items-center gap-2 ${isFullscreen ? 'max-w-4xl mx-auto w-full' : ''}`}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('bot.inputPlaceholder')}
                    disabled={loading}
                    className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A] disabled:opacity-50"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                    style={{ background: input.trim() ? 'linear-gradient(135deg, #BFA14A 0%, #8F7A3A 100%)' : '#e5e7eb' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

// ─── Helper Components ───
function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function FeedbackCard({ icon, title, content, accent }: { icon: string; title: string; content: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-3 border ${accent ? 'bg-green-50/50 border-green-200/50' : 'bg-white border-gray-100'}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-xs">{icon}</span>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${accent ? 'text-green-700' : 'text-gray-500'}`}>{title}</span>
      </div>
      <p className="text-[11px] text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  );
}
