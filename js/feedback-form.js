/**
 * Formulário de Feedback - Share2Inspire
 * Versão corrigida utilizando os utilitários centralizados
 */

// Executar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Inicializando sistema de feedback...');
    initFeedbackSystem();
});

/**
 * Initialize feedback system
 */
function initFeedbackSystem() {
    // Get feedback button and modal elements
    const feedbackBtn = document.getElementById('feedbackBtn');
    const feedbackModal = document.getElementById('feedbackModal');
    
    if (!feedbackBtn || !feedbackModal) {
        console.warn('⚠️ Elementos de feedback não encontrados. O sistema de feedback não será inicializado.');
        return;
    }
    
    console.log('✅ Elementos de feedback encontrados, inicializando...');
    
    // Initialize feedback modal
    const modal = new bootstrap.Modal(feedbackModal);
    
    // Open feedback modal when button is clicked
    feedbackBtn.addEventListener('click', function() {
        modal.show();
    });
    
    // Handle star rating selection
    const stars = document.querySelectorAll('.rating .star');
    const ratingInput = document.getElementById('rating');
    
    if (!stars.length || !ratingInput) {
        console.warn('⚠️ Elementos de avaliação não encontrados.');
        return;
    }
    
    stars.forEach(function(star) {
        star.addEventListener('mouseenter', function() {
            const value = parseInt(this.getAttribute('data-value'));
            
            // Highlight stars on hover
            stars.forEach(function(s, index) {
                if (index < value) {
                    s.classList.add('hover');
                } else {
                    s.classList.remove('hover');
                }
            });
        });
        
        star.addEventListener('mouseleave', function() {
            // Remove hover effect
            stars.forEach(function(s) {
                s.classList.remove('hover');
            });
        });
        
        star.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            ratingInput.value = value;
            
            // Reset all stars
            stars.forEach(function(s) {
                s.classList.remove('active');
            });
            
            // Highlight selected stars
            for (let i = 0; i < value; i++) {
                stars[i].classList.add('active');
            }
        });
    });
    
    // Setup feedback form submission
    setupFeedbackFormSubmission();
    
    // Reset form when modal is hidden
    feedbackModal.addEventListener('hidden.bs.modal', function() {
        const feedbackForm = document.getElementById('feedbackForm');
        const feedbackMessage = document.getElementById('feedbackFormMessage');
        
        if (feedbackForm) {
            feedbackForm.reset();
        }
        
        if (feedbackMessage) {
            feedbackMessage.innerHTML = '';
        }
        
        // Reset stars
        stars.forEach(function(s) {
            s.classList.remove('active');
            s.classList.remove('hover');
        });
        
        if (ratingInput) {
            ratingInput.value = '0';
        }
    });
}

/**
 * Setup feedback form submission
 */
function setupFeedbackFormSubmission() {
    const feedbackForm = document.getElementById('feedbackForm');
    if (!feedbackForm) {
        console.warn('⚠️ Formulário de feedback não encontrado.');
        return;
    }
    
    // Create message element if it doesn't exist
    let feedbackFormMessage = document.getElementById('feedbackFormMessage');
    if (!feedbackFormMessage) {
        feedbackFormMessage = document.createElement('div');
        feedbackFormMessage.id = 'feedbackFormMessage';
        feedbackFormMessage.className = 'mt-3';
        feedbackForm.appendChild(feedbackFormMessage);
    }
    
    feedbackForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(feedbackForm);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });
        
        // Add source information
        data.source = 'website_feedback';
        
        // Validar dados
        if (!window.formUtils.validateRequiredFields(feedbackForm, ['name', 'email', 'message'])) {
            window.formUtils.showFormMessage(feedbackFormMessage, 'error', 'Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        
        if (!window.formUtils.validateEmail(feedbackForm)) {
            window.formUtils.showFormMessage(feedbackFormMessage, 'error', 'Por favor, insira um email válido.');
            return;
        }
        
        // Show loading message
        window.formUtils.showFormMessage(feedbackFormMessage, 'info', 'A processar o seu pedido. Por favor aguarde...');
        
        // Disable submit button
        const submitButton = feedbackForm.querySelector('button[type="submit"]');
        if (submitButton) {
            window.formUtils.setButtonLoading(submitButton, true, 'A enviar...');
        }
        
        console.log('📤 Enviando feedback para o backend:', data);
        
        // Lista de endpoints a tentar, em ordem de prioridade
        const endpoints = [
            window.formUtils.backendUrls.brevo.contact, // Endpoint principal
            'https://share2inspire-beckend.lm.r.appspot.com/api/feedback/submit', // Endpoint original
            'https://share2inspire-beckend.lm.r.appspot.com/api/feedback/contact' // Endpoint alternativo
        ];
        
        // Tentar enviar para cada endpoint até que um funcione
        tryEndpoints(endpoints, 0, data, feedbackFormMessage, feedbackForm, submitButton, function() {
            // Close modal after 3 seconds on success
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('feedbackModal'));
                if (modal) modal.hide();
            }, 3000);
        });
    });
}

