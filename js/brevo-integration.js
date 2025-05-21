/**
 * Brevo Integration for Share2Inspire Website
 * This file handles all integrations with Brevo email marketing platform
 * and payment processing with Ifthenpay
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all Brevo forms
    initBrevoForms();
});

/**
 * Initialize all Brevo forms
 */
function initBrevoForms() {
    // Newsletter subscription forms
    setupNewsletterForms();
    
    // Contact form
    setupContactForm();
    
    // Service booking forms
    setupServiceForms();
    
    // Feedback form
    setupFeedbackForm();
}

/**
 * Setup newsletter subscription forms
 */
function setupNewsletterForms() {
    const newsletterForms = document.querySelectorAll('.newsletter-form');
    
    newsletterForms.forEach(form => {
        if (!form) return;
        
        // Create message element if it doesn't exist
        let messageElement = form.querySelector('.form-message');
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.className = 'form-message mt-3';
            form.appendChild(messageElement);
        }
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const emailInput = form.querySelector('input[type="email"]');
            if (!emailInput) return;
            
            const email = emailInput.value;
            if (!validateEmail(email)) {
                showFormMessage(messageElement, 'Por favor, insira um email válido.', 'error');
                return;
            }
            
            // Prepare data for API
            const data = {
                email: email,
                source: 'website_newsletter'
            };
            
            // Send to backend
            sendToBrevo('/api/feedback/newsletter', data, messageElement, 'Subscrição realizada com sucesso! Obrigado por se juntar à nossa newsletter.', form);
        });
    });
}

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
        const name = contactForm.querySelector('input[name="name"]')?.value || '';
        const email = contactForm.querySelector('input[name="email"]')?.value || '';
        const subject = contactForm.querySelector('input[name="subject"]')?.value || 'Contacto do Website';
        const message = contactForm.querySelector('textarea[name="message"]')?.value || '';
        
        // Validate email
        if (!validateEmail(email)) {
            showFormMessage(formMessage, 'Por favor, insira um email válido.', 'error');
            return;
        }
        
        // Prepare data for API
        const data = {
            name: name,
            email: email,
            subject: subject,
            message: message,
            source: 'website_contact'
        };
        
        // Send to backend
        sendToBrevo('/api/feedback/submit', data, formMessage, 'Mensagem enviada com sucesso! Entraremos em contacto brevemente.', contactForm);
    });
}

/**
 * Setup service booking forms
 */
function setupServiceForms() {
    const serviceForms = document.querySelectorAll('.service-form');
    
    serviceForms.forEach(form => {
        if (!form) return;
        
        // Create message element if it doesn't exist
        let messageElement = form.querySelector('.form-message');
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.className = 'form-message mt-3';
            form.appendChild(messageElement);
        }
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });
            
            // Add source information
            data.source = 'website_service_' + (form.id || 'unknown');
            
            // If this is the kickstart form, process payment
            if (form.id === 'kickstartForm') {
                processKickstartPayment(data, messageElement);
            } else {
                // For other forms, send to backend
                sendToBrevo('/api/feedback/submit', data, messageElement, 'Pedido recebido com sucesso! Entraremos em contacto brevemente.', form);
            }
        });
    });
}

/**
 * Process Kickstart Pro payment with Ifthenpay
 * @param {Object} data - Form data
 * @param {HTMLElement} messageElement - Message element for feedback
 */
function processKickstartPayment(data, messageElement) {
    // Show loading message
    showFormMessage(messageElement, 'A processar o seu pedido. Por favor aguarde...', 'info');
    
    // Get payment details from form
    const duration = data.duration || '30min';
    const price = duration === '30min' ? 30 : 45;
    const name = data.name || '';
    const email = data.email || '';
    const phone = data.phone || '';
    const date = data.date || '';
    const format = data.format || 'Online';
    
    // Generate unique order ID
    const orderId = 'KP' + Date.now();
    
    // Prepare payment data for API
    const paymentData = {
        paymentMethod: 'mb', // Default to Multibanco
        orderId: orderId,
        amount: price,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        description: `Kickstart Pro ${duration} - ${format} - ${date}`
    };
    
    // Call backend API to initiate payment
    fetch('/api/payment/initiate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.error || 'Erro ao processar pagamento');
            });
        }
        return response.json();
    })
    .then(result => {
        if (result.success) {
            // Payment initiated successfully
            showFormMessage(messageElement, 'Pagamento iniciado com sucesso! Redirecionando...', 'success');
            
            // Also send form data to Brevo for email notification
            sendToBrevo('/api/feedback/submit', {
                ...data,
                paymentReference: result.reference || orderId,
                paymentAmount: price,
                paymentMethod: 'Multibanco',
                source: 'website_kickstart_payment'
            }, null, null, null, false);
            
            // Redirect to success page with payment details
            setTimeout(() => {
                const params = new URLSearchParams({
                    duration: duration,
                    amount: price,
                    date: date,
                    format: format,
                    reference: result.reference || '',
                    entity: result.entity || '',
                    method: result.method || 'mb'
                });
                
                window.location.href = `/pages/pagamento-sucesso.html?${params.toString()}`;
            }, 1500);
        } else {
            // Payment failed
            showFormMessage(messageElement, result.error || 'Erro ao processar pagamento. Por favor tente novamente.', 'error');
        }
    })
    .catch(error => {
        console.error('Erro ao processar pagamento:', error);
        showFormMessage(messageElement, error.message || 'Erro ao processar pagamento. Por favor tente novamente.', 'error');
        
        // For development/testing only - remove in production
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Ambiente de desenvolvimento detectado. Simulando pagamento bem-sucedido...');
            
            setTimeout(() => {
                showFormMessage(messageElement, 'Pagamento simulado com sucesso! Redirecionando...', 'success');
                
                setTimeout(() => {
                    const params = new URLSearchParams({
                        duration: duration,
                        amount: price,
                        date: date,
                        format: format,
                        reference: '123456789',
                        entity: '11111',
                        method: 'mb'
                    });
                    
                    window.location.href = `/pages/pagamento-sucesso.html?${params.toString()}`;
                }, 1500);
            }, 1000);
        }
    });
}

