/**
 * free-teaser.js v5 — CV Analyser Free Teaser (EN)
 * 
 * ROBUST APPROACH: Uses CSS nth-child selectors to hide sections.
 * CSS rules persist through React re-renders (unlike DOM manipulation).
 * 
 * Shows: Status bar (child 1) + Score gauge (child 2)
 * Hides: Everything from child 3 onwards via CSS
 * Appends: CTA card after the container
 * 
 * Version: 5.0
 */
(function () {
  'use strict';

  var PAID = false;
  try { PAID = sessionStorage.getItem('isPaid') === 'true'; } catch(e) {}
  if (PAID) return;

  // ── STEP 1: Inject CSS immediately (before React even renders) ──
  var css = document.createElement('style');
  css.id = 'ft-v5-css';
  css.textContent = [
    '/* Free teaser v5: hide all children from 3rd onwards */',
    '#root [class*="max-w-4xl"][class*="space-y-6"] > *:nth-child(n+3) {',
    '  display: none !important;',
    '}',
    '#root [class*="max-w-4xl"][class*="space-y-8"] > *:nth-child(n+3) {',
    '  display: none !important;',
    '}',
    '#root [class*="max-w-4xl"][class*="space-y-6"],',
    '#root [class*="max-w-4xl"][class*="space-y-8"] {',
    '  gap: 0 !important;',
    '}',
    '#ft-v5-badge, #ft-v5-cta { display: block !important; }',
    '#ft-v5-cta { animation: ftSlide5 0.4s ease-out; }',
    '@keyframes ftSlide5 {',
    '  from { opacity: 0; transform: translateY(10px); }',
    '  to { opacity: 1; transform: translateY(0); }',
    '}',
    '#ft-v5-cta .ft-row:hover { background: rgba(201,169,97,0.08); }'
  ].join('\n');
  document.head.appendChild(css);

  // ── STEP 2: Wait for React to render, then append CTA ──
  var attempts = 0;
  var MAX = 120;

  function tryInject() {
    if (document.getElementById('ft-v5-cta')) return;

    var root = document.getElementById('root');
    if (!root || root.innerHTML.length < 500) {
      if (++attempts < MAX) setTimeout(tryInject, 500);
      return;
    }

    var mc = root.querySelector('[class*="max-w-4xl"][class*="space-y"]');
    if (!mc || mc.children.length < 3) {
      if (++attempts < MAX) setTimeout(tryInject, 500);
      return;
    }

    inject(mc);
  }

  function inject(mc) {
    var ins = getInsights();

    var badge = buildBadge(ins);
    if (badge) mc.parentNode.insertBefore(badge, mc.nextSibling);

    var cta = buildCTA(ins);
    var after = badge || mc;
    after.parentNode.insertBefore(cta, after.nextSibling);

    setTimeout(wireBuyBtn, 200);
    console.log('[FT-v5-EN] Injected CTA. Sections hidden via CSS nth-child.');
  }

  function getInsights() {
    var r = { score:null, benchmark:null, above:null, atsRate:null, role:null, seniority:null, topFactor:null };
    try {
      var d = JSON.parse(sessionStorage.getItem('cvAnalysis') || '{}');
      r.score = d.overallScore || d.overall_score || null;
      r.atsRate = d.atsRejectionRate || d.ats_rejection_rate || null;
      r.role = d.perceivedRole || d.perceived_role || null;
      r.seniority = d.perceivedSeniority || d.perceived_seniority || null;
      r.topFactor = d.atsTopFactor || d.ats_top_factor || null;
      if (d.quadrants && d.quadrants.length > 0) {
        var sum = 0;
        for (var i = 0; i < d.quadrants.length; i++) sum += (d.quadrants[i].benchmark || 0);
        r.benchmark = Math.round(sum / d.quadrants.length);
      }
      if (r.score) {
        var s = parseInt(r.score);
        r.above = r.benchmark ? (s > r.benchmark ? 'above' : s === r.benchmark ? 'average' : 'below') :
                  (s >= 75 ? 'above' : s >= 50 ? 'average' : 'below');
      }
    } catch(e) {}
    return r;
  }

  function buildBadge(ins) {
    if (!ins.above || !ins.score) return null;
    var div = document.createElement('div');
    div.id = 'ft-v5-badge';
    div.style.cssText = 'text-align:center;padding:12px 16px 16px;max-width:896px;margin:0 auto;';

    var color = ins.above === 'above' ? '#22c55e' : ins.above === 'average' ? '#eab308' : '#ef4444';
    var arrow = ins.above === 'above' ? '↑' : ins.above === 'average' ? '→' : '↓';
    var label = ins.above === 'above' ? 'Above market benchmark' :
                ins.above === 'average' ? 'At market average' : 'Below market benchmark';
    var benchText = ins.benchmark ? ' (' + ins.score + ' vs ' + ins.benchmark + ')' : '';

    div.innerHTML = '<div style="display:inline-flex;align-items:center;gap:8px;padding:8px 20px;' +
      'background:' + color + '12;border:1px solid ' + color + '25;border-radius:24px;">' +
      '<span style="font-size:15px;">' + arrow + '</span>' +
      '<span style="color:' + color + ';font-size:13px;font-weight:600;">' + label + benchText + '</span>' +
      '</div>';
    return div;
  }

  function buildCTA(ins) {
    var card = document.createElement('div');
    card.id = 'ft-v5-cta';
    card.style.cssText = 'max-width:896px;margin:0 auto;padding:0 16px;';

    var teasers = '';
    if (ins.atsRate !== null) {
      var pct = parseInt(ins.atsRate);
      var icon = pct > 50 ? '⚠️' : '✅';
      teasers += teaser(icon, 'ATS rejection rate: <strong>' + ins.atsRate + '%</strong>');
    }
    if (ins.role) {
      var extra = ins.seniority ? ' · ' + ins.seniority : '';
      teasers += teaser('👤', 'Perceived profile: <strong>' + ins.role + extra + '</strong>');
    }
    if (ins.topFactor) {
      teasers += teaser('🎯', 'Top factor: <strong>' + ins.topFactor + '</strong>');
    }

    card.innerHTML =
      '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:28px 24px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.06);">' +
        (teasers ?
          '<p style="color:#6b7280;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 10px;font-weight:600;">Quick insights</p>' +
          '<div style="display:flex;flex-direction:column;gap:6px;margin:0 0 20px;">' + teasers + '</div>'
        : '') +
        '<div style="border-top:1px solid #e5e7eb;padding-top:20px;">' +
          '<p style="color:#6b7280;font-size:11px;margin:0 0 8px;">The full analysis includes:</p>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;max-width:340px;margin:0 auto 16px;text-align:left;">' +
            feat('Scores by quadrant') + feat('Salary estimate') +
            feat('Detailed factors') + feat('Normal curve') +
            feat('ATS compatibility') + feat('Automation risk') +
            feat('Recruiter perception') + feat('30-day action plan') +
          '</div>' +
          '<p style="color:#111827;font-size:18px;font-weight:700;margin:0 0 2px;">Unlock everything for</p>' +
          '<p style="color:#C9A961;font-size:36px;font-weight:900;margin:0 0 2px;line-height:1.1;">$5</p>' +
          '<p style="color:#9ca3af;font-size:11px;margin:0 0 16px;">One-time payment · No subscription</p>' +
          '<button id="ft-v5-buy" style="background:linear-gradient(135deg,#C9A961,#A88B4E);color:#fff;border:none;padding:12px 0;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(201,169,97,0.3);width:100%;max-width:300px;transition:transform 0.2s,box-shadow 0.2s;">' +
            'Unlock Full Analysis' +
          '</button>' +
          '<p style="color:#9ca3af;font-size:10px;margin:10px 0 0;">Secure payment via Stripe / PayPal</p>' +
        '</div>' +
      '</div>';
    return card;
  }

  function teaser(icon, html) {
    return '<div class="ft-row" style="display:flex;align-items:center;gap:10px;padding:8px 14px;background:#f9fafb;border-radius:8px;border-left:3px solid #C9A961;transition:background 0.2s;">' +
      '<span style="font-size:15px;">' + icon + '</span>' +
      '<span style="color:#374151;font-size:13px;text-align:left;">' + html + '</span>' +
    '</div>';
  }

  function feat(t) {
    return '<div style="display:flex;align-items:center;gap:5px;color:#6b7280;font-size:11px;padding:1px 0;">' +
      '<span style="color:#C9A961;font-size:11px;">✓</span> ' + t +
    '</div>';
  }

  function wireBuyBtn() {
    var btn = document.getElementById('ft-v5-buy');
    if (!btn) return;
    btn.onmouseenter = function() { btn.style.transform='scale(1.02)'; btn.style.boxShadow='0 4px 15px rgba(201,169,97,0.4)'; };
    btn.onmouseleave = function() { btn.style.transform='scale(1)'; btn.style.boxShadow='0 2px 8px rgba(201,169,97,0.3)'; };
    btn.onclick = function() {
      var all = document.querySelectorAll('button, a');
      for (var i = 0; i < all.length; i++) {
        var t = (all[i].textContent || '').trim().toLowerCase();
        if ((t.indexOf('unlock full analysis') >= 0 || t.indexOf('unlock') >= 0) && all[i] !== btn) {
          all[i].click(); return;
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  }

  function watchPayment() {
    var p = new URLSearchParams(window.location.search);
    if (p.get('payment') === 'success') { removeFT(); return; }
    var orig = sessionStorage.setItem;
    sessionStorage.setItem = function(k, v) {
      orig.call(this, k, v);
      if (k === 'isPaid' && v === 'true') removeFT();
    };
  }

  function removeFT() {
    var el;
    el = document.getElementById('ft-v5-css'); if (el) el.remove();
    el = document.getElementById('ft-v5-badge'); if (el) el.remove();
    el = document.getElementById('ft-v5-cta'); if (el) el.remove();
    console.log('[FT-v5-EN] Payment detected — teaser removed.');
  }

  watchPayment();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInject);
  } else {
    tryInject();
  }

  var obs = new MutationObserver(function() {
    if (document.getElementById('ft-v5-cta')) return;
    try { if (sessionStorage.getItem('isPaid') === 'true') return; } catch(e) {}
    tryInject();
  });
  obs.observe(document.body, { childList: true, subtree: true });
  setTimeout(function() { obs.disconnect(); }, 60000);
})();
