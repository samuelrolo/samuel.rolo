'use strict';
// ═══════════════════════════════════════════════════════════════
//  Share2Inspire · Admin Analytics JS
//  Versão 2.0 — Funil completo, CRM, Métricas de Crescimento
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
const BREVO_SENDER = { name: 'Share2Inspire', email: 'srshare2inspire@gmail.com' };

function getBrevoKey() { return localStorage.getItem('s2i_brevo_key') || ''; }
function ensureBrevoKey() {
    if (getBrevoKey()) return true;
    const key = prompt('Insere a API Key do Brevo para enviar emails:');
    if (key) { localStorage.setItem('s2i_brevo_key', key); location.reload(); return true; }
    showToast('API Key do Brevo necessária para enviar emails', 'danger');
    return false;
}

// ── Estado Global ──────────────────────────────────────────────
let allAnalyses      = [];
let allVouchers      = [];
let allEmailHistory  = [];
let allHealthLogs    = [];
let allContacts      = [];
let allEbookDownloads = [];
let allJobSearch     = [];
let allCareerEnergy  = [];
let allNewsletterSubs = [];
let allLinkedinRoaster = [];
let allAuthUsers       = [];
let allUserProfiles    = [];
let allSubscriptions   = [];
let allUserAnalyses    = [];
let usersPage          = 1;

let globalLang       = 'all';
let nurturingLang    = 'pt';
let dashPeriodDays   = 0;
let funnelPeriodDays = 0;
let currentPage      = 1;
let historyPage      = 1;
let crmPage          = 1;
const PAGE_SIZE      = 25;

// Chart instances
let dailyChart = null, typeChart = null, langChart = null, ttfbChart = null;
let funnelChart = null, scoreChart = null, ceScoreChart = null;

// Nurturing state
let nurturingSegment = null;
let nurturingRecipients = [];

// ═══════════════════════════════════════════════════════════════
//  SUPABASE HELPERS
// ═══════════════════════════════════════════════════════════════
async function supaFetch(table, query = '') {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        if (!res.ok) return [];
        return res.json();
    } catch { return []; }
}

async function supaInsert(table, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json', 'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Insert failed (${res.status}): ${errText}`);
    }
    return res.json();
}

async function supaUpdate(table, id, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json', 'Prefer': 'return=minimal'
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
}

// ═══════════════════════════════════════════════════════════════
//  LANGUAGE & PRODUCT HELPERS
// ═══════════════════════════════════════════════════════════════
function detectLanguage(a) {
    if (a.analysis_type && a.analysis_type.includes('_en')) return 'en';
    const area = (a.professional_area || '').toLowerCase();
    const email = (a.user_email || '').toLowerCase();
    const ptAreas = ['engenheiro','analista','gestor','programador','técnico','consultor','administra'];
    const enAreas = ['software engineer','data scientist','project manager','developer','analyst'];
    for (const x of ptAreas) if (area.includes(x)) return 'pt';
    for (const x of enAreas) if (area.includes(x)) return 'en';
    if (email.endsWith('.pt') || email.endsWith('.br')) return 'pt';
    if (email.endsWith('.uk') || email.endsWith('.io')) return 'en';
    return 'pt';
}

function getAnalysisType(a) {
    // LinkedIn Roaster: paid = paid, voucher = voucher, non-paid = free (gratuito)
    if (a._source === 'linkedin_roaster') {
        if (a.payment_method === 'voucher') return 'voucher';
        return (a.payment_status === 'paid' || (a.payment_amount && a.payment_amount > 0)) ? 'paid' : 'free';
    }
    // Career path is always paid
    if (a.analysis_type === 'career_path') return 'paid';
    // Voucher: only if payment_method explicitly says 'voucher' on THIS analysis
    if (a.payment_method === 'voucher') return 'voucher';
    // Paid: confirmed payment on THIS analysis
    if (a.payment_status === 'paid' || (a.payment_amount && a.payment_amount > 0)) return 'paid';
    // Paid analysis_type from backend
    if (a.analysis_type === 'paid') return 'paid';
    // Everything else is free
    return 'free';
}

function isAnonymous(a) {
    const email = (a.user_email || '').toLowerCase();
    return !email || email.includes('anonymous') || email.includes('@share2inspire') || email === '';
}
// hasEmail: verdadeiro se o registo tem um email real contactável (mesmo que o nome seja "Utilizador Anónimo")
function hasEmail(a) {
    const email = (a.user_email || '').trim().toLowerCase();
    return email.length > 0 && !email.includes('anonymous') && !email.includes('@share2inspire') && email.includes('@');
}

function getPaymentOrigin(a) {
    if (a.payment_method) return a.payment_method;
    const type = getAnalysisType(a);
    if (type === 'voucher') return 'voucher';
    if (type === 'free') return 'free';
    const tid = a.transaction_id || '';
    if (tid.startsWith('pi_') || tid.startsWith('cs_')) return 'stripe';
    if (tid.startsWith('PAYID-') || tid.toLowerCase().includes('paypal')) return 'paypal';
    if (a.payment_status === 'paid') return 'stripe';
    return '—';
}

function filterByLang(data, lang) {
    if (!lang || lang === 'all') return data;
    return data.filter(a => detectLanguage(a) === lang);
}

function filterByPeriod(data, days) {
    if (!days || days === 0) return data;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return data.filter(a => new Date(a.created_at) >= cutoff);
}

// ═══════════════════════════════════════════════════════════════
//  BADGE HELPERS
// ═══════════════════════════════════════════════════════════════
function getTypeBadge(type) {
    const map = {
        paid: '<span class="badge badge-paid">Pago</span>',
        voucher: '<span class="badge badge-voucher">Voucher</span>',
        free: '<span class="badge badge-free">Gratuito</span>'
    };
    return map[type] || map.free;
}
function getLangBadge(lang) {
    return lang === 'en'
        ? '<span class="badge badge-en">🇬🇧 EN</span>'
        : '<span class="badge badge-pt">🇵🇹 PT</span>';
}
function getProductBadge(a) {
    if (a._source === 'linkedin_roaster') return '<span class="badge" style="background:#0077B5;color:#fff;">LinkedIn Roaster</span>';
    if (a.analysis_type === 'career_path') return '<span class="badge badge-career">Career Path</span>';
    return '<span class="badge badge-cv">CV Analyser</span>';
}
function getStageBadge(stage) {
    const map = {
        lead: '<span class="funnel-stage stage-lead">Lead</span>',
        nurturing: '<span class="funnel-stage stage-nurturing">Nurturing</span>',
        client: '<span class="funnel-stage stage-client">Cliente</span>',
        recurring: '<span class="funnel-stage stage-recurring">Recorrente</span>'
    };
    return map[stage] || map.lead;
}

// ═══════════════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════════════
function showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `show ${type}`;
    setTimeout(() => { t.className = ''; }, 3500);
}

// ═══════════════════════════════════════════════════════════════
//  TAB NAVIGATION
// ═══════════════════════════════════════════════════════════════
function switchTab(name, btn) {
    document.querySelectorAll('.main > div[id^="tab-"]').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const tab = document.getElementById('tab-' + name);
    if (tab) tab.style.display = '';
    if (btn) btn.classList.add('active');

    // Lazy render on first visit
    if (name === 'funnel') renderFunnel();
    if (name === 'crm') { renderCRM(); renderNurturingSegments(); }
    if (name === 'analyses') renderAnalyses();
    if (name === 'vouchers') renderVouchers();
    if (name === 'history') renderEmailHistory();
    if (name === 'contacts') renderContacts();
    if (name === 'health') renderHealth();
    if (name === 'jobsearch') renderJobSearch();
    if (name === 'careerenergy') renderCareerEnergy();
    if (name === 'affiliates') renderAffiliates();
    if (name === 'coupons') renderCoupons();
    if (name === 'users') renderUsers();
}

// ═══════════════════════════════════════════════════════════════
//  GLOBAL LANGUAGE FILTER
// ═══════════════════════════════════════════════════════════════
function setGlobalLang(lang, btn) {
    globalLang = lang;
    document.querySelectorAll('#globalLangToggle button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateDashboard();
    renderAnalyses();
}

function setNurturingLang(lang, btn) {
    nurturingLang = lang;
    document.querySelectorAll('#nurturingLangToggle button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (nurturingSegment) prepareNurturing(nurturingSegment);
}

// ═══════════════════════════════════════════════════════════════
//  PERIOD SELECTORS
// ═══════════════════════════════════════════════════════════════
function setDashPeriod(days, btn) {
    dashPeriodDays = days;
    document.querySelectorAll('#dashPeriodBtns .period-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateDashboard();
    updateCharts();
}

function setFunnelPeriod(days, btn) {
    funnelPeriodDays = days;
    document.querySelectorAll('#funnelPeriodBtns .period-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderFunnel();
}

// ═══════════════════════════════════════════════════════════════
//  DATA LOADING
// ═══════════════════════════════════════════════════════════════
async function loadAllData() {
    try {
        const [analyses, vouchers, contacts, newsletter, jobSearch, careerEnergy, linkedinRoaster] = await Promise.all([
            supaFetch('cv_analysis', 'select=id,user_email,user_name,score,professional_area,analysis_type,payment_status,payment_amount,payment_method,transaction_id,career_path_purchased,user_rating,rating_comment,created_at&order=created_at.desc&limit=5000'),
            supaFetch('vouchers', 'select=*&order=created_at.desc'),
            supaFetch('contact_messages', 'select=*&order=created_at.desc&limit=500'),
            supaFetch('newsletter_subscribers', 'select=*&order=created_at.desc&limit=2000'),
            supaFetch('job_search_tracking', 'select=*&order=created_at.desc&limit=2000'),
            supaFetch('career_energy_results', 'select=*&order=created_at.desc&limit=2000'),
            supaFetch('linkedin_roaster_analyses', 'select=*&order=created_at.desc&limit=5000')
        ]);
        allAnalyses      = Array.isArray(analyses)     ? analyses     : [];
        allVouchers      = Array.isArray(vouchers)     ? vouchers     : [];
        allContacts      = Array.isArray(contacts)     ? contacts     : [];
        allNewsletterSubs = Array.isArray(newsletter)  ? newsletter   : [];
        allEbookDownloads = allNewsletterSubs; // newsletter_subscribers serve como base de ebook leads
        allJobSearch     = Array.isArray(jobSearch)    ? jobSearch    : [];
        allCareerEnergy  = Array.isArray(careerEnergy) ? careerEnergy : [];
        allLinkedinRoaster = Array.isArray(linkedinRoaster) ? linkedinRoaster : [];
    } catch (e) {
        console.error('Erro ao carregar dados:', e);
        showToast('Erro ao carregar dados do Supabase', 'danger');
    }
}

async function loadEmailHistory() {
    try {
        const history = await supaFetch('email_history', 'order=sent_at.desc&limit=2000');
        allEmailHistory = Array.isArray(history) ? history : [];
    } catch { allEmailHistory = []; }
}

async function loadHealthLogs() {
    try {
        const logs = await supaFetch('backend_health_log', 'order=checked_at.desc&limit=500');
        allHealthLogs = Array.isArray(logs) ? logs : [];
    } catch { allHealthLogs = []; }
}

// ═══════════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════════
function updateDashboard() {
    let cvData = filterByLang(allAnalyses, globalLang);
    cvData = filterByPeriod(cvData, dashPeriodDays);

    // Merge LR into the main data for unified KPIs
    const lrTaggedAll = allLinkedinRoaster.map(a => ({ ...a, _source: 'linkedin_roaster' }));
    const lrPeriod = filterByPeriod(lrTaggedAll, dashPeriodDays);
    const data = [...cvData, ...lrPeriod];

    const paid    = data.filter(a => getAnalysisType(a) === 'paid');
    const free    = data.filter(a => getAnalysisType(a) === 'free');
    const voucher = data.filter(a => getAnalysisType(a) === 'voucher');
    const cp      = data.filter(a => a.analysis_type === 'career_path');

    const now = new Date();
    const h24 = new Date(now - 86400000);
    const d7  = new Date(now - 7 * 86400000);

    const last24h  = data.filter(a => new Date(a.created_at) >= h24);
    const last7d   = data.filter(a => new Date(a.created_at) >= d7);
    const paidLast7 = last7d.filter(a => getAnalysisType(a) === 'paid');

    // Revenue from direct paid analyses (payment_amount on cv_analysis) + LR paid
    const directRevenue = paid.reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0);
    // Revenue from voucher sales (amount_paid on vouchers table, excluding test/promo)
    const voucherRevenue = allVouchers
        .filter(v => v.payment_method !== 'test' && v.payment_method !== 'promo')
        .reduce((s, v) => s + (parseFloat(v.amount_paid) || 0), 0);
    // Total = direct analysis payments + voucher sales
    const totalRevenue = directRevenue + voucherRevenue;
    const cvRevenue = paid.filter(a => a.analysis_type !== 'career_path' && a._source !== 'linkedin_roaster').reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0) 
                    + allVouchers.filter(v => v.payment_method !== 'test' && v.payment_method !== 'promo' && v.voucher_type !== 'career_path').reduce((s, v) => s + (parseFloat(v.amount_paid) || 0), 0);
    const cpRevenue = cp.reduce((s, a) => s + (a.payment_amount || 0), 0)
                    + allVouchers.filter(v => v.payment_method !== 'test' && v.payment_method !== 'promo' && v.voucher_type === 'career_path').reduce((s, v) => s + (parseFloat(v.amount_paid) || 0), 0);

    const uniqueEmails = new Set(data.filter(a => !isAnonymous(a)).map(a => a.user_email.toLowerCase()));
    const identified   = data.filter(a => !isAnonymous(a));
    const identifiedPct = data.length ? Math.round(identified.length / data.length * 100) : 0;

    const avgScore = data.filter(a => a.score > 0).length
        ? Math.round(data.filter(a => a.score > 0).reduce((s, a) => s + a.score, 0) / data.filter(a => a.score > 0).length)
        : 0;

    const convRate = free.length ? Math.round(paid.length / (free.length + paid.length) * 100) : 0;
    const avgTicket = paid.length ? (totalRevenue / paid.length).toFixed(2) : '0.00';
    const ltv = uniqueEmails.size ? (totalRevenue / uniqueEmails.size).toFixed(2) : '0.00';
    const abandonRate = data.length ? Math.round(data.filter(isAnonymous).length / data.length * 100) : 0;

    const vActive = allVouchers.filter(v => v.is_active === true || (v.is_active !== false && v.used_analyses < v.total_analyses)).length;
    const vUsed   = allVouchers.filter(v => v.used_analyses > 0).length;
    const cpPct   = paid.length ? Math.round(cp.length / paid.length * 100) : 0;
    const rev7d   = paidLast7.reduce((s, a) => s + (a.payment_amount || 0), 0);

    setText('kpiTotal',        data.length);
    setText('kpi24h',          `${last24h.length} últimas 24h`);
    setText('kpiPaid',         paid.length);
    setText('kpiPaidPct',      `${data.length ? Math.round(paid.length/data.length*100) : 0}% do total`);
    setText('kpiFree',         free.length);
    setText('kpiFreePct',      `${data.length ? Math.round(free.length/data.length*100) : 0}% do total`);
    setText('kpiRevenue',      `${totalRevenue.toFixed(2)}€`);
    setText('kpiRevenueVoucher', `${voucher.length} vouchers`);
    setText('kpiUniqueUsers',  uniqueEmails.size);
    setText('kpiIdentifiedPct', `${identifiedPct}% identificados`);
    setText('kpiCareerPaths',  cp.length);
    setText('kpiCPPct',        `${cpPct}% dos pagantes`);
    setText('kpiAvgScore',     avgScore);
    setText('kpi7d',           last7d.length);
    setText('kpi7dRevenue',    `${rev7d.toFixed(2)}€ receita`);
    setText('kpiConvRate',     `${convRate}%`);
    setText('kpiAvgTicket',    `${avgTicket}€`);
    setText('kpiLTV',          `${ltv}€`);
    setText('kpiAbandon',      `${abandonRate}%`);
    setText('kpiVouchersActive', vActive);
    setText('kpiVouchersUsed', `${vUsed} utilizados`);

    // LinkedIn Roaster computed values
    const lrPaidItems = lrPeriod.filter(a => a.payment_status === 'paid');
    const lrRevenue = lrPaidItems.reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0);
    const lrFreeCount = lrPeriod.length - lrPaidItems.length;

    // === VENDAS REAIS (excluindo samuelrolo@gmail.com) ===
    const excludeEmail = 'samuelrolo@gmail.com';
    const realPaid = paid.filter(a => (a.user_email || '').toLowerCase() !== excludeEmail);
    const realCVAPaid = realPaid.filter(a => a.analysis_type !== 'career_path' && a._source !== 'linkedin_roaster');
    const realCPPaid = realPaid.filter(a => a.analysis_type === 'career_path');
    const realLRPaid = realPaid.filter(a => a._source === 'linkedin_roaster');
    const realVouchersSold = allVouchers.filter(v => v.payment_method !== 'test' && v.payment_method !== 'promo' && (v.buyer_email || '').toLowerCase() !== excludeEmail && (v.user_email || '').toLowerCase() !== excludeEmail);

    const realDirectRevenue = realPaid.reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0);
    const realVoucherRevenue = realVouchersSold.reduce((s, v) => s + (parseFloat(v.amount_paid) || 0), 0);
    const realTotalRevenue = realDirectRevenue + realVoucherRevenue;
    const realCVARevenue = realCVAPaid.reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0)
                         + allVouchers.filter(v => v.payment_method !== 'test' && v.payment_method !== 'promo' && v.voucher_type !== 'career_path' && (v.buyer_email || '').toLowerCase() !== excludeEmail && (v.user_email || '').toLowerCase() !== excludeEmail).reduce((s, v) => s + (parseFloat(v.amount_paid) || 0), 0);
    const realCPRevenue = realCPPaid.reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0)
                        + allVouchers.filter(v => v.payment_method !== 'test' && v.payment_method !== 'promo' && v.voucher_type === 'career_path' && (v.buyer_email || '').toLowerCase() !== excludeEmail && (v.user_email || '').toLowerCase() !== excludeEmail).reduce((s, v) => s + (parseFloat(v.amount_paid) || 0), 0);
    const realLRRevenue = realLRPaid.reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0);

    // === PIVOT TABLE ===
    const cvAll = data.filter(a => a.analysis_type !== 'career_path' && a._source !== 'linkedin_roaster');
    const cvFreeItems = cvAll.filter(a => getAnalysisType(a) === 'free');
    const cvPaidItems = cvAll.filter(a => getAnalysisType(a) === 'paid');
    const cvVoucherItems = cvAll.filter(a => getAnalysisType(a) === 'voucher');
    const cpFreeItems = cp.filter(a => getAnalysisType(a) === 'free');
    const cpPaidItems = cp.filter(a => getAnalysisType(a) === 'paid');
    const cpVoucherItems = cp.filter(a => getAnalysisType(a) === 'voucher');
    const lrFreeItems = lrPeriod.filter(a => getAnalysisType(a) === 'free');
    const lrPaidType = lrPeriod.filter(a => getAnalysisType(a) === 'paid');
    const lrVoucherItems = lrPeriod.filter(a => getAnalysisType(a) === 'voucher');

    const pivotProducts = [
        {
            name: 'CV Analyser', color: 'var(--purple)', icon: 'fa-file-lines',
            total: cvAll.length, free: cvFreeItems.length, paid: cvPaidItems.length, voucher: cvVoucherItems.length,
            revenue: cvRevenue, realRevenue: realCVARevenue
        },
        {
            name: 'Career Path', color: 'var(--teal)', icon: 'fa-route',
            total: cp.length, free: cpFreeItems.length, paid: cpPaidItems.length, voucher: cpVoucherItems.length,
            revenue: cpRevenue, realRevenue: realCPRevenue
        },
        {
            name: 'LinkedIn Roaster', color: '#0077B5', icon: 'fa-linkedin',
            total: lrPeriod.length, free: lrFreeItems.length, paid: lrPaidType.length, voucher: lrVoucherItems.length,
            revenue: lrRevenue, realRevenue: realLRRevenue
        },
        {
            name: 'Vouchers', color: 'var(--green)', icon: 'fa-ticket',
            total: allVouchers.length, free: 0, paid: 0, voucher: 0,
            revenue: voucherRevenue, realRevenue: realVoucherRevenue,
            isVoucher: true, active: vActive, used: vUsed
        }
    ];

    const pivotBody = document.getElementById('pivotBody');
    const pivotFoot = document.getElementById('pivotFoot');
    if (pivotBody) {
        pivotBody.innerHTML = '';
        pivotProducts.forEach(p => {
            const conv = (p.free + p.paid) > 0 ? Math.round(p.paid / (p.free + p.paid) * 100) : 0;
            const ticket = p.paid > 0 ? (p.revenue / p.paid).toFixed(2) : '0.00';
            const tr = document.createElement('tr');
            if (p.isVoucher) {
                tr.innerHTML = `
                    <td><span style="color:${p.color};font-weight:600;"><i class="fas ${p.icon}" style="margin-right:6px;"></i>${p.name}</span></td>
                    <td style="text-align:center;">${p.total}</td>
                    <td style="text-align:center;color:var(--text-muted);">${p.active} ativos</td>
                    <td style="text-align:center;color:var(--text-muted);">${p.used} usados</td>
                    <td style="text-align:center;">-</td>
                    <td style="text-align:center;">-</td>
                    <td style="text-align:right;font-weight:600;color:${p.color};">${p.revenue.toFixed(2)}\u20ac</td>
                    <td style="text-align:right;">-</td>
                    <td style="text-align:right;font-weight:700;color:var(--gold);">${p.realRevenue.toFixed(2)}\u20ac</td>
                `;
            } else {
                tr.innerHTML = `
                    <td><span style="color:${p.color};font-weight:600;"><i class="fas ${p.icon}" style="margin-right:6px;"></i>${p.name}</span></td>
                    <td style="text-align:center;font-weight:600;">${p.total}</td>
                    <td style="text-align:center;">${p.free}</td>
                    <td style="text-align:center;color:var(--green);font-weight:600;">${p.paid}</td>
                    <td style="text-align:center;">${p.voucher}</td>
                    <td style="text-align:center;">${conv}%</td>
                    <td style="text-align:right;font-weight:600;color:${p.color};">${p.revenue.toFixed(2)}\u20ac</td>
                    <td style="text-align:right;">${ticket}\u20ac</td>
                    <td style="text-align:right;font-weight:700;color:var(--gold);">${p.realRevenue.toFixed(2)}\u20ac</td>
                `;
            }
            pivotBody.appendChild(tr);
        });

        // Totals row
        const tAll = pivotProducts.filter(p => !p.isVoucher).reduce((s, p) => s + p.total, 0) + allVouchers.length;
        const tFree = pivotProducts.filter(p => !p.isVoucher).reduce((s, p) => s + p.free, 0);
        const tPaid = pivotProducts.filter(p => !p.isVoucher).reduce((s, p) => s + p.paid, 0);
        const tVoucher = pivotProducts.filter(p => !p.isVoucher).reduce((s, p) => s + p.voucher, 0);
        const tConv = (tFree + tPaid) > 0 ? Math.round(tPaid / (tFree + tPaid) * 100) : 0;
        const tTicket = tPaid > 0 ? (totalRevenue / tPaid).toFixed(2) : '0.00';
        setText('pivotTotalAll', tAll);
        setText('pivotTotalFree', tFree);
        setText('pivotTotalPaid', tPaid);
        setText('pivotTotalVoucher', tVoucher);
        setText('pivotTotalConv', `${tConv}%`);
        setText('pivotTotalRevenue', `${totalRevenue.toFixed(2)}\u20ac`);
        setText('pivotTotalTicket', `${tTicket}\u20ac`);
        setText('pivotTotalReal', `${realTotalRevenue.toFixed(2)}\u20ac`);
        if (pivotFoot) pivotFoot.style.display = '';
    }

    // Dashboard Revenue by Product (includes LinkedIn Roaster)
    renderDashRevenueByProduct(cvData, lrPeriod);

    // Hidden compat
    setText('kpiRevenuePT', '');
    setText('kpiRevenueEN', '');

    document.getElementById('lastUpdate').textContent = 'Atualizado: ' + new Date().toLocaleTimeString('pt-PT');
}

function renderDashRevenueByProduct(cvData, lrData) {
    const revEl = document.getElementById('dashRevenueByProduct');
    if (!revEl) return;

    const cvRev = cvData.filter(a => getAnalysisType(a) === 'paid' && a.analysis_type !== 'career_path').reduce((s, a) => s + (a.payment_amount || 0), 0);
    const cpRev = cvData.filter(a => a.analysis_type === 'career_path').reduce((s, a) => s + (a.payment_amount || 0), 0);
    const lrRev = lrData.filter(a => a.payment_status === 'paid').reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0);
    const vRev  = allVouchers.filter(v => v.payment_method !== 'test' && v.payment_method !== 'promo').reduce((s, v) => s + (parseFloat(v.amount_paid) || 0), 0);
    const total = cvRev + cpRev + lrRev + vRev;

    revEl.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;">
            ${[
                { label: 'CV Analyser', value: cvRev, color: 'var(--purple)', icon: 'fa-file-alt' },
                { label: 'Career Path', value: cpRev, color: 'var(--blue)', icon: 'fa-route' },
                { label: 'LinkedIn Roaster', value: lrRev, color: '#0077B5', icon: 'fab fa-linkedin' },
                { label: 'Vouchers', value: vRev, color: 'var(--gold)', icon: 'fa-ticket-alt' }
            ].map(p => `
                <div style="text-align:center;padding:16px;background:var(--bg);border-radius:8px;">
                    <i class="${p.icon.startsWith('fab') ? p.icon : 'fas ' + p.icon}" style="font-size:20px;color:${p.color};margin-bottom:8px;display:block;"></i>
                    <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.4px;">${p.label}</div>
                    <div style="font-size:22px;font-weight:700;color:${p.color};margin-top:4px;">${p.value.toFixed(2)}€</div>
                    <div style="font-size:11px;color:var(--text-muted);">${total > 0 ? Math.round(p.value/total*100) : 0}% do total</div>
                </div>`).join('')}
        </div>
        <div style="margin-top:16px;padding:12px 16px;background:var(--gold-bg);border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:13px;font-weight:600;color:var(--dark);">Total Receita (período)</span>
            <span style="font-size:20px;font-weight:700;color:var(--gold);">${total.toFixed(2)}€</span>
        </div>`;
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// ═══════════════════════════════════════════════════════════════
//  CHARTS
// ═══════════════════════════════════════════════════════════════
function updateCharts() {
    const days = parseInt(document.getElementById('chartDateFilter')?.value || 14);
    let cvData = filterByLang(allAnalyses, globalLang);
    cvData = filterByPeriod(cvData, days);

    // Merge LinkedIn Roaster into chart data (LR paid = paid, LR non-paid = free/gratuito)
    const lrTagged = allLinkedinRoaster.map(a => ({ ...a, _source: 'linkedin_roaster' }));
    const lrFiltered = filterByPeriod(lrTagged, days);
    const data = [...cvData, ...lrFiltered];

    // Daily Chart
    const dateMap = {};
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dateMap[d.toISOString().slice(0, 10)] = { paid: 0, free: 0, voucher: 0 };
    }
    data.forEach(a => {
        const key = a.created_at?.slice(0, 10);
        if (dateMap[key]) {
            const type = getAnalysisType(a);
            dateMap[key][type]++;
        }
    });
    const labels = Object.keys(dateMap);
    const paidData    = labels.map(d => dateMap[d].paid);
    const freeData    = labels.map(d => dateMap[d].free);
    const voucherData = labels.map(d => dateMap[d].voucher);

    const ctx1 = document.getElementById('dailyChart')?.getContext('2d');
    if (ctx1) {
        if (dailyChart) dailyChart.destroy();
        dailyChart = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: labels.map(d => d.slice(5)),
                datasets: [
                    { label: 'Pago', data: paidData, backgroundColor: '#10B981', borderRadius: 3 },
                    { label: 'Gratuito', data: freeData, backgroundColor: '#E5E7EB', borderRadius: 3 },
                    { label: 'Voucher', data: voucherData, backgroundColor: '#C9A961', borderRadius: 3 }
                ]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } }, scales: { x: { stacked: true, ticks: { font: { size: 10 } } }, y: { stacked: true, ticks: { font: { size: 10 } } } } }
        });
    }

    // Type Chart (Donut) — includes all products
    const paidCount    = data.filter(a => getAnalysisType(a) === 'paid').length;
    const freeCount    = data.filter(a => getAnalysisType(a) === 'free').length;
    const voucherCount = data.filter(a => getAnalysisType(a) === 'voucher').length;
    const ctx2 = document.getElementById('typeChart')?.getContext('2d');
    if (ctx2) {
        if (typeChart) typeChart.destroy();
        typeChart = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Pago', 'Gratuito', 'Voucher'],
                datasets: [{ data: [paidCount, freeCount, voucherCount], backgroundColor: ['#10B981', '#E5E7EB', '#C9A961'], borderWidth: 0 }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } } }
        });
    }

    // Lang Chart
    const ptCount = filterByLang(data, 'pt').length;
    const enCount = filterByLang(data, 'en').length;
    const ctx3 = document.getElementById('langChart')?.getContext('2d');
    if (ctx3) {
        if (langChart) langChart.destroy();
        langChart = new Chart(ctx3, {
            type: 'doughnut',
            data: {
                labels: ['🇵🇹 PT', '🇬🇧 EN'],
                datasets: [{ data: [ptCount, enCount], backgroundColor: ['#166534', '#1E40AF'], borderWidth: 0 }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } } }
        });
    }

    // Score Distribution — includes LR teaser_score
    const scoreBuckets = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
    data.forEach(a => {
        const s = a.score || a.teaser_score || 0;
        if (s <= 0) return;
        // LR scores are 1-10, normalize to 0-100
        const normalized = a._source === 'linkedin_roaster' ? s * 10 : s;
        if (normalized <= 20) scoreBuckets['0-20']++;
        else if (normalized <= 40) scoreBuckets['21-40']++;
        else if (normalized <= 60) scoreBuckets['41-60']++;
        else if (normalized <= 80) scoreBuckets['61-80']++;
        else scoreBuckets['81-100']++;
    });
    const ctx4 = document.getElementById('scoreChart')?.getContext('2d');
    if (ctx4) {
        if (scoreChart) scoreChart.destroy();
        scoreChart = new Chart(ctx4, {
            type: 'bar',
            data: {
                labels: Object.keys(scoreBuckets),
                datasets: [{ label: 'Utilizadores', data: Object.values(scoreBuckets), backgroundColor: '#C9A961', borderRadius: 4 }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } } }
        });
    }
}