/**
 * Try sending data to multiple endpoints until one succeeds
 * @param {Array} endpoints - List of endpoints to try
 * @param {number} index - Current endpoint index
 * @param {Object} data - Data to send
 * @param {HTMLElement} messageElement - Message element for feedback
 * @param {HTMLFormElement} form - Form to reset on success
 * @param {HTMLButtonElement} submitButton - Submit button to re-enable
 * @param {Function} successCallback - Callback function on success
 */
function tryEndpoints(endpoints, index, data, messageElement, form, submitButton, successCallback) {
    if (index >= endpoints.length) {
        // Todos os endpoints falharam
        console.error('❌ Todos os endpoints falharam');
        window.formUtils.showFormMessage(messageElement, 'error', 'Erro ao enviar feedback. Por favor tente novamente mais tarde.');
        
        // Reabilitar botão
        if (submitButton) {
            window.formUtils.setButtonLoading(submitButton, false, 'Enviar Feedback');
        }
        return;
    }
    
    const currentEndpoint = endpoints[index];
    console.log(`🔄 Tentando endpoint ${index + 1}/${endpoints.length}: ${currentEndpoint}`);
    
    // Send to backend
    fetch(currentEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        console.log('📥 Resposta recebida:', response.status, response.statusText);
        
        // Verificar se a resposta é JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json().then(data => {
                if (!response.ok) {
                    throw new Error(data.error || `Erro ${response.status}: ${response.statusText}`);
                }
                return data;
            });
        } else {
            // Se não for JSON, obter o texto e mostrar erro
            return response.text().then(text => {
                console.error('⚠️ Resposta não-JSON recebida:', text);
                throw new Error(`Resposta inesperada do servidor (${response.status})`);
            });
        }
    })
    .then(result => {
        // Success
        console.log('✅ Feedback enviado com sucesso!');
        window.formUtils.showFormMessage(messageElement, 'success', 'Obrigado pelo seu feedback! A sua opinião é muito importante para nós.');
        
        // Reset form
        form.reset();
        
        // Reset stars
        const stars = document.querySelectorAll('.rating .star');
        stars.forEach(function(s) {
            s.classList.remove('active');
        });
        
        const ratingInput = document.getElementById('rating');
        if (ratingInput) {
            ratingInput.value = '0';
        }
        
        // Re-enable submit button
        if (submitButton) {
            window.formUtils.setButtonLoading(submitButton, false, 'Enviar Feedback');
        }
        
        // Call success callback if provided
        if (successCallback && typeof successCallback === 'function') {
            successCallback(result);
        }
    })
    .catch(error => {
        console.error('❌ Erro ao enviar para endpoint:', currentEndpoint, error);
        
        // Try next endpoint
        tryEndpoints(endpoints, index + 1, data, messageElement, form, submitButton, successCallback);
    });
}
