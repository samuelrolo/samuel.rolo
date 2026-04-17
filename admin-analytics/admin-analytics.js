// ═══════════════════════════════════════════════════════════════
//  Share2Inspire · Cockpit de Gestão v3.1
//  Reestruturado: 7 tabs, cruzamento de dados, fontes verificadas
//  v3.1: Supabase Auth + RLS security
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY_FALLBACK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
const RUNTIME_SUPABASE_KEY = typeof window !== 'undefined' && typeof window.__SUPABASE_ANON_KEY__ === 'string'
    ? window.__SUPABASE_ANON_KEY__.trim()
    : '';
const SUPABASE_KEY = RUNTIME_SUPABASE_KEY || SUPABASE_ANON_KEY_FALLBACK;
const ADMIN_EMAIL = 'samuelrolo@gmail.com';
const BREVO_SENDER = { name: 'Share2Inspire', email: 'geral@share2inspire.pt' };
const SUPPORT_REPLY_FN_URL = `${SUPABASE_URL}/functions/v1/support-reply`;

// ── Supabase Auth Client ──
const _supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let _accessToken = null; // filled after login

// Get the current auth token (session token if logged in, fallback to anon key)
function getAuthToken() {
    return _accessToken || SUPABASE_KEY;
}

async function adminLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errDiv = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');
    errDiv.style.display = 'none';
    if (!email || !password) { errDiv.textContent = 'Preenche email e password.'; errDiv.style.display = 'block'; return; }
    btn.disabled = true; btn.textContent = 'A verificar...';
    try {
        const { data, error } = await _supa.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user.email.toLowerCase() !== ADMIN_EMAIL) {
            await _supa.auth.signOut();
            throw new Error('Este email não tem permissões de administrador.');
        }
        _accessToken = data.session.access_token;
        document.getElementById('loginOverlay').style.display = 'none';
        initCockpit();
    } catch (e) {
        errDiv.textContent = e.message || 'Erro ao autenticar.';
        errDiv.style.display = 'block';
        btn.disabled = false; btn.textContent = 'Entrar';
    }
}

async function adminLogout() {
    await _supa.auth.signOut();
    _accessToken = null;
    location.reload();
}

