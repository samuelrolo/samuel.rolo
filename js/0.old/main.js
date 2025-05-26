/**
 * Main JavaScript for Share2Inspire Website
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap components
    initBootstrapComponents();
    
    // Initialize navigation highlighting
    highlightCurrentNavItem();
    
    // Initialize feedback functionality
    initFeedbackSystem();
    
    // Initialize form validations
    initFormValidations();
    
    // Initialize shop functionality (if on shop page)
    if (document.querySelector('.product-formats') || document.querySelector('.product-options')) {
        initShopFunctionality();
    }
});

/**
 * Initialize Bootstrap components
 */
function initBootstrapComponents() {
    // Initialize all tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize all popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
}

/**
 * Highlight current navigation item based on URL
 */
function highlightCurrentNavItem() {
    // Get current page path
    var path = window.location.pathname;
    var page = path.split("/").pop();
    
    // If no page is specified, we're on the home page
    if (page === '' || page === 'index.html') {
        document.querySelector('.navbar-nav .nav-link[href="../index.html"]')?.classList.add('active');
        document.querySelector('.navbar-nav .nav-link[href="index.html"]')?.classList.add('active');
    } else {
        // Find and highlight the corresponding nav item
        var navLinks = document.querySelectorAll('.navbar-nav .nav-link');
        navLinks.forEach(function(link) {
            if (link.getAttribute('href').includes(page)) {
                link.classList.add('active');
            }
        });
    }
}

/**
 * Initialize feedback system
 */
function initFeedbackSystem() {
    // Get feedback button and modal elements
    var feedbackBtn = document.getElementById('feedbackBtn');
    var feedbackModal = document.getElementById('feedbackModal');
    var stars = document.querySelectorAll('.rating .star');
    var ratingInput = document.getElementById('rating');
    var feedbackForm = document.getElementById('feedbackForm');
    var feedbackMessage = document.getElementById('feedbackMessage');
    
    if (!feedbackBtn || !feedbackModal) return;
    
    // Initialize feedback modal
    var modal = new bootstrap.Modal(feedbackModal);
    
    // Open feedback modal when button is clicked
    feedbackBtn.addEventListener('click', function() {
        modal.show();
    });
    
    // Handle star rating selection
    stars.forEach(function(star) {
        star.addEventListener('click', function() {
            var value = this.getAttribute('data-value');
            ratingInput.value = value;
            
            // Reset all stars
            stars.forEach(function(s) {
                s.classList.remove('active');
            });
            
            // Highlight selected stars
            for (var i = 0; i < value; i++) {
                stars[i].classList.add('active');
            }
        });
    });
    
    // Handle feedback form submission
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateForm(feedbackForm)) {
                return;
            }
            
            // Get form data
            var formData = new FormData(feedbackForm);
            var feedbackData = {};
            formData.forEach(function(value, key) {
                feedbackData[key] = value;
            });
            
            // Send feedback data to server (via Brevo integration)
            sendFeedbackToBrevo(feedbackData, function(success, message) {
                if (success) {
                    feedbackMessage.innerHTML = '<div class="alert alert-success">Obrigado pelo seu feedback! A sua opinião é muito importante para nós.</div>';
                    feedbackForm.reset();
                    stars.forEach(function(s) {
                        s.classList.remove('active');
                    });
                    ratingInput.value = 0;
                    
                    // Close modal after 3 seconds
                    setTimeout(function() {
                        modal.hide();
                        feedbackMessage.innerHTML = '';
                    }, 3000);
                } else {
                    feedbackMessage.innerHTML = '<div class="alert alert-danger">Ocorreu um erro ao enviar o feedback. Por favor, tente novamente.</div>';
                }
            });
        });
    }
}

/**
 * Initialize form validations
 */
function initFormValidations() {
    // Get all forms with brevo-form class
    var forms = document.querySelectorAll('.brevo-form');
    
    forms.forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateForm(form)) {
                return;
            }
            
            // Get form data
            var formData = new FormData(form);
            var formDataObj = {};
            formData.forEach(function(value, key) {
                formDataObj[key] = value;
            });
            
            // Get message element
            var messageId = form.id + 'Message';
            var messageElement = document.getElementById(messageId);
            
            // Send form data to server (via Brevo integration)
            sendFormToBrevo(formDataObj, form.id, function(success, message) {
                if (success) {
                    messageElement.innerHTML = '<div class="alert alert-success">' + message + '</div>';
                    form.reset();
                    
                    // If form is for payment, redirect to payment page
                    if (form.id === 'kickstartForm' || form.id === 'livroForm' || form.id === 'questionarioForm') {
                        redirectToPayment(formDataObj);
                    }
                } else {
                    messageElement.innerHTML = '<div class="alert alert-danger">' + message + '</div>';
                }
            });
        });
    });
}

/**
 * Validate form fields
 * @param {HTMLFormElement} form - The form to validate
 * @returns {boolean} - Whether the form is valid
 */
