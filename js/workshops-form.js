/**
 * Formulário de Workshops - Share2Inspire 
 * VERSÃO CORRIGIDA COM SELEÇÃO DE PAGAMENTO - Junho 2025
 * Integração com backend, Ifthenpay e Brevo
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Workshops Form - Versão com Pagamento Carregada');
    setupWorkshopsForm();
    setupWorkshopsPaymentHandlers();
});

/**
 * Configuração dos handlers de pagamento para workshops
 */
function setupWorkshopsPaymentHandlers() {
    const paymentRadios = document.querySelectorAll('input[name="workshops_payment_method"]');
    const phoneGroup = document.getElementById('workshopsPhoneGroup');
    
    if (paymentRadios.length === 0) {
        console.log('ℹ️ Workshops: Sem métodos de pagamento configurados');
        return;
    }
    
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (phoneGroup) {
                phoneGroup.style.display = this.value === 'mbway' ? 'block' : 'none';
                const phoneInput = document.getElementById('workshopsPhoneMbway');
                if (phoneInput) {
                    phoneInput.required = this.value === 'mbway';
                }
            }
        });
    });
}

/**
 * Configuração principal do formulário de workshops
 */
function setupWorkshopsForm() {
    const workshopsForm = document.getElementById('workshopsForm');
    if (!workshopsForm) {
        console.warn('⚠️ Formulário Workshops não encontrado');
        return;
    }
    
    console.log('✅ Formulário Workshops encontrado, configurando...');
    
    workshopsForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('📝 Formulário Workshops submetido');
        
        const submitButton = this.querySelector('button[type="submit"]');
        const formMessage = getOrCreateMessageContainer('workshopsFormMessage', this);
        
        // Limpar mensagens anteriores
        formMessage.innerHTML = '';
        
        // Validar formulário
        if (!validateWorkshopsForm(this)) {
            showFormMessage(formMessage, 'error', 'Por favor, preencha todos os campos obrigatórios corretamente.');
            return;
        }
        
        // Preparar dados
        const formData = new FormData(this);
        const data = prepareWorkshopsData(formData);
        
        console.log('📊 Dados preparados:', data);
        
        // Mostrar loading
        setButtonLoading(submitButton, true, 'A processar...');
        showFormMessage(formMessage, 'info', 'A processar a sua solicitação...');
        
        try {
            // Verificar se tem método de pagamento selecionado
            const paymentMethod = formData.get('workshops_payment_method');
            
            if (paymentMethod) {
                // Processar pagamento
                const paymentResult = await processWorkshopsPayment(data, paymentMethod);
                if (paymentResult.success) {
                    // Enviar dados para backend
                    await submitWorkshopsToBackend(data);
                    
                    // Enviar email via Brevo
                    await sendWorkshopsEmail(data);
                    
                    showFormMessage(formMessage, 'success', 
                        `Workshop solicitado com sucesso! ${paymentResult.message || ''}`);
                    workshopsForm.reset();
                } else {
                    throw new Error(paymentResult.message || 'Erro no processamento do pagamento');
                }
            } else {
                // Sem pagamento - apenas enviar dados
                await submitWorkshopsToBackend(data);
                await sendWorkshopsEmail(data);
                
                showFormMessage(formMessage, 'success', 
                    'Solicitação enviada com sucesso! Entraremos em contacto brevemente.');
                workshopsForm.reset();
            }
            
        } catch (error) {
            console.error('❌ Erro no formulário Workshops:', error);
            showFormMessage(formMessage, 'error', 
                `Erro no processamento: ${error.message}. Tente novamente ou contacte-nos em samuel@share2inspire.pt`);
        } finally {
            setButtonLoading(submitButton, false, 'Solicitar Informações');
        }
    });
}

/**
 * Processar pagamento para workshops
 */
async function processWorkshopsPayment(data, paymentMethod) {
    console.log('💳 Processando pagamento Workshops:', paymentMethod);
    
    const paymentData = {
        orderId: `WORK-${Date.now()}`,
        amount: data.amount || "200.00", // Valor padrão para workshops
        email: data.email,
        description: `Workshop - ${data.theme} - ${data.name}`,
        service: 'Workshops e Formações'
    };
    
    if (paymentMethod === 'mbway') {
        paymentData.mobileNumber = formatPhoneForMbway(data.phone_mbway);
    }
    
    return await window.ifthenpayIntegration.processPayment(paymentMethod, paymentData);
}

/**
 * Enviar dados para o backend
 */
async function submitWorkshopsToBackend(data) {
    console.log('📤 Enviando dados Workshops para backend...');
    
    const response = await fetch('https://share2inspire-backend.onrender.com/booking', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...data,
            service: 'Workshops e Formações',
            type: 'workshops'
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
async function sendWorkshopsEmail(data) {
    console.log('📧 Enviando email Workshops via Brevo...');
    
    if (typeof window.brevoIntegration !== 'undefined') {
        await window.brevoIntegration.sendWorkshopsEmail(data);
    } else {
        console.warn('⚠️ Brevo integration não disponível');
    }
}

/**
 * Validar formulário de workshops
 */
function validateWorkshopsForm(form) {
    const requiredFields = ['name', 'email', 'theme', 'objectives'];
    
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
    const paymentMethod = form.querySelector('input[name="workshops_payment_method"]:checked');
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
function prepareWorkshopsData(formData) {
    return {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        company: formData.get('company'),
        position: formData.get('position'),
        participants: formData.get('participants'),
        format: formData.get('format'),
        duration: formData.get('duration'),
        theme: formData.get('theme'),
        objectives: formData.get('objectives'),
        timeline: formData.get('timeline'),
        phone_mbway: formData.get('phone_mbway'),
        payment_method: formData.get('workshops_payment_method'),
        service: 'Workshops e Formações',
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

