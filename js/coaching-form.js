/**
 * Formulário de Coaching - Share2Inspire 
 * VERSÃO CORRIGIDA COM SELEÇÃO DE PAGAMENTO - Junho 2025
 * Integração com backend, Ifthenpay e Brevo
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Coaching Form - Versão com Pagamento Carregada');
    setupCoachingForm();
    setupCoachingPaymentHandlers();
});

/**
 * Configuração dos handlers de pagamento para coaching
 */
function setupCoachingPaymentHandlers() {
    const paymentRadios = document.querySelectorAll('input[name="coaching_payment_method"]');
    const phoneGroup = document.getElementById('coachingPhoneGroup');
    
    if (paymentRadios.length === 0) {
        console.log('ℹ️ Coaching: Sem métodos de pagamento configurados');
        return;
    }
    
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (phoneGroup) {
                phoneGroup.style.display = this.value === 'mbway' ? 'block' : 'none';
                const phoneInput = document.getElementById('coachingPhoneMbway');
                if (phoneInput) {
                    phoneInput.required = this.value === 'mbway';
                }
            }
        });
    });
}

/**
 * Configuração principal do formulário de coaching
 */
function setupCoachingForm() {
    const coachingForm = document.getElementById('coachingForm');
    if (!coachingForm) {
        console.warn('⚠️ Formulário Coaching não encontrado');
        return;
    }
    
    console.log('✅ Formulário Coaching encontrado, configurando...');
    
    coachingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('📝 Formulário Coaching submetido');
        
        const submitButton = this.querySelector('button[type="submit"]');
        const formMessage = getOrCreateMessageContainer('coachingFormMessage', this);
        
        // Limpar mensagens anteriores
        formMessage.innerHTML = '';
        
        // Validar formulário
        if (!validateCoachingForm(this)) {
            showFormMessage(formMessage, 'error', 'Por favor, preencha todos os campos obrigatórios corretamente.');
            return;
        }
        
        // Preparar dados
        const formData = new FormData(this);
        const data = prepareCoachingData(formData);
        
        console.log('📊 Dados preparados:', data);
        
        // Mostrar loading
        setButtonLoading(submitButton, true, 'A processar...');
        showFormMessage(formMessage, 'info', 'A processar o seu agendamento...');
        
        try {
            // Verificar se tem método de pagamento selecionado
            const paymentMethod = formData.get('coaching_payment_method');
            
            if (paymentMethod) {
                // Processar pagamento
                const paymentResult = await processCoachingPayment(data, paymentMethod);
                if (paymentResult.success) {
                    // Enviar dados para backend
                    await submitCoachingToBackend(data);
                    
                    // Enviar email via Brevo
                    await sendCoachingEmail(data);
                    
                    showFormMessage(formMessage, 'success', 
                        `Sessão agendada com sucesso! ${paymentResult.message || ''}`);
                    coachingForm.reset();
                } else {
                    throw new Error(paymentResult.message || 'Erro no processamento do pagamento');
                }
            } else {
                // Sem pagamento - apenas enviar dados
                await submitCoachingToBackend(data);
                await sendCoachingEmail(data);
                
                showFormMessage(formMessage, 'success', 
                    'Pedido enviado com sucesso! Entraremos em contacto para agendar.');
                coachingForm.reset();
            }
            
        } catch (error) {
            console.error('❌ Erro no formulário Coaching:', error);
            showFormMessage(formMessage, 'error', 
                `Erro no processamento: ${error.message}. Tente novamente ou contacte-nos em samuel@share2inspire.pt`);
        } finally {
            setButtonLoading(submitButton, false, 'Agendar Sessão');
        }
    });
}

/**
 * Processar pagamento para coaching
 */
async function processCoachingPayment(data, paymentMethod) {
    console.log('💳 Processando pagamento Coaching:', paymentMethod);
    
    const paymentData = {
        orderId: `COACH-${Date.now()}`,
        amount: data.amount || "80.00", // Valor padrão para coaching
        email: data.email,
        description: `Coaching Executivo - ${data.name}`,
        service: 'Coaching Executivo'
    };
    
    if (paymentMethod === 'mbway') {
        paymentData.mobileNumber = formatPhoneForMbway(data.phone_mbway);
    }
    
    return await window.ifthenpayIntegration.processPayment(paymentMethod, paymentData);
}

/**
 * Enviar dados para o backend
 */
async function submitCoachingToBackend(data) {
    console.log('📤 Enviando dados Coaching para backend...');
    
    const response = await fetch('https://share2inspire-backend.onrender.com/booking', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...data,
            service: 'Coaching Executivo',
            type: 'coaching'
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
async function sendCoachingEmail(data) {
    console.log('📧 Enviando email Coaching via Brevo...');
    
    if (typeof window.brevoIntegration !== 'undefined') {
        await window.brevoIntegration.sendCoachingEmail(data);
    } else {
        console.warn('⚠️ Brevo integration não disponível');
    }
}

/**
 * Validar formulário de coaching
 */
function validateCoachingForm(form) {
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
    const paymentMethod = form.querySelector('input[name="coaching_payment_method"]:checked');
    if (paymentMethod && paymentMethod.value === 'mbway') {
        const phone = form.querySelector('[name="phone_mbway"]');
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
function prepareCoachingData(formData) {
    return {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        company: formData.get('company'),
        position: formData.get('position'),
        experience: formData.get('experience'),
        goals: formData.get('goals'),
        challenges: formData.get('challenges'),
        availability: formData.get('availability'),
        phone_mbway: formData.get('phone_mbway'),
        payment_method: formData.get('coaching_payment_method'),
        service: 'Coaching Executivo',
        timestamp: new Date().toISOString()
    };
}

// Funções utilitárias (se não existirem)
if (typeof getOrCreateMessageContainer === 'undefined') {
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
}

if (typeof showFormMessage === 'undefined') {
    function showFormMessage(container, type, message) {
        const alertClass = type === 'success' ? 'alert-success' : 
                          type === 'error' ? 'alert-danger' : 'alert-info';
        container.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
    }
}

if (typeof setButtonLoading === 'undefined') {
    function setButtonLoading(button, loading, text) {
        if (loading) {
            button.disabled = true;
            button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${text}`;
        } else {
            button.disabled = false;
            button.innerHTML = text;
        }
    }
}

if (typeof isValidEmail === 'undefined') {
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}

if (typeof formatPhoneForMbway === 'undefined') {
    function formatPhoneForMbway(phone) {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.startsWith('351') ? cleaned : `351${cleaned}`;
    }
}

