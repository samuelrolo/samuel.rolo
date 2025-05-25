/**
 * Formulário de Workshops e Formações - Share2Inspire
 * Este ficheiro contém a lógica específica para o formulário de Workshops e Formações
 * Compatível com a API da Brevo e independente dos outros formulários
 */

// Esperar pelo carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar o formulário de workshops
    setupWorkshopsForm();
});

/**
 * Configura o formulário de workshops e formações
 */
function setupWorkshopsForm() {
    const workshopsForm = document.getElementById('workshopsForm');
    
    if (!workshopsForm) return;
    
    workshopsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const statusMessage = document.getElementById('workshopsStatus') || document.createElement('div');
        
        // Garantir que o elemento de status existe
        if (!document.getElementById('workshopsStatus')) {
            statusMessage.id = 'workshopsStatus';
            workshopsForm.appendChild(statusMessage);
        }
        
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A processar...';
        
        // Obter dados do formulário
        const formData = new FormData(workshopsForm);
        
        // Garantir que todos os campos obrigatórios estão preenchidos
        const requiredFields = ['name', 'email', 'phone', 'topic'];
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
            submitButton.innerHTML = 'Solicitar Informações';
            return;
        }
        
        // Construir objeto de dados com todos os campos necessários
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            company: formData.get('company') || '',
            message: `Solicitação de Informações sobre Workshops\nTema: ${formData.get('topic')}\nNúmero de Participantes: ${formData.get('participants') || 'Não especificado'}\nFormato: ${formData.get('format') || 'Não especificado'}\nInformações Adicionais: ${formData.get('message') || 'Não especificadas'}`,
            subject: `Solicitação de Informações - Workshop ${formData.get('topic')}`,
            source: 'website_workshops',
            // Campos adicionais para processamento interno
            service: 'Workshops e Formações',
            topic: formData.get('topic') || '',
            participants: formData.get('participants') || '',
            format: formData.get('format') || ''
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
                        <h5>Solicitação Enviada com Sucesso!</h5>
                        <p>Obrigado pelo seu interesse. Entraremos em contacto brevemente com informações sobre os workshops solicitados.</p>
                    </div>
                `;
                
                // Resetar formulário
                workshopsForm.reset();
                
                // Reabilitar botão
                submitButton.disabled = false;
                submitButton.innerHTML = 'Solicitar Informações';
            })
            .catch(error => {
                console.error('Erro ao processar solicitação:', error);
                
                // Mostrar mensagem de erro
                statusMessage.innerHTML = '<div class="alert alert-danger">Erro ao processar pedido. Por favor tente novamente.</div>';
                
                // Reabilitar botão
                submitButton.disabled = false;
                submitButton.innerHTML = 'Solicitar Informações';
            });
    });
}
