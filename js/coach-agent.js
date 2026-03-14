/**
 * SHARE2INSPIRE - SAMUEL ROLO AI
 * Career Coach Assistant with Gemini Integration
 * 
 * Created: 2026-01-14
 * Updated: 2026-01-23 - Real Conversation Logic + Gemini Integration
 * Purpose: Discrete floating widget for career guidance and professional development
 */

class SamuelRoloAI {
    constructor() {
        this.isOpen = false;
        this.isExpanded = false;
        this.isMaximized = false;
        this.messages = [];
        this.supabaseUrl = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
        this.edgeFunctionUrl = `${this.supabaseUrl}/functions/v1/hyper-task`;
        this.sessionId = this.generateSessionId();
        this.conversationContext = [];
        // Detect language from HTML lang attribute
        this.lang = document.documentElement.lang?.startsWith('en') ? 'en' : 'pt';
        this.init();
    }

    generateSessionId() {
        return 'sr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    init() {
        this.injectHTML();
        this.attachEventListeners();
        this.addWelcomeMessage();
    }

    injectHTML() {
        // Prevent duplicate injection
        if (document.getElementById('coachAgentTab')) return;
        
        const html = `
            <!-- Samuel Rolo AI - Side Tab -->
            <div class="career-side-widget" id="coachAgentTab">
                <div class="career-side-tab" id="coachTabButton" role="button" aria-label="${this.lang === 'en' ? 'Open career assistant' : 'Abrir assistente de carreira'}">
                    <span class="icon">🤖</span>
                    <span class="text">Career Adviser</span>
                </div>
            </div>

            <!-- Samuel Rolo AI - Chat Widget -->
            <div class="coach-chat-widget" id="coachChatWidget" role="dialog" aria-label="${this.lang === 'en' ? 'Career Assistant' : 'Assistente de Carreira'}">
                <!-- Header -->
                <div class="coach-chat-header">
                    <div class="coach-chat-header-info">
                        <div class="coach-avatar">SR</div>
                        <div class="coach-header-text">
                            <h3>Samuel Rolo AI</h3>
                            <p>${this.lang === 'en' ? 'Available to help' : 'Disponível para ajudar'}</p>
                        </div>
                    </div>
                    <div class="coach-header-actions">
                        <button class="coach-maximize-btn" id="coachMaximizeBtn" aria-label="Maximizar">⤢</button>
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
                        <button class="coach-quick-action" data-action="carreira">🎯 ${this.lang === 'en' ? 'Career' : 'Carreira'}</button>
                        <button class="coach-quick-action" data-action="formacao">📚 ${this.lang === 'en' ? 'Training' : 'Formação'}</button>
                        <button class="coach-quick-action" data-action="cv">📄 CV</button>
                        <button class="coach-quick-action" data-action="transicao">🔄 ${this.lang === 'en' ? 'Transition' : 'Transição'}</button>
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
        const maximizeBtn = document.getElementById('coachMaximizeBtn');
        const sendBtn = document.getElementById('coachSendBtn');
        const input = document.getElementById('coachChatInput');
        const quickActions = document.querySelectorAll('.coach-quick-action');

        tabButton.addEventListener('click', () => this.toggleWidget());
        closeBtn.addEventListener('click', () => this.closeWidget());
        maximizeBtn.addEventListener('click', () => this.toggleMaximize());
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
        this.isOpen ? this.closeWidget() : this.openWidget();
    }

    openWidget() {
        const widget = document.getElementById('coachChatWidget');
        this.isOpen = true;
        widget.classList.add('active');
        document.getElementById('coachChatInput').focus();
    }

    closeWidget() {
        const widget = document.getElementById('coachChatWidget');
        this.isOpen = false;
        widget.classList.remove('active');
    }

    toggleMaximize() {
        this.isMaximized = !this.isMaximized;
        const widget = document.getElementById('coachChatWidget');
        widget.classList.toggle('maximized', this.isMaximized);
        
        // Ajustar o ícone do botão
        const maximizeBtn = document.getElementById('coachMaximizeBtn');
        maximizeBtn.innerHTML = this.isMaximized ? '⤡' : '⤢';
    }

    addWelcomeMessage() {
        const content = this.lang === 'en'
            ? `Hi! I'm **Samuel Rolo AI**, your career assistant.

I can help you with:
• Career guidance and professional decisions
• Training and development questions
• CV analysis and improvement
• Career transitions

How can I help you today?`
            : `Olá! Sou o **Samuel Rolo AI**, o teu assistente de carreira.

Posso ajudar-te com:
• Orientação de carreira e decisões profissionais
• Dúvidas sobre formação e desenvolvimento
• Análise e melhoria de CV
• Transições de carreira

Como posso ajudar-te hoje?`;
        const welcomeMsg = {
            type: 'bot',
            content: content,
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
                content: this.lang === 'en' ? 'Sorry, a temporary error occurred. Please try again or contact me directly at **samuel.rolo@share2inspire.pt**' : 'Peço desculpa, ocorreu um erro temporário. Por favor, tenta novamente ou contacta-me diretamente em **samuel.rolo@share2inspire.pt**',
                timestamp: new Date()
            };
            
            this.renderMessage(errorMsg);
        }
    }

    async getAIResponse(userMessage) {
        // Try Gemini first via Supabase Edge Function
        try {
            console.log('[SamuelRoloAI] 🔄 Calling Gemini via Edge Function...');
            
            const response = await fetch(this.edgeFunctionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.supabaseKey}`
                },
                body: JSON.stringify({
                    message: userMessage,
                    mode: 'career_coach',
                    history: this.conversationContext.slice(-6) // Últimas 6 mensagens
                })
            });

            console.log('[SamuelRoloAI] Edge Function response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('[SamuelRoloAI] Response data:', data);
                
                if (data.success && data.reply) {
                    console.log('[SamuelRoloAI] ✅ Gemini response received successfully');
                    return data.reply;
                }
            } else {
                console.warn('[SamuelRoloAI] ⚠️ Edge Function returned status:', response.status);
                const errorData = await response.json().catch(() => ({}));
                console.warn('[SamuelRoloAI] Error data:', errorData);
            }
            
            console.warn('[SamuelRoloAI] ⚠️ Gemini unavailable, using intelligent fallback');
        } catch (error) {
            console.warn('[SamuelRoloAI] ⚠️ Edge Function error:', error.message);
        }

        // Intelligent fallback - contextual and empathetic
        return this.getContextualResponse(userMessage);
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

    getContextualResponse(userMessage) {
        const msg = userMessage.toLowerCase();

        // Detect emotion/urgency
        const isUrgent = msg.includes('urgente') || msg.includes('rápido') || msg.includes('agora');
        const isEmotional = msg.includes('medo') || msg.includes('ansiedade') || msg.includes('frustração') || msg.includes('dúvida');
        const isNegative = msg.includes('não sei') || msg.includes('não consigo') || msg.includes('impossível') || msg.includes('falhar');

        // Emotional support first
        if (isEmotional || isNegative) {
            return `Entendo a tua preocupação. Isto que sentes é normal quando estamos numa encruzilhada profissional.

Deixa-me ser direto: **o medo de falhar é o primeiro sinal de que estás a crescer**. Significa que estás a considerar algo que realmente importa.

Agora, vamos focar no que é controlável:
1. **O que exatamente te preocupa?** (a mudança em si, as competências, a rejeição?)
2. **Qual é o teu maior ativo neste momento?** (experiência, rede, conhecimento?)
3. **Qual é um pequeno passo que podes dar esta semana?**

Conta-me mais. Quanto mais contexto me deres, melhor posso ajudar.`;
        }

        // Career guidance
        if (msg.includes('carreira') || msg.includes('profissional') || msg.includes('trabalho') || msg.includes('emprego') || msg.includes('procurar')) {
            return `A tua carreira não é um destino - é uma série de decisões conscientes.

Aqui está o que funciona:
• **Clareza** - Sabe exatamente o que queres (não apenas o que não queres)
• **Ação** - Networking, candidaturas, visibilidade. Nada acontece sozinho
• **Paciência estratégica** - Às vezes o timing é tudo

Qual é a tua situação atual? Estás:
- A procurar o primeiro emprego?
- A mudar de área?
- A evoluir na tua área?
- A sair de uma situação difícil?

Diz-me e estruturamos um plano.`;
        }

        // Training/Education
        if (msg.includes('formação') || msg.includes('curso') || msg.includes('estudar') || msg.includes('aprender') || msg.includes('certificação') || msg.includes('ia')) {
            return `A formação é investimento, não gasto. Mas tem de ser **estratégica**.

Antes de fazeres qualquer curso, pergunta-te:
1. **Por quê?** - Qual é o problema que isto resolve?
2. **Para quem?** - Quem contrata pessoas com esta competência?
3. **Quanto tempo?** - Vale a pena o investimento de tempo?

Neste momento, a IA é o grande diferenciador. Mas não é sobre aprender IA - é sobre aprender a **usar IA para fazer melhor o que já fazes**.

Que área específica estás a considerar?`;
        }

        // CV
        if (msg.includes('cv') || msg.includes('currículo') || msg.includes('curriculo')) {
            return `O teu CV é a tua primeira impressão. E sabemos que a primeira impressão é tudo.

Um CV fraco mata oportunidades antes de começarem. Um CV forte abre portas.

**O teste dos 6 segundos:**
Um recrutador exausto tem 6 segundos para decidir se te lê ou não. O teu CV passa neste teste?

Dicas rápidas:
• **Headline forte** - Não "Engenheiro de Software", mas "Engenheiro de Software | Especialista em Cloud | 5 anos de experiência"
• **Resultados, não tarefas** - Não "Responsável por...", mas "Aumentei X em Y%"
• **Adaptação** - Cada CV deve ser feito para a vaga específica

Para uma análise profunda e detalhada, usa o nosso [CV Analyser](/cv-analyser) - é gratuito e usa IA para te dar feedback real.`;
        }

        // Transition
        if (msg.includes('transição') || msg.includes('mudar') || msg.includes('novo') || msg.includes('diferente') || msg.includes('mudança')) {
            return `Mudar de carreira é cada vez mais comum. E é possível. Mas requer estratégia.

**Primeiro, diagnóstico:**
1. **Estás a fugir de algo ou a ir em direção a algo?**
   - Se é fuga, o problema vai-te seguir
   - Se é atração, tens energia para a mudança

2. **Que competências podes transferir?**
   - Raramente começamos do zero
   - Identifica o que já sabes fazer bem

3. **Qual é o teu plano de transição?**
   - Mudança radical? Gradual? Formação primeiro?

A maioria das transições falha não porque a pessoa não consegue, mas porque não tem um plano claro.

Qual é a tua situação? De onde para onde queres ir?`;
        }

        // Contact/Direct
        if (msg.includes('contacto') || msg.includes('contato') || msg.includes('email') || msg.includes('falar') || msg.includes('linkedin') || msg.includes('sessão') || msg.includes('coaching')) {
            return `Claro! Aqui estão as minhas formas de contacto:

📧 **Email:** samuel.rolo@share2inspire.pt
💼 **LinkedIn:** /in/samuelrolo
🌐 **Website:** share2inspire.pt

Para **sessões de coaching personalizadas** (mais profundas e estruturadas), envia-me uma mensagem no LinkedIn ou por email. Fazemos uma chamada de diagnóstico e estruturamos um plano à tua medida.

Mas lembra-te: **a maioria das respostas que procuras já estão dentro de ti**. Às vezes só precisas de alguém para te ajudar a vê-las.`;
        }

        // Default - encourage deeper conversation
        return `Obrigado pela tua mensagem!

Estou aqui para ajudar com questões de **carreira**, **formação**, **CV** ou **transições profissionais**.

Para que eu possa dar-te a melhor resposta, preciso de mais contexto:
- **Qual é a tua situação atual?** (empregado, desempregado, em transição?)
- **Qual é o teu maior desafio neste momento?**
- **O que já tentaste fazer para resolver isto?**

Quanto mais me contares, melhor posso ajudar. 🎯`;
    }

    handleQuickAction(action) {
        const prompts = this.lang === 'en' ? {
            carreira: 'I need guidance about my career',
            formacao: 'What training do you recommend for professional growth?',
            cv: 'I would like to improve my CV',
            transicao: 'I am thinking about changing careers'
        } : {
            carreira: 'Preciso de orientação sobre a minha carreira',
            formacao: 'Que formação me recomendas para evoluir profissionalmente?',
            cv: 'Gostaria de melhorar o meu CV',
            transicao: 'Estou a pensar em mudar de carreira'
        };

        const input = document.getElementById('coachChatInput');
        input.value = prompts[action] || '';
        input.focus();
        this.sendMessage();
    }

    renderMessage(message) {
        const messagesContainer = document.getElementById('coachChatMessages');
        const messageEl = document.createElement('div');
        messageEl.className = `coach-message coach-message-${message.type}`;
        
        // Convert markdown to basic HTML
        let content = message.content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');

        messageEl.innerHTML = `
            <div class="coach-message-content">
                ${content}
            </div>
        `;
        
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTyping() {
        const messagesContainer = document.getElementById('coachChatMessages');
        const typingEl = document.createElement('div');
        typingEl.className = 'coach-message coach-message-typing';
        typingEl.id = 'coachTyping';
        typingEl.innerHTML = `
            <div class="coach-message-content">
                <div class="coach-typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        messagesContainer.appendChild(typingEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTyping() {
        const typingEl = document.getElementById('coachTyping');
        if (typingEl) typingEl.remove();
    }

    logConversation(userMsg, botMsg) {
        console.log('[SamuelRoloAI] Conversation logged:', {
            sessionId: this.sessionId,
            user: userMsg.content,
            bot: botMsg.content,
            timestamp: new Date().toISOString()
        });
    }
}

// Initialize on page load (with guard to prevent duplicate instances)
document.addEventListener('DOMContentLoaded', () => {
    if (!window._samuelRoloAIInitialized) {
        window._samuelRoloAIInitialized = true;
        window.samuelRoloAI = new SamuelRoloAI();
    }
});