function getBrevoKey() { return localStorage.getItem('s2i_brevo_key') || ''; }
function ensureBrevoKey() {
    if (getBrevoKey()) return true;
    showToast('API Key do Brevo não configurada. Vai a Sistema > Configurações para a definir.', 'danger');
    return false;
}
function saveBrevoKey() {
    const input = document.getElementById('brevoKeyInput');
    const key = input?.value?.trim();
    if (!key) { showToast('Insere uma API Key válida', 'danger'); return; }
    localStorage.setItem('s2i_brevo_key', key);
    input.value = '';
    updateBrevoKeyStatus();
    showToast('API Key do Brevo guardada com sucesso!', 'success');
}
function clearBrevoKey() {
    localStorage.removeItem('s2i_brevo_key');
    updateBrevoKeyStatus();
    showToast('API Key do Brevo removida', 'info');
}
function updateBrevoKeyStatus() {
    const el = document.getElementById('brevoKeyStatus');
    if (!el) return;
    const key = getBrevoKey();
    if (key) {
        el.innerHTML = '<span style="color:var(--green);"><i class="fas fa-check-circle"></i> API Key configurada (' + key.substring(0, 8) + '...)</span>';
    } else {
        el.innerHTML = '<span style="color:var(--orange);"><i class="fas fa-exclamation-triangle"></i> API Key não configurada — emails não serão enviados</span>';
    }
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
function buildSupabaseRestUrl(table, query = '') {
    const params = new URLSearchParams(query || '');
    if (!params.has('select')) params.set('select', '*');
    const qs = params.toString();
    return `${SUPABASE_URL}/rest/v1/${table}${qs ? `?${qs}` : ''}`;
}

function getSupabaseHeaders(useAnon = false, extraHeaders = {}) {
    const token = useAnon ? SUPABASE_KEY : getAuthToken();
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`,
        ...extraHeaders
    };
}

async function supaFetch(table, query = '', useAnon = false) {
    try {
        const res = await fetch(buildSupabaseRestUrl(table, query), {
            headers: getSupabaseHeaders(useAnon)
        });
        if (!res.ok) return [];
        return res.json();
    } catch { return []; }
}

async function supaInsert(table, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: getSupabaseHeaders(false, {
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }),
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
        headers: getSupabaseHeaders(false, {
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        }),
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
}

async function supaDelete(table, id) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
        method: 'DELETE',
        headers: getSupabaseHeaders(false, {
            'Prefer': 'return=minimal'
        })
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
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
    if (a.analysis_type === 'career_intelligence_pro') return 'paid';
    if (a.analysis_type === 'career_intelligence_full') return 'paid';
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
function isStudentPack(a) {
    const type = (a?.analysis_type || a?.product || a?._source || '').toLowerCase();
    const landingPage = (a?.landing_page || '').toLowerCase();
    return type === 'student_pack' || type === 'student-pack' || type === 'studen pack' || type === 'student' || landingPage.includes('/student-pack') || landingPage.includes('/estudante');
}
function isCareerIntelligence(a) {
    const type = (a?.analysis_type || a?.product || '').toLowerCase();
    return type === 'career_intelligence' || type === 'career_intelligence_pro' || type === 'career_intelligence_full' || type === 'career-intelligence';
}
function isLinkedinRoaster(a) {
    const type = (a?.analysis_type || a?.product || a?._source || '').toLowerCase();
    return a?._source === 'linkedin_roaster' || type === 'linkedin_roaster' || type === 'linkedin-roaster' || type === 'linkedin_roast';
}
function isStudentPackVoucher(v) {
    const type = (v?.voucher_type || '').toLowerCase();
    const plan = (v?.plan_name || '').toLowerCase();
    return type === 'student_pack' || type === 'student-pack' || type === 'student' || plan.includes('student pack') || plan.includes('pack estudante');
}
function isCvAnalyser(a) {
    return !!a && !isStudentPack(a) && !isLinkedinRoaster(a) && !isCareerIntelligence(a) && a.analysis_type !== 'career_path';
}
function getProductBadge(a) {
    if (isLinkedinRoaster(a)) return '<span class="badge" style="background:#0077B5;color:#fff;">LinkedIn Roaster</span>';
    if (isStudentPack(a)) return '<span class="badge" style="background:#059669;color:#fff;font-weight:600;">Student Pack</span>';
    if (a.analysis_type === 'career_intelligence_pro') return '<span class="badge" style="background:#7C3AED;color:#fff;font-weight:600;">CI PRO</span>';
    if (a.analysis_type === 'career_intelligence_full') return '<span class="badge" style="background:#5B21B6;color:#fff;font-weight:600;">CI Full</span>';
    if (a.analysis_type === 'career_intelligence') return '<span class="badge" style="background:#7C3AED;color:#fff;font-weight:600;">Career Intelligence</span>';
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
    if (name === 'system') { renderHealthLogs(); updateBrevoKeyStatus(); }
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
    if (name === 'welcome-emails') loadWelcomeEmailsDashboard();
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

// switchSystemSubtab removed - eBook tab removed, health is now the only view

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
            supaFetch('cv_analysis', 'select=id,user_email,user_name,score,professional_area,analysis_type,payment_status,payment_amount,payment_method,transaction_id,career_path_purchased,user_rating,rating_comment,created_at,user_id&order=created_at.desc&limit=5000'),
            supaFetch('vouchers', 'select=*&order=created_at.desc'),
            supaFetch('contact_messages', 'select=*&order=created_at.desc&limit=500', true),
            supaFetch('newsletter_subscribers', 'select=*&order=updated_at.desc.nullslast&limit=2000'),
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
    } catch (e) {
        console.error('Erro ao carregar cupões:', e);
    }
}

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

        // Fallback: if admin_auth_users is empty (permission denied), derive users from cv_analysis
        if (allAuthUsers.length === 0 && allAnalyses.length > 0) {
            const userMap = {};
            [...allAnalyses, ...allLinkedinRoaster.map(a => ({ ...a, _source: 'linkedin_roaster' }))].forEach(a => {
                const email = (a.user_email || '').trim().toLowerCase();
                if (!email || email.includes('anonymous') || email.includes('@share2inspire') || !email.includes('@')) return;
                if (!userMap[email]) {
                    userMap[email] = {
                        id: a.user_id || email,
                        email: email,
                        raw_user_meta_data: {},
                        created_at: a.created_at,
                        last_sign_in_at: a.created_at,
                        email_confirmed_at: a.created_at,
                        _derived_name: a.user_name || '',
                        _derived_phone: a.user_phone || '',
                        _derived_linkedin: a.linkedin_url || '',
                        _analyses: []
                    };
                }
                const u = userMap[email];
                u._analyses.push(a);
                if (new Date(a.created_at) < new Date(u.created_at)) u.created_at = a.created_at;
                if (new Date(a.created_at) > new Date(u.last_sign_in_at)) u.last_sign_in_at = a.created_at;
                if (!u._derived_name && a.user_name) u._derived_name = a.user_name;
                if (!u._derived_phone && a.user_phone) u._derived_phone = a.user_phone;
                if (!u._derived_linkedin && a.linkedin_url) u._derived_linkedin = a.linkedin_url;
            });
            allAuthUsers = Object.values(userMap);
            console.log(`Derived ${allAuthUsers.length} users from cv_analysis data`);
        }
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

    const studentRevenue = paid.filter(a => isStudentPack(a)).reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0)
                        + allVouchers.filter(v => v.payment_method !== 'test' && v.payment_method !== 'promo' && isStudentPackVoucher(v)).reduce((s, v) => s + (parseFloat(v.amount_paid) || 0), 0);
    const cvRevenue = paid.filter(a => isCvAnalyser(a)).reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0)
                    + allVouchers.filter(v => v.payment_method !== 'test' && v.payment_method !== 'promo' && !isStudentPackVoucher(v) && v.voucher_type !== 'career_path' && v.voucher_type !== 'career_intelligence_pro' && v.voucher_type !== 'career_intelligence_full').reduce((s, v) => s + (parseFloat(v.amount_paid) || 0), 0);
    const cpRevenue = cp.reduce((s, a) => s + (a.payment_amount || 0), 0)
                    + allVouchers.filter(v => v.payment_method !== 'test' && v.payment_method !== 'promo' && v.voucher_type === 'career_path').reduce((s, v) => s + (parseFloat(v.amount_paid) || 0), 0);
    const ciPro = data.filter(a => a.analysis_type === 'career_intelligence_pro');
    const ciFull = data.filter(a => a.analysis_type === 'career_intelligence_full');
    // Include Career Intelligence from user_analyses table (analysis_type='career_intelligence')
    const ciFromUserAnalyses = filterByPeriod(allUserAnalyses.filter(a => a.analysis_type === 'career_intelligence' || a.analysis_type === 'career_intelligence_pro' || a.analysis_type === 'career_intelligence_full'), dashPeriodDays);
    const ciAll = [...ciPro, ...ciFull, ...ciFromUserAnalyses];
    const ciRevenue = ciAll.reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0)
                    + allVouchers.filter(v => v.payment_method !== 'test' && v.payment_method !== 'promo' && (v.voucher_type === 'career_intelligence_pro' || v.voucher_type === 'career_intelligence_full')).reduce((s, v) => s + (parseFloat(v.amount_paid) || 0), 0);

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
    const realStudentPaid = realPaid.filter(a => isStudentPack(a));
    const realCVAPaid = realPaid.filter(a => isCvAnalyser(a));
    const realCPPaid = realPaid.filter(a => a.analysis_type === 'career_path');
    const realCIPaid = realPaid.filter(a => a.analysis_type === 'career_intelligence_pro' || a.analysis_type === 'career_intelligence_full');
    const realLRPaid = realPaid.filter(a => isLinkedinRoaster(a));
    const realVouchersSold = allVouchers.filter(v => v.payment_method !== 'test' && v.payment_method !== 'promo' && (v.buyer_email || '').toLowerCase() !== excludeEmail && (v.user_email || '').toLowerCase() !== excludeEmail);

    const realDirectRevenue = realPaid.reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0);
    const realVoucherRevenue = realVouchersSold.reduce((s, v) => s + (parseFloat(v.amount_paid) || 0), 0);
    const realTotalRevenue = realDirectRevenue + realVoucherRevenue;
    const realStudentRevenue = realStudentPaid.reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0)
                             + allVouchers.filter(v => v.payment_method !== 'test' && v.payment_method !== 'promo' && isStudentPackVoucher(v) && (v.buyer_email || '').toLowerCase() !== excludeEmail && (v.user_email || '').toLowerCase() !== excludeEmail).reduce((s, v) => s + (parseFloat(v.amount_paid) || 0), 0);
    const realCVARevenue = realCVAPaid.reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0)
                         + allVouchers.filter(v => v.payment_method !== 'test' && v.payment_method !== 'promo' && !isStudentPackVoucher(v) && v.voucher_type !== 'career_path' && v.voucher_type !== 'career_intelligence_pro' && v.voucher_type !== 'career_intelligence_full' && (v.buyer_email || '').toLowerCase() !== excludeEmail && (v.user_email || '').toLowerCase() !== excludeEmail).reduce((s, v) => s + (parseFloat(v.amount_paid) || 0), 0);
    const realCPRevenue = realCPPaid.reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0)
                        + allVouchers.filter(v => v.payment_method !== 'test' && v.payment_method !== 'promo' && v.voucher_type === 'career_path' && (v.buyer_email || '').toLowerCase() !== excludeEmail && (v.user_email || '').toLowerCase() !== excludeEmail).reduce((s, v) => s + (parseFloat(v.amount_paid) || 0), 0);
    const realCIRevenue = realCIPaid.reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0)
                        + allVouchers.filter(v => v.payment_method !== 'test' && v.payment_method !== 'promo' && (v.voucher_type === 'career_intelligence_pro' || v.voucher_type === 'career_intelligence_full') && (v.buyer_email || '').toLowerCase() !== excludeEmail && (v.user_email || '').toLowerCase() !== excludeEmail).reduce((s, v) => s + (parseFloat(v.amount_paid) || 0), 0);
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
    const studentAll = data.filter(a => isStudentPack(a));
    const studentFreeItems = studentAll.filter(a => getAnalysisType(a) === 'free');
    const studentPaidItems = studentAll.filter(a => getAnalysisType(a) === 'paid');
    const studentVoucherItems = studentAll.filter(a => getAnalysisType(a) === 'voucher');
    const cvAll = data.filter(a => isCvAnalyser(a));
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
        { name: 'Student Pack', color: '#059669', icon: 'fa-user-graduate', total: studentAll.length, free: studentFreeItems.length, paid: studentPaidItems.length, voucher: studentVoucherItems.length, revenue: studentRevenue, realRevenue: realStudentRevenue },
        { name: 'CV Analyser', color: 'var(--purple)', icon: 'fa-file-lines', total: cvAll.length, free: cvFreeItems.length, paid: cvPaidItems.length, voucher: cvVoucherItems.length, revenue: cvRevenue, realRevenue: realCVARevenue },
        { name: 'Career Path', color: 'var(--teal)', icon: 'fa-route', total: cp.length, free: cpFreeItems.length, paid: cpPaidItems.length, voucher: cpVoucherItems.length, revenue: cpRevenue, realRevenue: realCPRevenue },
        { name: 'Career Intelligence', color: '#7C3AED', icon: 'fa-brain', total: ciAll.length, free: 0, paid: ciAll.length, voucher: 0, revenue: ciRevenue, realRevenue: realCIRevenue },
        { name: 'LinkedIn Roaster', color: '#0077B5', icon: 'fa-linkedin', total: lrPeriod.length, free: lrFreeItems.length, paid: lrPaidType.length, voucher: lrVoucherItems.length, revenue: lrRevenue, realRevenue: realLRRevenue },
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
                    <td style="text-align:right;font-weight:600;color:${p.color};">${p.revenue.toFixed(2)}\u20ac</td>
                    <td style="text-align:right;">-</td>
                    <td style="text-align:right;font-weight:700;color:var(--gold);">${p.realRevenue.toFixed(2)}\u20ac</td>`;
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
        const s = a.score || 0;
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
    const studentTotal = data.filter(a => isStudentPack(a)).length;
    const studentPaidCount = data.filter(a => isStudentPack(a) && getAnalysisType(a) !== 'free').length;
    const freeCount   = data.filter(a => isCvAnalyser(a) && getAnalysisType(a) === 'free').length;
    const paidCount   = data.filter(a => isCvAnalyser(a) && getAnalysisType(a) === 'paid').length;
    const cpCount     = data.filter(a => a.analysis_type === 'career_path').length;
    const ciFromUA = filterByPeriod(allUserAnalyses.filter(a => a.analysis_type === 'career_intelligence' || a.analysis_type === 'career_intelligence_pro' || a.analysis_type === 'career_intelligence_full'), funnelPeriodDays);
    const ciCount     = data.filter(a => a.analysis_type === 'career_intelligence_pro' || a.analysis_type === 'career_intelligence_full').length + ciFromUA.length;

    setText('funnelLR', studentTotal);
    setText('funnelLRConv', `${studentPaidCount} compras`);
    setText('funnelCE', freeCount + paidCount + cpCount);
    setText('funnelFree', freeCount);
    setText('funnelPaid', paidCount);
    setText('funnelCP', cpCount);
    setText('funnelFreeConv', studentTotal ? `${Math.round(freeCount / studentTotal * 100)}% do topo` : '—');
    setText('funnelPaidConv', freeCount ? `${Math.round(paidCount / (freeCount + paidCount) * 100)}% do grátis` : '—');
    setText('funnelCPConv', paidCount ? `${Math.round(cpCount / paidCount * 100)}% dos pagantes` : '—');

    // Funil Visual
    const steps = [
        { name: 'Student Pack (Topo)', count: studentTotal, color: '#059669' },
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
        const freeNoUpgrade = data.filter(a => isCvAnalyser(a) && getAnalysisType(a) === 'free' && !isAnonymous(a)).length;
        const starterPaidNoCp = data.filter(a => getAnalysisType(a) === 'paid' && a.analysis_type !== 'career_path' && !isCareerIntelligence(a) && !data.some(b => b.analysis_type === 'career_path' && (b.user_email || '').toLowerCase() === (a.user_email || '').toLowerCase())).length;
        const cpNoCi = data.filter(a => a.analysis_type === 'career_path' && !data.some(b => (b.analysis_type === 'career_intelligence_pro' || b.analysis_type === 'career_intelligence_full') && (b.user_email || '').toLowerCase() === (a.user_email || '').toLowerCase())).length;

        abandonEl.innerHTML = `
            <div class="metric-row"><div class="metric-label"><i class="fas fa-user-slash" style="color:var(--red);margin-right:6px;"></i> Utilizadores anónimos</div>
                <div style="display:flex;align-items:center;gap:12px;flex:1;margin-left:16px;"><div class="metric-bar-wrap"><div class="metric-bar" style="width:${data.length ? Math.round(anonymous/data.length*100) : 0}%;background:var(--red);"></div></div><div class="metric-value" style="color:var(--red);">${anonymous} (${data.length ? Math.round(anonymous/data.length*100) : 0}%)</div></div></div>
            <div class="metric-row"><div class="metric-label"><i class="fas fa-arrow-up" style="color:var(--orange);margin-right:6px;"></i> Grátis sem upgrade</div>
                <div style="display:flex;align-items:center;gap:12px;flex:1;margin-left:16px;"><div class="metric-bar-wrap"><div class="metric-bar" style="width:${freeCount ? Math.round(freeNoUpgrade/freeCount*100) : 0}%;background:var(--orange);"></div></div><div class="metric-value" style="color:var(--orange);">${freeNoUpgrade} (${freeCount ? Math.round(freeNoUpgrade/freeCount*100) : 0}%)</div></div></div>
            <div class="metric-row"><div class="metric-label"><i class="fas fa-route" style="color:var(--blue);margin-right:6px;"></i> Entradas pagas sem Career Path</div>
                <div style="display:flex;align-items:center;gap:12px;flex:1;margin-left:16px;"><div class="metric-bar-wrap"><div class="metric-bar" style="width:${studentPaidCount + paidCount ? Math.round(starterPaidNoCp/(studentPaidCount + paidCount)*100) : 0}%;background:var(--blue);"></div></div><div class="metric-value" style="color:var(--blue);">${starterPaidNoCp} (${studentPaidCount + paidCount ? Math.round(starterPaidNoCp/(studentPaidCount + paidCount)*100) : 0}%)</div></div></div>
            <div class="metric-row"><div class="metric-label"><i class="fas fa-brain" style="color:#7C3AED;margin-right:6px;"></i> Career Path sem CI PRO</div>
                <div style="display:flex;align-items:center;gap:12px;flex:1;margin-left:16px;"><div class="metric-bar-wrap"><div class="metric-bar" style="width:${cpCount ? Math.round(cpNoCi/cpCount*100) : 0}%;background:#7C3AED;"></div></div><div class="metric-value" style="color:#7C3AED;">${cpNoCi} (${cpCount ? Math.round(cpNoCi/cpCount*100) : 0}%)</div></div></div>`;
    }

    // Oportunidades de Conversão
    const oppEl = document.getElementById('conversionOpportunities');
    if (oppEl) {
        const freeIdentified = data.filter(a => isCvAnalyser(a) && getAnalysisType(a) === 'free' && !isAnonymous(a)).length;
        const entryPaidNoCp = data.filter(a => getAnalysisType(a) === 'paid' && a.analysis_type !== 'career_path' && !isCareerIntelligence(a) && !isAnonymous(a) && !data.some(b => b.analysis_type === 'career_path' && (b.user_email || '').toLowerCase() === (a.user_email || '').toLowerCase())).length;
        const cpNoCiOpp = data.filter(a => a.analysis_type === 'career_path' && !isAnonymous(a) && !data.some(b => (b.analysis_type === 'career_intelligence_pro' || b.analysis_type === 'career_intelligence_full') && (b.user_email || '').toLowerCase() === (a.user_email || '').toLowerCase())).length;
        const avgTicket = (studentPaidCount + paidCount) > 0 ? (data.filter(a => getAnalysisType(a) === 'paid').reduce((s, a) => s + (a.payment_amount || 0), 0) / (studentPaidCount + paidCount)) : 0;
        const potentialRev = (freeIdentified * avgTicket * 0.1 + entryPaidNoCp * 19.99 * 0.2 + cpNoCiOpp * 24 * 0.15).toFixed(0);

        oppEl.innerHTML = `
            <div style="margin-bottom:12px;padding:12px;background:var(--green-bg);border-radius:8px;border-left:3px solid var(--green);">
                <div style="font-size:12px;font-weight:600;color:var(--green);margin-bottom:4px;">Receita Potencial Estimada</div>
                <div style="font-size:20px;font-weight:700;color:var(--dark);">${potentialRev}€</div>
                <div style="font-size:11px;color:var(--text-muted);">10% leads grátis + 20% upsell Career Path + 15% upsell CI PRO</div>
            </div>
            <div class="metric-row"><div class="metric-label">Leads grátis para upsell</div><div class="metric-value" style="color:var(--gold);">${freeIdentified}</div></div>
            <div class="metric-row"><div class="metric-label">Entradas pagas para upsell Career Path</div><div class="metric-value" style="color:var(--blue);">${entryPaidNoCp}</div></div>
            <div class="metric-row"><div class="metric-label">Career Path para upsell CI PRO</div><div class="metric-value" style="color:#7C3AED;">${cpNoCiOpp}</div></div>
            <div class="metric-row"><div class="metric-label">Ticket médio atual</div><div class="metric-value" style="color:var(--green);">${avgTicket.toFixed(2)}€</div></div>`;
    }

    // Receita por Produto
    const revEl = document.getElementById('revenueByProduct');
    if (revEl) {
        const studentRev = data.filter(a => isStudentPack(a) && getAnalysisType(a) === 'paid').reduce((s, a) => s + (a.payment_amount || 0), 0);
        const cvRev = data.filter(a => isCvAnalyser(a) && getAnalysisType(a) === 'paid').reduce((s, a) => s + (a.payment_amount || 0), 0);
        const cpRev = data.filter(a => a.analysis_type === 'career_path').reduce((s, a) => s + (a.payment_amount || 0), 0);
        const ciRevFunnel = data.filter(a => a.analysis_type === 'career_intelligence_pro' || a.analysis_type === 'career_intelligence_full').reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0);
        const lrRev = lrFiltered.filter(a => getAnalysisType(a) === 'paid').reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0);
        const vRev = allVouchers.filter(v => v.payment_method !== 'test' && v.payment_method !== 'promo').reduce((s, v) => s + (parseFloat(v.amount_paid) || 0), 0);
        const total = studentRev + cvRev + cpRev + ciRevFunnel + lrRev + vRev;

        revEl.innerHTML = `<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:16px;">
            ${[
                { label: 'Student Pack', value: studentRev, color: '#059669', icon: 'fa-user-graduate' },
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
    const hasCVPaid = p.purchases.some(a => a.analysis_type !== 'career_path' && a.analysis_type !== 'career_intelligence_pro' && a.analysis_type !== 'career_intelligence_full');
    const hasCI = p.purchases.some(a => a.analysis_type === 'career_intelligence_pro' || a.analysis_type === 'career_intelligence_full');
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
    const autoEmails = allEmailHistory.filter(e => isAutoType(e, 'upsell_auto_2h') || isAutoType(e, 'upsell_auto_7d') || isAutoType(e, 'crosssell_cv_to_cp') || isAutoType(e, 'crosssell_cp_to_pro'));
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recent = autoEmails.filter(e => new Date(e.sent_at) > thirtyDaysAgo);
    const upsell2h = recent.filter(e => isAutoType(e, 'upsell_auto_2h')).length;
    const upsell7d = recent.filter(e => isAutoType(e, 'upsell_auto_7d')).length;
    const crossCvCp = recent.filter(e => isAutoType(e, 'crosssell_cv_to_cp')).length;
    const crossCpPro = recent.filter(e => isAutoType(e, 'crosssell_cp_to_pro')).length;
    const autoRecipients = [...new Set(autoEmails.map(e => e.recipient_email?.toLowerCase()))];
    const conversions = autoRecipients.filter(email => {
        const emailDate = autoEmails.find(e => e.recipient_email?.toLowerCase() === email)?.sent_at;
        return allAnalyses.some(a => a.user_email?.toLowerCase() === email && getAnalysisType(a) === 'paid' && new Date(a.created_at) > new Date(emailDate));
    }).length;
    const convRate = autoRecipients.length > 0 ? ((conversions / autoRecipients.length) * 100).toFixed(1) + '%' : '0%';
    setText('autoUpsell2h', upsell2h);
    setText('autoUpsell7d', upsell7d);
    setText('autoCrossCvCp', crossCvCp);
    setText('autoCrossCpPro', crossCpPro);
    setText('autoConversions', conversions);
    setText('autoConvRate', convRate);
    const tbody = document.getElementById('autoEmailsTable');
    if (!tbody) return;
    const recentAuto = autoEmails.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at)).slice(0, 20);
    if (!recentAuto.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted);">Nenhum email automático enviado</td></tr>'; return; }
    tbody.innerHTML = recentAuto.map(e => {
        const date = new Date(e.sent_at).toLocaleDateString('pt-PT') + ' ' + new Date(e.sent_at).toLocaleTimeString('pt-PT', {hour:'2-digit',minute:'2-digit'});
        const emailAutoType = e.email_type || e.campaign_type || '';
        let typeBadge;
        if (emailAutoType.includes('crosssell_cv_to_cp')) typeBadge = '<span class="badge" style="background:#e67e22;color:#fff">CV→CP</span>';
        else if (emailAutoType.includes('crosssell_cp_to_pro')) typeBadge = '<span class="badge" style="background:#9b59b6;color:#fff">CP→Pro</span>';
        else if (emailAutoType.includes('2h')) typeBadge = '<span class="badge badge-teal">Upsell 2h</span>';
        else typeBadge = '<span class="badge badge-purple">Follow-up 7d</span>';
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
    // Include both cv_analysis and linkedin_roaster data
    const allData = [...allAnalyses, ...allLinkedinRoaster.map(a => ({ ...a, _source: 'linkedin_roaster', analysis_type: 'linkedin_roaster' }))];
    allData.forEach(a => {
        const email = isAnonymous(a) ? null : (a.user_email || '').toLowerCase().trim();
        if (!email) return;
        if (!profileMap[email]) {
            profileMap[email] = { email, name: a.user_name || '', professional_area: a.professional_area || '', seniority: '', analyses: [], purchases: [], totalSpent: 0, lastInteraction: a.created_at, firstInteraction: a.created_at };
        }
        const p = profileMap[email];
        p.analyses.push(a);
        if (new Date(a.created_at) > new Date(p.lastInteraction)) p.lastInteraction = a.created_at;
        if (new Date(a.created_at) < new Date(p.firstInteraction)) p.firstInteraction = a.created_at;
        if (!p.name && a.user_name) p.name = a.user_name;
        if (!p.professional_area && a.professional_area) p.professional_area = a.professional_area;
        const type = getAnalysisType(a);
        if (type === 'paid' || type === 'voucher') { p.purchases.push(a); p.totalSpent += (parseFloat(a.payment_amount) || 0); }
    });
    const sentEmails = new Set(allEmailHistory.map(e => e.recipient_email?.toLowerCase()));
    return Object.values(profileMap).map(p => {
        const hasPurchase = p.purchases.length > 0;
        const hasMultiple = p.purchases.length >= 2 || (p.purchases.length >= 1 && p.analyses.some(a => a.analysis_type === 'career_path' || a.analysis_type === 'career_intelligence_pro' || a.analysis_type === 'career_intelligence_full'));
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
            if (productFilter === 'cv_free') return p.analyses.some(a => isCvAnalyser(a) && getAnalysisType(a) === 'free');
            if (productFilter === 'cv_paid') return p.purchases.some(a => isCvAnalyser(a));
            if (productFilter === 'student_pack') return p.purchases.some(a => isStudentPack(a));
            if (productFilter === 'career_path') return p.purchases.some(a => a.analysis_type === 'career_path');
            if (productFilter === 'career_intelligence') return p.purchases.some(a => a.analysis_type === 'career_intelligence_pro' || a.analysis_type === 'career_intelligence_full');
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

    const productNameMap = t => t === 'student_pack' || t === 'studen pack' ? 'Student Pack' : t === 'career_path' ? 'Career Path' : t === 'career_intelligence_pro' ? 'CI PRO' : t === 'career_intelligence_full' ? 'CI Full' : t === 'career_intelligence' ? 'Career Intelligence' : t === 'linkedin_roaster' ? 'LinkedIn Roaster' : 'CV Analyser';
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
        if (type === 'linkedin_roaster') data = data.filter(a => isLinkedinRoaster(a));
        else if (type === 'cv') data = data.filter(a => a.analysis_type !== 'career_path' && a.analysis_type !== 'career_intelligence_pro' && a.analysis_type !== 'career_intelligence_full' && !isLinkedinRoaster(a));
        else if (type === 'career_path') data = data.filter(a => a.analysis_type === 'career_path');
        else if (type === 'career_intelligence') data = data.filter(a => a.analysis_type === 'career_intelligence_pro' || a.analysis_type === 'career_intelligence_full' || a.analysis_type === 'career_intelligence');
        else data = data.filter(a => getAnalysisType(a) === type);
    }
    if (email) data = data.filter(a => (a.user_email || '').toLowerCase().includes(email));
    data = data.filter(a => !(a.user_email || '').startsWith('__') && !(a.user_name || '').startsWith('__'));
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
        const rawScore = a.score || 0;
        const score = rawScore > 0 ? `<span style="font-weight:600;color:${rawScore >= 70 ? 'var(--green)' : rawScore >= 40 ? 'var(--orange)' : 'var(--red)'};">${rawScore}</span>` : '—';
        const amount = a.payment_amount > 0 ? `<span style="color:var(--gold);font-weight:600;">${a.payment_amount.toFixed(2)}€</span>` : '—';
        const rating = a.user_rating ? `<span style="color:var(--gold);">${'★'.repeat(a.user_rating)}${'☆'.repeat(5 - a.user_rating)}</span>` : '—';
        const payType = a.payment_amount > 0 ? '<span class="badge" style="background:var(--green);color:#fff;font-size:10px;">Pago</span>' : '<span class="badge badge-secondary" style="font-size:10px;">Gratuito</span>';
        return `<tr>
            <td style="font-size:12px;color:var(--text-muted);">${date}</td>
            <td>${a.user_name || '\u2014'}</td>
            <td style="font-size:12px;">${isAnonymous(a) ? '<span style="color:var(--text-muted);">an\u00f3nimo</span>' : a.user_email}</td>
            <td>${getTypeBadge(aType)}</td>
            <td>${score}</td>
            <td>${getProductBadge(a)}</td>
            <td>${payType}</td>
            <td>${amount}</td>
            <td>${rating}</td>
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
        const productName = isStudentPack(a) ? 'Student Pack' : a._source === 'linkedin_roaster' ? 'LinkedIn Roaster' : a.analysis_type === 'career_intelligence_pro' ? 'CI PRO' : a.analysis_type === 'career_intelligence_full' ? 'CI Full' : a.analysis_type === 'career_path' ? 'Career Path' : 'CV Analyser';
        rows.push([a.created_at?.slice(0,10), a.user_name||'', a.user_email||'', a.score||'', getAnalysisType(a), productName, a.payment_amount||0, getPaymentOrigin(a)]);
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
    if (!data.length) { tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhum voucher encontrado</td></tr>`; return; }
    tbody.innerHTML = data.map(v => {
        const isActive = v.is_active === true || (v.is_active !== false && (v.used_analyses || 0) < (v.total_analyses || 1));
        const date = new Date(v.created_at).toLocaleDateString('pt-PT');
        return `<tr>
            <td><code style="font-size:12px;background:var(--bg);padding:2px 6px;border-radius:4px;">${v.code}</code></td>
            <td style="font-size:12px;">${v.email || '\u2014'}</td>
            <td style="font-size:12px;">${v.plan_name || '\u2014'}</td>
            <td style="font-size:12px;">${v.payment_method || '\u2014'}</td>
            <td style="font-size:12px;font-weight:600;">${parseFloat(v.amount_paid) > 0 ? parseFloat(v.amount_paid).toFixed(2) + '\u20ac' : '\u2014'}</td>
            <td><span class="badge ${isActive ? 'badge-success' : 'badge-secondary'}">${isActive ? 'Ativo' : 'Usado'}</span></td>
            <td style="font-size:12px;color:var(--text-muted);">${v.used_analyses||0}/${v.total_analyses||1}</td>
            <td style="font-size:12px;color:var(--text-muted);">${date}</td>
            <td>${v.email ? `<button class="btn-icon" title="Enviar Email" onclick="openEmailModal('${v.email}','')"><i class="fas fa-envelope"></i></button>` : ''}</td>
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
            await sendBrevoEmail(email, 'Os teus vouchers Share2Inspire \u2014 Pack Teste', `<p style="font-size:15px;color:#333;line-height:1.7;">Ol\u00e1,</p><p style="font-size:15px;color:#333;line-height:1.7;">Seguem os teus <strong>vouchers de teste</strong> do Share2Inspire:</p><div style="background:#f8f6f0;border-left:4px solid #C9A961;padding:16px 20px;margin:16px 0;border-radius:4px;">${codesList}</div><p style="font-size:14px;color:#555;line-height:1.7;">Para utilizar, acede a <a href="https://www.share2inspire.pt" style="color:#C9A961;font-weight:600;">share2inspire.pt</a> e introduz o c\u00f3digo na sec\u00e7\u00e3o correspondente.</p><p style="font-size:14px;color:#666;">Qualquer d\u00favida, responde a este email.<br><strong>Equipa Share2Inspire</strong></p>`);
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
        await sendBrevoEmail(email, `O teu voucher Share2Inspire \u2014 ${planName}`, `<p style="font-size:15px;color:#333;line-height:1.7;">Ol\u00e1,</p><p style="font-size:15px;color:#333;line-height:1.7;">Segue o teu voucher para <strong style="color:#C9A961;">${planName}</strong>:</p><div style="background:#f8f6f0;border-left:4px solid #C9A961;padding:16px 20px;margin:16px 0;border-radius:4px;font-size:20px;font-weight:bold;color:#C9A961;">${codes.join('<br>')}</div><p style="font-size:14px;color:#555;line-height:1.7;">Para utilizar, acede a <a href="https://www.share2inspire.pt" style="color:#C9A961;font-weight:600;">share2inspire.pt</a> e introduz o c\u00f3digo na sec\u00e7\u00e3o correspondente.</p><p style="font-size:14px;color:#666;">Qualquer d\u00favida, responde a este email.<br><strong>Equipa Share2Inspire</strong></p>`);
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
            upsell_cv: { subject: 'O teu CV merece mais — desbloqueia a análise completa', body: `<p style="font-size:15px;color:#333;line-height:1.7;">Olá,</p><p style="font-size:15px;color:#333;line-height:1.7;">Vimos que fizeste uma <strong>análise gratuita do teu CV</strong> no Share2Inspire. Os resultados preliminares já te deram uma visão geral — mas há muito mais para descobrir.</p><p style="font-size:15px;color:#333;line-height:1.7;">Com a <strong style="color:#C9A961;">versão completa</strong>, recebes:</p><ul style="font-size:14px;color:#444;line-height:2;"><li>Recomendações detalhadas por secção do CV</li><li>Sugestões de palavras-chave para ATS</li><li>Comparação com perfis de sucesso na tua área</li></ul><p style="text-align:center;margin:24px 0;"><a href="https://www.share2inspire.pt/cv-analyser" style="display:inline-block;background:#C9A961;color:#0a1628;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Desbloquear Análise Completa →</a></p><p style="font-size:14px;color:#666;">Qualquer dúvida, responde diretamente a este email.<br><strong>Equipa Share2Inspire</strong></p>` },
            upsell_cp: { subject: 'O teu Career Path personalizado está à espera', body: `<p style="font-size:15px;color:#333;line-height:1.7;">Olá,</p><p style="font-size:15px;color:#333;line-height:1.7;">Com base na tua análise de CV, preparámos um <strong style="color:#C9A961;">Career Path personalizado</strong> para ti. Descobre quais as funções mais alinhadas com o teu perfil e as competências que podes desenvolver.</p><p style="font-size:15px;color:#333;line-height:1.7;">O teu Career Path inclui:</p><ul style="font-size:14px;color:#444;line-height:2;"><li>Mapeamento de oportunidades de carreira</li><li>Análise de competências vs. mercado</li><li>Roadmap de desenvolvimento profissional</li></ul><p style="text-align:center;margin:24px 0;"><a href="https://www.share2inspire.pt/career-path" style="display:inline-block;background:#C9A961;color:#0a1628;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Descobrir o meu Career Path →</a></p><p style="font-size:14px;color:#666;">Qualquer dúvida, responde diretamente a este email.<br><strong>Equipa Share2Inspire</strong></p>` },
            upsell_student_pack: { subject: 'O Student Pack pode dar-te uma vantagem no arranque da carreira', body: `<p style="font-size:15px;color:#333;line-height:1.7;">Olá,</p><p style="font-size:15px;color:#333;line-height:1.7;">O <strong style="color:#C9A961;">Student Pack</strong> foi pensado para estudantes e recém-licenciados que querem melhorar a forma como se apresentam e candidatar-se com mais confiança.</p><p style="font-size:15px;color:#333;line-height:1.7;">É uma solução prática para organizar melhor o CV, a candidatura e os próximos passos profissionais.</p><p style="text-align:center;margin:24px 0;"><a href="https://www.share2inspire.pt/estudante" style="display:inline-block;background:#C9A961;color:#0a1628;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Explorar o Student Pack →</a></p><p style="font-size:14px;color:#666;">Qualquer dúvida, responde diretamente a este email.<br><strong>Equipa Share2Inspire</strong></p>` },
            upsell_ci: { subject: 'Career Intelligence PRO — leva a tua carreira ao próximo nível', body: `<p style="font-size:15px;color:#333;line-height:1.7;">Olá,</p><p style="font-size:15px;color:#333;line-height:1.7;">Já tens o teu Career Path. Agora é hora de ir mais fundo com o <strong style="color:#C9A961;">Career Intelligence PRO</strong> — uma análise profunda do teu mercado profissional.</p><p style="font-size:15px;color:#333;line-height:1.7;">O que vais descobrir:</p><ul style="font-size:14px;color:#444;line-height:2;"><li>Tendências salariais na tua área</li><li>Empresas que mais contratam o teu perfil</li><li>Competências emergentes no mercado</li></ul><p style="text-align:center;margin:24px 0;"><a href="https://www.share2inspire.pt/career-intelligence" style="display:inline-block;background:#C9A961;color:#0a1628;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Explorar Career Intelligence →</a></p><p style="font-size:14px;color:#666;">Qualquer dúvida, responde diretamente a este email.<br><strong>Equipa Share2Inspire</strong></p>` },
            followup: { subject: 'Podemos ajudar-te com a tua carreira?', body: `<p style="font-size:15px;color:#333;line-height:1.7;">Olá,</p><p style="font-size:15px;color:#333;line-height:1.7;">Vimos que visitaste o <strong>Share2Inspire</strong> recentemente. Esperamos que tenhas encontrado informação útil para a tua carreira.</p><p style="font-size:15px;color:#333;line-height:1.7;">Se tiveres alguma questão sobre as nossas ferramentas — análise de CV, Career Path, Career Intelligence ou Student Pack — estamos aqui para ajudar.</p><p style="font-size:15px;color:#333;line-height:1.7;">Basta responderes a este email e entraremos em contacto brevemente.</p><p style="font-size:14px;color:#666;">Com os melhores cumprimentos,<br><strong>Equipa Share2Inspire</strong></p>` },
            testimonial: { subject: 'A tua opinião é importante para nós', body: `<p style="font-size:15px;color:#333;line-height:1.7;">Olá,</p><p style="font-size:15px;color:#333;line-height:1.7;">Esperamos que a tua experiência com o <strong>Share2Inspire</strong> tenha sido positiva! A tua opinião ajuda-nos a melhorar e a ajudar mais profissionais.</p><p style="font-size:15px;color:#333;line-height:1.7;">Gostaríamos muito que partilhasses um breve testemunho sobre como as nossas ferramentas te ajudaram na tua carreira.</p><p style="text-align:center;margin:24px 0;"><a href="https://g.page/r/CZS08nYUvP4qEAE/review" style="display:inline-block;background:#C9A961;color:#0a1628;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">⭐ Deixar Avaliação no Google →</a></p><p style="font-size:14px;color:#666;">Obrigado pelo teu tempo!<br><strong>Equipa Share2Inspire</strong></p>` }
        },
        en: {
            upsell_cv: { subject: 'Your CV deserves more — unlock the full analysis', body: `<p style="font-size:15px;color:#333;line-height:1.7;">Hi,</p><p style="font-size:15px;color:#333;line-height:1.7;">We noticed you did a <strong>free CV analysis</strong> on Share2Inspire. The preliminary results gave you an overview — but there's much more to discover.</p><p style="font-size:15px;color:#333;line-height:1.7;">With the <strong style="color:#C9A961;">full version</strong>, you get:</p><ul style="font-size:14px;color:#444;line-height:2;"><li>Detailed recommendations per CV section</li><li>ATS keyword suggestions</li><li>Comparison with successful profiles in your field</li></ul><p style="text-align:center;margin:24px 0;"><a href="https://www.share2inspire.pt/en/cv-analyser" style="display:inline-block;background:#C9A961;color:#0a1628;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Unlock Full Analysis →</a></p><p style="font-size:14px;color:#666;">Any questions? Just reply to this email.<br><strong>Share2Inspire Team</strong></p>` },
            upsell_cp: { subject: 'Your personalized Career Path is ready', body: `<p style="font-size:15px;color:#333;line-height:1.7;">Hi,</p><p style="font-size:15px;color:#333;line-height:1.7;">Based on your CV analysis, we've prepared a <strong style="color:#C9A961;">personalized Career Path</strong> for you. Discover which roles best match your profile and which skills to develop next.</p><p style="font-size:15px;color:#333;line-height:1.7;">Your Career Path includes:</p><ul style="font-size:14px;color:#444;line-height:2;"><li>Career opportunity mapping</li><li>Skills vs. market analysis</li><li>Professional development roadmap</li></ul><p style="text-align:center;margin:24px 0;"><a href="https://www.share2inspire.pt/en/career-path" style="display:inline-block;background:#C9A961;color:#0a1628;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Discover my Career Path →</a></p><p style="font-size:14px;color:#666;">Any questions? Just reply to this email.<br><strong>Share2Inspire Team</strong></p>` },
            upsell_student_pack: { subject: 'The Student Pack can help you start your career with more confidence', body: `<p style="font-size:15px;color:#333;line-height:1.7;">Hi,</p><p style="font-size:15px;color:#333;line-height:1.7;">The <strong style="color:#C9A961;">Student Pack</strong> was created for students and recent graduates who want to present themselves better and apply with more confidence.</p><p style="font-size:15px;color:#333;line-height:1.7;">It is a practical solution to improve your CV, structure your applications and clarify your next professional steps.</p><p style="text-align:center;margin:24px 0;"><a href="https://www.share2inspire.pt/en/student-pack" style="display:inline-block;background:#C9A961;color:#0a1628;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Explore the Student Pack →</a></p><p style="font-size:14px;color:#666;">Any questions? Just reply to this email.<br><strong>Share2Inspire Team</strong></p>` },
            upsell_ci: { subject: 'Career Intelligence PRO — take your career to the next level', body: `<p style="font-size:15px;color:#333;line-height:1.7;">Hi,</p><p style="font-size:15px;color:#333;line-height:1.7;">You already have your Career Path. Now it's time to go deeper with <strong style="color:#C9A961;">Career Intelligence PRO</strong> — a deep analysis of your professional market.</p><p style="font-size:15px;color:#333;line-height:1.7;">What you'll discover:</p><ul style="font-size:14px;color:#444;line-height:2;"><li>Salary trends in your field</li><li>Top hiring companies for your profile</li><li>Emerging skills in the market</li></ul><p style="text-align:center;margin:24px 0;"><a href="https://www.share2inspire.pt/en/career-intelligence" style="display:inline-block;background:#C9A961;color:#0a1628;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Explore Career Intelligence →</a></p><p style="font-size:14px;color:#666;">Any questions? Just reply to this email.<br><strong>Share2Inspire Team</strong></p>` },
            followup: { subject: 'Can we help with your career?', body: `<p style="font-size:15px;color:#333;line-height:1.7;">Hi,</p><p style="font-size:15px;color:#333;line-height:1.7;">We noticed you visited <strong>Share2Inspire</strong> recently. We hope you found useful information for your career.</p><p style="font-size:15px;color:#333;line-height:1.7;">If you have any questions about our tools — CV analysis, Career Path, Career Intelligence, or the Student Pack — we're here to help.</p><p style="font-size:15px;color:#333;line-height:1.7;">Simply reply to this email and we'll get back to you shortly.</p><p style="font-size:14px;color:#666;">Best regards,<br><strong>Share2Inspire Team</strong></p>` },
            testimonial: { subject: 'Your opinion matters to us', body: `<p style="font-size:15px;color:#333;line-height:1.7;">Hi,</p><p style="font-size:15px;color:#333;line-height:1.7;">We hope your experience with <strong>Share2Inspire</strong> has been positive! Your feedback helps us improve and support more professionals.</p><p style="font-size:15px;color:#333;line-height:1.7;">We'd love for you to share a brief testimonial about how our tools helped your career.</p><p style="text-align:center;margin:24px 0;"><a href="https://g.page/r/CZS08nYUvP4qEAE/review" style="display:inline-block;background:#C9A961;color:#0a1628;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">⭐ Leave a Google Review →</a></p><p style="font-size:14px;color:#666;">Thank you for your time!<br><strong>Share2Inspire Team</strong></p>` }
        }
    };
    const t = templates[lang]?.[tpl];
    if (t) {
        document.getElementById('modalEmailSubject').value = t.subject;
        document.getElementById('modalEmailBody').value = t.body;
    }
}

