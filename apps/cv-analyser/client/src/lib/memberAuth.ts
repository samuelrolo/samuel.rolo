/**
 * memberAuth.ts
 *
 * Verifica se o utilizador chegou com um token de membro válido (subscrição ativa no S2I Career Advisor).
 * Se válido, define automaticamente o estado de pagamento no sessionStorage,
 * permitindo que o utilizador aceda às ferramentas sem passar pelo fluxo de pagamento.
 *
 * IMPORTANTE: Este ficheiro NÃO altera nenhum fluxo de pagamento existente.
 * Apenas pré-define flags no sessionStorage que os fluxos já verificam.
 */

const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';

type MemberPlanTier = 'essential' | 'growth' | 'pro';

type MemberAccessResult = {
  valid: boolean;
  tier: MemberPlanTier | null;
};

function deriveMemberPlanTier(plan: string): MemberPlanTier {
  const planField = (plan || '').toLowerCase();
  if (planField.includes('pro') || planField === 'annual') return 'pro';
  if (planField.includes('growth') || planField === 'semiannual') return 'growth';
  return 'essential';
}

async function verifyStoredMemberAccess(token: string, memberId: string): Promise<MemberAccessResult> {
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!userRes.ok) return { valid: false, tier: null };
  const userData = await userRes.json();
  if (!userData?.id || userData.id !== memberId) return { valid: false, tier: null };

  const subRes = await fetch(
    `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${memberId}&status=eq.active&select=expires_at,plan`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!subRes.ok) return { valid: false, tier: null };
  const subscriptions = await subRes.json();
  if (!Array.isArray(subscriptions) || subscriptions.length === 0) return { valid: false, tier: null };

  const sub = subscriptions[0];
  if (!sub?.expires_at || new Date(sub.expires_at) <= new Date()) {
    return { valid: false, tier: null };
  }

  return { valid: true, tier: deriveMemberPlanTier(sub.plan || '') };
}

/**
 * Verifica o token de membro passado como parâmetro na URL.
 * Chama o Supabase para confirmar que o utilizador tem uma subscrição ativa e não expirada.
 * Se válido, define isPaid e careerPathPaid no sessionStorage.
 *
 * @returns true se o token é válido e a subscrição está ativa
 */
export async function checkMemberToken(): Promise<boolean> {
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('member_token');
    const memberId = params.get('member_id');

    if (!token || !memberId) return false;

    const verification = await verifyStoredMemberAccess(token, memberId);
    if (!verification.valid || !verification.tier) return false;

    const memberPlanTier = verification.tier;

    // Tudo válido: definir flags de pagamento no sessionStorage
    // Estas são as mesmas flags que os fluxos existentes verificam
    sessionStorage.setItem('isPaid', 'true');
    sessionStorage.setItem('careerPathPaid', 'true');
    sessionStorage.setItem('isMember', 'true');
    sessionStorage.setItem('memberId', memberId);
    sessionStorage.setItem('memberToken', token);
    sessionStorage.setItem('memberPlanTier', memberPlanTier);

    // Limpar os parâmetros da URL para não expor o token
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('member_token');
    cleanUrl.searchParams.delete('member_id');
    window.history.replaceState({}, '', cleanUrl.toString());

    return true;
  } catch {
    return false;
  }
}

/**
 * Verifica se o utilizador atual é um membro ativo (token já validado nesta sessão).
 */
export function isMemberSession(): boolean {
  return sessionStorage.getItem('isMember') === 'true';
}

/**
 * Retorna o tier do plano do membro: 'essential', 'growth', 'pro', ou null se não for membro.
 */
export function getMemberPlanTier(): 'essential' | 'growth' | 'pro' | null {
  if (!isMemberSession()) return null;
  const tier = sessionStorage.getItem('memberPlanTier');
  if (tier === 'pro' || tier === 'growth' || tier === 'essential') return tier;
  return 'essential';
}

export async function getValidatedMemberPlanTier(): Promise<MemberPlanTier | null> {
  const token = sessionStorage.getItem('memberToken');
  const memberId = sessionStorage.getItem('memberId');
  if (!token || !memberId) return null;

  try {
    const verification = await verifyStoredMemberAccess(token, memberId);
    if (!verification.valid || !verification.tier) {
      sessionStorage.removeItem('isMember');
      sessionStorage.removeItem('memberId');
      sessionStorage.removeItem('memberToken');
      sessionStorage.removeItem('memberPlanTier');
      return null;
    }

    sessionStorage.setItem('isMember', 'true');
    sessionStorage.setItem('memberPlanTier', verification.tier);
    return verification.tier;
  } catch {
    return null;
  }
}
