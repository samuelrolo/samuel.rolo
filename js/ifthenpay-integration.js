/**
 * Integração Ifthenpay - Share2Inspire - VERSÃO FINAL CORRIGIDA
 * TODAS AS CORREÇÕES IMPLEMENTADAS:
 * - Acesso correto às propriedades da resposta (entity, reference)
 * - Tratamento de erros melhorado
 * - Logs detalhados para debug
 * - Validações robustas
 * - Formatação correta de dados
 */

// Configuração global da integração Ifthenpay
window.ifthenpayIntegration = {
    // URLs do backend
    endpoints: {
        mbway: 'https://share2inspire-beckend.lm.r.appspot.com/api/payment/mbway',
        multibanco: 'https://share2inspire-beckend.lm.r.appspot.com/api/payment/multibanco',
        payshop: 'https://share2inspire-beckend.lm.r.appspot.com/api/payment/payshop',
        callback: 'https://share2inspire-beckend.lm.r.appspot.com/api/payment/callback',
        health: 'https://share2inspire-beckend.lm.r.appspot.com/api/payment/health'
    },

    backendUrl: 'https://share2inspire-beckend.lm.r.appspot.com',

    /**
     * Processar pagamento conforme método selecionado
     */
    async processPayment(method, paymentData) {
        console.log(`💳 [IFTHENPAY] Processando pagamento ${method.toUpperCase()}:`, paymentData);

        try {
            // Validar dados básicos
            this.validatePaymentData(paymentData, method);

            switch (method) {
                case 'mbway':
                    return await this.processMbWayPayment(paymentData);
                case 'multibanco':
                    return await this.processMultibancoPayment(paymentData);
                case 'payshop':
                    return await this.processPayshopPayment(paymentData);
                default:
                    throw new Error(`Método de pagamento não suportado: ${method}`);
            }
        } catch (error) {
            console.error(`❌ [IFTHENPAY] Erro no pagamento ${method}:`, error);
            return {
                success: false,
                message: `Erro no processamento ${method}: ${error.message}`
            };
        }
    },

    /**
     * Processar pagamento MB WAY - CORRIGIDO
     */
    async processMbWayPayment(data) {
        console.log('📱 [MB WAY] Processando pagamento...');

        // Preparar payload para o backend
        const payload = {
            orderId: data.orderId || `MBWAY-${Date.now()}`,
            amount: this.formatAmount(data.amount),
            mobileNumber: this.formatMobileNumber(data.mobileNumber),
            customerName: data.customerName || data.name,
            customerEmail: data.customerEmail || data.email,
            description: data.description || 'Pagamento Share2Inspire'
        };

        console.log('📤 [MB WAY] Payload:', payload);

        try {
            const response = await this.callBackendEndpoint('mbway', payload);
            console.log('📥 [MB WAY] Resposta completa:', response);

            if (response.success) {
                return {
                    success: true,
                    message: response.message || 'Pedido MB WAY enviado! Confirme no seu telemóvel.',
                    data: {
                        orderId: payload.orderId,
                        amount: payload.amount,
                        mobileNumber: payload.mobileNumber,
                        status: response.status || 'pending',
                        method: 'mbway',
                        // CORREÇÃO: Aceder às propriedades diretamente da resposta
                        requestId: response.requestId,
                        transactionId: response.requestId
                    }
                };
            } else {
                throw new Error(response.error || 'Erro no processamento MB WAY');
            }

        } catch (error) {
            console.error('❌ [MB WAY] Erro:', error);
            return {
                success: false,
                message: `Erro MB WAY: ${error.message}`
            };
        }
    },

    /**
     * Processar pagamento Multibanco - CORRIGIDO
     */
    async processMultibancoPayment(data) {
        console.log('🏧 [MULTIBANCO] Processando pagamento...');

        // Preparar payload para o backend
        const payload = {
            orderId: data.orderId || `MB-${Date.now()}`,
            amount: this.formatAmount(data.amount),
            customerName: data.customerName || data.name,
            customerEmail: data.customerEmail || data.email,
            description: data.description || 'Pagamento Share2Inspire'
        };

        console.log('📤 [MULTIBANCO] Payload:', payload);

        try {
            const response = await this.callBackendEndpoint('multibanco', payload);
            console.log('📥 [MULTIBANCO] Resposta completa:', response);

            if (response.success) {
                // CORREÇÃO PRINCIPAL: Verificar se entity e reference existem
                if (!response.entity || !response.reference) {
                    console.error('❌ [MULTIBANCO] Resposta sem entity/reference:', response);
                    throw new Error('Resposta inválida do servidor - dados de pagamento em falta');
                }

                return {
                    success: true,
                    message: response.message || 'Referência Multibanco gerada com sucesso',
                    data: {
                        orderId: payload.orderId,
                        amount: payload.amount,
                        // CORREÇÃO: Aceder às propriedades diretamente da resposta
                        entity: response.entity,
                        reference: response.reference,
                        status: response.status || 'pending',
                        method: 'multibanco',
                        requestId: response.requestId,
                        orderIdResponse: response.orderId
                    }
                };
            } else {
                throw new Error(response.error || 'Erro no processamento Multibanco');
            }

        } catch (error) {
            console.error('❌ [MULTIBANCO] Erro:', error);
            return {
                success: false,
                message: `Erro Multibanco: ${error.message}`
            };
        }
    },

    /**
     * Processar pagamento Payshop - CORRIGIDO
     */
    async processPayshopPayment(data) {
        console.log('🏪 [PAYSHOP] Processando pagamento...');

        // Preparar payload para o backend
        const payload = {
            orderId: data.orderId || `PS-${Date.now()}`,
            amount: this.formatAmount(data.amount),
            customerName: data.customerName || data.name,
            customerEmail: data.customerEmail || data.email,
            description: data.description || 'Pagamento Share2Inspire'
        };

        console.log('📤 [PAYSHOP] Payload:', payload);

        try {
            const response = await this.callBackendEndpoint('payshop', payload);
            console.log('📥 [PAYSHOP] Resposta completa:', response);

            if (response.success) {
                return {
                    success: true,
                    message: response.message || 'Referência Payshop gerada com sucesso',
                    data: {
                        orderId: payload.orderId,
                        amount: payload.amount,
                        // CORREÇÃO: Aceder às propriedades diretamente da resposta
                        reference: response.reference,
                        validade: response.validade,
                        status: 'pending',
                        method: 'payshop',
                        requestId: response.requestId
                    }
                };
            } else {
                throw new Error(response.error || 'Erro no processamento Payshop');
            }

        } catch (error) {
            console.error('❌ [PAYSHOP] Erro:', error);
            return {
                success: false,
                message: `Erro Payshop: ${error.message}`
            };
        }
    },

    /**
     * Chamar endpoint do backend - MELHORADO
     */
    async callBackendEndpoint(method, payload) {
        const url = this.endpoints[method];

        console.log(`🔗 [${method.toUpperCase()}] Chamando: ${url}`);
        console.log(`📤 [${method.toUpperCase()}] Dados enviados:`, payload);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            console.log(`📡 [${method.toUpperCase()}] Status HTTP: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ [${method.toUpperCase()}] Erro HTTP ${response.status}:`, errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            console.log(`📥 [${method.toUpperCase()}] Resposta JSON:`, result);
            return result;

        } catch (error) {
            console.error(`❌ [${method.toUpperCase()}] Erro na chamada:`, error);
            throw error;
        }
    },

    /**
     * Verificar status de saúde do serviço
     */
    async checkHealth() {
        try {
            const response = await fetch(this.endpoints.health);
            const result = await response.json();

            console.log('🏥 [HEALTH] Status Ifthenpay:', result);
            return result;

        } catch (error) {
            console.error('❌ [HEALTH] Erro no health check:', error);
            return {
                service: 'ifthenpay',
                status: 'unhealthy',
                error: error.message
            };
        }
    },

    /**
     * Validar dados de pagamento - MELHORADO
     */
    validatePaymentData(data, method) {
        console.log(`🔍 [VALIDATION] Validando dados para ${method}:`, data);

        // Validações comuns
        if (!data.amount || parseFloat(data.amount) <= 0) {
            throw new Error('Valor inválido ou em falta');
        }

        if (!data.customerName && !data.name) {
            throw new Error('Nome do cliente obrigatório');
        }

        if (!data.customerEmail && !data.email) {
            throw new Error('Email do cliente obrigatório');
        }

        // Validações específicas por método
        if (method === 'mbway') {
            if (!data.mobileNumber) {
                throw new Error('Número de telemóvel obrigatório para MB WAY');
            }

            const cleanPhone = data.mobileNumber.replace(/\D/g, '');
            if (cleanPhone.length < 9) {
                throw new Error('Número de telemóvel inválido');
            }
        }

        console.log('✅ [VALIDATION] Dados válidos');
        return true;
    },

    /**
     * Formatar valor para APIs Ifthenpay
     */
    formatAmount(amount) {
        if (typeof amount === 'string') {
            // Remover caracteres não numéricos exceto ponto
            amount = amount.replace(/[^\d.]/g, '');
        }

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount)) {
            throw new Error('Valor inválido');
        }

        // Garantir 2 casas decimais
        return numAmount.toFixed(2);
    },

    /**
     * Formatar número de telemóvel - MELHORADO
     */
    formatMobileNumber(phone) {
        if (!phone) return '';

        console.log(`📱 [FORMAT] Formatando telefone: ${phone}`);

        // Remover todos os caracteres não numéricos
        const cleaned = phone.replace(/\D/g, '');
        console.log(`📱 [FORMAT] Telefone limpo: ${cleaned}`);

        let formatted;

        // Adicionar código do país se necessário
        if (cleaned.startsWith('351')) {
            formatted = cleaned;
        } else if (cleaned.startsWith('9') && cleaned.length === 9) {
            formatted = `351${cleaned}`;
        } else if (cleaned.length === 9) {
            formatted = `351${cleaned}`;
        } else {
            formatted = `351${cleaned}`;
        }

        console.log(`📱 [FORMAT] Telefone formatado: ${formatted}`);
        return formatted;
    },

    /**
     * Formatar número de telemóvel para exibição
     */
    formatMobileNumberDisplay(phone) {
        if (!phone) return '';

        const cleaned = phone.replace(/\D/g, '');

        if (cleaned.startsWith('351')) {
            const number = cleaned.substring(3);
            return `+351 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
        } else {
            return `+351 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
        }
    },

    /**
     * Gerar ID único para transação
     */
    generateOrderId(method, customerName) {
        const timestamp = Date.now();
        const customerInitials = customerName ? customerName.split(' ').map(n => n[0]).join('').toUpperCase() : 'XX';
        return `${method.toUpperCase()}-${customerInitials}-${timestamp}`;
    },

    /**
     * Processar callback de pagamento (para uso futuro)
     */
    handlePaymentCallback(callbackData) {
        console.log('📞 [CALLBACK] Callback recebido:', callbackData);

        if (callbackData.status === 'paid') {
            console.log('✅ [CALLBACK] Pagamento confirmado!');
            // Disparar evento personalizado
            window.dispatchEvent(new CustomEvent('paymentConfirmed', {
                detail: callbackData
            }));
        }
    }
};

// Event listeners para callbacks de pagamento
window.addEventListener('paymentConfirmed', function (event) {
    console.log('🎉 [EVENT] Pagamento confirmado via callback:', event.detail);
});

// Inicialização
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 [INIT] Ifthenpay Integration - VERSÃO FINAL CORRIGIDA - Carregada');
    console.log('💳 [INIT] Métodos suportados: MB WAY, Multibanco, Payshop');
    console.log('🔗 [INIT] Backend URL:', window.ifthenpayIntegration.backendUrl);

    // Verificar status de saúde do serviço
    window.ifthenpayIntegration.checkHealth();
});

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.ifthenpayIntegration;
}