function wrapEmailTemplate(bodyHtml, lang = 'pt') {
    const isEn = lang === 'en';
    const reviewText = isEn ? 'How was your experience? Leave us a review' : 'Como foi a tua experiência? Deixa-nos uma avaliação';
    const followText = isEn ? 'Follow us' : 'Segue-nos';
    const unsubText = isEn ? 'You received this email because you interacted with Share2Inspire.' : 'Recebeste este email porque interagiste com o Share2Inspire.';
    const rightsText = isEn ? 'All rights reserved.' : 'Todos os direitos reservados.';
    return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- HEADER -->
<tr><td style="background:linear-gradient(135deg,#0a1628 0%,#162a4a 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
  <img src="https://www.share2inspire.pt/images/logo.webp" alt="Share2Inspire" height="40" style="height:40px;margin-bottom:8px;">
  <div style="font-size:10px;color:#C9A961;letter-spacing:3px;text-transform:uppercase;font-weight:600;">Career Intelligence Platform</div>
</td></tr>

<!-- GOLD ACCENT LINE -->
<tr><td style="height:3px;background:linear-gradient(90deg,#C9A961,#e8d5a3,#C9A961);"></td></tr>

<!-- BODY -->
<tr><td style="background:#ffffff;padding:32px 32px 24px 32px;">
  ${bodyHtml}
</td></tr>

<!-- DIVIDER -->
<tr><td style="background:#ffffff;padding:0 32px;"><hr style="border:none;border-top:1px solid #e8e8ed;margin:0;"></td></tr>

<!-- GOOGLE REVIEW CTA -->
<tr><td style="background:#ffffff;padding:20px 32px;text-align:center;">
  <p style="font-size:13px;color:#555;margin:0 0 10px 0;">${reviewText}</p>
  <a href="https://g.page/r/CZS08nYUvP4qEAE/review" style="display:inline-block;background:#C9A961;color:#0a1628;padding:10px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;">⭐ Google Review</a>
</td></tr>

<!-- FOOTER -->
<tr><td style="background:#0a1628;padding:24px 32px;border-radius:0 0 12px 12px;text-align:center;">
  <p style="margin:0 0 12px 0;font-size:12px;color:rgba(255,255,255,0.5);">${followText}</p>
  <p style="margin:0 0 16px 0;">
    <a href="https://www.linkedin.com/company/107046213" style="color:#C9A961;text-decoration:none;margin:0 8px;font-size:14px;">LinkedIn</a>
    <span style="color:rgba(255,255,255,0.2);">|</span>
    <a href="https://www.instagram.com/share2inspire_/" style="color:#C9A961;text-decoration:none;margin:0 8px;font-size:14px;">Instagram</a>
    <span style="color:rgba(255,255,255,0.2);">|</span>
    <a href="https://www.share2inspire.pt" style="color:#C9A961;text-decoration:none;margin:0 8px;font-size:14px;">Website</a>
  </p>
  <p style="margin:0 0 4px 0;font-size:11px;color:rgba(255,255,255,0.35);">${unsubText}</p>
  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);">&copy; 2026 Share2Inspire. ${rightsText}</p>
