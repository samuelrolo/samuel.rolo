// ═══════════════════════════════════════════════════════════════
//  Share2Inspire · Cockpit de Gestão v3.0
//  Reestruturado: 7 tabs, cruzamento de dados, fontes verificadas
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
const BREVO_SENDER = { name: 'Share2Inspire', email: 'geral@share2inspire.pt' };

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
let allAffiliates      = [];
let allAffClicks       = [];
let allAffConversions  = [];
let allCoupons         = [];
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
let revenueChart = null;

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
    if (a._source === 'linkedin_roaster') {
        if (a.payment_method === 'voucher') return 'voucher';
        return (a.payment_status === 'paid' || (a.payment_amount && a.payment_amount > 0)) ? 'paid' : 'free';
    }
    if (a.analysis_type === 'career_path') return 'paid';
    if (a.analysis_type === 'bundle') return 'paid';
    if (a.analysis_type === 'career_intelligence') return 'paid';
    if (a.payment_method === 'voucher') return 'voucher';
    if (a.payment_status === 'paid' || (a.payment_amount && a.payment_amount > 0)) return 'paid';
    if (a.analysis_type === 'paid') return 'paid';
    return 'free';
}

function isAnonymous(a) {
    const email = (a.user_email || '').toLowerCase();
    return !email || email.includes('anonymous') || email.includes('@share2inspire') || email === '';
}
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
    if (a.analysis_type === 'career_intelligence' || a.analysis_type === 'career_intelligence_pro' || a.analysis_type === 'career_intelligence_full') return '<span class="badge" style="background:#7C3AED;color:#fff;font-weight:600;">Career Intelligence</span>';
    if (a.analysis_type === 'bundle') return '<span class="badge" style="background:var(--gold);color:#1a1a1a;font-weight:600;">Bundle</span>';
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
//  TOAST & HELPERS
// ═══════════════════════════════════════════════════════════════
function showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = `show ${type}`;
    setTimeout(() => { t.className = ''; }, 3500);
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function renderPagination(containerId, currentPage, totalPages, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    let html = '';
    html += `<button class="page-btn" ${currentPage <= 1 ? 'disabled' : ''} onclick="(${onPageChange.toString()})(${currentPage - 1})">‹</button>`;
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    if (start > 1) html += `<button class="page-btn" onclick="(${onPageChange.toString()})(1)">1</button>`;
    if (start > 2) html += '<span style="padding:0 4px;color:var(--text-muted);">…</span>';
    for (let i = start; i <= end; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="(${onPageChange.toString()})(${i})">${i}</button>`;
    }
    if (end < totalPages - 1) html += '<span style="padding:0 4px;color:var(--text-muted);">…</span>';
    if (end < totalPages) html += `<button class="page-btn" onclick="(${onPageChange.toString()})(${totalPages})">${totalPages}</button>`;
    html += `<button class="page-btn" ${currentPage >= totalPages ? 'disabled' : ''} onclick="(${onPageChange.toString()})(${currentPage + 1})">›</button>`;
    container.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════
//  TAB NAVIGATION (7 tabs + sub-tabs)
// ═══════════════════════════════════════════════════════════════
function switchTab(name, btn) {
    document.querySelectorAll('.main > div[id^="tab-"]').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const tab = document.getElementById('tab-' + name);
    if (tab) tab.style.display = '';
    if (btn) btn.classList.add('active');

    // Lazy render on first visit
    if (name === 'funnel') renderFunnel();
    if (name === 'crm') { renderCRM(); renderAutoEmailsMonitoring(); renderNurturingSegments(); }
    if (name === 'market') { renderJobSearchTable(); renderCETable(); }
    if (name === 'partnerships') { renderAffiliates(); renderCoupons(); }
    if (name === 'users') renderUsers();
    if (name === 'system') renderHealthLogs();
}

function switchCrmSubtab(name, btn) {
    document.querySelectorAll('[id^="crm-sub-"]').forEach(el => el.style.display = 'none');
    document.querySelectorAll('#tab-crm .crm-subtab').forEach(b => b.classList.remove('active'));
    const sub = document.getElementById('crm-sub-' + name);
    if (sub) sub.style.display = '';
    if (btn) btn.classList.add('active');
    if (name === 'contacts') renderCRM();
    if (name === 'analyses') renderAnalyses();
    if (name === 'vouchers') renderVouchers();
    if (name === 'automation') renderAutoEmailsMonitoring();
    if (name === 'campaigns') renderNurturingSegments();
    if (name === 'history') renderEmailHistory();
    if (name === 'messages') renderContactMessages();
}

function switchMarketSubtab(name, btn) {
    document.querySelectorAll('[id^="market-sub-"]').forEach(el => el.style.display = 'none');
    document.querySelectorAll('#tab-market .crm-subtab').forEach(b => b.classList.remove('active'));
    const sub = document.getElementById('market-sub-' + name);
    if (sub) sub.style.display = '';
    if (btn) btn.classList.add('active');
    if (name === 'jobs') renderJobSearchTable();
    if (name === 'energy') renderCETable();
}

function switchPartnerSubtab(name, btn) {
    document.querySelectorAll('[id^="partner-sub-"]').forEach(el => el.style.display = 'none');
    document.querySelectorAll('#tab-partnerships .crm-subtab').forEach(b => b.classList.remove('active'));
    const sub = document.getElementById('partner-sub-' + name);
    if (sub) sub.style.display = '';
    if (btn) btn.classList.add('active');
    if (name === 'affiliates') renderAffiliates();
    if (name === 'coupons') renderCoupons();
    if (name === 'clicks') renderAffClicks();
    if (name === 'conversions') renderAffConversions();
}

function switchSystemSubtab(name, btn) {
    document.querySelectorAll('[id^="system-sub-"]').forEach(el => el.style.display = 'none');
    document.querySelectorAll('#tab-system .crm-subtab').forEach(b => b.classList.remove('active'));
    const sub = document.getElementById('system-sub-' + name);
    if (sub) sub.style.display = '';
    if (btn) btn.classList.add('active');
    if (name === 'health') renderHealthLogs();
    if (name === 'ebook') renderEbookDownloads();
}

// ═══════════════════════════════════════════════════════════════
//  GLOBAL LANGUAGE FILTER
// ═══════════════════════════════════════════════════════════════
function setGlobalLang(lang, btn) {
    globalLang = lang;
    document.querySelectorAll('#globalLangToggle button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateDashboard();
    updateCharts();
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
        allEbookDownloads = allNewsletterSubs;
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

async function loadCouponData() {
    try {
        const coupons = await supaFetch('discount_coupons', 'select=*&order=created_at.desc');
        allCoupons = Array.isArray(coupons) ? coupons : [];
        // Compute real usage from cv_analysis (current_uses may be stale)
        try {
            const analyses = await supaFetch('cv_analysis', 'select=transaction_id');
            if (Array.isArray(analyses)) {
                const usageMap = {};
                analyses.forEach(a => {
                    const txn = (a.transaction_id || '').toUpperCase();
                    allCoupons.forEach(c => {
                        const code = (c.code || '').toUpperCase();
                        if (txn === code || txn === `COUPON-${code}` || txn === `CP-COUPON-${code}` || txn === `CP-FREE-${code}` || txn.includes(code)) {
                            usageMap[code] = (usageMap[code] || 0) + 1;
                        }
                    });
                });
                allCoupons.forEach(c => {
                    const code = (c.code || '').toUpperCase();
                    if (usageMap[code] && usageMap[code] > (c.current_uses || 0)) {
                        c.real_uses = usageMap[code];
                    }
                });
            }
        } catch (e2) { console.debug('Could not compute real coupon usage:', e2); }
    } catch (e) {
        console.error('Erro ao carregar cup\u00f5es:', e);
    }
}

async function loadUsersData() {
    try {
        const [authUsers, profiles, subscriptions, userAnalyses] = await Promise.all([
            supaFetch('admin_auth_users', 'select=id,email,raw_user_meta_data,created_at,last_sign_in_at,email_confirmed_at&order=created_at.desc'),
            supaFetch('user_profiles', 'select=*&order=created_at.desc'),
            supaFetch('admin_subscriptions', 'select=*&order=created_at.desc'),
            supaFetch('admin_user_analyses', 'select=id,user_id,analysis_type,created_at&order=created_at.desc&limit=5000')
        ]);
        allAuthUsers    = Array.isArray(authUsers)    ? authUsers    : [];
        allUserProfiles = Array.isArray(profiles)     ? profiles     : [];
        allSubscriptions = Array.isArray(subscriptions) ? subscriptions : [];
        allUserAnalyses = Array.isArray(userAnalyses) ? userAnalyses : [];
    } catch (e) {
        console.error('Erro ao carregar dados de utilizadores:', e);
    }
}

// ═══════════════════════════════════════════════════════════════
//  COCKPIT DASHBOARD
// ═══════════════════════════════════════════════════════════════
function updateDashboard() {
    let cvData = filterByLang(allAnalyses, globalLang);
    cvData = filterByPeriod(cvData, dashPeriodDays);

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

    // Revenue
    const directRevenue = paid.reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0);
    const voucherRevenue = allVouchers
        .filter(v => v.payment_method !== 'test' && v.payment_method !== 'promo')
        .reduce((s, v) => s + (parseFloat(v.amount_paid) || 0), 0);
    const totalRevenue = directRevenue + voucherRevenue;

    const cvRevenue = paid.filter(a => a.analysis_type !== 'career_path' && a.analysis_type !== 'bundle' && a._source !== 'linkedin_roaster').reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0) 
                    + allVouchers.filter(v => v.payment_method !== 'test' && v.payment_method !== 'promo' && v.voucher_type !== 'career_path' && v.voucher_type !== 'bundle').reduce((s, v) => s + (parseFloat(v.amount_paid) || 0), 0);
    const cpRevenue = cp.reduce((s, a) => s + (a.payment_amount || 0), 0)
                    + allVouchers.filter(v => v.payment_method !== 'test' && v.payment_method !== 'promo' && v.voucher_type === 'career_path').reduce((s, v) => s + (parseFloat(v.amount_paid) || 0), 0);
    // Career Intelligence: dados vêm da tabela user_analyses (via admin_user_analyses view)
    const ciFromUserAnalyses = allUserAnalyses.filter(a => a.analysis_type === 'career_intelligence');
    const ciAll = filterByPeriod(ciFromUserAnalyses, dashPeriodDays);
    const ciRevenue = 0; // CI é incluído no bundle ou na subscrição — sem receita directa separada

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

    // === VENDAS REAIS (excluindo samuelrolo@gmail.com) ===
    const excludeEmail = 'samuelrolo@gmail.com';
    const realPaid = paid.filter(a => (a.user_email || '').toLowerCase() !== excludeEmail);
    const realCVAPaid = realPaid.filter(a => a.analysis_type !== 'career_path' && a.analysis_type !== 'bundle' && a._source !== 'linkedin_roaster');
    const realCPPaid = realPaid.filter(a => a.analysis_type === 'career_path');
    // CI não tem receita directa separada na tabela cv_analysis
    const realCIPaid = [];
    const realLRPaid = realPaid.filter(a => a._source === 'linkedin_roaster');
    const realVouchersSold = allVouchers.filter(v => v.payment_method !== 'test' && v.payment_method !== 'promo' && (v.buyer_email || '').toLowerCase() !== excludeEmail && (v.user_email || '').toLowerCase() !== excludeEmail);

    const realDirectRevenue = realPaid.reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0);
    const realVoucherRevenue = realVouchersSold.reduce((s, v) => s + (parseFloat(v.amount_paid) || 0), 0);
    const realTotalRevenue = realDirectRevenue + realVoucherRevenue;
    const realCVARevenue = realCVAPaid.reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0)
                         + allVouchers.filter(v => v.payment_method !== 'test' && v.payment_method !== 'promo' && v.voucher_type !== 'career_path' && v.voucher_type !== 'bundle' && (v.buyer_email || '').toLowerCase() !== excludeEmail && (v.user_email || '').toLowerCase() !== excludeEmail).reduce((s, v) => s + (parseFloat(v.amount_paid) || 0), 0);
    const realCPRevenue = realCPPaid.reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0)
                        + allVouchers.filter(v => v.payment_method !== 'test' && v.payment_method !== 'promo' && v.voucher_type === 'career_path' && (v.buyer_email || '').toLowerCase() !== excludeEmail && (v.user_email || '').toLowerCase() !== excludeEmail).reduce((s, v) => s + (parseFloat(v.amount_paid) || 0), 0);
    const realCIRevenue = 0; // CI incluído no bundle/subscrição
    const realLRRevenue = realLRPaid.reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0);

    // LinkedIn Roaster computed values
    const lrPaidItems = lrPeriod.filter(a => a.payment_status === 'paid');
    const lrRevenue = lrPaidItems.reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0);

    // Set KPIs
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
    setText('kpiCI',           ciAll.length);
    setText('kpiCISub',        `${allUserAnalyses.length} total área membros`);
    const activeSubs = allSubscriptions.filter(s => s.status === 'active').length;
    setText('kpiMembers',      activeSubs);
    setText('kpiMembersSub',   `${allSubscriptions.length} total subscrições`);
    setText('kpiAvgScore',     avgScore);
    setText('kpi7d',           last7d.length);
    setText('kpi7dRevenue',    `${rev7d.toFixed(2)}€ receita`);
    setText('kpiConvRate',     `${convRate}%`);
    setText('kpiAvgTicket',    `${avgTicket}€`);
    setText('kpiLTV',          `${ltv}€`);
    setText('kpiAbandon',      `${abandonRate}%`);
    setText('kpiVouchersActive', vActive);
    setText('kpiVouchersUsed', `${vUsed} utilizados`);

    // Real Revenue KPI
    setText('kpiRealRevenue',    `${realTotalRevenue.toFixed(2)}€`);
    setText('kpiRealRevenueSub', `excl. testes · total: ${totalRevenue.toFixed(2)}€`);

    // Hidden compat
    setText('kpiRevenuePT', '');
    setText('kpiRevenueEN', '');

    // === PIVOT TABLE ===
    const cvAll = data.filter(a => a.analysis_type !== 'career_path' && a.analysis_type !== 'bundle' && a._source !== 'linkedin_roaster');
    const cvFreeItems = cvAll.filter(a => getAnalysisType(a) === 'free');
    const cvPaidItems = cvAll.filter(a => getAnalysisType(a) === 'paid');
    const cvVoucherItems = cvAll.filter(a => getAnalysisType(a) === 'voucher');
    const cpFreeItems = cp.filter(a => getAnalysisType(a) === 'free');
    const cpPaidItems = cp.filter(a => getAnalysisType(a) === 'paid');
    const cpVoucherItems = cp.filter(a => getAnalysisType(a) === 'voucher');
    const lrFreeItems = lrPeriod.filter(a => getAnalysisType(a) === 'free');
    const lrPaidType = lrPeriod.filter(a => getAnalysisType(a) === 'paid');
    const lrVoucherItems = lrPeriod.filter(a => getAnalysisType(a) === 'voucher');

    // Bundle (CV + Career Path + CI)
    const bundleItems = data.filter(a => a.analysis_type === 'bundle');
    const bundleRevenue = bundleItems.reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0);
    const realBundlePaid = realPaid.filter(a => a.analysis_type === 'bundle');
    const realBundleRevenue = realBundlePaid.reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0);

    // Member Area analyses (from user_analyses via admin_user_analyses)
    const memberCVA = allUserAnalyses.filter(a => a.analysis_type === 'cv_analyser');
    const memberCP = allUserAnalyses.filter(a => a.analysis_type === 'career_path');
    const memberLR = allUserAnalyses.filter(a => a.analysis_type === 'linkedin_roaster');

    const pivotProducts = [
        { name: 'CV Analyser', color: 'var(--purple)', icon: 'fa-file-lines', total: cvAll.length, free: cvFreeItems.length, paid: cvPaidItems.length, voucher: cvVoucherItems.length, revenue: cvRevenue, realRevenue: realCVARevenue, memberCount: memberCVA.length },
        { name: 'Career Path', color: 'var(--teal)', icon: 'fa-route', total: cp.length, free: cpFreeItems.length, paid: cpPaidItems.length, voucher: cpVoucherItems.length, revenue: cpRevenue, realRevenue: realCPRevenue, memberCount: memberCP.length },
        { name: 'Career Intelligence', color: '#7C3AED', icon: 'fa-brain', total: ciAll.length, free: 0, paid: ciAll.length, voucher: 0, revenue: ciRevenue, realRevenue: realCIRevenue, memberCount: ciAll.length },
        { name: 'Bundle', color: 'var(--gold)', icon: 'fa-layer-group', total: bundleItems.length, free: 0, paid: bundleItems.length, voucher: 0, revenue: bundleRevenue, realRevenue: realBundleRevenue },
        { name: 'LinkedIn Roaster', color: '#0077B5', icon: 'fa-linkedin', total: lrPeriod.length, free: lrFreeItems.length, paid: lrPaidType.length, voucher: lrVoucherItems.length, revenue: lrRevenue, realRevenue: realLRRevenue, memberCount: memberLR.length },
        { name: 'Vouchers', color: 'var(--green)', icon: 'fa-ticket', total: allVouchers.length, free: 0, paid: 0, voucher: 0, revenue: voucherRevenue, realRevenue: realVoucherRevenue, isVoucher: true, active: vActive, used: vUsed }
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
                    <td style="text-align:center;">-</td>
                    <td style="text-align:right;font-weight:600;color:${p.color};">${p.revenue.toFixed(2)}\u20ac</td>
                    <td style="text-align:right;">-</td>
                    <td style="text-align:right;font-weight:700;color:var(--gold);">${p.realRevenue.toFixed(2)}\u20ac</td>`;
            } else {
                const memberCol = p.memberCount !== undefined ? `<td style="text-align:center;color:#7C3AED;">${p.memberCount}</td>` : '<td style="text-align:center;color:var(--text-muted);">—</td>';
                tr.innerHTML = `
                    <td><span style="color:${p.color};font-weight:600;"><i class="fas ${p.icon}" style="margin-right:6px;"></i>${p.name}</span></td>
                    <td style="text-align:center;font-weight:600;">${p.total}</td>
                    <td style="text-align:center;">${p.free}</td>
                    <td style="text-align:center;color:var(--green);font-weight:600;">${p.paid}</td>
                    <td style="text-align:center;">${p.voucher}</td>
                    ${memberCol}
                    <td style="text-align:center;">${conv}%</td>
                    <td style="text-align:right;font-weight:600;color:${p.color};">${p.revenue.toFixed(2)}\u20ac</td>
                    <td style="text-align:right;">${ticket}\u20ac</td>
                    <td style="text-align:right;font-weight:700;color:var(--gold);">${p.realRevenue.toFixed(2)}\u20ac</td>`;
            }
            pivotBody.appendChild(tr);
        });

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
        const tMembers = pivotProducts.filter(p => !p.isVoucher && p.memberCount !== undefined).reduce((s, p) => s + p.memberCount, 0);
        setText('pivotTotalMembers', tMembers);
        setText('pivotTotalConv', `${tConv}%`);
        setText('pivotTotalRevenue', `${totalRevenue.toFixed(2)}\u20ac`);
        setText('pivotTotalTicket', `${tTicket}\u20ac`);
        setText('pivotTotalReal', `${realTotalRevenue.toFixed(2)}\u20ac`);
        if (pivotFoot) pivotFoot.style.display = '';
    }

    // Cockpit Insights
    renderCockpitInsights(data, paid, free, cp, ciAll, lrPeriod, realTotalRevenue, uniqueEmails, abandonRate);

    // Activity Feed
    renderActivityFeed(data);

    document.getElementById('lastUpdate').textContent = 'Atualizado: ' + new Date().toLocaleTimeString('pt-PT');
}

