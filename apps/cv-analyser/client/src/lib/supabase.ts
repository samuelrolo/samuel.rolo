import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
const STORAGE_KEY = 'sb-cvlumvgrbuolrnwrtrgz-auth-token';

const singleProcessLock = async <T>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<T>,
): Promise<T> => fn();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storageKey: STORAGE_KEY,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
    lock: singleProcessLock,
  },
});

export { SUPABASE_ANON_KEY, SUPABASE_URL, STORAGE_KEY as SUPABASE_STORAGE_KEY };
