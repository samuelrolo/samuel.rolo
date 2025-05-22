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
    // CORREÇÃO: Usar o valor do campo amount em vez de calcular com base na duração
    const price = parseFloat(data.amount) || (duration === '30min' ? 30 : 45);
    const name = data.name || '';
    const email = data.email || '';
    const phone = data.phone || '';
    const date = data.date || '';
    const format = data.format || 'Online';
    
    // Get payment method from form (NEW)
    const paymentMethod = data.paymentMethod || 'mb';
    
    // Generate unique order ID
    const orderId = 'KP' + Date.now();
    
    // Prepare payment data for API
    const paymentData = {
        paymentMethod: paymentMethod, // Use selected method instead of hardcoded 'mb'
        orderId: orderId,
        amount: price,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        description: `Kickstart Pro ${duration} - ${format} - ${date}`
    };
    
    // URL completo do backend
    const baseUrl = 'https://share2inspire-beckend.lm.r.appspot.com';
    const fullUrl = baseUrl + '/api/payment/initiate';
    
    console.log('Enviando dados para:', fullUrl);
    console.log('Dados:', paymentData);
    
    // Call backend API to initiate payment
    fetch(fullUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(paymentData)
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
        if (result.success) {
            // Payment initiated successfully
            showFormMessage(messageElement, 'Pagamento iniciado com sucesso! Redirecionando...', 'success');
            
            // Also send form data to Brevo for email notification
            sendToBrevo('/api/feedback/submit', {
                ...data,
                paymentReference: result.reference || orderId,
                paymentAmount: price,
                paymentMethod: getPaymentMethodName(paymentMethod), // Use function to get friendly name
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
                    method: result.method || paymentMethod // Use selected method
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
                        reference: 'DEV12345',
                        entity: '12345',
                        method: paymentMethod
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
    let messageElement = feedbackForm.querySelector('.form-message');
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.className = 'form-message mt-3';
        feedbackForm.appendChild(messageElement);
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
        
        // Send to backend
        sendToBrevo('/api/feedback/submit', data, messageElement, 'Feedback enviado com sucesso! Obrigado pela sua contribuição.', feedbackForm);
    });
}

/**
 * Send data to Brevo API via backend
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Data to send
 * @param {HTMLElement} messageElement - Element to show messages
 * @param {string} successMessage - Message to show on success
 * @param {HTMLFormElement} form - Form to reset on success
 * @param {boolean} resetForm - Whether to reset form on success
 */
function sendToBrevo(endpoint, data, messageElement, successMessage, form, resetForm = true) {
    // URL completo do backend
    const baseUrl = 'https://share2inspire-beckend.lm.r.appspot.com';
    const fullUrl = baseUrl + endpoint;
    
    console.log('Enviando dados para:', fullUrl);
    console.log('Dados:', data);
    
    // Show loading message if message element exists
    if (messageElement) {
        showFormMessage(messageElement, 'A enviar dados. Por favor aguarde...', 'info');
    }
    
    // Send data to backend
    fetch(fullUrl, {
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
        if (result.success) {
            // Success
            if (messageElement && successMessage) {
                showFormMessage(messageElement, successMessage, 'success');
            }
            
            // Reset form if requested
            if (form && resetForm) {
                form.reset();
            }
        } else {
            // API error
            if (messageElement) {
                showFormMessage(messageElement, result.error || 'Erro ao processar pedido. Por favor tente novamente.', 'error');
            }
        }
    })
    .catch(error => {
        console.error('Erro ao enviar dados:', error);
        
        if (messageElement) {
            showFormMessage(messageElement, error.message || 'Erro ao processar pedido. Por favor tente novamente.', 'error');
        }
        
        // For development/testing only - remove in production
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Ambiente de desenvolvimento detectado. Simulando sucesso...');
            
            setTimeout(() => {
                if (messageElement && successMessage) {
                    showFormMessage(messageElement, successMessage + ' (Simulado)', 'success');
                }
                
                // Reset form if requested
                if (form && resetForm) {
                    form.reset();
                }
            }, 1000);
        }
    });
}

/**
 * Show message in form
 * @param {HTMLElement} element - Element to show message in
 * @param {string} message - Message to show
 * @param {string} type - Message type (success, error, info)
 */
function showFormMessage(element, message, type) {
    if (!element) return;
    
    // Clear previous classes
    element.className = element.className.replace(/alert-\w+/g, '').trim();
    
    // Add appropriate class
    element.className += ' alert';
    
    switch (type) {
        case 'success':
            element.className += ' alert-success';
            break;
        case 'error':
            element.className += ' alert-danger';
            break;
        case 'info':
        default:
            element.className += ' alert-info';
            break;
    }
    
    // Set message
    element.textContent = message;
    
    // Ensure element is visible
    element.style.display = 'block';
    
    // Scroll to message
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Get friendly name for payment method
 * @param {string} method - Payment method code
 * @returns {string} - Friendly name
 */
function getPaymentMethodName(method) {
    switch (method.toLowerCase()) {
        case 'mb':
            return 'Multibanco';
        case 'mbway':
            return 'MB WAY';
        case 'payshop':
            return 'Payshop';
        default:
            return method;
    }
}
