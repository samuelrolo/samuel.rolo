/**
 * Formulário de Consultoria - Share2Inspire 
 * VERSÃO TOTALMENTE CORRIGIDA - Dezembro 2024
 * Integração com backend corrigido e validação robusta
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Consultoria Form - Versão Corrigida Carregada');
    setupConsultoriaForm();
});

/**
 * Configuração principal do formulário de consultoria
 */
function setupConsultoriaForm() {
    const consultoriaForm = document.getElementById('consultoriaForm');
    if (!consultoriaForm) {
        console.warn('⚠️ Formulário Consultoria não encontrado');
        return;
    }
    
    console.log('✅ Formulário Consultoria encontrado, configurando...');
    
    consultoriaForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('📝 Formulário Consultoria submetido');
        
        const submitButton = this.querySelector('button[type="submit"]');
        const formMessage = getOrCreateMessageContainer('consultoriaFormMessage', this);
        
        // Limpar mensagens anteriores
        formMessage.innerHTML = '';
        
        // Validar formulário
        if (!validateConsultoriaForm(this)) {
            showFormMessage(formMessage, 'error', 'Por favor, preencha todos os campos obrigatórios corretamente.');
            return;
        }
        
        // Preparar dados
        const formData = new FormData(this);
        const data = prepareConsultoriaData(formData);
        
        console.log('📊 Dados preparados:', data);
        
        // Mostrar loading
        setButtonLoading(submitButton, true, 'A enviar proposta...');
        showFormMessage(formMessage, 'info', 'A processar o seu pedido de consultoria...');
        
        try {
            // Enviar dados para o backend
            const result = await sendConsultoriaRequest(data);
            console.log('✅ Consultoria enviada:', result);
            
            // Tentar enviar email de confirmação
            try {
                await sendConsultoriaConfirmationEmail(data);
                console.log('📧 Email enviado com sucesso');
            } catch (emailError) {
                console.warn('⚠️ Email falhou:', emailError);
            }
            
            // Mostrar sucesso
            displayConsultoriaSuccess(formMessage);
            this.reset();
            
            // Scroll para mensagem
            setTimeout(() => {
                formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            
        } catch (error) {
            console.error('❌ Erro no processo:', error);
            displayConsultoriaError(error, formMessage);
        } finally {
            setButtonLoading(submitButton, false, 'SOLICITAR PROPOSTA');
        }
    });
}

/**
 * Validação do formulário de consultoria
 */
function validateConsultoriaForm(form) {
    console.log('🔍 Validando formulário de consultoria...');
    
    const validations = [
        { name: 'name', message: 'Nome é obrigatório' },
        { name: 'email', message: 'Email é obrigatório', validator: validateEmail },
        { name: 'company', message: 'Empresa é obrigatória' },
        { name: 'challenge', message: 'Descrição do desafio é obrigatória' }
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
    
    console.log('✅ Formulário de consultoria válido');
    return true;
}

/**
 * Preparação de dados para consultoria
 */
function prepareConsultoriaData(formData) {
    const data = {
        // Dados do cliente
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone') || '',
        
        // Dados da empresa
        company: formData.get('company'),
        position: formData.get('position') || '',
        size: formData.get('size') || '',
        sector: formData.get('sector') || '',
        
        // Dados do projeto
        service: 'Consultoria Organizacional',
        challenge: formData.get('challenge'),
        goals: formData.get('goals') || '',
        timeline: formData.get('timeline') || '',
        budget: formData.get('budget') || '',
        
        // Metadados
        timestamp: new Date().toISOString(),
        source: 'website_form'
    };
    
    console.log('📋 Dados de consultoria preparados:', data);
    return data;
}

/**
 * Envio da solicitação de consultoria
 */
async function sendConsultoriaRequest(data) {
    console.log('📤 Enviando solicitação de consultoria...');
    
    try {
        const response = await fetch('/api/consultoria/request', {
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
        console.log('✅ Consultoria processada:', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ Erro na consultoria:', error);
        throw error;
    }
}

/**
 * Envio de email de confirmação para consultoria
 */
async function sendConsultoriaConfirmationEmail(data) {
    console.log('📧 Enviando email de confirmação de consultoria...');
    
    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'consultoria_confirmation',
                data: data
            })
        });
        
        if (response.ok) {
            console.log('✅ Email de consultoria enviado');
        } else {
            console.warn('⚠️ Email de consultoria falhou');
        }
        
    } catch (error) {
        console.warn('⚠️ Erro no email de consultoria:', error);
        throw error;
    }
}

/**
 * Exibição de sucesso para consultoria
 */
function displayConsultoriaSuccess(messageContainer) {
    const content = `
        <div class="alert alert-success">
            <h5><i class="fas fa-check-circle"></i> Solicitação Enviada com Sucesso!</h5>
            <p>A sua solicitação de proposta de consultoria foi recebida.</p>
            <div class="mt-3">
                <h6>Próximos Passos:</h6>
                <ul class="mb-0">
                    <li>Receberá um email de confirmação em breve</li>
                    <li>Analisaremos o seu pedido em 24-48 horas</li>
                    <li>Entraremos em contacto para agendar uma reunião inicial</li>
                    <li>Apresentaremos uma proposta personalizada</li>
                </ul>
            </div>
            <p class="mt-3 mb-0"><strong>Obrigado pelo seu interesse nos nossos serviços!</strong></p>
        </div>
    `;
    
    messageContainer.innerHTML = content;
}

/**
 * Exibição de erro para consultoria
 */
function displayConsultoriaError(error, messageContainer) {
    const content = `
        <div class="alert alert-danger">
            <h5><i class="fas fa-exclamation-triangle"></i> Erro no Envio</h5>
            <p>Ocorreu um erro ao enviar a sua solicitação:</p>
            <p><strong>${error.message || 'Erro desconhecido'}</strong></p>
            <p>Por favor, tente novamente ou contacte-nos diretamente:</p>
            <p><strong>Email:</strong> srshare2inspire@gmail.com<br>
               <strong>Telefone:</strong> +351 961 925 050</p>
        </div>
    `;
    
    messageContainer.innerHTML = content;
}

/**
 * Utilitários (reutilizados)
 */
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
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

console.log('✅ Consultoria Form - Totalmente Carregado e Configurado');

