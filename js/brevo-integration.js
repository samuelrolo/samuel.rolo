/**
 * Integração com a API da Brevo para envio de emails
 * VERSÃO CORRIGIDA - Endpoints e CORS corrigidos
 */

// CORREÇÃO: Endpoints corretos para diferentes tipos de email
const EMAIL_ENDPOINTS = {
    contact: "https://share2inspire-beckend.lm.r.appspot.com/api/email/contact-form",
    booking: "https://share2inspire-beckend.lm.r.appspot.com/api/email/booking-confirmation", 
    newsletter: "https://share2inspire-beckend.lm.r.appspot.com/api/email/newsletter-signup"
};

// Fallback endpoint
const FALLBACK_ENDPOINT = "https://share2inspire-beckend.lm.r.appspot.com/api/contact/submit";

/**
 * CORREÇÃO: Headers CORS corretos
 */
function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Origin': 'https://share2inspire.pt',
        'X-Requested-With': 'XMLHttpRequest'
    };
}

/**
 * CORREÇÃO: Função genérica para envio com fallback
 */
async function sendEmail(data, endpoint, fallbackEndpoint = FALLBACK_ENDPOINT) {
    try {
        console.log(`Enviando para endpoint principal: ${endpoint}`);
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const responseData = await response.json();
            console.log('Sucesso no endpoint principal:', responseData);
            return responseData;
        } else {
            throw new Error(`Endpoint principal falhou: ${response.status}`);
        }
        
    } catch (error) {
        console.warn('Endpoint principal falhou, tentando fallback:', error.message);
        
        try {
            const fallbackResponse = await fetch(fallbackEndpoint, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            
            if (fallbackResponse.ok) {
                const responseData = await fallbackResponse.json();
                console.log('Sucesso no fallback:', responseData);
                return responseData;
            } else {
                throw new Error(`Fallback também falhou: ${fallbackResponse.status}`);
            }
            
        } catch (fallbackError) {
            console.error('Todos os endpoints falharam:', fallbackError);
            throw new Error('Falha na comunicação com o servidor');
        }
    }
}

/**
 * CORREÇÃO: Envio de confirmação de reserva melhorado
 */
async function sendBookingConfirmation(formData) {
    const emailData = {
        name: formData.name || '',
        email: formData.email || '',
        phone: formData.phone || '',
        subject: `Reserva: ${formData.service || 'Serviço'}`,
        message: `Nova reserva de ${formData.service || 'serviço'} para ${formData.date || 'data não especificada'}`,
        reason: formData.service || 'Reserva de serviço',
        service: formData.service || '',
        date: formData.date || '',
        time: formData.time || '',
        format: formData.format || '',
        duration: formData.duration || '',
        amount: formData.amount || '',
        source: 'website_booking',
        timestamp: new Date().toISOString()
    };

    console.log("Enviando confirmação de reserva:", emailData);
    return sendEmail(emailData, EMAIL_ENDPOINTS.booking);
}

/**
 * CORREÇÃO: Envio de formulário de contacto melhorado
 */
async function sendContactForm(formData) {
    const emailData = {
        name: formData.name || '',
        email: formData.email || '',
        phone: formData.phone || '',
        subject: formData.subject || 'Contacto do website',
        message: formData.message || formData.objectives || '',
        reason: formData.reason || 'Contacto geral',
        company: formData.company || '',
        position: formData.position || '',
        source: 'website_contact_form',
        timestamp: new Date().toISOString()
    };

    console.log("Enviando formulário de contacto:", emailData);
    return sendEmail(emailData, EMAIL_ENDPOINTS.contact);
}

/**
 * CORREÇÃO: Envio de pedido de agendamento melhorado
 */
async function sendBookingRequest(formData) {
    const emailData = {
        name: formData.name || '',
        email: formData.email || '',
        phone: formData.phone || '',
        subject: `Agendamento: ${formData.service || 'Serviço'}`,
        message: formData.message || `Pedido de agendamento para ${formData.service || 'serviço'}`,
        reason: 'Agendamento',
        service: formData.service || '',
        date: formData.date || '',
        objectives: formData.objectives || '',
        experience: formData.experience || '',
        source: 'website_booking_request',
        timestamp: new Date().toISOString()
    };

    console.log("Enviando pedido de agendamento:", emailData);
    return sendEmail(emailData, EMAIL_ENDPOINTS.booking);
}