function renderCockpitInsights(data, paid, free, cp, ciAll, lr, realRevenue, uniqueEmails, abandonRate) {
    const el = document.getElementById('cockpitInsights');
    if (!el) return;

    const insights = [];
    
    // Revenue insight
    if (realRevenue > 0) {
        const avgPerUser = uniqueEmails.size > 0 ? (realRevenue / uniqueEmails.size).toFixed(2) : 0;
        insights.push({ icon: 'fa-euro-sign', color: 'var(--gold)', text: `Receita real: <strong>${realRevenue.toFixed(2)}€</strong> · Média por utilizador: <strong>${avgPerUser}€</strong>` });
    }

    // Conversion insight
    const convRate = (free.length + paid.length) > 0 ? Math.round(paid.length / (free.length + paid.length) * 100) : 0;
    if (convRate < 15) {
        insights.push({ icon: 'fa-exclamation-triangle', color: 'var(--orange)', text: `Taxa de conversão baixa: <strong>${convRate}%</strong> — considerar melhorar o CTA pós-análise gratuita` });
    } else if (convRate >= 30) {
        insights.push({ icon: 'fa-check-circle', color: 'var(--green)', text: `Excelente taxa de conversão: <strong>${convRate}%</strong> — o funil está saudável` });
    }

    // Abandonment insight
    if (abandonRate > 40) {
        insights.push({ icon: 'fa-user-slash', color: 'var(--red)', text: `<strong>${abandonRate}%</strong> das análises são anónimas — oportunidade de captura de email` });
    }

    // Career Path upsell
    const cpUpsellRate = paid.length > 0 ? Math.round(cp.length / paid.length * 100) : 0;
    if (cpUpsellRate < 20 && paid.length > 10) {
        insights.push({ icon: 'fa-route', color: 'var(--blue)', text: `Apenas <strong>${cpUpsellRate}%</strong> dos pagantes compram Career Path — potencial de upsell` });
    }

    // LinkedIn Roaster as top-of-funnel
    if (lr.length > 0) {
        const lrPaidPct = lr.filter(a => getAnalysisType(a) === 'paid').length;
        insights.push({ icon: 'fa-linkedin', color: '#0077B5', text: `LinkedIn Roaster: <strong>${lr.length}</strong> análises (${lrPaidPct} pagas) — topo do funil ativo` });
    }

    if (insights.length === 0) return;

    el.innerHTML = `
        <div class="card" style="border-left:3px solid var(--gold);">
            <div class="card-header"><div class="card-title"><i class="fas fa-lightbulb" style="color:var(--gold);"></i> Insights Automáticos</div></div>
            <div class="card-body" style="display:flex;flex-direction:column;gap:8px;">
                ${insights.map(i => `
                    <div style="display:flex;align-items:center;gap:10px;padding:6px 0;">
                        <i class="fas ${i.icon}" style="color:${i.color};width:16px;text-align:center;"></i>
                        <span style="font-size:13px;line-height:1.4;">${i.text}</span>
                    </div>`).join('')}
            </div>
        </div>`;
}

function renderActivityFeed(data) {
    const el = document.getElementById('activityFeed');
    if (!el) return;

    const recent = data.slice(0, 20);
    if (!recent.length) {
        el.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:40px;">Sem atividade recente</div>';
        return;
    }

    el.innerHTML = recent.map(a => {
        const name = a.user_name || a.user_email || 'Anónimo';
        const type = getAnalysisType(a);
        const badge = getProductBadge(a);
        const typeBadge = getTypeBadge(type);
        const time = new Date(a.created_at);
        const timeStr = time.toLocaleDateString('pt-PT') + ' ' + time.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
        const amount = (type === 'paid' && a.payment_amount) ? `<span style="color:var(--green);font-weight:600;margin-left:8px;">+${parseFloat(a.payment_amount).toFixed(2)}€</span>` : '';

        return `
            <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border);">
                <div style="width:32px;height:32px;border-radius:50%;background:var(--gold-bg);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:var(--gold);flex-shrink:0;">
                    ${(name[0] || '?').toUpperCase()}
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</div>
                    <div style="font-size:11px;color:var(--text-muted);">${timeStr}</div>
                </div>
                <div style="display:flex;align-items:center;gap:6px;">
                    ${badge} ${typeBadge} ${amount}
                </div>
            </div>`;
    }).join('');
}

