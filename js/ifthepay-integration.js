/**
 * Integração com Ifthenpay para processamento de pagamentos - Share2Inspire
 * Versão corrigida para compatibilidade com navegador
 */

// Remover importações ES6 que não funcionam diretamente no navegador
// import { Ifthenpay, Multibanco, MBWay, Payshop } from 'ifthenpay-node';

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar o SDK da Ifthenpay
    initIfthenpaySDK();
    
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
 * Inicializa o SDK da Ifthenpay
 */
function initIfthenpaySDK() {
    console.log('Inicializando integração com Ifthenpay');
    
    // Remover configuração direta do SDK que usa process.env
    // const IFTHENPAY_API_KEY = process.env.IFTHENPAY_API_KEY;
    // const IFTHENPAY_MBWAY_KEY = process.env.IFTHENPAY_MBWAY_KEY;
    // const IFTHENPAY_MULTIBANCO_ENTITY = process.env.IFTHENPAY_MULTIBANCO_ENTITY;
    // const IFTHENPAY_MULTIBANCO_SUBENTITY = process.env.IFTHENPAY_MULTIBANCO_SUBENTITY;
    // const IFTHENPAY_PAYSHOP_KEY = process.env.IFTHENPAY_PAYSHOP_KEY;
    // const BREVO_API_KEY = process.env.BREVO_API_KEY;
    
    // Em vez disso, expor funções que chamam o backend
    window.ifthenpaySDK = {
        processPayment: processPaymentViaBackend,
        validatePaymentForm,
        showPaymentDetails,
        checkPaymentStatus: checkPaymentStatusViaBackend
    };
}

/**
 * Processa pagamento via backend
 * @param {Object} data - Dados do pagamento
 * @returns {Promise} - Promise que resolve quando o pagamento é processado
 */
function processPaymentViaBackend(data) {
    const method = data.paymentMethod || 'mb';
    const amount = parseFloat(data.amount) || 0;
    const orderId = data.orderId || `ORD${Date.now()}`;
    
    console.log('Processando pagamento via backend:', { method, amount, orderId });
    
    // Chamar o backend para processar o pagamento
    return fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/initiate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://share2inspire.pt',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            ...data,
            paymentMethod: method,
            amount: amount,
            orderId: orderId
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao processar pagamento: ' + response.status);
        }
        return response.json();
    })
    .then(responseData => {
        console.log('Resposta do backend:', responseData);
        return responseData;
    })
    .catch(error => {
        console.error('Erro ao processar pagamento:', error);
        throw error;
    });
}

/**
 * Verifica o status de um pagamento via backend
 * @param {string} orderId - ID do pedido
 * @returns {Promise} - Promise que resolve com o status do pagamento
 */
function checkPaymentStatusViaBackend(orderId) {
    if (!orderId) {
        return Promise.reject(new Error('ID do pedido não fornecido'));
    }
    
    return fetch(`https://share2inspire-beckend.lm.r.appspot.com/api/payment/status/${orderId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://share2inspire.pt',
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao verificar status do pagamento: ' + response.status);
        }
        return response.json();
    })
    .then(status => {
        console.log('Status do pagamento:', status);
        return status;
    })
    .catch(error => {
        console.error('Erro ao verificar status do pagamento:', error);
        throw error;
    });
}

/**
 * Exibe os detalhes do pagamento
 * @param {Object} paymentData - Dados do pagamento
 * @param {HTMLElement} container - Elemento onde exibir os detalhes
 * @returns {void}
 */
function showPaymentDetails(paymentData, container) {
    if (!container) {
        console.error('Container não fornecido para exibição dos detalhes de pagamento');
        return;
    }
    
    console.log('Exibindo detalhes do pagamento:', paymentData);
    
    // Verificar se a resposta indica sucesso
    const isSuccess = paymentData.success || paymentData.status === 'success';
    
    if (!isSuccess) {
        container.innerHTML = `
            <div class="alert alert-danger">
                ${paymentData.message || paymentData.error || 'Erro ao processar pagamento. Por favor tente novamente.'}
            </div>
        `;
        return;
    }
    
    // Determinar o método de pagamento
    const paymentMethod = paymentData.paymentMethod || 'mb';
    
    // Exibir detalhes de acordo com o método de pagamento
    if (paymentMethod === 'mbway') {
        container.innerHTML = `
            <div class="alert alert-success">
                <h5>Pagamento MB WAY</h5>
                <p><strong>Número:</strong> ${paymentData.phone || ''}</p>
                <p><strong>Valor:</strong> ${paymentData.amount || '0.00'}€</p>
                <p>Foi enviado um pedido de pagamento para o seu número MB WAY.</p>
                <p>Por favor, aceite o pagamento na aplicação MB WAY.</p>
            </div>
        `;
    } else if (paymentMethod === 'mb' || paymentMethod === 'multibanco') {
        // Garantir que os campos entity, reference e amount existem, mesmo que vazios
        const entity = paymentData.entity || paymentData.Entity || '';
        const reference = paymentData.reference || paymentData.Reference || '';
        const amount = paymentData.amount || paymentData.Amount || '0.00';
        
        container.innerHTML = `
            <div class="alert alert-success">
                <h5>Pagamento por Referência Multibanco</h5>
                <p><strong>Entidade:</strong> ${entity}</p>
                <p><strong>Referência:</strong> ${reference}</p>
                <p><strong>Valor:</strong> ${amount}€</p>
                <p>A referência é válida por 48 horas.</p>
            </div>
        `;
    } else if (paymentMethod === 'payshop') {
        // Mostrar informações de pagamento Payshop
        const reference = paymentData.reference || paymentData.Reference || '';
        const amount = paymentData.amount || paymentData.Amount || '0.00';
        
        container.innerHTML = `
            <div class="alert alert-success">
                <h5>Pagamento por Referência Payshop</h5>
                <p><strong>Referência:</strong> ${reference}</p>
                <p><strong>Valor:</strong> ${amount}€</p>
                <p>A referência é válida por 48 horas.</p>
            </div>
        `;
    } else {
        // Mensagem genérica de sucesso
        container.innerHTML = `
            <div class="alert alert-success">
                <h5>Pagamento Processado com Sucesso!</h5>
                <p>Obrigado pela sua compra. Receberá um email com os detalhes do pagamento.</p>
                <p><strong>Valor:</strong> ${paymentData.amount || '0.00'}€</p>
            </div>
        `;
    }
}

/**
 * Valida formulário de pagamento
 * @param {HTMLFormElement} form - Formulário a validar
 * @returns {boolean} - Se o formulário é válido
 */
function validatePaymentForm(form) {
    if (!form) return false;
    
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    // Limpar mensagens de erro anteriores
    form.querySelectorAll('.error-message').forEach(el => el.remove());
    
    // Verificar campos obrigatórios
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            showFieldError(field, 'Este campo é obrigatório');
        }
    });
    
    // Verificar formato de email
    const emailField = form.querySelector('input[type="email"]');
    if (emailField && emailField.value.trim() && !validateEmail(emailField.value)) {
        isValid = false;
        showFieldError(emailField, 'Por favor, insira um email válido');
    }
    
    return isValid;
}

/**
 * Mostra erro em campo de formulário
 * @param {HTMLElement} field - Campo com erro
 * @param {string} message - Mensagem de erro
 */
function showFieldError(field, message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message text-danger small mt-1';
    errorElement.textContent = message;
    field.parentNode.appendChild(errorElement);
}

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} - Se o email é válido
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}
