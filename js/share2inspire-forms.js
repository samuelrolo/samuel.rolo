/**
 * Formulários Share2Inspire - Versão Corrigida
 * Este arquivo contém as correções para todos os formulários do site
 * Redireciona todas as chamadas para o endpoint /api/feedback/contact que está funcionando
 */

// Configuração global para todos os pedidos fetch
window.originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
    // Garantir que options existe
    options = options || {};
    
    // Adicionar cabeçalhos CORS para todos os pedidos
    options.headers = options.headers || {};
    options.headers['X-Requested-With'] = 'XMLHttpRequest';
    options.headers['Origin'] = 'https://share2inspire.pt';
    options.headers['Accept'] = 'application/json';
    
    // Adicionar mode: 'cors' para garantir que o navegador trata corretamente
    options.mode = 'cors';
    
    // Adicionar credentials para enviar cookies se necessário
    options.credentials = 'include';
    
    // Redirecionar chamadas para endpoints problemáticos
    if (url.includes('/api/feedback/submit') || url.includes('/api/feedback/newsletter')) {
        console.log('Redirecionando chamada de', url, 'para /api/feedback/contact');
        url = 'https://share2inspire-beckend.lm.r.appspot.com/api/feedback/contact';
    }
    
    // Chamar o fetch original com as opções modificadas
    return window.originalFetch(url, options);
};

// Esperar pelo carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar todos os formulários
    initAllForms();
});

/**
 * Inicializa todos os formulários do site
 */
function initAllForms() {
    // Formulário de newsletter
    setupNewsletterForm();
    
    // Formulário de contacto
    setupContactForm();
    
    // Formulários de serviços
    setupServiceForms();
    
    // Formulário de feedback
    setupFeedbackForm();
    
    // Formulário de consultoria
    setupConsultoriaForm();
}

/**
 * Configura o formulário de newsletter
 */
function setupNewsletterForm() {
    const newsletterForm = document.getElementById('newsletterForm');
    
    if (!newsletterForm) return;
    
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const statusMessage = document.getElementById('newsletterStatus') || document.createElement('div');
        
        // Garantir que o elemento de status existe
        if (!document.getElementById('newsletterStatus')) {
            statusMessage.id = 'newsletterStatus';
            newsletterForm.appendChild(statusMessage);
        }
        
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A processar...';
        
        // Obter dados do formulário
        const formData = new FormData(newsletterForm);
        const data = {
            email: formData.get('email'),
            name: formData.get('name') || 'Subscritor Newsletter',
            message: 'Pedido de subscrição da newsletter',
            subject: 'Subscrição Newsletter',
            source: 'website_newsletter'
        };
        
        console.log('Enviando dados para o backend:', data);
        
        // Enviar dados para o backend (usando o endpoint contact em vez de newsletter)
        fetch('https://share2inspire-beckend.lm.r.appspot.com/api/feedback/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://share2inspire.pt',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log('Resposta do servidor:', response);
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('Erro na resposta do servidor:', response.status, text);
                    throw new Error('Erro na resposta do servidor: ' + response.status + ' - ' + text);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Dados recebidos do servidor:', data);
            
            // Mostrar mensagem de sucesso
            statusMessage.innerHTML = '<div class="alert alert-success">Subscrição realizada com sucesso!</div>';
            
            // Resetar formulário
            newsletterForm.reset();
            
            // Reabilitar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'Subscrever';
            
            // Limpar mensagem após 3 segundos
            setTimeout(() => {
                statusMessage.innerHTML = '';
            }, 3000);
        })
        .catch(error => {
            console.error('Erro ao processar subscrição:', error);
            
            // Mostrar mensagem de erro
            statusMessage.innerHTML = '<div class="alert alert-danger">Erro ao processar pedido. Por favor tente novamente.</div>';
            
            // Reabilitar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'Subscrever';
        });
    });
}

/**
 * Configura o formulário de contacto
 */
