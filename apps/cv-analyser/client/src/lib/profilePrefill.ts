export type AuthProfilePrefill = {
  email: string;
  linkedinUrl: string;
  cvUrl: string;
  cvFilename: string;
};

const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
const SUPABASE_STORAGE_KEY = 'sb-cvlumvgrbuolrnwrtrgz-auth-token';

function getStoredSession() {
  try {
    const storageKey = localStorage.getItem(SUPABASE_STORAGE_KEY)
      ? SUPABASE_STORAGE_KEY
      : Object.keys(localStorage).find(
          (key) => key.startsWith('sb-') && key.endsWith('-auth-token')
        );
    const stored = storageKey ? localStorage.getItem(storageKey) : null;
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    return parsed?.currentSession || parsed?.session || parsed;
  } catch {
    return null;
  }
}

function inferMimeType(filename: string, fallback?: string | null) {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (lower.endsWith('.doc')) return 'application/msword';
  if (lower.endsWith('.rtf')) return 'application/rtf';
  if (lower.endsWith('.txt')) return 'text/plain';
  return fallback || 'application/pdf';
}

function extractStoragePath(cvUrl: string | null | undefined, userId: string, filename: string) {
  const fallbackPath = `${userId}/${filename}`;
  if (!cvUrl) return fallbackPath;

  try {
    const url = new URL(cvUrl);
    const markers = [
      '/storage/v1/object/authenticated/user-cvs/',
      '/storage/v1/object/public/user-cvs/',
      '/storage/v1/object/sign/user-cvs/',
    ];

    for (const marker of markers) {
      const idx = url.pathname.indexOf(marker);
      if (idx >= 0) {
        const rawPath = url.pathname.slice(idx + marker.length);
        return decodeURIComponent(rawPath || fallbackPath);
      }
    }
  } catch {
    // If it is not a valid absolute URL, try best-effort parsing below.
  }

  const bucketHints = [
    '/storage/v1/object/authenticated/user-cvs/',
    '/storage/v1/object/public/user-cvs/',
    '/storage/v1/object/sign/user-cvs/',
    'user-cvs/',
  ];

  for (const hint of bucketHints) {
    const idx = cvUrl.indexOf(hint);
    if (idx >= 0) {
      const rawPath = cvUrl.slice(idx + hint.length).split('?')[0];
      return decodeURIComponent(rawPath || fallbackPath);
    }
  }

  return fallbackPath;
}

export async function getAuthenticatedProfilePrefill(): Promise<AuthProfilePrefill | null> {
  try {
    const session = getStoredSession();
    const accessToken = session?.access_token;
    const userId = session?.user?.id;

    if (!accessToken || !userId) return null;

    const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${userId}&select=email,linkedin_url,cv_url,cv_filename&limit=1`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileRes.ok) return null;

    const rows = await profileRes.json();
    const profile = rows?.[0];
    if (!profile) return null;

    return {
      email: profile.email || '',
      linkedinUrl: profile.linkedin_url || '',
      cvUrl: profile.cv_url || '',
      cvFilename: profile.cv_filename || '',
    };
  } catch {
    return null;
  }
}

export async function downloadAuthenticatedProfileCv(prefill?: AuthProfilePrefill | null): Promise<File> {
  const session = getStoredSession();
  const accessToken = session?.access_token;
  const userId = session?.user?.id;

  if (!accessToken || !userId) {
    throw new Error('NOT_AUTHENTICATED');
  }

  const profile = prefill ?? (await getAuthenticatedProfilePrefill());
  if (!profile?.cvFilename) {
    throw new Error('CV_NOT_FOUND');
  }

  const filePath = extractStoragePath(profile.cvUrl, userId, profile.cvFilename);
  const authenticatedUrl = `${SUPABASE_URL}/storage/v1/object/authenticated/user-cvs/${filePath}`;
  const res = await fetch(authenticatedUrl, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`CV_DOWNLOAD_FAILED_${res.status}`);
  }

  const blob = await res.blob();
  const type = inferMimeType(profile.cvFilename, blob.type);
  return new File([blob], profile.cvFilename, { type });
}
