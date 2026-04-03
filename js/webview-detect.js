/**
 * WebView Detection & Native Browser Redirect
 * Share2Inspire — 2026
 * 
 * Detects in-app browsers (LinkedIn, Instagram, Facebook, etc.)
 * and prompts/forces users to open in native browser for full functionality.
 */
(function() {
  'use strict';

  // Skip if already shown this session
  if (sessionStorage.getItem('s2i_wv_handled')) return;

  var ua = navigator.userAgent || navigator.vendor || '';

  // Detect in-app browsers
  var isLinkedIn = /LinkedInApp/i.test(ua);
  var isInstagram = /Instagram/i.test(ua);
  var isFacebook = /FBAN|FBAV|FB_IAB/i.test(ua);
  var isTwitter = /Twitter/i.test(ua);
  var isTikTok = /BytedanceWebview|TikTok/i.test(ua);
  var isGenericWebView = /wv\)|WebView/i.test(ua) && /Android/i.test(ua);

  var isInAppBrowser = isLinkedIn || isInstagram || isFacebook || isTwitter || isTikTok || isGenericWebView;

  if (!isInAppBrowser) return;

  // Determine source name for display
  var source = 'app';
  if (isLinkedIn) source = 'LinkedIn';
  else if (isInstagram) source = 'Instagram';
  else if (isFacebook) source = 'Facebook';
  else if (isTwitter) source = 'Twitter/X';
  else if (isTikTok) source = 'TikTok';

  var currentUrl = window.location.href;

  // Detect language
  var isEN = window.location.pathname.indexOf('/en/') === 0 || 
             window.location.pathname.indexOf('/en') === 0;

  // Try to open in native browser first (intent-based for Android)
  var isAndroid = /Android/i.test(ua);
  var isIOS = /iPhone|iPad|iPod/i.test(ua);

  // Build the banner
  var overlay = document.createElement('div');
  overlay.id = 's2i-webview-banner';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;' +
    'background:linear-gradient(135deg,#1A1A1A 0%,#2D2D2D 100%);' +
    'color:#fff;padding:16px 20px;box-shadow:0 4px 20px rgba(0,0,0,0.3);' +
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
    'display:flex;align-items:center;gap:14px;flex-wrap:wrap;' +
    'animation:s2i-slide-down 0.3s ease-out;border-bottom:2px solid #C9A961;';

  var textContent = isEN
    ? 'You\'re viewing this in ' + source + '\'s browser. For the best experience and secure payments, open in your browser.'
    : 'Estás a ver isto no browser do ' + source + '. Para melhor experiência e pagamentos seguros, abre no teu browser.';

  var btnText = isEN ? 'Open in Browser' : 'Abrir no Browser';
  var dismissText = isEN ? 'Continue here' : 'Continuar aqui';

  overlay.innerHTML = 
    '<div style="flex:1;min-width:200px;">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A961" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' +
        '</svg>' +
        '<strong style="color:#C9A961;font-size:13px;">' + (isEN ? 'Limited Browser Detected' : 'Browser Limitado Detectado') + '</strong>' +
      '</div>' +
      '<p style="margin:0;font-size:12px;line-height:1.4;color:rgba(255,255,255,0.85);">' + textContent + '</p>' +
    '</div>' +
    '<div style="display:flex;gap:8px;flex-shrink:0;">' +
      '<a id="s2i-open-native" href="#" style="' +
        'display:inline-flex;align-items:center;gap:6px;' +
        'background:#C9A961;color:#1A1A1A;padding:10px 18px;border-radius:8px;' +
        'font-size:13px;font-weight:600;text-decoration:none;white-space:nowrap;' +
        'transition:background 0.2s;">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>' +
        '</svg>' +
        btnText +
      '</a>' +
      '<button id="s2i-dismiss-wv" style="' +
        'background:transparent;color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.2);' +
        'padding:10px 14px;border-radius:8px;font-size:12px;cursor:pointer;white-space:nowrap;' +
        'transition:all 0.2s;">' +
        dismissText +
      '</button>' +
    '</div>';

  // Add animation CSS
  var style = document.createElement('style');
  style.textContent = '@keyframes s2i-slide-down{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}' +
    '#s2i-webview-banner a:hover{background:#b8943f!important}' +
    '#s2i-dismiss-wv:hover{color:#fff!important;border-color:rgba(255,255,255,0.5)!important}';
  document.head.appendChild(style);

  // Insert banner when DOM is ready
  function insertBanner() {
    document.body.insertBefore(overlay, document.body.firstChild);

    // Add padding to body to prevent content overlap
    var bannerHeight = overlay.offsetHeight;
    document.body.style.paddingTop = bannerHeight + 'px';

    // Open in native browser button
    document.getElementById('s2i-open-native').addEventListener('click', function(e) {
      e.preventDefault();
      openInNativeBrowser(currentUrl);
    });

    // Dismiss button
    document.getElementById('s2i-dismiss-wv').addEventListener('click', function() {
      overlay.style.animation = 'none';
      overlay.style.transition = 'transform 0.3s ease-in, opacity 0.3s ease-in';
      overlay.style.transform = 'translateY(-100%)';
      overlay.style.opacity = '0';
      setTimeout(function() {
        overlay.remove();
        document.body.style.paddingTop = '0';
      }, 300);
      sessionStorage.setItem('s2i_wv_handled', '1');
    });
  }

  function openInNativeBrowser(url) {
    if (isAndroid) {
      // Android: Try intent:// scheme to force Chrome/default browser
      var intentUrl = 'intent://' + url.replace(/^https?:\/\//, '') + 
        '#Intent;scheme=https;package=com.android.chrome;end';
      
      // Also try the generic browser intent (fallback)
      var genericIntent = 'intent://' + url.replace(/^https?:\/\//, '') + 
        '#Intent;scheme=https;action=android.intent.action.VIEW;end';
      
      // Try Chrome first, then generic
      window.location.href = intentUrl;
      
      // Fallback after 2s if intent didn't work
      setTimeout(function() {
        window.location.href = genericIntent;
      }, 1500);
      
      // Final fallback: copy URL
      setTimeout(function() {
        copyAndNotify(url);
      }, 3000);
    } else if (isIOS) {
      // iOS: Safari universal link or x-safari scheme
      // For Instagram/LinkedIn on iOS, window.open sometimes works
      var safariUrl = 'x-safari-' + url;
      window.open(url, '_system');
      
      // Fallback
      setTimeout(function() {
        copyAndNotify(url);
      }, 2000);
    } else {
      // Generic fallback: try window.open and copy
      window.open(url, '_system') || window.open(url, '_blank');
      setTimeout(function() {
        copyAndNotify(url);
      }, 1500);
    }
  }

  function copyAndNotify(url) {
    var isEN_ = window.location.pathname.indexOf('/en/') === 0 || 
                window.location.pathname.indexOf('/en') === 0;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function() {
        showCopyNotification(isEN_);
      }).catch(function() {
        fallbackCopy(url, isEN_);
      });
    } else {
      fallbackCopy(url, isEN_);
    }
  }

  function fallbackCopy(url, isEN_) {
    var ta = document.createElement('textarea');
    ta.value = url;
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showCopyNotification(isEN_); } catch(e) {}
    document.body.removeChild(ta);
  }

  function showCopyNotification(isEN_) {
    var notif = document.createElement('div');
    notif.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);' +
      'background:#C9A961;color:#1A1A1A;padding:14px 24px;border-radius:12px;' +
      'font-size:14px;font-weight:600;z-index:999999;box-shadow:0 8px 30px rgba(0,0,0,0.3);' +
      'text-align:center;max-width:90%;animation:s2i-slide-down 0.3s ease-out;';
    notif.innerHTML = isEN_
      ? '✓ Link copied! Paste it in Chrome or Safari to continue.'
      : '✓ Link copiado! Cola no Chrome ou Safari para continuar.';
    document.body.appendChild(notif);
    
    // Update the banner button text
    var btn = document.getElementById('s2i-open-native');
    if (btn) {
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>' +
        (isEN_ ? 'Link Copied!' : 'Link Copiado!');
    }

    setTimeout(function() {
      notif.style.transition = 'opacity 0.5s';
      notif.style.opacity = '0';
      setTimeout(function() { notif.remove(); }, 500);
    }, 4000);
  }

  // Insert when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertBanner);
  } else {
    insertBanner();
  }
})();
