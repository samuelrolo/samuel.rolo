/**
 * Utilitários Centralizados para Formulários - Share2Inspire
 * Versão 1.0 - Junho 2025
 * 
 * Este ficheiro centraliza todas as funções utilitárias comuns usadas pelos diferentes
 * formulários modais, eliminando redundâncias e facilitando a manutenção.
 */

window.formUtils = {
    /**
     * Obter ou criar container para mensagens de formulário
     * @param {string} id - ID do container de mensagens
     * @param {HTMLElement} form - Elemento do formulário
     * @returns {HTMLElement} Container de mensagens
     */
    getOrCreateMessageContainer: function(id, form) {
        let container = document.getElementById(id);
        if (!container) {
            container = document.createElement('div');
            container.id = id;
            container.className = 'form-message mt-3';
            form.appendChild(container);
        }
        return container;
    },

    /**
     * Mostrar mensagem de formulário
     * @param {HTMLElement} container - Container para a mensagem
     * @param {string} type - Tipo de mensagem ('success', 'error', 'info')
     * @param {string} message - Texto da mensagem
     */
    showFormMessage: function(container, type, message) {
        const alertClass = type === 'success' ? 'alert-success' : 
                          type === 'error' ? 'alert-danger' : 'alert-info';
        container.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
        
        // Auto dismiss após 8 segundos para mensagens de sucesso
        if (type === 'success') {
            setTimeout(() => {
                const alert = container.querySelector('.alert');
                if (alert) {
                    alert.classList.remove('show');
                    setTimeout(() => container.innerHTML = '', 150);
                }
            }, 8000);
        }
    },

    /**
     * Configurar estado de loading para botão
     * @param {HTMLElement} button - Elemento do botão
     * @param {boolean} loading - Estado de loading
     * @param {string} text - Texto a mostrar
     */
    setButtonLoading: function(button, loading, text) {
        if (loading) {
            button.disabled = true;
            button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${text}`;
        } else {
            button.disabled = false;
            button.innerHTML = text;
        }
    },

    /**
     * Validar formato de email
     * @param {string} email - Email a validar
     * @returns {boolean} Resultado da validação
     */
    isValidEmail: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    /**
     * Validar campos obrigatórios de um formulário
     * @param {HTMLFormElement} form - Formulário a validar
     * @param {Array<string>} requiredFields - Lista de campos obrigatórios
     * @returns {boolean} Resultado da validação
     */
    validateRequiredFields: function(form, requiredFields) {
        for (const field of requiredFields) {
            const input = form.querySelector(`[name="${field}"]`);
            if (!input || !input.value.trim()) {
                console.warn(`⚠️ Campo obrigatório vazio: ${field}`);
                return false;
            }
        }
        return true;
    },

    /**
     * Validar email em formulário
     * @param {HTMLFormElement} form - Formulário a validar
     * @returns {boolean} Resultado da validação
     */
    validateEmail: function(form) {
        const email = form.querySelector('[name="email"]').value;
        if (!this.isValidEmail(email)) {
            console.warn('⚠️ Email inválido');
            return false;
        }
        return true;
    },

    /**
     * Configurar limpeza quando modal fechar
     * @param {string} modalId - ID do modal
     * @param {string} formId - ID do formulário
     */
    setupModalCleanup: function(modalId, formId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.addEventListener('hidden.bs.modal', function() {
            console.log('🚪 Modal fechado - limpando formulário');
            const form = document.getElementById(formId);
            if (form) form.reset();
            
            // Limpar mensagens
            const messageDiv = document.getElementById(`${formId}Message`);
            if (messageDiv) {
                messageDiv.innerHTML = '';
            }
        });
    },

    /**
     * URLs do backend
     */
    backendUrls: {
        // URL principal do backend
        base: 'https://share2inspire-beckend.lm.r.appspot.com',
        
        // Endpoints específicos
        booking: 'https://share2inspire-beckend.lm.r.appspot.com/booking',
        
        // Endpoints Brevo
        brevo: {
            kickstart: 'https://share2inspire-beckend.lm.r.appspot.com/email/kickstart',
            consultoria: 'https://share2inspire-beckend.lm.r.appspot.com/email/consultoria',
            coaching: 'https://share2inspire-beckend.lm.r.appspot.com/email/coaching',
            workshops: 'https://share2inspire-beckend.lm.r.appspot.com/email/workshops',
            contact: 'https://share2inspire-beckend.lm.r.appspot.com/email/contact'
        }
    }
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Form Utils - Utilitários Centralizados Carregados');
});

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.formUtils;
}
