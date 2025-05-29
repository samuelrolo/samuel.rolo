/**
 * Script para o formulário de contacto - Versão corrigida
 * Garante que o botão de envio funcione corretamente
 */

// Executar imediatamente para garantir que o script seja carregado
(function() {
    // Verificar se o DOM já está carregado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initContactForm);
    } else {
        // DOM já está carregado
        initContactForm();
    }
    
    // Adicionar um fallback para garantir que o script seja inicializado
    window.addEventListener('load', function() {
        // Verificar se o modal já foi inicializado
        if (!document.getElementById('contactModal')) {
            initContactForm();
        }
        
        // Verificar se o event listener do botão já foi adicionado
        const submitButton = document.getElementById('submitContact');
        if (submitButton && !submitButton._hasClickListener) {
            addSubmitButtonListener();
        }
    });
})();

/**
 * Inicializa o formulário de contacto
 */
function initContactForm() {
    console.log('Inicializando formulário de contacto...');
    
    // Inicializar o modal de contacto
    initContactModal();
    
    // Adicionar event listeners para os botões de contacto
    setupContactButtons();
    
    // Garantir que o event listener do botão de submissão seja adicionado
    setTimeout(addSubmitButtonListener, 500);
}

/**
 * Adiciona o event listener ao botão de submissão
 */
function addSubmitButtonListener() {
    const submitButton = document.getElementById('submitContact');
    if (submitButton) {
        console.log('Adicionando event listener ao botão de submissão...');
        
        // Remover event listeners existentes para evitar duplicação
        submitButton.removeEventListener('click', handleContactFormSubmit);
        
        // Adicionar novo event listener
        submitButton.addEventListener('click', handleContactFormSubmit);
        
        // Marcar que o event listener foi adicionado
        submitButton._hasClickListener = true;
    } else {
        console.warn('Botão de submissão não encontrado. Tentando novamente em 500ms...');
        setTimeout(addSubmitButtonListener, 500);
    }
}

/**
 * Inicializa o modal de contacto
 */
function initContactModal() {
    // Verificar se o modal já existe no DOM
    if (!document.getElementById('contactModal')) {
        console.log('Criando modal de contacto...');
        
        // Criar o elemento do modal
        const modalHTML = `
        <!-- Modal de Contacto -->
        <div class="modal fade" id="contactModal" tabindex="-1" aria-labelledby="contactModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header" style="background-color: var(--primary-color); color: var(--dark-color);">
                <h5 class="modal-title" id="contactModalLabel">Entre em Contacto</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <form id="contactForm" enctype="multipart/form-data">
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label for="name" class="form-label">Nome *</label>
                      <input type="text" class="form-control" id="name" name="name" required>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label for="reason" class="form-label">Motivo *</label>
                      <select class="form-select" id="reason" name="reason" required>
                        <option value="" selected disabled>Selecione um motivo</option>
                        <option value="Informações">Informações</option>
                        <option value="Orçamento">Orçamento</option>
                        <option value="Parceria">Parceria</option>
                        <option value="Sugestão">Sugestão</option>
                        <option value="Reclamação">Reclamação</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                  </div>
                  
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label for="email" class="form-label">Email *</label>
                      <input type="email" class="form-control" id="email" name="email" required>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label for="phone" class="form-label">Número de Telefone</label>
                      <input type="tel" class="form-control" id="phone" name="phone" pattern="[0-9]{9}" placeholder="912345678">
                      <small class="text-muted">Formato: 9 dígitos sem espaços</small>
                    </div>
                  </div>
                  
                  <div class="mb-3">
                    <label for="subject" class="form-label">Assunto *</label>
                    <input type="text" class="form-control" id="subject" name="subject" required>
                  </div>
                  
                  <div class="mb-3">
                    <label for="message" class="form-label">Mensagem *</label>
                    <textarea class="form-control" id="message" name="message" rows="5" required></textarea>
                  </div>
                  
                  <div class="mb-3">
                    <label for="attachment" class="form-label">Anexo (opcional)</label>
                    <input type="file" class="form-control" id="attachment" name="attachment">
                    <small class="text-muted">Formatos aceites: PDF, DOC, DOCX, JPG, PNG (máx. 5MB)</small>
                  </div>
                  
                  <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" id="privacyPolicy" required>
                    <label class="form-check-label" for="privacyPolicy">
                      Li e aceito a <a href="pages/politica-privacidade.html" target="_blank">Política de Privacidade</a> *
                    </label>
                  </div>
                  
                  <div class="alert alert-success d-none" id="contactSuccess">
                    <i class="fas fa-check-circle me-2"></i> A sua mensagem foi enviada com sucesso! Entraremos em contacto brevemente.
                  </div>
                  
                  <div class="alert alert-danger d-none" id="contactError">
                    <i class="fas fa-exclamation-circle me-2"></i> Ocorreu um erro ao enviar a mensagem. Por favor, tente novamente.
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-primary" id="submitContact">Enviar Mensagem</button>
              </div>
            </div>
          </div>
        </div>`;
        
        // Adicionar o modal ao DOM
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        
        // Inicializar o modal Bootstrap
        if (typeof bootstrap !== 'undefined') {
            const contactModal = document.getElementById('contactModal');
            if (contactModal) {
                new bootstrap.Modal(contactModal);
            }
        }
        
        // Adicionar event listener para o botão de submissão
        setTimeout(addSubmitButtonListener, 100);
        
        // Adicionar validação de formulário
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', function(event) {
                event.preventDefault();
                handleContactFormSubmit();
            });
        }
    }
}

