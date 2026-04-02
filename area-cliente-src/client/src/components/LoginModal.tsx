/*
 * LoginModal — Modal de login/registo/reset consistente com o site principal
 * Substitui a página /auth dedicada
 */
import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Eye, EyeOff, X } from 'lucide-react';

type Mode = 'login' | 'register' | 'reset';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function LoginModal({ open, onClose, onSuccess }: Props) {
  const { t } = useI18n();
  const { signIn, signUp, resetPassword } = useAuth();
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
        if (password.length < 6) { setError('A palavra-passe deve ter pelo menos 6 caracteres.'); setLoading(false); return; }
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
              placeholder="o.teu@email.com"
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
