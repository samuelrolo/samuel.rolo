/**
 * Cookie Consent Banner - Share2Inspire
 * Gestão de consentimento de cookies
 */

// Verificar se já existe consentimento
document.addEventListener('DOMContentLoaded', function () {
    const banner = document.getElementById('cookieConsentBanner');
    const modal = document.getElementById('cookiePreferencesModal');

    // Mostrar banner se não houver consentimento
    if (!getCookie('cookieConsent')) {
        setTimeout(() => {
            if (banner) {
                banner.classList.add('show');
            }
        }, 1000);
    }
});

// Aceitar todos os cookies
function acceptAllCookies() {
    setCookie('cookieConsent', 'all', 365);
    setCookie('analytics', 'true', 365);
    hideBanner();
    initializeAnalytics();
}

// Recusar cookies não essenciais
function declineAllCookies() {
    setCookie('cookieConsent', 'essential', 365);
    setCookie('analytics', 'false', 365);
    hideBanner();
}

// Abrir modal de preferências
function openCookieSettings() {
    const modal = document.getElementById('cookiePreferencesModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Fechar modal de preferências
function closeCookieSettings() {
    const modal = document.getElementById('cookiePreferencesModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Guardar preferências personalizadas
function saveCustomPreferences() {
    const analyticsCheckbox = document.getElementById('analytics-cookies');
    const analyticsEnabled = analyticsCheckbox ? analyticsCheckbox.checked : false;

    setCookie('cookieConsent', 'custom', 365);
    setCookie('analytics', analyticsEnabled ? 'true' : 'false', 365);

    if (analyticsEnabled) {
        initializeAnalytics();
    }

    closeCookieSettings();
    hideBanner();
}

// Esconder banner
function hideBanner() {
    const banner = document.getElementById('cookieConsentBanner');
    if (banner) {
        banner.classList.remove('show');
        setTimeout(() => {
            banner.style.display = 'none';
        }, 300);
    }
}

// Inicializar Google Analytics (se consentido)
function initializeAnalytics() {
    if (getCookie('analytics') === 'true') {
        // Google Analytics já está carregado no head
        console.log('Analytics initialized with consent');
    }
}

// Funções auxiliares de cookies
function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = name + '=' + value + ';expires=' + expires.toUTCString() + ';path=/';
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Event listeners para o modal de preferências
document.addEventListener('DOMContentLoaded', function () {
    // Fechar modal ao clicar fora
    const modal = document.getElementById('cookiePreferencesModal');
    if (modal) {
        window.onclick = function (event) {
            if (event.target === modal) {
                closeCookieSettings();
            }
        };
    }

    // Botão de guardar preferências
    const saveBtn = document.querySelector('.cookie-preferences-footer .cookie-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveCustomPreferences);
    }
});

console.log('Cookie consent system loaded');
