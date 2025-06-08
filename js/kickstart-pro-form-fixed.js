/**
 * Formulário Kickstart Pro - Share2Inspire 
 * VERSÃO TOTALMENTE CORRIGIDA - Dezembro 2024
 * Integração com backend corrigido e validação robusta
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Kickstart Pro Form - Versão Corrigida Carregada');
    setupKickstartForm();
    setupPaymentMethodHandlers();
    setupPriceUpdater();
});

/**
 * Configuração principal do formulário
 */
function setupKickstartForm() {
    const kickstartForm = document.getElementById('kickstartForm');
    if (!kickstartForm) {
        console.warn('⚠️ Formulário Kickstart não encontrado');
        return;
    }
    
    console.log('✅ Formulário Kickstart encontrado, configurando...');
    
    kickstartForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('📝 Formulário submetido');
        
        const submitButton = this.querySelector('button[type="submit"]');
        const formMessage = getOrCreateMessageContainer('kickstartFormMessage', this);
        
        // Limpar mensagens anteriores
        formMessage.innerHTML = '';
        
        // Validar formulário
        if (!validateKickstartForm(this)) {
            showFormMessage(formMessage, 'error', 'Por favor, preencha todos os campos obrigatórios corretamente.');
            return;
        }
        
        // Preparar dados
        const formData = new FormData(this);
        const data = prepareKickstartData(formData);
        
        console.log('📊 Dados preparados:', data);
        
        // Mostrar loading
        setButtonLoading(submitButton, true);
        showFormMessage(formMessage, 'info', 'A processar o seu pedido...');
        
        try {
            // Processar pagamento
            const paymentResult = await processKickstartPayment(data);
            console.log('💳 Resultado do pagamento:', paymentResult);
            
            if (paymentResult.success) {
                // Tentar enviar email (não crítico)
                try {
                    await sendKickstartConfirmationEmail(data);
                    console.log('📧 Email enviado com sucesso');
                } catch (emailError) {
                    console.warn('⚠️ Email falhou, mas pagamento OK:', emailError);
                }
                
                // Mostrar sucesso
                displayKickstartSuccess(paymentResult, data.paymentMethod, formMessage);
                this.reset();
                updatePrice();
                
                // Scroll para mensagem
                setTimeout(() => {
                    formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                
            } else {
                throw new Error(paymentResult.error || 'Erro no processamento do pagamento');
            }
            
        } catch (error) {
            console.error('❌ Erro no processo:', error);
            displayKickstartError(error, formMessage);
        } finally {
            setButtonLoading(submitButton, false);
        }
    });
}

/**
 * Configuração dos handlers de método de pagamento
 */
function setupPaymentMethodHandlers() {
    const paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]');
    
    paymentMethodRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            console.log('💳 Método de pagamento alterado:', this.value);
            updatePaymentMethodUI(this.value);
        });
    });
}

/**
 * Configuração do atualizador de preço
 */
function setupPriceUpdater() {
    const durationSelect = document.getElementById('kickstartDuration');
    if (durationSelect) {
        durationSelect.addEventListener('change', updatePrice);
        // Atualizar preço inicial
        updatePrice();
    }
}

/**
 * Validação robusta do formulário
 */
function validateKickstartForm(form) {
    console.log('🔍 Validando formulário...');
    
    const validations = [
        { name: 'name', message: 'Nome é obrigatório' },
        { name: 'email', message: 'Email é obrigatório', validator: validateEmail },
        { name: 'phone', message: 'Telefone é obrigatório', validator: validatePhone },
        { name: 'date', message: 'Data é obrigatória', validator: validateDate },
        { name: 'objectives', message: 'Objetivos são obrigatórios' }
    ];
    
    for (const validation of validations) {
        const field = form.querySelector(`[name="${validation.name}"]`);
        
        if (!field || !field.value.trim()) {
            console.warn(`❌ Campo ${validation.name} vazio`);
            if (field) field.focus();
            return false;
        }
        
        if (validation.validator && !validation.validator(field.value)) {
            console.warn(`❌ Campo ${validation.name} inválido`);
            field.focus();
            return false;
        }
    }
    
    // Validar termos
    const termsCheckbox = form.querySelector('#kickstartTerms');
    if (termsCheckbox && !termsCheckbox.checked) {
        console.warn('❌ Termos não aceites');
        termsCheckbox.focus();
        return false;
    }
    
    console.log('✅ Formulário válido');
    return true;
}

/**
 * Validadores específicos
 */
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validatePhone(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 9;
}

function validateDate(date) {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
}

/**
 * Preparação de dados para envio
 */
function prepareKickstartData(formData) {
    const duration = formData.get('duration') || '30min';
    const amount = duration === '45min' ? '45.00' : '30.00';
    
    const data = {
        // Dados do cliente
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        
        // Dados do serviço
        service: 'Kickstart Pro',
        date: formData.get('date'),
        format: formData.get('format') || 'Online',
        duration: duration,
        objectives: formData.get('objectives'),
        experience: formData.get('experience') || 'Não especificado',
        
        // Dados do pagamento
        paymentMethod: formData.get('paymentMethod') || 'mb',
        amount: amount,
        orderId: `KICKSTART-${Date.now()}`,
        description: `Kickstart Pro - ${duration} - ${formData.get('name')}`
    };
    
    console.log('📋 Dados preparados:', data);
    return data;
}

/**
 * Processamento do pagamento
 */
