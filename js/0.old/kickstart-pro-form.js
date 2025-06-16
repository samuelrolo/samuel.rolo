/**
 * Formulário Kickstart Pro - Versão Corrigida Final
 * CORREÇÕES IMPLEMENTADAS:
 * - Campo telefone MB WAY apenas quando selecionado
 * - Formatação +351# conforme documentação Ifthenpay
 * - Sistema de pagamento unificado
 * - URLs backend corrigidas
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Kickstart Pro Form - Versão Corrigida Carregada');
    initializeKickstartForm();
});

/**
 * Inicializar formulário Kickstart Pro
 */
function initializeKickstartForm() {
    const form = document.getElementById('kickstartForm');
    if (!form) {
        console.warn('⚠️ Formulário kickstartForm não encontrado');
        return;
    }

    console.log('✅ Formulário Kickstart Pro encontrado, configurando...');

    // Configurar seleção de método de pagamento
    setupPaymentMethodSelection();
    
    // Configurar submissão do formulário
    form.addEventListener('submit', handleKickstartSubmit);
    
    // Configurar limpeza quando modal fechar
    setupModalCleanup();
    
    console.log('✅ Formulário Kickstart Pro inicializado');
}

/**
 * Configurar seleção de método de pagamento
 */
function setupPaymentMethodSelection() {
    const paymentMethods = document.querySelectorAll('input[name="payment_method"]');
    const phoneGroup = document.getElementById('kickstartPhoneGroup');
    const phoneInput = document.getElementById('kickstartPhone');

    if (paymentMethods.length === 0) {
        console.warn('⚠️ Métodos de pagamento não encontrados');
        return;
    }

    // Inicialmente ocultar campo de telefone
    if (phoneGroup) {
        phoneGroup.style.display = 'none';
    }

    paymentMethods.forEach(method => {
        method.addEventListener('change', function() {
            console.log('💳 Método de pagamento selecionado:', this.value);
            
            if (phoneGroup && phoneInput) {
                if (this.value === 'mbway') {
                    // Mostrar campo de telefone para MB WAY
                    phoneGroup.style.display = 'block';
                    phoneInput.required = true;
                    phoneInput.placeholder = 'Ex: 961 925 050';
                    
                    // Configurar formatação do telefone
                    setupPhoneFormatting(phoneInput);
                } else {
                    // Ocultar campo de telefone para outros métodos
                    phoneGroup.style.display = 'none';
                    phoneInput.required = false;
                    phoneInput.value = '';
                }
            }
        });
    });
}

/**
 * Configurar formatação do telefone para MB WAY
 */
function setupPhoneFormatting(phoneInput) {
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, ''); // Remover não-dígitos
        
        // Limitar a 9 dígitos
        if (value.length > 9) {
            value = value.substring(0, 9);
        }
        
        // Formatar com espaços para visualização
        if (value.length >= 3) {
            value = value.substring(0, 3) + ' ' + value.substring(3);
        }
        if (value.length >= 7) {
            value = value.substring(0, 7) + ' ' + value.substring(7);
        }
        
        e.target.value = value;
    });
}

/**
 * Configurar limpeza quando modal fechar
 */
function setupModalCleanup() {
    const modal = document.getElementById('kickstartModal');
    if (!modal) return;

    modal.addEventListener('hidden.bs.modal', function() {
        console.log('🚪 Modal fechado - limpando formulário');
        clearKickstartForm();
    });
}

/**
 * Limpar formulário completamente
 */
function clearKickstartForm() {
    const form = document.getElementById('kickstartForm');
    if (!form) return;

    // Reset do formulário
    form.reset();

    // Ocultar campo de telefone
    const phoneGroup = document.getElementById('kickstartPhoneGroup');
    if (phoneGroup) {
        phoneGroup.style.display = 'none';
    }

    // Limpar mensagens
    const messageDiv = document.getElementById('kickstartFormMessage');
    if (messageDiv) {
        messageDiv.innerHTML = '';
    }

    console.log('✅ Formulário limpo com sucesso');
}

/**
 * Lidar com submissão do formulário
 */
