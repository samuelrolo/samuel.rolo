// ===================== CONFIG =====================
const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
const BREVO_KEY = localStorage.getItem('s2i_brevo_key') || '';
const BREVO_SENDER = { name: 'Share2Inspire', email: 'srshare2inspire@gmail.com' };

// Second Supabase project (S2I Career Advisor) for health logs
const SUPABASE2_URL = 'https://dnjnsotemnfhfnwmbbvk.supabase.co';
const SUPABASE2_KEY = ''; // Will use same key pattern or public anon key

function ensureBrevoKey() {
    if (BREVO_KEY) return true;
    const key = prompt('Insere a API Key do Brevo para enviar emails:');
    if (key) { localStorage.setItem('s2i_brevo_key', key); location.reload(); return true; }
    showToast('API Key do Brevo necessária para enviar emails', 'danger');
    return false;
}

let allAnalyses = [];
let allVouchers = [];
let allEmailHistory = [];
let allHealthLogs = [];
let dailyChart = null;
let typeChart = null;
let langChart = null;
let ttfbChart = null;
let currentPage = 1;
let historyPage = 1;
const PAGE_SIZE = 20;
let globalLang = 'all';
let nurturingLang = 'pt';

// ===================== SUPABASE HELPERS =====================
async function supaFetch(table, query = '') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    return res.json();
}

async function supaInsert(table, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
    });
    return res.json();
}

async function supaUpdate(table, id, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
}

// ===================== LANGUAGE DETECTION =====================
function detectLanguage(analysis) {
    // Heuristic: check professional_area or analysis content for EN indicators
    const area = (analysis.professional_area || '').toLowerCase();
    const name = (analysis.user_name || '').toLowerCase();
    const email = (analysis.user_email || '').toLowerCase();
    
    // Check if analysis_type contains language hint
    if (analysis.analysis_type && analysis.analysis_type.includes('_en')) return 'en';
    
    // Check for common English professional areas
    const enAreas = ['software engineer', 'data scientist', 'project manager', 'marketing', 'developer', 'analyst', 'consultant', 'designer', 'manager'];
    const ptAreas = ['engenheiro', 'analista', 'gestor', 'programador', 'técnico', 'consultor', 'designer', 'administra'];
    
    for (const a of ptAreas) { if (area.includes(a)) return 'pt'; }
    for (const a of enAreas) { if (area.includes(a)) return 'en'; }
    
    // Default: check if email domain suggests PT
    if (email.endsWith('.pt') || email.endsWith('.br')) return 'pt';
    if (email.endsWith('.uk') || email.endsWith('.com') || email.endsWith('.io')) return 'en';
    
    return 'pt'; // Default to PT
}

function getProductType(analysis) {
    if (analysis.analysis_type === 'career_path') return 'career_path';
    return 'cv';
}

// ===================== GLOBAL LANGUAGE FILTER =====================
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
}

function filterByLang(data, lang) {
    if (!lang || lang === 'all') return data;
    return data.filter(a => detectLanguage(a) === lang);
}

// ===================== DATA LOADING =====================
async function loadAllData() {
    try {
        const [analyses, vouchers] = await Promise.all([
            supaFetch('cv_analysis', 'select=id,user_email,user_name,score,professional_area,analysis_type,payment_status,payment_amount,payment_method,transaction_id,career_path_purchased,user_rating,rating_comment,created_at&order=created_at.desc'),
            supaFetch('vouchers', 'select=*&order=created_at.desc')
        ]);
        allAnalyses = Array.isArray(analyses) ? analyses : [];
        allVouchers = Array.isArray(vouchers) ? vouchers : [];
    } catch (e) {
        console.error('Erro ao carregar dados:', e);
        allAnalyses = [];
        allVouchers = [];
        showToast('Erro ao carregar dados do Supabase', 'danger');
    }
}

async function loadEmailHistory() {
    try {
        const history = await supaFetch('email_history', 'order=sent_at.desc');
        allEmailHistory = Array.isArray(history) ? history : [];
    } catch (e) {
        console.error('Erro ao carregar histórico:', e);
        allEmailHistory = [];
    }
}

async function loadHealthLogs() {
    try {
        // Health logs are in the same Supabase project
        const logs = await supaFetch('backend_health_log', 'order=checked_at.desc&limit=500');
        allHealthLogs = Array.isArray(logs) ? logs : [];
    } catch (e) {
        console.error('Erro ao carregar health logs:', e);
        allHealthLogs = [];
    }
}

// ===================== DETERMINE ANALYSIS TYPE =====================
function getAnalysisType(analysis) {
    if (analysis.analysis_type === 'career_path') return 'paid';
    const usedVoucher = allVouchers.find(v =>
        v.email && analysis.user_email &&
        v.email.toLowerCase() === analysis.user_email.toLowerCase() &&
        v.used_analyses > 0
    );
    if (analysis.payment_status === 'paid' || analysis.payment_amount > 0) return 'paid';
    if (usedVoucher) return 'voucher';
    if (analysis.analysis_type === 'free_heuristic') return 'free';
    return 'free';
}

function getTypeBadge(type) {
    switch(type) {
        case 'paid': return '<span class="badge badge-paid">Pago</span>';
        case 'voucher': return '<span class="badge badge-voucher">Voucher</span>';
        default: return '<span class="badge badge-free">Gratuito</span>';
    }
}

function getLangBadge(lang) {
    return lang === 'en' 
        ? '<span class="badge badge-en">🇬🇧 EN</span>' 
        : '<span class="badge badge-pt">🇵🇹 PT</span>';
}

function getProductBadge(analysis) {
    return analysis.analysis_type === 'career_path'
        ? '<span class="badge badge-career">Career Path</span>'
        : '<span class="badge" style="background:var(--purple);color:white;">CV Analyser</span>';
}

function getPaymentOrigin(analysis) {
    if (analysis.payment_method) return analysis.payment_method;
    const type = getAnalysisType(analysis);
    if (type === 'voucher') return 'voucher';
    if (type === 'free') return 'free';
    const tid = analysis.transaction_id || '';
    if (tid.startsWith('pi_') || tid.startsWith('cs_')) return 'stripe';
    if (tid.startsWith('PAYID-') || tid.toLowerCase().includes('paypal')) return 'paypal';
    const matchedVoucher = allVouchers.find(v => v.email && analysis.user_email && v.email.toLowerCase() === analysis.user_email.toLowerCase() && v.used_analyses > 0);
    if (matchedVoucher && matchedVoucher.payment_method) return matchedVoucher.payment_method;
    if (analysis.payment_status === 'paid') return 'stripe';
    return 'unknown';
}

function getPaymentOriginBadge(analysis) {
    const origin = getPaymentOrigin(analysis);
    const map = {
        'stripe': '<span class="badge" style="background:#635bff;color:white;">Stripe</span>',
        'paypal': '<span class="badge" style="background:#003087;color:white;">PayPal</span>',
        'mbway': '<span class="badge" style="background:#e4002b;color:white;">MBWay</span>',
        'voucher': '<span class="badge badge-voucher">Voucher</span>',
        'free': '<span class="badge badge-free">Gratuito</span>',
        'unknown': '<span class="badge" style="background:var(--bg-muted);color:var(--text-muted);">-</span>'
    };
    return map[origin] || map['unknown'];
}

// ===================== DASHBOARD KPIs =====================
function updateDashboard() {
    const filtered = filterByLang(allAnalyses, globalLang);
    const total = filtered.length;
    const uniqueEmails = new Set(filtered.map(a => a.user_email).filter(e => e && e !== 'anonymous@share2inspire.pt'));
    const now = new Date();
    const h24 = filtered.filter(a => (now - new Date(a.created_at)) < 86400000).length;
    const d7 = filtered.filter(a => (now - new Date(a.created_at)) < 604800000).length;
    const avgScore = total > 0 ? (filtered.reduce((s,a) => s + (a.score||0), 0) / total).toFixed(1) : 'N/A';
    const careerPaths = filtered.filter(a => a.career_path_purchased || a.analysis_type === 'career_path').length;

    // Revenue calculation
    const voucherBatches = {};
    allVouchers.forEach(v => {
        const key = v.email + '|' + v.created_at;
        if (!voucherBatches[key]) voucherBatches[key] = { amount: parseFloat(v.amount_paid) || 0, count: 0 };
        voucherBatches[key].count++;
    });
    const voucherRevenue = Object.values(voucherBatches).reduce((s,b) => s + b.amount, 0);
    const directRevenue = filtered.reduce((s,a) => s + (parseFloat(a.payment_amount) || 0), 0);
    const revenue = voucherRevenue + directRevenue;

    const paidCount = allVouchers.filter(v => v.used_analyses > 0).length + filtered.filter(a => a.payment_status === 'paid').length;
    const freeCount = total - paidCount;
    const voucherEmails = new Set(allVouchers.filter(v => v.amount_paid > 0).map(v => v.email?.toLowerCase()));
    const convRate = uniqueEmails.size > 0 ? ((voucherEmails.size / uniqueEmails.size) * 100).toFixed(1) : '0';

    const activeVouchers = allVouchers.filter(v => v.is_active === true && (v.used_analyses === 0 || v.used_analyses === null)).length;
    const usedVouchers = allVouchers.filter(v => (v.used_analyses != null && v.used_analyses > 0) || v.is_active === false).length;

    document.getElementById('kpiTotal').textContent = total;
    document.getElementById('kpiPaid').textContent = paidCount;
    document.getElementById('kpiFree').textContent = freeCount;
    document.getElementById('kpiRevenue').textContent = `€${revenue.toFixed(2)}`;
    document.getElementById('kpi24h').textContent = h24;
    document.getElementById('kpi7d').textContent = d7;
    document.getElementById('kpiAvgScore').textContent = avgScore !== 'N/A' ? `${avgScore}/100` : 'N/A';
    document.getElementById('kpiCareerPaths').textContent = careerPaths;
    document.getElementById('kpiUniqueUsers').textContent = uniqueEmails.size;
    document.getElementById('kpiConvRate').textContent = `${convRate}%`;
    document.getElementById('kpiVouchersActive').textContent = activeVouchers;
    document.getElementById('kpiVouchersUsed').textContent = usedVouchers;

    // Revenue breakdown by language
    const ptAnalyses = allAnalyses.filter(a => detectLanguage(a) === 'pt');
    const enAnalyses = allAnalyses.filter(a => detectLanguage(a) === 'en');
    const ptRevenue = ptAnalyses.reduce((s,a) => s + (parseFloat(a.payment_amount) || 0), 0);
    const enRevenue = enAnalyses.reduce((s,a) => s + (parseFloat(a.payment_amount) || 0), 0);
    
    // Revenue by product
    const cvRevenue = allAnalyses.filter(a => a.analysis_type !== 'career_path').reduce((s,a) => s + (parseFloat(a.payment_amount) || 0), 0);
    const cpRevenue = allAnalyses.filter(a => a.analysis_type === 'career_path').reduce((s,a) => s + (parseFloat(a.payment_amount) || 0), 0);

    document.getElementById('kpiRevenuePT').textContent = `€${(ptRevenue + voucherRevenue * 0.8).toFixed(2)}`;
    document.getElementById('kpiRevenueEN').textContent = `$${(enRevenue + voucherRevenue * 0.2).toFixed(2)}`;
    document.getElementById('kpiRevenueCVA').textContent = `€${(cvRevenue + voucherRevenue).toFixed(2)}`;
    document.getElementById('kpiRevenueCP').textContent = `€${cpRevenue.toFixed(2)}`;

    // Nurturing counts
    const freeEmails = [...new Set(allAnalyses.filter(a => getAnalysisType(a) === 'free' && a.user_email && a.user_email !== 'anonymous@share2inspire.pt').map(a => a.user_email))];
    document.getElementById('upsellCount').textContent = freeEmails.length;
    document.getElementById('feedbackCount').textContent = allAnalyses.filter(a => getAnalysisType(a) !== 'free' && !a.user_rating).length;
    document.getElementById('careerpathCount').textContent = allAnalyses.filter(a => getAnalysisType(a) !== 'free' && !a.career_path_purchased && a.analysis_type !== 'career_path').length;

    updateCharts();
    updateConversionFunnel();
}

