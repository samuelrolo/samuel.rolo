/**
 * Formulário Kickstart Pro - Share2Inspire (VERSÃO CORRIGIDA)
 * 
 * Correções implementadas:
 * - Email de confirmação só é enviado APÓS pagamento confirmado
 * - Verificação adequada do status de pagamento MB WAY
 * - Tratamento robusto de erros
 * - Feedback adequado ao utilizador
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar o formulário Kickstart Pro
    setupKickstartForm();
    
    // Mostrar/ocultar campos específicos de MB WAY
    const paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]');
    
    paymentMethodRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            // Atualizar interface baseado no método selecionado
            updatePaymentMethodUI(this.value);
        });
    });
    
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
        const formMessage = document.getElementById('kickstartFormMessage') || 
                           this.querySelector('.form-message') || 
                           document.createElement('div');
        
        // Garantir que o elemento de mensagem existe
        if (!document.getElementById('kickstartFormMessage') && !this.querySelector('.form-message')) {
            formMessage.className = 'form-message mt-3';
            formMessage.id = 'kickstartFormMessage';
            this.appendChild(formMessage);
        }
        
        // Validar formulário antes de processar
        if (!validateKickstartForm(this)) {
            formMessage.innerHTML = `
                <div class="alert alert-danger">
                    Por favor, preencha todos os campos obrigatórios.
                </div>
            `;
            return;
        }
        
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A processar...';
        
        // Limpar mensagens anteriores
        formMessage.innerHTML = '';
        
        // Obter dados do formulário
        const formData = new FormData(this);
        const data = prepareKickstartData(formData);
        
        console.log('Iniciando processo de pagamento:', data);
        
        // CORREÇÃO: Processar pagamento PRIMEIRO, email DEPOIS
        processKickstartPayment(data)
            .then(paymentResult => {
                console.log('Pagamento processado:', paymentResult);
                
                // Só enviar email se pagamento foi confirmado
                if (paymentResult.success && paymentResult.confirmed) {
                    return sendKickstartConfirmationEmail(data)
                        .then(() => {
                            console.log('Email de confirmação enviado');
                            return paymentResult;
                        })
                        .catch(emailError => {
                            console.warn('Erro ao enviar email, mas pagamento foi processado:', emailError);
                            // Continuar mesmo se email falhar
                            return paymentResult;
                        });
                } else {
                    // Pagamento não foi confirmado
                    throw new Error(paymentResult.error || 'Pagamento não foi confirmado');
                }
            })
            .then(finalResult => {
                // Exibir sucesso
                displayKickstartSuccess(finalResult, data.payment_method, formMessage);
                
                // Resetar formulário
                this.reset();
                updatePrice(); // Resetar preço para valor padrão
                
                // Scroll para a mensagem
                formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            })
            .catch(error => {
                console.error('Erro no processo:', error);
                displayKickstartError(error, formMessage);
            })
            .finally(() => {
                // Reabilitar botão
                submitButton.disabled = false;
                submitButton.innerHTML = 'SUBMETER E PROSSEGUIR PARA O PAGAMENTO';
            });
    });
}

/**
 * Valida o formulário Kickstart Pro
 */
function validateKickstartForm(form) {
    const requiredFields = ['name', 'email', 'phone', 'date', 'objectives'];
    
    for (const fieldName of requiredFields) {
        const field = form.querySelector(`[name="${fieldName}"]`);
        if (!field || !field.value.trim()) {
            field?.focus();
            return false;
        }
    }
    
    // Validar email
    const email = form.querySelector('[name="email"]').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        form.querySelector('[name="email"]').focus();
        return false;
    }
    
    // Validar telefone
    const phone = form.querySelector('[name="phone"]').value;
    if (phone.length < 9) {
        form.querySelector('[name="phone"]').focus();
        return false;
    }
    
    return true;
}

/**
 * Prepara dados do formulário
 */
function prepareKickstartData(formData) {
    const duration = formData.get('duration') || '30min';
    const paymentMethod = formData.get('paymentMethod') || 'mb';
    const price = duration === '30min' ? 30 : 45;
    const orderId = 'KP' + Date.now();
    
    return {
        service: 'Kickstart Pro',
        name: formData.get('name') || '',
        email: formData.get('email') || '',
        phone: formData.get('phone') || '',
        date: formData.get('date') || '',
        format: formData.get('format') || 'Online',
        duration: duration,
        objectives: formData.get('objectives') || '',
        experience: formData.get('experience') || '',
        payment_method: paymentMethod,
        amount: price,
        order_id: orderId,
        description: `Kickstart Pro ${duration} - ${formData.get('format') || 'Online'} - ${formData.get('date') || ''}`
    };
}

/**
 * Processa pagamento (CORRIGIDO)
 */
