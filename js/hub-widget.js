/**
 * SHARE2INSPIRE - Unified Floating Hub
 * Single minimal button that expands to Feedback (+ Career Adviser only in area-cliente)
 * 
 * Created: 2026-03-04
 * Updated: 2026-03-16 — Career Adviser only visible inside /area-cliente/
 */

(function () {
    'use strict';

    // Prevent duplicate injection
    if (document.getElementById('s2iHub')) return;

    // Detect if we are inside the area-cliente
    var isAreaCliente = window.location.pathname.indexOf('/area-cliente') !== -1;

    // Build Career Adviser button only if inside area-cliente
    var careerBtnHTML = '';
    if (isAreaCliente) {
        careerBtnHTML = `
                <button class="s2i-hub-option" id="s2iHubCareer" aria-label="Career Adviser">
                    <span class="opt-icon">🎯</span>
                    <div>
                        <div class="opt-label">Career Adviser</div>
                        <div class="opt-desc">Assistente de carreira</div>
                    </div>
                </button>`;
    }

    // Inject HTML
    const hubHTML = `
        <div class="s2i-hub-overlay" id="s2iHubOverlay"></div>
        <div class="s2i-hub" id="s2iHub">
            <div class="s2i-hub-menu">${careerBtnHTML}
                <button class="s2i-hub-option" id="s2iHubFeedback" aria-label="Feedback">
                    <span class="opt-icon">💬</span>
                    <div>
                        <div class="opt-label">Feedback</div>
                        <div class="opt-desc">Partilhar opinião</div>
                    </div>
                </button>
            </div>
            <button class="s2i-hub-trigger" id="s2iHubTrigger" aria-label="Menu de ajuda">
                <svg viewBox="0 0 24 24">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            </button>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', hubHTML);

    // Logic
    const hub = document.getElementById('s2iHub');
    const trigger = document.getElementById('s2iHubTrigger');
    const overlay = document.getElementById('s2iHubOverlay');
    const feedbackBtn = document.getElementById('s2iHubFeedback');

    function toggleHub() {
        hub.classList.toggle('open');
        trigger.classList.toggle('active');
    }

    function closeHub() {
        hub.classList.remove('open');
        trigger.classList.remove('active');
    }

    trigger.addEventListener('click', toggleHub);
    overlay.addEventListener('click', closeHub);

    // Career Adviser — only if inside area-cliente
    if (isAreaCliente) {
        var careerBtn = document.getElementById('s2iHubCareer');
        if (careerBtn) {
            careerBtn.addEventListener('click', function () {
                closeHub();
                if (window.samuelRoloAI) {
                    window.samuelRoloAI.openWidget();
                } else {
                    var tabBtn = document.getElementById('coachTabButton');
                    if (tabBtn) tabBtn.click();
                }
            });
        }
    }

    // Feedback — trigger the existing feedback modal
    feedbackBtn.addEventListener('click', function () {
        closeHub();
        var feedbackModalEl = document.getElementById('feedbackWidgetModal');
        if (feedbackModalEl && typeof bootstrap !== 'undefined') {
            var modal = new bootstrap.Modal(feedbackModalEl);
            modal.show();
        } else {
            var openBtn = document.getElementById('openFeedbackBtn');
            if (openBtn) openBtn.click();
        }
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeHub();
    });

})();
