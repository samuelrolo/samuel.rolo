/**
 * Script principal para o site Share2Inspire
 * 
 * Este ficheiro contém o código principal para inicialização e gestão
 * dos formulários e modais do site Share2Inspire.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar todos os modais Bootstrap
    initializeModals();
    
    // Inicializar formulários
    initializeContactForm();
    initializeNewsletterForm();
    initializeConsultingForm();
    initializeCoachingForm();
    initializeWorkshopForm();
    
    // Inicializar animações e efeitos
    initializeAnimations();
});

/**
 * Inicializa todos os modais Bootstrap
 */
function initializeModals() {
    var modals = document.querySelectorAll('.modal');
    modals.forEach(function(modal) {
        new bootstrap.Modal(modal);
    });
    
    // Limpar formulários quando os modais são fechados
    document.querySelectorAll('.modal').forEach(function(modal) {
        modal.addEventListener('hidden.bs.modal', function() {
            const form = this.querySelector('form');
            if (form) {
                form.reset();
                const formMessage = form.querySelector('.form-message');
                if (formMessage) {
                    formMessage.innerHTML = '';
                    formMessage.style.display = 'none';
                }
            }
        });
    });
}

/**
 * Inicializa o formulário de contacto
 */
function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const formMessage = this.querySelector('.form-message') || document.createElement('div');
        
        // Garantir que o elemento de mensagem existe
        if (!this.querySelector('.form-message')) {
            formMessage.className = 'form-message mt-3';
            contactForm.appendChild(formMessage);
        }
        
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A enviar...';
        
        // Obter dados do formulário
        const formData = new FormData(contactForm);
        const data = {
            name: formData.get('name') || '',
            email: formData.get('email') || '',
            phone: formData.get('phone') || '',
            subject: formData.get('subject') || 'Contacto do website',
            message: formData.get('message') || '',
            reason: formData.get('reason') || 'Contacto geral'
        };
        
        // Enviar dados para a API da BREVO
        if (window.brevoSDK && typeof window.brevoSDK.sendContactForm === 'function') {
            window.brevoSDK.sendContactForm(data)
                .then(response => {
                    console.log('Formulário enviado com sucesso:', response);
                    
                    // Mostrar mensagem de sucesso
                    formMessage.innerHTML = `
                        <div class="alert alert-success">
                            Mensagem enviada com sucesso! Entraremos em contacto brevemente.
                        </div>
                    `;
                    formMessage.style.display = 'block';
                    
                    // Resetar formulário
                    contactForm.reset();
                })
                .catch(error => {
                    console.error('Erro ao enviar formulário:', error);
                    
                    // Mostrar mensagem de erro
                    formMessage.innerHTML = `
                        <div class="alert alert-danger">
                            Erro ao enviar mensagem: ${error.message || 'Erro desconhecido'}. 
                            Por favor tente novamente ou contacte-nos diretamente.
                        </div>
                    `;
                    formMessage.style.display = 'block';
                })
                .finally(() => {
                    // Reabilitar botão
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Enviar Mensagem';
                });
        } else {
            console.error('API da Brevo não disponível');
            
            // Mostrar mensagem de erro
            formMessage.innerHTML = `
                <div class="alert alert-danger">
                    API da Brevo não disponível. Por favor tente novamente mais tarde ou contacte-nos diretamente.
                </div>
            `;
            formMessage.style.display = 'block';
            
            // Reabilitar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'Enviar Mensagem';
        }
    });
}

/**
 * Inicializa o formulário de newsletter
 */
function initializeNewsletterForm() {
    const newsletterForm = document.getElementById('newsletterForm');
    if (!newsletterForm) return;
    
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const formMessage = this.querySelector('.form-message') || document.createElement('div');
        
        // Garantir que o elemento de mensagem existe
        if (!this.querySelector('.form-message')) {
            formMessage.className = 'form-message mt-3';
            newsletterForm.appendChild(formMessage);
        }
        
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A processar...';
        
        // Obter dados do formulário
        const formData = new FormData(newsletterForm);
        const data = {
            email: formData.get('email') || '',
            name: formData.get('name') || ''
        };
        
        // Simular envio para API de newsletter
        setTimeout(() => {
            console.log('Inscrição na newsletter processada:', data);
            
            // Mostrar mensagem de sucesso
            formMessage.innerHTML = `
                <div class="alert alert-success">
                    Inscrição na newsletter realizada com sucesso!
                </div>
            `;
            formMessage.style.display = 'block';
            
            // Resetar formulário
            newsletterForm.reset();
            
            // Reabilitar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'Subscrever';
        }, 1000);
    });
}