function validateForm(form) {
    var isValid = true;
    
    // Check required fields
    var requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(function(field) {
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else {
            field.classList.remove('is-invalid');
        }
    });
    
    // Check email fields
    var emailFields = form.querySelectorAll('input[type="email"]');
    emailFields.forEach(function(field) {
        if (field.value.trim() && !validateEmail(field.value)) {
            field.classList.add('is-invalid');
            isValid = false;
        }
    });
    
    return isValid;
}

/**
 * Validate email format
 * @param {string} email - The email to validate
 * @returns {boolean} - Whether the email is valid
 */
function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Send feedback data to Brevo
 * @param {Object} data - The feedback data
 * @param {Function} callback - Callback function
 */
function sendFeedbackToBrevo(data, callback) {
    // Simulate API call to Brevo
    setTimeout(function() {
        // In a real implementation, this would be an actual API call
        console.log('Sending feedback to Brevo:', data);
        callback(true, 'Feedback enviado com sucesso!');
    }, 1000);
}

/**
 * Send form data to Brevo
 * @param {Object} data - The form data
 * @param {string} formId - The form ID
 * @param {Function} callback - Callback function
 */
function sendFormToBrevo(data, formId, callback) {
    // Simulate API call to Brevo
    setTimeout(function() {
        // In a real implementation, this would be an actual API call
        console.log('Sending form data to Brevo:', data);
        
        var successMessages = {
            'newsletterForm': 'Subscrição realizada com sucesso! Obrigado por se juntar à nossa newsletter.',
            'hrHubNewsletterForm': 'Subscrição realizada com sucesso! Obrigado por se juntar à nossa newsletter.',
            'ctaNewsletterForm': 'Subscrição realizada com sucesso! Obrigado por se juntar à nossa newsletter.',
            'contactForm': 'Mensagem enviada com sucesso! Entraremos em contacto brevemente.',
            'kickstartForm': 'Formulário enviado com sucesso! Vamos redirecionar para o pagamento.',
            'consultoriaForm': 'Pedido recebido com sucesso! Entraremos em contacto brevemente com uma proposta personalizada.',
            'coachingForm': 'Pedido recebido com sucesso! Entraremos em contacto brevemente para agendar a sua sessão inicial.',
            'workshopsForm': 'Pedido recebido com sucesso! Entraremos em contacto brevemente com mais informações.',
            'livroForm': 'Pedido recebido com sucesso! Vamos redirecionar para o pagamento.',
            'questionarioForm': 'Pedido recebido com sucesso! Vamos redirecionar para o pagamento.',
            'feedbackForm': 'Feedback enviado com sucesso! Obrigado pela sua opinião.'
        };
        
        callback(true, successMessages[formId] || 'Formulário enviado com sucesso!');
    }, 1000);
}

/**
 * Redirect to payment page
 * @param {Object} data - The form data
 */
function redirectToPayment(data) {
    // Simulate redirect to payment page
    console.log('Redirecting to payment page with data:', data);
    
    // In a real implementation, this would redirect to IFthePay payment page
    // For now, we'll just show an alert
    setTimeout(function() {
        alert('Redirecionando para a página de pagamento...');
    }, 2000);
}

/**
 * Initialize shop functionality
 */
function initShopFunctionality() {
    // Handle book format selection
    var formatRadios = document.querySelectorAll('input[name="bookFormat"]');
    var livroFormatSelected = document.getElementById('livroFormatSelected');
    var livroPrice = document.getElementById('livroPrice');
    var livroShippingSection = document.getElementById('livroShippingSection');
    
    if (formatRadios.length > 0 && livroFormatSelected && livroPrice) {
        formatRadios.forEach(function(radio) {
            radio.addEventListener('change', function() {
                livroFormatSelected.value = this.value;
                
                // Update price based on selected format
                switch (this.value) {
                    case 'fisico':
                        livroPrice.value = '24.90';
                        livroShippingSection.style.display = 'block';
                        break;
                    case 'digital':
                        livroPrice.value = '19.90';
                        livroShippingSection.style.display = 'none';
                        break;
                    case 'bundle':
                        livroPrice.value = '29.90';
                        livroShippingSection.style.display = 'block';
                        break;
                }
            });
        });
    }
    
    // Handle questionário option selection
    var optionRadios = document.querySelectorAll('input[name="questionarioOption"]');
    var questionarioOptionSelected = document.getElementById('questionarioOptionSelected');
    var questionarioPrice = document.getElementById('questionarioPrice');
    
    if (optionRadios.length > 0 && questionarioOptionSelected && questionarioPrice) {
        optionRadios.forEach(function(radio) {
            radio.addEventListener('change', function() {
                questionarioOptionSelected.value = this.value;
                
                // Update price based on selected option
                switch (this.value) {
                    case 'basic':
                        questionarioPrice.value = '49.90';
                        break;
                    case 'pro':
                        questionarioPrice.value = '149.90';
                        break;
                    case 'enterprise':
                        questionarioPrice.value = '349.90';
                        break;
                }
            });
        });
    }
}
