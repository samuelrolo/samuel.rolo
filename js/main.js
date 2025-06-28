/**
 * Script principal para o site Share2Inspire - VERSÃO CORRIGIDA
 * 
 * Este ficheiro contém o código principal para inicialização e gestão
 * dos formulários e modais do site Share2Inspire.
 * 
 * CORREÇÕES IMPLEMENTADAS:
 * - Melhor gestão de event listeners
 * - Prevenção de bloqueios de interface
 * - Verificações de existência de elementos
 * - Gestão melhorada de modais
 */

// CORREÇÃO: Variável global para controlar inicialização
let isInitialized = false;

document.addEventListener('DOMContentLoaded', function() {
    // CORREÇÃO: Prevenir múltiplas inicializações
    if (isInitialized) return;
    isInitialized = true;
    
    console.log('Inicializando Share2Inspire...');
    
    try {
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
        
        // CORREÇÃO: Garantir que scroll funciona
        ensureScrollFunctionality();
        
        console.log('Share2Inspire inicializado com sucesso!');
    } catch (error) {
        console.error('Erro na inicialização:', error);
    }
});

/**
 * CORREÇÃO: Função para garantir que o scroll funciona
 */
function ensureScrollFunctionality() {
    // Garantir que o body pode fazer scroll
    document.body.style.overflowY = 'auto';
    document.documentElement.style.overflowY = 'auto';
    
    // Remover qualquer bloqueio de scroll
    document.body.classList.remove('modal-open');
    
    // Verificar se há modais abertos e fechá-los
    const openModals = document.querySelectorAll('.modal.show');
    openModals.forEach(modal => {
        const modalInstance = bootstrap.Modal.getInstance(modal);
        if (modalInstance) {
            modalInstance.hide();
        }
    });
    
    // Remover backdrop de modais órfãos
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
}

/**
 * Inicializa todos os modais Bootstrap
 */
function initializeModals() {
    try {
        const modals = document.querySelectorAll('.modal');
        console.log(`Encontrados ${modals.length} modais para inicializar`);
        
        modals.forEach(function(modal) {
            // CORREÇÃO: Verificar se o modal já foi inicializado
            if (!bootstrap.Modal.getInstance(modal)) {
                new bootstrap.Modal(modal, {
                    backdrop: true,
                    keyboard: true,
                    focus: true
                });
            }
        });
        
        // Limpar formulários quando os modais são fechados
        document.querySelectorAll('.modal').forEach(function(modal) {
            // CORREÇÃO: Remover listeners existentes antes de adicionar novos
            modal.removeEventListener('hidden.bs.modal', handleModalHidden);
            modal.addEventListener('hidden.bs.modal', handleModalHidden);
            
            // CORREÇÃO: Garantir que modais não bloqueiem scroll
            modal.addEventListener('shown.bs.modal', function() {
                console.log('Modal aberto:', modal.id);
            });
            
            modal.addEventListener('hidden.bs.modal', function() {
                console.log('Modal fechado:', modal.id);
                // CORREÇÃO: Garantir que scroll é restaurado
                setTimeout(() => {
                    ensureScrollFunctionality();
                }, 100);
            });
        });
    } catch (error) {
        console.error('Erro ao inicializar modais:', error);
    }
}

/**
 * CORREÇÃO: Handler para quando modais são fechados
 */
function handleModalHidden() {
    const form = this.querySelector('form');
    if (form) {
        form.reset();
        const formMessage = form.querySelector('.form-message');
        if (formMessage) {
            formMessage.innerHTML = '';
            formMessage.style.display = 'none';
        }
    }
}

/**
 * Inicializa o formulário de contacto
 */
function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) {
        console.log('Formulário de contacto não encontrado');
        return;
    }
    
    console.log('Inicializando formulário de contacto...');
    
    // CORREÇÃO: Remover listener existente antes de adicionar novo
    contactForm.removeEventListener('submit', handleContactFormSubmit);
    contactForm.addEventListener('submit', handleContactFormSubmit);
}

/**
 * CORREÇÃO: Handler para submissão do formulário de contacto
 */
function handleContactFormSubmit(e) {
    e.preventDefault();
    
    const submitButton = this.querySelector('button[type="submit"]');
    const formMessage = this.querySelector('.form-message') || document.createElement('div');
    
    // Garantir que o elemento de mensagem existe
    if (!this.querySelector('.form-message')) {
        formMessage.className = 'form-message mt-3';
        this.appendChild(formMessage);
    }
    
    // CORREÇÃO: Verificar se botão existe antes de modificar
    if (submitButton) {
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A enviar...';
    }
    
    // Obter dados do formulário
    const formData = new FormData(this);
    const data = {
        name: formData.get('name') || '',
        email: formData.get('email') || '',
        phone: formData.get('phone') || '',
        subject: formData.get('subject') || 'Contacto do website',
        message: formData.get('message') || '',
        reason: formData.get('reason') || 'Contacto geral'
    };
    
    console.log('Dados do formulário de contacto:', data);
    
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
                this.reset();
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
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Enviar Mensagem';
                }
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
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Enviar Mensagem';
        }
    }
}