</td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

async function sendBrevoEmail(to, subject, htmlContent) {
    const key = getBrevoKey();
    if (!key) return false;
    // Wrap content in professional template if not already wrapped
    const finalHtml = htmlContent.includes('f4f4f7') ? htmlContent : wrapEmailTemplate(htmlContent);
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'accept': 'application/json', 'content-type': 'application/json', 'api-key': key },
        body: JSON.stringify({ sender: BREVO_SENDER, to: [{ email: to }], subject, htmlContent: finalHtml })
    });
    return res.ok;
}

async function sendSingleEmail() {
    if (!ensureBrevoKey()) return;
    const to = document.getElementById('modalEmailTo').value.trim();
    const subject = document.getElementById('modalEmailSubject').value.trim();
    const body = document.getElementById('modalEmailBody').value.trim();
    if (!to || !subject || !body) { showToast('Preenche todos os campos', 'danger'); return; }
    const htmlBody = body.includes('<p>') || body.includes('<a ') ? body : body.replace(/\n/g, '<br>');
    const ok = await sendBrevoEmail(to, subject, htmlBody);
    if (ok) {
        showToast('Email enviado com sucesso!', 'success');
        try { await supaInsert('email_history', { recipient_email: to, subject, body: htmlBody, email_type: 'manual', sent_at: new Date().toISOString(), status: 'sent' }); } catch(e) { console.warn('Email sent but failed to log in history:', e); }
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
    const sentEmails = new Set(allEmailHistory.map(e => e.recipient_email?.toLowerCase()));
    const leadsUnsent = leads.filter(l => !sentEmails.has(l.email.toLowerCase())).length;
    const clientsUnsent = clients.filter(c => !sentEmails.has(c.email.toLowerCase())).length;
    const recurringUnsent = recurring.filter(r => !sentEmails.has(r.email.toLowerCase())).length;
    const el = document.getElementById('nurturingSegments');
    if (el) {
        el.innerHTML = `
            <div class="card" style="cursor:pointer;" onclick="document.getElementById('campaignSegment').value='lead';filterCampaignRecipients();">
                <div class="card-body" style="text-align:center;padding:16px;">
                    <div style="font-size:28px;font-weight:700;color:var(--blue);">${leads.length}</div>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">Leads (sem compra)</div>
                    <div style="font-size:11px;color:var(--orange);margin-top:4px;">${leadsUnsent} sem email enviado</div>
                </div>
            </div>
            <div class="card" style="cursor:pointer;" onclick="document.getElementById('campaignSegment').value='client';filterCampaignRecipients();">
                <div class="card-body" style="text-align:center;padding:16px;">
                    <div style="font-size:28px;font-weight:700;color:var(--green);">${clients.length}</div>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">Clientes (1 compra)</div>
                    <div style="font-size:11px;color:var(--orange);margin-top:4px;">${clientsUnsent} sem email enviado</div>
                </div>
            </div>
            <div class="card" style="cursor:pointer;" onclick="document.getElementById('campaignSegment').value='recurring';filterCampaignRecipients();">
                <div class="card-body" style="text-align:center;padding:16px;">
                    <div style="font-size:28px;font-weight:700;color:var(--gold);">${recurring.length}</div>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">Recorrentes (2+)</div>
                    <div style="font-size:11px;color:var(--orange);margin-top:4px;">${recurringUnsent} sem email enviado</div>
                </div>
            </div>`;
    }
    // Show last campaign sent date
    const lastCampaign = allEmailHistory.find(e => e.email_type === 'campaign');
    const lastSentEl = document.getElementById('campaignLastSent');
    if (lastSentEl && lastCampaign) {
        lastSentEl.innerHTML = `<i class="fas fa-clock"></i> Última campanha: ${new Date(lastCampaign.sent_at).toLocaleString('pt-PT')}`;
    }
    filterCampaignRecipients();
}

function filterCampaignRecipients() {
    const segment = document.getElementById('campaignSegment')?.value || 'all';
    const lang = nurturingLang;
    let profiles = buildCRMProfiles().filter(p => {
        if (lang === 'pt') return filterByLang(p.analyses, 'pt').length > 0;
        if (lang === 'en') return filterByLang(p.analyses, 'en').length > 0;
        return true;
    });
    if (segment !== 'all') profiles = profiles.filter(p => p.stage === segment);
    renderRecipientList(profiles);
}

function renderRecipientList(profiles) {
    if (!profiles) profiles = buildCRMProfiles();
    const tbody = document.getElementById('recipientTable');
    if (!tbody) return;
    const search = (document.getElementById('recipientSearch')?.value || '').toLowerCase();
    let filtered = profiles.filter(p => !search || p.email.includes(search) || (p.name || '').toLowerCase().includes(search));
    // Find last email sent to each recipient
    const lastEmailMap = {};
    allEmailHistory.forEach(e => {
        const key = (e.recipient_email || '').toLowerCase();
        if (!lastEmailMap[key] || new Date(e.sent_at) > new Date(lastEmailMap[key])) lastEmailMap[key] = e.sent_at;
    });
    setText('recipientCount', `${filtered.length} destinat\u00e1rios`);
    tbody.innerHTML = filtered.slice(0, 200).map(p => {
        const lastEmail = lastEmailMap[p.email.toLowerCase()];
        const lastEmailStr = lastEmail ? new Date(lastEmail).toLocaleDateString('pt-PT') : '<span style="color:var(--orange);">Nunca</span>';
        return `<tr>
            <td><input type="checkbox" class="recipient-cb" value="${p.email}" checked></td>
            <td style="font-size:12px;">${p.name || '\u2014'}</td>
            <td style="font-size:12px;">${p.email}</td>
            <td>${getStageBadge(p.stage)}</td>
            <td style="font-size:11px;color:var(--text-muted);">${lastEmailStr}</td>
        </tr>`;
    }).join('');
}
function filterRecipientList() { renderNurturingSegments(); }
function toggleAllRecipients(checked) { document.querySelectorAll('.recipient-cb').forEach(cb => cb.checked = checked); }
function selectOnlyUnsent() {
    const sentEmails = new Set(allEmailHistory.map(e => e.recipient_email?.toLowerCase()));
    document.querySelectorAll('.recipient-cb').forEach(cb => { cb.checked = !sentEmails.has(cb.value.toLowerCase()); });
}
function loadCampaignTemplate() {
    const tpl = document.getElementById('campaignTemplate')?.value;
    const lang = nurturingLang;
    if (!tpl) return;
    const templates = {
        pt: {
            upsell_cv: { subject: 'O teu CV merece mais — desbloqueia a análise completa', body: '<p style="font-size:15px;color:#333;line-height:1.7;">Olá,</p><p style="font-size:15px;color:#333;line-height:1.7;">Vimos que fizeste uma <strong>análise gratuita do teu CV</strong> no Share2Inspire. Os resultados preliminares já te deram uma visão geral — mas há muito mais para descobrir.</p><p style="font-size:15px;color:#333;line-height:1.7;">Com a <strong style="color:#C9A961;">versão completa</strong>, recebes:</p><ul style="font-size:14px;color:#444;line-height:2;"><li>Recomendações detalhadas por secção do CV</li><li>Sugestões de palavras-chave para ATS</li><li>Comparação com perfis de sucesso na tua área</li></ul><p style="text-align:center;margin:24px 0;"><a href="https://www.share2inspire.pt/cv-analyser" style="display:inline-block;background:#C9A961;color:#0a1628;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Desbloquear Análise Completa →</a></p><p style="font-size:14px;color:#666;">Qualquer dúvida, responde diretamente a este email.<br><strong>Equipa Share2Inspire</strong></p>' },
            upsell_cp: { subject: 'O teu Career Path personalizado está à espera', body: '<p style="font-size:15px;color:#333;line-height:1.7;">Olá,</p><p style="font-size:15px;color:#333;line-height:1.7;">Com base na tua análise de CV, preparámos um <strong style="color:#C9A961;">Career Path personalizado</strong> para ti. Descobre quais as funções mais alinhadas com o teu perfil e as competências que podes desenvolver.</p><p style="font-size:15px;color:#333;line-height:1.7;">O teu Career Path inclui:</p><ul style="font-size:14px;color:#444;line-height:2;"><li>Mapeamento de oportunidades de carreira</li><li>Análise de competências vs. mercado</li><li>Roadmap de desenvolvimento profissional</li></ul><p style="text-align:center;margin:24px 0;"><a href="https://www.share2inspire.pt/career-path" style="display:inline-block;background:#C9A961;color:#0a1628;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Descobrir o meu Career Path →</a></p><p style="font-size:14px;color:#666;">Qualquer dúvida, responde diretamente a este email.<br><strong>Equipa Share2Inspire</strong></p>' },
            upsell_student_pack: { subject: 'O Student Pack pode dar-te uma vantagem no arranque da carreira', body: '<p style="font-size:15px;color:#333;line-height:1.7;">Olá,</p><p style="font-size:15px;color:#333;line-height:1.7;">O <strong style="color:#C9A961;">Student Pack</strong> foi pensado para estudantes e recém-licenciados que querem melhorar a forma como se apresentam e candidatar-se com mais confiança.</p><p style="font-size:15px;color:#333;line-height:1.7;">É uma solução prática para organizar melhor o CV, a candidatura e os próximos passos profissionais.</p><p style="text-align:center;margin:24px 0;"><a href="https://www.share2inspire.pt/estudante" style="display:inline-block;background:#C9A961;color:#0a1628;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Explorar o Student Pack →</a></p><p style="font-size:14px;color:#666;">Qualquer dúvida, responde diretamente a este email.<br><strong>Equipa Share2Inspire</strong></p>' },
            upsell_ci: { subject: 'Career Intelligence PRO — leva a tua carreira ao próximo nível', body: '<p style="font-size:15px;color:#333;line-height:1.7;">Olá,</p><p style="font-size:15px;color:#333;line-height:1.7;">Já tens o teu Career Path. Agora é hora de ir mais fundo com o <strong style="color:#C9A961;">Career Intelligence PRO</strong> — uma análise profunda do teu mercado profissional.</p><p style="font-size:15px;color:#333;line-height:1.7;">O que vais descobrir:</p><ul style="font-size:14px;color:#444;line-height:2;"><li>Tendências salariais na tua área</li><li>Empresas que mais contratam o teu perfil</li><li>Competências emergentes no mercado</li></ul><p style="text-align:center;margin:24px 0;"><a href="https://www.share2inspire.pt/career-intelligence" style="display:inline-block;background:#C9A961;color:#0a1628;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Explorar Career Intelligence →</a></p><p style="font-size:14px;color:#666;">Qualquer dúvida, responde diretamente a este email.<br><strong>Equipa Share2Inspire</strong></p>' },
            followup: { subject: 'Podemos ajudar-te com a tua carreira?', body: '<p style="font-size:15px;color:#333;line-height:1.7;">Olá,</p><p style="font-size:15px;color:#333;line-height:1.7;">Vimos que visitaste o <strong>Share2Inspire</strong> recentemente. Esperamos que tenhas encontrado informação útil para a tua carreira.</p><p style="font-size:15px;color:#333;line-height:1.7;">Se tiveres alguma questão sobre as nossas ferramentas — análise de CV, Career Path, Career Intelligence ou Student Pack — estamos aqui para ajudar.</p><p style="font-size:15px;color:#333;line-height:1.7;">Basta responderes a este email e entraremos em contacto brevemente.</p><p style="font-size:14px;color:#666;">Com os melhores cumprimentos,<br><strong>Equipa Share2Inspire</strong></p>' },
            testimonial: { subject: 'A tua opinião é importante para nós', body: '<p style="font-size:15px;color:#333;line-height:1.7;">Olá,</p><p style="font-size:15px;color:#333;line-height:1.7;">Esperamos que a tua experiência com o <strong>Share2Inspire</strong> tenha sido positiva! A tua opinião ajuda-nos a melhorar e a ajudar mais profissionais.</p><p style="font-size:15px;color:#333;line-height:1.7;">Gostaríamos muito que partilhasses um breve testemunho sobre como as nossas ferramentas te ajudaram na tua carreira.</p><p style="text-align:center;margin:24px 0;"><a href="https://g.page/r/CZS08nYUvP4qEAE/review" style="display:inline-block;background:#C9A961;color:#0a1628;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">⭐ Deixar Avaliação no Google →</a></p><p style="font-size:14px;color:#666;">Obrigado pelo teu tempo!<br><strong>Equipa Share2Inspire</strong></p>' }
        },
        en: {
            upsell_cv: { subject: 'Your CV deserves more — unlock the full analysis', body: '<p style="font-size:15px;color:#333;line-height:1.7;">Hi,</p><p style="font-size:15px;color:#333;line-height:1.7;">We noticed you did a <strong>free CV analysis</strong> on Share2Inspire. The preliminary results gave you an overview — but there\'s much more to discover.</p><p style="font-size:15px;color:#333;line-height:1.7;">With the <strong style="color:#C9A961;">full version</strong>, you get:</p><ul style="font-size:14px;color:#444;line-height:2;"><li>Detailed recommendations per CV section</li><li>ATS keyword suggestions</li><li>Comparison with successful profiles in your field</li></ul><p style="text-align:center;margin:24px 0;"><a href="https://www.share2inspire.pt/en/cv-analyser" style="display:inline-block;background:#C9A961;color:#0a1628;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Unlock Full Analysis →</a></p><p style="font-size:14px;color:#666;">Any questions? Just reply to this email.<br><strong>Share2Inspire Team</strong></p>' },
            upsell_cp: { subject: 'Your personalized Career Path is ready', body: '<p style="font-size:15px;color:#333;line-height:1.7;">Hi,</p><p style="font-size:15px;color:#333;line-height:1.7;">Based on your CV analysis, we\'ve prepared a <strong style="color:#C9A961;">personalized Career Path</strong> for you. Discover which roles best match your profile and which skills to develop next.</p><p style="font-size:15px;color:#333;line-height:1.7;">Your Career Path includes:</p><ul style="font-size:14px;color:#444;line-height:2;"><li>Career opportunity mapping</li><li>Skills vs. market analysis</li><li>Professional development roadmap</li></ul><p style="text-align:center;margin:24px 0;"><a href="https://www.share2inspire.pt/en/career-path" style="display:inline-block;background:#C9A961;color:#0a1628;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Discover my Career Path →</a></p><p style="font-size:14px;color:#666;">Any questions? Just reply to this email.<br><strong>Share2Inspire Team</strong></p>' },
            upsell_student_pack: { subject: 'The Student Pack can help you start your career with more confidence', body: '<p style="font-size:15px;color:#333;line-height:1.7;">Hi,</p><p style="font-size:15px;color:#333;line-height:1.7;">The <strong style="color:#C9A961;">Student Pack</strong> was created for students and recent graduates who want to present themselves better and apply with more confidence.</p><p style="font-size:15px;color:#333;line-height:1.7;">It is a practical solution to improve your CV, structure your applications and clarify your next professional steps.</p><p style="text-align:center;margin:24px 0;"><a href="https://www.share2inspire.pt/en/student-pack" style="display:inline-block;background:#C9A961;color:#0a1628;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Explore the Student Pack →</a></p><p style="font-size:14px;color:#666;">Any questions? Just reply to this email.<br><strong>Share2Inspire Team</strong></p>' },
            upsell_ci: { subject: 'Career Intelligence PRO — take your career to the next level', body: '<p style="font-size:15px;color:#333;line-height:1.7;">Hi,</p><p style="font-size:15px;color:#333;line-height:1.7;">You already have your Career Path. Now it\'s time to go deeper with <strong style="color:#C9A961;">Career Intelligence PRO</strong> — a deep analysis of your professional market.</p><p style="font-size:15px;color:#333;line-height:1.7;">What you\'ll discover:</p><ul style="font-size:14px;color:#444;line-height:2;"><li>Salary trends in your field</li><li>Top hiring companies for your profile</li><li>Emerging skills in the market</li></ul><p style="text-align:center;margin:24px 0;"><a href="https://www.share2inspire.pt/en/career-intelligence" style="display:inline-block;background:#C9A961;color:#0a1628;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Explore Career Intelligence →</a></p><p style="font-size:14px;color:#666;">Any questions? Just reply to this email.<br><strong>Share2Inspire Team</strong></p>' },
            followup: { subject: 'Can we help with your career?', body: '<p style="font-size:15px;color:#333;line-height:1.7;">Hi,</p><p style="font-size:15px;color:#333;line-height:1.7;">We noticed you visited <strong>Share2Inspire</strong> recently. We hope you found useful information for your career.</p><p style="font-size:15px;color:#333;line-height:1.7;">If you have any questions about our tools — CV analysis, Career Path, Career Intelligence, or the Student Pack — we\'re here to help.</p><p style="font-size:15px;color:#333;line-height:1.7;">Simply reply to this email and we\'ll get back to you shortly.</p><p style="font-size:14px;color:#666;">Best regards,<br><strong>Share2Inspire Team</strong></p>' },
            testimonial: { subject: 'Your opinion matters to us', body: '<p style="font-size:15px;color:#333;line-height:1.7;">Hi,</p><p style="font-size:15px;color:#333;line-height:1.7;">We hope your experience with <strong>Share2Inspire</strong> has been positive! Your feedback helps us improve and support more professionals.</p><p style="font-size:15px;color:#333;line-height:1.7;">We\'d love for you to share a brief testimonial about how our tools helped your career.</p><p style="text-align:center;margin:24px 0;"><a href="https://g.page/r/CZS08nYUvP4qEAE/review" style="display:inline-block;background:#C9A961;color:#0a1628;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">⭐ Leave a Google Review →</a></p><p style="font-size:14px;color:#666;">Thank you for your time!<br><strong>Share2Inspire Team</strong></p>' }
        }
    };
    const t = templates[lang]?.[tpl];
    if (t) {
        document.getElementById('nurturingSubject').value = t.subject;
        document.getElementById('nurturingBody').value = t.body;
    }
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
                try { await supaInsert('email_history', { recipient_email: email, subject, body: htmlBody, email_type: 'campaign', sent_at: new Date().toISOString(), status: 'sent' }); } catch(e) { console.warn('Campaign email sent but failed to log:', e); }
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
    if (type === 'auto') data = data.filter(e => (e.email_type || '').includes('upsell_auto') || (e.campaign_type || '').includes('upsell_auto'));
    else if (type === 'manual') data = data.filter(e => e.email_type === 'manual');
    else if (type === 'bulk') data = data.filter(e => e.email_type === 'campaign');
    if (search) data = data.filter(e => (e.recipient_email || '').toLowerCase().includes(search) || (e.subject || '').toLowerCase().includes(search));
    setText('historyCount', `${data.length} emails`);
    const totalPages = Math.ceil(data.length / PAGE_SIZE);
    historyPage = Math.min(historyPage, totalPages || 1);
    const page = data.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE);
    const tbody = document.getElementById('historyTable');
    if (!tbody) return;
    if (!page.length) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhum email encontrado</td></tr>`; return; }
    tbody.innerHTML = page.map(e => {
        const date = new Date(e.sent_at).toLocaleDateString('pt-PT') + ' ' + new Date(e.sent_at).toLocaleTimeString('pt-PT', {hour:'2-digit',minute:'2-digit'});
        const typeMap = { manual: 'Manual', campaign: 'Campanha', upsell_auto_2h: 'Auto 2h', upsell_auto_7d: 'Auto 7d', welcome: 'Boas-vindas' };
        const emailType = e.email_type || e.campaign_type || '';
        const typeBadge = `<span class="badge badge-${emailType === 'campaign' ? 'purple' : emailType === 'manual' ? 'teal' : 'secondary'}">${typeMap[emailType] || emailType}</span>`;
        return `<tr>
            <td style="font-size:12px;color:var(--text-muted);">${date}</td>
            <td style="font-size:12px;">${e.recipient_email || '—'}</td>
            <td style="font-size:12px;">${e.subject || '—'}</td>
            <td>${typeBadge}</td>
            <td><span class="badge badge-success">Enviado</span></td>
        </tr>`;
    }).join('');
}

let currentMsgId = null;

function escapeHtml(str = '') {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function detectContactLangLocal(m = {}) {
    const explicit = String(m.lang || m.language || '').toLowerCase();
    if (['pt', 'pt-pt', 'pt-br', 'pt_br'].includes(explicit)) return 'pt';
    if (['en', 'en-gb', 'en-us'].includes(explicit)) return 'en';
    if (['es', 'es-es', 'es-mx'].includes(explicit)) return 'es';
    const text = `${m.subject || ''} ${m.message || ''}`.toLowerCase();
    const ptHints = ['olá', 'obrigado', 'currículo', 'carreira', 'ajuda'];
    const enHints = ['hello', 'thank you', 'career', 'resume', 'support'];
    const esHints = ['hola', 'gracias', 'currículum', 'ayuda', 'perfil'];
    const score = hints => hints.reduce((sum, hint) => sum + (text.includes(hint) ? 1 : 0), 0);
    const pt = score(ptHints), en = score(enHints), es = score(esHints);
    if (es > pt && es > en) return 'es';
    if (en > pt && en > es) return 'en';
    return 'pt';
}

function buildVoucherReplySnippet(code, product, validUntil, lang = 'pt') {
    const expiryText = validUntil ? new Date(validUntil).toLocaleDateString(lang === 'en' ? 'en-GB' : lang === 'es' ? 'es-ES' : 'pt-PT') : null;
    if (lang === 'en') {
        return `\n\nAs a goodwill gesture, we created a support voucher for you:\nCode: ${code}\nProduct: ${product || 'all'}${expiryText ? `\nValid until: ${expiryText}` : ''}\n\nYou can use it directly on Share2Inspire when applicable.`;
    }
    if (lang === 'es') {
        return `\n\nComo gesto comercial, hemos creado un voucher de soporte para ti:\nCódigo: ${code}\nProducto: ${product || 'all'}${expiryText ? `\nVálido hasta: ${expiryText}` : ''}\n\nPuedes utilizarlo directamente en Share2Inspire cuando corresponda.`;
    }
    return `\n\nComo gesto comercial, criámos um voucher de suporte para ti:\nCódigo: ${code}\nProduto: ${product || 'all'}${expiryText ? `\nVálido até: ${expiryText}` : ''}\n\nPodes utilizá-lo diretamente no Share2Inspire quando aplicável.`;
}

function renderSupportSuggestions(suggestions = []) {
    const wrap = document.getElementById('msgSuggestionsWrap');
    const list = document.getElementById('msgReplySuggestions');
    if (!wrap || !list) return;
    if (!suggestions.length) {
        wrap.style.display = 'none';
        list.innerHTML = '';
        return;
    }
    wrap.style.display = 'block';
    list.innerHTML = suggestions.map((item, idx) => `
        <div style="border:1px solid var(--border);border-radius:10px;padding:14px;background:var(--card);">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:8px;">
                <div>
                    <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Sugestão ${idx + 1}</div>
                    <div style="font-size:13px;font-weight:700;color:var(--text);margin-top:4px;">${escapeHtml(item.subject || 'Sem assunto')}</div>
                </div>
                <button class="btn btn-outline" style="font-size:11px;padding:6px 10px;" onclick="useSuggestedReply(${idx})">Usar</button>
            </div>
            <div style="font-size:13px;line-height:1.7;color:var(--text);white-space:pre-wrap;">${escapeHtml(item.body || '')}</div>
        </div>
    `).join('');
    window.__msgReplySuggestions = suggestions;
}

function useSuggestedReply(index) {
    const suggestions = window.__msgReplySuggestions || [];
    const selected = suggestions[index];
    if (!selected) return;
    const textarea = document.getElementById('msgReplyText');
    if (textarea) textarea.value = selected.body || '';
    showToast('Sugestão carregada para edição', 'success');
}

function setSupportButtonsBusy(isBusy, actionLabel = '') {
    const buttons = [
        document.getElementById('msgSuggestBtn'),
        document.getElementById('msgVoucherBtn'),
        document.getElementById('msgSendBtn')
    ].filter(Boolean);
    buttons.forEach(btn => { btn.disabled = isBusy; });
    if (isBusy && actionLabel) {
        const meta = document.getElementById('msgReplyMeta');
        if (meta) meta.textContent = actionLabel;
    }
}

async function callSupportReply(payload) {
    const res = await fetch(SUPPORT_REPLY_FN_URL, {
        method: 'POST',
        headers: getSupabaseHeaders(false, { 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.success === false) {
        throw new Error(data?.error || `Falha na edge function (${res.status})`);
    }
    return data;
}

function renderContactMessages() {
    let data = [...allContacts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setText('messagesCount', `${data.length} mensagens`);
    const tbody = document.getElementById('contactsTable');
    if (!tbody) return;
    if (!data.length) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhuma mensagem de contacto</td></tr>`; return; }
    tbody.innerHTML = data.map(m => {
        const date = new Date(m.created_at).toLocaleDateString('pt-PT') + ' ' + new Date(m.created_at).toLocaleTimeString('pt-PT', {hour:'2-digit',minute:'2-digit'});
        const responded = m.responded_at || m.status === 'responded';
        const highlight = responded
            ? 'background:rgba(16,185,129,0.07);'
            : (m.admin_notes ? 'background:rgba(201,169,97,0.08);' : '');
        return `<tr onclick="openMsgModal(${m.id})" style="cursor:pointer;${highlight}">
            <td style="font-size:12px;color:var(--text-muted);">${date}</td>
            <td style="font-size:12px;">${m.name || '\u2014'}${responded ? '<div style="font-size:10px;color:var(--green);margin-top:3px;font-weight:600;">Respondida</div>' : ''}</td>
            <td style="font-size:12px;">${m.email || '\u2014'}</td>
            <td style="font-size:12px;">${m.subject || '\u2014'}</td>
            <td style="font-size:12px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.message || '\u2014'}</td>
        </tr>`;
    }).join('');
}

