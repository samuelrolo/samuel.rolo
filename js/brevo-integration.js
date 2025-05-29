/**
 * Integração com Brevo para envio de emails - Share2Inspire
 * Versão corrigida para compatibilidade com navegador
 */

// Remover importações ES6 que não funcionam diretamente no navegador
// import { ApiClient, TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar o SDK da Brevo
    initBrevoSDK();
    
    // Inicializar todos os modais Bootstrap
    if (typeof bootstrap !== 'undefined') {
        var modais = document.querySelectorAll('.modal');
        modais.forEach(function(modal) {
            new bootstrap.Modal(modal);
        });
    } else {
        console.error('Bootstrap não está definido. Verifique se o script do Bootstrap foi carregado corretamente.');
    }
});

/**
 * Inicializa o SDK da Brevo
 */
function initBrevoSDK() {
    console.log('Inicializando integração com Brevo');
    
    // Remover configuração direta do SDK que usa process.env
    // const defaultClient = ApiClient.instance;
    // const apiKey = defaultClient.authentications['api-key'];
    // apiKey.apiKey = process.env.BREVO_API_KEY
    
    // Em vez disso, expor funções que chamam o backend
    window.brevoSDK = {
        sendBookingConfirmation: sendBookingConfirmationViaBackend,
        sendPaymentConfirmation: sendPaymentConfirmationViaBackend,
        sendContactConfirmation: sendContactConfirmationViaBackend,
        sendFeedbackConfirmation: sendFeedbackConfirmationViaBackend
    };
}

/**
 * Envia email de confirmação de reserva via backend
 * @param {Object} data - Dados da reserva
 * @returns {Promise} - Promise que resolve quando o email é enviado
 */
function sendBookingConfirmationViaBackend(data) {
    return fetch('https://share2inspire-beckend.lm.r.appspot.com/api/email/booking-confirmation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://share2inspire.pt',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao enviar email: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log('Email de confirmação enviado com sucesso:', data);
        return data;
    })
    .catch(error => {
        console.error('Erro ao enviar email de confirmação:', error);
        throw error;
    });
}

/**
 * Envia email de confirmação de pagamento via backend
 * @param {Object} data - Dados do pagamento
 * @returns {Promise} - Promise que resolve quando o email é enviado
 */
function sendPaymentConfirmationViaBackend(data) {
    return fetch('https://share2inspire-beckend.lm.r.appspot.com/api/email/payment-confirmation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://share2inspire.pt',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao enviar email: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log('Email de confirmação de pagamento enviado com sucesso:', data);
        return data;
    })
    .catch(error => {
        console.error('Erro ao enviar email de confirmação de pagamento:', error);
        throw error;
    });
}

/**
 * Envia email de confirmação de contacto via backend
 * @param {Object} data - Dados do contacto
 * @returns {Promise} - Promise que resolve quando o email é enviado
 */
function sendContactConfirmationViaBackend(data) {
    return fetch('https://share2inspire-beckend.lm.r.appspot.com/api/email/contact-confirmation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://share2inspire.pt',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao enviar email: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log('Email de confirmação de contacto enviado com sucesso:', data);
        return data;
    })
    .catch(error => {
        console.error('Erro ao enviar email de confirmação de contacto:', error);
        throw error;
    });
}

/**
 * Envia email de confirmação de feedback via backend
 * @param {Object} data - Dados do feedback
 * @returns {Promise} - Promise que resolve quando o email é enviado
 */
function sendFeedbackConfirmationViaBackend(data) {
    // Se não houver email, não enviar confirmação
    if (!data.email) {
        console.log('Email não fornecido, não será enviada confirmação de feedback');
        return Promise.resolve();
    }
    
    return fetch('https://share2inspire-beckend.lm.r.appspot.com/api/email/feedback-confirmation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://share2inspire.pt',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao enviar email: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log('Email de confirmação de feedback enviado com sucesso:', data);
        return data;
    })
    .catch(error => {
        console.error('Erro ao enviar email de confirmação de feedback:', error);
        throw error;
    });
}

/**
 * Formata o método de pagamento
 * @param {string} method - Método de pagamento
 * @returns {string} - Método de pagamento formatado
 */
function formatPaymentMethod(method) {
    const methods = {
        'mb': 'Multibanco',
        'multibanco': 'Multibanco',
        'mbway': 'MB WAY',
        'payshop': 'Payshop',
        'credit_card': 'Cartão de Crédito',
        'debit_card': 'Cartão de Débito',
        'bank_transfer': 'Transferência Bancária'
    };
    
    return methods[method] || method || 'Desconhecido';
}

/**
 * Formata os detalhes do pagamento em HTML
 * @param {Object} data - Dados do pagamento
 * @returns {string} - HTML formatado com os detalhes do pagamento
 */
function formatPaymentDetailsHTML(data) {
    if (!data.paymentMethod) {
        return '';
    }
    
    if (data.paymentMethod === 'mbway') {
        return `
            <div class="payment-details">
                <h3 style="color: #0066cc; margin-top: 0;">Detalhes de Pagamento MB WAY</h3>
                <p><strong>Número:</strong> ${data.phone || data.customerPhone || ""}</p>
                <p><strong>Valor:</strong> ${data.amount || "0.00"}€</p>
                <p>Foi enviado um pedido de pagamento para o seu telemóvel através do MB WAY.</p>
                <p><em>Por favor verifique a aplicação MB WAY no seu telemóvel e aceite o pagamento para confirmar a sua marcação.</em></p>
            </div>
        `;
    } else if (data.paymentMethod === 'mb' || data.paymentMethod === 'multibanco') {
        return `
            <div class="payment-details">
                <h3 style="color: #0066cc; margin-top: 0;">Detalhes de Pagamento Multibanco</h3>
                <p><strong>Entidade:</strong> ${data.entity || ""}</p>
                <p><strong>Referência:</strong> ${data.reference || ""}</p>
                <p><strong>Valor:</strong> ${data.amount || "0.00"}€</p>
                <p><em>Por favor efetue o pagamento através do Multibanco ou da sua app bancária para confirmar a sua marcação.</em></p>
                <p><em>A referência é válida por 48 horas.</em></p>
            </div>
        `;
    } else if (data.paymentMethod === 'payshop') {
        return `
            <div class="payment-details">
                <h3 style="color: #0066cc; margin-top: 0;">Detalhes de Pagamento Payshop</h3>
                <p><strong>Referência:</strong> ${data.reference || ""}</p>
                <p><strong>Valor:</strong> ${data.amount || "0.00"}€</p>
                <p><em>Por favor efetue o pagamento num agente Payshop para confirmar a sua marcação.</em></p>
                <p><em>A referência é válida por 48 horas.</em></p>
            </div>
        `;
    } else {
        return `
            <div class="payment-details">
                <h3 style="color: #0066cc; margin-top: 0;">Detalhes de Pagamento</h3>
                <p><strong>Método:</strong> ${formatPaymentMethod(data.paymentMethod)}</p>
                <p><strong>Valor:</strong> ${data.amount || "0.00"}€</p>
                <p><em>Obrigado pela sua reserva.</em></p>
            </div>
        `;
    }
}
