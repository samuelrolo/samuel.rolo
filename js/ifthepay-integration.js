/**
 * Integração com SDK oficial da Ifthenpay para processamento de pagamentos - Share2Inspire
 */

import { Ifthenpay, Multibanco, MBWay, Payshop } from 'ifthenpay-node';

document.addEventListener('DOMContentLoaded', function() {
    initIfthenpaySDK();
});

/**
 * Inicializa o SDK da Ifthenpay
 */
function initIfthenpaySDK() {
    console.log('Inicializando SDK oficial da Ifthenpay');
    
    // Configuração do SDK - idealmente, estas chaves devem ser obtidas do backend
    const IFTHENPAY_API_KEY = '3532-9893-7426-5310';
    const IFTHENPAY_MBWAY_KEY = 'UWP-547025';
    const IFTHENPAY_MULTIBANCO_ENTITY = 'BXG';
    const IFTHENPAY_MULTIBANCO_SUBENTITY = '350883';
    const IFTHENPAY_PAYSHOP_KEY = 'QTU-066969';
    
    // Criar instância principal
    const ifthenpay = new Ifthenpay(IFTHENPAY_API_KEY);
    
    // Criar instâncias dos métodos de pagamento
    const multibanco = new Multibanco(ifthenpay, IFTHENPAY_MULTIBANCO_ENTITY, IFTHENPAY_MULTIBANCO_SUBENTITY);
    const mbway = new MBWay(ifthenpay, IFTHENPAY_MBWAY_KEY);
    const payshop = new Payshop(ifthenpay, IFTHENPAY_PAYSHOP_KEY);
    
    // Expor funções para uso externo
    window.ifthenpaySDK = {
        processPayment,
        validatePaymentForm,
        showPaymentDetails,
        checkPaymentStatus
    };
    
    /**
     * Processa pagamento com Ifthenpay
     * @param {Object} data - Dados do pagamento
     * @returns {Promise} - Promise que resolve quando o pagamento é processado
     */
    function processPayment(data) {
        const method = data.paymentMethod || 'mb';
        const amount = parseFloat(data.amount) || 0;
        const orderId = data.orderId || `ORD${Date.now()}`;
        
        console.log('Processando pagamento via SDK Ifthenpay:', { method, amount, orderId });
        
        switch(method) {
            case 'mb':
            case 'multibanco':
                return multibanco.generateReference(orderId, amount)
                    .then(response => {
                        console.log('Referência Multibanco gerada:', response);
                        return {
                            success: true,
                            paymentMethod: 'mb',
                            entity: response.Entity,
                            reference: response.Reference,
                            amount: amount,
                            orderId: orderId
                        };
                    });
                
            case 'mbway':
                const phone = data.customerPhone || data.phone;
                if (!phone) {
                    return Promise.reject(new Error('Número de telefone não fornecido para pagamento MB WAY'));
                }
                
                return mbway.generatePayment(orderId, amount, phone)
                    .then(response => {
                        console.log('Pagamento MB WAY gerado:', response);
                        return {
                            success: true,
                            paymentMethod: 'mbway',
                            phone: phone,
                            amount: amount,
                            reference: response.Reference,
                            orderId: orderId
                        };
                    });
                
            case 'payshop':
                return payshop.generateReference(orderId, amount)
                    .then(response => {
                        console.log('Referência Payshop gerada:', response);
                        return {
                            success: true,
                            paymentMethod: 'payshop',
                            reference: response.Reference,
                            amount: amount,
                            orderId: orderId
                        };
                    });
                
            default:
                return Promise.reject(new Error(`Método de pagamento não suportado: ${method}`));
        }
    }
    
    /**
     * Verifica o status de um pagamento
     * @param {string} orderId - ID do pedido
     * @returns {Promise} - Promise que resolve com o status do pagamento
     */
    function checkPaymentStatus(orderId) {
        if (!orderId) {
            return Promise.reject(new Error('ID do pedido não fornecido'));
        }
        
        return ifthenpay.checkPaymentStatus(orderId)
            .then(status => {
                console.log('Status do pagamento:', status);
                return status;
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
}
