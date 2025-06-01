/**
 * Integração com a API da IfthenPay para pagamentos
 * 
 * Este módulo fornece funções para integração com a API de pagamentos da IfthenPay,
 * permitindo processar pagamentos via Multibanco, MB WAY e Payshop.
 */

// Chaves da IfthenPay para os diferentes métodos de pagamento
const IFTHENPAY_KEYS = {
    multibanco: "BXG-350883",
    mbway: "UWP-547025",
    payshop: "QTU-066969"
};

// Endpoint da API de pagamento
const PAYMENT_API_ENDPOINT = "https://share2inspire-beckend.lm.r.appspot.com/api/payment/initiate";

/**
 * Processa um pagamento através da API da IfthenPay
 * @param {Object} formData - Dados do formulário
 * @param {string} paymentMethod - Método de pagamento (multibanco, mbway, payshop)
 * @param {number} amount - Valor do pagamento
 * @returns {Promise} - Promise com o resultado da operação
 */
async function processPayment(formData, paymentMethod, amount) {
    try {
        // Normalizar o método de pagamento para o formato esperado pelo backend
        const normalizedMethod = getPaymentMethodFormat(paymentMethod);
        
        // Preparar os dados para envio
        const paymentData = {
            service: formData.service || 'Serviço Share2Inspire',
            name: formData.name,
            email: formData.email,
            phone: normalizedMethod === 'mbway' ? formatPhoneForMBWay(formData.phone) : formData.phone,
            date: formData.date || '',
            amount: amount,
            // Usar o formato correto para o método de pagamento
            payment_method: normalizedMethod
        };

        console.log("Enviando dados para o backend:", paymentData);

        // Fazer a chamada à API
        const response = await fetch(PAYMENT_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });

        // Processar a resposta
        let responseData;
        try {
            responseData = await response.json();
        } catch (error) {
            console.error("Erro ao processar resposta JSON:", error);
            throw new Error(`Erro na resposta do servidor: ${response.status} ${response.statusText}`);
        }
        
        console.log("Resposta do servidor:", response.status);
        console.log("Detalhes completos da resposta:", responseData);

        // Verificar se a resposta foi bem-sucedida
        if (!response.ok) {
            throw new Error(`Erro na resposta do servidor: ${response.status} ${JSON.stringify(responseData)}`);
        }

        // Verificar se o backend reportou sucesso
        if (!responseData.success) {
            throw new Error(`Erro reportado pelo backend: ${responseData.error || 'Erro desconhecido'}`);
        }

        return responseData;
    } catch (error) {
        console.error("Erro ao processar pagamento:", error);
        throw error;
    }
}

/**
 * Converte o método de pagamento para o formato esperado pelo backend
 * @param {string} method - Método de pagamento original
 * @returns {string} - Método de pagamento normalizado
 */
function getPaymentMethodFormat(method) {
    if (!method) return 'multibanco';
    
    method = method.toLowerCase();
    
    // Mapeamento de valores para o formato esperado pelo backend
    const methodMap = {
        'mb': 'multibanco',
        'multibanco': 'multibanco',
        'mbway': 'mbway',
        'payshop': 'payshop'
    };
    
    return methodMap[method] || 'multibanco';
}

/**
 * Formata o número de telefone para o formato esperado pelo MB WAY
 * @param {string} phone - Número de telefone
 * @returns {string} - Número formatado
 */
function formatPhoneForMBWay(phone) {
    // Remover espaços, traços e outros caracteres não numéricos
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Verificar se já tem o prefixo 351
    if (!cleanPhone.startsWith('351')) {
        // Se o número começar com 9, adicionar o prefixo 351
        if (cleanPhone.startsWith('9')) {
            cleanPhone = '351' + cleanPhone;
        }
    }
    
    return cleanPhone;
}

/**
 * Exibe as informações de pagamento após o processamento bem-sucedido
 * @param {Object} paymentData - Dados do pagamento retornados pela API
 * @param {string} paymentMethod - Método de pagamento utilizado
 * @param {Element} container - Elemento onde exibir as informações
 */
function displayPaymentInfo(paymentData, paymentMethod, container) {
    // Limpar conteúdo anterior
    container.innerHTML = '';
    
    // Verificar se o pagamento foi realmente processado com sucesso
    if (!paymentData || !paymentData.success) {
        displayPaymentError(new Error("Pagamento não processado corretamente pelo backend"), container);
        return;
    }
    
    // Normalizar o método de pagamento
    const normalizedMethod = getPaymentMethodFormat(paymentMethod);
    
    // Criar elemento para exibir as informações
    const paymentInfo = document.createElement('div');
    paymentInfo.className = 'alert alert-success';
    
    // Conteúdo específico para cada método de pagamento
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
            <p><strong>Número:</strong> ${paymentData.phone || ''}</p>
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
    
    // Adicionar ao container
    container.appendChild(paymentInfo);
}

/**
 * Exibe mensagem de erro em caso de falha no processamento do pagamento
 * @param {Error} error - Erro ocorrido
 * @param {Element} container - Elemento onde exibir a mensagem
 */
function displayPaymentError(error, container) {
    // Limpar conteúdo anterior
    container.innerHTML = '';
    
    // Criar elemento para exibir o erro
    const errorInfo = document.createElement('div');
    errorInfo.className = 'alert alert-danger';
    errorInfo.innerHTML = `
        <p>Erro ao processar pedido: ${error.message}</p>
        <p>Por favor tente novamente ou contacte-nos diretamente.</p>
    `;
    
    // Adicionar ao container
    container.appendChild(errorInfo);
}

// Exportar funções para uso em outros módulos
window.IfthenPayIntegration = {
    processPayment,
    displayPaymentInfo,
    displayPaymentError,
    IFTHENPAY_KEYS
};