// ═══════════════════════════════════════════════════════════════
//  CHARTS
// ═══════════════════════════════════════════════════════════════
function updateCharts() {
    const days = parseInt(document.getElementById('chartDateFilter')?.value || 14);
    let cvData = filterByLang(allAnalyses, globalLang);
    cvData = filterByPeriod(cvData, days);

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
            options: { responsive: true, maintainAspectRatio: true, animation: { duration: 0 }, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } }, scales: { x: { stacked: true, ticks: { font: { size: 10 } } }, y: { stacked: true, ticks: { font: { size: 10 } } } } }
        });
    }

    // Revenue Accumulated Chart
    const revLabels = Object.keys(dateMap);
    let cumRevenue = 0;
    const revData = revLabels.map(d => {
        const dayData = data.filter(a => a.created_at?.slice(0, 10) === d && getAnalysisType(a) === 'paid');
        cumRevenue += dayData.reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0);
        return cumRevenue;
    });
    const ctx5 = document.getElementById('revenueChart')?.getContext('2d');
    if (ctx5) {
        if (revenueChart) revenueChart.destroy();
        revenueChart = new Chart(ctx5, {
            type: 'line',
            data: {
                labels: revLabels.map(d => d.slice(5)),
                datasets: [{
                    label: 'Receita Acumulada (€)',
                    data: revData,
                    borderColor: '#C9A961',
                    backgroundColor: 'rgba(201,169,97,0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 2
                }]
            },
            options: { responsive: true, maintainAspectRatio: true, animation: { duration: 0 }, plugins: { legend: { display: false } }, scales: { y: { ticks: { font: { size: 10 }, callback: v => v + '€' } }, x: { ticks: { font: { size: 10 } } } } }
        });
    }

    // Type Chart (Donut)
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
            options: { responsive: true, maintainAspectRatio: true, animation: { duration: 0 }, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } } }
        });
    }

    // Score Distribution
    const scoreBuckets = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
    data.forEach(a => {
        const s = a.score || a.teaser_score || 0;
        if (s <= 0) return;
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
            options: { responsive: true, maintainAspectRatio: true, animation: { duration: 0 }, plugins: { legend: { display: false } }, scales: { y: { ticks: { font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } } }
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
    const freeCount   = data.filter(a => getAnalysisType(a) === 'free').length;
    const paidCount   = data.filter(a => getAnalysisType(a) === 'paid' && a.analysis_type !== 'career_path' && a.analysis_type !== 'career_intelligence').length;
    const cpCount     = data.filter(a => a.analysis_type === 'career_path').length;
    // CI count comes from user_analyses (member area), not cv_analysis
    const ciCount     = filterByPeriod((typeof allUserAnalyses !== 'undefined' ? allUserAnalyses : []).filter(a => a.analysis_type === 'career_intelligence'), funnelPeriodDays).length;

    setText('funnelLR', lrTotal);
    setText('funnelLRConv', `${lrPaidCount} pagas`);
    setText('funnelFree', freeCount);
    setText('funnelPaid', paidCount);
    setText('funnelCP', cpCount);
    setText('funnelCI', ciCount);
    setText('funnelFreeConv', lrTotal ? `${Math.round(freeCount / lrTotal * 100)}% do topo` : '—');
    setText('funnelPaidConv', freeCount ? `${Math.round(paidCount / (freeCount + paidCount) * 100)}% do grátis` : '—');
    setText('funnelCPConv', paidCount ? `${Math.round(cpCount / paidCount * 100)}% dos pagantes` : '—');
    setText('funnelCIConv', cpCount ? `${Math.round(ciCount / cpCount * 100)}% do Career Path` : '—');

    // Funil Visual
    const steps = [
        { name: 'LinkedIn Roaster (Topo)', count: lrTotal, color: '#0077B5' },
        { name: 'CV Analyser Grátis', count: freeCount, color: '#C9A961' },
        { name: 'CV Analyser Pago', count: paidCount, color: '#10B981' },
        { name: 'Career Path', count: cpCount, color: '#3B82F6' },
        { name: 'Career Intelligence', count: ciCount, color: '#7C3AED' }
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
                    <span class="funnel-step-meta"><strong>${step.count}</strong> utilizadores</span>
                </div>
                <div class="funnel-bar-wrap">
                    <div class="funnel-bar" style="width:${pct}%;background:${step.color};">${step.count}</div>
                </div>
                ${conv !== null ? `<div class="funnel-conv">Conversão: <span class="conv-pct">${conv}%</span> | Abandono: <span class="drop-pct">${drop}%</span></div>` : ''}
            </div>`;
        }).join('');
    }

    // Funnel Chart
    const ctx = document.getElementById('funnelChart')?.getContext('2d');
    if (ctx) {
        if (funnelChart) funnelChart.destroy();
        funnelChart = new Chart(ctx, {
            type: 'bar',
            data: { labels: steps.map(s => s.name), datasets: [{ label: 'Utilizadores', data: steps.map(s => s.count), backgroundColor: steps.map(s => s.color), borderRadius: 4 }] },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true, animation: { duration: 0 }, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { size: 10 } } }, y: { ticks: { font: { size: 11 } } } } }
        });
    }

    // Pontos de Abandono
    const abandonEl = document.getElementById('abandonPoints');
    if (abandonEl) {
        const anonymous = data.filter(isAnonymous).length;
        const freeNoUpgrade = data.filter(a => getAnalysisType(a) === 'free' && !isAnonymous(a)).length;
        const paidNoCp = data.filter(a => getAnalysisType(a) === 'paid' && a.analysis_type !== 'career_path' && a.analysis_type !== 'career_intelligence').length;
        const cpNoCi = data.filter(a => a.analysis_type === 'career_path' && !allUserAnalyses.some(b => b.analysis_type === 'career_intelligence')).length;

        abandonEl.innerHTML = `
            <div class="metric-row"><div class="metric-label"><i class="fas fa-user-slash" style="color:var(--red);margin-right:6px;"></i> Utilizadores anónimos</div>
                <div style="display:flex;align-items:center;gap:12px;flex:1;margin-left:16px;"><div class="metric-bar-wrap"><div class="metric-bar" style="width:${data.length ? Math.round(anonymous/data.length*100) : 0}%;background:var(--red);"></div></div><div class="metric-value" style="color:var(--red);">${anonymous} (${data.length ? Math.round(anonymous/data.length*100) : 0}%)</div></div></div>
            <div class="metric-row"><div class="metric-label"><i class="fas fa-arrow-up" style="color:var(--orange);margin-right:6px;"></i> Grátis sem upgrade</div>
                <div style="display:flex;align-items:center;gap:12px;flex:1;margin-left:16px;"><div class="metric-bar-wrap"><div class="metric-bar" style="width:${freeCount ? Math.round(freeNoUpgrade/freeCount*100) : 0}%;background:var(--orange);"></div></div><div class="metric-value" style="color:var(--orange);">${freeNoUpgrade} (${freeCount ? Math.round(freeNoUpgrade/freeCount*100) : 0}%)</div></div></div>
            <div class="metric-row"><div class="metric-label"><i class="fas fa-route" style="color:var(--blue);margin-right:6px;"></i> CV Pago sem Career Path</div>
                <div style="display:flex;align-items:center;gap:12px;flex:1;margin-left:16px;"><div class="metric-bar-wrap"><div class="metric-bar" style="width:${paidCount ? Math.round(paidNoCp/paidCount*100) : 0}%;background:var(--blue);"></div></div><div class="metric-value" style="color:var(--blue);">${paidNoCp} (${paidCount ? Math.round(paidNoCp/paidCount*100) : 0}%)</div></div></div>
            <div class="metric-row"><div class="metric-label"><i class="fas fa-brain" style="color:#7C3AED;margin-right:6px;"></i> Career Path sem CI PRO</div>
                <div style="display:flex;align-items:center;gap:12px;flex:1;margin-left:16px;"><div class="metric-bar-wrap"><div class="metric-bar" style="width:${cpCount ? Math.round(cpNoCi/cpCount*100) : 0}%;background:#7C3AED;"></div></div><div class="metric-value" style="color:#7C3AED;">${cpNoCi} (${cpCount ? Math.round(cpNoCi/cpCount*100) : 0}%)</div></div></div>`;
    }

    // Oportunidades de Conversão
    const oppEl = document.getElementById('conversionOpportunities');
    if (oppEl) {
        const freeIdentified = data.filter(a => getAnalysisType(a) === 'free' && !isAnonymous(a)).length;
        const cvPaidNoCp = data.filter(a => getAnalysisType(a) === 'paid' && a.analysis_type !== 'career_path' && a.analysis_type !== 'career_intelligence' && !isAnonymous(a)).length;
        const cpNoCiOpp = data.filter(a => a.analysis_type === 'career_path' && !isAnonymous(a)).length;
        const avgTicket = paidCount > 0 ? (data.filter(a => getAnalysisType(a) === 'paid').reduce((s, a) => s + (a.payment_amount || 0), 0) / paidCount) : 0;
        const potentialRev = (freeIdentified * avgTicket * 0.1 + cvPaidNoCp * 19.99 * 0.2 + cpNoCiOpp * 24 * 0.15).toFixed(0);

        oppEl.innerHTML = `
            <div style="margin-bottom:12px;padding:12px;background:var(--green-bg);border-radius:8px;border-left:3px solid var(--green);">
                <div style="font-size:12px;font-weight:600;color:var(--green);margin-bottom:4px;">Receita Potencial Estimada</div>
                <div style="font-size:20px;font-weight:700;color:var(--dark);">${potentialRev}€</div>
                <div style="font-size:11px;color:var(--text-muted);">10% leads grátis + 20% upsell Career Path + 15% upsell CI PRO</div>
            </div>
            <div class="metric-row"><div class="metric-label">Leads grátis para upsell</div><div class="metric-value" style="color:var(--gold);">${freeIdentified}</div></div>
            <div class="metric-row"><div class="metric-label">CV para upsell Career Path</div><div class="metric-value" style="color:var(--blue);">${cvPaidNoCp}</div></div>
            <div class="metric-row"><div class="metric-label">Career Path para upsell CI PRO</div><div class="metric-value" style="color:#7C3AED;">${cpNoCiOpp}</div></div>
            <div class="metric-row"><div class="metric-label">Ticket médio atual</div><div class="metric-value" style="color:var(--green);">${avgTicket.toFixed(2)}€</div></div>`;
    }

    // Receita por Produto
    const revEl = document.getElementById('revenueByProduct');
    if (revEl) {
        const cvRev = data.filter(a => getAnalysisType(a) === 'paid' && a.analysis_type !== 'career_path' && a.analysis_type !== 'career_intelligence').reduce((s, a) => s + (a.payment_amount || 0), 0);
        const cpRev = data.filter(a => a.analysis_type === 'career_path').reduce((s, a) => s + (a.payment_amount || 0), 0);
        const ciRevFunnel = 0; // CI is part of member subscriptions, no direct revenue in cv_analysis
        const lrRev = lrFiltered.filter(a => a.payment_status === 'paid').reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0);
        const vRev = allVouchers.filter(v => v.payment_method !== 'test' && v.payment_method !== 'promo').reduce((s, v) => s + (parseFloat(v.amount_paid) || 0), 0);
        const total = cvRev + cpRev + ciRevFunnel + lrRev + vRev;

        revEl.innerHTML = `<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:16px;">
            ${[
                { label: 'CV Analyser', value: cvRev, color: 'var(--purple)', icon: 'fa-file-alt' },
                { label: 'Career Path', value: cpRev, color: 'var(--blue)', icon: 'fa-route' },
                { label: 'Career Intelligence', value: ciRevFunnel, color: '#7C3AED', icon: 'fa-brain' },
                { label: 'LinkedIn Roaster', value: lrRev, color: '#0077B5', icon: 'fab fa-linkedin' },
                { label: 'Vouchers', value: vRev, color: 'var(--gold)', icon: 'fa-ticket-alt' }
            ].map(p => `<div style="text-align:center;padding:16px;background:var(--bg);border-radius:8px;">
                <i class="${p.icon.startsWith('fab') ? p.icon : 'fas ' + p.icon}" style="font-size:20px;color:${p.color};margin-bottom:8px;display:block;"></i>
                <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.4px;">${p.label}</div>
                <div style="font-size:22px;font-weight:700;color:${p.color};margin-top:4px;">${p.value.toFixed(2)}€</div>
                <div style="font-size:11px;color:var(--text-muted);">${total > 0 ? Math.round(p.value/total*100) : 0}% do total</div>
            </div>`).join('')}
        </div>`;
    }
}

// ═══════════════════════════════════════════════════════════════
//  CRM & LEADS
// ═══════════════════════════════════════════════════════════════
function getCRMSuggestion(p) {
    const emailsSent = allEmailHistory.filter(e => e.recipient_email?.toLowerCase() === p.email);
    const hasAutoUpsell2h = emailsSent.some(e => e.email_type === 'upsell_auto_2h' || e.campaign_type === 'upsell_auto_2h');
    const hasAutoUpsell7d = emailsSent.some(e => e.email_type === 'upsell_auto_7d' || e.campaign_type === 'upsell_auto_7d');
    const hasPurchase = p.purchases.length > 0;
    const hasCareerPath = p.purchases.some(a => a.analysis_type === 'career_path');
    const hasCVPaid = p.purchases.some(a => a.analysis_type !== 'career_path' && a.analysis_type !== 'career_intelligence');
    const hasCI = p.purchases.some(a => a.analysis_type === 'career_intelligence');
    const avgScore = p.analyses.filter(a => a.score > 0).length ? Math.round(p.analyses.filter(a => a.score > 0).reduce((s, a) => s + a.score, 0) / p.analyses.filter(a => a.score > 0).length) : 0;
    if (hasPurchase && hasCareerPath && !hasCI) return '<span style="color:#7C3AED;"><i class="fas fa-brain"></i> Oferecer CI PRO (24€)</span>';
    if (hasPurchase && !hasCareerPath) return '<span style="color:var(--blue);"><i class="fas fa-bullseye"></i> Oferecer Career Path</span>';
    if (hasPurchase && hasCareerPath && hasCI && !hasCVPaid) return '<span style="color:var(--blue);"><i class="fas fa-bullseye"></i> Oferecer CV Analyser</span>';
    if (hasPurchase && hasCareerPath && hasCI && hasCVPaid) return '<span style="color:var(--green);"><i class="fas fa-star"></i> Pedir testemunho</span>';
    if (hasAutoUpsell7d && !hasPurchase) return '<span style="color:var(--orange);"><i class="fas fa-phone"></i> Contacto directo</span>';
    if (hasAutoUpsell2h && !hasPurchase) return '<span style="color:var(--text-muted);"><i class="fas fa-clock"></i> Aguardar follow-up 7d</span>';
    if (avgScore > 0 && avgScore < 60) return '<span style="color:var(--red);"><i class="fas fa-fire"></i> Score baixo — upsell urgente</span>';
    if (avgScore >= 60 && avgScore < 80) return '<span style="color:var(--orange);"><i class="fas fa-chart-line"></i> Mostrar benefícios premium</span>';
    return '<span style="color:var(--text-muted);"><i class="fas fa-hourglass-half"></i> Aguardar email auto 2h</span>';
}

function getCRMPlannedAction(p) {
    const emailsSent = allEmailHistory.filter(e => e.recipient_email?.toLowerCase() === p.email);
    const hasAutoUpsell2h = emailsSent.some(e => e.email_type === 'upsell_auto_2h' || e.campaign_type === 'upsell_auto_2h');
    const hasAutoUpsell7d = emailsSent.some(e => e.email_type === 'upsell_auto_7d' || e.campaign_type === 'upsell_auto_7d');
    const hasPurchase = p.purchases.length > 0;
    if (hasPurchase) return '<span style="color:var(--green);"><i class="fas fa-check-circle"></i> Convertido</span>';
    if (hasAutoUpsell7d) return '<span style="color:var(--red);"><i class="fas fa-ban"></i> Seq. completa — acção manual</span>';
    if (hasAutoUpsell2h) {
        const upsell2hDate = new Date(emailsSent.find(e => e.email_type === 'upsell_auto_2h' || e.campaign_type === 'upsell_auto_2h')?.sent_at);
        const followUpDate = new Date(upsell2hDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const daysLeft = Math.ceil((followUpDate - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 0) return `<span style="color:var(--purple);"><i class="fas fa-calendar"></i> Follow-up 7d em ${daysLeft}d</span>`;
        return '<span style="color:var(--purple);"><i class="fas fa-paper-plane"></i> Follow-up 7d iminente</span>';
    }
    const lastFreeAnalysis = p.analyses.filter(a => getAnalysisType(a) === 'free').sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    if (lastFreeAnalysis) {
        const analysisDate = new Date(lastFreeAnalysis.created_at);
        const upsellDate = new Date(analysisDate.getTime() + 2 * 60 * 60 * 1000);
        const hoursLeft = Math.ceil((upsellDate - new Date()) / (1000 * 60 * 60));
        if (hoursLeft > 0) return `<span style="color:var(--blue);"><i class="fas fa-clock"></i> Upsell 2h em ${hoursLeft}h</span>`;
        return '<span style="color:var(--blue);"><i class="fas fa-paper-plane"></i> Upsell 2h iminente</span>';
    }
    return '<span style="color:var(--text-muted);">—</span>';
}

function renderAutoEmailsMonitoring() {
    // Check both email_type and campaign_type columns (SQL functions use campaign_type, JS manual uses email_type)
    const isAutoType = (e, type) => e.email_type === type || e.campaign_type === type;
    const autoEmails = allEmailHistory.filter(e => isAutoType(e, 'upsell_auto_2h') || isAutoType(e, 'upsell_auto_7d'));
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recent = autoEmails.filter(e => new Date(e.sent_at) > thirtyDaysAgo);
    const upsell2h = recent.filter(e => isAutoType(e, 'upsell_auto_2h')).length;
    const upsell7d = recent.filter(e => isAutoType(e, 'upsell_auto_7d')).length;
    const autoRecipients = [...new Set(autoEmails.map(e => e.recipient_email?.toLowerCase()))];
    const conversions = autoRecipients.filter(email => {
        const emailDate = autoEmails.find(e => e.recipient_email?.toLowerCase() === email)?.sent_at;
        return allAnalyses.some(a => a.user_email?.toLowerCase() === email && getAnalysisType(a) === 'paid' && new Date(a.created_at) > new Date(emailDate));
    }).length;
    const convRate = autoRecipients.length > 0 ? ((conversions / autoRecipients.length) * 100).toFixed(1) + '%' : '0%';
    setText('autoUpsell2h', upsell2h);
    setText('autoUpsell7d', upsell7d);
    setText('autoConversions', conversions);
    setText('autoConvRate', convRate);
    const tbody = document.getElementById('autoEmailsTable');
    if (!tbody) return;
    const recentAuto = autoEmails.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at)).slice(0, 15);
    if (!recentAuto.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted);">Nenhum email automático enviado</td></tr>'; return; }
    tbody.innerHTML = recentAuto.map(e => {
        const date = new Date(e.sent_at).toLocaleDateString('pt-PT') + ' ' + new Date(e.sent_at).toLocaleTimeString('pt-PT', {hour:'2-digit',minute:'2-digit'});
        const emailAutoType = e.email_type || e.campaign_type || '';
        const typeBadge = emailAutoType.includes('2h') ? '<span class="badge badge-teal">Upsell 2h</span>' : '<span class="badge badge-purple">Follow-up 7d</span>';
        const converted = allAnalyses.some(a => a.user_email?.toLowerCase() === e.recipient_email?.toLowerCase() && getAnalysisType(a) === 'paid' && new Date(a.created_at) > new Date(e.sent_at));
        const convBadge = converted ? '<span class="badge badge-paid">Sim</span>' : '<span class="badge badge-secondary">Não</span>';
        return `<tr><td style="font-size:12px;color:var(--text-muted);">${date}</td><td style="font-size:12px;">${e.recipient_email || '—'}</td><td>${typeBadge}</td><td style="font-size:11px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${e.subject || '—'}</td><td><span class="badge badge-success">Enviado</span></td><td>${convBadge}</td></tr>`;
    }).join('');

    // Render pending leads table
    renderPendingLeads();
    // Update automation status
    updateAutomationStatus();
}

function buildCRMProfiles() {
    const profileMap = {};
    allAnalyses.forEach(a => {
        const email = isAnonymous(a) ? null : a.user_email.toLowerCase().trim();
        if (!email) return;
        if (!profileMap[email]) {
            profileMap[email] = { email, name: a.user_name || '', professional_area: a.professional_area || '', seniority: a.seniority_level || '', analyses: [], purchases: [], totalSpent: 0, lastInteraction: a.created_at, firstInteraction: a.created_at };
        }
        const p = profileMap[email];
        p.analyses.push(a);
        if (new Date(a.created_at) > new Date(p.lastInteraction)) p.lastInteraction = a.created_at;
        if (new Date(a.created_at) < new Date(p.firstInteraction)) p.firstInteraction = a.created_at;
        if (!p.name && a.user_name) p.name = a.user_name;
        if (!p.professional_area && a.professional_area) p.professional_area = a.professional_area;
        if (!p.seniority && a.seniority_level) p.seniority = a.seniority_level;
        const type = getAnalysisType(a);
        if (type === 'paid' || type === 'voucher') { p.purchases.push(a); p.totalSpent += (a.payment_amount || 0); }
    });
    const sentEmails = new Set(allEmailHistory.map(e => e.recipient_email?.toLowerCase()));
    return Object.values(profileMap).map(p => {
        const hasPurchase = p.purchases.length > 0;
        const hasMultiple = p.purchases.length >= 2 || (p.purchases.length >= 1 && p.analyses.some(a => a.analysis_type === 'career_path' || a.analysis_type === 'career_intelligence'));
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
    const leads = profiles.filter(p => p.stage === 'lead').length;
    const nurturing = profiles.filter(p => p.stage === 'nurturing').length;
    const clients = profiles.filter(p => p.stage === 'client').length;
    const recurring = profiles.filter(p => p.stage === 'recurring').length;
    setText('crmLeads', leads);
    setText('crmNurturing', nurturing);
    setText('crmClients', clients);
    setText('crmRecurring', recurring);

    const senioritySet = new Set(profiles.map(p => p.seniority).filter(Boolean));
    const areaSet = new Set(profiles.map(p => p.professional_area).filter(Boolean));
    populateSelect('crmFilterSeniority', [...senioritySet].sort());
    populateSelect('crmFilterArea', [...areaSet].sort());

    const stageFilter = document.getElementById('crmFilterStage')?.value || 'all';
    const productFilter = document.getElementById('crmFilterProduct')?.value || 'all';
    const senFilter = document.getElementById('crmFilterSeniority')?.value || 'all';
    const areaFilter = document.getElementById('crmFilterArea')?.value || 'all';
    const search = (document.getElementById('crmSearch')?.value || '').toLowerCase();

    let filtered = profiles;
    if (stageFilter !== 'all') filtered = filtered.filter(p => p.stage === stageFilter);
    if (senFilter !== 'all') filtered = filtered.filter(p => p.seniority === senFilter);
    if (areaFilter !== 'all') filtered = filtered.filter(p => p.professional_area === areaFilter);
    if (productFilter !== 'all') {
        filtered = filtered.filter(p => {
            if (productFilter === 'cv_free') return p.analyses.some(a => getAnalysisType(a) === 'free');
            if (productFilter === 'cv_paid') return p.purchases.some(a => a.analysis_type !== 'career_path' && a.analysis_type !== 'career_intelligence');
            if (productFilter === 'career_path') return p.purchases.some(a => a.analysis_type === 'career_path');
            if (productFilter === 'career_intelligence') return p.purchases.some(a => a.analysis_type === 'career_intelligence');
            return true;
        });
    }
    if (search) filtered = filtered.filter(p => p.email.includes(search) || (p.name || '').toLowerCase().includes(search));
    setText('crmCount', `${filtered.length} contactos`);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    crmPage = Math.min(crmPage, totalPages || 1);
    const page = filtered.slice((crmPage - 1) * PAGE_SIZE, crmPage * PAGE_SIZE);
    const tbody = document.getElementById('crmTable');
    if (!tbody) return;
    if (!page.length) { tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhum contacto encontrado</td></tr>`; return; }

    const productNameMap = t => t === 'career_path' ? 'Career Path' : t === 'career_intelligence' ? 'Career Intelligence' : t === 'linkedin_roaster' ? 'LinkedIn Roaster' : t === 'cv_analyser' ? 'CV Analyser' : 'CV Analyser';
    tbody.innerHTML = page.map(p => {
        const initials = (p.name || p.email).slice(0, 2).toUpperCase();
        const lastDate = new Date(p.lastInteraction).toLocaleDateString('pt-PT');
        const productsUsed = [...new Set(p.analyses.map(a => productNameMap(a.analysis_type || '')))].join(', ');
        const productsBought = p.purchases.length > 0 ? [...new Set(p.purchases.map(a => productNameMap(a.analysis_type)))].join(', ') : '—';
        return `<tr>
            <td><div style="display:flex;align-items:center;gap:10px;"><div class="lead-avatar">${initials}</div><div><div class="lead-name">${p.name || '—'}</div><div class="lead-email">${p.email}</div></div></div></td>
            <td style="font-size:12px;">${p.professional_area || '—'}</td>
            <td style="font-size:12px;">${p.seniority || '—'}</td>
            <td style="font-size:12px;">${productsUsed}</td>
            <td style="font-size:12px;">${productsBought}</td>
            <td style="font-size:12px;font-weight:600;color:var(--gold);">${p.totalSpent > 0 ? p.totalSpent.toFixed(2) + '€' : '—'}</td>
            <td style="font-size:12px;color:var(--text-muted);">${lastDate}</td>
            <td>${getStageBadge(p.stage)}</td>
            <td><div style="display:flex;gap:4px;">
                <button class="btn-icon" title="Ver Perfil" onclick="showUserProfile('${p.email}')"><i class="fas fa-eye"></i></button>
                <button class="btn-icon" title="Enviar Email" onclick="openEmailModal('${p.email}','${(p.name||'').replace(/'/g,"\\'")}','${p.stage || ''}')"><i class="fas fa-envelope"></i></button>
            </div></td>
        </tr>`;
    }).join('');
    renderPagination('crmPagination', crmPage, totalPages, (p) => { crmPage = p; renderCRM(); });
}

function populateSelect(id, options) {
    const el = document.getElementById(id);
    if (!el) return;
    const current = el.value;
    const existing = [...el.options].map(o => o.value);
    options.forEach(opt => { if (!existing.includes(opt)) { const o = document.createElement('option'); o.value = opt; o.textContent = opt; el.appendChild(o); } });
    if (current) el.value = current;
}

function exportCRMCSV() {
    const profiles = buildCRMProfiles();
    const rows = [['Email','Nome','Área','Senioridade','Produtos Usados','Produtos Comprados','Total Gasto','Última Interação','Etapa']];
    profiles.forEach(p => {
        rows.push([p.email, p.name || '', p.professional_area || '', p.seniority || '',
            [...new Set(p.analyses.map(a => a.analysis_type || 'CV Analyser'))].join(';'),
            [...new Set(p.purchases.map(a => a.analysis_type || 'CV Analyser'))].join(';') || '',
            p.totalSpent.toFixed(2), p.lastInteraction?.slice(0, 10), p.stage]);
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
        <div class="profile-section"><h4>Informação do Contacto</h4>
            <div class="profile-row"><span>Email</span><span>${p.email}</span></div>
            <div class="profile-row"><span>Nome</span><span>${p.name || '—'}</span></div>
            <div class="profile-row"><span>Área Profissional</span><span>${p.professional_area || '—'}</span></div>
            <div class="profile-row"><span>Senioridade</span><span>${p.seniority || '—'}</span></div>
            <div class="profile-row"><span>Etapa do Funil</span><span>${getStageBadge(p.stage)}</span></div>
            <div class="profile-row"><span>Primeira Interação</span><span>${new Date(p.firstInteraction).toLocaleDateString('pt-PT')}</span></div>
            <div class="profile-row"><span>Última Interação</span><span>${new Date(p.lastInteraction).toLocaleDateString('pt-PT')}</span></div>
        </div>
        <div class="profile-section"><h4>Produtos & Compras</h4>
            <div class="profile-row"><span>Análises Realizadas</span><span>${p.analyses.length}</span></div>
            <div class="profile-row"><span>Produtos Comprados</span><span>${p.purchases.length}</span></div>
            <div class="profile-row"><span>Total Gasto</span><span style="font-weight:700;color:var(--gold);">${p.totalSpent.toFixed(2)}€</span></div>
        </div>
        <div class="profile-section"><h4>Histórico de Atividade</h4>
            ${timeline.slice(0, 10).map(item => {
                const isEmail = item.sent_at;
                const date = new Date(item.created_at || item.sent_at).toLocaleDateString('pt-PT');
                const desc = isEmail ? `Email: ${item.subject || item.email_type || 'Follow-up'}` : `Análise ${getAnalysisType(item)} — Score: ${item.score || '—'}`;
                return `<div class="timeline-item"><div class="timeline-dot"></div><div class="timeline-content"><div>${desc}</div><div class="timeline-date">${date}</div></div></div>`;
            }).join('')}
        </div>
        <div style="display:flex;gap:8px;margin-top:16px;">
            <button class="btn btn-gold btn-sm" onclick="openEmailModal('${p.email}','${(p.name||'').replace(/'/g,"\\'")}','${p.stage || ''}')"><i class="fas fa-envelope"></i> Enviar Email</button>
            <button class="btn btn-outline btn-sm" onclick="closeUserProfile()">Fechar</button>
        </div>`;
}
function closeUserProfile() { document.getElementById('userProfileModal').style.display = 'none'; }

// ═══════════════════════════════════════════════════════════════
//  ANÁLISES TAB
// ═══════════════════════════════════════════════════════════════
function filterAnalyses() { currentPage = 1; renderAnalyses(); }

function renderAnalyses() {
    const lrTagged = allLinkedinRoaster.map(a => ({ ...a, _source: 'linkedin_roaster', analysis_type: 'linkedin_roaster' }));
    let data = filterByLang([...allAnalyses, ...lrTagged], globalLang);
    data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const type = document.getElementById('filterType')?.value || 'all';
    const email = (document.getElementById('filterSearch')?.value || '').toLowerCase();
    const period = document.getElementById('filterPeriod')?.value || 'all';
    if (type !== 'all') {
        if (type === 'linkedin_roaster') data = data.filter(a => a._source === 'linkedin_roaster');
        else if (type === 'cv') data = data.filter(a => a.analysis_type !== 'career_path' && a.analysis_type !== 'career_intelligence' && a._source !== 'linkedin_roaster');
        else if (type === 'career_path') data = data.filter(a => a.analysis_type === 'career_path');
        else if (type === 'career_intelligence') data = data.filter(a => a.analysis_type === 'career_intelligence');
        else data = data.filter(a => getAnalysisType(a) === type);
    }
    if (email) data = data.filter(a => (a.user_email || '').toLowerCase().includes(email));
    if (period !== 'all') data = filterByPeriod(data, parseInt(period));
    setText('analysesCount', `${data.length} análises`);
    const totalPages = Math.ceil(data.length / PAGE_SIZE);
    currentPage = Math.min(currentPage, totalPages || 1);
    const page = data.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const tbody = document.getElementById('analysesTable');
    if (!tbody) return;
    if (!page.length) { tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhuma análise encontrada</td></tr>`; return; }
    tbody.innerHTML = page.map(a => {
        const aType = getAnalysisType(a);
        const dt = new Date(a.created_at);
        const date = dt.toLocaleDateString('pt-PT') + ' ' + dt.toLocaleTimeString('pt-PT', {hour:'2-digit', minute:'2-digit'});
        const rawScore = a.score || a.teaser_score || 0;
        const score = rawScore > 0 ? `<span style="font-weight:600;color:${rawScore >= 70 ? 'var(--green)' : rawScore >= 40 ? 'var(--orange)' : 'var(--red)'};">${rawScore}</span>` : '—';
        const amount = a.payment_amount > 0 ? `<span style="color:var(--gold);font-weight:600;">${a.payment_amount.toFixed(2)}€</span>` : '—';
        const area = a.professional_area || a.area || '—';
        const paymentMethod = a.payment_method || a.payment_origin || (a.payment_amount > 0 ? 'stripe' : '—');
        const rating = a.user_rating || a.rating || '—';
        return `<tr>
            <td style="font-size:12px;color:var(--text-muted);">${date}</td>
            <td>${esc(a.user_name || '—')}</td>
            <td style="font-size:12px;">${isAnonymous(a) ? '<span style="color:var(--text-muted);">anónimo</span>' : esc(a.user_email)}</td>
            <td>${getTypeBadge(aType)}</td>
            <td>${score}</td>
            <td style="font-size:12px;">${esc(area)}</td>
            <td style="font-size:12px;">${esc(paymentMethod)}</td>
            <td>${amount}</td>
            <td style="font-size:12px;">${rating !== '—' ? '⭐ ' + rating : '—'}</td>
            <td><div style="display:flex;gap:4px;">
                ${!isAnonymous(a) ? `<button class="btn-icon" title="Ver Perfil" onclick="showUserProfile('${a.user_email.toLowerCase()}')"><i class="fas fa-eye"></i></button>` : ''}
            </div></td>
        </tr>`;
    }).join('');
    renderPagination('analysesPagination', currentPage, totalPages, (p) => { currentPage = p; renderAnalyses(); });
}

function exportAnalysesCSV() {
    const lrTagged = allLinkedinRoaster.map(a => ({ ...a, _source: 'linkedin_roaster', analysis_type: 'linkedin_roaster' }));
    let data = filterByLang([...allAnalyses, ...lrTagged], globalLang);
    data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const rows = [['Data','Nome','Email','Score','Tipo','Produto','Valor','Origem']];
    data.forEach(a => {
        const productName = a._source === 'linkedin_roaster' ? 'LinkedIn Roaster' : a.analysis_type === 'career_intelligence' ? 'Career Intelligence' : a.analysis_type === 'career_path' ? 'Career Path' : a.analysis_type === 'bundle' ? 'Bundle' : 'CV Analyser';
        rows.push([a.created_at?.slice(0,10), a.user_name||'', a.user_email||'', a.score||a.teaser_score||'', getAnalysisType(a), productName, a.payment_amount||0, getPaymentOrigin(a)]);
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
    const email = (document.getElementById('filterVoucherSearch')?.value || '').toLowerCase();
    if (status !== 'all') {
        if (status === 'active') data = data.filter(v => v.is_active === true || (!v.is_active && v.used_analyses < v.total_analyses));
        else data = data.filter(v => v.is_active === false || v.used_analyses >= v.total_analyses);
    }
    if (email) data = data.filter(v => (v.email || '').toLowerCase().includes(email) || (v.code || '').toLowerCase().includes(email));
    setText('vouchersCount', `${data.length} vouchers`);
    const tbody = document.getElementById('vouchersTable');
    if (!tbody) return;
    if (!data.length) { tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhum voucher encontrado</td></tr>`; return; }
    tbody.innerHTML = data.map(v => {
        const isActive = v.is_active === true || (v.is_active !== false && (v.used_analyses || 0) < (v.total_analyses || 1));
        const date = new Date(v.created_at).toLocaleDateString('pt-PT');
        const method = v.payment_method || (parseFloat(v.amount_paid) > 0 ? 'stripe' : 'oferta');
        return `<tr>
            <td style="font-size:12px;color:var(--text-muted);">${date}</td>
            <td style="font-size:12px;">${esc(v.email || '—')}</td>
            <td style="font-size:12px;">${esc(v.plan_name || '—')}</td>
            <td><code style="font-size:12px;background:var(--bg);padding:2px 6px;border-radius:4px;">${esc(v.code)}</code></td>
            <td style="font-size:12px;">${esc(method)}</td>
            <td style="font-size:12px;font-weight:600;">${parseFloat(v.amount_paid) > 0 ? parseFloat(v.amount_paid).toFixed(2) + '€' : '—'}</td>
            <td><span class="badge ${isActive ? 'badge-success' : 'badge-secondary'}">${isActive ? 'Ativo' : 'Usado'}</span></td>
            <td style="font-size:12px;text-align:center;">${v.used_analyses||0}/${v.total_analyses||1}</td>
        </tr>`;
    }).join('');
}

function exportVouchersCSV() {
    const rows = [['Código','Email','Plano','Valor','Estado','Usado/Total','Data']];
    allVouchers.forEach(v => rows.push([v.code, v.email||'', v.plan_name||'', v.amount_paid||'', v.is_active ? 'Ativo' : 'Usado', `${v.used_analyses||0}/${v.total_analyses||1}`, v.created_at?.slice(0,10)]));
    downloadCSV(rows, 'vouchers.csv');
}

function showCreateVoucherModal() { document.getElementById('voucherModalOverlay').style.display = 'flex'; }
function closeVoucherModal() { document.getElementById('voucherModalOverlay').style.display = 'none'; }

async function createVouchers() {
    const email = document.getElementById('voucherEmail')?.value?.trim();
    const planVal = document.getElementById('voucherPlan')?.value;
    const payment = document.getElementById('voucherPayment')?.value;
    const sendEmail = document.getElementById('voucherSendEmail')?.checked;
    if (!email) { showToast('Email obrigatório', 'danger'); return; }
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
            await supaInsert('vouchers', { code, email, plan_name: item.plan_name, total_analyses: 1, used_analyses: 0, amount_paid: item.amount_paid, payment_method: 'oferta', voucher_type: item.voucher_type, includes_career_path: item.includes_career_path, is_active: true, created_at: new Date().toISOString() });
        }
        showToast(`Pack Teste criado! ${codes.map(c => c.code).join(', ')}`, 'success');
        closeVoucherModal();
        if (sendEmail && ensureBrevoKey()) {
            const codesList = codes.map(c => `<strong>${c.plan}</strong>: <span style="font-size:18px;font-weight:bold;color:#C9A961;">${c.code}</span>`).join('<br>');
            await sendBrevoEmail(email, 'Os teus vouchers Share2Inspire — Pack Teste', `<p>Olá,</p><p>Seguem os teus vouchers de teste:</p>${codesList}<p style="margin-top:16px;">Acede a <a href="https://www.share2inspire.pt">share2inspire.pt</a> para usar.</p><p>Equipa Share2Inspire</p>`);
        }
        await loadAllData(); renderVouchers(); return;
    }
    const [planName, totalStr, amountStr, vType, cpFlag] = planVal.split('|');
    const total = parseInt(totalStr); const amount = parseFloat(amountStr);
    const codes = [];
    for (let i = 0; i < total; i++) {
        const code = 'S2I-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        codes.push(code);
        await supaInsert('vouchers', { code, email, plan_name: planName, total_analyses: 1, used_analyses: 0, amount_paid: amount.toString(), payment_method: payment, voucher_type: vType, includes_career_path: cpFlag === 'true', is_active: true, created_at: new Date().toISOString() });
    }
    showToast(`${codes.length} voucher(s) criado(s)!`, 'success');
    closeVoucherModal();
    if (sendEmail && ensureBrevoKey()) {
        await sendBrevoEmail(email, `O teu voucher Share2Inspire — ${planName}`, `<p>Olá,</p><p>Segue o teu voucher para <strong>${planName}</strong>:</p><p style="font-size:20px;font-weight:bold;color:#C9A961;">${codes.join('<br>')}</p><p>Acede a <a href="https://www.share2inspire.pt">share2inspire.pt</a> para usar.</p>`);
    }
    await loadAllData(); renderVouchers();
}


// ═══════════════════════════════════════════════════════════════
//  EMAIL MODULE
// ═══════════════════════════════════════════════════════════════
function openEmailModal(to, name, stage) {
    document.getElementById('modalEmailTo').value = to || '';
    document.getElementById('modalEmailSubject').value = '';
    document.getElementById('modalEmailBody').value = '';
    document.getElementById('modalEmailLang').value = 'pt';
    // Auto-select template based on CRM stage
    let autoTemplate = '';
    if (stage === 'Lead' || stage === 'Nurturing') autoTemplate = 'upsell_cv';
    else if (stage === 'Recorrente') autoTemplate = 'testimonial';
    else if (stage === 'Cliente') autoTemplate = 'upsell_cp';
    document.getElementById('modalEmailTemplate').value = autoTemplate;
    if (autoTemplate) loadEmailTemplate();
    document.getElementById('emailModalOverlay').style.display = 'flex';
}
function closeEmailModal() { document.getElementById('emailModalOverlay').style.display = 'none'; }

function loadEmailTemplate() {
    const tpl = document.getElementById('modalEmailTemplate').value;
    const lang = document.getElementById('modalEmailLang').value;
    const to = document.getElementById('modalEmailTo').value;
    const templates = {
        pt: {
            upsell_cv: { subject: 'O teu CV merece mais — upgrade disponível', body: `Olá,\n\nVimos que fizeste uma análise gratuita do teu CV. Gostarias de desbloquear a versão completa com recomendações detalhadas?\n\nAcede a share2inspire.pt/cv-analyser para fazer upgrade.\n\nEquipa Share2Inspire` },
            upsell_cp: { subject: 'Descobre o teu Career Path personalizado', body: `Olá,\n\nCom base na tua análise de CV, preparámos um Career Path personalizado para ti.\n\nDescobre as melhores oportunidades em share2inspire.pt/career-path\n\nEquipa Share2Inspire` },
            upsell_ci: { subject: 'Career Intelligence — análise profunda do teu mercado', body: `Olá,\n\nJá tens o teu Career Path. Agora leva a tua carreira ao próximo nível com o Career Intelligence PRO.\n\nDescobre mais em share2inspire.pt/career-intelligence\n\nEquipa Share2Inspire` },
            followup: { subject: 'Precisas de ajuda com a tua carreira?', body: `Olá,\n\nVimos que visitaste o Share2Inspire recentemente. Podemos ajudar-te com alguma questão sobre a tua carreira?\n\nResponde a este email e teremos todo o gosto em ajudar.\n\nEquipa Share2Inspire` },
            testimonial: { subject: 'A tua experiência com o Share2Inspire', body: `Olá,\n\nEsperamos que a tua experiência com o Share2Inspire tenha sido positiva! Gostaríamos muito de ouvir o teu feedback.\n\nPoderias partilhar um breve testemunho sobre como as nossas ferramentas te ajudaram?\n\nEquipa Share2Inspire` }
        },
        en: {
            upsell_cv: { subject: 'Your CV deserves more — upgrade available', body: `Hi,\n\nWe noticed you did a free CV analysis. Would you like to unlock the full version with detailed recommendations?\n\nVisit share2inspire.pt/en/cv-analyser to upgrade.\n\nShare2Inspire Team` },
            upsell_cp: { subject: 'Discover your personalized Career Path', body: `Hi,\n\nBased on your CV analysis, we've prepared a personalized Career Path for you.\n\nDiscover the best opportunities at share2inspire.pt/en/career-path\n\nShare2Inspire Team` },
            upsell_ci: { subject: 'Career Intelligence — deep market analysis', body: `Hi,\n\nYou already have your Career Path. Now take your career to the next level with Career Intelligence PRO.\n\nLearn more at share2inspire.pt/en/career-intelligence\n\nShare2Inspire Team` },
            followup: { subject: 'Need help with your career?', body: `Hi,\n\nWe noticed you visited Share2Inspire recently. Can we help you with any career-related questions?\n\nReply to this email and we'll be happy to help.\n\nShare2Inspire Team` },
            testimonial: { subject: 'Your experience with Share2Inspire', body: `Hi,\n\nWe hope your experience with Share2Inspire has been positive! We'd love to hear your feedback.\n\nCould you share a brief testimonial about how our tools helped you?\n\nShare2Inspire Team` }
        }
    };
    const t = templates[lang]?.[tpl];
    if (t) {
        document.getElementById('modalEmailSubject').value = t.subject;
        document.getElementById('modalEmailBody').value = t.body;
    }
}

async function sendBrevoEmail(to, subject, htmlContent) {
    const key = getBrevoKey();
    if (!key) return false;
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'accept': 'application/json', 'content-type': 'application/json', 'api-key': key },
        body: JSON.stringify({ sender: BREVO_SENDER, to: [{ email: to }], subject, htmlContent })
    });
    return res.ok;
}