function openMsgModal(id) {
    const m = allContacts.find(c => c.id === id);
    if (!m) return;
    currentMsgId = id;
    const date = new Date(m.created_at).toLocaleDateString('pt-PT') + ' ' + new Date(m.created_at).toLocaleTimeString('pt-PT', {hour:'2-digit',minute:'2-digit'});
    const lang = detectContactLangLocal(m);
    document.getElementById('msgDetailName').textContent = m.name || '\u2014';
    document.getElementById('msgDetailEmail').textContent = m.email || '\u2014';
    document.getElementById('msgDetailSubject').textContent = m.subject || '\u2014';
    document.getElementById('msgDetailDate').textContent = date;
    document.getElementById('msgDetailBody').textContent = m.message || '\u2014';
    document.getElementById('msgDetailNotes').value = m.admin_notes || '';
    document.getElementById('msgReplyText').value = m.reply_text || '';
    document.getElementById('msgReplyMeta').textContent = `Idioma detetado: ${lang.toUpperCase()}`;
    document.getElementById('msgVoucherBox').style.display = 'none';
    document.getElementById('msgVoucherResult').innerHTML = '';
    renderSupportSuggestions([]);
    document.getElementById('msgModalOverlay').style.display = 'flex';
}

function closeMsgModal() {
    document.getElementById('msgModalOverlay').style.display = 'none';
    currentMsgId = null;
    window.__msgReplySuggestions = [];
}

async function saveMsgNotes() {
    if (!currentMsgId) return;
    const notes = document.getElementById('msgDetailNotes').value.trim();
    const ok = await supaUpdate('contact_messages', currentMsgId, { admin_notes: notes });
    if (ok) {
        const m = allContacts.find(c => c.id === currentMsgId);
        if (m) m.admin_notes = notes;
        showToast('Notas guardadas', 'success');
        renderContactMessages();
    } else { showToast('Erro ao guardar notas', 'danger'); }
}

async function deleteMsgFromModal() {
    if (!currentMsgId) return;
    if (!confirm('Eliminar esta mensagem permanentemente?')) return;
    const ok = await supaDelete('contact_messages', currentMsgId);
    if (ok) {
        allContacts = allContacts.filter(c => c.id !== currentMsgId);
        closeMsgModal();
        renderContactMessages();
        showToast('Mensagem eliminada', 'success');
    } else { showToast('Erro ao eliminar', 'danger'); }
}

async function suggestMsgReply() {
    if (!currentMsgId) return;
    try {
        setSupportButtonsBusy(true, 'A gerar sugestões...');
        const data = await callSupportReply({ message_id: currentMsgId, action: 'suggest_reply' });
        renderSupportSuggestions(data.suggestions || []);
        const meta = document.getElementById('msgReplyMeta');
        if (meta) meta.textContent = `Idioma: ${(data.language || 'pt').toUpperCase()} · ${data.suggestions?.length || 0} sugestão(ões)`;
        showToast('Sugestões geradas com sucesso', 'success');
    } catch (e) {
        showToast('Erro ao sugerir resposta: ' + (e.message || e), 'danger');
    } finally {
        setSupportButtonsBusy(false);
    }
}

async function generateMsgVoucher() {
    if (!currentMsgId) return;
    const msg = allContacts.find(c => c.id === currentMsgId);
    const lang = detectContactLangLocal(msg || {});
    const discountInput = prompt('Desconto do voucher em %', '20');
    if (discountInput === null) return;
    const productInput = prompt('Produto aplicável (all, cv_analyser, career_path, career_intelligence, linkedin_roaster, bundle, student_pack)', 'all');
    if (productInput === null) return;
    const validityInput = prompt('Validade em dias ou data YYYY-MM-DD', '30');
    if (validityInput === null) return;
    const discountPercent = Number(discountInput);
    if (!Number.isFinite(discountPercent) || discountPercent <= 0) {
        showToast('Desconto inválido', 'danger');
        return;
    }
    const payload = { message_id: currentMsgId, action: 'generate_voucher', discount_percent: discountPercent, applicable_product: productInput.trim() || 'all' };
    if (/^\d{4}-\d{2}-\d{2}$/.test(validityInput.trim())) payload.valid_until = validityInput.trim();
    else payload.validity_days = Number(validityInput) || 30;
    try {
        setSupportButtonsBusy(true, 'A gerar voucher...');
        const data = await callSupportReply(payload);
        const box = document.getElementById('msgVoucherBox');
        const result = document.getElementById('msgVoucherResult');
        if (box && result) {
            box.style.display = 'block';
            const expiry = data.valid_until ? new Date(data.valid_until).toLocaleDateString(lang === 'en' ? 'en-GB' : lang === 'es' ? 'es-ES' : 'pt-PT') : '—';
            result.innerHTML = `<strong style="font-size:18px;color:var(--gold);letter-spacing:0.08em;">${escapeHtml(data.voucher_code || '')}</strong><br><span style="color:var(--text-muted);">Produto: ${escapeHtml(data.applicable_product || productInput)} · Desconto: ${escapeHtml(String(data.discount_percent || discountPercent))}% · Válido até: ${escapeHtml(expiry)}</span>`;
        }
        const textarea = document.getElementById('msgReplyText');
        if (textarea) {
            const current = textarea.value.trim();
            const snippet = buildVoucherReplySnippet(data.voucher_code, data.applicable_product || productInput, data.valid_until, lang);
            textarea.value = current ? `${current}${snippet}` : snippet.trim();
        }
        showToast('Voucher gerado com sucesso', 'success');
    } catch (e) {
        showToast('Erro ao gerar voucher: ' + (e.message || e), 'danger');
    } finally {
        setSupportButtonsBusy(false);
    }
}

async function sendMsgReply() {
    if (!currentMsgId) return;
    const textarea = document.getElementById('msgReplyText');
    const msg = allContacts.find(c => c.id === currentMsgId);
    const replyText = textarea?.value?.trim() || '';
    if (!replyText && !confirm('O texto da resposta está vazio. Queres que a resposta final seja gerada automaticamente?')) return;
    try {
        setSupportButtonsBusy(true, 'A enviar resposta...');
        const voucherCodeMatch = replyText.match(/S2I-[A-Z0-9]{6,10}/);
        const data = await callSupportReply({
            message_id: currentMsgId,
            action: 'send_reply',
            reply_text: replyText || undefined,
            voucher_code: voucherCodeMatch ? voucherCodeMatch[0] : undefined
        });
        if (textarea) textarea.value = data.reply_text || replyText;
        if (msg) {
            msg.reply_text = data.reply_text || replyText;
            msg.responded_at = new Date().toISOString();
            msg.status = 'responded';
        }
        renderContactMessages();
        showToast('Resposta enviada com sucesso', 'success');
    } catch (e) {
        showToast('Erro ao enviar resposta: ' + (e.message || e), 'danger');
    } finally {
        setSupportButtonsBusy(false);
    }
}