// ===================== CHARTS =====================
function getChartDateDays() {
    const sel = document.getElementById('chartDateFilter');
    if (!sel) return null;
    const val = sel.value;
    return val === 'all' ? null : parseInt(val);
}

function filterByDateDays(data, days) {
    if (!days) return data;
    const cutoff = Date.now() - days * 86400000;
    return data.filter(a => new Date(a.created_at).getTime() >= cutoff);
}

function updateCharts() {
    const langFiltered = filterByLang(allAnalyses, globalLang);
    const chartDays = getChartDateDays();
    const dateFiltered = filterByDateDays(langFiltered, chartDays);
    
    // Daily chart - last 14 days - STACKED by product with paid/free breakdown
    const days = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        days[key] = { cv_free: 0, cv_paid: 0, cp_free: 0, cp_paid: 0 };
    }
    langFiltered.forEach(a => {
        const key = new Date(a.created_at).toISOString().split('T')[0];
        if (days[key]) {
            const isCP = a.analysis_type === 'career_path';
            const isPaid = getAnalysisType(a) !== 'free';
            if (isCP) { isPaid ? days[key].cp_paid++ : days[key].cp_free++; }
            else { isPaid ? days[key].cv_paid++ : days[key].cv_free++; }
        }
    });
    const labels = Object.keys(days).map(d => { const dt = new Date(d); return dt.toLocaleDateString('pt-PT', {day:'2-digit',month:'2-digit'}); });

    if (dailyChart) dailyChart.destroy();
    dailyChart = new Chart(document.getElementById('dailyChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'CV Analyser (Gratuito)', data: Object.values(days).map(d => d.cv_free), backgroundColor: 'rgba(124,58,237,.35)', borderColor: '#7C3AED', borderWidth: 1, stack: 'cv' },
                { label: 'CV Analyser (Pago)', data: Object.values(days).map(d => d.cv_paid), backgroundColor: 'rgba(124,58,237,.85)', borderColor: '#7C3AED', borderWidth: 1, stack: 'cv' },
                { label: 'Career Path (Gratuito)', data: Object.values(days).map(d => d.cp_free), backgroundColor: 'rgba(59,130,246,.35)', borderColor: '#3B82F6', borderWidth: 1, stack: 'cp' },
                { label: 'Career Path (Pago)', data: Object.values(days).map(d => d.cp_paid), backgroundColor: 'rgba(59,130,246,.85)', borderColor: '#3B82F6', borderWidth: 1, stack: 'cp' }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 8, font: { size: 11 } } },
                tooltip: { callbacks: { afterBody: function(items) {
                    const idx = items[0].dataIndex;
                    const d = Object.values(days)[idx];
                    const cvTotal = d.cv_free + d.cv_paid;
                    const cpTotal = d.cp_free + d.cp_paid;
                    return `\nCV Total: ${cvTotal}  |  CP Total: ${cpTotal}`;
                } } }
            },
            scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });

    // Type chart - filtered by date
    const types = { free: 0, paid: 0, voucher: 0 };
    dateFiltered.forEach(a => { types[getAnalysisType(a)]++; });
    if (typeChart) typeChart.destroy();
    typeChart = new Chart(document.getElementById('typeChart').getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Gratuito', 'Pago', 'Voucher'],
            datasets: [{ data: [types.free, types.paid, types.voucher], backgroundColor: ['#6c757d', '#28a745', '#BF9A33'], borderWidth: 2, borderColor: '#fff' }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10 } } } }
    });

    // Language chart - filtered by date
    const ptCount = dateFiltered.filter(a => detectLanguage(a) === 'pt').length;
    const enCount = dateFiltered.filter(a => detectLanguage(a) === 'en').length;
    if (langChart) langChart.destroy();
    langChart = new Chart(document.getElementById('langChart').getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['🇵🇹 Português', '🇬🇧 English'],
            datasets: [{ data: [ptCount, enCount], backgroundColor: ['#016401', '#1d4ed8'], borderWidth: 2, borderColor: '#fff' }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10 } } } }
    });
}

function updateConversionFunnel() {
    const total = allAnalyses.length;
    const uniqueFree = new Set(allAnalyses.filter(a => a.user_email && a.user_email !== 'anonymous@share2inspire.pt').map(a => a.user_email)).size;
    const paidUsers = new Set(allAnalyses.filter(a => getAnalysisType(a) !== 'free' && a.user_email).map(a => a.user_email)).size;
    const cpUsers = new Set(allAnalyses.filter(a => (a.career_path_purchased || a.analysis_type === 'career_path') && a.user_email).map(a => a.user_email)).size;

    const maxWidth = 100;
    const funnelData = [
        { label: 'Total Análises', value: total, color: '#6B7280', pct: 100 },
        { label: 'Utilizadores Únicos', value: uniqueFree, color: 'var(--gold)', pct: total > 0 ? (uniqueFree/total*100) : 0 },
        { label: 'Pagaram', value: paidUsers, color: 'var(--green)', pct: uniqueFree > 0 ? (paidUsers/uniqueFree*100) : 0 },
        { label: 'Career Path', value: cpUsers, color: 'var(--blue)', pct: paidUsers > 0 ? (cpUsers/paidUsers*100) : 0 }
    ];

    const container = document.getElementById('conversionFunnel');
    container.innerHTML = funnelData.map((d, i) => {
        const width = i === 0 ? maxWidth : Math.max(15, (d.value / funnelData[0].value) * maxWidth);
        return `<div class="mb-2">
            <div class="d-flex justify-content-between mb-1">
                <small class="fw-bold">${d.label}</small>
                <small class="text-muted">${d.value} ${i > 0 ? `(${d.pct.toFixed(1)}%)` : ''}</small>
            </div>
            <div class="funnel-bar" style="width:${width}%;background:${d.color};">${d.value}</div>
        </div>`;
    }).join('');
}

// ===================== ANALYSES TABLE =====================
function renderAnalyses() {
    let filtered = [...allAnalyses];
    const typeFilter = document.getElementById('filterType').value;
    const langFilter = document.getElementById('filterLang').value;
    const productFilter = document.getElementById('filterProduct').value;
    const emailFilter = document.getElementById('filterEmail').value.toLowerCase();
    const dateFrom = document.getElementById('filterDateFrom').value;
    const dateTo = document.getElementById('filterDateTo').value;

    // Apply global lang filter first
    filtered = filterByLang(filtered, globalLang);
    
    if (typeFilter !== 'all') filtered = filtered.filter(a => getAnalysisType(a) === typeFilter);
    if (langFilter !== 'all') filtered = filtered.filter(a => detectLanguage(a) === langFilter);
    if (productFilter !== 'all') filtered = filtered.filter(a => getProductType(a) === productFilter);
    if (emailFilter) filtered = filtered.filter(a => a.user_email && a.user_email.toLowerCase().includes(emailFilter));
    if (dateFrom) filtered = filtered.filter(a => new Date(a.created_at) >= new Date(dateFrom));
    if (dateTo) filtered = filtered.filter(a => new Date(a.created_at) <= new Date(dateTo + 'T23:59:59'));

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    if (currentPage > totalPages) currentPage = 1;
    const start = (currentPage - 1) * PAGE_SIZE;
    const page = filtered.slice(start, start + PAGE_SIZE);

    const tbody = document.getElementById('analysesTable');
    if (page.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">Sem resultados</td></tr>';
    } else {
        tbody.innerHTML = page.map(a => {
            const date = new Date(a.created_at);
            const dateStr = date.toLocaleDateString('pt-PT') + ' ' + date.toLocaleTimeString('pt-PT', {hour:'2-digit',minute:'2-digit'});
            const type = getAnalysisType(a);
            const lang = detectLanguage(a);
            return `<tr>
                <td>${dateStr}</td>
                <td>${a.user_name || '<em class="text-muted">Anónimo</em>'}</td>
                <td>${a.user_email || '-'}</td>
                <td><strong>${a.score || '-'}</strong></td>
                <td>${getTypeBadge(type)}</td>
                <td>${getPaymentOriginBadge(a)}</td>
                <td>${getProductBadge(a)}</td>
                <td>${getLangBadge(lang)}</td>
                <td>
                    ${a.user_email && a.user_email !== 'anonymous@share2inspire.pt' ? `<button class="btn btn-sm btn-icon" onclick="openEmailModal('${a.user_email}','${a.user_name||''}','${lang}')"><i class="fas fa-envelope"></i></button>` : ''}
                </td>
            </tr>`;
        }).join('');
    }

    document.getElementById('analysesCount').textContent = `${filtered.length} análises encontradas`;

    // Pagination
    const pag = document.getElementById('analysesPagination');
    if (totalPages <= 1) { pag.innerHTML = ''; return; }
    let pagHtml = '';
    for (let i = 1; i <= Math.min(totalPages, 10); i++) {
        pagHtml += `<button class="page-btn ${i===currentPage?'active':''}" onclick="currentPage=${i};renderAnalyses()">${i}</button>`;
    }
    pag.innerHTML = pagHtml;
}