/**
 * Inicializa o formulário de consultoria
 */
function initializeConsultingForm() {
    const consultingForm = document.getElementById('consultingForm');
    if (!consultingForm) return;
    
    consultingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const formMessage = this.querySelector('.form-message') || document.createElement('div');
        
        // Garantir que o elemento de mensagem existe
        if (!this.querySelector('.form-message')) {
            formMessage.className = 'form-message mt-3';
            consultingForm.appendChild(formMessage);
        }
        
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A enviar...';
        
        // Obter dados do formulário
        const formData = new FormData(consultingForm);
        const data = {
            name: formData.get('name') || '',
            email: formData.get('email') || '',
            phone: formData.get('phone') || '',
            company: formData.get('company') || '',
            industry: formData.get('industry') || '',
            employees: formData.get('employees') || '',
            message: formData.get('message') || '',
            subject: 'Pedido de Consultoria',
            reason: 'Consultoria'
        };
        
        // Enviar dados para a API da BREVO
        if (window.brevoSDK && typeof window.brevoSDK.sendConsultingRequest === 'function') {
            window.brevoSDK.sendConsultingRequest(data)
                .then(response => {
                    console.log('Pedido de consultoria enviado com sucesso:', response);
                    
                    // Mostrar mensagem de sucesso
                    formMessage.innerHTML = `
                        <div class="alert alert-success">
                            Pedido de consultoria enviado com sucesso! Entraremos em contacto brevemente para agendar uma reunião.
                        </div>
                    `;
                    formMessage.style.display = 'block';
                    
                    // Resetar formulário
                    consultingForm.reset();
                })
                .catch(error => {
                    console.error('Erro ao enviar pedido de consultoria:', error);
                    
                    // Mostrar mensagem de erro
                    formMessage.innerHTML = `
                        <div class="alert alert-danger">
                            Erro ao enviar pedido: ${error.message || 'Erro desconhecido'}. 
                            Por favor tente novamente ou contacte-nos diretamente.
                        </div>
                    `;
                    formMessage.style.display = 'block';
                })
                .finally(() => {
                    // Reabilitar botão
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Enviar Pedido';
                });
        } else {
            console.error('API da Brevo não disponível');
            
            // Mostrar mensagem de erro
            formMessage.innerHTML = `
                <div class="alert alert-danger">
                    API da Brevo não disponível. Por favor tente novamente mais tarde ou contacte-nos diretamente.
                </div>
            `;
            formMessage.style.display = 'block';
            
            // Reabilitar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'Enviar Pedido';
        }
    });
}

/**
 * Inicializa o formulário de coaching
 */
