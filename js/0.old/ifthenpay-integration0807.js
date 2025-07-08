/**
 * Integração Ifthenpay - Share2Inspire - CORRIGIDO
 * URLs CORRIGIDAS com /api/ - Junho 2025
 * Implementação completa: MB WAY, Multibanco, Payshop
 * CORREÇÃO: Acesso correto às propriedades da resposta
 */

// Configuração global da integração Ifthenpay
window.ifthenpayIntegration = {
    // URLs CORRIGIDAS para usar o backend como proxy com /api/
    endpoints: {
        mbway: 'https://share2inspire-beckend.lm.r.appspot.com/api/ifthenpay/mbway',
        multibanco: 'https://share2inspire-beckend.lm.r.appspot.com/api/ifthenpay/multibanco',
        payshop: 'https://share2inspire-beckend.lm.r.appspot.com/api/ifthenpay/payshop',
        callback: 'https://share2inspire-beckend.lm.r.appspot.com/api/ifthenpay/callback',
        health: 'https://share2inspire-beckend.lm.r.appspot.com/api/ifthenpay/health'
    },

    // Backend URL corrigida
    backendUrl: 'https://share2inspire-beckend.lm.r.appspot.com',

    /**
     * Processar pagamento conforme método selecionado
     */
    async processPayment(method, paymentData) {
        console.log(`💳 Processando pagamento ${method.toUpperCase()}:`, paymentData);
        
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
            console.error(`❌ Erro no pagamento ${method}:`, error);
            return {
                success: false,
                message: `Erro no processamento ${method}: ${error.message}`
            };
        }
    },

    /**
     * Processar pagamento MB WAY
     */
    async processMbWayPayment(data) {
        console.log('📱 Processando MB WAY...');
        
        // Preparar payload para o backend
        const payload = {
            orderId: data.orderId || `MBWAY-${Date.now()}`,
            amount: this.formatAmount(data.amount),
            mobileNumber: this.formatMobileNumber(data.mobileNumber),
            customerName: data.customerName || data.name,
            customerEmail: data.customerEmail || data.email,
            description: data.description || 'Pagamento Share2Inspire'
        };

        console.log('📤 Payload MB WAY:', payload);

        try {
            const response = await this.callBackendEndpoint('mbway', payload);
            
            if (response.success) {
                return {
                    success: true,
                    message: response.message || 'Pedido MB WAY enviado! Confirme no seu telemóvel.',
                    data: {
                        orderId: payload.orderId,
                        amount: payload.amount,
                        mobileNumber: payload.mobileNumber,
                        status: 'pending',
                        method: 'mbway',
                        // CORREÇÃO: Aceder às propriedades diretamente da resposta
                        requestId: response.requestId,
                        transactionId: response.transaction_id
                    }
                };
            } else {
                throw new Error(response.error || 'Erro no processamento MB WAY');
            }

        } catch (error) {
            console.error('❌ Erro MB WAY:', error);
            return {
                success: false,
                message: `Erro MB WAY: ${error.message}`
            };
        }
    },

    /**
     * Processar pagamento Multibanco
     */
    async processMultibancoPayment(data) {
        console.log('🏧 Processando Multibanco...');
        
        // Preparar payload para o backend
        const payload = {
            orderId: data.orderId || `MB-${Date.now()}`,
            amount: this.formatAmount(data.amount),
            customerName: data.customerName || data.name,
            customerEmail: data.customerEmail || data.email,
            description: data.description || 'Pagamento Share2Inspire'
        };

        console.log('📤 Payload Multibanco:', payload);

        try {
            const response = await this.callBackendEndpoint('multibanco', payload);
            console.log('📥 Resposta Multibanco:', response);
            
            if (response.success) {
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
            console.error('❌ Erro Multibanco:', error);
            return {
                success: false,
                message: `Erro Multibanco: ${error.message}`
            };
        }
    },

    /**
     * Processar pagamento Payshop
     */
    async processPayshopPayment(data) {
        console.log('🏪 Processando Payshop...');
        
        // Preparar payload para o backend
        const payload = {
            orderId: data.orderId || `PS-${Date.now()}`,
            amount: this.formatAmount(data.amount),
            customerName: data.customerName || data.name,
            customerEmail: data.customerEmail || data.email,
            description: data.description || 'Pagamento Share2Inspire'
        };

        console.log('📤 Payload Payshop:', payload);

        try {
            const response = await this.callBackendEndpoint('payshop', payload);
            
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
            console.error('❌ Erro Payshop:', error);
            return {
                success: false,
                message: `Erro Payshop: ${error.message}`
            };
        }
    },

    /**
     * Chamar endpoint do backend
     */
    async callBackendEndpoint(method, payload) {
        const url = this.endpoints[method];
        
        console.log(`🔗 Chamando: ${url}`);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`📥 Resposta ${method}:`, result);
        return result;
    },

    /**
     * Verificar status de saúde do serviço
     */
    async checkHealth() {
        try {
            const response = await fetch(this.endpoints.health);
            const result = await response.json();
            
            console.log('🏥 Status Ifthenpay:', result);
            return result;
            
        } catch (error) {
            console.error('❌ Erro no health check:', error);
            return {
                service: 'ifthenpay',
                status: 'unhealthy',
                error: error.message
            };
        }
    },

    /**
     * Validar dados de pagamento
     */
    validatePaymentData(data, method) {
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
     * Formatar número de telemóvel
     */
    formatMobileNumber(phone) {
        if (!phone) return '';
        
        // Remover todos os caracteres não numéricos
        const cleaned = phone.replace(/\D/g, '');
        
        // Adicionar código do país se necessário
        if (cleaned.startsWith('351')) {
            return cleaned;
        } else if (cleaned.startsWith('9') && cleaned.length === 9) {
            return `351${cleaned}`;
        } else {
            return `351${cleaned}`;
        }
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
        console.log('📞 Callback recebido:', callbackData);
        
        // Aqui pode implementar lógica para processar callbacks
        // Por exemplo, atualizar UI, enviar confirmações, etc.
        
        if (callbackData.status === 'paid') {
            console.log('✅ Pagamento confirmado!');
            // Disparar evento personalizado
            window.dispatchEvent(new CustomEvent('paymentConfirmed', {
                detail: callbackData
            }));
        }
    }
};

// Event listeners para callbacks de pagamento
window.addEventListener('paymentConfirmed', function(event) {
    console.log('🎉 Pagamento confirmado via callback:', event.detail);
    // Aqui pode adicionar lógica para mostrar mensagem de sucesso, redirecionar, etc.
});

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Ifthenpay Integration - URLs CORRIGIDAS - Carregada');
    console.log('💳 Métodos suportados: MB WAY, Multibanco, Payshop');
    console.log('🔗 Backend URL:', window.ifthenpayIntegration.backendUrl);
    
    // Verificar status de saúde do serviço
    window.ifthenpayIntegration.checkHealth();
});

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.ifthenpayIntegration;
}

