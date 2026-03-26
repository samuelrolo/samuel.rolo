/**
 * Integração Brevo (Sendinblue) - Share2Inspire
 * Configurada para o backend Share2Inspire (App Engine)
 */

window.brevoIntegration = {
    // Endpoints do backend (Google Cloud Functions / App Engine)
    endpoints: {
        kickstart: 'https://share2inspire-beckend.lm.r.appspot.com/api/services/kickstart',
        consultoria: 'https://share2inspire-beckend.lm.r.appspot.com/api/services/consultoria',
        coaching: 'https://share2inspire-beckend.lm.r.appspot.com/api/services/coaching',
        workshops: 'https://share2inspire-beckend.lm.r.appspot.com/api/services/workshops',
        contact: 'https://share2inspire-beckend.lm.r.appspot.com/api/contact'
    },

    /**
     * Enviar email para Kickstart
     */
    async sendKickstartEmail(data) {
        console.log('📧 Enviando email Kickstart via Brevo...');

        const emailData = {
            to: [
                { email: data.email, name: data.name },
                { email: 'geral@share2inspire.pt', name: 'Samuel Rolo' }
            ],
            subject: `Kickstart - Nova Inscrição de ${data.name}`,
            templateId: 1, // Template ID do Brevo para Kickstart
            params: {
                name: data.name,
                email: data.email,
                phone: data.phone || 'Não fornecido',
                company: data.company || 'Individual',
                position: data.position || 'Não especificado',
                date: data.date,
                duration: data.duration || '60 min',
                challenge: data.challenge || 'Não especificado',
                payment_method: data.payment_method,
                service: 'Sessão Kickstart',
                timestamp: new Date().toLocaleString('pt-PT')
            }
        };

        return await this.sendEmailViaBackend('kickstart', emailData);
    },

    /**
     * Enviar email para Consultoria
     */
    async sendConsultancyEmail(data) {
        console.log('📧 Enviando email Consultoria via Brevo...');

        const emailData = {
            to: [
                { email: data.email, name: data.name },
                { email: 'geral@share2inspire.pt', name: 'Samuel Rolo' }
            ],
            subject: `Consultoria - Pedido de ${data.name}`,
            templateId: 2, // Template ID do Brevo para Consultoria
            params: {
                name: data.name,
                email: data.email,
                phone: data.phone || 'Não fornecido',
                company: data.company || 'Não especificado',
                position: data.position || 'Não especificado',
                size: data.size || 'Não especificado',
                project: data.project || 'Geral',
                objectives: data.objectives || 'A definir',
                payment_method: data.payment_method,
                service: 'Consultoria Estratégica',
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
                { email: 'geral@share2inspire.pt', name: 'Samuel Rolo' }
            ],
            subject: `Coaching - Inscrição de ${data.name}`,
            templateId: 3, // Template ID do Brevo para Coaching
            params: {
                name: data.name,
                email: data.email,
                phone: data.phone || 'Não fornecido',
                experience: data.experience || 'Não especificado',
                goals: data.goals,
                challenges: data.challenges || 'Não especificado',
                availability: data.availability || 'A definir',
                payment_method: data.payment_method,
                service: 'Coaching Individual',
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
                { email: 'geral@share2inspire.pt', name: 'Samuel Rolo' }
            ],
            subject: `Workshop - Inscrição de ${data.name}`,
            templateId: 4, // Template ID do Brevo para Workshops
            params: {
                name: data.name,
                email: data.email,
                phone: data.phone || 'Não fornecido',
                company: data.company || 'Individual',
                workshop_type: data.workshop_type,
                participants: data.participants || '1',
                date_preference: data.date_preference || 'A definir',
                payment_method: data.payment_method,
                service: 'Workshop Especializado',
                timestamp: new Date().toLocaleString('pt-PT')
            }
        };

        return await this.sendEmailViaBackend('workshops', emailData);
    },

    /**
     * Enviar email de contacto geral
     */
    async sendContactEmail(data) {
        console.log('📧 Enviando email de contacto via Brevo...');

        const emailData = {
            to: [
                { email: data.email, name: data.name },
                { email: 'geral@share2inspire.pt', name: 'Samuel Rolo' }
            ],
            subject: `Contacto - ${data.subject || 'Pedido de Informações'}`,
            templateId: 5, // Template ID do Brevo para Contacto
            params: {
                name: data.name,
                email: data.email,
                phone: data.phone || 'Não fornecido',
                subject: data.subject || 'Contacto Geral',
                message: data.message || 'Sem mensagem específica',
                service: 'Contacto Geral',
                timestamp: new Date().toLocaleString('pt-PT')
            }
        };

        return await this.sendEmailViaBackend('contact', emailData);
    },

    /**
     * Função principal para enviar emails via backend
     */
    async sendEmailViaBackend(serviceType, emailData) {
        try {
            console.log(`📤 Enviando para ${this.endpoints[serviceType]}...`);

            const response = await fetch(this.endpoints[serviceType], {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    customerName: emailData.to[0].name,
                    customerEmail: emailData.to[0].email,
                    customerPhone: emailData.params.phone,
                    appointmentDate: emailData.params.date || new Date().toISOString().split('T')[0],
                    appointmentTime: emailData.params.time || '10:00',
                    orderId: `${serviceType}_${Date.now()}`,
                    amount: emailData.params.amount || 0,
                    description: emailData.subject,
                    ...emailData.params
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                console.log('✅ Email enviado com sucesso via backend!');
                return {
                    success: true,
                    message: result.message || 'Email enviado com sucesso!',
                    orderId: result.orderId
                };
            } else {
                throw new Error(result.error || 'Erro desconhecido do backend');
            }

        } catch (error) {
            console.error('❌ Erro ao enviar email:', error);

            // Fallback: mostrar mensagem de erro amigável
            return {
                success: false,
                message: `Erro ao enviar email: ${error.message}. Tente novamente ou contacte-nos diretamente.`,
                error: error.message
            };
        }
    },

    /**
     * Função auxiliar para formatar dados de email
     */
    formatEmailData(rawData, serviceType) {
        const baseData = {
            name: rawData.name || rawData.customerName,
            email: rawData.email || rawData.customerEmail,
            phone: rawData.phone || rawData.customerPhone,
            timestamp: new Date().toLocaleString('pt-PT')
        };

        // Adicionar campos específicos por serviço
        switch (serviceType) {
            case 'kickstart':
                return {
                    ...baseData,
                    company: rawData.company,
                    position: rawData.position,
                    date: rawData.date,
                    duration: rawData.duration,
                    challenge: rawData.challenge,
                    payment_method: rawData.payment_method
                };

            case 'consultoria':
                return {
                    ...baseData,
                    company: rawData.company,
                    position: rawData.position,
                    size: rawData.size,
                    project: rawData.project,
                    objectives: rawData.objectives,
                    payment_method: rawData.payment_method
                };

            case 'coaching':
                return {
                    ...baseData,
                    experience: rawData.experience,
                    goals: rawData.goals,
                    challenges: rawData.challenges,
                    availability: rawData.availability,
                    payment_method: rawData.payment_method
                };

            case 'workshops':
                return {
                    ...baseData,
                    company: rawData.company,
                    workshop_type: rawData.workshop_type,
                    participants: rawData.participants,
                    date_preference: rawData.date_preference,
                    payment_method: rawData.payment_method
                };

            default:
                return baseData;
        }
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
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Brevo Integration - Versão Multi-Serviços Carregada');
    console.log('📧 Serviços suportados: Kickstart, Consultoria, Coaching, Workshops');
    console.log('🔗 Backend URL:', 'https://share2inspire-beckend.lm.r.appspot.com');
    console.log('📧 E-mail de contacto: geral@share2inspire.pt');
});

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.brevoIntegration;
}
