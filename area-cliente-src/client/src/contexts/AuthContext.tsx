import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, type UserProfile, type Subscription } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  subscription: Subscription | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
  hasActiveSubscription: () => boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
    return data;
  }

  async function fetchSubscription(userId: string) {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('expires_at', { ascending: false })
      .limit(1)
      .single();
    setSubscription(data);

    // Set sessionStorage flags so external tools (CV Analyser, Career Path, etc.)
    // on the same domain can detect member status and auto-unlock content
    if (data && data.status === 'active' && new Date(data.expires_at) > new Date()) {
      const plan = (data.plan || '').toLowerCase();
      const tier = plan.includes('pro') ? 'pro' : plan.includes('growth') ? 'growth' : 'essential';
      sessionStorage.setItem('isMember', 'true');
      sessionStorage.setItem('memberPlanTier', tier);
      sessionStorage.setItem('isPaid', 'true');
      sessionStorage.setItem('careerPathPaid', 'true');
    } else {
      sessionStorage.removeItem('isMember');
      sessionStorage.removeItem('memberPlanTier');
      sessionStorage.removeItem('isPaid');
      sessionStorage.removeItem('careerPathPaid');
    }
  }

  /** Ensure a user_profiles row exists for OAuth users (Google, etc.) */
  async function ensureProfileForOAuth(u: User) {
    const existing = await fetchProfile(u.id);
    if (existing) return; // profile already exists

    // Extract name and avatar from Google metadata
    const meta = u.user_metadata || {};
    const fullName = (meta.full_name || meta.name || '').trim();
    const nameParts = fullName.split(' ');
    const firstName = meta.first_name || nameParts[0] || '';
    const lastName = meta.last_name || nameParts.slice(1).join(' ') || '';
    const avatarUrl = meta.avatar_url || meta.picture || '';
    const email = u.email || meta.email || '';

    await supabase.from('user_profiles').upsert({
      id: u.id,
      user_id: u.id,
      first_name: firstName,
      last_name: lastName,
      email: email,
      avatar_url: avatarUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    // Re-fetch to update state
    await fetchProfile(u.id);
  }

  async function refreshProfile() {
    if (user) {
      await fetchProfile(user.id);
      await fetchSubscription(user.id);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureProfileForOAuth(session.user);
        fetchSubscription(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureProfileForOAuth(session.user);
        fetchSubscription(session.user.id);
      } else {
        setProfile(null);
        setSubscription(null);
      }
    });

    return () => authSub.unsubscribe();
  }, []);

  async function signUp(email: string, password: string, firstName: string, lastName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
      },
    });
    return { error: error?.message ?? null };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/area-cliente/auth`,
      },
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setSubscription(null);
    // Clear member flags from sessionStorage
    sessionStorage.removeItem('isMember');
    sessionStorage.removeItem('memberPlanTier');
    sessionStorage.removeItem('isPaid');
    sessionStorage.removeItem('careerPathPaid');
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error?.message ?? null };
  }

  async function updateProfile(data: Partial<UserProfile>) {
    if (!user) return { error: 'Não autenticado.' };
    const { error } = await supabase
      .from('user_profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (!error) await fetchProfile(user.id);
    return { error: error?.message ?? null };
  }

  function hasActiveSubscription() {
    if (!subscription) return false;
    if (subscription.status !== 'active') return false;
    return new Date(subscription.expires_at) > new Date();
  }

  return (
    <AuthContext.Provider value={{
      user, session, profile, subscription, loading,
      signUp, signIn, signInWithGoogle, signOut, resetPassword, updateProfile, refreshProfile,
      hasActiveSubscription,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
