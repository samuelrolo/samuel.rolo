/**
 * free-teaser.js — CV Analyser Free Teaser Restriction (EN)
 * 
 * Strategy: For FREE users (isPaid !== "true"), show ONLY:
 *   - Overall score (number)
 *   - Above/below benchmark indicator
 *   - 2-3 quick insights (ATS rejection %, perceived role, top factor)
 * 
 * Everything else gets a heavy blur + CTA overlay.
 * 
 * For PAID users: script does nothing (full content visible).
 * 
 * Version: 1.0
 * Language: EN (English)
 */
(function () {
  'use strict';

  function isPaidUser() {
    return sessionStorage.getItem('isPaid') === 'true';
  }

  let attempts = 0;
  const MAX_ATTEMPTS = 60;

  function waitAndApply() {
    if (isPaidUser()) return;

    const root = document.getElementById('root');
    if (!root || !root.innerHTML || root.innerHTML.length < 500) {
      if (++attempts < MAX_ATTEMPTS) {
        setTimeout(waitAndApply, 500);
      }
      return;
    }

    const hasScore = root.querySelector('[class*="text-5xl"], [class*="text-6xl"], [class*="text-7xl"]');
    if (!hasScore) {
      if (++attempts < MAX_ATTEMPTS) {
        setTimeout(waitAndApply, 500);
      }
      return;
    }

    applyTeaser(root);
  }

  function applyTeaser(root) {
    const insights = extractInsights();

    const mainContainer = root.querySelector('[class*="space-y"]');
    if (!mainContainer) return;

    const scrollContainer = root.querySelector('[class*="overflow-y"]') || mainContainer;
    const contentWrapper = scrollContainer.querySelector('[class*="space-y-"]') || scrollContainer;

    const sections = Array.from(contentWrapper.children);
    if (sections.length < 3) {
      setTimeout(() => applyTeaser(root), 500);
      return;
    }

    console.log('[FREE-TEASER-EN] Found', sections.length, 'sections. Applying teaser...');

    let scoreSectionFound = false;
    let sectionsToBlur = [];
    let sectionsToKeep = [];

    sections.forEach((section, idx) => {
      const text = section.textContent || '';
      const html = section.innerHTML || '';

      if (!scoreSectionFound && (
        section.querySelector('[class*="text-5xl"], [class*="text-6xl"], [class*="text-7xl"]') ||
        text.includes('ATS Score') ||
        text.includes('/100')
      )) {
        scoreSectionFound = true;
        sectionsToKeep.push(section);
        return;
      }

      if (html.includes('sticky') || section.classList.contains('sticky') ||
          (section.className && section.className.includes('sticky'))) {
        sectionsToKeep.push(section);
        return;
      }

      if (scoreSectionFound) {
        sectionsToBlur.push(section);
      } else {
        sectionsToKeep.push(section);
      }
    });

    if (sectionsToBlur.length === 0) {
      sections.forEach((section, idx) => {
        if (idx <= 1) {
          sectionsToKeep.push(section);
        } else {
          sectionsToBlur.push(section);
        }
      });
    }

    console.log('[FREE-TEASER-EN] Keeping', sectionsToKeep.length, 'sections, blurring', sectionsToBlur.length);

    const blurWrapper = document.createElement('div');
    blurWrapper.id = 'free-teaser-blur-zone';
    blurWrapper.style.cssText = 'position:relative;overflow:hidden;max-height:400px;';

    if (sectionsToBlur.length > 0) {
      const firstBlurred = sectionsToBlur[0];
      firstBlurred.parentNode.insertBefore(blurWrapper, firstBlurred);
      sectionsToBlur.forEach(section => {
        blurWrapper.appendChild(section);
      });
    }

    const blurOverlay = document.createElement('div');
    blurOverlay.id = 'free-teaser-overlay';
    blurOverlay.style.cssText = `
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 50;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      background: linear-gradient(
        to bottom,
        rgba(255,255,255,0.1) 0%,
        rgba(255,255,255,0.6) 30%,
        rgba(255,255,255,0.95) 70%,
        rgba(255,255,255,1) 100%
      );
      pointer-events: none;
    `;
    blurWrapper.appendChild(blurOverlay);

    const ctaCard = buildCTACard(insights);
    blurWrapper.parentNode.insertBefore(ctaCard, blurWrapper.nextSibling);

    const existingCTA = root.querySelector('[class*="border-\\[\\#C9A961\\]\\/30"][class*="rounded-2xl"][class*="text-center"]');
    if (existingCTA && existingCTA !== ctaCard) {
      existingCTA.style.display = 'none';
    }

    injectCSS();
    console.log('[FREE-TEASER-EN] Teaser applied successfully.');
  }

  function extractInsights() {
    const insights = {
      score: null,
      benchmark: null,
      rejectionRate: null,
      perceivedRole: null,
      perceivedSeniority: null,
      topFactor: null
    };

    try {
      const raw = sessionStorage.getItem('cvAnalysis');
      if (!raw) return insights;
      const data = JSON.parse(raw);

      insights.score = data.overallScore || data.overall_score || null;
      insights.rejectionRate = data.atsRejectionRate || data.ats_rejection_rate || null;
      insights.perceivedRole = data.perceivedRole || data.perceived_role || null;
      insights.perceivedSeniority = data.perceivedSeniority || data.perceived_seniority || null;
      insights.topFactor = data.atsTopFactor || data.ats_top_factor || null;

      if (insights.score !== null) {
        const s = parseInt(insights.score);
        if (s >= 75) insights.benchmark = 'above';
        else if (s >= 50) insights.benchmark = 'average';
        else insights.benchmark = 'below';
      }
    } catch (e) {
      console.warn('[FREE-TEASER-EN] Could not extract insights:', e);
    }

    return insights;
  }

  function buildCTACard(insights) {
    const card = document.createElement('div');
    card.id = 'free-teaser-cta';
    card.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      border: 2px solid #C9A961;
      border-radius: 1rem;
      padding: 2rem 1.5rem;
      text-align: center;
      margin: 1.5rem 0;
      box-shadow: 0 8px 32px rgba(201, 169, 97, 0.15);
    `;

    let insightItems = '';

    if (insights.rejectionRate) {
      const rate = parseInt(insights.rejectionRate);
      const icon = rate > 50 ? '⚠️' : '✓';
      insightItems += `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 16px;background:rgba(255,255,255,0.05);border-radius:8px;border-left:3px solid #C9A961;">
          <span style="font-size:18px;">${icon}</span>
          <span style="color:#e0e0e0;font-size:14px;text-align:left;">ATS rejection rate: <strong style="color:#C9A961;">${insights.rejectionRate}%</strong></span>
        </div>`;
    }

    if (insights.perceivedRole) {
      insightItems += `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 16px;background:rgba(255,255,255,0.05);border-radius:8px;border-left:3px solid #C9A961;">
          <span style="font-size:18px;">👤</span>
          <span style="color:#e0e0e0;font-size:14px;text-align:left;">Perceived profile: <strong style="color:#C9A961;">${insights.perceivedRole}</strong>${insights.perceivedSeniority ? ' (' + insights.perceivedSeniority + ')' : ''}</span>
        </div>`;
    }

    if (insights.topFactor) {
      insightItems += `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 16px;background:rgba(255,255,255,0.05);border-radius:8px;border-left:3px solid #C9A961;">
          <span style="font-size:18px;">🎯</span>
          <span style="color:#e0e0e0;font-size:14px;text-align:left;">Top factor: <strong style="color:#C9A961;">${insights.topFactor}</strong></span>
        </div>`;
    }

    let benchmarkHTML = '';
    if (insights.benchmark && insights.score) {
      const color = insights.benchmark === 'above' ? '#22c55e' : insights.benchmark === 'average' ? '#eab308' : '#ef4444';
      const label = insights.benchmark === 'above' ? 'Above benchmark' : insights.benchmark === 'average' ? 'Market average' : 'Below benchmark';
      benchmarkHTML = `
        <div style="display:inline-flex;align-items:center;gap:6px;padding:6px 16px;background:${color}20;border:1px solid ${color}40;border-radius:20px;margin-bottom:12px;">
          <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;"></span>
          <span style="color:${color};font-size:13px;font-weight:600;">${label}</span>
        </div>`;
    }

    card.innerHTML = `
      ${benchmarkHTML}

      <div style="margin-bottom:20px;">
        ${insightItems ? `
          <p style="color:#999;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;font-weight:600;">Quick insights from your CV</p>
          <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">
            ${insightItems}
          </div>
        ` : ''}
      </div>

      <div style="border-top:1px solid rgba(201,169,97,0.3);padding-top:20px;">
        <p style="color:#C9A961;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:700;margin-bottom:8px;">Full analysis available</p>
        <p style="color:#fff;font-size:22px;font-weight:800;margin-bottom:4px;">Unlock everything for just</p>
        <p style="color:#C9A961;font-size:42px;font-weight:900;margin-bottom:8px;">€3.99</p>
        <p style="color:#aaa;font-size:13px;margin-bottom:20px;">One-time payment · No subscription · Instant access</p>

        <div style="display:flex;flex-direction:column;gap:6px;max-width:320px;margin:0 auto 20px;">
          <div style="display:flex;align-items:center;gap:8px;color:#ccc;font-size:13px;">
            <span style="color:#C9A961;">✓</span> Detailed salary estimate
          </div>
          <div style="display:flex;align-items:center;gap:8px;color:#ccc;font-size:13px;">
            <span style="color:#C9A961;">✓</span> Normal curve positioning
          </div>
          <div style="display:flex;align-items:center;gap:8px;color:#ccc;font-size:13px;">
            <span style="color:#C9A961;">✓</span> Profile automation risk
          </div>
          <div style="display:flex;align-items:center;gap:8px;color:#ccc;font-size:13px;">
            <span style="color:#C9A961;">✓</span> Deep recruiter analysis
          </div>
          <div style="display:flex;align-items:center;gap:8px;color:#ccc;font-size:13px;">
            <span style="color:#C9A961;">✓</span> 15+ personalised recommendations
          </div>
          <div style="display:flex;align-items:center;gap:8px;color:#ccc;font-size:13px;">
            <span style="color:#C9A961;">✓</span> 30-day action plan
          </div>
        </div>

        <button id="free-teaser-buy-btn" style="
          background: linear-gradient(135deg, #C9A961, #A88B4E);
          color: #fff;
          border: none;
          padding: 14px 48px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 15px rgba(201,169,97,0.4);
          width: 100%;
          max-width: 320px;
        " onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 20px rgba(201,169,97,0.5)'" onmouseout="this.style.transform='';this.style.boxShadow='0 4px 15px rgba(201,169,97,0.4)'">
          Unlock Full Analysis
        </button>

        <p style="color:#666;font-size:11px;margin-top:12px;">🔒 Secure payment via Stripe / MB WAY / PayPal</p>
      </div>
    `;

    setTimeout(() => {
      const btn = document.getElementById('free-teaser-buy-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          const existingBtns = document.querySelectorAll('button');
          for (const b of existingBtns) {
            const t = (b.textContent || '').trim().toLowerCase();
            if (t.includes('unlock') || t.includes('choose') || t.includes('buy') || t.includes('desbloquear')) {
              if (b !== btn) {
                b.click();
                return;
              }
            }
          }
          const upgradeCTA = document.querySelector('[class*="border-\\[\\#C9A961\\]"][class*="text-center"]');
          if (upgradeCTA) {
            upgradeCTA.style.display = '';
            upgradeCTA.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }
    }, 100);

    return card;
  }

  function injectCSS() {
    const style = document.createElement('style');
    style.id = 'free-teaser-styles';
    style.textContent = `
      #free-teaser-blur-zone {
        position: relative;
        overflow: hidden;
        max-height: 400px;
      }
      #free-teaser-blur-zone > *:not(#free-teaser-overlay) {
        filter: blur(6px);
        pointer-events: none;
        user-select: none;
        -webkit-user-select: none;
      }
      #free-teaser-overlay {
        pointer-events: none;
      }
      #free-teaser-blur-zone [class*="backdrop-blur"] {
        backdrop-filter: blur(12px) !important;
        -webkit-backdrop-filter: blur(12px) !important;
      }
      #free-teaser-cta {
        animation: teaser-fade-in 0.6s ease-out;
      }
      @keyframes teaser-fade-in {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @media (max-width: 640px) {
        #free-teaser-cta {
          padding: 1.5rem 1rem !important;
        }
        #free-teaser-cta p[style*="font-size:42px"] {
          font-size: 36px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function watchForPayment() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      removeTeaser();
      return;
    }

    const originalSetItem = sessionStorage.setItem;
    sessionStorage.setItem = function (key, value) {
      originalSetItem.call(this, key, value);
      if (key === 'isPaid' && value === 'true') {
        removeTeaser();
      }
    };
  }

  function removeTeaser() {
    const blurZone = document.getElementById('free-teaser-blur-zone');
    const cta = document.getElementById('free-teaser-cta');
    const styles = document.getElementById('free-teaser-styles');

    if (blurZone) {
      const parent = blurZone.parentNode;
      while (blurZone.firstChild) {
        if (blurZone.firstChild.id === 'free-teaser-overlay') {
          blurZone.removeChild(blurZone.firstChild);
        } else {
          blurZone.firstChild.style.filter = '';
          blurZone.firstChild.style.pointerEvents = '';
          blurZone.firstChild.style.userSelect = '';
          parent.insertBefore(blurZone.firstChild, blurZone);
        }
      }
      parent.removeChild(blurZone);
    }
    if (cta) cta.remove();
    if (styles) styles.remove();

    console.log('[FREE-TEASER-EN] Payment detected — teaser removed.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      watchForPayment();
      waitAndApply();
    });
  } else {
    watchForPayment();
    waitAndApply();
  }

  const observer = new MutationObserver(() => {
    if (document.getElementById('free-teaser-cta')) return;
    if (isPaidUser()) return;
    waitAndApply();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 60000);
})();
