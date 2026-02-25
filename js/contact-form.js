/**
 * Sistema de Contacto - Share2Inspire
 * Guarda mensagens no Supabase + envia notificação por email via backend
 * Fevereiro 2026
 */

(function () {
  'use strict';

  // Supabase config
  const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';

  // Backend URL for email notification
  const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';

  /**
   * Save contact message to Supabase
   */
  async function saveToSupabase(data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/contact_messages`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.reason || data.subject || 'Contacto Geral',
        message: data.message,
        source: data.source || 'website_contact',
        status: 'novo'
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Supabase error: ${err}`);
    }

    return await res.json();
  }

  /**
   * Send email notification via backend (best-effort, non-blocking)
   */
  async function notifyByEmail(data) {
    try {
      await fetch(`${BACKEND_URL}/api/feedback/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          subject: data.reason || 'Contacto via Website',
          message: data.message,
          source: 'website_contact'
        })
      });
    } catch (e) {
      console.warn('Notificação por email falhou (não crítico):', e.message);
    }
  }

  /**
   * Handle form submission
   */
  async function handleSubmit(form) {
    // Validate
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const privacyCheck = form.querySelector('#privacy, [name="privacy"]');
    if (privacyCheck && !privacyCheck.checked) {
      alert('Por favor, aceita a Política de Privacidade para continuar.');
      return;
    }

    // Get elements
    const submitBtn = form.querySelector('button[type="submit"]');
    const successEl = form.querySelector('#contactSuccess') || document.getElementById('contactSuccess');
    const errorEl = form.querySelector('#contactError') || document.getElementById('contactError');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';

    // Hide previous messages
    if (successEl) successEl.classList.add('d-none');
    if (errorEl) errorEl.classList.add('d-none');

    // Show loading
    if (submitBtn) {
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" style="width:14px;height:14px;margin-right:6px;"></span>A enviar...';
      submitBtn.disabled = true;
    }

    // Collect data
    const fd = new FormData(form);
    const contactData = {
      name: fd.get('name'),
      email: fd.get('email'),
      phone: fd.get('phone') || '',
      reason: fd.get('reason') || 'Contacto Geral',
      message: fd.get('message')
    };

    try {
      // 1. Save to Supabase (primary)
      await saveToSupabase(contactData);

      // 2. Send email notification (secondary, non-blocking)
      notifyByEmail(contactData);

      // Success
      if (successEl) {
        successEl.textContent = 'Mensagem enviada com sucesso! Entraremos em contacto brevemente.';
        successEl.classList.remove('d-none');
      }
      form.reset();

      // Close modal after delay
      setTimeout(() => {
        const modalEl = document.getElementById('contactModal');
        if (modalEl && typeof bootstrap !== 'undefined') {
          const modal = bootstrap.Modal.getInstance(modalEl);
          if (modal) modal.hide();
        }
        if (successEl) successEl.classList.add('d-none');
      }, 3000);

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      if (errorEl) {
        errorEl.textContent = 'Erro ao enviar a mensagem. Por favor, tenta novamente.';
        errorEl.classList.remove('d-none');
      }
    } finally {
      if (submitBtn) {
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
      }
    }
  }

  /**
   * Initialize contact form
   */
  function init() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    // Clone to remove old listeners
    const fresh = form.cloneNode(true);
    form.parentNode.replaceChild(fresh, form);

    fresh.addEventListener('submit', function (e) {
      e.preventDefault();
      handleSubmit(this);
    });
  }

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
