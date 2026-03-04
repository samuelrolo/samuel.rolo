/**
 * free-teaser.js v4 — CV Analyser Free Teaser (EN)
 * 
 * Strategy: For FREE users, show ONLY:
 *   - Status bar + Score gauge (children 0-1)
 *   - Benchmark badge
 *   - CTA card (light design, matching page style)
 * 
 * Everything else is completely hidden (display:none), no blur rectangle.
 * CTA uses light background to match the page — no dark/light contrast.
 * 
 * Version: 4.0
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
    if (document.getElementById('ft-v4')) return;

    const root = document.getElementById('root');
    if (!root || root.innerHTML.length < 1000) {
      if (++attempts < MAX) setTimeout(waitAndApply, 400);
      return;
    }

    const mc = root.querySelector('[class*="max-w-4xl"][class*="space-y"]');
    if (!mc) {
      if (++attempts < MAX) setTimeout(waitAndApply, 400);
      return;
    }

    const kids = Array.from(mc.children);
    if (kids.length < 4) {
      if (++attempts < MAX) setTimeout(waitAndApply, 400);
      return;
    }

    apply(mc, kids);
  }

  function apply(mc, kids) {
    const m = document.createElement('div');
    m.id = 'ft-v4';
    m.style.display = 'none';
    document.body.appendChild(m);

    const KEEP = 2;

    const style = document.createElement('style');
    style.id = 'ft-v4-styles';
    style.textContent = `
      .ft-hidden-section {
        display: none !important;
      }
      #ft-v4-cta {
        animation: ftSlide 0.4s ease-out;
        margin-top: 0 !important;
      }
      @keyframes ftSlide {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      #ft-v4-cta .ft-insight-row:hover {
        background: rgba(201,169,97,0.08);
      }
    `;
    document.head.appendChild(style);

    for (let i = KEEP; i < kids.length; i++) {
      kids[i].classList.add('ft-hidden-section');
      kids[i].setAttribute('data-ft-hidden', '1');
    }

    mc.style.gap = '0';

    const ins = getInsights();

    const badge = buildBadge(ins);
    if (badge) {
      if (kids[KEEP]) {
        mc.insertBefore(badge, kids[KEEP]);
      } else {
        mc.appendChild(badge);
      }
    }

    const cta = buildCTA(ins);
    mc.appendChild(cta);

    setTimeout(wireBuyBtn, 300);

    console.log('[FT-v4-EN] Applied. Kept', KEEP, ', hidden', kids.length - KEEP);
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
      if (d.quadrants && d.quadrants.length > 0) {
        const avgBench = d.quadrants.reduce((s, q) => s + (q.benchmark || 0), 0) / d.quadrants.length;
        r.benchmark = Math.round(avgBench);
      }
      if (r.score) {
        const s = parseInt(r.score);
        r.above = r.benchmark ? (s > r.benchmark ? 'above' : s === r.benchmark ? 'average' : 'below') :
                  (s >= 75 ? 'above' : s >= 50 ? 'average' : 'below');
      }
    } catch (e) { /* silent */ }
    return r;
  }

  function buildBadge(ins) {
    if (!ins.above || !ins.score) return null;
    const div = document.createElement('div');
    div.setAttribute('data-ft-badge', '1');
    div.style.cssText = 'text-align:center;padding:12px 0 16px;';

    const color = ins.above === 'above' ? '#22c55e' : ins.above === 'average' ? '#eab308' : '#ef4444';
    const arrow = ins.above === 'above' ? '↑' : ins.above === 'average' ? '→' : '↓';
    const label = ins.above === 'above' ? 'Above market benchmark' :
                  ins.above === 'average' ? 'At market average' : 'Below market benchmark';
    const benchText = ins.benchmark ? ` (${ins.score} vs ${ins.benchmark})` : '';

    div.innerHTML = `
      <div style="display:inline-flex;align-items:center;gap:8px;padding:8px 20px;background:${color}12;border:1px solid ${color}25;border-radius:24px;">
        <span style="font-size:15px;">${arrow}</span>
        <span style="color:${color};font-size:13px;font-weight:600;">${label}${benchText}</span>
      </div>
    `;
    return div;
  }

  function buildCTA(ins) {
    const card = document.createElement('div');
    card.id = 'ft-v4-cta';

    let teasers = '';
    if (ins.atsRate !== null) {
      const pct = parseInt(ins.atsRate);
      const icon = pct > 50 ? '⚠️' : '✅';
      teasers += teaser(icon, `ATS rejection rate: <strong>${ins.atsRate}%</strong>`);
    }
    if (ins.role) {
      const extra = ins.seniority ? ` · ${ins.seniority}` : '';
      teasers += teaser('👤', `Perceived profile: <strong>${ins.role}${extra}</strong>`);
    }
    if (ins.topFactor) {
      teasers += teaser('🎯', `Top factor: <strong>${ins.topFactor}</strong>`);
    }

    card.innerHTML = `
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:28px 24px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        
        ${teasers ? `
          <p style="color:#6b7280;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 10px;font-weight:600;">Quick insights</p>
          <div style="display:flex;flex-direction:column;gap:6px;margin:0 0 20px;">${teasers}</div>
        ` : ''}

        <div style="border-top:1px solid #e5e7eb;padding-top:20px;">
          <p style="color:#6b7280;font-size:11px;margin:0 0 8px;">The full analysis includes:</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;max-width:340px;margin:0 auto 16px;text-align:left;">
            ${feat('Scores by quadrant')}
            ${feat('Salary estimate')}
            ${feat('Detailed factors')}
            ${feat('Normal curve')}
            ${feat('ATS compatibility')}
            ${feat('Automation risk')}
            ${feat('Recruiter perception')}
            ${feat('30-day action plan')}
          </div>
          
          <p style="color:#111827;font-size:18px;font-weight:700;margin:0 0 2px;">Unlock everything for</p>
          <p style="color:#C9A961;font-size:36px;font-weight:900;margin:0 0 2px;line-height:1.1;">$5</p>
          <p style="color:#9ca3af;font-size:11px;margin:0 0 16px;">One-time payment · No subscription</p>
          
          <button id="ft-v4-buy" style="background:linear-gradient(135deg,#C9A961,#A88B4E);color:#fff;border:none;padding:12px 0;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(201,169,97,0.3);width:100%;max-width:300px;transition:transform 0.2s,box-shadow 0.2s;">
            Unlock Full Analysis
          </button>
          <p style="color:#9ca3af;font-size:10px;margin:10px 0 0;">Secure payment via Stripe / PayPal</p>
        </div>
      </div>
    `;
    return card;
  }

  function teaser(icon, html) {
    return `<div class="ft-insight-row" style="display:flex;align-items:center;gap:10px;padding:8px 14px;background:#f9fafb;border-radius:8px;border-left:3px solid #C9A961;transition:background 0.2s;">
      <span style="font-size:15px;">${icon}</span>
      <span style="color:#374151;font-size:13px;text-align:left;">${html}</span>
    </div>`;
  }

  function feat(t) {
    return `<div style="display:flex;align-items:center;gap:5px;color:#6b7280;font-size:11px;padding:1px 0;">
      <span style="color:#C9A961;font-size:11px;">✓</span> ${t}
    </div>`;
  }

  function wireBuyBtn() {
    const btn = document.getElementById('ft-v4-buy');
    if (!btn) return;
    btn.onmouseenter = () => { btn.style.transform = 'scale(1.02)'; btn.style.boxShadow = '0 4px 15px rgba(201,169,97,0.4)'; };
    btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; btn.style.boxShadow = '0 2px 8px rgba(201,169,97,0.3)'; };
    btn.onclick = () => {
      const headerBtns = document.querySelectorAll('button, a');
      for (const b of headerBtns) {
        const t = (b.textContent || '').trim().toLowerCase();
        if (t.includes('unlock full analysis') || t.includes('unlock')) {
          if (b !== btn) { b.click(); return; }
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  }

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
    document.querySelectorAll('[data-ft-hidden]').forEach(el => {
      el.classList.remove('ft-hidden-section');
      el.removeAttribute('data-ft-hidden');
    });
    const mc = document.querySelector('[class*="max-w-4xl"][class*="space-y"]');
    if (mc) mc.style.gap = '';

    const badge = document.querySelector('[data-ft-badge]');
    if (badge) badge.remove();
    const cta = document.getElementById('ft-v4-cta');
    if (cta) cta.remove();
    const sty = document.getElementById('ft-v4-styles');
    if (sty) sty.remove();
    const mk = document.getElementById('ft-v4');
    if (mk) mk.remove();
    console.log('[FT-v4-EN] Payment detected — teaser removed.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { watchPayment(); waitAndApply(); });
  } else {
    watchPayment();
    waitAndApply();
  }

  const obs = new MutationObserver(() => {
    if (document.getElementById('ft-v4')) return;
    if (isPaidUser()) return;
    waitAndApply();
  });
  obs.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => obs.disconnect(), 60000);
})();
