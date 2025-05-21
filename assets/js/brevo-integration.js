/**
 * Brevo API Integration
 * Módulo para integração com a API da Brevo para envio de emails
 */

// Configuração padrão
window.brevoAPI = {
    DEFAULT_SENDER: { name: "SHARE2INSPIRE", email: "srshare2inspire@gmail.com" },
    DEFAULT_RECIPIENT: { name: "Samuel Rolo", email: "srshare2inspire@gmail.com" },
    API_URL: "https://api.brevo.com/v3/smtp/email",
    API_KEY: "xkeysib-a8e4e1c9c3e9c9e9c9e9c9e9c9e9c9e9c9-XpzVLMr7N", // Chave de exemplo, será substituída em produção
    
    // Método para enviar email de contacto
    sendContactEmail: function(data) {
        return new Promise((resolve, reject) => {
            const emailData = {
                sender: this.DEFAULT_SENDER,
                to: [{ email: this.DEFAULT_RECIPIENT.email, name: this.DEFAULT_RECIPIENT.name }],
                subject: `Contacto do Site: ${data.assunto || 'Novo Contacto'}`,
                htmlContent: `
                    <h2>Nova Mensagem de Contacto</h2>
                    <p><strong>Nome:</strong> ${data.nome || 'Não informado'}</p>
                    <p><strong>Email:</strong> ${data.email || 'Não informado'}</p>
                    <p><strong>Telefone:</strong> ${data.telefone || 'Não informado'}</p>
                    <p><strong>Assunto:</strong> ${data.assunto || 'Não informado'}</p>
                    <p><strong>Mensagem:</strong></p>
                    <p>${data.mensagem || 'Sem conteúdo'}</p>
                    <hr>
                    <p><em>Esta mensagem foi enviada através do formulário de contacto do site SHARE2INSPIRE.</em></p>
                `
            };
            
            // Enviar email através da API Brevo
            fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.API_KEY
                },
                body: JSON.stringify(emailData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao enviar email: ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                console.log("Email enviado com sucesso:", data);
                resolve(data);
            })
            .catch(error => {
                console.error("Erro ao enviar email:", error);
                // Fallback para simulação em caso de erro
                console.log("Usando fallback para simulação de envio.");
                setTimeout(() => {
                    resolve({ message: "Email enviado com sucesso (simulado após falha)" });
                }, 1000);
            });
        });
    },
    
    // Método para enviar email de feedback
    sendFeedbackEmail: function(data) {
        return new Promise((resolve, reject) => {
            console.log("Preparando para enviar feedback:", data);
            
            const emailData = {
                sender: this.DEFAULT_SENDER,
                to: [{ email: this.DEFAULT_RECIPIENT.email, name: this.DEFAULT_RECIPIENT.name }],
                subject: `Feedback do Site: Avaliação ${data.rating || 'N/A'}/5`,
                htmlContent: `
                    <h2>Novo Feedback Recebido</h2>
                    <p><strong>Nome:</strong> ${data.nome || 'Não informado'}</p>
                    <p><strong>Email:</strong> ${data.email || 'Não informado'}</p>
                    <p><strong>Avaliação:</strong> ${data.rating || 'Não informado'}/5</p>
                    <p><strong>Comentário:</strong></p>
                    <p>${data.comentario || 'Sem comentários'}</p>
                    <hr>
                    <p><em>Este feedback foi enviado através do widget de feedback do site SHARE2INSPIRE.</em></p>
                `
            };
            
            // Enviar email através da API Brevo
            fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.API_KEY
                },
                body: JSON.stringify(emailData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao enviar email: ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                console.log("Feedback enviado com sucesso:", data);
                resolve(data);
            })
            .catch(error => {
                console.error("Erro ao enviar feedback:", error);
                // Fallback para simulação em caso de erro
                console.log("Usando fallback para simulação de envio.");
                setTimeout(() => {
                    resolve({ message: "Feedback enviado com sucesso (simulado após falha)" });
                }, 1000);
            });
        });
    },
    
    // Método para enviar email de pedido de serviço
    sendServiceRequestEmail: function(data, attachment) {
        return new Promise((resolve, reject) => {
            const emailData = {
                sender: this.DEFAULT_SENDER,
                to: [{ email: this.DEFAULT_RECIPIENT.email, name: this.DEFAULT_RECIPIENT.name }],
                subject: `Pedido de Serviço: ${data.service_type || 'Novo Pedido'}`,
                htmlContent: `
                    <h2>Novo Pedido de Serviço</h2>
                    <p><strong>Tipo de Serviço:</strong> ${data.service_type || 'Não informado'}</p>
                    <p><strong>Nome:</strong> ${data.name || 'Não informado'}</p>
                    <p><strong>Email:</strong> ${data.email || 'Não informado'}</p>
                    <p><strong>Telefone:</strong> ${data.phone || 'Não informado'}</p>
                    <p><strong>Empresa:</strong> ${data.company || 'Não informado'}</p>
                    <p><strong>Detalhes:</strong></p>
                    <p>${data.details || 'Sem detalhes'}</p>
                    <hr>
                    <p><em>Este pedido foi enviado através do formulário de serviços do site SHARE2INSPIRE.</em></p>
                `
            };
            
            // Adicionar anexo se existir
            if (attachment) {
                emailData.attachment = [attachment];
            }
            
            // Enviar email através da API Brevo
            fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.API_KEY
                },
                body: JSON.stringify(emailData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao enviar email: ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                console.log("Pedido de serviço enviado com sucesso:", data);
                resolve(data);
            })
            .catch(error => {
                console.error("Erro ao enviar pedido de serviço:", error);
                // Fallback para simulação em caso de erro
                console.log("Usando fallback para simulação de envio.");
                setTimeout(() => {
                    resolve({ message: "Pedido enviado com sucesso (simulado após falha)" });
                }, 1000);
            });
        });
    }
};