function initializeCoachingForm() {
    const coachingForm = document.getElementById('coachingForm');
    if (!coachingForm) return;
    
    coachingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const formMessage = this.querySelector('.form-message') || document.createElement('div');
        
        // Garantir que o elemento de mensagem existe
        if (!this.querySelector('.form-message')) {
            formMessage.className = 'form-message mt-3';
            coachingForm.appendChild(formMessage);
        }
        
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A enviar...';
        
        // Obter dados do formulário
        const formData = new FormData(coachingForm);
        const data = {
            name: formData.get('name') || '',
            email: formData.get('email') || '',
            phone: formData.get('phone') || '',
            position: formData.get('position') || '',
            goals: formData.get('goals') || '',
            message: formData.get('message') || '',
            subject: 'Pedido de Coaching',
            reason: 'Coaching'
        };
        
        // Enviar dados para a API da BREVO
        if (window.brevoSDK && typeof window.brevoSDK.sendCoachingRequest === 'function') {
            window.brevoSDK.sendCoachingRequest(data)
                .then(response => {
                    console.log('Pedido de coaching enviado com sucesso:', response);
                    
                    // Mostrar mensagem de sucesso
                    formMessage.innerHTML = `
                        <div class="alert alert-success">
                            Pedido de coaching enviado com sucesso! Entraremos em contacto brevemente para agendar uma sessão.
                        </div>
                    `;
                    formMessage.style.display = 'block';
                    
                    // Resetar formulário
                    coachingForm.reset();
                })
                .catch(error => {
                    console.error('Erro ao enviar pedido de coaching:', error);
                    
                    // Mostrar mensagem de erro
                    formMessage.innerHTML = `
                        <div class="alert alert-danger">
                            Erro ao enviar pedido: ${error.message || 'Erro desconhecido'}. 
                            Por favor tente novamente ou contacte-nos diretamente.
                        </div>
                    `;
                    formMessage.style.display = 'block';
                })
                .finally(() => {
                    // Reabilitar botão
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Enviar Pedido';
                });
        } else {
            console.error('API da Brevo não disponível');
            
            // Mostrar mensagem de erro
            formMessage.innerHTML = `
                <div class="alert alert-danger">
                    API da Brevo não disponível. Por favor tente novamente mais tarde ou contacte-nos diretamente.
                </div>
            `;
            formMessage.style.display = 'block';
            
            // Reabilitar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'Enviar Pedido';
        }
    });
}

/**
 * Inicializa o formulário de workshop
 */
function initializeWorkshopForm() {
    const workshopForm = document.getElementById('workshopForm');
    if (!workshopForm) return;
    
    workshopForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const formMessage = this.querySelector('.form-message') || document.createElement('div');
        
        // Garantir que o elemento de mensagem existe
        if (!this.querySelector('.form-message')) {
            formMessage.className = 'form-message mt-3';
            workshopForm.appendChild(formMessage);
        }
        
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A enviar...';
        
        // Obter dados do formulário
        const formData = new FormData(workshopForm);
        const data = {
            name: formData.get('name') || '',
            email: formData.get('email') || '',
            phone: formData.get('phone') || '',
            company: formData.get('company') || '',
            workshop: formData.get('workshop') || '',
            participants: formData.get('participants') || '',
            date: formData.get('date') || '',
            message: formData.get('message') || '',
            subject: 'Inscrição em Workshop',
            reason: 'Workshop'
        };
        
        // Enviar dados para a API da BREVO
        if (window.brevoSDK && typeof window.brevoSDK.sendWorkshopRegistration === 'function') {
            window.brevoSDK.sendWorkshopRegistration(data)
                .then(response => {
                    console.log('Inscrição em workshop enviada com sucesso:', response);
                    
                    // Mostrar mensagem de sucesso
                    formMessage.innerHTML = `
                        <div class="alert alert-success">
                            Inscrição em workshop enviada com sucesso! Entraremos em contacto brevemente com mais informações.
                        </div>
                    `;
                    formMessage.style.display = 'block';
                    
                    // Resetar formulário
                    workshopForm.reset();
                })
                .catch(error => {
                    console.error('Erro ao enviar inscrição em workshop:', error);
                    
                    // Mostrar mensagem de erro
                    formMessage.innerHTML = `
                        <div class="alert alert-danger">
                            Erro ao enviar inscrição: ${error.message || 'Erro desconhecido'}. 
                            Por favor tente novamente ou contacte-nos diretamente.
                        </div>
                    `;
                    formMessage.style.display = 'block';
                })
                .finally(() => {
                    // Reabilitar botão
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Enviar Inscrição';
                });
        } else {
            console.error('API da Brevo não disponível');
            
            // Mostrar mensagem de erro
            formMessage.innerHTML = `
                <div class="alert alert-danger">
                    API da Brevo não disponível. Por favor tente novamente mais tarde ou contacte-nos diretamente.
                </div>
            `;
            formMessage.style.display = 'block';
            
            // Reabilitar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'Enviar Inscrição';
        }
    });
}

/**
 * Inicializa animações e efeitos
 */
function initializeAnimations() {
    // Animação de scroll suave para links internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Adicionar classe 'scrolled' ao navbar quando a página é rolada
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });
}
