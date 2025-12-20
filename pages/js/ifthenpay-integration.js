/**
 * Integração Ifthenpay - Share2Inspire
 * Configurada para o backend Share2Inspire (App Engine)
 */

window.ifthenpayIntegration = {
    // URLs do backend Share2Inspire
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
     * Processar pagamento MB WAY
     */
    async processMbWayPayment(data) {
        console.log('📱 [MB WAY] Processando pagamento...');

        const payload = {
            orderId: data.orderId || `MBWAY-${Date.now()}`,
            amount: this.formatAmount(data.amount),
            mobileNumber: this.formatMobileNumber(data.mobileNumber),
            customerName: data.customerName || data.name,
            customerEmail: data.customerEmail || data.email,
            description: data.description || 'Pagamento Share2Inspire'
        };

        try {
            const response = await this.callBackendEndpoint('mbway', payload);
            console.log('📥 [MB WAY] Resposta:', response);

            if (response.success) {
                return {
                    success: true,
                    message: response.message || 'Pedido MB WAY enviado!',
                    data: {
                        ...payload,
                        requestId: response.requestId,
                        status: response.status || 'pending'
                    }
                };
            } else {
                throw new Error(response.error || 'Erro no processamento MB WAY');
            }
        } catch (error) {
            throw error;
        }
    },

    /**
     * Processar pagamento Multibanco
     */
    async processMultibancoPayment(data) {
        console.log('🏧 [MULTIBANCO] Processando pagamento...');

        const payload = {
            orderId: data.orderId || `MB-${Date.now()}`,
            amount: this.formatAmount(data.amount),
            customerName: data.customerName || data.name,
            customerEmail: data.customerEmail || data.email,
            description: data.description || 'Pagamento Share2Inspire'
        };

        try {
            const response = await this.callBackendEndpoint('multibanco', payload);

            if (response.success) {
                return {
                    success: true,
                    message: 'Referência Multibanco gerada!',
                    data: {
                        entity: response.entity,
                        reference: response.reference,
                        amount: response.amount,
                        orderId: response.orderId,
                        expiryDate: response.expiryDate
                    }
                };
            } else {
                throw new Error(response.error || 'Erro ao gerar referência Multibanco');
            }
        } catch (error) {
            throw error;
        }
    },

    /**
     * Helper: Chamar Endpoint
     */
    async callBackendEndpoint(endpointKey, payload) {
        const url = this.endpoints[endpointKey];
        if (!url) throw new Error(`Endpoint não configurado: ${endpointKey}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
        }

        return await response.json();
    },

    /**
     * Helper: Validar Dados
     */
    validatePaymentData(data, method) {
        if (!data.amount) throw new Error('Valor do pagamento em falta');
        if (!data.email) throw new Error('Email do cliente em falta');

        if (method === 'mbway' && !data.mobileNumber) {
            throw new Error('Número de telemóvel obrigatório para MB WAY');
        }
    },

    /**
     * Helper: Formatar Valor
     */
    formatAmount(amount) {
        return parseFloat(amount).toFixed(2);
    },

    /**
     * Helper: Formatar Telemóvel
     */
    formatMobileNumber(phone) {
        const clean = String(phone).replace(/\D/g, '');
        if (clean.length === 9) return '351' + clean;
        return clean;
    }
};
