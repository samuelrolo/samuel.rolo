/**
 * Formulário Kickstart Pro - Share2Inspire
 * 
 * Este ficheiro contém o código corrigido para o formulário Kickstart Pro
 * Inclui seleção de tempos (30 min - 30€ ou 1h - 45€) e integração com as APIs da BREVO e IfthenPay
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar o formulário Kickstart Pro
    setupKickstartForm();
    
    // Mostrar/ocultar campos específicos de MB WAY
    const paymentMethodSelect = document.getElementById('kickstartPaymentMethod');
    const mbwayFields = document.getElementById('mbwayFields');
    
    if (paymentMethodSelect && mbwayFields) {
        paymentMethodSelect.addEventListener('change', function() {
            if (this.value === 'mbway') {
                mbwayFields.style.display = 'block';
            } else {
                mbwayFields.style.display = 'none';
            }
        });
    }
    
    // Inicializar o preço com base na duração selecionada
    updatePrice();
    
    // Adicionar listener para atualizar o preço quando a duração mudar
    const durationSelect = document.getElementById('kickstartDuration');
    if (durationSelect) {
        durationSelect.addEventListener('change', updatePrice);
    }
});

/**
 * Configura o formulário Kickstart Pro
 */
function setupKickstartForm() {
    const kickstartForm = document.getElementById('kickstartForm');
    
    if (!kickstartForm) return;
    
    kickstartForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const formMessage = this.querySelector('.form-message') || document.createElement('div');
        
        // Garantir que o elemento de mensagem existe
        if (!this.querySelector('.form-message')) {
            formMessage.className = 'form-message mt-3';
            kickstartForm.appendChild(formMessage);
        }
        
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A processar...';
        
        // Obter dados do formulário
        const formData = new FormData(kickstartForm);
        
        // Obter valores específicos para garantir o formato correto
        const name = formData.get('name') || '';
        const email = formData.get('email') || '';
        const phone = formData.get('phone') || '';
        const date = formData.get('date') || '';
        const format = formData.get('format') || 'Online';
        const duration = formData.get('duration') || '30min';
        const paymentMethod = formData.get('paymentMethod') || 'multibanco';
        const mbwayPhone = formData.get('mbwayPhone') || phone;
        
        // Calcular o preço com base na duração
        const price = duration === '30min' ? 30 : 45;
        
        // Gerar ID de pedido único
        const orderId = 'KP' + Date.now();
        
        // Preparar dados no formato exato esperado pelo backend
        const data = {
            service: 'Kickstart Pro',
            name: name,
            email: email,
            phone: paymentMethod === 'mbway' ? formatPhoneForMBWay(mbwayPhone) : phone,
            date: date,
            format: format,
            duration: duration,
            payment_method: normalizePaymentMethod(paymentMethod),
            amount: price,
            order_id: orderId,
            description: `Kickstart Pro ${duration} - ${format} - ${date}`
        };
        
        console.log('Enviando dados para o backend:', data);
        
        // Primeiro, enviar dados para a API da BREVO
        if (window.brevoSDK && typeof window.brevoSDK.sendBookingConfirmation === 'function') {
            window.brevoSDK.sendBookingConfirmation(data)
                .then(() => {
                    console.log('Email de confirmação enviado com sucesso via Brevo');
                })
                .catch(error => {
                    console.error('Erro ao enviar email de confirmação via Brevo:', error);
                    // Mostrar mensagem de erro, mas continuar com o processo de pagamento
                    showTemporaryMessage(formMessage, 'Aviso: Não foi possível enviar o email de confirmação, mas o processo de pagamento continuará.', 'warning');
                });
        } else {
            console.warn('API da Brevo não disponível');
        }
        
        // Processar pagamento via IfthenPay
        if (window.IfthenPayIntegration && typeof window.IfthenPayIntegration.processPayment === 'function') {
            window.IfthenPayIntegration.processPayment(data, data.payment_method, price)
                .then(responseData => {
                    console.log('Pagamento processado com sucesso:', responseData);
                    
                    // Exibir informações de pagamento
                    if (window.IfthenPayIntegration.displayPaymentInfo) {
                        window.IfthenPayIntegration.displayPaymentInfo(responseData, data.payment_method, formMessage);
                    } else {
                        // Fallback se a função de exibição não estiver disponível
                        displayPaymentSuccess(responseData, data.payment_method, formMessage);
                    }
                    
                    // Resetar formulário
                    kickstartForm.reset();
                    
                    // Scroll para a mensagem
                    formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                })
                .catch(error => {
                    console.error('Erro ao processar pagamento:', error);
                    
                    // Exibir mensagem de erro
                    if (window.IfthenPayIntegration.displayPaymentError) {
                        window.IfthenPayIntegration.displayPaymentError(error, formMessage);
                    } else {
                        // Fallback se a função de exibição de erro não estiver disponível
                        formMessage.innerHTML = `
                            <div class="alert alert-danger">
                                Erro ao processar pagamento: ${error.message || 'Erro desconhecido'}. 
                                Por favor tente novamente ou contacte-nos diretamente.
                            </div>
                        `;
                    }
                })
                .finally(() => {
                    // Reabilitar botão
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'SUBMETER E PROSSEGUIR PARA O PAGAMENTO';
                });
        } else {
            // Fallback para chamada direta à API se a integração não estiver disponível
            processPaymentDirectly(data, formMessage, submitButton, kickstartForm);
        }
    });
}