// ═══════════════════════════════════════════════════════════════
//  FUNIL DE CONVERSÃO
// ═══════════════════════════════════════════════════════════════
function renderFunnel() {
    let data = filterByLang(allAnalyses, globalLang);
    data = filterByPeriod(data, funnelPeriodDays);

    const lrFiltered = filterByPeriod(allLinkedinRoaster, funnelPeriodDays);
    const lrTotal     = lrFiltered.length;
    const lrPaidCount = lrFiltered.filter(a => a.payment_status === 'paid').length;
    const ceTotal     = allCareerEnergy.length; // Career Energy
    const freeCount   = data.filter(a => getAnalysisType(a) === 'free').length;
    const paidCount   = data.filter(a => getAnalysisType(a) === 'paid' && a.analysis_type !== 'career_path').length;
    const cpCount     = data.filter(a => a.analysis_type === 'career_path').length;

    // LinkedIn Roaster é o topo do funil
    const topTotal = lrTotal + (ceTotal || (freeCount + paidCount + cpCount));

    // KPIs
    setText('funnelLR', lrTotal);
    setText('funnelLRConv', `${lrPaidCount} pagas`);
    setText('funnelCE', ceTotal || freeCount + paidCount + cpCount);
    setText('funnelFree', freeCount);
    setText('funnelPaid', paidCount);
    setText('funnelCP', cpCount);

    setText('funnelFreeConv',      ceTotal ? `${Math.round(freeCount / ceTotal * 100)}% do CE` : '—');
    setText('funnelPaidConv',      freeCount ? `${Math.round(paidCount / (freeCount + paidCount) * 100)}% do grátis` : '—');
    setText('funnelCPConv',        paidCount ? `${Math.round(cpCount / paidCount * 100)}% dos pagantes` : '—');

    // Funil Visual — LinkedIn Roaster no topo
    const steps = [
        { name: 'LinkedIn Roaster (Topo)', count: lrTotal, color: '#0077B5' },
        { name: 'Career Energy (Diagnóstico)', count: ceTotal || (freeCount + paidCount + cpCount), color: '#6B7280' },
        { name: 'CV Analyser Grátis', count: freeCount, color: '#C9A961' },
        { name: 'CV Analyser Pago', count: paidCount, color: '#10B981' },
        { name: 'Career Path', count: cpCount, color: '#3B82F6' }
    ];
    const maxCount = Math.max(...steps.map(s => s.count), 1);
    const funnelEl = document.getElementById('funnelVisual');
    if (funnelEl) {
        funnelEl.innerHTML = steps.map((step, i) => {
            const pct = Math.round(step.count / maxCount * 100);
            const conv = i > 0 && steps[i-1].count > 0 ? Math.round(step.count / steps[i-1].count * 100) : null;
            const drop = conv !== null ? 100 - conv : null;
            return `
            <div class="funnel-step">
                <div class="funnel-label-row">
                    <span class="funnel-step-name">${step.name}</span>
                    <span class="funnel-step-meta">
                        <span><strong>${step.count}</strong> utilizadores</span>
                    </span>
                </div>
                <div class="funnel-bar-wrap">
                    <div class="funnel-bar" style="width:${pct}%;background:${step.color};">${step.count}</div>
                </div>
                ${conv !== null ? `<div class="funnel-conv">Conversão: <span class="conv-pct">${conv}%</span> &nbsp;|&nbsp; Abandono: <span class="drop-pct">${drop}%</span></div>` : ''}
            </div>`;
        }).join('');
    }

    // Funil Chart
    const ctx = document.getElementById('funnelChart')?.getContext('2d');
    if (ctx) {
        if (funnelChart) funnelChart.destroy();
        funnelChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: steps.map(s => s.name),
                datasets: [{
                    label: 'Utilizadores',
                    data: steps.map(s => s.count),
                    backgroundColor: steps.map(s => s.color),
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { x: { ticks: { font: { size: 10 } } }, y: { ticks: { font: { size: 11 } } } }
            }
        });
    }

    // Pontos de Abandono
    const abandonEl = document.getElementById('abandonPoints');
    if (abandonEl) {
        const anonymous = data.filter(isAnonymous).length;
        const noEmail   = data.filter(a => !a.user_email || a.user_email === '').length;
        const freeNoUpgrade = data.filter(a => getAnalysisType(a) === 'free' && !isAnonymous(a)).length;
        const paidNoCp = data.filter(a => getAnalysisType(a) === 'paid' && a.analysis_type !== 'career_path').length;

        abandonEl.innerHTML = `
            <div class="metric-row">
                <div class="metric-label"><i class="fas fa-user-slash" style="color:var(--red);margin-right:6px;"></i> Utilizadores anónimos (sem email)</div>
                <div style="display:flex;align-items:center;gap:12px;flex:1;margin-left:16px;">
                    <div class="metric-bar-wrap"><div class="metric-bar" style="width:${data.length ? Math.round(anonymous/data.length*100) : 0}%;background:var(--red);"></div></div>
                    <div class="metric-value" style="color:var(--red);">${anonymous} <small style="font-size:11px;font-weight:400;">(${data.length ? Math.round(anonymous/data.length*100) : 0}%)</small></div>
                </div>
            </div>
            <div class="metric-row">
                <div class="metric-label"><i class="fas fa-arrow-up" style="color:var(--orange);margin-right:6px;"></i> Grátis sem upgrade para pago</div>
                <div style="display:flex;align-items:center;gap:12px;flex:1;margin-left:16px;">
                    <div class="metric-bar-wrap"><div class="metric-bar" style="width:${freeCount ? Math.round(freeNoUpgrade/freeCount*100) : 0}%;background:var(--orange);"></div></div>
                    <div class="metric-value" style="color:var(--orange);">${freeNoUpgrade} <small style="font-size:11px;font-weight:400;">(${freeCount ? Math.round(freeNoUpgrade/freeCount*100) : 0}%)</small></div>
                </div>
            </div>
            <div class="metric-row">
                <div class="metric-label"><i class="fas fa-route" style="color:var(--blue);margin-right:6px;"></i> CV Pago sem Career Path</div>
                <div style="display:flex;align-items:center;gap:12px;flex:1;margin-left:16px;">
                    <div class="metric-bar-wrap"><div class="metric-bar" style="width:${paidCount ? Math.round(paidNoCp/paidCount*100) : 0}%;background:var(--blue);"></div></div>
                    <div class="metric-value" style="color:var(--blue);">${paidNoCp} <small style="font-size:11px;font-weight:400;">(${paidCount ? Math.round(paidNoCp/paidCount*100) : 0}%)</small></div>
                </div>
            </div>`;
    }

    // Oportunidades
    const oppEl = document.getElementById('conversionOpportunities');
    if (oppEl) {
        const freeIdentified = data.filter(a => getAnalysisType(a) === 'free' && !isAnonymous(a)).length;
        const cvPaidNoCp     = data.filter(a => getAnalysisType(a) === 'paid' && a.analysis_type !== 'career_path' && !isAnonymous(a)).length;
        const avgTicket      = paidCount > 0 ? (data.filter(a => getAnalysisType(a) === 'paid').reduce((s, a) => s + (a.payment_amount || 0), 0) / paidCount) : 0;
        const potentialRev   = (freeIdentified * avgTicket * 0.1 + cvPaidNoCp * 19.99 * 0.2).toFixed(0);

        oppEl.innerHTML = `
            <div style="margin-bottom:12px;padding:12px;background:var(--green-bg);border-radius:8px;border-left:3px solid var(--green);">
                <div style="font-size:12px;font-weight:600;color:var(--green);margin-bottom:4px;">💰 Receita Potencial Estimada</div>
                <div style="font-size:20px;font-weight:700;color:var(--dark);">${potentialRev}€</div>
                <div style="font-size:11px;color:var(--text-muted);">Com 10% de conversão das leads grátis + 20% upsell Career Path</div>
            </div>
            <div class="metric-row">
                <div class="metric-label">Leads grátis identificadas para upsell</div>
                <div class="metric-value" style="color:var(--gold);">${freeIdentified}</div>
            </div>
            <div class="metric-row">
                <div class="metric-label">Clientes CV para upsell Career Path</div>
                <div class="metric-value" style="color:var(--blue);">${cvPaidNoCp}</div>
            </div>
            <div class="metric-row">
                <div class="metric-label">Ticket médio atual</div>
                <div class="metric-value" style="color:var(--green);">${avgTicket.toFixed(2)}€</div>
            </div>`;
    }

    // Receita por Produto (inclui LinkedIn Roaster)
    const revEl = document.getElementById('revenueByProduct');
    if (revEl) {
        const cvRev = data.filter(a => getAnalysisType(a) === 'paid' && a.analysis_type !== 'career_path').reduce((s, a) => s + (a.payment_amount || 0), 0);
        const cpRev = data.filter(a => a.analysis_type === 'career_path').reduce((s, a) => s + (a.payment_amount || 0), 0);
        const lrRev = lrFiltered.filter(a => a.payment_status === 'paid').reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0);
        const vRev  = allVouchers.filter(v => v.payment_method !== 'test' && v.payment_method !== 'promo').reduce((s, v) => s + (parseFloat(v.amount_paid) || 0), 0);
        const total = cvRev + cpRev + lrRev + vRev;

        revEl.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;">
                ${[
                    { label: 'CV Analyser', value: cvRev, color: 'var(--purple)', icon: 'fa-file-alt' },
                    { label: 'Career Path', value: cpRev, color: 'var(--blue)', icon: 'fa-route' },
                    { label: 'LinkedIn Roaster', value: lrRev, color: '#0077B5', icon: 'fab fa-linkedin' },
                    { label: 'Vouchers', value: vRev, color: 'var(--gold)', icon: 'fa-ticket-alt' }
                ].map(p => `
                    <div style="text-align:center;padding:16px;background:var(--bg);border-radius:8px;">
                        <i class="${p.icon.startsWith('fab') ? p.icon : 'fas ' + p.icon}" style="font-size:20px;color:${p.color};margin-bottom:8px;display:block;"></i>
                        <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.4px;">${p.label}</div>
                        <div style="font-size:22px;font-weight:700;color:${p.color};margin-top:4px;">${p.value.toFixed(2)}€</div>
                        <div style="font-size:11px;color:var(--text-muted);">${total > 0 ? Math.round(p.value/total*100) : 0}% do total</div>
                    </div>`).join('')}
            </div>
            <div style="margin-top:16px;padding:12px 16px;background:var(--gold-bg);border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:13px;font-weight:600;color:var(--dark);">Total Receita (período)</span>
                <span style="font-size:20px;font-weight:700;color:var(--gold);">${total.toFixed(2)}€</span>
            </div>`;
    }
}

// ═══════════════════════════════════════════════════════════════
//  CRM / LEADS
// ═══════════════════════════════════════════════════════════════
function buildCRMProfiles() {
    // Agrupa análises por email para criar perfil único por utilizador
    const profileMap = {};

    allAnalyses.forEach(a => {
        const email = isAnonymous(a) ? null : a.user_email.toLowerCase().trim();
        if (!email) return;

        if (!profileMap[email]) {
            profileMap[email] = {
                email,
                name: a.user_name || '',
                professional_area: a.professional_area || '',
                seniority: a.seniority_level || '',
                analyses: [],
                purchases: [],
                totalSpent: 0,
                lastInteraction: a.created_at,
                firstInteraction: a.created_at
            };
        }

        const p = profileMap[email];
        p.analyses.push(a);

        if (new Date(a.created_at) > new Date(p.lastInteraction)) p.lastInteraction = a.created_at;
        if (new Date(a.created_at) < new Date(p.firstInteraction)) p.firstInteraction = a.created_at;

        if (!p.name && a.user_name) p.name = a.user_name;
        if (!p.professional_area && a.professional_area) p.professional_area = a.professional_area;
        if (!p.seniority && a.seniority_level) p.seniority = a.seniority_level;

        const type = getAnalysisType(a);
        if (type === 'paid' || type === 'voucher') {
            p.purchases.push(a);
            p.totalSpent += (a.payment_amount || 0);
        }
    });

    // Determinar etapa do funil
    const sentEmails = new Set(allEmailHistory.map(e => e.recipient_email?.toLowerCase()));

    return Object.values(profileMap).map(p => {
        const hasPurchase = p.purchases.length > 0;
        const hasMultiple = p.purchases.length >= 2 || (p.purchases.length >= 1 && p.analyses.some(a => a.analysis_type === 'career_path'));
        const inNurturing = sentEmails.has(p.email);

        let stage = 'lead';
        if (hasMultiple) stage = 'recurring';
        else if (hasPurchase) stage = 'client';
        else if (inNurturing) stage = 'nurturing';

        return { ...p, stage };
    }).sort((a, b) => new Date(b.lastInteraction) - new Date(a.lastInteraction));
}

function renderCRM() {
    const profiles = buildCRMProfiles();

    // KPIs
    const leads     = profiles.filter(p => p.stage === 'lead').length;
    const nurturing = profiles.filter(p => p.stage === 'nurturing').length;
    const clients   = profiles.filter(p => p.stage === 'client').length;
    const recurring = profiles.filter(p => p.stage === 'recurring').length;

    setText('crmLeads',     leads);
    setText('crmNurturing', nurturing);
    setText('crmClients',   clients);
    setText('crmRecurring', recurring);

    // Populate seniority and area filters
    const senioritySet = new Set(profiles.map(p => p.seniority).filter(Boolean));
    const areaSet      = new Set(profiles.map(p => p.professional_area).filter(Boolean));
    populateSelect('crmFilterSeniority', [...senioritySet].sort());
    populateSelect('crmFilterArea',      [...areaSet].sort());

    // Filter
    const stageFilter   = document.getElementById('crmFilterStage')?.value || 'all';
    const productFilter = document.getElementById('crmFilterProduct')?.value || 'all';
    const senFilter     = document.getElementById('crmFilterSeniority')?.value || 'all';
    const areaFilter    = document.getElementById('crmFilterArea')?.value || 'all';
    const search        = (document.getElementById('crmSearch')?.value || '').toLowerCase();

    let filtered = profiles;
    if (stageFilter !== 'all') filtered = filtered.filter(p => p.stage === stageFilter);
    if (senFilter   !== 'all') filtered = filtered.filter(p => p.seniority === senFilter);
    if (areaFilter  !== 'all') filtered = filtered.filter(p => p.professional_area === areaFilter);
    if (productFilter !== 'all') {
        filtered = filtered.filter(p => {
            if (productFilter === 'cv_free') return p.analyses.some(a => getAnalysisType(a) === 'free');
            if (productFilter === 'cv_paid') return p.purchases.some(a => a.analysis_type !== 'career_path');
            if (productFilter === 'career_path') return p.purchases.some(a => a.analysis_type === 'career_path');
            return true;
        });
    }
    if (search) filtered = filtered.filter(p =>
        p.email.includes(search) || (p.name || '').toLowerCase().includes(search)
    );

    setText('crmCount', `${filtered.length} contactos`);

    // Paginate
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    crmPage = Math.min(crmPage, totalPages || 1);
    const page = filtered.slice((crmPage - 1) * PAGE_SIZE, crmPage * PAGE_SIZE);

    const tbody = document.getElementById('crmTable');
    if (!tbody) return;

    if (!page.length) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhum contacto encontrado</td></tr>`;
        return;
    }

    tbody.innerHTML = page.map(p => {
        const initials = (p.name || p.email).slice(0, 2).toUpperCase();
        const productsUsed  = [...new Set(p.analyses.map(a => a.analysis_type === 'career_path' ? 'Career Path' : 'CV Analyser'))].join(', ');
        const productsBought = [...new Set(p.purchases.map(a => a.analysis_type === 'career_path' ? 'Career Path' : 'CV Analyser'))].join(', ') || '—';
        const lastDate = new Date(p.lastInteraction).toLocaleDateString('pt-PT');
        return `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div class="lead-avatar">${initials}</div>
                    <div>
                        <div class="lead-name">${p.name || '—'}</div>
                        <div class="lead-email">${p.email}</div>
                    </div>
                </div>
            </td>
            <td style="font-size:12px;">${p.professional_area || '—'}</td>
            <td style="font-size:12px;">${p.seniority || '—'}</td>
            <td style="font-size:12px;">${productsUsed}</td>
            <td style="font-size:12px;">${productsBought}</td>
            <td style="font-size:12px;font-weight:600;color:var(--gold);">${p.totalSpent > 0 ? p.totalSpent.toFixed(2) + '€' : '—'}</td>
            <td style="font-size:12px;color:var(--text-muted);">${lastDate}</td>
            <td>${getStageBadge(p.stage)}</td>
            <td>
                <div style="display:flex;gap:4px;">
                    <button class="btn-icon" title="Ver Perfil" onclick="showUserProfile('${p.email}')"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" title="Enviar Email" onclick="openEmailModal('${p.email}','${(p.name||'').replace(/'/g,"\\'")}')"><i class="fas fa-envelope"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');

    renderPagination('crmPagination', crmPage, totalPages, (p) => { crmPage = p; renderCRM(); });
}

function populateSelect(id, options) {
    const el = document.getElementById(id);
    if (!el) return;
    const current = el.value;
    const existing = [...el.options].map(o => o.value);
    options.forEach(opt => {
        if (!existing.includes(opt)) {
            const o = document.createElement('option');
            o.value = opt; o.textContent = opt;
            el.appendChild(o);
        }
    });
    if (current) el.value = current;
}

function exportCRMCSV() {
    const profiles = buildCRMProfiles();
    const rows = [['Email','Nome','Área','Senioridade','Produtos Usados','Produtos Comprados','Total Gasto','Última Interação','Etapa']];
    profiles.forEach(p => {
        rows.push([
            p.email, p.name || '', p.professional_area || '', p.seniority || '',
            [...new Set(p.analyses.map(a => a.analysis_type === 'career_path' ? 'Career Path' : 'CV Analyser'))].join(';'),
            [...new Set(p.purchases.map(a => a.analysis_type === 'career_path' ? 'Career Path' : 'CV Analyser'))].join(';') || '',
            p.totalSpent.toFixed(2),
            p.lastInteraction?.slice(0, 10),
            p.stage
        ]);
    });
    downloadCSV(rows, 'crm_leads.csv');
}

// ═══════════════════════════════════════════════════════════════
//  USER PROFILE MODAL
// ═══════════════════════════════════════════════════════════════
function showUserProfile(email) {
    const profiles = buildCRMProfiles();
    const p = profiles.find(x => x.email === email);
    if (!p) return;

    document.getElementById('userProfileTitle').innerHTML = `<i class="fas fa-user" style="color:var(--gold);margin-right:8px;"></i> ${p.name || p.email}`;
    document.getElementById('userProfileModal').style.display = 'flex';

    const sentEmails = allEmailHistory.filter(e => e.recipient_email?.toLowerCase() === email);
    const timeline = [...p.analyses, ...sentEmails].sort((a, b) => new Date(b.created_at || b.sent_at) - new Date(a.created_at || a.sent_at));

    document.getElementById('userProfileBody').innerHTML = `
        <div class="profile-section">
            <h4>Informação do Contacto</h4>
            <div class="profile-row"><span>Email</span><span>${p.email}</span></div>
            <div class="profile-row"><span>Nome</span><span>${p.name || '—'}</span></div>
            <div class="profile-row"><span>Área Profissional</span><span>${p.professional_area || '—'}</span></div>
            <div class="profile-row"><span>Senioridade</span><span>${p.seniority || '—'}</span></div>
            <div class="profile-row"><span>Etapa do Funil</span><span>${getStageBadge(p.stage)}</span></div>
            <div class="profile-row"><span>Primeira Interação</span><span>${new Date(p.firstInteraction).toLocaleDateString('pt-PT')}</span></div>
            <div class="profile-row"><span>Última Interação</span><span>${new Date(p.lastInteraction).toLocaleDateString('pt-PT')}</span></div>
        </div>
        <div class="profile-section">
            <h4>Produtos & Compras</h4>
            <div class="profile-row"><span>Análises Realizadas</span><span>${p.analyses.length}</span></div>
            <div class="profile-row"><span>Produtos Comprados</span><span>${p.purchases.length}</span></div>
            <div class="profile-row"><span>Total Gasto</span><span style="font-weight:700;color:var(--gold);">${p.totalSpent.toFixed(2)}€</span></div>
            <div class="profile-row"><span>Score Médio</span><span>${p.analyses.filter(a => a.score > 0).length ? Math.round(p.analyses.filter(a => a.score > 0).reduce((s, a) => s + a.score, 0) / p.analyses.filter(a => a.score > 0).length) : '—'}</span></div>
        </div>
        <div class="profile-section">
            <h4>Histórico de Atividade</h4>
            ${timeline.slice(0, 10).map(item => {
                const isEmail = item.sent_at;
                const date = new Date(item.created_at || item.sent_at).toLocaleDateString('pt-PT');
                const desc = isEmail
                    ? `📧 Email enviado: ${item.subject || item.email_type || 'Follow-up'}`
                    : `📄 Análise ${getAnalysisType(item)} — Score: ${item.score || '—'}`;
                return `<div class="timeline-item"><div class="timeline-dot"></div><div class="timeline-content"><div>${desc}</div><div class="timeline-date">${date}</div></div></div>`;
            }).join('')}
        </div>
        <div style="display:flex;gap:8px;margin-top:16px;">
            <button class="btn btn-gold btn-sm" onclick="openEmailModal('${p.email}','${(p.name||'').replace(/'/g,"\\'")}')"><i class="fas fa-envelope"></i> Enviar Email</button>
            <button class="btn btn-outline btn-sm" onclick="closeUserProfile()">Fechar</button>
        </div>`;
}

function closeUserProfile() {
    document.getElementById('userProfileModal').style.display = 'none';
}

// ═══════════════════════════════════════════════════════════════
//  ANÁLISES
// ═══════════════════════════════════════════════════════════════
function filterAnalyses() { currentPage = 1; renderAnalyses(); }

function renderAnalyses() {
    // Merge CV analyses with LinkedIn Roaster analyses (tagged with _source)
    const lrTagged = allLinkedinRoaster.map(a => ({ ...a, _source: 'linkedin_roaster', analysis_type: 'linkedin_roaster' }));
    let data = filterByLang([...allAnalyses, ...lrTagged], globalLang);
    data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const type    = document.getElementById('filterType')?.value || 'all';
    const lang    = document.getElementById('filterLang')?.value || 'all';
    const product = document.getElementById('filterProduct')?.value || 'all';
    const email   = (document.getElementById('filterEmail')?.value || '').toLowerCase();
    const from    = document.getElementById('filterDateFrom')?.value;
    const to      = document.getElementById('filterDateTo')?.value;

    if (type !== 'all') data = data.filter(a => getAnalysisType(a) === type);
    if (lang !== 'all') data = data.filter(a => detectLanguage(a) === lang);
    if (product !== 'all') {
        if (product === 'linkedin_roaster') data = data.filter(a => a._source === 'linkedin_roaster');
        else if (product === 'cv') data = data.filter(a => a.analysis_type !== 'career_path' && a._source !== 'linkedin_roaster');
        else if (product === 'career_path') data = data.filter(a => a.analysis_type === 'career_path');
    }
    if (email) data = data.filter(a => (a.user_email || '').toLowerCase().includes(email));
    if (from) data = data.filter(a => a.created_at >= from);
    if (to)   data = data.filter(a => a.created_at <= to + 'T23:59:59');

    setText('analysesCount', `${data.length} análises`);

    const totalPages = Math.ceil(data.length / PAGE_SIZE);
    currentPage = Math.min(currentPage, totalPages || 1);
    const page = data.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const tbody = document.getElementById('analysesTable');
    if (!tbody) return;

    if (!page.length) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhuma análise encontrada</td></tr>`;
        return;
    }

    tbody.innerHTML = page.map(a => {
        const type = getAnalysisType(a);
        const lang = detectLanguage(a);
        const dt = new Date(a.created_at);
        const date = dt.toLocaleDateString('pt-PT') + ' ' + dt.toLocaleTimeString('pt-PT', {hour:'2-digit', minute:'2-digit'});
        const rawScore = a.score || a.teaser_score || 0;
        const score = rawScore > 0 ? `<span style="font-weight:600;color:${rawScore >= 70 ? 'var(--green)' : rawScore >= 40 ? 'var(--orange)' : 'var(--red)'};">` + `${rawScore}</span>` : '—';
        const amount = a.payment_amount > 0 ? `<span style="color:var(--gold);font-weight:600;">${a.payment_amount.toFixed(2)}€</span>` : '—';
        const anonBadge = isAnonymous(a) ? '<span class="badge badge-secondary" style="font-size:9px;">Anónimo</span>' : '';
        return `
        <tr>
            <td style="font-size:12px;color:var(--text-muted);">${date}</td>
            <td>${a.user_name || '<span style="color:var(--text-muted);">—</span>'}</td>
            <td style="font-size:12px;">${isAnonymous(a) ? `<span style="color:var(--text-muted);">${a.user_email || 'anónimo'}</span>` : a.user_email} ${anonBadge}</td>
            <td>${score}</td>
            <td style="font-size:12px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${a.professional_area || a.target_area || ''}">${a.professional_area || a.target_area || '—'}</td>
            <td>${getTypeBadge(type)}</td>
            <td>${getProductBadge(a)}</td>
            <td>${getLangBadge(lang)}</td>
            <td>${amount}</td>
            <td>
                <div style="display:flex;gap:4px;">
                    ${!isAnonymous(a) ? `<button class="btn-icon" title="Ver Perfil" onclick="showUserProfile('${a.user_email.toLowerCase()}')"><i class="fas fa-eye"></i></button>` : ''}
                    ${!isAnonymous(a) ? `<button class="btn-icon" title="Enviar Email" onclick="openEmailModal('${a.user_email}','${(a.user_name||'').replace(/'/g,"\\'")}')"><i class="fas fa-envelope"></i></button>` : ''}
                </div>
            </td>
        </tr>`;
    }).join('');

    renderPagination('analysesPagination', currentPage, totalPages, (p) => { currentPage = p; renderAnalyses(); });
}

function exportAnalysesCSV() {
    const lrTagged = allLinkedinRoaster.map(a => ({ ...a, _source: 'linkedin_roaster', analysis_type: 'linkedin_roaster' }));
    let data = filterByLang([...allAnalyses, ...lrTagged], globalLang);
    data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const rows = [['Data','Nome','Email','Score','Área','Tipo','Produto','Idioma','Valor','Origem']];
    data.forEach(a => {
        const productName = a._source === 'linkedin_roaster' ? 'LinkedIn Roaster' : (a.analysis_type === 'career_path' ? 'Career Path' : 'CV Analyser');
        rows.push([
            a.created_at?.slice(0,10), a.user_name||'', a.user_email||'',
            a.score || a.teaser_score || '', a.professional_area || a.target_area || '',
            getAnalysisType(a), productName,
            detectLanguage(a), a.payment_amount||0, getPaymentOrigin(a)
        ]);
    });
    downloadCSV(rows, 'analises.csv');
}

// ═══════════════════════════════════════════════════════════════
//  VOUCHERS
// ═══════════════════════════════════════════════════════════════
function filterVouchers() { renderVouchers(); }

function renderVouchers() {
    let data = [...allVouchers];
    const status = document.getElementById('filterVoucherStatus')?.value || 'all';
    const type   = document.getElementById('filterVoucherType')?.value || 'all';
    const email  = (document.getElementById('filterVoucherEmail')?.value || '').toLowerCase();

    if (status !== 'all') {
        if (status === 'active') data = data.filter(v => v.is_active === true || (!v.is_active && v.used_analyses < v.total_analyses));
        else data = data.filter(v => v.is_active === false || v.used_analyses >= v.total_analyses);
    }
    if (type !== 'all') data = data.filter(v => v.voucher_type === type);
    if (email) data = data.filter(v => (v.email || '').toLowerCase().includes(email));

    const tbody = document.getElementById('vouchersTable');
    if (!tbody) return;

    if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhum voucher encontrado</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(v => {
        const isActive = v.is_active === true || (v.is_active !== false && (v.used_analyses || 0) < (v.total_analyses || 1));
        const date = new Date(v.created_at).toLocaleDateString('pt-PT');
        const usedPct = v.total_analyses > 0 ? Math.round((v.used_analyses || 0) / v.total_analyses * 100) : 0;
        const hasCareerPath = v.includes_career_path === true || v.voucher_type === 'complete';
        return `
        <tr>
            <td><code style="font-size:12px;background:var(--bg);padding:2px 6px;border-radius:4px;">${v.code}</code></td>
            <td style="font-size:12px;">${v.email || '—'}</td>
            <td style="font-size:12px;">${v.plan_name || '—'}</td>
            <td>${v.voucher_type === 'linkedin_roaster' ? '<span class="badge" style="background:#0077B5;color:#fff;font-size:10px;">LinkedIn Roaster</span>' : v.voucher_type === 'career_path' ? '<span class="badge badge-career">Career Path</span>' : v.voucher_type === 'complete' || v.voucher_type === 'bundle' ? '<span class="badge" style="background:var(--gold);color:#fff;font-size:10px;">Bundle</span>' : '<span class="badge badge-cv">CV Analyser</span>'}</td>
            <td style="font-size:12px;font-weight:600;">${parseFloat(v.amount_paid) > 0 ? parseFloat(v.amount_paid).toFixed(2) + '€' : '—'}</td>
            <td>
                <span class="badge ${isActive ? 'badge-success' : 'badge-secondary'}">${isActive ? 'Ativo' : 'Usado'}</span>
                <span style="font-size:10px;color:var(--text-muted);margin-left:4px;">${v.used_analyses||0}/${v.total_analyses||1}</span>
            </td>
            <td style="font-size:12px;color:var(--text-muted);">${date}</td>
            <td>
                ${v.email ? `<button class="btn-icon" title="Enviar Email" onclick="openEmailModal('${v.email}','')"><i class="fas fa-envelope"></i></button>` : ''}
            </td>
        </tr>`;
    }).join('');
}

function showCreateVoucherModal() { document.getElementById('voucherModalOverlay').style.display = 'flex'; }
function closeVoucherModal() { document.getElementById('voucherModalOverlay').style.display = 'none'; }

async function createVouchers() {
    const email   = document.getElementById('voucherEmail')?.value?.trim();
    const planVal = document.getElementById('voucherPlan')?.value;
    const payment = document.getElementById('voucherPayment')?.value;
    const sendEmail = document.getElementById('voucherSendEmail')?.checked;

    if (!email) { showToast('Email obrigatório', 'danger'); return; }

    // Pack Teste Parceria: cria 3 vouchers (CV + Career Path + LinkedIn Roaster)
    if (planVal === 'PACK_TESTE_PARCERIA') {
        const packItems = [
            { plan_name: 'CV Analyser', voucher_type: 'standard', includes_career_path: false, amount_paid: '0' },
            { plan_name: 'Career Path', voucher_type: 'career_path', includes_career_path: true, amount_paid: '0' },
            { plan_name: 'LinkedIn Roaster', voucher_type: 'linkedin_roaster', includes_career_path: false, amount_paid: '0' }
        ];
        const codes = [];
        for (const item of packItems) {
            const code = 'S2I-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            codes.push({ code, plan: item.plan_name });
            await supaInsert('vouchers', {
                code, email, plan_name: item.plan_name, total_analyses: 1, used_analyses: 0,
                amount_paid: item.amount_paid, payment_method: 'oferta',
                voucher_type: item.voucher_type, includes_career_path: item.includes_career_path,
                is_active: true, created_at: new Date().toISOString()
            });
        }
        showToast(`Pack Teste criado! ${codes.map(c => c.code).join(', ')}`, 'success');
        closeVoucherModal();

        if (sendEmail && ensureBrevoKey()) {
            const codesList = codes.map(c => `<strong>${c.plan}</strong>: <span style="font-size:18px;font-weight:bold;color:#C9A961;">${c.code}</span>`).join('<br>');
            const subject = 'Os teus vouchers Share2Inspire — Pack Teste';
            const body = `<p>Olá,</p><p>Seguem os teus vouchers de teste:</p>${codesList}<p style="margin-top:16px;">Acede a <a href="https://www.share2inspire.pt">share2inspire.pt</a> para usar cada um no respetivo produto.</p><p>Com os melhores cumprimentos,<br>Equipa Share2Inspire</p>`;
            await sendBrevoEmail(email, subject, body);
        }

        await loadAllData();
        renderVouchers();
        return;
    }

    const [planName, totalStr, amountStr, vType, cpFlag] = planVal.split('|');
    const total  = parseInt(totalStr);
    const amount = parseFloat(amountStr);

    const codes = [];
    for (let i = 0; i < total; i++) {
        const code = 'S2I-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        codes.push(code);
        await supaInsert('vouchers', {
            code, email, plan_name: planName, total_analyses: 1, used_analyses: 0,
            amount_paid: amount.toString(), payment_method: payment,
            voucher_type: vType, includes_career_path: cpFlag === 'true',
            is_active: true, created_at: new Date().toISOString()
        });
    }

    showToast(`${codes.length} voucher(s) criado(s)!`, 'success');
    closeVoucherModal();

    if (sendEmail && ensureBrevoKey()) {
        const subject = `O teu voucher Share2Inspire — ${planName}`;
        const body = `<p>Olá,</p><p>Segue o teu voucher para <strong>${planName}</strong>:</p><p style="font-size:20px;font-weight:bold;color:#C9A961;">${codes.join('<br>')}</p><p>Acede a <a href="https://www.share2inspire.pt">share2inspire.pt</a> para usar.</p>`;
        await sendBrevoEmail(email, subject, body);
    }

    await loadAllData();
    renderVouchers();
}

// ═══════════════════════════════════════════════════════════════
//  NURTURING
// ═══════════════════════════════════════════════════════════════
function renderNurturingSegments() {
    const sentEmails = new Set(allEmailHistory.map(e => e.recipient_email?.toLowerCase()));

    const upsell     = allAnalyses.filter(a => getAnalysisType(a) === 'free' && hasEmail(a));
    const feedback   = allAnalyses.filter(a => getAnalysisType(a) === 'paid' && !a.user_rating && hasEmail(a));
    const careerpath = allAnalyses.filter(a => getAnalysisType(a) === 'paid' && a.analysis_type !== 'career_path' && hasEmail(a));
    const abandoned  = allAnalyses.filter(a => !hasEmail(a) && new Date(a.created_at) > new Date(Date.now() - 7 * 86400000));

    const uniqueUpsell     = [...new Set(upsell.map(a => a.user_email.toLowerCase()))];
    const uniqueFeedback   = [...new Set(feedback.map(a => a.user_email.toLowerCase()))];
    const uniqueCareerpath = [...new Set(careerpath.map(a => a.user_email.toLowerCase()))];

    setText('upsellCount',     uniqueUpsell.length);
    setText('feedbackCount',   uniqueFeedback.length);
    setText('careerpathCount', uniqueCareerpath.length);
    setText('abandonedCount',  abandoned.length);
}

const emailTemplates = {
    pt: {
        upsell: {
            subject: '🎯 O teu CV merece uma análise completa',
            body: `<p>Olá {{nome}},</p>
<p>Vimos que fizeste a análise gratuita do teu CV e ficámos impressionados com o teu perfil!</p>
<p>A análise completa vai mostrar-te exatamente o que precisas de melhorar para te destacares no mercado de trabalho.</p>
<p><a href="https://www.share2inspire.pt/cv-analyser" style="background:#C9A961;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:10px;">Ver Análise Completa →</a></p>
<p>Com os melhores cumprimentos,<br>Equipa Share2Inspire</p>`
        },
        feedback: {
            subject: '⭐ Como foi a tua experiência com o Share2Inspire?',
            body: `<p>Olá {{nome}},</p>
<p>Obrigado por teres utilizado os nossos serviços! A tua opinião é muito importante para nós.</p>
<p>Podes partilhar a tua experiência? Demora apenas 1 minuto.</p>
<p><a href="https://g.page/r/CZS08nYUvP4qEBM/review" style="background:#C9A961;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:10px;">Deixar Avaliação →</a></p>
<p>Com os melhores cumprimentos,<br>Equipa Share2Inspire</p>`
        },
        careerpath: {
            subject: '🚀 Descobre o teu próximo passo de carreira',
            body: `<p>Olá {{nome}},</p>
<p>Já analisaste o teu CV — agora é hora de traçar o teu caminho de carreira!</p>
<p>O Career Path vai ajudar-te a identificar as melhores oportunidades e o plano de ação para chegares lá.</p>
<p><a href="https://www.share2inspire.pt/career-path" style="background:#C9A961;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:10px;">Explorar Career Path →</a></p>
<p>Com os melhores cumprimentos,<br>Equipa Share2Inspire</p>`
        }
    },
    en: {
        upsell: {
            subject: '🎯 Your CV deserves a full analysis',
            body: `<p>Hi {{nome}},</p>
<p>We noticed you completed the free CV analysis — your profile looks promising!</p>
<p>The full analysis will show you exactly what to improve to stand out in the job market.</p>
<p><a href="https://www.share2inspire.pt/cv-analyser" style="background:#C9A961;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:10px;">See Full Analysis →</a></p>
<p>Best regards,<br>Share2Inspire Team</p>`
        },
        feedback: {
            subject: '⭐ How was your Share2Inspire experience?',
            body: `<p>Hi {{nome}},</p>
<p>Thank you for using our services! Your feedback means a lot to us.</p>
<p>Could you share your experience? It only takes 1 minute.</p>
<p><a href="https://www.share2inspire.pt" style="background:#C9A961;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:10px;">Leave a Review →</a></p>
<p>Best regards,<br>Share2Inspire Team</p>`
        },
        careerpath: {
            subject: '🚀 Discover your next career step',
            body: `<p>Hi {{nome}},</p>
<p>You've analysed your CV — now it's time to map your career path!</p>
<p>Career Path will help you identify the best opportunities and the action plan to get there.</p>
<p><a href="https://www.share2inspire.pt/career-path" style="background:#C9A961;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:10px;">Explore Career Path →</a></p>
<p>Best regards,<br>Share2Inspire Team</p>`
        }
    }
};

function prepareNurturing(segment) {
    nurturingSegment = segment;
    const sentEmails = new Set(allEmailHistory.map(e => e.recipient_email?.toLowerCase()));
    let recipients = [];

    if (segment === 'upsell') {
        const emails = [...new Set(allAnalyses.filter(a => getAnalysisType(a) === 'free' && hasEmail(a)).map(a => a.user_email.toLowerCase().trim()))];
        recipients = emails.map(email => {
            const a = allAnalyses.find(x => x.user_email?.toLowerCase() === email);
            return { email, name: a?.user_name || '', sent: sentEmails.has(email) };
        });
    } else if (segment === 'feedback') {
        const emails = [...new Set(allAnalyses.filter(a => getAnalysisType(a) === 'paid' && !a.user_rating && hasEmail(a)).map(a => a.user_email.toLowerCase().trim()))];
        recipients = emails.map(email => {
            const a = allAnalyses.find(x => x.user_email?.toLowerCase() === email);
            return { email, name: a?.user_name || '', sent: sentEmails.has(email) };
        });
    } else if (segment === 'careerpath') {
        const emails = [...new Set(allAnalyses.filter(a => getAnalysisType(a) === 'paid' && a.analysis_type !== 'career_path' && hasEmail(a)).map(a => a.user_email.toLowerCase().trim()))];
        recipients = emails.map(email => {
            const a = allAnalyses.find(x => x.user_email?.toLowerCase() === email);
            return { email, name: a?.user_name || '', sent: sentEmails.has(email) };
        });
    }

    nurturingRecipients = recipients;

    const template = emailTemplates[nurturingLang]?.[segment] || emailTemplates['pt'][segment] || { subject: '', body: '' };

    const composer = document.getElementById('emailComposer');
    if (composer) {
        composer.style.display = '';
        const titleMap = { upsell: 'Upsell — Análise Completa', feedback: 'Pedir Feedback', careerpath: 'Upsell — Career Path' };
        const titleEl = document.getElementById('composerTitle');
        if (titleEl) titleEl.innerHTML = `<i class="fas fa-paper-plane"></i> ${titleMap[segment] || 'Compor Email'}`;
        const subjectEl = document.getElementById('emailSubject');
        const bodyEl    = document.getElementById('emailBody');
        if (subjectEl) subjectEl.value = template.subject;
        if (bodyEl)    bodyEl.value    = template.body;
    }

    renderRecipientList();
    document.querySelectorAll('.segment-card').forEach(c => c.classList.remove('active'));
    const segMap = { upsell: 0, feedback: 1, careerpath: 2, abandoned: 3 };
    const cards  = document.querySelectorAll('.segment-card');
    if (cards[segMap[segment]]) cards[segMap[segment]].classList.add('active');
}

function renderRecipientList() {
    const search   = (document.getElementById('recipientSearch')?.value || '').toLowerCase();
    const filter   = document.getElementById('recipientFilter')?.value || 'all';
    const listEl   = document.getElementById('recipientList');
    if (!listEl) return;

    let filtered = nurturingRecipients;
    if (filter === 'unsent') filtered = filtered.filter(r => !r.sent);
    if (filter === 'sent')   filtered = filtered.filter(r => r.sent);
    if (search) filtered = filtered.filter(r => r.email.includes(search) || r.name.toLowerCase().includes(search));

    const selected = filtered.filter(r => r.checked !== false).length;
    setText('selectedCount', `(${selected} selecionados)`);

    listEl.innerHTML = filtered.map((r, i) => `
        <div class="recipient-item ${r.sent ? 'sent' : ''}">
            <input type="checkbox" id="rec_${i}" ${r.checked !== false ? 'checked' : ''} onchange="toggleRecipient('${r.email}', this.checked)">
            <div style="flex:1;">
                <div style="font-size:13px;">${r.name || r.email}</div>
                ${r.name ? `<div style="font-size:11px;color:var(--text-muted);">${r.email}</div>` : ''}
            </div>
            ${r.sent ? '<span class="sent-badge campaign-match">Enviado</span>' : ''}
        </div>`).join('');
}

function filterRecipientList() { renderRecipientList(); }

function toggleRecipient(email, checked) {
    const r = nurturingRecipients.find(x => x.email === email);
    if (r) r.checked = checked;
    const selected = nurturingRecipients.filter(r => r.checked !== false).length;
    setText('selectedCount', `(${selected} selecionados)`);
}

function toggleAllRecipients(state) {
    nurturingRecipients.forEach(r => r.checked = state);
    renderRecipientList();
}

function selectOnlyUnsent() {
    nurturingRecipients.forEach(r => r.checked = !r.sent);
    renderRecipientList();
}

async function sendBulkEmail() {
    if (!ensureBrevoKey()) return;
    const subject = document.getElementById('emailSubject')?.value;
    const body    = document.getElementById('emailBody')?.value;
    if (!subject || !body) { showToast('Assunto e corpo são obrigatórios', 'danger'); return; }

    const toSend = nurturingRecipients.filter(r => r.checked !== false);
    if (!toSend.length) { showToast('Nenhum destinatário selecionado', 'danger'); return; }

    let sent = 0;
    for (const r of toSend) {
        const personalizedBody = body.replace(/\{\{nome\}\}/g, r.name || 'Olá');
        const ok = await sendBrevoEmail(r.email, subject, personalizedBody);
        if (ok) {
            sent++;
            await supaInsert('email_history', {
                recipient_email: r.email, subject, email_type: nurturingSegment || 'custom',
                status: 'sent', sent_at: new Date().toISOString()
            });
            r.sent = true;
        }
    }
    showToast(`${sent} email(s) enviado(s) com sucesso!`, 'success');
    await loadEmailHistory();
    renderRecipientList();
    renderNurturingSegments();
}

// ═══════════════════════════════════════════════════════════════
//  EMAIL MODAL (individual)
// ═══════════════════════════════════════════════════════════════
function openEmailModal(email, name) {
    document.getElementById('modalEmailTo').value    = email;
    document.getElementById('modalEmailLang').value  = 'pt';
    document.getElementById('emailModalOverlay').style.display = 'flex';
    loadEmailTemplate();
}

function closeEmailModal() { document.getElementById('emailModalOverlay').style.display = 'none'; }

function loadEmailTemplate() {
    const lang     = document.getElementById('modalEmailLang')?.value || 'pt';
    const template = document.getElementById('modalEmailTemplate')?.value || 'upsell';
    if (template === 'custom') return;
    const tpl = emailTemplates[lang]?.[template];
    if (tpl) {
        document.getElementById('modalEmailSubject').value = tpl.subject;
        document.getElementById('modalEmailBody').value    = tpl.body;
    }
}

async function sendSingleEmail() {
    if (!ensureBrevoKey()) return;
    const to      = document.getElementById('modalEmailTo')?.value;
    const subject = document.getElementById('modalEmailSubject')?.value;
    const body    = document.getElementById('modalEmailBody')?.value;
    if (!to || !subject || !body) { showToast('Preenche todos os campos', 'danger'); return; }

    const ok = await sendBrevoEmail(to, subject, body);
    if (ok) {
        await supaInsert('email_history', {
            recipient_email: to, subject,
            email_type: document.getElementById('modalEmailTemplate')?.value || 'custom',
            status: 'sent', sent_at: new Date().toISOString()
        });
        showToast('Email enviado!', 'success');
        closeEmailModal();
        await loadEmailHistory();
    }
}

async function sendBrevoEmail(to, subject, htmlContent) {
    try {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'api-key': getBrevoKey(), 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender: BREVO_SENDER,
                to: [{ email: to }],
                subject,
                htmlContent
            })
        });
        if (!res.ok) { const err = await res.json(); showToast(`Erro Brevo: ${err.message}`, 'danger'); return false; }
        return true;
    } catch (e) { showToast('Erro ao enviar email', 'danger'); return false; }
}

// ═══════════════════════════════════════════════════════════════
//  HISTÓRICO DE EMAILS
// ═══════════════════════════════════════════════════════════════
function renderEmailHistory() {
    let data = [...allEmailHistory];
    const type  = document.getElementById('filterHistoryType')?.value || 'all';
    const email = (document.getElementById('filterHistoryEmail')?.value || '').toLowerCase();

    if (type !== 'all') data = data.filter(e => e.email_type === type);
    if (email) data = data.filter(e => (e.recipient_email || '').toLowerCase().includes(email));

    setText('historyCount', `${data.length} emails`);

    const totalPages = Math.ceil(data.length / PAGE_SIZE);
    historyPage = Math.min(historyPage, totalPages || 1);
    const page = data.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE);

    const tbody = document.getElementById('emailHistoryTable');
    if (!tbody) return;

    if (!page.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhum email no histórico</td></tr>`;
        return;
    }

    tbody.innerHTML = page.map(e => {
        const date = new Date(e.sent_at || e.created_at).toLocaleDateString('pt-PT');
        return `
        <tr>
            <td style="font-size:12px;color:var(--text-muted);">${date}</td>
            <td style="font-size:12px;">${e.recipient_email || '—'}</td>
            <td style="font-size:12px;">${e.subject || '—'}</td>
            <td><span class="badge badge-secondary">${e.email_type || 'custom'}</span></td>
            <td><span class="badge ${e.status === 'sent' ? 'badge-success' : 'badge-danger'}">${e.status || 'sent'}</span></td>
        </tr>`;
    }).join('');

    renderPagination('historyPagination', historyPage, totalPages, (p) => { historyPage = p; renderEmailHistory(); });
}

