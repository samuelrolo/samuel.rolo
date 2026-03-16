/**
 * Share2Inspire — Login Inline & Menu de Utilizador
 * 
 * Substitui o botão "Área de Cliente" na nav por:
 * - Se NÃO autenticado: botão que abre modal de login/registo
 * - Se autenticado: avatar + nome com dropdown (Dashboard, Perfil, Planos, Sair)
 * 
 * Depende de: shared-auth.js (S2I_AUTH global)
 */
(function() {
    'use strict';

    // ── CSS do modal e dropdown ──
    var css = document.createElement('style');
    css.textContent = [
        /* Overlay */
        '.s2i-overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:9998;opacity:0;transition:opacity .25s;pointer-events:none;}',
        '.s2i-overlay.active{opacity:1;pointer-events:all;}',

        /* Modal — Light theme */
        '.s2i-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(.95);z-index:9999;background:#fff;border:1px solid #e8e8e8;border-radius:12px;padding:2.5rem 2rem 2rem;width:380px;max-width:92vw;opacity:0;transition:opacity .25s,transform .25s;pointer-events:none;font-family:"Poppins",sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.12);}',
        '.s2i-modal.active{opacity:1;transform:translate(-50%,-50%) scale(1);pointer-events:all;}',
        '.s2i-modal-close{position:absolute;top:12px;right:14px;background:none;border:none;color:#999;font-size:1.4rem;cursor:pointer;line-height:1;padding:4px;}',
        '.s2i-modal-close:hover{color:#333;}',
        '.s2i-modal h3{margin:0 0 .25rem;color:#1A1A1A;font-size:1.25rem;font-weight:600;text-align:center;}',
        '.s2i-modal p.subtitle{margin:0 0 1.5rem;color:#999;font-size:.82rem;text-align:center;font-family:"Poppins",sans-serif;}',
        '.s2i-modal label{display:block;margin-bottom:.35rem;color:#555;font-size:.78rem;font-family:"Poppins",sans-serif;letter-spacing:.3px;font-weight:500;}',
        '.s2i-modal input{width:100%;padding:.6rem .75rem;background:#fafafa;border:1px solid #e0e0e0;border-radius:6px;color:#1A1A1A;font-size:.88rem;font-family:"Poppins",sans-serif;outline:none;transition:border-color .2s;box-sizing:border-box;}',
        '.s2i-modal input:focus{border-color:#C9A961;background:#fff;}',
        '.s2i-modal .field{margin-bottom:1rem;}',
        '.s2i-modal .s2i-btn{display:block;width:100%;padding:.7rem;background:#C9A961;color:#fff;border:none;border-radius:6px;font-size:.9rem;font-weight:600;cursor:pointer;transition:background .2s;font-family:"Poppins",sans-serif;}',
        '.s2i-modal .s2i-btn:hover{background:#A88B4E;}',
        '.s2i-modal .s2i-btn:disabled{opacity:.5;cursor:not-allowed;}',
        '.s2i-modal .toggle-link{display:block;margin-top:1rem;text-align:center;color:#C9A961;font-size:.82rem;cursor:pointer;font-family:"Poppins",sans-serif;text-decoration:none;}',
        '.s2i-modal .toggle-link:hover{text-decoration:underline;}',
        '.s2i-modal .error-msg{color:#ef4444;font-size:.8rem;margin-top:.5rem;text-align:center;font-family:"Poppins",sans-serif;min-height:1.2em;}',
        '.s2i-modal .success-msg{color:#22c55e;font-size:.8rem;margin-top:.5rem;text-align:center;font-family:"Poppins",sans-serif;}',
        '.s2i-modal .forgot-link{display:inline-block;margin-top:.25rem;color:#999;font-size:.75rem;cursor:pointer;font-family:"Poppins",sans-serif;}',
        '.s2i-modal .forgot-link:hover{color:#C9A961;}',
        '.s2i-modal .name-row{display:flex;gap:.75rem;}',
        '.s2i-modal .name-row .field{flex:1;}',

        /* User dropdown na nav */
        '.s2i-user-nav{position:relative;display:flex;align-items:center;gap:8px;cursor:pointer;padding:.35rem .75rem;border-radius:6px;transition:background .2s;}',
        '.s2i-user-nav:hover{background:rgba(201,169,97,.1);}',
        '.s2i-user-avatar{width:32px;height:32px;border-radius:50%;background:#C9A961;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.85rem;font-family:"Poppins",sans-serif;flex-shrink:0;}',
        '.s2i-user-name{color:#1A1A1A;font-size:.85rem;font-weight:600;font-family:"Poppins",sans-serif;white-space:nowrap;}',
        '.s2i-user-chevron{color:#999;font-size:.65rem;transition:transform .2s;}',
        '.s2i-user-chevron.open{transform:rotate(180deg);}',

        /* Dropdown menu — Light theme */
        '.s2i-dropdown{position:absolute;top:calc(100% + 6px);right:0;background:#fff;border:1px solid #e8e8e8;border-radius:8px;min-width:200px;padding:.5rem 0;opacity:0;transform:translateY(-4px);transition:opacity .2s,transform .2s;pointer-events:none;z-index:9997;box-shadow:0 8px 24px rgba(0,0,0,.1);}',
        '.s2i-dropdown.active{opacity:1;transform:translateY(0);pointer-events:all;}',
        '.s2i-dropdown a,.s2i-dropdown button{display:flex;align-items:center;gap:10px;width:100%;padding:.6rem 1rem;background:none;border:none;color:#555;font-size:.85rem;font-family:"Poppins",sans-serif;cursor:pointer;text-decoration:none;transition:background .15s,color .15s;text-align:left;}',
        '.s2i-dropdown a:hover,.s2i-dropdown button:hover{background:rgba(201,169,97,.08);color:#C9A961;}',
        '.s2i-dropdown .sep{height:1px;background:#f0f0f0;margin:.4rem 0;}',
        '.s2i-dropdown svg{width:16px;height:16px;flex-shrink:0;opacity:.7;}',

        /* Mobile */
        '@media(max-width:991px){.s2i-user-name{display:none;}.s2i-modal{padding:2rem 1.5rem 1.5rem;}}'
    ].join('\n');
    document.head.appendChild(css);

    // ── Ícones SVG ──
    var ICONS = {
        dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
        profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
        plans: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
        member: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15l-3-3m0 0l3-3m-3 3h12M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z"/></svg>',
        logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'
    };

    // ── Criar overlay + modal ──
    var overlay = document.createElement('div');
    overlay.className = 's2i-overlay';
    document.body.appendChild(overlay);

    var modal = document.createElement('div');
    modal.className = 's2i-modal';
    modal.innerHTML = [
        '<button class="s2i-modal-close" aria-label="Fechar">&times;</button>',
        '<h3 id="s2i-modal-title">Iniciar sessão</h3>',
        '<p class="subtitle" id="s2i-modal-subtitle">Acede à tua área de cliente</p>',
        '<form id="s2i-auth-form">',
        '  <div id="s2i-name-fields" class="name-row" style="display:none;">',
        '    <div class="field"><label for="s2i-fname">Nome</label><input type="text" id="s2i-fname" placeholder="João" autocomplete="given-name"></div>',
        '    <div class="field"><label for="s2i-lname">Apelido</label><input type="text" id="s2i-lname" placeholder="Silva" autocomplete="family-name"></div>',
        '  </div>',
        '  <div class="field"><label for="s2i-email">Email</label><input type="email" id="s2i-email" placeholder="o.teu@email.com" required autocomplete="email"></div>',
        '  <div class="field"><label for="s2i-pass">Palavra-passe</label><input type="password" id="s2i-pass" placeholder="••••••••" required autocomplete="current-password"></div>',
        '  <div class="field" id="s2i-pass-confirm-field" style="display:none;"><label for="s2i-pass2">Confirmar palavra-passe</label><input type="password" id="s2i-pass2" placeholder="••••••••" autocomplete="new-password"></div>',
        '  <button type="submit" class="s2i-btn" id="s2i-submit-btn">Entrar</button>',
        '  <div class="error-msg" id="s2i-error"></div>',
        '  <div class="success-msg" id="s2i-success" style="display:none;"></div>',
        '  <a class="forgot-link" id="s2i-forgot">Esqueceste a palavra-passe?</a>',
        '  <a class="toggle-link" id="s2i-toggle">Ainda não tens conta? <strong>Cria aqui</strong></a>',
        '</form>'
    ].join('\n');
    document.body.appendChild(modal);

    // ── Referências DOM ──
    var form = document.getElementById('s2i-auth-form');
    var titleEl = document.getElementById('s2i-modal-title');
    var subtitleEl = document.getElementById('s2i-modal-subtitle');
    var nameFields = document.getElementById('s2i-name-fields');
    var confirmField = document.getElementById('s2i-pass-confirm-field');
    var emailInput = document.getElementById('s2i-email');
    var passInput = document.getElementById('s2i-pass');
    var pass2Input = document.getElementById('s2i-pass2');
    var fnameInput = document.getElementById('s2i-fname');
    var lnameInput = document.getElementById('s2i-lname');
    var submitBtn = document.getElementById('s2i-submit-btn');
    var errorEl = document.getElementById('s2i-error');
    var successEl = document.getElementById('s2i-success');
    var forgotLink = document.getElementById('s2i-forgot');
    var toggleLink = document.getElementById('s2i-toggle');
    var closeBtn = modal.querySelector('.s2i-modal-close');

    var isRegister = false;
    var isReset = false;

    function showModal() {
        overlay.classList.add('active');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(function() { emailInput.focus(); }, 200);
    }

    function hideModal() {
        overlay.classList.remove('active');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        errorEl.textContent = '';
        successEl.style.display = 'none';
    }

    function setMode(mode) {
        errorEl.textContent = '';
        successEl.style.display = 'none';

        if (mode === 'register') {
            isRegister = true;
            isReset = false;
            titleEl.textContent = 'Criar conta';
            subtitleEl.textContent = 'Regista-te para aceder às ferramentas';
            nameFields.style.display = 'flex';
            confirmField.style.display = 'block';
            submitBtn.textContent = 'Criar conta';
            forgotLink.style.display = 'none';
            toggleLink.innerHTML = 'Já tens conta? <strong>Inicia sessão</strong>';
        } else if (mode === 'reset') {
            isRegister = false;
            isReset = true;
            titleEl.textContent = 'Recuperar palavra-passe';
            subtitleEl.textContent = 'Envia um link de recuperação para o teu email';
            nameFields.style.display = 'none';
            confirmField.style.display = 'none';
            passInput.parentElement.style.display = 'none';
            submitBtn.textContent = 'Enviar link';
            forgotLink.style.display = 'none';
            toggleLink.innerHTML = '<strong>Voltar ao login</strong>';
        } else {
            isRegister = false;
            isReset = false;
            titleEl.textContent = 'Iniciar sessão';
            subtitleEl.textContent = 'Acede à tua área de cliente';
            nameFields.style.display = 'none';
            confirmField.style.display = 'none';
            passInput.parentElement.style.display = 'block';
            submitBtn.textContent = 'Entrar';
            forgotLink.style.display = '';
            toggleLink.innerHTML = 'Ainda não tens conta? <strong>Cria aqui</strong>';
        }
    }

    // ── Eventos do modal ──
    closeBtn.addEventListener('click', hideModal);
    overlay.addEventListener('click', hideModal);

    toggleLink.addEventListener('click', function(e) {
        e.preventDefault();
        if (isReset) {
            setMode('login');
        } else {
            setMode(isRegister ? 'login' : 'register');
        }
    });

    forgotLink.addEventListener('click', function(e) {
        e.preventDefault();
        setMode('reset');
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        errorEl.textContent = '';
        successEl.style.display = 'none';

        var client = window.S2I_AUTH && window.S2I_AUTH.supabaseClient;
        if (!client) {
            errorEl.textContent = 'Erro de ligação. Recarrega a página.';
            return;
        }

        var email = emailInput.value.trim();
        var pass = passInput.value;

        submitBtn.disabled = true;
        submitBtn.textContent = isReset ? 'A enviar...' : isRegister ? 'A criar...' : 'A entrar...';

        if (isReset) {
            client.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/area-cliente/'
            }).then(function(result) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Enviar link';
                if (result.error) {
                    errorEl.textContent = result.error.message;
                } else {
                    successEl.textContent = 'Email enviado! Verifica a tua caixa de correio.';
                    successEl.style.display = 'block';
                }
            });
            return;
        }

        if (isRegister) {
            if (pass !== pass2Input.value) {
                errorEl.textContent = 'As palavras-passe não coincidem.';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Criar conta';
                return;
            }
            if (pass.length < 6) {
                errorEl.textContent = 'A palavra-passe deve ter pelo menos 6 caracteres.';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Criar conta';
                return;
            }

            var fullName = (fnameInput.value.trim() + ' ' + lnameInput.value.trim()).trim();

            client.auth.signUp({
                email: email,
                password: pass,
                options: {
                    data: { full_name: fullName, name: fullName }
                }
            }).then(function(result) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Criar conta';
                if (result.error) {
                    var msg = result.error.message;
                    if (msg.indexOf('already registered') !== -1) msg = 'Este email já está registado. Inicia sessão.';
                    errorEl.textContent = msg;
                } else if (result.data && result.data.user && !result.data.session) {
                    successEl.textContent = 'Conta criada! Verifica o teu email para confirmar.';
                    successEl.style.display = 'block';
                } else {
                    // Auto-login
                    hideModal();
                }
            });
        } else {
            client.auth.signInWithPassword({
                email: email,
                password: pass
            }).then(function(result) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Entrar';
                if (result.error) {
                    var msg = result.error.message;
                    if (msg.indexOf('Invalid login') !== -1) msg = 'Email ou palavra-passe incorretos.';
                    errorEl.textContent = msg;
                } else {
                    hideModal();
                }
            });
        }
    });

    // ── Substituir o botão "Área de Cliente" na nav ──
    function replaceNavButton() {
        var link = document.querySelector('a[href*="area-cliente"]');
        var navItem;
        var navList;
        if (link) {
            navItem = link.closest('li') || link.parentElement;
        } else {
            // Fallback: adicionar ao final da navbar
            navList = document.querySelector('#navbarNav .navbar-nav') || document.querySelector('.navbar-nav');
            if (!navList) return;
        };

        // Criar container para o botão/dropdown
        var container = document.createElement('li');
        container.className = 'nav-item ms-2';
        container.id = 's2i-auth-nav-container';

        function renderLoggedOut() {
            container.innerHTML = '';
            var btn = document.createElement('a');
            btn.href = '#';
            btn.className = 'nav-link';
            btn.style.cssText = 'background:#BF9A33;color:#0a0a0a !important;padding:0.4rem 1rem;border-radius:4px;font-weight:600;transition:all 0.3s;cursor:pointer;';
            btn.textContent = 'Área de Cliente';
            btn.addEventListener('mouseenter', function() { this.style.background = '#d4af5a'; });
            btn.addEventListener('mouseleave', function() { this.style.background = '#BF9A33'; });
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                setMode('login');
                showModal();
            });
            container.appendChild(btn);
        }

        function renderLoggedIn(user) {
            container.innerHTML = '';
            var displayName = '';
            var initials = '';
            if (user.user_metadata && user.user_metadata.full_name) {
                displayName = user.user_metadata.full_name.split(' ')[0];
                var parts = user.user_metadata.full_name.split(' ');
                initials = parts[0].charAt(0).toUpperCase();
                if (parts.length > 1) initials += parts[parts.length - 1].charAt(0).toUpperCase();
            } else if (user.user_metadata && user.user_metadata.name) {
                displayName = user.user_metadata.name.split(' ')[0];
                initials = displayName.charAt(0).toUpperCase();
            } else if (user.email) {
                displayName = user.email.split('@')[0];
                initials = displayName.charAt(0).toUpperCase();
            }

            var userNav = document.createElement('div');
            userNav.className = 's2i-user-nav';
            userNav.innerHTML = [
                '<div class="s2i-user-avatar">' + initials + '</div>',
                '<span class="s2i-user-name">' + displayName + '</span>',
                '<span class="s2i-user-chevron">&#9660;</span>'
            ].join('');

            var dropdown = document.createElement('div');
            dropdown.className = 's2i-dropdown';
            dropdown.innerHTML = [
                '<a href="/area-cliente/perfil">' + ICONS.dashboard + ' Dashboard</a>',
                '<a href="/area-cliente/perfil">' + ICONS.profile + ' O meu perfil</a>',
                '<a href="/area-cliente/planos">' + ICONS.plans + ' Planos</a>',
                '<a href="/area-cliente/membros">' + ICONS.member + ' Área de membros</a>',
                '<div class="sep"></div>',
                '<button id="s2i-logout-btn">' + ICONS.logout + ' Terminar sessão</button>'
            ].join('');

            userNav.appendChild(dropdown);
            container.appendChild(userNav);

            // Toggle dropdown
            var isOpen = false;
            userNav.addEventListener('click', function(e) {
                // Não fechar se clicar num link
                if (e.target.closest('a') || e.target.closest('#s2i-logout-btn')) return;
                isOpen = !isOpen;
                dropdown.classList.toggle('active', isOpen);
                userNav.querySelector('.s2i-user-chevron').classList.toggle('open', isOpen);
            });

            // Fechar ao clicar fora
            document.addEventListener('click', function(e) {
                if (!userNav.contains(e.target)) {
                    isOpen = false;
                    dropdown.classList.remove('active');
                    var chevron = userNav.querySelector('.s2i-user-chevron');
                    if (chevron) chevron.classList.remove('open');
                }
            });

            // Logout
            dropdown.querySelector('#s2i-logout-btn').addEventListener('click', function(e) {
                e.stopPropagation();
                var client = window.S2I_AUTH && window.S2I_AUTH.supabaseClient;
                if (client) {
                    client.auth.signOut().then(function() {
                        renderLoggedOut();
                    });
                }
            });
        }

        // Substituir o link original ou adicionar ao final da nav
        if (navItem) {
            navItem.replaceWith(container);
        } else if (navList) {
            navList.appendChild(container);
        }

        // Estado inicial
        if (window.S2I_AUTH && window.S2I_AUTH.ready) {
            if (window.S2I_AUTH.currentUser) {
                renderLoggedIn(window.S2I_AUTH.currentUser);
            } else {
                renderLoggedOut();
            }
        } else {
            renderLoggedOut();
        }

        // Escutar mudanças de auth
        if (window.S2I_AUTH) {
            var origSetSession = window.S2I_AUTH._inlineAuthSetSession;
            // Hook into auth state changes via polling
            var lastUser = null;
            setInterval(function() {
                var currentUser = window.S2I_AUTH.currentUser;
                var currentId = currentUser ? currentUser.id : null;
                var lastId = lastUser ? lastUser.id : null;
                if (currentId !== lastId) {
                    lastUser = currentUser;
                    if (currentUser) {
                        renderLoggedIn(currentUser);
                    } else {
                        renderLoggedOut();
                    }
                }
            }, 500);

            // Also listen for onReady
            if (!window.S2I_AUTH.ready) {
                window.S2I_AUTH.onReady.push(function(auth) {
                    if (auth.currentUser) {
                        renderLoggedIn(auth.currentUser);
                    }
                });
            }
        }
    }

    // ── Inicializar ──
    function init() {
        replaceNavButton();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // Aguardar que o shared-auth.js carregue primeiro
        setTimeout(init, 300);
    }
})();
