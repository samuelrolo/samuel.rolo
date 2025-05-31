/**
 * Integração com a API da IfthenPay - Share2Inspire
 * 
 * Este ficheiro contém o código para integração com a API da IfthenPay
 * para processamento de pagamentos via Multibanco, MB WAY e Payshop
 */

// Namespace para a integração com a IfthenPay
window.ifthenpaySDK = (function() {
    // Configurações da API
    const API_BASE_URL = 'https://share2inspire-beckend.lm.r.appspot.com/api/payment';
    
    // Chaves da IfthenPay
    const MULTIBANCO_KEY = 'BXG-350883';
    const MBWAY_KEY = 'UWP-547025';
    const PAYSHOP_KEY = 'QTU-066969';
    
    /**
     * Inicia um pagamento
     * @param {Object} data - Dados do pagamento
     * @returns {Promise} - Promise com o resultado da operação
     */
    function initiatePayment(data) {
        console.log('Iniciando pagamento via IfthenPay:', data);
        
        // Garantir que temos o método de pagamento
        const paymentMethod = data.paymentMethod || 'mb';
        
        // Adicionar chaves específicas com base no método de pagamento
        if (paymentMethod === 'mb' || paymentMethod === 'multibanco') {
            data.mbKey = MULTIBANCO_KEY;
        } else if (paymentMethod === 'mbway') {
            data.mbwayKey = MBWAY_KEY;
        } else if (paymentMethod === 'payshop') {
            data.payshopKey = PAYSHOP_KEY;
        }
        
        // Endpoint para iniciar pagamento
        const endpoint = `${API_BASE_URL}/initiate`;
        
        // Enviar dados para o backend
        return fetch(endpoint, {
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
                return response.text().then(text => {
                    console.error('Erro na resposta do servidor (IfthenPay):', response.status, text);
                    throw new Error('Erro na resposta do servidor (IfthenPay): ' + response.status);
                });
            }
            return response.json();
        })
        .then(responseData => {
            console.log('Pagamento iniciado com sucesso via IfthenPay:', responseData);
            return responseData;
        })
        .catch(error => {
            console.error('Erro ao iniciar pagamento via IfthenPay:', error);
            throw error;
        });
    }
    
    /**
     * Verifica o estado de um pagamento
     * @param {string} reference - Referência do pagamento
     * @param {string} method - Método de pagamento (mb, mbway, payshop)
     * @returns {Promise} - Promise com o resultado da operação
     */
    function checkPaymentStatus(reference, method = 'mb') {
        console.log(`Verificando estado do pagamento ${reference} via ${method}`);
        
        // Endpoint para verificar estado do pagamento
        const endpoint = `${API_BASE_URL}/status/${method}/${reference}`;
        
        // Enviar dados para o backend
        return fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://share2inspire.pt',
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('Erro na resposta do servidor (IfthenPay):', response.status, text);
                    throw new Error('Erro na resposta do servidor (IfthenPay): ' + response.status);
                });
            }
            return response.json();
        })
        .then(responseData => {
            console.log('Estado do pagamento verificado com sucesso:', responseData);
            return responseData;
        })
        .catch(error => {
            console.error('Erro ao verificar estado do pagamento:', error);
            throw error;
        });
    }
    
    // API pública
    return {
        initiatePayment,
        checkPaymentStatus
    };
})();

// Inicializar formulários com integração IfthenPay quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Configurar os formulários que precisam de pagamento
    // Nota: O formulário Kickstart Pro já é tratado no seu próprio script
    
    // Mostrar/ocultar campos específicos de MB WAY em todos os formulários
    const paymentMethodSelects = document.querySelectorAll('select[name="paymentMethod"]');
    
    paymentMethodSelects.forEach(select => {
        const form = select.closest('form');
        const mbwayFields = form.querySelector('.payment-method-fields');
        
        if (select && mbwayFields) {
            select.addEventListener('change', function() {
                if (this.value === 'mbway') {
                    mbwayFields.style.display = 'block';
                } else {
                    mbwayFields.style.display = 'none';
                }
            });
        }
    });
});
