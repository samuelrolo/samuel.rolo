/**
 * Formulário Kickstart Pro - VERSÃO FINAL CORRIGIDA
 * Integração com versão final da API Ifthenpay
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Kickstart Pro Form - Versão Final Carregada');
    setupKickstartForm();
    setupPaymentMethodHandlers();
    setupPriceUpdater();
    setupPhoneFormatting();
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
            // Verificar se IfthenPayIntegration está disponível
            if (!window.IfthenPayIntegration) {
                throw new Error('Integração Ifthenpay não carregada. Verifique se o script está incluído.');
            }
            
            // Usar nova integração Ifthenpay
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
                    const phoneField = mbwayFields.querySelector('input[name="phone"]');
                    if (phoneField) {
                        phoneField.required = true;
                        phoneField.focus();
                    }
                } else {
                    mbwayFields.style.display = 'none';
                    const phoneField = mbwayFields.querySelector('input[name="phone"]');
                    if (phoneField) {
                        phoneField.required = false;
                    }
                }
            }
        });
    });
}

/**
 * NOVA FUNÇÃO: Configurar formatação automática do telefone
 */
function setupPhoneFormatting() {
    const phoneField = document.querySelector('input[name="phone"]');
    if (!phoneField) return;
    
    // Placeholder melhorado
    phoneField.placeholder = '+351 9xxxxxxxx';
    
    // Formatação automática enquanto digita
    phoneField.addEventListener('input', function() {
        let value = this.value.replace(/\D/g, ''); // Remover não-numéricos
        
        // Se começar com 9 e não tiver 351, adicionar
        if (value.startsWith('9') && !value.startsWith('351')) {
            value = '351' + value;
        }
        
        // Formatar para exibição: +351 961 925 050
        if (value.startsWith('351') && value.length >= 3) {
            const countryCode = value.substring(0, 3);
            const number = value.substring(3);
            
            if (number.length <= 9) {
                let formatted = `+${countryCode}`;
                if (number.length > 0) {
                    formatted += ` ${number.substring(0, 3)}`;
                }
                if (number.length > 3) {
                    formatted += ` ${number.substring(3, 6)}`;
                }
                if (number.length > 6) {
                    formatted += ` ${number.substring(6, 9)}`;
                }
                this.value = formatted;
            }
        }
    });
    
    // Validação em tempo real
    phoneField.addEventListener('blur', function() {
        const cleanValue = this.value.replace(/\D/g, '');
        if (cleanValue.length > 0 && (cleanValue.length < 12 || !cleanValue.startsWith('351'))) {
            this.setCustomValidity('Por favor, insira um número português válido (ex: +351 961 925 050)');
        } else {
            this.setCustomValidity('');
        }
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
            
            // Destacar campo com erro
            if (field) {
                field.style.borderColor = '#dc3545';
                setTimeout(() => {
                    field.style.borderColor = '';
                }, 3000);
            }
        }
    }
    
    // Validar email
    const emailField = form.querySelector('[name="email"]');
    if (emailField && emailField.value && !isValidEmail(emailField.value)) {
        console.error('❌ Email inválido');
        emailField.style.borderColor = '#dc3545';
        setTimeout(() => {
            emailField.style.borderColor = '';
        }, 3000);
        isValid = false;
    }
    
    // Validar telefone se MB WAY selecionado
    const paymentMethod = form.querySelector('[name="paymentMethod"]:checked');
    if (paymentMethod && paymentMethod.value === 'mbway') {
        const phoneField = form.querySelector('[name="phone"]');
        if (!phoneField || !phoneField.value.trim()) {
            console.error('❌ Telefone obrigatório para MB WAY');
            if (phoneField) {
                phoneField.style.borderColor = '#dc3545';
                setTimeout(() => {
                    phoneField.style.borderColor = '';
                }, 3000);
            }
            isValid = false;
        } else {
            // Validar formato do telefone
            const cleanPhone = phoneField.value.replace(/\D/g, '');
            if (cleanPhone.length < 12 || !cleanPhone.startsWith('351')) {
                console.error('❌ Formato de telefone inválido para MB WAY');
                phoneField.style.borderColor = '#dc3545';
                setTimeout(() => {
                    phoneField.style.borderColor = '';
                }, 3000);
                isValid = false;
            }
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
        duration: duration,
        paymentMethod: formData.get('paymentMethod'),
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        time: '10:00'
    };
}

/**
 * Exibir sucesso do pagamento
 */
function displayKickstartSuccess(paymentResult, paymentMethod, container) {
    // Usar a função da integração Ifthenpay
    if (window.IfthenPayIntegration && window.IfthenPayIntegration.displayPaymentInfo) {
        window.IfthenPayIntegration.displayPaymentInfo(paymentResult, paymentMethod, container);
    } else {
        // Fallback básico
        container.innerHTML = `
            <div class="alert alert-success">
                <h4>✅ Pagamento Processado</h4>
                <p>Método: ${paymentMethod}</p>
                <p>Valor: ${paymentResult.amount}€</p>
            </div>
        `;
    }
}

/**
 * Exibir erro do pagamento
 */
function displayKickstartError(error, container) {
    // Usar a função da integração Ifthenpay
    if (window.IfthenPayIntegration && window.IfthenPayIntegration.displayPaymentError) {
        window.IfthenPayIntegration.displayPaymentError(error, container);
    } else {
        // Fallback básico
        container.innerHTML = `
            <div class="alert alert-danger">
                <h4>❌ Erro no Pagamento</h4>
                <p>${error.message}</p>
            </div>
        `;
    }
}

/**
 * Funções auxiliares
 */
function getOrCreateMessageContainer(id, parent) {
    let container = document.getElementById(id);
    if (!container) {
        container = document.createElement('div');
        container.id = id;
        container.className = 'form-message-container';
        parent.appendChild(container);
    }
    return container;
}

function showFormMessage(container, type, message) {
    const alertClass = type === 'error' ? 'alert-danger' : 
                     type === 'success' ? 'alert-success' : 'alert-info';
    
    container.innerHTML = `
        <div class="alert ${alertClass}">
            ${message}
        </div>
    `;
}

function setButtonLoading(button, loading) {
    if (loading) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A processar...';
    } else {
        button.disabled = false;
        button.innerHTML = 'SUBMETER E PROSSEGUIR PARA O PAGAMENTO';
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

console.log('✅ Kickstart Pro Form - Versão Final Carregada com sucesso');
console.log('🔧 Funcionalidades: Validação melhorada, formatação telefone, integração Ifthenpay');