async function sendSingleEmail() {
    if (!ensureBrevoKey()) return;
    const to = document.getElementById('modalEmailTo').value.trim();
    const subject = document.getElementById('modalEmailSubject').value.trim();
    const body = document.getElementById('modalEmailBody').value.trim();
    if (!to || !subject || !body) { showToast('Preenche todos os campos', 'danger'); return; }
    const htmlBody = body.replace(/\n/g, '<br>');
    const ok = await sendBrevoEmail(to, subject, htmlBody);
    if (ok) {
        showToast('Email enviado com sucesso!', 'success');
        await supaInsert('email_history', { recipient_email: to, subject, body: htmlBody, email_type: 'manual', sent_at: new Date().toISOString(), status: 'sent' });
        closeEmailModal();
        await loadEmailHistory();
        renderEmailHistory();
    } else { showToast('Erro ao enviar email', 'danger'); }
}

// ═══════════════════════════════════════════════════════════════
//  CAMPAIGNS (Bulk Email)
// ═══════════════════════════════════════════════════════════════
function renderNurturingSegments() {
    const lang = nurturingLang;
    const profiles = buildCRMProfiles().filter(p => {
        if (lang === 'pt') return filterByLang(p.analyses, 'pt').length > 0;
        if (lang === 'en') return filterByLang(p.analyses, 'en').length > 0;
        return true;
    });
    const leads = profiles.filter(p => p.stage === 'lead');
    const clients = profiles.filter(p => p.stage === 'client');
    const recurring = profiles.filter(p => p.stage === 'recurring');
    const el = document.getElementById('nurturingSegments');
    if (el) {
        el.innerHTML = `
            <div class="metric-row"><div class="metric-label">Leads (sem compra)</div><div class="metric-value">${leads.length}</div></div>
            <div class="metric-row"><div class="metric-label">Clientes (1 compra)</div><div class="metric-value">${clients.length}</div></div>
            <div class="metric-row"><div class="metric-label">Recorrentes (2+ compras)</div><div class="metric-value">${recurring.length}</div></div>`;
    }
    renderRecipientList(profiles);
}

