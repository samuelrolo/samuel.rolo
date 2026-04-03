/**
 * Share2Inspire — PWA Install Banner (Área de Membros)
 * 
 * Injeta um banner de anúncio da PWA no topo da dashboard.
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

  // Detetar idioma (verificar se a página tem textos em EN)
  function detectLang() {
    var body = document.body ? document.body.textContent : '';
    if (body.indexOf('Member Area') !== -1 || body.indexOf('My profile') !== -1) return 'en';
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
    banner.style.cssText = 'position:relative;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);border-radius:12px;padding:14px 20px;gap:16px;cursor:pointer;overflow:hidden;margin-bottom:16px;font-family:Poppins,sans-serif;transition:all 0.3s ease;';

    // Borda dourada à esquerda
    var borderLeft = document.createElement('div');
    borderLeft.style.cssText = 'position:absolute;left:0;top:0;bottom:0;width:3px;background:#D4A853;';
    banner.appendChild(borderLeft);

    // Lado esquerdo (ícone + texto)
    var left = document.createElement('div');
    left.style.cssText = 'display:flex;align-items:center;gap:12px;';

    var icon = document.createElement('div');
    icon.style.cssText = 'width:36px;height:36px;background:rgba(212,168,83,0.15);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;';
    icon.textContent = '\ud83d\udcf1';

    var textWrap = document.createElement('div');
    textWrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;';

    var label = document.createElement('span');
    label.style.cssText = 'font-size:9px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#D4A853;';
    label.textContent = t.label;

    var msg = document.createElement('span');
    msg.style.cssText = 'font-size:13px;font-weight:400;color:#fff;line-height:1.4;';
    msg.innerHTML = t.msg;

    textWrap.appendChild(label);
    textWrap.appendChild(msg);
    left.appendChild(icon);
    left.appendChild(textWrap);

    // CTA
    var cta = document.createElement('div');
    cta.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#D4A853;white-space:nowrap;flex-shrink:0;font-family:Poppins,sans-serif;';
    cta.innerHTML = t.cta + ' <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';

    // Botão fechar
    var close = document.createElement('button');
    close.style.cssText = 'position:absolute;top:8px;right:10px;background:none;border:none;color:#666;font-size:14px;cursor:pointer;line-height:1;padding:2px;z-index:2;';
    close.textContent = '\u00d7';
    close.title = lang === 'pt' ? 'Fechar' : 'Close';
    close.addEventListener('click', function (e) {
      e.stopPropagation();
      banner.style.opacity = '0';
      banner.style.transform = 'translateY(-10px)';
      setTimeout(function () {
        banner.remove();
      }, 300);
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    });

    // Click no banner abre instruções
    banner.addEventListener('click', function () {
      showInstallInstructions(lang);
    });

    // Hover
    banner.addEventListener('mouseenter', function () {
      banner.style.transform = 'translateY(-1px)';
      banner.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
    });
    banner.addEventListener('mouseleave', function () {
      banner.style.transform = 'translateY(0)';
      banner.style.boxShadow = 'none';
    });

    banner.appendChild(close);
    banner.appendChild(left);
    banner.appendChild(cta);

    return banner;
  }

  function showInstallInstructions(lang) {
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

    // Overlay
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;';

    var modal = document.createElement('div');
    modal.style.cssText = 'background:#fff;border-radius:16px;padding:32px;max-width:400px;width:100%;font-family:Poppins,sans-serif;position:relative;';

    var closeModal = document.createElement('button');
    closeModal.style.cssText = 'position:absolute;top:12px;right:16px;background:none;border:none;font-size:20px;cursor:pointer;color:#999;';
    closeModal.textContent = '\u00d7';
    closeModal.addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

    var title = document.createElement('h3');
    title.style.cssText = 'font-size:18px;font-weight:600;color:#1a1a1a;margin-bottom:16px;';
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

  // Esperar pelo React render e inserir o banner
  function insertBanner() {
    var root = document.getElementById('root');
    if (!root) return;

    var observer = new MutationObserver(function () {
      var mainContent = root.querySelector('[class*="container"], [class*="dashboard"], [class*="member"], main, [class*="max-w"]');
      if (mainContent && !document.getElementById('s2i-pwa-install-banner')) {
        var firstChild = mainContent.firstChild;
        if (firstChild) {
          var banner = createBanner();
          banner.style.marginTop = '8px';
          mainContent.insertBefore(banner, firstChild);
          observer.disconnect();
        }
      }
    });

    observer.observe(root, { childList: true, subtree: true });
    setTimeout(function () { observer.disconnect(); }, 15000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertBanner);
  } else {
    insertBanner();
  }
})();
