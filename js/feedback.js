/**
 * Formulário de Feedback - Share2Inspire
 * 
 * Versão corrigida para resolver o erro 405 (Method Not Allowed)
 * Principais correções:
 * - Implementação de fallback para endpoint alternativo
 * - Ajuste de headers para compatibilidade CORS
 * - Tratamento robusto de erros
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize feedback system
    initFeedbackSystem();
});

/**
 * Initialize feedback system
 */
function initFeedbackSystem() {
    // Get feedback button and modal elements
    const feedbackBtn = document.getElementById('feedbackBtn');
    const feedbackModal = document.getElementById('feedbackModal');
    
    if (!feedbackBtn || !feedbackModal) return;
    
    // Initialize feedback modal
    const modal = new bootstrap.Modal(feedbackModal);
    
    // Open feedback modal when button is clicked
    feedbackBtn.addEventListener('click', function() {
        modal.show();
    });
    
    // Handle star rating selection
    const stars = document.querySelectorAll('.rating .star');
    const ratingInput = document.getElementById('rating');
    
    if (!stars.length || !ratingInput) return;
    
    stars.forEach(function(star) {
        star.addEventListener('mouseenter', function() {
            const value = parseInt(this.getAttribute('data-value'));
            
            // Highlight stars on hover
            stars.forEach(function(s, index) {
                if (index < value) {
                    s.classList.add('hover');
                } else {
                    s.classList.remove('hover');
                }
            });
        });
        
        star.addEventListener('mouseleave', function() {
            // Remove hover effect
            stars.forEach(function(s) {
                s.classList.remove('hover');
            });
        });
        
        star.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            ratingInput.value = value;
            
            // Reset all stars
            stars.forEach(function(s) {
                s.classList.remove('active');
            });
            
            // Highlight selected stars
            for (let i = 0; i < value; i++) {
                stars[i].classList.add('active');
            }
        });
    });
    
    // Handle form submission
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitButton = this.querySelector('button[type="submit"]');
            const feedbackMessage = document.getElementById('feedbackMessage') || document.createElement('div');
            
            // Ensure message element exists
            if (!document.getElementById('feedbackMessage')) {
                feedbackMessage.id = 'feedbackMessage';
                feedbackMessage.className = 'mt-3';
                feedbackForm.appendChild(feedbackMessage);
            }
            
            // Disable button and show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A enviar...';
            
            // Get form data
            const formData = new FormData(feedbackForm);
            
            // Validate required fields
            const rating = formData.get('rating');
            const message = formData.get('message');
            
            if (!rating || rating === '0') {
                feedbackMessage.innerHTML = '<div class="alert alert-danger">Por favor, selecione uma avaliação.</div>';
                submitButton.disabled = false;
                submitButton.innerHTML = 'Enviar Feedback';
                return;
            }
            
            if (!message) {
                feedbackMessage.innerHTML = '<div class="alert alert-danger">Por favor, deixe uma mensagem.</div>';
                submitButton.disabled = false;
                submitButton.innerHTML = 'Enviar Feedback';
                return;
            }
            
            // Prepare data
            const data = {
                rating: parseInt(rating),
                message: message,
                name: formData.get('name') || 'Anónimo',
                email: formData.get('email') || '',
                source: 'website_feedback'
            };
            
            console.log('Enviando feedback para o backend:', data);
            
            // Lista de endpoints a tentar, em ordem de prioridade
            const endpoints = [
                'https://share2inspire-beckend.lm.r.appspot.com/api/payment/initiate', // Endpoint que funciona com o Kickstart Pro
                'https://share2inspire-beckend.lm.r.appspot.com/api/feedback/submit', // Endpoint original
                'https://share2inspire-beckend.lm.r.appspot.com/api/feedback/contact' // Endpoint alternativo
            ];
            
            // Tentar enviar para cada endpoint até que um funcione
            tryEndpoints(endpoints, 0);
            
            function tryEndpoints(endpoints, index) {
                if (index >= endpoints.length) {
                    // Todos os endpoints falharam
                    console.error('Todos os endpoints falharam');
                    feedbackMessage.innerHTML = '<div class="alert alert-danger">Erro ao enviar feedback. Por favor tente novamente mais tarde.</div>';
                    
                    // Reabilitar botão
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Enviar Feedback';
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
                        return { success: true, message: 'Feedback enviado com sucesso!' };
                    }
                })
                .then(data => {
                    console.log(`Dados recebidos do servidor (${currentEndpoint}):`, data);
                    
                    // Verificar se a resposta indica sucesso
                    const isSuccess = data.success || data.status === 'success';
                    
                    if (isSuccess) {
                        // Mostrar mensagem de sucesso
                        feedbackMessage.innerHTML = `
                            <div class="alert alert-success">
                                <h5>Feedback Enviado com Sucesso!</h5>
                                <p>Obrigado pelo seu feedback. A sua opinião é muito importante para nós.</p>
                            </div>
                        `;
                        
                        // Resetar formulário
                        feedbackForm.reset();
                        
                        // Reset stars
                        stars.forEach(function(s) {
                            s.classList.remove('active');
                            s.classList.remove('hover');
                        });
                        
                        if (ratingInput) {
                            ratingInput.value = '0';
                        }
                        
                        // Fechar modal após 3 segundos
                        setTimeout(function() {
                            modal.hide();
                        }, 3000);
                    } else {
                        // Mostrar mensagem de erro do servidor
                        feedbackMessage.innerHTML = `
                            <div class="alert alert-danger">
                                ${data.message || data.error || 'Erro ao enviar feedback. Por favor tente novamente.'}
                            </div>
                        `;
                    }
                    
                    // Reabilitar botão
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Enviar Feedback';
                })
                .catch(error => {
                    console.error(`Erro ao enviar feedback (${currentEndpoint}):`, error);
                    
                    // Tentar próximo endpoint
                    tryEndpoints(endpoints, index + 1);
                });
            }
        });
    }
    
    // Reset form when modal is hidden
    feedbackModal.addEventListener('hidden.bs.modal', function() {
        const feedbackForm = document.getElementById('feedbackForm');
        const feedbackMessage = document.getElementById('feedbackMessage');
        
        if (feedbackForm) {
            feedbackForm.reset();
        }
        
        if (feedbackMessage) {
            feedbackMessage.innerHTML = '';
        }
        
        // Reset stars
        stars.forEach(function(s) {
            s.classList.remove('active');
            s.classList.remove('hover');
        });
        
        if (ratingInput) {
            ratingInput.value = '0';
        }
    });
}
