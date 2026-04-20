/*
 * LoginModal — Modal de login/registo/reset consistente com o site principal
 * Substitui a página /auth dedicada
 */
import { useState } from 'react';
import { useI18n, type Lang } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Eye, EyeOff, X } from 'lucide-react';

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

type Mode = 'login' | 'register' | 'reset';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

function pick(lang: Lang, pt: string, en: string, es: string): string {
  if (lang === 'pt') return pt;
  if (lang === 'es') return es;
  return en;
}

export default function LoginModal({ open, onClose, onSuccess }: Props) {
  const { t, lang } = useI18n();
  const { signIn, signUp, resetPassword, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) { setError(error); } else { onSuccess?.(); }
      } else if (mode === 'register') {
        if (password !== confirmPassword) { setError(t('auth.passwordMismatch')); setLoading(false); return; }
        if (password.length < 6) { setError(pick(lang, 'A palavra-passe deve ter pelo menos 6 caracteres.', 'Password must be at least 6 characters.', 'La contraseña debe tener al menos 6 caracteres.')); setLoading(false); return; }
        const { error } = await signUp(email, password, firstName, lastName);
        if (error) {
          setError(error);
        } else {
          if (couponCode.trim()) {
            localStorage.setItem('s2i_registration_coupon', couponCode.trim().toUpperCase());
          }
          setSuccess(t('auth.checkEmail'));
        }
      } else {
        const { error } = await resetPassword(email);
        if (error) { setError(error); } else { setSuccess(t('auth.resetSent')); }
      }
    } catch {
      setError(t('auth.errorGeneric'));
    }
    setLoading(false);
  }

  function switchMode(newMode: Mode) {
    setMode(newMode);
    setError('');
    setSuccess('');
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#FAFAF9] rounded-lg shadow-2xl w-full max-w-md mx-4 p-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#999] hover:text-[#333] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#1a1a1a]">
            {mode === 'login' ? t('auth.welcome') : mode === 'register' ? t('auth.welcomeNew') : t('auth.resetPassword')}
          </h2>
          <p className="text-[#888] font-light text-sm mt-1">
            {mode === 'login' ? t('auth.loginSubtitle') : mode === 'register' ? t('auth.registerSubtitle') : ''}
          </p>
        </div>

        {/* Google OAuth */}
        {mode !== 'reset' && (
          <>
            <button
              type="button"
              onClick={async () => {
                setGoogleLoading(true);
                setError('');
                try { await signInWithGoogle(); } catch { setError(t('auth.errorGeneric')); setGoogleLoading(false); }
              }}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 bg-white border border-[#ddd] rounded text-sm text-[#333] font-medium hover:bg-[#f8f8f8] hover:border-[#ccc] disabled:opacity-50 transition-all duration-200"
            >
              {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleLogo />}
              {mode === 'login' ? t('auth.continueWithGoogle') : t('auth.signUpWithGoogle')}
            </button>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-[#e5e5e5]" />
              <span className="text-xs text-[#aaa] font-light">{t('auth.or')}</span>
              <div className="flex-1 h-px bg-[#e5e5e5]" />
            </div>
          </>
        )}

        {/* Error / Success */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-xs font-light">
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
              placeholder={pick(lang, 'o.teu@email.com', 'your@email.com', 'tu@email.com')}
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

          {mode === 'register' && (
            <div>
              <label className="block text-xs text-[#888] font-light mb-1.5">
                {pick(lang, 'Código de cupão (opcional)', 'Coupon code (optional)', 'Código de cupón (opcional)')}
              </label>
              <input
                type="text"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                placeholder="S2I-FREE-XXXX"
                className="w-full px-3 py-2.5 bg-[#f5f5f4] border border-[#ddd] rounded text-sm text-[#1a1a1a] placeholder-[#aaa] focus:border-gold/60 focus:outline-none transition-colors uppercase"
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="text-right">
              <button type="button" onClick={() => switchMode('reset')} className="text-xs text-[#999] hover:text-gold transition-colors">
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

        {/* Toggle mode */}
        <div className="mt-5 text-center">
          {mode === 'login' && (
            <p className="text-xs text-[#999] font-light">
              {t('auth.noAccount')}{' '}
              <button onClick={() => switchMode('register')} className="text-gold hover:text-gold-light transition-colors font-medium">
                {t('auth.createAccount')}
              </button>
            </p>
          )}
          {mode === 'register' && (
            <p className="text-xs text-[#999] font-light">
              {t('auth.hasAccount')}{' '}
              <button onClick={() => switchMode('login')} className="text-gold hover:text-gold-light transition-colors font-medium">
                {t('auth.login')}
              </button>
            </p>
          )}
          {mode === 'reset' && (
            <button onClick={() => switchMode('login')} className="text-xs text-gold hover:text-gold-light transition-colors">
              {t('auth.backToLogin')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
