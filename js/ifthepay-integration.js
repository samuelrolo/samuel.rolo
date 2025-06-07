/**
 * Integração com a API da IfthenPay para pagamentos
 * VERSÃO CORRIGIDA - Endpoints oficiais da documentação IfthenPay
 */

// Chaves da IfthenPay para os diferentes métodos de pagamento
const IFTHENPAY_KEYS = {
    multibanco: "BXG-350883",
    mbway: "UWP-547025", 
    payshop: "QTU-066969"
};

// CORREÇÃO: Endpoints oficiais da documentação IfthenPay
const IFTHENPAY_ENDPOINTS = {
    multibanco: "https://api.ifthenpay.com/multibanco/reference",
    mbway: "https://api.ifthenpay.com/spg/payment/mbway",
    payshop: "https://api.ifthenpay.com/payshop/reference"
};

// Fallback para backend próprio se APIs diretas falharem
const PAYMENT_API_ENDPOINT = "https://share2inspire-beckend.lm.r.appspot.com/api/payment/initiate";

/**
 * CORREÇÃO: Função CORS que estava em falta
 */
function handleCorsRequest() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
    };
}

/**
 * Processa um pagamento através da API da IfthenPay
 * CORRIGIDO: Usar endpoints oficiais primeiro, fallback depois
 */
async function processPayment(formData, paymentMethod, amount) {
    try {
        const normalizedMethod = getPaymentMethodFormat(paymentMethod);
        
        // CORREÇÃO: Tentar API oficial primeiro
        try {
            return await processPaymentDirect(formData, normalizedMethod, amount);
        } catch (directError) {
            console.warn('API direta falhou, usando fallback:', directError.message);
            return await processPaymentFallback(formData, normalizedMethod, amount);
        }
        
    } catch (error) {
        console.error("Erro ao processar pagamento:", error);
        throw error;
    }
}

/**
 * NOVO: Processar pagamento via APIs oficiais IfthenPay
 */
async function processPaymentDirect(formData, paymentMethod, amount) {
    const endpoint = IFTHENPAY_ENDPOINTS[paymentMethod];
    const key = IFTHENPAY_KEYS[paymentMethod];
    
    if (!endpoint || !key) {
        throw new Error(`Método de pagamento não suportado: ${paymentMethod}`);
    }
    
    let payload;
    
    if (paymentMethod === 'mbway') {
        // CORREÇÃO: Formato correto para MB WAY conforme documentação
        payload = {
            mbwayKey: key,
            orderId: `ORDER-${Date.now()}`,
            amount: amount.toFixed(2),
            mobileNumber: formatPhoneForMBWay(formData.phone),
            email: formData.email || '',
            description: `${formData.service || 'Serviço Share2Inspire'} - ${formData.name}`
        };
    } else if (paymentMethod === 'multibanco') {
        // CORREÇÃO: Formato correto para Multibanco conforme documentação
        payload = {
            mbKey: key,
            orderId: `ORDER-${Date.now()}`,
            amount: amount.toFixed(2)
        };
    } else if (paymentMethod === 'payshop') {
        // CORREÇÃO: Formato correto para Payshop
        payload = {
            payshopKey: key,
            orderId: `ORDER-${Date.now()}`,
            amount: amount.toFixed(2)
        };
    }
    
    console.log(`Chamando API oficial ${paymentMethod}:`, endpoint);
    
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...handleCorsRequest()
        },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        throw new Error(`API oficial falhou: ${response.status}`);
    }
    
    const responseData = await response.json();
    console.log('Resposta API oficial:', responseData);
    
    return {
        success: true,
        ...responseData,
        method: paymentMethod
    };
}

/**
 * CORRIGIDO: Fallback para backend próprio
 */
async function processPaymentFallback(formData, paymentMethod, amount) {
    const paymentData = {
        service: formData.service || 'Serviço Share2Inspire',
        name: formData.name,
        email: formData.email,
        phone: paymentMethod === 'mbway' ? formatPhoneForMBWay(formData.phone) : formData.phone,
        date: formData.date || '',
        amount: amount,
        payment_method: paymentMethod,
        order_id: `ORDER-${Date.now()}`
    };

    console.log("Usando fallback backend:", paymentData);

    const response = await fetch(PAYMENT_API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...handleCorsRequest()
        },
        body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend falhou: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    
    if (!responseData.success) {
        throw new Error(responseData.error || 'Erro desconhecido no backend');
    }

    return responseData;
}

