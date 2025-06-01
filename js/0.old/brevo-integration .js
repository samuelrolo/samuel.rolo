/**
 * Integração com a API da Brevo - Share2Inspire
 * 
 * Este ficheiro contém o código para integração com a API da Brevo
 * para envio de emails de confirmação e notificações
 */

// Namespace para a integração com a Brevo
window.brevoSDK = (function() {
    // Configurações da API
    const API_BASE_URL = 'https://share2inspire-beckend.lm.r.appspot.com/api/email';
    
    /**
     * Envia email de confirmação de reserva
     * @param {Object} data - Dados da reserva
     * @returns {Promise} - Promise com o resultado da operação
     */
    function sendBookingConfirmation(data) {
        console.log('Enviando email de confirmação de reserva via Brevo:', data);
        
        // Determinar o tipo de serviço para incluir no assunto
        let serviceType = data.service || 'Reserva';
        
        // Preparar dados para o endpoint contact-form
        const emailData = {
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            subject: `Reserva: ${serviceType}`,
            message: `
                Detalhes da Reserva:
                Serviço: ${data.service || ''}
                Nome: ${data.name || ''}
                Email: ${data.email || ''}
                Telefone: ${data.phone || ''}
                Data: ${data.date || ''}
                Formato: ${data.format || ''}
                Duração: ${data.duration || ''}
                Método de Pagamento: ${data.paymentMethod || ''}
                Valor: ${data.amount || ''}€
            `,
            reason: 'Reserva de Serviço',
            source: data.source || 'website_service_booking'
        };
        
        // Enviar dados para o endpoint contact-form
        const endpoint = `${API_BASE_URL}/contact-form`;
        
        // Enviar dados para o backend
        return fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://share2inspire.pt',
                'Accept': 'application/json'
            },
            body: JSON.stringify(emailData)
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('Erro na resposta do servidor (Brevo):', response.status, text);
                    throw new Error('Erro na resposta do servidor (Brevo): ' + response.status);
                });
            }
            return response.json();
        })
        .then(responseData => {
            console.log('Email enviado com sucesso via Brevo:', responseData);
            return responseData;
        })
        .catch(error => {
            console.error('Erro ao enviar email via Brevo:', error);
            throw error;
        });
    }
    
    /**
     * Envia email de contacto
     * @param {Object} data - Dados do formulário de contacto
     * @returns {Promise} - Promise com o resultado da operação
     */
    function sendContactEmail(data) {
        console.log('Enviando email de contacto via Brevo:', data);
        
        // Endpoint para formulário de contacto
        const endpoint = `${API_BASE_URL}/contact-form`;
        
        // Enviar dados para o backend
        return fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://share2inspire.pt',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('Erro na resposta do servidor (Brevo):', response.status, text);
                    throw new Error('Erro na resposta do servidor (Brevo): ' + response.status);
                });
            }
            return response.json();
        })
        .then(responseData => {
            console.log('Email de contacto enviado com sucesso via Brevo:', responseData);
            return responseData;
        })
        .catch(error => {
            console.error('Erro ao enviar email de contacto via Brevo:', error);
            throw error;
        });
    }
    
    /**
     * Envia email de inscrição na newsletter
     * @param {Object} data - Dados do formulário de newsletter
     * @returns {Promise} - Promise com o resultado da operação
     */
    function sendNewsletterSubscription(data) {
        console.log('Enviando inscrição na newsletter via Brevo:', data);
        
        // Preparar dados para o endpoint contact-form
        const emailData = {
            name: data.name || '',
            email: data.email || '',
            subject: 'Inscrição na Newsletter',
            message: `Inscrição na newsletter:
                Nome: ${data.name || ''}
                Email: ${data.email || ''}
            `,
            reason: 'Newsletter',
            source: data.source || 'website_newsletter'
        };
        
        // Endpoint para formulário de contacto
        const endpoint = `${API_BASE_URL}/contact-form`;
        
        // Enviar dados para o backend
        return fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://share2inspire.pt',
                'Accept': 'application/json'
            },
            body: JSON.stringify(emailData)
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('Erro na resposta do servidor (Brevo):', response.status, text);
                    throw new Error('Erro na resposta do servidor (Brevo): ' + response.status);
                });
            }
            return response.json();
        })
        .then(responseData => {
            console.log('Inscrição na newsletter enviada com sucesso via Brevo:', responseData);
            return responseData;
        })
        .catch(error => {
            console.error('Erro ao enviar inscrição na newsletter via Brevo:', error);
            throw error;
        });
    }
    
    // API pública
    return {
        sendBookingConfirmation,
        sendContactEmail,
        sendNewsletterSubscription
    };
})();

