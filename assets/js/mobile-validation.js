// Script para validação visual e funcional em mobile

document.addEventListener('DOMContentLoaded', function() {
    // Detectar dispositivo mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Ajustes específicos para mobile
    if (isMobile) {
        console.log('Dispositivo mobile detectado - aplicando ajustes específicos');
        
        // Ajustar tamanho dos inputs para melhor experiência em toque
        const allInputs = document.querySelectorAll('input, textarea, select, button');
        allInputs.forEach(input => {
            input.style.minHeight = '44px'; // Tamanho mínimo recomendado para alvos de toque
        });
        
        // Ajustar espaçamento para formulários em mobile
        const formGroups = document.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.style.marginBottom = '16px';
        });
        
        // Garantir que modais são responsivos
        const modals = document.querySelectorAll('.service-form-modal, .feedback-modal');
        modals.forEach(modal => {
            modal.style.padding = '10px';
        });
        
        // Ajustar tamanho dos ícones sociais para toque
        const socialIcons = document.querySelectorAll('.social-icons a');
        socialIcons.forEach(icon => {
            icon.style.width = '44px';
            icon.style.height = '44px';
        });
    }
    
    // Função para testar integração Brevo (simulação)
    window.testBrevoIntegration = function() {
        console.log('Testando integração Brevo...');
        
        // Dados de teste
        const testData = {
            sender: {
                name: 'Teste Share2Inspire',
                email: 'test@share2inspire.pt'
            },
            to: [
                {
                    email: 'srshare2inspire@gmail.com',
                    name: 'Share2Inspire'
                }
            ],
            subject: 'Teste de Integração Brevo',
            htmlContent: '<h1>Teste de Integração</h1><p>Este é um email de teste para validar a integração com a API Brevo.</p>'
        };
        
        // Simular envio (em produção, usar a API real)
        console.log('Dados de envio:', testData);
        
        // Retornar resultado simulado
        return {
            success: true,
            messageId: 'test-' + Date.now(),
            message: 'Email de teste simulado com sucesso'
        };
    };
    
    // Adicionar botão de teste em ambiente de desenvolvimento
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const testButton = document.createElement('button');
        testButton.textContent = 'Testar Brevo API';
        testButton.style.position = 'fixed';
        testButton.style.bottom = '80px';
        testButton.style.right = '20px';
        testButton.style.zIndex = '9999';
        testButton.style.padding = '10px';
        testButton.style.backgroundColor = '#B08D57';
        testButton.style.color = '#fff';
        testButton.style.border = 'none';
        testButton.style.borderRadius = '4px';
        testButton.style.cursor = 'pointer';
        
        testButton.addEventListener('click', function() {
            const result = window.testBrevoIntegration();
            alert('Resultado do teste: ' + (result.success ? 'Sucesso' : 'Falha') + '\n' + result.message);
        });
        
        document.body.appendChild(testButton);
    }
    
    // Validar formulários em tempo real
    const validateForms = function() {
        const allForms = document.querySelectorAll('form');
        
        allForms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea, select');
            
            inputs.forEach(input => {
                input.addEventListener('blur', function() {
                    if (this.hasAttribute('required') && !this.value) {
                        this.style.borderColor = '#c62828';
                    } else {
                        this.style.borderColor = '';
                    }
                });
                
                input.addEventListener('input', function() {
                    if (this.hasAttribute('required') && this.value) {
                        this.style.borderColor = '';
                    }
                });
            });
        });
    };
    
    // Iniciar validação de formulários
    validateForms();
    
    // Verificar se os ícones sociais estão corretamente exibidos
    const checkSocialIcons = function() {
        const socialIconsContainers = document.querySelectorAll('.social-icons');
        
        if (socialIconsContainers.length > 1) {
            console.warn('Múltiplos containers de ícones sociais detectados. Isso pode causar duplicação visual.');
        }
        
        socialIconsContainers.forEach((container, index) => {
            console.log(`Container de ícones sociais #${index+1}:`, container);
            console.log(`Número de ícones: ${container.children.length}`);
        });
    };
    
    // Verificar ícones sociais
    checkSocialIcons();
});
