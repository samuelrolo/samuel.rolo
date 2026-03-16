/**
 * Share2Inspire — Botão "Guardar na minha conta"
 * 
 * Injeta automaticamente um botão "Guardar na minha conta" nas páginas de resultados
 * do CV Analyser, Career Path, LinkedIn Roaster e Career Energy Score
 * quando o utilizador está autenticado.
 * 
 * Captura o HTML COMPLETO dos resultados visíveis (como o email) para
 * visualização futura na Área de Cliente.
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
    var isCEPage = !toolType && (path === '/' || path === '/index.html' || path === '') && !!document.getElementById('career-energy');
    if (!toolType && !isCEPage) {
        if (path === '/' || path === '/index.html' || path === '') {
            document.addEventListener('DOMContentLoaded', function() {
                if (document.getElementById('career-energy')) {
                    isCEPage = true;
                    waitForAuth();
                }
            });
        }
        if (!isCEPage) return;
    }

    var TOOL_LABELS = {
        cv_analyser: 'CV Analyser',
        career_path: 'Career Path',
        linkedin_roaster: 'LinkedIn Roaster',
        career_energy: 'Career Energy Score'
    };

    function waitForAuth() {
        if (window.S2I_AUTH && window.S2I_AUTH.ready) {
            if (window.S2I_AUTH.currentUser) startWatching();
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

    function checkForResults() {
        if (buttonInjected) return;

        if (toolType === 'cv_analyser') injectForCVAnalyser();
        else if (toolType === 'career_path') injectForCareerPath();
        else if (toolType === 'linkedin_roaster') injectForLinkedInRoaster();
        else if (isCEPage) injectForCareerEnergy();
    }

    function injectForCVAnalyser() {
        // CV Analyser is a React build - look for action buttons in results
        var buttons = document.querySelectorAll('button');
        for (var i = 0; i < buttons.length; i++) {
            var text = (buttons[i].textContent || '').trim();
            if ((text.indexOf('Enviar') !== -1 || text.indexOf('Download') !== -1 || text.indexOf('PDF') !== -1 || text.indexOf('E-mail') !== -1 || text.indexOf('Send') !== -1) && text.length < 50) {
                var parent = buttons[i].parentElement;
                if (parent && parent.textContent.length > 50) {
                    injectButton(buttons[i], 'cv_analyser');
                    return;
                }
            }
        }
        // Fallback: look for score display
        var allText = document.body.innerText || '';
        if (allText.match(/\d{1,3}\s*\/\s*100/) || allText.indexOf('Score ATS') !== -1 || allText.indexOf('ATS Score') !== -1) {
            var scoreElements = document.querySelectorAll('h1, h2, h3, [class*="score"], [class*="Score"]');
            for (var j = 0; j < scoreElements.length; j++) {
                var t = (scoreElements[j].textContent || '').trim();
                if (t.match(/\d{1,3}\s*\/\s*100/) || t.indexOf('Score') !== -1) {
                    var container = scoreElements[j].closest('section') || scoreElements[j].closest('main') || scoreElements[j].closest('div');
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

    function injectForCareerPath() {
        var buttons = document.querySelectorAll('button');
        for (var i = 0; i < buttons.length; i++) {
            var text = (buttons[i].textContent || '').trim();
            if ((text.indexOf('Enviar') !== -1 || text.indexOf('Download') !== -1 || text.indexOf('PDF') !== -1 || text.indexOf('Send') !== -1) && text.length < 50) {
                injectButton(buttons[i], 'career_path');
                return;
            }
        }
    }

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
        var btns = successSection.querySelectorAll('button');
        if (btns.length > 0) injectButton(btns[0], 'linkedin_roaster');
    }

    function injectForCareerEnergy() {
        var resultsStep = document.getElementById('ceResultsStep');
        if (!resultsStep) return;
        if (resultsStep.style.display === 'none') return;

        var linkedinBtn = document.getElementById('ceBtnLinkedIn');
        if (linkedinBtn) {
            injectButton(linkedinBtn, 'career_energy');
            return;
        }
        var actions = resultsStep.querySelector('.ce-result-actions');
        if (actions) {
            var btns = actions.querySelectorAll('button');
            if (btns.length > 0) injectButton(btns[btns.length - 1], 'career_energy');
        }
    }

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

        var parent = referenceBtn.parentElement;
        if (parent) {
            if (referenceBtn.nextSibling) {
                parent.insertBefore(btn, referenceBtn.nextSibling);
            } else {
                parent.appendChild(btn);
            }
        }

        console.log('[S2I Save] Botao injetado ao lado do botao de acao em ' + (TOOL_LABELS[type] || type));
    }

    /**
     * Save analysis to Supabase user_analyses table
     * Captures the FULL HTML of the results (like the email version)
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
        }).catch(function(err) {
            console.error('[S2I Save] Erro:', err);
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
     * Capture the FULL HTML of the results section for each tool.
     * This captures the visual report exactly as shown on screen,
     * so it can be re-rendered in the Area de Cliente dashboard.
     */
    function captureResults(type) {
        var data = {
            tool: type,
            tool_label: TOOL_LABELS[type] || type,
            captured_at: new Date().toISOString(),
            url: window.location.href,
            page_title: document.title
        };

        if (type === 'cv_analyser') {
            // CV Analyser is a React SPA - capture the rendered HTML from #root
            var root = document.getElementById('root');
            if (root) {
                // Clone and remove navigation/header/footer to keep only results
                var clone = root.cloneNode(true);
                // Remove nav, header, footer elements
                var removeSelectors = ['nav', 'header', 'footer', '[class*="nav"]', '[class*="Nav"]', 'button', '[role="navigation"]'];
                removeSelectors.forEach(function(sel) {
                    var els = clone.querySelectorAll(sel);
                    els.forEach(function(el) { el.remove(); });
                });
                data.results_html = clone.innerHTML;
            }
            // Also capture JSON data from sessionStorage for structured access
            try {
                var cvRaw = sessionStorage.getItem('cvAnalysis');
                if (cvRaw) {
                    var cvData = JSON.parse(cvRaw);
                    data.score = cvData.score || cvData.atsScore || cvData.overall_score;
                    data.summary = cvData.summary || cvData.resumo;
                }
            } catch(e) {}
            // Score from DOM as fallback
            if (!data.score) {
                var allText = document.body.innerText || '';
                var scoreMatch = allText.match(/(\d{1,3})\s*\/\s*100/);
                if (scoreMatch) data.score = parseInt(scoreMatch[1]);
            }

        } else if (type === 'career_path') {
            // Career Path is a React SPA - capture the rendered HTML from #root
            var root2 = document.getElementById('root');
            if (root2) {
                var clone2 = root2.cloneNode(true);
                var removeSelectors2 = ['nav', 'header', 'footer', '[class*="nav"]', '[class*="Nav"]', 'button', '[role="navigation"]'];
                removeSelectors2.forEach(function(sel) {
                    var els = clone2.querySelectorAll(sel);
                    els.forEach(function(el) { el.remove(); });
                });
                data.results_html = clone2.innerHTML;
            }
            // Also capture JSON data from sessionStorage
            try {
                var cpRaw = sessionStorage.getItem('careerPathData');
                if (cpRaw) data.career_path_json = JSON.parse(cpRaw);
            } catch(e) {}
            try {
                var cpCvRaw = sessionStorage.getItem('careerPathCvAnalysis');
                if (cpCvRaw) data.cv_analysis_json = JSON.parse(cpCvRaw);
            } catch(e) {}

        } else if (type === 'linkedin_roaster') {
            // LinkedIn Roaster is HTML puro - capture #fullResults innerHTML
            var fullResults = document.getElementById('fullResults');
            if (fullResults) {
                data.results_html = fullResults.innerHTML;
            }
            // Also capture the success section header (score, archetype)
            var successSection = document.getElementById('successSection');
            if (successSection) {
                var resultCard = successSection.querySelector('.result-card');
                if (resultCard) {
                    // Capture the full result card HTML (includes score ring, archetype, etc.)
                    var cardClone = resultCard.cloneNode(true);
                    // Remove the save button from the clone
                    var saveBtn = cardClone.querySelector('#s2i-save-to-account');
                    if (saveBtn) saveBtn.remove();
                    data.results_html = cardClone.innerHTML;
                }
            }
            // Capture structured data too
            if (window.analysisData) {
                var ad = window.analysisData;
                data.score = ad.teaser ? ad.teaser.nota_geral : (ad.score || ad.overallScore);
                data.archetype = ad.teaser ? ad.teaser.archetype : null;
            }
            var emailEl = document.getElementById('successEmail');
            if (emailEl) data.email_used = emailEl.textContent.trim();

        } else if (type === 'career_energy') {
            // Career Energy - capture #ceResultsStep innerHTML
            var resultsStep = document.getElementById('ceResultsStep');
            if (resultsStep) {
                var ceClone = resultsStep.cloneNode(true);
                // Remove buttons from clone
                var btns = ceClone.querySelectorAll('button, #s2i-save-to-account');
                btns.forEach(function(b) { b.remove(); });
                // Remove CTA section
                var ctas = ceClone.querySelector('.ce-ctas');
                if (ctas) ctas.remove();
                data.results_html = ceClone.innerHTML;
            }
            // Capture structured data too
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
            }
        }

        // Capture inline styles from the page to ensure correct rendering
        if (data.results_html) {
            data.page_styles = captureRelevantStyles();
        }

        return data;
    }

    /**
     * Capture relevant CSS custom properties and key styles from the page
     * so the HTML can be rendered correctly in the Area de Cliente
     */
    function captureRelevantStyles() {
        var styles = {};
        var computed = getComputedStyle(document.documentElement);
        var cssVars = ['--dark', '--light', '--gold', '--muted', '--border', '--bg', '--card-bg',
                       '--primary', '--secondary', '--accent', '--text', '--text-muted',
                       '--background', '--foreground', '--card', '--card-foreground'];
        cssVars.forEach(function(v) {
            var val = computed.getPropertyValue(v).trim();
            if (val) styles[v] = val;
        });
        return styles;
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
