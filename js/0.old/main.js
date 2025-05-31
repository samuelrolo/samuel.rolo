/**
 * Script principal - Share2Inspire
 * 
 * Este ficheiro contém o código principal para o site Share2Inspire
 * Inclui inicialização de formulários e integrações com APIs
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar todos os formulários de serviço
    initializeServiceForms();
    
    // Configurar navegação suave para links de âncora
    setupSmoothScrolling();
    
    // Configurar animações de entrada
    setupScrollAnimations();
    
    // Configurar validação de formulários
    setupFormValidation();
});

/**
 * Inicializa todos os formulários de serviço
 */
function initializeServiceForms() {
    // Formulários de serviço (exceto Kickstart Pro que tem seu próprio script)
    const serviceForms = [
        { id: 'consultoriaForm', service: 'Consultoria Organizacional' },
        { id: 'coachingForm', service: 'Coaching Executivo' },
        { id: 'workshopsForm', service: 'Workshops e Formações' }
    ];
    
    // Configurar cada formulário
    serviceForms.forEach(formConfig => {
        const form = document.getElementById(formConfig.id);
        if (!form) return;
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitButton = this.querySelector('button[type="submit"]');
            const formMessage = this.querySelector('.form-message') || document.createElement('div');
            
            // Garantir que o elemento de mensagem existe
            if (!this.querySelector('.form-message')) {
                formMessage.className = 'form-message mt-3';
                form.appendChild(formMessage);
            }
            
            // Desabilitar botão e mostrar estado de carregamento
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A processar...';
            
            // Obter dados do formulário
            const formData = new FormData(form);
            const data = {
                service: formConfig.service,
                source: 'website_service_booking'
            };
            
            // Converter FormData para objeto
            for (const [key, value] of formData.entries()) {
                data[key] = value;
            }
            
            console.log('Enviando dados para o backend:', data);
            
            // Enviar dados para a API da BREVO
            if (window.brevoSDK && typeof window.brevoSDK.sendBookingConfirmation === 'function') {
                window.brevoSDK.sendBookingConfirmation(data)
                    .then(() => {
                        console.log('Email de confirmação enviado com sucesso via Brevo');
                        
                        // Mostrar mensagem de sucesso
                        formMessage.innerHTML = `
                            <div class="alert alert-success">
                                <h5>Pedido Enviado com Sucesso!</h5>
                                <p>Obrigado pelo seu interesse em ${formConfig.service}.</p>
                                <p>Entraremos em contacto consigo em breve para discutir os próximos passos.</p>
                            </div>
                        `;
                        
                        // Resetar formulário
                        form.reset();
                    })
                    .catch(error => {
                        console.error('Erro ao enviar email de confirmação via Brevo:', error);
                        
                        // Mostrar mensagem de erro
                        formMessage.innerHTML = `
                            <div class="alert alert-danger">
                                Erro ao processar pedido: ${error.message || 'Erro desconhecido'}. 
                                Por favor tente novamente ou contacte-nos diretamente.
                            </div>
                        `;
                    })
                    .finally(() => {
                        // Reabilitar botão
                        submitButton.disabled = false;
                        submitButton.innerHTML = formConfig.id === 'consultoriaForm' ? 'Solicitar Proposta' : 
                                               formConfig.id === 'coachingForm' ? 'Agendar Sessão Inicial' : 
                                               'Solicitar Informações';
                    });
            } else {
                console.error('API da Brevo não disponível');
                
                // Mostrar mensagem de erro
                formMessage.innerHTML = `
                    <div class="alert alert-danger">
                        Erro ao processar pedido: API de email não disponível. 
                        Por favor tente novamente ou contacte-nos diretamente.
                    </div>
                `;
                
                // Reabilitar botão
                submitButton.disabled = false;
                submitButton.innerHTML = formConfig.id === 'consultoriaForm' ? 'Solicitar Proposta' : 
                                       formConfig.id === 'coachingForm' ? 'Agendar Sessão Inicial' : 
                                       'Solicitar Informações';
            }
        });
    });
    
    // Formulário de contacto
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
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
                source: 'website_contact_form'
            };
            
            // Converter FormData para objeto
            for (const [key, value] of formData.entries()) {
                data[key] = value;
            }
            
            console.log('Enviando dados para o backend:', data);
            
            // Enviar dados para a API da BREVO
            if (window.brevoSDK && typeof window.brevoSDK.sendContactEmail === 'function') {
                window.brevoSDK.sendContactEmail(data)
                    .then(() => {
                        console.log('Email de contacto enviado com sucesso via Brevo');
                        
                        // Mostrar mensagem de sucesso
                        formMessage.innerHTML = `
                            <div class="alert alert-success">
                                <h5>Mensagem Enviada com Sucesso!</h5>
                                <p>Obrigado pelo seu contacto.</p>
                                <p>Responderemos à sua mensagem o mais brevemente possível.</p>
                            </div>
                        `;
                        
                        // Resetar formulário
                        contactForm.reset();
                    })
                    .catch(error => {
                        console.error('Erro ao enviar email de contacto via Brevo:', error);
                        
                        // Mostrar mensagem de erro
                        formMessage.innerHTML = `
                            <div class="alert alert-danger">
                                Erro ao enviar mensagem: ${error.message || 'Erro desconhecido'}. 
                                Por favor tente novamente ou contacte-nos diretamente.
                            </div>
                        `;
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
                        Erro ao enviar mensagem: API de email não disponível. 
                        Por favor tente novamente ou contacte-nos diretamente.
                    </div>
                `;
                
                // Reabilitar botão
                submitButton.disabled = false;
                submitButton.innerHTML = 'Enviar Mensagem';
            }
        });
    }
    
    // Formulário de newsletter
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
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
                source: 'website_newsletter'
            };
            
            // Converter FormData para objeto
            for (const [key, value] of formData.entries()) {
                data[key] = value;
            }
            
            console.log('Enviando dados para o backend:', data);
            
            // Enviar dados para a API da BREVO
            if (window.brevoSDK && typeof window.brevoSDK.sendNewsletterSubscription === 'function') {
                window.brevoSDK.sendNewsletterSubscription(data)
                    .then(() => {
                        console.log('Inscrição na newsletter enviada com sucesso via Brevo');
                        
                        // Mostrar mensagem de sucesso
                        formMessage.innerHTML = `
                            <div class="alert alert-success">
                                <h5>Inscrição Realizada com Sucesso!</h5>
                                <p>Obrigado por se inscrever na nossa newsletter.</p>
                                <p>Receberá em breve as nossas novidades.</p>
                            </div>
                        `;
                        
                        // Resetar formulário
                        newsletterForm.reset();
                    })
                    .catch(error => {
                        console.error('Erro ao enviar inscrição na newsletter via Brevo:', error);
                        
                        // Mostrar mensagem de erro
                        formMessage.innerHTML = `
                            <div class="alert alert-danger">
                                Erro ao processar inscrição: ${error.message || 'Erro desconhecido'}. 
                                Por favor tente novamente.
                            </div>
                        `;
                    })
                    .finally(() => {
                        // Reabilitar botão
                        submitButton.disabled = false;
                        submitButton.innerHTML = 'Subscrever';
                    });
            } else {
                console.error('API da Brevo não disponível');
                
                // Mostrar mensagem de erro
                formMessage.innerHTML = `
                    <div class="alert alert-danger">
                        Erro ao processar inscrição: API de email não disponível. 
                        Por favor tente novamente.
                    </div>
                `;
                
                // Reabilitar botão
                submitButton.disabled = false;
                submitButton.innerHTML = 'Subscrever';
            }
        });
    }
}

/**
 * Configura navegação suave para links de âncora
 */
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            
            // Ignorar se for # vazio
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                e.preventDefault();
                
                // Calcular offset para compensar a navbar fixa
                const navbarHeight = document.querySelector('.navbar') ? document.querySelector('.navbar').offsetHeight : 0;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Configura animações de entrada baseadas em scroll
 */
function setupScrollAnimations() {
    // Implementar animações de entrada se necessário
    // Este é um placeholder para futuras implementações
}

/**
 * Configura validação de formulários
 */
function setupFormValidation() {
    // Adicionar validação de formulários se necessário
    // Este é um placeholder para futuras implementações
}