async function processKickstartPayment(data) {
    console.log('💳 Iniciando processamento de pagamento...');
    
    try {
        const response = await fetch('/api/payment/initiate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        console.log('📡 Resposta do servidor:', response.status);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Pagamento processado:', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ Erro no pagamento:', error);
        throw error;
    }
}

/**
 * Envio de email de confirmação
 */
async function sendKickstartConfirmationEmail(data) {
    console.log('📧 Enviando email de confirmação...');
    
    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'kickstart_confirmation',
                data: data
            })
        });
        
        if (response.ok) {
            console.log('✅ Email enviado');
        } else {
            console.warn('⚠️ Email falhou');
        }
        
    } catch (error) {
        console.warn('⚠️ Erro no email:', error);
        throw error;
    }
}

/**
 * Exibição de sucesso
 */
function displayKickstartSuccess(paymentResult, paymentMethod, messageContainer) {
    let content = `
        <div class="alert alert-success">
            <h5><i class="fas fa-check-circle"></i> Pedido Submetido com Sucesso!</h5>
            <p>O seu pedido de Kickstart Pro foi processado.</p>
    `;
    
    if (paymentMethod === 'mb' || paymentMethod === 'multibanco') {
        content += `
            <div class="payment-details mt-3">
                <h6>Dados para Pagamento Multibanco:</h6>
                <div class="row">
                    <div class="col-md-4"><strong>Entidade:</strong> ${paymentResult.entity || 'N/A'}</div>
                    <div class="col-md-4"><strong>Referência:</strong> ${paymentResult.reference || 'N/A'}</div>
                    <div class="col-md-4"><strong>Valor:</strong> €${paymentResult.amount || 'N/A'}</div>
                </div>
                <p class="mt-2"><small>Validade: ${paymentResult.expiryDate || '3 dias'}</small></p>
            </div>
        `;
    } else if (paymentMethod === 'mbway') {
        content += `
            <div class="payment-details mt-3">
                <h6>Pagamento MB WAY:</h6>
                <p>Verifique a sua aplicação MB WAY para confirmar o pagamento de €${paymentResult.amount || 'N/A'}.</p>
                <p><strong>Estado:</strong> ${paymentResult.message || 'Pendente'}</p>
            </div>
        `;
    }
    
    content += `
            <p class="mt-3">Receberá um email de confirmação em breve com todos os detalhes.</p>
        </div>
    `;
    
    messageContainer.innerHTML = content;
}

/**
 * Exibição de erro
 */
function displayKickstartError(error, messageContainer) {
    const content = `
        <div class="alert alert-danger">
            <h5><i class="fas fa-exclamation-triangle"></i> Erro no Processamento</h5>
            <p>Ocorreu um erro ao processar o seu pedido:</p>
            <p><strong>${error.message || 'Erro desconhecido'}</strong></p>
            <p>Por favor, tente novamente ou contacte-nos diretamente.</p>
        </div>
    `;
    
    messageContainer.innerHTML = content;
}

/**
 * Atualização da interface do método de pagamento
 */
function updatePaymentMethodUI(method) {
    console.log('🎨 Atualizando UI para método:', method);
    
    // Esconder todos os campos específicos
    const mbwayFields = document.getElementById('mbwayFields');
    if (mbwayFields) {
        mbwayFields.style.display = method === 'mbway' ? 'block' : 'none';
    }
    
    // Atualizar labels ou instruções se necessário
    const paymentInstructions = document.getElementById('paymentInstructions');
    if (paymentInstructions) {
        if (method === 'mbway') {
            paymentInstructions.innerHTML = '<small class="text-muted">Receberá uma notificação na sua app MB WAY.</small>';
        } else {
            paymentInstructions.innerHTML = '<small class="text-muted">Receberá os dados de pagamento por email.</small>';
        }
    }
}

/**
 * Atualização de preço
 */
function updatePrice() {
    const durationSelect = document.getElementById('kickstartDuration');
    const priceDisplay = document.getElementById('kickstartPrice');
    const hiddenField = document.getElementById('kickstartDurationHidden');
    
    if (!durationSelect || !priceDisplay) return;
    
    const duration = durationSelect.value;
    const price = duration === '45min' ? '45€' : '30€';
    
    priceDisplay.textContent = price;
    
    if (hiddenField) {
        hiddenField.value = duration;
    }
    
    console.log('💰 Preço atualizado:', price);
}

/**
 * Utilitários
 */
function getOrCreateMessageContainer(id, parent) {
    let container = document.getElementById(id);
    if (!container) {
        container = document.createElement('div');
        container.id = id;
        container.className = 'form-message mt-3';
        parent.appendChild(container);
    }
    return container;
}

function showFormMessage(container, type, message) {
    const alertClass = type === 'error' ? 'alert-danger' : 
                     type === 'success' ? 'alert-success' : 'alert-info';
    
    container.innerHTML = `
        <div class="alert ${alertClass}">
            ${message}
        </div>
    `;
}

function setButtonLoading(button, loading) {
    if (!button) return;
    
    if (loading) {
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A processar...';
    } else {
        button.disabled = false;
        button.innerHTML = 'SUBMETER E PROSSEGUIR PARA O PAGAMENTO';
    }
}

// Exportar funções para uso global se necessário
window.KickstartForm = {
    updatePrice,
    updatePaymentMethodUI
};

console.log('✅ Kickstart Pro Form - Totalmente Carregado e Configurado');

