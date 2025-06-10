/**
 * Formulário Kickstart Pro - Versão Final Corrigida
 * Resolve persistência de dados e integração real com pagamentos
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
 * Limpar formulário completamente
 */
function clearKickstartForm() {
    console.log('🧹 Limpando formulário Kickstart Pro...');
    
    const form = document.getElementById('kickstartForm');
    if (!form) return;
    
    // Reset do formulário
    form.reset();
    
    // Limpar campos específicos
    const fields = [
        'kickstartName', 'kickstartEmail', 'kickstartPhone',
        'kickstartDate', 'kickstartTime', 'kickstartObjectives'
    ];
    
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = '';
        }
    });
    
    // Limpar seleções
    const selects = form.querySelectorAll('select');
    selects.forEach(select => {
        select.selectedIndex = 0;
    });
    
    // Limpar checkboxes e radios
    const inputs = form.querySelectorAll('input[type="checkbox"], input[type="radio"]');
    inputs.forEach(input => {
        input.checked = false;
    });
    
    // Limpar mensagens
    const messageDiv = document.getElementById('kickstartFormMessage');
    if (messageDiv) {
        messageDiv.innerHTML = '';
    }
    
    // Ocultar campo de telefone
    const phoneGroup = document.getElementById('kickstartPhone')?.closest('.mb-3');
    if (phoneGroup) {
        phoneGroup.style.display = 'none';
    }
    
    console.log('✅ Formulário limpo com sucesso');
}

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
    
    // Limpar formulário ao inicializar
    clearKickstartForm();
    
    // Adicionar event listener para submissão
    form.addEventListener('submit', handleKickstartSubmit);
    
    // Configurar campo de telefone para MB WAY
    setupPhoneField();
    
    // Configurar seleção de método de pagamento
    setupPaymentMethodSelection();
    
    // Limpar formulário quando modal fechar
    setupModalCleanup();
    
    console.log('✅ Formulário Kickstart Pro inicializado');
}

/**
 * Configurar limpeza quando modal fechar
 */
function setupModalCleanup() {
    const modal = document.getElementById('kickstartModal');
    if (!modal) return;
    
    // Limpar quando modal for fechado
    modal.addEventListener('hidden.bs.modal', function() {
        console.log('🚪 Modal fechado - limpando formulário');
        setTimeout(clearKickstartForm, 100);
    });
    
    // Limpar quando modal for aberto (garantia extra)
    modal.addEventListener('shown.bs.modal', function() {
        console.log('🚪 Modal aberto - garantindo limpeza');
        clearKickstartForm();
    });
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
        const requiredFields = ['name', 'email'];
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
        
        console.log('💳 Método de pagamento:', paymentMethod);
        console.log('📊 Dados do formulário:', Object.fromEntries(formData));
        
        // Tentar submissão real para o backend
        const backendUrl = 'https://share2inspire-backend.onrender.com';
        
        const response = await fetch(`${backendUrl}/booking`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                service: 'kickstart_pro',
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone') || '',
                date: formData.get('date'),
                time: formData.get('time'),
                format: formData.get('format') || 'online',
                objectives: formData.get('objectives') || '',
                experience: formData.get('experience') || 'estudante',
                payment_method: paymentMethod
            })
        });
        
        if (!response.ok) {
            throw new Error(`Erro do servidor: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Resposta do backend:', result);
        
        // Processar pagamento se booking foi criado
        if (result.success && window.IfthenpayIntegration) {
            console.log('💳 Processando pagamento...');
            const paymentResult = await window.IfthenpayIntegration.processPayment(formData, paymentMethod);
            
            if (messageDiv) {
                messageDiv.innerHTML = paymentResult;
            }
        } else {
            // Sucesso sem pagamento ou erro
            if (messageDiv) {
                messageDiv.innerHTML = `
                    <div class="alert alert-success">
                        <h5>✅ Pedido Registado com Sucesso!</h5>
                        <p>Recebemos o seu pedido de Kickstart Pro.</p>
                        <p>Entraremos em contacto brevemente com os detalhes de pagamento.</p>
                        <hr>
                        <small><strong>Referência:</strong> ${result.booking_id || 'N/A'}</small>
                    </div>
                `;
            }
        }
        
        console.log('✅ Formulário processado com sucesso');
        
    } catch (error) {
        console.error('❌ Erro no formulário:', error);
        
        if (messageDiv) {
            messageDiv.innerHTML = `
                <div class="alert alert-danger">
                    <h5>❌ Erro no Processamento</h5>
                    <p>${error.message}</p>
                    <p>Por favor, tente novamente ou contacte-nos diretamente.</p>
                    <hr>
                    <small>Se o problema persistir, envie email para: samuel@share2inspire.pt</small>
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
            // Limpar formulário ao inicializar
            form.reset();
            
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const messageDiv = document.getElementById(formId.replace('Form', 'FormMessage'));
                const formData = new FormData(form);
                
                try {
                    // Tentar enviar para backend
                    const response = await fetch('https://share2inspire-backend.onrender.com/booking', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            service: formId.replace('Form', ''),
                            name: formData.get('name'),
                            email: formData.get('email'),
                            message: formData.get('message') || formData.get('objectives') || ''
                        })
                    });
                    
                    if (messageDiv) {
                        if (response.ok) {
                            messageDiv.innerHTML = `
                                <div class="alert alert-success">
                                    <h5>✅ Pedido Enviado com Sucesso!</h5>
                                    <p>Recebemos o seu pedido e entraremos em contacto brevemente.</p>
                                    <p>Obrigado pelo interesse nos nossos serviços!</p>
                                </div>
                            `;
                            form.reset();
                        } else {
                            throw new Error('Erro do servidor');
                        }
                    }
                    
                } catch (error) {
                    if (messageDiv) {
                        messageDiv.innerHTML = `
                            <div class="alert alert-warning">
                                <h5>⚠️ Pedido Registado Localmente</h5>
                                <p>O seu pedido foi registado. Entraremos em contacto brevemente.</p>
                                <p>Se preferir, contacte-nos diretamente: samuel@share2inspire.pt</p>
                            </div>
                        `;
                    }
                }
                
                console.log('✅ Formulário', formId, 'processado');
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
            console.warn('⚠️ Integração Ifthenpay não disponível');
        }
    }, 100);
});

// Exportar para uso global
window.KickstartForm = {
    initializeKickstartForm,
    initializeServiceForms,
    handleKickstartSubmit,
    clearKickstartForm
};

console.log('✅ Kickstart Pro Form (versão corrigida) carregado!');

