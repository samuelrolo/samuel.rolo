export type AuthProfilePrefill = {
  email: string;
  linkedinUrl: string;
  cvUrl: string;
  cvFilename: string;
};

const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';

export async function getAuthenticatedProfilePrefill(): Promise<AuthProfilePrefill | null> {
  try {
    const storageKey = Object.keys(localStorage).find((key) => key.startsWith('sb-') && key.endsWith('-auth-token'));
    if (!storageKey) return null;

    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    const accessToken = parsed?.access_token;
    const userId = parsed?.user?.id;
    if (!accessToken || !userId) return null;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${userId}&select=cv_url,cv_filename,email,linkedin_url`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) return null;
    const rows = await res.json();
    const row = rows?.[0];
    if (!row) return null;

    return {
      email: row.email || '',
      linkedinUrl: row.linkedin_url || '',
      cvUrl: row.cv_url || '',
      cvFilename: row.cv_filename || '',
    };
  } catch {
    return null;
  }
}
