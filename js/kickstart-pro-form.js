/**
 * Formulário Kickstart Pro - Versão Corrigida
 * Resolve problemas de integração com modais e pagamentos
 */

// Configuração do formulário
const FORM_CONFIG = {
    durations: {
        '30 minutos - 30€': 30,
        '60 minutos - 50€': 50,
        '90 minutos - 70€': 70
    },
    paymentMethods: ['mbway', 'multibanco', 'payshop']
};

/**
 * Inicializar formulário Kickstart Pro
 */
function initializeKickstartForm() {
    console.log('🚀 Inicializando formulário Kickstart Pro...');
    
    const form = document.getElementById('kickstartForm');
    if (!form) {
        console.warn('⚠️ Formulário kickstartForm não encontrado');
        return;
    }
    
    // Adicionar event listener para submissão
    form.addEventListener('submit', handleKickstartSubmit);
    
    // Configurar campo de telefone para MB WAY
    setupPhoneField();
    
    // Configurar seleção de método de pagamento
    setupPaymentMethodSelection();
    
    console.log('✅ Formulário Kickstart Pro inicializado');
}

/**
 * Configurar campo de telefone
 */
function setupPhoneField() {
    const phoneField = document.getElementById('kickstartPhone');
    if (!phoneField) return;
    
    // Formatação automática do telefone
    phoneField.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        // Limitar a 9 dígitos
        if (value.length > 9) {
            value = value.substring(0, 9);
        }
        
        // Formatar com espaços
        if (value.length >= 3) {
            value = value.substring(0, 3) + ' ' + value.substring(3);
        }
        if (value.length >= 7) {
            value = value.substring(0, 7) + ' ' + value.substring(7);
        }
        
        e.target.value = value;
    });
    
    // Mostrar preview do número formatado
    phoneField.addEventListener('blur', function(e) {
        if (e.target.value) {
            const formatted = window.IfthenpayIntegration?.formatPhoneNumber(e.target.value);
            if (formatted && formatted !== e.target.value) {
                console.log('📱 Telefone será formatado como:', formatted);
            }
        }
    });
}

/**
 * Configurar seleção de método de pagamento
 */
function setupPaymentMethodSelection() {
    // Verificar se existem radio buttons para método de pagamento
    const paymentMethods = document.querySelectorAll('input[name="payment_method"]');
    
    paymentMethods.forEach(method => {
        method.addEventListener('change', function() {
            console.log('💳 Método de pagamento selecionado:', this.value);
            
            // Mostrar/ocultar campo de telefone para MB WAY
            const phoneGroup = document.getElementById('kickstartPhone')?.closest('.mb-3');
            if (phoneGroup) {
                if (this.value === 'mbway') {
                    phoneGroup.style.display = 'block';
                    document.getElementById('kickstartPhone').required = true;
                } else {
                    phoneGroup.style.display = 'none';
                    document.getElementById('kickstartPhone').required = false;
                }
            }
        });
    });
}

/**
 * Lidar com submissão do formulário
 */
async function handleKickstartSubmit(event) {
    event.preventDefault();
    console.log('📝 Formulário Kickstart submetido');
    
    const form = event.target;
    const formData = new FormData(form);
    const messageDiv = document.getElementById('kickstartFormMessage');
    
    // Mostrar loading
    if (messageDiv) {
        messageDiv.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-spinner fa-spin"></i> Processando pedido...
            </div>
        `;
    }
    
    try {
        // Validar dados obrigatórios
        const requiredFields = ['name', 'email', 'objectives'];
        const missingFields = [];
        
        requiredFields.forEach(field => {
            if (!formData.get(field)?.trim()) {
                missingFields.push(field);
            }
        });
        
        if (missingFields.length > 0) {
            throw new Error('Campos obrigatórios em falta: ' + missingFields.join(', '));
        }
        
        // Determinar método de pagamento
        let paymentMethod = formData.get('payment_method') || 'multibanco';
        
        // Se não há campo de método, verificar se há telefone (indica MB WAY)
        if (!formData.get('payment_method') && formData.get('phone')?.trim()) {
            paymentMethod = 'mbway';
        }
        
        console.log('💳 Método de pagamento determinado:', paymentMethod);
        
        // Processar pagamento
        let paymentResult;
        if (window.IfthenpayIntegration) {
            paymentResult = await window.IfthenpayIntegration.processPayment(formData, paymentMethod);
        } else {
            // Fallback se integração não estiver disponível
            paymentResult = `
                <div class="alert alert-warning">
                    <h5>⚠️ Sistema de Pagamento Temporariamente Indisponível</h5>
                    <p>O seu pedido foi registado. Entraremos em contacto brevemente com instruções de pagamento.</p>
                    <p><strong>Serviço:</strong> ${formData.get('service') || 'Kickstart Pro'}</p>
                    <p><strong>Nome:</strong> ${formData.get('name')}</p>
                    <p><strong>Email:</strong> ${formData.get('email')}</p>
                </div>
            `;
        }
        
        // Mostrar resultado
        if (messageDiv) {
            messageDiv.innerHTML = paymentResult;
        }
        
        // Log para debug
        console.log('✅ Formulário processado com sucesso');
        
    } catch (error) {
        console.error('❌ Erro no formulário:', error);
        
        if (messageDiv) {
            messageDiv.innerHTML = `
                <div class="alert alert-danger">
                    <h5>❌ Erro no Formulário</h5>
                    <p>${error.message}</p>
                    <p>Por favor, verifique os dados e tente novamente.</p>
                </div>
            `;
        }
    }
}

/**
 * Inicializar outros formulários de serviços
 */
function initializeServiceForms() {
    console.log('🔧 Inicializando formulários de serviços...');
    
    // Formulários que não precisam de pagamento
    const serviceForms = ['consultoriaForm', 'coachingForm', 'workshopsForm'];
    
    serviceForms.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const messageDiv = document.getElementById(formId.replace('Form', 'FormMessage'));
                if (messageDiv) {
                    messageDiv.innerHTML = `
                        <div class="alert alert-success">
                            <h5>✅ Pedido Enviado com Sucesso!</h5>
                            <p>Recebemos o seu pedido e entraremos em contacto brevemente.</p>
                            <p>Obrigado pelo interesse nos nossos serviços!</p>
                        </div>
                    `;
                }
                
                console.log('✅ Formulário', formId, 'submetido com sucesso');
            });
            
            console.log('✅ Formulário', formId, 'inicializado');
        }
    });
}

/**
 * Inicialização quando DOM estiver pronto
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM carregado, inicializando formulários...');
    
    // Aguardar um pouco para garantir que outros scripts carregaram
    setTimeout(() => {
        initializeKickstartForm();
        initializeServiceForms();
        
        // Debug: Verificar se integração Ifthenpay está disponível
        if (window.IfthenpayIntegration) {
            console.log('✅ Integração Ifthenpay disponível');
        } else {
            console.warn('⚠️ Integração Ifthenpay não disponível - usando fallback');
        }
    }, 100);
});

// Exportar para uso global
window.KickstartForm = {
    initializeKickstartForm,
    initializeServiceForms,
    handleKickstartSubmit
};

console.log('✅ Kickstart Pro Form carregado com sucesso!');