// ═══════════════════════════════════════════════════════════════
//  CONTACTOS
// ═══════════════════════════════════════════════════════════════
function renderContacts() {
    let data = [...allContacts];
    const search = (document.getElementById('filterContact')?.value || '').toLowerCase();
    if (search) data = data.filter(c => (c.name || '').toLowerCase().includes(search) || (c.email || '').toLowerCase().includes(search));

    setText('contactsCount', `${data.length} contactos`);

    const tbody = document.getElementById('contactsTable');
    if (!tbody) return;

    if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhum contacto encontrado</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(c => {
        const date = new Date(c.created_at).toLocaleDateString('pt-PT');
        return `
        <tr>
            <td style="font-size:12px;color:var(--text-muted);">${date}</td>
            <td>${c.name || '—'}</td>
            <td style="font-size:12px;">${c.email || '—'}</td>
            <td style="font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${c.message||''}">${c.message || '—'}</td>
            <td style="font-size:12px;">${c.service || '—'}</td>
        </tr>`;
    }).join('');
}

// ═══════════════════════════════════════════════════════════════
//  SAÚDE DO SISTEMA
// ═══════════════════════════════════════════════════════════════
function renderHealth() {
    const logs = allHealthLogs;
    if (!logs.length) {
        setText('healthUptime', '—');
        setText('healthAlerts', '—');
        setText('healthLastCheck', '—');
        document.getElementById('endpointStatus').innerHTML = '<p style="color:var(--text-muted);font-size:13px;">Sem dados de saúde disponíveis.</p>';
        return;
    }

    const last7d = logs.filter(l => new Date(l.checked_at) > new Date(Date.now() - 7 * 86400000));
    const healthy = last7d.filter(l => l.status === 'healthy').length;
    const uptime  = last7d.length ? Math.round(healthy / last7d.length * 100) : 100;
    const alerts  = last7d.filter(l => l.status !== 'healthy').length;
    const lastLog = logs[0];

    setText('healthUptime',    `${uptime}%`);
    setText('healthAlerts',    alerts);
    setText('healthLastCheck', lastLog ? new Date(lastLog.checked_at).toLocaleTimeString('pt-PT') : '—');

    // Endpoints
    const endpointMap = {};
    logs.slice(0, 200).forEach(l => {
        if (!endpointMap[l.endpoint]) endpointMap[l.endpoint] = { ok: 0, total: 0, lastTtfb: 0 };
        endpointMap[l.endpoint].total++;
        if (l.status === 'healthy') endpointMap[l.endpoint].ok++;
        endpointMap[l.endpoint].lastTtfb = l.ttfb_ms || 0;
    });

    const endpointEl = document.getElementById('endpointStatus');
    if (endpointEl) {
        endpointEl.innerHTML = Object.entries(endpointMap).map(([ep, stats]) => {
            const pct = Math.round(stats.ok / stats.total * 100);
            const dotClass = pct >= 95 ? 'healthy' : pct >= 80 ? 'warning' : 'critical';
            return `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span class="health-dot ${dotClass}"></span>
                    <span style="font-size:13px;">${ep}</span>
                </div>
                <div style="display:flex;gap:16px;font-size:12px;color:var(--text-muted);">
                    <span>Uptime: <strong style="color:var(--dark);">${pct}%</strong></span>
                    <span>TTFB: <strong style="color:var(--dark);">${stats.lastTtfb}ms</strong></span>
                </div>
            </div>`;
        }).join('');
    }

    // TTFB Chart
    const ttfbData = logs.slice(0, 50).reverse();
    const ctx = document.getElementById('ttfbChart')?.getContext('2d');
    if (ctx) {
        if (ttfbChart) ttfbChart.destroy();
        ttfbChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ttfbData.map(l => new Date(l.checked_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })),
                datasets: [{ label: 'TTFB (ms)', data: ttfbData.map(l => l.ttfb_ms || 0), borderColor: '#C9A961', backgroundColor: 'rgba(201,169,97,.1)', tension: 0.3, pointRadius: 2 }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { font: { size: 10 } } }, x: { ticks: { font: { size: 9 }, maxTicksLimit: 10 } } } }
        });
    }
}

