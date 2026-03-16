import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type UserProfile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  linkedin_url: string;
  cv_file_url: string;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan: 'monthly' | 'semiannual' | 'annual';
  status: 'active' | 'cancelled' | 'expired';
  amount_paid: number;
  start_date: string;
  end_date: string;
  created_at: string;
};

export type MemberContent = {
  id: string;
  title: string;
  description: string;
  type: 'ebook' | 'article' | 'template' | 'video' | 'tool';
  content_url: string;
  thumbnail_url: string;
  access_level: 'monthly' | 'semiannual' | 'annual';
  created_at: string;
};