function filterAnalyses() { currentPage = 1; renderAnalyses(); }

function exportAnalysesCSV() {
    const csv = ['Data,Nome,Email,Score,Tipo,Origem,Produto,Idioma'];
    allAnalyses.forEach(a => {
        csv.push(`"${new Date(a.created_at).toLocaleString('pt-PT')}","${a.user_name||''}","${a.user_email||''}",${a.score||''},${getAnalysisType(a)},${getPaymentOrigin(a)},${getProductType(a)},${detectLanguage(a)}`);
    });
    downloadCSV(csv.join('\n'), 'cv_analyses_export.csv');
}

// ===================== VOUCHERS TABLE =====================
function renderVouchers() {
    let filtered = [...allVouchers];
    const statusFilter = document.getElementById('filterVoucherStatus').value;
    const typeFilter = document.getElementById('filterVoucherType') ? document.getElementById('filterVoucherType').value : 'all';
    const emailFilter = document.getElementById('filterVoucherEmail').value.toLowerCase();

    if (statusFilter === 'active') filtered = filtered.filter(v => v.is_active === true && (v.used_analyses === 0 || v.used_analyses === null));
    if (statusFilter === 'used') filtered = filtered.filter(v => (v.used_analyses != null && v.used_analyses > 0) || v.is_active === false);
    if (typeFilter !== 'all') filtered = filtered.filter(v => v.voucher_type === typeFilter);
    if (emailFilter) filtered = filtered.filter(v => v.email.toLowerCase().includes(emailFilter));

    const tbody = document.getElementById('vouchersTable');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">Sem vouchers</td></tr>';
    } else {
        tbody.innerHTML = filtered.map(v => {
            const date = new Date(v.created_at).toLocaleDateString('pt-PT');
            const isUsed = (v.used_analyses != null && v.used_analyses > 0) || v.is_active === false;
            const status = isUsed ? '<span class="badge badge-secondary">Usado</span>' : '<span class="badge badge-success">Activo</span>';
            const rowClass = isUsed ? 'voucher-row used' : '';
            const typeLabel = v.voucher_type === 'career_path' 
                ? '<span class="badge" style="background:#3498db;">Career Path</span>' 
                : '<span class="badge badge-cv">CV Analyser</span>';
            return `<tr class="${rowClass}">
                <td><code>${v.code}</code></td>
                <td>${v.email}</td>
                <td>${v.plan_name}</td>
                <td>${typeLabel}</td>
                <td>€${parseFloat(v.amount_paid).toFixed(2)}</td>
                <td>${status}</td>
                <td>${date}</td>
                <td>
                    <button class="btn btn-sm btn-icon" onclick="openEmailModal('${v.email}','')"><i class="fas fa-envelope"></i></button>
                </td>
            </tr>`;
        }).join('');
    }
}

function filterVouchers() { renderVouchers(); }

// ===================== CREATE VOUCHERS =====================
function showCreateVoucherModal() { document.getElementById('voucherModalOverlay').style.display = 'flex'; }
function closeVoucherModal() { document.getElementById('voucherModalOverlay').style.display = 'none'; }

async function createVouchers() {
    const email = document.getElementById('voucherEmail').value.trim();
    if (!email) { showToast('Email obrigatório', 'danger'); return; }

    const parts = document.getElementById('voucherPlan').value.split('|');
    const planName = parts[0];
    const count = parseInt(parts[1]);
    const amount = parseFloat(parts[2]);
    const voucherType = parts[3] || 'standard';
    const includesCareerPath = parts[4] === 'true';
    const payment = document.getElementById('voucherPayment').value;
    const sendEmail = document.getElementById('voucherSendEmail').checked;

    const codes = [];
    for (let i = 0; i < count; i++) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'CVA-';
        for (let j = 0; j < 8; j++) code += chars[Math.floor(Math.random() * chars.length)];
        codes.push(code);
    }

    const vouchers = codes.map(code => ({
        code, email, plan_name: planName, total_analyses: 1, used_analyses: 0,
        amount_paid: amount, payment_method: payment, is_active: true,
        voucher_type: voucherType, includes_career_path: includesCareerPath
    }));

    try {
        await supaInsert('vouchers', vouchers);
        showToast(`${count} voucher(s) criado(s) com sucesso!`, 'success');
        if (sendEmail) await sendVoucherEmail(email, codes, planName, amount);
        closeVoucherModal();
        await loadAllData();
        renderVouchers();
        updateDashboard();
    } catch (e) {
        console.error('Erro ao criar vouchers:', e);
        showToast('Erro ao criar vouchers', 'danger');
    }
}

async function sendVoucherEmail(email, codes, planName, amount) {
    const codesHtml = codes.map(c => `<div style="background:#faf9f7;border:1px solid #e8e4dc;border-radius:8px;padding:16px;margin:10px 0;text-align:center;font-family:'Courier New',monospace;font-size:18px;font-weight:600;color:#1A1A1A;letter-spacing:3px;">${c}</div>`).join('');
    const html = `<div style="max-width:560px;margin:0 auto;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#ffffff;">
  <div style="padding:40px 32px 24px;text-align:center;border-bottom:1px solid #f0ece4;">
    <h1 style="color:#1A1A1A;margin:0;font-size:22px;font-weight:600;letter-spacing:1px;">SHARE2INSPIRE</h1>
    <div style="width:40px;height:2px;background:#BF9A33;margin:12px auto 0;"></div>
    <p style="color:#999;margin:10px 0 0;font-size:13px;letter-spacing:.5px;">CV Analyser</p>
  </div>
  <div style="padding:40px 36px;">
    <h2 style="color:#1A1A1A;margin:0 0 20px;font-size:20px;font-weight:500;line-height:1.4;">Os teus c\u00f3digos de an\u00e1lise</h2>
    <p style="color:#4a4a4a;font-size:15px;line-height:1.8;margin:0 0 24px;">Obrigado pela tua compra do pacote <strong>${planName}</strong>${amount > 0 ? ` (${amount.toFixed(2)}\u20ac)` : ''}. Aqui est\u00e3o os teus ${codes.length} c\u00f3digo(s):</p>
    ${codesHtml}
    <div style="background:#faf9f7;border-radius:8px;padding:24px;margin:28px 0;">
      <p style="color:#333;font-size:14px;font-weight:500;margin:0 0 12px;">Como usar:</p>
      <div style="color:#4a4a4a;font-size:14px;line-height:2.2;">
        1. Vai a <a href="https://www.share2inspire.pt/cv-analyser" style="color:#BF9A33;text-decoration:none;">share2inspire.pt/cv-analyser</a><br>
        2. Faz upload do teu CV<br>
        3. Ap\u00f3s a an\u00e1lise gratuita, clica em \u201cC\u00f3digo\u201d<br>
        4. Insere um dos c\u00f3digos acima<br>
        5. Desfruta do relat\u00f3rio completo!
      </div>
    </div>
    <p style="color:#4a4a4a;font-size:15px;line-height:1.8;margin:0;">Cada c\u00f3digo d\u00e1 direito a <strong>1 an\u00e1lise completa</strong> com relat\u00f3rio PDF detalhado.</p>
  </div>
  <div style="padding:24px 36px;border-top:1px solid #f0ece4;text-align:center;">
    <p style="color:#b0b0b0;font-size:11px;margin:0;letter-spacing:.3px;">Share2Inspire \u00a9 2026 &nbsp;\u00b7&nbsp; <a href="https://www.share2inspire.pt" style="color:#BF9A33;text-decoration:none;">share2inspire.pt</a></p>
  </div>
</div>`;
    await sendBrevoEmail(email, `Os teus c\u00f3digos CV Analyser - Share2Inspire`, html);
}

// ===================== EMAIL FUNCTIONS =====================
function openEmailModal(email, name, lang) {
    document.getElementById('modalEmailTo').value = email;
    document.getElementById('modalEmailLang').value = lang || 'pt';
    loadEmailTemplate();
    document.getElementById('emailModalOverlay').style.display = 'flex';
}
function closeEmailModal() { document.getElementById('emailModalOverlay').style.display = 'none'; }

