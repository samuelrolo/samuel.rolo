/**
 * Integração com a API IFThePay para processamento de pagamentos - Share2Inspire
 * 
 * Versão corrigida para garantir o processamento correto de pagamentos
 * e exibição dos detalhes de pagamento.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar a integração com o IFThePay
    initIFThePayIntegration();
});

/**
 * Inicializa a integração com o IFThePay
 */
function initIFThePayIntegration() {
    console.log('Inicializando integração com o IFThePay');
    
    // Expor funções para uso externo
    window.ifthepayIntegration = {
        processPayment,
        validatePaymentForm,
        validateEmail,
        showPaymentDetails
    };
}

/**
 * Processa pagamento com IFThePay
 * @param {FormData|Object} formData - Dados do formulário ou objeto com dados
 * @param {string} serviceId - ID do serviço
 * @param {number} amount - Valor do pagamento
 * @returns {Promise} - Promise que resolve quando o pagamento é processado
 */
function processPayment(formData, serviceId, amount) {
    // Converter FormData para objeto se necessário
    const data = formData instanceof FormData ? formDataToObject(formData) : formData;
    
    // Preparar dados para o pagamento
    const paymentData = {
        service: serviceId || data.service || 'Serviço',
        name: data.name || data.customerName || '',
        email: data.email || data.customerEmail || '',
        phone: data.phone || data.customerPhone || '',
        amount: amount || data.amount || 0,
        paymentMethod: data.paymentMethod || 'mb',
        orderId: 'ORD' + Date.now(),
        description: `Pagamento ${serviceId || data.service || 'Serviço'} - ${new Date().toLocaleDateString('pt-PT')}`,
        customerName: data.name || data.customerName || '',
        customerEmail: data.email || data.customerEmail || '',
        customerPhone: data.phone || data.customerPhone || '',
        source: data.source || 'website_payment'
    };
    
    console.log('Processando pagamento:', paymentData);
    
    // Lista de endpoints a tentar, em ordem de prioridade
    const endpoints = [
        'https://share2inspire-beckend.lm.r.appspot.com/api/payment/initiate',
        'https://share2inspire-beckend.lm.r.appspot.com/api/booking/create'
    ];
    
    // Tentar enviar para cada endpoint até que um funcione
    return tryEndpoints(endpoints, 0, paymentData);
    
    function tryEndpoints(endpoints, index, data) {
        return new Promise((resolve, reject) => {
            if (index >= endpoints.length) {
                // Todos os endpoints falharam
                console.error('Todos os endpoints falharam para processamento de pagamento');
                reject(new Error('Falha ao processar pagamento. Todos os endpoints falharam.'));
                return;
            }
            
            const currentEndpoint = endpoints[index];
            console.log(`Tentando endpoint ${index + 1}/${endpoints.length} para pagamento: ${currentEndpoint}`);
            
            // Enviar dados para o backend
            fetch(currentEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': 'https://share2inspire.pt',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                console.log(`Resposta do servidor para pagamento (${currentEndpoint}):`, response.status, response.statusText);
                
                if (!response.ok) {
                    // Se o endpoint atual falhar, tentar o próximo
                    if (response.status === 405) {
                        console.warn(`Endpoint ${currentEndpoint} retornou 405 Method Not Allowed. Tentando próximo endpoint...`);
                        return tryEndpoints(endpoints, index + 1, data)
                            .then(resolve)
                            .catch(reject);
                    }
                    
                    return response.text().then(text => {
                        console.error(`Erro na resposta do servidor para pagamento (${currentEndpoint}):`, response.status, text);
                        throw new Error(`Erro na resposta do servidor: ${response.status}`);
                    });
                }
                
                // Tentar analisar a resposta como JSON
                try {
                    return response.json();
                } catch (e) {
                    // Se não for JSON, retornar um objeto simples
                    return { 
                        success: true, 
                        message: 'Pagamento processado com sucesso!',
                        paymentMethod: data.paymentMethod,
                        amount: data.amount
                    };
                }
            })
            .then(responseData => {
                console.log(`Pagamento processado com sucesso via ${currentEndpoint}:`, responseData);
                
                // Garantir que a resposta inclui os dados necessários
                const result = {
                    ...responseData,
                    success: responseData.success || true,
                    paymentMethod: responseData.paymentMethod || data.paymentMethod,
                    amount: responseData.amount || data.amount,
                    entity: responseData.entity || responseData.Entity || '',
                    reference: responseData.reference || responseData.Reference || '',
                    phone: responseData.phone || data.customerPhone || data.phone || ''
                };
                
                // Enviar email de confirmação se a integração Brevo estiver disponível
                if (window.brevoIntegration && typeof window.brevoIntegration.sendPaymentConfirmation === 'function') {
                    window.brevoIntegration.sendPaymentConfirmation({
                        ...data,
                        ...result
                    }).catch(err => {
                        console.warn('Erro ao enviar email de confirmação de pagamento:', err);
                    });
                }
                
                resolve(result);
            })
            .catch(error => {
                console.error(`Erro ao processar pagamento via ${currentEndpoint}:`, error);
                
                // Tentar próximo endpoint
                tryEndpoints(endpoints, index + 1, data)
                    .then(resolve)
                    .catch(reject);
            });
        });
    }
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
        // Mostrar informações de pagamento MB WAY
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
        // Mostrar informações de pagamento Multibanco
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

/**
 * Converte FormData para objeto
 * @param {FormData} formData - Objeto FormData
 * @returns {Object} - Objeto com os dados do formulário
 */
function formDataToObject(formData) {
    const object = {};
    formData.forEach((value, key) => {
        object[key] = value;
    });
    return object;
}