/**
 * Configura os botões que abrem o modal de contacto
 */
function setupContactButtons() {
    console.log('Configurando botões de contacto...');
    
    // Selecionar todos os botões/links que devem abrir o modal de contacto
    const contactButtons = document.querySelectorAll('a[href*="#contactos"], .btn-secondary');
    
    contactButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            // Verificar se o link é para a secção de contactos
            if (this.getAttribute('href') === 'index.html#contactos' || 
                this.getAttribute('href') === '#contactos' ||
                (this.classList.contains('btn-secondary') && this.textContent.includes('Contacto'))) {
                event.preventDefault();
                
                // Abrir o modal
                if (typeof bootstrap !== 'undefined') {
                    const contactModal = document.getElementById('contactModal');
                    if (contactModal) {
                        const modal = new bootstrap.Modal(contactModal);
                        modal.show();
                    }
                }
            }
        });
    });
}

/**
 * Manipula a submissão do formulário de contacto
 */
function handleContactFormSubmit() {
    console.log('Processando submissão do formulário...');
    
    // Verificar se o formulário é válido
    const form = document.getElementById('contactForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Verificar se a política de privacidade foi aceite
    const privacyPolicy = document.getElementById('privacyPolicy');
    if (!privacyPolicy.checked) {
        alert('Por favor, aceite a Política de Privacidade para continuar.');
        return;
    }
    
    // Mostrar indicador de carregamento
    const submitButton = document.getElementById('submitContact');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A enviar...';
    submitButton.disabled = true;
    
    // Esconder mensagens anteriores
    document.getElementById('contactSuccess').classList.add('d-none');
    document.getElementById('contactError').classList.add('d-none');
    
    // Recolher dados do formulário
    const formData = new FormData(form);
    
    // Converter para objeto para envio via API
    const contactData = {
        name: formData.get('name'),
        reason: formData.get('reason'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        subject: formData.get('subject'),
        message: formData.get('message'),
        hasAttachment: formData.get('attachment') && formData.get('attachment').size > 0
    };
    
    console.log('Dados do formulário:', contactData);
    
    // Verificar se há anexo
    const attachment = formData.get('attachment');
    if (attachment && attachment.size > 0) {
        // Verificar tamanho do anexo (máximo 5MB)
        if (attachment.size > 5 * 1024 * 1024) {
            document.getElementById('contactError').textContent = 'O anexo excede o tamanho máximo permitido (5MB).';
            document.getElementById('contactError').classList.remove('d-none');
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
            return;
        }
        
        // Converter anexo para base64 para envio
        const reader = new FileReader();
        reader.readAsDataURL(attachment);
        reader.onload = function() {
            contactData.attachmentBase64 = reader.result.split(',')[1];
            contactData.attachmentName = attachment.name;
            contactData.attachmentType = attachment.type;
            
            // Enviar dados com anexo
            sendContactData(contactData, submitButton, originalButtonText);
        };
        reader.onerror = function() {
            document.getElementById('contactError').textContent = 'Erro ao processar o anexo. Por favor, tente novamente.';
            document.getElementById('contactError').classList.remove('d-none');
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        };
    } else {
        // Enviar dados sem anexo
        sendContactData(contactData, submitButton, originalButtonText);
    }
}

/**
 * Envia os dados do formulário de contacto para o backend
 * @param {Object} data - Dados do contacto
 * @param {HTMLElement} submitButton - Botão de submissão
 * @param {string} originalButtonText - Texto original do botão
 */
function sendContactData(data, submitButton, originalButtonText) {
    console.log('Enviando dados para o backend...');
    
    // Utilizar a função do SDK da Brevo para enviar o email
    if (window.brevoSDK && typeof window.brevoSDK.sendContactConfirmation === 'function') {
        console.log('Utilizando SDK da Brevo...');
        
        window.brevoSDK.sendContactConfirmation(data)
            .then(response => {
                console.log('Resposta do backend:', response);
                
                // Mostrar mensagem de sucesso
                document.getElementById('contactSuccess').classList.remove('d-none');
                
                // Limpar formulário
                document.getElementById('contactForm').reset();
                
                // Restaurar botão
                submitButton.innerHTML = originalButtonText;
                submitButton.disabled = false;
                
                // Fechar modal após 3 segundos
                setTimeout(() => {
                    if (typeof bootstrap !== 'undefined') {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('contactModal'));
                        if (modal) {
                            modal.hide();
                        }
                    }
                }, 3000);
            })
            .catch(error => {
                console.error('Erro ao enviar mensagem:', error);
                
                // Mostrar mensagem de erro
                const errorElement = document.getElementById('contactError');
                errorElement.textContent = 'Erro ao enviar mensagem: ' + (error.message || 'Tente novamente mais tarde.');
                errorElement.classList.remove('d-none');
                
                // Restaurar botão
                submitButton.innerHTML = originalButtonText;
                submitButton.disabled = false;
            });
    } else {
        console.log('SDK da Brevo não disponível, utilizando fetch API...');
        
        // Fallback se o SDK não estiver disponível
        fetch('https://share2inspire-beckend.lm.r.appspot.com/api/email/contact-confirmation', {
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
                throw new Error('Erro ao enviar email: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log('Resposta do backend:', data);
            
            // Mostrar mensagem de sucesso
            document.getElementById('contactSuccess').classList.remove('d-none');
            
            // Limpar formulário
            document.getElementById('contactForm').reset();
            
            // Restaurar botão
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
            
            // Fechar modal após 3 segundos
            setTimeout(() => {
                if (typeof bootstrap !== 'undefined') {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('contactModal'));
                    if (modal) {
                        modal.hide();
                    }
                }
            }, 3000);
        })
        .catch(error => {
            console.error('Erro ao enviar mensagem:', error);
            
            // Mostrar mensagem de erro
            const errorElement = document.getElementById('contactError');
            errorElement.textContent = 'Erro ao enviar mensagem: ' + (error.message || 'Tente novamente mais tarde.');
            errorElement.classList.remove('d-none');
            
            // Restaurar botão
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        });
    }
}