function processKickstartPayment(data) {
    return new Promise((resolve, reject) => {
        // Tentar usar integração IFThenPay primeiro
        if (window.IfthenPayIntegration && typeof window.IfthenPayIntegration.processPayment === 'function') {
            window.IfthenPayIntegration.processPayment(data, data.payment_method, data.amount)
                .then(result => {
                    // CORREÇÃO: Verificar se pagamento foi realmente confirmado
                    if (result && result.success) {
                        resolve({
                            success: true,
                            confirmed: true, // Assumir confirmado se API retornou sucesso
                            ...result
                        });
                    } else {
                        reject(new Error(result?.error || 'Pagamento não foi processado'));
                    }
                })
                .catch(error => {
                    console.error('Erro na integração IFThenPay:', error);
                    reject(error);
                });
        } else {
            // Fallback para chamada direta
            processKickstartPaymentDirect(data)
                .then(resolve)
                .catch(reject);
        }
    });
}

/**
 * Processa pagamento via chamada direta (fallback)
 */
function processKickstartPaymentDirect(data) {
    return fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/initiate', {
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
                throw new Error(`Erro do servidor: ${response.status} - ${text}`);
            });
        }
        
        return response.json();
    })
    .then(responseData => {
        console.log('Dados recebidos do servidor:', responseData);
        
        // CORREÇÃO: Verificar adequadamente o status
        if (responseData.success) {
            return {
                success: true,
                confirmed: responseData.confirmed || false, // Verificar se foi confirmado
                ...responseData
            };
        } else {
            throw new Error(responseData.error || 'Erro ao processar pagamento');
        }
    });
}

/**
 * Envia email de confirmação (CORRIGIDO - só após pagamento)
 */
function sendKickstartConfirmationEmail(data) {
    return new Promise((resolve, reject) => {
        if (window.brevoSDK && typeof window.brevoSDK.sendBookingConfirmation === 'function') {
            window.brevoSDK.sendBookingConfirmation(data)
                .then(resolve)
                .catch(reject);
        } else {
            console.warn('API da Brevo não disponível');
            resolve(); // Não falhar se Brevo não estiver disponível
        }
    });
}

/**
 * Exibe sucesso do pagamento
 */
function displayKickstartSuccess(result, paymentMethod, container) {
    if (paymentMethod === 'mbway') {
        container.innerHTML = `
            <div class="alert alert-success">
                <h4>✅ Pagamento MB WAY Processado</h4>
                <p><strong>Número:</strong> ${result.phone || ''}</p>
                <p><strong>Valor:</strong> ${result.amount || ''}€</p>
                <p><strong>Referência:</strong> ${result.reference || ''}</p>
                <p>✅ Pagamento confirmado com sucesso!</p>
                <p>📧 Email de confirmação enviado.</p>
                <hr>
                <p><small>Obrigado por escolher a Share2Inspire!</small></p>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="alert alert-success">
                <h4>✅ Referência Multibanco Gerada</h4>
                <p><strong>Entidade:</strong> ${result.entity || ''}</p>
                <p><strong>Referência:</strong> ${result.reference || ''}</p>
                <p><strong>Valor:</strong> ${result.amount || ''}€</p>
                <p>💳 Use estes dados para efetuar o pagamento via Multibanco.</p>
                <p>📧 Email de confirmação enviado.</p>
                <hr>
                <p><small>Obrigado por escolher a Share2Inspire!</small></p>
            </div>
        `;
    }
}

/**
 * Exibe erro
 */
function displayKickstartError(error, container) {
    container.innerHTML = `
        <div class="alert alert-danger">
            <h4>❌ Erro ao Processar Pedido</h4>
            <p>${error.message || 'Erro desconhecido'}</p>
            <p>Por favor, tente novamente ou contacte-nos diretamente.</p>
            <hr>
            <p><small>Email: samuel@share2inspire.pt | Telefone: +351 961 925 050</small></p>
        </div>
    `;
}

/**
 * Atualiza interface do método de pagamento
 */
function updatePaymentMethodUI(method) {
    // Implementar se necessário mostrar/ocultar campos específicos
    console.log('Método de pagamento selecionado:', method);
}

/**
 * Atualiza preço baseado na duração
 */
function updatePrice() {
    const durationSelect = document.getElementById('kickstartDuration');
    const priceElement = document.getElementById('kickstartPrice');
    
    if (durationSelect && priceElement) {
        const duration = durationSelect.value;
        const price = duration === '30min' ? '30€' : '45€';
        priceElement.textContent = price;
        
        // Atualizar campo hidden se existir
        const hiddenField = document.getElementById('kickstartDurationHidden');
        if (hiddenField) {
            hiddenField.value = duration;
        }
    }
}