/**
 * Converte o método de pagamento para o formato esperado
 */
function getPaymentMethodFormat(method) {
    if (!method) return 'multibanco';
    
    method = method.toLowerCase();
    
    const methodMap = {
        'mb': 'multibanco',
        'multibanco': 'multibanco', 
        'mbway': 'mbway',
        'payshop': 'payshop'
    };
    
    return methodMap[method] || 'multibanco';
}

/**
 * CORRIGIDO: Formata telefone conforme documentação MB WAY
 */
function formatPhoneForMBWay(phone) {
    if (!phone) return '';
    
    // Remover todos os caracteres não numéricos
    let cleanPhone = phone.replace(/\D/g, '');
    
    // CORREÇÃO: Formato conforme documentação - 351#912345678
    if (!cleanPhone.startsWith('351')) {
        if (cleanPhone.startsWith('9') && cleanPhone.length === 9) {
            cleanPhone = '351' + cleanPhone;
        }
    }
    
    return cleanPhone;
}

/**
 * Exibe as informações de pagamento (mantido igual)
 */
function displayPaymentInfo(paymentData, paymentMethod, container) {
    container.innerHTML = '';
    
    if (!paymentData || !paymentData.success) {
        displayPaymentError(new Error("Pagamento não processado corretamente"), container);
        return;
    }
    
    const normalizedMethod = getPaymentMethodFormat(paymentMethod);
    const paymentInfo = document.createElement('div');
    paymentInfo.className = 'alert alert-success';
    
    if (normalizedMethod === 'multibanco') {
        paymentInfo.innerHTML = `
            <h4>Pagamento Multibanco</h4>
            <p><strong>Entidade:</strong> ${paymentData.entity || ''}</p>
            <p><strong>Referência:</strong> ${paymentData.reference || ''}</p>
            <p><strong>Valor:</strong> ${paymentData.amount || ''}€</p>
            <p>Por favor, efetue o pagamento em qualquer caixa multibanco ou homebanking.</p>
        `;
    } else if (normalizedMethod === 'mbway') {
        paymentInfo.innerHTML = `
            <h4>Pagamento MB WAY</h4>
            <p><strong>Número:</strong> ${paymentData.phone || paymentData.mobileNumber || ''}</p>
            <p><strong>Valor:</strong> ${paymentData.amount || ''}€</p>
            <p>Foi enviado um pedido de pagamento para o seu número MB WAY.</p>
            <p>Por favor, aceite o pagamento na aplicação MB WAY.</p>
        `;
    } else if (normalizedMethod === 'payshop') {
        paymentInfo.innerHTML = `
            <h4>Pagamento Payshop</h4>
            <p><strong>Referência:</strong> ${paymentData.reference || ''}</p>
            <p><strong>Valor:</strong> ${paymentData.amount || ''}€</p>
            <p>Por favor, efetue o pagamento em qualquer agente Payshop ou CTT.</p>
        `;
    }
    
    container.appendChild(paymentInfo);
}

/**
 * Exibe mensagem de erro (mantido igual)
 */
function displayPaymentError(error, container) {
    container.innerHTML = '';
    
    const errorInfo = document.createElement('div');
    errorInfo.className = 'alert alert-danger';
    errorInfo.innerHTML = `
        <p>Erro ao processar pedido: ${error.message}</p>
        <p>Por favor tente novamente ou contacte-nos diretamente.</p>
    `;
    
    container.appendChild(errorInfo);
}

// CORREÇÃO: Exportar também as novas funções
window.IfthenPayIntegration = {
    processPayment,
    processPaymentDirect,
    processPaymentFallback,
    displayPaymentInfo,
    displayPaymentError,
    handleCorsRequest,
    IFTHENPAY_KEYS,
    IFTHENPAY_ENDPOINTS
};

