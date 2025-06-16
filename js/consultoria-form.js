/**
 * Formulário de Consultoria - Share2Inspire
 * VERSÃO ATUALIZADA - Junho 2025
 * - Utiliza utilitário centralizado form-utils.js
 * - Apenas envio de email via Brevo
 * - URLs consistentes com o resto do sistema
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Consultoria Form - Versão Atualizada Carregada');
    setupConsultoriaForm();
});

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

    // Configurar limpeza quando modal fechar
    window.formUtils.setupModalCleanup('consultoriaModal', 'consultoriaForm');

    consultoriaForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('📝 Formulário Consultoria submetido');

        const submitButton = this.querySelector('button[type="submit"]');
        const formMessage = window.formUtils.getOrCreateMessageContainer('consultoriaFormMessage', this);

        // Limpar mensagens anteriores
        formMessage.innerHTML = '';

        // Validar formulário
        if (!validateConsultoriaForm(this)) {
            window.formUtils.showFormMessage(formMessage, 'error', 'Por favor, preencha todos os campos obrigatórios corretamente.');
            return;
        }

        // Preparar dados
        const formData = new FormData(this);
        const data = prepareConsultoriaData(formData);
        console.log('📊 Dados preparados:', data);

        // Mostrar loading
        window.formUtils.setButtonLoading(submitButton, true, 'A processar...');
        window.formUtils.showFormMessage(formMessage, 'info', 'A processar a sua solicitação...');

        try {
            // Enviar dados para backend
            await submitConsultoriaToBackend(data);
            
            // Enviar email via Brevo
            await sendConsultoriaEmail(data);
            
            window.formUtils.showFormMessage(formMessage, 'success', 'Proposta solicitada com sucesso! Entraremos em contacto brevemente para apresentar uma proposta personalizada.');
            consultoriaForm.reset();

        } catch (error) {
            console.error('❌ Erro no formulário Consultoria:', error);
            window.formUtils.showFormMessage(formMessage, 'error', `Erro no processamento: ${error.message}. Tente novamente ou contacte-nos em samuel@share2inspire.pt`);
        } finally {
            window.formUtils.setButtonLoading(submitButton, false, 'Solicitar Proposta');
        }
    });
}

/**
 * Enviar dados para o backend
 */
async function submitConsultoriaToBackend(data) {
    console.log('📤 Enviando dados Consultoria para backend...');
    
    const response = await fetch(window.formUtils.backendUrls.booking, {
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
        service: 'Consultoria Organizacional',
        timestamp: new Date().toISOString()
    };
}
