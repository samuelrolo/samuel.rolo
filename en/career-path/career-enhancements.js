/**
 * Career Path Enhancements — Injection Script (EN)
 * Adds: LinkedIn job links + free course recommendations
 * Uses search-based URLs (never break)
 * Zero changes to existing React assets
 * v2.0 — 2026-03-04
 */
(function() {
  'use strict';

  // ============================================================
  // SEARCH-BASED COURSE LINKS (never 404)
  // Instead of linking to specific courses, we link to search pages
  // ============================================================
  const PLATFORMS = {
    coursera: { name: 'Coursera', icon: '🟢', base: 'https://www.coursera.org/search?query=' },
    edx: { name: 'edX', icon: '🟣', base: 'https://www.edx.org/search?q=' },
    microsoft: { name: 'Microsoft Learn', icon: '🔵', base: 'https://learn.microsoft.com/en-us/search/?terms=' },
    linkedin: { name: 'LinkedIn Learning', icon: '🔷', base: 'https://www.linkedin.com/learning/search?keywords=' },
    google: { name: 'Google Skillshop', icon: '🟡', base: 'https://skillshop.exceedlms.com/student/catalog/browse?search=' },
    udemy: { name: 'Udemy', icon: '🟠', base: 'https://www.udemy.com/courses/search/?q=' }
  };

  // Map skill keywords to 3 platform searches with specific subtopic queries
  function getCoursesForSkill(skillText) {
    const s = skillText.toLowerCase().trim();

    // Data & Analytics
    if (s.includes('power bi') || s.includes('powerbi')) return [
      { query: 'Power BI data analysis', platform: 'microsoft', subtopic: 'Análise de dados' },
      { query: 'Power BI visualization dashboard', platform: 'coursera', subtopic: 'Visualização' },
      { query: 'Power BI DAX formulas', platform: 'udemy', subtopic: 'Fórmulas DAX' }
    ];
    if (s.includes('sql') && !s.includes('nosql')) return [
      { query: 'SQL for data science', platform: 'coursera', subtopic: 'Data Science' },
      { query: 'SQL database queries', platform: 'edx', subtopic: 'Queries avançadas' },
      { query: 'SQL server fundamentals', platform: 'microsoft', subtopic: 'Fundamentos' }
    ];
    if (s.includes('python')) return [
      { query: 'Python for data analysis', platform: 'coursera', subtopic: 'Análise de dados' },
      { query: 'Python programming basics', platform: 'edx', subtopic: 'Fundamentos' },
      { query: 'Python automation', platform: 'udemy', subtopic: 'Automação' }
    ];
    if (s.includes('storytelling') || s.includes('narrativa')) return [
      { query: 'data storytelling visualization', platform: 'coursera', subtopic: 'Visualização' },
      { query: 'storytelling with data', platform: 'linkedin', subtopic: 'Apresentação' },
      { query: 'data storytelling business', platform: 'udemy', subtopic: 'Negócio' }
    ];
    if (s.includes('tableau')) return [
      { query: 'Tableau data visualization', platform: 'coursera', subtopic: 'Visualização' },
      { query: 'Tableau desktop fundamentals', platform: 'udemy', subtopic: 'Fundamentos' },
      { query: 'Tableau analytics', platform: 'linkedin', subtopic: 'Analytics' }
    ];
    if (s.includes('excel')) return [
      { query: 'Excel advanced formulas', platform: 'coursera', subtopic: 'Fórmulas avançadas' },
      { query: 'Excel data analysis', platform: 'microsoft', subtopic: 'Análise de dados' },
      { query: 'Excel business intelligence', platform: 'udemy', subtopic: 'Business Intelligence' }
    ];
    if (s.includes('data visualization') || s.includes('visualização')) return [
      { query: 'data visualization techniques', platform: 'coursera', subtopic: 'Técnicas' },
      { query: 'data visualization tools', platform: 'edx', subtopic: 'Ferramentas' },
      { query: 'data visualization dashboard', platform: 'linkedin', subtopic: 'Dashboards' }
    ];

    // Engineering & Cloud
    if (s.includes('spark') || s.includes('big data')) return [
      { query: 'Apache Spark big data', platform: 'coursera', subtopic: 'Big Data' },
      { query: 'Spark data engineering', platform: 'edx', subtopic: 'Engenharia' },
      { query: 'PySpark tutorial', platform: 'udemy', subtopic: 'PySpark' }
    ];
    if (s.includes('aws') || s.includes('amazon web')) return [
      { query: 'AWS cloud practitioner', platform: 'coursera', subtopic: 'Fundamentos' },
      { query: 'AWS solutions architect', platform: 'udemy', subtopic: 'Arquitetura' },
      { query: 'AWS data analytics', platform: 'linkedin', subtopic: 'Analytics' }
    ];
    if (s.includes('azure') || s.includes('microsoft cloud')) return [
      { query: 'Azure fundamentals AZ-900', platform: 'microsoft', subtopic: 'Fundamentos' },
      { query: 'Azure data engineer', platform: 'coursera', subtopic: 'Engenharia de dados' },
      { query: 'Azure cloud solutions', platform: 'udemy', subtopic: 'Soluções cloud' }
    ];
    if (s.includes('etl') || s.includes('pipeline')) return [
      { query: 'ETL data pipelines', platform: 'coursera', subtopic: 'Pipelines' },
      { query: 'data engineering ETL', platform: 'edx', subtopic: 'Engenharia' },
      { query: 'Apache Airflow ETL', platform: 'udemy', subtopic: 'Airflow' }
    ];

    // Leadership & Management
    if (s.includes('liderança') || s.includes('leadership') || s.includes('líder')) return [
      { query: 'leadership management skills', platform: 'coursera', subtopic: 'Competências' },
      { query: 'leadership development program', platform: 'edx', subtopic: 'Desenvolvimento' },
      { query: 'executive leadership', platform: 'linkedin', subtopic: 'Liderança executiva' }
    ];
    if (s.includes('gestão de projeto') || s.includes('project management') || s.includes('projetos')) return [
      { query: 'project management professional', platform: 'coursera', subtopic: 'Profissional' },
      { query: 'agile project management', platform: 'edx', subtopic: 'Agile' },
      { query: 'project management fundamentals', platform: 'linkedin', subtopic: 'Fundamentos' }
    ];
    if (s.includes('stakeholder') || s.includes('partes interessadas')) return [
      { query: 'stakeholder management communication', platform: 'coursera', subtopic: 'Comunicação' },
      { query: 'stakeholder engagement strategy', platform: 'linkedin', subtopic: 'Estratégia' },
      { query: 'influence without authority', platform: 'udemy', subtopic: 'Influência' }
    ];
    if (s.includes('comunicação') || s.includes('communication') || s.includes('apresentação')) return [
      { query: 'business communication skills', platform: 'coursera', subtopic: 'Negócio' },
      { query: 'effective communication workplace', platform: 'edx', subtopic: 'Workplace' },
      { query: 'public speaking presentation', platform: 'linkedin', subtopic: 'Apresentação' }
    ];
    if (s.includes('estratégia') || s.includes('strategy') || s.includes('estratégic')) return [
      { query: 'business strategy management', platform: 'coursera', subtopic: 'Gestão' },
      { query: 'strategic thinking leadership', platform: 'edx', subtopic: 'Pensamento estratégico' },
      { query: 'digital strategy transformation', platform: 'linkedin', subtopic: 'Transformação digital' }
    ];
    if (s.includes('negociação') || s.includes('negotiation')) return [
      { query: 'negotiation skills strategy', platform: 'coursera', subtopic: 'Estratégia' },
      { query: 'negotiation fundamentals', platform: 'edx', subtopic: 'Fundamentos' },
      { query: 'negotiation business deals', platform: 'linkedin', subtopic: 'Negócio' }
    ];

    // Transformation & Innovation
    if (s.includes('transformação digital') || s.includes('digital transformation')) return [
      { query: 'digital transformation strategy', platform: 'coursera', subtopic: 'Estratégia' },
      { query: 'digital transformation leadership', platform: 'edx', subtopic: 'Liderança' },
      { query: 'digital transformation business', platform: 'linkedin', subtopic: 'Negócio' }
    ];
    if (s.includes('change management') || s.includes('gestão da mudança') || s.includes('mudança')) return [
      { query: 'change management organizational', platform: 'coursera', subtopic: 'Organizacional' },
      { query: 'leading change management', platform: 'edx', subtopic: 'Liderança da mudança' },
      { query: 'change management practitioner', platform: 'linkedin', subtopic: 'Prática' }
    ];
    if (s.includes('lean') || s.includes('six sigma')) return [
      { query: 'lean six sigma green belt', platform: 'coursera', subtopic: 'Green Belt' },
      { query: 'lean management principles', platform: 'edx', subtopic: 'Princípios' },
      { query: 'six sigma process improvement', platform: 'udemy', subtopic: 'Melhoria de processos' }
    ];
    if (s.includes('agile') || s.includes('ágil') || s.includes('scrum')) return [
      { query: 'agile scrum methodology', platform: 'coursera', subtopic: 'Metodologia' },
      { query: 'agile project management', platform: 'edx', subtopic: 'Gestão de projetos' },
      { query: 'scrum master certification', platform: 'udemy', subtopic: 'Certificação' }
    ];
    if (s.includes('design thinking')) return [
      { query: 'design thinking innovation', platform: 'coursera', subtopic: 'Inovação' },
      { query: 'design thinking fundamentals', platform: 'edx', subtopic: 'Fundamentos' },
      { query: 'design thinking process', platform: 'linkedin', subtopic: 'Processo' }
    ];

    // HR & People
    if (s.includes('people analytics') || s.includes('hr analytics') || s.includes('análise de pessoas')) return [
      { query: 'people analytics HR', platform: 'coursera', subtopic: 'HR Analytics' },
      { query: 'people analytics data', platform: 'edx', subtopic: 'Dados' },
      { query: 'HR analytics fundamentals', platform: 'linkedin', subtopic: 'Fundamentos' }
    ];
    if (s.includes('talent') || s.includes('talento')) return [
      { query: 'talent management strategy', platform: 'coursera', subtopic: 'Estratégia' },
      { query: 'talent acquisition HR', platform: 'edx', subtopic: 'Aquisição' },
      { query: 'talent development program', platform: 'linkedin', subtopic: 'Desenvolvimento' }
    ];
    if (s.includes('coaching') || s.includes('mentoring') || s.includes('mentoria')) return [
      { query: 'executive coaching skills', platform: 'coursera', subtopic: 'Competências' },
      { query: 'coaching mentoring leadership', platform: 'edx', subtopic: 'Liderança' },
      { query: 'coaching techniques business', platform: 'linkedin', subtopic: 'Técnicas' }
    ];

    // AI & Tech
    if (s.includes('inteligência artificial') || s.includes('artificial intelligence') || (s.includes('ia') && s.length < 10) || s.includes(' ai')) return [
      { query: 'artificial intelligence business', platform: 'coursera', subtopic: 'Negócio' },
      { query: 'AI fundamentals beginners', platform: 'edx', subtopic: 'Fundamentos' },
      { query: 'AI for business leaders', platform: 'linkedin', subtopic: 'Líderes' }
    ];
    if (s.includes('machine learning') || s.includes('aprendizagem automática')) return [
      { query: 'machine learning fundamentals', platform: 'coursera', subtopic: 'Fundamentos' },
      { query: 'machine learning python', platform: 'edx', subtopic: 'Python' },
      { query: 'machine learning business', platform: 'linkedin', subtopic: 'Negócio' }
    ];
    if (s.includes('rpa') || s.includes('automação') || s.includes('automation')) return [
      { query: 'robotic process automation RPA', platform: 'coursera', subtopic: 'RPA' },
      { query: 'business process automation', platform: 'udemy', subtopic: 'Processos' },
      { query: 'automation tools business', platform: 'linkedin', subtopic: 'Ferramentas' }
    ];

    // Finance & Business
    if (s.includes('finanç') || s.includes('financ') || s.includes('p&l') || s.includes('valuation')) return [
      { query: 'finance for non-financial managers', platform: 'coursera', subtopic: 'Gestores' },
      { query: 'financial analysis business', platform: 'edx', subtopic: 'Análise' },
      { query: 'corporate finance fundamentals', platform: 'linkedin', subtopic: 'Fundamentos' }
    ];
    if (s.includes('cliente') || s.includes('client') || s.includes('comercial') || s.includes('vendas') || s.includes('sales')) return [
      { query: 'client relationship management', platform: 'coursera', subtopic: 'Gestão de clientes' },
      { query: 'business development sales', platform: 'linkedin', subtopic: 'Desenvolvimento' },
      { query: 'sales strategy management', platform: 'udemy', subtopic: 'Estratégia' }
    ];

    // Generic fallback — search the skill directly
    const query = encodeURIComponent(skillText);
    return [
      { query: skillText, platform: 'coursera', subtopic: 'Geral' },
      { query: skillText, platform: 'edx', subtopic: 'Geral' },
      { query: skillText, platform: 'linkedin', subtopic: 'Geral' }
    ];
  }

  // ============================================================
  // STYLES
  // ============================================================
  const STYLES = `
    .s2i-enhancement { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .s2i-linkedin-btn { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; background:#0A66C2; color:#fff !important; border-radius:6px; font-size:11px; font-weight:600; text-decoration:none !important; transition:all .2s; }
    .s2i-linkedin-btn:hover { background:#004182; transform:translateY(-1px); }
    .s2i-linkedin-btn svg { width:14px; height:14px; fill:#fff; flex-shrink:0; }
    .s2i-linkedin-wrap { display:flex; align-items:center; gap:8px; margin:8px 0 4px 0; flex-wrap:wrap; }
    .s2i-linkedin-note { font-size:9px; color:#94a3b8; font-style:italic; }
    .s2i-free-courses { margin:12px 0 8px 0; padding:12px 16px; background:linear-gradient(135deg,#f0fdf4,#ecfdf5); border:1px solid #bbf7d0; border-radius:10px; }
    .s2i-free-courses-title { font-size:12px; font-weight:700; color:#166534; margin-bottom:10px; display:flex; align-items:center; gap:6px; }
    .s2i-skill-group { margin-bottom:8px; }
    .s2i-skill-group:last-child { margin-bottom:0; }
    .s2i-skill-label { font-size:10px; font-weight:600; color:#374151; margin-bottom:4px; padding-left:2px; }
    .s2i-courses-row { display:flex; flex-wrap:wrap; gap:6px; }
    .s2i-course-chip { display:inline-flex; align-items:center; gap:5px; padding:5px 10px; background:#fff; border:1px solid #d1fae5; border-radius:8px; text-decoration:none !important; transition:all .2s; color:#1e293b !important; }
    .s2i-course-chip:hover { border-color:#059669; box-shadow:0 2px 8px rgba(5,150,105,.15); transform:translateY(-1px); }
    .s2i-chip-icon { font-size:12px; flex-shrink:0; }
    .s2i-chip-name { font-size:10px; font-weight:600; color:#1e293b; }
    .s2i-chip-sub { font-size:9px; color:#64748b; }
    .s2i-chip-free { font-size:8px; color:#059669; font-weight:700; margin-left:2px; }
  `;

  const LINKEDIN_SVG = '<svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>';

  // ============================================================
  // DOM DETECTION — matches real Career Path results structure
  // ============================================================

  function injectStyles() {
    if (document.getElementById('s2i-enhancement-styles')) return;
    const style = document.createElement('style');
    style.id = 's2i-enhancement-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  function buildLinkedInURL(roleTitle) {
    return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(roleTitle)}&location=Portugal&sortBy=DD`;
  }

  function createLinkedInHTML(roleTitle) {
    const url = buildLinkedInURL(roleTitle);
    return `<div class="s2i-linkedin-wrap s2i-enhancement">
      <a href="${url}" target="_blank" rel="noopener" class="s2i-linkedin-btn">
        ${LINKEDIN_SVG} Jobs on LinkedIn
      </a>
      <span class="s2i-linkedin-note">Limited to currently published listings</span>
    </div>`;
  }

  function createFreeCourseHTML(skills) {
    if (!skills || skills.length === 0) return '';
    let groupsHTML = '';
    for (const skill of skills) {
      const courses = getCoursesForSkill(skill);
      if (!courses) continue;
      let chipsHTML = '';
      for (const c of courses) {
        const p = PLATFORMS[c.platform];
        const url = p.base + encodeURIComponent(c.query);
        chipsHTML += `<a href="${url}" target="_blank" rel="noopener" class="s2i-course-chip" title="Search ${c.subtopic} on ${p.name}">
          <span class="s2i-chip-icon">${p.icon}</span>
          <span>
            <span class="s2i-chip-name">${p.name}</span>
            <span class="s2i-chip-sub"> · ${c.subtopic}</span>
            <span class="s2i-chip-free">Free</span>
          </span>
        </a>`;
      }
      groupsHTML += `<div class="s2i-skill-group">
        <div class="s2i-skill-label">↳ ${skill}</div>
        <div class="s2i-courses-row">${chipsHTML}</div>
      </div>`;
    }
    if (!groupsHTML) return '';
    return `<div class="s2i-free-courses s2i-enhancement">
      <div class="s2i-free-courses-title">🎓 Recommended free courses</div>
      ${groupsHTML}
    </div>`;
  }

  // ============================================================
  // MAIN INJECTION LOGIC
  // Uses text content scanning to find role cards and skill gaps
  // ============================================================

  function findAllTextNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    let node;
    while (node = walker.nextNode()) nodes.push(node);
    return nodes;
  }

  function findElementByText(root, texts, tagFilter) {
    // Find an element whose text content matches one of the given texts
    const allEls = root.querySelectorAll('*');
    for (const el of allEls) {
      if (tagFilter && !tagFilter.includes(el.tagName.toLowerCase())) continue;
      const t = el.textContent.trim().toUpperCase();
      for (const text of texts) {
        if (t === text.toUpperCase() || t.startsWith(text.toUpperCase())) return el;
      }
    }
    return null;
  }

  function findElementsContainingText(root, text) {
    const results = [];
    const allEls = root.querySelectorAll('*');
    for (const el of allEls) {
      const t = el.textContent.trim();
      if (t.toUpperCase().includes(text.toUpperCase()) && el.children.length < 3) {
        results.push(el);
      }
    }
    return results;
  }

  function processResults() {
    // Don't re-process
    if (document.querySelector('.s2i-enhancement')) return;

    const root = document.getElementById('root');
    if (!root) return;
    
    // Check if results are rendered — look for the role section header
    const pageText = root.textContent || '';
    const hasResults = pageText.includes('RECOMMENDED NEXT ROLES') || 
                       pageText.includes('NEXT ROLES') ||
                       pageText.includes('% fit');
    if (!hasResults) return;

    injectStyles();

    // Strategy: Find role cards by looking for "#1", "#2", "#3" markers
    // Then find "PRECISAS" sections within each card to get skill gaps
    // Also find role titles near the markers

    const allElements = Array.from(root.querySelectorAll('*'));
    
    // Find role title elements — they're near the "#1", "#2", "#3" markers
    // and contain the fit percentage
    const roleCards = [];
    
    for (const el of allElements) {
      const text = el.textContent.trim();
      // Look for elements that contain "% fit" — these are the fit badges
      if (text.match(/^\d+%\s*fit$/i)) {
        // Walk up to find the role card container
        let container = el.parentElement;
        for (let i = 0; i < 10 && container; i++) {
          const containerText = container.textContent || '';
          // A role card container has: fit%, JÁ TENS, PRECISAS
          if (containerText.includes('YOU HAVE') && containerText.includes('YOU NEED')) {
            // Check we haven't already found this container
            if (!roleCards.some(rc => rc.container === container)) {
              roleCards.push({ container, fitEl: el });
            }
            break;
          }
          container = container.parentElement;
        }
      }
    }

    console.log('[S2I Enhancements] Found', roleCards.length, 'role cards');

    for (const { container } of roleCards) {
      // 1. Extract role title — it's typically a heading or bold text near the top
      let roleTitle = '';
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6, strong, b');
      for (const h of headings) {
        const t = h.textContent.trim();
        // Role title is usually the longest heading that's not a section label
        if (t.length > 10 && !t.includes('YOU HAVE') && !t.includes('YOU NEED') && 
            !t.includes('TRAINING') && !t.includes('CERTIFICATIONS') &&
            !t.includes('%') && t.length > roleTitle.length) {
          roleTitle = t;
        }
      }
      // Fallback: look for text after #1/#2/#3
      if (!roleTitle) {
        const containerText = container.textContent;
        const match = containerText.match(/#\d\s+(.{10,80}?)(?:\s+Curto|\s+Médio|\s+Longo|\d+%)/);
        if (match) roleTitle = match[1].trim();
      }

      if (!roleTitle) continue;

      // 2. Inject LinkedIn button at the top of the card
      // Find the first child that contains the role title
      const titleEl = Array.from(container.querySelectorAll('*')).find(el => {
        const t = el.textContent.trim();
        return t === roleTitle && el.children.length === 0;
      }) || container.firstElementChild;

      if (titleEl && !titleEl.parentElement.querySelector('.s2i-linkedin-wrap')) {
        const linkedinDiv = document.createElement('div');
        linkedinDiv.innerHTML = createLinkedInHTML(roleTitle);
        // Insert after the title element's parent row
        let insertAfter = titleEl;
        // Go up a couple levels to find a good insertion point
        for (let i = 0; i < 3; i++) {
          if (insertAfter.parentElement && insertAfter.parentElement !== container) {
            insertAfter = insertAfter.parentElement;
          } else break;
        }
        insertAfter.parentElement.insertBefore(linkedinDiv.firstElementChild, insertAfter.nextSibling);
      }

      // 3. Extract "PRECISAS" skills
      const precisasSkills = [];
      const precisasEl = findElementByText(container, ['YOU NEED'], null);
      if (precisasEl) {
        // Skills are in list items or paragraphs after PRECISAS
        let skillContainer = precisasEl.parentElement;
        // Look for bullet points (○) or list items after PRECISAS
        const allText = skillContainer.textContent;
        const afterPrecisas = allText.split(/PRECISAS/i)[1] || '';
        // Split by common separators
        const lines = afterPrecisas.split(/[○●•\n]/).map(l => l.replace(/^[\s○●•]+/, '').trim()).filter(l => l.length > 5 && l.length < 200);
        for (const line of lines) {
          // Clean up the skill text
          const clean = line.replace(/^[○●•\-\s]+/, '').trim();
          if (clean && clean.length > 5 && !clean.includes('YOU HAVE') && !clean.includes('TRAINING')) {
            precisasSkills.push(clean);
          }
        }
      }

      // 4. Inject free courses after PRECISAS section
      if (precisasSkills.length > 0) {
        // Find the PRECISAS section end — look for the next major section or the company tags
        let insertPoint = null;
        
        // Try to find FORMAÇÕES RECOMENDADAS section and insert before it
        const formacoesEl = findElementByText(container, ['RECOMMENDED TRAINING', 'TRAINING'], null);
        if (formacoesEl) {
          // Insert before formações
          let formacoesContainer = formacoesEl;
          while (formacoesContainer.parentElement && formacoesContainer.parentElement !== container) {
            formacoesContainer = formacoesContainer.parentElement;
          }
          insertPoint = { parent: formacoesContainer.parentElement, before: formacoesContainer };
        }
        
        // If no formações section, insert at the end of the card
        if (!insertPoint) {
          insertPoint = { parent: container, before: null };
        }

        const coursesHTML = createFreeCourseHTML(precisasSkills.slice(0, 5)); // Max 5 skills
        if (coursesHTML) {
          const coursesDiv = document.createElement('div');
          coursesDiv.innerHTML = coursesHTML;
          if (insertPoint.before) {
            insertPoint.parent.insertBefore(coursesDiv.firstElementChild, insertPoint.before);
          } else {
            insertPoint.parent.appendChild(coursesDiv.firstElementChild);
          }
        }
      }
    }

    if (roleCards.length > 0) {
      console.log('[S2I Enhancements] Successfully injected LinkedIn + courses for', roleCards.length, 'roles');
    }
  }

  // ============================================================
  // OBSERVER — watches for React to render results
  // ============================================================
  
  let processTimeout = null;
  const observer = new MutationObserver(function() {
    // Debounce — wait for React to finish rendering
    clearTimeout(processTimeout);
    processTimeout = setTimeout(processResults, 1000);
  });

  function init() {
    const root = document.getElementById('root');
    if (root) {
      observer.observe(root, { childList: true, subtree: true });
      // Also try immediately in case results are already rendered
      setTimeout(processResults, 2000);
    } else {
      // Root not ready yet, wait
      setTimeout(init, 500);
    }
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
