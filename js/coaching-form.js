/**
 * Formulário de Coaching Executivo - Share2Inspire
 * VERSÃO CORRIGIDA - Integração Brevo e endpoints corrigidos
 */

document.addEventListener('DOMContentLoaded', function() {
    setupCoachingForm();
});

/**
 * CORREÇÃO: Configuração robusta do formulário
 */
function setupCoachingForm() {
    const coachingForm = document.getElementById('coachingForm');
    if (!coachingForm) {
        console.warn('Formulário de coaching não encontrado');
        return;
    }
    
    coachingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]') || 
                           this.querySelector('.btn-primary');
        
        // CORREÇÃO: Criar container de mensagem se não existir
        let formMessage = document.getElementById('coachingFormMessage');
        if (!formMessage) {
            formMessage = document.createElement('div');
            formMessage.id = 'coachingFormMessage';
            formMessage.className = 'form-message mt-3';
            this.appendChild(formMessage);
        }
        
        if (!validateCoachingForm(this)) {
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
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A processar...';
            submitButton.originalText = originalText;
        }
        
        formMessage.innerHTML = '';
        
        const formData = new FormData(this);
        const data = prepareCoachingData(formData);
        
        console.log('Enviando dados de coaching:', data);
        
        processCoachingSubmission(data)
            .then(result => {
                console.log('Coaching enviado com sucesso:', result);
                displayCoachingSuccess(result, formMessage);
                this.reset();
                formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            })
            .catch(error => {
                console.error('Erro ao enviar coaching:', error);
                displayCoachingError(error, formMessage);
            })
            .finally(() => {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = submitButton.originalText || 'Agendar Sessão Inicial';
                }
            });
    });
}

/**
 * CORREÇÃO: Validação mais robusta
 */
function validateCoachingForm(form) {
    const requiredFields = ['name', 'email', 'phone'];
    
    for (const fieldName of requiredFields) {
        const field = form.querySelector(`[name="${fieldName}"]`) || 
                     form.querySelector(`#coaching${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`);
        
        if (!field || !field.value.trim()) {
            if (field) field.focus();
            return false;
        }
    }
    
    // Validar email
    const emailField = form.querySelector('[name="email"]') || form.querySelector('#coachingEmail');
    if (emailField) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.value)) {
            emailField.focus();
            return false;
        }
    }
    
    // Validar telefone
    const phoneField = form.querySelector('[name="phone"]') || form.querySelector('#coachingPhone');
    if (phoneField && phoneField.value.replace(/\D/g, '').length < 9) {
        phoneField.focus();
        return false;
    }
    
    return true;
}

/**
 * Preparação de dados
 */
function prepareCoachingData(formData) {
    return {
        service: 'Coaching Executivo',
        name: formData.get('name') || '',
        email: formData.get('email') || '',
        phone: formData.get('phone') || '',
        date: formData.get('date') || '',
        objectives: formData.get('objectives') || '',
        experience: formData.get('experience') || '',
        subject: 'Agendamento de Sessão Inicial de Coaching',
        message: `Solicitação de agendamento de sessão inicial de Coaching Executivo.
Data Preferencial: ${formData.get('date') || 'Não especificada'}
Objetivos: ${formData.get('objectives') || 'Não especificados'}
Experiência: ${formData.get('experience') || 'Não especificada'}`,
        timestamp: new Date().toISOString(),
        source: 'website_coaching'
    };
}

/**
 * CORREÇÃO: Usar integração Brevo se disponível
 */
function processCoachingSubmission(data) {
    return new Promise((resolve, reject) => {
        // CORREÇÃO: Tentar Brevo primeiro se disponível
        if (window.brevoSDK && typeof window.brevoSDK.sendBookingRequest === 'function') {
            console.log('Usando integração Brevo para coaching');
            
            window.brevoSDK.sendBookingRequest(data)
                .then(result => {
                    resolve({
                        success: true,
                        method: 'brevo',
                        ...result
                    });
                })
                .catch(brevoError => {
                    console.warn('Brevo falhou, usando fallback:', brevoError);
                    processCoachingFallback(data).then(resolve).catch(reject);
                });
        } else {
            console.log('Brevo não disponível, usando fallback');
            processCoachingFallback(data).then(resolve).catch(reject);
        }
    });
}

/**
 * CORREÇÃO: Fallback com endpoints corretos
 */
function processCoachingFallback(data) {
    const endpoints = [
        'https://share2inspire-beckend.lm.r.appspot.com/api/contact/submit',
        'https://share2inspire-beckend.lm.r.appspot.com/api/booking/create',
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
                throw new Error(`Falha na comunicação com o servidor. Contacte-nos diretamente.`);
            }
            
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
            'Origin': 'https://share2inspire.pt',
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
                    message: text || 'Agendamento solicitado com sucesso!' 
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
 * Display de sucesso
 */
function displayCoachingSuccess(result, container) {
    container.innerHTML = `
        <div class="alert alert-success">
            <h4>✅ Agendamento Solicitado com Sucesso!</h4>
            <p>Obrigado pelo seu interesse em Coaching Executivo!</p>
            <p>📧 Entraremos em contacto brevemente para confirmar a data e hora da sua sessão inicial.</p>
            <p>📞 Para questões urgentes: +351 961 925 050</p>
            <hr>
            <p><small>Obrigado por escolher a Share2Inspire!</small></p>
        </div>
    `;
}

/**
 * Display de erro
 */
function displayCoachingError(error, container) {
    container.innerHTML = `
        <div class="alert alert-danger">
            <h4>❌ Erro ao Processar Agendamento</h4>
            <p>Ocorreu um erro ao processar o seu agendamento: ${error.message || 'Erro desconhecido'}</p>
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
function debugCoachingForm() {
    console.log('=== DEBUG COACHING FORM ===');
    console.log('Form element:', document.getElementById('coachingForm'));
    console.log('Submit button:', document.querySelector('#coachingForm button[type="submit"]'));
    console.log('Form fields:', document.querySelectorAll('#coachingForm input, #coachingForm select, #coachingForm textarea'));
    console.log('============================');
}

window.debugCoachingForm = debugCoachingForm;

