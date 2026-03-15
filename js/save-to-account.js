/**
 * Share2Inspire — Botão "Guardar na minha conta"
 * 
 * Injeta automaticamente um botão "Guardar na minha conta" nas páginas de resultados
 * do CV Analyser, Career Path, LinkedIn Roaster e Career Energy Score
 * quando o utilizador está autenticado.
 * 
 * O botão é posicionado ao lado do botão de ação existente (ex: "Enviar resultados por e-mail",
 * "Partilhar no LinkedIn", "Copiar Post LinkedIn") em vez de flutuante.
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

    // Career Energy is on the main index.html (homepage)
    var isCEPage = (path === '/' || path === '/index.html' || path === '' || path.indexOf('/pages/') === -1 && document.getElementById('career-energy'));
    if (!toolType && !isCEPage) return;

    var TOOL_LABELS = {
        cv_analyser: 'CV Analyser',
        career_path: 'Career Path',
        linkedin_roaster: 'LinkedIn Roaster',
        career_energy: 'Career Energy Score'
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
        var label = toolType ? TOOL_LABELS[toolType] : 'Career Energy Score';
        console.log('[S2I Save] A observar resultados de ' + label);
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

        if (toolType === 'cv_analyser') {
            injectForCVAnalyser();
        } else if (toolType === 'career_path') {
            injectForCareerPath();
        } else if (toolType === 'linkedin_roaster') {
            injectForLinkedInRoaster();
        } else if (isCEPage) {
            injectForCareerEnergy();
        }
    }

    /**
     * CV Analyser: inject next to the "Enviar" button in results
     */
    function injectForCVAnalyser() {
        // Look for buttons with text "Enviar", "Download", "PDF", "E-mail" in the results area
        var buttons = document.querySelectorAll('button');
        for (var i = 0; i < buttons.length; i++) {
            var text = (buttons[i].textContent || '').trim();
            if ((text.indexOf('Enviar') !== -1 || text.indexOf('Download') !== -1 || text.indexOf('PDF') !== -1 || text.indexOf('E-mail') !== -1) && text.length < 50) {
                // Found an action button - inject next to it
                var parent = buttons[i].parentElement;
                if (parent && parent.textContent.length > 50) {
                    injectButton(buttons[i], 'cv_analyser');
                    return;
                }
            }
        }
        // Fallback: look for score display
        var allText = document.body.innerText || '';
        if (allText.match(/\d{1,3}\s*\/\s*100/) || allText.indexOf('Score ATS') !== -1) {
            var scoreElements = document.querySelectorAll('h1, h2, h3, [class*="score"], [class*="Score"]');
            for (var j = 0; j < scoreElements.length; j++) {
                var t = (scoreElements[j].textContent || '').trim();
                if (t.match(/\d{1,3}\s*\/\s*100/) || t.indexOf('Score') !== -1) {
                    var container = scoreElements[j].closest('section') || scoreElements[j].closest('main');
                    if (container) {
                        var actionBtns = container.querySelectorAll('button');
                        if (actionBtns.length > 0) {
                            injectButton(actionBtns[actionBtns.length - 1], 'cv_analyser');
                            return;
                        }
                    }
                }
            }
        }
    }

    /**
     * Career Path: inject next to the "Enviar" / "Download" button
     */
    function injectForCareerPath() {
        var buttons = document.querySelectorAll('button');
        for (var i = 0; i < buttons.length; i++) {
            var text = (buttons[i].textContent || '').trim();
            if ((text.indexOf('Enviar') !== -1 || text.indexOf('Download') !== -1 || text.indexOf('PDF') !== -1) && text.length < 50) {
                var parent = buttons[i].parentElement;
                if (parent) {
                    injectButton(buttons[i], 'career_path');
                    return;
                }
            }
        }
    }

    /**
     * LinkedIn Roaster: inject next to "Partilhar o meu score no LinkedIn" button
     */
    function injectForLinkedInRoaster() {
        var successSection = document.getElementById('successSection');
        if (!successSection) return;
        var s = window.getComputedStyle(successSection);
        if (s.display === 'none' || s.visibility === 'hidden') return;

        var shareBtn = successSection.querySelector('.share-linkedin-btn');
        if (shareBtn) {
            injectButton(shareBtn, 'linkedin_roaster');
            return;
        }
        // Fallback: look for any button in successSection
        var btns = successSection.querySelectorAll('button');
        if (btns.length > 0) {
            injectButton(btns[0], 'linkedin_roaster');
        }
    }

    /**
     * Career Energy Score: inject next to "Copiar Post LinkedIn" button
     */
    function injectForCareerEnergy() {
        var resultsStep = document.getElementById('ceResultsStep');
        if (!resultsStep) return;
        if (resultsStep.style.display === 'none') return;

        var linkedinBtn = document.getElementById('ceBtnLinkedIn');
        if (linkedinBtn) {
            injectButton(linkedinBtn, 'career_energy');
            return;
        }
        // Fallback: look in .ce-result-actions
        var actions = resultsStep.querySelector('.ce-result-actions');
        if (actions) {
            var btns = actions.querySelectorAll('button');
            if (btns.length > 0) {
                injectButton(btns[btns.length - 1], 'career_energy');
            }
        }
    }

    /**
     * Inject the save button next to the reference button (sibling)
     */
    function injectButton(referenceBtn, type) {
        if (buttonInjected || document.getElementById('s2i-save-to-account')) return;
        buttonInjected = true;

        var btn = document.createElement('button');
        btn.id = 's2i-save-to-account';
        btn.type = 'button';
        btn.innerHTML = getSaveIcon() + ' Guardar na minha conta';
        btn.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 20px;background:linear-gradient(135deg,#BF9A33 0%,#d4af5a 100%);color:#0a0a0a;border:none;border-radius:8px;font-weight:600;font-size:0.82rem;cursor:pointer;transition:all 0.3s ease;font-family:Poppins,system-ui,sans-serif;box-shadow:0 2px 8px rgba(191,154,51,0.3);letter-spacing:0.3px;margin-top:8px;';

        btn.onmouseover = function() { btn.style.transform = 'translateY(-1px)'; btn.style.boxShadow = '0 4px 12px rgba(191,154,51,0.4)'; };
        btn.onmouseout = function() { btn.style.transform = 'translateY(0)'; btn.style.boxShadow = '0 2px 8px rgba(191,154,51,0.3)'; };

        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            saveToAccount(btn, type);
        });

        // Insert after the reference button (as a sibling)
        var parent = referenceBtn.parentElement;
        if (parent) {
            // If parent is a flex/grid container, just append after the reference button
            if (referenceBtn.nextSibling) {
                parent.insertBefore(btn, referenceBtn.nextSibling);
            } else {
                parent.appendChild(btn);
            }
        }

        var label = TOOL_LABELS[type] || type;
        console.log('[S2I Save] Botao injetado ao lado do botao de acao em ' + label);
    }

    /**
     * Save analysis to Supabase user_analyses table
     */
    function saveToAccount(btn, type) {
        var auth = window.S2I_AUTH;
        if (!auth || !auth.currentUser || !auth.currentSession) {
            showToast('Sessao expirada. Faz login na Area de Cliente e volta aqui.', 'error');
            return;
        }

        var originalHTML = btn.innerHTML;
        btn.innerHTML = getSpinnerIcon() + ' A guardar...';
        btn.disabled = true;
        btn.style.opacity = '0.7';

        var analysisData = captureResults(type);

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
                analysis_type: type,
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
     * Capture analysis results based on tool type
     */
    function captureResults(type) {
        var data = {
            tool: type,
            tool_label: TOOL_LABELS[type] || type,
            url: window.location.href,
            page_title: document.title,
            captured_at: new Date().toISOString()
        };

        if (type === 'cv_analyser') {
            var allText = document.body.innerText || '';
            var scoreMatch = allText.match(/(\d{1,3})\s*\/\s*100/);
            if (scoreMatch) data.score = parseInt(scoreMatch[1]);
            captureStorage(data, /cv|analysis|result|score|report/i);
            data.visible_sections = captureVisibleSections('section, [class*="result"], [class*="analysis"], [class*="quadrant"]');
        } else if (type === 'career_path') {
            captureStorage(data, /career|path|result|roadmap|plan/i);
            data.visible_sections = captureVisibleSections('section, [class*="result"], [class*="career"], [class*="roadmap"], [class*="plan"]');
        } else if (type === 'linkedin_roaster') {
            if (window.analysisData) data.analysis = window.analysisData;
            var fullResults = document.getElementById('fullResults');
            if (fullResults) {
                data.results_text = fullResults.textContent.substring(0, 5000);
            }
            var emailEl = document.getElementById('successEmail');
            if (emailEl) data.email_used = emailEl.textContent.trim();
            captureStorage(data, /roaster|linkedin|analysis/i);
        } else if (type === 'career_energy') {
            // Capture from window._ceData (set by the Career Energy quiz)
            if (window._ceData) {
                data.total_score = window._ceData.score;
                data.level = window._ceData.level ? window._ceData.level.label : null;
                data.percentile = window._ceData.percentile;
                data.dimensions = {
                    energy: window._ceData.dimScores ? window._ceData.dimScores[0] : null,
                    clarity: window._ceData.dimScores ? window._ceData.dimScores[1] : null,
                    positioning: window._ceData.dimScores ? window._ceData.dimScores[2] : null,
                    purpose: window._ceData.dimScores ? window._ceData.dimScores[3] : null
                };
                if (window._ceData.profile) {
                    data.profile = {
                        name: window._ceData.profile.name,
                        role: window._ceData.profile.role,
                        experience: window._ceData.profile.experience,
                        country: window._ceData.profile.country
                    };
                }
            }
            // Also capture dimension insights from the DOM
            for (var d = 0; d < 4; d++) {
                var insightEl = document.getElementById('ceDimInsight' + d);
                if (insightEl) {
                    if (!data.dim_insights) data.dim_insights = [];
                    data.dim_insights.push(insightEl.textContent.trim());
                }
            }
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
