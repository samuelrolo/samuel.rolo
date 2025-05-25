/**
 * Formulário de Coaching Executivo - Share2Inspire
 * Este ficheiro contém a lógica específica para o formulário de Coaching Executivo
 * Compatível com a API da Brevo e independente dos outros formulários
 */

// Esperar pelo carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar o formulário de coaching
    setupCoachingForm();
});

/**
 * Configura o formulário de coaching executivo
 */
function setupCoachingForm() {
    const coachingForm = document.getElementById('coachingForm');
    
    if (!coachingForm) return;
    
    coachingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const statusMessage = document.getElementById('coachingStatus') || document.createElement('div');
        
        // Garantir que o elemento de status existe
        if (!document.getElementById('coachingStatus')) {
            statusMessage.id = 'coachingStatus';
            coachingForm.appendChild(statusMessage);
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
            statusMessage.innerHTML = '<div class="alert alert-danger">Por favor, preencha todos os campos obrigatórios.</div>';
            
            // Reabilitar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'Agendar Sessão Inicial';
            return;
        }
        
        // Construir objeto de dados com todos os campos necessários
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            message: `Agendamento de Coaching Executivo\nData Preferencial: ${formData.get('date') || 'Não especificada'}\nObjetivos: ${formData.get('objectives') || 'Não especificados'}`,
            subject: 'Agendamento de Coaching Executivo',
            source: 'website_coaching',
            // Campos adicionais para processamento interno
            service: 'Coaching Executivo',
            date: formData.get('date') || '',
            objectives: formData.get('objectives') || ''
        };
        
        console.log('Enviando dados para o backend:', data);
        
        // Configuração para o fetch
        const fetchOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Origin': 'https://share2inspire.pt',
                'Accept': 'application/json'
            },
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify(data)
        };
        
        // Enviar dados para o backend
        fetch('https://share2inspire-beckend.lm.r.appspot.com/api/feedback/contact', fetchOptions)
            .then(response => {
                console.log('Resposta do servidor:', response);
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error('Erro na resposta do servidor:', response.status, text);
                        throw new Error('Erro na resposta do servidor: ' + response.status + ' - ' + text);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('Dados recebidos do servidor:', data);
                
                // Mostrar mensagem de sucesso
                statusMessage.innerHTML = `
                    <div class="alert alert-success">
                        <h5>Agendamento Enviado com Sucesso!</h5>
                        <p>Obrigado pelo seu interesse. Entraremos em contacto brevemente para confirmar a sua sessão inicial de coaching.</p>
                    </div>
                `;
                
                // Resetar formulário
                coachingForm.reset();
                
                // Reabilitar botão
                submitButton.disabled = false;
                submitButton.innerHTML = 'Agendar Sessão Inicial';
            })
            .catch(error => {
                console.error('Erro ao processar agendamento:', error);
                
                // Mostrar mensagem de erro
                statusMessage.innerHTML = '<div class="alert alert-danger">Erro ao processar pedido. Por favor tente novamente.</div>';
                
                // Reabilitar botão
                submitButton.disabled = false;
                submitButton.innerHTML = 'Agendar Sessão Inicial';
            });
    });
}