function renderRecipientList(profiles) {
    if (!profiles) profiles = buildCRMProfiles();
    const tbody = document.getElementById('recipientTable');
    if (!tbody) return;
    const search = (document.getElementById('recipientSearch')?.value || '').toLowerCase();
    let filtered = profiles.filter(p => !search || p.email.includes(search) || (p.name || '').toLowerCase().includes(search));
    setText('recipientCount', `${filtered.length} destinatários`);
    tbody.innerHTML = filtered.slice(0, 100).map(p => `
        <tr>
            <td><input type="checkbox" class="recipient-cb" value="${p.email}" checked></td>
            <td style="font-size:12px;">${p.name || '—'}</td>
            <td style="font-size:12px;">${p.email}</td>
            <td>${getStageBadge(p.stage)}</td>
        </tr>`).join('');
}

function filterRecipientList() { renderNurturingSegments(); }
function toggleAllRecipients(checked) { document.querySelectorAll('.recipient-cb').forEach(cb => cb.checked = checked); }
function selectOnlyUnsent() {
    const sentEmails = new Set(allEmailHistory.map(e => e.recipient_email?.toLowerCase()));
    document.querySelectorAll('.recipient-cb').forEach(cb => { cb.checked = !sentEmails.has(cb.value.toLowerCase()); });
}

async function sendBulkEmail() {
    if (!ensureBrevoKey()) return;
    const subject = document.getElementById('nurturingSubject')?.value?.trim();
    const body = document.getElementById('nurturingBody')?.value?.trim();
    if (!subject || !body) { showToast('Preenche assunto e corpo do email', 'danger'); return; }
    const recipients = [...document.querySelectorAll('.recipient-cb:checked')].map(cb => cb.value);
    if (!recipients.length) { showToast('Seleciona pelo menos um destinatário', 'danger'); return; }
    if (!confirm(`Enviar email para ${recipients.length} destinatários?`)) return;
    let sent = 0, failed = 0;
    const htmlBody = body.replace(/\n/g, '<br>');
    for (const email of recipients) {
        try {
            const ok = await sendBrevoEmail(email, subject, htmlBody);
            if (ok) {
                sent++;
                await supaInsert('email_history', { recipient_email: email, subject, body: htmlBody, email_type: 'campaign', sent_at: new Date().toISOString(), status: 'sent' });
            } else { failed++; }
        } catch (e) { failed++; }
        if (sent % 5 === 0) showToast(`Enviados: ${sent}/${recipients.length}`, 'info');
    }
    showToast(`Campanha concluída: ${sent} enviados, ${failed} falhados`, sent > 0 ? 'success' : 'danger');
    await loadEmailHistory();
    renderEmailHistory();
}

// ═══════════════════════════════════════════════════════════════
//  EMAIL HISTORY
// ═══════════════════════════════════════════════════════════════
function renderEmailHistory() {
    let data = [...allEmailHistory].sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));
    const type = document.getElementById('filterHistoryType')?.value || 'all';
    const search = (document.getElementById('filterHistorySearch')?.value || '').toLowerCase();
    if (type !== 'all') {
        if (type === 'auto') data = data.filter(e => e.email_type === 'upsell_auto_2h' || e.email_type === 'upsell_auto_7d');
        else if (type === 'manual') data = data.filter(e => e.email_type === 'manual');
        else if (type === 'bulk') data = data.filter(e => e.email_type === 'campaign');
        else data = data.filter(e => e.email_type === type);
    }
    if (search) data = data.filter(e => (e.recipient_email || '').toLowerCase().includes(search) || (e.subject || '').toLowerCase().includes(search));
    setText('historyCount', `${data.length} emails`);
    const totalPages = Math.ceil(data.length / PAGE_SIZE);
    historyPage = Math.min(historyPage, totalPages || 1);
    const page = data.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE);
    const tbody = document.getElementById('emailHistoryTable');
    if (!tbody) return;
    if (!page.length) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhum email encontrado</td></tr>`; return; }
    tbody.innerHTML = page.map(e => {
        const date = new Date(e.sent_at).toLocaleDateString('pt-PT') + ' ' + new Date(e.sent_at).toLocaleTimeString('pt-PT', {hour:'2-digit',minute:'2-digit'});
        const typeMap = { manual: 'Manual', campaign: 'Campanha', upsell_auto_2h: 'Auto 2h', upsell_auto_7d: 'Auto 7d', welcome: 'Boas-vindas' };
        const typeBadge = `<span class="badge badge-${e.email_type === 'campaign' ? 'purple' : e.email_type === 'manual' ? 'teal' : 'secondary'}">${typeMap[e.email_type] || e.email_type}</span>`;
        return `<tr>
            <td style="font-size:12px;color:var(--text-muted);">${date}</td>
            <td style="font-size:12px;">${e.recipient_email || '—'}</td>
            <td style="font-size:12px;">${e.subject || '—'}</td>
            <td>${typeBadge}</td>
            <td><span class="badge badge-success">Enviado</span></td>
        </tr>`;
    }).join('');
    renderPagination('emailHistoryPagination', historyPage, totalPages, (p) => { historyPage = p; renderEmailHistory(); });
}

// ═══════════════════════════════════════════════════════════════
//  CONTACT MESSAGES
// ═══════════════════════════════════════════════════════════════
function renderContactMessages() {
    const data = [...allContacts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setText('messagesCount', `${data.length} mensagens`);
    const tbody = document.getElementById('contactsTable');
    if (!tbody) return;
    if (!data.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhuma mensagem recebida</td></tr>'; return; }
    tbody.innerHTML = data.map(m => {
        const date = new Date(m.created_at).toLocaleDateString('pt-PT') + ' ' + new Date(m.created_at).toLocaleTimeString('pt-PT', {hour:'2-digit',minute:'2-digit'});
        const msgPreview = (m.message || '').length > 80 ? (m.message || '').slice(0, 80) + '…' : (m.message || '—');
        return `<tr>
            <td style="font-size:12px;color:var(--text-muted);">${date}</td>
            <td style="font-size:12px;">${esc(m.name || '—')}</td>
            <td style="font-size:12px;">${esc(m.email || '—')}</td>
            <td style="font-size:12px;">${esc(m.subject || '—')}</td>
            <td style="font-size:12px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(m.message || '')}">${esc(msgPreview)}</td>
        </tr>`;
    }).join('');
}

// ═══════════════════════════════════════════════════════════════
//  MARKET: JOB SEARCH
// ═══════════════════════════════════════════════════════════════
function renderJobSearchTable() {
    let data = [...allJobSearch].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const period = document.getElementById('filterJobPeriod')?.value || 'all';
    const search = (document.getElementById('filterJobSearch')?.value || '').toLowerCase();
    const seniority = document.getElementById('filterJobSeniority')?.value || 'all';
    if (period !== 'all') data = filterByPeriod(data, parseInt(period));
    if (search) data = data.filter(j => (j.desired_role || '').toLowerCase().includes(search) || (j.target_country || '').toLowerCase().includes(search));
    if (seniority !== 'all') data = data.filter(j => (j.seniority_level || '').toLowerCase() === seniority.toLowerCase());

    // Charts
    const roleCounts = {};
    const skillCounts = {};
    const senCounts = {};
    const gapCounts = {};
    data.forEach(j => {
        const role = j.desired_role || 'Não especificado';
        roleCounts[role] = (roleCounts[role] || 0) + 1;
        const sen = j.seniority_level || 'N/A';
        senCounts[sen] = (senCounts[sen] || 0) + 1;
        (j.top_skills || []).forEach(s => { skillCounts[s] = (skillCounts[s] || 0) + 1; });
        (j.keyword_gaps || []).forEach(g => { gapCounts[g] = (gapCounts[g] || 0) + 1; });
    });

    const topRoles = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const topSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const topGaps = Object.entries(gapCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const senEntries = Object.entries(senCounts).sort((a, b) => b[1] - a[1]);

    // KPIs
    const withJob = data.filter(j => j.has_job_posting || j.ats_score > 0);
    setText('kpiJobTotal', data.length);
    setText('kpiJobWithJob', withJob.length);
    setText('kpiJobNoJob', data.length - withJob.length);
    setText('kpiJobUniqueRoles', Object.keys(roleCounts).length);
    setText('jobSearchCount', `${data.length} pesquisas`);

    renderBarChart('chartTopRoles', topRoles, 'Cargos', '#C9A961');
    renderBarChart('chartTopSkills', topSkills, 'Competências', '#3B82F6');
    renderBarChart('chartKeywordGaps', topGaps, 'Gaps', '#EF4444');
    renderBarChart('chartSeniority', senEntries, 'Senioridade', '#7C3AED');

    // Table body
    const tbody = document.getElementById('jobSearchTable');
    if (tbody) {
        if (!data.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">Sem dados de pesquisa de mercado. Os dados serão preenchidos à medida que os utilizadores usarem as ferramentas de análise.</td></tr>';
        } else {
            tbody.innerHTML = data.slice(0, 50).map(j => {
                const date = new Date(j.created_at).toLocaleDateString('pt-PT');
                const skills = (j.top_skills || []).map(s => `<span class="badge" style="background:var(--blue);color:#fff;font-size:9px;">${esc(s)}</span>`).join(' ');
                const jobBadge = j.has_job_posting ? '<span class="badge badge-success">Sim</span>' : '<span class="badge" style="background:var(--text-muted);color:#fff;">Não</span>';
                return `<tr><td style="font-size:12px;">${date}</td><td style="font-size:12px;">${esc(j.user_name || '—')}</td><td style="font-size:12px;">${esc(j.desired_role || '—')}</td><td style="font-size:12px;">${esc(j.seniority_level || '—')}</td><td>${skills || '—'}</td><td>${jobBadge}</td><td style="font-size:12px;">${j.ats_score || '—'}</td></tr>`;
            }).join('');
        }
    }

    // Cross-reference insight
    const crossEl = document.getElementById('marketCrossRef');
    if (!data.length && crossEl) {
        crossEl.innerHTML = '<div style="padding:12px;background:var(--teal-bg);border-radius:8px;border-left:3px solid var(--teal);font-size:13px;">Sem dados suficientes para cruzamento. Os insights serão gerados automaticamente quando houver dados de pesquisa de mercado.</div>';
    } else if (crossEl && allCareerEnergy.length > 0 && data.length > 0) {
        const ceRoles = {};
        allCareerEnergy.forEach(ce => {
            const role = ce.current_role || ce.desired_role || '';
            if (role) ceRoles[role] = (ceRoles[role] || 0) + 1;
        });
        const overlap = topRoles.filter(([role]) => ceRoles[role]);
        const crossText = overlap.length > 0
            ? `<strong>${overlap.length}</strong> dos top ${topRoles.length} cargos procurados também aparecem no Career Energy. Cargos em comum: ${overlap.map(([r]) => `<span class="badge badge-teal">${r}</span>`).join(' ')}`
            : 'Sem sobreposição directa entre cargos procurados e Career Energy.';
        setText('marketCrossRefText', '');
        crossEl.innerHTML = `<div style="padding:12px;background:var(--teal-bg);border-radius:8px;border-left:3px solid var(--teal);font-size:13px;">${crossText}</div>`;
    }
}

let chartInstances = {};
function renderBarChart(canvasId, entries, label, color) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    if (chartInstances[canvasId]) chartInstances[canvasId].destroy();
    chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: { labels: entries.map(e => e[0]), datasets: [{ label, data: entries.map(e => e[1]), backgroundColor: color, borderRadius: 4 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true, animation: { duration: 0 }, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { size: 10 } } }, y: { ticks: { font: { size: 10 } } } } }
    });
}

function exportJobSearchCSV() {
    const rows = [['Data','Cargo','País','Senioridade','Skills','Gaps']];
    allJobSearch.forEach(j => rows.push([j.created_at?.slice(0,10), j.desired_role||'', j.target_country||'', j.seniority_level||'', (j.top_skills||[]).join(';'), (j.keyword_gaps||[]).join(';')]));
    downloadCSV(rows, 'job_search.csv');
}

// ═══════════════════════════════════════════════════════════════
//  MARKET: CAREER ENERGY
// ═══════════════════════════════════════════════════════════════
function renderCETable() {
    let data = [...allCareerEnergy].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const country = document.getElementById('filterCECountry')?.value || 'all';
    const level = document.getElementById('filterCELevel')?.value || 'all';
    if (country !== 'all') data = data.filter(ce => (ce.country || '').toLowerCase().includes(country.toLowerCase()));
    if (level !== 'all') data = data.filter(ce => (ce.energy_level || '').toLowerCase() === level.toLowerCase());

    // Score chart
    const scoreBuckets = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
    data.forEach(ce => {
        const s = ce.score || ce.energy_score || 0;
        if (s <= 20) scoreBuckets['0-20']++;
        else if (s <= 40) scoreBuckets['21-40']++;
        else if (s <= 60) scoreBuckets['41-60']++;
        else if (s <= 80) scoreBuckets['61-80']++;
        else scoreBuckets['81-100']++;
    });
    const ctx = document.getElementById('ceScoreChart')?.getContext('2d');
    if (ctx) {
        if (chartInstances['ceScoreChart']) chartInstances['ceScoreChart'].destroy();
        chartInstances['ceScoreChart'] = new Chart(ctx, {
            type: 'bar',
            data: { labels: Object.keys(scoreBuckets), datasets: [{ label: 'Utilizadores', data: Object.values(scoreBuckets), backgroundColor: '#C9A961', borderRadius: 4 }] },
            options: { responsive: true, maintainAspectRatio: true, animation: { duration: 0 }, plugins: { legend: { display: false } }, scales: { y: { ticks: { font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } } }
        });
    }

    setText('ceCount', `${data.length} respostas`);
    const tbody = document.getElementById('ceTable');
    if (!tbody) return;
    if (!data.length) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">Sem dados</td></tr>`; return; }
    tbody.innerHTML = data.slice(0, 50).map(ce => {
        const date = new Date(ce.created_at).toLocaleDateString('pt-PT');
        const score = ce.score || ce.energy_score || 0;
        const scoreColor = score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--orange)' : 'var(--red)';
        return `<tr>
            <td style="font-size:12px;color:var(--text-muted);">${date}</td>
            <td style="font-size:12px;">${ce.current_role || '—'}</td>
            <td style="font-size:12px;">${ce.country || '—'}</td>
            <td style="font-size:12px;">${ce.energy_level || '—'}</td>
            <td><span style="font-weight:600;color:${scoreColor};">${score}</span></td>
            <td style="font-size:12px;">${ce.email || '—'}</td>
        </tr>`;
    }).join('');
}

