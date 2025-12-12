/**
 * Integração Brevo - Share2Inspire
 * VERSÃO CORRIGIDA COM MÚLTIPLOS SERVIÇOS - Julho 2025
 * Suporte para: Kickstart Pro, Consultoria, Coaching, Workshops
 * URLs CORRIGIDAS para funcionar com os novos blueprints
 * E-MAIL CORRIGIDO: srshare2inspire@gmail.com
 * CORREÇÃO: Campos name/email em vez de customerName/customerEmail
 */

window.brevoIntegration = {
    // URLs corrigidas do backend
    endpoints: {
        kickstart: 'https://share2inspire-beckend.lm.r.appspot.com/api/services/kickstart-email', // Corrigido para coincidir com services.py
        consultoria: 'https://share2inspire-beckend.lm.r.appspot.com/api/email/consultoria', // AVISO: Não encontrado no backend
        coaching: 'https://share2inspire-beckend.lm.r.appspot.com/api/email/coaching', // AVISO: Não encontrado no backend
        workshops: 'https://share2inspire-beckend.lm.r.appspot.com/api/email/workshops', // AVISO: Não encontrado no backend
        contact: 'https://share2inspire-beckend.lm.r.appspot.com/api/feedback/contact', // Corrigido para coincidir com feedback.py
        cv_review: 'https://share2inspire-beckend.lm.r.appspot.com/api/services/cv-review' // Adicionado explícito
    },

    /**
     * Enviar email para Kickstart Pro
     */
    async sendKickstartEmail(data) {
        console.log('📧 Enviando email Kickstart Pro via Brevo...');

        const emailData = {
            to: [
                { email: data.email, name: data.name },
                { email: 'srshare2inspire@gmail.com', name: 'Samuel Rolo' }
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
                { email: 'srshare2inspire@gmail.com', name: 'Samuel Rolo' }
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
                { email: 'srshare2inspire@gmail.com', name: 'Samuel Rolo' }
            ],
            subject: `Coaching Individual - Sessão para ${data.name}`,
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
                { email: 'srshare2inspire@gmail.com', name: 'Samuel Rolo' }
            ],
            subject: `Workshop - Inscrição de ${data.name}`,
            templateId: 4,
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
     * Enviar email para Revisão de CV
     */
    async sendCvReviewEmail(data) {
        console.log('📧 Enviando email CV Review via Brevo...');

        // CORREÇÃO: Usar um objeto que suporte envio de ficheiros
        // Como o backend (routes/services.py) provavelmente espera multipart/form-data
        // precisamos de ajustar a forma como enviamos.

        // Chamada especial para endpoints com upload
        return await this.sendEmailWithAttachment('cv-review', data);
    },

    /**
     * Enviar email de contacto geral
     */
    async sendContactEmail(data) {
        console.log('📧 Enviando email de contacto via Brevo...');

        const emailData = {
            to: [
                { email: data.email, name: data.name },
                { email: 'srshare2inspire@gmail.com', name: 'Samuel Rolo' }
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
     * CORREÇÃO: Usar name/email em vez de customerName/customerEmail
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
                    // CORREÇÃO: Usar name/email em vez de customerName/customerEmail
                    name: emailData.to[0].name,
                    email: emailData.to[0].email,
                    phone: emailData.params.phone,
                    date: emailData.params.date || new Date().toISOString().split('T')[0],
                    time: emailData.params.time || '10:00',
                    orderId: `${serviceType}_${Date.now()}`,
                    amount: emailData.params.amount || 0,
                    message: emailData.subject,
                    ...emailData.params
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Erro HTTP:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('✅ Resposta do backend:', result);

            if (result.success || result.status === 'success') {
                console.log('✅ Email enviado com sucesso via backend!');
                return {
                    success: true,
                    message: result.message || 'Email enviado com sucesso!',
                    orderId: result.orderId
                };
            } else {
                throw new Error(result.error || 'O backend não retornou sucesso explícito.');
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
     * Enviar email com anexos (Multipart/Form-Data)
     */
    async sendEmailWithAttachment(serviceType, data) {
        try {
            console.log(`📤 Enviando (multipart) para ${this.endpoints['kickstart'].replace('kickstart', serviceType)}...`); // Hack para URL se não existir endpoint especifico

            // Construir FormData
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('email', data.email);
            formData.append('phone', data.phone || '');
            formData.append('linkedin', data.linkedin || '');
            formData.append('goals', data.goals || '');
            formData.append('service', 'Revisão de CV');
            formData.append('orderId', `cv_${Date.now()}`);

            if (data.file) {
                formData.append('file', data.file);
            }

            // Endpoint específico para CV (ajustar conforme necessário)
            // Se o serviço não existir no objeto endpoints, tentar construir
            const url = this.endpoints[serviceType] || 'https://share2inspire-beckend.lm.r.appspot.com/api/email/cv-review';

            const response = await fetch(url, {
                method: 'POST',
                body: formData
                // NÃO definir Content-Type, o browser define automaticamente com boundary
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            return {
                success: true,
                message: result.message || 'Email enviado com sucesso!',
                orderId: result.orderId
            };

        } catch (error) {
            console.error('❌ Erro ao enviar email com anexo:', error);
            return {
                success: false,
                message: error.message,
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
    console.log('🚀 Brevo Integration - Versão Multi-Serviços Corrigida Carregada');
    console.log('📧 Serviços suportados: Kickstart, Consultoria, Coaching, Workshops');
    console.log('🔗 Backend URL:', 'https://share2inspire-beckend.lm.r.appspot.com');
    console.log('📧 E-mail de contacto: srshare2inspire@gmail.com');
    console.log('✅ CORREÇÃO: Usando name/email em vez de customerName/customerEmail');
});

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.brevoIntegration;
}