// ===================== EMAIL TEMPLATES (PT & EN) =====================
function getEmailTemplates() {
    return {
        pt: {
            upsell: {
                subject: 'O teu CV merece uma an\u00e1lise completa - Share2Inspire',
                html: `<div style="max-width:560px;margin:0 auto;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#ffffff;">
  <div style="padding:40px 32px 24px;text-align:center;border-bottom:1px solid #f0ece4;">
    <h1 style="color:#1A1A1A;margin:0;font-size:22px;font-weight:600;letter-spacing:1px;">SHARE2INSPIRE</h1>
    <div style="width:40px;height:2px;background:#BF9A33;margin:12px auto 0;"></div>
  </div>
  <div style="padding:40px 36px;">
    <h2 style="color:#1A1A1A;margin:0 0 20px;font-size:20px;font-weight:500;">O teu CV merece mais</h2>
    <p style="color:#4a4a4a;font-size:15px;line-height:1.8;">Vimos que analisaste o teu CV no CV Analyser. A an\u00e1lise completa inclui relat\u00f3rio PDF detalhado, estimativa salarial, recomenda\u00e7\u00f5es personalizadas e compatibilidade ATS.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="https://www.share2inspire.pt/cv-analyser" style="display:inline-block;background:#1A1A1A;color:#ffffff;padding:14px 40px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">Analisar CV Agora</a>
    </div>
    <p style="color:#999;font-size:13px;text-align:center;">Por apenas \u20ac3,99, desbloqueia todo o potencial da an\u00e1lise.</p>
  </div>
  <div style="padding:24px 36px;border-top:1px solid #f0ece4;text-align:center;">
    <p style="color:#b0b0b0;font-size:11px;">Share2Inspire \u00a9 2026 &middot; <a href="https://www.share2inspire.pt" style="color:#BF9A33;text-decoration:none;">share2inspire.pt</a></p>
  </div>
</div>`
            },
            feedback: {
                subject: 'Como foi a tua experi\u00eancia? - Share2Inspire',
                html: `<div style="max-width:560px;margin:0 auto;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#ffffff;">
  <div style="padding:40px 32px 24px;text-align:center;border-bottom:1px solid #f0ece4;">
    <h1 style="color:#1A1A1A;margin:0;font-size:22px;font-weight:600;letter-spacing:1px;">SHARE2INSPIRE</h1>
    <div style="width:40px;height:2px;background:#BF9A33;margin:12px auto 0;"></div>
  </div>
  <div style="padding:40px 36px;">
    <h2 style="color:#1A1A1A;margin:0 0 20px;font-size:20px;font-weight:500;">A tua opini\u00e3o \u00e9 importante</h2>
    <p style="color:#4a4a4a;font-size:15px;line-height:1.8;">Obrigado por teres utilizado o CV Analyser! O teu feedback ajuda-nos a melhorar continuamente.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="https://www.share2inspire.pt/cv-analyser" style="display:inline-block;background:#1A1A1A;color:#ffffff;padding:14px 40px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">Avaliar Agora</a>
    </div>
  </div>
  <div style="padding:24px 36px;border-top:1px solid #f0ece4;text-align:center;">
    <p style="color:#b0b0b0;font-size:11px;">Share2Inspire \u00a9 2026 &middot; <a href="https://www.share2inspire.pt" style="color:#BF9A33;text-decoration:none;">share2inspire.pt</a></p>
  </div>
</div>`
            },
            careerpath: {
                subject: 'Descobre o teu Career Path - Share2Inspire',
                html: `<div style="max-width:560px;margin:0 auto;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#ffffff;">
  <div style="padding:40px 32px 24px;text-align:center;border-bottom:1px solid #f0ece4;">
    <h1 style="color:#1A1A1A;margin:0;font-size:22px;font-weight:600;letter-spacing:1px;">SHARE2INSPIRE</h1>
    <div style="width:40px;height:2px;background:#BF9A33;margin:12px auto 0;"></div>
  </div>
  <div style="padding:40px 36px;">
    <h2 style="color:#1A1A1A;margin:0 0 20px;font-size:20px;font-weight:500;">Qual \u00e9 o teu pr\u00f3ximo passo de carreira?</h2>
    <p style="color:#4a4a4a;font-size:15px;line-height:1.8;">J\u00e1 tens a tua an\u00e1lise de CV. Agora descobre o teu roadmap de carreira personalizado com pr\u00f3ximos cargos, forma\u00e7\u00f5es, plano de ac\u00e7\u00e3o e estrat\u00e9gia de networking.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="https://www.share2inspire.pt/career-path" style="display:inline-block;background:#1A1A1A;color:#ffffff;padding:14px 40px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">Descobrir Career Path</a>
    </div>
    <p style="color:#999;font-size:13px;text-align:center;">Por apenas \u20ac9,99, obt\u00e9m o teu roadmap personalizado.</p>
  </div>
  <div style="padding:24px 36px;border-top:1px solid #f0ece4;text-align:center;">
    <p style="color:#b0b0b0;font-size:11px;">Share2Inspire \u00a9 2026 &middot; <a href="https://www.share2inspire.pt" style="color:#BF9A33;text-decoration:none;">share2inspire.pt</a></p>
  </div>
</div>`
            }
        },
        en: {
            upsell: {
                subject: 'Your CV deserves a full analysis - Share2Inspire',
                html: `<div style="max-width:560px;margin:0 auto;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#ffffff;">
  <div style="padding:40px 32px 24px;text-align:center;border-bottom:1px solid #f0ece4;">
    <h1 style="color:#1A1A1A;margin:0;font-size:22px;font-weight:600;letter-spacing:1px;">SHARE2INSPIRE</h1>
    <div style="width:40px;height:2px;background:#BF9A33;margin:12px auto 0;"></div>
  </div>
  <div style="padding:40px 36px;">
    <h2 style="color:#1A1A1A;margin:0 0 20px;font-size:20px;font-weight:500;">Your CV deserves more</h2>
    <p style="color:#4a4a4a;font-size:15px;line-height:1.8;">We noticed you analysed your CV with CV Analyser. The full analysis includes a detailed PDF report, salary estimation, personalised recommendations, and ATS compatibility.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="https://www.share2inspire.pt/en/cv-analyser" style="display:inline-block;background:#1A1A1A;color:#ffffff;padding:14px 40px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">Analyse CV Now</a>
    </div>
    <p style="color:#999;font-size:13px;text-align:center;">For just $5.99, unlock the full potential of the analysis.</p>
  </div>
  <div style="padding:24px 36px;border-top:1px solid #f0ece4;text-align:center;">
    <p style="color:#b0b0b0;font-size:11px;">Share2Inspire \u00a9 2026 &middot; <a href="https://www.share2inspire.pt" style="color:#BF9A33;text-decoration:none;">share2inspire.pt</a></p>
  </div>
</div>`
            },
            feedback: {
                subject: 'How was your experience? - Share2Inspire',
                html: `<div style="max-width:560px;margin:0 auto;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#ffffff;">
  <div style="padding:40px 32px 24px;text-align:center;border-bottom:1px solid #f0ece4;">
    <h1 style="color:#1A1A1A;margin:0;font-size:22px;font-weight:600;letter-spacing:1px;">SHARE2INSPIRE</h1>
    <div style="width:40px;height:2px;background:#BF9A33;margin:12px auto 0;"></div>
  </div>
  <div style="padding:40px 36px;">
    <h2 style="color:#1A1A1A;margin:0 0 20px;font-size:20px;font-weight:500;">Your opinion matters</h2>
    <p style="color:#4a4a4a;font-size:15px;line-height:1.8;">Thank you for using CV Analyser! Your feedback helps us continuously improve our service.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="https://www.share2inspire.pt/en/cv-analyser" style="display:inline-block;background:#1A1A1A;color:#ffffff;padding:14px 40px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">Rate Now</a>
    </div>
  </div>
  <div style="padding:24px 36px;border-top:1px solid #f0ece4;text-align:center;">
    <p style="color:#b0b0b0;font-size:11px;">Share2Inspire \u00a9 2026 &middot; <a href="https://www.share2inspire.pt" style="color:#BF9A33;text-decoration:none;">share2inspire.pt</a></p>
  </div>
</div>`
            },
            careerpath: {
                subject: 'Discover your Career Path - Share2Inspire',
                html: `<div style="max-width:560px;margin:0 auto;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#ffffff;">
  <div style="padding:40px 32px 24px;text-align:center;border-bottom:1px solid #f0ece4;">
    <h1 style="color:#1A1A1A;margin:0;font-size:22px;font-weight:600;letter-spacing:1px;">SHARE2INSPIRE</h1>
    <div style="width:40px;height:2px;background:#BF9A33;margin:12px auto 0;"></div>
  </div>
  <div style="padding:40px 36px;">
    <h2 style="color:#1A1A1A;margin:0 0 20px;font-size:20px;font-weight:500;">What's your next career move?</h2>
    <p style="color:#4a4a4a;font-size:15px;line-height:1.8;">You already have your CV analysis. Now discover your personalised career roadmap with next roles, training, action plan, and networking strategy.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="https://www.share2inspire.pt/en/career-path" style="display:inline-block;background:#1A1A1A;color:#ffffff;padding:14px 40px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">Discover Career Path</a>
    </div>
    <p style="color:#999;font-size:13px;text-align:center;">For just $10.00, get your personalised roadmap.</p>
  </div>
  <div style="padding:24px 36px;border-top:1px solid #f0ece4;text-align:center;">
    <p style="color:#b0b0b0;font-size:11px;">Share2Inspire \u00a9 2026 &middot; <a href="https://www.share2inspire.pt" style="color:#BF9A33;text-decoration:none;">share2inspire.pt</a></p>
  </div>
</div>`
            }
        }
    };
}

function loadEmailTemplate() {
    const template = document.getElementById('modalEmailTemplate').value;
    const lang = document.getElementById('modalEmailLang').value;
    const templates = getEmailTemplates();
    const t = templates[lang]?.[template];
    if (t) {
        document.getElementById('modalEmailSubject').value = t.subject;
        document.getElementById('modalEmailBody').value = t.html;
    } else {
        document.getElementById('modalEmailSubject').value = '';
        document.getElementById('modalEmailBody').value = '';
    }
}

async function sendSingleEmail() {
    const to = document.getElementById('modalEmailTo').value;
    const subject = document.getElementById('modalEmailSubject').value;
    const body = document.getElementById('modalEmailBody').value;
    if (!to || !subject || !body) { showToast('Preenche todos os campos', 'danger'); return; }

    const html = body.includes('<div') ? body : `<div style="max-width:560px;margin:0 auto;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#ffffff;"><div style="padding:40px 32px 24px;text-align:center;border-bottom:1px solid #f0ece4;"><h1 style="color:#1A1A1A;margin:0;font-size:22px;font-weight:600;letter-spacing:1px;">SHARE2INSPIRE</h1><div style="width:40px;height:2px;background:#BF9A33;margin:12px auto 0;"></div></div><div style="padding:40px 36px;"><div style="color:#4a4a4a;font-size:15px;line-height:1.8;">${body.replace(/\n/g, '<br>')}</div></div><div style="padding:24px 36px;border-top:1px solid #f0ece4;text-align:center;"><p style="color:#b0b0b0;font-size:11px;">Share2Inspire &copy; 2026 &middot; <a href="https://www.share2inspire.pt" style="color:#BF9A33;text-decoration:none;">share2inspire.pt</a></p></div></div>`;

    try {
        await sendBrevoEmail(to, subject, html);
        showToast(`Email enviado para ${to}!`, 'success');
        closeEmailModal();
    } catch (e) {
        showToast('Erro ao enviar email', 'danger');
    }
}

// ===================== NURTURING =====================
window._nurturingType = '';
window._allNurturingRecipients = [];

