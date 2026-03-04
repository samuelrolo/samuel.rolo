/**
 * career-path-enhancer.js — Career Path Results Enhancer (PT)
 * 
 * Fixes 3 issues:
 * 1. Adds "Ver Vagas no LinkedIn" button to each next_role card
 * 2. Fixes "Ver formação" broken links → Google search with results
 * 3. Adds "3 Formações Gratuitas" section with Google search links
 * 
 * Uses CSS + MutationObserver approach (survives React re-renders)
 * Version: 1.0
 */
(function () {
  'use strict';

  var LANG = 'pt';
  var applied = {};

  function run() {
    var root = document.getElementById('root');
    if (!root || root.innerHTML.length < 1000) return;

    fixLinkedInButtons(root);
    fixCourseLinks(root);
    addFreeTraining(root);
  }

  // ── 1. LinkedIn Jobs Buttons ──
  function fixLinkedInButtons(root) {
    // Find all next_role cards: they have #1, #2, #3 badges
    var cards = root.querySelectorAll('[class*="border"][class*="rounded-xl"][class*="overflow-hidden"]');
    cards.forEach(function(card) {
      if (card.querySelector('.cp-linkedin-btn')) return; // already added
      
      // Check if this is a role card (has #N badge and role title)
      var badge = card.querySelector('[class*="text-\\[\\#C9A961\\]"][class*="bg-\\[\\#C9A961\\]"]');
      if (!badge) {
        // Try alternative: find cards with fit percentage
        var fitBadge = card.querySelector('[class*="text-green-600"]');
        var titleEl = card.querySelector('[class*="font-semibold"][class*="text-foreground"]');
        if (!fitBadge && !titleEl) return;
      }

      // Find the role title
      var titleEl = card.querySelector('[class*="font-semibold"][class*="text-foreground"]');
      if (!titleEl) return;
      var roleTitle = titleEl.textContent.trim();
      if (!roleTitle || roleTitle.length < 3) return;

      // Find the content area (second child div, after the header)
      var contentArea = card.querySelector('[class*="space-y-2"]');
      if (!contentArea) contentArea = card.lastElementChild;
      if (!contentArea) return;

      // Create LinkedIn Jobs button
      var btn = document.createElement('a');
      btn.className = 'cp-linkedin-btn';
      btn.href = 'https://www.linkedin.com/jobs/search/?keywords=' + encodeURIComponent(roleTitle) + '&location=Portugal';
      btn.target = '_blank';
      btn.rel = 'noopener noreferrer';
      btn.style.cssText = 'display:inline-flex;align-items:center;gap:6px;margin-top:8px;padding:6px 14px;' +
        'background:#0A66C2;color:#fff;border-radius:6px;font-size:12px;font-weight:600;' +
        'text-decoration:none;transition:background 0.2s;cursor:pointer;';
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>' +
        'Ver Vagas no LinkedIn';
      btn.onmouseenter = function() { btn.style.background = '#004182'; };
      btn.onmouseleave = function() { btn.style.background = '#0A66C2'; };

      contentArea.appendChild(btn);
    });
  }

  // ── 2. Fix "Ver formação" broken links ──
  function fixCourseLinks(root) {
    var links = root.querySelectorAll('a[class*="text-\\[\\#C9A961\\]"]');
    links.forEach(function(link) {
      var text = link.textContent.trim().toLowerCase();
      if (text !== 'ver formação' && text !== 'view training') return;
      if (link.dataset.cpFixed) return;

      // Get the formation name from the parent card
      var card = link.closest('[class*="border"][class*="rounded-lg"]');
      if (!card) return;
      var nameEl = card.querySelector('[class*="font-semibold"][class*="text-foreground"]');
      if (!nameEl) return;
      var formationName = nameEl.textContent.trim();

      // Get provider if available
      var providerEl = card.querySelector('[class*="text-muted-foreground"]');
      var provider = '';
      if (providerEl) {
        var pText = providerEl.textContent.trim();
        // Provider text usually starts with provider name
        if (pText && pText.length < 60 && !pText.startsWith('✓') && !pText.startsWith('○')) {
          provider = pText;
        }
      }

      // Build Google search URL that returns course results
      var query = formationName + (provider ? ' ' + provider : '') + ' curso online';
      link.href = 'https://www.google.com/search?q=' + encodeURIComponent(query);
      link.dataset.cpFixed = 'true';
    });
  }

  // ── 3. Add Free Training Section ──
  function addFreeTraining(root) {
    if (document.getElementById('cp-free-training')) return;

    // Find the formations section (FORMAÇÕES RECOMENDADAS)
    var formationsSection = null;
    var sections = root.querySelectorAll('[class*="bg-card"][class*="border"][class*="rounded-xl"]');
    sections.forEach(function(sec) {
      var header = sec.querySelector('[class*="tracking-wider"]');
      if (header && (header.textContent.includes('FORMAÇÕES') || header.textContent.includes('TRAINING'))) {
        formationsSection = sec;
      }
    });

    if (!formationsSection) return;

    // Extract formation names to generate relevant free alternatives
    var formationNames = [];
    var formationCards = formationsSection.querySelectorAll('[class*="border"][class*="rounded-lg"]');
    formationCards.forEach(function(card) {
      var nameEl = card.querySelector('[class*="font-semibold"][class*="text-foreground"]');
      if (nameEl) formationNames.push(nameEl.textContent.trim());
    });

    // Build free training section
    var section = document.createElement('div');
    section.id = 'cp-free-training';
    section.style.cssText = 'margin-top:16px;';
    section.className = 'bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4';

    var freeTrainings = [];
    // Generate 3 free training suggestions based on the recommended formations
    for (var i = 0; i < Math.min(3, formationNames.length); i++) {
      freeTrainings.push({
        name: formationNames[i],
        searchQuery: formationNames[i] + ' free course online',
        googleUrl: 'https://www.google.com/search?q=' + encodeURIComponent(formationNames[i] + ' free course online')
      });
    }

    // If less than 3 formations, add generic ones
    if (freeTrainings.length < 3) {
      var generic = [
        { name: 'Coursera Free Courses', searchQuery: 'coursera free courses career development', googleUrl: 'https://www.google.com/search?q=coursera+free+courses+career+development' },
        { name: 'LinkedIn Learning Free Courses', searchQuery: 'linkedin learning free courses', googleUrl: 'https://www.google.com/search?q=linkedin+learning+free+courses' },
        { name: 'Google Career Certificates', searchQuery: 'google career certificates free', googleUrl: 'https://www.google.com/search?q=google+career+certificates+free' }
      ];
      while (freeTrainings.length < 3) {
        freeTrainings.push(generic[freeTrainings.length]);
      }
    }

    var html = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
      '<div style="width:32px;height:32px;border-radius:8px;background:rgba(34,197,94,0.1);display:flex;align-items:center;justify-content:center;">' +
        '<span style="font-size:16px;">🎓</span>' +
      '</div>' +
      '<p style="font-size:10px;font-weight:600;letter-spacing:1.2px;color:#6b7280;">FORMAÇÕES GRATUITAS RECOMENDADAS</p>' +
    '</div>';

    freeTrainings.forEach(function(t, idx) {
      html += '<div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
        '<div style="flex:1;">' +
          '<p style="font-size:13px;font-weight:600;color:#111827;">' + escHtml(t.name) + '</p>' +
          '<p style="font-size:11px;color:#6b7280;margin-top:2px;">Versão gratuita disponível online</p>' +
        '</div>' +
        '<a href="' + t.googleUrl + '" target="_blank" rel="noopener noreferrer" ' +
          'style="display:inline-flex;align-items:center;gap:4px;padding:5px 12px;background:#22c55e;color:#fff;border-radius:6px;font-size:11px;font-weight:600;text-decoration:none;white-space:nowrap;transition:background 0.2s;"' +
          'onmouseenter="this.style.background=\'#16a34a\'" onmouseleave="this.style.background=\'#22c55e\'">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>' +
          'Fazer Curso' +
        '</a>' +
      '</div>';
    });

    section.innerHTML = html;
    formationsSection.parentNode.insertBefore(section, formationsSection.nextSibling);
  }

  function escHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // ── Init with MutationObserver ──
  function init() {
    run();
    var obs = new MutationObserver(function() { run(); });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(function() { obs.disconnect(); }, 60000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