function exportCECSV() {
    const rows = [['Data','Cargo','País','Nível','Score','Email']];
    allCareerEnergy.forEach(ce => rows.push([ce.created_at?.slice(0,10), ce.current_role||'', ce.country||'', ce.energy_level||'', ce.score||ce.energy_score||'', ce.email||'']));
    downloadCSV(rows, 'career_energy.csv');
}

// ═══════════════════════════════════════════════════════════════
//  SYSTEM: EBOOK DOWNLOADS
// ═══════════════════════════════════════════════════════════════
function renderEbookDownloads() {
    let data = [...allEbookDownloads].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const period = document.getElementById('filterEbookPeriod')?.value || 'all';
    const search = (document.getElementById('filterEbookSearch')?.value || '').toLowerCase();
    if (period !== 'all') data = filterByPeriod(data, parseInt(period));
    if (search) data = data.filter(e => (e.email || '').toLowerCase().includes(search) || (e.name || '').toLowerCase().includes(search));
    setText('ebookCount', `${data.length} downloads`);
    const tbody = document.getElementById('ebookTable');
    if (!tbody) return;
    if (!data.length) { tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text-muted);">Sem downloads</td></tr>`; return; }
    tbody.innerHTML = data.slice(0, 50).map(e => {
        const date = new Date(e.created_at).toLocaleDateString('pt-PT');
        return `<tr><td style="font-size:12px;color:var(--text-muted);">${date}</td><td style="font-size:12px;">${e.name || '—'}</td><td style="font-size:12px;">${e.email || '—'}</td><td style="font-size:12px;">${e.source || '—'}</td></tr>`;
    }).join('');
}

function exportEbookCSV() {
    const rows = [['Data','Nome','Email','Fonte']];
    allEbookDownloads.forEach(e => rows.push([e.created_at?.slice(0,10), e.name||'', e.email||'', e.source||'']));
    downloadCSV(rows, 'ebook_downloads.csv');
}

// ═══════════════════════════════════════════════════════════════
//  SYSTEM: HEALTH LOGS
// ═══════════════════════════════════════════════════════════════
function renderHealthLogs() {
    const el = document.getElementById('healthTable');
    if (!el) return;
    const data = [...allHealthLogs].sort((a, b) => new Date(b.checked_at || b.created_at) - new Date(a.checked_at || a.created_at));
    // KPI calculations
    const last24h = data.filter(h => new Date(h.checked_at || h.created_at) > new Date(Date.now() - 24*60*60*1000));
    const healthy24h = last24h.filter(h => h.status === 'healthy');
    const errors24h = last24h.filter(h => h.status !== 'healthy');
    const uptimePct = last24h.length > 0 ? Math.round(healthy24h.length / last24h.length * 100) : (data.length > 0 ? Math.round(data.filter(h => h.status === 'healthy').length / data.length * 100) : 100);
    const avgTTFB = last24h.length > 0 ? Math.round(last24h.reduce((s, h) => s + (h.ttfb_ms || 0), 0) / last24h.length) : (data.length > 0 ? Math.round(data.reduce((s, h) => s + (h.ttfb_ms || 0), 0) / data.length) : 0);
    const lastCheck = data[0] ? new Date(data[0].checked_at || data[0].created_at).toLocaleString('pt-PT') : '--';
    setText('healthLastCheck', lastCheck);
    setText('healthUptime', uptimePct + '%');
    setText('healthErrors', errors24h.length);
    setText('healthResponseTime', avgTTFB + 'ms');
    const uptimeEl = document.getElementById('healthUptime');
    if (uptimeEl) uptimeEl.className = 'kpi-value ' + (uptimePct >= 99 ? 'green' : uptimePct >= 95 ? 'orange' : 'red');
    const errEl = document.getElementById('healthErrors');
    if (errEl) errEl.className = 'kpi-value ' + (errors24h.length === 0 ? 'green' : 'red');
    const ttfbEl = document.getElementById('healthResponseTime');
    if (ttfbEl) ttfbEl.className = 'kpi-value ' + (avgTTFB < 1000 ? 'green' : avgTTFB < 3000 ? 'orange' : 'red');
    // Endpoint summary
    const endpoints = {};
    data.forEach(h => {
        const name = h.endpoint_name || 'Unknown';
        if (!endpoints[name]) endpoints[name] = { name, checks: 0, healthy: 0, totalTTFB: 0, lastStatus: h.status, lastTTFB: h.ttfb_ms, category: h.category };
        endpoints[name].checks++;
        if (h.status === 'healthy') endpoints[name].healthy++;
        endpoints[name].totalTTFB += (h.ttfb_ms || 0);
    });
    const endpointArr = Object.values(endpoints);
    let summaryContainer = document.getElementById('endpointSummaryGrid');
    if (!summaryContainer) {
        summaryContainer = document.createElement('div');
        summaryContainer.id = 'endpointSummaryGrid';
        summaryContainer.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:16px;';
        const card = el.closest('.card');
        if (card && card.parentElement) card.parentElement.insertBefore(summaryContainer, card);
    }
    if (endpointArr.length > 0) {
        summaryContainer.innerHTML = endpointArr.map(ep => {
            const upPct = ep.checks > 0 ? Math.round(ep.healthy / ep.checks * 100) : 0;
            const avgMs = ep.checks > 0 ? Math.round(ep.totalTTFB / ep.checks) : 0;
            const statusColor = ep.lastStatus === 'healthy' ? 'var(--green)' : 'var(--red)';
            const catIcon = ep.category === 'backend' ? 'fa-server' : ep.category === 'edge_function' ? 'fa-bolt' : 'fa-globe';
            return `<div style="background:var(--white);border:1px solid var(--border);border-radius:8px;padding:12px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><i class="fas ${catIcon}" style="color:${statusColor};"></i><span style="font-size:12px;font-weight:600;">${ep.name}</span></div>
                <div style="display:flex;justify-content:space-between;font-size:11px;"><span>Uptime</span><span style="font-weight:600;color:${upPct >= 99 ? 'var(--green)' : 'var(--red)'};">${upPct}%</span></div>
                <div style="display:flex;justify-content:space-between;font-size:11px;"><span>TTFB médio</span><span style="font-weight:600;">${avgMs}ms</span></div>
                <div style="display:flex;justify-content:space-between;font-size:11px;"><span>Último</span><span style="font-weight:600;color:${statusColor};">${ep.lastTTFB || 0}ms</span></div>
            </div>`;
        }).join('');
    }
    // Table
    const recent = data.slice(0, 50);
    if (!recent.length) { el.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text-muted);">Sem logs de saúde</td></tr>'; return; }
    el.innerHTML = recent.map(h => {
        const date = new Date(h.checked_at || h.created_at).toLocaleString('pt-PT');
        const statusBadge = h.status === 'healthy'
            ? '<span class="badge badge-success">Saudável</span>'
            : h.status === 'warning'
                ? '<span class="badge" style="background:var(--orange);color:#fff;">Aviso</span>'
                : '<span class="badge" style="background:var(--red);color:#fff;">Erro</span>';
        const ttfb = h.ttfb_ms ? h.ttfb_ms + 'ms' : '—';
        const ttfbColor = (h.ttfb_ms || 0) < 1000 ? 'var(--green)' : (h.ttfb_ms || 0) < 3000 ? 'var(--orange)' : 'var(--red)';
        const details = [h.endpoint_name, h.http_code ? 'HTTP ' + h.http_code : '', h.error_message].filter(Boolean).join(' · ');
        return `<tr>
            <td style="font-size:12px;color:var(--text-muted);">${date}</td>
            <td>${statusBadge}</td>
            <td style="font-size:12px;font-weight:600;color:${ttfbColor};">${ttfb}</td>
            <td style="font-size:12px;">${details || '—'}</td>
        </tr>`;
    }).join('');
}

// ═══════════════════════════════════════════════════════════════
//  AFFILIATES
// ═══════════════════════════════════════════════════════════════
function renderAffiliates() {
    const tbody = document.getElementById('affTable');
    if (!tbody) return;
    const active = allAffiliates.filter(a => a.active);
    setText('affKpiTotal', allAffiliates.length);
    setText('affKpiClicks', allAffClicks.length);
    setText('affKpiSales', allAffConversions.length);
    const totalRev = allAffConversions.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
    setText('affKpiRevenue', totalRev.toFixed(2) + '€');

    if (!allAffiliates.length) { tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhum afiliado</td></tr>'; return; }
    const productLabels = {'cv-analyser':'CV','career-path':'CP','career-intelligence':'CI','career-intelligence-pro':'CI PRO','career-intelligence-full':'CI Full','linkedin-roaster':'LR'};
    tbody.innerHTML = allAffiliates.map(a => {
        const clicks = allAffClicks.filter(c => c.affiliate_code === a.code).length;
        const sales = allAffConversions.filter(c => c.affiliate_code === a.code).length;
        const rev = allAffConversions.filter(c => c.affiliate_code === a.code).reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
        const products = (a.product || 'cv-analyser').split(',').map(p => productLabels[p] || p).join(', ');
        const convRate = clicks > 0 ? Math.round(sales / clicks * 100) + '%' : '—';
        const commission = a.commission_percent ? a.commission_percent + '%' : (a.commission || '—');
        const link = `share2inspire.pt/${(a.product||'cv-analyser').split(',')[0]}?ref=${a.code}`;
        const statusBadge = a.active ? '<span class="badge badge-success">Ativo</span>' : '<span class="badge" style="background:var(--red);color:#fff;">Inativo</span>';
        const createdDate = a.created_at ? new Date(a.created_at).toLocaleDateString('pt-PT') : '—';
        return `<tr>
            <td style="font-weight:500;">${esc(a.name)}</td>
            <td style="font-size:12px;">${products}</td>
            <td><code style="font-size:11px;">${esc(a.code)}</code></td>
            <td style="font-size:11px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(link)}">${esc(link)}</td>
            <td style="font-size:12px;text-align:center;">${clicks}</td>
            <td style="font-size:12px;text-align:center;">${sales}</td>
            <td style="font-size:12px;font-weight:600;color:var(--gold);">${rev.toFixed(2)}€</td>
            <td style="font-size:12px;text-align:center;">${convRate}</td>
            <td style="font-size:12px;text-align:center;">${commission}</td>
            <td>${statusBadge}</td>
            <td style="font-size:12px;color:var(--text-muted);">${createdDate}</td>
            <td><div style="display:flex;gap:4px;">
                <button class="btn-icon" onclick="editAffiliate('${a.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn-icon" onclick="toggleAffiliate('${a.id}',${a.active})" title="${a.active?'Desativar':'Ativar'}"><i class="fas fa-${a.active?'pause':'play'}"></i></button>
                <button class="btn-icon" onclick="copyAffLink('${a.code}','${a.product||'cv-analyser'}')" title="Copiar Link"><i class="fas fa-copy"></i></button>
            </div></td>
        </tr>`;
    }).join('');
}

function renderAffClicks() {
    const filterCode = document.getElementById('filterAffClickCode')?.value || 'all';
    let clicks = [...allAffClicks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (filterCode !== 'all') clicks = clicks.filter(c => c.affiliate_code === filterCode);
    const tbody = document.getElementById('affClicksTable');
    if (!tbody) return;
    if (!clicks.length) { tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--text-muted);">Sem cliques</td></tr>'; return; }
    tbody.innerHTML = clicks.slice(0, 50).map(c => {
        const date = new Date(c.created_at).toLocaleDateString('pt-PT') + ' ' + new Date(c.created_at).toLocaleTimeString('pt-PT', {hour:'2-digit',minute:'2-digit'});
        return `<tr><td style="font-size:12px;color:var(--text-muted);">${date}</td><td><code style="font-size:11px;">${c.affiliate_code||'—'}</code></td><td style="font-size:12px;">${c.landing_page||'—'}</td><td style="font-size:12px;">${c.country||'—'}</td><td style="font-size:12px;">${c.city||'—'}</td><td style="font-size:12px;">${c.device_type||'—'}</td><td style="font-size:12px;">${c.browser||'—'}</td><td style="font-size:12px;">${c.os||'—'}</td><td style="font-size:12px;">${c.referrer||'—'}</td></tr>`;
    }).join('');
    populateAffClickFilter();
}

function populateAffClickFilter() {
    const select = document.getElementById('filterAffClickCode');
    if (!select) return;
    const codes = [...new Set(allAffClicks.map(c => c.affiliate_code))];
    const current = select.value;
    select.innerHTML = '<option value="all">Todos</option>' + codes.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
    if (current) select.value = current;
}

function renderAffConversions() {
    const tbody = document.getElementById('affConversionsTable');
    if (!tbody) return;
    const data = [...allAffConversions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (!data.length) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-muted);">Sem conversões</td></tr>'; return; }
    tbody.innerHTML = data.slice(0, 50).map(c => {
        const date = new Date(c.created_at).toLocaleDateString('pt-PT');
        return `<tr><td style="font-size:12px;color:var(--text-muted);">${date}</td><td><code style="font-size:11px;">${c.affiliate_code||'—'}</code></td><td>${getProductBadge(c)}</td><td style="font-weight:600;color:var(--gold);">${parseFloat(c.amount).toFixed(2)}€</td><td style="font-size:12px;">${c.currency || 'EUR'}</td><td style="font-size:12px;">${c.payment_method||'—'}</td><td style="font-size:12px;">${c.customer_email||'—'}</td><td style="font-size:11px;color:var(--text-muted);">${c.transaction_id || c.stripe_payment_id || '—'}</td></tr>`;
    }).join('');
}

function openCreateAffiliateModal() {
    document.getElementById('affEditId').value = '';
    document.getElementById('affName').value = '';
    document.getElementById('affEmail').value = '';
    document.querySelectorAll('.aff-product-cb').forEach(cb => cb.checked = cb.value === 'cv-analyser');
    document.getElementById('affCode').value = '';
    document.getElementById('affCommission').value = '0';
    document.getElementById('affNotes').value = '';
    document.getElementById('affModalTitle').textContent = 'Novo Afiliado';
    updateAffLinkPreview();
    document.getElementById('affModalOverlay').style.display = 'flex';
    document.getElementById('affCode').oninput = function() { this.value = this.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ''); updateAffLinkPreview(); };
}
function closeAffiliateModal() { document.getElementById('affModalOverlay').style.display = 'none'; }

function editAffiliate(id) {
    const aff = allAffiliates.find(a => a.id === id);
    if (!aff) return;
    document.getElementById('affEditId').value = aff.id;
    document.getElementById('affName').value = aff.name || '';
    document.getElementById('affEmail').value = aff.email || '';
    const products = (aff.product || 'cv-analyser').split(',');
    document.querySelectorAll('.aff-product-cb').forEach(cb => cb.checked = products.includes(cb.value));
    document.getElementById('affCode').value = aff.code || '';
    document.getElementById('affCommission').value = aff.commission_pct || 0;
    document.getElementById('affNotes').value = aff.notes || '';
    document.getElementById('affModalTitle').textContent = 'Editar Afiliado';
    updateAffLinkPreview();
    document.getElementById('affModalOverlay').style.display = 'flex';
    document.getElementById('affCode').oninput = function() { this.value = this.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ''); updateAffLinkPreview(); };
}

