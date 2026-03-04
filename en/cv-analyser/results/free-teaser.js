/**
 * free-teaser.js — CV Analyser Free Teaser Restriction (EN)
 * 
 * Strategy: For FREE users (isPaid !== "true"), show ONLY:
 *   - Overall score (gauge + number)
 *   - Above/below benchmark indicator
 *   - 2-3 quick insights
 * 
 * Everything else gets hidden with a blur overlay + CTA.
 * 
 * Version: 2.0
 * Language: EN (English)
 */
(function () {
  'use strict';

  function isPaidUser() {
    return sessionStorage.getItem('isPaid') === 'true';
  }

  let attempts = 0;
  const MAX_ATTEMPTS = 120;

  function waitAndApply() {
    if (isPaidUser()) return;
    if (document.getElementById('free-teaser-applied')) return;

    const root = document.getElementById('root');
    if (!root || root.innerHTML.length < 1000) {
      if (++attempts < MAX_ATTEMPTS) setTimeout(waitAndApply, 500);
      return;
    }

    const mainContent = root.querySelector('[class*="max-w-4xl"][class*="space-y-6"], [class*="max-w-4xl"][class*="space-y-8"]');
    if (!mainContent) {
      if (++attempts < MAX_ATTEMPTS) setTimeout(waitAndApply, 500);
      return;
    }

    const children = Array.from(mainContent.children);
    if (children.length < 4) {
      if (++attempts < MAX_ATTEMPTS) setTimeout(waitAndApply, 500);
      return;
    }

    applyTeaser(mainContent, children);
  }

  function applyTeaser(mainContent, children) {
    const marker = document.createElement('div');
    marker.id = 'free-teaser-applied';
    marker.style.display = 'none';
    document.body.appendChild(marker);

    console.log('[FREE-TEASER-EN] Found', children.length, 'children. Applying teaser...');

    const KEEP_COUNT = 2;
    const sectionsToBlur = [];

    children.forEach((child, idx) => {
      if (idx < KEEP_COUNT) return;
      sectionsToBlur.push(child);
    });

    if (sectionsToBlur.length === 0) return;

    const blurWrapper = document.createElement('div');
    blurWrapper.id = 'free-teaser-blur-zone';
    blurWrapper.style.cssText = 'position:relative;overflow:hidden;max-height:350px;pointer-events:none;';

    mainContent.insertBefore(blurWrapper, sectionsToBlur[0]);
    sectionsToBlur.forEach(s => blurWrapper.appendChild(s));

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:absolute; top:0; left:0; right:0; bottom:0; z-index:50;
      backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
      background:linear-gradient(to bottom,
        rgba(255,255,255,0.05) 0%,
        rgba(255,255,255,0.4) 25%,
        rgba(255,255,255,0.8) 55%,
        rgba(255,255,255,1) 85%
      );
    `;
    blurWrapper.appendChild(overlay);

    const style = document.createElement('style');
    style.id = 'free-teaser-styles';
    style.textContent = `
      #free-teaser-blur-zone > *:not([style*="position:absolute"]) {
        filter: blur(5px) !important;
        user-select: none !important;
        -webkit-user-select: none !important;
      }
      #free-teaser-cta { animation: ft-fade 0.6s ease-out; }
      @keyframes ft-fade { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    `;
    document.head.appendChild(style);

    const insights = extractInsights();
    const cta = buildCTA(insights);
    mainContent.appendChild(cta);

    console.log('[FREE-TEASER-EN] Teaser applied. Kept', KEEP_COUNT, 'sections, blurred', sectionsToBlur.length);
  }

  function extractInsights() {
    const insights = { score: null, benchmark: null, rejectionRate: null, perceivedRole: null, seniority: null, topFactor: null };
    try {
      const raw = sessionStorage.getItem('cvAnalysis');
      if (!raw) return insights;
      const data = JSON.parse(raw);
      insights.score = data.overallScore || data.overall_score || null;
      insights.rejectionRate = data.atsRejectionRate || data.ats_rejection_rate || null;
      insights.perceivedRole = data.perceivedRole || data.perceived_role || null;
      insights.seniority = data.perceivedSeniority || data.perceived_seniority || null;
      insights.topFactor = data.atsTopFactor || data.ats_top_factor || null;
      if (insights.score !== null) {
        const s = parseInt(insights.score);
        insights.benchmark = s >= 75 ? 'above' : s >= 50 ? 'average' : 'below';
      }
    } catch (e) { /* silent */ }
    return insights;
  }

  function buildCTA(ins) {
    const card = document.createElement('div');
    card.id = 'free-teaser-cta';

    let items = '';
    if (ins.rejectionRate) {
      const icon = parseInt(ins.rejectionRate) > 50 ? '⚠️' : '✓';
      items += insightRow(icon, `ATS rejection rate: <strong style="color:#C9A961;">${ins.rejectionRate}%</strong>`);
    }
    if (ins.perceivedRole) {
      const extra = ins.seniority ? ` (${ins.seniority})` : '';
      items += insightRow('👤', `Perceived profile: <strong style="color:#C9A961;">${ins.perceivedRole}${extra}</strong>`);
    }
    if (ins.topFactor) {
      items += insightRow('🎯', `Top factor: <strong style="color:#C9A961;">${ins.topFactor}</strong>`);
    }

    let badge = '';
    if (ins.benchmark && ins.score) {
      const color = ins.benchmark === 'above' ? '#22c55e' : ins.benchmark === 'average' ? '#eab308' : '#ef4444';
      const label = ins.benchmark === 'above' ? 'Above benchmark' : ins.benchmark === 'average' ? 'At market average' : 'Below benchmark';
      badge = `<div style="display:inline-flex;align-items:center;gap:6px;padding:6px 16px;background:${color}20;border:1px solid ${color}40;border-radius:20px;margin-bottom:16px;">
        <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;"></span>
        <span style="color:${color};font-size:13px;font-weight:600;">${label}</span>
      </div>`;
    }

    card.innerHTML = `
      <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);border:2px solid #C9A961;border-radius:1rem;padding:2rem 1.5rem;text-align:center;box-shadow:0 8px 32px rgba(201,169,97,0.15);">
        ${badge}
        ${items ? `
          <p style="color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;font-weight:600;">Quick insights from your CV</p>
          <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:24px;">${items}</div>
        ` : ''}
        <div style="border-top:1px solid rgba(201,169,97,0.3);padding-top:20px;">
          <p style="color:#C9A961;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:700;margin-bottom:8px;">Full analysis available</p>
          <p style="color:#fff;font-size:20px;font-weight:800;margin-bottom:4px;">Unlock everything for just</p>
          <p style="color:#C9A961;font-size:40px;font-weight:900;margin-bottom:8px;">$5</p>
          <p style="color:#aaa;font-size:12px;margin-bottom:20px;">One-time payment · No subscription · Instant access</p>
          <div style="display:flex;flex-direction:column;gap:5px;max-width:300px;margin:0 auto 20px;">
            ${featureRow('Detailed salary estimate')}
            ${featureRow('Normal curve positioning')}
            ${featureRow('Automation risk profile')}
            ${featureRow('Deep recruiter analysis')}
            ${featureRow('15+ personalized recommendations')}
            ${featureRow('30-day action plan')}
          </div>
          <button id="free-teaser-buy-btn" style="background:linear-gradient(135deg,#C9A961,#A88B4E);color:#fff;border:none;padding:14px 48px;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;box-shadow:0 4px 15px rgba(201,169,97,0.4);width:100%;max-width:320px;pointer-events:auto;">
            Unlock Full Analysis
          </button>
          <p style="color:#666;font-size:11px;margin-top:12px;">🔒 Secure payment via Stripe / PayPal</p>
        </div>
      </div>
    `;

    setTimeout(() => {
      const btn = document.getElementById('free-teaser-buy-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          const blurZone = document.getElementById('free-teaser-blur-zone');
          if (blurZone) {
            blurZone.style.pointerEvents = 'auto';
            const buttons = blurZone.querySelectorAll('button');
            for (const b of buttons) {
              const t = (b.textContent || '').toLowerCase();
              if (t.includes('unlock') || t.includes('choose') || t.includes('buy') || t.includes('pay') || t.includes('stripe')) {
                b.click();
                return;
              }
            }
          }
          document.querySelectorAll('button').forEach(b => {
            const t = (b.textContent || '').toLowerCase();
            if (t.includes('stripe') || t.includes('paypal')) {
              b.scrollIntoView({ behavior: 'smooth' });
              setTimeout(() => b.click(), 500);
            }
          });
        });
      }
    }, 200);

    return card;
  }

  function insightRow(icon, html) {
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 16px;background:rgba(255,255,255,0.05);border-radius:8px;border-left:3px solid #C9A961;">
      <span style="font-size:18px;">${icon}</span>
      <span style="color:#e0e0e0;font-size:14px;text-align:left;">${html}</span>
    </div>`;
  }

  function featureRow(text) {
    return `<div style="display:flex;align-items:center;gap:8px;color:#ccc;font-size:13px;">
      <span style="color:#C9A961;">✓</span> ${text}
    </div>`;
  }

  function watchForPayment() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') { removeTeaser(); return; }
    const orig = sessionStorage.setItem;
    sessionStorage.setItem = function (k, v) {
      orig.call(this, k, v);
      if (k === 'isPaid' && v === 'true') removeTeaser();
    };
  }

  function removeTeaser() {
    const zone = document.getElementById('free-teaser-blur-zone');
    const cta = document.getElementById('free-teaser-cta');
    const styles = document.getElementById('free-teaser-styles');
    const marker = document.getElementById('free-teaser-applied');
    if (zone) {
      const parent = zone.parentNode;
      while (zone.firstChild) {
        if (zone.firstChild.nodeType === 1 && zone.firstChild.style && zone.firstChild.style.position === 'absolute') {
          zone.removeChild(zone.firstChild);
        } else {
          const child = zone.firstChild;
          child.style && (child.style.filter = '');
          child.style && (child.style.pointerEvents = '');
          child.style && (child.style.userSelect = '');
          parent.insertBefore(child, zone);
        }
      }
      parent.removeChild(zone);
    }
    if (cta) cta.remove();
    if (styles) styles.remove();
    if (marker) marker.remove();
    console.log('[FREE-TEASER-EN] Payment detected — teaser removed.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { watchForPayment(); waitAndApply(); });
  } else {
    watchForPayment();
    waitAndApply();
  }

  const obs = new MutationObserver(() => {
    if (document.getElementById('free-teaser-applied')) return;
    if (isPaidUser()) return;
    waitAndApply();
  });
  obs.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => obs.disconnect(), 60000);
})();
