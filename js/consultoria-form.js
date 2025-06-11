/**
 * Formulário de Consultoria - Share2Inspire 
 * VERSÃO CORRIGIDA COM SELEÇÃO DE PAGAMENTO - Junho 2025
 * Integração com backend, Ifthenpay e Brevo
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Consultoria Form - Versão com Pagamento Carregada');
    setupConsultoriaForm();
    setupConsultoriaPaymentHandlers();
});

/**
 * Configuração dos handlers de pagamento para consultoria
 */
function setupConsultoriaPaymentHandlers() {
    const paymentRadios = document.querySelectorAll('input[name="consultoria_payment_method"]');
    const phoneGroup = document.getElementById('consultoriaPhoneGroup');
    
    if (paymentRadios.length === 0) {
        console.log('ℹ️ Consultoria: Sem métodos de pagamento configurados');
        return;
    }
    
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (phoneGroup) {
                phoneGroup.style.display = this.value === 'mbway' ? 'block' : 'none';
                const phoneInput = document.getElementById('consultoriaPhoneMbway');
                if (phoneInput) {
                    phoneInput.required = this.value === 'mbway';
                }
            }
        });
    });
}

/**
 * Configuração principal do formulário de consultoria
 */
function setupConsultoriaForm() {
    const consultoriaForm = document.getElementById('consultoriaForm');
    if (!consultoriaForm) {
        console.warn('⚠️ Formulário Consultoria não encontrado');
        return;
    }
    
    console.log('✅ Formulário Consultoria encontrado, configurando...');
    
    consultoriaForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('📝 Formulário Consultoria submetido');
        
        const submitButton = this.querySelector('button[type="submit"]');
        const formMessage = getOrCreateMessageContainer('consultoriaFormMessage', this);
        
        // Limpar mensagens anteriores
        formMessage.innerHTML = '';
        
        // Validar formulário
        if (!validateConsultoriaForm(this)) {
            showFormMessage(formMessage, 'error', 'Por favor, preencha todos os campos obrigatórios corretamente.');
            return;
        }
        
        // Preparar dados
        const formData = new FormData(this);
        const data = prepareConsultoriaData(formData);
        
        console.log('📊 Dados preparados:', data);
        
        // Mostrar loading
        setButtonLoading(submitButton, true, 'A processar...');
        showFormMessage(formMessage, 'info', 'A processar a sua solicitação...');
        
        try {
            // Verificar se tem método de pagamento selecionado
            const paymentMethod = formData.get('consultoria_payment_method');
            
            if (paymentMethod) {
                // Processar pagamento
                const paymentResult = await processConsultoriaPayment(data, paymentMethod);
                if (paymentResult.success) {
                    // Enviar dados para backend
                    await submitConsultoriaToBackend(data);
                    
                    // Enviar email via Brevo
                    await sendConsultoriaEmail(data);
                    
                    showFormMessage(formMessage, 'success', 
                        `Proposta solicitada com sucesso! ${paymentResult.message || ''}`);
                    consultoriaForm.reset();
                } else {
                    throw new Error(paymentResult.message || 'Erro no processamento do pagamento');
                }
            } else {
                // Sem pagamento - apenas enviar dados
                await submitConsultoriaToBackend(data);
                await sendConsultoriaEmail(data);
                
                showFormMessage(formMessage, 'success', 
                    'Proposta solicitada com sucesso! Entraremos em contacto brevemente.');
                consultoriaForm.reset();
            }
            
        } catch (error) {
            console.error('❌ Erro no formulário Consultoria:', error);
            showFormMessage(formMessage, 'error', 
                `Erro no processamento: ${error.message}. Tente novamente ou contacte-nos em samuel@share2inspire.pt`);
        } finally {
            setButtonLoading(submitButton, false, 'Solicitar Proposta');
        }
    });
}

/**
 * Processar pagamento para consultoria
 */
async function processConsultoriaPayment(data, paymentMethod) {
    console.log('💳 Processando pagamento Consultoria:', paymentMethod);
    
    const paymentData = {
        orderId: `CONS-${Date.now()}`,
        amount: data.amount || "150.00", // Valor padrão para consultoria
        email: data.email,
        description: `Consultoria Organizacional - ${data.name}`,
        service: 'Consultoria Organizacional'
    };
    
    if (paymentMethod === 'mbway') {
        paymentData.mobileNumber = formatPhoneForMbway(data.phone_mbway);
    }
    
    return await window.ifthenpayIntegration.processPayment(paymentMethod, paymentData);
}

/**
 * Enviar dados para o backend
 */
async function submitConsultoriaToBackend(data) {
    console.log('📤 Enviando dados Consultoria para backend...');
    
    const response = await fetch('https://share2inspire-backend.onrender.com/booking', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...data,
            service: 'Consultoria Organizacional',
            type: 'consultoria'
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
async function sendConsultoriaEmail(data) {
    console.log('📧 Enviando email Consultoria via Brevo...');
    
    if (typeof window.brevoIntegration !== 'undefined') {
        await window.brevoIntegration.sendConsultoriaEmail(data);
    } else {
        console.warn('⚠️ Brevo integration não disponível');
    }
}

/**
 * Validar formulário de consultoria
 */
function validateConsultoriaForm(form) {
    const requiredFields = ['name', 'email', 'company', 'project'];
    
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
    const paymentMethod = form.querySelector('input[name="consultoria_payment_method"]:checked');
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
function prepareConsultoriaData(formData) {
    return {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        company: formData.get('company'),
        position: formData.get('position'),
        size: formData.get('size'),
        project: formData.get('project'),
        objectives: formData.get('objectives'),
        phone_mbway: formData.get('phone_mbway'),
        payment_method: formData.get('consultoria_payment_method'),
        service: 'Consultoria Organizacional',
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

