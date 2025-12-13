/**
 * Script para o formulário de contacto - Versão corrigida
 * Utiliza os utilitários centralizados do form-utils.js
 */

// Executar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function () {
  console.log('🔄 Inicializando formulário de contacto...');
  initContactForm();
});

/**
 * Inicializa o formulário de contacto
 */
function initContactForm() {
  // Inicializar o modal de contacto se não existir
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
    console.log('✅ Adicionando event listener ao botão de submissão...');

    // Remover event listeners existentes para evitar duplicação
    submitButton.removeEventListener('click', handleContactFormSubmit);

    // Adicionar novo event listener
    submitButton.addEventListener('click', handleContactFormSubmit);

    // Marcar que o event listener foi adicionado
    submitButton._hasClickListener = true;
  } else {
    console.warn('⚠️ Botão de submissão não encontrado. Tentando novamente em 500ms...');
    setTimeout(addSubmitButtonListener, 500);
  }
}

/**
 * Inicializa o modal de contacto
 */
function initContactModal() {
  // Verificar se o modal já existe no DOM
  if (!document.getElementById('contactModal')) {
    console.log('🔄 Criando modal de contacto...');

    // Criar o elemento do modal
    const modalHTML = `
        <!-- Modal de Contacto -->
        <div class="modal fade" id="contactModal" tabindex="-1" aria-labelledby="contactModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header" style="background-color: var(--primary-color, #bf9a33); color: var(--dark-color, #212529);">
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
        <div class="modal fade" id="contactModal" tabindex="-1" aria-labelledby="contactModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 16px;">
              <div class="modal-header border-0 pb-0">
                <h4 class="modal-title fw-bold text-dark mx-auto" id="contactModalLabel">Entre em Contacto</h4>
                <button type="button" class="btn-close position-absolute end-0 top-0 m-3" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body px-4 pt-4">
                <form id="contactForm" enctype="multipart/form-data">
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label for="name" class="form-label text-muted small fw-bold text-uppercase">Nome *</label>
                      <input type="text" class="form-control bg-light border-0 py-2" id="name" name="name" style="border-radius: 8px;" required>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label for="reason" class="form-label text-muted small fw-bold text-uppercase">Motivo *</label>
                      <select class="form-select bg-light border-0 py-2" id="reason" name="reason" style="border-radius: 8px;" required>
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
                      <label for="email" class="form-label text-muted small fw-bold text-uppercase">Email *</label>
                      <input type="email" class="form-control bg-light border-0 py-2" id="email" name="email" style="border-radius: 8px;" required>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label for="phone" class="form-label text-muted small fw-bold text-uppercase">Telefone</label>
                      <input type="tel" class="form-control bg-light border-0 py-2" id="phone" name="phone" pattern="[0-9]{9}" placeholder="912345678" style="border-radius: 8px;">
                    </div>
                  </div>
                  

                  
                  <div class="mb-3">
                    <label for="message" class="form-label text-muted small fw-bold text-uppercase">Mensagem *</label>
                    <textarea class="form-control bg-light border-0 py-3" id="message" name="message" rows="5" style="border-radius: 8px;" required></textarea>
                  </div>
                  
                  <div class="mb-3">
                    <label for="attachment" class="form-label text-muted small fw-bold text-uppercase">Anexo (opcional)</label>
                    <input type="file" class="form-control bg-light border-0" id="attachment" name="attachment" style="border-radius: 8px;">
                  </div>
                  
                  <div class="form-check mb-4">
                    <input class="form-check-input" type="checkbox" id="privacyPolicy" required>
                    <label class="form-check-label small text-muted" for="privacyPolicy">
                      Aceito a <a href="pages/politica-privacidade.html" target="_blank" class="text-decoration-none text-primary">Política de Privacidade</a> *
                    </label>
                  </div>
                  
                  <div class="alert alert-success d-none shadow-sm border-0" id="contactSuccess" style="border-radius: 8px;">
                    <i class="fas fa-check-circle me-2"></i> Mensagem enviada com sucesso!
                  </div>
                  
                  <div class="alert alert-danger d-none shadow-sm border-0" id="contactError" style="border-radius: 8px;">
                    <i class="fas fa-exclamation-circle me-2"></i> Erro ao enviar mensagem.
                  </div>
                </form>
              </div>
              <div class="modal-footer border-0 pt-0 pb-4 px-4">
                <button type="button" class="btn btn-light text-muted fw-bold px-4" data-bs-dismiss="modal" style="border-radius: 8px;">Cancelar</button>
                <button type="button" class="btn btn-primary fw-bold px-4 shadow-sm" id="submitContact" style="border-radius: 8px; background-color: var(--primary-color); border: none;">Enviar Mensagem</button>
              </div>
            </div>
          </div>
        </div>`;

    // Adicionar o modal ao DOM (sem wrapper extra)
    document.body.insertAdjacentHTML('beforeend', modalHTML);

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
      contactForm.addEventListener('submit', function (event) {
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
  console.log('🔄 Configurando botões de contacto...');

  // Selecionar todos os botões/links que devem abrir o modal de contacto
  const contactButtons = document.querySelectorAll('a[href*="#contactos"], .btn-secondary');

  contactButtons.forEach(button => {
    button.addEventListener('click', function (event) {
      // Verificar se o link é para a secção de contactos
      if (this.getAttribute('href') === 'index.html#contactos' ||
        this.getAttribute('href') === '#contactos' ||
        (this.classList.contains('btn-secondary') && this.textContent.includes('Contacto'))) {
        event.preventDefault();
        console.log('👆 Botão de contacto clicado!');

        // Abrir o modal
        const bs = (typeof window.bootstrap !== 'undefined') ? window.bootstrap : ((typeof bootstrap !== 'undefined') ? bootstrap : null);

        if (bs) {
          const contactModal = document.getElementById('contactModal');
          if (contactModal) {
            const modal = new bs.Modal(contactModal);
            modal.show();
            console.log('✅ Modal aberto');
          } else {
            console.error('❌ Elemento contactModal não encontrado no DOM');
          }
        } else {
          console.error('❌ Bootstrap não encontrado');
        }
      }
    });
  });
}

/**
 * Manipula a submissão do formulário de contacto
 */
function handleContactFormSubmit() {
  console.log('🔄 Processando submissão do formulário...');

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
  window.formUtils.setButtonLoading(submitButton, true, 'A enviar...');

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
    subject: formData.get('reason'), // Usar o motivo como assunto
    message: formData.get('message'),
    hasAttachment: formData.get('attachment') && formData.get('attachment').size > 0
  };

  console.log('📝 Dados do formulário:', contactData);

  // Verificar se há anexo
  const attachment = formData.get('attachment');
  if (attachment && attachment.size > 0) {
    // Verificar tamanho do anexo (máximo 5MB)
    if (attachment.size > 5 * 1024 * 1024) {
      document.getElementById('contactError').textContent = 'O anexo excede o tamanho máximo permitido (5MB).';
      document.getElementById('contactError').classList.remove('d-none');
      window.formUtils.setButtonLoading(submitButton, false, originalButtonText);
      return;
    }

    // Converter anexo para base64 para envio
    const reader = new FileReader();
    reader.readAsDataURL(attachment);
    reader.onload = function () {
      contactData.attachmentBase64 = reader.result.split(',')[1];
      contactData.attachmentName = attachment.name;
      contactData.attachmentType = attachment.type;

      // Enviar dados com anexo
      sendContactData(contactData, submitButton, originalButtonText);
    };
    reader.onerror = function () {
      document.getElementById('contactError').textContent = 'Erro ao processar o anexo. Por favor, tente novamente.';
      document.getElementById('contactError').classList.remove('d-none');
      window.formUtils.setButtonLoading(submitButton, false, originalButtonText);
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
  console.log('📤 Enviando dados para o backend...');

  // Utilizar a integração Brevo para enviar o email
  if (window.brevoIntegration && typeof window.brevoIntegration.sendContactEmail === 'function') {
    console.log('🔄 Utilizando integração Brevo...');

    window.brevoIntegration.sendContactEmail(data)
      .then(response => {
        console.log('✅ Resposta do backend:', response);

        // Mostrar mensagem de sucesso
        document.getElementById('contactSuccess').classList.remove('d-none');

        // Limpar formulário
        document.getElementById('contactForm').reset();

        // Restaurar botão
        window.formUtils.setButtonLoading(submitButton, false, originalButtonText);

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
        console.error('❌ Erro ao enviar mensagem:', error);

        // Mostrar mensagem de erro
        const errorElement = document.getElementById('contactError');
        errorElement.textContent = 'Erro ao enviar mensagem: ' + (error.message || 'Tente novamente mais tarde.');
        errorElement.classList.remove('d-none');

        // Restaurar botão
        window.formUtils.setButtonLoading(submitButton, false, originalButtonText);
      });
  } else {
    console.log('⚠️ Integração Brevo não disponível, utilizando fetch API...');

    // Fallback se a integração não estiver disponível
    fetch(window.formUtils.backendUrls.brevo.contact, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
        console.log('✅ Resposta do backend:', data);

        // Mostrar mensagem de sucesso
        document.getElementById('contactSuccess').classList.remove('d-none');

        // Limpar formulário
        document.getElementById('contactForm').reset();

        // Restaurar botão
        window.formUtils.setButtonLoading(submitButton, false, originalButtonText);

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
        console.error('❌ Erro ao enviar mensagem:', error);

        // Mostrar mensagem de erro
        const errorElement = document.getElementById('contactError');
        errorElement.textContent = 'Erro ao enviar mensagem: ' + (error.message || 'Tente novamente mais tarde.');
        errorElement.classList.remove('d-none');

        // Restaurar botão
        window.formUtils.setButtonLoading(submitButton, false, originalButtonText);
      });
  }
}
