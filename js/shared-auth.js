/**
 * Share2Inspire — Módulo de Autenticação Partilhada
 * 
 * Carrega o Supabase client e verifica a sessão do utilizador.
 * Quando autenticado, transforma o botão "Área de Cliente" em "Minha Conta"
 * e disponibiliza a sessão para outros scripts (ex: save-to-account.js).
 * 
 * Incluir em TODAS as páginas do site para experiência linear de autenticação.
 * 
 * Dependência: Supabase JS CDN (carregado automaticamente se não presente)
 */
(function() {
    'use strict';

    var SUPA_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
    var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';

    // Expose globally for other scripts
    window.S2I_AUTH = {
        supabaseClient: null,
        currentUser: null,
        currentSession: null,
        ready: false,
        onReady: []
    };

    /**
     * Load Supabase JS CDN if not already loaded
     */
    function ensureSupabaseLoaded(callback) {
        if (window.supabase && window.supabase.createClient) {
            callback();
            return;
        }
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        script.onload = function() {
            // Small delay to ensure global is available
            setTimeout(callback, 100);
        };
        script.onerror = function() {
            console.warn('S2I Auth: Failed to load Supabase CDN');
        };
        document.head.appendChild(script);
    }

    /**
     * Initialize Supabase client and check session
     */
    function initAuth() {
        if (!window.supabase || !window.supabase.createClient) {
            console.warn('S2I Auth: Supabase not available');
            return;
        }

        var client = window.supabase.createClient(SUPA_URL, SUPA_KEY);
        window.S2I_AUTH.supabaseClient = client;

        client.auth.getSession().then(function(result) {
            if (result.data && result.data.session) {
                setSession(result.data.session);
            }
            markReady();
        }).catch(function() {
            markReady();
        });

        client.auth.onAuthStateChange(function(event, session) {
            if (session) {
                setSession(session);
            } else {
                clearSession();
            }
        });
    }

    function setSession(session) {
        window.S2I_AUTH.currentSession = session;
        window.S2I_AUTH.currentUser = session.user;
        updateUI(true, session.user);
    }

    function clearSession() {
        window.S2I_AUTH.currentSession = null;
        window.S2I_AUTH.currentUser = null;
        updateUI(false, null);
    }

    function markReady() {
        window.S2I_AUTH.ready = true;
        var callbacks = window.S2I_AUTH.onReady;
        for (var i = 0; i < callbacks.length; i++) {
            try { callbacks[i](window.S2I_AUTH); } catch(e) {}
        }
        window.S2I_AUTH.onReady = [];
    }

    /**
     * Update UI elements based on auth state
     */
    function updateUI(isAuthenticated, user) {
        // Find "Área de Cliente" links/buttons and transform them
        var links = document.querySelectorAll('a[href*="area-cliente"], a[href*="area_cliente"]');
        
        links.forEach(function(link) {
            if (isAuthenticated && user) {
                // Get first name or email
                var displayName = '';
                if (user.user_metadata && user.user_metadata.full_name) {
                    displayName = user.user_metadata.full_name.split(' ')[0];
                } else if (user.user_metadata && user.user_metadata.name) {
                    displayName = user.user_metadata.name.split(' ')[0];
                } else if (user.email) {
                    displayName = user.email.split('@')[0];
                }
                
                // Only update text content, preserve any icons/styling
                var textNodes = [];
                var walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT, null, false);
                while (walker.nextNode()) {
                    textNodes.push(walker.currentNode);
                }
                
                var updated = false;
                textNodes.forEach(function(node) {
                    var text = node.textContent.trim();
                    if (text.indexOf('Área de Cliente') !== -1 || text.indexOf('Area de Cliente') !== -1 || text.indexOf('Client Area') !== -1) {
                        node.textContent = node.textContent.replace(/Área de Cliente|Area de Cliente|Client Area/gi, 'Minha Conta');
                        updated = true;
                    }
                });
                
                // If no text node was found, try the link itself
                if (!updated && link.textContent.trim().indexOf('rea de Cliente') !== -1) {
                    link.textContent = 'Minha Conta';
                }
                
                // Add a small avatar indicator
                if (!link.querySelector('.s2i-auth-indicator')) {
                    var indicator = document.createElement('span');
                    indicator.className = 's2i-auth-indicator';
                    indicator.style.cssText = 'display:inline-block;width:8px;height:8px;background:#22c55e;border-radius:50%;margin-left:6px;vertical-align:middle;';
                    indicator.title = 'Sessão ativa: ' + (user.email || '');
                    link.appendChild(indicator);
                }
            } else {
                // Revert to original text
                var textNodes = [];
                var walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT, null, false);
                while (walker.nextNode()) {
                    textNodes.push(walker.currentNode);
                }
                textNodes.forEach(function(node) {
                    if (node.textContent.indexOf('Minha Conta') !== -1) {
                        node.textContent = node.textContent.replace('Minha Conta', 'Área de Cliente');
                    }
                });
                
                // Remove indicator
                var indicator = link.querySelector('.s2i-auth-indicator');
                if (indicator) indicator.remove();
            }
        });

        // Also update any navbar buttons that might reference the client area
        var buttons = document.querySelectorAll('button');
        buttons.forEach(function(btn) {
            var text = btn.textContent.trim();
            if (isAuthenticated) {
                if (text === 'Área de Cliente' || text === 'Area de Cliente') {
                    btn.textContent = 'Minha Conta';
                }
            } else {
                if (text === 'Minha Conta') {
                    btn.textContent = 'Área de Cliente';
                }
            }
        });
    }

    // Bootstrap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            ensureSupabaseLoaded(initAuth);
        });
    } else {
        ensureSupabaseLoaded(initAuth);
    }
})();
