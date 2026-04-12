import { supabase } from '@/lib/supabase';

type SavePayload = Record<string, any>;

type SaveOptions = {
  dedupId?: string;
};

const buildDedupId = (analysisType: string, data: SavePayload, customDedupId?: string) => {
  if (customDedupId) return customDedupId;

  const candidates = [
    sessionStorage.getItem('analysisId'),
    sessionStorage.getItem('paymentReference'),
    sessionStorage.getItem('paypalOrderId'),
    sessionStorage.getItem('stripeSessionId'),
    sessionStorage.getItem('bundleOrderId'),
    sessionStorage.getItem('careerPathOrderId'),
    sessionStorage.getItem('studentPackOrderId'),
    sessionStorage.getItem('paymentEmail'),
    data?.email,
    data?.linkedin_url,
    data?.jobUrl,
    data?.jobTitle,
    data?.career_goal,
  ].filter(Boolean);

  if (candidates.length > 0) return candidates.join('__');

  return `${window.location.pathname}__${analysisType}`;
};

const isAuthError = (error: any) => {
  const text = `${error?.code || ''} ${error?.name || ''} ${error?.message || ''}`.toLowerCase();
  return Boolean(
    error?.status === 401 ||
    text.includes('jwt') ||
    text.includes('token') ||
    text.includes('session') ||
    text.includes('unauthorized')
  );
};

export async function saveToUserAnalyses(
  analysisType: string,
  data: SavePayload,
  options: SaveOptions = {},
): Promise<boolean> {
  const dedupKey = `s2i_saved_${analysisType}_${buildDedupId(analysisType, data, options.dedupId)}`;
  if (sessionStorage.getItem(dedupKey)) return true;

  const nowIso = new Date().toISOString();

  let {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.warn('[S2I] Failed to read Supabase session:', sessionError);
  }

  if (!session) {
    throw new Error('NOT_LOGGED_IN');
  }

  const expiresAtMs = typeof session.expires_at === 'number' ? session.expires_at * 1000 : null;
  if (expiresAtMs && expiresAtMs <= Date.now() + 60_000) {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error || !refreshed.data.session) {
      console.warn('[S2I] Failed to refresh Supabase session:', refreshed.error);
      throw new Error('SESSION_EXPIRED');
    }
    session = refreshed.data.session;
  }

  const payload = {
    user_id: session.user.id,
    analysis_type: analysisType,
    data: {
      ...data,
      captured_at: nowIso,
    },
    created_at: nowIso,
  };

  const insertPayload = async () => supabase.from('user_analyses').insert(payload).select('id').single();

  let result = await insertPayload();

  if (result.error && isAuthError(result.error)) {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error || !refreshed.data.session) {
      console.warn('[S2I] Failed to refresh Supabase session after insert error:', refreshed.error || result.error);
      throw new Error('SESSION_EXPIRED');
    }

    result = await insertPayload();
  }

  if (result.error) {
    console.error('[S2I] Save to user_analyses failed:', result.error);

    if (result.error.code === '42501') {
      throw new Error('RLS_INSERT_DENIED');
    }

    if (isAuthError(result.error)) {
      throw new Error('SESSION_EXPIRED');
    }

    throw new Error(`SAVE_FAILED_${result.error.code || result.error.name || 'UNKNOWN'}`);
  }

  sessionStorage.setItem(dedupKey, 'true');
  console.log('[S2I] Analysis saved to user_analyses:', analysisType, result.data?.id || null);
  return true;
}
