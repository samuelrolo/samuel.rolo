/**
 * Brevo Integration for Share2Inspire Website
 * This file handles all integrations with Brevo email marketing platform
 * and payment processing with Ifthenpay
 */
// Solução temporária para contornar problemas de CORS e erros 405
// Adicionar ao início do ficheiro brevo-integration.js

// Configuração global para todos os pedidos fetch
window.originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
    // Garantir que options existe
    options = options || {};
    
    // Adicionar cabeçalhos CORS para todos os pedidos
    options.headers = options.headers || {};
    options.headers['X-Requested-With'] = 'XMLHttpRequest';
    
    // Adicionar mode: 'cors' para garantir que o navegador trata corretamente
    options.mode = 'cors';
    
    // Adicionar credentials para enviar cookies se necessário
    options.credentials = 'include';
    
    // Chamar o fetch original com as opções modificadas
    return window.originalFetch(url, options);
};
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
    const newsletterForm = document.getElementById('newsletterForm');
    
    if (!newsletterForm) return;
    
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const statusMessage = document.getElementById('newsletterStatus');
        
        // Disable submit button and show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A processar...';
        
        // Get form data
        const formData = new FormData(newsletterForm);
        const data = {
            email: formData.get('email'),
            source: 'website_newsletter'
        };
        
        // Send data to backend
        fetch('https://share2inspire-beckend.lm.r.appspot.com/api/feedback/newsletter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na resposta do servidor: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            // Show success message
            if (statusMessage) {
                statusMessage.innerHTML = '<div class="alert alert-success">Subscrição realizada com sucesso!</div>';
            }
            
            // Reset form
            newsletterForm.reset();
            
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.innerHTML = 'Subscrever';
            
            // Clear status message after 3 seconds
            setTimeout(() => {
                if (statusMessage) {
                    statusMessage.innerHTML = '';
                }
            }, 3000);
        })
        .catch(error => {
            console.error('Erro ao processar subscrição:', error);
            
            // Show error message
            if (statusMessage) {
                statusMessage.innerHTML = '<div class="alert alert-danger">Erro ao processar pedido. Por favor tente novamente.</div>';
            }
            
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.innerHTML = 'Subscrever';
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
        
        const submitButton = this.querySelector('button[type="submit"]');
        const statusMessage = document.getElementById('contactStatus');
        
        // Disable submit button and show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A enviar...';
        
        // Get form data
        const formData = new FormData(contactForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone') || '',
            message: formData.get('message'),
            source: 'website_contact'
        };
        
        // Send data to backend
        fetch('https://share2inspire-beckend.lm.r.appspot.com/api/feedback/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na resposta do servidor: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            // Show success message
            if (statusMessage) {
                statusMessage.innerHTML = '<div class="alert alert-success">Mensagem enviada com sucesso! Entraremos em contacto brevemente.</div>';
            }
            
            // Reset form
            contactForm.reset();
            
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.innerHTML = 'Enviar Mensagem';
            
            // Clear status message after 5 seconds
            setTimeout(() => {
                if (statusMessage) {
                    statusMessage.innerHTML = '';
                }
            }, 5000);
        })
        .catch(error => {
            console.error('Erro ao enviar mensagem:', error);
            
            // Show error message
            if (statusMessage) {
                statusMessage.innerHTML = '<div class="alert alert-danger">Erro ao processar pedido. Por favor tente novamente.</div>';
            }
            
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.innerHTML = 'Enviar Mensagem';
        });
    });
}

/**
 * Setup service booking forms
 */
function setupServiceForms() {
    // Kickstart Pro form
    setupServiceForm('kickstartForm', 'kickstartStatus');
    
    // Consultoria form
    setupServiceForm('consultoriaForm', 'consultoriaStatus');
    
    // Coaching form
    setupServiceForm('coachingForm', 'coachingStatus');
    
    // Workshops form
    setupServiceForm('workshopsForm', 'workshopsStatus');
}

/**
 * Setup a specific service booking form
 */
