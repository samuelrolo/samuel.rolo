/**
 * Formulário de Consultoria Organizacional - Share2Inspire (VERSÃO CORRIGIDA)
 * 
 * Correções implementadas:
 * - Resolver erro 405 (Method Not Allowed)
 * - Prevenir desaparecimento do modal
 * - Implementar fallback para endpoint alternativo
 * - Ajustar headers para compatibilidade CORS
 * - Tratamento robusto de erros
 * - Feedback adequado ao utilizador
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar o formulário de Consultoria
    setupConsultoriaForm();
});

/**
 * Configura o formulário de Consultoria
 */
function setupConsultoriaForm() {
    const consultoriaForm = document.getElementById('consultoriaForm');
    if (!consultoriaForm) return;
    
    consultoriaForm.addEventListener('submit', function(e) {
        e.preventDefault(); // CRÍTICO: Prevenir comportamento padrão
        
        const submitButton = this.querySelector('button[type="submit"]');
        const formMessage = document.getElementById('consultoriaFormMessage') || 
                           this.querySelector('.form-message') || 
                           document.createElement('div');
        
        // Garantir que o elemento de mensagem existe
        if (!document.getElementById('consultoriaFormMessage') && !this.querySelector('.form-message')) {
            formMessage.className = 'form-message mt-3';
            formMessage.id = 'consultoriaFormMessage';
            this.appendChild(formMessage);
        }
        
        // Validar formulário antes de processar
        if (!validateConsultoriaForm(this)) {
            formMessage.innerHTML = `
                <div class="alert alert-danger">
                    Por favor, preencha todos os campos obrigatórios.
                </div>
            `;
            return;
        }
        
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A enviar...';
        
        // Limpar mensagens anteriores
        formMessage.innerHTML = '';
        
        // Obter dados do formulário
        const formData = new FormData(this);
        const data = prepareConsultoriaData(formData);
        
        console.log('Enviando dados de consultoria:', data);
        
        // Processar envio com múltiplas tentativas
        processConsultoriaSubmission(data)
            .then(result => {
                console.log('Consultoria enviada com sucesso:', result);
                displayConsultoriaSuccess(result, formMessage);
                
                // Resetar formulário
                this.reset();
                
                // Scroll para a mensagem
                formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            })
            .catch(error => {
                console.error('Erro ao enviar consultoria:', error);
                displayConsultoriaError(error, formMessage);
            })
            .finally(() => {
                // Reabilitar botão
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            });
    });
}

/**
 * Valida o formulário de Consultoria
 */
function validateConsultoriaForm(form) {
    const requiredFields = ['name', 'email', 'company', 'objectives'];
    
    for (const fieldName of requiredFields) {
        const field = form.querySelector(`[name="${fieldName}"]`);
        if (!field || !field.value.trim()) {
            field?.focus();
            return false;
        }
    }
    
    // Validar email
    const email = form.querySelector('[name="email"]').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        form.querySelector('[name="email"]').focus();
        return false;
    }
    
    return true;
}

/**
 * Prepara dados do formulário
 */
function prepareConsultoriaData(formData) {
    return {
        service: 'Consultoria Organizacional',
        name: formData.get('name') || '',
        email: formData.get('email') || '',
        phone: formData.get('phone') || '',
        company: formData.get('company') || '',
        position: formData.get('position') || '',
        employees: formData.get('employees') || '',
        objectives: formData.get('objectives') || '',
        timeline: formData.get('timeline') || '',
        budget: formData.get('budget') || '',
        timestamp: new Date().toISOString(),
        source: 'website_form'
    };
}

/**
 * Processa envio com múltiplas tentativas (CORRIGIDO)
 */
function processConsultoriaSubmission(data) {
    // Lista de endpoints para tentar (fallback)
    const endpoints = [
        'https://share2inspire-beckend.lm.r.appspot.com/api/consultoria/submit',
        'https://share2inspire-beckend.lm.r.appspot.com/api/contact/submit',
        'https://share2inspire-beckend.lm.r.appspot.com/api/email/send'
    ];
    
    return tryMultipleEndpoints(data, endpoints);
}

/**
 * Tenta múltiplos endpoints até encontrar um que funcione
 */
function tryMultipleEndpoints(data, endpoints, index = 0) {
    if (index >= endpoints.length) {
        return Promise.reject(new Error('Todos os endpoints falharam'));
    }
    
    const endpoint = endpoints[index];
    console.log(`Tentando endpoint ${index + 1}/${endpoints.length}: ${endpoint}`);
    
    return submitToEndpoint(data, endpoint)
        .catch(error => {
            console.warn(`Endpoint ${endpoint} falhou:`, error);
            
            // Tentar próximo endpoint
            return tryMultipleEndpoints(data, endpoints, index + 1);
        });
}

/**
 * Submete para um endpoint específico
 */
function submitToEndpoint(data, endpoint) {
    // Configurações diferentes para diferentes endpoints
    const configs = {
        'POST': {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(data)
        },
        'PUT': {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        }
    };
    
    // Tentar primeiro com POST, depois com PUT se falhar
    return fetch(endpoint, configs.POST)
        .then(response => {
            console.log(`Resposta de ${endpoint}:`, response.status, response.statusText);
            
            if (response.status === 405) {
                // Method Not Allowed - tentar com PUT
                console.log('POST não permitido, tentando PUT...');
                return fetch(endpoint, configs.PUT);
            }
            
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`Erro ${response.status}: ${text}`);
                });
            }
            
            return response;
        })
        .then(response => {
            // Tentar parsear como JSON, fallback para texto
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            } else {
                return response.text().then(text => ({ success: true, message: text }));
            }
        })
        .then(result => {
            if (result.success !== false) {
                return {
                    success: true,
                    endpoint: endpoint,
                    ...result
                };
            } else {
                throw new Error(result.error || result.message || 'Erro desconhecido');
            }
        });
}

/**
 * Exibe sucesso
 */
function displayConsultoriaSuccess(result, container) {
    container.innerHTML = `
        <div class="alert alert-success">
            <h4>✅ Pedido de Consultoria Enviado</h4>
            <p>O seu pedido de consultoria organizacional foi enviado com sucesso!</p>
            <p>📧 Receberá uma resposta no prazo de 24 horas.</p>
            <p>📞 Para questões urgentes: +351 961 925 050</p>
            <hr>
            <p><small>Obrigado por escolher a Share2Inspire!</small></p>
        </div>
    `;
}

/**
 * Exibe erro
 */
function displayConsultoriaError(error, container) {
    container.innerHTML = `
        <div class="alert alert-danger">
            <h4>❌ Erro ao Enviar Pedido</h4>
            <p>Ocorreu um erro ao enviar o seu pedido: ${error.message || 'Erro desconhecido'}</p>
            <p>Por favor, tente novamente ou contacte-nos diretamente:</p>
            <ul>
                <li>📧 Email: samuel@share2inspire.pt</li>
                <li>📞 Telefone: +351 961 925 050</li>
                <li>💬 WhatsApp: +351 961 925 050</li>
            </ul>
        </div>
    `;
}

/**
 * Função auxiliar para debug
 */
function debugConsultoriaForm() {
    console.log('=== DEBUG CONSULTORIA FORM ===');
    console.log('Form element:', document.getElementById('consultoriaForm'));
    console.log('Submit button:', document.querySelector('#consultoriaForm button[type="submit"]'));
    console.log('Form fields:', document.querySelectorAll('#consultoriaForm input, #consultoriaForm select, #consultoriaForm textarea'));
    console.log('==============================');
}

// Expor função de debug globalmente para testes
window.debugConsultoriaForm = debugConsultoriaForm;

