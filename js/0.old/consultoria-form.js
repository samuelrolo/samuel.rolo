/**
 * Formulário de Consultoria Organizacional - Share2Inspire
 * 
 * Este ficheiro contém o código extraído exatamente como está no ficheiro original share2inspire-forms.js
 * Não foram feitas alterações na lógica ou estrutura, apenas isolamento do código específico para o formulário de Consultoria
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
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const formMessage = this.querySelector('.form-message') || document.createElement('div');
        
        // Garantir que o elemento de mensagem existe
        if (!this.querySelector('.form-message')) {
            formMessage.className = 'form-message mt-3';
            consultoriaForm.appendChild(formMessage);
        }
        
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A processar...';
        
        // Obter dados do formulário
        const formData = new FormData(consultoriaForm);
        
        // Garantir que todos os campos obrigatórios estão preenchidos
        const requiredFields = ['name', 'email', 'phone', 'company', 'area', 'message'];
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
            submitButton.innerHTML = 'Solicitar Proposta';
            return;
        }
        
        // Construir objeto de dados
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            company: formData.get('company'),
            area: formData.get('area'),
            message: formData.get('message'),
            subject: 'Solicitação de Proposta de Consultoria',
            source: 'website_consultoria'
        };
        
        console.log('Enviando dados para o backend:', data);
        
        // Enviar dados para o backend
        fetch('https://share2inspire-beckend.lm.r.appspot.com/api/feedback/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://share2inspire.pt',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log('Resposta do servidor:', response.status, response.statusText);
            
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('Erro na resposta do servidor:', response.status, text);
                    throw new Error('Erro na resposta do servidor: ' + response.status);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Dados recebidos do servidor:', data);
            
            // Mostrar mensagem de sucesso
            formMessage.innerHTML = `
                <div class="alert alert-success">
                    <h5>Solicitação Enviada com Sucesso!</h5>
                    <p>Obrigado pelo seu interesse. Entraremos em contacto brevemente para discutir a sua necessidade e apresentar uma proposta personalizada.</p>
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
            formMessage.innerHTML = '<div class="alert alert-danger">Erro ao processar pedido. Por favor tente novamente.</div>';
            
            // Reabilitar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'Solicitar Proposta';
        });
    });
}
