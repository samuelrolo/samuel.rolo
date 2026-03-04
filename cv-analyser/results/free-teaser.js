/**
 * free-teaser.js — CV Analyser Free Teaser Restriction (PT)
 * 
 * Strategy: For FREE users (isPaid !== "true"), show ONLY:
 *   - Overall score (gauge + number)
 *   - Above/below benchmark indicator
 *   - 2-3 quick insights
 * 
 * Everything else gets hidden with a blur overlay + CTA.
 * 
 * DOM Structure (from Results.tsx):
 *   #root > div[min-h-screen] > div[max-w-4xl space-y-6] (main content)
 *     child 0: score/status bar
 *     child 1: score gauge + benchmark
 *     child 2+: section cards (bg-card border...)
 *     ...
 *     CTA card (border-[#C9A961])
 *     email section
 * 
 * Version: 2.0
 * Language: PT (Portuguese)
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

    // Find the main content wrapper: div with "max-w-4xl" and "space-y-6" or "space-y-8"
    const mainContent = root.querySelector('[class*="max-w-4xl"][class*="space-y-6"], [class*="max-w-4xl"][class*="space-y-8"]');
    if (!mainContent) {
      if (++attempts < MAX_ATTEMPTS) setTimeout(waitAndApply, 500);
      return;
    }

    // Ensure we have enough children (sections rendered)
    const children = Array.from(mainContent.children);
    if (children.length < 4) {
      if (++attempts < MAX_ATTEMPTS) setTimeout(waitAndApply, 500);
      return;
    }

    applyTeaser(mainContent, children);
  }

  function applyTeaser(mainContent, children) {
    // Mark as applied to prevent re-runs
    const marker = document.createElement('div');
    marker.id = 'free-teaser-applied';
    marker.style.display = 'none';
    document.body.appendChild(marker);

    console.log('[FREE-TEASER] Found', children.length, 'children in main content. Applying teaser...');

    // Strategy: Keep first 2 children (score area + gauge/benchmark)
    // Everything else gets wrapped in a blur container
    // Then we add our CTA card after the blur

    const KEEP_COUNT = 2; // Keep score bar + score gauge area
    const sectionsToBlur = [];

    children.forEach((child, idx) => {
      if (idx < KEEP_COUNT) {
        // Keep visible — but check if it's the score area and extract insights
        return;
      }
      sectionsToBlur.push(child);
    });

    if (sectionsToBlur.length === 0) return;

    // Create blur wrapper
    const blurWrapper = document.createElement('div');
    blurWrapper.id = 'free-teaser-blur-zone';
    blurWrapper.style.cssText = 'position:relative;overflow:hidden;max-height:350px;pointer-events:none;';

    // Insert blur wrapper before the first section to blur
    mainContent.insertBefore(blurWrapper, sectionsToBlur[0]);

    // Move all sections into the blur wrapper
    sectionsToBlur.forEach(section => {
      blurWrapper.appendChild(section);
    });

    // Add blur overlay on top
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

    // Also blur the content inside
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

    // Extract insights from sessionStorage
    const insights = extractInsights();

    // Build and insert CTA card
    const cta = buildCTA(insights);
    mainContent.appendChild(cta);

    // Hide the existing React CTA card (border-[#C9A961]/30 rounded-2xl text-center)
    // It's now inside the blur zone, so it's already hidden

    console.log('[FREE-TEASER] Teaser applied. Kept', KEEP_COUNT, 'sections, blurred', sectionsToBlur.length);
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
        insights.benchmark = s >= 75 ? 'acima' : s >= 50 ? 'na média' : 'abaixo';
      }
    } catch (e) { /* silent */ }
    return insights;
  }

  function buildCTA(ins) {
    const card = document.createElement('div');
    card.id = 'free-teaser-cta';

    // Build insight items
    let items = '';
    if (ins.rejectionRate) {
      const icon = parseInt(ins.rejectionRate) > 50 ? '⚠️' : '✓';
      items += insightRow(icon, `Taxa de rejeição ATS: <strong style="color:#C9A961;">${ins.rejectionRate}%</strong>`);
    }
    if (ins.perceivedRole) {
      const extra = ins.seniority ? ` (${ins.seniority})` : '';
      items += insightRow('👤', `Perfil percebido: <strong style="color:#C9A961;">${ins.perceivedRole}${extra}</strong>`);
    }
    if (ins.topFactor) {
      items += insightRow('🎯', `Factor principal: <strong style="color:#C9A961;">${ins.topFactor}</strong>`);
    }

    // Benchmark badge
    let badge = '';
    if (ins.benchmark && ins.score) {
      const color = ins.benchmark === 'acima' ? '#22c55e' : ins.benchmark === 'na média' ? '#eab308' : '#ef4444';
      const label = ins.benchmark === 'acima' ? 'Acima do benchmark' : ins.benchmark === 'na média' ? 'Na média do mercado' : 'Abaixo do benchmark';
      badge = `<div style="display:inline-flex;align-items:center;gap:6px;padding:6px 16px;background:${color}20;border:1px solid ${color}40;border-radius:20px;margin-bottom:16px;">
        <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;"></span>
        <span style="color:${color};font-size:13px;font-weight:600;">${label}</span>
      </div>`;
    }

    card.innerHTML = `
      <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);border:2px solid #C9A961;border-radius:1rem;padding:2rem 1.5rem;text-align:center;box-shadow:0 8px 32px rgba(201,169,97,0.15);">
        ${badge}
        ${items ? `
          <p style="color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;font-weight:600;">Insights rápidos do teu CV</p>
          <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:24px;">${items}</div>
        ` : ''}
        <div style="border-top:1px solid rgba(201,169,97,0.3);padding-top:20px;">
          <p style="color:#C9A961;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:700;margin-bottom:8px;">Análise completa disponível</p>
          <p style="color:#fff;font-size:20px;font-weight:800;margin-bottom:4px;">Desbloqueia tudo por apenas</p>
          <p style="color:#C9A961;font-size:40px;font-weight:900;margin-bottom:8px;">€3,99</p>
          <p style="color:#aaa;font-size:12px;margin-bottom:20px;">Pagamento único · Sem subscrição · Acesso imediato</p>
          <div style="display:flex;flex-direction:column;gap:5px;max-width:300px;margin:0 auto 20px;">
            ${featureRow('Estimativa salarial detalhada')}
            ${featureRow('Curva normal de posicionamento')}
            ${featureRow('Risco de automação do perfil')}
            ${featureRow('Análise profunda do recrutador')}
            ${featureRow('15+ recomendações personalizadas')}
            ${featureRow('Plano de acção de 30 dias')}
          </div>
          <button id="free-teaser-buy-btn" style="background:linear-gradient(135deg,#C9A961,#A88B4E);color:#fff;border:none;padding:14px 48px;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;box-shadow:0 4px 15px rgba(201,169,97,0.4);width:100%;max-width:320px;pointer-events:auto;">
            Desbloquear Análise Completa
          </button>
          <p style="color:#666;font-size:11px;margin-top:12px;">🔒 Pagamento seguro via Stripe / MB WAY / PayPal</p>
        </div>
      </div>
    `;

    // Wire up buy button
    setTimeout(() => {
      const btn = document.getElementById('free-teaser-buy-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          // Find the existing payment/upgrade button in the blurred zone
          const blurZone = document.getElementById('free-teaser-blur-zone');
          if (blurZone) {
            // Temporarily make it interactive
            blurZone.style.pointerEvents = 'auto';
            const buttons = blurZone.querySelectorAll('button');
            for (const b of buttons) {
              const t = (b.textContent || '').toLowerCase();
              if (t.includes('desbloquear') || t.includes('escolher') || t.includes('unlock') || t.includes('comprar') || t.includes('pagar')) {
                b.click();
                return;
              }
            }
            // If no button found, try to find the Stripe/payment link
            const links = blurZone.querySelectorAll('a');
            for (const a of links) {
              const t = (a.textContent || '').toLowerCase();
              if (t.includes('desbloquear') || t.includes('pagar') || t.includes('stripe')) {
                a.click();
                return;
              }
            }
          }
          // Fallback: scroll up to find any payment button on the page
          document.querySelectorAll('button').forEach(b => {
            const t = (b.textContent || '').toLowerCase();
            if (t.includes('mb way') || t.includes('stripe') || t.includes('paypal')) {
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

  // ── Payment detection ──
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
    console.log('[FREE-TEASER] Payment detected — teaser removed.');
  }

  // ── Init ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { watchForPayment(); waitAndApply(); });
  } else {
    watchForPayment();
    waitAndApply();
  }

  // MutationObserver for SPA navigation
  const obs = new MutationObserver(() => {
    if (document.getElementById('free-teaser-applied')) return;
    if (isPaidUser()) return;
    waitAndApply();
  });
  obs.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => obs.disconnect(), 60000);
})();