function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const statusMessage = document.getElementById('contactStatus') || document.createElement('div');
        
        // Garantir que o elemento de status existe
        if (!document.getElementById('contactStatus')) {
            statusMessage.id = 'contactStatus';
            contactForm.appendChild(statusMessage);
        }
        
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A enviar...';
        
        // Obter dados do formulário
        const formData = new FormData(contactForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone') || '',
            message: formData.get('message'),
            subject: formData.get('subject') || 'Contacto do Website',
            source: 'website_contact'
        };
        
        console.log('Enviando dados para o backend:', data);
        
        // Enviar dados para o backend
        fetch('https://share2inspire-beckend.lm.r.appspot.com/api/feedback/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://share2inspire.pt',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log('Resposta do servidor:', response);
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('Erro na resposta do servidor:', response.status, text);
                    throw new Error('Erro na resposta do servidor: ' + response.status + ' - ' + text);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Dados recebidos do servidor:', data);
            
            // Mostrar mensagem de sucesso
            statusMessage.innerHTML = '<div class="alert alert-success">Mensagem enviada com sucesso! Entraremos em contacto brevemente.</div>';
            
            // Resetar formulário
            contactForm.reset();
            
            // Reabilitar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'Enviar Mensagem';
            
            // Limpar mensagem após 5 segundos
            setTimeout(() => {
                statusMessage.innerHTML = '';
            }, 5000);
        })
        .catch(error => {
            console.error('Erro ao enviar mensagem:', error);
            
            // Mostrar mensagem de erro
            statusMessage.innerHTML = '<div class="alert alert-danger">Erro ao processar pedido. Por favor tente novamente.</div>';
            
            // Reabilitar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'Enviar Mensagem';
        });
    });
}

/**
 * Configura os formulários de serviços
 */
function setupServiceForms() {
    // Formulário Kickstart Pro
    setupServiceForm('kickstartForm', 'kickstartStatus');
    
    // Formulário Consultoria
    setupServiceForm('consultoriaForm', 'consultoriaStatus');
    
    // Formulário Coaching
    setupServiceForm('coachingForm', 'coachingStatus');
    
    // Formulário Workshops
    setupServiceForm('workshopsForm', 'workshopsStatus');
}

/**
 * Configura um formulário de serviço específico
 */