function updateAffLinkPreview() {
    const products = [...document.querySelectorAll('.aff-product-cb:checked')].map(cb => cb.value);
    const code = document.getElementById('affCode').value.trim().toLowerCase();
    const el = document.getElementById('affLinkPreview');
    if (!el) return;
    if (!products.length) { el.innerHTML = '<span style="color:var(--red);">Seleciona pelo menos um produto</span>'; return; }
    const productLabels = {'cv-analyser':'CV Analyser','career-path':'Career Path','career-intelligence':'Career Intelligence','career-intelligence-pro':'CI PRO','career-intelligence-full':'CI Full','linkedin-roaster':'LinkedIn Roaster'};
    const slug = code || '...';
    el.innerHTML = products.map(p => {
        const links = [`share2inspire.pt/${p}?ref=${slug}`];
        if (p !== 'linkedin-roaster') links.push(`share2inspire.pt/en/${p}?ref=${slug}`);
        return `<div style="margin-bottom:4px;"><strong style="color:var(--dark);">${productLabels[p]}:</strong><br>${links.map(l => `<span style="color:var(--blue);">${l}</span>`).join(' · ')}</div>`;
    }).join('');
}

async function saveAffiliate() {
    const editId = document.getElementById('affEditId').value;
    const name = document.getElementById('affName').value.trim();
    const email = document.getElementById('affEmail').value.trim();
    const code = document.getElementById('affCode').value.trim().toLowerCase();
    const products = [...document.querySelectorAll('.aff-product-cb:checked')].map(cb => cb.value);
    const product = products.join(',');
    const commission = parseFloat(document.getElementById('affCommission').value) || 0;
    const notes = document.getElementById('affNotes').value.trim();
    if (!name) { showToast('Nome é obrigatório', 'danger'); return; }
    if (!code) { showToast('Código é obrigatório', 'danger'); return; }
    if (!products.length) { showToast('Seleciona pelo menos um produto', 'danger'); return; }
    try {
        if (editId) {
            await supaUpdate('affiliates', editId, { name, email: email || null, code, product, commission_pct: commission, notes: notes || null });
            showToast('Afiliado atualizado!', 'success');
        } else {
            await supaInsert('affiliates', { name, email: email || null, code, product, commission_pct: commission, notes: notes || null, active: true });
            showToast('Afiliado criado!', 'success');
        }
        closeAffiliateModal();
        await loadAffiliateData();
        renderAffiliates();
    } catch (e) { showToast('Erro ao guardar: ' + (e.message || 'código duplicado?'), 'danger'); }
}

async function toggleAffiliate(id, currentActive) {
    try {
        await supaUpdate('affiliates', id, { active: !currentActive });
        showToast(currentActive ? 'Afiliado desativado' : 'Afiliado ativado', 'success');
        await loadAffiliateData();
        renderAffiliates();
    } catch (e) { showToast('Erro ao alterar estado', 'danger'); }
}

function copyAffLink(code, product) {
    const base = 'https://www.share2inspire.pt';
    const products = (product || 'cv-analyser').split(',');
    const allLinks = [];
    products.forEach(p => { allLinks.push(`${base}/${p}?ref=${code}`); if (p !== 'linkedin-roaster') allLinks.push(`${base}/en/${p}?ref=${code}`); });
    navigator.clipboard.writeText(allLinks.join('\n')).then(() => showToast(`${allLinks.length} link(s) copiado(s)`, 'success')).catch(() => prompt('Copia:', allLinks.join('\n')));
}

function exportAffClicksCSV() {
    const rows = [['Data','Afiliado','Página','Dispositivo','Browser','Referrer']];
    allAffClicks.forEach(c => rows.push([c.created_at, c.affiliate_code||'', c.landing_page||'', c.device_type||'', c.browser||'', c.referrer||'']));
    downloadCSV(rows, 'affiliate_clicks.csv');
}

function exportAffConversionsCSV() {
    const rows = [['Data','Afiliado','Produto','Valor','Email','Método']];
    allAffConversions.forEach(c => rows.push([c.created_at, c.affiliate_code||'', c.product||'', c.amount||'', c.customer_email||'', c.payment_method||'']));
    downloadCSV(rows, 'affiliate_conversions.csv');
}

