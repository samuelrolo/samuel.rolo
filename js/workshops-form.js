/**
 * Formulário de Workshops - Share2Inspire
 * VERSÃO CORRIGIDA SEM PAGAMENTO - Junho 2025
 * Apenas envio de email via Brevo
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Workshops Form - Versão Apenas Email Carregada');
    setupWorkshopsForm();
});

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
            // Enviar dados para backend
            await submitWorkshopsToBackend(data);
            
            // Enviar email via Brevo
            await sendWorkshopsEmail(data);
            
            showFormMessage(formMessage, 'success', 'Workshop solicitado com sucesso! Entraremos em contacto brevemente para apresentar uma proposta personalizada.');
            workshopsForm.reset();

        } catch (error) {
            console.error('❌ Erro no formulário Workshops:', error);
            showFormMessage(formMessage, 'error', `Erro no processamento: ${error.message}. Tente novamente ou contacte-nos em samuel@share2inspire.pt`);
        } finally {
            setButtonLoading(submitButton, false, 'Solicitar Informações');
        }
    });
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

