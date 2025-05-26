/**
 * Service Booking Form Integration for Share2Inspire Website
 * This file handles the service booking forms and integration with backend
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize service booking forms
    initServiceBookingForms();
});

/**
 * Initialize service booking forms
 */
function initServiceBookingForms() {
    // Get all service booking buttons
    const bookingButtons = document.querySelectorAll('.service-booking-btn');
    
    if (!bookingButtons.length) return;
    
    // Initialize booking modal if it exists
    const bookingModal = document.getElementById('bookingModal');
    let modal = null;
    
    if (bookingModal) {
        modal = new bootstrap.Modal(bookingModal);
    }
    
    // Add click event to booking buttons
    bookingButtons.forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const serviceId = this.getAttribute('data-service-id');
            const serviceName = this.getAttribute('data-service-name');
            
            // If modal exists, show it with service details
            if (modal && bookingModal) {
                // Set service details in modal
                const serviceTitle = bookingModal.querySelector('.service-title');
                const serviceIdInput = bookingModal.querySelector('input[name="service_id"]');
                
                if (serviceTitle) {
                    serviceTitle.textContent = serviceName || 'Reservar Serviço';
                }
                
                if (serviceIdInput) {
                    serviceIdInput.value = serviceId || '';
                }
                
                // Show modal
                modal.show();
            } else {
                // If no modal, redirect to booking page
                window.location.href = `/pages/marcacao.html?service=${serviceId}`;
            }
        });
    });
    
    // Initialize booking forms
    const bookingForms = document.querySelectorAll('.booking-form');
    
    bookingForms.forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateBookingForm(form)) {
                return;
            }
            
            // Get form data
            const formData = new FormData(form);
            
            // Show loading state
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'A processar...';
            
            // Submit booking to backend
            submitBooking(formData)
                .then(function(response) {
                    // If payment is required, initialize payment process
                    if (response.requiresPayment && window.ifthepayIntegration) {
                        // Initialize payment with IFthePay
                        return window.ifthepayIntegration.processPayment(
                            formData,
                            formData.get('service_id'),
                            response.amount
                        );
                    }
                    
                    return response;
                })
                .then(function(response) {
                    // Handle successful booking
                    showBookingSuccess(form, response);
                    
                    // Send booking confirmation via Brevo
                    if (window.brevoIntegration && typeof window.brevoIntegration.sendBookingConfirmation === 'function') {
                        window.brevoIntegration.sendBookingConfirmation(formData);
                    }
                    
                    // Close modal if it exists
                    if (modal && form.closest('.modal')) {
                        setTimeout(function() {
                            modal.hide();
                        }, 3000);
                    }
                })
                .catch(function(error) {
                    // Handle booking error
                    showBookingError(form, error);
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
 * Validate booking form
 * @param {HTMLFormElement} form - The booking form element
 * @returns {boolean} - Whether the form is valid
 */
function validateBookingForm(form) {
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
 * Submit booking to backend
 * @param {FormData} formData - The form data
 * @returns {Promise} - A promise that resolves when the booking is submitted
 */
function submitBooking(formData) {
    // This is a mock implementation that would be replaced with actual backend API calls
    return new Promise((resolve, reject) => {
        // Simulate API call
        setTimeout(() => {
            // For demonstration purposes, we'll always resolve
            // In a real implementation, this would call the backend API
            const serviceId = formData.get('service_id');
            
            // Check if service requires payment
            const requiresPayment = serviceId === 'kickstart-pro';
            
            resolve({
                success: true,
                bookingId: 'mock-booking-' + Date.now(),
                message: 'Marcação registada com sucesso',
                requiresPayment: requiresPayment,
                amount: requiresPayment ? 99.90 : 0
            });
            
            // Example of rejection for testing error handling
            // reject(new Error('Falha no registo da marcação. Por favor, tente novamente.'));
        }, 1500);
    });
}

/**
 * Show booking success message
 * @param {HTMLFormElement} form - The booking form element
 * @param {Object} response - The response from the backend
 */
function showBookingSuccess(form, response) {
    // Hide form
    form.style.display = 'none';
    
    // Show success message
    const successElement = document.createElement('div');
    successElement.className = 'booking-success';
    successElement.innerHTML = `
        <h3>Marcação Registada com Sucesso!</h3>
        <p>Obrigado pela sua marcação. Enviámos um email de confirmação para o seu endereço de email.</p>
        <p>Em breve entraremos em contacto para confirmar todos os detalhes.</p>
    `;
    
    form.parentNode.appendChild(successElement);
}

/**
 * Show booking error message
 * @param {HTMLFormElement} form - The booking form element
 * @param {Error} error - The error object
 */
function showBookingError(form, error) {
    const errorContainer = form.querySelector('.booking-error') || document.createElement('div');
    errorContainer.className = 'booking-error';
    errorContainer.textContent = error.message || 'Ocorreu um erro ao processar a marcação. Por favor, tente novamente.';
    
    if (!form.querySelector('.booking-error')) {
        form.prepend(errorContainer);
    }
}

// Export functions for testing and external use
window.serviceBooking = {
    submitBooking,
    validateBookingForm,
    validateEmail
};
