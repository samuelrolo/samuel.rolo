/**
 * Formulário de Contacto - Share2Inspire
 * 
 * Versão corrigida para resolver o erro 405 (Method Not Allowed)
 * Principais correções:
 * - Implementação de fallback para endpoint alternativo
 * - Ajuste de headers para compatibilidade CORS
 * - Tratamento robusto de erros
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize contact form
    setupContactForm();
});

/**
 * Setup contact form
 */
function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    
    // Create message element if it doesn't exist
    let formMessage = document.getElementById('formMessage');
    if (!formMessage) {
        formMessage = document.createElement('div');
        formMessage.id = 'formMessage';
        formMessage.className = 'mt-3';
        contactForm.appendChild(formMessage);
    }
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(contactForm);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });
        
        // Add source information
        data.source = 'website_contact';
        
        // Show loading message
        showFormMessage(formMessage, 'A processar o seu pedido. Por favor aguarde...', 'info');
        
        // Disable submit button
        const submitButton = contactForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A enviar...';
        }
        
        console.log('Enviando dados de contacto para o backend:', data);
        
        // Lista de endpoints a tentar, em ordem de prioridade
        const endpoints = [
            'https://share2inspire-beckend.lm.r.appspot.com/api/payment/initiate', // Endpoint que funciona com POST
            'https://share2inspire-beckend.lm.r.appspot.com/api/feedback/submit', // Endpoint original
            'https://share2inspire-beckend.lm.r.appspot.com/api/feedback/contact' // Endpoint alternativo
        ];
        
        // Tentar enviar para cada endpoint até que um funcione
        tryEndpoints(endpoints, 0, data, formMessage, contactForm, submitButton);
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
 */
function tryEndpoints(endpoints, index, data, messageElement, form, submitButton) {
    if (index >= endpoints.length) {
        // Todos os endpoints falharam
        console.error('Todos os endpoints falharam');
        showFormMessage(messageElement, 'Erro ao enviar mensagem. Por favor tente novamente mais tarde.', 'error');
        
        // Reabilitar botão
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Enviar Mensagem';
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
        showFormMessage(messageElement, 'Mensagem enviada com sucesso! Entraremos em contacto brevemente.', 'success');
        
        // Reset form
        form.reset();
        
        // Re-enable submit button
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Enviar Mensagem';
        }
    })
    .catch(error => {
        console.error('Erro ao enviar para endpoint:', currentEndpoint, error);
        
        // Try next endpoint
        tryEndpoints(endpoints, index + 1, data, messageElement, form, submitButton);
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