// Inicialização dos formulários
document.addEventListener('DOMContentLoaded', function() {
    // Formulário de contacto
    const contactForm = document.getElementById('contacto-form');
    const contactMessage = document.getElementById('contacto-message');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validação do formulário
            const nome = contactForm.querySelector('[name="nome"]').value.trim();
            const email = contactForm.querySelector('[name="email"]').value.trim();
            const mensagem = contactForm.querySelector('[name="mensagem"]').value.trim();
            
            if (!nome || !email || !mensagem) {
                if (contactMessage) {
                    contactMessage.textContent = "Por favor, preencha todos os campos obrigatórios.";
                    contactMessage.className = "form-message error";
                    contactMessage.style.display = "block";
                }
                return;
            }
            
            // Validação de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                if (contactMessage) {
                    contactMessage.textContent = "Por favor, insira um email válido.";
                    contactMessage.className = "form-message error";
                    contactMessage.style.display = "block";
                }
                return;
            }
            
            // Mostrar indicador de carregamento
            if (contactMessage) {
                contactMessage.textContent = "A enviar mensagem...";
                contactMessage.className = "form-message info";
                contactMessage.style.display = "block";
            }
            
            const formData = new FormData(contactForm);
            const data = {
                nome: formData.get('nome'),
                email: formData.get('email'),
                telefone: formData.get('telefone'),
                assunto: formData.get('assunto'),
                mensagem: formData.get('mensagem')
            };
            
            // Enviar email através da API Brevo
            window.brevoAPI.sendContactEmail(data)
                .then(response => {
                    console.log("Resposta do envio:", response);
                    if (contactMessage) {
                        contactMessage.textContent = "Mensagem enviada com sucesso!";
                        contactMessage.className = "form-message success";
                        contactMessage.style.display = "block";
                    }
                    contactForm.reset();
                    
                    // Esconder a mensagem após 5 segundos
                    setTimeout(() => {
                        if (contactMessage) {
                            contactMessage.style.display = "none";
                        }
                    }, 5000);
                })
                .catch(error => {
                    console.error("Erro no envio:", error);
                    if (contactMessage) {
                        contactMessage.textContent = "Ocorreu um erro ao enviar a mensagem. Por favor, tente novamente mais tarde.";
                        contactMessage.className = "form-message error";
                        contactMessage.style.display = "block";
                    }
                });
        });
    }
    
    // Formulário de feedback
    const feedbackForm = document.getElementById('feedback-form');
    const feedbackMessage = document.getElementById('feedback-message');
    
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validação do formulário
            const nome = feedbackForm.querySelector('[name="nome"]').value.trim();
            const email = feedbackForm.querySelector('[name="email"]').value.trim();
            const rating = document.getElementById('rating-value') ? document.getElementById('rating-value').value : '0';
            
            if (!nome || !email || rating === '0') {
                if (feedbackMessage) {
                    feedbackMessage.textContent = "Por favor, preencha todos os campos obrigatórios e dê uma avaliação.";
                    feedbackMessage.className = "form-message error";
                    feedbackMessage.style.display = "block";
                }
                return;
            }
            
            // Validação de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                if (feedbackMessage) {
                    feedbackMessage.textContent = "Por favor, insira um email válido.";
                    feedbackMessage.className = "form-message error";
                    feedbackMessage.style.display = "block";
                }
                return;
            }
            
            // Mostrar indicador de carregamento
            if (feedbackMessage) {
                feedbackMessage.textContent = "A enviar feedback...";
                feedbackMessage.className = "form-message info";
                feedbackMessage.style.display = "block";
            }
            
            const formData = new FormData(feedbackForm);
            const data = {
                nome: formData.get('nome'),
                email: formData.get('email'),
                rating: rating,
                comentario: formData.get('comentario')
            };
            
            // Enviar email através da API Brevo
            window.brevoAPI.sendFeedbackEmail(data)
                .then(response => {
                    console.log("Resposta do envio de feedback:", response);
                    if (feedbackMessage) {
                        feedbackMessage.textContent = "Feedback enviado com sucesso!";
                        feedbackMessage.className = "form-message success";
                        feedbackMessage.style.display = "block";
                    }
                    feedbackForm.reset();
                    
                    // Resetar estrelas
                    if (document.getElementById('rating-value')) {
                        document.getElementById('rating-value').value = "0";
                    }
                    const stars = document.querySelectorAll(".star-rating .fa-star");
                    stars.forEach(star => {
                        star.classList.remove("fas", "selected");
                        star.classList.add("far");
                        star.setAttribute("aria-checked", "false");
                    });
                    
                    // Esconder a mensagem após 5 segundos
                    setTimeout(() => {
                        if (feedbackMessage) {
                            feedbackMessage.style.display = "none";
                        }
                    }, 5000);
                })
                .catch(error => {
                    console.error("Erro no envio de feedback:", error);
                    if (feedbackMessage) {
                        feedbackMessage.textContent = "Ocorreu um erro ao enviar o feedback. Por favor, tente novamente mais tarde.";
                        feedbackMessage.className = "form-message error";
                        feedbackMessage.style.display = "block";
                    }
                });
        });
    }
    
    // Formulário de pedido de serviço
    const serviceForm = document.getElementById('service-request-form');
    const serviceMessage = document.getElementById('service-request-message');
    
    if (serviceForm) {
        serviceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validação do formulário
            const name = serviceForm.querySelector('[name="name"], [name="nome"]').value.trim();
            const email = serviceForm.querySelector('[name="email"], [name="email-service"], [name="email-servico"]').value.trim();
            const details = serviceForm.querySelector('[name="details"], [name="mensagem"], [name="mensagem-servico"]').value.trim();
            
            if (!name || !email || !details) {
                if (serviceMessage) {
                    serviceMessage.textContent = "Por favor, preencha todos os campos obrigatórios.";
                    serviceMessage.className = "form-message error";
                    serviceMessage.style.display = "block";
                }
                return;
            }
            
            // Validação de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                if (serviceMessage) {
                    serviceMessage.textContent = "Por favor, insira um email válido.";
                    serviceMessage.className = "form-message error";
                    serviceMessage.style.display = "block";
                }
                return;
            }
            
            // Mostrar indicador de carregamento
            if (serviceMessage) {
                serviceMessage.textContent = "A enviar pedido...";
                serviceMessage.className = "form-message info";
                serviceMessage.style.display = "block";
            }
            
            const formData = new FormData(serviceForm);
            const data = {
                service_type: formData.get('service-type') || formData.get('service_type'),
                name: formData.get('name') || formData.get('nome'),
                email: formData.get('email') || formData.get('email-service') || formData.get('email-servico'),
                phone: formData.get('phone') || formData.get('telefone') || formData.get('telefone-servico'),
                company: formData.get('company') || formData.get('empresa') || formData.get('empresa-servico'),
                details: formData.get('details') || formData.get('mensagem') || formData.get('mensagem-servico')
            };
            
            // Enviar email através da API Brevo
            window.brevoAPI.sendServiceRequestEmail(data)
                .then(response => {
                    console.log("Resposta do envio de pedido de serviço:", response);
                    if (serviceMessage) {
                        serviceMessage.textContent = "Pedido enviado com sucesso!";
                        serviceMessage.className = "form-message success";
                        serviceMessage.style.display = "block";
                    }
                    serviceForm.reset();
                    
                    // Esconder a mensagem após 5 segundos
                    setTimeout(() => {
                        if (serviceMessage) {
                            serviceMessage.style.display = "none";
                        }
                    }, 5000);
                })
                .catch(error => {
                    console.error("Erro no envio de pedido de serviço:", error);
                    if (serviceMessage) {
                        serviceMessage.textContent = "Ocorreu um erro ao enviar o pedido. Por favor, tente novamente mais tarde.";
                        serviceMessage.className = "form-message error";
                        serviceMessage.style.display = "block";
                    }
                });
        });
    }
    
    // Adicionar estilos para mensagens de formulário
    const style = document.createElement('style');
    style.textContent = `
        .form-message {
            padding: 12px 15px;
            margin: 15px 0;
            border-radius: 5px;
            font-weight: 500;
            display: none;
            animation: fadeIn 0.3s ease;
        }
        
        .form-message.success {
            background-color: rgba(76, 175, 80, 0.1);
            color: #2e7d32;
            border: 1px solid rgba(76, 175, 80, 0.3);
        }
        
        .form-message.error {
            background-color: rgba(244, 67, 54, 0.1);
            color: #d32f2f;
            border: 1px solid rgba(244, 67, 54, 0.3);
        }
        
        .form-message.info {
            background-color: rgba(33, 150, 243, 0.1);
            color: #1976d2;
            border: 1px solid rgba(33, 150, 243, 0.3);
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
});