function getEmailSentInfo(email, campaignType) {
    const history = allEmailHistory.filter(h =>
        h.recipient_email && h.recipient_email.toLowerCase() === email.toLowerCase() && h.status === 'sent'
    );
    const campaignHistory = history.filter(h => h.campaign_type === campaignType);
    return {
        sentThisCampaign: campaignHistory.length > 0,
        lastSentDate: campaignHistory.length > 0 ? new Date(campaignHistory[0].sent_at).toLocaleDateString('pt-PT') : null,
        sentAnyEmail: history.length > 0,
        totalSent: history.length,
        lastAnyDate: history.length > 0 ? new Date(history[0].sent_at).toLocaleDateString('pt-PT') : null
    };
}

function renderRecipientList() {
    const recipients = window._allNurturingRecipients || [];
    const type = window._nurturingType;
    const filter = document.getElementById('recipientFilter').value;
    const search = document.getElementById('recipientSearch').value.toLowerCase();
    const container = document.getElementById('recipientList');

    if (recipients.length === 0) {
        container.innerHTML = '<em class="text-muted" style="font-size:.82rem;">Sem destinat\u00e1rios neste segmento.</em>';
        updateSelectedCount();
        return;
    }

    let html = '';
    recipients.forEach((email, idx) => {
        const info = getEmailSentInfo(email, type);
        const isSent = info.sentThisCampaign;
        if (filter === 'unsent' && isSent) return;
        if (filter === 'sent' && !isSent) return;
        if (search && !email.toLowerCase().includes(search)) return;

        const checked = document.querySelector(`#rcpt_${idx}`)?.checked ?? !isSent;
        const sentClass = isSent ? ' sent' : '';
        let badge = '';
        if (isSent) {
            badge = `<span class="sent-badge campaign-match"><i class="fas fa-check me-1"></i>Enviado ${info.lastSentDate}</span>`;
        } else if (info.sentAnyEmail) {
            badge = `<span class="sent-badge"><i class="fas fa-envelope me-1"></i>${info.totalSent} email(s) - \u00faltimo ${info.lastAnyDate}</span>`;
        }

        html += `<div class="recipient-item${sentClass}" data-email="${email}" data-sent="${isSent}">
            <input type="checkbox" id="rcpt_${idx}" type="checkbox" style="margin:0;cursor:pointer;accent-color:var(--gold);" ${checked ? 'checked' : ''} onchange="updateSelectedCount()">
            <span style="flex:1;">${email}</span>
            ${badge}
        </div>`;
    });

    container.innerHTML = html || '<em class="text-muted" style="font-size:.82rem;">Nenhum resultado para este filtro.</em>';
    updateSelectedCount();
}

function updateSelectedCount() {
    const checked = document.querySelectorAll('#recipientList input[type=checkbox]:checked');
    const total = window._allNurturingRecipients?.length || 0;
    document.getElementById('selectedCount').textContent = `(${checked.length} de ${total} selecionados)`;
}

function toggleAllRecipients(selectAll) {
    document.querySelectorAll('#recipientList input[type=checkbox]').forEach(cb => { cb.checked = selectAll; });
    updateSelectedCount();
}

function selectOnlyUnsent() {
    document.querySelectorAll('#recipientList .recipient-item').forEach(item => {
        const cb = item.querySelector('input[type=checkbox]');
        const isSent = item.dataset.sent === 'true';
        if (cb) cb.checked = !isSent;
    });
    updateSelectedCount();
}

function filterRecipientList() {
    const states = {};
    document.querySelectorAll('#recipientList input[type=checkbox]').forEach(cb => { states[cb.id] = cb.checked; });
    renderRecipientList();
    Object.keys(states).forEach(id => { const cb = document.getElementById(id); if (cb) cb.checked = states[id]; });
    updateSelectedCount();
}

function getSelectedRecipients() {
    const selected = [];
    document.querySelectorAll('#recipientList .recipient-item').forEach(item => {
        const cb = item.querySelector('input[type=checkbox]');
        if (cb && cb.checked) selected.push(item.dataset.email);
    });
    return selected;
}

function prepareNurturing(type) {
    let recipients = [];
    const templates = getEmailTemplates();
    const lang = nurturingLang;
    const t = templates[lang]?.[type];

    if (type === 'upsell') {
        recipients = [...new Set(allAnalyses.filter(a => getAnalysisType(a) === 'free' && a.user_email && a.user_email !== 'anonymous@share2inspire.pt').map(a => a.user_email))];
    } else if (type === 'feedback') {
        recipients = [...new Set(allAnalyses.filter(a => getAnalysisType(a) !== 'free' && !a.user_rating && a.user_email).map(a => a.user_email))];
    } else if (type === 'careerpath') {
        recipients = [...new Set(allAnalyses.filter(a => getAnalysisType(a) !== 'free' && !a.career_path_purchased && a.analysis_type !== 'career_path' && a.user_email).map(a => a.user_email))];
    }

    window._nurturingType = type;
    window._allNurturingRecipients = recipients;

    const langLabel = lang === 'en' ? '🇬🇧' : '🇵🇹';
    document.getElementById('emailComposer').style.display = 'block';
    document.getElementById('composerTitle').textContent = `Compor Email ${langLabel} - ${type === 'upsell' ? 'Upsell' : type === 'feedback' ? 'Feedback' : 'Career Path'}`;
    document.getElementById('emailSubject').value = t?.subject || '';
    document.getElementById('emailBody').value = t?.html || '';
    document.getElementById('recipientFilter').value = 'all';
    document.getElementById('recipientSearch').value = '';

    renderRecipientList();
}

function closeComposer() { document.getElementById('emailComposer').style.display = 'none'; }

function previewEmail() {
    const html = document.getElementById('emailBody').value;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
}

async function sendNurturingEmails() {
    const recipients = getSelectedRecipients();
    if (recipients.length === 0) { showToast('Seleciona pelo menos um destinat\u00e1rio', 'danger'); return; }

    const subject = document.getElementById('emailSubject').value;
    const html = document.getElementById('emailBody').value;
    const type = window._nurturingType || 'custom';

    if (!confirm(`Enviar email para ${recipients.length} destinat\u00e1rio(s)?`)) return;

    let sent = 0, errors = 0;
    for (const email of recipients) {
        try {
            await sendBrevoEmail(email, subject, html, type);
            sent++;
            const item = document.querySelector(`#recipientList .recipient-item[data-email="${email}"]`);
            if (item) { item.classList.add('sent'); const cb = item.querySelector('input[type=checkbox]'); if (cb) cb.checked = false; }
        } catch (e) { errors++; console.error(`Erro ao enviar para ${email}:`, e); }
        await new Promise(r => setTimeout(r, 1000));
    }

    await loadEmailHistory();
    renderRecipientList();
    updateSelectedCount();
    showToast(`${sent} email(s) enviado(s), ${errors} erro(s)`, errors > 0 ? 'warning' : 'success');
}

// ===================== BREVO API =====================
async function sendBrevoEmail(to, subject, htmlContent, campaignType = 'custom') {
    if (!ensureBrevoKey()) throw new Error('No Brevo key');
    const key = localStorage.getItem('s2i_brevo_key') || BREVO_KEY;
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: BREVO_SENDER, to: [{ email: to }], subject, htmlContent })
    });
    const status = res.ok ? 'sent' : 'error';
    const errorMsg = res.ok ? null : `HTTP ${res.status}`;
    await logEmailHistory(to, null, subject, campaignType, status, errorMsg);
    if (!res.ok) throw new Error(`Brevo error: ${res.status}`);
    return res.json();
}

async function logEmailHistory(email, name, subject, campaignType, status = 'sent', errorMsg = null) {
    try {
        await supaInsert('email_history', { recipient_email: email, recipient_name: name, subject, campaign_type: campaignType, status, error_message: errorMsg });
    } catch (err) { console.error('Failed to log email history:', err); }
}

// ===================== HISTORY TAB =====================
function filterHistory() {
    const campaign = document.getElementById('filterHistoryCampaign').value;
    const email = document.getElementById('filterHistoryEmail').value.toLowerCase();
    const dateFrom = document.getElementById('filterHistoryDateFrom').value;
    const dateTo = document.getElementById('filterHistoryDateTo').value;
    let filtered = allEmailHistory.filter(h => {
        if (campaign !== 'all' && h.campaign_type !== campaign) return false;
        if (email && !h.recipient_email.toLowerCase().includes(email)) return false;
        if (dateFrom && new Date(h.sent_at) < new Date(dateFrom)) return false;
        if (dateTo && new Date(h.sent_at) > new Date(dateTo + 'T23:59:59')) return false;
        return true;
    });
    renderHistory(filtered);
}

function renderHistory(filtered = null) {
    const data = filtered || allEmailHistory;
    const tbody = document.getElementById('historyTable');
    const count = document.getElementById('historyCount');
    if (!Array.isArray(data) || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Nenhum email enviado ainda</td></tr>';
        count.textContent = '0 emails';
        return;
    }
    tbody.innerHTML = data.map(h => {
        const date = new Date(h.sent_at).toLocaleString('pt-PT');
        const statusBadge = h.status === 'sent' ? '<span class="badge badge-success">Enviado</span>' : `<span class="badge badge-danger" title="${h.error_message || ''}">Erro</span>`;
        const campaignBadge = { 'upsell': '<span class="badge badge-paid">Upsell</span>', 'feedback': '<span class="badge badge-free">Feedback</span>', 'careerpath': '<span class="badge badge-career">Career Path</span>', 'voucher': '<span class="badge badge-voucher">Vouchers</span>', 'custom': '<span class="badge badge-secondary">Personalizado</span>' }[h.campaign_type] || '<span class="badge badge-secondary">-</span>';
        return `<tr><td>${date}</td><td>${h.recipient_email}${h.recipient_name ? `<br><small class="text-muted">${h.recipient_name}</small>` : ''}</td><td>${h.subject}</td><td>${campaignBadge}</td><td>${statusBadge}</td></tr>`;
    }).join('');
    count.textContent = `${data.length} email(s)`;
}

function exportHistoryCSV() {
    const headers = 'Data,Destinat\u00e1rio,Nome,Assunto,Campanha,Estado,Erro\n';
    const rows = allEmailHistory.map(h => `"${new Date(h.sent_at).toLocaleString('pt-PT')}","${h.recipient_email}","${h.recipient_name || ''}","${h.subject}","${h.campaign_type}","${h.status}","${h.error_message || ''}"`).join('\n');
    downloadCSV(headers + rows, `email_history_${new Date().toISOString().split('T')[0]}.csv`);
}

