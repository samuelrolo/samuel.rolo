/**
 * Formulário de Newsletter - Share2Inspire
 * 
 * Este ficheiro contém o código extraído exatamente como está no ficheiro original share2inspire-forms.js
 * Não foram feitas alterações na lógica ou estrutura, apenas isolamento do código específico para o formulário de Newsletter
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar o formulário de Newsletter
    setupNewsletterForm();
});

/**
 * Configura o formulário de newsletter
 */
function setupNewsletterForm() {
    const newsletterForm = document.getElementById('newsletterForm');
    
    if (!newsletterForm) return;
    
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const statusMessage = document.getElementById('newsletterStatus') || document.createElement('div');
        
        // Garantir que o elemento de status existe
        if (!document.getElementById('newsletterStatus')) {
            statusMessage.id = 'newsletterStatus';
            newsletterForm.appendChild(statusMessage);
        }
        
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A processar...';
        
        // Obter dados do formulário
        const formData = new FormData(newsletterForm);
        const data = {
            email: formData.get('email'),
            name: formData.get('name') || 'Subscritor Newsletter',
            message: 'Pedido de subscrição da newsletter',
            subject: 'Subscrição Newsletter',
            source: 'website_newsletter'
        };
        
        console.log('Enviando dados para o backend:', data);
        
        // Enviar dados para o backend (usando o endpoint contact em vez de newsletter)
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
            statusMessage.innerHTML = '<div class="alert alert-success">Subscrição realizada com sucesso!</div>';
            
            // Resetar formulário
            newsletterForm.reset();
            
            // Reabilitar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'Subscrever';
            
            // Limpar mensagem após 3 segundos
            setTimeout(() => {
                statusMessage.innerHTML = '';
            }, 3000);
        })
        .catch(error => {
            console.error('Erro ao processar subscrição:', error);
            
            // Mostrar mensagem de erro
            statusMessage.innerHTML = '<div class="alert alert-danger">Erro ao processar pedido. Por favor tente novamente.</div>';
            
            // Reabilitar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'Subscrever';
        });
    });
}
