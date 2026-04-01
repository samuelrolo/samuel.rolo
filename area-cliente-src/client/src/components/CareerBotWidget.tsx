import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';

const HYPER_TASK_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co/functions/v1/hyper-task';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  type?: 'chat' | 'cover_letter' | 'networking_email' | 'linkedin_post';
};

type WidgetView = 'chat' | 'cover_letter' | 'networking_email' | 'linkedin_post' | 'headline_generator';

export default function CareerBotWidget() {
  const { user, profile, subscription, hasActiveSubscription } = useAuth();
  const { t, lang } = useI18n();

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, view]);

  // Build profile context for the API
  const getProfileContext = useCallback(() => {
    return {
      profile_name: profile ? `${profile.first_name} ${profile.last_name}` : '',
      profile_linkedin: profile?.linkedin_url || '',
    };
  }, [profile]);

  // External event listeners
  useEffect(() => {
    const openCoverLetter = () => { setIsOpen(true); setView('cover_letter'); };
    const openChat = () => { setIsOpen(true); setView('chat'); };
    const openNetworkingEmail = () => { setIsOpen(true); setView('networking_email'); };
    const openLinkedinPost = () => { setIsOpen(true); setView('linkedin_post'); };
    const openHeadlineGenerator = () => { setIsOpen(true); setView('headline_generator'); };

    window.addEventListener('open-career-bot', openChat);
    window.addEventListener('open-career-bot-cover-letter', openCoverLetter);
    window.addEventListener('open-career-bot-networking-email', openNetworkingEmail);
    window.addEventListener('open-career-bot-linkedin-post', openLinkedinPost);
    window.addEventListener('open-headline-generator', openHeadlineGenerator);

    return () => {
      window.removeEventListener('open-career-bot', openChat);
      window.removeEventListener('open-career-bot-cover-letter', openCoverLetter);
      window.removeEventListener('open-career-bot-networking-email', openNetworkingEmail);
      window.removeEventListener('open-career-bot-linkedin-post', openLinkedinPost);
      window.removeEventListener('open-headline-generator', openHeadlineGenerator);
    };
  }, []);

  // Don't render if no active subscription — MUST be after all hooks
  if (!user || !hasActiveSubscription()) return null;

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
        language: lang, // Send current page language to the edge function
        history: messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
        ...profileCtx,
      };

      // Cover letter mode
      if (view === 'cover_letter' && company && role && !overrideMessage?.startsWith('__SKIP__')) {
        body.cover_letter = true;
        body.target_company = company;
        body.target_role = role;
      }

      // Note: networking_email and linkedin_post are handled via the message content
      // The full prompt is already in the message field, so the career_coach mode processes it correctly

      const response = await fetch(HYPER_TASK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const handleCoverLetterSubmit = () => {
    if (!company.trim() || !role.trim()) return;
    const profileName = profile ? `${profile.first_name} ${profile.last_name}` : '';
    
    const msg = lang === 'pt'
      ? `Carta de apresentação em PT-PT. Candidato: ${profileName}. Empresa: ${company}. Função: ${role}.${profile?.linkedin_url ? ` LinkedIn: ${profile.linkedin_url}.` : ''}${profile?.cv_filename ? ` CV: ${profile.cv_filename}.` : ''}${coverLetterNotes ? ` Notas: ${coverLetterNotes}.` : ''}

Estrutura: saudação formal personalizada → abertura com conhecimento da empresa → 2-3 realizações quantificáveis alinhadas com a função → fit cultural (porquê esta empresa) → fecho com call-to-action → despedida.
Tom: profissional com personalidade, confiante, verbos de ação fortes, PT-PT rigoroso.
Proibido: "Venho por este meio", linguagem genérica, repetir CV. Máx 400 palavras. Incluir dados quantificáveis.
Gera APENAS a carta.`
      : `Cover letter in English. Candidate: ${profileName}. Company: ${company}. Role: ${role}.${profile?.linkedin_url ? ` LinkedIn: ${profile.linkedin_url}.` : ''}${profile?.cv_filename ? ` CV: ${profile.cv_filename}.` : ''}${coverLetterNotes ? ` Notes: ${coverLetterNotes}.` : ''}

Structure: personalised formal greeting → opening with company knowledge → 2-3 quantifiable achievements aligned with the role → cultural fit (why this company) → closing with call-to-action → sign-off.
Tone: professional with personality, confident, strong action verbs.
Forbidden: "I am writing to", generic language, repeating CV. Max 400 words. Include quantifiable data.
Generate ONLY the letter.`;

    const display = lang === 'pt'
      ? `✉️ Gerar carta de apresentação para ${role} na ${company}${coverLetterNotes ? ` (${coverLetterNotes})` : ''}`
      : `✉️ Generate cover letter for ${role} at ${company}${coverLetterNotes ? ` (${coverLetterNotes})` : ''}`;
    setView('chat');
    sendMessage(msg, display);
  };

  const handleNetworkingEmailSubmit = () => {
    if (!netRecipient.trim() || !netPurpose.trim()) return;
    const profileName = profile ? `${profile.first_name} ${profile.last_name}` : '';
    
    const msg = lang === 'pt'
      ? `E-mail de networking em PT-PT. De: ${profileName}. Para: ${netRecipient}. Objetivo: ${netPurpose}.${profile?.linkedin_url ? ` LinkedIn: ${profile.linkedin_url}.` : ''}${netNotes ? ` Contexto: ${netNotes}.` : ''}

Estrutura: assunto curto e específico → saudação → referência concreta ao trabalho do destinatário → motivo do contacto direto → pedido específico (15min conversa, conselho) → facilitar resposta → assinatura.
Tom: respeitoso sem ser subserviente, direto, valor mútuo, autêntico, PT-PT rigoroso.
Proibido: "Espero que o encontre bem", ser vago, pedir desculpa por contactar. Máx 200 palavras no corpo. Incluir razão concreta para o contacto.
Gera APENAS o e-mail com assunto.`
      : `Networking email in English. From: ${profileName}. To: ${netRecipient}. Purpose: ${netPurpose}.${profile?.linkedin_url ? ` LinkedIn: ${profile.linkedin_url}.` : ''}${netNotes ? ` Context: ${netNotes}.` : ''}

Structure: short specific subject line → greeting → concrete reference to recipient's work → reason for direct contact → specific ask (15min chat, advice) → make it easy to reply → signature.
Tone: respectful without being subservient, direct, mutual value, authentic.
Forbidden: "I hope this finds you well", being vague, apologising for reaching out. Max 200 words in body. Include concrete reason for contact.
Generate ONLY the email with subject line.`;

    const display = lang === 'pt'
      ? `🤝 Gerar e-mail de networking para ${netRecipient} — ${netPurpose}${netNotes ? ` (${netNotes})` : ''}`
      : `🤝 Generate networking email to ${netRecipient} — ${netPurpose}${netNotes ? ` (${netNotes})` : ''}`;
    setView('chat');
    sendMessage(msg, display);
  };

  const handleLinkedinPostSubmit = () => {
    if (!liNewCompany.trim() || !liNewRole.trim()) return;
    const profileName = profile ? `${profile.first_name} ${profile.last_name}` : '';
    const toneDescriptions: Record<string, Record<string, string>> = {
      'profissional': { pt: 'Profissional e sóbrio, com confiança discreta', en: 'Professional and sober, with understated confidence' },
      'entusiasmado': { pt: 'Entusiasmado e energético, com emoção genuína mas sem exagero', en: 'Enthusiastic and energetic, with genuine emotion but no exaggeration' },
      'humilde e grato': { pt: 'Humilde e grato, reconhecendo quem ajudou no percurso', en: 'Humble and grateful, acknowledging those who helped along the way' },
      'inspirador': { pt: 'Inspirador e motivacional, partilhando lições aprendidas', en: 'Inspiring and motivational, sharing lessons learned' },
      'casual e autêntico': { pt: 'Casual e autêntico, como se falasse com um amigo próximo', en: 'Casual and authentic, as if talking to a close friend' },
    };
    const toneDesc = toneDescriptions[liTone]?.[lang] || liTone;
    
    const msg = lang === 'pt'
      ? `Post LinkedIn em PT-PT a anunciar mudança profissional. Autor: ${profileName}. Nova empresa: ${liNewCompany}. Nova função: ${liNewRole}. Tom: ${toneDesc}.${profile?.linkedin_url ? ` LinkedIn: ${profile.linkedin_url}.` : ''}${liNotes ? ` Notas: ${liNotes}.` : ''}

Estrutura: gancho forte na 1ª linha (LinkedIn mostra só 2 linhas antes do "ver mais") → percurso anterior → anúncio da nova posição → reflexão genuína sobre transições → agradecimento específico → call-to-action → 3-5 hashtags.
Tom: ${toneDesc}. Autêntico, parágrafos curtos (1-2 frases), momento de vulnerabilidade, PT-PT rigoroso.
Proibido: "Tenho o prazer de anunciar", emojis em excesso (máx 3), comunicado de imprensa. 150-250 palavras. Espaçamento entre parágrafos.
Gera APENAS o post.`
      : `LinkedIn post in English announcing a career change. Author: ${profileName}. New company: ${liNewCompany}. New role: ${liNewRole}. Tone: ${toneDesc}.${profile?.linkedin_url ? ` LinkedIn: ${profile.linkedin_url}.` : ''}${liNotes ? ` Notes: ${liNotes}.` : ''}

Structure: strong hook in the 1st line (LinkedIn shows only 2 lines before "see more") → previous journey → new position announcement → genuine reflection on transitions → specific thanks → call-to-action → 3-5 hashtags.
Tone: ${toneDesc}. Authentic, short paragraphs (1-2 sentences), moment of vulnerability.
Forbidden: "I am pleased to announce", excessive emojis (max 3), press release style. 150-250 words. Spacing between paragraphs.
Generate ONLY the post.`;

    const display = lang === 'pt'
      ? `📢 Gerar post LinkedIn: ${liNewRole} na ${liNewCompany} (tom: ${liTone})${liNotes ? ` — ${liNotes}` : ''}`
      : `📢 Generate LinkedIn post: ${liNewRole} at ${liNewCompany} (tone: ${liTone})${liNotes ? ` — ${liNotes}` : ''}`;
    setView('chat');
    sendMessage(msg, display);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

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
      ? 'Escreve TODAS as headlines em Português (Portugal), não em inglês.'
      : 'Write ALL headlines in English.';

    const prompt = `${langInstruction}\n\nGera exatamente ${hlNum} headlines para perfil LinkedIn. Cada headline deve ter no máximo 220 caracteres (o limite do LinkedIn).\n\nDados da pessoa:\n- Nome: ${profile?.first_name || 'não fornecido'} ${profile?.last_name || ''}\n- Cargo atual: ${hlCargo || 'não fornecido'}\n- Área/Setor: ${hlArea || 'não fornecido'}\n- Experiência: ${hlAnos || 'não fornecido'}\n- O que faz / valor que traz: ${hlValor || 'não fornecido'}\n- Público-alvo: ${hlPublico || 'não fornecido'}\n${hlKeywords ? `- Incluir palavras-chave: ${hlKeywords}` : ''}\n\nTom desejado: ${toneMap[hlTone]?.[hlLang] || hlTone}\n\nInstruções importantes:\n1. Cada headline deve ser única e usar estruturas diferentes\n2. Mistura abordagens: orientada a resultados, focada no cliente, baseada em identidade, focada em transformação\n3. Usa separadores como | · — quando fizer sentido\n4. NÃO incluas o nome da pessoa na headline\n5. NÃO uses clichês como "apaixonado por" ou "guru"\n6. Máximo ABSOLUTO: 220 caracteres por headline\n\nResponde APENAS com um JSON válido neste formato (sem markdown, sem texto extra):\n{"headlines": ["headline 1", "headline 2", "headline 3"]}`;

    try {
      const response = await fetch(HYPER_TASK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'career_coach',
          message: prompt,
          language: lang,
          history: [],
          profile_name: profile ? `${profile.first_name} ${profile.last_name}` : '',
          profile_linkedin: profile?.linkedin_url || '',
        }),
      });

      const data = await response.json();
      console.log('[Headline] Raw reply:', data.reply);
      if (data.success && data.reply) {
        let headlines: string[] = [];
        // Handle reply that might be string or object
        let replyStr = typeof data.reply === 'object' ? JSON.stringify(data.reply) : String(data.reply);
        
        // Clean markdown code blocks and extra whitespace
        let raw = replyStr
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .replace(/^\s*\n/gm, '')
          .trim();
        
        console.log('[Headline] Cleaned raw:', raw);

        // Try multiple JSON extraction strategies
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

        // Strategy 1: Direct parse of cleaned text
        headlines = tryParse(raw) || [];

        // Strategy 2: Find JSON object with array in text
        if (headlines.length === 0) {
          const jsonObjMatch = raw.match(/\{[\s\S]*\[[\s\S]*\][\s\S]*\}/);
          if (jsonObjMatch) {
            headlines = tryParse(jsonObjMatch[0]) || [];
          }
        }

        // Strategy 3: Find JSON array directly
        if (headlines.length === 0) {
          const arrMatch = raw.match(/\[[\s\S]*\]/);
          if (arrMatch) {
            headlines = tryParse(arrMatch[0]) || [];
          }
        }

        // Strategy 4: Extract quoted strings from truncated/partial JSON
        if (headlines.length === 0) {
          const quotedStrings: string[] = [];
          const quoteRegex = /"([^"]{15,220})"/g;
          let m;
          while ((m = quoteRegex.exec(raw)) !== null) {
            const val = m[1].trim();
            if (val === 'headlines' || val.length < 15) continue;
            quotedStrings.push(val);
          }
          if (quotedStrings.length > 0) {
            headlines = quotedStrings.slice(0, parseInt(hlNum));
          }
        }

        // Strategy 5: Split by numbered lines or newlines
        if (headlines.length === 0) {
          const lines = raw.split(/\n/)
            .map((l: string) => l.replace(/^\d+[\.)\-:\s]+/, '').replace(/^"|"$/g, '').replace(/^[\-\*]\s*/, '').trim())
            .filter((l: string) => l.length > 15 && l.length <= 250 && !l.startsWith('{') && !l.startsWith('['));
          headlines = lines.slice(0, parseInt(hlNum));
        }

        // Strategy 6: Split by comma for flat comma-separated headlines
        if (headlines.length === 0) {
          const cleaned = raw.replace(/[{}\[\]"]/g, '').replace(/^headlines\s*:?\s*/i, '').trim();
          const parts = cleaned.split(/,\s*/).filter((p: string) => p.trim().length > 15);
          if (parts.length >= 2) {
            headlines = parts.slice(0, parseInt(hlNum));
          }
        }

        // Clean up
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
  };

  // Tab labels for the view switcher — using i18n
  const tabs: { key: WidgetView; label: string; icon: string }[] = [
    { key: 'chat', label: t('bot.tabChat'), icon: '💬' },
    { key: 'cover_letter', label: t('bot.tabCoverLetter'), icon: '✉️' },
    { key: 'networking_email', label: t('bot.tabNetworking'), icon: '🤝' },
    { key: 'linkedin_post', label: t('bot.tabLinkedinPost'), icon: '📢' },
    { key: 'headline_generator', label: t('bot.tabHeadline'), icon: '✦' },
  ];

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 hover:shadow-xl"
          style={{ background: 'linear-gradient(135deg, #BFA14A 0%, #8F7A3A 100%)' }}
          title="Career Advisory"
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
                <h3 className="text-white font-semibold text-sm leading-tight">Career Advisory</h3>
                <p className="text-white/70 text-xs">Share2Inspire AI</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Language indicator */}
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white/80 bg-white/15 uppercase tracking-wider">{lang}</span>
              <button onClick={resetChat} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors" title={t('bot.newChat')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </button>
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors" title={isFullscreen ? t('bot.reduce') : t('bot.fullscreen')}>
                {isFullscreen ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3" /><path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                    <path d="M3 16h3a2 2 0 0 1 2 2v3" /><path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                    <path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                  </svg>
                )}
              </button>
              <button onClick={() => { setIsOpen(false); setIsFullscreen(false); }} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors" title={t('bot.minimize')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex border-b border-gray-100 shrink-0 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className={`flex-1 py-2 text-[10px] font-medium transition-colors whitespace-nowrap px-1 ${
                  view === tab.key
                    ? 'text-[#BFA14A] border-b-2 border-[#BFA14A]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Cover Letter Form */}
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

          {/* Networking Email Form */}
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

          {/* LinkedIn Post Form */}
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

          {/* Headline Generator Form */}
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
                      placeholder="Ex: HR Manager, Coach"
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">{t('bot.sector')} *</label>
                    <input type="text" value={hlArea} onChange={e => setHlArea(e.target.value)}
                      placeholder={lang === 'pt' ? 'Ex: RH, Marketing' : 'E.g.: HR, Marketing'}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">{t('bot.experience')}</label>
                    <select value={hlAnos} onChange={e => setHlAnos(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A] bg-white">
                      <option value="">{t('bot.selectExperience')}</option>
                      <option value={lang === 'pt' ? 'Menos de 2 anos' : 'Less than 2 years'}>&lt; 2 {lang === 'pt' ? 'anos' : 'years'}</option>
                      <option value={lang === 'pt' ? '2-5 anos' : '2-5 years'}>2–5 {lang === 'pt' ? 'anos' : 'years'}</option>
                      <option value={lang === 'pt' ? '5-10 anos' : '5-10 years'}>5–10 {lang === 'pt' ? 'anos' : 'years'}</option>
                      <option value={lang === 'pt' ? '10-15 anos' : '10-15 years'}>10–15 {lang === 'pt' ? 'anos' : 'years'}</option>
                      <option value={lang === 'pt' ? 'Mais de 15 anos' : 'More than 15 years'}>&gt; 15 {lang === 'pt' ? 'anos' : 'years'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">{t('bot.targetAudience')}</label>
                    <input type="text" value={hlPublico} onChange={e => setHlPublico(e.target.value)}
                      placeholder={lang === 'pt' ? 'Ex: Recrutadores' : 'E.g.: Recruiters'}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A]" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">{t('bot.valueProposition')}</label>
                  <textarea value={hlValor} onChange={e => setHlValor(e.target.value)}
                    placeholder={lang === 'pt' ? 'Ex: Ajudo profissionais a reposicionar a sua carreira...' : 'E.g.: I help professionals reposition their career...'}
                    rows={2}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A] resize-none" />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">{t('bot.keywords')}</label>
                  <input type="text" value={hlKeywords} onChange={e => setHlKeywords(e.target.value)}
                    placeholder={lang === 'pt' ? 'Ex: liderança, transformação, RH' : 'E.g.: leadership, transformation, HR'}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A]" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">{t('bot.tone')}</label>
                    <select value={hlTone} onChange={e => setHlTone(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A] bg-white">
                      <option value="profissional">{t('bot.toneProfessional')}</option>
                      <option value="criativo">{lang === 'pt' ? 'Criativo' : 'Creative'}</option>
                      <option value="direto">{lang === 'pt' ? 'Direto' : 'Direct'}</option>
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

          {/* Chat Messages */}
          {view === 'chat' && (
            <>
              <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${isFullscreen ? 'max-w-4xl mx-auto w-full' : ''}`}>
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, #BFA14A20 0%, #8F7A3A20 100%)' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#BFA14A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a7 7 0 0 1 7 7c0 3-2 5.5-4 7l-3 3.5L9 16c-2-1.5-4-4-4-7a7 7 0 0 1 7-7z" />
                        <circle cx="12" cy="9" r="1.5" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-800 text-sm mb-1">{t('bot.greeting')} {profile?.first_name || t('bot.greetingUser')}!</h4>
                    <p className="text-xs text-gray-500 mb-4">
                      {t('bot.subtitle')}
                    </p>
                    <div className="grid grid-cols-2 gap-2 w-full">
                      {[
                        { icon: '🎯', label: t('bot.strategy'), msg: t('bot.strategyMsg') },
                        { icon: '📝', label: t('bot.interview'), msg: t('bot.interviewMsg') },
                        { icon: '💰', label: t('bot.salary'), msg: t('bot.salaryMsg') },
                        { icon: '✉️', label: t('bot.templates'), msg: '__TEMPLATES__' },
                      ].map((item) => (
                        <button
                          key={item.label}
                          onClick={() => {
                            if (item.msg === '__TEMPLATES__') {
                              setView('cover_letter');
                            } else {
                              sendMessage(item.msg);
                            }
                          }}
                          className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-100 hover:border-[#BFA14A]/30 hover:bg-[#BFA14A]/5 transition-all text-left"
                        >
                          <span className="text-base">{item.icon}</span>
                          <span className="text-xs text-gray-600">{item.label}</span>
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

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
