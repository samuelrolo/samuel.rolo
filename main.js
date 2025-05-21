/**
 * JavaScript consolidado para o website share2inspire.pt
 * Inclui funcionalidades de carrossel, modais, validação de formulários e requisições de serviço
 */

// Esperar pelo carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar carrossel
    initCarousel();
    
    // Inicializar modais
    initModals();
    
    // Inicializar validação de formulários
    initFormValidation();
    
    // Inicializar requisições de serviço
    initServiceRequests();
    
    // Inicializar feedback
    initFeedback();
    
    // Inicializar menu hamburger
    initMobileMenu();
});

/**
 * Inicializa o carrossel na página inicial
 */
function initCarousel() {
    const slides = document.querySelectorAll('.intro-slide');
    const dots = document.querySelectorAll('.dot');
    let currentSlide = 0;
    let slideInterval;
    
    // Função para mostrar um slide específico
    function showSlide(index) {
        // Remover classe active de todos os slides e dots
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Adicionar classe active ao slide e dot atual
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        
        // Atualizar índice do slide atual
        currentSlide = index;
    }
    
    // Função para avançar para o próximo slide
    function nextSlide() {
        let next = currentSlide + 1;
        if (next >= slides.length) {
            next = 0;
        }
        showSlide(next);
    }
    
    // Adicionar event listeners aos dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            resetInterval();
        });
        
        // Acessibilidade: permitir navegação por teclado
        dot.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showSlide(index);
                resetInterval();
            }
        });
    });
    
    // Iniciar intervalo para troca automática de slides
    function startInterval() {
        slideInterval = setInterval(nextSlide, 5000);
    }
    
    // Resetar intervalo quando o usuário interage com o carrossel
    function resetInterval() {
        clearInterval(slideInterval);
        startInterval();
    }
    
    // Iniciar carrossel
    if (slides.length > 0) {
        showSlide(0);
        startInterval();
    }
}

/**
 * Inicializa os modais (feedback e solicitação de serviço)
 */
function initModals() {
    // Elementos dos modais
    const feedbackModal = document.getElementById('feedback-modal');
    const serviceModal = document.getElementById('service-request-modal');
    const feedbackButtonTop = document.getElementById('feedback-button-top');
    const feedbackButtonMobile = document.getElementById('feedback-button-mobile');
    const serviceRequestTriggers = document.querySelectorAll('.service-request-trigger');
    const closeButtons = document.querySelectorAll('.close-modal');
    
    // Função para abrir modal
    function openModal(modal) {
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevenir scroll da página
        }
    }
    
    // Função para fechar modal
    function closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Restaurar scroll da página
        }
    }
    
    // Event listeners para botões de feedback
    if (feedbackButtonTop) {
        feedbackButtonTop.addEventListener('click', () => openModal(feedbackModal));
    }
    
    if (feedbackButtonMobile) {
        feedbackButtonMobile.addEventListener('click', () => openModal(feedbackModal));
    }
    
    // Event listeners para triggers de solicitação de serviço
    serviceRequestTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Preencher o tipo de serviço no formulário
            const serviceType = trigger.getAttribute('data-service');
            const serviceSelect = document.getElementById('service_type');
            
            if (serviceSelect && serviceType) {
                // Encontrar a opção correspondente e selecioná-la
                for (let i = 0; i < serviceSelect.options.length; i++) {
                    if (serviceSelect.options[i].value === serviceType) {
                        serviceSelect.selectedIndex = i;
                        break;
                    }
                }
            }
            
            openModal(serviceModal);
        });
    });
    
    // Event listeners para botões de fechar
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            closeModal(feedbackModal);
            closeModal(serviceModal);
        });
    });
    
    // Fechar modal ao clicar fora dele
    window.addEventListener('click', (e) => {
        if (e.target === feedbackModal) {
            closeModal(feedbackModal);
        }
        if (e.target === serviceModal) {
            closeModal(serviceModal);
        }
    });
    
    // Fechar modal com tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal(feedbackModal);
            closeModal(serviceModal);
        }
    });
}

/**
 * Inicializa a validação de formulários
 */
function initFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            let valid = true;
            
            // Validar campos obrigatórios
            const requiredFields = form.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    valid = false;
                    highlightField(field, true);
                } else {
                    highlightField(field, false);
                }
            });
            
            // Validar email
            const emailFields = form.querySelectorAll('input[type="email"]');
            emailFields.forEach(field => {
                if (field.value && !isValidEmail(field.value)) {
                    valid = false;
                    highlightField(field, true);
                }
            });
            
            // Prevenir envio se formulário inválido
            if (!valid) {
                e.preventDefault();
                alert('Por favor, preencha todos os campos obrigatórios corretamente.');
            }
        });
    });
    
    // Função para destacar campo com erro
    function highlightField(field, isError) {
        if (isError) {
            field.style.borderColor = 'red';
        } else {
            field.style.borderColor = '';
        }
    }
    
    // Função para validar email
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Remover destaque de erro ao digitar
    const inputFields = document.querySelectorAll('input, textarea, select');
    inputFields.forEach(field => {
        field.addEventListener('input', () => {
            field.style.borderColor = '';
        });
    });
}

/**
 * Inicializa as requisições de serviço
 */
function initServiceRequests() {
    const serviceCards = document.querySelectorAll('.servico-card');
    
    serviceCards.forEach(card => {
        card.addEventListener('click', () => {
            const action = card.getAttribute('data-action');
            const service = card.getAttribute('data-service');
            
            if (action === 'redirect') {
                const url = card.getAttribute('data-url');
                if (url) {
                    window.location.href = url;
                }
            } else if (action === 'form') {
                // Abrir modal de solicitação de serviço
                const serviceModal = document.getElementById('service-request-modal');
                const serviceSelect = document.getElementById('service_type');
                
                if (serviceModal && serviceSelect && service) {
                    // Encontrar a opção correspondente e selecioná-la
                    for (let i = 0; i < serviceSelect.options.length; i++) {
                        if (serviceSelect.options[i].value === service) {
                            serviceSelect.selectedIndex = i;
                            break;
                        }
                    }
                    
                    // Abrir modal
                    serviceModal.style.display = 'block';
                    document.body.style.overflow = 'hidden';
                }
            }
        });
    });
}

/**
 * Inicializa a funcionalidade de feedback
 */
function initFeedback() {
    const ratingInputs = document.querySelectorAll('.rating input');
    const stars = document.querySelectorAll('.star');
    
    // Adicionar event listeners para estrelas de avaliação
    if (stars.length > 0) {
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = star.getAttribute('data-value');
                const ratingInput = document.getElementById('rating');
                
                if (ratingInput) {
                    ratingInput.value = rating;
                }
                
                // Atualizar aparência visual das estrelas
                stars.forEach(s => {
                    const starValue = s.getAttribute('data-value');
                    if (starValue <= rating) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });
            });
        });
    } else {
        // Compatibilidade com versão anterior usando inputs
        ratingInputs.forEach(input => {
            input.addEventListener('change', () => {
                // Atualizar aparência visual das estrelas
                const stars = document.querySelectorAll('.rating label');
                const rating = input.value;
                
                stars.forEach((star, index) => {
                    if (index < rating) {
                        star.classList.add('active');
                    } else {
                        star.classList.remove('active');
                    }
                });
            });
        });
    }
}

/**
 * Inicializa o menu hamburger para dispositivos móveis
 */
function initMobileMenu() {
    const navToggle = document.getElementById('nav-toggle');
    const menuItems = document.querySelectorAll('.menu-items a');
    
    if (navToggle) {
        // Garantir que o checkbox está desmarcado ao carregar a página
        navToggle.checked = false;
        
        // Fechar menu ao clicar em um item do menu
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                navToggle.checked = false;
            });
        });
        
        // Adicionar evento de teclado para acessibilidade
        navToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navToggle.checked = !navToggle.checked;
            }
        });
    }
}

/**
 * Função para scroll suave ao clicar em links de âncora
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        
        // Ignorar links vazios ou com href="#"
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            e.preventDefault();
            
            // Fechar menu mobile se estiver aberto
            const checkbox = document.getElementById('nav-toggle');
            if (checkbox && checkbox.checked) {
                checkbox.checked = false;
            }
            
            // Scroll suave
            window.scrollTo({
                top: targetElement.offsetTop - 80, // Ajuste para o header fixo
                behavior: 'smooth'
            });
        }
    });
});

/**
 * Detectar scroll da página para efeitos visuais
 */
window.addEventListener('scroll', function() {
    const scrollPosition = window.scrollY;
    
    // Adicionar classe à navegação quando a página é scrollada
    const nav = document.querySelector('nav');
    if (nav) {
        if (scrollPosition > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }
    
    // Animação de elementos ao entrar na viewport
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (elementPosition < windowHeight - 100) {
            element.classList.add('animated');
        }
    });
});