// ===================== CONTACTS =====================
let contactsData = [];
let currentContactId = null;

async function loadContacts() {
    try {
        const data = await supaFetch('contact_messages', 'select=*&order=created_at.desc');
        contactsData = data || [];
        updateContactKPIs();
        populateContactSubjectFilter();
        renderContacts();
    } catch (e) {
        console.error('Erro ao carregar contactos:', e);
        document.getElementById('contactsTable').innerHTML = '<tr><td colspan="8" class="text-center text-danger py-3">Erro ao carregar mensagens</td></tr>';
    }
}

function updateContactKPIs() {
    const total = contactsData.length;
    document.getElementById('kpiContactsTotal').textContent = total;
    document.getElementById('kpiContactsNew').textContent = contactsData.filter(c => c.status === 'novo').length;
    document.getElementById('kpiContactsRead').textContent = contactsData.filter(c => c.status === 'lido').length;
    document.getElementById('kpiContactsReplied').textContent = contactsData.filter(c => c.status === 'respondido').length;
}

function populateContactSubjectFilter() {
    const sel = document.getElementById('filterContactSubject');
    const subjects = [...new Set(contactsData.map(c => c.subject).filter(Boolean))];
    sel.innerHTML = '<option value="all">Todos os motivos</option>' + subjects.map(s => `<option value="${s}">${s}</option>`).join('');
}

function renderContacts() {
    const statusFilter = document.getElementById('filterContactStatus').value;
    const subjectFilter = document.getElementById('filterContactSubject').value;
    const search = document.getElementById('filterContactSearch').value.toLowerCase();
    let filtered = contactsData.filter(c => {
        if (statusFilter !== 'all' && c.status !== statusFilter) return false;
        if (subjectFilter !== 'all' && c.subject !== subjectFilter) return false;
        if (search && !c.name.toLowerCase().includes(search) && !c.email.toLowerCase().includes(search) && !c.message.toLowerCase().includes(search)) return false;
        return true;
    });
    const tbody = document.getElementById('contactsTable');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">Nenhuma mensagem encontrada</td></tr>';
        document.getElementById('contactsCount').textContent = '0 mensagens';
        return;
    }
    tbody.innerHTML = filtered.map(c => {
        const date = new Date(c.created_at);
        const dateStr = date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' });
        const timeStr = date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
        const statusBadge = c.status === 'novo' ? '<span class="badge badge-danger">Novo</span>' : c.status === 'lido' ? '<span class="badge badge-warning">Lido</span>' : '<span class="badge badge-success">Respondido</span>';
        const msgPreview = c.message.length > 60 ? c.message.substring(0, 60) + '...' : c.message;
        const isNew = c.status === 'novo';
        return `<tr style="${isNew ? 'font-weight:600;background:#fffbf0;' : ''}cursor:pointer;" onclick="openContactDetail(${c.id})">
            <td>${isNew ? '<i class="fas fa-circle" style="color:var(--red);font-size:8px;"></i>' : ''}</td>
            <td><small>${dateStr}<br><span class="text-muted">${timeStr}</span></small></td>
            <td>${c.name}</td>
            <td><small>${c.email}</small></td>
            <td><small>${c.subject || '-'}</small></td>
            <td><small class="text-muted">${msgPreview}</small></td>
            <td>${statusBadge}</td>
            <td><button class="btn btn-sm btn-icon" onclick="event.stopPropagation();replyToContact('${c.email}','${c.name}')" title="Responder"><i class="fas fa-reply"></i></button></td>
        </tr>`;
    }).join('');
    document.getElementById('contactsCount').textContent = `${filtered.length} de ${contactsData.length} mensagens`;
}

async function openContactDetail(id) {
    currentContactId = id;
    const c = contactsData.find(x => x.id === id);
    if (!c) return;
    if (c.status === 'novo') {
        try {
            await supaUpdate('contact_messages', id, { status: 'lido', read_at: new Date().toISOString() });
            c.status = 'lido'; c.read_at = new Date().toISOString();
            updateContactKPIs(); renderContacts();
        } catch (e) { console.error(e); }
    }
    const date = new Date(c.created_at);
    document.getElementById('contactDetailTitle').textContent = `${c.subject || 'Mensagem'} \u2014 ${c.name}`;
    document.getElementById('contactDetailBody').innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:1rem;">
            <div><small class="text-muted d-block">Nome</small><strong>${c.name}</strong></div>
            <div><small class="text-muted d-block">Email</small><a href="mailto:${c.email}">${c.email}</a></div>
            <div><small class="text-muted d-block">Telefone</small>${c.phone || 'N\u00e3o fornecido'}</div>
            <div><small class="text-muted d-block">Data</small>${date.toLocaleDateString('pt-PT')} ${date.toLocaleTimeString('pt-PT')}</div>
        </div>
        <div style="background:#f8f8f8;border-left:3px solid var(--gold);padding:16px;border-radius:0 8px 8px 0;margin-bottom:1rem;">
            <small class="text-muted d-block mb-1">Mensagem</small>
            <p style="margin:0;white-space:pre-wrap;line-height:1.6;">${c.message}</p>
        </div>`;
    document.getElementById('contactDetailNotes').value = c.admin_notes || '';
    document.getElementById('contactDetailOverlay').style.display = 'flex';
}

function closeContactDetail() { document.getElementById('contactDetailOverlay').style.display = 'none'; currentContactId = null; }

async function markContactReplied() {
    if (!currentContactId) return;
    try {
        const notes = document.getElementById('contactDetailNotes').value;
        await supaUpdate('contact_messages', currentContactId, { status: 'respondido', replied_at: new Date().toISOString(), admin_notes: notes });
        const c = contactsData.find(x => x.id === currentContactId);
        if (c) { c.status = 'respondido'; c.replied_at = new Date().toISOString(); c.admin_notes = notes; }
        updateContactKPIs(); renderContacts(); closeContactDetail();
        showToast('Marcado como respondido', 'success');
    } catch (e) { showToast('Erro ao atualizar: ' + e.message, 'danger'); }
}

async function saveContactNotes() {
    if (!currentContactId) return;
    try {
        const notes = document.getElementById('contactDetailNotes').value;
        await supaUpdate('contact_messages', currentContactId, { admin_notes: notes });
        const c = contactsData.find(x => x.id === currentContactId);
        if (c) c.admin_notes = notes;
        showToast('Notas guardadas', 'success');
    } catch (e) { showToast('Erro ao guardar: ' + e.message, 'danger'); }
}

function replyToContact(email, name) {
    document.getElementById('emailModalOverlay').style.display = 'flex';
    document.getElementById('modalEmailTo').value = email;
    document.getElementById('modalEmailSubject').value = `Re: A sua mensagem - Share2Inspire`;
    document.getElementById('modalEmailBody').value = `Ol\u00e1 ${name},\n\nObrigado por nos ter contactado.\n\n\n\nCom os melhores cumprimentos,\nShare2Inspire`;
    document.getElementById('modalEmailTemplate').value = 'custom';
}

function exportContactsCSV() {
    if (!contactsData.length) return;
    const headers = ['Data','Nome','Email','Telefone','Motivo','Mensagem','Estado','Notas'];
    const rows = contactsData.map(c => [new Date(c.created_at).toLocaleDateString('pt-PT'), c.name, c.email, c.phone || '', c.subject || '', c.message.replace(/[\n\r]/g,' '), c.status, (c.admin_notes || '').replace(/[\n\r]/g,' ')]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `contactos_share2inspire_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
}

// ===================== HEALTH TAB =====================
function renderHealth() {
    if (allHealthLogs.length === 0) {
        document.getElementById('endpointStatus').innerHTML = '<p class="text-muted text-center">Sem dados de monitoriza\u00e7\u00e3o dispon\u00edveis.</p>';
        return;
    }

    const now = new Date();
    const h24 = allHealthLogs.filter(l => (now - new Date(l.checked_at)) < 86400000);
    const d7 = allHealthLogs.filter(l => (now - new Date(l.checked_at)) < 604800000);

    // Average TTFB (24h)
    const avgTTFB = h24.length > 0 ? (h24.reduce((s,l) => s + (l.ttfb_seconds || 0), 0) / h24.length).toFixed(2) : 'N/A';
    document.getElementById('healthAvgTTFB').textContent = avgTTFB !== 'N/A' ? `${avgTTFB}s` : 'N/A';

    // Uptime (7d)
    const healthyCount = d7.filter(l => l.status === 'healthy').length;
    const uptime = d7.length > 0 ? ((healthyCount / d7.length) * 100).toFixed(1) : 'N/A';
    document.getElementById('healthUptime').textContent = uptime !== 'N/A' ? `${uptime}%` : 'N/A';

    // Alerts (7d)
    const alerts = d7.filter(l => l.status !== 'healthy').length;
    document.getElementById('healthAlerts').textContent = alerts;

    // Last check
    const lastCheck = allHealthLogs[0];
    document.getElementById('healthLastCheck').textContent = lastCheck ? new Date(lastCheck.checked_at).toLocaleTimeString('pt-PT') : '--';

    // Endpoint status - group by endpoint_name, show latest status
    const endpoints = {};
    allHealthLogs.forEach(l => {
        if (!endpoints[l.endpoint_name]) endpoints[l.endpoint_name] = l;
    });

    document.getElementById('endpointStatus').innerHTML = `<div class="table-wrap"><table>
        <thead><tr><th>Endpoint</th><th>Estado</th><th>TTFB</th><th>HTTP</th><th>\u00daltimo Check</th></tr></thead>
        <tbody>${Object.values(endpoints).map(e => {
            const dotClass = e.status === 'healthy' ? 'healthy' : e.status === 'warning' ? 'warning' : e.status === 'critical' ? 'critical' : 'down';
            const statusLabel = e.status === 'healthy' ? 'Saud\u00e1vel' : e.status === 'warning' ? 'Aviso' : e.status === 'critical' ? 'Cr\u00edtico' : 'Em baixo';
            return `<tr>
                <td><strong>${e.endpoint_name}</strong><br><small class="text-muted">${e.endpoint_url || ''}</small></td>
                <td><span class="health-status"><span class="health-dot ${dotClass}"></span>${statusLabel}</span></td>
                <td>${e.ttfb_seconds ? e.ttfb_seconds.toFixed(3) + 's' : '-'}</td>
                <td>${e.http_status || '-'}</td>
                <td>${new Date(e.checked_at).toLocaleString('pt-PT')}</td>
            </tr>`;
        }).join('')}</tbody></table></div>`;

    // TTFB chart
    updateTTFBChart();
}