/**
 * Inicializa o formulário de newsletter
 */
function initializeNewsletterForm() {
    const newsletterForm = document.getElementById('newsletterForm');
    if (!newsletterForm) {
        console.log('Formulário de newsletter não encontrado');
        return;
    }
    
    console.log('Inicializando formulário de newsletter...');
    
    // CORREÇÃO: Remover listener existente antes de adicionar novo
    newsletterForm.removeEventListener('submit', handleNewsletterFormSubmit);
    newsletterForm.addEventListener('submit', handleNewsletterFormSubmit);
}

/**
 * CORREÇÃO: Handler para submissão do formulário de newsletter
 */
function handleNewsletterFormSubmit(e) {
    e.preventDefault();
    
    const submitButton = this.querySelector('button[type="submit"]');
    const formMessage = this.querySelector('.form-message') || document.createElement('div');
    
    // Garantir que o elemento de mensagem existe
    if (!this.querySelector('.form-message')) {
        formMessage.className = 'form-message mt-3';
        this.appendChild(formMessage);
    }
    
    // CORREÇÃO: Verificar se botão existe antes de modificar
    if (submitButton) {
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A processar...';
    }
    
    // Obter dados do formulário
    const formData = new FormData(this);
    const data = {
        email: formData.get('email') || '',
        name: formData.get('name') || ''
    };
    
    console.log('Dados do formulário de newsletter:', data);
    
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
        this.reset();
        
        // Reabilitar botão
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Subscrever';
        }
    }, 1000);
}

/**
 * Inicializa o formulário de consultoria
 */
function initializeConsultingForm() {
    const consultingForm = document.getElementById('consultingForm');
    if (!consultingForm) {
        console.log('Formulário de consultoria não encontrado');
        return;
    }
    
    console.log('Inicializando formulário de consultoria...');
    
    // CORREÇÃO: Remover listener existente antes de adicionar novo
    consultingForm.removeEventListener('submit', handleConsultingFormSubmit);
    consultingForm.addEventListener('submit', handleConsultingFormSubmit);
}

/**
 * CORREÇÃO: Handler para submissão do formulário de consultoria
 */
function handleConsultingFormSubmit(e) {
    e.preventDefault();
    
    const submitButton = this.querySelector('button[type="submit"]');
    const formMessage = this.querySelector('.form-message') || document.createElement('div');
    
    // Garantir que o elemento de mensagem existe
    if (!this.querySelector('.form-message')) {
        formMessage.className = 'form-message mt-3';
        this.appendChild(formMessage);
    }
    
    // CORREÇÃO: Verificar se botão existe antes de modificar
    if (submitButton) {
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A enviar...';
    }
    
    // Obter dados do formulário
    const formData = new FormData(this);
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
    
    console.log('Dados do formulário de consultoria:', data);
    
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
                this.reset();
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
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Enviar Pedido';
                }
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
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Enviar Pedido';
        }
    }
}

/**
 * Inicializa o formulário de coaching
 */
function initializeCoachingForm() {
    const coachingForm = document.getElementById('coachingForm');
    if (!coachingForm) {
        console.log('Formulário de coaching não encontrado');
        return;
    }
    
    console.log('Inicializando formulário de coaching...');
    
    // CORREÇÃO: Remover listener existente antes de adicionar novo
    coachingForm.removeEventListener('submit', handleCoachingFormSubmit);
    coachingForm.addEventListener('submit', handleCoachingFormSubmit);
}

/**
 * CORREÇÃO: Handler para submissão do formulário de coaching
 */
function handleCoachingFormSubmit(e) {
    e.preventDefault();
    
    const submitButton = this.querySelector('button[type="submit"]');
    const formMessage = this.querySelector('.form-message') || document.createElement('div');
    
    // Garantir que o elemento de mensagem existe
    if (!this.querySelector('.form-message')) {
        formMessage.className = 'form-message mt-3';
        this.appendChild(formMessage);
    }
    
    // CORREÇÃO: Verificar se botão existe antes de modificar
    if (submitButton) {
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A enviar...';
    }
    
    // Obter dados do formulário
    const formData = new FormData(this);
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
    
    console.log('Dados do formulário de coaching:', data);
    
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
                this.reset();
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
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Enviar Pedido';
                }
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
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Enviar Pedido';
        }
    }
}

/**
 * Inicializa o formulário de workshop
 */
