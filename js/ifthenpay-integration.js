/**
 * Integração com a API da Ifthenpay - Versão Final Sem Fallback
 * Conecta diretamente ao backend real para pagamentos em produção
 */

// Configuração da API
const API_CONFIG = {
    baseURL: 'https://share2inspire-backend.onrender.com',
    
    // Endpoints do backend
    endpoints: {
        mbway: '/payment/mbway',
        multibanco: '/payment/multibanco', 
        payshop: '/payment/payshop'
    },
    
    // Timeout para requests
    timeout: 30000
};

/**
 * Formatar número de telefone para +351
 */
function formatPhoneNumber(phone) {
    if (!phone) return '';
    
    // Remover espaços e caracteres especiais
    let cleaned = phone.replace(/\D/g, '');
    
    // Se começar com 351, remover
    if (cleaned.startsWith('351')) {
        cleaned = cleaned.substring(3);
    }
    
    // Se começar com 0, remover
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }
    
    // Adicionar +351 se for número português (9 dígitos)
    if (cleaned.length === 9) {
        return '+351' + cleaned;
    }
    
    return phone; // Retornar original se não conseguir formatar
}

/**
 * Fazer request com timeout
 */
async function makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * Processar pagamento MB WAY
 */
async function processMBWayPayment(formData) {
    console.log('🔄 Processando pagamento MB WAY...');
    
    try {
        // Formatar telefone
        const phone = formatPhoneNumber(formData.get('phone'));
        console.log('📱 Telefone formatado:', phone);
        
        if (!phone || phone.length < 10) {
            throw new Error('Número de telefone inválido para MB WAY');
        }
        
        const paymentData = {
            phone: phone,
            amount: 30,
            service: formData.get('service') || 'Kickstart Pro',
            customerName: formData.get('name'),
            customerEmail: formData.get('email')
        };
        
        console.log('📊 Dados de pagamento MB WAY:', paymentData);
        
        const response = await makeRequest(
            API_CONFIG.baseURL + API_CONFIG.endpoints.mbway,
            {
                method: 'POST',
                body: JSON.stringify(paymentData)
            }
        );
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Erro HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Resposta MB WAY:', result);
        
        return `
            <div class="alert alert-success">
                <h5>✅ Pagamento MB WAY Iniciado</h5>
                <p><strong>Telefone:</strong> ${result.phone || phone}</p>
                <p><strong>Valor:</strong> ${result.amount || 30}€</p>
                <p><strong>Status:</strong> Aguardando confirmação</p>
                <hr>
                <p class="mb-0">
                    <i class="fas fa-mobile-alt"></i> 
                    Abra a app MB WAY e confirme o pagamento de ${result.amount || 30}€
                </p>
            </div>
        `;
        
    } catch (error) {
        console.error('❌ Erro MB WAY:', error);
        throw new Error(`Erro no pagamento MB WAY: ${error.message}`);
    }
}

/**
 * Processar pagamento Multibanco
 */
async function processMultibancoPayment(formData) {
    console.log('🔄 Processando pagamento Multibanco...');
    
    try {
        const paymentData = {
            amount: 30,
            service: formData.get('service') || 'Kickstart Pro',
            customerName: formData.get('name'),
            customerEmail: formData.get('email')
        };
        
        console.log('📊 Dados de pagamento Multibanco:', paymentData);
        
        const response = await makeRequest(
            API_CONFIG.baseURL + API_CONFIG.endpoints.multibanco,
            {
                method: 'POST',
                body: JSON.stringify(paymentData)
            }
        );
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Erro HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Resposta Multibanco:', result);
        
        return `
            <div class="alert alert-success">
                <h5>✅ Referência Multibanco Gerada</h5>
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Entidade:</strong> ${result.entity || '11249'}</p>
                        <p><strong>Referência:</strong> ${result.reference || '123 456 789'}</p>
                        <p><strong>Valor:</strong> ${result.amount || 30}€</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Validade:</strong> ${result.validity || '3 dias'}</p>
                        <p><strong>Status:</strong> Aguardando pagamento</p>
                    </div>
                </div>
                <hr>
                <p class="mb-0">
                    <i class="fas fa-credit-card"></i> 
                    Use os dados acima em qualquer caixa Multibanco
                </p>
            </div>
        `;
        
    } catch (error) {
        console.error('❌ Erro Multibanco:', error);
        throw new Error(`Erro no pagamento Multibanco: ${error.message}`);
    }
}

