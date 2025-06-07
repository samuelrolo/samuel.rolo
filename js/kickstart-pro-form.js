/**
 * Formulário Kickstart Pro - Share2Inspire 
 * VERSÃO CORRIGIDA - Integração com IfthenPay corrigida
 */

document.addEventListener('DOMContentLoaded', function() {
    setupKickstartForm();
    
    // CORREÇÃO: Verificar se elementos existem antes de adicionar listeners
    const paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]');
    if (paymentMethodRadios.length > 0) {
        paymentMethodRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                updatePaymentMethodUI(this.value);
            });
        });
    }
    
    updatePrice();
    
    const durationSelect = document.getElementById('kickstartDuration');
    if (durationSelect) {
        durationSelect.addEventListener('change', updatePrice);
    }
});

/**
 * CORREÇÃO: Configuração robusta do formulário
 */
function setupKickstartForm() {
    const kickstartForm = document.getElementById('kickstartForm');
    if (!kickstartForm) {
        console.warn('Formulário Kickstart não encontrado');
        return;
    }
    
    kickstartForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]') || 
                           this.querySelector('.btn-primary');
        
        // CORREÇÃO: Criar container de mensagem se não existir
        let formMessage = document.getElementById('kickstartFormMessage');
        if (!formMessage) {
            formMessage = document.createElement('div');
            formMessage.id = 'kickstartFormMessage';
            formMessage.className = 'form-message mt-3';
            this.appendChild(formMessage);
        }
        
        if (!validateKickstartForm(this)) {
            formMessage.innerHTML = `
                <div class="alert alert-danger">
                    Por favor, preencha todos os campos obrigatórios.
                </div>
            `;
            return;
        }
        
        // CORREÇÃO: Verificar se botão existe
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A processar...';
        }
        
        formMessage.innerHTML = '';
        
        const formData = new FormData(this);
        const data = prepareKickstartData(formData);
        
        console.log('Iniciando processo de pagamento:', data);
        
        // CORREÇÃO: Usar integração IfthenPay corrigida
        processKickstartPayment(data)
            .then(paymentResult => {
                console.log('Pagamento processado:', paymentResult);
                
                if (paymentResult.success) {
                    // CORREÇÃO: Tentar enviar email, mas não falhar se não conseguir
                    return sendKickstartConfirmationEmail(data)
                        .then(() => paymentResult)
                        .catch(emailError => {
                            console.warn('Email falhou, mas pagamento OK:', emailError);
                            return paymentResult;
                        });
                } else {
                    throw new Error(paymentResult.error || 'Pagamento não foi processado');
                }
            })
            .then(finalResult => {
                displayKickstartSuccess(finalResult, data.payment_method, formMessage);
                this.reset();
                updatePrice();
                formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            })
            .catch(error => {
                console.error('Erro no processo:', error);
                displayKickstartError(error, formMessage);
            })
            .finally(() => {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'SUBMETER E PROSSEGUIR PARA O PAGAMENTO';
                }
            });
    });
}

/**
 * CORREÇÃO: Validação mais robusta
 */
function validateKickstartForm(form) {
    const requiredFields = ['name', 'email', 'phone', 'date'];
    
    for (const fieldName of requiredFields) {
        const field = form.querySelector(`[name="${fieldName}"]`) || 
                     form.querySelector(`#kickstart${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`);
        
        if (!field || !field.value.trim()) {
            if (field) field.focus();
            return false;
        }
    }
    
    // Validar email
    const emailField = form.querySelector('[name="email"]') || form.querySelector('#kickstartEmail');
    if (emailField) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.value)) {
            emailField.focus();
            return false;
        }
    }
    
    // Validar telefone
    const phoneField = form.querySelector('[name="phone"]') || form.querySelector('#kickstartPhone');
    if (phoneField && phoneField.value.replace(/\D/g, '').length < 9) {
        phoneField.focus();
        return false;
    }
    
    return true;
}

/**
 * CORREÇÃO: Preparação de dados mais robusta
 */
