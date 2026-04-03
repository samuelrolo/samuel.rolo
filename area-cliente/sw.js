/**
 * Share2Inspire — Área de Cliente — Service Worker (PWA)
 * 
 * Estratégia: Network-First com fallback para cache.
 * - Páginas HTML: Network-first (garante dados frescos, com fallback offline)
 * - Assets estáticos (JS/CSS/imagens): Cache-first (performance)
 * - API calls: Network-only (nunca cache dados sensíveis)
 * 
 * NOTA: Este SW NÃO interfere com a lógica da aplicação.
 *       Apenas adiciona capacidades offline e melhora performance.
 */

const CACHE_NAME = 's2i-area-cliente-v1';
const STATIC_CACHE = 's2i-static-v1';

// Assets estáticos a pré-cachear no install
const PRECACHE_URLS = [
  '/area-cliente/',
  '/area-cliente/index.html',
  '/images/favicon-192x192.png',
  '/images/favicon-512x512.png',
  '/images/logo.webp',
  '/images/logo-small.webp'
];

// Padrões de URL que NUNCA devem ser cacheados
const NEVER_CACHE_PATTERNS = [
  /supabase\.co/,          // API Supabase (auth, dados, storage)
  /googleapis\.com/,       // Google APIs (OAuth)
  /stripe\.com/,           // Pagamentos Stripe
  /facebook\.net/,         // Meta Pixel
  /googletagmanager\.com/, // Google Analytics / Ads
  /connect\.facebook/,     // Facebook SDK
  /fbevents/,              // Facebook Events
  /api\//,                 // Backend API calls
  /chrome-extension/       // Extensões do browser
];

// Install: pré-cachear assets essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[SW] Precache parcial:', err);
        return self.skipWaiting();
      })
  );
});

// Activate: limpar caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: estratégia por tipo de recurso
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests que não são GET
  if (request.method !== 'GET') return;

  // Ignorar requests que nunca devem ser cacheados
  if (NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(request.url))) return;

  // Assets estáticos (JS, CSS, imagens, fontes): Cache-first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Páginas HTML (navegação): Network-first
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Tudo o resto: Network-first
  event.respondWith(networkFirst(request));
});

/**
 * Verifica se é um asset estático
 */
function isStaticAsset(url) {
  return /\.(js|css|png|jpg|jpeg|webp|svg|ico|woff2?|ttf|eot)(\?.*)?$/.test(url.pathname);
}

/**
 * Cache-first: tenta cache, fallback para network
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Offline e sem cache — retorna resposta genérica
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Network-first: tenta network, fallback para cache
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Se é navegação e estamos offline, servir a shell da app
    if (request.mode === 'navigate') {
      const shell = await caches.match('/area-cliente/index.html');
      if (shell) return shell;
    }

    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Listener para mensagens (permite forçar update do SW)
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
