/**
 * SHARE2INSPIRE - SAMUEL ROLO AI
 * Career Coach Assistant with Gemini Integration
 * 
 * Created: 2026-01-14
 * Updated: 2026-01-22 - Ultra Minimalist Design + Gemini Integration
 * Purpose: Discrete floating widget for career guidance and professional development
 */

class SamuelRoloAI {
    constructor() {
        this.isOpen = false;
        this.isExpanded = false;
        this.messages = [];
        this.supabaseUrl = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
        this.edgeFunctionUrl = `${this.supabaseUrl}/functions/v1/hyper-task`;
        this.sessionId = this.generateSessionId();
        this.conversationContext = [];
        this.init();
    }

    generateSessionId() {
        return 'sr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    init() {
        this.injectHTML();
        this.attachEventListeners();
    }

    injectHTML() {
        const html = `
            <!-- Samuel Rolo AI - Floating Button -->
            <div class="coach-agent-tab" id="coachAgentTab">
                <button class="coach-tab-button" id="coachTabButton" aria-label="Abrir assistente de carreira">
                    <div class="coach-tab-pulse"></div>
                    <div class="coach-tab-icon">💬</div>
                </button>
            </div>

            <!-- Samuel Rolo AI - Chat Widget -->
            <div class="coach-chat-widget" id="coachChatWidget" role="dialog" aria-label="Assistente de Carreira">
                <!-- Header -->
                <div class="coach-chat-header">
                    <div class="coach-chat-header-info">
                        <div class="coach-avatar">SR</div>
                        <div class="coach-header-text">
                            <h3>Samuel Rolo AI</h3>
                            <p>Disponível para ajudar</p>
                        </div>
                    </div>
                    <div class="coach-header-actions">
                        <button class="coach-expand-btn" id="coachExpandBtn" aria-label="Expandir">⤢</button>
                        <button class="coach-close-btn" id="coachCloseBtn" aria-label="Fechar">×</button>
                    </div>
                </div>

                <!-- Messages Area -->
                <div class="coach-chat-messages" id="coachChatMessages">
                    <!-- Messages will be inserted here -->
                </div>

                <!-- Input Area -->
                <div class="coach-chat-input-area">
                    <div class="coach-quick-actions" id="coachQuickActions">
                        <button class="coach-quick-action" data-action="carreira">🎯 Carreira</button>
                        <button class="coach-quick-action" data-action="formacao">📚 Formação</button>
                        <button class="coach-quick-action" data-action="cv">📄 CV</button>
                        <button class="coach-quick-action" data-action="transicao">🔄 Transição</button>
                    </div>
                    <div class="coach-input-wrapper">
                        <input 
                            type="text" 
                            class="coach-chat-input" 
                            id="coachChatInput" 
                            placeholder="Escreva a sua dúvida..."
                            autocomplete="off"
                        />
                        <button class="coach-send-btn" id="coachSendBtn" aria-label="Enviar">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
    }

    attachEventListeners() {
        const tabButton = document.getElementById('coachTabButton');
        const closeBtn = document.getElementById('coachCloseBtn');
        const expandBtn = document.getElementById('coachExpandBtn');
        const sendBtn = document.getElementById('coachSendBtn');
        const input = document.getElementById('coachChatInput');
        const quickActions = document.querySelectorAll('.coach-quick-action');

        tabButton.addEventListener('click', () => this.toggleWidget());
        closeBtn.addEventListener('click', () => this.closeWidget());
        expandBtn.addEventListener('click', () => this.toggleExpand());
        sendBtn.addEventListener('click', () => this.sendMessage());
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        quickActions.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeWidget();
            }
        });
    }

    toggleWidget() {
        const widget = document.getElementById('coachChatWidget');
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            widget.classList.add('active');
            // Load welcome message on first open
            if (this.messages.length === 0) {
                this.loadWelcomeMessage();
            }
            setTimeout(() => {
                document.getElementById('coachChatInput').focus();
            }, 300);
        } else {
            widget.classList.remove('active');
        }
    }

    closeWidget() {
        const widget = document.getElementById('coachChatWidget');
        widget.classList.remove('active');
        this.isOpen = false;
    }

    toggleExpand() {
        const widget = document.getElementById('coachChatWidget');
        const expandBtn = document.getElementById('coachExpandBtn');
        this.isExpanded = !this.isExpanded;
        
        if (this.isExpanded) {
            widget.classList.add('expanded');
            expandBtn.textContent = '⤡';
            expandBtn.setAttribute('aria-label', 'Reduzir');
        } else {
            widget.classList.remove('expanded');
            expandBtn.textContent = '⤢';
            expandBtn.setAttribute('aria-label', 'Expandir');
        }
    }

    loadWelcomeMessage() {
        const welcomeMsg = {
            type: 'bot',
            content: `Olá! Sou o **Samuel Rolo AI**, o teu assistente de carreira.

Posso ajudar-te com:
• Orientação de carreira e decisões profissionais
• Dúvidas sobre formação e desenvolvimento
• Análise e melhoria de CV
• Transições de carreira

**Como posso ajudar-te hoje?**`,
            timestamp: new Date()
        };
        
        this.messages.push(welcomeMsg);
        this.renderMessage(welcomeMsg);
    }

    async sendMessage() {
        const input = document.getElementById('coachChatInput');
        const message = input.value.trim();
        
        if (!message) return;

        // Add user message
        const userMsg = {
            type: 'user',
            content: message,
            timestamp: new Date()
        };
        
        this.messages.push(userMsg);
        this.renderMessage(userMsg);
        input.value = '';

        // Add to conversation context
        this.conversationContext.push({ role: 'user', content: message });

        // Show typing indicator
        this.showTyping();

        // Get AI response
        try {
            const response = await this.getAIResponse(message);
            this.hideTyping();
            
            const botMsg = {
                type: 'bot',
                content: response,
                timestamp: new Date()
            };
            
            this.messages.push(botMsg);
            this.renderMessage(botMsg);

            // Add to conversation context
            this.conversationContext.push({ role: 'assistant', content: response });

            // Keep only last 10 messages for context
            if (this.conversationContext.length > 10) {
                this.conversationContext = this.conversationContext.slice(-10);
            }

            // Log conversation
            this.logConversation(userMsg, botMsg);
        } catch (error) {
            console.error('[SamuelRoloAI] Error:', error);
            this.hideTyping();
            
            const errorMsg = {
                type: 'bot',
                content: 'Peço desculpa, ocorreu um erro temporário. Por favor, tenta novamente ou contacta-me diretamente em **samuel.rolo@share2inspire.pt**',
                timestamp: new Date()
            };
            
            this.renderMessage(errorMsg);
        }
    }

    async getAIResponse(userMessage) {
        // Try Gemini first via Supabase Edge Function
        try {
            console.log('[SamuelRoloAI] Calling Gemini via Edge Function...');
            
            const response = await fetch(this.edgeFunctionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: userMessage,
                    mode: 'career_coach',
                    context: this.buildContext()
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.reply) {
                    console.log('[SamuelRoloAI] Gemini response received');
                    return data.reply;
                }
            }
            
            console.warn('[SamuelRoloAI] Gemini unavailable, using intelligent fallback');
        } catch (error) {
            console.warn('[SamuelRoloAI] Edge Function error:', error.message);
        }

        // Intelligent fallback
        return this.getIntelligentFallback(userMessage);
    }

    buildContext() {
        const contextParts = [
            'Histórico da conversa:',
            ...this.conversationContext.slice(-6).map(m => 
                `${m.role === 'user' ? 'Utilizador' : 'Samuel Rolo AI'}: ${m.content.substring(0, 200)}`
            )
        ];
        return contextParts.join('\n');
    }

    getIntelligentFallback(userMessage) {
        const msg = userMessage.toLowerCase();

        // Career guidance
        if (msg.includes('carreira') || msg.includes('profissional') || msg.includes('trabalho') || msg.includes('emprego')) {
            return `**Sobre orientação de carreira:**

A gestão de carreira é uma jornada contínua, não um destino. Aqui estão algumas reflexões:

1. **Autoconhecimento** - Quais são os teus valores e o que te motiva realmente?
2. **Mercado** - Onde estão as oportunidades alinhadas com as tuas competências?
3. **Ação** - Que pequeno passo podes dar esta semana?

Se quiseres uma análise mais profunda, posso ajudar-te a estruturar um plano. Qual é a tua situação atual?`;
        }

        // Training/Education
        if (msg.includes('formação') || msg.includes('curso') || msg.includes('estudar') || msg.includes('aprender') || msg.includes('certificação')) {
            return `**Sobre formação e desenvolvimento:**

A formação contínua é essencial, mas deve ser estratégica:

• **Identifica gaps** - Que competências te faltam para o próximo passo?
• **Prioriza** - Nem toda a formação tem o mesmo retorno
• **Aplica** - Conhecimento sem aplicação é desperdício

Que área específica estás a considerar desenvolver?`;
        }

        // CV
        if (msg.includes('cv') || msg.includes('currículo') || msg.includes('curriculo')) {
            return `**Sobre o teu CV:**

Um bom CV não lista tarefas - conta uma história de impacto.

Dicas rápidas:
• Usa verbos de ação e resultados quantificáveis
• Adapta a cada candidatura
• Mantém-no conciso (2 páginas máximo)

Para uma análise detalhada do teu CV, usa o nosso [CV Analyser](/pages/cv-analysis.html) - é gratuito!`;
        }

        // Transition
        if (msg.includes('transição') || msg.includes('mudar') || msg.includes('novo') || msg.includes('diferente')) {
            return `**Sobre transições de carreira:**

Mudar de carreira é normal e cada vez mais comum. O importante é:

1. **Clareza** - Estás a fugir de algo ou a ir em direção a algo?
2. **Transferência** - Que competências podes levar contigo?
3. **Paciência** - Transições levam tempo

Conta-me mais sobre a tua situação. Estás a pensar em mudar de área, de empresa, ou de função?`;
        }

        // Contact
        if (msg.includes('contacto') || msg.includes('contato') || msg.includes('email') || msg.includes('falar')) {
            return `**Contactos:**

📧 **Email:** samuel.rolo@share2inspire.pt
💼 **LinkedIn:** /in/samuelrolo
🌐 **Website:** share2inspire.pt

Para sessões de coaching personalizadas, envia-me uma mensagem no LinkedIn ou por email.`;
        }

        // Default - encourage conversation
        return `Obrigado pela tua mensagem!

Estou aqui para ajudar com questões de **carreira**, **formação**, **CV** ou **transições profissionais**.

Podes usar os botões rápidos acima ou simplesmente descrever a tua situação - quanto mais contexto me deres, melhor te posso ajudar.

**Qual é o teu maior desafio profissional neste momento?**`;
    }

    handleQuickAction(action) {
        const prompts = {
            carreira: 'Preciso de orientação sobre a minha carreira',
            formacao: 'Que formação me recomendas para evoluir profissionalmente?',
            cv: 'Gostaria de melhorar o meu CV',
            transicao: 'Estou a pensar em mudar de carreira'
        };

        const input = document.getElementById('coachChatInput');
        input.value = prompts[action] || '';
        input.focus();
    }

    renderMessage(message) {
        const messagesContainer = document.getElementById('coachChatMessages');
        
        const messageEl = document.createElement('div');
        messageEl.className = `coach-message ${message.type}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'coach-message-avatar';
        avatar.textContent = message.type === 'bot' ? 'SR' : 'Tu';
        
        const content = document.createElement('div');
        content.className = 'coach-message-content';
        content.innerHTML = this.formatMessage(message.content);
        
        messageEl.appendChild(avatar);
        messageEl.appendChild(content);
        
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    formatMessage(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/• /g, '&bull; ')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #BF9A33; text-decoration: underline;">$1</a>');
    }