// ═══════════════════════════════════════════════════════════════
//  E-BOOK DOWNLOADS
// ═══════════════════════════════════════════════════════════════
function renderEbookDownloads() {
    let data = [...allEbookDownloads];
    const source = document.getElementById('filterEbookSource')?.value || 'all';
    const period = document.getElementById('filterEbookPeriod')?.value || 'all';
    const search = (document.getElementById('filterEbookSearch')?.value || '').toLowerCase();

    if (source !== 'all') data = data.filter(e => e.source === source || e.download_source === source);
    if (period !== 'all') {
        const days = parseInt(period);
        data = filterByPeriod(data, days);
    }
    if (search) data = data.filter(e => (e.email || '').toLowerCase().includes(search) || (e.name || '').toLowerCase().includes(search));

    const now = new Date();
    setText('kpiEbookTotal', allEbookDownloads.length);
    setText('kpiEbook24h',   allEbookDownloads.filter(e => new Date(e.created_at) > new Date(now - 86400000)).length);
    setText('kpiEbook7d',    allEbookDownloads.filter(e => new Date(e.created_at) > new Date(now - 7 * 86400000)).length);
    setText('kpiEbook30d',   allEbookDownloads.filter(e => new Date(e.created_at) > new Date(now - 30 * 86400000)).length);
    setText('ebookCount',    `${data.length} downloads`);

    const tbody = document.getElementById('ebookTable');
    if (!tbody) return;

    if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhum download encontrado</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(e => {
        const date = new Date(e.created_at).toLocaleDateString('pt-PT');
        return `
        <tr>
            <td style="font-size:12px;color:var(--text-muted);">${date}</td>
            <td style="font-size:12px;">${e.email || '—'}</td>
            <td>${e.name || '—'}</td>
            <td><span class="badge badge-secondary">${e.source || e.download_source || '—'}</span></td>
            <td><span class="badge ${e.email_sent ? 'badge-success' : 'badge-secondary'}">${e.email_sent ? 'Enviado' : 'Pendente'}</span></td>
        </tr>`;
    }).join('');
}

