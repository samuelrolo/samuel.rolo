/**
 * Integração com a API Brevo para envio de emails - Share2Inspire
 * 
 * Versão corrigida para garantir o envio de emails de confirmação após processamento de pagamentos
 * e submissão de formulários.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar a integração com a Brevo
    initBrevoIntegration();
});

/**
 * Inicializa a integração com a Brevo
 */
function initBrevoIntegration() {
    console.log('Inicializando integração com a Brevo');
    
    // Expor funções para uso externo
    window.brevoIntegration = {
        sendBookingConfirmation,
        sendPaymentConfirmation,
        sendContactConfirmation,
        sendFeedbackConfirmation
    };
}

/**
 * Envia email de confirmação de reserva
 * @param {FormData|Object} formData - Dados do formulário ou objeto com dados
 * @returns {Promise} - Promise que resolve quando o email é enviado
 */
function sendBookingConfirmation(formData) {
    // Converter FormData para objeto se necessário
    const data = formData instanceof FormData ? formDataToObject(formData) : formData;
    
    // Preparar dados para o email
    const emailData = {
        templateId: 1, // ID do template na Brevo
        sender: {
            name: "Share2Inspire",
            email: "srshare2inspire@gmail.com"
        },
        to: [{
            name: data.name || data.customerName || "Cliente",
            email: data.email || data.customerEmail
        }],
        params: {
            name: data.name || data.customerName || "Cliente",
            service: data.service || "Serviço",
            date: data.date || new Date().toLocaleDateString('pt-PT'),
            details: formatBookingDetails(data)
        },
        subject: "Confirmação de Reserva - Share2Inspire"
    };
    
    return sendEmailViaBackend(emailData, '/api/email/send');
}

/**
 * Envia email de confirmação de pagamento
 * @param {Object} paymentData - Dados do pagamento
 * @returns {Promise} - Promise que resolve quando o email é enviado
 */
function sendPaymentConfirmation(paymentData) {
    // Preparar dados para o email
    const emailData = {
        templateId: 2, // ID do template na Brevo
        sender: {
            name: "Share2Inspire",
            email: "srshare2inspire@gmail.com"
        },
        to: [{
            name: paymentData.customerName || "Cliente",
            email: paymentData.customerEmail
        }],
        params: {
            name: paymentData.customerName || "Cliente",
            service: paymentData.service || "Serviço",
            amount: paymentData.amount || "0.00",
            paymentMethod: formatPaymentMethod(paymentData.paymentMethod),
            paymentDetails: formatPaymentDetails(paymentData),
            date: new Date().toLocaleDateString('pt-PT')
        },
        subject: "Confirmação de Pagamento - Share2Inspire"
    };
    
    return sendEmailViaBackend(emailData, '/api/email/send');
}

/**
 * Envia email de confirmação de contacto
 * @param {FormData|Object} formData - Dados do formulário ou objeto com dados
 * @returns {Promise} - Promise que resolve quando o email é enviado
 */
function sendContactConfirmation(formData) {
    // Converter FormData para objeto se necessário
    const data = formData instanceof FormData ? formDataToObject(formData) : formData;
    
    // Preparar dados para o email
    const emailData = {
        templateId: 3, // ID do template na Brevo
        sender: {
            name: "Share2Inspire",
            email: "srshare2inspire@gmail.com"
        },
        to: [{
            name: data.name || "Cliente",
            email: data.email
        }],
        params: {
            name: data.name || "Cliente",
            subject: data.subject || "Contacto",
            message: data.message || "",
            date: new Date().toLocaleDateString('pt-PT')
        },
        subject: "Recebemos o seu contacto - Share2Inspire"
    };
    
    return sendEmailViaBackend(emailData, '/api/email/send');
}

/**
 * Envia email de confirmação de feedback
 * @param {FormData|Object} formData - Dados do formulário ou objeto com dados
 * @returns {Promise} - Promise que resolve quando o email é enviado
 */
function sendFeedbackConfirmation(formData) {
    // Converter FormData para objeto se necessário
    const data = formData instanceof FormData ? formDataToObject(formData) : formData;
    
    // Se não houver email, não enviar confirmação
    if (!data.email) {
        console.log('Email não fornecido, não será enviada confirmação de feedback');
        return Promise.resolve();
    }
    
    // Preparar dados para o email
    const emailData = {
        templateId: 4, // ID do template na Brevo
        sender: {
            name: "Share2Inspire",
            email: "srshare2inspire@gmail.com"
        },
        to: [{
            name: data.name || "Cliente",
            email: data.email
        }],
        params: {
            name: data.name || "Cliente",
            rating: data.rating || "0",
            message: data.message || "",
            date: new Date().toLocaleDateString('pt-PT')
        },
        subject: "Obrigado pelo seu feedback - Share2Inspire"
    };
    
    return sendEmailViaBackend(emailData, '/api/email/send');
}

/**
 * Envia email através do backend
 * @param {Object} emailData - Dados do email
 * @param {string} endpoint - Endpoint do backend
 * @returns {Promise} - Promise que resolve quando o email é enviado
 */