/**
 * Setup feedback form
 */
function setupFeedbackForm() {
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
        const name = feedbackForm.querySelector('input[name="name"]')?.value || '';
        const email = feedbackForm.querySelector('input[name="email"]')?.value || '';
        const rating = feedbackForm.querySelector('select[name="rating"]')?.value || '5';
        const message = feedbackForm.querySelector('textarea[name="message"]')?.value || '';
        
        // Validate email
        if (email && !validateEmail(email)) {
            showFormMessage(feedbackFormMessage, 'Por favor, insira um email válido.', 'error');
            return;
        }
        
        // Prepare data for API
        const data = {
            name: name,
            email: email,
            rating: rating,
            message: message,
            source: 'website_feedback'
        };
        
        // Send to backend
        sendToBrevo('/api/feedback/submit', data, feedbackFormMessage, 'Obrigado pelo seu feedback! A sua opinião é muito importante para nós.', feedbackForm, true, function() {
            // Close modal after 3 seconds
            setTimeout(() => {
                const feedbackModal = document.getElementById('feedbackModal');
                if (feedbackModal) {
                    const modal = bootstrap.Modal.getInstance(feedbackModal);
                    if (modal) modal.hide();
                }
            }, 3000);
        });
    });
}

/**
 * Send data to Brevo API via backend
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Data to send
 * @param {HTMLElement} messageElement - Message element for feedback
 * @param {string} successMessage - Success message to show
 * @param {HTMLFormElement} form - Form to reset on success
 * @param {boolean} scrollToMessage - Whether to scroll to message
 * @param {Function} callback - Callback function on success
 */
function sendToBrevo(endpoint, data, messageElement, successMessage, form, scrollToMessage = true, callback = null) {
    // Show loading message if message element exists
    if (messageElement) {
        showFormMessage(messageElement, 'A processar o seu pedido. Por favor aguarde...', 'info', scrollToMessage);
    }
    
    // Send data to backend
    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        return response.json().then(data => {
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao processar pedido');
            }
            return data;
        });
    })
    .then(result => {
        // Success
        if (messageElement && successMessage) {
            showFormMessage(messageElement, successMessage, 'success', scrollToMessage);
        }
        
        // Reset form if provided
        if (form) {
            form.reset();
        }
        
        // Call callback if provided
        if (callback && typeof callback === 'function') {
            callback(result);
        }
    })
    .catch(error => {
        console.error('Erro ao enviar dados:', error);
        
        // Show error message if message element exists
        if (messageElement) {
            showFormMessage(messageElement, error.message || 'Erro ao processar pedido. Por favor tente novamente.', 'error', scrollToMessage);
        }
        
        // For development/testing only - simulate success in local environment
        if ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && messageElement && successMessage) {
            console.log('Ambiente de desenvolvimento detectado. Simulando sucesso...');
            
            setTimeout(() => {
                showFormMessage(messageElement, successMessage + ' (SIMULADO)', 'success', scrollToMessage);
                
                // Reset form if provided
                if (form) {
                    form.reset();
                }
                
                // Call callback if provided
                if (callback && typeof callback === 'function') {
                    callback({status: 'success', simulated: true});
                }
            }, 1000);
        }
    });
}

/**
 * Show form message
 * @param {HTMLElement} element - Message element
 * @param {string} message - Message to show
 * @param {string} type - Message type (success, error, info)
 * @param {boolean} scrollToMessage - Whether to scroll to message
 */
function showFormMessage(element, message, type, scrollToMessage = true) {
    if (!element) return;
    
    // Clear previous content
    element.innerHTML = '';
    
    // Create alert element
    const alertElement = document.createElement('div');
    
    // Set appropriate class based on type
    let alertClass = 'alert-info';
    if (type === 'success') alertClass = 'alert-success';
    else if (type === 'error') alertClass = 'alert-danger';
    
    alertElement.className = `alert ${alertClass}`;
    alertElement.textContent = message;
    
    // Append to message element
    element.appendChild(alertElement);
    
    // Scroll to message if requested
    if (scrollToMessage) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}
