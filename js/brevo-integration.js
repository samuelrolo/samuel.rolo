/**
 * Integração com a API da Brevo para envio de emails
 * 
 * Este módulo fornece funções para integração com a API de emails da Brevo,
 * permitindo enviar emails de confirmação de reserva e contacto.
 */

// Endpoint da API de email
const EMAIL_API_ENDPOINT = "https://share2inspire-beckend.lm.r.appspot.com/api/email/contact-form";

/**
 * Envia um email de confirmação de reserva através da API da Brevo
 * @param {Object} formData - Dados do formulário
 * @returns {Promise} - Promise com o resultado da operação
 */
async function sendBookingConfirmation(formData) {
    try {
        // Preparar os dados para envio
        const emailData = {
            name: formData.name || '',
            email: formData.email || '',
            phone: formData.phone || '',
            subject: `Reserva: ${formData.service || 'Serviço'}`,
            message: `Nova reserva de ${formData.service || 'serviço'} para ${formData.date || 'data não especificada'}`,
            reason: formData.service || 'Reserva de serviço',
            // Campos adicionais para o backend
            service: formData.service || '',
            date: formData.date || '',
            time: formData.time || '',
            format: formData.format || '',
            duration: formData.duration || '',
            amount: formData.amount || '',
            source: 'website_booking'
        };

        console.log("Enviando dados para a API da Brevo:", emailData);

        // Fazer a chamada à API
        const response = await fetch(EMAIL_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        // Processar a resposta
        const responseData = await response.json();
        console.log("Resposta da API da Brevo:", response.status);
        console.log("Detalhes completos da resposta:", responseData);

        // Verificar se a resposta foi bem-sucedida
        if (!response.ok || !responseData.success) {
            throw new Error(`Erro na resposta da API da Brevo: ${response.status} ${JSON.stringify(responseData)}`);
        }

        return responseData;
    } catch (error) {
        console.error("Erro ao enviar email de confirmação:", error);
        throw error;
    }
}

/**
 * Envia um email de contacto através da API da Brevo
 * @param {Object} formData - Dados do formulário
 * @returns {Promise} - Promise com o resultado da operação
 */
async function sendContactForm(formData) {
    try {
        // Preparar os dados para envio
        const emailData = {
            name: formData.name || '',
            email: formData.email || '',
            phone: formData.phone || '',
            subject: formData.subject || 'Contacto do website',
            message: formData.message || '',
            reason: formData.reason || 'Contacto geral',
            source: 'website_contact_form'
        };

        console.log("Enviando dados para a API da Brevo:", emailData);

        // Fazer a chamada à API
        const response = await fetch(EMAIL_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        // Processar a resposta
        const responseData = await response.json();
        console.log("Resposta da API da Brevo:", response.status);
        console.log("Detalhes completos da resposta:", responseData);

        // Verificar se a resposta foi bem-sucedida
        if (!response.ok || !responseData.success) {
            throw new Error(`Erro na resposta da API da Brevo: ${response.status} ${JSON.stringify(responseData)}`);
        }

        return responseData;
    } catch (error) {
        console.error("Erro ao enviar formulário de contacto:", error);
        throw error;
    }
}

/**
 * Envia um email de inscrição em workshop através da API da Brevo
 * @param {Object} formData - Dados do formulário
 * @returns {Promise} - Promise com o resultado da operação
 */
async function sendWorkshopRegistration(formData) {
    try {
        // Preparar os dados para envio
        const emailData = {
            name: formData.name || '',
            email: formData.email || '',
            phone: formData.phone || '',
            subject: `Inscrição: ${formData.workshop || 'Workshop'}`,
            message: `Nova inscrição para ${formData.workshop || 'workshop'} em ${formData.date || 'data não especificada'}`,
            reason: 'Inscrição em workshop',
            // Campos adicionais para o backend
            workshop: formData.workshop || '',
            date: formData.date || '',
            participants: formData.participants || '',
            company: formData.company || '',
            source: 'website_workshop_registration'
        };

        console.log("Enviando dados para a API da Brevo:", emailData);

        // Fazer a chamada à API
        const response = await fetch(EMAIL_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        // Processar a resposta
        const responseData = await response.json();
        console.log("Resposta da API da Brevo:", response.status);
        console.log("Detalhes completos da resposta:", responseData);

        // Verificar se a resposta foi bem-sucedida
        if (!response.ok || !responseData.success) {
            throw new Error(`Erro na resposta da API da Brevo: ${response.status} ${JSON.stringify(responseData)}`);
        }

        return responseData;
    } catch (error) {
        console.error("Erro ao enviar inscrição em workshop:", error);
        throw error;
    }
}

/**
 * Envia um email de pedido de consultoria através da API da Brevo
 * @param {Object} formData - Dados do formulário
 * @returns {Promise} - Promise com o resultado da operação
 */
async function sendConsultingRequest(formData) {
    try {
        // Preparar os dados para envio
        const emailData = {
            name: formData.name || '',
            email: formData.email || '',
            phone: formData.phone || '',
            subject: 'Pedido de Consultoria',
            message: formData.message || 'Pedido de consultoria sem detalhes adicionais',
            reason: 'Consultoria',
            // Campos adicionais para o backend
            company: formData.company || '',
            industry: formData.industry || '',
            employees: formData.employees || '',
            source: 'website_consulting_request'
        };

        console.log("Enviando dados para a API da Brevo:", emailData);

        // Fazer a chamada à API
        const response = await fetch(EMAIL_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        // Processar a resposta
        const responseData = await response.json();
        console.log("Resposta da API da Brevo:", response.status);
        console.log("Detalhes completos da resposta:", responseData);

        // Verificar se a resposta foi bem-sucedida
        if (!response.ok || !responseData.success) {
            throw new Error(`Erro na resposta da API da Brevo: ${response.status} ${JSON.stringify(responseData)}`);
        }

        return responseData;
    } catch (error) {
        console.error("Erro ao enviar pedido de consultoria:", error);
        throw error;
    }
}

/**
 * Envia um email de pedido de coaching através da API da Brevo
 * @param {Object} formData - Dados do formulário
 * @returns {Promise} - Promise com o resultado da operação
 */
async function sendCoachingRequest(formData) {
    try {
        // Preparar os dados para envio
        const emailData = {
            name: formData.name || '',
            email: formData.email || '',
            phone: formData.phone || '',
            subject: 'Pedido de Coaching',
            message: formData.message || 'Pedido de coaching sem detalhes adicionais',
            reason: 'Coaching',
            // Campos adicionais para o backend
            position: formData.position || '',
            goals: formData.goals || '',
            source: 'website_coaching_request'
        };

        console.log("Enviando dados para a API da Brevo:", emailData);

        // Fazer a chamada à API
        const response = await fetch(EMAIL_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        // Processar a resposta
        const responseData = await response.json();
        console.log("Resposta da API da Brevo:", response.status);
        console.log("Detalhes completos da resposta:", responseData);

        // Verificar se a resposta foi bem-sucedida
        if (!response.ok || !responseData.success) {
            throw new Error(`Erro na resposta da API da Brevo: ${response.status} ${JSON.stringify(responseData)}`);
        }

        return responseData;
    } catch (error) {
        console.error("Erro ao enviar pedido de coaching:", error);
        throw error;
    }
}

// Exportar funções para uso em outros módulos
window.brevoSDK = {
    sendBookingConfirmation,
    sendContactForm,
    sendWorkshopRegistration,
    sendConsultingRequest,
    sendCoachingRequest
};