function setupServiceForm(formId, statusId) {
    const form = document.getElementById(formId);
    
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const statusMessage = document.getElementById(statusId);
        
        // Disable submit button and show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A processar...';
        
        // Get form data
        const formData = new FormData(form);
        const data = {
            service: formData.get('service'),
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            date: formData.get('date') || '',
            time: formData.get('time') || '',
            format: formData.get('format') || '',
            message: formData.get('message') || '',
            duration: formData.get('duration') || '',
            amount: formData.get('amount') || '',
            paymentMethod: formData.get('paymentMethod') || '',
            source: 'website_service_booking'
        };
        
        // Send data to backend
        fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/initiate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na resposta do servidor: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Handle payment methods
                if (data.paymentMethod === 'mbway') {
                    // Show MBWAY payment info
                    if (statusMessage) {
                        statusMessage.innerHTML = `
                            <div class="alert alert-success">
                                <h5>Pagamento MB WAY</h5>
                                <p>Foi enviado um pedido de pagamento para o número ${data.phone}.</p>
                                <p>Por favor, aceite o pagamento na aplicação MB WAY.</p>
                            </div>
                        `;
                    }
                } else if (data.paymentMethod === 'multibanco') {
                    // Show Multibanco payment info
                    if (statusMessage) {
                        statusMessage.innerHTML = `
                            <div class="alert alert-success">
                                <h5>Pagamento por Referência Multibanco</h5>
                                <p>Entidade: ${data.entity}</p>
                                <p>Referência: ${data.reference}</p>
                                <p>Valor: ${data.amount}€</p>
                                <p>A referência é válida por 48 horas.</p>
                            </div>
                        `;
                    }
                } else if (data.paymentMethod === 'payshop') {
                    // Show Payshop payment info
                    if (statusMessage) {
                        statusMessage.innerHTML = `
                            <div class="alert alert-success">
                                <h5>Pagamento por Referência Payshop</h5>
                                <p>Referência: ${data.reference}</p>
                                <p>Valor: ${data.amount}€</p>
                                <p>A referência é válida por 48 horas.</p>
                            </div>
                        `;
                    }
                } else {
                    // Generic success message
                    if (statusMessage) {
                        statusMessage.innerHTML = '<div class="alert alert-success">Reserva processada com sucesso! Receberá um email com os detalhes.</div>';
                    }
                }
                
                // Reset form
                form.reset();
            } else {
                // Show error message from server
                if (statusMessage) {
                    statusMessage.innerHTML = `<div class="alert alert-danger">${data.message || 'Erro ao processar pedido. Por favor tente novamente.'}</div>`;
                }
            }
            
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submeter';
        })
        .catch(error => {
            console.error('Erro ao processar reserva:', error);
            
            // Show error message
            if (statusMessage) {
                statusMessage.innerHTML = '<div class="alert alert-danger">Erro ao processar pedido. Por favor tente novamente.</div>';
            }
            
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submeter';
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
        
        const submitButton = this.querySelector('button[type="submit"]');
        const statusMessage = document.getElementById('feedbackStatus');
        
        // Disable submit button and show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A enviar...';
        
        // Get form data
        const formData = new FormData(feedbackForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            message: formData.get('message'),
            rating: formData.get('rating') || '5', // Default to 5 if not provided
            source: 'website_feedback'
        };
        
        // Send data to backend
        fetch('https://share2inspire-beckend.lm.r.appspot.com/api/feedback/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na resposta do servidor: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            // Show success message
            if (statusMessage) {
                statusMessage.innerHTML = '<div class="alert alert-success">Feedback enviado com sucesso! Obrigado pelo seu contributo.</div>';
            }
            
            // Reset form
            feedbackForm.reset();
            
            // Reset star rating to 5
            document.getElementById('rating').value = 5;
            const stars = document.querySelectorAll('#rating-stars .star');
            stars.forEach(star => {
                const starRating = parseInt(star.getAttribute('data-rating'));
                if (starRating <= 5) {
                    star.classList.add('active');
                } else {
                    star.classList.remove('active');
                }
            });
            
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.innerHTML = 'Enviar Feedback';
            
            // Close modal after 2 seconds
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('feedbackModal'));
                if (modal) modal.hide();
                
                // Clear status message after modal is closed
                if (statusMessage) {
                    setTimeout(() => {
                        statusMessage.innerHTML = '';
                    }, 500);
                }
            }, 2000);
        })
        .catch(error => {
            console.error('Erro ao enviar feedback:', error);
            
            // Show error message
            if (statusMessage) {
                statusMessage.innerHTML = '<div class="alert alert-danger">Erro ao processar pedido. Por favor tente novamente.</div>';
            }
            
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.innerHTML = 'Enviar Feedback';
        });
    });
}