// Inicializar formulários com integração Brevo quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar todos os formulários com a classe brevo-form
    const brevoForms = document.querySelectorAll('.brevo-form');
    
    brevoForms.forEach(form => {
        // Verificar se é um formulário de contacto ou newsletter
        const isContactForm = form.id === 'contactForm';
        const isNewsletterForm = form.id === 'newsletterForm';
        
        // Se não for um formulário de reserva (já tratado em kickstart-pro-form.js)
        if (isContactForm || isNewsletterForm) {
            form.addEventListener('submit', function(e) {
                // Não prevenir o comportamento padrão para formulários de reserva
                // pois estes são tratados nos seus próprios scripts
                if (form.id !== 'kickstartForm' && 
                    form.id !== 'consultoriaForm' && 
                    form.id !== 'coachingForm' && 
                    form.id !== 'workshopsForm') {
                    e.preventDefault();
                    
                    // Obter dados do formulário
                    const formData = new FormData(form);
                    const data = {};
                    
                    // Converter FormData para objeto
                    for (const [key, value] of formData.entries()) {
                        data[key] = value;
                    }
                    
                    // Enviar dados para a API da Brevo
                    if (isContactForm) {
                        window.brevoSDK.sendContactEmail(data)
                            .then(response => {
                                // Mostrar mensagem de sucesso
                                const formMessage = form.querySelector('.form-message') || document.createElement('div');
                                formMessage.className = 'form-message mt-3';
                                formMessage.innerHTML = `
                                    <div class="alert alert-success">
                                        Mensagem enviada com sucesso! Entraremos em contacto em breve.
                                    </div>
                                `;
                                
                                if (!form.querySelector('.form-message')) {
                                    form.appendChild(formMessage);
                                }
                                
                                // Resetar formulário
                                form.reset();
                            })
                            .catch(error => {
                                // Mostrar mensagem de erro
                                const formMessage = form.querySelector('.form-message') || document.createElement('div');
                                formMessage.className = 'form-message mt-3';
                                formMessage.innerHTML = `
                                    <div class="alert alert-danger">
                                        Erro ao enviar mensagem: ${error.message || 'Erro desconhecido'}. 
                                        Por favor tente novamente ou contacte-nos diretamente.
                                    </div>
                                `;
                                
                                if (!form.querySelector('.form-message')) {
                                    form.appendChild(formMessage);
                                }
                            });
                    } else if (isNewsletterForm) {
                        window.brevoSDK.sendNewsletterSubscription(data)
                            .then(response => {
                                // Mostrar mensagem de sucesso
                                const formMessage = form.querySelector('.form-message') || document.createElement('div');
                                formMessage.className = 'form-message mt-3';
                                formMessage.innerHTML = `
                                    <div class="alert alert-success">
                                        Inscrição na newsletter realizada com sucesso!
                                    </div>
                                `;
                                
                                if (!form.querySelector('.form-message')) {
                                    form.appendChild(formMessage);
                                }
                                
                                // Resetar formulário
                                form.reset();
                            })
                            .catch(error => {
                                // Mostrar mensagem de erro
                                const formMessage = form.querySelector('.form-message') || document.createElement('div');
                                formMessage.className = 'form-message mt-3';
                                formMessage.innerHTML = `
                                    <div class="alert alert-danger">
                                        Erro ao processar inscrição: ${error.message || 'Erro desconhecido'}. 
                                        Por favor tente novamente.
                                    </div>
                                `;
                                
                                if (!form.querySelector('.form-message')) {
                                    form.appendChild(formMessage);
                                }
                            });
                    }
                }
            });
        }
    });
});