function sendEmailViaBackend(emailData, endpoint) {
    console.log('Enviando email via backend:', emailData);
    
    // Lista de endpoints a tentar, em ordem de prioridade
    const endpoints = [
        'https://share2inspire-beckend.lm.r.appspot.com/api/email/send',
        'https://share2inspire-beckend.lm.r.appspot.com/api/payment/initiate',
        'https://share2inspire-beckend.lm.r.appspot.com/api/feedback/contact'
    ];
    
    // Tentar enviar para cada endpoint até que um funcione
    return tryEndpoints(endpoints, 0, emailData);
    
    function tryEndpoints(endpoints, index, data) {
        return new Promise((resolve, reject) => {
            if (index >= endpoints.length) {
                // Todos os endpoints falharam
                console.error('Todos os endpoints falharam para envio de email');
                reject(new Error('Falha ao enviar email. Todos os endpoints falharam.'));
                return;
            }
            
            const currentEndpoint = endpoints[index];
            console.log(`Tentando endpoint ${index + 1}/${endpoints.length} para email: ${currentEndpoint}`);
            
            // Enviar dados para o backend
            fetch(currentEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': 'https://share2inspire.pt',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    ...data,
                    type: 'email',
                    action: 'send'
                })
            })
            .then(response => {
                console.log(`Resposta do servidor para email (${currentEndpoint}):`, response.status, response.statusText);
                
                if (!response.ok) {
                    // Se o endpoint atual falhar, tentar o próximo
                    if (response.status === 405) {
                        console.warn(`Endpoint ${currentEndpoint} retornou 405 Method Not Allowed. Tentando próximo endpoint...`);
                        return tryEndpoints(endpoints, index + 1, data)
                            .then(resolve)
                            .catch(reject);
                    }
                    
                    return response.text().then(text => {
                        console.error(`Erro na resposta do servidor para email (${currentEndpoint}):`, response.status, text);
                        throw new Error(`Erro na resposta do servidor: ${response.status}`);
                    });
                }
                
                // Tentar analisar a resposta como JSON
                try {
                    return response.json();
                } catch (e) {
                    // Se não for JSON, retornar um objeto simples
                    return { success: true, message: 'Email enviado com sucesso!' };
                }
            })
            .then(data => {
                console.log(`Email enviado com sucesso via ${currentEndpoint}:`, data);
                resolve(data);
            })
            .catch(error => {
                console.error(`Erro ao enviar email via ${currentEndpoint}:`, error);
                
                // Tentar próximo endpoint
                tryEndpoints(endpoints, index + 1, data)
                    .then(resolve)
                    .catch(reject);
            });
        });
    }
}

/**
 * Converte FormData para objeto
 * @param {FormData} formData - Objeto FormData
 * @returns {Object} - Objeto com os dados do formulário
 */
function formDataToObject(formData) {
    const object = {};
    formData.forEach((value, key) => {
        object[key] = value;
    });
    return object;
}

/**
 * Formata os detalhes da reserva
 * @param {Object} data - Dados da reserva
 * @returns {string} - HTML formatado com os detalhes da reserva
 */
function formatBookingDetails(data) {
    let details = '';
    
    if (data.service) {
        details += `<p><strong>Serviço:</strong> ${data.service}</p>`;
    }
    
    if (data.date) {
        details += `<p><strong>Data:</strong> ${data.date}</p>`;
    }
    
    if (data.format) {
        details += `<p><strong>Formato:</strong> ${data.format}</p>`;
    }
    
    if (data.duration) {
        details += `<p><strong>Duração:</strong> ${data.duration}</p>`;
    }
    
    if (data.participants) {
        details += `<p><strong>Participantes:</strong> ${data.participants}</p>`;
    }
    
    if (data.workshop) {
        details += `<p><strong>Workshop:</strong> ${data.workshop}</p>`;
    }
    
    if (data.company) {
        details += `<p><strong>Empresa:</strong> ${data.company}</p>`;
    }
    
    if (data.area) {
        details += `<p><strong>Área:</strong> ${data.area}</p>`;
    }
    
    if (data.objectives) {
        details += `<p><strong>Objetivos:</strong> ${data.objectives}</p>`;
    }
    
    return details || '<p>Sem detalhes adicionais</p>';
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
 * Formata os detalhes do pagamento
 * @param {Object} data - Dados do pagamento
 * @returns {string} - HTML formatado com os detalhes do pagamento
 */
function formatPaymentDetails(data) {
    let details = '';
    
    if (data.paymentMethod === 'mb' || data.paymentMethod === 'multibanco') {
        if (data.entity || data.Entity) {
            details += `<p><strong>Entidade:</strong> ${data.entity || data.Entity}</p>`;
        }
        
        if (data.reference || data.Reference) {
            details += `<p><strong>Referência:</strong> ${data.reference || data.Reference}</p>`;
        }
        
        details += `<p><strong>Valor:</strong> ${data.amount || data.Amount || '0.00'}€</p>`;
        details += `<p>A referência é válida por 48 horas.</p>`;
    } else if (data.paymentMethod === 'mbway') {
        details += `<p><strong>Número:</strong> ${data.phone || data.customerPhone}</p>`;
        details += `<p><strong>Valor:</strong> ${data.amount || data.Amount || '0.00'}€</p>`;
        details += `<p>Foi enviado um pedido de pagamento para o seu número MB WAY.</p>`;
    } else if (data.paymentMethod === 'payshop') {
        if (data.reference || data.Reference) {
            details += `<p><strong>Referência:</strong> ${data.reference || data.Reference}</p>`;
        }
        
        details += `<p><strong>Valor:</strong> ${data.amount || data.Amount || '0.00'}€</p>`;
        details += `<p>A referência é válida por 48 horas.</p>`;
    } else {
        details += `<p><strong>Valor:</strong> ${data.amount || data.Amount || '0.00'}€</p>`;
    }
    
    return details || '<p>Sem detalhes adicionais</p>';
}
