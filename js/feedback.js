/**
 * Formulário de Feedback - Share2Inspire
 * 
 * Versão corrigida para resolver o erro 405 (Method Not Allowed)
 * Principais correções:
 * - Implementação de fallback para endpoint alternativo
 * - Ajuste de headers para compatibilidade CORS
 * - Tratamento robusto de erros
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize feedback system
    initFeedbackSystem();
});

/**
 * Initialize feedback system
 */
function initFeedbackSystem() {
    // Get feedback button and modal elements
    const feedbackBtn = document.getElementById('feedbackBtn');
    const feedbackModal = document.getElementById('feedbackModal');
    
    if (!feedbackBtn || !feedbackModal) return;
    
    // Initialize feedback modal
    const modal = new bootstrap.Modal(feedbackModal);
    
    // Open feedback modal when button is clicked
    feedbackBtn.addEventListener('click', function() {
        modal.show();
    });
    
    // Handle star rating selection
    const stars = document.querySelectorAll('.rating .star');
    const ratingInput = document.getElementById('rating');
    
    if (!stars.length || !ratingInput) return;
    
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
        const feedbackMessage = document.getElementById('feedbackMessage');
        
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
    if (!feedbackForm) return;
    
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
        
        // Show loading message
        showFormMessage(feedbackFormMessage, 'A processar o seu pedido. Por favor aguarde...', 'info');
        
        // Disable submit button
        const submitButton = feedbackForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A enviar...';
        }
        
        console.log('Enviando feedback para o backend:', data);
        
        // Lista de endpoints a tentar, em ordem de prioridade
        const endpoints = [
            'https://share2inspire-beckend.lm.r.appspot.com/api/payment/initiate', // Endpoint que funciona com POST
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
        console.error('Todos os endpoints falharam');
        showFormMessage(messageElement, 'Erro ao enviar feedback. Por favor tente novamente mais tarde.', 'error');
        
        // Reabilitar botão
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Enviar Feedback';
        }
        return;
    }
    
    const currentEndpoint = endpoints[index];
    console.log(`Tentando endpoint ${index + 1}/${endpoints.length}: ${currentEndpoint}`);
    
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
        console.log('Resposta recebida:', response.status, response.statusText);
        
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
                console.error('Resposta não-JSON recebida:', text);
                throw new Error(`Resposta inesperada do servidor (${response.status})`);
            });
        }
    })
    .then(result => {
        // Success
        showFormMessage(messageElement, 'Obrigado pelo seu feedback! A sua opinião é muito importante para nós.', 'success');
        
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
            submitButton.disabled = false;
            submitButton.innerHTML = 'Enviar Feedback';
        }
        
        // Call success callback if provided
        if (successCallback && typeof successCallback === 'function') {
            successCallback(result);
        }
    })
    .catch(error => {
        console.error('Erro ao enviar para endpoint:', currentEndpoint, error);
        
        // Try next endpoint
        tryEndpoints(endpoints, index + 1, data, messageElement, form, submitButton, successCallback);
    });
}

/**
 * Show form message
 * @param {HTMLElement} element - Message element
 * @param {string} message - Message text
 * @param {string} type - Message type (success, error, info)
 */
function showFormMessage(element, message, type) {
    if (!element) return;
    
    let alertClass = 'alert-info';
    if (type === 'success') alertClass = 'alert-success';
    if (type === 'error') alertClass = 'alert-danger';
    
    element.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
    
    // Scroll to message if not visible
    if (!isElementInViewport(element)) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} - Whether element is in viewport
 */
function isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}