    showTyping() {
        const messagesContainer = document.getElementById('coachChatMessages');
        
        const typingEl = document.createElement('div');
        typingEl.className = 'coach-message bot';
        typingEl.id = 'coachTyping';
        
        const avatar = document.createElement('div');
        avatar.className = 'coach-message-avatar';
        avatar.textContent = 'SR';
        
        const typing = document.createElement('div');
        typing.className = 'coach-typing';
        typing.innerHTML = '<span></span><span></span><span></span>';
        
        typingEl.appendChild(avatar);
        typingEl.appendChild(typing);
        
        messagesContainer.appendChild(typingEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTyping() {
        const typingEl = document.getElementById('coachTyping');
        if (typingEl) typingEl.remove();
    }

    async logConversation(userMsg, botMsg) {
        try {
            const logData = {
                session_id: this.sessionId,
                user_message: userMsg.content,
                bot_response: botMsg.content,
                timestamp: new Date().toISOString(),
                page_url: window.location.href
            };

            await fetch(`${this.supabaseUrl}/rest/v1/coach_conversations`, {
                method: 'POST',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(logData)
            });
        } catch (error) {
            // Silent fail - logging shouldn't break the chat
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.samuelRoloAI = new SamuelRoloAI();
    });
} else {
    window.samuelRoloAI = new SamuelRoloAI();
}

// Backwards compatibility
window.CoachAgent = SamuelRoloAI;
window.coachAgent = window.samuelRoloAI;