// ═══════════════════════════════════════════════════════════════
//  DISCOUNT COUPONS
// ═══════════════════════════════════════════════════════════════
function renderCoupons() {
    const statusFilter = document.getElementById('filterCouponStatus')?.value || 'all';
    const searchFilter = (document.getElementById('filterCouponSearch')?.value || '').toLowerCase();
    let filtered = allCoupons.filter(c => {
        if (statusFilter === 'active' && !c.is_active) return false;
        if (statusFilter === 'inactive' && c.is_active) return false;
        if (searchFilter) {
            const match = (c.code || '').toLowerCase().includes(searchFilter) || (c.partner_name || '').toLowerCase().includes(searchFilter);
            if (!match) return false;
        }
        return true;
    });
    const active = allCoupons.filter(c => c.is_active);
    const totalUses = allCoupons.reduce((s, c) => s + (c.real_uses || c.current_uses || 0), 0);
    setText('couponKpiActive', active.length);
    setText('couponKpiUses', totalUses);

    const productLabels = {
        'cv_analysis': '<span class="badge" style="background:var(--blue);color:#fff;font-size:10px;">CV</span>',
        'cv_pro': '<span class="badge" style="background:var(--blue);color:#fff;font-size:10px;">CV PRO</span>',
        'career_path': '<span class="badge" style="background:var(--gold);color:#fff;font-size:10px;">Career</span>',
        'career_intelligence': '<span class="badge" style="background:#7C3AED;color:#fff;font-size:10px;">Career Intel</span>',
        'career_intelligence_pro': '<span class="badge" style="background:#7C3AED;color:#fff;font-size:10px;">CI PRO</span>',
        'career_intelligence_full': '<span class="badge" style="background:#7C3AED;color:#fff;font-size:10px;">CI Full</span>',
        'bundle': '<span class="badge" style="background:var(--purple);color:#fff;font-size:10px;">Bundle</span>',
        'linkedin_roaster': '<span class="badge" style="background:#0077B5;color:#fff;font-size:10px;">Roaster</span>',
        'cv_maker': '<span class="badge" style="background:#059669;color:#fff;font-size:10px;">CV Maker</span>',
        'cv_review': '<span class="badge" style="background:#0891B2;color:#fff;font-size:10px;">CV Review</span>',
        'kickstart_pro': '<span class="badge" style="background:#D97706;color:#fff;font-size:10px;">Kickstart</span>',
        'all': '<span class="badge" style="background:var(--dark);color:#fff;font-size:10px;">all</span>'
    };
    const tbody = document.getElementById('couponsTable');
    if (!tbody) return;
    if (!filtered.length) { tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhum cupão encontrado</td></tr>'; return; }
    tbody.innerHTML = filtered.map(c => {
        const products = (c.applicable_products || []).map(p => productLabels[p] || esc(p)).join(' ');
        const uses = c.real_uses || c.current_uses || 0;
        const maxUses = c.max_uses ? c.max_uses : '∞';
        const validUntil = c.valid_until ? new Date(c.valid_until).toLocaleDateString('pt-PT') : 'Sem limite';
        const isExpired = c.valid_until && new Date(c.valid_until) < new Date();
        const statusBadge = c.is_active && !isExpired ? '<span class="badge badge-success">Ativo</span>' : `<span class="badge" style="background:var(--red);color:#fff;">${isExpired ? 'Expirado' : 'Inativo'}</span>`;
        return `<tr>
            <td><code style="font-size:12px;font-weight:600;">${esc(c.code)}</code></td>
            <td style="font-size:12px;">${esc(c.partner_name) || '—'}</td>
            <td><span style="font-weight:600;color:var(--green);">${c.discount_percent}%</span></td>
            <td>${products}</td>
            <td style="text-align:center;">${uses}</td>
            <td style="text-align:center;">${maxUses}</td>
            <td>${validUntil}</td>
            <td>${statusBadge}</td>
            <td>${new Date(c.created_at).toLocaleDateString('pt-PT')}</td>
            <td><div style="display:flex;gap:4px;">
                <button class="btn-icon" onclick="editCoupon('${c.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn-icon" onclick="toggleCoupon('${c.id}',${c.is_active})" title="${c.is_active?'Desativar':'Ativar'}"><i class="fas fa-${c.is_active?'pause':'play'}"></i></button>
                <button class="btn-icon" onclick="copyCouponCode('${esc(c.code)}')" title="Copiar"><i class="fas fa-copy"></i></button>
            </div></td>
        </tr>`;
    }).join('');
}

function openCreateCouponModal() {
    document.getElementById('couponModalTitle').textContent = 'Novo Cupão';
    document.getElementById('couponEditId').value = '';
    document.getElementById('couponCodeInput').value = '';
    document.getElementById('couponCodeInput').disabled = false;
    document.getElementById('couponPartnerName').value = '';
    document.getElementById('couponDiscount').value = '';
    document.getElementById('couponDescription').value = '';
    document.getElementById('couponMaxUses').value = '';
    document.getElementById('couponValidUntil').value = '';
    document.querySelectorAll('.coupon-product-cb').forEach(cb => cb.checked = true);
    document.getElementById('couponModalOverlay').style.display = 'flex';
}
function closeCouponModal() { document.getElementById('couponModalOverlay').style.display = 'none'; }

function editCoupon(id) {
    const c = allCoupons.find(x => x.id === id);
    if (!c) return;
    document.getElementById('couponModalTitle').textContent = 'Editar Cupão';
    document.getElementById('couponEditId').value = c.id;
    document.getElementById('couponCodeInput').value = c.code || '';
    document.getElementById('couponCodeInput').disabled = true;
    document.getElementById('couponPartnerName').value = c.partner_name || '';
    document.getElementById('couponDiscount').value = c.discount_percent || '';
    document.getElementById('couponDescription').value = c.description || '';
    document.getElementById('couponMaxUses').value = c.max_uses || '';
    document.getElementById('couponValidUntil').value = c.valid_until ? c.valid_until.slice(0, 10) : '';
    const products = c.applicable_products || [];
    document.querySelectorAll('.coupon-product-cb').forEach(cb => cb.checked = products.includes(cb.value));
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
    const products = [...document.querySelectorAll('.coupon-product-cb:checked')].map(cb => cb.value);
    if (!code) { showToast('Código obrigatório', 'danger'); return; }
    if (!discount || discount < 1 || discount > 100) { showToast('Desconto entre 1-100%', 'danger'); return; }
    if (!products.length) { showToast('Seleciona pelo menos um produto', 'danger'); return; }
    if (!editId && allCoupons.find(c => c.code === code)) { showToast('Código já existe', 'danger'); return; }
    const data = { discount_percent: discount, partner_name: partnerName || null, description: description || null, applicable_products: products, max_uses: maxUses, valid_until: validUntil ? new Date(validUntil + 'T23:59:59Z').toISOString() : null };
    try {
        if (editId) { await supaUpdate('discount_coupons', editId, data); showToast('Cupão atualizado', 'success'); }
        else { data.code = code; data.is_active = true; data.current_uses = 0; await supaInsert('discount_coupons', data); showToast('Cupão criado: ' + code, 'success'); }
        closeCouponModal();
        await loadCouponData();
        renderCoupons();
    } catch (e) { showToast('Erro ao guardar cupão', 'danger'); }
}

async function toggleCoupon(id, currentActive) {
    if (!confirm(`${currentActive ? 'Desativar' : 'Ativar'} este cupão?`)) return;
    try { await supaUpdate('discount_coupons', id, { is_active: !currentActive }); showToast('Estado alterado', 'success'); await loadCouponData(); renderCoupons(); }
    catch (e) { showToast('Erro', 'danger'); }
}

function copyCouponCode(code) {
    navigator.clipboard.writeText(code).then(() => showToast('Código copiado: ' + code, 'success')).catch(() => prompt('Copia:', code));
}

// ═══════════════════════════════════════════════════════════════
//  USERS & LICENSES
// ═══════════════════════════════════════════════════════════════
function getMergedUsers() {
    return allAuthUsers.map(au => {
        const profile = allUserProfiles.find(p => p.id === au.id || p.user_id === au.id || p.email === au.email);
        const subs = allSubscriptions.filter(s => s.user_id === au.id);
        const activeSub = subs.find(s => s.status === 'active' && (!s.expires_at || new Date(s.expires_at) > new Date()));
        const analyses = allUserAnalyses.filter(a => a.user_id === au.id);
        const meta = au.raw_user_meta_data || {};
        return {
            id: au.id, email: au.email,
            first_name: profile?.first_name || meta.first_name || '',
            last_name: profile?.last_name || meta.last_name || '',
            phone: profile?.phone || '', linkedin_url: profile?.linkedin_url || '',
            cv_filename: profile?.cv_filename || '', address: profile?.address || '',
            email_confirmed: au.email_confirmed_at ? true : (meta.email_verified || false),
            created_at: au.created_at, last_sign_in_at: au.last_sign_in_at,
            active_sub: activeSub || null, all_subs: subs, analyses,
            analyses_count: analyses.length,
            cv_analyser_count: analyses.filter(a => a.analysis_type === 'cv_analyser').length,
            career_path_count: analyses.filter(a => a.analysis_type === 'career_path').length,
            career_intelligence_count: analyses.filter(a => a.analysis_type === 'career_intelligence').length,
            linkedin_roaster_count: analyses.filter(a => a.analysis_type === 'linkedin_roaster').length,
            profile_complete: !!(profile && profile.first_name && profile.last_name && profile.phone)
        };
    });
}

function renderUsers() {
    const users = getMergedUsers();
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

    const statusFilter = document.getElementById('filterUserStatus')?.value || 'all';
    const searchFilter = (document.getElementById('filterUserSearch')?.value || '').toLowerCase();
    let filtered = [...users];
    if (statusFilter === 'active_sub') filtered = filtered.filter(u => u.active_sub);
    if (statusFilter === 'no_sub') filtered = filtered.filter(u => !u.active_sub && u.all_subs.length === 0);
    if (statusFilter === 'expired') filtered = filtered.filter(u => !u.active_sub && u.all_subs.length > 0);
    if (searchFilter) filtered = filtered.filter(u => `${u.first_name} ${u.last_name} ${u.email} ${u.phone}`.toLowerCase().includes(searchFilter));

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
    usersPage = Math.min(usersPage, totalPages);
    const page = filtered.slice((usersPage - 1) * PAGE_SIZE, usersPage * PAGE_SIZE);
    const tbody = document.getElementById('usersTable');
    if (!tbody) return;
    if (!page.length) { tbody.innerHTML = `<tr><td colspan="12" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhum utilizador encontrado</td></tr>`; renderPagination('usersPagination', usersPage, totalPages, (p) => { usersPage = p; renderUsers(); }); return; }

    tbody.innerHTML = page.map(u => {
        const name = `${u.first_name} ${u.last_name}`.trim() || '—';
        const emailBadge = u.email_confirmed ? '<i class="fas fa-check-circle" style="color:var(--green);font-size:10px;margin-left:4px;"></i>' : '<i class="fas fa-exclamation-circle" style="color:var(--orange);font-size:10px;margin-left:4px;"></i>';
        let subBadge;
        if (u.active_sub) subBadge = '<span class="badge badge-success">Ativa</span>';
        else if (u.all_subs.length > 0) subBadge = '<span class="badge" style="background:var(--red);color:#fff;">Expirada</span>';
        else subBadge = '<span class="badge badge-secondary">Nenhuma</span>';
        const planBadge = u.active_sub ? `<span class="badge badge-paid">${u.active_sub.plan || '—'}</span>` : (u.all_subs.length > 0 ? `<span class="badge badge-secondary">${u.all_subs[0].plan || '—'}</span>` : '—');
        const expiresStr = u.active_sub && u.active_sub.expires_at ? new Date(u.active_sub.expires_at).toLocaleDateString('pt-PT') : (u.all_subs.length > 0 && u.all_subs[0].expires_at ? new Date(u.all_subs[0].expires_at).toLocaleDateString('pt-PT') : '—');
        const analysesHtml = u.analyses_count > 0 ? `<span style="font-weight:600;cursor:help;" title="CV:${u.cv_analyser_count} CP:${u.career_path_count} CI:${u.career_intelligence_count} LR:${u.linkedin_roaster_count}">${u.analyses_count}</span>` : '0';
        const regDate = new Date(u.created_at).toLocaleDateString('pt-PT');
        const loginStr = u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('pt-PT') : 'Nunca';
        const phone = u.phone || '—';
        const linkedin = u.linkedin_url ? `<a href="${esc(u.linkedin_url)}" target="_blank" style="color:var(--teal);font-size:11px;"><i class="fab fa-linkedin"></i></a>` : '—';
        return `<tr>
            <td style="font-weight:500;">${esc(name)}</td>
            <td style="font-size:12px;">${esc(u.email)}${emailBadge}</td>
            <td style="font-size:12px;">${esc(phone)}</td>
            <td style="text-align:center;">${linkedin}</td>
            <td>${subBadge}</td>
            <td>${planBadge}</td>
            <td style="font-size:11px;color:var(--text-muted);">${expiresStr}</td>
            <td>${analysesHtml}</td>
            <td style="font-size:12px;">${u.cv_filename ? '<i class="fas fa-file-pdf" style="color:var(--teal);"></i>' : '—'}</td>
            <td style="font-size:11px;color:var(--text-muted);">${regDate}</td>
            <td style="font-size:11px;color:var(--text-muted);">${loginStr}</td>
            <td><div style="display:flex;gap:4px;">
                <button class="btn-icon" title="Ver" onclick="showUserDetail('${u.id}')"><i class="fas fa-eye"></i></button>
                <button class="btn-icon" title="Email" onclick="openEmailModal('${u.email}','${(u.first_name+' '+u.last_name).trim().replace(/'/g,"\\'")}')"><i class="fas fa-envelope"></i></button>
            </div></td>
        </tr>`;
    }).join('');
    renderPagination('usersPagination', usersPage, totalPages, (p) => { usersPage = p; renderUsers(); });
}

function showUserDetail(userId) {
    const users = getMergedUsers();
    const u = users.find(x => x.id === userId);
    if (!u) return;
    const name = `${u.first_name} ${u.last_name}`.trim() || 'Sem nome';
    document.getElementById('userProfileTitle').innerHTML = `<i class="fas fa-user" style="color:var(--gold);margin-right:8px;"></i> ${name}`;
    document.getElementById('userProfileModal').style.display = 'flex';
    let subsHtml = u.all_subs.length > 0
        ? `<table class="data-table" style="font-size:12px;"><thead><tr><th>Plano</th><th>Estado</th><th>Preço</th><th>Início</th><th>Expira</th></tr></thead><tbody>
            ${u.all_subs.map(s => `<tr><td>${s.plan||'—'}</td><td>${s.status==='active'?'<span class="badge badge-success">Ativa</span>':'<span class="badge" style="background:var(--red);color:#fff;">Expirada</span>'}</td><td>${s.price_eur?s.price_eur+'€':'—'}</td><td>${s.started_at?new Date(s.started_at).toLocaleDateString('pt-PT'):'—'}</td><td>${s.expires_at?new Date(s.expires_at).toLocaleDateString('pt-PT'):'Sem limite'}</td></tr>`).join('')}
           </tbody></table>` : '<p style="color:var(--text-muted);font-size:13px;">Nenhuma subscrição.</p>';
    let analysesHtml = u.analyses.length > 0
        ? `<table class="data-table" style="font-size:12px;"><thead><tr><th>Tipo</th><th>Data</th></tr></thead><tbody>
            ${u.analyses.map(a => { const typeMap = {cv_analyser:'CV Analyser',career_path:'Career Path',career_intelligence:'Career Intelligence',linkedin_roaster:'LinkedIn Roaster',career_energy:'Career Energy'}; return `<tr><td>${typeMap[a.analysis_type]||a.analysis_type}</td><td>${new Date(a.created_at).toLocaleString('pt-PT')}</td></tr>`; }).join('')}
           </tbody></table>` : '<p style="color:var(--text-muted);font-size:13px;">Nenhuma análise.</p>';
    document.getElementById('userProfileBody').innerHTML = `
        <div class="profile-section"><h4>Informação</h4>
            <div class="profile-row"><span>Email</span><span>${u.email} ${u.email_confirmed?'✓':'✗'}</span></div>
            <div class="profile-row"><span>Telefone</span><span>${u.phone||'—'}</span></div>
            <div class="profile-row"><span>LinkedIn</span><span>${u.linkedin_url?`<a href="${u.linkedin_url}" target="_blank" style="color:var(--blue);">Ver</a>`:'—'}</span></div>
            <div class="profile-row"><span>Registado</span><span>${new Date(u.created_at).toLocaleString('pt-PT')}</span></div>
            <div class="profile-row"><span>Último Login</span><span>${u.last_sign_in_at?new Date(u.last_sign_in_at).toLocaleString('pt-PT'):'Nunca'}</span></div>
        </div>
        <div class="profile-section"><h4>Subscrições</h4>${subsHtml}</div>
        <div class="profile-section"><h4>Análises (${u.analyses_count})</h4>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                <span class="badge badge-cv">CV: ${u.cv_analyser_count}</span>
                <span class="badge badge-career">CP: ${u.career_path_count}</span>
                <span class="badge" style="background:#EDE9FE;color:#7C3AED;">CI: ${u.career_intelligence_count}</span>
                <span class="badge" style="background:#E0F2FE;color:#0077B5;">LR: ${u.linkedin_roaster_count}</span>
            </div>
            ${analysesHtml}
        </div>`;
}

function exportUsersCSV() {
    const users = getMergedUsers();
    const rows = [['Nome','Email','Subscrição','Plano','Análises','CV','Registado','Último Login']];
    users.forEach(u => {
        const name = `${u.first_name} ${u.last_name}`.trim();
        const subStatus = u.active_sub ? 'Ativa' : (u.all_subs.length > 0 ? 'Expirada' : 'Nenhuma');
        const plan = u.active_sub ? (u.active_sub.plan || '') : '';
        rows.push([name, u.email, subStatus, plan, u.analyses_count, u.cv_filename||'', new Date(u.created_at).toLocaleDateString('pt-PT'), u.last_sign_in_at?new Date(u.last_sign_in_at).toLocaleDateString('pt-PT'):'']);
    });
    downloadCSV(rows, 'utilizadores.csv');
}

// ═══════════════════════════════════════════════════════════════
//  UTILITY: CSV DOWNLOAD & HTML ESCAPE
// ═══════════════════════════════════════════════════════════════
function downloadCSV(rows, filename) {
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ═══════════════════════════════════════════════════════════════
//  REFRESH ALL & INIT
// ═══════════════════════════════════════════════════════════════
async function refreshAll() {
    showToast('A atualizar dados...', 'info');
    await loadAllData();
    await Promise.all([loadEmailHistory(), loadHealthLogs(), loadAffiliateData(), loadCouponData(), loadUsersData()]);
    updateDashboard();
    updateCharts();
    renderFunnel();
    renderCRM();
    renderAutoEmailsMonitoring();
    renderNurturingSegments();
    renderAnalyses();
    renderVouchers();
    renderEmailHistory();
    renderContactMessages();
    renderJobSearchTable();
    renderHealthLogs();
    renderAffiliates();
    renderAffClicks();
    renderAffConversions();
    renderCoupons();
    renderUsers();
    setText('lastUpdate', new Date().toLocaleTimeString('pt-PT'));
    showToast('Dados atualizados!', 'success');
}

// ── Init ──
document.addEventListener('DOMContentLoaded', async () => {
    showToast('A carregar dados...', 'info');
    try {
        await loadAllData();
        await Promise.all([loadEmailHistory(), loadHealthLogs(), loadAffiliateData(), loadCouponData(), loadUsersData()]);
        updateDashboard();
        updateCharts();
        renderFunnel();
        renderCRM();
        renderAutoEmailsMonitoring();
        renderNurturingSegments();
        renderAnalyses();
        renderVouchers();
        renderEmailHistory();
        renderContactMessages();
        renderJobSearchTable();
        renderHealthLogs();
        renderAffiliates();
        renderAffClicks();
        renderAffConversions();
        renderCoupons();
        renderUsers();
        setText('lastUpdate', new Date().toLocaleTimeString('pt-PT'));
        showToast('Cockpit carregado!', 'success');
    } catch (e) {
        console.error('Erro ao inicializar:', e);
        showToast('Erro ao carregar dados: ' + e.message, 'danger');
    }
});


// ═══════════════════════════════════════════════════════════════
//  AUTOMATION CONTROLS
// ═══════════════════════════════════════════════════════════════

function updateAutomationStatus() {
    const paused = localStorage.getItem('s2i_auto_paused') === 'true';
    const badge = document.getElementById('autoStatusBadge');
    const icon = document.getElementById('autoPauseIcon');
    const label = document.getElementById('autoPauseLabel');
    if (badge) {
        badge.textContent = paused ? 'Pausada' : 'Ativa';
        badge.className = paused ? 'badge badge-secondary' : 'badge badge-success';
    }
    if (icon) icon.className = paused ? 'fas fa-play' : 'fas fa-pause';
    if (label) label.textContent = paused ? 'Retomar' : 'Pausar';
    // Last run
    const lastRun = localStorage.getItem('s2i_auto_last_run');
    const el = document.getElementById('autoLastRun');
    if (el && lastRun) {
        el.textContent = 'Última execução: ' + new Date(lastRun).toLocaleString('pt-PT', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
    }
}

function toggleAutomationPause() {
    const paused = localStorage.getItem('s2i_auto_paused') === 'true';
    localStorage.setItem('s2i_auto_paused', paused ? 'false' : 'true');
    updateAutomationStatus();
    showToast(paused ? 'Automação retomada' : 'Automação pausada', paused ? 'success' : 'warning');
}

async function runAutomationNow() {
    const paused = localStorage.getItem('s2i_auto_paused') === 'true';
    if (paused) {
        if (!confirm('A automação está pausada. Deseja executar mesmo assim?')) return;
    }
    const btn = document.getElementById('autoRunBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A executar...'; }
    try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/hyper-task`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mode: 'auto_emails' })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('s2i_auto_last_run', new Date().toISOString());
            showToast(`Automação executada! Upsell 2h: ${data.upsell_2h_sent || 0}, Follow-up 7d: ${data.followup_7d_sent || 0}, Erros: ${data.errors || 0}`, 'success');
            // Reload automation data
            const freshEmails = await supaFetch('email_history', 'select=*&order=sent_at.desc&limit=500');
            allEmailHistory = Array.isArray(freshEmails) ? freshEmails : [];
            renderAutoEmailsMonitoring();
        } else {
            showToast('Erro na automação: ' + (data.error || 'desconhecido'), 'danger');
        }
    } catch (e) {
        showToast('Erro ao executar automação: ' + e.message, 'danger');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-play"></i> Executar Agora'; }
    }
}

function renderPendingLeads() {
    const tbody = document.getElementById('autoPendingTable');
    const countEl = document.getElementById('autoPendingCount');
    if (!tbody) return;

    const now = Date.now();
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const sentEmails2h = new Set(allEmailHistory.filter(e => e.email_type === 'upsell_auto_2h' || e.campaign_type === 'upsell_auto_2h').map(e => e.recipient_email?.toLowerCase()));
    const sentEmails7d = new Set(allEmailHistory.filter(e => e.email_type === 'upsell_auto_7d' || e.campaign_type === 'upsell_auto_7d').map(e => e.recipient_email?.toLowerCase()));
    const paidEmails = new Set(allAnalyses.filter(a => getAnalysisType(a) === 'paid').map(a => a.user_email?.toLowerCase()));

    const freeAnalyses = allAnalyses.filter(a => {
        const t = getAnalysisType(a);
        return (t === 'free' || t === 'free_heuristic') && a.user_email && !isAnonymous(a);
    });

    const pending = [];
    const seen = new Set();

    freeAnalyses.forEach(a => {
        const email = a.user_email.toLowerCase();
        if (seen.has(email) || paidEmails.has(email)) return;
        seen.add(email);

        const created = new Date(a.created_at);
        // Upsell 2h: created 2-24h ago, not yet sent
        if (created < twoHoursAgo && created > twentyFourHoursAgo && !sentEmails2h.has(email)) {
            const elapsed = Math.round((now - created.getTime()) / (60 * 60 * 1000));
            pending.push({ email, name: a.user_name || '—', type: 'Upsell 2h', created: a.created_at, elapsed: elapsed + 'h' });
        }
        // Follow-up 7d: created 7-30 days ago, not yet sent
        if (created < sevenDaysAgo && created > thirtyDaysAgo && !sentEmails7d.has(email)) {
            const elapsed = Math.round((now - created.getTime()) / (24 * 60 * 60 * 1000));
            pending.push({ email, name: a.user_name || '—', type: 'Follow-up 7d', created: a.created_at, elapsed: elapsed + 'd' });
        }
    });

    if (countEl) countEl.textContent = pending.length + ' leads';

    if (!pending.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted);">Nenhum lead pendente — todos os emails foram enviados</td></tr>';
        return;
    }

    tbody.innerHTML = pending.slice(0, 20).map(p => {
        const date = new Date(p.created).toLocaleDateString('pt-PT') + ' ' + new Date(p.created).toLocaleTimeString('pt-PT', {hour:'2-digit',minute:'2-digit'});
        const typeBadge = p.type === 'Upsell 2h' ? '<span class="badge badge-teal">Upsell 2h</span>' : '<span class="badge badge-purple">Follow-up 7d</span>';
        return `<tr><td style="font-size:12px;">${p.email}</td><td style="font-size:12px;">${p.name}</td><td>${typeBadge}</td><td style="font-size:12px;color:var(--text-muted);">${date}</td><td style="font-size:12px;">${p.elapsed}</td></tr>`;
    }).join('');
}
