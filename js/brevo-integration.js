/**
 * Integração Brevo - Share2Inspire
 * VERSÃO CORRIGIDA COM MÚLTIPLOS SERVIÇOS - Junho 2025
 * Suporte para: Kickstart Pro, Consultoria, Coaching, Workshops
 */

window.brevoIntegration = {
    // URLs corrigidas do backend
    endpoints: {
        kickstart: 'https://share2inspire-backend.onrender.com/email/kickstart',
        consultoria: 'https://share2inspire-backend.onrender.com/email/consultoria',
        coaching: 'https://share2inspire-backend.onrender.com/email/coaching',
        workshops: 'https://share2inspire-backend.onrender.com/email/workshops',
        contact: 'https://share2inspire-backend.onrender.com/email/contact'
    },
    
    /**
     * Enviar email para Kickstart Pro
     */
    async sendKickstartEmail(data) {
        console.log('📧 Enviando email Kickstart Pro via Brevo...');
        
        const emailData = {
            to: [
                { email: data.email, name: data.name },
                { email: 'samuel@share2inspire.pt', name: 'Samuel Rolo' }
            ],
            subject: `Kickstart Pro - Marcação de ${data.name}`,
            templateId: 1, // Template ID do Brevo para Kickstart
            params: {
                name: data.name,
                email: data.email,
                phone: data.phone || 'Não fornecido',
                company: data.company || 'Não fornecido',
                position: data.position || 'Não fornecido',
                date: data.date,
                duration: data.duration,
                challenge: data.challenge,
                payment_method: data.payment_method,
                service: 'Kickstart Pro',
                timestamp: new Date().toLocaleString('pt-PT')
            }
        };
        
        return await this.sendEmailViaBackend('kickstart', emailData);
    },
    
    /**
     * Enviar email para Consultoria
     */
    async sendConsultoriaEmail(data) {
        console.log('📧 Enviando email Consultoria via Brevo...');
        
        const emailData = {
            to: [
                { email: data.email, name: data.name },
                { email: 'samuel@share2inspire.pt', name: 'Samuel Rolo' }
            ],
            subject: `Consultoria Organizacional - Proposta para ${data.company}`,
            templateId: 2, // Template ID do Brevo para Consultoria
            params: {
                name: data.name,
                email: data.email,
                phone: data.phone || 'Não fornecido',
                company: data.company,
                position: data.position || 'Não fornecido',
                size: data.size || 'Não especificado',
                project: data.project,
                objectives: data.objectives || 'Não especificado',
                payment_method: data.payment_method || 'Proposta sem pagamento',
                service: 'Consultoria Organizacional',
                timestamp: new Date().toLocaleString('pt-PT')
            }
        };
        
        return await this.sendEmailViaBackend('consultoria', emailData);
    },
    
    /**
     * Enviar email para Coaching
     */
    async sendCoachingEmail(data) {
        console.log('📧 Enviando email Coaching via Brevo...');
        
        const emailData = {
            to: [
                { email: data.email, name: data.name },
                { email: 'samuel@share2inspire.pt', name: 'Samuel Rolo' }
            ],
            subject: `Coaching Executivo - Agendamento de ${data.name}`,
            templateId: 3, // Template ID do Brevo para Coaching
            params: {
                name: data.name,
                email: data.email,
                phone: data.phone || 'Não fornecido',
                company: data.company || 'Não fornecido',
                position: data.position || 'Não fornecido',
                experience: data.experience || 'Não especificado',
                goals: data.goals,
                challenges: data.challenges || 'Não especificado',
                availability: data.availability || 'Flexível',
                payment_method: data.payment_method || 'Sessão inicial gratuita',
                service: 'Coaching Executivo',
                timestamp: new Date().toLocaleString('pt-PT')
            }
        };
        
        return await this.sendEmailViaBackend('coaching', emailData);
    },
    
    /**
     * Enviar email para Workshops
     */
    async sendWorkshopsEmail(data) {
        console.log('📧 Enviando email Workshops via Brevo...');
        
        const emailData = {
            to: [
                { email: data.email, name: data.name },
                { email: 'samuel@share2inspire.pt', name: 'Samuel Rolo' }
            ],
            subject: `Workshop - Solicitação de ${data.theme}`,
            templateId: 4, // Template ID do Brevo para Workshops
            params: {
                name: data.name,
                email: data.email,
                phone: data.phone || 'Não fornecido',
                company: data.company || 'Não fornecido',
                position: data.position || 'Não fornecido',
                participants: data.participants || 'Não especificado',
                format: data.format || 'Não especificado',
                duration: data.duration || 'Não especificado',
                theme: data.theme,
                objectives: data.objectives,
                timeline: data.timeline || 'Flexível',
                payment_method: data.payment_method || 'Proposta sem pagamento',
                service: 'Workshops e Formações',
                timestamp: new Date().toLocaleString('pt-PT')
            }
        };
        
        return await this.sendEmailViaBackend('workshops', emailData);
    },
    
    /**
     * Enviar email genérico de contacto
     */
    async sendContactEmail(data) {
        console.log('📧 Enviando email de contacto via Brevo...');
        
        const emailData = {
            to: [
                { email: 'samuel@share2inspire.pt', name: 'Samuel Rolo' }
            ],
            replyTo: { email: data.email, name: data.name },
            subject: `Contacto do site - ${data.subject || 'Sem assunto'}`,
            templateId: 5, // Template ID do Brevo para contacto
            params: {
                name: data.name,
                email: data.email,
                phone: data.phone || 'Não fornecido',
                subject: data.subject || 'Contacto geral',
                message: data.message,
                timestamp: new Date().toLocaleString('pt-PT')
            }
        };
        
        return await this.sendEmailViaBackend('contact', emailData);
    },
    
    /**
     * Enviar email via backend (proxy para Brevo)
     */
    async sendEmailViaBackend(type, emailData) {
        try {
            const endpoint = this.endpoints[type];
            if (!endpoint) {
                throw new Error(`Tipo de email não suportado: ${type}`);
            }
            
            console.log(`📤 Enviando para ${endpoint}:`, emailData);
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailData),
                timeout: 10000 // 10 segundos timeout
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Email enviado com sucesso:', result);
                return {
                    success: true,
                    message: 'Email enviado com sucesso',
                    data: result
                };
            } else {
                throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
            }
            
        } catch (error) {
            console.error(`❌ Erro ao enviar email ${type}:`, error);
            
            // Fallback: tentar endpoint genérico
            try {
                console.log('🔄 Tentando fallback...');
                return await this.sendFallbackEmail(emailData);
            } catch (fallbackError) {
                console.error('❌ Fallback também falhou:', fallbackError);
                return {
                    success: false,
                    message: `Erro no envio de email: ${error.message}`
                };
            }
        }
    },
    
    /**
     * Fallback para envio de email
     */
    async sendFallbackEmail(emailData) {
        const fallbackEndpoint = 'https://share2inspire-backend.onrender.com/contact';
        
        // Converter dados para formato simples
        const fallbackData = {
            name: emailData.params?.name || 'Cliente',
            email: emailData.to?.[0]?.email || 'cliente@exemplo.com',
            subject: emailData.subject || 'Contacto do site',
            message: this.formatEmailParams(emailData.params),
            service: emailData.params?.service || 'Contacto geral'
        };
        
        const response = await fetch(fallbackEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(fallbackData)
        });
        
        if (response.ok) {
            return {
                success: true,
                message: 'Email enviado via fallback',
                data: await response.json()
            };
        } else {
            throw new Error(`Fallback falhou: ${response.status}`);
        }
    },
    
    /**
     * Formatar parâmetros do email para fallback
     */
    formatEmailParams(params) {
        if (!params) return 'Dados não disponíveis';
        
        let message = '';
        for (const [key, value] of Object.entries(params)) {
            if (value && value !== 'Não fornecido' && value !== 'Não especificado') {
                const label = this.getFieldLabel(key);
                message += `${label}: ${value}\n`;
            }
        }
        
        return message || 'Contacto sem detalhes específicos';
    },
    
    /**
     * Obter label amigável para campos
     */
    getFieldLabel(key) {
        const labels = {
            name: 'Nome',
            email: 'Email',
            phone: 'Telefone',
            company: 'Empresa',
            position: 'Cargo',
            date: 'Data',
            duration: 'Duração',
            challenge: 'Desafio',
            project: 'Projeto',
            objectives: 'Objetivos',
            goals: 'Objetivos',
            challenges: 'Desafios',
            theme: 'Tema',
            participants: 'Participantes',
            format: 'Formato',
            timeline: 'Timeline',
            payment_method: 'Método de Pagamento',
            service: 'Serviço',
            timestamp: 'Data/Hora'
        };
        
        return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
    },
    
    /**
     * Validar dados de email
     */
    validateEmailData(data) {
        if (!data.email || !this.isValidEmail(data.email)) {
            throw new Error('Email inválido ou em falta');
        }
        
        if (!data.name || data.name.trim().length < 2) {
            throw new Error('Nome inválido ou em falta');
        }
        
        return true;
    },
    
    /**
     * Validar formato de email
     */
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Brevo Integration - Versão Multi-Serviços Carregada');
    console.log('📧 Serviços suportados: Kickstart, Consultoria, Coaching, Workshops');
    console.log('🔗 Backend URL:', 'https://share2inspire-backend.onrender.com');
});

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.brevoIntegration;
}

