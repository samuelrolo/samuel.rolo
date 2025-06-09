/**
 * Formulário Kickstart Pro - VERSÃO CORRIGIDA
 * Integração com APIs oficiais da Ifthenpay
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Kickstart Pro Form - Versão Corrigida Carregada');
    setupKickstartForm();
    setupPaymentMethodHandlers();
    setupPriceUpdater();
});

/**
 * Configuração principal do formulário
 */
function setupKickstartForm() {
    const kickstartForm = document.getElementById('kickstartForm');
    if (!kickstartForm) {
        console.warn('⚠️ Formulário Kickstart não encontrado');
        return;
    }
    
    console.log('✅ Formulário Kickstart encontrado, configurando...');
    
    kickstartForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('📝 Formulário submetido');
        
        const submitButton = this.querySelector('button[type="submit"]');
        const formMessage = getOrCreateMessageContainer('kickstartFormMessage', this);
        
        // Limpar mensagens anteriores
        formMessage.innerHTML = '';
        
        // Validar formulário
        if (!validateKickstartForm(this)) {
            showFormMessage(formMessage, 'error', 'Por favor, preencha todos os campos obrigatórios corretamente.');
            return;
        }
        
        // Preparar dados
        const formData = new FormData(this);
        const data = prepareKickstartData(formData);
        
        console.log('📊 Dados preparados:', data);
        
        // Mostrar loading
        setButtonLoading(submitButton, true);
        showFormMessage(formMessage, 'info', 'A processar o seu pedido...');
        
        try {
            // CORRIGIDO: Usar nova integração Ifthenpay
            const paymentResult = await window.IfthenPayIntegration.processPayment(
                data, 
                data.paymentMethod, 
                parseFloat(data.amount)
            );
            
            console.log('💳 Resultado do pagamento:', paymentResult);
            
            if (paymentResult.success) {
                // Mostrar sucesso
                displayKickstartSuccess(paymentResult, data.paymentMethod, formMessage);
                this.reset();
                updatePrice();
                
                // Scroll para mensagem
                setTimeout(() => {
                    formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                
            } else {
                throw new Error(paymentResult.error || 'Erro no processamento do pagamento');
            }
            
        } catch (error) {
            console.error('❌ Erro no processo:', error);
            displayKickstartError(error, formMessage);
        } finally {
            setButtonLoading(submitButton, false);
        }
    });
}

/**
 * Configuração dos handlers de método de pagamento
 */
function setupPaymentMethodHandlers() {
    const paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]');
    const mbwayFields = document.getElementById('mbwayFields');
    
    paymentMethodRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            console.log('💳 Método de pagamento alterado:', this.value);
            
            // Mostrar/ocultar campos MB WAY
            if (mbwayFields) {
                if (this.value === 'mbway') {
                    mbwayFields.style.display = 'block';
                    mbwayFields.querySelector('input[name="phone"]').required = true;
                } else {
                    mbwayFields.style.display = 'none';
                    mbwayFields.querySelector('input[name="phone"]').required = false;
                }
            }
        });
    });
}

/**
 * Configuração do atualizador de preços
 */
function setupPriceUpdater() {
    const durationSelect = document.getElementById('kickstartDuration');
    if (durationSelect) {
        durationSelect.addEventListener('change', updatePrice);
        updatePrice(); // Inicializar
    }
}

/**
 * Atualizar preço baseado na duração
 */
function updatePrice() {
    const durationSelect = document.getElementById('kickstartDuration');
    const priceElement = document.getElementById('kickstartPrice');
    
    if (!durationSelect || !priceElement) return;
    
    const duration = durationSelect.value;
    let price = '30€';
    
    if (duration === '45min') {
        price = '45€';
    }
    
    priceElement.textContent = price;
    console.log(`💰 Preço atualizado para: ${price}`);
}

/**
 * Validar formulário Kickstart
 */
function validateKickstartForm(form) {
    const requiredFields = ['name', 'email', 'experience', 'duration', 'paymentMethod'];
    let isValid = true;
    
    // Validar campos obrigatórios
    for (const fieldName of requiredFields) {
        const field = form.querySelector(`[name="${fieldName}"]`);
        if (!field || !field.value.trim()) {
            console.error(`❌ Campo obrigatório vazio: ${fieldName}`);
            isValid = false;
        }
    }
    
    // Validar email
    const emailField = form.querySelector('[name="email"]');
    if (emailField && emailField.value && !isValidEmail(emailField.value)) {
        console.error('❌ Email inválido');
        isValid = false;
    }
    
    // Validar telefone se MB WAY selecionado
    const paymentMethod = form.querySelector('[name="paymentMethod"]:checked');
    if (paymentMethod && paymentMethod.value === 'mbway') {
        const phoneField = form.querySelector('[name="phone"]');
        if (!phoneField || !phoneField.value.trim()) {
            console.error('❌ Telefone obrigatório para MB WAY');
            isValid = false;
        }
    }
    
    // Validar política de privacidade
    const privacyCheckbox = form.querySelector('[name="privacy"]');
    if (!privacyCheckbox || !privacyCheckbox.checked) {
        console.error('❌ Política de privacidade não aceite');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Preparar dados do formulário
 */
function prepareKickstartData(formData) {
    const duration = formData.get('duration');
    const amount = duration === '45min' ? 45 : 30;
    
    return {
        service: 'Kickstart Pro',
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone') || '',
        experience: formData.get('experience'),
        objectives: formData.get('objectives') || '',
        duration: duration,
        paymentMethod: formData.get('paymentMethod'),
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    };
}

/**
 * Exibir sucesso do pagamento
 */
function displayKickstartSuccess(paymentResult, paymentMethod, container) {
    // CORRIGIDO: Usar nova função de display
    window.IfthenPayIntegration.displayPaymentInfo(paymentResult, paymentMethod, container);
    
    // Adicionar informações específicas do Kickstart
    const additionalInfo = document.createElement('div');
    additionalInfo.className = 'alert alert-info mt-3';
    additionalInfo.innerHTML = `
        <h5><i class="fas fa-calendar-check"></i> Próximos Passos</h5>
        <p>Após a confirmação do pagamento, entraremos em contacto consigo para agendar a sua sessão Kickstart Pro.</p>
        <p><strong>Duração:</strong> ${paymentResult.duration || '30 minutos'}</p>
        <p><strong>Contacto:</strong> srshare2inspire@gmail.com | +351 961 925 050</p>
    `;
    
    container.appendChild(additionalInfo);
}

/**
 * Exibir erro
 */
function displayKickstartError(error, container) {
    window.IfthenPayIntegration.displayPaymentError(error, container);
}

/**
 * Funções auxiliares
 */
function getOrCreateMessageContainer(id, parent) {
    let container = document.getElementById(id);
    if (!container) {
        container = document.createElement('div');
        container.id = id;
        container.className = 'form-message mt-3';
        parent.appendChild(container);
    }
    return container;
}

function showFormMessage(container, type, message) {
    const alertClass = type === 'error' ? 'alert-danger' : 
                     type === 'success' ? 'alert-success' : 'alert-info';
    
    container.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
}

function setButtonLoading(button, loading) {
    if (!button) return;
    
    if (loading) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A processar...';
    } else {
        button.disabled = false;
        button.innerHTML = 'Submeter e Prosseguir para o Pagamento';
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

console.log('✅ Kickstart Pro Form - Versão Corrigida Carregada');
