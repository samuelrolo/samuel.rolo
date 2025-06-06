// Share2Inspire HR Report Form JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize form
    initializeForm();
    
    // Add animations
    addAnimations();
});

function initializeForm() {
    const form = document.getElementById('hrReportForm');
    const submitBtn = document.getElementById('submitBtn');
    
    // Form submission handler
    form.addEventListener('submit', handleFormSubmission);
    
    // Real-time validation
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearValidation);
    });
    
    // Email validation
    const emailInput = document.getElementById('workEmail');
    emailInput.addEventListener('input', validateEmail);
}

function handleFormSubmission(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = document.getElementById('submitBtn');
    
    // Validate form
    if (!validateForm(form)) {
        form.classList.add('was-validated');
        return;
    }
    
    // Show loading state
    showLoading();
    
    // Collect form data
    const formData = collectFormData(form);
    
    // Submit data
    submitFormData(formData)
        .then(response => {
            hideLoading();
            if (response.success) {
                showSuccess(response.downloadUrl);
                form.reset();
                form.classList.remove('was-validated');
            } else {
                showError(response.message || 'Erro ao processar o pedido.');
            }
        })
        .catch(error => {
            hideLoading();
            console.error('Erro na submissão:', error);
            showError('Erro de conexão. Por favor, tente novamente.');
        });
}

function validateForm(form) {
    let isValid = true;
    
    // Required fields validation
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        if (!validateField({ target: field })) {
            isValid = false;
        }
    });
    
    // Email validation
    const emailField = document.getElementById('workEmail');
    if (!validateEmailFormat(emailField.value)) {
        setFieldError(emailField, 'Por favor, introduza um email válido.');
        isValid = false;
    }
    
    return isValid;
}

function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    // Clear previous validation
    clearFieldValidation(field);
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        setFieldError(field, getRequiredMessage(field));
        return false;
    }
    
    // Email validation
    if (field.type === 'email' && value && !validateEmailFormat(value)) {
        setFieldError(field, 'Por favor, introduza um email válido.');
        return false;
    }
    
    // Name validation (no numbers)
    if ((field.id === 'firstName' || field.id === 'lastName') && value) {
        if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(value)) {
            setFieldError(field, 'O nome deve conter apenas letras.');
            return false;
        }
    }
    
    // Set valid state
    setFieldValid(field);
    return true;
}

function validateEmail(event) {
    const emailField = event.target;
    const value = emailField.value.trim();
    
    if (value && !validateEmailFormat(value)) {
        setFieldError(emailField, 'Por favor, introduza um email válido.');
    } else if (value) {
        setFieldValid(emailField);
    }
}

function validateEmailFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function clearValidation(event) {
    const field = event.target;
    if (field.classList.contains('is-invalid')) {
        clearFieldValidation(field);
    }
}

function clearFieldValidation(field) {
    field.classList.remove('is-invalid', 'is-valid');
    const feedback = field.parentNode.querySelector('.invalid-feedback');
    if (feedback) {
        feedback.style.display = 'none';
    }
}

function setFieldError(field, message) {
    field.classList.remove('is-valid');
    field.classList.add('is-invalid');
    
    let feedback = field.parentNode.querySelector('.invalid-feedback');
    if (feedback) {
        feedback.textContent = message;
        feedback.style.display = 'block';
    }
}

function setFieldValid(field) {
    field.classList.remove('is-invalid');
    field.classList.add('is-valid');
    
    const feedback = field.parentNode.querySelector('.invalid-feedback');
    if (feedback) {
        feedback.style.display = 'none';
    }
}

function getRequiredMessage(field) {
    const messages = {
        'firstName': 'Por favor, introduza o seu nome.',
        'lastName': 'Por favor, introduza o seu apelido.',
        'companyName': 'Por favor, introduza o nome da sua empresa.',
        'workEmail': 'Por favor, introduza o seu email profissional.',
        'jobCategory': 'Por favor, selecione uma categoria profissional.',
        'workArea': 'Por favor, selecione uma área de atuação.',
        'country': 'Por favor, selecione um país.',
        'consent': 'Deve aceitar os termos para continuar.'
    };
    
    return messages[field.id] || 'Este campo é obrigatório.';
}

function collectFormData(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Add timestamp
    data.timestamp = new Date().toISOString();
    data.userAgent = navigator.userAgent;
    data.referrer = document.referrer;
    
    return data;
}

async function submitFormData(data) {
    try {
        // For development/testing, simulate API call
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return simulateAPICall(data);
        }
        
        // Production API call
        const response = await fetch('/api/submit-form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erro na submissão:', error);
        throw error;
    }
}

function simulateAPICall(data) {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('Dados do formulário:', data);
            
            // Simulate successful submission
            resolve({
                success: true,
                message: 'Formulário submetido com sucesso!',
                downloadUrl: 'assets/Share2Inspire_HR_25_MidYear_Report.pdf'
            });
        }, 2000);
    });
}

function showLoading() {
    const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    loadingModal.show();
    
    // Disable submit button
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>A PROCESSAR...';
}

function hideLoading() {
    const loadingModal = bootstrap.Modal.getInstance(document.getElementById('loadingModal'));
    if (loadingModal) {
        loadingModal.hide();
    }
    
    // Re-enable submit button
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-download me-2"></i>ACEDER AO RECURSO';
}

function showSuccess(downloadUrl) {
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
    successModal.show();
    
    // Set up manual download link
    const manualDownload = document.getElementById('manualDownload');
    manualDownload.href = downloadUrl;
    
    // Auto-download
    setTimeout(() => {
        downloadFile(downloadUrl);
    }, 1000);
}

function showError(message) {
    const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorModal.show();
}

function downloadFile(url) {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Share2Inspire_HR_25_MidYear_Report.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function addAnimations() {
    // Add fade-in animation to main sections
    const sections = document.querySelectorAll('.report-info-section, .form-section');
    sections.forEach((section, index) => {
        setTimeout(() => {
            section.classList.add('fade-in');
        }, index * 200);
    });
    
    // Add slide-up animation to form
    setTimeout(() => {
        const formContainer = document.querySelector('.form-container');
        if (formContainer) {
            formContainer.classList.add('slide-up');
        }
    }, 400);
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Analytics tracking (if needed)
function trackFormSubmission(data) {
    // Google Analytics or other tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', 'form_submit', {
            'event_category': 'HR Report',
            'event_label': 'Download Request',
            'value': 1
        });
    }
}

// Error handling for uncaught errors
window.addEventListener('error', function(event) {
    console.error('JavaScript error:', event.error);
});

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Page is hidden
        console.log('Page hidden');
    } else {
        // Page is visible
        console.log('Page visible');
    }
});

