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
  const pick = ({ pt, en, es }: { pt: string; en: string; es: string }) => lang === 'pt' ? pt : lang === 'es' ? es : en;

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
          alert(pick({
            pt: `Erro ao aceder ao microfone: ${permErr.message || permErr.name}. Verifica as permissões do browser.`,
            en: `Error accessing microphone: ${permErr.message || permErr.name}. Check browser permissions.`,
            es: `Error al acceder al micrófono: ${permErr.message || permErr.name}. Verifica los permisos del navegador.`
          }));
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
      alert(pick({
        pt: `Erro ao iniciar a gravação: ${err.message || 'erro desconhecido'}. Tenta usar o Chrome.`,
        en: `Error starting recording: ${err.message || 'unknown error'}. Try using Chrome.`,
        es: `Error al iniciar la grabación: ${err.message || 'error desconocido'}. Intenta usar Chrome.`
      }));
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
    
    const msg = pick({
      pt: `Carta de apresentação em PT-PT. Candidato: ${profileName}. Empresa: ${company}. Função: ${role}.${profile?.linkedin_url ? ` LinkedIn: ${profile.linkedin_url}.` : ''}${profile?.cv_filename ? ` CV: ${profile.cv_filename}.` : ''}${coverLetterNotes ? ` Notas: ${coverLetterNotes}.` : ''}

Estrutura: saudação formal personalizada → abertura com conhecimento da empresa → 2-3 realizações quantificáveis alinhadas com a função → fit cultural (porquê esta empresa) → fecho com call-to-action → despedida.
Tom: profissional com personalidade, confiante, verbos de ação fortes, PT-PT rigoroso.
Proibido: "Venho por este meio", linguagem genérica, repetir CV. Máx 400 palavras. Incluir dados quantificáveis.
Gera APENAS a carta.`,
      en: `Cover letter in English. Candidate: ${profileName}. Company: ${company}. Role: ${role}.${profile?.linkedin_url ? ` LinkedIn: ${profile.linkedin_url}.` : ''}${profile?.cv_filename ? ` CV: ${profile.cv_filename}.` : ''}${coverLetterNotes ? ` Notes: ${coverLetterNotes}.` : ''}

Structure: personalised formal greeting → opening with company knowledge → 2-3 quantifiable achievements aligned with the role → cultural fit (why this company) → closing with call-to-action → sign-off.
Tone: professional with personality, confident, strong action verbs.
Forbidden: "I am writing to", generic language, repeating CV. Max 400 words. Include quantifiable data.
Generate ONLY the letter.`,
      es: `Carta de presentación en español. Candidato: ${profileName}. Empresa: ${company}. Puesto: ${role}.${profile?.linkedin_url ? ` LinkedIn: ${profile.linkedin_url}.` : ''}${profile?.cv_filename ? ` CV: ${profile.cv_filename}.` : ''}${coverLetterNotes ? ` Notas: ${coverLetterNotes}.` : ''}

Estructura: saludo formal personalizado → apertura con conocimiento de la empresa → 2-3 logros cuantificables alineados con el puesto → encaje cultural (por qué esta empresa) → cierre con call-to-action → despedida.
Tono: profesional con personalidad, seguro, verbos de acción fuertes.
Prohibido: "Me dirijo a usted", lenguaje genérico, repetir CV. Máx 400 palabras. Incluir datos cuantificables.
Genera SOLO la carta.`
    });

    const display = pick({
      pt: `✉️ Gerar carta de apresentação para ${role} na ${company}${coverLetterNotes ? ` (${coverLetterNotes})` : ''}`,
      en: `✉️ Generate cover letter for ${role} at ${company}${coverLetterNotes ? ` (${coverLetterNotes})` : ''}`,
      es: `✉️ Generar carta de presentación para ${role} en ${company}${coverLetterNotes ? ` (${coverLetterNotes})` : ''}`});
    setView('chat');
    sendMessage(msg, display);
  };

  // ─── NETWORKING EMAIL ───
  const handleNetworkingEmailSubmit = () => {
    if (!netRecipient.trim() || !netPurpose.trim()) return;
    const profileName = profile ? `${profile.first_name} ${profile.last_name}` : '';
    
    const msg = pick({
      pt: `E-mail de networking em PT-PT. De: ${profileName}. Para: ${netRecipient}. Objetivo: ${netPurpose}.${profile?.linkedin_url ? ` LinkedIn: ${profile.linkedin_url}.` : ''}${netNotes ? ` Contexto: ${netNotes}.` : ''}

Estrutura: assunto curto e específico → saudação → referência concreta ao trabalho do destinatário → motivo do contacto direto → pedido específico (15min conversa, conselho) → facilitar resposta → assinatura.
Tom: respeitoso sem ser subserviente, direto, valor mútuo, autêntico, PT-PT rigoroso.
Proibido: "Espero que o encontre bem", ser vago, pedir desculpa por contactar. Máx 200 palavras no corpo. Incluir razão concreta para o contacto.
Gera APENAS o e-mail com assunto.`,
      en: `Networking email in English. From: ${profileName}. To: ${netRecipient}. Purpose: ${netPurpose}.${profile?.linkedin_url ? ` LinkedIn: ${profile.linkedin_url}.` : ''}${netNotes ? ` Context: ${netNotes}.` : ''}

Structure: short specific subject line → greeting → concrete reference to recipient's work → reason for direct contact → specific ask (15min chat, advice) → make it easy to reply → signature.
Tone: respectful without being subservient, direct, mutual value, authentic.
Forbidden: "I hope this finds you well", being vague, apologising for reaching out. Max 200 words in body. Include concrete reason for contact.
Generate ONLY the email with subject line.`,
      es: `E-mail de networking en español. De: ${profileName}. Para: ${netRecipient}. Objetivo: ${netPurpose}.${profile?.linkedin_url ? ` LinkedIn: ${profile.linkedin_url}.` : ''}${netNotes ? ` Contexto: ${netNotes}.` : ''}

Estructura: asunto corto y específico → saludo → referencia concreta al trabajo del destinatario → motivo del contacto directo → petición específica (15min conversación, consejo) → facilitar respuesta → firma.
Tono: respetuoso sin ser servil, directo, valor mutuo, auténtico.
Prohibido: "Espero que se encuentre bien", ser vago, pedir disculpas por contactar. Máx 200 palabras en el cuerpo. Incluir razón concreta para el contacto.
Genera SOLO el e-mail con asunto.`
    });

    const display = pick({
      pt: `🤝 Gerar e-mail de networking para ${netRecipient} — ${netPurpose}${netNotes ? ` (${netNotes})` : ''}`,
      en: `🤝 Generate networking email to ${netRecipient} — ${netPurpose}${netNotes ? ` (${netNotes})` : ''}`,
      es: `🤝 Generar e-mail de networking para ${netRecipient} — ${netPurpose}${netNotes ? ` (${netNotes})` : ''}`});
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
    
    const msg = pick({
      pt: `Post LinkedIn em PT-PT a anunciar mudança profissional. Autor: ${profileName}. Nova empresa: ${liNewCompany}. Nova função: ${liNewRole}. Tom: ${toneDesc}.${profile?.linkedin_url ? ` LinkedIn: ${profile.linkedin_url}.` : ''}${liNotes ? ` Notas: ${liNotes}.` : ''}

Estrutura: gancho forte na 1ª linha (LinkedIn mostra só 2 linhas antes do "ver mais") → percurso anterior → anúncio da nova posição → reflexão genuína sobre transições → agradecimento específico → call-to-action → 3-5 hashtags.
Tom: ${toneDesc}. Autêntico, parágrafos curtos (1-2 frases), momento de vulnerabilidade, PT-PT rigoroso.
Proibido: "Tenho o prazer de anunciar", emojis em excesso (máx 3), comunicado de imprensa. 150-250 palavras. Espaçamento entre parágrafos.
Gera APENAS o post.`,
      en: `LinkedIn post in English announcing a career change. Author: ${profileName}. New company: ${liNewCompany}. New role: ${liNewRole}. Tone: ${toneDesc}.${profile?.linkedin_url ? ` LinkedIn: ${profile.linkedin_url}.` : ''}${liNotes ? ` Notes: ${liNotes}.` : ''}

Structure: strong hook in the 1st line (LinkedIn shows only 2 lines before "see more") → previous journey → new position announcement → genuine reflection on transitions → specific thanks → call-to-action → 3-5 hashtags.
Tone: ${toneDesc}. Authentic, short paragraphs (1-2 sentences), moment of vulnerability.
Forbidden: "I am pleased to announce", excessive emojis (max 3), press release style. 150-250 words. Spacing between paragraphs.
Generate ONLY the post.`,
      es: `Post LinkedIn en español anunciando cambio profesional. Autor: ${profileName}. Nueva empresa: ${liNewCompany}. Nuevo puesto: ${liNewRole}. Tono: ${toneDesc}.${profile?.linkedin_url ? ` LinkedIn: ${profile.linkedin_url}.` : ''}${liNotes ? ` Notas: ${liNotes}.` : ''}

Estructura: gancho fuerte en la 1ª línea (LinkedIn muestra solo 2 líneas antes de "ver más") → recorrido anterior → anuncio de la nueva posición → reflexión genuina sobre transiciones → agradecimiento específico → call-to-action → 3-5 hashtags.
Tono: ${toneDesc}. Auténtico, párrafos cortos (1-2 frases), momento de vulnerabilidad.
Prohibido: "Me complace anunciar", emojis en exceso (máx 3), estilo comunicado de prensa. 150-250 palabras. Espaciado entre párrafos.
Genera SOLO el post.`
    });

    const display = pick({
      pt: `📢 Gerar post LinkedIn: ${liNewRole} na ${liNewCompany} (tom: ${liTone})${liNotes ? ` — ${liNotes}` : ''}`,
      en: `📢 Generate LinkedIn post: ${liNewRole} at ${liNewCompany} (tone: ${liTone})${liNotes ? ` — ${liNotes}` : ''}`,
      es: `📢 Generar post LinkedIn: ${liNewRole} en ${liNewCompany} (tono: ${liTone})${liNotes ? ` — ${liNotes}` : ''}`});
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
      profissional: { pt: 'profissional e confiante', en: 'professional and confident' },
      criativo: { pt: 'criativo e original, com metáforas ou estruturas não convencionais', en: 'creative and original, with unconventional structures' },
      direto: { pt: 'direto e impactante, sem floreados', en: 'direct and impactful, no fluff' },
      inspirador: { pt: 'inspirador e com impacto emocional', en: 'inspiring and emotionally impactful' },
    };

    const langInstruction = hlLang === 'pt'
      ? pick({ pt: 'Escreve TODAS as headlines em Português (Portugal), não em inglês.', en: 'Write ALL headlines in English.', es: 'Escribe TODAS las titulares en español, no en inglés.' })
      : 'Write ALL headlines in English.';

    const prompt = `${langInstruction}\n\nGera exatamente ${hlNum} headlines para perfil LinkedIn. Cada headline deve ter no máximo 220 caracteres (o limite do LinkedIn).\n\nDados da pessoa:\n- Nome: ${profile?.first_name || 'não fornecido'} ${profile?.last_name || ''}\n- Cargo atual: ${hlCargo || 'não fornecido'}\n- Área/Setor: ${hlArea || 'não fornecido'}\n- Experiência: ${hlAnos || 'não fornecido'}\n- O que faz / valor que traz: ${hlValor || 'não fornecido'}\n- Público-alvo: ${hlPublico || 'não fornecido'}\n${hlKeywords ? `- Incluir palavras-chave: ${hlKeywords}` : ''}\n\nTom desejado: ${toneMap[hlTone]?.[hlLang] || hlTone}\n\nInstruções importantes:\n1. Cada headline deve ser única e usar estruturas diferentes\n2. Mistura abordagens: orientada a resultados, focada no cliente, baseada em identidade, focada em transformação\n3. Usa separadores como | · — quando fizer sentido\n4. NÃO incluas o nome da pessoa na headline\n5. NÃO uses clichês como "apaixonado por" ou "guru"\n6. Máximo ABSOLUTO: 220 caracteres por headline\n\nResponde APENAS com um JSON válido neste formato (sem markdown, sem texto extra):\n{"headlines": ["headline 1", "headline 2", "headline 3"]}`;

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
          const cleaned = raw.replace(/[{}\[\]"]+/g, '').replace(/^headlines\s*:?\