/**
 * Share2Inspire — Botão "Guardar na minha conta"
 * 
 * Injeta automaticamente um botão "Guardar na minha conta" nas páginas de resultados
 * do CV Analyser, Career Path e LinkedIn Roaster quando o utilizador está autenticado.
 * 
 * Funciona com builds React minificados e HTML puro sem necessidade de alterar o código-fonte.
 * Usa MutationObserver para detetar quando os resultados aparecem no DOM.
 * 
 * Dependência: shared-auth.js (carrega Supabase e gere sessão)
 */
(function() {
    'use strict';

    var SUPA_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
    var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';

    var buttonInjected = false;

    // Detect which tool we're on
    var path = window.location.pathname;
    var toolType = null;
    if (path.indexOf('/cv-analyser') !== -1) toolType = 'cv_analyser';
    else if (path.indexOf('/career-path') !== -1) toolType = 'career_path';
    else if (path.indexOf('/linkedin-roaster') !== -1) toolType = 'linkedin_roaster';

    if (!toolType) return;

    var TOOL_LABELS = {
        cv_analyser: 'CV Analyser',
        career_path: 'Career Path',
        linkedin_roaster: 'LinkedIn Roaster'
    };

    /**
     * Wait for shared-auth to be ready, then start watching
     */
    function waitForAuth() {
        if (window.S2I_AUTH && window.S2I_AUTH.ready) {
            if (window.S2I_AUTH.currentUser) {
                startWatching();
            } else {
                console.log('[S2I Save] Utilizador nao autenticado');
            }
            return;
        }
        if (window.S2I_AUTH) {
            window.S2I_AUTH.onReady.push(function(auth) {
                if (auth.currentUser) startWatching();
            });
            return;
        }
        setTimeout(waitForAuth, 300);
    }

    /**
     * Watch for results appearing in the DOM
     */
    function startWatching() {
        console.log('[S2I Save] A observar resultados de ' + TOOL_LABELS[toolType]);
        checkForResults();

        var observer = new MutationObserver(function() {
            if (!buttonInjected) checkForResults();
        });
        observer.observe(document.body, { childList: true, subtree: true });

        var checkInterval = setInterval(function() {
            if (buttonInjected) { clearInterval(checkInterval); return; }
            checkForResults();
        }, 2000);
        setTimeout(function() { clearInterval(checkInterval); }, 300000);
    }

    /**
     * Check if results are visible and inject the save button
     */
    function checkForResults() {
        if (buttonInjected) return;
        var container = null;

        if (toolType === 'cv_analyser') container = findCVAnalyserResults();
        else if (toolType === 'career_path') container = findCareerPathResults();
        else if (toolType === 'linkedin_roaster') container = findLinkedInRoasterResults();

        if (container) injectSaveButton(container);
    }

    function findCVAnalyserResults() {
        var candidates = document.querySelectorAll('h1, h2, h3, [class*="score"], [class*="result"], [class*="Score"], [class*="Result"]');
        for (var i = 0; i < candidates.length; i++) {
            var text = (candidates[i].textContent || '').trim();
            if ((text.match(/\d{1,3}\s*\/\s*100/) || text.indexOf('Score ATS') !== -1 || text.indexOf('ATS Score') !== -1) && text.length < 300) {
                var c = candidates[i].closest('section') || candidates[i].closest('[class*="result"]') || candidates[i].closest('main') || candidates[i].parentElement;
                if (c) return c;
            }
        }
        var buttons = document.querySelectorAll('button');
        for (var i = 0; i < buttons.length; i++) {
            var text = (buttons[i].textContent || '').trim();
            if (text.indexOf('Enviar') !== -1 || text.indexOf('Download') !== -1 || text.indexOf('Descarregar') !== -1 || text.indexOf('E-mail') !== -1) {
                var c = buttons[i].closest('section') || buttons[i].closest('main') || buttons[i].parentElement;
                if (c && c.textContent.length > 200) return c;
            }
        }
        return null;
    }

    function findCareerPathResults() {
        var candidates = document.querySelectorAll('h1, h2, h3, [class*="result"], [class*="career"], [class*="roadmap"], [class*="path"]');
        for (var i = 0; i < candidates.length; i++) {
            var text = (candidates[i].textContent || '').trim();
            if ((text.indexOf('Plano de Carreira') !== -1 || text.indexOf('Career Plan') !== -1 || text.indexOf('Roadmap') !== -1 || text.indexOf('Resultado') !== -1 || text.indexOf('30-60-90') !== -1) && text.length < 300) {
                var c = candidates[i].closest('section') || candidates[i].closest('[class*="result"]') || candidates[i].closest('main') || candidates[i].parentElement;
                if (c) return c;
            }
        }
        var buttons = document.querySelectorAll('button');
        for (var i = 0; i < buttons.length; i++) {
            var text = (buttons[i].textContent || '').trim();
            if (text.indexOf('Enviar') !== -1 || text.indexOf('Download') !== -1 || text.indexOf('PDF') !== -1) {
                var c = buttons[i].closest('section') || buttons[i].closest('main') || buttons[i].parentElement;
                if (c && c.textContent.length > 200) return c;
            }
        }
        return null;
    }

    function findLinkedInRoasterResults() {
        var el = document.getElementById('successSection');
        if (el && el.offsetParent !== null) {
            var s = window.getComputedStyle(el);
            if (s.display !== 'none' && s.visibility !== 'hidden') return el;
        }
        var teaser = document.getElementById('teaserSection');
        if (teaser && teaser.offsetParent !== null) {
            var s = window.getComputedStyle(teaser);
            if (s.display !== 'none' && s.visibility !== 'hidden') return teaser;
        }
        return null;
    }

    /**
     * Inject the "Guardar na minha conta" button
     */
    function injectSaveButton(container) {
        if (buttonInjected || document.getElementById('s2i-save-to-account')) return;
        buttonInjected = true;

        var wrapper = document.createElement('div');
        wrapper.id = 's2i-save-wrapper';
        wrapper.style.cssText = 'display:flex;justify-content:center;align-items:center;padding:16px 0;margin:12px 0;';

        var btn = document.createElement('button');
        btn.id = 's2i-save-to-account';
        btn.type = 'button';
        btn.innerHTML = getSaveIcon() + ' Guardar na minha conta';
        btn.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 24px;background:linear-gradient(135deg,#BF9A33 0%,#d4af5a 100%);color:#0a0a0a;border:none;border-radius:8px;font-weight:600;font-size:14px;cursor:pointer;transition:all 0.3s ease;font-family:Poppins,system-ui,sans-serif;box-shadow:0 2px 8px rgba(191,154,51,0.3);letter-spacing:0.3px;';

        btn.onmouseover = function() { btn.style.transform = 'translateY(-1px)'; btn.style.boxShadow = '0 4px 12px rgba(191,154,51,0.4)'; };
        btn.onmouseout = function() { btn.style.transform = 'translateY(0)'; btn.style.boxShadow = '0 2px 8px rgba(191,154,51,0.3)'; };

        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            saveToAccount(btn);
        });

        wrapper.appendChild(btn);

        // Insert in the right place
        if (toolType === 'linkedin_roaster') {
            var shareBtn = container.querySelector('.share-linkedin-btn');
            if (shareBtn && shareBtn.parentElement) {
                shareBtn.parentElement.insertBefore(wrapper, shareBtn.nextSibling);
            } else {
                var resultCard = container.querySelector('.result-card');
                if (resultCard) {
                    var tc = resultCard.querySelector('[style*="text-align:center"]');
                    if (tc) tc.appendChild(wrapper);
                    else resultCard.insertBefore(wrapper, resultCard.firstChild);
                } else {
                    container.insertBefore(wrapper, container.firstChild);
                }
            }
        } else {
            var actionButtons = container.querySelectorAll('button');
            var lastButton = null;
            for (var i = 0; i < actionButtons.length; i++) {
                var t = (actionButtons[i].textContent || '').trim();
                if (t.indexOf('Enviar') !== -1 || t.indexOf('Download') !== -1 || t.indexOf('E-mail') !== -1 || t.indexOf('PDF') !== -1) {
                    lastButton = actionButtons[i];
                }
            }
            if (lastButton && lastButton.parentElement) {
                lastButton.parentElement.insertBefore(wrapper, lastButton.nextSibling);
            } else {
                container.insertBefore(wrapper, container.firstChild);
            }
        }

        console.log('[S2I Save] Botao injetado em ' + TOOL_LABELS[toolType]);
    }

    /**
     * Save analysis to Supabase
     */
    function saveToAccount(btn) {
        var auth = window.S2I_AUTH;
        if (!auth || !auth.currentUser || !auth.currentSession) {
            showToast('Sessao expirada. Faz login na Area de Cliente e volta aqui.', 'error');
            return;
        }

        var originalHTML = btn.innerHTML;
        btn.innerHTML = getSpinnerIcon() + ' A guardar...';
        btn.disabled = true;
        btn.style.opacity = '0.7';

        var analysisData = captureResults();

        fetch(SUPA_URL + '/rest/v1/user_analyses', {
            method: 'POST',
            headers: {
                'apikey': SUPA_KEY,
                'Authorization': 'Bearer ' + auth.currentSession.access_token,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                user_id: auth.currentUser.id,
                analysis_type: toolType,
                data: analysisData,
                created_at: new Date().toISOString()
            })
        }).then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        }).then(function() {
            btn.innerHTML = getCheckIcon() + ' Guardado!';
            btn.style.background = 'linear-gradient(135deg,#22c55e 0%,#16a34a 100%)';
            btn.style.color = '#fff';
            btn.style.opacity = '1';
            showToast('Analise guardada! Ve-la na Area de Cliente.', 'success');
            setTimeout(function() {
                btn.innerHTML = originalHTML;
                btn.style.background = 'linear-gradient(135deg,#BF9A33 0%,#d4af5a 100%)';
                btn.style.color = '#0a0a0a';
                btn.disabled = false;
            }, 4000);
        }).catch(function() {
            btn.innerHTML = getErrorIcon() + ' Erro ao guardar';
            btn.style.background = 'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)';
            btn.style.color = '#fff';
            btn.style.opacity = '1';
            showToast('Nao foi possivel guardar. Tenta novamente.', 'error');
            setTimeout(function() {
                btn.innerHTML = originalHTML;
                btn.style.background = 'linear-gradient(135deg,#BF9A33 0%,#d4af5a 100%)';
                btn.style.color = '#0a0a0a';
                btn.disabled = false;
            }, 3000);
        });
    }

    /**
     * Capture analysis results
     */
    function captureResults() {
        var data = {
            tool: toolType,
            tool_label: TOOL_LABELS[toolType],
            url: window.location.href,
            page_title: document.title,
            captured_at: new Date().toISOString()
        };

        if (toolType === 'cv_analyser') {
            var allText = document.body.innerText || '';
            var scoreMatch = allText.match(/(\d{1,3})\s*\/\s*100/);
            if (scoreMatch) data.score = parseInt(scoreMatch[1]);
            captureStorage(data, /cv|analysis|result|score|report/i);
            data.visible_sections = captureVisibleSections('section, [class*="result"], [class*="analysis"], [class*="quadrant"]');
        } else if (toolType === 'career_path') {
            captureStorage(data, /career|path|result|roadmap|plan/i);
            data.visible_sections = captureVisibleSections('section, [class*="result"], [class*="career"], [class*="roadmap"], [class*="plan"]');
        } else if (toolType === 'linkedin_roaster') {
            if (window.analysisData) data.analysis = window.analysisData;
            var fullResults = document.getElementById('fullResults');
            if (fullResults) {
                data.results_text = fullResults.textContent.substring(0, 5000);
            }
            var emailEl = document.getElementById('successEmail');
            if (emailEl) data.email_used = emailEl.textContent.trim();
            captureStorage(data, /roaster|linkedin|analysis/i);
        }

        return data;
    }

    function captureStorage(data, pattern) {
        try {
            ['sessionStorage', 'localStorage'].forEach(function(st) {
                var storage = window[st];
                var keys = Object.keys(storage);
                for (var i = 0; i < keys.length; i++) {
                    if (keys[i].match(pattern)) {
                        try { data['s_' + keys[i]] = JSON.parse(storage.getItem(keys[i])); }
                        catch(e) { var v = storage.getItem(keys[i]); if (v && v.length < 10000) data['s_' + keys[i]] = v; }
                    }
                }
            });
        } catch(e) {}
    }

    function captureVisibleSections(selector) {
        var sections = document.querySelectorAll(selector);
        var texts = [];
        sections.forEach(function(el) {
            var t = (el.textContent || '').trim();
            if (t.length > 100 && t.length < 5000) texts.push(t.substring(0, 2000));
        });
        return texts.slice(0, 5);
    }

    /**
     * Toast notification
     */
    function showToast(message, type) {
        var existing = document.getElementById('s2i-toast');
        if (existing) existing.remove();
        var toast = document.createElement('div');
        toast.id = 's2i-toast';
        var bg = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#BF9A33';
        toast.style.cssText = 'position:fixed;bottom:24px;right:24px;padding:14px 24px;background:' + bg + ';color:#fff;border-radius:10px;font-size:14px;font-weight:500;font-family:Poppins,system-ui,sans-serif;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,0.3);transform:translateY(100px);opacity:0;transition:all 0.4s cubic-bezier(0.16,1,0.3,1);max-width:360px;line-height:1.4;';
        toast.textContent = message;
        document.body.appendChild(toast);
        requestAnimationFrame(function() { toast.style.transform = 'translateY(0)'; toast.style.opacity = '1'; });
        setTimeout(function() {
            toast.style.transform = 'translateY(100px)'; toast.style.opacity = '0';
            setTimeout(function() { toast.remove(); }, 400);
        }, 5000);
    }

    function getSaveIcon() {
        return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>';
    }
    function getSpinnerIcon() {
        return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;animation:s2i-spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"></circle></svg>';
    }
    function getCheckIcon() {
        return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    }
    function getErrorIcon() {
        return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    }

    // CSS animation
    var style = document.createElement('style');
    style.textContent = '@keyframes s2i-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}';
    document.head.appendChild(style);

    // Bootstrap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { setTimeout(waitForAuth, 500); });
    } else {
        setTimeout(waitForAuth, 500);
    }
})();
