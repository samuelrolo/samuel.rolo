/**
 * Formulário de Newsletter - Share2Inspire
 * Este ficheiro contém a lógica específica para o formulário de Newsletter
 * Compatível com a API da Brevo e independente dos outros formulários
 */

// Esperar pelo carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar o formulário de newsletter
    setupNewsletterForm();
});

/**
 * Configura o formulário de newsletter
 */
function setupNewsletterForm() {
    const newsletterForms = document.querySelectorAll('.newsletter-form');
    
    if (newsletterForms.length === 0) return;
    
    newsletterForms.forEach((newsletterForm, index) => {
        // Criar um ID único para cada formulário se não existir
        if (!newsletterForm.id) {
            newsletterForm.id = `newsletterForm-${index}`;
        }
        
        // Criar um elemento para mensagens de status se não existir
        let statusMessageId = `newsletterStatus-${index}`;
        let statusMessage = document.getElementById(statusMessageId);
        
        if (!statusMessage) {
            statusMessage = document.createElement('div');
            statusMessage.id = statusMessageId;
            statusMessage.className = 'newsletter-status mt-2';
            newsletterForm.appendChild(statusMessage);
        }
        
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitButton = this.querySelector('button[type="submit"]');
            
            // Desabilitar botão e mostrar estado de carregamento
            submitButton.disabled = true;
            const originalButtonText = submitButton.innerHTML;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A processar...';
            
            // Obter dados do formulário
            const formData = new FormData(newsletterForm);
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            
            if (!emailInput || !emailInput.value) {
                statusMessage.innerHTML = '<div class="alert alert-danger">Por favor, insira um email válido.</div>';
                
                // Reabilitar botão
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
                return;
            }
            
            // Construir objeto de dados
            const data = {
                email: emailInput.value,
                name: formData.get('name') || 'Subscritor Newsletter',
                message: 'Pedido de subscrição da newsletter',
                subject: 'Subscrição Newsletter',
                source: 'website_newsletter',
                rating: formData.get('rating') || '5'
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
                    statusMessage.innerHTML = '<div class="alert alert-success">Subscrição realizada com sucesso!</div>';
                    
                    // Resetar formulário
                    newsletterForm.reset();
                    
                    // Reabilitar botão
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalButtonText;
                    
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
                    submitButton.innerHTML = originalButtonText;
                });
        });
    });
}
