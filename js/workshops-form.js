/**
 * Formulário de Workshops - Share2Inspire
 * VERSÃO ATUALIZADA - Junho 2025
 * - Utiliza utilitário centralizado form-utils.js
 * - Apenas envio de email via Brevo
 * - URLs consistentes com o resto do sistema
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Workshops Form - Versão Atualizada Carregada');
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

    // Configurar limpeza quando modal fechar
    window.formUtils.setupModalCleanup('workshopsModal', 'workshopsForm');

    workshopsForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('📝 Formulário Workshops submetido');

        const submitButton = this.querySelector('button[type="submit"]');
        const formMessage = window.formUtils.getOrCreateMessageContainer('workshopsFormMessage', this);

        // Limpar mensagens anteriores
        formMessage.innerHTML = '';

        // Validar formulário
        if (!validateWorkshopsForm(this)) {
            window.formUtils.showFormMessage(formMessage, 'error', 'Por favor, preencha todos os campos obrigatórios corretamente.');
            return;
        }

        // Preparar dados
        const formData = new FormData(this);
        const data = prepareWorkshopsData(formData);
        console.log('📊 Dados preparados:', data);

        // Mostrar loading
        window.formUtils.setButtonLoading(submitButton, true, 'A processar...');
        window.formUtils.showFormMessage(formMessage, 'info', 'A processar a sua solicitação...');

        try {
            // Enviar dados para backend
            await submitWorkshopsToBackend(data);
            
            // Enviar email via Brevo
            await sendWorkshopsEmail(data);
            
            window.formUtils.showFormMessage(formMessage, 'success', 'Workshop solicitado com sucesso! Entraremos em contacto brevemente para apresentar uma proposta personalizada.');
            workshopsForm.reset();

        } catch (error) {
            console.error('❌ Erro no formulário Workshops:', error);
            window.formUtils.showFormMessage(formMessage, 'error', `Erro no processamento: ${error.message}. Tente novamente ou contacte-nos em samuel@share2inspire.pt`);
        } finally {
            window.formUtils.setButtonLoading(submitButton, false, 'Solicitar Informações');
        }
    });
}

/**
 * Enviar dados para o backend
 */
async function submitWorkshopsToBackend(data) {
    console.log('📤 Enviando dados Workshops para backend...');
    
    const response = await fetch(window.formUtils.backendUrls.booking, {
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
