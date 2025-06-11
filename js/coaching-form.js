/**
 * Formulário de Coaching - Share2Inspire
 * VERSÃO CORRIGIDA SEM PAGAMENTO - Junho 2025
 * Apenas envio de email via Brevo
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Coaching Form - Versão Apenas Email Carregada');
    setupCoachingForm();
});

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
        showFormMessage(formMessage, 'info', 'A processar a sua solicitação...');

        try {
            // Enviar dados para backend
            await submitCoachingToBackend(data);
            
            // Enviar email via Brevo
            await sendCoachingEmail(data);
            
            showFormMessage(formMessage, 'success', 'Sessão de coaching solicitada com sucesso! Entraremos em contacto brevemente para agendar a sua sessão inicial gratuita.');
            coachingForm.reset();

        } catch (error) {
            console.error('❌ Erro no formulário Coaching:', error);
            showFormMessage(formMessage, 'error', `Erro no processamento: ${error.message}. Tente novamente ou contacte-nos em samuel@share2inspire.pt`);
        } finally {
            setButtonLoading(submitButton, false, 'Agendar Sessão');
        }
    });
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
    const requiredFields = ['name', 'email', 'goals'];
    
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

