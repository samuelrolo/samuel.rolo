/**
 * Integração com SDK oficial da Brevo para envio de emails - Share2Inspire
 */

import { ApiClient, TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';

document.addEventListener('DOMContentLoaded', function() {
    initBrevoSDK();
});

/**
 * Inicializa o SDK da Brevo
 */
function initBrevoSDK() {
    console.log('Inicializando SDK oficial da Brevo');
    
    // Configuração do SDK
    const defaultClient = ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = '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'; // Idealmente, obtido de forma segura do backend
    
    // Criar instância da API
    const apiInstance = new TransactionalEmailsApi();
    
    // Expor funções para uso externo
    window.brevoSDK = {
        sendBookingConfirmation,
        sendPaymentConfirmation,
        sendContactConfirmation,
        sendFeedbackConfirmation
    };
    
    /**
     * Envia email de confirmação de reserva
     * @param {Object} data - Dados da reserva
     * @returns {Promise} - Promise que resolve quando o email é enviado
     */
    function sendBookingConfirmation(data) {
        const sendSmtpEmail = new SendSmtpEmail();
        
        sendSmtpEmail.subject = "Confirmação de Reserva - Share2Inspire";
        sendSmtpEmail.sender = { 
            "name": "Share2Inspire", 
            "email": "srshare2inspire@gmail.com" 
        };
        sendSmtpEmail.to = [{ 
            "email": data.email || data.customerEmail, 
            "name": data.name || data.customerName || "Cliente" 
        }];
        
        // Construir conteúdo HTML do email
        sendSmtpEmail.htmlContent = `
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        h2 { color: #BF9A33; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                        .booking-details { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #BF9A33; margin: 15px 0; }
                        .payment-details { background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px; }
                        .footer { margin-top: 30px; font-size: 12px; color: #777; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>Confirmação de Reserva</h2>
                        <p>Olá ${data.name || data.customerName || "Cliente"},</p>
                        <p>Obrigado pela sua reserva. Abaixo estão os detalhes da sua sessão:</p>
                        
                        <div class="booking-details">
                            <p><strong>Serviço:</strong> ${data.service || "Kickstart Pro"}</p>
                            <p><strong>Data:</strong> ${data.date || data.serviceDate || new Date().toLocaleDateString('pt-PT')}</p>
                            <p><strong>Formato:</strong> ${data.format || data.serviceFormat || "Online"}</p>
                            <p><strong>Duração:</strong> ${data.duration || data.serviceDuration || "30 minutos"}</p>
                            <p><strong>Referência:</strong> ${data.orderId || ""}</p>
                        </div>
                        
                        ${formatPaymentDetailsHTML(data)}
                        
                        <p>Se tiver alguma dúvida ou precisar de alterar a sua marcação, por favor contacte-nos através do email <a href="mailto:srshare2inspire@gmail.com">srshare2inspire@gmail.com</a>.</p>
                        
                        <p>Aguardamos a sua visita!</p>
                        <p>Cumprimentos,<br>Equipa Share2Inspire</p>
                        
                        <div class="footer">
                            <p>Este email foi enviado automaticamente pelo sistema Share2Inspire.</p>
                        </div>
                    </div>
                </body>
            </html>
        `;
        
        // Adicionar parâmetros para rastreamento
        sendSmtpEmail.params = {
            "service": data.service || "Kickstart Pro",
            "date": data.date || data.serviceDate || new Date().toLocaleDateString('pt-PT'),
            "format": data.format || data.serviceFormat || "Online"
        };
        
        // Enviar o email
        return apiInstance.sendTransacEmail(sendSmtpEmail)
            .then(response => {
                console.log('Email de confirmação enviado com sucesso:', response);
                return response;
            })
            .catch(error => {
                console.error('Erro ao enviar email de confirmação:', error);
                throw error;
            });
    }
    
    /**
     * Envia email de confirmação de pagamento
     * @param {Object} data - Dados do pagamento
     * @returns {Promise} - Promise que resolve quando o email é enviado
     */
    function sendPaymentConfirmation(data) {
        const sendSmtpEmail = new SendSmtpEmail();
        
        sendSmtpEmail.subject = "Confirmação de Pagamento - Share2Inspire";
        sendSmtpEmail.sender = { 
            "name": "Share2Inspire", 
            "email": "srshare2inspire@gmail.com" 
        };
        sendSmtpEmail.to = [{ 
            "email": data.email || data.customerEmail, 
            "name": data.name || data.customerName || "Cliente" 
        }];
        
        // Construir conteúdo HTML do email
        sendSmtpEmail.htmlContent = `
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        h2 { color: #BF9A33; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                        .payment-details { background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px; }
                        .footer { margin-top: 30px; font-size: 12px; color: #777; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>Confirmação de Pagamento</h2>
                        <p>Olá ${data.name || data.customerName || "Cliente"},</p>
                        <p>Obrigado pelo seu pagamento. Abaixo estão os detalhes da transação:</p>
                        
                        <div class="payment-details">
                            <p><strong>Serviço:</strong> ${data.service || "Kickstart Pro"}</p>
                            <p><strong>Valor:</strong> ${data.amount || "0.00"}€</p>
                            <p><strong>Método de Pagamento:</strong> ${formatPaymentMethod(data.paymentMethod)}</p>
                            <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-PT')}</p>
                            <p><strong>Referência:</strong> ${data.orderId || ""}</p>
                        </div>
                        
                        <p>Se tiver alguma dúvida sobre o seu pagamento, por favor contacte-nos através do email <a href="mailto:srshare2inspire@gmail.com">srshare2inspire@gmail.com</a>.</p>
                        
                        <p>Obrigado pela sua preferência!</p>
                        <p>Cumprimentos,<br>Equipa Share2Inspire</p>
                        
                        <div class="footer">
                            <p>Este email foi enviado automaticamente pelo sistema Share2Inspire.</p>
                        </div>
                    </div>
                </body>
            </html>
        `;
        
        // Adicionar parâmetros para rastreamento
        sendSmtpEmail.params = {
            "service": data.service || "Kickstart Pro",
            "amount": data.amount || "0.00",
            "paymentMethod": formatPaymentMethod(data.paymentMethod)
        };
        
        // Enviar o email
        return apiInstance.sendTransacEmail(sendSmtpEmail)
            .then(response => {
                console.log('Email de confirmação de pagamento enviado com sucesso:', response);
                return response;
            })
            .catch(error => {
                console.error('Erro ao enviar email de confirmação de pagamento:', error);
                throw error;
            });
    }
    
    /**
     * Envia email de confirmação de contacto
     * @param {Object} data - Dados do contacto
     * @returns {Promise} - Promise que resolve quando o email é enviado
     */
    function sendContactConfirmation(data) {
        const sendSmtpEmail = new SendSmtpEmail();
        
        sendSmtpEmail.subject = "Recebemos o seu contacto - Share2Inspire";
        sendSmtpEmail.sender = { 
            "name": "Share2Inspire", 
            "email": "srshare2inspire@gmail.com" 
        };
        sendSmtpEmail.to = [{ 
            "email": data.email, 
            "name": data.name || "Cliente" 
        }];
        
        // Construir conteúdo HTML do email
        sendSmtpEmail.htmlContent = `
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        h2 { color: #BF9A33; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                        .message-box { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #BF9A33; margin: 15px 0; }
                        .footer { margin-top: 30px; font-size: 12px; color: #777; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>Recebemos o seu contacto</h2>
                        <p>Olá ${data.name || "Cliente"},</p>
                        <p>Obrigado por nos contactar. Recebemos a sua mensagem e responderemos o mais brevemente possível.</p>
                        
                        <div class="message-box">
                            <p><strong>Assunto:</strong> ${data.subject || "Contacto"}</p>
                            <p><strong>Mensagem:</strong></p>
                            <p>${data.message || ""}</p>
                        </div>
                        
                        <p>Se tiver alguma questão adicional, não hesite em contactar-nos.</p>
                        
                        <p>Cumprimentos,<br>Equipa Share2Inspire</p>
                        
                        <div class="footer">
                            <p>Este email foi enviado automaticamente pelo sistema Share2Inspire.</p>
                        </div>
                    </div>
                </body>
            </html>
        `;
        
        // Enviar o email
        return apiInstance.sendTransacEmail(sendSmtpEmail)
            .then(response => {
                console.log('Email de confirmação de contacto enviado com sucesso:', response);
                return response;
            })
            .catch(error => {
                console.error('Erro ao enviar email de confirmação de contacto:', error);
                throw error;
            });
    }
    
    /**
     * Envia email de confirmação de feedback
     * @param {Object} data - Dados do feedback
     * @returns {Promise} - Promise que resolve quando o email é enviado
     */
    function sendFeedbackConfirmation(data) {
        // Se não houver email, não enviar confirmação
        if (!data.email) {
            console.log('Email não fornecido, não será enviada confirmação de feedback');
            return Promise.resolve();
        }
        
        const sendSmtpEmail = new SendSmtpEmail();
        
        sendSmtpEmail.subject = "Obrigado pelo seu feedback - Share2Inspire";
        sendSmtpEmail.sender = { 
            "name": "Share2Inspire", 
            "email": "srshare2inspire@gmail.com" 
        };
        sendSmtpEmail.to = [{ 
            "email": data.email, 
            "name": data.name || "Cliente" 
        }];
        
        // Construir conteúdo HTML do email
        sendSmtpEmail.htmlContent = `
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        h2 { color: #BF9A33; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                        .feedback-box { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #BF9A33; margin: 15px 0; }
                        .footer { margin-top: 30px; font-size: 12px; color: #777; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>Obrigado pelo seu feedback</h2>
                        <p>Olá ${data.name || "Cliente"},</p>
                        <p>Obrigado por partilhar a sua opinião connosco. O seu feedback é muito importante para continuarmos a melhorar os nossos serviços.</p>
                        
                        <div class="feedback-box">
                            <p><strong>Avaliação:</strong> ${data.rating || "0"}/5</p>
                            <p><strong>Comentário:</strong></p>
                            <p>${data.message || ""}</p>
                        </div>
                        
                        <p>Agradecemos a sua colaboração e esperamos continuar a contar com a sua preferência.</p>
                        
                        <p>Cumprimentos,<br>Equipa Share2Inspire</p>
                        
                        <div class="footer">
                            <p>Este email foi enviado automaticamente pelo sistema Share2Inspire.</p>
                        </div>
                    </div>
                </body>
            </html>
        `;
        
        // Enviar o email
        return apiInstance.sendTransacEmail(sendSmtpEmail)
            .then(response => {
                console.log('Email de confirmação de feedback enviado com sucesso:', response);
                return response;
            })
            .catch(error => {
                console.error('Erro ao enviar email de confirmação de feedback:', error);
                throw error;
            });
    }
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
                <p><strong>Entidade:</strong> ${data.entity || data.Entity || ""}</p>
                <p><strong>Referência:</strong> ${data.reference || data.Reference || ""}</p>
                <p><strong>Valor:</strong> ${data.amount || "0.00"}€</p>
                <p><em>A referência é válida por 48 horas. Por favor efetue o pagamento o mais brevemente possível para confirmar a sua marcação.</em></p>
            </div>
        `;
    } else if (data.paymentMethod === 'payshop') {
        return `
            <div class="payment-details">
                <h3 style="color: #0066cc; margin-top: 0;">Detalhes de Pagamento Payshop</h3>
                <p><strong>Referência:</strong> ${data.reference || data.Reference || ""}</p>
                <p><strong>Valor:</strong> ${data.amount || "0.00"}€</p>
                <p><em>Pode efetuar o pagamento em qualquer agente Payshop ou CTT. A referência é válida por 30 dias.</em></p>
            </div>
        `;
    }
    
    return '';
}
