/**
 * SHARE2INSPIRE - COACH AGENT
 * AI-powered coaching assistant with Supabase integration
 * 
 * Created: 2026-01-14
 * Purpose: Interactive chat widget for professional coaching
 */

class CoachAgent {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.supabaseUrl = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
        this.sessionId = this.generateSessionId();
        this.init();
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    init() {
        this.injectHTML();
        this.attachEventListeners();
        this.loadWelcomeMessage();
    }

    injectHTML() {
        const html = `
            <!-- Coach Agent Side Tab -->
            <div class="coach-agent-tab">
                <button class="coach-tab-button" id="coachTabButton">
                    <div class="coach-tab-pulse"></div>
                    <div class="coach-tab-icon">🤖</div>
                    <span>COACH AI</span>
                </button>
            </div>

            <!-- Coach Chat Widget -->
            <div class="coach-chat-widget" id="coachChatWidget">
                <!-- Header -->
                <div class="coach-chat-header">
                    <div class="coach-chat-header-info">
                        <div class="coach-avatar">S2I</div>
                        <div class="coach-header-text">
                            <h3>Coach AI</h3>
                            <p>Online • Sempre disponível</p>
                        </div>
                    </div>
                    <button class="coach-close-btn" id="coachCloseBtn">×</button>
                </div>

                <!-- Messages Area -->
                <div class="coach-chat-messages" id="coachChatMessages">
                    <!-- Messages will be inserted here -->
                </div>

                <!-- Input Area -->
                <div class="coach-chat-input-area">
                    <div class="coach-quick-actions" id="coachQuickActions">
                        <button class="coach-quick-action" data-action="servicos">📋 Serviços</button>
                        <button class="coach-quick-action" data-action="coaching">💼 Coaching</button>
                        <button class="coach-quick-action" data-action="cv">📄 Análise CV</button>
                        <button class="coach-quick-action" data-action="contacto">📧 Contacto</button>
                    </div>
                    <div class="coach-input-wrapper">
                        <input 
                            type="text" 
                            class="coach-chat-input" 
                            id="coachChatInput" 
                            placeholder="Escreva a sua mensagem..."
                            autocomplete="off"
                        />
                        <button class="coach-send-btn" id="coachSendBtn">
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
        const sendBtn = document.getElementById('coachSendBtn');
        const input = document.getElementById('coachChatInput');
        const quickActions = document.querySelectorAll('.coach-quick-action');

        tabButton.addEventListener('click', () => this.toggleWidget());
        closeBtn.addEventListener('click', () => this.closeWidget());
        sendBtn.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        quickActions.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    toggleWidget() {
        const widget = document.getElementById('coachChatWidget');
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            widget.classList.add('active');
            document.getElementById('coachChatInput').focus();
        } else {
            widget.classList.remove('active');
        }
    }

    closeWidget() {
        const widget = document.getElementById('coachChatWidget');
        widget.classList.remove('active');
        this.isOpen = false;
    }

    loadWelcomeMessage() {
        const welcomeMsg = {
            type: 'bot',
            content: `Olá! 👋 Sou o Coach AI da Share2Inspire.\n\nEstou aqui para ajudá-lo com:\n• Informações sobre serviços\n• Agendamento de sessões de coaching\n• Análise de CV\n• Qualquer dúvida sobre desenvolvimento profissional\n\nComo posso ajudá-lo hoje?`,
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

            // Log conversation to Supabase
            await this.logConversation(userMsg, botMsg);
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.hideTyping();
            
            const errorMsg = {
                type: 'bot',
                content: 'Desculpe, ocorreu um erro. Por favor, tente novamente ou contacte-nos diretamente em samuel.rolo@share2inspire.pt',
                timestamp: new Date()
            };
            
            this.renderMessage(errorMsg);
        }
    }

    async getAIResponse(userMessage) {
        // Check for common patterns and provide contextual responses
        const lowerMsg = userMessage.toLowerCase();

        // Serviços
        if (lowerMsg.includes('serviço') || lowerMsg.includes('servico') || lowerMsg.includes('oferta')) {
            return `Os nossos principais serviços incluem:\n\n📋 **Consultoria Organizacional**\n• Gestão da mudança\n• Transformação cultural\n• Desenvolvimento de liderança\n\n💼 **Coaching Executivo**\n• Coaching individual\n• Coaching de equipas\n• Desenvolvimento de carreira\n\n📊 **Diagnóstico Organizacional**\n• Avaliação de maturidade\n• Análise de cultura\n• Planos de ação\n\n📄 **Análise de CV**\n• Revisão profissional\n• Sugestões de melhoria\n• Relatório detalhado\n\nQuer saber mais sobre algum serviço específico?`;
        }

        // Coaching
        if (lowerMsg.includes('coaching') || lowerMsg.includes('sessão') || lowerMsg.includes('sessao')) {
            return `O nosso serviço de **Coaching Executivo** inclui:\n\n✨ **Sessões Individuais**\n• Duração: 60-90 minutos\n• Formato: Presencial ou online\n• Foco personalizado nos seus objetivos\n\n🎯 **Áreas de Foco**\n• Liderança e gestão\n• Transição de carreira\n• Desenvolvimento de competências\n• Equilíbrio vida-trabalho\n\n📅 **Como Funcionar**\n1. Sessão inicial de diagnóstico\n2. Definição de objetivos\n3. Plano de desenvolvimento\n4. Sessões de acompanhamento\n\nGostaria de agendar uma sessão exploratória gratuita?`;
        }

        // CV Analysis
        if (lowerMsg.includes('cv') || lowerMsg.includes('currículo') || lowerMsg.includes('curriculo') || lowerMsg.includes('análise')) {
            return `O nosso serviço de **Análise de CV** oferece:\n\n📄 **Análise Completa**\n• Revisão estrutural e de conteúdo\n• Avaliação de competências\n• Alinhamento com objetivos profissionais\n\n✅ **O que Recebe**\n• Relatório detalhado em PDF\n• Pontuação de qualidade (0-100)\n• Pontos fortes identificados\n• Sugestões de melhoria específicas\n• Recomendações de formação\n\n💰 **Investimento**\n• Análise básica: Gratuita (online)\n• Relatório completo PDF: 1€\n\nAceda à página de análise de CV para começar: [CV Analysis](/pages/cv-analysis.html)`;
        }

        // Contact
        if (lowerMsg.includes('contacto') || lowerMsg.includes('contato') || lowerMsg.includes('email') || lowerMsg.includes('telefone')) {
            return `📧 **Contactos Share2Inspire**\n\n**Samuel Rolo**\nConsultor & Coach Executivo\n\n📧 Email: samuel.rolo@share2inspire.pt\n🌐 Website: www.share2inspire.pt\n💼 LinkedIn: /in/samuelrolo\n\n**Horário de Atendimento**\nSegunda a Sexta: 9h00 - 18h00\n\nPrefere que o contactemos? Deixe o seu email e entraremos em contacto brevemente!`;
        }

        // Pricing
        if (lowerMsg.includes('preço') || lowerMsg.includes('preco') || lowerMsg.includes('valor') || lowerMsg.includes('custo')) {
            return `💰 **Investimento nos Serviços**\n\n**Coaching Executivo**\n• Sessão exploratória: Gratuita\n• Pacote 3 sessões: Sob consulta\n• Pacote 6 sessões: Sob consulta\n\n**Consultoria Organizacional**\n• Diagnóstico inicial: Sob consulta\n• Projetos customizados\n\n**Análise de CV**\n• Análise online: Gratuita\n• Relatório PDF completo: 1€\n\nPara um orçamento personalizado, contacte-nos em samuel.rolo@share2inspire.pt`;
        }

        // Default response - more intelligent
        return `Obrigado pela sua mensagem! 😊\n\nPara melhor o ajudar, pode:\n\n• Usar os botões rápidos acima para tópicos específicos\n• Perguntar sobre serviços, coaching, análise de CV ou contactos\n• Visitar o nosso website para mais informações\n\nOu se preferir, posso conectá-lo diretamente com o Samuel Rolo. Qual seria a melhor forma de o ajudar?`;
    }

    handleQuickAction(action) {
        const messages = {
            servicos: 'Gostaria de saber mais sobre os vossos serviços',
            coaching: 'Tenho interesse em sessões de coaching',
            cv: 'Quero fazer uma análise do meu CV',
            contacto: 'Como posso entrar em contacto?'
        };

        const input = document.getElementById('coachChatInput');
        input.value = messages[action];
        this.sendMessage();
    }

    renderMessage(message) {
        const messagesContainer = document.getElementById('coachChatMessages');
        
        const messageEl = document.createElement('div');
        messageEl.className = `coach-message ${message.type}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'coach-message-avatar';
        avatar.textContent = message.type === 'bot' ? 'AI' : 'U';
        
        const content = document.createElement('div');
        content.className = 'coach-message-content';
        content.innerHTML = this.formatMessage(message.content);
        
        messageEl.appendChild(avatar);
        messageEl.appendChild(content);
        
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    formatMessage(text) {
        // Convert markdown-style formatting to HTML
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/• /g, '• ')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color: #BF9A33; text-decoration: underline;">$1</a>');
    }

    showTyping() {
        const messagesContainer = document.getElementById('coachChatMessages');
        
        const typingEl = document.createElement('div');
        typingEl.className = 'coach-message bot';
        typingEl.id = 'coachTyping';
        
        const avatar = document.createElement('div');
        avatar.className = 'coach-message-avatar';
        avatar.textContent = 'AI';
        
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
        if (typingEl) {
            typingEl.remove();
        }
    }

    async logConversation(userMsg, botMsg) {
        try {
            const logData = {
                session_id: this.sessionId,
                user_message: userMsg.content,
                bot_response: botMsg.content,
                timestamp: new Date().toISOString(),
                page_url: window.location.href,
                user_agent: navigator.userAgent
            };

            const response = await fetch(`${this.supabaseUrl}/rest/v1/coach_conversations`, {
                method: 'POST',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(logData)
            });

            if (!response.ok) {
                console.warn('Failed to log conversation to Supabase');
            }
        } catch (error) {
            console.error('Error logging conversation:', error);
            // Don't throw - logging failure shouldn't break the chat
        }
    }
}

// Initialize Coach Agent when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.coachAgent = new CoachAgent();
    });
} else {
    window.coachAgent = new CoachAgent();
}
