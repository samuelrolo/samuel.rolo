/*
 * Design: Consultoria de Luxo Silenciosa
 * Página de Login/Registo com fundo escuro, formulário centrado, dourado contido
 */
import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const AUTH_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/105354394/92yTmUfG3DeUMDKSZxzXKb/s2i-auth-bg-E6NhABPdgwCDiNDBRKzudJ.webp';

type Mode = 'login' | 'register' | 'reset';

export default function Auth() {
  const { t } = useI18n();
  const { signIn, signUp, resetPassword, signInWithGoogle, user } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (user) {
    navigate('/membros');
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) { setError(error); } else { navigate('/membros'); }
      } else if (mode === 'register') {
        if (password !== confirmPassword) { setError(t('auth.passwordMismatch')); setLoading(false); return; }
        const { error } = await signUp(email, password, firstName, lastName);
        if (error) { setError(error); } else { setSuccess(t('auth.checkEmail')); }
      } else {
        const { error } = await resetPassword(email);
        if (error) { setError(error); } else { setSuccess(t('auth.resetSent')); }
      }
    } catch {
      setError(t('auth.errorGeneric'));
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: Background Image (desktop only) */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${AUTH_BG})` }} />
        <div className="absolute inset-0 bg-[#FAFAF9]/40" />
        <div className="absolute bottom-12 left-12 right-12">
          <p className="text-gold text-sm font-light tracking-[0.2em] uppercase mb-3">Share2Inspire</p>
          <h2 className="text-3xl font-semibold text-[#1a1a1a] leading-snug">
            {t('auth.tagline')}
          </h2>
        </div>
      </div>

      {/* Right: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-20 bg-[#FAFAF9]">
        <div className="w-full max-w-sm">
          {/* Back to home */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs text-[#999] hover:text-[#1a1a1a]/60 transition-colors mb-10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('nav.home')}
          </button>

          {/* Title */}
          <div className="mb-8">
            <p className="text-gold text-xs font-light tracking-[0.15em] uppercase mb-2">
              {mode === 'login' ? t('auth.login') : mode === 'register' ? t('auth.register') : t('auth.resetPassword')}
            </p>
            <h1 className="text-2xl font-semibold text-[#1a1a1a]">
              {mode === 'login' ? t('auth.welcome') : mode === 'register' ? t('auth.welcomeNew') : t('auth.resetPassword')}
            </h1>
            <p className="text-[#888] font-light text-sm mt-2">
              {mode === 'login' ? t('auth.loginSubtitle') : mode === 'register' ? t('auth.registerSubtitle') : ''}
            </p>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs font-light">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-gold/10 border border-gold/20 rounded text-gold text-xs font-light">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#888] font-light mb-1.5">{t('auth.firstName')}</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-[#f5f5f4] border border-[#ddd] rounded text-sm text-[#1a1a1a] placeholder-[#aaa] focus:border-gold/60 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#888] font-light mb-1.5">{t('auth.lastName')}</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-[#f5f5f4] border border-[#ddd] rounded text-sm text-[#1a1a1a] placeholder-[#aaa] focus:border-gold/60 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-[#888] font-light mb-1.5">{t('auth.email')}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-[#f5f5f4] border border-[#ddd] rounded text-sm text-[#1a1a1a] placeholder-[#aaa] focus:border-gold/60 focus:outline-none transition-colors"
              />
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="block text-xs text-[#888] font-light mb-1.5">{t('auth.password')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-[#f5f5f4] border border-[#ddd] rounded text-sm text-[#1a1a1a] placeholder-[#aaa] focus:border-gold/60 focus:outline-none transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#1a1a1a]/60"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs text-[#888] font-light mb-1.5">{t('auth.confirmPassword')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-[#f5f5f4] border border-[#ddd] rounded text-sm text-[#1a1a1a] placeholder-[#aaa] focus:border-gold/60 focus:outline-none transition-colors"
                />
              </div>
            )}

            {mode === 'login' && (
              <div className="text-right">
                <button type="button" onClick={() => { setMode('reset'); setError(''); setSuccess(''); }} className="text-xs text-[#999] hover:text-gold transition-colors">
                  {t('auth.forgotPassword')}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gold text-[#1a1a1a] font-medium text-sm rounded hover:bg-gold-light disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? t('auth.login') : mode === 'register' ? t('auth.register') : t('auth.resetPassword')}
            </button>
          </form>

          {/* Google OAuth */}
          {mode !== 'reset' && (
            <div className="mt-4">
              <div className="relative flex items-center my-4">
                <div className="flex-1 border-t border-[#ddd]" />
                <span className="mx-3 text-xs text-[#aaa]">{t('auth.or')}</span>
                <div className="flex-1 border-t border-[#ddd]" />
              </div>
              <button
                type="button"
                onClick={async () => {
                  setGoogleLoading(true);
                  try { await signInWithGoogle(); } catch { setError(t('auth.errorGeneric')); setGoogleLoading(false); }
                }}
                disabled={googleLoading}
                className="w-full py-2.5 border border-[#ddd] rounded text-sm text-[#1a1a1a] font-light hover:bg-[#f5f5f4] disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleLogo />}
                {mode === 'login' ? t('auth.continueWithGoogle') : t('auth.signUpWithGoogle')}
              </button>
            </div>
          )}

          {/* Toggle mode */}
          <div className="mt-6 text-center">
            {mode === 'login' && (
              <p className="text-xs text-[#999] font-light">
                {t('auth.noAccount')}{' '}
                <button onClick={() => { setMode('register'); setError(''); setSuccess(''); }} className="text-gold hover:text-gold-light transition-colors">
                  {t('auth.createAccount')}
                </button>
              </p>
            )}
            {mode === 'register' && (
              <p className="text-xs text-[#999] font-light">
                {t('auth.hasAccount')}{' '}
                <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="text-gold hover:text-gold-light transition-colors">
                  {t('auth.login')}
                </button>
              </p>
            )}
            {mode === 'reset' && (
              <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="text-xs text-gold hover:text-gold-light transition-colors">
                {t('auth.backToLogin')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
