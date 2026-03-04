/**
 * free-teaser.js v3 — CV Analyser Free Teaser (PT)
 * 
 * Aggressive strategy: For FREE users, show ONLY the overall score gauge.
 * Everything else (quadrants, factors, ATS, salary, curva normal, etc.)
 * gets completely hidden with a heavy blur + opaque gradient.
 * 
 * Version: 3.0
 */
(function () {
  'use strict';

  function isPaidUser() {
    return sessionStorage.getItem('isPaid') === 'true';
  }

  let attempts = 0;
  const MAX = 150;

  function waitAndApply() {
    if (isPaidUser()) return;
    if (document.getElementById('ft-v3')) return;

    const root = document.getElementById('root');
    if (!root || root.innerHTML.length < 1000) {
      if (++attempts < MAX) setTimeout(waitAndApply, 400);
      return;
    }

    // Find main content: div with max-w-4xl and space-y
    const mc = root.querySelector('[class*="max-w-4xl"][class*="space-y"]');
    if (!mc) {
      if (++attempts < MAX) setTimeout(waitAndApply, 400);
      return;
    }

    const kids = Array.from(mc.children);
    // Need at least 4 children: status bar, score gauge, quadrants, factors...
    if (kids.length < 4) {
      if (++attempts < MAX) setTimeout(waitAndApply, 400);
      return;
    }

    apply(mc, kids);
  }

  function apply(mc, kids) {
    // Mark applied
    const m = document.createElement('div');
    m.id = 'ft-v3';
    m.style.display = 'none';
    document.body.appendChild(m);

    // ── STRATEGY ──
    // Child 0: Status bar ("Relatório Gratuito") → KEEP
    // Child 1: Score gauge with overall score → KEEP  
    // Child 2+: Everything else → HIDE AGGRESSIVELY
    //
    // The score gauge (child 1) shows the overall score number.
    // We also want to show a benchmark comparison text.
    // Everything from child 2 onwards gets wrapped in a tiny blur zone.

    const KEEP = 2;

    // Inject aggressive styles
    const style = document.createElement('style');
    style.id = 'ft-v3-styles';
    style.textContent = `
      #ft-v3-blur > * {
        filter: blur(20px) saturate(0.3) !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        pointer-events: none !important;
      }
      #ft-v3-blur {
        position: relative;
        overflow: hidden;
        max-height: 180px;
        pointer-events: none;
      }
      #ft-v3-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        z-index: 50;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        background: linear-gradient(to bottom,
          rgba(249,250,251,0.3) 0%,
          rgba(249,250,251,0.7) 20%,
          rgba(249,250,251,0.95) 50%,
          rgba(249,250,251,1) 70%
        );
      }
      #ft-v3-cta {
        animation: ftSlide 0.5s ease-out;
      }
      @keyframes ftSlide {
        from { opacity: 0; transform: translateY(15px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);

    // Collect sections to hide
    const toHide = [];
    for (let i = KEEP; i < kids.length; i++) {
      toHide.push(kids[i]);
    }

    // Create blur wrapper
    const blur = document.createElement('div');
    blur.id = 'ft-v3-blur';
    mc.insertBefore(blur, toHide[0]);
    toHide.forEach(el => blur.appendChild(el));

    // Add overlay
    const ov = document.createElement('div');
    ov.id = 'ft-v3-overlay';
    blur.appendChild(ov);

    // Also hide any existing React CTA/LockedSection overlays that might peek through
    mc.querySelectorAll('[class*="backdrop-blur"]').forEach(el => {
      if (!el.closest('#ft-v3-blur')) return;
      el.style.display = 'none';
    });

    // Extract insights
    const ins = getInsights();

    // Build benchmark badge under the score
    const badge = buildBadge(ins);
    if (badge) {
      // Insert after the score gauge (child 1)
      mc.insertBefore(badge, blur);
    }

    // Build CTA
    const cta = buildCTA(ins);
    mc.appendChild(cta);

    // Wire buy button
    setTimeout(wireBuyBtn, 300);

    console.log('[FT-v3] Applied. Kept', KEEP, 'sections, hid', toHide.length);
  }

  function getInsights() {
    const r = { score: null, benchmark: null, above: null, atsRate: null, role: null, seniority: null, topFactor: null };
    try {
      const d = JSON.parse(sessionStorage.getItem('cvAnalysis') || '{}');
      r.score = d.overallScore || d.overall_score || null;
      r.atsRate = d.atsRejectionRate || d.ats_rejection_rate || null;
      r.role = d.perceivedRole || d.perceived_role || null;
      r.seniority = d.perceivedSeniority || d.perceived_seniority || null;
      r.topFactor = d.atsTopFactor || d.ats_top_factor || null;
      // Find benchmark from quadrants
      if (d.quadrants && d.quadrants.length > 0) {
        const avgBench = d.quadrants.reduce((s, q) => s + (q.benchmark || 0), 0) / d.quadrants.length;
        r.benchmark = Math.round(avgBench);
      }
      if (r.score) {
        const s = parseInt(r.score);
        r.above = r.benchmark ? (s > r.benchmark ? 'acima' : s === r.benchmark ? 'na média' : 'abaixo') :
                  (s >= 75 ? 'acima' : s >= 50 ? 'na média' : 'abaixo');
      }
    } catch (e) { /* silent */ }
    return r;
  }

  function buildBadge(ins) {
    if (!ins.above || !ins.score) return null;
    const div = document.createElement('div');
    div.style.cssText = 'text-align:center;padding:8px 0;';

    const color = ins.above === 'acima' ? '#22c55e' : ins.above === 'na média' ? '#eab308' : '#ef4444';
    const arrow = ins.above === 'acima' ? '↑' : ins.above === 'na média' ? '→' : '↓';
    const label = ins.above === 'acima' ? 'Acima do benchmark do mercado' :
                  ins.above === 'na média' ? 'Na média do mercado' : 'Abaixo do benchmark do mercado';
    const benchText = ins.benchmark ? ` (${ins.score} vs ${ins.benchmark})` : '';

    div.innerHTML = `
      <div style="display:inline-flex;align-items:center;gap:8px;padding:8px 20px;background:${color}15;border:1px solid ${color}30;border-radius:24px;">
        <span style="font-size:16px;">${arrow}</span>
        <span style="color:${color};font-size:14px;font-weight:600;">${label}${benchText}</span>
      </div>
    `;
    return div;
  }

  function buildCTA(ins) {
    const card = document.createElement('div');
    card.id = 'ft-v3-cta';

    // Build 2-3 insight teasers
    let teasers = '';
    if (ins.atsRate !== null) {
      const pct = parseInt(ins.atsRate);
      const icon = pct > 50 ? '⚠️' : '✅';
      teasers += teaser(icon, `Taxa de rejeição ATS: <strong>${ins.atsRate}%</strong>`);
    }
    if (ins.role) {
      const extra = ins.seniority ? ` · ${ins.seniority}` : '';
      teasers += teaser('👤', `Perfil percebido: <strong>${ins.role}${extra}</strong>`);
    }
    if (ins.topFactor) {
      teasers += teaser('🎯', `Factor principal: <strong>${ins.topFactor}</strong>`);
    }

    card.innerHTML = `
      <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);border:2px solid #C9A961;border-radius:16px;padding:32px 24px;text-align:center;box-shadow:0 8px 32px rgba(201,169,97,0.15);margin-top:8px;">
        <p style="color:#C9A961;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:700;margin:0 0 16px;">O teu CV foi analisado</p>
        
        ${teasers ? `
          <p style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 10px;font-weight:600;">Insights rápidos</p>
          <div style="display:flex;flex-direction:column;gap:6px;margin:0 0 24px;">${teasers}</div>
        ` : ''}

        <div style="border-top:1px solid rgba(201,169,97,0.2);padding-top:24px;">
          <p style="color:#aaa;font-size:12px;margin:0 0 4px;">A análise completa inclui:</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;max-width:340px;margin:0 auto 20px;text-align:left;">
            ${feat('Scores por quadrante')}
            ${feat('Estimativa salarial')}
            ${feat('Factores detalhados')}
            ${feat('Curva normal')}
            ${feat('Compatibilidade ATS')}
            ${feat('Risco de automação')}
            ${feat('Percepção do recrutador')}
            ${feat('Plano de acção 30 dias')}
          </div>
          
          <p style="color:#fff;font-size:22px;font-weight:800;margin:0 0 4px;">Desbloqueia tudo por</p>
          <p style="color:#C9A961;font-size:44px;font-weight:900;margin:0 0 4px;line-height:1;">€3,99</p>
          <p style="color:#777;font-size:11px;margin:0 0 20px;">Pagamento único · Sem subscrição</p>
          
          <button id="ft-v3-buy" style="background:linear-gradient(135deg,#C9A961,#A88B4E);color:#fff;border:none;padding:14px 0;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;box-shadow:0 4px 15px rgba(201,169,97,0.4);width:100%;max-width:320px;pointer-events:auto;transition:transform 0.2s;">
            Desbloquear Análise Completa
          </button>
          <p style="color:#555;font-size:10px;margin:12px 0 0;">Pagamento seguro via Stripe / MB WAY / PayPal</p>
        </div>
      </div>
    `;
    return card;
  }

  function teaser(icon, html) {
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 14px;background:rgba(255,255,255,0.04);border-radius:8px;border-left:3px solid #C9A961;">
      <span style="font-size:16px;">${icon}</span>
      <span style="color:#d0d0d0;font-size:13px;text-align:left;">${html}</span>
    </div>`;
  }

  function feat(t) {
    return `<div style="display:flex;align-items:center;gap:6px;color:#999;font-size:11px;padding:2px 0;">
      <span style="color:#C9A961;font-size:12px;">✓</span> ${t}
    </div>`;
  }

  function wireBuyBtn() {
    const btn = document.getElementById('ft-v3-buy');
    if (!btn) return;
    btn.onmouseenter = () => btn.style.transform = 'scale(1.03)';
    btn.onmouseleave = () => btn.style.transform = 'scale(1)';
    btn.onclick = () => {
      // Find the React "Desbloquear Análise Completa" button in the header
      const headerBtns = document.querySelectorAll('button, a');
      for (const b of headerBtns) {
        const t = (b.textContent || '').trim().toLowerCase();
        if (t.includes('desbloquear análise completa') || t.includes('unlock')) {
          b.click();
          return;
        }
      }
      // Try the blur zone
      const zone = document.getElementById('ft-v3-blur');
      if (zone) {
        zone.style.pointerEvents = 'auto';
        const btns = zone.querySelectorAll('button');
        for (const b of btns) {
          const t = (b.textContent || '').toLowerCase();
          if (t.includes('desbloquear') || t.includes('unlock') || t.includes('escolher') || t.includes('pagar')) {
            b.click();
            return;
          }
        }
      }
      // Last resort: scroll to top where the header CTA is
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  }

  // ── Payment detection ──
  function watchPayment() {
    const p = new URLSearchParams(window.location.search);
    if (p.get('payment') === 'success') { removeTeaser(); return; }
    const orig = sessionStorage.setItem;
    sessionStorage.setItem = function (k, v) {
      orig.call(this, k, v);
      if (k === 'isPaid' && v === 'true') removeTeaser();
    };
  }

  function removeTeaser() {
    const zone = document.getElementById('ft-v3-blur');
    const cta = document.getElementById('ft-v3-cta');
    const sty = document.getElementById('ft-v3-styles');
    const mk = document.getElementById('ft-v3');
    if (zone) {
      const p = zone.parentNode;
      // Move children back, skip overlay
      while (zone.firstChild) {
        if (zone.firstChild.id === 'ft-v3-overlay') {
          zone.removeChild(zone.firstChild);
        } else {
          const c = zone.firstChild;
          if (c.style) { c.style.filter = ''; c.style.pointerEvents = ''; c.style.userSelect = ''; }
          p.insertBefore(c, zone);
        }
      }
      p.removeChild(zone);
    }
    // Remove badge
    const badge = document.querySelector('[data-ft-badge]');
    if (badge) badge.remove();
    if (cta) cta.remove();
    if (sty) sty.remove();
    if (mk) mk.remove();
    console.log('[FT-v3] Payment detected — teaser removed.');
  }

  // ── Init ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { watchPayment(); waitAndApply(); });
  } else {
    watchPayment();
    waitAndApply();
  }

  // MutationObserver for SPA
  const obs = new MutationObserver(() => {
    if (document.getElementById('ft-v3')) return;
    if (isPaidUser()) return;
    waitAndApply();
  });
  obs.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => obs.disconnect(), 60000);
})();
