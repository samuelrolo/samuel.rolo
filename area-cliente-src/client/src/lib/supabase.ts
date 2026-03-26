import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type UserProfile = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  linkedin_url: string;
  avatar_url: string;
  cv_url: string;
  cv_filename: string;
  cv_uploaded_at: string;
  cv_file_url?: string;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  price_eur: number;
  started_at: string;
  expires_at: string;
  payment_method: string;
  payment_reference: string;
  created_at: string;
  updated_at: string;
};

export type MemberContent = {
  id: string;
  title: string;
  description: string;
  content_type: 'ebook' | 'article' | 'template' | 'video' | 'tool' | 'podcast';
  file_url: string;
  thumbnail_url: string | null;
  tags: string[] | null;
  is_published: boolean;
  required_plan: 'monthly' | 'semiannual' | 'annual';
  sort_order: number;
  created_at: string;
  updated_at: string;
};