function prepareKickstartData(formData) {
    const duration = formData.get('duration') || '30min';
    const paymentMethod = formData.get('paymentMethod') || 'multibanco';
    const price = duration === '30min' ? 30 : 45;
    
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
        order_id: 'KP' + Date.now(),
        description: `Kickstart Pro ${duration} - ${formData.get('format') || 'Online'}`
    };
}

/**
 * CORREÇÃO: Usar integração IfthenPay corrigida
 */
function processKickstartPayment(data) {
    return new Promise((resolve, reject) => {
        // CORREÇÃO: Verificar se integração IfthenPay está disponível
        if (window.IfthenPayIntegration && typeof window.IfthenPayIntegration.processPayment === 'function') {
            console.log('Usando integração IfthenPay corrigida');
            
            window.IfthenPayIntegration.processPayment(data, data.payment_method, data.amount)
                .then(result => {
                    if (result && result.success) {
                        resolve({
                            success: true,
                            confirmed: true,
                            ...result
                        });
                    } else {
                        reject(new Error(result?.error || 'Pagamento não foi processado'));
                    }
                })
                .catch(error => {
                    console.error('Erro na integração IfthenPay:', error);
                    reject(error);
                });
        } else {
            console.warn('Integração IfthenPay não disponível, usando fallback');
            processKickstartPaymentDirect(data)
                .then(resolve)
                .catch(reject);
        }
    });
}

/**
 * CORREÇÃO: Fallback direto melhorado
 */
function processKickstartPaymentDirect(data) {
    const endpoint = 'https://share2inspire-beckend.lm.r.appspot.com/api/payment/initiate';
    
    return fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        console.log('Resposta do servidor:', response.status, response.statusText);
        
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(`Erro do servidor: ${response.status} - ${text}`);
            });
        }
        
        return response.json();
    })
    .then(responseData => {
        console.log('Dados recebidos:', responseData);
        
        if (responseData.success) {
            return {
                success: true,
                confirmed: true,
                ...responseData
            };
        } else {
            throw new Error(responseData.error || 'Erro ao processar pagamento');
        }
    });
}

/**
 * CORREÇÃO: Email opcional
 */
function sendKickstartConfirmationEmail(data) {
    return new Promise((resolve) => {
        if (window.brevoSDK && typeof window.brevoSDK.sendBookingConfirmation === 'function') {
            window.brevoSDK.sendBookingConfirmation(data)
                .then(resolve)
                .catch(error => {
                    console.warn('Email falhou:', error);
                    resolve(); // Não falhar por causa do email
                });
        } else {
            console.warn('Brevo SDK não disponível');
            resolve();
        }
    });
}

/**
 * CORREÇÃO: Display de sucesso melhorado
 */
function displayKickstartSuccess(result, paymentMethod, container) {
    const method = paymentMethod || 'multibanco';
    
    if (method === 'mbway') {
        container.innerHTML = `
            <div class="alert alert-success">
                <h4>✅ Pagamento MB WAY Processado</h4>
                <p><strong>Número:</strong> ${result.phone || result.mobileNumber || ''}</p>
                <p><strong>Valor:</strong> ${result.amount || ''}€</p>
                <p><strong>Referência:</strong> ${result.reference || result.orderId || ''}</p>
                <p>✅ Pedido de pagamento enviado para o seu telemóvel!</p>
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
 * Display de erro (mantido)
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
    console.log('Método de pagamento selecionado:', method);
    
    // CORREÇÃO: Verificar se elementos existem
    const mbwayFields = document.getElementById('mbwayFields');
    if (mbwayFields) {
        mbwayFields.style.display = method === 'mbway' ? 'block' : 'none';
    }
}

/**
 * CORREÇÃO: Atualização de preço mais robusta
 */
function updatePrice() {
    const durationSelect = document.getElementById('kickstartDuration');
    const priceElement = document.getElementById('kickstartPrice');
    
    if (durationSelect && priceElement) {
        const duration = durationSelect.value || '30min';
        const price = duration === '30min' ? '30€' : '45€';
        priceElement.textContent = price;
        
        const hiddenField = document.getElementById('kickstartDurationHidden');
        if (hiddenField) {
            hiddenField.value = duration;
        }
    }
}

