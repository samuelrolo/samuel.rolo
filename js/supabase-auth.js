/**
 * Share2Inspire — Módulo de Autenticação Partilhado
 * 
 * Este módulo gere a sessão de autenticação Supabase em todas as páginas do site.
 * Carrega o Supabase JS client, verifica sessão ativa, e atualiza o UI do navbar.
 * 
 * Uso: Adicionar no HTML antes do </body>:
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
 *   <script src="/js/supabase-auth.js"></script>
 */
(function() {
    'use strict';

    var SUPA_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
    var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
    var CLIENT_AREA_URL = '/area-cliente/';

    // Initialize Supabase client
    var supabase = null;
    if (window.supabase && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPA_URL, SUPA_KEY);
    }

    // Expose globally for other scripts
    window.s2iAuth = {
        supabase: supabase,
        user: null,
        session: null,

        /**
         * Get current user session
         */
        getSession: function() {
            return this.session;
        },

        /**
         * Get current user
         */
        getUser: function() {
            return this.user;
        },

        /**
         * Check if user is authenticated
         */
        isAuthenticated: function() {
            return !!this.session && !!this.user;
        },

        /**
         * Get user display name
         */
        getDisplayName: function() {
            if (!this.user) return null;
            var meta = this.user.user_metadata || {};
            if (meta.first_name) {
                return meta.first_name + (meta.last_name ? ' ' + meta.last_name : '');
            }
            if (meta.full_name) return meta.full_name;
            if (meta.name) return meta.name;
            return this.user.email ? this.user.email.split('@')[0] : 'Utilizador';
        },

        /**
         * Get user first name only
         */
        getFirstName: function() {
            if (!this.user) return null;
            var meta = this.user.user_metadata || {};
            if (meta.first_name) return meta.first_name;
            if (meta.full_name) return meta.full_name.split(' ')[0];
            if (meta.name) return meta.name.split(' ')[0];
            return this.user.email ? this.user.email.split('@')[0] : 'Utilizador';
        },

        /**
         * Sign out
         */
        signOut: function() {
            if (!supabase) return Promise.resolve();
            return supabase.auth.signOut().then(function() {
                window.s2iAuth.user = null;
                window.s2iAuth.session = null;
                updateNavbar(null);
                // Reload to reflect logged-out state
                window.location.reload();
            });
        },

        /**
         * Save analysis result associated with the current user
         * @param {string} type - Type of analysis: 'cv_analysis', 'career_energy', 'career_path'
         * @param {object} data - The analysis data to save
         */
        saveAnalysis: function(type, data) {
            if (!this.isAuthenticated() || !supabase) {
                console.log('S2I Auth: User not authenticated, skipping save to user_analyses');
                return Promise.resolve(null);
            }
            var payload = {
                user_id: this.user.id,
                analysis_type: type,
                data: data,
                created_at: new Date().toISOString()
            };
            return fetch(SUPA_URL + '/rest/v1/user_analyses', {
                method: 'POST',
                headers: {
                    'apikey': SUPA_KEY,
                    'Authorization': 'Bearer ' + this.session.access_token,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(payload)
            }).then(function(r) { return r.json(); })
              .then(function(d) {
                  console.log('S2I Auth: Analysis saved for user:', d);
                  return d;
              })
              .catch(function(e) {
                  console.warn('S2I Auth: Error saving analysis:', e);
                  return null;
              });
        }
    };

    /**
     * Update the navbar to reflect auth state
     */
    function updateNavbar(user) {
        // Find the "Área de Cliente" button in the navbar
        var navItems = document.querySelectorAll('.navbar-nav .nav-item');
        var authNavItem = null;

        for (var i = 0; i < navItems.length; i++) {
            var link = navItems[i].querySelector('a');
            if (link && (link.href.indexOf('/area-cliente') !== -1 || link.textContent.trim() === 'Área de Cliente')) {
                authNavItem = navItems[i];
                break;
            }
        }

        if (!authNavItem) return;

        if (user) {
            var firstName = window.s2iAuth.getFirstName();
            // Replace the button with a dropdown showing user name
            authNavItem.innerHTML = 
                '<div class="dropdown">' +
                    '<a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false" ' +
                    'style="background:#BF9A33;color:#0a0a0a !important;padding:0.4rem 1rem;border-radius:4px;font-weight:600;transition:all 0.3s;">' +
                        '<i class="fas fa-user-circle" style="margin-right:0.4rem;"></i>' + firstName +
                    '</a>' +
                    '<ul class="dropdown-menu dropdown-menu-end" style="min-width:180px;">' +
                        '<li><a class="dropdown-item" href="/area-cliente/perfil"><i class="fas fa-tachometer-alt" style="margin-right:0.5rem;width:16px;"></i>Dashboard</a></li>' +
                        '<li><a class="dropdown-item" href="/area-cliente/planos"><i class="fas fa-crown" style="margin-right:0.5rem;width:16px;"></i>Planos</a></li>' +
                        '<li><hr class="dropdown-divider"></li>' +
                        '<li><a class="dropdown-item" href="#" id="s2i-logout-btn" style="color:#dc3545;"><i class="fas fa-sign-out-alt" style="margin-right:0.5rem;width:16px;"></i>Sair</a></li>' +
                    '</ul>' +
                '</div>';

            // Add logout handler
            var logoutBtn = document.getElementById('s2i-logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    window.s2iAuth.signOut();
                });
            }
        } else {
            // Show the default "Área de Cliente" button
            authNavItem.innerHTML = 
                '<a class="nav-link" href="' + CLIENT_AREA_URL + '" ' +
                'style="background:#BF9A33;color:#0a0a0a !important;padding:0.4rem 1rem;border-radius:4px;font-weight:600;transition:all 0.3s;" ' +
                'onmouseover="this.style.background=\'#d4af5a\'" onmouseout="this.style.background=\'#BF9A33\'">' +
                'Área de Cliente</a>';
        }
    }

    /**
     * Initialize auth state
     */
    function init() {
        if (!supabase) {
            console.warn('S2I Auth: Supabase client not available. Make sure to load supabase-js before this script.');
            return;
        }

        // Check for existing session
        supabase.auth.getSession().then(function(result) {
            var data = result.data;
            if (data && data.session) {
                window.s2iAuth.session = data.session;
                window.s2iAuth.user = data.session.user;
                updateNavbar(data.session.user);
                console.log('S2I Auth: User authenticated:', window.s2iAuth.getDisplayName());
            } else {
                console.log('S2I Auth: No active session');
                updateNavbar(null);
            }
        }).catch(function(err) {
            console.warn('S2I Auth: Error checking session:', err);
            updateNavbar(null);
        });

        // Listen for auth state changes
        supabase.auth.onAuthStateChange(function(event, session) {
            if (session) {
                window.s2iAuth.session = session;
                window.s2iAuth.user = session.user;
                updateNavbar(session.user);
            } else {
                window.s2iAuth.session = null;
                window.s2iAuth.user = null;
                updateNavbar(null);
            }
        });
    }

    // Run init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
