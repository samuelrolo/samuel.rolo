/**
 * Formulário de Coaching - Share2Inspire 
 * VERSÃO TOTALMENTE CORRIGIDA - Dezembro 2024
 * Integração com backend corrigido e validação robusta
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Coaching Form - Versão Corrigida Carregada');
    setupCoachingForm();
    setupCoachingPaymentHandlers();
});

/**
 * Configuração principal do formulário de coaching
 */
function setupCoachingForm() {
    const coachingForm = document.getElementById('coachingForm');
    if (!coachingForm) {
        console.warn('⚠️ Formulário Coaching não encontrado');
        return;
    }
    
    console.log('✅ Formulário Coaching encontrado, configurando...');
    
    coachingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('📝 Formulário Coaching submetido');
        
        const submitButton = this.querySelector('button[type="submit"]');
        const formMessage = getOrCreateMessageContainer('coachingFormMessage', this);
        
        // Limpar mensagens anteriores
        formMessage.innerHTML = '';
        
        // Validar formulário
        if (!validateCoachingForm(this)) {
            showFormMessage(formMessage, 'error', 'Por favor, preencha todos os campos obrigatórios corretamente.');
            return;
        }
        
        // Preparar dados
        const formData = new FormData(this);
        const data = prepareCoachingData(formData);
        
        console.log('📊 Dados preparados:', data);
        
        // Mostrar loading
        setButtonLoading(submitButton, true, 'A processar...');
        showFormMessage(formMessage, 'info', 'A processar o seu agendamento...');
        
        try {
            // Processar pagamento se necessário
            const paymentResult = await processCoachingPayment(data);
            console.log('💳 Resultado do pagamento:', paymentResult);
            
            if (paymentResult.success) {
                // Tentar enviar email de confirmação
                try {
                    await sendCoachingConfirmationEmail(data);
                    console.log('📧 Email enviado com sucesso');
                } catch (emailError) {
                    console.warn('⚠️ Email falhou, mas agendamento OK:', emailError);
                }
                
                // Mostrar sucesso
                displayCoachingSuccess(paymentResult, data.paymentMethod, formMessage);
                this.reset();
                
                // Scroll para mensagem
                setTimeout(() => {
                    formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                
            } else {
                throw new Error(paymentResult.error || 'Erro no processamento do agendamento');
            }
            
        } catch (error) {
            console.error('❌ Erro no processo:', error);
            displayCoachingError(error, formMessage);
        } finally {
            setButtonLoading(submitButton, false, 'AGENDAR E PAGAR');
        }
    });
}

/**
 * Configuração dos handlers de pagamento para coaching
 */
function setupCoachingPaymentHandlers() {
    const paymentMethodRadios = document.querySelectorAll('#coachingModal input[name="paymentMethod"]');
    
    paymentMethodRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            console.log('💳 Método de pagamento coaching alterado:', this.value);
            updateCoachingPaymentMethodUI(this.value);
        });
    });
}

/**
 * Validação do formulário de coaching
 */
function validateCoachingForm(form) {
    console.log('🔍 Validando formulário de coaching...');
    
    const validations = [
        { name: 'name', message: 'Nome é obrigatório' },
        { name: 'email', message: 'Email é obrigatório', validator: validateEmail },
        { name: 'phone', message: 'Telefone é obrigatório', validator: validatePhone },
        { name: 'date', message: 'Data é obrigatória', validator: validateDate },
        { name: 'time', message: 'Hora é obrigatória' },
        { name: 'goals', message: 'Objetivos são obrigatórios' }
    ];
    
    for (const validation of validations) {
        const field = form.querySelector(`[name="${validation.name}"]`);
        
        if (!field || !field.value.trim()) {
            console.warn(`❌ Campo ${validation.name} vazio`);
            if (field) field.focus();
            return false;
        }
        
        if (validation.validator && !validation.validator(field.value)) {
            console.warn(`❌ Campo ${validation.name} inválido`);
            field.focus();
            return false;
        }
    }
    
    // Validar termos
    const termsCheckbox = form.querySelector('#coachingTerms');
    if (termsCheckbox && !termsCheckbox.checked) {
        console.warn('❌ Termos não aceites');
        termsCheckbox.focus();
        return false;
    }
    
    console.log('✅ Formulário de coaching válido');
    return true;
}

/**
 * Preparação de dados para coaching
 */
function prepareCoachingData(formData) {
    const sessionType = formData.get('sessionType') || 'individual';
    const duration = formData.get('duration') || '60min';
    
    // Calcular preço baseado no tipo e duração
    let amount = '60.00'; // Preço padrão
    if (sessionType === 'individual') {
        amount = duration === '90min' ? '90.00' : '60.00';
    } else if (sessionType === 'group') {
        amount = duration === '90min' ? '45.00' : '30.00';
    }
    
    const data = {
        // Dados do cliente
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        
        // Dados da sessão
        service: 'Coaching Executivo',
        sessionType: sessionType,
        date: formData.get('date'),
        time: formData.get('time'),
        duration: duration,
        format: formData.get('format') || 'Online',
        goals: formData.get('goals'),
        experience: formData.get('experience') || '',
        challenges: formData.get('challenges') || '',
        
        // Dados do pagamento
        paymentMethod: formData.get('paymentMethod') || 'mb',
        amount: amount,
        orderId: `COACHING-${Date.now()}`,
        description: `Coaching ${sessionType} - ${duration} - ${formData.get('name')}`
    };
    
    console.log('📋 Dados de coaching preparados:', data);
    return data;
}