/**
 * Processa pagamento diretamente via API (fallback)
 */
function processPaymentDirectly(data, formMessage, submitButton, form) {
    fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/initiate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        console.log('Resposta do servidor:', response.status, response.statusText);
        
        if (!response.ok) {
            return response.text().then(text => {
                console.error('Erro na resposta do servidor:', response.status, text);
                throw new Error('Erro na resposta do servidor: ' + response.status);
            });
        }
        return response.json();
    })
    .then(responseData => {
        console.log('Dados recebidos do servidor:', responseData);
        
        // Verificar se a resposta foi bem-sucedida
        if (responseData.success) {
            displayPaymentSuccess(responseData, data.payment_method, formMessage);
            
            // Resetar formulário
            form.reset();
        } else {
            // Mostrar mensagem de erro do servidor
            formMessage.innerHTML = `
                <div class="alert alert-danger">
                    ${responseData.error || 'Erro ao processar pedido. Por favor tente novamente.'}
                </div>
            `;
        }
    })
    .catch(error => {
        console.error('Erro ao processar pagamento:', error);
        
        // Mostrar mensagem de erro
        formMessage.innerHTML = `
            <div class="alert alert-danger">
                Erro ao processar pedido: ${error.message || 'Erro desconhecido'}. 
                Por favor tente novamente ou contacte-nos diretamente.
            </div>
        `;
    })
    .finally(() => {
        // Reabilitar botão
        submitButton.disabled = false;
        submitButton.innerHTML = 'SUBMETER E PROSSEGUIR PARA O PAGAMENTO';
    });
}

/**
 * Exibe informações de pagamento bem-sucedido
 */
function displayPaymentSuccess(data, paymentMethod, container) {
    // Normalizar o método de pagamento
    const normalizedMethod = normalizePaymentMethod(paymentMethod);
    
    // Conteúdo específico para cada método de pagamento
    if (normalizedMethod === 'mbway') {
        container.innerHTML = `
            <div class="alert alert-success">
                <h4>Pagamento MB WAY</h4>
                <p><strong>Número:</strong> ${data.phone || ''}</p>
                <p><strong>Valor:</strong> ${data.amount || ''}€</p>
                <p>Foi enviado um pedido de pagamento para o seu número MB WAY.</p>
                <p>Por favor, aceite o pagamento na aplicação MB WAY.</p>
            </div>
        `;
    } else if (normalizedMethod === 'multibanco') {
        // Garantir que os campos entity, reference e amount existem, mesmo que vazios
        const entity = data.entity || data.Entity || '';
        const reference = data.reference || data.Reference || '';
        const amount = data.amount || data.Amount || '';
        
        container.innerHTML = `
            <div class="alert alert-success">
                <h4>Pagamento por Referência Multibanco</h4>
                <p><strong>Entidade:</strong> ${entity}</p>
                <p><strong>Referência:</strong> ${reference}</p>
                <p><strong>Valor:</strong> ${amount}€</p>
                <p>A referência é válida por 48 horas.</p>
            </div>
        `;
    } else if (normalizedMethod === 'payshop') {
        // Mostrar informações de pagamento Payshop
        const reference = data.reference || data.Reference || '';
        const amount = data.amount || data.Amount || '';
        
        container.innerHTML = `
            <div class="alert alert-success">
                <h4>Pagamento por Referência Payshop</h4>
                <p><strong>Referência:</strong> ${reference}</p>
                <p><strong>Valor:</strong> ${amount}€</p>
                <p>A referência é válida por 48 horas.</p>
            </div>
        `;
    } else {
        // Mensagem genérica de sucesso
        container.innerHTML = `
            <div class="alert alert-success">
                <h4>Reserva Processada com Sucesso!</h4>
                <p>Obrigado pela sua reserva. Receberá um email com os detalhes.</p>
                <p><strong>Valor:</strong> ${data.amount || ''}€</p>
            </div>
        `;
    }
}

/**
 * Normaliza o método de pagamento para o formato esperado pelo backend
 */
function normalizePaymentMethod(method) {
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
 * Mostra uma mensagem temporária
 */
function showTemporaryMessage(container, message, type = 'info', duration = 5000) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    container.appendChild(alertDiv);
    
    // Remover após a duração especificada
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, duration);
}

/**
 * Atualiza o preço com base na duração selecionada
 */
function updatePrice() {
    const durationSelect = document.getElementById('kickstartDuration');
    const priceElement = document.getElementById('kickstartPrice');
    
    if (durationSelect && priceElement) {
        const duration = durationSelect.value;
        
        if (duration === '30min') {
            priceElement.textContent = '30€';
        } else {
            priceElement.textContent = '45€';
        }
    }
}
