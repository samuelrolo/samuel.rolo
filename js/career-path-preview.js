/**
 * Career Path Preview Carousel
 * Injeta um widget rotativo com dummy data antes do paywall
 * Mostra ao utilizador o que vai receber ao desbloquear
 * Inclui destaque do proximo cargo mais provavel (dados reais)
 */
(function() {
  'use strict';

  var PREVIEW_SECTIONS = [
    {
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
      title: 'Fun\u00e7\u00f5es compat\u00edveis',
      subtitle: 'Cargos alinhados com o teu n\u00edvel de senioridade',
      dummyItems: [
        { label: 'Head of People & Culture', match: '94%' },
        { label: 'Director de Transforma\u00e7\u00e3o Organizacional', match: '91%' },
        { label: 'VP Human Resources', match: '87%' },
        { label: 'Chief People Officer', match: '82%' }
      ],
      type: 'list-match'
    },
    {
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
      title: 'Movimentos de carreira',
      subtitle: 'Traject\u00f3rias realistas a curto e m\u00e9dio prazo',
      dummyItems: [
        { from: 'HR Transformation Manager', to: 'Head of HR Operations', time: '6-12 meses' },
        { from: 'HR Transformation Manager', to: 'Director de People & Culture', time: '12-24 meses' },
        { from: 'HR Transformation Manager', to: 'CHRO / VP HR', time: '24-36 meses' }
      ],
      type: 'career-moves'
    },
    {
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
      title: 'Intervalos salariais estimados',
      subtitle: 'Refer\u00eancias de mercado para Portugal e Europa',
      dummyItems: [
        { role: 'Head of HR Operations', range: '\u20ac65.000 \u2014 \u20ac85.000', market: 'PT' },
        { role: 'Director People & Culture', range: '\u20ac80.000 \u2014 \u20ac110.000', market: 'PT' },
        { role: 'VP Human Resources', range: '\u20ac95.000 \u2014 \u20ac140.000', market: 'EU' },
        { role: 'CHRO', range: '\u20ac120.000 \u2014 \u20ac180.000', market: 'EU' }
      ],
      type: 'salary'
    },
    {
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
      title: 'Lacunas de compet\u00eancias',
      subtitle: '\u00c1reas a desenvolver para o pr\u00f3ximo n\u00edvel',
      dummyItems: [
        { skill: 'People Analytics & Data-Driven HR', level: 45 },
        { skill: 'Board-Level Stakeholder Management', level: 55 },
        { skill: 'M&A HR Integration', level: 35 },
        { skill: 'ESG & Sustainability in HR', level: 40 }
      ],
      type: 'skills-gap'
    },
    {
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
      title: 'Forma\u00e7\u00e3o recomendada',
      subtitle: 'Cursos e certifica\u00e7\u00f5es de alto impacto',
      dummyItems: [
        { name: 'People Analytics Certificate', provider: 'AIHR', duration: '32h' },
        { name: 'Strategic HR Leadership', provider: 'Cornell University', duration: '3 meses' },
        { name: 'Digital HR Transformation', provider: 'MIT Sloan', duration: '6 semanas' },
        { name: 'Executive Coaching Certification', provider: 'ICF', duration: '6 meses' }
      ],
      type: 'training'
    },
    {
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      title: 'Networking e visibilidade',
      subtitle: 'Ac\u00e7\u00f5es estrat\u00e9gicas para expandir a tua rede',
      dummyItems: [
        'Participar em 2 eventos SHRM/CIPD por trimestre',
        'Publicar 1 artigo mensal sobre HR Transformation no LinkedIn',
        'Conectar com 5 CHROs de empresas-alvo por m\u00eas',
        'Integrar grupo de advisory board em startup HR Tech'
      ],
      type: 'networking'
    },
    {
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
      title: 'Plano 30-60-90 dias',
      subtitle: 'Roadmap de ac\u00e7\u00e3o para os pr\u00f3ximos 3 meses',
      dummyItems: [
        { phase: '30 dias', actions: ['Auditoria de compet\u00eancias', 'Definir 3 fun\u00e7\u00f5es-alvo', 'Actualizar CV e LinkedIn'] },
        { phase: '60 dias', actions: ['Iniciar forma\u00e7\u00e3o priorit\u00e1ria', 'Activar rede de contactos', '5 candidaturas estrat\u00e9gicas'] },
        { phase: '90 dias', actions: ['Avaliar progresso', 'Ajustar estrat\u00e9gia', 'Preparar entrevistas executivas'] }
      ],
      type: 'plan-90'
    }
  ];

  var currentSlide = 0;
  var autoplayInterval = null;

  /* ── Extract next role from real analysis data ── */
  function getNextRoleFromAnalysis() {
    var nextRole = null;
    var matchScore = null;
    try {
      var cpData = sessionStorage.getItem('careerPathData');
      if (cpData) {
        var parsed = JSON.parse(cpData);
        // Try multiple possible structures
        var sources = [
          parsed.next_roles,
          parsed.career_progression,
          parsed.recommended_roles,
          parsed.career_path && parsed.career_path.next_roles,
          parsed.career_path && parsed.career_path.career_progression,
          parsed.career_path && parsed.career_path.recommended_roles
        ];
        for (var s = 0; s < sources.length; s++) {
          var roles = sources[s];
          if (roles && roles.length > 0) {
            var first = roles[0];
            nextRole = first.role_title || first.title || first.role || first.name || null;
            matchScore = first.fit_percentage || first.match_score || first.match || first.probability || null;
            if (nextRole) break;
          }
        }
      }
    } catch(e) { /* ignore */ }

    // Normalize match score
    if (matchScore && typeof matchScore === 'number' && matchScore <= 1) {
      matchScore = Math.round(matchScore * 100);
    }
    if (matchScore && typeof matchScore === 'string') {
      matchScore = parseInt(matchScore.replace('%', ''), 10);
    }
    if (!matchScore || isNaN(matchScore)) matchScore = 90;

    return { nextRole: nextRole, matchScore: matchScore };
  }

  /* ── Build the Next Role Highlight card ── */
  function buildNextRoleHighlight(nextRole, matchScore) {
    var dashLen = Math.round(138.2 * matchScore / 100);
    var el = document.createElement('div');
    el.id = 'cp-next-role-highlight';
    el.style.cssText = 'max-width:640px;margin:0 auto 20px;font-family:system-ui,-apple-system,sans-serif;';

    el.innerHTML = ''
      + '<div style="position:relative;overflow:hidden;border-radius:14px;border:1px solid rgba(201,169,97,0.35);background:linear-gradient(135deg,rgba(201,169,97,0.12) 0%,rgba(20,18,15,0.8) 50%,rgba(201,169,97,0.08) 100%);backdrop-filter:blur(10px);padding:28px 24px;text-align:center">'
      +   '<div style="position:absolute;top:-40px;right:-40px;width:120px;height:120px;background:radial-gradient(circle,rgba(201,169,97,0.15) 0%,transparent 70%);border-radius:50%"></div>'
      +   '<div style="position:absolute;bottom:-30px;left:-30px;width:100px;height:100px;background:radial-gradient(circle,rgba(201,169,97,0.1) 0%,transparent 70%);border-radius:50%"></div>'
      +   '<div style="display:inline-flex;align-items:center;gap:6px;background:rgba(201,169,97,0.15);border:1px solid rgba(201,169,97,0.25);border-radius:20px;padding:5px 14px;margin-bottom:16px">'
      +     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A961" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
      +     '<span style="color:#C9A961;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Resultado da tua an\u00e1lise</span>'
      +   '</div>'
      +   '<p style="color:#999;font-size:13px;margin:0 0 8px;font-family:system-ui">O teu pr\u00f3ximo cargo mais prov\u00e1vel:</p>'
      +   '<h3 style="color:#fff;font-size:24px;font-weight:700;margin:0 0 16px;font-family:Cormorant Garamond,serif;line-height:1.3">' + nextRole + '</h3>'
      +   '<div style="display:inline-flex;align-items:center;gap:12px;background:rgba(201,169,97,0.08);border:1px solid rgba(201,169,97,0.2);border-radius:10px;padding:12px 20px">'
      +     '<div style="position:relative;width:52px;height:52px">'
      +       '<svg width="52" height="52" viewBox="0 0 52 52" style="transform:rotate(-90deg)">'
      +         '<circle cx="26" cy="26" r="22" fill="none" stroke="rgba(201,169,97,0.15)" stroke-width="4"/>'
      +         '<circle cx="26" cy="26" r="22" fill="none" stroke="#C9A961" stroke-width="4" stroke-dasharray="' + dashLen + ' 138.2" stroke-linecap="round"/>'
      +       '</svg>'
      +       '<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#C9A961;font-size:14px;font-weight:700;font-family:system-ui">' + matchScore + '%</span>'
      +     '</div>'
      +     '<div style="text-align:left">'
      +       '<div style="color:#e8e0d0;font-size:14px;font-weight:600;font-family:Cormorant Garamond,serif">Probabilidade de match</div>'
      +       '<div style="color:#888;font-size:11px;margin-top:2px;font-family:system-ui">Baseado no teu perfil e experi\u00eancia</div>'
      +     '</div>'
      +   '</div>'
      +   '<div style="margin-top:20px">'
      +     '<a href="#" id="cp-highlight-cta" style="color:#C9A961;font-size:13px;font-weight:500;font-family:system-ui;text-decoration:none;border-bottom:1px solid rgba(201,169,97,0.3);padding-bottom:2px">Ver plano completo \u2192 desbloquear</a>'
      +   '</div>'
      + '</div>';

    return el;
  }

  /* ── Render a single slide ── */
  function renderSlide(section) {
    var contentHTML = '';

    switch (section.type) {
      case 'list-match':
        contentHTML = section.dummyItems.map(function(item) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(201,169,97,0.06);border-radius:8px;margin-bottom:8px;border:1px solid rgba(201,169,97,0.12)">'
            + '<span style="color:#e8e0d0;font-size:14px;font-family:Cormorant Garamond,serif">' + item.label + '</span>'
            + '<span style="color:#C9A961;font-weight:600;font-size:13px;font-family:system-ui">' + item.match + '</span>'
            + '</div>';
        }).join('');
        break;

      case 'career-moves':
        contentHTML = section.dummyItems.map(function(item) {
          return '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(201,169,97,0.06);border-radius:8px;margin-bottom:8px;border:1px solid rgba(201,169,97,0.12)">'
            + '<div style="flex:1"><div style="color:#999;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-family:system-ui">De</div><div style="color:#ccc;font-size:13px;font-family:Cormorant Garamond,serif">' + item.from + '</div></div>'
            + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A961" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>'
            + '<div style="flex:1"><div style="color:#999;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-family:system-ui">Para</div><div style="color:#e8e0d0;font-size:13px;font-weight:500;font-family:Cormorant Garamond,serif">' + item.to + '</div></div>'
            + '<span style="color:#C9A961;font-size:11px;white-space:nowrap;font-family:system-ui">' + item.time + '</span>'
            + '</div>';
        }).join('');
        break;

      case 'salary':
        contentHTML = section.dummyItems.map(function(item) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(201,169,97,0.06);border-radius:8px;margin-bottom:8px;border:1px solid rgba(201,169,97,0.12)">'
            + '<div><div style="color:#e8e0d0;font-size:13px;font-family:Cormorant Garamond,serif">' + item.role + '</div><span style="color:#888;font-size:11px;font-family:system-ui">' + item.market + '</span></div>'
            + '<span style="color:#C9A961;font-weight:600;font-size:14px;font-family:system-ui">' + item.range + '</span>'
            + '</div>';
        }).join('');
        break;

      case 'skills-gap':
        contentHTML = section.dummyItems.map(function(item) {
          return '<div style="padding:10px 14px;background:rgba(201,169,97,0.06);border-radius:8px;margin-bottom:8px;border:1px solid rgba(201,169,97,0.12)">'
            + '<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="color:#e8e0d0;font-size:13px;font-family:Cormorant Garamond,serif">' + item.skill + '</span><span style="color:#C9A961;font-size:12px;font-family:system-ui">' + item.level + '%</span></div>'
            + '<div style="height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden"><div style="height:100%;width:' + item.level + '%;background:linear-gradient(90deg,#C9A961,#BF9A33);border-radius:3px;transition:width 1s ease"></div></div>'
            + '</div>';
        }).join('');
        break;

      case 'training':
        contentHTML = section.dummyItems.map(function(item) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(201,169,97,0.06);border-radius:8px;margin-bottom:8px;border:1px solid rgba(201,169,97,0.12)">'
            + '<div><div style="color:#e8e0d0;font-size:13px;font-weight:500;font-family:Cormorant Garamond,serif">' + item.name + '</div><span style="color:#888;font-size:11px;font-family:system-ui">' + item.provider + ' \u00b7 ' + item.duration + '</span></div>'
            + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A961" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>'
            + '</div>';
        }).join('');
        break;

      case 'networking':
        contentHTML = section.dummyItems.map(function(item, i) {
          return '<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 14px;background:rgba(201,169,97,0.06);border-radius:8px;margin-bottom:8px;border:1px solid rgba(201,169,97,0.12)">'
            + '<span style="color:#C9A961;font-weight:600;font-size:14px;font-family:system-ui;min-width:20px">' + (i + 1) + '.</span>'
            + '<span style="color:#e8e0d0;font-size:13px;font-family:Cormorant Garamond,serif">' + item + '</span>'
            + '</div>';
        }).join('');
        break;

      case 'plan-90':
        contentHTML = section.dummyItems.map(function(item) {
          var acts = item.actions.map(function(a) {
            return '<div style="display:flex;align-items:center;gap:8px;padding:4px 0">'
              + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A961" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
              + '<span style="color:#e8e0d0;font-size:13px;font-family:Cormorant Garamond,serif">' + a + '</span>'
              + '</div>';
          }).join('');
          return '<div style="padding:12px 14px;background:rgba(201,169,97,0.06);border-radius:8px;margin-bottom:10px;border:1px solid rgba(201,169,97,0.12)">'
            + '<div style="color:#C9A961;font-weight:600;font-size:13px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;font-family:system-ui">' + item.phase + '</div>'
            + acts
            + '</div>';
        }).join('');
        break;
    }

    return contentHTML;
  }

  /* ── Find the paywall element ── */
  function findPaywall() {
    var allButtons = document.querySelectorAll('button, a');
    var paywallEl = null;

    for (var b = 0; b < allButtons.length; b++) {
      var text = allButtons[b].textContent || '';
      if (text.indexOf('Desbloquear Career Path') !== -1 || text.indexOf('Unlock Career Path') !== -1) {
        paywallEl = allButtons[b].closest('div[class*="sticky"]') || allButtons[b].closest('div[class*="fixed"]') || allButtons[b].parentElement.parentElement;
        break;
      }
    }

    if (!paywallEl) {
      var allText = document.querySelectorAll('p, span, div');
      for (var t = 0; t < allText.length; t++) {
        var txt = (allText[t].textContent || '').trim();
        if (txt === 'Roadmap completo bloqueado' || txt === 'Full roadmap locked') {
          paywallEl = allText[t].closest('div[class*="border"]') || allText[t].closest('div[class*="rounded"]') || allText[t].parentElement.parentElement;
          break;
        }
      }
    }

    return paywallEl;
  }

  /* ── Create the full carousel ── */
  function createCarousel() {
    var paywallEl = findPaywall();
    if (!paywallEl) return;

    // ── 1. Insert Next Role Highlight (real data) ──
    var roleData = getNextRoleFromAnalysis();
    if (roleData.nextRole) {
      var highlight = buildNextRoleHighlight(roleData.nextRole, roleData.matchScore);
      paywallEl.parentNode.insertBefore(highlight, paywallEl);

      // Wire the CTA to scroll to the paywall button
      var cta = document.getElementById('cp-highlight-cta');
      if (cta) {
        cta.addEventListener('click', function(e) {
          e.preventDefault();
          var unlockBtn = null;
          var btns = document.querySelectorAll('button, a');
          for (var i = 0; i < btns.length; i++) {
            if ((btns[i].textContent || '').indexOf('Desbloquear') !== -1 && btns[i] !== cta) {
              unlockBtn = btns[i];
              break;
            }
          }
          if (unlockBtn) {
            unlockBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            unlockBtn.style.boxShadow = '0 0 0 3px rgba(201,169,97,0.4)';
            setTimeout(function() { unlockBtn.style.boxShadow = ''; }, 2000);
          }
        });
      }
    }

    // ── 2. Insert Carousel ──
    var carousel = document.createElement('div');
    carousel.id = 'cp-preview-carousel';
    carousel.style.cssText = 'max-width:640px;margin:24px auto;font-family:system-ui,-apple-system,sans-serif;';

    carousel.innerHTML = ''
      + '<div style="text-align:center;margin-bottom:20px">'
      +   '<p style="color:#C9A961;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 6px;font-family:system-ui">O que vais desbloquear</p>'
      +   '<h3 style="color:#fff;font-size:22px;font-weight:600;margin:0;font-family:Cormorant Garamond,serif">O teu Roadmap personalizado inclui</h3>'
      + '</div>'
      + '<div id="cp-carousel-wrapper" style="position:relative;overflow:hidden;border-radius:12px;border:1px solid rgba(201,169,97,0.2);background:rgba(20,18,15,0.6);backdrop-filter:blur(8px)">'
      +   '<div id="cp-slide-header" style="display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid rgba(201,169,97,0.12)">'
      +     '<div id="cp-slide-icon" style="color:#C9A961;flex-shrink:0"></div>'
      +     '<div>'
      +       '<div id="cp-slide-title" style="color:#fff;font-size:16px;font-weight:600;font-family:Cormorant Garamond,serif"></div>'
      +       '<div id="cp-slide-subtitle" style="color:#999;font-size:12px;margin-top:2px;font-family:system-ui"></div>'
      +     '</div>'
      +   '</div>'
      +   '<div style="position:relative">'
      +     '<div id="cp-slide-content" style="padding:16px 20px;min-height:200px;filter:blur(2.5px);user-select:none;pointer-events:none"></div>'
      +     '<div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 0%,rgba(20,18,15,0.7) 70%,rgba(20,18,15,0.95) 100%);display:flex;align-items:flex-end;justify-content:center;padding-bottom:24px">'
      +       '<div style="display:flex;align-items:center;gap:6px;color:#C9A961;font-size:13px;font-weight:500;font-family:system-ui">'
      +         '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
      +         'Desbloqueia para ver os teus dados reais'
      +       '</div>'
      +     '</div>'
      +   '</div>'
      +   '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-top:1px solid rgba(201,169,97,0.12)">'
      +     '<button id="cp-prev" style="background:none;border:1px solid rgba(201,169,97,0.3);border-radius:6px;padding:6px 10px;color:#C9A961;cursor:pointer;font-size:12px;font-family:system-ui;transition:all 0.2s">\u2190 Anterior</button>'
      +     '<div id="cp-dots" style="display:flex;gap:6px"></div>'
      +     '<button id="cp-next" style="background:none;border:1px solid rgba(201,169,97,0.3);border-radius:6px;padding:6px 10px;color:#C9A961;cursor:pointer;font-size:12px;font-family:system-ui;transition:all 0.2s">Seguinte \u2192</button>'
      +   '</div>'
      + '</div>'
      + '<div style="text-align:center;margin-top:12px">'
      +   '<span style="color:#666;font-size:11px;font-family:system-ui">' + PREVIEW_SECTIONS.length + ' sec\u00e7\u00f5es inclu\u00eddas no roadmap completo</span>'
      + '</div>';

    paywallEl.parentNode.insertBefore(carousel, paywallEl);

    // Create dots
    var dotsContainer = document.getElementById('cp-dots');
    for (var d = 0; d < PREVIEW_SECTIONS.length; d++) {
      var dot = document.createElement('div');
      dot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:' + (d === 0 ? '#C9A961' : 'rgba(201,169,97,0.25)') + ';cursor:pointer;transition:all 0.3s';
      dot.setAttribute('data-index', d);
      dot.addEventListener('click', function() { goToSlide(parseInt(this.getAttribute('data-index'))); });
      dotsContainer.appendChild(dot);
    }

    // Navigation
    document.getElementById('cp-prev').addEventListener('click', function() {
      goToSlide((currentSlide - 1 + PREVIEW_SECTIONS.length) % PREVIEW_SECTIONS.length);
    });
    document.getElementById('cp-next').addEventListener('click', function() {
      goToSlide((currentSlide + 1) % PREVIEW_SECTIONS.length);
    });

    // Hover effects on nav buttons
    var prevBtn = document.getElementById('cp-prev');
    var nextBtn = document.getElementById('cp-next');
    [prevBtn, nextBtn].forEach(function(btn) {
      btn.addEventListener('mouseover', function() { this.style.background = 'rgba(201,169,97,0.1)'; });
      btn.addEventListener('mouseout', function() { this.style.background = 'none'; });
    });

    // Show first slide
    updateSlide(0);

    // Autoplay
    startAutoplay();

    // Pause on hover
    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);
  }

  function updateSlide(index) {
    var section = PREVIEW_SECTIONS[index];
    var iconEl = document.getElementById('cp-slide-icon');
    var titleEl = document.getElementById('cp-slide-title');
    var subtitleEl = document.getElementById('cp-slide-subtitle');
    var contentEl = document.getElementById('cp-slide-content');
    var dotsContainer = document.getElementById('cp-dots');

    if (!iconEl || !titleEl || !contentEl) return;

    contentEl.style.opacity = '0';
    contentEl.style.transition = 'opacity 0.3s ease';

    setTimeout(function() {
      iconEl.innerHTML = section.icon;
      titleEl.textContent = section.title;
      subtitleEl.textContent = section.subtitle;
      contentEl.innerHTML = renderSlide(section);
      contentEl.style.opacity = '1';
    }, 150);

    if (dotsContainer) {
      var dots = dotsContainer.children;
      for (var i = 0; i < dots.length; i++) {
        dots[i].style.background = i === index ? '#C9A961' : 'rgba(201,169,97,0.25)';
        dots[i].style.transform = i === index ? 'scale(1.2)' : 'scale(1)';
      }
    }

    currentSlide = index;
  }

  function goToSlide(index) {
    stopAutoplay();
    updateSlide(index);
    startAutoplay();
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayInterval = setInterval(function() {
      updateSlide((currentSlide + 1) % PREVIEW_SECTIONS.length);
    }, 4000);
  }

  function stopAutoplay() {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
      autoplayInterval = null;
    }
  }

  // Wait for React to render, then inject
  function waitAndInject() {
    var checkInterval = setInterval(function() {
      var allText = document.querySelectorAll('p, span, div');
      var found = false;
      for (var i = 0; i < allText.length; i++) {
        var t = (allText[i].textContent || '').trim();
        if (t === 'Roadmap completo bloqueado' || t === 'Full roadmap locked' || t.indexOf('Desbloquear Career Path') !== -1) {
          found = true;
          break;
        }
      }
      if (found && !document.getElementById('cp-preview-carousel')) {
        clearInterval(checkInterval);
        setTimeout(createCarousel, 500);
      }
    }, 1000);

    // Stop checking after 30s
    setTimeout(function() { clearInterval(checkInterval); }, 30000);
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitAndInject);
  } else {
    waitAndInject();
  }
})();
