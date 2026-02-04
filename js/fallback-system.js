/**
 * Configuração de Fallback para Frontend - Share2Inspire
 * 
 * Este ficheiro fornece endpoints alternativos e configurações de fallback
 * para quando o backend principal não está disponível
 */

// Configuração de endpoints alternativos
const FALLBACK_CONFIG = {
    // Endpoints principais (atuais)
    primary: {
        payment: "https://share2inspire-beckend.lm.r.appspot.com/api/payment/initiate",
        email: "https://share2inspire-beckend.lm.r.appspot.com/api/email/send",
        contact: "https://share2inspire-beckend.lm.r.appspot.com/api/contact/submit",
        consultoria: "https://share2inspire-beckend.lm.r.appspot.com/api/consultoria/submit"
    },

    // Endpoints de fallback (alternativos)
    fallback: {
        // Usar serviços externos como fallback temporário
        email: "https://formspree.io/f/YOUR_FORM_ID", // Substituir por ID real
        contact: "https://getform.io/f/YOUR_FORM_ID", // Substituir por ID real

        // Ou usar webhook do Zapier/Make.com
        webhook: "https://hooks.zapier.com/hooks/catch/YOUR_WEBHOOK_ID/"
    },

    // Configuração de timeout e retry
    timeout: 10000, // 10 segundos
    maxRetries: 3,
    retryDelay: 2000 // 2 segundos
};

/**
 * Função para tentar múltiplos endpoints com fallback
 */
async function submitWithFallback(data, endpointType) {
    const primaryEndpoint = FALLBACK_CONFIG.primary[endpointType];
    const fallbackEndpoint = FALLBACK_CONFIG.fallback[endpointType];

    try {
        // Tentar endpoint principal primeiro
        console.log(`Tentando endpoint principal: ${primaryEndpoint}`);
        const response = await fetchWithTimeout(primaryEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        }, FALLBACK_CONFIG.timeout);

        if (response.ok) {
            return await response.json();
        } else {
            throw new Error(`Endpoint principal falhou: ${response.status}`);
        }

    } catch (primaryError) {
        console.warn('Endpoint principal falhou, tentando fallback:', primaryError);

        if (fallbackEndpoint) {
            try {
                console.log(`Tentando endpoint de fallback: ${fallbackEndpoint}`);
                const fallbackResponse = await fetchWithTimeout(fallbackEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(data)
                }, FALLBACK_CONFIG.timeout);

                if (fallbackResponse.ok) {
                    return {
                        success: true,
                        message: 'Enviado via serviço alternativo',
                        fallback: true
                    };
                }
            } catch (fallbackError) {
                console.error('Fallback também falhou:', fallbackError);
            }
        }

        // Se tudo falhar, usar email direto
        return handleDirectEmail(data);
    }
}

/**
 * Fetch com timeout
 */
function fetchWithTimeout(url, options, timeout) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeout)
        )
    ]);
}

/**
 * Fallback final - abrir cliente de email
 */
function handleDirectEmail(data) {
    const subject = encodeURIComponent(`Pedido de ${data.service || 'Serviço'} - Share2Inspire`);
    const body = encodeURIComponent(`
Nome: ${data.name || ''}
Email: ${data.email || ''}
Telefone: ${data.phone || ''}
Empresa: ${data.company || ''}
Mensagem: ${data.objectives || data.message || ''}

---
Enviado via formulário web Share2Inspire
Data: ${new Date().toLocaleString('pt-PT')}
    `);

    const mailtoLink = `mailto:samuel@share2inspire.pt?subject=${subject}&body=${body}`;

    // Abrir cliente de email
    window.location.href = mailtoLink;

    return {
        success: true,
        message: 'Redirecionado para cliente de email',
        method: 'email_client'
    };
}

/**
 * Configuração específica para pagamentos
 */
const PAYMENT_FALLBACK = {
    // Quando pagamento falha, mostrar instruções manuais
    showManualPaymentInstructions: function (amount, service) {
        return {
            success: false,
            showInstructions: true,
            instructions: {
                multibanco: {
                    entity: "21814",
                    reference: "999 999 999", // Gerar referência real
                    amount: amount
                },
                mbway: {
                    phone: "",
                    amount: amount
                },
                contact: {
                    email: "samuel@share2inspire.pt",
                    phone: "",
                    whatsapp: ""
                }
            },
            message: `Para completar o pagamento de ${amount}€ para ${service}, use uma das opções acima ou contacte-nos diretamente.`
        };
    }
};

/**
 * Integração com o sistema atual
 */
window.FallbackSystem = {
    submitWithFallback,
    PAYMENT_FALLBACK,
    FALLBACK_CONFIG
};

// Exportar para uso em outros ficheiros
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        submitWithFallback,
        PAYMENT_FALLBACK,
        FALLBACK_CONFIG
    };
}

