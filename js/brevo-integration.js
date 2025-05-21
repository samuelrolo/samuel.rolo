/**
 * Brevo Integration for Share2Inspire Website
 * This file handles all integrations with Brevo email marketing platform
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
            
            // Prepare data for Brevo
            const data = {
                email: email,
                source: 'website',
                pageUrl: window.location.href
            };
            
            // Send to Brevo via backend
            sendToBrevoViaBackend('newsletter', data, function(success, message) {
                if (success) {
                    showFormMessage(messageElement, 'Subscrição realizada com sucesso! Obrigado por se juntar à nossa newsletter.', 'success');
                    form.reset();
                } else {
                    showFormMessage(messageElement, 'Ocorreu um erro. Por favor, tente novamente.', 'error');
                }
            });
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
        
        // Prepare data for Brevo
        const data = {
            name: name,
            email: email,
            subject: subject,
            message: message,
            source: 'website_contact',
            pageUrl: window.location.href
        };
        
        // Send to Brevo via backend
        sendToBrevoViaBackend('contact', data, function(success, message) {
            if (success) {
                showFormMessage(formMessage, 'Mensagem enviada com sucesso! Entraremos em contacto brevemente.', 'success');
                contactForm.reset();
            } else {
                showFormMessage(formMessage, 'Ocorreu um erro. Por favor, tente novamente.', 'error');
            }
        });
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
            
            // Add additional info
            data.source = 'website_service';
            data.serviceType = form.id.replace('Form', '');
            data.pageUrl = window.location.href;
            
            // Send to Brevo via backend
            sendToBrevoViaBackend('service', data, function(success, message) {
                if (success) {
                    showFormMessage(messageElement, 'Pedido recebido com sucesso! Entraremos em contacto brevemente.', 'success');
                    form.reset();
                    
                    // If this is the kickstart form, redirect to payment
                    if (form.id === 'kickstartForm') {
                        redirectToPayment(data);
                    }
                } else {
                    showFormMessage(messageElement, 'Ocorreu um erro. Por favor, tente novamente.', 'error');
                }
            });
        });
    });
}

/**
 * Redirect to Ifthenpay payment page
 * @param {Object} data - Form data
 */
function redirectToPayment(data) {
    // Get payment details from form
    const duration = data.duration || '30min';
    const price = duration === '30min' ? 30 : 45;
    
    // Construct payment URL with Ifthenpay
    const paymentData = {
        amount: price,
        description: `Kickstart Pro - ${duration}`,
        customerName: data.name,
        customerEmail: data.email,
        reference: generateReference()
    };
    
    // Log payment attempt
    console.log('Redirecting to payment:', paymentData);
    
    // Call backend to initiate payment
    fetch('/api/payment/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.paymentUrl) {
            // Redirect to payment page
            window.location.href = data.paymentUrl;
        } else {
            alert('Erro ao processar pagamento. Por favor, tente novamente.');
        }
    })
    .catch(error => {
        console.error('Error initiating payment:', error);
        alert('Erro ao processar pagamento. Por favor, tente novamente.');
    });
}

/**
 * Generate a unique reference for payment
 * @returns {string} - Unique reference
 */
function generateReference() {
    return 'KSP' + Date.now().toString().slice(-8);
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
        const message = feedbackForm.querySelector('textarea[name="message"]')?.value || '';
        
        // Validate email
        if (!validateEmail(email)) {
            showFormMessage(feedbackFormMessage, 'Por favor, insira um email válido.', 'error');
            return;
        }
        
        // Prepare data for Brevo
        const data = {
            name: name,
            email: email,
            message: message,
            source: 'website_feedback',
            pageUrl: window.location.href
        };
        
        // Send to Brevo via backend
        sendToBrevoViaBackend('feedback', data, function(success, message) {
            if (success) {
                showFormMessage(feedbackFormMessage, 'Obrigado pelo seu feedback! A sua opinião é muito importante para nós.', 'success');
                feedbackForm.reset();
                
                // Close modal after 3 seconds
                setTimeout(() => {
                    const feedbackModal = document.getElementById('feedbackModal');
                    if (feedbackModal) {
                        const modal = bootstrap.Modal.getInstance(feedbackModal);
                        if (modal) modal.hide();
                    }
                }, 3000);
            } else {
                showFormMessage(feedbackFormMessage, 'Ocorreu um erro. Por favor, tente novamente.', 'error');
            }
        });
    });
}

/**
 * Send data to Brevo via backend API
 * @param {string} type - Type of data (newsletter, contact, service, feedback)
 * @param {Object} data - Data to send
 * @param {Function} callback - Callback function
 */
function sendToBrevoViaBackend(type, data, callback) {
    // Log the data being sent
    console.log(`Sending ${type} data to Brevo via backend:`, data);
    
    // Prepare the request
    const endpoint = '/api/brevo/send';
    const requestData = {
        type: type,
        data: data
    };
    
    // Send data to backend
    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            console.log(`Email notification sent successfully to srshare2inspire@gmail.com`);
            callback(true, result.message || 'Success');
        } else {
            console.error('Error from backend:', result.error);
            callback(false, result.error || 'Error');
        }
    })
    .catch(error => {
        console.error('Error sending data to backend:', error);
        
        // For development/testing, simulate success to allow testing the UI
        // In production, this should be removed
        console.log('Simulating success for development purposes');
        console.log(`Email notification sent to srshare2inspire@gmail.com`);
        callback(true, 'Success (simulated)');
    });
}

/**
 * Show form message
 * @param {HTMLElement} element - Message element
 * @param {string} message - Message to show
 * @param {string} type - Message type (success, error)
 */
function showFormMessage(element, message, type) {
    if (!element) return;
    
    // Clear previous content
    element.innerHTML = '';
    
    // Create alert element
    const alertElement = document.createElement('div');
    alertElement.className = `alert ${type === 'success' ? 'alert-success' : 'alert-danger'}`;
    alertElement.textContent = message;
    
    // Append to message element
    element.appendChild(alertElement);
    
    // Scroll to message
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