function updateTTFBChart() {
    // Group health logs by hour for the last 24h
    const now = new Date();
    const h24 = allHealthLogs.filter(l => (now - new Date(l.checked_at)) < 86400000);
    
    // Get unique endpoints
    const endpointNames = [...new Set(h24.map(l => l.endpoint_name))];
    const colors = ['#BF9A33', '#28a745', '#3498db', '#dc3545', '#7c3aed'];
    
    // Group by hour
    const hours = {};
    for (let i = 23; i >= 0; i--) {
        const d = new Date(now);
        d.setHours(d.getHours() - i, 0, 0, 0);
        hours[d.toISOString().slice(0, 13)] = {};
    }
    
    h24.forEach(l => {
        const hourKey = new Date(l.checked_at).toISOString().slice(0, 13);
        if (hours[hourKey]) {
            if (!hours[hourKey][l.endpoint_name]) hours[hourKey][l.endpoint_name] = [];
            hours[hourKey][l.endpoint_name].push(l.ttfb_seconds || 0);
        }
    });

    const labels = Object.keys(hours).map(h => h.slice(11, 13) + ':00');
    const datasets = endpointNames.slice(0, 5).map((name, i) => ({
        label: name,
        data: Object.values(hours).map(h => {
            const vals = h[name];
            return vals && vals.length > 0 ? (vals.reduce((a,b) => a+b, 0) / vals.length) : null;
        }),
        borderColor: colors[i % colors.length],
        backgroundColor: colors[i % colors.length] + '20',
        fill: false,
        tension: 0.3,
        spanGaps: true
    }));

    if (ttfbChart) ttfbChart.destroy();
    ttfbChart = new Chart(document.getElementById('ttfbChart').getContext('2d'), {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true, title: { display: true, text: 'TTFB (s)' } } }
        }
    });
}

// ===================== UTILITIES =====================
function switchTab(tab, btn) {
    document.querySelectorAll('[id^="tab-"]').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tab).style.display = 'block';
    btn.classList.add('active');

    if (tab === 'analyses') renderAnalyses();
    if (tab === 'vouchers') renderVouchers();
    if (tab === 'history') renderHistory();
    if (tab === 'contacts') loadContacts();
    if (tab === 'health') { loadHealthLogs().then(renderHealth); }
    if (tab === 'ebook') { loadEbookDownloads(); }
    if (tab === 'jobsearch') { loadJobSearchData(); }
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    const typeMap = { success: 'success', danger: 'danger', info: 'info', warning: 'danger' };
    toast.className = `toast toast-${typeMap[type] || 'info'}`;
    toast.innerHTML = `<span>${msg}</span><button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;margin-left:12px;font-size:14px;color:inherit;opacity:.6;">&times;</button>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    URL.revokeObjectURL(url); a.remove();
}

// ===================== INIT =====================
async function refreshAll() {
    document.getElementById('lastUpdate').textContent = 'A atualizar...';
    await Promise.all([loadAllData(), loadEmailHistory()]);
    updateDashboard();
    renderAnalyses();
    renderVouchers();
    renderHistory();
    document.getElementById('lastUpdate').textContent = `\u00daltima atualiza\u00e7\u00e3o: ${new Date().toLocaleTimeString('pt-PT')}`;
}

// Supabase Realtime
function initRealtime() {
    const wsUrl = SUPABASE_URL.replace('https://', 'wss://') + '/realtime/v1/websocket?apikey=' + SUPABASE_KEY + '&vsn=1.0.0';
    let ws;
    let reconnectDelay = 3000;

    function connect() {
        ws = new WebSocket(wsUrl);
        ws.onopen = () => {
            reconnectDelay = 3000;
            ws.send(JSON.stringify({ topic: 'realtime:public:cv_analysis', event: 'phx_join', payload: { config: { broadcast: { self: true }, presence: { key: '' }, postgres_changes: [{ event: '*', schema: 'public', table: 'cv_analysis' }] } }, ref: '1' }));
            ws.send(JSON.stringify({ topic: 'realtime:public:vouchers', event: 'phx_join', payload: { config: { broadcast: { self: true }, presence: { key: '' }, postgres_changes: [{ event: '*', schema: 'public', table: 'vouchers' }] } }, ref: '2' }));
            ws.send(JSON.stringify({ topic: 'realtime:public:contact_messages', event: 'phx_join', payload: { config: { broadcast: { self: true }, presence: { key: '' }, postgres_changes: [{ event: '*', schema: 'public', table: 'contact_messages' }] } }, ref: '3' }));
            document.getElementById('lastUpdate').textContent += ' \u00b7 \ud83d\udfe2 Live';
        };
        ws.onmessage = (evt) => {
            try {
                const msg = JSON.parse(evt.data);
                if (msg.event === 'postgres_changes' || (msg.payload && msg.payload.data)) {
                    loadAllData().then(() => { updateDashboard(); renderAnalyses(); renderVouchers(); document.getElementById('lastUpdate').textContent = `\u00daltima actualiza\u00e7\u00e3o: ${new Date().toLocaleTimeString('pt-PT')} \u00b7 \ud83d\udfe2 Live`; });
                }
            } catch(e) {}
        };
        ws.onclose = () => {
            document.getElementById('lastUpdate').textContent = document.getElementById('lastUpdate').textContent.replace(' \u00b7 \ud83d\udfe2 Live', ' \u00b7 \ud83d\udd34 Reconectar...');
            setTimeout(connect, reconnectDelay);
            reconnectDelay = Math.min(reconnectDelay * 2, 30000);
        };
        ws.onerror = () => ws.close();
    }
    connect();
}

// ===================== E-BOOK DOWNLOADS =====================
let allEbookDownloads = [];

async function loadEbookDownloads() {
    try {
        const data = await supaFetch('newsletter_subscribers', 'select=*&or=(source.eq.ebook_energia_liderar,source.eq.conhecimento)&order=subscribed_at.desc');
        allEbookDownloads = data || [];
        renderEbookDownloads();
    } catch(e) {
        console.error('Erro ao carregar e-book downloads:', e);
        document.getElementById('ebookTable').innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--red);">Erro ao carregar dados</td></tr>';
    }
}

function renderEbookDownloads() {
    const sourceFilter = document.getElementById('filterEbookSource').value;
    const periodFilter = document.getElementById('filterEbookPeriod').value;
    const search = document.getElementById('filterEbookSearch').value.toLowerCase().trim();
    const now = new Date();
    const h24 = new Date(now - 24*60*60*1000);
    const d7 = new Date(now - 7*24*60*60*1000);
    const d30 = new Date(now - 30*24*60*60*1000);
    const d90 = new Date(now - 90*24*60*60*1000);

    // KPIs
    const total = allEbookDownloads.length;
    const last24h = allEbookDownloads.filter(d => new Date(d.subscribed_at) >= h24).length;
    const last7d = allEbookDownloads.filter(d => new Date(d.subscribed_at) >= d7).length;
    const last30d = allEbookDownloads.filter(d => new Date(d.subscribed_at) >= d30).length;
    document.getElementById('kpiEbookTotal').textContent = total;
    document.getElementById('kpiEbook24h').textContent = last24h;
    document.getElementById('kpiEbook7d').textContent = last7d;
    document.getElementById('kpiEbook30d').textContent = last30d;

    // Filter
    let filtered = [...allEbookDownloads];
    if (sourceFilter !== 'all') filtered = filtered.filter(d => d.source === sourceFilter);
    if (periodFilter === '7d') filtered = filtered.filter(d => new Date(d.subscribed_at) >= d7);
    else if (periodFilter === '30d') filtered = filtered.filter(d => new Date(d.subscribed_at) >= d30);
    else if (periodFilter === '90d') filtered = filtered.filter(d => new Date(d.subscribed_at) >= d90);
    if (search) filtered = filtered.filter(d => (d.email || '').toLowerCase().includes(search) || (d.name || '').toLowerCase().includes(search));

    document.getElementById('ebookCount').textContent = filtered.length + ' registo' + (filtered.length !== 1 ? 's' : '');

    const tbody = document.getElementById('ebookTable');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted);">Sem registos</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(d => {
        const date = new Date(d.subscribed_at);
        const dateStr = date.toLocaleDateString('pt-PT') + ' ' + date.toLocaleTimeString('pt-PT', {hour:'2-digit',minute:'2-digit'});
        const sourceLabel = d.source === 'ebook_energia_liderar' ? '<span style="color:var(--gold);font-weight:500;">E-book</span>' : '<span style="color:var(--blue);">Conhecimento</span>';
        const statusBadge = d.status === 'active' ? '<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500;background:rgba(16,185,129,0.1);color:var(--green);">Ativo</span>' : '<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500;background:rgba(239,68,68,0.1);color:var(--red);">' + (d.status || 'N/A') + '</span>';
        return `<tr><td style="font-size:12px;color:var(--text-muted);white-space:nowrap;">${dateStr}</td><td style="font-weight:500;">${d.email || '-'}</td><td>${d.name || '-'}</td><td>${sourceLabel}</td><td>${statusBadge}</td></tr>`;
    }).join('');
}

function exportEbookCSV() {
    if (!allEbookDownloads.length) return showToast('Sem dados para exportar', 'info');
    const header = 'Data,Email,Nome,Source,Estado';
    const rows = allEbookDownloads.map(d => {
        const date = new Date(d.subscribed_at).toISOString();
        return `${date},${d.email || ''},${d.name || ''},${d.source || ''},${d.status || ''}`;
    });
    downloadCSV(header + '\n' + rows.join('\n'), 'ebook_downloads_' + new Date().toISOString().slice(0,10) + '.csv');
    showToast('CSV exportado com sucesso', 'success');
}

// ===================== JOB SEARCH TRACKING =====================
let allJobSearchData = [];
let jobChartTopRoles = null;
let jobChartSeniority = null;
let jobChartTopSkills = null;
let jobChartKeywordGaps = null;
let jobChartDaily = null;
let jobChartLanguage = null;

async function loadJobSearchData() {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/job_search_tracking?select=*&order=created_at.desc&limit=5000`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        if (!res.ok) throw new Error('Fetch failed');
        allJobSearchData = await res.json();
        renderJobSearchKPIs();
        renderJobSearchCharts();
        renderJobSearchTable();
        populateJobFilters();
    } catch (e) {
        console.error('Error loading job search data:', e);
        showToast('Erro ao carregar dados de cargos', 'danger');
    }
}

