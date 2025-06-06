/**
 * Formulário de Coaching Executivo - Share2Inspire
 * 
 * Versão corrigida para resolver o erro 405 (Method Not Allowed)
 * Principais correções:
 * - Implementação de fallback para endpoint alternativo
 * - Ajuste de headers para compatibilidade CORS
 * - Tratamento robusto de erros
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar o formulário de Coaching
    setupCoachingForm();
});

/**
 * Configura o formulário de Coaching
 */
function setupCoachingForm() {
    const coachingForm = document.getElementById('coachingForm');
    
    if (!coachingForm) return;
    
    coachingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const formMessage = this.querySelector('.form-message') || document.createElement('div');
        
        // Garantir que o elemento de mensagem existe
        if (!this.querySelector('.form-message')) {
            formMessage.className = 'form-message mt-3';
            coachingForm.appendChild(formMessage);
        }
        
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A processar...';
        
        // Obter dados do formulário
        const formData = new FormData(coachingForm);
        
        // Garantir que todos os campos obrigatórios estão preenchidos
        const requiredFields = ['name', 'email', 'phone'];
        let missingFields = false;
        
        requiredFields.forEach(field => {
            if (!formData.get(field)) {
                missingFields = true;
                console.error(`Campo obrigatório em falta: ${field}`);
            }
        });
        
        if (missingFields) {
            formMessage.innerHTML = '<div class="alert alert-danger">Por favor, preencha todos os campos obrigatórios.</div>';
            
            // Reabilitar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'Agendar Sessão Inicial';
            return;
        }
        
        // Construir objeto de dados
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            date: formData.get('date') || '',
            objectives: formData.get('objectives') || '',
            subject: 'Agendamento de Sessão Inicial de Coaching',
            message: `Solicitação de agendamento de sessão inicial de Coaching Executivo.\nData Preferencial: ${formData.get('date') || 'Não especificada'}\nObjetivos: ${formData.get('objectives') || 'Não especificados'}`,
            source: 'website_coaching'
        };
        
        console.log('Enviando dados para o backend:', data);
        
        // Lista de endpoints a tentar, em ordem de prioridade
        const endpoints = [
            'https://share2inspire-beckend.lm.r.appspot.com/api/payment/initiate', // Endpoint que funciona com o Kickstart Pro
            'https://share2inspire-beckend.lm.r.appspot.com/api/feedback/contact', // Endpoint original
            'https://share2inspire-beckend.lm.r.appspot.com/api/booking/create' // Endpoint alternativo
        ];
        
        // Tentar enviar para cada endpoint até que um funcione
        tryEndpoints(endpoints, 0);
        
        function tryEndpoints(endpoints, index) {
            if (index >= endpoints.length) {
                // Todos os endpoints falharam
                console.error('Todos os endpoints falharam');
                formMessage.innerHTML = '<div class="alert alert-danger">Erro ao processar pedido. Por favor tente novamente mais tarde ou contacte-nos diretamente.</div>';
                
                // Reabilitar botão
                submitButton.disabled = false;
                submitButton.innerHTML = 'Agendar Sessão Inicial';
                return;
            }
            
            const currentEndpoint = endpoints[index];
            console.log(`Tentando endpoint ${index + 1}/${endpoints.length}: ${currentEndpoint}`);
            
            // Enviar dados para o backend
            fetch(currentEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': 'https://share2inspire.pt',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                console.log(`Resposta do servidor (${currentEndpoint}):`, response.status, response.statusText);
                
                if (!response.ok) {
                    // Se o endpoint atual falhar, tentar o próximo
                    if (response.status === 405) {
                        console.warn(`Endpoint ${currentEndpoint} retornou 405 Method Not Allowed. Tentando próximo endpoint...`);
                        return tryEndpoints(endpoints, index + 1);
                    }
                    
                    return response.text().then(text => {
                        console.error(`Erro na resposta do servidor (${currentEndpoint}):`, response.status, text);
                        throw new Error(`Erro na resposta do servidor: ${response.status}`);
                    });
                }
                
                // Tentar analisar a resposta como JSON
                try {
                    return response.json();
                } catch (e) {
                    // Se não for JSON, retornar um objeto simples
                    return { success: true, message: 'Agendamento solicitado com sucesso!' };
                }
            })
            .then(data => {
                console.log(`Dados recebidos do servidor (${currentEndpoint}):`, data);
                
                // Verificar se a resposta indica sucesso
                const isSuccess = data.success || data.status === 'success';
                
                if (isSuccess) {
                    // Mostrar mensagem de sucesso
                    formMessage.innerHTML = `
                        <div class="alert alert-success">
                            <h5>Agendamento Solicitado com Sucesso!</h5>
                            <p>Obrigado pelo seu interesse. Entraremos em contacto brevemente para confirmar a data e hora da sua sessão inicial de Coaching Executivo.</p>
                        </div>
                    `;
                    
                    // Resetar formulário
                    coachingForm.reset();
                } else {
                    // Mostrar mensagem de erro do servidor
                    formMessage.innerHTML = `
                        <div class="alert alert-danger">
                            ${data.message || data.error || 'Erro ao processar pedido. Por favor tente novamente.'}
                        </div>
                    `;
                }
                
                // Reabilitar botão
                submitButton.disabled = false;
                submitButton.innerHTML = 'Agendar Sessão Inicial';
            })
            .catch(error => {
                console.error(`Erro ao processar agendamento (${currentEndpoint}):`, error);
                
                // Tentar próximo endpoint
                tryEndpoints(endpoints, index + 1);
            });
        }
    });
}