/**
 * Processamento do pagamento para coaching
 */
async function processCoachingPayment(data) {
    console.log('💳 Iniciando processamento de pagamento coaching...');
    
    try {
        const response = await fetch('/api/payment/initiate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        console.log('📡 Resposta do servidor:', response.status);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Pagamento coaching processado:', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ Erro no pagamento coaching:', error);
        throw error;
    }
}

/**
 * Envio de email de confirmação para coaching
 */
async function sendCoachingConfirmationEmail(data) {
    console.log('📧 Enviando email de confirmação de coaching...');
    
    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'coaching_confirmation',
                data: data
            })
        });
        
        if (response.ok) {
            console.log('✅ Email de coaching enviado');
        } else {
            console.warn('⚠️ Email de coaching falhou');
        }
        
    } catch (error) {
        console.warn('⚠️ Erro no email de coaching:', error);
        throw error;
    }
}

/**
 * Exibição de sucesso para coaching
 */
function displayCoachingSuccess(paymentResult, paymentMethod, messageContainer) {
    let content = `
        <div class="alert alert-success">
            <h5><i class="fas fa-check-circle"></i> Sessão Agendada com Sucesso!</h5>
            <p>A sua sessão de coaching foi agendada e o pagamento processado.</p>
    `;
    
    if (paymentMethod === 'mb' || paymentMethod === 'multibanco') {
        content += `
            <div class="payment-details mt-3">
                <h6>Dados para Pagamento Multibanco:</h6>
                <div class="row">
                    <div class="col-md-4"><strong>Entidade:</strong> ${paymentResult.entity || 'N/A'}</div>
                    <div class="col-md-4"><strong>Referência:</strong> ${paymentResult.reference || 'N/A'}</div>
                    <div class="col-md-4"><strong>Valor:</strong> €${paymentResult.amount || 'N/A'}</div>
                </div>
                <p class="mt-2"><small>Validade: ${paymentResult.expiryDate || '3 dias'}</small></p>
            </div>
        `;
    } else if (paymentMethod === 'mbway') {
        content += `
            <div class="payment-details mt-3">
                <h6>Pagamento MB WAY:</h6>
                <p>Verifique a sua aplicação MB WAY para confirmar o pagamento de €${paymentResult.amount || 'N/A'}.</p>
                <p><strong>Estado:</strong> ${paymentResult.message || 'Pendente'}</p>
            </div>
        `;
    }
    
    content += `
            <div class="mt-3">
                <h6>Próximos Passos:</h6>
                <ul class="mb-0">
                    <li>Receberá um email de confirmação com os detalhes da sessão</li>
                    <li>Entraremos em contacto 24h antes para confirmar</li>
                    <li>Link da sessão online será enviado por email</li>
                </ul>
            </div>
        </div>
    `;
    
    messageContainer.innerHTML = content;
}

/**
 * Exibição de erro para coaching
 */
function displayCoachingError(error, messageContainer) {
    const content = `
        <div class="alert alert-danger">
            <h5><i class="fas fa-exclamation-triangle"></i> Erro no Agendamento</h5>
            <p>Ocorreu um erro ao agendar a sua sessão:</p>
            <p><strong>${error.message || 'Erro desconhecido'}</strong></p>
            <p>Por favor, tente novamente ou contacte-nos diretamente:</p>
            <p><strong>Email:</strong> srshare2inspire@gmail.com<br>
               <strong>Telefone:</strong> +351 961 925 050</p>
        </div>
    `;
    
    messageContainer.innerHTML = content;
}

/**
 * Atualização da interface do método de pagamento para coaching
 */
function updateCoachingPaymentMethodUI(method) {
    console.log('🎨 Atualizando UI coaching para método:', method);
    
    // Esconder todos os campos específicos
    const mbwayFields = document.getElementById('coachingMbwayFields');
    if (mbwayFields) {
        mbwayFields.style.display = method === 'mbway' ? 'block' : 'none';
    }
    
    // Atualizar instruções de pagamento
    const paymentInstructions = document.getElementById('coachingPaymentInstructions');
    if (paymentInstructions) {
        if (method === 'mbway') {
            paymentInstructions.innerHTML = '<small class="text-muted">Receberá uma notificação na sua app MB WAY para confirmar o pagamento.</small>';
        } else {
            paymentInstructions.innerHTML = '<small class="text-muted">Receberá os dados de pagamento Multibanco por email.</small>';
        }
    }
}

/**
 * Utilitários (reutilizados)
 */
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validatePhone(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 9;
}

function validateDate(date) {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
}

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
    
    container.innerHTML = `
        <div class="alert ${alertClass}">
            ${message}
        </div>
    `;
}

function setButtonLoading(button, loading, text = 'A processar...') {
    if (!button) return;
    
    if (loading) {
        button.disabled = true;
        button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ${text}`;
    } else {
        button.disabled = false;
        button.innerHTML = text;
    }
}

console.log('✅ Coaching Form - Totalmente Carregado e Configurado');

