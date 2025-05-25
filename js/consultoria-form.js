/**
 * Formulário de Consultoria Organizacional - Share2Inspire
 * Este ficheiro contém a lógica específica para o formulário de Consultoria Organizacional
 * Compatível com a API da Brevo e independente dos outros formulários
 */

// Esperar pelo carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar o formulário de consultoria
    setupConsultoriaForm();
});

/**
 * Configura o formulário de consultoria organizacional
 */
function setupConsultoriaForm() {
    const consultoriaForm = document.getElementById('consultoriaForm');
    
    if (!consultoriaForm) return;
    
    consultoriaForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const statusMessage = document.getElementById('consultoriaStatus') || document.createElement('div');
        
        // Garantir que o elemento de status existe
        if (!document.getElementById('consultoriaStatus')) {
            statusMessage.id = 'consultoriaStatus';
            consultoriaForm.appendChild(statusMessage);
        }
        
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A processar...';
        
        // Obter dados do formulário
        const formData = new FormData(consultoriaForm);
        
        // Garantir que todos os campos obrigatórios estão preenchidos
        const requiredFields = ['name', 'email', 'phone', 'company'];
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
            submitButton.innerHTML = 'Solicitar Proposta';
            return;
        }
        
        // Construir objeto de dados com todos os campos necessários
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            company: formData.get('company') || '',
            message: formData.get('message') || 'Solicitação de proposta de consultoria',
            subject: 'Solicitação de Proposta de Consultoria',
            source: 'website_consultoria',
            // Campos adicionais para processamento interno
            service: 'Consultoria Organizacional',
            industry: formData.get('industry') || '',
            employees: formData.get('employees') || '',
            challenges: formData.get('challenges') || ''
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
                        <p>Obrigado pelo seu interesse. Entraremos em contacto brevemente para discutir a sua proposta de consultoria.</p>
                    </div>
                `;
                
                // Resetar formulário
                consultoriaForm.reset();
                
                // Reabilitar botão
                submitButton.disabled = false;
                submitButton.innerHTML = 'Solicitar Proposta';
            })
            .catch(error => {
                console.error('Erro ao processar solicitação:', error);
                
                // Mostrar mensagem de erro
                statusMessage.innerHTML = '<div class="alert alert-danger">Erro ao processar pedido. Por favor tente novamente.</div>';
                
                // Reabilitar botão
                submitButton.disabled = false;
                submitButton.innerHTML = 'Solicitar Proposta';
            });
    });
}
