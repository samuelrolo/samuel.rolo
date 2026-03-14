// ═══════════════════════════════════════════════════════════════
//  Share2Inspire · Affiliate Tracking Module
//  Captura UTM ?ref=CODE, regista cliques detalhados e conversões
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';

// ── Device / Browser Detection ──────────────────────────────
function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return 'mobile';
  if (/Tablet|iPad/i.test(ua)) return 'tablet';
  return 'desktop';
}

function getBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('OPR') || ua.includes('Opera')) return 'Opera';
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  return 'Other';
}

function getOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS')) return 'macOS';
  if (ua.includes('Linux') && !ua.includes('Android')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Other';
}

function getScreenResolution(): string {
  return `${window.screen.width}x${window.screen.height}`;
}

function generateSessionId(): string {
  return `s_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

// ── Core Functions ──────────────────────────────────────────

/**
 * Initialise affiliate tracking on page load.
 * Reads ?ref=CODE (or ?aff=CODE, ?utm_affiliate=CODE) from URL,
 * stores in sessionStorage, and fires a click event to Supabase.
 * Should be called once in App.tsx or main.tsx.
 */
export async function initAffiliateTracking(): Promise<void> {
  try {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref') || params.get('aff') || params.get('utm_affiliate');

    if (refCode) {
      // Store affiliate code + session for later conversion attribution
      const sessionId = generateSessionId();
      sessionStorage.setItem('affiliate_code', refCode);
      sessionStorage.setItem('affiliate_session', sessionId);
      sessionStorage.setItem('affiliate_landing', window.location.pathname);

      // Fire-and-forget: register the click with full details
      const clickData = {
        affiliate_code: refCode,
        landing_page: window.location.pathname + window.location.search,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        device_type: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
        screen_resolution: getScreenResolution(),
        utm_source: params.get('utm_source') || null,
        utm_medium: params.get('utm_medium') || null,
        utm_campaign: params.get('utm_campaign') || null,
        session_id: sessionId,
      };

      // Resolve affiliate_id from code
      const affRes = await fetch(
        `${SUPABASE_URL}/rest/v1/affiliates?code=eq.${encodeURIComponent(refCode)}&select=id&limit=1`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const affData = await affRes.json();
      if (affData && affData.length > 0) {
        (clickData as any).affiliate_id = affData[0].id;
      }

      // Insert click record
      const clickRes = await fetch(`${SUPABASE_URL}/rest/v1/affiliate_clicks`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(clickData),
      });
      const clickResult = await clickRes.json();
      if (clickResult && clickResult.length > 0) {
        sessionStorage.setItem('affiliate_click_id', String(clickResult[0].id));
      }

      // Clean URL (remove ref param) without reload
      params.delete('ref');
      params.delete('aff');
      params.delete('utm_affiliate');
      const cleanUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
      window.history.replaceState({}, '', cleanUrl);
    }
  } catch (err) {
    // Silent — never block the user
    console.debug('[AFFILIATE] Tracking error:', err);
  }
}

/**
 * Get the current affiliate code from sessionStorage (if any).
 */
export function getAffiliateCode(): string | null {
  return sessionStorage.getItem('affiliate_code');
}

/**
 * Record an affiliate conversion (sale).
 * Call this after a successful payment.
 */
export async function trackAffiliateConversion(params: {
  product: string;
  amount: number;
  currency: string;
  payment_method: string;
  customer_email?: string;
  transaction_id?: string;
}): Promise<void> {
  try {
    const affiliateCode = sessionStorage.getItem('affiliate_code');
    if (!affiliateCode) return; // No affiliate — nothing to track

    const clickId = sessionStorage.getItem('affiliate_click_id');

    // Resolve affiliate_id
    let affiliateId: string | null = null;
    const affRes = await fetch(
      `${SUPABASE_URL}/rest/v1/affiliates?code=eq.${encodeURIComponent(affiliateCode)}&select=id&limit=1`,
      { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const affData = await affRes.json();
    if (affData && affData.length > 0) {
      affiliateId = affData[0].id;
    }

    const conversionData: any = {
      affiliate_code: affiliateCode,
      product: params.product,
      amount: params.amount,
      currency: params.currency,
      payment_method: params.payment_method,
      customer_email: params.customer_email || null,
      transaction_id: params.transaction_id || null,
    };

    if (affiliateId) conversionData.affiliate_id = affiliateId;
    if (clickId) conversionData.click_id = parseInt(clickId, 10);

    await fetch(`${SUPABASE_URL}/rest/v1/affiliate_conversions`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(conversionData),
    });
  } catch (err) {
    console.debug('[AFFILIATE] Conversion tracking error:', err);
  }
}