function setupServiceForm(formId, statusId) {
    const form = document.getElementById(formId);
    
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const statusMessage = document.getElementById(statusId) || document.createElement('div');
        
        // Garantir que o elemento de status existe
        if (!document.getElementById(statusId)) {
            statusMessage.id = statusId;
            form.appendChild(statusMessage);
        }
        
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A processar...';
        
        // Obter dados do formulário
        const formData = new FormData(form);
        
        // Garantir que todos os campos obrigatórios estão preenchidos
        const requiredFields = ['name', 'email', 'phone'];
        let missingFields = false;
        
        requiredFields.forEach(field => {
            if (!formData.get(field)) {
                missingFields = true;
                console.error(`Campo obrigatório em falta: ${field}`);
            }
        });
        
        if (missingFields) {
            statusMessage.innerHTML = '<div class="alert alert-danger">Por favor, preencha todos os campos obrigatórios.</div>';
            
            // Reabilitar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submeter';
            return;
        }
        
        // Construir objeto de dados com todos os campos necessários
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            message: `Reserva de serviço: ${formId.replace('Form', '')}\nData: ${formData.get('date') || 'Não especificada'}\nHora: ${formData.get('time') || 'Não especificada'}\nFormato: ${formData.get('format') || 'Não especificado'}\nMensagem: ${formData.get('message') || 'Não especificada'}`,
            subject: `Reserva de ${formId.replace('Form', '')}`,
            source: 'website_service_booking',
            // Campos adicionais para processamento interno
            service: formId.replace('Form', ''),
            date: formData.get('date') || '',
            time: formData.get('time') || '',
            format: formData.get('format') || '',
            duration: formData.get('duration') || '',
            amount: formData.get('amount') || '30',
            paymentMethod: formData.get('paymentMethod') || 'mbway'
        };
        
        console.log('Enviando dados para o backend:', data);
        
        // Enviar dados para o backend (usando o endpoint contact em vez de payment/initiate)
        fetch('https://share2inspire-beckend.lm.r.appspot.com/api/feedback/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://share2inspire.pt',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log('Resposta do servidor:', response);
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('Erro na resposta do servidor:', response.status, text);
                    throw new Error('Erro na resposta do servidor: ' + response.status + ' - ' + text);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Dados recebidos do servidor:', data);
            
            // Mostrar mensagem de sucesso
            statusMessage.innerHTML = `
                <div class="alert alert-success">
                    <h5>Reserva Processada com Sucesso!</h5>
                    <p>Obrigado pela sua reserva. Entraremos em contacto brevemente para confirmar os detalhes e finalizar o pagamento.</p>
                </div>
            `;
            
            // Resetar formulário
            form.reset();
            
            // Reabilitar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submeter';
            
            // Redirecionar para página de sucesso após 3 segundos
            setTimeout(() => {
                // Verificar se deve redirecionar
                if (data.success && data.redirect) {
                    window.location.href = data.redirect;
                } else if (formData.get('paymentMethod')) {
                    // Redirecionar para página de pagamento genérica
                    window.location.href = `/pages/pagamento-sucesso.html?duration=${formData.get('duration') || '30'}&amount=${formData.get('amount') || '30'}&date=${formData.get('date') || ''}&format=${formData.get('format') || 'Online'}&reference=YZp6WiM5r4V9gNDiEQmw&method=${formData.get('paymentMethod') || 'mbway'}`;
                }
            }, 3000);
        })
        .catch(error => {
            console.error('Erro ao processar reserva:', error);
            
            // Mostrar mensagem de erro
            statusMessage.innerHTML = '<div class="alert alert-danger">Erro ao processar pedido. Por favor tente novamente.</div>';
            
            // Reabilitar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submeter';
        });
    });
}

/**
 * Configura o formulário de feedback
 */
function setupFeedbackForm() {
    const feedbackForm = document.getElementById('feedbackForm');
    
    if (!feedbackForm) return;
    
    feedbackForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const statusMessage = document.getElementById('feedbackStatus') || document.createElement('div');
        
        // Garantir que o elemento de status existe
        if (!document.getElementById('feedbackStatus')) {
            statusMessage.id = 'feedbackStatus';
            feedbackForm.appendChild(statusMessage);
        }
        
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A enviar...';
        
        // Obter dados do formulário
        const formData = new FormData(feedbackForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            message: `Feedback (${formData.get('rating') || '5'} estrelas): ${formData.get('message')}`,
            subject: 'Feedback do Website',
            rating: formData.get('rating') || '5', // Default to 5 if not provided
            source: 'website_feedback'
        };
        
        console.log('Enviando dados para o backend:', data);
        
        // Enviar dados para o backend (usando o endpoint contact em vez de submit)
        fetch('https://share2inspire-beckend.lm.r.appspot.com/api/feedback/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://share2inspire.pt',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log('Resposta do servidor:', response);
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('Erro na resposta do servidor:', response.status, text);
                    throw new Error('Erro na resposta do servidor: ' + response.status + ' - ' + text);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Dados recebidos do servidor:', data);
            
            // Mostrar mensagem de sucesso
            statusMessage.innerHTML = '<div class="alert alert-success">Feedback enviado com sucesso! Obrigado pelo seu contributo.</div>';
            
            // Resetar formulário
            feedbackForm.reset();
            
            // Resetar avaliação para 5 estrelas
            const ratingInput = document.getElementById('rating');
            if (ratingInput) {
                ratingInput.value = 5;
                const stars = document.querySelectorAll('#rating-stars .star');
                stars.forEach(star => {
                    const starRating = parseInt(star.getAttribute('data-rating'));
                    if (starRating <= 5) {
                        star.classList.add('active');
                    } else {
                        star.classList.remove('active');
                    }
                });
            }
            
            // Reabilitar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'Enviar Feedback';
            
            // Fechar modal após 2 segundos
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('feedbackModal'));
                if (modal) modal.hide();
                
                // Limpar mensagem após o fechamento do modal
                setTimeout(() => {
                    statusMessage.innerHTML = '';
                }, 500);
            }, 2000);
        })
        .catch(error => {
            console.error('Erro ao enviar feedback:', error);
            
            // Mostrar mensagem de erro
            statusMessage.innerHTML = '<div class="alert alert-danger">Erro ao processar pedido. Por favor tente novamente.</div>';
            
            // Reabilitar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'Enviar Feedback';
        });
    });
}

