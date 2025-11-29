/* ===== COMPONENTE SEPARADOR - FUNCIONALIDADES JAVASCRIPT ===== */
/* Ficheiro: js/divider.js */
/* Padrões: Share2Inspire.pt */

(function() {
    'use strict';

    /**
     * Classe para gerenciar componentes separadores
     */
    class DividerManager {
        constructor() {
            this.dividers = document.querySelectorAll('[class*="divider-"]');
            this.init();
        }

        /**
         * Inicializar o gerenciador
         */
        init() {
            this.observeIntersection();
            this.setupEventListeners();
        }

        /**
         * Observar quando os separadores entram na viewport (Intersection Observer API)
         */
        observeIntersection() {
            const options = {
                threshold: 0.5,
                rootMargin: '0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Adicionar classe de animação quando o separador entra na viewport
                        if (!entry.target.classList.contains('divider-animated')) {
                            entry.target.classList.add('divider-in-view');
                        }
                        observer.unobserve(entry.target);
                    }
                });
            }, options);

            this.dividers.forEach(divider => {
                observer.observe(divider);
            });
        }

        /**
         * Configurar event listeners
         */
        setupEventListeners() {
            // Adicionar efeito hover aos ícones dos separadores
            document.querySelectorAll('.divider-icon').forEach(icon => {
                icon.addEventListener('mouseenter', () => {
                    icon.style.transform = 'scale(1.15) rotate(5deg)';
                });

                icon.addEventListener('mouseleave', () => {
                    icon.style.transform = 'scale(1) rotate(0deg)';
                });
            });
        }

        /**
         * Método para criar um separador dinamicamente
         * @param {string} type - Tipo de separador (simple, with-text, gradient, minimal)
         * @param {object} options - Opções de configuração
         * @returns {HTMLElement} - Elemento do separador criado
         */
        static createDivider(type = 'simple', options = {}) {
            const divider = document.createElement('div');
            const classes = ['divider-' + type];

            // Adicionar classes adicionais
            if (options.theme) classes.push('divider-' + options.theme);
            if (options.animated) classes.push('divider-animated');
            if (options.customClass) classes.push(options.customClass);

            divider.className = classes.join(' ');

            // Configurar conteúdo baseado no tipo
            switch(type) {
                case 'simple':
                    divider.innerHTML = `
                        <div class="divider-line"></div>
                        <div class="divider-icon">
                            <i class="fas ${options.icon || 'fa-star'}"></i>
                        </div>
                        <div class="divider-line"></div>
                    `;
                    break;

                case 'with-text':
                    divider.innerHTML = `
                        <span class="divider-text">${options.text || 'Próxima Secção'}</span>
                    `;
                    break;

                case 'gradient':
                    divider.className = 'divider-gradient';
                    break;

                case 'minimal':
                    divider.className = 'divider-minimal';
                    break;

                case 'spacing':
                    divider.className = 'divider-spacing';
                    if (options.margin) {
                        divider.style.margin = options.margin;
                    }
                    break;

                default:
                    console.warn('Tipo de separador desconhecido:', type);
            }

            // Aplicar estilos customizados
            if (options.styles) {
                Object.assign(divider.style, options.styles);
            }

            return divider;
        }

        /**
         * Inserir um separador em um elemento específico
         * @param {HTMLElement} element - Elemento onde inserir o separador
         * @param {string} position - Posição (before, after, prepend, append)
         * @param {string} type - Tipo de separador
         * @param {object} options - Opções de configuração
         */
        static insertDivider(element, position = 'after', type = 'simple', options = {}) {
            const divider = this.createDivider(type, options);

            switch(position) {
                case 'before':
                    element.parentNode.insertBefore(divider, element);
                    break;
                case 'after':
                    element.parentNode.insertBefore(divider, element.nextSibling);
                    break;
                case 'prepend':
                    element.insertBefore(divider, element.firstChild);
                    break;
                case 'append':
                    element.appendChild(divider);
                    break;
                default:
                    console.warn('Posição desconhecida:', position);
            }

            // Inicializar o novo separador
            const manager = new DividerManager();
            return divider;
        }
    }

    /**
     * Inicializar quando o DOM estiver pronto
     */
    document.addEventListener('DOMContentLoaded', () => {
        new DividerManager();

        // Expor a classe globalmente para uso em scripts externos
        window.DividerManager = DividerManager;
    });

    /**
     * Exemplo de uso em scripts externos:
     * 
     * // Criar um separador simples
     * const divider = DividerManager.createDivider('simple', {
     *     icon: 'fa-check-circle',
     *     theme: 'success',
     *     animated: true
     * });
     * 
     * // Inserir em um elemento
     * const targetElement = document.getElementById('my-section');
     * DividerManager.insertDivider(targetElement, 'after', 'with-text', {
     *     text: 'Análise de Mercado'
     * });
     */

})();

/* ===== ESTILOS DINÂMICOS ADICIONAIS ===== */

// Adicionar estilos para animação de entrada
const style = document.createElement('style');
style.textContent = `
    .divider-in-view .divider-line {
        animation: expandLine 1s ease-out forwards;
    }
    
    .divider-in-view .divider-icon {
        animation: scaleIcon 1s ease-out forwards;
    }
    
    @keyframes expandLine {
        from {
            width: 0;
            opacity: 0;
        }
        to {
            width: 100%;
            opacity: 1;
        }
    }
    
    @keyframes scaleIcon {
        from {
            transform: scale(0);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }
`;

document.head.appendChild(style);

