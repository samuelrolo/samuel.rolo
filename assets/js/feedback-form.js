// JavaScript para integração do formulário de feedback com API Brevo

document.addEventListener('DOMContentLoaded', function() {
    // Referências aos elementos
    const feedbackButton = document.querySelector('.feedback-button');
    const feedbackModal = document.getElementById('feedback-modal');
    const feedbackForm = document.getElementById('feedback-form');
    const closeButton = document.querySelector('.feedback-modal-close');
    const stars = document.querySelectorAll('.star');
    const formMessage = document.getElementById('feedback-message');
    
    // Abrir modal de feedback
    if (feedbackButton) {
        feedbackButton.addEventListener('click', function() {
            feedbackModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevenir scroll do body
        });
    }
    
    // Fechar modal
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            feedbackModal.classList.remove('active');
            document.body.style.overflow = ''; // Restaurar scroll do body
        });
    }
    
    // Fechar modal ao clicar fora do formulário
    if (feedbackModal) {
        feedbackModal.addEventListener('click', function(e) {
            if (e.target === feedbackModal) {
                feedbackModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    // Sistema de avaliação por estrelas
    if (stars.length > 0) {
        stars.forEach((star, index) => {
            star.addEventListener('click', function() {
                // Resetar todas as estrelas
                stars.forEach(s => s.classList.remove('active'));
                
                // Ativar estrelas até a clicada
                for (let i = 0; i <= index; i++) {
                    stars[i].classList.add('active');
                }
                
                // Atualizar valor no formulário
                document.getElementById('rating').value = index + 1;
            });
        });
    }
    
    // Submissão do formulário com integração Brevo
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Mostrar mensagem de carregamento
            formMessage.className = 'form-message';
            formMessage.textContent = 'A enviar o seu feedback...';
            formMessage.style.display = 'block';
            
            // Recolher dados do formulário
            const name = document.getElementById('feedback-name').value;
            const email = document.getElementById('feedback-email').value;
            const comment = document.getElementById('feedback-comment').value;
            const rating = document.getElementById('rating').value;
            
            // Preparar dados para a API Brevo
            const brevoData = {
                sender: {
                    name: name,
                    email: email
                },
                to: [
                    {
                        email: "srshare2inspire@gmail.com",
                        name: "Share2Inspire"
                    }
                ],
                subject: `Novo Feedback do Site: ${rating} estrelas`,
                htmlContent: `
                    <h2>Novo Feedback do Site</h2>
                    <p><strong>Nome:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Avaliação:</strong> ${rating} estrelas</p>
                    <p><strong>Comentário:</strong> ${comment}</p>
                    <p><em>Este email foi enviado automaticamente pelo formulário de feedback do site share2inspire.pt</em></p>
                `
            };
            
            // Enviar para a API Brevo
            fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': 'xkeysib-YOUR_BREVO_API_KEY-PLACEHOLDER' // Substituir pela chave API real
                },
                body: JSON.stringify(brevoData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao enviar email');
                }
                return response.json();
            })
            .then(data => {
                // Sucesso
                formMessage.className = 'form-message success';
                formMessage.textContent = 'Feedback enviado com sucesso! Agradecemos a sua opinião.';
                
                // Limpar formulário
                feedbackForm.reset();
                stars.forEach(s => s.classList.remove('active'));
                
                // Fechar modal após 3 segundos
                setTimeout(() => {
                    feedbackModal.classList.remove('active');
                    document.body.style.overflow = '';
                    formMessage.style.display = 'none';
                }, 3000);
            })
            .catch(error => {
                // Erro
                formMessage.className = 'form-message error';
                formMessage.textContent = 'Ocorreu um erro ao enviar o seu feedback. Por favor, tente novamente mais tarde.';
                console.error('Erro:', error);
            });
        });
    }
});
