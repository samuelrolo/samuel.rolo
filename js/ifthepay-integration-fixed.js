/**
 * Integração com a API da IfthenPay para pagamentos - VERSÃO CORRIGIDA
 * Endpoints e parâmetros corretos conforme documentação oficial
 */

// Chaves da IfthenPay para os diferentes métodos de pagamento
const IFTHENPAY_KEYS = {
    multibanco: "BXG-350883",
    mbway: "UWP-547025", 
    payshop: "QTU-066969"
};

// CORRIGIDO: Endpoints oficiais conforme documentação IfthenPay
const IFTHENPAY_ENDPOINTS = {
    multibanco: "https://api.ifthenpay.com/multibanco/init",
    mbway: "https://api.ifthenpay.com/spg/payment/mbway",
    payshop: "https://ifthenpay.com/api/payshop/get"
};

// Backend próprio como fallback
const PAYMENT_API_ENDPOINT = "https://share2inspire-beckend.lm.r.appspot.com/api/payment/initiate";

/**
 * Função CORS para headers adequados
 */
function getCorsHeaders( ) {
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
    };
}

/**
 * Processa um pagamento através da API da IfthenPay - VERSÃO CORRIGIDA
 */
async function processPayment(formData, paymentMethod, amount) {
    try {
        const normalizedMethod = getPaymentMethodFormat(paymentMethod);
        console.log(`Processando pagamento ${normalizedMethod} no valor de ${amount}€`);
        
        // CORRIGIDO: Tentar API oficial primeiro, fallback depois
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
AGNU nano 8.3                                                                                                           js/ifthepay-integration-fixed.js                                                                                                            Modified
/**
 * Integração com a API da IfthenPay para pagamentos - VERSÃO CORRIGIDA
 * Endpoints e parâmetros corretos conforme documentação oficial
 */

// Chaves da IfthenPay para os diferentes métodos de pagamento
const IFTHENPAY_KEYS = {
    multibanco: "BXG-350883",
    mbway: "UWP-547025",
    payshop: "QTU-066969"
};

// CORRIGIDO: Endpoints oficiais conforme documentação IfthenPay
const IFTHENPAY_ENDPOINTS = {
    multibanco: "https://api.ifthenpay.com/multibanco/init",
    mbway: "https://api.ifthenpay.com/spg/payment/mbway",
    payshop: "https://ifthenpay.com/api/payshop/get"
};

// Backend próprio como fallback
const PAYMENT_API_ENDPOINT = "https://share2inspire-beckend.lm.r.appspot.com/api/payment/initiate";

/**
 * Função CORS para headers adequados
 */
function getCorsHeaders( ) {
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
	
/**
 * CORRIGIDO: Processar pagamento via APIs oficiais IfthenPay
 */
async function processPaymentDirect(formData, paymentMethod, amount) {
    const endpoint = IFTHENPAY_ENDPOINTS[paymentMethod];
    const key = IFTHENPAY_KEYS[paymentMethod];
    
    if (!endpoint || !key) {
        throw new Error(`Método de pagamento não suportado: ${paymentMethod}`);
    }
    
    let payload;
    let requestOptions;
    
    if (paymentMethod === 'mbway') {
        // CORRIGIDO: Formato correto para MB WAY conforme documentação
        payload = {
            mbWayKey: key, // CORRIGIDO: mbWayKey não mbwayKey
            orderId: `ORDER-${Date.now()}`,
            amount: amount.toFixed(2),
            mobileNumber: formatPhoneForMBWay(formData.phone),
            email: formData.email || '',
            description: `${formData.service || 'Serviço Share2Inspire'} - ${formData.name}`
        };
        
        requestOptions = {
            method: 'POST',
            headers: getCorsHeaders(),
            body: JSON.stringify(payload)
        };
        
    } else if (paymentMethod === 'multibanco') {
        // CORRIGIDO: Formato correto para Multibanco conforme documentação
        payload = {
            mbKey: key,
            orderId: `ORDER-${Date.now()}`,
            amount: amount.toFixed(2),
            description: `${formData.service || 'Serviço Share2Inspire'} - ${formData.name}`,
            clientEmail: formData.email || '',
            clientName: formData.name || '',
            clientPhone: formData.phone || ''
        };
        
        requestOptions = {
            method: 'POST',
            headers: getCorsHeaders(),
            body: JSON.stringify(payload)
        };
        
    } else if (paymentMethod === 'payshop') {
        // CORRIGIDO: Payshop usa GET request conforme documentação
        const params = new URLSearchParams({
            payshopkey: key,
            id: `ORDER-${Date.now()}`,
            valor: amount.toFixed(2)
        });
        
        requestOptions = {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        };
        
        // Para Payshop, adicionar parâmetros à URL
        const fullEndpoint = `${endpoint}?${params.toString()}`;
        console.log(`Chamando API Payshop: ${fullEndpoint}`);
        
        const response = await fetch(fullEndpoint, requestOptions);
        
        if (!response.ok) {
            throw new Error(`API Payshop falhou: ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log('Resposta API Payshop:', responseData);
/**
 * Integração com a API da IfthenPay para pagamentos - VERSÃO CORRIGIDA
 * Endpoints e parâmetros corretos conforme documentação oficial
 */

// Chaves da IfthenPay para os diferentes métodos de pagamento
const IFTHENPAY_KEYS = {
    multibanco: "BXG-350883",
    mbway: "UWP-547025", 
    payshop: "QTU-066969"
};

// CORRIGIDO: Endpoints oficiais conforme documentação IfthenPay
const IFTHENPAY_ENDPOINTS = {
    multibanco: "https://api.ifthenpay.com/multibanco/init",
    mbway: "https://api.ifthenpay.com/spg/payment/mbway",
    payshop: "https://ifthenpay.com/api/payshop/get"
};

// Backend próprio como fallback
const PAYMENT_API_ENDPOINT = "https://share2inspire-beckend.lm.r.appspot.com/api/payment/initiate";

/**
 * Função CORS para headers adequados
 */
function getCorsHeaders( ) {
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
    };
}

/**
 * Processa um pagamento através da API da IfthenPay - VERSÃO CORRIGIDA
 */
async function processPayment(formData, paymentMethod, amount) {
    try {
        const normalizedMethod = getPaymentMethodFormat(paymentMethod);
        console.log(`Processando pagamento ${normalizedMethod} no valor de ${amount}€`);
        
        // CORRIGIDO: Tentar API oficial primeiro, fallback depois
        try {
            return await processPaymentDirect(formData, normalizedMethod, amount);
        } catch (directError) {
            console.warn('API direta falhou, usando fallback:', directError.message);
            return await processPaymentFallback(formData, normalizedMethod, amount);
        }
        
    } catch (error) {
        console.error("Erro ao processar pagamento:", error);
