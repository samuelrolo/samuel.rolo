/**
 * Formulário de Workshops - Share2Inspire 
 * VERSÃO TOTALMENTE CORRIGIDA - Dezembro 2024
 * Integração com backend corrigido e validação robusta
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Workshops Form - Versão Corrigida Carregada');
    setupWorkshopsForm();
});

/**
 * Configuração principal do formulário de workshops
 */
function setupWorkshopsForm() {
    const workshopsForm = document.getElementById('workshopsForm');
    if (!workshopsForm) {
        console.warn('⚠️ Formulário Workshops não encontrado');
        return;
    }
    
    console.log('✅ Formulário Workshops encontrado, configurando...');
    
    workshopsForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('📝 Formulário Workshops submetido');
        
        const submitButton = this.querySelector('button[type="submit"]');
        const formMessage = getOrCreateMessageContainer('workshopsFormMessage', this);
        
        // Limpar mensagens anteriores
        formMessage.innerHTML = '';
        
        // Validar formulário
        if (!validateWorkshopsForm(this)) {
            showFormMessage(formMessage, 'error', 'Por favor, preencha todos os campos obrigatórios corretamente.');
            return;
        }
        
        // Preparar dados
        const formData = new FormData(this);
        const data = prepareWorkshopsData(formData);
        
        console.log('📊 Dados preparados:', data);
        
        // Mostrar loading
        setButtonLoading(submitButton, true, 'A enviar...');
        showFormMessage(formMessage, 'info', 'A processar a sua solicitação...');
        
        try {
            // Enviar dados para o backend
            const result = await sendWorkshopsRequest(data);
            console.log('✅ Workshops enviado:', result);
            
            // Tentar enviar email de confirmação
            try {
                await sendWorkshopsConfirmationEmail(data);
                console.log('📧 Email enviado com sucesso');
            } catch (emailError) {
                console.warn('⚠️ Email falhou:', emailError);
            }
            
            // Mostrar sucesso
            displayWorkshopsSuccess(formMessage);
            this.reset();
            
            // Scroll para mensagem
            setTimeout(() => {
                formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            
        } catch (error) {
            console.error('❌ Erro no processo:', error);
            displayWorkshopsError(error, formMessage);
        } finally {
            setButtonLoading(submitButton, false, 'SOLICITAR INFORMAÇÕES');
        }
    });
}

/**
 * Validação do formulário de workshops
 */
function validateWorkshopsForm(form) {
    console.log('🔍 Validando formulário de workshops...');
    
    const validations = [
        { name: 'name', message: 'Nome é obrigatório' },
        { name: 'email', message: 'Email é obrigatório', validator: validateEmail },
        { name: 'company', message: 'Empresa é obrigatória' },
        { name: 'participants', message: 'Número de participantes é obrigatório', validator: validateParticipants },
        { name: 'topics', message: 'Temas de interesse são obrigatórios' }
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
    
    console.log('✅ Formulário de workshops válido');
    return true;
}

/**
 * Preparação de dados para workshops
 */
function prepareWorkshopsData(formData) {
    const data = {
        // Dados do cliente
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone') || '',
        
        // Dados da empresa
        company: formData.get('company'),
        position: formData.get('position') || '',
        
        // Dados do workshop
        service: 'Workshops Corporativos',
        participants: formData.get('participants'),
        topics: formData.get('topics'),
        format: formData.get('format') || 'Presencial',
        duration: formData.get('duration') || 'Meio dia',
        timeline: formData.get('timeline') || '',
        budget: formData.get('budget') || '',
        objectives: formData.get('objectives') || '',
        
        // Metadados
        timestamp: new Date().toISOString(),
        source: 'website_form'
    };
    
    console.log('📋 Dados de workshops preparados:', data);
    return data;
}

/**
 * Envio da solicitação de workshops
 */
async function sendWorkshopsRequest(data) {
    console.log('📤 Enviando solicitação de workshops...');
    
    try {
        const response = await fetch('/api/workshops/request', {
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
        console.log('✅ Workshops processado:', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ Erro nos workshops:', error);
        throw error;
    }
}

/**
 * Envio de email de confirmação para workshops
 */
async function sendWorkshopsConfirmationEmail(data) {
    console.log('📧 Enviando email de confirmação de workshops...');
    
    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'workshops_confirmation',
                data: data
            })
        });
        
        if (response.ok) {
            console.log('✅ Email de workshops enviado');
        } else {
            console.warn('⚠️ Email de workshops falhou');
        }
        
    } catch (error) {
        console.warn('⚠️ Erro no email de workshops:', error);
        throw error;
    }
}

/**
 * Exibição de sucesso para workshops
 */
function displayWorkshopsSuccess(messageContainer) {
    const content = `
        <div class="alert alert-success">
            <h5><i class="fas fa-check-circle"></i> Solicitação Enviada com Sucesso!</h5>
            <p>A sua solicitação de informações sobre workshops foi recebida.</p>
            <div class="mt-3">
                <h6>Próximos Passos:</h6>
                <ul class="mb-0">
                    <li>Receberá um email de confirmação em breve</li>
                    <li>Analisaremos as suas necessidades em 24-48 horas</li>
                    <li>Entraremos em contacto para discutir os detalhes</li>
                    <li>Apresentaremos uma proposta personalizada de workshop</li>
                    <li>Agendaremos as datas que melhor se adequam à sua equipa</li>
                </ul>
            </div>
            <div class="mt-3">
                <h6>Tipos de Workshops Disponíveis:</h6>
                <ul class="mb-0">
                    <li><strong>Liderança e Gestão de Equipas</strong></li>
                    <li><strong>Comunicação Eficaz</strong></li>
                    <li><strong>Gestão de Conflitos</strong></li>
                    <li><strong>Produtividade e Gestão do Tempo</strong></li>
                    <li><strong>Workshops Personalizados</strong></li>
                </ul>
            </div>
            <p class="mt-3 mb-0"><strong>Obrigado pelo seu interesse nos nossos workshops!</strong></p>
        </div>
    `;
    
    messageContainer.innerHTML = content;
}

/**
 * Exibição de erro para workshops
 */
function displayWorkshopsError(error, messageContainer) {
    const content = `
        <div class="alert alert-danger">
            <h5><i class="fas fa-exclamation-triangle"></i> Erro no Envio</h5>
            <p>Ocorreu um erro ao enviar a sua solicitação:</p>
            <p><strong>${error.message || 'Erro desconhecido'}</strong></p>
            <p>Por favor, tente novamente ou contacte-nos diretamente:</p>
            <p><strong>Email:</strong> srshare2inspire@gmail.com<br>
               <strong>Telefone:</strong> +351 961 925 050</p>
            <div class="mt-3">
                <p><strong>Pode também enviar-nos um email com:</strong></p>
                <ul class="mb-0">
                    <li>Nome da empresa e contacto</li>
                    <li>Número de participantes</li>
                    <li>Temas de interesse</li>
                    <li>Datas preferenciais</li>
                </ul>
            </div>
        </div>
    `;
    
    messageContainer.innerHTML = content;
}

/**
 * Validadores específicos
 */
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validateParticipants(participants) {
    const num = parseInt(participants);
    return !isNaN(num) && num > 0 && num <= 1000;
}

/**
 * Utilitários
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

console.log('✅ Workshops Form - Totalmente Carregado e Configurado');

