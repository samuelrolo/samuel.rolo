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
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';

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

    // Verificar o utilizador com o token Supabase
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!userRes.ok) return false;
    const userData = await userRes.json();

    // Confirmar que o member_id corresponde ao utilizador do token
    if (!userData?.id || userData.id !== memberId) return false;

    // Verificar subscrição ativa e não expirada
    const subRes = await fetch(
      `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${memberId}&status=eq.active&select=expires_at`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!subRes.ok) return false;
    const subscriptions = await subRes.json();

    if (!Array.isArray(subscriptions) || subscriptions.length === 0) return false;

    const sub = subscriptions[0];
    if (!sub.expires_at) return false;

    const isValid = new Date(sub.expires_at) > new Date();
    if (!isValid) return false;

    // Tudo válido: definir flags de pagamento no sessionStorage
    // Estas são as mesmas flags que os fluxos existentes verificam
    sessionStorage.setItem('isPaid', 'true');
    sessionStorage.setItem('careerPathPaid', 'true');
    sessionStorage.setItem('isMember', 'true');
    sessionStorage.setItem('memberId', memberId);

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
