// ═══════════════════════════════════════════════════════════════
//  Share2Inspire · Affiliate Tracking Module
//  Captura UTM ?ref=CODE, regista cliques detalhados e conversões
//  + Incrementa current_uses dos cupões de desconto
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

async function getGeoLocation(): Promise<{ country: string | null; city: string | null }> {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { country: null, city: null };
    const data = await res.json();
    return {
      country: data.country_name || data.country || null,
      city: data.city || null,
    };
  } catch {
    return { country: null, city: null };
  }
}

// ── Core Functions ──────────────────────────────────────────

/**
 * Initialise affiliate tracking on page load.
 * Reads ?ref=CODE (or ?aff=CODE, ?utm_affiliate=CODE) from URL,
 * stores in localStorage (survives Stripe redirects), and fires a click event to Supabase.
 * Should be called once in App.tsx or main.tsx.
 */
export async function initAffiliateTracking(): Promise<void> {
  try {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref') || params.get('aff') || params.get('utm_affiliate');

    if (refCode) {
      // Store affiliate code + session for later conversion attribution
      // Using localStorage so it survives Stripe/PayPal redirects
      const sessionId = generateSessionId();
      localStorage.setItem('affiliate_code', refCode);
      localStorage.setItem('affiliate_session', sessionId);
      localStorage.setItem('affiliate_landing', window.location.pathname);
      localStorage.setItem('affiliate_timestamp', String(Date.now()));

      // Also keep in sessionStorage for backward compat
      sessionStorage.setItem('affiliate_code', refCode);
      sessionStorage.setItem('affiliate_session', sessionId);
      sessionStorage.setItem('affiliate_landing', window.location.pathname);

      // Fetch geo location (country/city) from IP — silent fallback if unavailable
      const geo = await getGeoLocation();

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
        country: geo.country,
        city: geo.city,
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
        localStorage.setItem('affiliate_click_id', String(clickResult[0].id));
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
 * Get the current affiliate code from storage (if any).
 * Checks localStorage first (survives redirects), then sessionStorage.
 * Expires after 24 hours to avoid stale attribution.
 */
export function getAffiliateCode(): string | null {
  const code = localStorage.getItem('affiliate_code') || sessionStorage.getItem('affiliate_code');
  if (!code) return null;
  
  // Check if affiliate code is still fresh (24h window)
  const timestamp = localStorage.getItem('affiliate_timestamp');
  if (timestamp) {
    const age = Date.now() - parseInt(timestamp, 10);
    if (age > 24 * 60 * 60 * 1000) {
      // Expired — clean up
      localStorage.removeItem('affiliate_code');
      localStorage.removeItem('affiliate_session');
      localStorage.removeItem('affiliate_landing');
      localStorage.removeItem('affiliate_click_id');
      localStorage.removeItem('affiliate_timestamp');
      return null;
    }
  }
  return code;
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
    const affiliateCode = getAffiliateCode();
    if (!affiliateCode) return; // No affiliate — nothing to track

    const clickId = localStorage.getItem('affiliate_click_id') || sessionStorage.getItem('affiliate_click_id');

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

    const res = await fetch(`${SUPABASE_URL}/rest/v1/affiliate_conversions`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(conversionData),
    });
    
    if (res.ok) {
      console.debug('[AFFILIATE] Conversion tracked successfully:', affiliateCode, params.product, params.amount);
    } else {
      const errText = await res.text();
      console.debug('[AFFILIATE] Conversion tracking failed:', res.status, errText);
    }
  } catch (err) {
    console.debug('[AFFILIATE] Conversion tracking error:', err);
  }
}

const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';

/**
 * Increment the current_uses counter of a discount coupon after successful use.
 * Uses the backend /use-coupon endpoint (primary) with direct Supabase PATCH as fallback.
 * Call this after a coupon is successfully applied (100% discount or partial discount payment).
 */
export async function incrementCouponUsage(couponCode: string): Promise<void> {
  try {
    // Primary: use backend endpoint (handles deactivation when max_uses reached)
    const backendRes = await fetch(`${BACKEND_URL}/use-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode }),
    });
    
    if (backendRes.ok) {
      const result = await backendRes.json();
      console.debug(`[COUPON] Usage incremented via backend for ${couponCode}: ${result.current_uses}`);
      return;
    }
    
    // Fallback: direct Supabase PATCH if backend fails
    console.debug(`[COUPON] Backend failed (${backendRes.status}), falling back to direct Supabase PATCH`);
    const getRes = await fetch(
      `${SUPABASE_URL}/rest/v1/discount_coupons?code=eq.${encodeURIComponent(couponCode)}&select=id,current_uses`,
      { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const coupons = await getRes.json();
    if (!Array.isArray(coupons) || coupons.length === 0) return;
    
    const coupon = coupons[0];
    const newUses = (coupon.current_uses || 0) + 1;
    
    await fetch(
      `${SUPABASE_URL}/rest/v1/discount_coupons?id=eq.${coupon.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          current_uses: newUses,
          updated_at: new Date().toISOString()
        }),
      }
    );
    console.debug(`[COUPON] Usage incremented via Supabase for ${couponCode}: ${newUses}`);
  } catch (err) {
    console.debug('[COUPON] Increment error:', err);
  }
}
