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
    const newsletterForms = [
        'newsletterForm',
        'hrHubNewsletterForm',
        'ctaNewsletterForm'
    ];
    
    newsletterForms.forEach(formId => {
        const form = document.getElementById(formId);
        if (!form) return;
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const email = form.querySelector('input[name="email"]').value;
            if (!validateEmail(email)) {
                showFormMessage(formId + 'Message', 'Por favor, insira um email válido.', 'error');
                return;
            }
            
            // Prepare data for Brevo
            const data = {
                email: email,
                listId: getListIdForForm(formId),
                source: 'website',
                pageUrl: window.location.href
            };
            
            // Send to Brevo
            sendToBrevo('newsletter', data, function(success, message) {
                if (success) {
                    showFormMessage(formId + 'Message', 'Subscrição realizada com sucesso! Obrigado por se juntar à nossa newsletter.', 'success');
                    form.reset();
                } else {
                    showFormMessage(formId + 'Message', 'Ocorreu um erro. Por favor, tente novamente.', 'error');
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
        
        // Validate form
        if (!validateForm(contactForm)) {
            return;
        }
        
        // Get form data
        const name = contactForm.querySelector('input[name="name"]').value;
        const email = contactForm.querySelector('input[name="email"]').value;
        const phone = contactForm.querySelector('input[name="phone"]')?.value || '';
        const subject = contactForm.querySelector('input[name="subject"]')?.value || 'Contacto do Website';
        const message = contactForm.querySelector('textarea[name="message"]').value;
        
        // Prepare data for Brevo
        const data = {
            name: name,
            email: email,
            phone: phone,
            subject: subject,
            message: message,
            source: 'website_contact',
            pageUrl: window.location.href
        };
        
        // Send to Brevo
        sendToBrevo('contact', data, function(success, message) {
            if (success) {
                showFormMessage('contactFormMessage', 'Mensagem enviada com sucesso! Entraremos em contacto brevemente.', 'success');
                contactForm.reset();
            } else {
                showFormMessage('contactFormMessage', 'Ocorreu um erro. Por favor, tente novamente.', 'error');
            }
        });
    });
}

/**
 * Setup service booking forms
 */
function setupServiceForms() {
    const serviceForms = [
        'kickstartForm',
        'consultoriaForm',
        'coachingForm',
        'workshopsForm',
        'livroForm',
        'questionarioForm'
    ];
    
    serviceForms.forEach(formId => {
        const form = document.getElementById(formId);
        if (!form) return;
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateForm(form)) {
                return;
            }
            
            // Get form data
            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });
            
            // Add additional info
            data.source = 'website_service';
            data.serviceType = formId.replace('Form', '');
            data.pageUrl = window.location.href;
            
            // Send to Brevo
            sendToBrevo('service', data, function(success, message) {
                if (success) {
                    // For forms that require payment
                    if (['kickstartForm', 'livroForm', 'questionarioForm'].includes(formId)) {
                        showFormMessage(formId + 'Message', 'Formulário enviado com sucesso! Vamos redirecionar para o pagamento.', 'success');
                        // Redirect to payment after a short delay
                        setTimeout(() => {
                            redirectToPayment(data);
                        }, 2000);
                    } else {
                        showFormMessage(formId + 'Message', 'Pedido recebido com sucesso! Entraremos em contacto brevemente.', 'success');
                    }
                    form.reset();
                } else {
                    showFormMessage(formId + 'Message', 'Ocorreu um erro. Por favor, tente novamente.', 'error');
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
    
    // Star rating functionality
    const stars = document.querySelectorAll('.rating .star');
    const ratingInput = document.getElementById('rating');
    
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            ratingInput.value = value;
            
            // Reset all stars
            stars.forEach(s => s.classList.remove('active'));
            
            // Highlight selected stars
            for (let i = 0; i < value; i++) {
                stars[i].classList.add('active');
            }
        });
    });
    
    // Form submission
    feedbackForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm(feedbackForm)) {
            return;
        }
        
        // Check if rating was selected
        if (ratingInput.value === '0') {
            showFormMessage('feedbackMessage', 'Por favor, selecione uma classificação.', 'error');
            return;
        }
        
        // Get form data
        const name = feedbackForm.querySelector('input[name="name"]').value;
        const email = feedbackForm.querySelector('input[name="email"]').value;
        const rating = ratingInput.value;
        const comment = feedbackForm.querySelector('textarea[name="comment"]')?.value || '';
        
        // Prepare data for Brevo
        const data = {
            name: name,
            email: email,
            rating: rating,
            comment: comment,
            source: 'website_feedback',
            pageUrl: window.location.href
        };
        
        // Send to Brevo
        sendToBrevo('feedback', data, function(success, message) {
            if (success) {
                showFormMessage('feedbackMessage', 'Obrigado pelo seu feedback! A sua opinião é muito importante para nós.', 'success');
                feedbackForm.reset();
                stars.forEach(s => s.classList.remove('active'));
                ratingInput.value = '0';
                
                // Close modal after 3 seconds
                setTimeout(() => {
                    const feedbackModal = document.getElementById('feedbackModal');
                    if (feedbackModal) {
                        const modal = bootstrap.Modal.getInstance(feedbackModal);
                        if (modal) modal.hide();
                    }
                }, 3000);
            } else {
                showFormMessage('feedbackMessage', 'Ocorreu um erro. Por favor, tente novamente.', 'error');
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
    // In a real implementation, this would be an actual API call to Brevo
    // For now, we'll simulate a successful API call
    
    console.log(`Sending ${type} data to Brevo:`, data);
    
    // Simulate API call delay
    setTimeout(() => {
        // Always send a copy to srshare2inspire@gmail.com
        console.log(`Email notification sent to srshare2inspire@gmail.com`);
        
        // Simulate successful response
        callback(true, 'Success');
    }, 1500);
}

/**
 * Redirect to payment page (IFthePay integration)
 * @param {Object} data - Form data
 */
function redirectToPayment(data) {
    // In a real implementation, this would redirect to IFthePay payment page
    // For now, we'll simulate a redirect
    
    console.log('Redirecting to IFthePay payment page with data:', data);
    
    // Determine amount based on service type
    let amount = '0.00';
    let serviceName = '';
    
    switch (data.serviceType) {
        case 'kickstart':
            amount = '497.00';
            serviceName = 'Kickstart Pro';
            break;
        case 'livro':
            amount = data.price || '24.90';
            serviceName = 'Livro - ' + (data.formatSelected || 'Físico');
            break;
        case 'questionario':
            amount = data.price || '49.90';
            serviceName = 'Questionário - ' + (data.optionSelected || 'Basic');
            break;
    }
    
    // Simulate redirect
    alert(`Redirecionando para pagamento de ${serviceName} no valor de €${amount}...`);
    
    // In a real implementation, this would be:
    // window.location.href = `https://ifthepay.com/pagamento?amount=${amount}&reference=${reference}&entity=${entity}`;
}

/**
 * Get Brevo list ID for form
 * @param {string} formId - Form ID
 * @returns {number} - List ID
 */
function getListIdForForm(formId) {
    // In a real implementation, these would be actual Brevo list IDs
    switch (formId) {
        case 'hrHubNewsletterForm':
            return 2; // HR Hub subscribers
        case 'ctaNewsletterForm':
            return 3; // CTA subscribers
        case 'newsletterForm':
        default:
            return 1; // General subscribers
    }
}

/**
 * Show form message
 * @param {string} elementId - Message element ID
 * @param {string} message - Message to show
 * @param {string} type - Message type (success, error)
 */
function showFormMessage(elementId, message, type) {
    const messageElement = document.getElementById(elementId);
    if (!messageElement) return;
    
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    messageElement.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
    
    // Scroll to message
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Validate form
 * @param {HTMLFormElement} form - Form to validate
 * @returns {boolean} - Whether form is valid
 */
function validateForm(form) {
    let isValid = true;
    
    // Check required fields
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else {
            field.classList.remove('is-invalid');
        }
    });
    
    // Check email fields
    const emailFields = form.querySelectorAll('input[type="email"]');
    emailFields.forEach(field => {
        if (field.value.trim() && !validateEmail(field.value)) {
            field.classList.add('is-invalid');
            isValid = false;
        }
    });
    
    return isValid;
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
