/**
 * Formulário de Consultoria Organizacional - Share2Inspire
 * VERSÃO CORRIGIDA - Endpoints e CORS corrigidos
 */

document.addEventListener('DOMContentLoaded', function() {
    setupConsultoriaForm();
});

/**
 * CORREÇÃO: Configuração robusta do formulário
 */
function setupConsultoriaForm() {
    const consultoriaForm = document.getElementById('consultoriaForm');
    if (!consultoriaForm) {
        console.warn('Formulário de consultoria não encontrado');
        return;
    }
    
    consultoriaForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]') || 
                           this.querySelector('.btn-primary');
        
        // CORREÇÃO: Criar container de mensagem se não existir
        let formMessage = document.getElementById('consultoriaFormMessage');
        if (!formMessage) {
            formMessage = document.createElement('div');
            formMessage.id = 'consultoriaFormMessage';
            formMessage.className = 'form-message mt-3';
            this.appendChild(formMessage);
        }
        
        if (!validateConsultoriaForm(this)) {
            formMessage.innerHTML = `
                <div class="alert alert-danger">
                    Por favor, preencha todos os campos obrigatórios.
                </div>
            `;
            return;
        }
        
        if (submitButton) {
            submitButton.disabled = true;
            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A enviar...';
            
            // Restaurar texto original no finally
            submitButton.originalText = originalText;
        }
        
        formMessage.innerHTML = '';
        
        const formData = new FormData(this);
        const data = prepareConsultoriaData(formData);
        
        console.log('Enviando dados de consultoria:', data);
        
        processConsultoriaSubmission(data)
            .then(result => {
                console.log('Consultoria enviada com sucesso:', result);
                displayConsultoriaSuccess(result, formMessage);
                this.reset();
                formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            })
            .catch(error => {
                console.error('Erro ao enviar consultoria:', error);
                displayConsultoriaError(error, formMessage);
            })
            .finally(() => {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = submitButton.originalText || 'Solicitar Proposta';
                }
            });
    });
}

/**
 * CORREÇÃO: Validação mais robusta
 */
function validateConsultoriaForm(form) {
    const requiredFields = ['name', 'email', 'company'];
    
    for (const fieldName of requiredFields) {
        const field = form.querySelector(`[name="${fieldName}"]`) || 
                     form.querySelector(`#consultoria${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`);
        
        if (!field || !field.value.trim()) {
            if (field) field.focus();
            return false;
        }
    }
    
    // Validar email
    const emailField = form.querySelector('[name="email"]') || form.querySelector('#consultoriaEmail');
    if (emailField) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.value)) {
            emailField.focus();
            return false;
        }
    }
    
    return true;
}

/**
 * Preparação de dados (mantido)
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
 * CORREÇÃO: Usar integração Brevo se disponível
 */
function processConsultoriaSubmission(data) {
    return new Promise((resolve, reject) => {
        // CORREÇÃO: Tentar Brevo primeiro se disponível
        if (window.brevoSDK && typeof window.brevoSDK.sendContactForm === 'function') {
            console.log('Usando integração Brevo');
            
            window.brevoSDK.sendContactForm(data)
                .then(result => {
                    resolve({
                        success: true,
                        method: 'brevo',
                        ...result
                    });
                })
                .catch(brevoError => {
                    console.warn('Brevo falhou, usando fallback:', brevoError);
                    processConsultoriaFallback(data).then(resolve).catch(reject);
                });
        } else {
            console.log('Brevo não disponível, usando fallback');
            processConsultoriaFallback(data).then(resolve).catch(reject);
        }
    });
}

/**
 * CORREÇÃO: Fallback com endpoints corretos
 */
function processConsultoriaFallback(data) {
    const endpoints = [
        'https://share2inspire-beckend.lm.r.appspot.com/api/contact/submit',
        'https://share2inspire-beckend.lm.r.appspot.com/api/consultoria/submit',
        'https://share2inspire-beckend.lm.r.appspot.com/api/email/send'
    ];
    
    return tryMultipleEndpoints(data, endpoints);
}

/**
 * CORREÇÃO: Tentativa de múltiplos endpoints melhorada
 */
function tryMultipleEndpoints(data, endpoints, index = 0) {
    if (index >= endpoints.length) {
        return Promise.reject(new Error('Todos os endpoints falharam. Contacte-nos diretamente.'));
    }
    
    const endpoint = endpoints[index];
    console.log(`Tentando endpoint ${index + 1}/${endpoints.length}: ${endpoint}`);
    
    return submitToEndpoint(data, endpoint)
        .then(result => {
            console.log(`Sucesso no endpoint: ${endpoint}`);
            return {
                success: true,
                endpoint: endpoint,
                method: 'fallback',
                ...result
            };
        })
        .catch(error => {
            console.warn(`Endpoint ${endpoint} falhou:`, error.message);
            
            if (index === endpoints.length - 1) {
                // Último endpoint - falhar com mensagem útil
                throw new Error(`Falha na comunicação com o servidor. Contacte-nos diretamente.`);
            }
            
            // Tentar próximo endpoint
            return tryMultipleEndpoints(data, endpoints, index + 1);
        });
}

/**
 * CORREÇÃO: Submissão com headers CORS corretos
 */
function submitToEndpoint(data, endpoint) {
    const config = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(data)
    };
    
    return fetch(endpoint, config)
        .then(response => {
            console.log(`Resposta de ${endpoint}:`, response.status, response.statusText);
            
            if (response.status === 405) {
                // CORREÇÃO: Tentar com PUT se POST não for permitido
                return fetch(endpoint, {
                    ...config,
                    method: 'PUT'
                });
            }
            
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`Erro ${response.status}: ${text || response.statusText}`);
                });
            }
            
            return response;
        })
        .then(response => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            } else {
                return response.text().then(text => ({ 
                    success: true, 
                    message: text || 'Enviado com sucesso' 
                }));
            }
        })
        .then(result => {
            if (result.success !== false) {
                return result;
            } else {
                throw new Error(result.error || result.message || 'Erro desconhecido');
            }
        });
}

/**
 * Display de sucesso (mantido)
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
 * Display de erro (mantido)
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
 * Debug para testes
 */
function debugConsultoriaForm() {
    console.log('=== DEBUG CONSULTORIA FORM ===');
    console.log('Form element:', document.getElementById('consultoriaForm'));
    console.log('Submit button:', document.querySelector('#consultoriaForm button[type="submit"]'));
    console.log('Form fields:', document.querySelectorAll('#consultoriaForm input, #consultoriaForm select, #consultoriaForm textarea'));
    console.log('==============================');
}

window.debugConsultoriaForm = debugConsultoriaForm;