function renderJobSearchKPIs() {
    const data = allJobSearchData;
    const withJob = data.filter(d => d.job_title && d.job_title !== 'N/A');
    const noJob = data.filter(d => !d.job_title || d.job_title === 'N/A');
    const uniqueRoles = new Set(data.map(d => (d.detected_role || '').toLowerCase()).filter(r => r && r !== 'n/a'));
    const now = new Date();
    const week = data.filter(d => (now - new Date(d.created_at)) < 7 * 86400000);

    document.getElementById('kpiJobTotal').textContent = data.length;
    document.getElementById('kpiJobWithJob').textContent = withJob.length;
    document.getElementById('kpiJobNoJob').textContent = noJob.length;
    document.getElementById('kpiJobUniqueRoles').textContent = uniqueRoles.size;
    document.getElementById('kpiJob7d').textContent = week.length;
}

function renderJobSearchCharts() {
    const data = allJobSearchData;

    // Top 10 Roles
    const roleCounts = {};
    data.forEach(d => {
        const role = d.detected_role || 'N/A';
        if (role !== 'N/A') roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    const topRoles = Object.entries(roleCounts).sort((a,b) => b[1]-a[1]).slice(0, 10);
    if (jobChartTopRoles) jobChartTopRoles.destroy();
    jobChartTopRoles = new Chart(document.getElementById('chartTopRoles'), {
        type: 'bar',
        data: {
            labels: topRoles.map(r => r[0].length > 25 ? r[0].substring(0,25)+'...' : r[0]),
            datasets: [{ label: 'Pesquisas', data: topRoles.map(r => r[1]), backgroundColor: '#C9A961', borderRadius: 6 }]
        },
        options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } }
    });

    // Seniority Distribution
    const senCounts = {};
    data.forEach(d => { const s = d.seniority || 'N/A'; senCounts[s] = (senCounts[s] || 0) + 1; });
    if (jobChartSeniority) jobChartSeniority.destroy();
    jobChartSeniority = new Chart(document.getElementById('chartSeniority'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(senCounts),
            datasets: [{ data: Object.values(senCounts), backgroundColor: ['#C9A961','#3B82F6','#10B981','#7C3AED','#F59E0B','#EF4444','#6B7280'] }]
        },
        options: { responsive: true, plugins: { legend: { position: 'right' } } }
    });

    // Top Skills
    const skillCounts = {};
    data.forEach(d => {
        const skills = Array.isArray(d.key_skills) ? d.key_skills : [];
        skills.forEach(s => { if (s) skillCounts[s] = (skillCounts[s] || 0) + 1; });
    });
    const topSkills = Object.entries(skillCounts).sort((a,b) => b[1]-a[1]).slice(0, 10);
    if (jobChartTopSkills) jobChartTopSkills.destroy();
    jobChartTopSkills = new Chart(document.getElementById('chartTopSkills'), {
        type: 'bar',
        data: {
            labels: topSkills.map(s => s[0].length > 25 ? s[0].substring(0,25)+'...' : s[0]),
            datasets: [{ label: 'Candidatos', data: topSkills.map(s => s[1]), backgroundColor: '#3B82F6', borderRadius: 6 }]
        },
        options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } }
    });

    // Top Keyword Gaps
    const gapCounts = {};
    data.forEach(d => {
        const gaps = Array.isArray(d.keyword_gaps) ? d.keyword_gaps : [];
        gaps.forEach(g => { if (g) gapCounts[g] = (gapCounts[g] || 0) + 1; });
    });
    const topGaps = Object.entries(gapCounts).sort((a,b) => b[1]-a[1]).slice(0, 10);
    if (jobChartKeywordGaps) jobChartKeywordGaps.destroy();
    jobChartKeywordGaps = new Chart(document.getElementById('chartKeywordGaps'), {
        type: 'bar',
        data: {
            labels: topGaps.map(g => g[0].length > 25 ? g[0].substring(0,25)+'...' : g[0]),
            datasets: [{ label: 'Gaps', data: topGaps.map(g => g[1]), backgroundColor: '#EF4444', borderRadius: 6 }]
        },
        options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } }
    });

    // Daily searches (last 30 days)
    const dailyCounts = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        dailyCounts[d.toISOString().slice(0,10)] = 0;
    }
    data.forEach(d => {
        const day = new Date(d.created_at).toISOString().slice(0,10);
        if (dailyCounts[day] !== undefined) dailyCounts[day]++;
    });
    if (jobChartDaily) jobChartDaily.destroy();
    jobChartDaily = new Chart(document.getElementById('chartJobDaily'), {
        type: 'line',
        data: {
            labels: Object.keys(dailyCounts).map(d => d.slice(5)),
            datasets: [{ label: 'Pesquisas', data: Object.values(dailyCounts), borderColor: '#C9A961', backgroundColor: 'rgba(201,169,97,0.1)', fill: true, tension: 0.3 }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
    });

    // Language distribution
    const langCounts = {};
    data.forEach(d => { const l = (d.language || 'pt').toUpperCase(); langCounts[l] = (langCounts[l] || 0) + 1; });
    if (jobChartLanguage) jobChartLanguage.destroy();
    jobChartLanguage = new Chart(document.getElementById('chartJobLanguage'), {
        type: 'pie',
        data: {
            labels: Object.keys(langCounts),
            datasets: [{ data: Object.values(langCounts), backgroundColor: ['#C9A961','#3B82F6','#10B981','#7C3AED'] }]
        },
        options: { responsive: true, plugins: { legend: { position: 'right' } } }
    });
}

function populateJobFilters() {
    const senSet = new Set(allJobSearchData.map(d => d.seniority || 'N/A'));
    const sel = document.getElementById('filterJobSeniority');
    sel.innerHTML = '<option value="all">Todas</option>';
    [...senSet].sort().forEach(s => {
        sel.innerHTML += `<option value="${s}">${s}</option>`;
    });
}

function renderJobSearchTable() {
    const senFilter = document.getElementById('filterJobSeniority').value;
    const periodFilter = document.getElementById('filterJobPeriod').value;
    const typeFilter = document.getElementById('filterJobType').value;
    const searchFilter = (document.getElementById('filterJobSearch').value || '').toLowerCase();
    const now = new Date();

    let filtered = allJobSearchData.filter(d => {
        if (senFilter !== 'all' && d.seniority !== senFilter) return false;
        if (periodFilter !== 'all') {
            const days = periodFilter === '7d' ? 7 : periodFilter === '30d' ? 30 : 90;
            if ((now - new Date(d.created_at)) > days * 86400000) return false;
        }
        if (typeFilter === 'with_job' && (!d.job_title || d.job_title === 'N/A')) return false;
        if (typeFilter === 'no_job' && d.job_title && d.job_title !== 'N/A') return false;
        if (searchFilter) {
            const text = `${d.candidate_name} ${d.detected_role} ${d.job_title}`.toLowerCase();
            if (!text.includes(searchFilter)) return false;
        }
        return true;
    });

    document.getElementById('jobSearchCount').textContent = `${filtered.length} registos`;

    const tbody = document.getElementById('jobSearchTable');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">Sem dados</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.slice(0, 100).map(d => {
        const date = new Date(d.created_at).toLocaleDateString('pt-PT', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
        const skills = Array.isArray(d.key_skills) ? d.key_skills.slice(0,3).join(', ') : '';
        const gaps = Array.isArray(d.keyword_gaps) ? d.keyword_gaps.slice(0,3).join(', ') : '';
        const jobTitle = d.job_title && d.job_title !== 'N/A' ? `<span style="color:var(--green);">${d.job_title}</span>` : '<span style="color:var(--text-muted);">—</span>';
        const atsScore = d.ats_compatibility_score ? `<span style="font-weight:600;color:${d.ats_compatibility_score >= 70 ? 'var(--green)' : d.ats_compatibility_score >= 40 ? 'var(--orange)' : 'var(--red)'}">${d.ats_compatibility_score}%</span>` : '—';
        return `<tr>
            <td style="white-space:nowrap;font-size:12px;">${date}</td>
            <td>${d.candidate_name || 'N/A'}</td>
            <td><strong>${d.detected_role || 'N/A'}</strong></td>
            <td><span class="badge" style="background:var(--gold-bg);color:var(--gold);font-size:11px;padding:2px 8px;border-radius:4px;">${d.seniority || 'N/A'}</span></td>
            <td style="font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;">${skills || '—'}</td>
            <td>${jobTitle}</td>
            <td>${atsScore}</td>
            <td style="font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;color:var(--red);">${gaps || '—'}</td>
        </tr>`;
    }).join('');
}

function exportJobSearchCSV() {
    if (!allJobSearchData.length) { showToast('Sem dados para exportar', 'danger'); return; }
    const header = 'Data,Nome,Cargo Detetado,Senioridade,Anos Exp,Skills,Idioma,Vaga,ATS Score,Keyword Gaps,Overall Fit';
    const rows = allJobSearchData.map(d => {
        const date = new Date(d.created_at).toISOString().slice(0,19);
        const skills = Array.isArray(d.key_skills) ? d.key_skills.join(';') : '';
        const gaps = Array.isArray(d.keyword_gaps) ? d.keyword_gaps.join(';') : '';
        return `${date},"${d.candidate_name || ''}","${d.detected_role || ''}",${d.seniority || ''},${d.years_experience || ''},"${skills}",${d.language || ''},"${d.job_title || ''}",${d.ats_compatibility_score || ''},"${gaps}","${d.overall_fit || ''}"`;
    });
    downloadCSV(header + '\n' + rows.join('\n'), 'job_search_tracking_' + new Date().toISOString().slice(0,10) + '.csv');
    showToast('CSV exportado com sucesso', 'success');
}

document.addEventListener('DOMContentLoaded', () => {
    refreshAll();
    setInterval(refreshAll, 30000);
    initRealtime();
});