function replyToMsg() {
    const m = allContacts.find(c => c.id === currentMsgId);
    if (!m) return;
    closeMsgModal();
    openEmailModal(m.email, m.name, 'lead');
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

    renderBarChart('chartTopRoles', topRoles, 'Cargos', '#C9A961');
    renderBarChart('chartTopSkills', topSkills, 'Competências', '#3B82F6');
    renderBarChart('chartKeywordGaps', topGaps, 'Gaps', '#EF4444');
    renderBarChart('chartSeniority', senEntries, 'Senioridade', '#7C3AED');

    // Update KPIs
    const uniqueRoles = Object.keys(roleCounts).length;
    const withJob = data.filter(j => j.has_job_posting || j.adzuna_results_count > 0).length;
    const noJob = data.length - withJob;
    setText('kpiJobTotal', data.length);
    setText('kpiJobWithJob', withJob);
    setText('kpiJobNoJob', noJob);
    setText('kpiJobUniqueRoles', uniqueRoles);

    // Update count
    setText('jobSearchCount', `${data.length} pesquisas`);

    // Populate seniority filter options
    const senFilter = document.getElementById('filterJobSeniority');
    if (senFilter && senFilter.options.length <= 1) {
        Object.keys(senCounts).sort().forEach(s => {
            const opt = document.createElement('option');
            opt.value = s; opt.textContent = s;
            senFilter.appendChild(opt);
        });
    }

    // Render table body
    const tbody = document.getElementById('jobSearchTable');
    if (tbody) {
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">Sem dados de pesquisa de emprego.</td></tr>';
        } else {
            tbody.innerHTML = data.slice(0, 200).map(j => {
                const date = j.created_at ? new Date(j.created_at).toLocaleDateString('pt-PT') : '--';
                const name = j.user_name || j.user_email || '--';
                const role = j.desired_role || '--';
                const sen = j.seniority_level || '--';
                const skills = (j.top_skills || []).slice(0, 3).map(s => `<span class="badge badge-blue">${s}</span>`).join(' ') || '--';
                const hasJob = (j.has_job_posting || j.adzuna_results_count > 0) ? '<span class="badge badge-green">Sim</span>' : '<span class="badge badge-muted">Não</span>';
                const ats = j.ats_score != null ? j.ats_score : '--';
                return `<tr><td>${date}</td><td>${name}</td><td>${role}</td><td>${sen}</td><td>${skills}</td><td>${hasJob}</td><td>${ats}</td></tr>`;
            }).join('');
        }
    }

    // Cross-reference with Career Energy
    const crossEl = document.getElementById('marketCrossRef');
    if (crossEl) {
        if (allCareerEnergy.length > 0 && data.length > 0) {
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
        } else if (data.length > 0) {
            crossEl.innerHTML = `<div style="padding:12px;background:var(--teal-bg);border-radius:8px;border-left:3px solid var(--teal);font-size:13px;"><strong>${data.length}</strong> pesquisas de emprego registadas. <strong>${uniqueRoles}</strong> cargos únicos. Top cargo: <span class="badge badge-teal">${topRoles[0] ? topRoles[0][0] : 'N/A'}</span></div>`;
        } else {
            crossEl.innerHTML = `<div style="padding:12px;background:#f5f5f5;border-radius:8px;font-size:13px;color:var(--text-muted);">Sem dados suficientes para cruzamento.</div>`;
        }
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
    if (!data.length) { tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">Sem dados</td></tr>`; return; }
    tbody.innerHTML = data.slice(0, 50).map(ce => {
        const date = new Date(ce.created_at).toLocaleDateString('pt-PT');
        const score = ce.total_score || ce.score || ce.energy_score || 0;
        const scoreColor = score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--orange)' : 'var(--red)';
        const happiness = ce.country_happiness_score ? parseFloat(ce.country_happiness_score).toFixed(1) : '—';
        const diff = ce.country_diff !== null && ce.country_diff !== undefined ? (ce.country_diff >= 0 ? '+' : '') + parseFloat(ce.country_diff).toFixed(1) : '—';
        const diffColor = parseFloat(ce.country_diff) >= 0 ? 'var(--green)' : 'var(--red)';
        return `<tr>
            <td style="font-size:12px;color:var(--text-muted);">${date}</td>
            <td style="font-size:12px;">${ce.name || '—'}</td>
            <td style="font-size:12px;">${ce.role || ce.current_role || '—'}</td>
            <td style="font-size:12px;">${ce.country_name || ce.country || '—'}</td>
            <td><span style="font-weight:600;color:${scoreColor};">${score}</span></td>
            <td style="font-size:12px;">${ce.level_label || ce.energy_level || '—'}</td>
            <td style="font-size:12px;">${happiness}</td>
            <td style="font-size:12px;font-weight:600;color:${diffColor};">${diff}</td>
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
    let data = [...allEbookDownloads].sort((a, b) => new Date(b.subscribed_at || b.created_at) - new Date(a.subscribed_at || a.created_at));
    const period = document.getElementById('filterEbookPeriod')?.value || 'all';
    const search = (document.getElementById('filterEbookSearch')?.value || '').toLowerCase();
    if (period !== 'all') data = filterByPeriod(data, parseInt(period));
    if (search) data = data.filter(e => (e.email || '').toLowerCase().includes(search) || (e.name || '').toLowerCase().includes(search));
    setText('ebookCount', `${data.length} downloads`);
    const tbody = document.getElementById('ebookTable');
    if (!tbody) return;
    if (!data.length) { tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text-muted);">Sem downloads</td></tr>`; return; }
    tbody.innerHTML = data.slice(0, 50).map(e => {
        const date = new Date(e.subscribed_at || e.created_at).toLocaleDateString('pt-PT');
        return `<tr><td style="font-size:12px;color:var(--text-muted);">${date}</td><td style="font-size:12px;">${e.name || '—'}</td><td style="font-size:12px;">${e.email || '—'}</td><td style="font-size:12px;">${e.source || '—'}</td></tr>`;
    }).join('');
}

function exportEbookCSV() {
    const rows = [['Data','Nome','Email','Fonte']];
    allEbookDownloads.forEach(e => rows.push([(e.subscribed_at || e.created_at)?.slice(0,10), e.name||'', e.email||'', e.source||'']));
    downloadCSV(rows, 'ebook_downloads.csv');
}

// ═══════════════════════════════════════════════════════════════
//  SYSTEM: HEALTH DASHBOARD (Redesigned)
// ═══════════════════════════════════════════════════════════════

function getServiceIcon(name) {
    if (name.includes('Frontend')) return 'fa-globe';
    if (name.includes('Supabase')) return 'fa-database';
    if (name.includes('Backend')) return 'fa-server';
    return 'fa-circle';
}

function getStatusColor(status) {
    if (status === 'healthy') return 'var(--green)';
    if (status === 'warning') return 'var(--orange)';
    return 'var(--red)';
}

function getStatusLabel(status) {
    if (status === 'healthy') return 'Operacional';
    if (status === 'warning') return 'Lento';
    if (status === 'down') return 'Indisponível';
    return status || 'Desconhecido';
}

function getRecommendation(entry) {
    if (entry.status === 'down') {
        if (entry.error_message?.includes('Bundle JS em falta')) return { text: 'PÁGINA EM BRANCO: O bundle JavaScript não existe no servidor (404). A app não renderiza. Verificar se os assets foram incluídos no último deploy.', severity: 'critical' };
        if (entry.error_message?.includes('timed out')) return { text: 'Timeout detetado. Verificar se o serviço está a correr e se não há cold starts excessivos.', severity: 'critical' };
        return { text: 'Serviço indisponível. Verificar logs do servidor e reiniciar se necessário.', severity: 'critical' };
    }
    if (entry.status === 'warning') {
        if (entry.ttfb_ms > 2000) return { text: `TTFB de ${entry.ttfb_ms}ms (>2s). Possível cold start ou sobrecarga. Considerar warm-up cron.`, severity: 'warning' };
        if (entry.ttfb_ms > 1000) return { text: `TTFB de ${entry.ttfb_ms}ms (>1s). Performance abaixo do ideal. Monitorizar tendência.`, severity: 'warning' };
        return { text: 'Performance degradada. Monitorizar nas próximas horas.', severity: 'warning' };
    }
    if (entry.http_code === 400) {
        return { text: 'HTTP 400 — esperado para edge functions sem payload. Endpoint responde.', severity: 'info' };
    }
    if (entry.ttfb_ms > 500) {
        return { text: `TTFB de ${entry.ttfb_ms}ms. Aceitável mas monitorizar.`, severity: 'info' };
    }
    return { text: 'Tudo normal. Sem ação necessária.', severity: 'ok' };
}

function renderHealthLogs() {
    if (!allHealthLogs.length) {
        document.getElementById('healthSummaryTitle').textContent = 'Sem dados de monitorização';
        document.getElementById('healthSummaryDesc').textContent = 'Nenhum check de saúde registado.';
        document.getElementById('healthSummaryIcon').textContent = '❓';
        document.getElementById('healthServiceCards').innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);grid-column:1/-1;">Sem dados disponíveis</div>';
        document.getElementById('healthTable').innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted);">Sem logs</td></tr>';
        return;
    }

    // Group by run_id, get latest run
    const byRun = {};
    allHealthLogs.forEach(h => {
        if (!byRun[h.run_id]) byRun[h.run_id] = [];
        byRun[h.run_id].push(h);
    });
    const runIds = Object.keys(byRun).sort().reverse();
    const latestRun = byRun[runIds[0]] || [];
    const latestDate = latestRun[0]?.checked_at ? new Date(latestRun[0].checked_at).toLocaleString('pt-PT') : '--';

    // Executive Summary
    const downCount = latestRun.filter(h => h.status === 'down').length;
    const warnCount = latestRun.filter(h => h.status === 'warning').length;
    const healthyCount = latestRun.filter(h => h.status === 'healthy').length;
    const totalServices = latestRun.length;

    const summaryIcon = document.getElementById('healthSummaryIcon');
    const summaryTitle = document.getElementById('healthSummaryTitle');
    const summaryDesc = document.getElementById('healthSummaryDesc');
    const summaryBox = document.getElementById('healthExecutiveSummary');

    if (downCount > 0) {
        summaryIcon.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:var(--red);"></i>';
        summaryTitle.innerHTML = `<span style="color:var(--red);">${downCount} serviço${downCount > 1 ? 's' : ''} indisponível${downCount > 1 ? 'is' : ''}</span> &mdash; ação necessária`;
        summaryBox.style.borderColor = 'var(--red)';
        summaryBox.style.background = 'rgba(239,68,68,0.05)';
    } else if (warnCount > 0) {
        summaryIcon.innerHTML = '<i class="fas fa-exclamation-circle" style="color:var(--orange);"></i>';
        summaryTitle.innerHTML = `<span style="color:var(--orange);">${warnCount} serviço${warnCount > 1 ? 's' : ''} com alertas</span> &mdash; monitorizar`;
        summaryBox.style.borderColor = 'var(--orange)';
        summaryBox.style.background = 'rgba(245,158,11,0.05)';
    } else {
        summaryIcon.innerHTML = '<i class="fas fa-check-circle" style="color:var(--green);"></i>';
        summaryTitle.innerHTML = `<span style="color:var(--green);">Todos os ${totalServices} serviços operacionais</span>`;
        summaryBox.style.borderColor = 'var(--green)';
        summaryBox.style.background = 'rgba(16,185,129,0.05)';
    }
    summaryDesc.textContent = `Último check: ${latestDate} · ${healthyCount}/${totalServices} saudáveis`;

    // Service Cards
    const cardsEl = document.getElementById('healthServiceCards');
    // Group services by category
    const frontendServices = latestRun.filter(h => h.endpoint_name.startsWith('Frontend'));
    const backendServices = latestRun.filter(h => h.endpoint_name.startsWith('Backend'));
    const edgeServices = latestRun.filter(h => !h.endpoint_name.startsWith('Frontend') && !h.endpoint_name.startsWith('Backend'));

    function buildCard(h) {
        const color = getStatusColor(h.status);
        const icon = getServiceIcon(h.endpoint_name);
        const label = getStatusLabel(h.status);
        const rec = getRecommendation(h);
        const ttfb = h.ttfb_ms != null ? `${h.ttfb_ms}ms` : 'N/A';
        const httpBadge = h.http_code ? (h.http_code >= 200 && h.http_code < 300 ? `<span style="color:var(--green);font-weight:600;">${h.http_code}</span>` : `<span style="color:var(--orange);font-weight:600;">${h.http_code}</span>`) : '<span style="color:var(--red);font-weight:600;">N/A</span>';
        const endpointHistory = allHealthLogs.filter(l => l.endpoint_name === h.endpoint_name);
        const totalChecks = endpointHistory.length;
        const healthyChecks = endpointHistory.filter(l => l.status === 'healthy').length;
        const uptime = totalChecks > 0 ? Math.round((healthyChecks / totalChecks) * 100) : 0;
        const uptimeColor = uptime >= 95 ? 'var(--green)' : uptime >= 85 ? 'var(--orange)' : 'var(--red)';
        const recIcon = rec.severity === 'critical' ? '🚨' : rec.severity === 'warning' ? '⚠️' : rec.severity === 'info' ? 'ℹ️' : '✅';
        return `<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;border-left:4px solid ${color};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <i class="fas ${icon}" style="color:${color};font-size:16px;"></i>
                    <span style="font-weight:600;font-size:13px;">${h.endpoint_name}</span>
                </div>
                <span style="background:${color};color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">${label}</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px;">
                <div style="text-align:center;"><div style="font-size:11px;color:var(--text-muted);">TTFB</div><div style="font-size:14px;font-weight:600;">${ttfb}</div></div>
                <div style="text-align:center;"><div style="font-size:11px;color:var(--text-muted);">HTTP</div><div style="font-size:14px;">${httpBadge}</div></div>
                <div style="text-align:center;"><div style="font-size:11px;color:var(--text-muted);">Uptime</div><div style="font-size:14px;font-weight:600;color:${uptimeColor};">${uptime}%</div></div>
            </div>
            <div style="background:var(--bg);border-radius:6px;padding:8px 10px;font-size:12px;color:var(--text-muted);">${recIcon} ${rec.text}</div>
            ${h.error_message ? `<div style="margin-top:6px;font-size:11px;color:var(--red);background:rgba(239,68,68,0.08);padding:4px 8px;border-radius:4px;"><i class="fas fa-bug"></i> ${h.error_message}</div>` : ''}
        </div>`;
    }

    function buildSection(title, icon, services, accentColor) {
        if (!services.length) return '';
        const downCount = services.filter(s => s.status === 'down').length;
        const healthyCount = services.filter(s => s.status === 'healthy').length;
        const statusText = downCount > 0 ? `<span style="color:var(--red);font-weight:600;">${downCount} indisponível</span>` : `<span style="color:var(--green);">${healthyCount}/${services.length} operacionais</span>`;
        return `<div style="margin-bottom:24px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid ${accentColor};">
                <div style="display:flex;align-items:center;gap:8px;">
                    <i class="fas ${icon}" style="color:${accentColor};font-size:16px;"></i>
                    <span style="font-size:14px;font-weight:700;color:var(--dark);">${title}</span>
                    <span style="font-size:12px;color:var(--text-muted);">(${services.length})</span>
                </div>
                <div style="font-size:12px;">${statusText}</div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;">
                ${services.map(buildCard).join('')}
            </div>
        </div>`;
    }

    cardsEl.innerHTML =
        buildSection('Frontend', 'fa-globe', frontendServices, 'var(--blue)') +
        buildSection('Backend', 'fa-server', backendServices, 'var(--orange)') +
        buildSection('Edge Functions', 'fa-bolt', edgeServices, 'var(--purple)');

    // Populate history filter
    const filterEl = document.getElementById('healthHistoryFilter');
    if (filterEl) {
        const names = [...new Set(allHealthLogs.map(h => h.endpoint_name))];
        const current = filterEl.value;
        filterEl.innerHTML = '<option value="all">Todos os serviços</option>' + names.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
        if (current) filterEl.value = current;
    }

    renderHealthHistory();
}

function renderHealthHistory() {
    const el = document.getElementById('healthTable');
    if (!el) return;
    const filter = document.getElementById('healthHistoryFilter')?.value || 'all';
    let data = [...allHealthLogs].sort((a, b) => new Date(b.checked_at || b.created_at) - new Date(a.checked_at || a.created_at));
    if (filter !== 'all') data = data.filter(h => h.endpoint_name === filter);
    data = data.slice(0, 60);
    if (!data.length) { el.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted);">Sem logs</td></tr>'; return; }
    el.innerHTML = data.map(h => {
        const date = new Date(h.checked_at || h.created_at).toLocaleString('pt-PT');
        const statusColor = getStatusColor(h.status);
        const statusLabel = getStatusLabel(h.status);
        const ttfb = h.ttfb_ms != null ? `${h.ttfb_ms}ms` : 'N/A';
        const ttfbColor = h.ttfb_ms > 1000 ? 'var(--red)' : h.ttfb_ms > 500 ? 'var(--orange)' : 'var(--green)';
        return `<tr>
            <td style="font-size:12px;color:var(--text-muted);">${date}</td>
            <td style="font-size:12px;">${h.endpoint_name}</td>
            <td><span style="display:inline-flex;align-items:center;gap:4px;"><span class="health-dot" style="background:${statusColor};width:8px;height:8px;border-radius:50%;display:inline-block;"></span><span style="font-size:12px;color:${statusColor};font-weight:500;">${statusLabel}</span></span></td>
            <td style="font-size:12px;font-weight:600;color:${h.ttfb_ms != null ? ttfbColor : 'var(--text-muted)'};">${ttfb}</td>
            <td style="font-size:12px;">${h.http_code || 'N/A'}</td>
            <td style="font-size:12px;color:var(--text-muted);">${h.error_message || '—'}</td>
        </tr>`;
    }).join('');
}

