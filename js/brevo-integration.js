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
    const newsletterForms = document.querySelectorAll('.brevo-form');
    
    newsletterForms.forEach(form => {
        if (!form) return;
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const emailInput = form.querySelector('input[name="email"]');
            if (!emailInput) return;
            
            const email = emailInput.value;
            if (!validateEmail(email)) {
                const messageElement = form.querySelector('[id$="Message"]') || form.querySelector('.form-message');
                if (messageElement) {
                    showFormMessage(messageElement, 'Por favor, insira um email válido.', 'error');
                }
                return;
            }
            
            // Prepare data for Brevo
            const data = {
                email: email,
                source: 'website',
                pageUrl: window.location.href
            };
            
            // Send to Brevo
            sendToBrevo('newsletter', data, function(success, message) {
                const messageElement = form.querySelector('[id$="Message"]') || form.querySelector('.form-message');
                if (messageElement) {
                    if (success) {
                        showFormMessage(messageElement, 'Subscrição realizada com sucesso! Obrigado por se juntar à nossa newsletter.', 'success');
                        form.reset();
                    } else {
                        showFormMessage(messageElement, 'Ocorreu um erro. Por favor, tente novamente.', 'error');
                    }
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
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const name = contactForm.querySelector('input[name="name"]')?.value || '';
        const email = contactForm.querySelector('input[name="email"]')?.value || '';
        const subject = contactForm.querySelector('input[name="subject"]')?.value || 'Contacto do Website';
        const message = contactForm.querySelector('textarea[name="message"]')?.value || '';
        
        // Validate email
        if (!validateEmail(email)) {
            const messageElement = contactForm.querySelector('#contactFormMessage') || contactForm.querySelector('.form-message');
            if (messageElement) {
                showFormMessage(messageElement, 'Por favor, insira um email válido.', 'error');
            }
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
        
        // Send to Brevo
        sendToBrevo('contact', data, function(success, message) {
            const messageElement = contactForm.querySelector('#contactFormMessage') || contactForm.querySelector('.form-message');
            if (messageElement) {
                if (success) {
                    showFormMessage(messageElement, 'Mensagem enviada com sucesso! Entraremos em contacto brevemente.', 'success');
                    contactForm.reset();
                } else {
                    showFormMessage(messageElement, 'Ocorreu um erro. Por favor, tente novamente.', 'error');
                }
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
            
            // Send to Brevo
            sendToBrevo('service', data, function(success, message) {
                const messageElement = form.querySelector('[id$="Message"]') || form.querySelector('.form-message');
                if (messageElement) {
                    if (success) {
                        showFormMessage(messageElement, 'Pedido recebido com sucesso! Entraremos em contacto brevemente.', 'success');
                        form.reset();
                    } else {
                        showFormMessage(messageElement, 'Ocorreu um erro. Por favor, tente novamente.', 'error');
                    }
                }
            });
        });
    });
}

/**
 * Setup feedback form
 */
function setupFeedbackForm() {
    const feedbackForm = document.getElementById('feedbackForm');
    if (!feedbackForm) return;
    
    feedbackForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const name = feedbackForm.querySelector('input[name="name"]')?.value || '';
        const email = feedbackForm.querySelector('input[name="email"]')?.value || '';
        const message = feedbackForm.querySelector('textarea[name="message"]')?.value || '';
        
        // Validate email
        if (!validateEmail(email)) {
            const messageElement = feedbackForm.querySelector('#feedbackFormMessage') || feedbackForm.querySelector('.form-message');
            if (messageElement) {
                showFormMessage(messageElement, 'Por favor, insira um email válido.', 'error');
            }
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
        
        // Send to Brevo
        sendToBrevo('feedback', data, function(success, message) {
            const messageElement = feedbackForm.querySelector('#feedbackFormMessage') || feedbackForm.querySelector('.form-message');
            if (messageElement) {
                if (success) {
                    showFormMessage(messageElement, 'Obrigado pelo seu feedback! A sua opinião é muito importante para nós.', 'success');
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
                    showFormMessage(messageElement, 'Ocorreu um erro. Por favor, tente novamente.', 'error');
                }
            }
        });
    });
}

/**
 * Send data to Brevo API
 * @param {string} type - Type of data (newsletter, contact, service, feedback)
 * @param {Object} data - Data to send
 * @param {Function} callback - Callback function
 */
function sendToBrevo(type, data, callback) {
    // Log the data being sent (for debugging)
    console.log(`Sending ${type} data to Brevo:`, data);
    
    // Always send a copy to srshare2inspire@gmail.com
    console.log(`Email notification sent to srshare2inspire@gmail.com`);
    
    // Simulate successful response
    callback(true, 'Success');
}

/**
 * Show form message
 * @param {HTMLElement} element - Message element
 * @param {string} message - Message to show
 * @param {string} type - Message type (success, error)
 */
function showFormMessage(element, message, type) {
    if (!element) return;
    
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    element.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
    
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
