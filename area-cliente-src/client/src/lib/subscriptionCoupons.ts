const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__ || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
const PENDING_SUBSCRIPTION_COUPON_KEY = 's2iPendingSubscriptionCoupon';

export type SubscriptionCouponRow = {
  id: string;
  code: string;
  discount_percent: number;
  type: string;
  applicable_products: string[] | null;
  max_uses: number | null;
  current_uses: number | null;
  valid_from: string | null;
  valid_until: string | null;
  metadata?: Record<string, any> | null;
};

export type PendingSubscriptionCoupon = {
  code: string;
  discountPercent: number;
  type: string;
  applicableProducts: string[];
  validUntil: string | null;
  validatedAt: string;
  source: 'registration' | 'checkout';
};

export type SubscriptionCouponValidation = {
  valid: boolean;
  coupon: SubscriptionCouponRow | null;
  error: string | null;
};

function normalizeCode(code: string) {
  return String(code || '').trim().toUpperCase();
}

function extractPeriod(planStr: string): 'monthly' | 'semiannual' | 'annual' {
  if (planStr.includes('semiannual')) return 'semiannual';
  if (planStr.includes('annual')) return 'annual';
  return 'monthly';
}

function extractTier(planStr: string): 'essential' | 'growth' | 'pro' {
  if (planStr.includes('growth')) return 'growth';
  if (planStr.includes('pro')) return 'pro';
  return 'essential';
}

function getAllowedProducts(planStr?: string) {
  if (!planStr) {
    return ['all', 'subscription', 'essential_monthly', 'growth_monthly', 'pro_monthly'];
  }

  const normalizedPlan = String(planStr || '').toLowerCase();
  const tier = extractTier(normalizedPlan);
  const period = extractPeriod(normalizedPlan);

  return [
    'all',
    'subscription',
    normalizedPlan,
    tier,
    `${tier}_subscription`,
    `${tier}_${period}`,
  ].map((value) => value.toLowerCase());
}

export function supportsSubscriptionPlan(applicableProducts: string[] | null | undefined, planStr?: string) {
  const products = Array.isArray(applicableProducts)
    ? applicableProducts.map((value) => String(value || '').toLowerCase()).filter(Boolean)
    : [];

  if (products.length === 0) return true;

  const allowedProducts = getAllowedProducts(planStr);
  return products.some((product) => allowedProducts.includes(product));
}

export async function fetchSubscriptionCoupon(code: string) {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return null;

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/coupons?code=eq.${encodeURIComponent(normalizedCode)}&select=id,code,discount_percent,type,applicable_products,max_uses,current_uses,valid_from,valid_until,metadata`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Coupon lookup failed with status ${response.status}`);
  }

  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows[0] as SubscriptionCouponRow;
}

export function validateSubscriptionCouponRecord(coupon: SubscriptionCouponRow | null, planStr?: string): SubscriptionCouponValidation {
  if (!coupon) {
    return { valid: false, coupon: null, error: 'Código inválido ou expirado' };
  }

  const now = new Date();

  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return { valid: false, coupon, error: 'Este código ainda não está ativo.' };
  }

  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return { valid: false, coupon, error: 'Este código já expirou.' };
  }

  if (coupon.max_uses !== null && (coupon.current_uses || 0) >= coupon.max_uses) {
    return { valid: false, coupon, error: 'Este código já foi totalmente utilizado.' };
  }

  if (!supportsSubscriptionPlan(coupon.applicable_products, planStr)) {
    return { valid: false, coupon, error: 'Este código não é aplicável a este plano.' };
  }

  return { valid: true, coupon, error: null };
}

export async function validateSubscriptionCoupon(code: string, planStr?: string) {
  const coupon = await fetchSubscriptionCoupon(code);
  return validateSubscriptionCouponRecord(coupon, planStr);
}

export function buildPendingSubscriptionCoupon(coupon: SubscriptionCouponRow, source: PendingSubscriptionCoupon['source']): PendingSubscriptionCoupon {
  return {
    code: normalizeCode(coupon.code),
    discountPercent: Number(coupon.discount_percent || 0),
    type: String(coupon.type || 'subscription_first_month_free'),
    applicableProducts: Array.isArray(coupon.applicable_products) ? coupon.applicable_products : [],
    validUntil: coupon.valid_until || null,
    validatedAt: new Date().toISOString(),
    source,
  };
}

export function persistPendingSubscriptionCoupon(coupon: PendingSubscriptionCoupon) {
  const serialized = JSON.stringify(coupon);
  localStorage.setItem(PENDING_SUBSCRIPTION_COUPON_KEY, serialized);
  sessionStorage.setItem(PENDING_SUBSCRIPTION_COUPON_KEY, serialized);
}

export function getPendingSubscriptionCoupon(): PendingSubscriptionCoupon | null {
  const raw = localStorage.getItem(PENDING_SUBSCRIPTION_COUPON_KEY) || sessionStorage.getItem(PENDING_SUBSCRIPTION_COUPON_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PendingSubscriptionCoupon;
    if (!parsed?.code) {
      clearPendingSubscriptionCoupon();
      return null;
    }
    return parsed;
  } catch {
    clearPendingSubscriptionCoupon();
    return null;
  }
}

export function clearPendingSubscriptionCoupon() {
  localStorage.removeItem(PENDING_SUBSCRIPTION_COUPON_KEY);
  sessionStorage.removeItem(PENDING_SUBSCRIPTION_COUPON_KEY);
}

export async function incrementSubscriptionCouponUsage(code: string) {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return false;

  const coupon = await fetchSubscriptionCoupon(normalizedCode);
  if (!coupon) return false;

  const nextUses = (coupon.current_uses || 0) + 1;
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/coupons?id=eq.${coupon.id}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ current_uses: nextUses }),
    }
  );

  return response.ok;
}

export function isFirstMonthFreeCoupon(coupon: { discount_percent?: number; discountPercent?: number; type?: string } | null | undefined) {
  if (!coupon) return false;
  const type = String(coupon.type || '').toLowerCase();
  const percent = Number((coupon as any).discount_percent ?? (coupon as any).discountPercent ?? 0);
  return percent >= 100 || type === 'subscription_first_month_free' || type === 'first_month_free';
}