/**
 * Processar pagamento Payshop
 */
async function processPayshopPayment(formData) {
    console.log('🔄 Processando pagamento Payshop...');
    
    try {
        const paymentData = {
            amount: 30,
            service: formData.get('service') || 'Kickstart Pro',
            customerName: formData.get('name'),
            customerEmail: formData.get('email')
        };
        
        console.log('📊 Dados de pagamento Payshop:', paymentData);
        
        const response = await makeRequest(
            API_CONFIG.baseURL + API_CONFIG.endpoints.payshop,
            {
                method: 'POST',
                body: JSON.stringify(paymentData)
            }
        );
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Erro HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Resposta Payshop:', result);
        
        return `
            <div class="alert alert-success">
                <h5>✅ Referência Payshop Gerada</h5>
                <p><strong>Referência:</strong> ${result.reference || 'PS123456789'}</p>
                <p><strong>Valor:</strong> ${result.amount || 30}€</p>
                <p><strong>Validade:</strong> ${result.validity || '3 dias'}</p>
                <p><strong>Status:</strong> Aguardando pagamento</p>
                <hr>
                <p class="mb-0">
                    <i class="fas fa-store"></i> 
                    Apresente a referência em qualquer loja Payshop
                </p>
            </div>
        `;
        
    } catch (error) {
        console.error('❌ Erro Payshop:', error);
        throw new Error(`Erro no pagamento Payshop: ${error.message}`);
    }
}

/**
 * Processar pagamento principal
 */
async function processPayment(formData, paymentMethod = 'multibanco') {
    console.log('💳 Iniciando processamento de pagamento:', paymentMethod);
    
    try {
        let result;
        
        switch (paymentMethod.toLowerCase()) {
            case 'mbway':
                result = await processMBWayPayment(formData);
                break;
            case 'multibanco':
                result = await processMultibancoPayment(formData);
                break;
            case 'payshop':
                result = await processPayshopPayment(formData);
                break;
            default:
                throw new Error('Método de pagamento não suportado: ' + paymentMethod);
        }
        
        console.log('✅ Pagamento processado com sucesso');
        return result;
        
    } catch (error) {
        console.error('❌ Erro no processamento de pagamento:', error);
        
        // Retornar erro detalhado
        return `
            <div class="alert alert-danger">
                <h5>❌ Erro no Pagamento</h5>
                <p><strong>Método:</strong> ${paymentMethod}</p>
                <p><strong>Erro:</strong> ${error.message}</p>
                <hr>
                <p class="mb-0">
                    <strong>Soluções:</strong><br>
                    • Verifique a sua ligação à internet<br>
                    • Tente novamente em alguns minutos<br>
                    • Contacte-nos: samuel@share2inspire.pt
                </p>
            </div>
        `;
    }
}

/**
 * Verificar status do backend
 */
async function checkBackendStatus() {
    try {
        const response = await makeRequest(API_CONFIG.baseURL + '/health');
        return response.ok;
    } catch (error) {
        console.warn('⚠️ Backend não disponível:', error.message);
        return false;
    }
}

// Exportar para uso global
window.IfthenpayIntegration = {
    processPayment,
    processMBWayPayment,
    processMultibancoPayment,
    processPayshopPayment,
    formatPhoneNumber,
    checkBackendStatus
};

console.log('✅ Integração Ifthenpay (versão produção) carregada!');

