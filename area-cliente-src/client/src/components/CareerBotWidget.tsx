import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';

const HYPER_TASK_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co/functions/v1/hyper-task';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  type?: 'chat' | 'cover_letter';
};

type WidgetView = 'chat' | 'cover_letter';

export default function CareerBotWidget() {
  const { user, profile, subscription, hasActiveSubscription } = useAuth();
  const { t } = useI18n();

  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<WidgetView>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [coverLetterNotes, setCoverLetterNotes] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Don't render if no active subscription
  if (!user || !hasActiveSubscription()) return null;

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
      // CV text will be fetched from profile if available
    };
  }, [profile]);

  const sendMessage = async (overrideMessage?: string) => {
    const msg = overrideMessage || input.trim();
    if (!msg && view === 'chat') return;

    const userMsg: Message = { role: 'user', content: msg || `Carta de apresentação para ${company} — ${role}` };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const profileCtx = getProfileContext();
      const isCoverLetter = view === 'cover_letter' && company && role;

      const body: any = {
        mode: 'career_coach',
        message: msg || undefined,
        history: messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
        ...profileCtx,
      };

      if (isCoverLetter) {
        body.cover_letter = true;
        body.target_company = company;
        body.target_role = role;
        if (!msg) {
          body.message = coverLetterNotes
            ? `Gera uma carta de apresentação para a empresa ${company}, para a vaga de ${role}. Notas adicionais: ${coverLetterNotes}`
            : `Gera uma carta de apresentação para a empresa ${company}, para a vaga de ${role}. Usa o meu perfil profissional para personalizar.`;
        }
      }

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
          content: 'Desculpa, ocorreu um erro. Tenta novamente.',
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Erro de ligação. Verifica a tua internet e tenta novamente.',
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
    setView('chat');
    sendMessage(
      coverLetterNotes
        ? `Gera uma carta de apresentação para a empresa ${company}, para a vaga de ${role}. Notas: ${coverLetterNotes}`
        : `Gera uma carta de apresentação para a empresa ${company}, para a vaga de ${role}.`
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const resetChat = () => {
    setMessages([]);
    setView('chat');
    setCompany('');
    setRole('');
    setCoverLetterNotes('');
  };

  // Open widget directly in cover letter mode (for external trigger)
  useEffect(() => {
    const handler = () => {
      setIsOpen(true);
      setView('cover_letter');
    };
    window.addEventListener('open-career-bot-cover-letter', handler);
    return () => window.removeEventListener('open-career-bot-cover-letter', handler);
  }, []);

  // Open widget in chat mode (for external trigger)
  useEffect(() => {
    const handler = () => {
      setIsOpen(true);
      setView('chat');
    };
    window.addEventListener('open-career-bot', handler);
    return () => window.removeEventListener('open-career-bot', handler);
  }, []);

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 hover:shadow-xl"
          style={{ background: 'linear-gradient(135deg, #BFA14A 0%, #8F7A3A 100%)' }}
          title="Career Advisory Bot"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {/* Pulse indicator */}
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-3rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
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
                <h3 className="text-white font-semibold text-sm leading-tight">Career Advisory Bot</h3>
                <p className="text-white/70 text-xs">Share2Inspire AI</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={resetChat}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                title="Nova conversa"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                title="Minimizar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex border-b border-gray-100 shrink-0">
            <button
              onClick={() => setView('chat')}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                view === 'chat'
                  ? 'text-[#BFA14A] border-b-2 border-[#BFA14A]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              💬 Chat
            </button>
            <button
              onClick={() => setView('cover_letter')}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                view === 'cover_letter'
                  ? 'text-[#BFA14A] border-b-2 border-[#BFA14A]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              ✉️ Carta de Apresentação
            </button>
          </div>

          {/* Cover Letter Form */}
          {view === 'cover_letter' && (
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Gera uma carta de apresentação personalizada com base no teu perfil profissional (CV + LinkedIn).
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Empresa *</label>
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="Ex: Google, Deloitte, AstraZeneca..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Vaga / Função *</label>
                  <input
                    type="text"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    placeholder="Ex: Product Manager, HR Business Partner..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notas adicionais (opcional)</label>
                  <textarea
                    value={coverLetterNotes}
                    onChange={e => setCoverLetterNotes(e.target.value)}
                    placeholder="Ex: Quero destacar a minha experiência em transformação digital..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA14A]/30 focus:border-[#BFA14A] resize-none"
                  />
                </div>
                <button
                  onClick={handleCoverLetterSubmit}
                  disabled={!company.trim() || !role.trim() || loading}
                  className="w-full py-2.5 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: company.trim() && role.trim() ? 'linear-gradient(135deg, #BFA14A 0%, #8F7A3A 100%)' : '#ccc' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      A gerar...
                    </span>
                  ) : '✉️ Gerar Carta de Apresentação'}
                </button>
                {profile && (
                  <p className="text-xs text-gray-400 text-center">
                    Será personalizada com base no perfil de {profile.first_name} {profile.last_name}
                    {profile.linkedin_url ? ' e LinkedIn' : ''}
                    {profile.cv_filename ? ` e CV (${profile.cv_filename})` : ''}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {view === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, #BFA14A20 0%, #8F7A3A20 100%)' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#BFA14A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a7 7 0 0 1 7 7c0 3-2 5.5-4 7l-3 3.5L9 16c-2-1.5-4-4-4-7a7 7 0 0 1 7-7z" />
                        <circle cx="12" cy="9" r="1.5" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-800 text-sm mb-1">Olá, {profile?.first_name || 'Utilizador'}!</h4>
                    <p className="text-xs text-gray-500 mb-4">
                      Sou o teu assistente de carreira. Posso ajudar-te com:
                    </p>
                    <div className="grid grid-cols-2 gap-2 w-full">
                      {[
                        { icon: '🎯', label: 'Estratégia de carreira', msg: 'Quero definir a minha estratégia de carreira' },
                        { icon: '📝', label: 'Preparar entrevista', msg: 'Ajuda-me a preparar para uma entrevista' },
                        { icon: '💰', label: 'Negociar salário', msg: 'Como negociar o meu salário?' },
                        { icon: '✉️', label: 'Carta de apresentação', msg: '__COVER_LETTER__' },
                      ].map((item) => (
                        <button
                          key={item.label}
                          onClick={() => {
                            if (item.msg === '__COVER_LETTER__') {
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
                      {msg.type === 'cover_letter' && msg.role === 'assistant' && (
                        <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-gray-200/50">
                          <span className="text-xs">✉️</span>
                          <span className="text-xs font-medium opacity-70">Carta de Apresentação</span>
                          <button
                            onClick={() => copyToClipboard(msg.content)}
                            className="ml-auto p-1 rounded hover:bg-black/10 transition-colors"
                            title="Copiar"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          </button>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      {msg.role === 'assistant' && msg.type !== 'cover_letter' && (
                        <button
                          onClick={() => copyToClipboard(msg.content)}
                          className="mt-1.5 p-1 rounded hover:bg-black/10 transition-colors opacity-40 hover:opacity-70"
                          title="Copiar"
                        >
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
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escreve a tua pergunta..."
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