function exportEbookCSV() {
    const rows = [['Data','Email','Nome','Source','Estado']];
    allEbookDownloads.forEach(e => rows.push([e.created_at?.slice(0,10), e.email||'', e.name||'', e.source||'', e.email_sent ? 'Enviado' : 'Pendente']));
    downloadCSV(rows, 'ebook_downloads.csv');
}

// ═══════════════════════════════════════════════════════════════
//  JOB SEARCH TRACKING
// ═══════════════════════════════════════════════════════════════
function renderJobSearch() {
    const data = allJobSearch;
    const now  = new Date();

    setText('kpiJobTotal',       data.length);
    setText('kpiJobWithJob',     data.filter(j => j.has_job_offer || j.job_offer_found).length);
    setText('kpiJobNoJob',       data.filter(j => !j.has_job_offer && !j.job_offer_found).length);
    setText('kpiJobUniqueRoles', new Set(data.map(j => j.detected_role || j.job_title || '').filter(Boolean)).size);
    setText('kpiJob7d',          data.filter(j => new Date(j.created_at) > new Date(now - 7 * 86400000)).length);

    // Populate seniority filter
    const senSet = new Set(data.map(j => j.seniority).filter(Boolean));
    populateSelect('filterJobSeniority', [...senSet].sort());

    renderJobSearchTable();
    renderJobSearchCharts();
}