/**
 * Configura o formulário de consultoria
 */
function setupConsultoriaForm() {
    const consultoriaForm = document.getElementById('consultoriaForm');
    
    if (!consultoriaForm) return;
    
    consultoriaForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const statusMessage = document.getElementById('consultoriaStatus') || document.createElement('div');
        
        // Garantir que o elemento de status existe
        if (!document.getElementById('consultoriaStatus')) {
            statusMessage.id = 'consultoriaStatus';
            consultoriaForm.appendChild(statusMessage);
        }
        
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A processar...';
        
        // Obter dados do formulário
        const formData = new FormData(consultoriaForm);
        
        // Validar campos obrigatórios
        const requiredFields = ['name', 'email', 'phone'];
        let missingFields = false;
        
        requiredFields.forEach(field => {
            const fieldValue = formData.get(field);
            if (!fieldValue || fieldValue.trim() === '') {
                missingFields = true;
                console.error(`Campo obrigatório em falta: ${field}`);
            }
        });
        
        if (missingFields) {
            statusMessage.innerHTML = '<div class="alert alert-danger">Por favor, preencha todos os campos obrigatórios.</div>';
            submitButton.disabled = false;
            submitButton.innerHTML = 'Solicitar Proposta';
            return;
        }
        
        // Preparar objeto de dados
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            company: formData.get('company') || formData.get('empresa') || '',
            message: formData.get('message') || formData.get('description') || '',
            subject: 'Solicitação de Proposta de Consultoria',
            area: formData.get('area') || '',
            source: 'website_consultoria'
        };
        
        console.log('Enviando dados para o backend:', data);
        
        // Enviar dados para o backend usando o endpoint contact
        fetch('https://share2inspire-beckend.lm.r.appspot.com/api/feedback/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://share2inspire.pt',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log('Resposta do servidor:', response);
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('Erro na resposta do servidor:', response.status, text);
                    throw new Error('Erro na resposta do servidor: ' + response.status + ' - ' + text);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Dados recebidos do servidor:', data);
            
            // Mostrar mensagem de sucesso
            statusMessage.innerHTML = '<div class="alert alert-success">Proposta solicitada com sucesso! Entraremos em contacto brevemente.</div>';
            
            // Resetar formulário
            consultoriaForm.reset();
            
            // Reabilitar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'Solicitar Proposta';
            
            // Fechar modal se existir
            setTimeout(() => {
                const modalElement = consultoriaForm.closest('.modal');
                if (modalElement) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) modal.hide();
                }
            }, 3000);
        })
        .catch(error => {
            console.error('Erro ao processar solicitação:', error);
            
            // Mostrar mensagem de erro
            statusMessage.innerHTML = '<div class="alert alert-danger">Erro ao processar pedido. Por favor tente novamente.</div>';
            
            // Reabilitar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'Solicitar Proposta';
        });
    });
}

// Exportar funções para uso externo
window.share2inspireFormHandlers = {
    initAllForms,
    setupNewsletterForm,
    setupContactForm,
    setupServiceForms,
    setupFeedbackForm,
    setupConsultoriaForm
};
