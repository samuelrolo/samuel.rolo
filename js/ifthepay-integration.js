/**
 * IFthePay Integration for Share2Inspire Website
 * This file handles the payment integration with IFthePay for service bookings
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize IFthePay integration
    initIFthePayIntegration();
});

/**
 * Initialize IFthePay integration
 */
function initIFthePayIntegration() {
    // Get payment form elements
    const paymentForms = document.querySelectorAll('.payment-form');
    
    if (!paymentForms.length) return;
    
    paymentForms.forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(form);
            const serviceId = form.getAttribute('data-service-id');
            const amount = form.querySelector('.service-price').value;
            
            // Validate form data
            if (!validatePaymentForm(form)) {
                return;
            }
            
            // Show loading state
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'A processar...';
            
            // Process payment with IFthePay
            processPayment(formData, serviceId, amount)
                .then(function(response) {
                    // Handle successful payment
                    showPaymentSuccess(form);
                    
                    // Send booking confirmation via Brevo
                    if (window.brevoIntegration && typeof window.brevoIntegration.sendBookingConfirmation === 'function') {
                        window.brevoIntegration.sendBookingConfirmation(formData);
                    }
                })
                .catch(function(error) {
                    // Handle payment error
                    showPaymentError(form, error);
                })
                .finally(function() {
                    // Reset button state
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;
                });
        });
    });
}

/**
 * Validate payment form
 * @param {HTMLFormElement} form - The payment form element
 * @returns {boolean} - Whether the form is valid
 */
function validatePaymentForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    // Reset previous error messages
    form.querySelectorAll('.error-message').forEach(function(el) {
        el.textContent = '';
    });
    
    // Check required fields
    requiredFields.forEach(function(field) {
        if (!field.value.trim()) {
            isValid = false;
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.textContent = 'Este campo é obrigatório';
            field.parentNode.appendChild(errorElement);
        }
    });
    
    // Check email format
    const emailField = form.querySelector('input[type="email"]');
    if (emailField && emailField.value.trim() && !validateEmail(emailField.value)) {
        isValid = false;
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = 'Por favor, insira um email válido';
        emailField.parentNode.appendChild(errorElement);
    }
    
    return isValid;
}

/**
 * Validate email format
 * @param {string} email - The email to validate
 * @returns {boolean} - Whether the email is valid
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Process payment with IFthePay
 * @param {FormData} formData - The form data
 * @param {string} serviceId - The service ID
 * @param {number} amount - The payment amount
 * @returns {Promise} - A promise that resolves when the payment is processed
 */
function processPayment(formData, serviceId, amount) {
    // This is a mock implementation that would be replaced with actual IFthePay API calls
    return new Promise((resolve, reject) => {
        // Simulate API call
        setTimeout(() => {
            // For demonstration purposes, we'll always resolve
            // In a real implementation, this would call the IFthePay API
            resolve({
                success: true,
                transactionId: 'mock-transaction-' + Date.now(),
                message: 'Pagamento processado com sucesso'
            });
            
            // Example of rejection for testing error handling
            // reject(new Error('Falha no processamento do pagamento. Por favor, tente novamente.'));
        }, 1500);
    });
}

/**
 * Show payment success message
 * @param {HTMLFormElement} form - The payment form element
 */
function showPaymentSuccess(form) {
    // Hide form
    form.style.display = 'none';
    
    // Show success message
    const successElement = document.createElement('div');
    successElement.className = 'payment-success';
    successElement.innerHTML = `
        <h3>Pagamento Processado com Sucesso!</h3>
        <p>Obrigado pela sua marcação. Enviámos um email de confirmação para o seu endereço de email.</p>
        <p>Em breve entraremos em contacto para confirmar todos os detalhes.</p>
    `;
    
    form.parentNode.appendChild(successElement);
}

/**
 * Show payment error message
 * @param {HTMLFormElement} form - The payment form element
 * @param {Error} error - The error object
 */
function showPaymentError(form, error) {
    const errorContainer = form.querySelector('.payment-error') || document.createElement('div');
    errorContainer.className = 'payment-error';
    errorContainer.textContent = error.message || 'Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.';
    
    if (!form.querySelector('.payment-error')) {
        form.prepend(errorContainer);
    }
}

// Export functions for testing and external use
window.ifthepayIntegration = {
    processPayment,
    validatePaymentForm,
    validateEmail
};