function renderJobSearchTable() {
    let data = [...allJobSearch];
    const sen    = document.getElementById('filterJobSeniority')?.value || 'all';
    const period = document.getElementById('filterJobPeriod')?.value || 'all';
    const search = (document.getElementById('filterJobSearch')?.value || '').toLowerCase();

    if (sen !== 'all') data = data.filter(j => j.seniority === sen);
    if (period !== 'all') data = filterByPeriod(data, parseInt(period));
    if (search) data = data.filter(j => (j.detected_role || j.job_title || '').toLowerCase().includes(search) || (j.user_name || '').toLowerCase().includes(search));

    setText('jobSearchCount', `${data.length} pesquisas`);

    const tbody = document.getElementById('jobSearchTable');
    if (!tbody) return;

    if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhuma pesquisa encontrada</td></tr>`;
        return;
    }

    tbody.innerHTML = data.slice(0, 100).map(j => {
        const date  = new Date(j.created_at).toLocaleDateString('pt-PT');
        const skills = Array.isArray(j.top_skills) ? j.top_skills.slice(0, 3).join(', ') : (j.top_skills || '—');
        const hasJob = j.has_job_offer || j.job_offer_found;
        return `
        <tr>
            <td style="font-size:12px;color:var(--text-muted);">${date}</td>
            <td style="font-size:12px;">${j.user_name || '—'}</td>
            <td style="font-size:12px;font-weight:500;">${j.detected_role || j.job_title || '—'}</td>
            <td><span class="badge badge-secondary">${j.seniority || '—'}</span></td>
            <td style="font-size:11px;color:var(--text-muted);">${skills}</td>
            <td><span class="badge ${hasJob ? 'badge-success' : 'badge-secondary'}">${hasJob ? 'Sim' : 'Não'}</span></td>
            <td style="font-size:12px;">${j.ats_score || '—'}</td>
        </tr>`;
    }).join('');
}

function renderJobSearchCharts() {
    const data = allJobSearch;

    // Top Roles
    const roleCount = {};
    data.forEach(j => { const r = j.detected_role || j.job_title; if (r) roleCount[r] = (roleCount[r] || 0) + 1; });
    const topRoles = Object.entries(roleCount).sort((a, b) => b[1] - a[1]).slice(0, 10);

    const ctx1 = document.getElementById('chartTopRoles')?.getContext('2d');
    if (ctx1) new Chart(ctx1, {
        type: 'bar',
        data: { labels: topRoles.map(r => r[0]), datasets: [{ data: topRoles.map(r => r[1]), backgroundColor: '#C9A961', borderRadius: 3 }] },
        options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { size: 10 } } }, y: { ticks: { font: { size: 10 } } } } }
    });

    // Seniority
    const senCount = {};
    data.forEach(j => { const s = j.seniority; if (s) senCount[s] = (senCount[s] || 0) + 1; });
    const ctx2 = document.getElementById('chartSeniority')?.getContext('2d');
    if (ctx2) new Chart(ctx2, {
        type: 'doughnut',
        data: { labels: Object.keys(senCount), datasets: [{ data: Object.values(senCount), backgroundColor: ['#C9A961','#3B82F6','#10B981','#7C3AED','#F59E0B'], borderWidth: 0 }] },
        options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } } }
    });

    // Top Skills
    const skillCount = {};
    data.forEach(j => {
        const skills = Array.isArray(j.top_skills) ? j.top_skills : [];
        skills.forEach(s => { if (s) skillCount[s] = (skillCount[s] || 0) + 1; });
    });
    const topSkills = Object.entries(skillCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const ctx3 = document.getElementById('chartTopSkills')?.getContext('2d');
    if (ctx3) new Chart(ctx3, {
        type: 'bar',
        data: { labels: topSkills.map(s => s[0]), datasets: [{ data: topSkills.map(s => s[1]), backgroundColor: '#3B82F6', borderRadius: 3 }] },
        options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { size: 10 } } }, y: { ticks: { font: { size: 10 } } } } }
    });

    // Keyword Gaps
    const gapCount = {};
    data.forEach(j => {
        const gaps = Array.isArray(j.keyword_gaps) ? j.keyword_gaps : [];
        gaps.forEach(g => { if (g) gapCount[g] = (gapCount[g] || 0) + 1; });
    });
    const topGaps = Object.entries(gapCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const ctx4 = document.getElementById('chartKeywordGaps')?.getContext('2d');
    if (ctx4) new Chart(ctx4, {
        type: 'bar',
        data: { labels: topGaps.map(g => g[0]), datasets: [{ data: topGaps.map(g => g[1]), backgroundColor: '#EF4444', borderRadius: 3 }] },
        options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { size: 10 } } }, y: { ticks: { font: { size: 10 } } } } }
    });
}

function exportJobSearchCSV() {
    const rows = [['Data','Nome','Cargo','Senioridade','Skills','Com Vaga','ATS Score']];
    allJobSearch.forEach(j => rows.push([
        j.created_at?.slice(0,10), j.user_name||'', j.detected_role||j.job_title||'',
        j.seniority||'',
        Array.isArray(j.top_skills) ? j.top_skills.join(';') : '',
        j.has_job_offer || j.job_offer_found ? 'Sim' : 'Não',
        j.ats_score||''
    ]));
    downloadCSV(rows, 'job_search.csv');
}

// ═══════════════════════════════════════════════════════════════
//  CAREER ENERGY
// ═══════════════════════════════════════════════════════════════
function renderCareerEnergy() {
    const data = allCareerEnergy;

    const scores = data.filter(d => d.total_score > 0).map(d => d.total_score);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const countries = new Set(data.map(d => d.country).filter(Boolean));
    const linkedin  = data.filter(d => d.linkedin_shared).length;

    setText('kpiCETotal',     data.length);
    setText('kpiCEAvg',       avgScore);
    setText('kpiCEAboveAvg',  data.filter(d => d.total_score > (d.country_avg || 50)).length);
    setText('kpiCECountries', countries.size);
    setText('kpiCELinkedIn',  linkedin);

    // Populate filters
    populateSelect('filterCECountry', [...countries].sort());
    const levels = new Set(data.map(d => d.energy_level || d.level).filter(Boolean));
    populateSelect('filterCELevel', [...levels].sort());

    renderCETable();
    renderCECharts();
}

function renderCETable() {
    let data = [...allCareerEnergy];
    const country = document.getElementById('filterCECountry')?.value || 'all';
    const level   = document.getElementById('filterCELevel')?.value || 'all';

    if (country !== 'all') data = data.filter(d => d.country === country);
    if (level   !== 'all') data = data.filter(d => (d.energy_level || d.level) === level);

    setText('ceCount', `${data.length} diagnósticos`);

    const tbody = document.getElementById('ceTable');
    if (!tbody) return;

    if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhum diagnóstico encontrado</td></tr>`;
        return;
    }

    tbody.innerHTML = data.slice(0, 100).map(d => {
        const date  = new Date(d.created_at).toLocaleDateString('pt-PT');
        const diff  = d.total_score && d.country_avg ? (d.total_score - d.country_avg).toFixed(1) : '—';
        const diffColor = parseFloat(diff) > 0 ? 'var(--green)' : 'var(--red)';
        return `
        <tr>
            <td style="font-size:12px;color:var(--text-muted);">${date}</td>
            <td style="font-size:12px;">${d.name || d.user_name || '—'}</td>
            <td style="font-size:12px;">${d.job_title || d.role || '—'}</td>
            <td style="font-size:12px;">${d.country || '—'}</td>
            <td style="font-size:13px;font-weight:700;color:var(--gold);">${d.total_score || '—'}</td>
            <td><span class="badge badge-teal">${d.energy_level || d.level || '—'}</span></td>
            <td style="font-size:12px;">${d.country_avg || '—'}</td>
            <td style="font-size:12px;font-weight:600;color:${diffColor};">${diff !== '—' ? (parseFloat(diff) > 0 ? '+' : '') + diff : '—'}</td>
        </tr>`;
    }).join('');
}

function renderCECharts() {
    const data = allCareerEnergy;

    // Score Distribution
    const buckets = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
    data.filter(d => d.total_score > 0).forEach(d => {
        const s = d.total_score;
        if (s <= 20) buckets['0-20']++;
        else if (s <= 40) buckets['21-40']++;
        else if (s <= 60) buckets['41-60']++;
        else if (s <= 80) buckets['61-80']++;
        else buckets['81-100']++;
    });
    const ctx1 = document.getElementById('ceScoreChart')?.getContext('2d');
    if (ctx1) {
        if (ceScoreChart) ceScoreChart.destroy();
        ceScoreChart = new Chart(ctx1, {
            type: 'bar',
            data: { labels: Object.keys(buckets), datasets: [{ label: 'Utilizadores', data: Object.values(buckets), backgroundColor: '#C9A961', borderRadius: 4 }] },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } } }
        });
    }

    // Scatter: Score vs Country Happiness
    const scatterData = data.filter(d => d.total_score > 0 && d.country_avg > 0).map(d => ({ x: d.country_avg, y: d.total_score }));
    const ctx2 = document.getElementById('ceScatterChart')?.getContext('2d');
    if (ctx2) new Chart(ctx2, {
        type: 'scatter',
        data: { datasets: [{ label: 'Score vs Felicidade País', data: scatterData, backgroundColor: 'rgba(201,169,97,.6)', pointRadius: 5 }] },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { title: { display: true, text: 'Felicidade País', font: { size: 10 } }, ticks: { font: { size: 10 } } }, y: { title: { display: true, text: 'Career Energy Score', font: { size: 10 } }, ticks: { font: { size: 10 } } } } }
    });
}

function exportCECSV() {
    const rows = [['Data','Nome','Cargo','País','Score','Nível','Média País','Diferença']];
    allCareerEnergy.forEach(d => rows.push([
        d.created_at?.slice(0,10), d.name||d.user_name||'', d.job_title||d.role||'',
        d.country||'', d.total_score||'', d.energy_level||d.level||'',
        d.country_avg||'',
        d.total_score && d.country_avg ? (d.total_score - d.country_avg).toFixed(1) : ''
    ]));
    downloadCSV(rows, 'career_energy.csv');
}

