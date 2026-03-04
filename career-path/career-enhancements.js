/**
 * Career Path Enhancements — Injection Script (PT)
 * Adds: LinkedIn job links + free course recommendations
 * Zero changes to existing React assets
 * v1.0 — 2026-03-04
 */
(function() {
  'use strict';

  // Course database: 3 courses per common skill, from different providers, covering different subtopics
  const COURSE_DB = {
    // --- Data & Analytics ---
    'power bi': [
      { title: 'Power BI Data Analyst', provider: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/training/paths/data-analyst-power-bi/', icon: '🟦', duration: '16h' },
      { title: 'Data Visualization with Power BI', provider: 'Coursera (Google)', url: 'https://www.coursera.org/learn/data-visualization-with-power-bi', icon: '🟩', duration: '20h' },
      { title: 'DAX Patterns', provider: 'SQLBI (free)', url: 'https://www.daxpatterns.com/', icon: '📊', duration: 'Ref.' }
    ],
    'sql': [
      { title: 'SQL for Data Science', provider: 'Coursera (UC Davis)', url: 'https://www.coursera.org/learn/sql-for-data-science', icon: '🟩', duration: '15h' },
      { title: 'Introduction to SQL', provider: 'Khan Academy', url: 'https://www.khanacademy.org/computing/computer-programming/sql', icon: '🟧', duration: '10h' },
      { title: 'SQL Tutorial', provider: 'W3Schools', url: 'https://www.w3schools.com/sql/', icon: '🌐', duration: 'Ref.' }
    ],
    'python': [
      { title: 'Python for Everybody', provider: 'Coursera (UMich)', url: 'https://www.coursera.org/specializations/python', icon: '🟩', duration: '60h' },
      { title: 'Python Data Science', provider: 'IBM (edX)', url: 'https://www.edx.org/learn/python/ibm-python-basics-for-data-science', icon: '🟪', duration: '20h' },
      { title: 'Automate with Python', provider: 'Google (Coursera)', url: 'https://www.coursera.org/learn/python-crash-course', icon: '🟩', duration: '30h' }
    ],
    'storytelling': [
      { title: 'Storytelling with Data', provider: 'Coursera (Google)', url: 'https://www.coursera.org/learn/storytelling-data', icon: '🟩', duration: '12h' },
      { title: 'Data Visualization', provider: 'Tableau (free)', url: 'https://www.tableau.com/learn/training/20201', icon: '📊', duration: '15h' },
      { title: 'Presenting Data', provider: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/data-visualization-storytelling', icon: '🔵', duration: '4h' }
    ],
    'data visualization': [
      { title: 'Data Visualization with Python', provider: 'Coursera (IBM)', url: 'https://www.coursera.org/learn/python-for-data-visualization', icon: '🟩', duration: '18h' },
      { title: 'Tableau Desktop', provider: 'Tableau (free)', url: 'https://www.tableau.com/learn/training/20201', icon: '📊', duration: '15h' },
      { title: 'Information Visualization', provider: 'Coursera (NYU)', url: 'https://www.coursera.org/learn/information-visualization-fundamentals', icon: '🟩', duration: '20h' }
    ],
    'excel': [
      { title: 'Excel Skills for Business', provider: 'Coursera (Macquarie)', url: 'https://www.coursera.org/specializations/excel', icon: '🟩', duration: '24h' },
      { title: 'Excel Fundamentals', provider: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/training/paths/excel-fundamentals/', icon: '🟦', duration: '10h' },
      { title: 'Advanced Excel', provider: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/excel-advanced-formulas-and-functions', icon: '🔵', duration: '6h' }
    ],
    // --- Engineering & Cloud ---
    'spark': [
      { title: 'Big Data with Apache Spark', provider: 'edX (UC Berkeley)', url: 'https://www.edx.org/learn/big-data/university-of-california-berkeley-big-data-analysis-with-apache-spark', icon: '🟪', duration: '25h' },
      { title: 'Spark Fundamentals', provider: 'Databricks (free)', url: 'https://www.databricks.com/learn/training/apache-spark-programming', icon: '🔴', duration: '12h' },
      { title: 'PySpark Tutorial', provider: 'Coursera (IBM)', url: 'https://www.coursera.org/learn/introduction-to-big-data-with-spark-hadoop', icon: '🟩', duration: '15h' }
    ],
    'aws': [
      { title: 'AWS Cloud Practitioner', provider: 'AWS (free)', url: 'https://aws.amazon.com/training/learn-about/cloud-practitioner/', icon: '🟧', duration: '20h' },
      { title: 'AWS Solutions Architect', provider: 'Coursera (AWS)', url: 'https://www.coursera.org/learn/aws-cloud-solutions-architect', icon: '🟩', duration: '30h' },
      { title: 'AWS Fundamentals', provider: 'AWS Skill Builder', url: 'https://explore.skillbuilder.aws/learn/course/134/aws-cloud-practitioner-essentials', icon: '🟧', duration: '6h' }
    ],
    'azure': [
      { title: 'Azure Fundamentals (AZ-900)', provider: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/training/paths/az-900-describe-cloud-concepts/', icon: '🟦', duration: '10h' },
      { title: 'Azure Data Fundamentals', provider: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/training/paths/azure-data-fundamentals-explore-core-data-concepts/', icon: '🟦', duration: '12h' },
      { title: 'Azure for Data Engineers', provider: 'Coursera (Microsoft)', url: 'https://www.coursera.org/learn/microsoft-azure-dp-203-data-engineering', icon: '🟩', duration: '25h' }
    ],
    'etl': [
      { title: 'ETL & Data Pipelines', provider: 'Coursera (IBM)', url: 'https://www.coursera.org/learn/etl-and-data-pipelines-shell-airflow-kafka', icon: '🟩', duration: '15h' },
      { title: 'Data Engineering', provider: 'DataCamp (free intro)', url: 'https://www.datacamp.com/courses/introduction-to-data-engineering', icon: '🟢', duration: '4h' },
      { title: 'Apache Airflow', provider: 'Astronomer (free)', url: 'https://www.astronomer.io/docs/learn/', icon: '🔵', duration: 'Ref.' }
    ],
    'data modeling': [
      { title: 'Data Modeling Essentials', provider: 'Coursera (IBM)', url: 'https://www.coursera.org/learn/data-modeling', icon: '🟩', duration: '12h' },
      { title: 'Database Design', provider: 'Coursera (University of Michigan)', url: 'https://www.coursera.org/learn/database-design-postgresql', icon: '🟩', duration: '15h' },
      { title: 'Dimensional Modeling', provider: 'Kimball Group', url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/', icon: '📊', duration: 'Ref.' }
    ],
    // --- Leadership & Management ---
    'liderança': [
      { title: 'Foundations of Leadership', provider: 'Coursera (IESE)', url: 'https://www.coursera.org/learn/foundations-of-everyday-leadership', icon: '🟩', duration: '12h' },
      { title: 'Leading People and Teams', provider: 'Coursera (UMich)', url: 'https://www.coursera.org/specializations/leading-teams', icon: '🟩', duration: '20h' },
      { title: 'Leadership Principles', provider: 'Harvard (edX)', url: 'https://www.edx.org/learn/leadership/harvard-university-exercising-leadership-foundational-principles', icon: '🟪', duration: '15h' }
    ],
    'leadership': [
      { title: 'Foundations of Leadership', provider: 'Coursera (IESE)', url: 'https://www.coursera.org/learn/foundations-of-everyday-leadership', icon: '🟩', duration: '12h' },
      { title: 'Leading People and Teams', provider: 'Coursera (UMich)', url: 'https://www.coursera.org/specializations/leading-teams', icon: '🟩', duration: '20h' },
      { title: 'Leadership Principles', provider: 'Harvard (edX)', url: 'https://www.edx.org/learn/leadership/harvard-university-exercising-leadership-foundational-principles', icon: '🟪', duration: '15h' }
    ],
    'gestão de projetos': [
      { title: 'Google Project Management', provider: 'Coursera (Google)', url: 'https://www.coursera.org/professional-certificates/google-project-management', icon: '🟩', duration: '24h' },
      { title: 'Project Management Principles', provider: 'edX (RIT)', url: 'https://www.edx.org/learn/project-management/rochester-institute-of-technology-project-management-life-cycle', icon: '🟪', duration: '15h' },
      { title: 'Agile Project Management', provider: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/agile-project-management-foundations', icon: '🔵', duration: '3h' }
    ],
    'project management': [
      { title: 'Google Project Management', provider: 'Coursera (Google)', url: 'https://www.coursera.org/professional-certificates/google-project-management', icon: '🟩', duration: '24h' },
      { title: 'Project Management Principles', provider: 'edX (RIT)', url: 'https://www.edx.org/learn/project-management/rochester-institute-of-technology-project-management-life-cycle', icon: '🟪', duration: '15h' },
      { title: 'Agile with Scrum', provider: 'Coursera (UVA)', url: 'https://www.coursera.org/learn/uva-darden-getting-started-agile', icon: '🟩', duration: '10h' }
    ],
    'stakeholder': [
      { title: 'Stakeholder Management', provider: 'Coursera (Google)', url: 'https://www.coursera.org/learn/foundations-of-project-management', icon: '🟩', duration: '10h' },
      { title: 'Business Communication', provider: 'Coursera (UColorado)', url: 'https://www.coursera.org/learn/business-english-communication-skills', icon: '🟩', duration: '12h' },
      { title: 'Influence Without Authority', provider: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/influencing-others', icon: '🔵', duration: '3h' }
    ],
    'comunicação': [
      { title: 'Business Communication', provider: 'Coursera (UColorado)', url: 'https://www.coursera.org/learn/business-english-communication-skills', icon: '🟩', duration: '12h' },
      { title: 'Effective Communication', provider: 'edX (Rochester)', url: 'https://www.edx.org/learn/communication/rochester-institute-of-technology-effective-communication-in-the-globalised-workplace', icon: '🟪', duration: '10h' },
      { title: 'Public Speaking', provider: 'Coursera (UWashington)', url: 'https://www.coursera.org/learn/public-speaking', icon: '🟩', duration: '15h' }
    ],
    'estratégia': [
      { title: 'Business Strategy', provider: 'Coursera (UVA)', url: 'https://www.coursera.org/specializations/business-strategy', icon: '🟩', duration: '20h' },
      { title: 'Strategic Management', provider: 'edX (Wharton)', url: 'https://www.edx.org/learn/strategic-management', icon: '🟪', duration: '15h' },
      { title: 'Digital Strategy', provider: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/digital-strategy', icon: '🔵', duration: '4h' }
    ],
    // --- Transformation & Innovation ---
    'lean six sigma': [
      { title: 'Lean Six Sigma Yellow Belt', provider: 'Coursera (USG)', url: 'https://www.coursera.org/learn/six-sigma-principles', icon: '🟩', duration: '15h' },
      { title: 'Six Sigma Green Belt', provider: 'edX (TUM)', url: 'https://www.edx.org/learn/six-sigma/technische-universitat-munchen-six-sigma-define-and-measure', icon: '🟪', duration: '20h' },
      { title: 'Lean Management', provider: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/lean-foundations', icon: '🔵', duration: '3h' }
    ],
    'transformação digital': [
      { title: 'Digital Transformation', provider: 'Coursera (BCG)', url: 'https://www.coursera.org/learn/bcg-digital-transformation', icon: '🟩', duration: '12h' },
      { title: 'Leading Digital Transformation', provider: 'edX (BU)', url: 'https://www.edx.org/learn/digital-transformation/boston-university-digital-transformation-strategy', icon: '🟪', duration: '15h' },
      { title: 'Digital Business Strategy', provider: 'MIT (edX)', url: 'https://www.edx.org/learn/digital-transformation/massachusetts-institute-of-technology-digital-transformation-strategy', icon: '🟪', duration: '10h' }
    ],
    'digital transformation': [
      { title: 'Digital Transformation', provider: 'Coursera (BCG)', url: 'https://www.coursera.org/learn/bcg-digital-transformation', icon: '🟩', duration: '12h' },
      { title: 'Leading Digital Transformation', provider: 'edX (BU)', url: 'https://www.edx.org/learn/digital-transformation/boston-university-digital-transformation-strategy', icon: '🟪', duration: '15h' },
      { title: 'Digital Business Strategy', provider: 'MIT (edX)', url: 'https://www.edx.org/learn/digital-transformation/massachusetts-institute-of-technology-digital-transformation-strategy', icon: '🟪', duration: '10h' }
    ],
    'change management': [
      { title: 'Change Management', provider: 'Coursera (Macquarie)', url: 'https://www.coursera.org/learn/change-management', icon: '🟩', duration: '12h' },
      { title: 'Leading Change', provider: 'edX (IIMB)', url: 'https://www.edx.org/learn/change-management', icon: '🟪', duration: '10h' },
      { title: 'Organizational Change', provider: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/organizational-change-management', icon: '🔵', duration: '3h' }
    ],
    'gestão da mudança': [
      { title: 'Change Management', provider: 'Coursera (Macquarie)', url: 'https://www.coursera.org/learn/change-management', icon: '🟩', duration: '12h' },
      { title: 'Leading Change', provider: 'edX (IIMB)', url: 'https://www.edx.org/learn/change-management', icon: '🟪', duration: '10h' },
      { title: 'Organizational Change', provider: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/organizational-change-management', icon: '🔵', duration: '3h' }
    ],
    'rpa': [
      { title: 'RPA with UiPath', provider: 'UiPath Academy (free)', url: 'https://academy.uipath.com/', icon: '🟧', duration: '20h' },
      { title: 'Robotic Process Automation', provider: 'Coursera (UiPath)', url: 'https://www.coursera.org/learn/rpa-basics', icon: '🟩', duration: '12h' },
      { title: 'Automation Anywhere', provider: 'Automation Anywhere U', url: 'https://university.automationanywhere.com/', icon: '🔴', duration: '15h' }
    ],
    'ai': [
      { title: 'AI For Everyone', provider: 'Coursera (DeepLearning.AI)', url: 'https://www.coursera.org/learn/ai-for-everyone', icon: '🟩', duration: '8h' },
      { title: 'Introduction to AI', provider: 'edX (IBM)', url: 'https://www.edx.org/learn/artificial-intelligence/ibm-introduction-to-artificial-intelligence-ai', icon: '🟪', duration: '10h' },
      { title: 'Google AI Essentials', provider: 'Google (Coursera)', url: 'https://www.coursera.org/learn/google-ai-essentials', icon: '🟩', duration: '12h' }
    ],
    'machine learning': [
      { title: 'Machine Learning', provider: 'Coursera (Stanford)', url: 'https://www.coursera.org/learn/machine-learning', icon: '🟩', duration: '60h' },
      { title: 'ML Foundations', provider: 'Google (free)', url: 'https://developers.google.com/machine-learning/crash-course', icon: '🟧', duration: '15h' },
      { title: 'Intro to ML with Python', provider: 'edX (MIT)', url: 'https://www.edx.org/learn/machine-learning/massachusetts-institute-of-technology-machine-learning-with-python-from-linear-models-to-deep-learning', icon: '🟪', duration: '15h' }
    ],
    // --- HR & People ---
    'people analytics': [
      { title: 'People Analytics', provider: 'Coursera (UPenn)', url: 'https://www.coursera.org/learn/wharton-people-analytics', icon: '🟩', duration: '10h' },
      { title: 'HR Analytics', provider: 'edX (BerkeleyX)', url: 'https://www.edx.org/learn/human-resources/university-of-california-berkeley-people-analytics', icon: '🟪', duration: '12h' },
      { title: 'People Analytics Fundamentals', provider: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/people-analytics', icon: '🔵', duration: '3h' }
    ],
    'talent management': [
      { title: 'Talent Management', provider: 'Coursera (UMich)', url: 'https://www.coursera.org/learn/talent-management', icon: '🟩', duration: '12h' },
      { title: 'Strategic HR', provider: 'edX (Wharton)', url: 'https://www.edx.org/learn/human-resources/the-university-of-pennsylvania-managing-talent', icon: '🟪', duration: '10h' },
      { title: 'HR Management', provider: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/talent-management', icon: '🔵', duration: '4h' }
    ],
    // --- Certifications ---
    'pmp': [
      { title: 'PMP Exam Preparation', provider: 'Coursera (Google)', url: 'https://www.coursera.org/professional-certificates/google-project-management', icon: '🟩', duration: '24h' },
      { title: 'PMP Fundamentals', provider: 'edX (RIT)', url: 'https://www.edx.org/learn/project-management', icon: '🟪', duration: '15h' },
      { title: 'PMP Prep', provider: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/cert-prep-project-management-professional-pmp', icon: '🔵', duration: '8h' }
    ],
    'prince2': [
      { title: 'PRINCE2 Foundation', provider: 'Coursera', url: 'https://www.coursera.org/learn/prince2-foundation', icon: '🟩', duration: '15h' },
      { title: 'PRINCE2 Overview', provider: 'AXELOS (free)', url: 'https://www.axelos.com/certifications/prince2', icon: '🟧', duration: 'Ref.' },
      { title: 'Project Management Methods', provider: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/project-management-foundations-methodologies', icon: '🔵', duration: '4h' }
    ],
    // --- Fallback for generic skills ---
    'scrum': [
      { title: 'Scrum Master Certification', provider: 'Coursera (LearnQuest)', url: 'https://www.coursera.org/learn/scrum-master', icon: '🟩', duration: '15h' },
      { title: 'Agile with Scrum', provider: 'edX (UMD)', url: 'https://www.edx.org/learn/agile-software-development', icon: '🟪', duration: '12h' },
      { title: 'Scrum Fundamentals', provider: 'ScrumStudy (free)', url: 'https://www.scrumstudy.com/certification/scrum-fundamentals-certified', icon: '🟧', duration: '8h' }
    ],
    'agile': [
      { title: 'Agile Development', provider: 'Coursera (UVA)', url: 'https://www.coursera.org/learn/uva-darden-getting-started-agile', icon: '🟩', duration: '10h' },
      { title: 'Agile Fundamentals', provider: 'edX (IIMx)', url: 'https://www.edx.org/learn/agile-software-development', icon: '🟪', duration: '12h' },
      { title: 'Agile Foundations', provider: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/agile-foundations', icon: '🔵', duration: '3h' }
    ],
    'design thinking': [
      { title: 'Design Thinking', provider: 'Coursera (UVA)', url: 'https://www.coursera.org/learn/uva-darden-design-thinking-innovation', icon: '🟩', duration: '10h' },
      { title: 'Design Thinking Fundamentals', provider: 'edX (RIT)', url: 'https://www.edx.org/learn/design-thinking', icon: '🟪', duration: '12h' },
      { title: 'Design Thinking for Innovation', provider: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/design-thinking-understanding-the-process', icon: '🔵', duration: '3h' }
    ],
    'negociação': [
      { title: 'Successful Negotiation', provider: 'Coursera (UMich)', url: 'https://www.coursera.org/learn/negotiation-skills', icon: '🟩', duration: '12h' },
      { title: 'Negotiation Fundamentals', provider: 'edX (ESSEC)', url: 'https://www.edx.org/learn/negotiation', icon: '🟪', duration: '10h' },
      { title: 'Negotiation Skills', provider: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/negotiation-skills', icon: '🔵', duration: '3h' }
    ]
  };

  // Styles
  const STYLES = `
    .s2i-enhancement { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .s2i-linkedin-mini { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; background:#0A66C2; color:#fff; border-radius:6px; font-size:11px; font-weight:600; text-decoration:none; transition:background .2s; margin-left:8px; vertical-align:middle; }
    .s2i-linkedin-mini:hover { background:#004182; color:#fff; text-decoration:none; }
    .s2i-linkedin-mini svg { width:14px; height:14px; fill:#fff; flex-shrink:0; }
    .s2i-linkedin-note { font-size:9px; color:#94a3b8; margin-left:4px; font-style:italic; }
    .s2i-courses-section { margin:10px 0 6px 0; padding:10px 14px; background:linear-gradient(135deg,#f0fdf4,#ecfdf5); border:1px solid #bbf7d0; border-radius:10px; }
    .s2i-courses-title { font-size:11px; font-weight:700; color:#166534; margin-bottom:8px; display:flex; align-items:center; gap:5px; }
    .s2i-courses-grid { display:flex; flex-wrap:wrap; gap:6px; }
    .s2i-course-chip { display:flex; align-items:center; gap:6px; padding:5px 10px; background:#fff; border:1px solid #d1fae5; border-radius:8px; text-decoration:none; transition:all .2s; max-width:280px; flex:1 1 200px; min-width:180px; }
    .s2i-course-chip:hover { border-color:#059669; box-shadow:0 2px 8px rgba(5,150,105,.15); transform:translateY(-1px); text-decoration:none; }
    .s2i-course-icon { font-size:14px; flex-shrink:0; }
    .s2i-course-info { flex:1; min-width:0; }
    .s2i-course-name { font-size:10.5px; font-weight:600; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block; }
    .s2i-course-meta { font-size:9.5px; color:#64748b; display:flex; align-items:center; gap:4px; }
    .s2i-course-free { color:#059669; font-weight:700; font-size:9px; }
  `;

  const LINKEDIN_SVG = '<svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>';

  function findCoursesForSkill(skillText) {
    const lower = skillText.toLowerCase().trim();
    // Try exact match first
    for (const [key, courses] of Object.entries(COURSE_DB)) {
      if (lower.includes(key) || key.includes(lower)) {
        return courses;
      }
    }
    // Try partial match on individual words
    const words = lower.split(/\s+/);
    for (const word of words) {
      if (word.length < 3) continue;
      for (const [key, courses] of Object.entries(COURSE_DB)) {
        if (key.includes(word) || word.includes(key)) {
          return courses;
        }
      }
    }
    return null;
  }

  function buildLinkedInURL(roleTitle, location) {
    const loc = location || 'Portugal';
    const keywords = encodeURIComponent(roleTitle);
    return `https://www.linkedin.com/jobs/search/?keywords=${keywords}&location=${encodeURIComponent(loc)}&sortBy=DD`;
  }

  function createLinkedInButton(roleTitle) {
    const url = buildLinkedInURL(roleTitle);
    const html = `<a href="${url}" target="_blank" rel="noopener" class="s2i-linkedin-mini" title="Ver vagas no LinkedIn">
      ${LINKEDIN_SVG} Vagas
    </a><span class="s2i-linkedin-note">vagas ativas no LinkedIn</span>`;
    return html;
  }

  function createCoursesSection(skills) {
    const allCourses = [];
    for (const skill of skills) {
      const courses = findCoursesForSkill(skill);
      if (courses) {
        allCourses.push({ skill, courses });
      }
    }
    if (allCourses.length === 0) return '';

    let chipsHTML = '';
    for (const { skill, courses } of allCourses) {
      for (const c of courses) {
        chipsHTML += `<a href="${c.url}" target="_blank" rel="noopener" class="s2i-course-chip" title="${c.title} — ${c.provider}">
          <span class="s2i-course-icon">${c.icon}</span>
          <span class="s2i-course-info">
            <span class="s2i-course-name">${c.title}</span>
            <span class="s2i-course-meta">${c.provider} · ${c.duration} <span class="s2i-course-free">Gratuito</span></span>
          </span>
        </a>`;
      }
    }

    return `<div class="s2i-courses-section s2i-enhancement">
      <div class="s2i-courses-title">🎓 Formações gratuitas recomendadas</div>
      <div class="s2i-courses-grid">${chipsHTML}</div>
    </div>`;
  }

  function injectStyles() {
    if (document.getElementById('s2i-enhancement-styles')) return;
    const style = document.createElement('style');
    style.id = 's2i-enhancement-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  function processPage() {
    // Don't process if already processed
    if (document.querySelector('.s2i-enhancement')) return;

    const root = document.getElementById('root');
    if (!root) return;

    // Look for role cards — they contain role titles, skills lists, etc.
    // The React renders the career path data as sections with headings and lists
    // We need to find: role title headings, and "what you need" skill lists
    
    const allElements = root.querySelectorAll('*');
    const roleCards = [];
    let currentCard = null;

    // Strategy: find elements that contain percentage + role-like text patterns
    // The fit_percentage is rendered as "XX%" and role_title as a heading
    for (const el of allElements) {
      const text = el.textContent || '';
      
      // Detect role title headings — they typically contain the role name
      // and are followed by timeline and fit percentage
      if (el.tagName && /^H[1-6]$/.test(el.tagName) && text.length > 5 && text.length < 150) {
        // Check if this heading's parent/sibling contains a percentage
        const parent = el.closest('[class*="rounded"]') || el.closest('[class*="border"]') || el.parentElement?.parentElement;
        if (parent) {
          const parentText = parent.textContent || '';
          if (parentText.includes('%') && (parentText.includes('meses') || parentText.includes('anos') || parentText.includes('prazo') || parentText.includes('months') || parentText.includes('years'))) {
            roleCards.push({
              titleEl: el,
              titleText: text.trim(),
              containerEl: parent
            });
          }
        }
      }
    }

    if (roleCards.length === 0) return;

    injectStyles();

    for (const card of roleCards) {
      // 1. Add LinkedIn button next to role title
      if (!card.titleEl.querySelector('.s2i-linkedin-mini')) {
        const linkedinHTML = createLinkedInButton(card.titleText);
        card.titleEl.insertAdjacentHTML('beforeend', linkedinHTML);
      }

      // 2. Find "what you need" skills in this card
      // Look for list items or grid items that represent skills to develop
      const container = card.containerEl;
      const skillSections = [];
      
      // Find all text nodes and elements that look like skill lists
      const allInCard = container.querySelectorAll('div, span, li, p');
      let needSkills = [];
      let needSection = null;
      let inNeedSection = false;

      for (const el of allInCard) {
        const t = (el.textContent || '').trim();
        // Detect the "what you need" section — it usually follows "what you already have"
        // and contains items with bullet points or icons
        if (t.length > 3 && t.length < 200) {
          // Check if this is a skill item in the "need" section
          // Skills to develop often have a red/orange indicator or different styling
          const style = window.getComputedStyle(el);
          const bgColor = style.backgroundColor;
          const color = style.color;
          
          // Look for elements with red/orange/warning colors (skills to develop)
          if ((bgColor.includes('239') || bgColor.includes('245') || bgColor.includes('254') || 
               bgColor.includes('255') || color.includes('239') || color.includes('220')) &&
              t.length > 3 && t.length < 100 && el.children.length <= 2) {
            needSkills.push(t);
            if (!needSection) needSection = el.parentElement;
          }
        }
      }

      // If we found skills to develop, add courses after the section
      if (needSkills.length > 0 && needSection) {
        const coursesHTML = createCoursesSection(needSkills);
        if (coursesHTML) {
          // Find the best insertion point — after the skills grid
          let insertPoint = needSection;
          // Walk up to find the section container
          while (insertPoint.parentElement && insertPoint.parentElement !== container) {
            const siblings = insertPoint.parentElement.children;
            if (siblings.length > 1) break;
            insertPoint = insertPoint.parentElement;
          }
          insertPoint.insertAdjacentHTML('afterend', coursesHTML);
        }
      }
    }
  }

  // Use MutationObserver to detect when results are rendered
  function startObserver() {
    const root = document.getElementById('root');
    if (!root) {
      setTimeout(startObserver, 500);
      return;
    }

    // Process immediately in case results are already rendered
    setTimeout(processPage, 1000);

    // Watch for DOM changes (React rendering)
    const observer = new MutationObserver(function(mutations) {
      // Debounce
      clearTimeout(observer._timeout);
      observer._timeout = setTimeout(function() {
        processPage();
      }, 800);
    });

    observer.observe(root, { childList: true, subtree: true });
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
  } else {
    startObserver();
  }
})();