async function handleKickstartSubmit(event) {
    event.preventDefault();
    console.log('📝 Formulário Kickstart submetido');

    const form = event.target;
    const formData = new FormData(form);
    const messageDiv = getOrCreateMessageContainer('kickstartFormMessage', form);
    const submitButton = form.querySelector('button[type="submit"]');

    // Limpar mensagens anteriores
    messageDiv.innerHTML = '';

    try {
        // Validar formulário
        if (!validateKickstartForm(form)) {
            showFormMessage(messageDiv, 'error', 'Por favor, preencha todos os campos obrigatórios corretamente.');
            return;
        }

        // Preparar dados
        const data = prepareKickstartData(formData);
        console.log('📊 Dados preparados:', data);

        // Mostrar loading
        setButtonLoading(submitButton, true, 'A processar...');
        showFormMessage(messageDiv, 'info', 'A processar a sua marcação...');

        // Enviar dados para backend
        await submitKickstartToBackend(data);

        // Processar pagamento
        const paymentMethod = formData.get('payment_method');
        const paymentResult = await processKickstartPayment(data, paymentMethod);

        if (paymentResult.success) {
            // Enviar email via Brevo
            await sendKickstartEmail(data);
            
            showFormMessage(messageDiv, 'success', 
                `✅ Kickstart Pro marcado com sucesso! ${paymentResult.message || ''}`);
            form.reset();
            
            // Ocultar campo de telefone após reset
            const phoneGroup = document.getElementById('kickstartPhoneGroup');
            if (phoneGroup) {
                phoneGroup.style.display = 'none';
            }
        } else {
            throw new Error(paymentResult.message || 'Erro no processamento do pagamento');
        }

    } catch (error) {
        console.error('❌ Erro no formulário Kickstart:', error);
        showFormMessage(messageDiv, 'error', 
            `Erro no processamento: ${error.message}. Tente novamente ou contacte-nos em samuel@share2inspire.pt`);
    } finally {
        setButtonLoading(submitButton, false, 'Marcar Kickstart Pro');
    }
}

/**
 * Processar pagamento para Kickstart Pro
 */
async function processKickstartPayment(data, paymentMethod) {
    console.log('💳 Processando pagamento Kickstart:', paymentMethod);

    const paymentData = {
        orderId: `KICK-${Date.now()}`,
        amount: data.amount || "50.00", // Valor padrão
        email: data.email,
        name: data.name,
        description: `Kickstart Pro - ${data.name}`,
        service: 'Kickstart Pro'
    };

    if (paymentMethod === 'mbway') {
        // Formatar telefone para MB WAY conforme documentação Ifthenpay
        const phone = data.phone.replace(/\D/g, ''); // Remover não-dígitos
        paymentData.mobileNumber = phone.startsWith('351') ? phone : `351${phone}`;
    }

    // Usar integração Ifthenpay unificada
    if (typeof window.ifthenpayIntegration !== 'undefined') {
        return await window.ifthenpayIntegration.processPayment(paymentMethod, paymentData);
    } else {
        throw new Error('Sistema de pagamento não disponível');
    }
}

/**
 * Enviar dados para o backend
 */
async function submitKickstartToBackend(data) {
    console.log('📤 Enviando dados Kickstart para backend...');
    
    const response = await fetch('https://share2inspire-backend.onrender.com/booking', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...data,
            service: 'Kickstart Pro',
            type: 'kickstart'
        })
    });

    if (!response.ok) {
        throw new Error(`Erro no servidor: ${response.status}`);
    }

    return await response.json();
}

/**
 * Enviar email via Brevo
 */
async function sendKickstartEmail(data) {
    console.log('📧 Enviando email Kickstart via Brevo...');
    
    if (typeof window.brevoIntegration !== 'undefined') {
        await window.brevoIntegration.sendKickstartEmail(data);
    } else {
        console.warn('⚠️ Brevo integration não disponível');
    }
}

/**
 * Validar formulário de Kickstart
 */
function validateKickstartForm(form) {
    const requiredFields = ['name', 'email'];
    
    for (const field of requiredFields) {
        const input = form.querySelector(`[name="${field}"]`);
        if (!input || !input.value.trim()) {
            console.warn(`⚠️ Campo obrigatório vazio: ${field}`);
            return false;
        }
    }

    // Validar email
    const email = form.querySelector('[name="email"]').value;
    if (!isValidEmail(email)) {
        console.warn('⚠️ Email inválido');
        return false;
    }

    // Validar telefone MB WAY se selecionado
    const paymentMethod = form.querySelector('input[name="payment_method"]:checked');
    if (paymentMethod && paymentMethod.value === 'mbway') {
        const phone = form.querySelector('[name="phone"]');
        if (!phone || !phone.value.trim()) {
            console.warn('⚠️ Telefone MB WAY obrigatório');
            return false;
        }
    }

    return true;
}

/**
 * Preparar dados do formulário
 */
function prepareKickstartData(formData) {
    return {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone') || '',
        company: formData.get('company') || '',
        position: formData.get('position') || '',
        date: formData.get('date'),
        duration: formData.get('duration'),
        challenge: formData.get('challenge') || '',
        payment_method: formData.get('payment_method'),
        service: 'Kickstart Pro',
        timestamp: new Date().toISOString()
    };
}

// Funções utilitárias
function getOrCreateMessageContainer(id, form) {
    let container = document.getElementById(id);
    if (!container) {
        container = document.createElement('div');
        container.id = id;
        container.className = 'form-message mt-3';
        form.appendChild(container);
    }
    return container;
}

function showFormMessage(container, type, message) {
    const alertClass = type === 'success' ? 'alert-success' : 
                      type === 'error' ? 'alert-danger' : 'alert-info';
    container.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
}

function setButtonLoading(button, loading, text) {
    if (loading) {
        button.disabled = true;
        button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${text}`;
    } else {
        button.disabled = false;
        button.innerHTML = text;
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

