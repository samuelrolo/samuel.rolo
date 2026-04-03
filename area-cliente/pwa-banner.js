/**
 * Share2Inspire — PWA Install Banner (Área de Membros)
 * 
 * Injeta um banner de anúncio da PWA no topo da página.
 * NÃO altera nenhum componente React.
 * O banner pode ser dispensado e não volta a aparecer durante 30 dias.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 's2i-pwa-banner-dismissed';
  var DISMISS_DAYS = 30;

  // Não mostrar se já foi dispensado
  var dismissed = localStorage.getItem(STORAGE_KEY);
  if (dismissed) {
    var dismissedDate = new Date(dismissed);
    var now = new Date();
    var diffDays = (now - dismissedDate) / (1000 * 60 * 60 * 24);
    if (diffDays < DISMISS_DAYS) return;
  }

  // Não mostrar se já está instalado como PWA
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    return;
  }

  // Detetar idioma
  function detectLang() {
    var html = document.documentElement.lang || '';
    if (html.startsWith('en')) return 'en';
    var path = window.location.pathname;
    if (path.indexOf('/en/') !== -1) return 'en';
    return 'pt';
  }

  var texts = {
    pt: {
      label: 'Novidade',
      msg: 'O teu ecossistema de carreira agora \u00e9 uma <strong>app</strong>. Instala no telem\u00f3vel e acede a tudo com um toque.',
      cta: 'Saber como'
    },
    en: {
      label: 'New',
      msg: 'Your career ecosystem is now an <strong>app</strong>. Install it on your phone and access everything with a tap.',
      cta: 'Learn how'
    }
  };

  function createBanner() {
    var lang = detectLang();
    var t = texts[lang] || texts['pt'];

    var banner = document.createElement('div');
    banner.id = 's2i-pwa-install-banner';
    banner.style.cssText = 'position:relative;display:flex;align-items:center;background:#1a1a1a;padding:12px 48px 12px 16px;gap:12px;cursor:pointer;font-family:Poppins,system-ui,sans-serif;border-bottom:2px solid #C9A961;z-index:9999;transition:opacity 0.3s ease;';

    // Ícone telemóvel
    var icon = document.createElement('span');
    icon.style.cssText = 'font-size:20px;flex-shrink:0;';
    icon.textContent = '\ud83d\udcf1';

    // Texto
    var textWrap = document.createElement('span');
    textWrap.style.cssText = 'flex:1;color:#fff;font-size:13px;font-weight:300;line-height:1.4;';

    var label = document.createElement('span');
    label.style.cssText = 'background:#C9A961;color:#1a1a1a;font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;margin-right:8px;letter-spacing:0.5px;text-transform:uppercase;vertical-align:middle;';
    label.textContent = t.label;

    var msg = document.createElement('span');
    msg.innerHTML = t.msg;

    textWrap.appendChild(label);
    textWrap.appendChild(msg);

    // CTA
    var cta = document.createElement('span');
    cta.style.cssText = 'color:#C9A961;font-size:12px;font-weight:500;white-space:nowrap;flex-shrink:0;';
    cta.innerHTML = t.cta + ' \u2192';

    // Botão fechar
    var close = document.createElement('button');
    close.style.cssText = 'position:absolute;top:50%;right:12px;transform:translateY(-50%);background:none;border:none;color:#666;font-size:18px;cursor:pointer;line-height:1;padding:4px;z-index:2;';
    close.textContent = '\u00d7';
    close.title = lang === 'pt' ? 'Fechar' : 'Close';
    close.addEventListener('click', function (e) {
      e.stopPropagation();
      banner.style.opacity = '0';
      setTimeout(function () { banner.remove(); }, 300);
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    });

    // Click no banner abre instruções
    banner.addEventListener('click', function () {
      showInstallInstructions(lang);
    });

    banner.appendChild(icon);
    banner.appendChild(textWrap);
    banner.appendChild(cta);
    banner.appendChild(close);
    return banner;
  }

  function showInstallInstructions(lang) {
    var existing = document.getElementById('s2i-pwa-modal');
    if (existing) existing.remove();

    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    var isAndroid = /Android/.test(navigator.userAgent);

    var instructions = {
      pt: {
        title: 'Como instalar a app',
        ios: '1. Toca no bot\u00e3o de partilha (\u2b06\ufe0f) no Safari\n2. Seleciona "Adicionar ao ecr\u00e3 principal"\n3. Toca em "Adicionar"',
        android: '1. Toca no menu \u22ee (3 pontos) no Chrome\n2. Seleciona "Instalar app" ou "Adicionar ao ecr\u00e3 principal"\n3. Confirma a instala\u00e7\u00e3o',
        desktop: '1. Clica no \u00edcone de instala\u00e7\u00e3o na barra de endere\u00e7o\n2. Ou vai ao menu \u22ee \u2192 "Instalar Share2Inspire"\n3. Confirma a instala\u00e7\u00e3o'
      },
      en: {
        title: 'How to install the app',
        ios: '1. Tap the Share button (\u2b06\ufe0f icon) in Safari\n2. Select "Add to Home Screen"\n3. Tap "Add"',
        android: '1. Tap the \u22ee menu (3 dots) in Chrome\n2. Select "Install app" or "Add to Home Screen"\n3. Confirm installation',
        desktop: '1. Click the install icon in the address bar\n2. Or go to \u22ee menu \u2192 "Install Share2Inspire"\n3. Confirm installation'
      }
    };

    var t = instructions[lang] || instructions['pt'];
    var steps = isIOS ? t.ios : (isAndroid ? t.android : t.desktop);

    var overlay = document.createElement('div');
    overlay.id = 's2i-pwa-modal';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;';

    var modal = document.createElement('div');
    modal.style.cssText = 'background:#fff;border-radius:16px;padding:32px;max-width:400px;width:100%;font-family:Poppins,sans-serif;position:relative;';

    var closeModal = document.createElement('button');
    closeModal.style.cssText = 'position:absolute;top:12px;right:16px;background:none;border:none;font-size:20px;cursor:pointer;color:#999;';
    closeModal.textContent = '\u00d7';
    closeModal.addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

    var title = document.createElement('h3');
    title.style.cssText = 'font-size:18px;font-weight:600;color:#1a1a1a;margin:0 0 16px 0;';
    title.textContent = t.title;

    var stepsEl = document.createElement('pre');
    stepsEl.style.cssText = 'font-size:14px;color:#444;line-height:1.8;white-space:pre-wrap;font-family:Poppins,sans-serif;background:#f9f9f6;padding:16px;border-radius:10px;margin:0;';
    stepsEl.textContent = steps;

    modal.appendChild(closeModal);
    modal.appendChild(title);
    modal.appendChild(stepsEl);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  // Inserir o banner diretamente no topo do body
  function insertBanner() {
    if (document.getElementById('s2i-pwa-install-banner')) return;
    var banner = createBanner();
    document.body.insertBefore(banner, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertBanner);
  } else {
    insertBanner();
  }
})();