async function refreshHealthCheck() {
    showToast('A verificar serviços... isto pode demorar alguns segundos.', 'info');
    const endpoints = [
        { name: 'Frontend CV Analyser PT', url: 'https://www.share2inspire.pt/cv-analyser', category: 'frontend' },
        { name: 'Frontend CV Analyser EN', url: 'https://www.share2inspire.pt/en/cv-analyser', category: 'frontend' },
        { name: 'Frontend Career Path PT', url: 'https://www.share2inspire.pt/career-path', category: 'frontend' },
        { name: 'Frontend Career Path EN', url: 'https://www.share2inspire.pt/en/career-path', category: 'frontend' },
        { name: 'Frontend Career Intelligence PT', url: 'https://www.share2inspire.pt/career-intelligence', category: 'frontend' },
        { name: 'Frontend Career Intelligence EN', url: 'https://www.share2inspire.pt/en/career-intelligence', category: 'frontend' },
        { name: 'Frontend LinkedIn Roaster PT', url: 'https://www.share2inspire.pt/linkedin-roaster', category: 'frontend' },
        { name: 'Frontend LinkedIn Roaster EN', url: 'https://www.share2inspire.pt/en/linkedin-roaster', category: 'frontend' },
        { name: 'Frontend Bundle PT', url: 'https://www.share2inspire.pt/bundle', category: 'frontend' },
        { name: 'Frontend Bundle EN', url: 'https://www.share2inspire.pt/en/bundle', category: 'frontend' },
        { name: 'Backend Root', url: 'https://share2inspire-beckend.lm.r.appspot.com/', category: 'backend' },
        { name: 'Backend API Health', url: 'https://share2inspire-beckend.lm.r.appspot.com/api/health', category: 'backend' },
        { name: 'Supabase Edge Function', url: 'https://cvlumvgrbuolrnwrtrgz.supabase.co/rest/v1/', category: 'edge_function' }
    ];
    const runId = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
    const results = [];
    for (const ep of endpoints) {
        const start = Date.now();
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);
            const res = await fetch(ep.url, { method: 'GET', mode: ep.category === 'frontend' ? 'cors' : 'no-cors', signal: controller.signal });
            clearTimeout(timeout);
            const elapsed = Date.now() - start;
            const httpCode = res.type === 'opaque' ? 200 : res.status;
            let status = elapsed > 2000 ? 'warning' : 'healthy';
            let errorMsg = null;

            // Deep check for frontend React apps: verify JS bundle exists
            if (ep.category === 'frontend' && res.type !== 'opaque') {
                try {
                    const html = await res.text();
                    const scriptMatch = html.match(/src="([^"]*assets\/index-[^"]+\.js)"/);
                    if (scriptMatch) {
                        const bundlePath = scriptMatch[1];
                        const bundleUrl = bundlePath.startsWith('http') ? bundlePath : new URL(bundlePath, ep.url).href;
                        const bundleRes = await fetch(bundleUrl, { method: 'HEAD' });
                        if (bundleRes.status === 404) {
                            status = 'down';
                            errorMsg = `Bundle JS em falta (404): ${bundlePath}`;
                        }
                    }
                    // Also check if root div has content (basic render check)
                    if (!errorMsg && html.includes('id="root"') && !html.includes('<div id="root">')) {
                        // HTML loads but root is empty - this is expected for SPA, bundle check is more reliable
                    }
                } catch (deepErr) {
                    // Deep check failed, keep original status
                    console.warn('Deep check failed for', ep.name, deepErr.message);
                }
            }

            results.push({ run_id: runId, endpoint_name: ep.name, endpoint_url: ep.url, category: ep.category, ttfb_ms: elapsed, total_ms: Date.now() - start, http_code: httpCode, status, error_message: errorMsg, checked_at: new Date().toISOString() });
        } catch (err) {
            const elapsed = Date.now() - start;
            results.push({ run_id: runId, endpoint_name: ep.name, endpoint_url: ep.url, category: ep.category, ttfb_ms: elapsed > 14000 ? null : elapsed, total_ms: elapsed > 14000 ? null : elapsed, http_code: null, status: 'down', error_message: err.message || 'Request failed', checked_at: new Date().toISOString() });
        }
    }
    // Save to Supabase
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/backend_health_log`, {
            method: 'POST',
            headers: getSupabaseHeaders(false, {
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }),
            body: JSON.stringify(results)
        });
    } catch (e) { console.error('Erro ao guardar health check:', e); }
    // Refresh data
    allHealthLogs = [...results, ...allHealthLogs];
    renderHealthLogs();
    const downCount = results.filter(r => r.status === 'down').length;
    if (downCount > 0) showToast(`Check concluído: ${downCount} serviço(s) com problemas!`, 'danger');
    else showToast('Check concluído: todos os serviços responderam.', 'success');
}

// ═══════════════════════════════════════════════════════════════
//  AFFILIATES / PARTNERSHIPS
// ═══════════════════════════════════════════════════════════════
function normalizeAffiliateProductValue(value) {
    const normalized = String(value || '').trim().toLowerCase();
    const map = {
        'cv_analysis': 'cv-analyser',
        'cv-analyser': 'cv-analyser',
        'career_path': 'career-path',
        'career-path': 'career-path',
        'career_intelligence': 'career-intelligence',
        'career-intelligence': 'career-intelligence',
        'student_pack': 'student-pack',
        'student-pack': 'student-pack',
        'linkedin_roaster': 'linkedin-roaster',
        'linkedin-roaster': 'linkedin-roaster'
    };
    return map[normalized] || normalized;
}

function normalizeAffiliateProducts(rawValue) {
    return String(rawValue || 'cv-analyser')
        .split(',')
        .map(normalizeAffiliateProductValue)
        .filter(Boolean);
}

function normalizeCouponProductValue(value) {
    const normalized = String(value || '').trim().toLowerCase();
    const map = {
        'all': 'all',
        'cv': 'cv_analysis',
        'cv_analysis': 'cv_analysis',
        'cv-analyser': 'cv_analysis',
        'career_path': 'career_path',
        'career-path': 'career_path',
        'career_intelligence_pro': 'career_intelligence_pro',
        'career_intelligence_full': 'career_intelligence_full',
        'career_intelligence': 'career_intelligence',
        'career-intelligence': 'career_intelligence',
        'student_pack': 'student_pack',
        'student-pack': 'student_pack',
        'student': 'student_pack',
        'bundle': 'bundle',
        'linkedin_roaster': 'linkedin_roaster',
        'linkedin-roaster': 'linkedin_roaster',
        'subscription': 'subscription',
        'salary_reality_check': 'salary_reality_check_premium',
        'salary_reality_check_premium': 'salary_reality_check_premium',
        'salary-check': 'salary_reality_check_premium'
    };
    return map[normalized] || normalized;
}

function normalizeCouponProducts(rawProducts) {
    const source = Array.isArray(rawProducts)
        ? rawProducts
        : String(rawProducts || '')
            .split(',')
            .map(v => v.trim())
            .filter(Boolean);
    const expanded = [];
    source.forEach(product => {
        const normalized = normalizeCouponProductValue(product);
        if (normalized === 'career_intelligence') {
            expanded.push('career_intelligence_pro', 'career_intelligence_full');
            return;
        }
        expanded.push(normalized);
    });
    return [...new Set(expanded.filter(Boolean))];
}

function renderAffiliates() {
    const tbody = document.getElementById('affTable');
    if (!tbody) return;
    const active = allAffiliates.filter(a => a.active);
    setText('affKpiTotal', allAffiliates.filter(a => !a.code?.startsWith('__')).length);
    setText('affKpiClicks', allAffClicks.filter(c => !c.affiliate_code?.startsWith('__')).length);
    setText('affKpiSales', allAffConversions.filter(c => !c.affiliate_code?.startsWith('__')).length);
    const totalRev = allAffConversions.filter(c => !c.affiliate_code?.startsWith('__')).reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
    setText('affKpiRevenue', totalRev.toFixed(0) + '€');
    setText('affKpiActive', active.length);

    const filteredAffiliates = allAffiliates.filter(a => !a.code?.startsWith('__') && !a.name?.includes('probe'));
    if (!filteredAffiliates.length) { tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhum afiliado</td></tr>'; return; }
    const productLabels = {'cv-analyser':'CV','career-path':'CP','career-intelligence':'CI','student-pack':'SP','linkedin-roaster':'LR'};
    tbody.innerHTML = filteredAffiliates.map(a => {
        const clicks = allAffClicks.filter(c => c.affiliate_code === a.code && !c.affiliate_code?.startsWith('__')).length;
        const sales = allAffConversions.filter(c => c.affiliate_code === a.code).length;
        const rev = allAffConversions.filter(c => c.affiliate_code === a.code).reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
        const normalizedProducts = normalizeAffiliateProducts(a.product);
        const products = normalizedProducts.map(p => productLabels[p] || p).join(', ');
        const conversion = clicks > 0 ? ((sales / clicks) * 100).toFixed(1) + '%' : '—';
        const createdDate = a.created_at ? new Date(a.created_at).toLocaleDateString('pt-PT') : '—';
        const linkCount = normalizedProducts.length;
        return `<tr>
            <td style="font-weight:500;">${a.name}</td>
            <td style="font-size:12px;">${products}</td>
            <td><code style="font-size:11px;">${a.code}</code></td>
            <td style="font-size:12px;">${linkCount} <i class="fas fa-link" style="font-size:10px;color:var(--text-muted);cursor:pointer;" onclick="copyAffLink('${a.code}','${a.product||'cv-analyser'}')" title="Copiar"></i></td>
            <td style="font-size:12px;">${clicks}</td>
            <td style="font-size:12px;">${sales}</td>
            <td style="font-size:12px;font-weight:600;color:var(--gold);">${rev.toFixed(2)}€</td>
            <td style="font-size:12px;">${conversion}</td>
            <td>${a.active ? '<span class="badge badge-success">Ativo</span>' : '<span class="badge" style="background:var(--red);color:#fff;">Inativo</span>'}</td>
            <td style="font-size:12px;">${parseFloat(a.commission_pct || 0).toFixed(1)}%</td>
            <td style="font-size:11px;color:var(--text-muted);">${createdDate}</td>
            <td><div style="display:flex;gap:4px;">
                <button class="btn-icon" onclick="editAffiliate('${a.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn-icon" onclick="toggleAffiliate('${a.id}',${a.active})" title="${a.active?'Desativar':'Ativar'}"><i class="fas fa-${a.active?'pause':'play'}"></i></button>
                <button class="btn-icon" onclick="copyAffLink('${a.code}','${a.product||'cv-analyser'}')" title="Copiar Link"><i class="fas fa-copy"></i></button>
            </div></td>
        </tr>`;
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
    const products = normalizeAffiliateProducts(aff.product);
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
    const productLabels = {'cv-analyser':'CV Analyser','career-path':'Career Path','career-intelligence':'Career Intelligence','student-pack':'Student Pack','linkedin-roaster':'LinkedIn Roaster'};
    const slug = code || '...';
    el.innerHTML = products.map(p => {
        const ptPath = p === 'student-pack' ? 'estudante' : p;
        const enPath = p === 'student-pack' ? 'student-pack' : p;
        const links = [`share2inspire.pt/${ptPath}?ref=${slug}`];
        if (p !== 'linkedin-roaster') links.push(`share2inspire.pt/en/${enPath}?ref=${slug}`);
        return `<div style="margin-bottom:4px;"><strong style="color:var(--dark);">${productLabels[p]}:</strong><br>${links.map(l => `<span style="color:var(--blue);">${l}</span>`).join(' · ')}</div>`;
    }).join('');
}


function renderAffClicks() {
    const filterCode = document.getElementById('filterAffClickCode')?.value || 'all';
    // Filter out probe/test entries (e.g. __shannon_probe__)
    let clicks = [...allAffClicks]
        .filter(c => !c.affiliate_code?.startsWith('__') && !c.affiliate_code?.includes('probe'))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (filterCode !== 'all') clicks = clicks.filter(c => c.affiliate_code === filterCode);
    const tbody = document.getElementById('affClicksTable');
    if (!tbody) return;
    if (!clicks.length) { tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--text-muted);">Sem cliques</td></tr>'; return; }
    tbody.innerHTML = clicks.slice(0, 50).map(c => {
        const date = new Date(c.created_at).toLocaleDateString('pt-PT') + ' ' + new Date(c.created_at).toLocaleTimeString('pt-PT', {hour:'2-digit',minute:'2-digit'});
        return `<tr><td style="font-size:12px;color:var(--text-muted);">${date}</td><td><code style="font-size:11px;">${c.affiliate_code||'—'}</code></td><td style="font-size:12px;">${c.landing_page||'—'}</td><td style="font-size:12px;">${c.country||'—'}</td><td style="font-size:12px;">${c.city||'—'}</td><td style="font-size:12px;">${c.device_type||'—'}</td><td style="font-size:12px;">${c.browser||'—'}</td><td style="font-size:12px;">${c.os||'—'}</td><td style="font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${c.referrer||'—'}</td></tr>`;
    }).join('');
    populateAffClickFilter();
}

function populateAffClickFilter() {
    const select = document.getElementById('filterAffClickCode');
    if (!select) return;
    const codes = [...new Set(allAffClicks.filter(c => !c.affiliate_code?.startsWith('__')).map(c => c.affiliate_code))];
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
        return `<tr><td style="font-size:12px;color:var(--text-muted);">${date}</td><td><code style="font-size:11px;">${c.affiliate_code||'—'}</code></td><td>${getProductBadge(c)}</td><td style="font-weight:600;color:var(--gold);">${parseFloat(c.amount||0).toFixed(2)}€</td><td style="font-size:12px;">${c.currency||'EUR'}</td><td style="font-size:12px;">${c.payment_method||'—'}</td><td style="font-size:12px;">${c.customer_email||'—'}</td><td style="font-size:12px;"><code style="font-size:10px;">${c.transaction_id||'—'}</code></td></tr>`;
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
    } catch (e) {
        console.error('Erro ao guardar afiliado:', e);
        showToast('Erro ao guardar: ' + (e.message || 'código duplicado?'), 'danger');
    }
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
    const products = normalizeAffiliateProducts(product);
    const allLinks = [];
    products.forEach(p => {
        const ptPath = p === 'student-pack' ? 'estudante' : p;
        const enPath = p === 'student-pack' ? 'student-pack' : p;
        allLinks.push(`${base}/${ptPath}?ref=${code}`);
        if (p !== 'linkedin-roaster') allLinks.push(`${base}/en/${enPath}?ref=${code}`);
    });
    navigator.clipboard.writeText(allLinks.join('\n')).then(() => showToast(`${allLinks.length} link(s) copiado(s)`, 'success')).catch(() => prompt('Copia:', allLinks.join('\n')));
}

