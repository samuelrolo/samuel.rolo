/**
 * Share2Inspire — PWA Service Worker Registration
 * 
 * Este script regista o Service Worker e gere atualizações.
 * É carregado via <script> no index.html, sem alterar o código React.
 */
(function () {
  'use strict';

  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/area-cliente/sw.js', {
      scope: '/area-cliente/'
    })
    .then(function (registration) {
      console.log('[PWA] Service Worker registado com sucesso. Scope:', registration.scope);

      // Verificar atualizações periodicamente (a cada 60 min)
      setInterval(function () {
        registration.update();
      }, 60 * 60 * 1000);

      // Quando há uma nova versão disponível
      registration.addEventListener('updatefound', function () {
        var newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', function () {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nova versão disponível — ativar silenciosamente
            newWorker.postMessage('skipWaiting');
          }
        });
      });
    })
    .catch(function (error) {
      console.warn('[PWA] Falha ao registar Service Worker:', error);
    });

    // Recarregar quando o novo SW assume o controlo
    var refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });

  // Detetar modo standalone (app instalada)
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    document.documentElement.classList.add('pwa-standalone');
    console.log('[PWA] A correr em modo standalone (app instalada).');
  }
})();
