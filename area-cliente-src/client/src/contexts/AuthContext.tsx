import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
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
const GET_SESSION_TIMEOUT_MS = 8000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const isMountedRef = useRef(true);
  const currentUserIdRef = useRef<string | null>(null);
  const hydratedUserIdRef = useRef<string | null>(null);
  const inFlightUserIdRef = useRef<string | null>(null);

  const clearMemberFlags = useCallback(() => {
    sessionStorage.removeItem('isMember');
    sessionStorage.removeItem('memberPlanTier');
    sessionStorage.removeItem('isPaid');
    sessionStorage.removeItem('careerPathPaid');
  }, []);

  const applyMemberFlags = useCallback((data: Subscription | null) => {
    if (data && data.status === 'active' && new Date(data.expires_at) > new Date()) {
      const plan = (data.plan || '').toLowerCase();
      let tier = 'essential';

      if (plan.includes('pro')) {
        tier = 'pro';
      } else if (plan.includes('growth')) {
        tier = 'growth';
      }

      sessionStorage.setItem('isMember', 'true');
      sessionStorage.setItem('memberPlanTier', tier);
      sessionStorage.setItem('isPaid', 'true');
      sessionStorage.setItem('careerPathPaid', 'true');
      return;
    }

    clearMemberFlags();
  }, [clearMemberFlags]);

  const resetAuthState = useCallback(() => {
    currentUserIdRef.current = null;
    hydratedUserIdRef.current = null;
    inFlightUserIdRef.current = null;
    setUser(null);
    setSession(null);
    setProfile(null);
    setSubscription(null);
    clearMemberFlags();
  }, [clearMemberFlags]);

  const syncAuthState = useCallback((nextSession: Session | null) => {
    const nextUser = nextSession?.user ?? null;
    const nextUserId = nextUser?.id ?? null;
    const previousUserId = currentUserIdRef.current;
    const changedUser = previousUserId !== nextUserId;

    currentUserIdRef.current = nextUserId;
    setSession(nextSession);
    setUser(nextUser);

    if (!nextUserId) {
      hydratedUserIdRef.current = null;
      inFlightUserIdRef.current = null;
      setProfile(null);
      setSubscription(null);
      clearMemberFlags();
      return null;
    }

    if (changedUser) {
      hydratedUserIdRef.current = null;
      inFlightUserIdRef.current = null;
      setProfile(null);
      setSubscription(null);
      clearMemberFlags();
    }

    return nextUser;
  }, [clearMemberFlags]);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (currentUserIdRef.current !== userId || !isMountedRef.current) {
      return null;
    }

    if (error) {
      console.warn('[Auth] Failed to fetch profile:', error.message);
      setProfile(null);
      return null;
    }

    setProfile(data ?? null);
    return data ?? null;
  }, []);

  const fetchSubscription = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (currentUserIdRef.current !== userId || !isMountedRef.current) {
      return null;
    }

    if (error) {
      console.warn('[Auth] Failed to fetch subscription:', error.message);
      setSubscription(null);
      clearMemberFlags();
      return null;
    }

    setSubscription(data ?? null);
    applyMemberFlags(data ?? null);
    return data ?? null;
  }, [applyMemberFlags, clearMemberFlags]);

  const loadUserData = useCallback(async (userId: string, options?: { force?: boolean }) => {
    const force = options?.force === true;

    if (!force) {
      if (hydratedUserIdRef.current === userId) {
        return;
      }

      if (inFlightUserIdRef.current === userId) {
        return;
      }
    }

    inFlightUserIdRef.current = userId;

    try {
      await Promise.all([
        fetchProfile(userId),
        fetchSubscription(userId),
      ]);

      if (currentUserIdRef.current === userId) {
        hydratedUserIdRef.current = userId;
      }
    } finally {
      if (inFlightUserIdRef.current === userId) {
        inFlightUserIdRef.current = null;
      }
    }
  }, [fetchProfile, fetchSubscription]);

  async function refreshProfile() {
    if (!user?.id) {
      return;
    }

    await loadUserData(user.id, { force: true });
  }

  async function handleInvalidSession() {
    try {
      await supabase.auth.signOut();
    } catch (_) {
      // ignore invalid sign-out cleanup failures
    }

    resetAuthState();
  }

  useEffect(() => {
    isMountedRef.current = true;
    let alive = true;

    async function getSessionWithTimeout() {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      try {
        return await Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(`getSession timeout after ${GET_SESSION_TIMEOUT_MS}ms`)), GET_SESSION_TIMEOUT_MS);
          }),
        ]);
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    }

    async function initializeAuth() {
      try {
        const { data: { session: initialSession }, error } = await getSessionWithTimeout();

        if (!alive) {
          return;
        }

        if (error && (error.message?.includes('Refresh Token') || error.message?.includes('refresh_token') || error.code === 'bad_jwt')) {
          console.warn('[Auth] Invalid refresh token during initialization, clearing session.');
          await handleInvalidSession();
          return;
        }

        const nextUser = syncAuthState(initialSession);

        if (nextUser) {
          await loadUserData(nextUser.id);
        }
      } catch (err: any) {
        if (!alive) {
          return;
        }

        console.warn('[Auth] getSession error:', err?.message);
        await handleInvalidSession();
      } finally {
        if (alive && isMountedRef.current) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      void (async () => {
        try {
          if (!alive) {
            return;
          }

          if (event === 'TOKEN_REFRESHED' && !nextSession) {
            console.warn('[Auth] Token refresh failed, clearing session.');
            await handleInvalidSession();
            return;
          }

          if (event === 'SIGNED_OUT') {
            resetAuthState();
            return;
          }

          const nextUser = syncAuthState(nextSession);
          const shouldForceRefresh = event === 'SIGNED_IN' || event === 'USER_UPDATED';

          if (nextUser) {
            await loadUserData(nextUser.id, { force: shouldForceRefresh });
          }
        } catch (err: any) {
          console.warn('[Auth] onAuthStateChange error:', err?.message);
          await handleInvalidSession();
        } finally {
          if (alive && isMountedRef.current) {
            setLoading(false);
          }
        }
      })();
    });

    return () => {
      alive = false;
      isMountedRef.current = false;
      authSub.unsubscribe();
    };
  }, [loadUserData, resetAuthState, syncAuthState]);

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
      options: { redirectTo: window.location.origin + '/area-cliente/membros' },
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    resetAuthState();
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

    if (!error) {
      await fetchProfile(user.id);
    }

    return { error: error?.message ?? null };
  }

  function hasActiveSubscription() {
    if (!subscription) return false;
    if (subscription.status !== 'active') return false;
    return new Date(subscription.expires_at) > new Date();
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      subscription,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      resetPassword,
      updateProfile,
      refreshProfile,
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