// ═══════════════════════════════════════════════════════════════
//  PAGINATION HELPER
// ═══════════════════════════════════════════════════════════════
function renderPagination(containerId, current, total, onPage) {
    const el = document.getElementById(containerId);
    if (!el || total <= 1) { if (el) el.innerHTML = ''; return; }

    let html = '';
    if (current > 1) html += `<button class="page-btn" onclick="(${onPage.toString()})(${current - 1})">‹</button>`;

    const start = Math.max(1, current - 2);
    const end   = Math.min(total, current + 2);
    if (start > 1) html += `<button class="page-btn" onclick="(${onPage.toString()})(1)">1</button>${start > 2 ? '<span style="padding:4px;">…</span>' : ''}`;
    for (let i = start; i <= end; i++) {
        html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="(${onPage.toString()})(${i})">${i}</button>`;
    }
    if (end < total) html += `${end < total - 1 ? '<span style="padding:4px;">…</span>' : ''}<button class="page-btn" onclick="(${onPage.toString()})(${total})">${total}</button>`;
    if (current < total) html += `<button class="page-btn" onclick="(${onPage.toString()})(${current + 1})">›</button>`;

    el.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════
//  CSV DOWNLOAD
// ═══════════════════════════════════════════════════════════════
function downloadCSV(rows, filename) {
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════
//  REFRESH
// ═══════════════════════════════════════════════════════════════
async function refreshAll() {
    showToast('A atualizar dados...', 'info');
    await Promise.all([loadAllData(), loadEmailHistory(), loadHealthLogs(), loadAffiliateData(), loadCouponData(), loadUsersData()]);
    updateDashboard();
    updateCharts();
    // Re-render active tab
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) activeTab.click();
    showToast('Dados atualizados!', 'success');
}

// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════
async function init() {
    // Show dashboard tab
    document.getElementById('tab-dashboard').style.display = '';
    document.querySelectorAll('.main > div[id^="tab-"]:not(#tab-dashboard)').forEach(el => el.style.display = 'none');

    await Promise.all([loadAllData(), loadEmailHistory(), loadHealthLogs(), loadAffiliateData(), loadCouponData(), loadUsersData()]);
    updateDashboard();
    updateCharts();
    renderNurturingSegments();
}

document.addEventListener('DOMContentLoaded', init);

// ═══════════════════════════════════════════════════════════════
//  AFFILIATES MODULE
// ═══════════════════════════════════════════════════════════════
let allAffiliates = [];
let allAffClicks = [];
let allAffConversions = [];

async function loadAffiliateData() {
    try {
        const [affiliates, clicks, conversions] = await Promise.all([
            supaFetch('affiliates', 'select=*&order=created_at.desc'),
            supaFetch('affiliate_clicks', 'select=*&order=created_at.desc&limit=5000'),
            supaFetch('affiliate_conversions', 'select=*&order=created_at.desc&limit=5000')
        ]);
        allAffiliates = Array.isArray(affiliates) ? affiliates : [];
        allAffClicks = Array.isArray(clicks) ? clicks : [];
        allAffConversions = Array.isArray(conversions) ? conversions : [];
    } catch (e) {
        console.error('Erro ao carregar dados de afiliados:', e);
    }
}

function renderAffiliates() {
    loadAffiliateData().then(() => {
        renderAffKPIs();
        renderAffTable();
        renderAffClicks();
        renderAffConversions();
        populateAffClickFilter();
    });
}

function renderAffKPIs() {
    const active = allAffiliates.filter(a => a.active);
    const totalClicks = allAffClicks.length;
    const totalSales = allAffConversions.length;
    const totalRevenue = allAffConversions.reduce((s, c) => s + parseFloat(c.amount || 0), 0);
    const convRate = totalClicks > 0 ? ((totalSales / totalClicks) * 100).toFixed(1) + '%' : '0%';

    document.getElementById('affKpiTotal').textContent = active.length;
    document.getElementById('affKpiClicks').textContent = totalClicks;
    document.getElementById('affKpiSales').textContent = totalSales;
    document.getElementById('affKpiRevenue').textContent = '€' + totalRevenue.toFixed(2);
    document.getElementById('affKpiConvRate').textContent = convRate;
}

function renderAffTable() {
    const tbody = document.getElementById('affTable');
    if (!allAffiliates.length) {
        tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhum afiliado criado. Clica em "Novo Afiliado" para começar.</td></tr>';
        return;
    }

    tbody.innerHTML = allAffiliates.map(aff => {
        const clicks = allAffClicks.filter(c => c.affiliate_code === aff.code).length;
        const conversions = allAffConversions.filter(c => c.affiliate_code === aff.code);
        const sales = conversions.length;
        const revenue = conversions.reduce((s, c) => s + parseFloat(c.amount || 0), 0);
        const convRate = clicks > 0 ? ((sales / clicks) * 100).toFixed(1) + '%' : '—';
        const status = aff.active
            ? '<span class="badge badge-success">Ativo</span>'
            : '<span class="badge badge-danger">Inativo</span>';
        const date = new Date(aff.created_at).toLocaleDateString('pt-PT');
        const baseUrl = 'https://www.share2inspire.pt';
        const product = aff.product || 'cv-analyser';
        const productLabels = {'cv-analyser':'CV Analyser','career-path':'Career Path','linkedin-roaster':'LinkedIn Roaster'};
        const productColors = {'cv-analyser':'var(--blue)','career-path':'var(--gold)','linkedin-roaster':'#0077B5'};
        const products = product.split(',');
        const badges = products.map(p => `<span class="badge" style="background:${productColors[p]||'var(--blue)'};color:#fff;font-size:10px;margin:1px;">${esc(productLabels[p]||p)}</span>`).join(' ');

        return `<tr>
            <td><strong>${esc(aff.name)}</strong>${aff.email ? '<br><span style="font-size:11px;color:var(--text-muted);">' + esc(aff.email) + '</span>' : ''}</td>
            <td>${badges}</td>
            <td><code style="background:#F3F4F6;padding:2px 6px;border-radius:4px;font-size:12px;">${esc(aff.code)}</code></td>
            <td><button class="btn btn-outline btn-sm" onclick="copyAffLink('${esc(aff.code)}','${esc(product)}')" title="Copiar links"><i class="fas fa-copy"></i></button></td>
            <td><strong>${clicks}</strong></td>
            <td><strong class="green">${sales}</strong></td>
            <td><strong>€${revenue.toFixed(2)}</strong></td>
            <td>${convRate}</td>
            <td>${aff.commission_pct || 0}%</td>
            <td>${status}</td>
            <td>${date}</td>
            <td>
                <button class="btn-icon" onclick="editAffiliate('${aff.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn-icon" onclick="toggleAffiliate('${aff.id}', ${aff.active})" title="${aff.active ? 'Desativar' : 'Ativar'}"><i class="fas fa-${aff.active ? 'pause' : 'play'}"></i></button>
            </td>
        </tr>`;
    }).join('');
}

function renderAffClicks() {
    const tbody = document.getElementById('affClicksTable');
    const filterCode = document.getElementById('filterAffClickCode')?.value || 'all';
    let clicks = [...allAffClicks];
    if (filterCode !== 'all') clicks = clicks.filter(c => c.affiliate_code === filterCode);
    clicks = clicks.slice(0, 100); // Show last 100

    if (!clicks.length) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted);">Sem cliques registados.</td></tr>';
        return;
    }

    tbody.innerHTML = clicks.map(c => {
        const date = new Date(c.created_at).toLocaleString('pt-PT', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
        const referrer = c.referrer ? new URL(c.referrer).hostname : '—';
        return `<tr>
            <td>${date}</td>
            <td><code style="font-size:11px;">${esc(c.affiliate_code)}</code></td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(c.landing_page || '')}">${esc(c.landing_page || '—')}</td>
            <td><span class="badge badge-secondary">${esc(c.device_type || '—')}</span></td>
            <td>${esc(c.browser || '—')}</td>
            <td>${esc(c.os || '—')}</td>
            <td>${esc(c.screen_resolution || '—')}</td>
            <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;" title="${esc(c.referrer || '')}">${referrer}</td>
            <td>${esc(c.utm_source || '—')}</td>
        </tr>`;
    }).join('');
}

function renderAffConversions() {
    const tbody = document.getElementById('affConversionsTable');
    const conversions = allAffConversions.slice(0, 100);

    if (!conversions.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">Sem conversões registadas.</td></tr>';
        return;
    }

    tbody.innerHTML = conversions.map(c => {
        const date = new Date(c.created_at).toLocaleString('pt-PT', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
        const productBadge = c.product === 'career_path'
            ? '<span class="badge badge-career">Career Path</span>'
            : c.product === 'bundle'
            ? '<span class="badge badge-purple">Bundle</span>'
            : c.product === 'linkedin-roaster' || c.product === 'linkedin_roaster'
            ? '<span class="badge" style="background:#0077B5;color:#fff;">LinkedIn Roaster</span>'
            : '<span class="badge badge-cv">CV Analyser</span>';
        return `<tr>
            <td>${date}</td>
            <td><code style="font-size:11px;">${esc(c.affiliate_code)}</code></td>
            <td>${productBadge}</td>
            <td><strong>€${parseFloat(c.amount).toFixed(2)}</strong></td>
            <td>${c.currency || 'EUR'}</td>
            <td>${esc(c.payment_method || '—')}</td>
            <td>${esc(c.customer_email || '—')}</td>
            <td style="font-size:11px;">${esc(c.transaction_id || '—')}</td>
        </tr>`;
    }).join('');
}

function populateAffClickFilter() {
    const select = document.getElementById('filterAffClickCode');
    if (!select) return;
    const codes = [...new Set(allAffClicks.map(c => c.affiliate_code))];
    select.innerHTML = '<option value="all">Todos</option>' + codes.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
}

// ── Affiliate CRUD ──────────────────────────────────────────

function getSelectedProducts() {
    return [...document.querySelectorAll('.aff-product-cb:checked')].map(cb => cb.value);
}

function updateAffLinkPreview() {
    const products = getSelectedProducts();
    const code = document.getElementById('affCode').value.trim().toLowerCase();
    const el = document.getElementById('affLinkPreview');
    if (!products.length) {
        el.innerHTML = '<span style="color:var(--red);">Seleciona pelo menos um produto</span>';
        return;
    }
    const productLabels = {'cv-analyser':'CV Analyser','career-path':'Career Path','linkedin-roaster':'LinkedIn Roaster'};
    const slug = code || '...';
    el.innerHTML = products.map(p => {
        const links = [`share2inspire.pt/${p}?ref=${slug}`];
        if (p !== 'linkedin-roaster') links.push(`share2inspire.pt/en/${p}?ref=${slug}`);
        return `<div style="margin-bottom:4px;"><strong style="color:var(--dark);">${productLabels[p]}:</strong><br>${links.map(l => `<span style="color:var(--blue);">${l}</span>`).join(' &middot; ')}</div>`;
    }).join('');
}

function setProductCheckboxes(products) {
    const list = Array.isArray(products) ? products : (products ? products.split(',') : ['cv-analyser']);
    document.querySelectorAll('.aff-product-cb').forEach(cb => {
        cb.checked = list.includes(cb.value);
    });
}

function openCreateAffiliateModal() {
    document.getElementById('affEditId').value = '';
    document.getElementById('affName').value = '';
    document.getElementById('affEmail').value = '';
    setProductCheckboxes(['cv-analyser']);
    document.getElementById('affCode').value = '';
    document.getElementById('affCommission').value = '0';
    document.getElementById('affNotes').value = '';
    document.getElementById('affModalTitle').textContent = 'Novo Afiliado';
    updateAffLinkPreview();
    document.getElementById('affModalOverlay').style.display = 'flex';
    document.getElementById('affCode').oninput = function() {
        const code = this.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
        this.value = code;
        updateAffLinkPreview();
    };
}

function closeAffiliateModal() {
    document.getElementById('affModalOverlay').style.display = 'none';
}

function editAffiliate(id) {
    const aff = allAffiliates.find(a => a.id === id);
    if (!aff) return;
    document.getElementById('affEditId').value = aff.id;
    document.getElementById('affName').value = aff.name || '';
    document.getElementById('affEmail').value = aff.email || '';
    // Support both old single-product and new multi-product (comma-separated)
    const products = (aff.product || 'cv-analyser').split(',');
    setProductCheckboxes(products);
    document.getElementById('affCode').value = aff.code || '';
    document.getElementById('affCommission').value = aff.commission_pct || 0;
    document.getElementById('affNotes').value = aff.notes || '';
    document.getElementById('affModalTitle').textContent = 'Editar Afiliado';
    updateAffLinkPreview();
    document.getElementById('affModalOverlay').style.display = 'flex';
    document.getElementById('affCode').oninput = function() {
        const code = this.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
        this.value = code;
        updateAffLinkPreview();
    };
}

async function saveAffiliate() {
    const editId = document.getElementById('affEditId').value;
    const name = document.getElementById('affName').value.trim();
    const email = document.getElementById('affEmail').value.trim();
    const code = document.getElementById('affCode').value.trim().toLowerCase();
    const products = getSelectedProducts();
    const product = products.join(',');  // Store as comma-separated
    const commission = parseFloat(document.getElementById('affCommission').value) || 0;
    const notes = document.getElementById('affNotes').value.trim();

    if (!name) { showToast('Nome é obrigatório', 'danger'); return; }
    if (!code) { showToast('Código é obrigatório', 'danger'); return; }
    if (!products.length) { showToast('Seleciona pelo menos um produto', 'danger'); return; }
    if (!/^[a-z0-9_-]+$/.test(code)) { showToast('Código só pode conter letras minúsculas, números, - e _', 'danger'); return; }

    try {
        if (editId) {
            await supaUpdate('affiliates', editId, { name, email: email || null, code, product, commission_pct: commission, notes: notes || null });
            showToast('Afiliado atualizado!', 'success');
        } else {
            await supaInsert('affiliates', { name, email: email || null, code, product, commission_pct: commission, notes: notes || null, active: true });
            const productLabels = {'cv-analyser':'CV Analyser','career-path':'Career Path','linkedin-roaster':'LinkedIn Roaster'};
            const labels = products.map(p => productLabels[p] || p).join(', ');
            showToast(`Afiliado criado para ${labels}!`, 'success');
        }
        closeAffiliateModal();
        renderAffiliates();
    } catch (e) {
        console.error('Erro ao guardar afiliado:', e);
        showToast('Erro ao guardar: ' + (e.message || 'código duplicado?'), 'danger');
    }
}

async function toggleAffiliate(id, currentActive) {
    try {
        await supaUpdate('affiliates', id, { active: !currentActive });
        showToast(currentActive ? 'Afiliado desativado' : 'Afiliado ativado', 'success');
        renderAffiliates();
    } catch (e) {
        showToast('Erro ao alterar estado', 'danger');
    }
}

function copyAffLink(code, product) {
    product = product || 'cv-analyser';
    const base = 'https://www.share2inspire.pt';
    const productLabels = {'cv-analyser':'CV Analyser','career-path':'Career Path','linkedin-roaster':'LinkedIn Roaster'};
    // Support comma-separated multi-product
    const products = product.split(',');
    const allLinks = [];
    products.forEach(p => {
        allLinks.push(`${base}/${p}?ref=${code}`);
        if (p !== 'linkedin-roaster') {
            allLinks.push(`${base}/en/${p}?ref=${code}`);
        }
    });
    const text = allLinks.join('\n');
    const labels = products.map(p => productLabels[p] || p).join(', ');
    navigator.clipboard.writeText(text).then(() => {
        showToast(`${allLinks.length} link${allLinks.length > 1 ? 's' : ''} copiado${allLinks.length > 1 ? 's' : ''} (${labels})`, 'success');
    }).catch(() => {
        prompt('Copia os links:', text);
    });
}

// ── CSV Exports ─────────────────────────────────────────────

function exportAffClicksCSV() {
    const filterCode = document.getElementById('filterAffClickCode')?.value || 'all';
    let clicks = [...allAffClicks];
    if (filterCode !== 'all') clicks = clicks.filter(c => c.affiliate_code === filterCode);

    const header = ['Data','Afiliado','Página','Dispositivo','Browser','OS','Resolução','Referrer','UTM Source','UTM Medium','UTM Campaign','Session ID'];
    const rows = clicks.map(c => [
        new Date(c.created_at).toISOString(), c.affiliate_code || '', c.landing_page || '',
        c.device_type || '', c.browser || '', c.os || '', c.screen_resolution || '',
        c.referrer || '', c.utm_source || '', c.utm_medium || '', c.utm_campaign || '', c.session_id || ''
    ]);
    downloadCSV([header, ...rows], `affiliate_clicks_${new Date().toISOString().slice(0,10)}.csv`);
}

function exportAffConversionsCSV() {
    const header = ['Data','Afiliado','Produto','Valor','Moeda','Método','Email Cliente','Transação'];
    const rows = allAffConversions.map(c => [
        new Date(c.created_at).toISOString(), c.affiliate_code || '', c.product || '',
        c.amount || '', c.currency || '', c.payment_method || '', c.customer_email || '', c.transaction_id || ''
    ]);
    downloadCSV([header, ...rows], `affiliate_conversions_${new Date().toISOString().slice(0,10)}.csv`);
}

// ── HTML escape helper ──────────────────────────────────────
function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}


// ═══════════════════════════════════════════════════════════════
//  DISCOUNT COUPONS MODULE
// ═══════════════════════════════════════════════════════════════
let allCoupons = [];

async function loadCouponData() {
    try {
        const coupons = await supaFetch('discount_coupons', 'select=*&order=created_at.desc');
        allCoupons = Array.isArray(coupons) ? coupons : [];
    } catch (e) {
        console.error('Erro ao carregar cupões:', e);
    }
}

function renderCoupons() {
    const statusFilter = document.getElementById('filterCouponStatus')?.value || 'all';
    const searchFilter = (document.getElementById('filterCouponSearch')?.value || '').toLowerCase();

    let filtered = allCoupons.filter(c => {
        if (statusFilter === 'active' && !c.is_active) return false;
        if (statusFilter === 'inactive' && c.is_active) return false;
        if (searchFilter) {
            const match = (c.code || '').toLowerCase().includes(searchFilter) ||
                          (c.partner_name || '').toLowerCase().includes(searchFilter) ||
                          (c.description || '').toLowerCase().includes(searchFilter);
            if (!match) return false;
        }
        return true;
    });

    // KPIs
    const active = allCoupons.filter(c => c.is_active);
    const totalUses = allCoupons.reduce((s, c) => s + (c.current_uses || 0), 0);
    const avgDiscount = allCoupons.length > 0
        ? (allCoupons.reduce((s, c) => s + (c.discount_percent || 0), 0) / allCoupons.length).toFixed(0)
        : 0;

    document.getElementById('couponKpiActive').textContent = active.length;
    document.getElementById('couponKpiUses').textContent = totalUses;
    document.getElementById('couponKpiAvgDiscount').textContent = avgDiscount + '%';
    document.getElementById('couponKpiTotal').textContent = allCoupons.length;

    // Table
    const tbody = document.getElementById('couponsTable');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhum cupão encontrado</td></tr>';
        return;
    }

    const productLabels = {
        'cv_analysis': '<span class="badge" style="background:var(--blue);color:#fff;font-size:10px;">CV</span>',
        'career_path': '<span class="badge" style="background:var(--gold);color:#fff;font-size:10px;">Career</span>',
        'bundle': '<span class="badge" style="background:var(--purple);color:#fff;font-size:10px;">Bundle</span>',
        'linkedin_roaster': '<span class="badge" style="background:#0077B5;color:#fff;font-size:10px;">Roaster</span>'
    };

    tbody.innerHTML = filtered.map(c => {
        const products = (c.applicable_products || []).map(p => productLabels[p] || esc(p)).join(' ');
        const uses = c.current_uses || 0;
        const maxUses = c.max_uses ? c.max_uses : '<span style="color:var(--text-muted);">∞</span>';
        const validUntil = c.valid_until
            ? new Date(c.valid_until).toLocaleDateString('pt-PT')
            : '<span style="color:var(--text-muted);">Sem limite</span>';
        const isExpired = c.valid_until && new Date(c.valid_until) < new Date();
        const statusBadge = c.is_active && !isExpired
            ? '<span class="badge" style="background:var(--green);color:#fff;">Ativo</span>'
            : '<span class="badge" style="background:var(--danger);color:#fff;">' + (isExpired ? 'Expirado' : 'Inativo') + '</span>';
        const created = new Date(c.created_at).toLocaleDateString('pt-PT');

        return `<tr>
            <td><code style="font-size:12px;font-weight:600;letter-spacing:1px;">${esc(c.code)}</code></td>
            <td>${esc(c.partner_name) || '<span style="color:var(--text-muted);">—</span>'}</td>
            <td><span style="font-weight:600;color:var(--green);">${c.discount_percent}%</span></td>
            <td>${products}</td>
            <td>${uses}</td>
            <td>${maxUses}</td>
            <td>${validUntil}</td>
            <td>${statusBadge}</td>
            <td>${created}</td>
            <td>
                <div style="display:flex;gap:4px;">
                    <button class="btn btn-outline btn-sm" onclick="editCoupon('${c.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-outline btn-sm" onclick="toggleCoupon('${c.id}', ${c.is_active})" title="${c.is_active ? 'Desativar' : 'Ativar'}">
                        <i class="fas fa-${c.is_active ? 'pause' : 'play'}"></i>
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="copyCouponCode('${esc(c.code)}')" title="Copiar código"><i class="fas fa-copy"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function openCreateCouponModal() {
    document.getElementById('couponModalTitle').textContent = 'Novo Cupão de Desconto';
    document.getElementById('couponEditId').value = '';
    document.getElementById('couponCodeInput').value = '';
    document.getElementById('couponPartnerName').value = '';
    document.getElementById('couponDiscount').value = '';
    document.getElementById('couponDescription').value = '';
    document.getElementById('couponMaxUses').value = '';
    document.getElementById('couponValidUntil').value = '';
    document.getElementById('couponCodeInput').disabled = false;
    // Reset all product checkboxes to checked
    document.querySelectorAll('.coupon-product-cb').forEach(cb => cb.checked = true);
    document.getElementById('couponModalOverlay').style.display = 'flex';
}

function closeCouponModal() {
    document.getElementById('couponModalOverlay').style.display = 'none';
}

function editCoupon(id) {
    const c = allCoupons.find(x => x.id === id);
    if (!c) return;
    document.getElementById('couponModalTitle').textContent = 'Editar Cupão';
    document.getElementById('couponEditId').value = c.id;
    document.getElementById('couponCodeInput').value = c.code || '';
    document.getElementById('couponCodeInput').disabled = true; // Code cannot be changed
    document.getElementById('couponPartnerName').value = c.partner_name || '';
    document.getElementById('couponDiscount').value = c.discount_percent || '';
    document.getElementById('couponDescription').value = c.description || '';
    document.getElementById('couponMaxUses').value = c.max_uses || '';
    document.getElementById('couponValidUntil').value = c.valid_until ? c.valid_until.slice(0, 10) : '';
    // Set product checkboxes
    const products = c.applicable_products || [];
    document.querySelectorAll('.coupon-product-cb').forEach(cb => {
        cb.checked = products.includes(cb.value);
    });
    document.getElementById('couponModalOverlay').style.display = 'flex';
}

async function saveCoupon() {
    const editId = document.getElementById('couponEditId').value;
    const code = document.getElementById('couponCodeInput').value.trim().toUpperCase();
    const partnerName = document.getElementById('couponPartnerName').value.trim();
    const discount = parseInt(document.getElementById('couponDiscount').value);
    const description = document.getElementById('couponDescription').value.trim();
    const maxUses = document.getElementById('couponMaxUses').value ? parseInt(document.getElementById('couponMaxUses').value) : null;
    const validUntil = document.getElementById('couponValidUntil').value || null;
    const products = Array.from(document.querySelectorAll('.coupon-product-cb:checked')).map(cb => cb.value);

    // Validations
    if (!code) { showToast('O código do cupão é obrigatório', 'danger'); return; }
    if (!discount || discount < 1 || discount > 100) { showToast('O desconto deve ser entre 1% e 100%', 'danger'); return; }
    if (products.length === 0) { showToast('Seleciona pelo menos um produto', 'danger'); return; }

    // Check for duplicate code (only on create)
    if (!editId) {
        const existing = allCoupons.find(c => c.code === code);
        if (existing) { showToast('Já existe um cupão com este código', 'danger'); return; }
    }

    const data = {
        discount_percent: discount,
        partner_name: partnerName || null,
        description: description || null,
        applicable_products: products,
        max_uses: maxUses,
        valid_until: validUntil ? new Date(validUntil + 'T23:59:59Z').toISOString() : null
    };

    try {
        if (editId) {
            await supaUpdate('discount_coupons', editId, data);
            showToast('Cupão atualizado com sucesso', 'success');
        } else {
            data.code = code;
            data.is_active = true;
            data.current_uses = 0;
            await supaInsert('discount_coupons', data);
            showToast('Cupão criado com sucesso: ' + code, 'success');
        }
        closeCouponModal();
        await loadCouponData();
        renderCoupons();
    } catch (e) {
        console.error('Erro ao guardar cupão:', e);
        showToast('Erro ao guardar cupão', 'danger');
    }
}

async function toggleCoupon(id, currentActive) {
    const action = currentActive ? 'desativar' : 'ativar';
    if (!confirm(`Tens a certeza que queres ${action} este cupão?`)) return;
    try {
        await supaUpdate('discount_coupons', id, { is_active: !currentActive });
        showToast(`Cupão ${currentActive ? 'desativado' : 'ativado'} com sucesso`, 'success');
        await loadCouponData();
        renderCoupons();
    } catch (e) {
        console.error('Erro ao alterar estado do cupão:', e);
        showToast('Erro ao alterar estado do cupão', 'danger');
    }
}

function copyCouponCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        showToast('Código copiado: ' + code, 'success');
    }).catch(() => {
        // Fallback
        const el = document.createElement('textarea');
        el.value = code;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        showToast('Código copiado: ' + code, 'success');
    });
}