/**
 * CORREÇÃO: Envio de inscrição em workshop melhorado
 */
async function sendWorkshopRegistration(formData) {
    const emailData = {
        name: formData.name || '',
        email: formData.email || '',
        phone: formData.phone || '',
        subject: `Inscrição: ${formData.workshop || 'Workshop'}`,
        message: `Nova inscrição para ${formData.workshop || 'workshop'} em ${formData.date || 'data não especificada'}`,
        reason: 'Inscrição em workshop',
        workshop: formData.workshop || '',
        date: formData.date || '',
        participants: formData.participants || '',
        company: formData.company || '',
        source: 'website_workshop_registration',
        timestamp: new Date().toISOString()
    };

    console.log("Enviando inscrição em workshop:", emailData);
    return sendEmail(emailData, EMAIL_ENDPOINTS.contact);
}

/**
 * CORREÇÃO: Envio de pedido de consultoria melhorado
 */
async function sendConsultingRequest(formData) {
    const emailData = {
        name: formData.name || '',
        email: formData.email || '',
        phone: formData.phone || '',
        subject: 'Pedido de Consultoria Organizacional',
        message: formData.objectives || formData.message || 'Pedido de consultoria sem detalhes adicionais',
        reason: 'Consultoria',
        company: formData.company || '',
        position: formData.position || '',
        employees: formData.employees || '',
        objectives: formData.objectives || '',
        timeline: formData.timeline || '',
        budget: formData.budget || '',
        source: 'website_consulting_request',
        timestamp: new Date().toISOString()
    };

    console.log("Enviando pedido de consultoria:", emailData);
    return sendEmail(emailData, EMAIL_ENDPOINTS.contact);
}

/**
 * CORREÇÃO: Envio de pedido de coaching melhorado
 */
async function sendCoachingRequest(formData) {
    const emailData = {
        name: formData.name || '',
        email: formData.email || '',
        phone: formData.phone || '',
        subject: 'Pedido de Coaching Executivo',
        message: formData.objectives || formData.message || 'Pedido de coaching sem detalhes adicionais',
        reason: 'Coaching',
        date: formData.date || '',
        objectives: formData.objectives || '',
        experience: formData.experience || '',
        source: 'website_coaching_request',
        timestamp: new Date().toISOString()
    };

    console.log("Enviando pedido de coaching:", emailData);
    return sendEmail(emailData, EMAIL_ENDPOINTS.contact);
}

/**
 * NOVO: Envio de newsletter signup
 */
async function sendNewsletterSignup(formData) {
    const emailData = {
        name: formData.name || '',
        email: formData.email || '',
        subject: 'Inscrição Newsletter HR Hub',
        message: 'Nova inscrição na newsletter HR Innovation Hub',
        reason: 'Newsletter',
        source: 'hr_hub_newsletter',
        timestamp: new Date().toISOString()
    };

    console.log("Enviando inscrição newsletter:", emailData);
    return sendEmail(emailData, EMAIL_ENDPOINTS.newsletter);
}

/**
 * CORREÇÃO: Função de teste para debug
 */
async function testBrevoIntegration() {
    const testData = {
        name: 'Teste',
        email: 'teste@exemplo.com',
        phone: '912345678',
        message: 'Teste de integração Brevo'
    };
    
    try {
        const result = await sendContactForm(testData);
        console.log('Teste Brevo bem-sucedido:', result);
        return result;
    } catch (error) {
        console.error('Teste Brevo falhou:', error);
        throw error;
    }
}

// CORREÇÃO: Exportar todas as funções incluindo as novas
window.brevoSDK = {
    sendBookingConfirmation,
    sendContactForm,
    sendBookingRequest,
    sendWorkshopRegistration,
    sendConsultingRequest,
    sendCoachingRequest,
    sendNewsletterSignup,
    testBrevoIntegration,
    EMAIL_ENDPOINTS
};

