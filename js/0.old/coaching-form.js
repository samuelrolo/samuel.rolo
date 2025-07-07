/**
 * Formulário de Coaching - Share2Inspire
 * VERSÃO ATUALIZADA - Junho 2025
 * - Utiliza utilitário centralizado form-utils.js
 * - Apenas envio de email via Brevo
 * - URLs consistentes com o resto do sistema
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Coaching Form - Versão Atualizada Carregada');
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

    // Configurar limpeza quando modal fechar
    window.formUtils.setupModalCleanup('coachingModal', 'coachingForm');

    coachingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('📝 Formulário Coaching submetido');

        const submitButton = this.querySelector('button[type="submit"]');
        const formMessage = window.formUtils.getOrCreateMessageContainer('coachingFormMessage', this);

        // Limpar mensagens anteriores
        formMessage.innerHTML = '';

        // Validar formulário
        if (!validateCoachingForm(this)) {
            window.formUtils.showFormMessage(formMessage, 'error', 'Por favor, preencha todos os campos obrigatórios corretamente.');
            return;
        }

        // Preparar dados
        const formData = new FormData(this);
        const data = prepareCoachingData(formData);
        console.log('📊 Dados preparados:', data);

        // Mostrar loading
        window.formUtils.setButtonLoading(submitButton, true, 'A processar...');
        window.formUtils.showFormMessage(formMessage, 'info', 'A processar a sua solicitação...');

        try {
            // Enviar dados para backend
            await submitCoachingToBackend(data);
            
            // Enviar email via Brevo
            await sendCoachingEmail(data);
            
            window.formUtils.showFormMessage(formMessage, 'success', 'Sessão de coaching solicitada com sucesso! Entraremos em contacto brevemente para agendar a sua sessão inicial gratuita.');
            coachingForm.reset();

        } catch (error) {
            console.error('❌ Erro no formulário Coaching:', error);
            window.formUtils.showFormMessage(formMessage, 'error', `Erro no processamento: ${error.message}. Tente novamente ou contacte-nos em samuel@share2inspire.pt`);
        } finally {
            window.formUtils.setButtonLoading(submitButton, false, 'Agendar Sessão');
        }
    });
}

/**
 * Enviar dados para o backend
 */
async function submitCoachingToBackend(data) {
    console.log('📤 Enviando dados Coaching para backend...');
    
    const response = await fetch(window.formUtils.backendUrls.booking, {
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
    
    // Usar utilitário para validar campos obrigatórios
    if (!window.formUtils.validateRequiredFields(form, requiredFields)) {
        return false;
    }

    // Validar email
    if (!window.formUtils.validateEmail(form)) {
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