function initializeWorkshopForm() {
    const workshopForm = document.getElementById('workshopForm');
    if (!workshopForm) {
        console.log('Formulário de workshop não encontrado');
        return;
    }
    
    console.log('Inicializando formulário de workshop...');
    
    // CORREÇÃO: Remover listener existente antes de adicionar novo
    workshopForm.removeEventListener('submit', handleWorkshopFormSubmit);
    workshopForm.addEventListener('submit', handleWorkshopFormSubmit);
}

/**
 * CORREÇÃO: Handler para submissão do formulário de workshop
 */
function handleWorkshopFormSubmit(e) {
    e.preventDefault();
    
    const submitButton = this.querySelector('button[type="submit"]');
    const formMessage = this.querySelector('.form-message') || document.createElement('div');
    
    // Garantir que o elemento de mensagem existe
    if (!this.querySelector('.form-message')) {
        formMessage.className = 'form-message mt-3';
        this.appendChild(formMessage);
    }
    
    // CORREÇÃO: Verificar se botão existe antes de modificar
    if (submitButton) {
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A enviar...';
    }
    
    // Obter dados do formulário
    const formData = new FormData(this);
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
    
    console.log('Dados do formulário de workshop:', data);
    
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
                this.reset();
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
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Enviar Inscrição';
                }
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
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Enviar Inscrição';
        }
    }
}

/**
 * Inicializa animações e efeitos
 */
function initializeAnimations() {
    try {
        console.log('Inicializando animações...');
        
        // CORREÇÃO: Animação de scroll suave para links internos com melhor verificação
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            // CORREÇÃO: Remover listener existente antes de adicionar novo
            anchor.removeEventListener('click', handleAnchorClick);
            anchor.addEventListener('click', handleAnchorClick);
        });
        
        // Adicionar classe 'scrolled' ao navbar quando a página é rolada
        let scrollTimeout;
        window.removeEventListener('scroll', handleScroll);
        window.addEventListener('scroll', handleScroll);
        
        console.log('Animações inicializadas com sucesso!');
    } catch (error) {
        console.error('Erro ao inicializar animações:', error);
    }
}

/**
 * CORREÇÃO: Handler para cliques em âncoras
 */
function handleAnchorClick(e) {
    const targetId = this.getAttribute('href');
    
    // CORREÇÃO: Só prevenir comportamento padrão se for um link interno válido
    if (targetId && targetId !== '#' && targetId.startsWith('#')) {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            e.preventDefault();
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
}

/**
 * CORREÇÃO: Handler para scroll com throttling
 */
function handleScroll() {
    if (scrollTimeout) {
        clearTimeout(scrollTimeout);
    }
    
    scrollTimeout = setTimeout(() => {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    }, 10);
}

/**
 * CORREÇÃO: Função para debug - forçar desbloqueio da interface
 */
function forceUnblockInterface() {
    console.log('Forçando desbloqueio da interface...');
    
    // Garantir scroll
    ensureScrollFunctionality();
    
    // Remover qualquer overlay ou backdrop
    const overlays = document.querySelectorAll('.modal-backdrop, .overlay, .loading-overlay');
    overlays.forEach(overlay => overlay.remove());
    
    // Garantir que elementos são clicáveis
    document.body.style.pointerEvents = 'auto';
    
    // Remover classes que possam bloquear
    document.body.classList.remove('modal-open', 'no-scroll', 'overflow-hidden');
    
    console.log('Interface desbloqueada!');
}

/**
 * CORREÇÃO: Função para verificar estado da interface
 */
function checkInterfaceStatus() {
    console.log('=== STATUS DA INTERFACE ===');
    console.log('Body overflow-y:', getComputedStyle(document.body).overflowY);
    console.log('HTML overflow-y:', getComputedStyle(document.documentElement).overflowY);
    console.log('Body classes:', document.body.className);
    console.log('Modais abertos:', document.querySelectorAll('.modal.show').length);
    console.log('Backdrops:', document.querySelectorAll('.modal-backdrop').length);
    console.log('Scroll Y:', window.scrollY);
    console.log('Scroll height:', document.documentElement.scrollHeight);
    console.log('Client height:', document.documentElement.clientHeight);
    console.log('===========================');
}

// CORREÇÃO: Expor funções de debug globalmente
window.forceUnblockInterface = forceUnblockInterface;
window.checkInterfaceStatus = checkInterfaceStatus;
window.ensureScrollFunctionality = ensureScrollFunctionality;

// CORREÇÃO: Auto-verificação periódica (apenas em desenvolvimento)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    setInterval(() => {
        if (document.body.classList.contains('modal-open') && document.querySelectorAll('.modal.show').length === 0) {
            console.warn('Detectado estado inconsistente de modal - corrigindo...');
            ensureScrollFunctionality();
        }
    }, 5000);
}

