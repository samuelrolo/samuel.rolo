/**
 * Career Path Preview Carousel
 * Injeta um widget rotativo com dummy data antes do paywall
 * Mostra ao utilizador o que vai receber ao desbloquear
 */
(function() {
  'use strict';

  const PREVIEW_SECTIONS = [
    {
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
      title: 'Funções compatíveis',
      subtitle: 'Cargos alinhados com o teu nível de senioridade',
      dummyItems: [
        { label: 'Head of People & Culture', match: '94%' },
        { label: 'Director de Transformação Organizacional', match: '91%' },
        { label: 'VP Human Resources', match: '87%' },
        { label: 'Chief People Officer', match: '82%' }
      ],
      type: 'list-match'
    },
    {
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
      title: 'Movimentos de carreira',
      subtitle: 'Trajectórias realistas a curto e médio prazo',
      dummyItems: [
        { from: 'HR Transformation Manager', to: 'Head of HR Operations', time: '6-12 meses' },
        { from: 'HR Transformation Manager', to: 'Director de People & Culture', time: '12-24 meses' },
        { from: 'HR Transformation Manager', to: 'CHRO / VP HR', time: '24-36 meses' }
      ],
      type: 'career-moves'
    },
    {
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
      title: 'Intervalos salariais estimados',
      subtitle: 'Referências de mercado para Portugal e Europa',
      dummyItems: [
        { role: 'Head of HR Operations', range: '€65.000 — €85.000', market: 'PT' },
        { role: 'Director People & Culture', range: '€80.000 — €110.000', market: 'PT' },
        { role: 'VP Human Resources', range: '€95.000 — €140.000', market: 'EU' },
        { role: 'CHRO', range: '€120.000 — €180.000', market: 'EU' }
      ],
      type: 'salary'
    },
    {
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
      title: 'Lacunas de competências',
      subtitle: 'Áreas a desenvolver para o próximo nível',
      dummyItems: [
        { skill: 'People Analytics & Data-Driven HR', level: 45 },
        { skill: 'Board-Level Stakeholder Management', level: 55 },
        { skill: 'M&A HR Integration', level: 35 },
        { skill: 'ESG & Sustainability in HR', level: 40 }
      ],
      type: 'skills-gap'
    },
    {
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
      title: 'Formação recomendada',
      subtitle: 'Cursos e certificações de alto impacto',
      dummyItems: [
        { name: 'People Analytics Certificate', provider: 'AIHR', duration: '32h' },
        { name: 'Strategic HR Leadership', provider: 'Cornell University', duration: '3 meses' },
        { name: 'Digital HR Transformation', provider: 'MIT Sloan', duration: '6 semanas' },
        { name: 'Executive Coaching Certification', provider: 'ICF', duration: '6 meses' }
      ],
      type: 'training'
    },
    {
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      title: 'Networking e visibilidade',
      subtitle: 'Acções estratégicas para expandir a tua rede',
      dummyItems: [
        'Participar em 2 eventos SHRM/CIPD por trimestre',
        'Publicar 1 artigo mensal sobre HR Transformation no LinkedIn',
        'Conectar com 5 CHROs de empresas-alvo por mês',
        'Integrar grupo de advisory board em startup HR Tech'
      ],
      type: 'networking'
    },
    {
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
      title: 'Plano 30-60-90 dias',
      subtitle: 'Roadmap de acção para os próximos 3 meses',
      dummyItems: [
        { phase: '30 dias', actions: ['Auditoria de competências', 'Definir 3 funções-alvo', 'Actualizar CV e LinkedIn'] },
        { phase: '60 dias', actions: ['Iniciar formação prioritária', 'Activar rede de contactos', '5 candidaturas estratégicas'] },
        { phase: '90 dias', actions: ['Avaliar progresso', 'Ajustar estratégia', 'Preparar entrevistas executivas'] }
      ],
      type: 'plan-90'
    }
  ];

  let currentSlide = 0;
  let autoplayInterval = null;

  function renderSlide(section) {
    let contentHTML = '';

    switch (section.type) {
      case 'list-match':
        contentHTML = section.dummyItems.map(item => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(201,169,97,0.06);border-radius:8px;margin-bottom:8px;border:1px solid rgba(201,169,97,0.12)">
            <span style="color:#e8e0d0;font-size:14px;font-family:'Cormorant Garamond',serif">${item.label}</span>
            <span style="color:#C9A961;font-weight:600;font-size:13px;font-family:system-ui">${item.match}</span>
          </div>
        `).join('');
        break;

      case 'career-moves':
        contentHTML = section.dummyItems.map(item => `
          <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(201,169,97,0.06);border-radius:8px;margin-bottom:8px;border:1px solid rgba(201,169,97,0.12)">
            <div style="flex:1">
              <div style="color:#999;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-family:system-ui">De</div>
              <div style="color:#ccc;font-size:13px;font-family:'Cormorant Garamond',serif">${item.from}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A961" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            <div style="flex:1">
              <div style="color:#999;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-family:system-ui">Para</div>
              <div style="color:#e8e0d0;font-size:13px;font-weight:500;font-family:'Cormorant Garamond',serif">${item.to}</div>
            </div>
            <span style="color:#C9A961;font-size:11px;white-space:nowrap;font-family:system-ui">${item.time}</span>
          </div>
        `).join('');
        break;

      case 'salary':
        contentHTML = section.dummyItems.map(item => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(201,169,97,0.06);border-radius:8px;margin-bottom:8px;border:1px solid rgba(201,169,97,0.12)">
            <div>
              <div style="color:#e8e0d0;font-size:13px;font-family:'Cormorant Garamond',serif">${item.role}</div>
              <span style="color:#888;font-size:11px;font-family:system-ui">${item.market}</span>
            </div>
            <span style="color:#C9A961;font-weight:600;font-size:14px;font-family:system-ui">${item.range}</span>
          </div>
        `).join('');
        break;

      case 'skills-gap':
        contentHTML = section.dummyItems.map(item => `
          <div style="padding:10px 14px;background:rgba(201,169,97,0.06);border-radius:8px;margin-bottom:8px;border:1px solid rgba(201,169,97,0.12)">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px">
              <span style="color:#e8e0d0;font-size:13px;font-family:'Cormorant Garamond',serif">${item.skill}</span>
              <span style="color:#C9A961;font-size:12px;font-family:system-ui">${item.level}%</span>
            </div>
            <div style="height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden">
              <div style="height:100%;width:${item.level}%;background:linear-gradient(90deg,#C9A961,#BF9A33);border-radius:3px;transition:width 1s ease"></div>
            </div>
          </div>
        `).join('');
        break;

      case 'training':
        contentHTML = section.dummyItems.map(item => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(201,169,97,0.06);border-radius:8px;margin-bottom:8px;border:1px solid rgba(201,169,97,0.12)">
            <div>
              <div style="color:#e8e0d0;font-size:13px;font-weight:500;font-family:'Cormorant Garamond',serif">${item.name}</div>
              <span style="color:#888;font-size:11px;font-family:system-ui">${item.provider} · ${item.duration}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A961" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </div>
        `).join('');
        break;

      case 'networking':
        contentHTML = section.dummyItems.map((item, i) => `
          <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 14px;background:rgba(201,169,97,0.06);border-radius:8px;margin-bottom:8px;border:1px solid rgba(201,169,97,0.12)">
            <span style="color:#C9A961;font-weight:600;font-size:14px;font-family:system-ui;min-width:20px">${i + 1}.</span>
            <span style="color:#e8e0d0;font-size:13px;font-family:'Cormorant Garamond',serif">${item}</span>
          </div>
        `).join('');
        break;

      case 'plan-90':
        contentHTML = section.dummyItems.map(item => `
          <div style="padding:12px 14px;background:rgba(201,169,97,0.06);border-radius:8px;margin-bottom:10px;border:1px solid rgba(201,169,97,0.12)">
            <div style="color:#C9A961;font-weight:600;font-size:13px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;font-family:system-ui">${item.phase}</div>
            ${item.actions.map(a => `
              <div style="display:flex;align-items:center;gap:8px;padding:4px 0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A961" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                <span style="color:#e8e0d0;font-size:13px;font-family:'Cormorant Garamond',serif">${a}</span>
              </div>
            `).join('')}
          </div>
        `).join('');
        break;
    }

    return contentHTML;
  }

  function createCarousel() {
    // Find the paywall button
    const allButtons = document.querySelectorAll('button, a');
    let paywallEl = null;

    for (const btn of allButtons) {
      const text = btn.textContent || '';
      if (text.includes('Desbloquear Career Path') || text.includes('Unlock Career Path') || text.includes('Desbloquear Career Path Completo') || text.includes('Unlock Full Career Path')) {
        paywallEl = btn.closest('div[class*="sticky"]') || btn.closest('div[class*="fixed"]') || btn.parentElement?.parentElement;
        break;
      }
    }

    // Also try to find the "Roadmap completo bloqueado" text
    if (!paywallEl) {
      const allText = document.querySelectorAll('p, span, div');
      for (const el of allText) {
        if (el.textContent?.trim() === 'Roadmap completo bloqueado' || el.textContent?.trim() === 'Full roadmap locked') {
          paywallEl = el.closest('div[class*="border"]') || el.closest('div[class*="rounded"]') || el.parentElement?.parentElement;
          break;
        }
      }
    }

    if (!paywallEl) return;

    // Create carousel container
    const carousel = document.createElement('div');
    carousel.id = 'cp-preview-carousel';
    carousel.style.cssText = 'max-width:640px;margin:24px auto;font-family:system-ui,-apple-system,sans-serif;';

    // Header
    carousel.innerHTML = `
      <div style="text-align:center;margin-bottom:20px">
        <p style="color:#C9A961;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 6px;font-family:system-ui">O que vais desbloquear</p>
        <h3 style="color:#fff;font-size:22px;font-weight:600;margin:0;font-family:'Cormorant Garamond',serif">O teu Roadmap personalizado inclui</h3>
      </div>

      <div id="cp-carousel-wrapper" style="position:relative;overflow:hidden;border-radius:12px;border:1px solid rgba(201,169,97,0.2);background:rgba(20,18,15,0.6);backdrop-filter:blur(8px)">
        <!-- Slide header -->
        <div id="cp-slide-header" style="display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid rgba(201,169,97,0.12)">
          <div id="cp-slide-icon" style="color:#C9A961;flex-shrink:0"></div>
          <div>
            <div id="cp-slide-title" style="color:#fff;font-size:16px;font-weight:600;font-family:'Cormorant Garamond',serif"></div>
            <div id="cp-slide-subtitle" style="color:#999;font-size:12px;margin-top:2px;font-family:system-ui"></div>
          </div>
        </div>

        <!-- Slide content with blur overlay -->
        <div style="position:relative">
          <div id="cp-slide-content" style="padding:16px 20px;min-height:200px;filter:blur(2.5px);user-select:none;pointer-events:none"></div>
          <div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 0%,rgba(20,18,15,0.7) 70%,rgba(20,18,15,0.95) 100%);display:flex;align-items:flex-end;justify-content:center;padding-bottom:24px">
            <div style="display:flex;align-items:center;gap:6px;color:#C9A961;font-size:13px;font-weight:500;font-family:system-ui">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Desbloqueia para ver os teus dados reais
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-top:1px solid rgba(201,169,97,0.12)">
          <button id="cp-prev" style="background:none;border:1px solid rgba(201,169,97,0.3);border-radius:6px;padding:6px 10px;color:#C9A961;cursor:pointer;font-size:12px;font-family:system-ui;transition:all 0.2s" onmouseover="this.style.background='rgba(201,169,97,0.1)'" onmouseout="this.style.background='none'">← Anterior</button>
          <div id="cp-dots" style="display:flex;gap:6px"></div>
          <button id="cp-next" style="background:none;border:1px solid rgba(201,169,97,0.3);border-radius:6px;padding:6px 10px;color:#C9A961;cursor:pointer;font-size:12px;font-family:system-ui;transition:all 0.2s" onmouseover="this.style.background='rgba(201,169,97,0.1)'" onmouseout="this.style.background='none'">Seguinte →</button>
        </div>
      </div>

      <!-- Dots indicator -->
      <div style="text-align:center;margin-top:12px">
        <span style="color:#666;font-size:11px;font-family:system-ui">${PREVIEW_SECTIONS.length} secções incluídas no roadmap completo</span>
      </div>
    `;

    // Insert before the paywall element
    paywallEl.parentNode.insertBefore(carousel, paywallEl);

    // Create dots
    const dotsContainer = document.getElementById('cp-dots');
    PREVIEW_SECTIONS.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.style.cssText = `width:8px;height:8px;border-radius:50%;background:${i === 0 ? '#C9A961' : 'rgba(201,169,97,0.25)'};cursor:pointer;transition:all 0.3s`;
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    });

    // Navigation handlers
    document.getElementById('cp-prev').addEventListener('click', () => {
      goToSlide((currentSlide - 1 + PREVIEW_SECTIONS.length) % PREVIEW_SECTIONS.length);
    });
    document.getElementById('cp-next').addEventListener('click', () => {
      goToSlide((currentSlide + 1) % PREVIEW_SECTIONS.length);
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
    const section = PREVIEW_SECTIONS[index];
    const iconEl = document.getElementById('cp-slide-icon');
    const titleEl = document.getElementById('cp-slide-title');
    const subtitleEl = document.getElementById('cp-slide-subtitle');
    const contentEl = document.getElementById('cp-slide-content');
    const dotsContainer = document.getElementById('cp-dots');

    if (!iconEl || !titleEl || !contentEl) return;

    // Fade out
    contentEl.style.opacity = '0';
    contentEl.style.transition = 'opacity 0.3s ease';

    setTimeout(() => {
      iconEl.innerHTML = section.icon;
      titleEl.textContent = section.title;
      subtitleEl.textContent = section.subtitle;
      contentEl.innerHTML = renderSlide(section);
      contentEl.style.opacity = '1';
    }, 150);

    // Update dots
    if (dotsContainer) {
      Array.from(dotsContainer.children).forEach((dot, i) => {
        dot.style.background = i === index ? '#C9A961' : 'rgba(201,169,97,0.25)';
        dot.style.transform = i === index ? 'scale(1.2)' : 'scale(1)';
      });
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
    autoplayInterval = setInterval(() => {
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
    const checkInterval = setInterval(() => {
      const allText = document.querySelectorAll('p, span, div');
      let found = false;
      for (const el of allText) {
        const t = (el.textContent || '').trim();
        if (t === 'Roadmap completo bloqueado' || t === 'Full roadmap locked' || t.includes('Desbloquear Career Path')) {
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
    setTimeout(() => clearInterval(checkInterval), 30000);
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitAndInject);
  } else {
    waitAndInject();
  }
})();