function exportAffClicksCSV() {
    const rows = [['Data','Afiliado','Página','Dispositivo','Browser','Referrer']];
    allAffClicks.filter(c => !c.affiliate_code?.startsWith('__')).forEach(c => rows.push([c.created_at, c.affiliate_code||'', c.landing_page||'', c.device_type||'', c.browser||'', c.referrer||'']));
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
    // Count real uses: max between current_uses and transaction_id matches in cv_analysis
    const totalUses = allCoupons.reduce((s, c) => {
        const dbUses = c.current_uses || 0;
        const codeUpper = (c.code || '').toUpperCase();
        const txUses = allAnalyses.filter(a => (a.transaction_id || '').toUpperCase().includes('COUPON-' + codeUpper)).length
                     + allVouchers.filter(v => (v.payment_method || '').toUpperCase().includes(codeUpper)).length;
        return s + Math.max(dbUses, txUses);
    }, 0);
    setText('couponKpiActive', active.length);
    setText('couponKpiUses', totalUses);

    const productLabels = {
        'cv_analysis': '<span class="badge" style="background:var(--blue);color:#fff;font-size:10px;">CV</span>',
        'career_path': '<span class="badge" style="background:var(--gold);color:#fff;font-size:10px;">Career</span>',
        'career_intelligence_pro': '<span class="badge" style="background:#7C3AED;color:#fff;font-size:10px;">CI PRO</span>',
        'career_intelligence_full': '<span class="badge" style="background:#5B21B6;color:#fff;font-size:10px;">CI Full</span>',
        'student_pack': '<span class="badge" style="background:#059669;color:#fff;font-size:10px;">Student Pack</span>',
        'bundle': '<span class="badge" style="background:var(--purple);color:#fff;font-size:10px;">Bundle</span>',
        'linkedin_roaster': '<span class="badge" style="background:#0077B5;color:#fff;font-size:10px;">Roaster</span>'
    };
    const tbody = document.getElementById('couponsTable');
    if (!tbody) return;
    if (!filtered.length) { tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhum cupão encontrado</td></tr>'; return; }
    tbody.innerHTML = filtered.map(c => {
        const products = (c.applicable_products || []).map(p => productLabels[p] || esc(p)).join(' ');
        const dbUses = c.current_uses || 0;
        const codeUpper = (c.code || '').toUpperCase();
        const txUses = allAnalyses.filter(a => (a.transaction_id || '').toUpperCase().includes('COUPON-' + codeUpper)).length
                     + allVouchers.filter(v => (v.payment_method || '').toUpperCase().includes(codeUpper)).length;
        const uses = Math.max(dbUses, txUses);
        const maxUses = c.max_uses ? c.max_uses : '∞';
        const validUntil = c.valid_until ? new Date(c.valid_until).toLocaleDateString('pt-PT') : 'Sem limite';
        const isExpired = c.valid_until && new Date(c.valid_until) < new Date();
        const statusBadge = c.is_active && !isExpired ? '<span class="badge badge-success">Ativo</span>' : `<span class="badge" style="background:var(--red);color:#fff;">${isExpired ? 'Expirado' : 'Inativo'}</span>`;
        return `<tr>
            <td><code style="font-size:12px;font-weight:600;">${esc(c.code)}</code></td>
            <td style="font-size:12px;">${esc(c.partner_name) || '—'}</td>
            <td><span style="font-weight:600;color:var(--green);">${c.discount_percent}%</span></td>
            <td>${products}</td>
            <td>${uses}</td>
            <td>${maxUses}</td>
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
    const products = normalizeCouponProducts(c.applicable_products);
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
    const products = normalizeCouponProducts([...document.querySelectorAll('.coupon-product-cb:checked')].map(cb => cb.value));
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
    } catch (e) {
        console.error('Erro ao guardar cupão:', e);
        showToast('Erro ao guardar cupão: ' + (e.message || 'erro desconhecido'), 'danger');
    }
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
        const subs = allSubscriptions.filter(s => s.user_id === au.id || s.user_email === au.email);
        const activeSub = subs.find(s => s.status === 'active' && (!s.expires_at || new Date(s.expires_at) > new Date()));
        // Use user_analyses if available, otherwise derive from cv_analysis + linkedin_roaster
        let analyses = allUserAnalyses.filter(a => a.user_id === au.id);
        if (analyses.length === 0 && au._analyses) {
            analyses = au._analyses;
        } else if (analyses.length === 0) {
            // Try matching by email from allAnalyses
            const email = au.email?.toLowerCase();
            if (email) {
                const cvMatches = allAnalyses.filter(a => (a.user_email || '').toLowerCase() === email);
                const lrMatches = allLinkedinRoaster.filter(a => (a.user_email || '').toLowerCase() === email).map(a => ({ ...a, analysis_type: 'linkedin_roaster' }));
                analyses = [...cvMatches, ...lrMatches];
            }
        }
        const meta = au.raw_user_meta_data || {};
        const derivedName = au._derived_name || '';
        const nameParts = derivedName.split(' ');
        const firstName = profile?.first_name || meta.first_name || nameParts[0] || '';
        const lastName = profile?.last_name || meta.last_name || nameParts.slice(1).join(' ') || '';
        return {
            id: au.id, email: au.email,
            first_name: firstName,
            last_name: lastName,
            phone: profile?.phone || au._derived_phone || '', linkedin_url: profile?.linkedin_url || au._derived_linkedin || '',
            cv_filename: profile?.cv_filename || '', address: profile?.address || '',
            email_confirmed: au.email_confirmed_at ? true : (meta.email_verified || false),
            created_at: au.created_at, last_sign_in_at: au.last_sign_in_at,
            active_sub: activeSub || null, all_subs: subs, analyses,
            analyses_count: analyses.length,
            cv_analyser_count: analyses.filter(a => isCvAnalyser(a)).length,
            career_path_count: analyses.filter(a => a.analysis_type === 'career_path').length,
            career_intelligence_count: analyses.filter(a => a.analysis_type === 'career_intelligence_pro' || a.analysis_type === 'career_intelligence_full' || a.analysis_type === 'career_intelligence').length,
            linkedin_roaster_count: analyses.filter(a => a.analysis_type === 'linkedin_roaster' || a._source === 'linkedin_roaster').length,
            profile_complete: !!(profile && profile.first_name && profile.last_name && profile.phone)
        };
    });
}

function renderUsers() {
    const users = getMergedUsers();
    const totalUsers = users.length;
    const activeSubs = users.filter(u => u.active_sub).length;
    const totalSavedAnalyses = users.reduce((s, u) => s + u.analyses_count, 0);
    // Compute subscription revenue from subscriptions table, or fallback to paid analyses
    let subRevenue = allSubscriptions.reduce((s, sub) => s + (parseFloat(sub.price_eur) || 0), 0);
    if (subRevenue === 0 && allAnalyses.length > 0) {
        subRevenue = allAnalyses.filter(a => a.payment_status === 'paid' && a.payment_amount > 0).reduce((s, a) => s + (parseFloat(a.payment_amount) || 0), 0);
    }
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
        const linkedinLink = u.linkedin_url ? `<a href="${u.linkedin_url}" target="_blank" style="color:#0077B5;"><i class="fab fa-linkedin"></i></a>` : '—';
        return `<tr>
            <td style="font-weight:500;">${name}</td>
            <td style="font-size:12px;">${u.email}${emailBadge}</td>
            <td style="font-size:12px;">${u.phone || '—'}</td>
            <td>${linkedinLink}</td>
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
            ${u.analyses.map(a => { const typeMap = {cv_analyser:'CV Analyser',career_path:'Career Path',career_intelligence_pro:'CI PRO',career_intelligence_full:'CI Full',linkedin_roaster:'LinkedIn Roaster',career_energy:'Career Energy'}; return `<tr><td>${typeMap[a.analysis_type]||a.analysis_type}</td><td>${new Date(a.created_at).toLocaleString('pt-PT')}</td></tr>`; }).join('')}
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
    renderCETable();
    renderHealthLogs();
    renderAffiliates();
    renderAffClicks();
    renderAffConversions();
    renderCoupons();
    renderUsers();
    setText('lastUpdate', new Date().toLocaleTimeString('pt-PT'));
    showToast('Dados atualizados!', 'success');
}

// ── Init Cockpit (called after successful auth) ──
async function initCockpit() {
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
        renderCETable();
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
}

// ── DOMContentLoaded: check existing session ──
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { data: { session } } = await _supa.auth.getSession();
        if (session && session.user && session.user.email.toLowerCase() === ADMIN_EMAIL) {
            _accessToken = session.access_token;
            document.getElementById('loginOverlay').style.display = 'none';
            initCockpit();
        }
        // else: login overlay stays visible, user must authenticate
    } catch (e) {
        console.error('Session check failed:', e);
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
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mode: 'auto_emails' })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('s2i_auto_last_run', new Date().toISOString());
            showToast(`Automação executada! Upsell 2h: ${data.upsell_2h_sent || 0}, Follow-up 7d: ${data.followup_7d_sent || 0}, CV→CP: ${data.crosssell_cv_to_cp_sent || 0}, CP→Pro: ${data.crosssell_cp_to_pro_sent || 0}, Erros: ${data.errors || 0}`, 'success');
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


/* ═══════════════════════════════════════════════════════════════
   WELCOME EMAILS DASHBOARD
   ═══════════════════════════════════════════════════════════════ */

let allWelcomeEmails = [];
let welcomeEmailChartInstance = null;
let welcomeEmailPieTypeInstance = null;
let welcomeEmailPieLangInstance = null;

async function loadWelcomeEmailsDashboard() {
    try {
        allWelcomeEmails = await supaFetch('welcome_emails_log', 'select=*&order=created_at.desc&limit=5000', true);
        if (!Array.isArray(allWelcomeEmails)) allWelcomeEmails = [];
    } catch (e) {
        console.error('Error loading welcome emails:', e);
        allWelcomeEmails = [];
    }
    updateWelcomeEmailKpis();
    renderWelcomeEmailCharts();
    renderWelcomeEmails();
}

function updateWelcomeEmailKpis() {
    const data = allWelcomeEmails;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const total = data.length;
    const cvAnalysis = data.filter(e => e.type === 'cv_analysis').length;
    const studentPack = data.filter(e => e.type === 'student_pack').length;
    const memberSignup = data.filter(e => e.type === 'member_signup').length;
    const today = data.filter(e => e.created_at && e.created_at.slice(0, 10) === todayStr).length;
    const week = data.filter(e => e.created_at && new Date(e.created_at) >= weekAgo).length;
    const failed = data.filter(e => e.status === 'failed').length;

    const totalEl = document.getElementById('weTotal');
    const cvEl = document.getElementById('weCvAnalysis');
    const studentEl = document.getElementById('weStudentPack');
    const memberEl = document.getElementById('weMemberSignup');
    const todayEl = document.getElementById('weToday');
    const weekEl = document.getElementById('weWeek');
    const failedEl = document.getElementById('weFailed');

    if (totalEl) totalEl.textContent = total;
    if (cvEl) cvEl.textContent = cvAnalysis;
    if (studentEl) studentEl.textContent = studentPack;
    if (memberEl) memberEl.textContent = memberSignup;
    if (todayEl) todayEl.textContent = today;
    if (weekEl) weekEl.textContent = week;
    if (failedEl) failedEl.textContent = failed;
}

function renderWelcomeEmailCharts() {
    const data = allWelcomeEmails;

    // ── Bar Chart: Envios por dia (últimos 30 dias) ──
    const now = new Date();
    const days = [];
    const cvCounts = [];
    const studentCounts = [];
    const memberCounts = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().slice(0, 10);
        days.push(d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }));
        cvCounts.push(data.filter(e => e.created_at && e.created_at.slice(0, 10) === dateStr && e.type === 'cv_analysis').length);
        studentCounts.push(data.filter(e => e.created_at && e.created_at.slice(0, 10) === dateStr && e.type === 'student_pack').length);
        memberCounts.push(data.filter(e => e.created_at && e.created_at.slice(0, 10) === dateStr && e.type === 'member_signup').length);
    }

    if (welcomeEmailChartInstance) welcomeEmailChartInstance.destroy();
    const ctx = document.getElementById('welcomeEmailChart');
    if (ctx) {
        welcomeEmailChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: days,
                datasets: [
                    { label: 'Análise CV', data: cvCounts, backgroundColor: 'rgba(124,58,237,0.7)', borderRadius: 4 },
                    { label: 'Student Pack', data: studentCounts, backgroundColor: 'rgba(5,150,105,0.75)', borderRadius: 4 },
                    { label: 'Registo Membro', data: memberCounts, backgroundColor: 'rgba(59,130,246,0.7)', borderRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45 } },
                    y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: '#f0f0f0' } }
                }
            }
        });
    }

    // ── Pie Chart: Tipo ──
    const cvTotal = data.filter(e => e.type === 'cv_analysis').length;
    const studentTotal = data.filter(e => e.type === 'student_pack').length;
    const memberTotal = data.filter(e => e.type === 'member_signup').length;

    if (welcomeEmailPieTypeInstance) welcomeEmailPieTypeInstance.destroy();
    const ctxType = document.getElementById('welcomeEmailPieType');
    if (ctxType) {
        welcomeEmailPieTypeInstance = new Chart(ctxType, {
            type: 'doughnut',
            data: {
                labels: ['Análise CV', 'Student Pack', 'Registo Membro'],
                datasets: [{ data: [cvTotal, studentTotal, memberTotal], backgroundColor: ['#7C3AED', '#059669', '#3B82F6'], borderWidth: 0 }]
            },
            options: {
                responsive: false,
                plugins: {
                    legend: { position: 'bottom', labels: { font: { size: 10 }, padding: 8 } },
                    title: { display: true, text: 'Por Tipo', font: { size: 11, weight: '600' }, color: '#374151' }
                }
            }
        });
    }

    // ── Pie Chart: Idioma ──
    const ptTotal = data.filter(e => e.lang === 'pt').length;
    const enTotal = data.filter(e => e.lang === 'en').length;

    if (welcomeEmailPieLangInstance) welcomeEmailPieLangInstance.destroy();
    const ctxLang = document.getElementById('welcomeEmailPieLang');
    if (ctxLang) {
        welcomeEmailPieLangInstance = new Chart(ctxLang, {
            type: 'doughnut',
            data: {
                labels: ['Português', 'English'],
                datasets: [{ data: [ptTotal, enTotal], backgroundColor: ['#10B981', '#3B82F6'], borderWidth: 0 }]
            },
            options: {
                responsive: false,
                plugins: {
                    legend: { position: 'bottom', labels: { font: { size: 10 }, padding: 8 } },
                    title: { display: true, text: 'Por Idioma', font: { size: 11, weight: '600' }, color: '#374151' }
                }
            }
        });
    }
}

function renderWelcomeEmails() {
    const filterType = document.getElementById('weFilterType')?.value || 'all';
    const filterLang = document.getElementById('weFilterLang')?.value || 'all';
    const filterStatus = document.getElementById('weFilterStatus')?.value || 'all';
    const search = (document.getElementById('weFilterSearch')?.value || '').toLowerCase();

    let filtered = allWelcomeEmails;
    if (filterType !== 'all') filtered = filtered.filter(e => e.type === filterType);
    if (filterLang !== 'all') filtered = filtered.filter(e => e.lang === filterLang);
    if (filterStatus !== 'all') filtered = filtered.filter(e => e.status === filterStatus);
    if (search) filtered = filtered.filter(e => (e.email || '').toLowerCase().includes(search) || (e.name || '').toLowerCase().includes(search));

    document.getElementById('weCount').textContent = filtered.length + ' registos';

    const tbody = document.getElementById('welcomeEmailsTable');
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhum email de boas-vindas encontrado</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.slice(0, 200).map(e => {
        const date = e.created_at ? new Date(e.created_at).toLocaleDateString('pt-PT') + ' ' + new Date(e.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '--';
        const typeBadge = e.type === 'cv_analysis'
            ? '<span class="badge badge-purple">Análise CV</span>'
            : e.type === 'student_pack'
                ? '<span class="badge" style="background:#059669;color:#fff;">Student Pack</span>'
                : '<span class="badge badge-career">Registo Membro</span>';
        const langBadge = e.lang === 'en'
            ? '<span class="badge badge-en">EN</span>'
            : '<span class="badge badge-pt">PT</span>';
        const statusBadge = e.status === 'sent'
            ? '<span class="badge badge-success">Enviado</span>'
            : '<span class="badge badge-danger">Falhado</span>';
        const brevoId = e.brevo_message_id ? '<span style="font-size:10px;color:var(--text-muted);">' + e.brevo_message_id + '</span>' : '--';

        return `<tr>
            <td style="font-size:12px;color:var(--text-muted);white-space:nowrap;">${date}</td>
            <td style="font-size:12px;">${e.email || '--'}</td>
            <td style="font-size:12px;">${e.name || '--'}</td>
            <td>${typeBadge}</td>
            <td>${langBadge}</td>
            <td>${statusBadge}</td>
            <td>${brevoId}</td>
        </tr>`;
    }).join('');
}

function exportWelcomeEmailsCSV() {
    const filterType = document.getElementById('weFilterType')?.value || 'all';
    const filterLang = document.getElementById('weFilterLang')?.value || 'all';
    const filterStatus = document.getElementById('weFilterStatus')?.value || 'all';
    const search = (document.getElementById('weFilterSearch')?.value || '').toLowerCase();

    let filtered = allWelcomeEmails;
    if (filterType !== 'all') filtered = filtered.filter(e => e.type === filterType);
    if (filterLang !== 'all') filtered = filtered.filter(e => e.lang === filterLang);
    if (filterStatus !== 'all') filtered = filtered.filter(e => e.status === filterStatus);
    if (search) filtered = filtered.filter(e => (e.email || '').toLowerCase().includes(search) || (e.name || '').toLowerCase().includes(search));

    let csv = 'Data,Email,Nome,Tipo,Idioma,Estado,Brevo ID\n';
    filtered.forEach(e => {
        const date = e.created_at ? new Date(e.created_at).toISOString() : '';
        csv += `"${date}","${e.email || ''}","${e.name || ''}","${e.type || ''}","${e.lang || ''}","${e.status || ''}","${e.brevo_message_id || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'welcome_emails_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
}