// ═══════════════════════════════════════════════════════════════
//  USERS & LICENSES MODULE
// ═══════════════════════════════════════════════════════════════

async function loadUsersData() {
    try {
        const [authUsers, profiles, subscriptions, userAnalyses] = await Promise.all([
            supaFetch('admin_auth_users', 'select=id,email,raw_user_meta_data,created_at,last_sign_in_at,email_confirmed_at&order=created_at.desc'),
            supaFetch('user_profiles', 'select=*&order=created_at.desc'),
            supaFetch('subscriptions', 'select=*&order=created_at.desc'),
            supaFetch('user_analyses', 'select=id,user_id,analysis_type,created_at&order=created_at.desc&limit=5000')
        ]);
        allAuthUsers    = Array.isArray(authUsers)    ? authUsers    : [];
        allUserProfiles = Array.isArray(profiles)     ? profiles     : [];
        allSubscriptions = Array.isArray(subscriptions) ? subscriptions : [];
        allUserAnalyses = Array.isArray(userAnalyses) ? userAnalyses : [];
    } catch (e) {
        console.error('Erro ao carregar dados de utilizadores:', e);
    }
}

function getMergedUsers() {
    return allAuthUsers.map(au => {
        const profile = allUserProfiles.find(p => p.id === au.id || p.user_id === au.id || p.email === au.email);
        const subs = allSubscriptions.filter(s => s.user_id === au.id);
        const activeSub = subs.find(s => s.status === 'active' && (!s.expires_at || new Date(s.expires_at) > new Date()));
        const analyses = allUserAnalyses.filter(a => a.user_id === au.id);
        const meta = au.raw_user_meta_data || {};

        return {
            id: au.id,
            email: au.email,
            first_name: profile?.first_name || meta.first_name || '',
            last_name: profile?.last_name || meta.last_name || '',
            phone: profile?.phone || '',
            linkedin_url: profile?.linkedin_url || '',
            avatar_url: profile?.avatar_url || '',
            cv_url: profile?.cv_url || '',
            cv_filename: profile?.cv_filename || '',
            address: profile?.address || '',
            email_confirmed: au.email_confirmed_at ? true : (meta.email_verified || false),
            created_at: au.created_at,
            last_sign_in_at: au.last_sign_in_at,
            active_sub: activeSub || null,
            all_subs: subs,
            analyses: analyses,
            analyses_count: analyses.length,
            cv_analyser_count: analyses.filter(a => a.analysis_type === 'cv_analyser').length,
            career_path_count: analyses.filter(a => a.analysis_type === 'career_path').length,
            linkedin_roaster_count: analyses.filter(a => a.analysis_type === 'linkedin_roaster').length,
            career_energy_count: analyses.filter(a => a.analysis_type === 'career_energy').length,
            profile_complete: !!(profile && profile.first_name && profile.last_name && profile.phone)
        };
    });
}

function renderUsers() {
    const users = getMergedUsers();

    // KPIs
    const totalUsers = users.length;
    const activeSubs = users.filter(u => u.active_sub).length;
    const totalSavedAnalyses = users.reduce((s, u) => s + u.analyses_count, 0);
    const subRevenue = allSubscriptions.reduce((s, sub) => s + (parseFloat(sub.price_eur) || 0), 0);
    const profilesComplete = users.filter(u => u.profile_complete).length;
    const lastReg = users.length > 0 ? new Date(users[0].created_at).toLocaleDateString('pt-PT') : '—';

    setText('usersKpiTotal', totalUsers);
    setText('usersKpiActiveSubs', activeSubs);
    setText('usersKpiSavedAnalyses', totalSavedAnalyses);
    setText('usersKpiRevenue', subRevenue > 0 ? subRevenue.toFixed(2) + '€' : '0€');
    setText('usersKpiComplete', `${profilesComplete}/${totalUsers}`);
    setText('usersKpiLastReg', lastReg);

    // Filters
    const statusFilter = document.getElementById('filterUserStatus')?.value || 'all';
    const searchFilter = (document.getElementById('filterUserSearch')?.value || '').toLowerCase();

    let filtered = [...users];
    if (statusFilter === 'active_sub') filtered = filtered.filter(u => u.active_sub);
    if (statusFilter === 'no_sub') filtered = filtered.filter(u => !u.active_sub && u.all_subs.length === 0);
    if (statusFilter === 'expired') filtered = filtered.filter(u => !u.active_sub && u.all_subs.length > 0);
    if (searchFilter) {
        filtered = filtered.filter(u => {
            const haystack = `${u.first_name} ${u.last_name} ${u.email} ${u.phone}`.toLowerCase();
            return haystack.includes(searchFilter);
        });
    }

    // Pagination
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
    usersPage = Math.min(usersPage, totalPages);
    const page = filtered.slice((usersPage - 1) * PAGE_SIZE, usersPage * PAGE_SIZE);

    const tbody = document.getElementById('usersTable');
    if (!tbody) return;

    if (!page.length) {
        tbody.innerHTML = `<tr><td colspan="12" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhum utilizador encontrado</td></tr>`;
        renderPagination('usersPagination', usersPage, totalPages, (p) => { usersPage = p; renderUsers(); });
        return;
    }

    tbody.innerHTML = page.map(u => {
        const name = `${u.first_name} ${u.last_name}`.trim() || '<span style="color:var(--text-muted);">—</span>';
        const emailBadge = u.email_confirmed
            ? '<i class="fas fa-check-circle" style="color:var(--green);font-size:10px;margin-left:4px;" title="Email verificado"></i>'
            : '<i class="fas fa-exclamation-circle" style="color:var(--orange);font-size:10px;margin-left:4px;" title="Email não verificado"></i>';
        const phone = u.phone || '<span style="color:var(--text-muted);">—</span>';
        const linkedin = u.linkedin_url
            ? `<a href="${u.linkedin_url}" target="_blank" style="color:var(--blue);font-size:12px;" title="${u.linkedin_url}"><i class="fab fa-linkedin"></i></a>`
            : '<span style="color:var(--text-muted);">—</span>';

        // Subscription
        let subBadge, planBadge, expireDate;
        if (u.active_sub) {
            subBadge = '<span class="badge badge-success">Ativa</span>';
            planBadge = `<span class="badge badge-paid">${u.active_sub.plan || '—'}</span>`;
            expireDate = u.active_sub.expires_at ? new Date(u.active_sub.expires_at).toLocaleDateString('pt-PT') : 'Sem limite';
        } else if (u.all_subs.length > 0) {
            subBadge = '<span class="badge badge-danger">Expirada</span>';
            const lastSub = u.all_subs[0];
            planBadge = `<span class="badge badge-secondary">${lastSub.plan || '—'}</span>`;
            expireDate = lastSub.expires_at ? new Date(lastSub.expires_at).toLocaleDateString('pt-PT') : '—';
        } else {
            subBadge = '<span class="badge badge-secondary">Nenhuma</span>';
            planBadge = '—';
            expireDate = '—';
        }

        // Analyses count with breakdown tooltip
        const analysesHtml = u.analyses_count > 0
            ? `<span style="font-weight:600;cursor:help;" title="CV: ${u.cv_analyser_count} | Career: ${u.career_path_count} | LinkedIn: ${u.linkedin_roaster_count}">${u.analyses_count}</span>`
            : '<span style="color:var(--text-muted);">0</span>';

        // CV
        const cvBadge = u.cv_filename
            ? `<span class="badge badge-teal" title="${u.cv_filename}"><i class="fas fa-file-pdf" style="margin-right:3px;"></i> Sim</span>`
            : '<span style="color:var(--text-muted);">—</span>';

        const regDate = new Date(u.created_at);
        const regStr = regDate.toLocaleDateString('pt-PT') + ' ' + regDate.toLocaleTimeString('pt-PT', {hour:'2-digit', minute:'2-digit'});
        const loginStr = u.last_sign_in_at
            ? new Date(u.last_sign_in_at).toLocaleDateString('pt-PT') + ' ' + new Date(u.last_sign_in_at).toLocaleTimeString('pt-PT', {hour:'2-digit', minute:'2-digit'})
            : '<span style="color:var(--text-muted);">Nunca</span>';

        return `
        <tr>
            <td style="font-weight:500;">${name}</td>
            <td style="font-size:12px;">${u.email}${emailBadge}</td>
            <td style="font-size:12px;">${phone}</td>
            <td>${linkedin}</td>
            <td>${subBadge}</td>
            <td>${planBadge}</td>
            <td style="font-size:12px;">${expireDate}</td>
            <td>${analysesHtml}</td>
            <td>${cvBadge}</td>
            <td style="font-size:11px;color:var(--text-muted);">${regStr}</td>
            <td style="font-size:11px;color:var(--text-muted);">${loginStr}</td>
            <td>
                <div style="display:flex;gap:4px;">
                    <button class="btn-icon" title="Ver Detalhes" onclick="showUserDetail('${u.id}')"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" title="Enviar Email" onclick="openEmailModal('${u.email}','${(u.first_name + ' ' + u.last_name).trim().replace(/'/g,"\\'")}')"><i class="fas fa-envelope"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');

    renderPagination('usersPagination', usersPage, totalPages, (p) => { usersPage = p; renderUsers(); });
}

function showUserDetail(userId) {
    const users = getMergedUsers();
    const u = users.find(x => x.id === userId);
    if (!u) return;

    const name = `${u.first_name} ${u.last_name}`.trim() || 'Sem nome';
    const emailStatus = u.email_confirmed ? '✓ Verificado' : '✗ Não verificado';
    const regDate = new Date(u.created_at).toLocaleString('pt-PT');
    const loginDate = u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString('pt-PT') : 'Nunca';

    // Subscription history
    let subsHtml = '';
    if (u.all_subs.length > 0) {
        subsHtml = `<table style="width:100%;margin-top:8px;font-size:12px;">
            <thead><tr><th>Plano</th><th>Estado</th><th>Preço</th><th>Método</th><th>Início</th><th>Expira</th></tr></thead>
            <tbody>${u.all_subs.map(s => `
                <tr>
                    <td><strong>${s.plan || '—'}</strong></td>
                    <td>${s.status === 'active' ? '<span class="badge badge-success">Ativa</span>' : '<span class="badge badge-danger">Expirada</span>'}</td>
                    <td>${s.price_eur ? s.price_eur + '€' : '—'}</td>
                    <td>${s.payment_method || '—'}</td>
                    <td>${s.started_at ? new Date(s.started_at).toLocaleDateString('pt-PT') : '—'}</td>
                    <td>${s.expires_at ? new Date(s.expires_at).toLocaleDateString('pt-PT') : 'Sem limite'}</td>
                </tr>`).join('')}
            </tbody>
        </table>`;
    } else {
        subsHtml = '<p style="color:var(--text-muted);font-size:13px;margin-top:8px;">Nenhuma subscrição registada.</p>';
    }

    // Saved analyses
    let analysesHtml = '';
    if (u.analyses.length > 0) {
        analysesHtml = `<table style="width:100%;margin-top:8px;font-size:12px;">
            <thead><tr><th>Tipo</th><th>Data</th></tr></thead>
            <tbody>${u.analyses.map(a => {
                const typeMap = { cv_analyser: 'CV Analyser', career_path: 'Career Path', linkedin_roaster: 'LinkedIn Roaster', career_energy: 'Career Energy' };
                return `<tr>
                    <td>${typeMap[a.analysis_type] || a.analysis_type}</td>
                    <td>${new Date(a.created_at).toLocaleString('pt-PT')}</td>
                </tr>`;
            }).join('')}
            </tbody>
        </table>`;
    } else {
        analysesHtml = '<p style="color:var(--text-muted);font-size:13px;margin-top:8px;">Nenhuma análise guardada.</p>';
    }

    const html = `
    <div class="modal-overlay" id="userDetailOverlay" onclick="if(event.target===this)this.remove()">
        <div class="modal-box" style="max-width:700px;">
            <div class="modal-header">
                <h3><i class="fas fa-user" style="color:var(--purple);margin-right:8px;"></i> ${name}</h3>
                <button class="modal-close" onclick="document.getElementById('userDetailOverlay').remove()"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <!-- Profile Info -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
                    <div>
                        <div style="font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">Email</div>
                        <div style="font-size:14px;">${u.email} <span style="font-size:11px;color:${u.email_confirmed ? 'var(--green)' : 'var(--orange)'};">${emailStatus}</span></div>
                    </div>
                    <div>
                        <div style="font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">Telefone</div>
                        <div style="font-size:14px;">${u.phone || '—'}</div>
                    </div>
                    <div>
                        <div style="font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">Morada</div>
                        <div style="font-size:14px;">${u.address || '—'}</div>
                    </div>
                    <div>
                        <div style="font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">LinkedIn</div>
                        <div style="font-size:14px;">${u.linkedin_url ? `<a href="${u.linkedin_url}" target="_blank" style="color:var(--blue);">${u.linkedin_url}</a>` : '—'}</div>
                    </div>
                    <div>
                        <div style="font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">Registado em</div>
                        <div style="font-size:14px;">${regDate}</div>
                    </div>
                    <div>
                        <div style="font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">Último Login</div>
                        <div style="font-size:14px;">${loginDate}</div>
                    </div>
                    <div>
                        <div style="font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">CV Carregado</div>
                        <div style="font-size:14px;">${u.cv_filename ? `<span class="badge badge-teal"><i class="fas fa-file-pdf" style="margin-right:3px;"></i> ${u.cv_filename}</span>` : '—'}</div>
                    </div>
                    <div>
                        <div style="font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">Perfil Completo</div>
                        <div style="font-size:14px;">${u.profile_complete ? '<span class="badge badge-success">Sim</span>' : '<span class="badge badge-warning">Incompleto</span>'}</div>
                    </div>
                </div>

                <!-- Subscriptions -->
                <div style="margin-bottom:20px;">
                    <h4 style="font-size:13px;font-weight:600;color:var(--dark);margin-bottom:4px;"><i class="fas fa-credit-card" style="color:var(--gold);margin-right:6px;"></i> Subscrições</h4>
                    ${subsHtml}
                </div>

                <!-- Saved Analyses -->
                <div style="margin-bottom:12px;">
                    <h4 style="font-size:13px;font-weight:600;color:var(--dark);margin-bottom:4px;"><i class="fas fa-chart-bar" style="color:var(--blue);margin-right:6px;"></i> Análises Guardadas (${u.analyses_count})</h4>
                    <div style="display:flex;gap:12px;margin-top:6px;margin-bottom:4px;">
                        <span class="badge badge-cv">CV: ${u.cv_analyser_count}</span>
                        <span class="badge badge-career">Career: ${u.career_path_count}</span>
                        <span class="badge" style="background:#E0F2FE;color:#0077B5;">LinkedIn: ${u.linkedin_roaster_count}</span>
                    </div>
                    ${analysesHtml}
                </div>
            </div>
        </div>
    </div>`;

    // Remove existing overlay if any
    const existing = document.getElementById('userDetailOverlay');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', html);
}

function exportUsersCSV() {
    const users = getMergedUsers();
    const rows = [['Nome','Email','Telefone','LinkedIn','Subscrição','Plano','Expira','Análises','CV','Registado','Último Login']];
    users.forEach(u => {
        const name = `${u.first_name} ${u.last_name}`.trim();
        const subStatus = u.active_sub ? 'Ativa' : (u.all_subs.length > 0 ? 'Expirada' : 'Nenhuma');
        const plan = u.active_sub ? (u.active_sub.plan || '') : (u.all_subs.length > 0 ? (u.all_subs[0].plan || '') : '');
        const expires = u.active_sub?.expires_at ? new Date(u.active_sub.expires_at).toLocaleDateString('pt-PT') : '';
        rows.push([
            name, u.email, u.phone, u.linkedin_url, subStatus, plan, expires,
            u.analyses_count, u.cv_filename || '', 
            new Date(u.created_at).toLocaleDateString('pt-PT'),
            u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('pt-PT') : ''
        ]);
    });
    downloadCSV(rows, 'utilizadores_s2i_' + new Date().toISOString().slice(0,10) + '.csv');
}
