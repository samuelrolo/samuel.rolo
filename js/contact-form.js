/**
 * Script para o formulário de contacto - Versão robusta
 * Share2Inspire - Dezembro 2025
 * Funciona tanto com modais existentes quanto com modais criados dinamicamente
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
  // Verificar se o modal já existe no DOM
  const existingModal = document.getElementById('contactModal');

  if (existingModal) {
    console.log('✅ Modal de contacto já existe no DOM');
    setupExistingContactForm();
  } else {
    console.log('🔄 Criando modal de contacto dinâmico...');
    createDynamicContactModal();
  }
}

/**
 * Configura o formulário de contacto existente
 */
function setupExistingContactForm() {
  const form = document.getElementById('contactForm');

  if (form) {
    // Remover event listeners existentes para evitar duplicação
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    // Adicionar novo submit handler
    newForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      await handleFormSubmit(this);
    });

    console.log('✅ Event listener adicionado ao formulário existente');
  }
}

/**
 * Cria modal de contacto dinâmico
 */
function createDynamicContactModal() {
  const modalHTML = `
    <div class="modal fade" id="contactModal" tabindex="-1" aria-labelledby="contactModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 16px;">
          <div class="modal-header border-0 pb-0">
            <h4 class="modal-title fw-bold text-white mx-auto" id="contactModalLabel">Entre em Contacto</h4>
            <button type="button" class="btn-close btn-close-white position-absolute end-0 top-0 m-3" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body px-4 pt-4">
            <form id="contactForm">
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
              <div class="form-check mb-4">
                <input class="form-check-input" type="checkbox" id="privacy" name="privacy" required>
                <label class="form-check-label small text-muted" for="privacy">
                  Aceito a <a href="pages/politica-privacidade.html" target="_blank" class="text-decoration-none" style="color: #BF9A33;">Política de Privacidade</a> *
                </label>
              </div>
              <div class="alert alert-success d-none" id="contactSuccess" style="border-radius: 8px;">
                <i class="fas fa-check-circle me-2"></i> Mensagem enviada com sucesso!
              </div>
              <div class="alert alert-danger d-none" id="contactError" style="border-radius: 8px;">
                <i class="fas fa-exclamation-circle me-2"></i> Erro ao enviar mensagem.
              </div>
              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-light text-muted fw-bold px-4" data-bs-dismiss="modal" style="border-radius: 8px;">Cancelar</button>
                <button type="submit" class="btn fw-bold px-4 shadow-sm text-white" style="border-radius: 8px; background-color: #BF9A33; border: none;">Enviar Mensagem</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
  setupExistingContactForm();
}

/**
 * Processa a submissão do formulário
 */
async function handleFormSubmit(form) {
  console.log('🔄 Processando submissão do formulário...');

  // Validar formulário
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // Verificar privacidade
  const privacyCheck = form.querySelector('#privacy, [name="privacy"]');
  if (privacyCheck && !privacyCheck.checked) {
    alert('Por favor, aceite a Política de Privacidade para continuar.');
    return;
  }

  // Encontrar botão de submit
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn ? submitBtn.innerHTML : '';

  // Esconder mensagens anteriores
  const successMsg = form.querySelector('#contactSuccess') || document.getElementById('contactSuccess');
  const errorMsg = form.querySelector('#contactError') || document.getElementById('contactError');
  if (successMsg) successMsg.classList.add('d-none');
  if (errorMsg) errorMsg.classList.add('d-none');

  // Mostrar loading
  if (submitBtn) {
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>A enviar...';
    submitBtn.disabled = true;
  }

  // Recolher dados
  const formData = new FormData(form);
  const contactData = {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') || '',
    reason: formData.get('reason') || 'Contacto Geral',
    subject: formData.get('subject') || formData.get('reason') || 'Contacto via Website',
    message: formData.get('message')
  };

  console.log('📝 Dados do formulário:', contactData);

  try {
    const response = await fetch('https://share2inspire-beckend.lm.r.appspot.com/api/feedback/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(contactData)
    });

    const result = await response.json();
    console.log('📨 Resposta do servidor:', result);

    if (response.ok && result.status !== 'error') {
      // Sucesso
      if (successMsg) {
        successMsg.classList.remove('d-none');
        successMsg.innerHTML = '<i class="fas fa-check-circle me-2"></i> Mensagem enviada com sucesso!';
      } else {
        alert('Mensagem enviada com sucesso!');
      }
      form.reset();

      // Fechar modal após 3 segundos
      setTimeout(() => {
        const modalEl = document.getElementById('contactModal');
        if (modalEl && typeof bootstrap !== 'undefined') {
          const modal = bootstrap.Modal.getInstance(modalEl);
          if (modal) modal.hide();
        }
        if (successMsg) successMsg.classList.add('d-none');
      }, 3000);
    } else {
      throw new Error(result.error || result.message || 'Erro ao enviar mensagem');
    }
  } catch (error) {
    console.error('❌ Erro ao enviar:', error);
    if (errorMsg) {
      errorMsg.innerHTML = '<i class="fas fa-exclamation-circle me-2"></i> Erro ao enviar mensagem: ' + error.message;
      errorMsg.classList.remove('d-none');
    } else {
      alert('Erro ao enviar mensagem: ' + error.message);
    }
  } finally {
    // Restaurar botão
    if (submitBtn) {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }
}
