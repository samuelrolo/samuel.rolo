/**
 * Script para o formulário de contacto - Versão corrigida e simplificada
 * Share2Inspire - Dezembro 2025
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
}

/**
 * Inicializa o modal de contacto
 */
function initContactModal() {
  // Verificar se o modal já existe no DOM
  if (document.getElementById('contactModal')) {
    console.log('✅ Modal de contacto já existe no DOM');
    setupContactFormSubmit();
    return;
  }

  console.log('🔄 Criando modal de contacto...');

  // Criar o elemento do modal
  const modalHTML = `
    <!-- Modal de Contacto -->
    <div class="modal fade" id="contactModal" tabindex="-1" aria-labelledby="contactModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 16px;">
          <div class="modal-header border-0 pb-0" style="background-color: #BF9A33;">
            <h4 class="modal-title fw-bold text-white mx-auto" id="contactModalLabel">Entre em Contacto</h4>
            <button type="button" class="btn-close btn-close-white position-absolute end-0 top-0 m-3" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body px-4 pt-4">
            <form id="contactFormDynamic">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="contactName" class="form-label text-muted small fw-bold text-uppercase">Nome *</label>
                  <input type="text" class="form-control bg-light border-0 py-2" id="contactName" name="name" style="border-radius: 8px;" required>
                </div>
                <div class="col-md-6 mb-3">
                  <label for="contactReason" class="form-label text-muted small fw-bold text-uppercase">Motivo *</label>
                  <select class="form-select bg-light border-0 py-2" id="contactReason" name="reason" style="border-radius: 8px;" required>
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
                  <label for="contactEmail" class="form-label text-muted small fw-bold text-uppercase">Email *</label>
                  <input type="email" class="form-control bg-light border-0 py-2" id="contactEmail" name="email" style="border-radius: 8px;" required>
                </div>
                <div class="col-md-6 mb-3">
                  <label for="contactPhone" class="form-label text-muted small fw-bold text-uppercase">Telefone</label>
                  <input type="tel" class="form-control bg-light border-0 py-2" id="contactPhone" name="phone" pattern="[0-9]{9}" placeholder="912345678" style="border-radius: 8px;">
                </div>
              </div>
              
              <div class="mb-3">
                <label for="contactMessage" class="form-label text-muted small fw-bold text-uppercase">Mensagem *</label>
                <textarea class="form-control bg-light border-0 py-3" id="contactMessage" name="message" rows="5" style="border-radius: 8px;" required></textarea>
              </div>
              
              <div class="form-check mb-4">
                <input class="form-check-input" type="checkbox" id="contactPrivacy" required>
                <label class="form-check-label small text-muted" for="contactPrivacy">
                  Aceito a <a href="pages/politica-privacidade.html" target="_blank" class="text-decoration-none" style="color: #BF9A33;">Política de Privacidade</a> *
                </label>
              </div>
              
              <div class="alert alert-success d-none shadow-sm border-0" id="contactSuccessMsg" style="border-radius: 8px;">
                <i class="fas fa-check-circle me-2"></i> Mensagem enviada com sucesso!
              </div>
              
              <div class="alert alert-danger d-none shadow-sm border-0" id="contactErrorMsg" style="border-radius: 8px;">
                <i class="fas fa-exclamation-circle me-2"></i> Erro ao enviar mensagem.
              </div>
            </form>
          </div>
          <div class="modal-footer border-0 pt-0 pb-4 px-4">
            <button type="button" class="btn btn-light text-muted fw-bold px-4" data-bs-dismiss="modal" style="border-radius: 8px;">Cancelar</button>
            <button type="button" class="btn fw-bold px-4 shadow-sm text-white" id="submitContactBtn" style="border-radius: 8px; background-color: #BF9A33; border: none;">Enviar Mensagem</button>
          </div>
        </div>
      </div>
    </div>`;

  // Adicionar o modal ao DOM
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Configurar o formulário
  setupContactFormSubmit();
}

/**
 * Configura o handler de submissão do formulário
 */
function setupContactFormSubmit() {
  const submitBtn = document.getElementById('submitContactBtn') || document.getElementById('submitContact');
  const form = document.getElementById('contactFormDynamic') || document.getElementById('contactForm');

  if (submitBtn && form) {
    submitBtn.addEventListener('click', function (e) {
      e.preventDefault();
      handleContactSubmit(form, submitBtn);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      handleContactSubmit(form, submitBtn);
    });

    console.log('✅ Event listeners adicionados ao formulário de contacto');
  }
}

/**
 * Processa a submissão do formulário
 */
async function handleContactSubmit(form, submitBtn) {
  console.log('🔄 Processando submissão do formulário...');

  // Validar formulário
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // Verificar privacidade
  const privacyCheck = form.querySelector('[id*="Privacy"]');
  if (privacyCheck && !privacyCheck.checked) {
    alert('Por favor, aceite a Política de Privacidade para continuar.');
    return;
  }

  // Esconder mensagens anteriores
  const successMsg = document.getElementById('contactSuccessMsg') || document.getElementById('contactSuccess');
  const errorMsg = document.getElementById('contactErrorMsg') || document.getElementById('contactError');
  if (successMsg) successMsg.classList.add('d-none');
  if (errorMsg) errorMsg.classList.add('d-none');

  // Mostrar loading
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>A enviar...';
  submitBtn.disabled = true;

  // Recolher dados
  const formData = new FormData(form);
  const contactData = {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') || '',
    reason: formData.get('reason') || 'Contacto Geral',
    subject: formData.get('reason') || 'Contacto via Website',
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
      errorMsg.textContent = 'Erro ao enviar mensagem: ' + error.message;
      errorMsg.classList.remove('d-none');
    }
  } finally {
    // Restaurar botão
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}
