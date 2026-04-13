import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Lang } from '@/i18n/translations';

type Mode = 'login' | 'register';

type Props = {
  open: boolean;
  lang: Lang;
  onClose: () => void;
};

type Copy = {
  loginTitle: string;
  registerTitle: string;
  subtitle: string;
  registerSubtitle: string;
  email: string;
  password: string;
  confirmPassword: string;
  login: string;
  createAccount: string;
  creatingAccount: string;
  noAccount: string;
  hasAccount: string;
  switchToRegister: string;
  switchToLogin: string;
  passwordMismatch: string;
  passwordTooShort: string;
  genericError: string;
  checkEmail: string;
  emailPlaceholder: string;
  close: string;
};

const COPY: Record<Lang, Copy> = {
  pt: {
    loginTitle: 'Iniciar sessão',
    registerTitle: 'Criar conta',
    subtitle: 'Acede à tua área de cliente com o teu email e palavra-passe.',
    registerSubtitle: 'Cria a tua conta para acederes à área de cliente.',
    email: 'Email',
    password: 'Palavra-passe',
    confirmPassword: 'Confirmar palavra-passe',
    login: 'Entrar',
    createAccount: 'Criar conta',
    creatingAccount: 'A criar conta...',
    noAccount: 'Ainda não tens conta?',
    hasAccount: 'Já tens conta?',
    switchToRegister: 'Criar conta',
    switchToLogin: 'Iniciar sessão',
    passwordMismatch: 'As palavras-passe não coincidem.',
    passwordTooShort: 'A palavra-passe deve ter pelo menos 6 caracteres.',
    genericError: 'Ocorreu um erro. Tenta novamente.',
    checkEmail: 'Verifica o teu email para confirmares a conta.',
    emailPlaceholder: 'o.teu@email.com',
    close: 'Fechar',
  },
  en: {
    loginTitle: 'Log in',
    registerTitle: 'Create account',
    subtitle: 'Access your member area with your email and password.',
    registerSubtitle: 'Create your account to access the member area.',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm password',
    login: 'Log in',
    createAccount: 'Create account',
    creatingAccount: 'Creating account...',
    noAccount: "Don\'t have an account yet?",
    hasAccount: 'Already have an account?',
    switchToRegister: 'Create account',
    switchToLogin: 'Log in',
    passwordMismatch: 'Passwords do not match.',
    passwordTooShort: 'Password must be at least 6 characters.',
    genericError: 'Something went wrong. Please try again.',
    checkEmail: 'Check your email to confirm your account.',
    emailPlaceholder: 'your@email.com',
    close: 'Close',
  },
  es: {
    loginTitle: 'Iniciar sesión',
    registerTitle: 'Crear cuenta',
    subtitle: 'Accede a tu área de cliente con tu correo y contraseña.',
    registerSubtitle: 'Crea tu cuenta para acceder al área de cliente.',
    email: 'Correo electrónico',
    password: 'Contraseña',
    confirmPassword: 'Confirmar contraseña',
    login: 'Iniciar sesión',
    createAccount: 'Crear cuenta',
    creatingAccount: 'Creando cuenta...',
    noAccount: '¿Aún no tienes cuenta?',
    hasAccount: '¿Ya tienes cuenta?',
    switchToRegister: 'Crear cuenta',
    switchToLogin: 'Iniciar sesión',
    passwordMismatch: 'Las contraseñas no coinciden.',
    passwordTooShort: 'La contraseña debe tener al menos 6 caracteres.',
    genericError: 'Se produjo un error. Inténtalo de nuevo.',
    checkEmail: 'Revisa tu correo para confirmar la cuenta.',
    emailPlaceholder: 'tu@email.com',
    close: 'Cerrar',
  },
};

const MEMBER_AREA_REDIRECT = '/area-cliente/membros';

export default function PublicLoginModal({ open, lang, onClose }: Props) {
  const copy = useMemo(() => COPY[lang] ?? COPY.pt, [lang]);
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!open) {
      setMode('login');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setLoading(false);
      setError('');
      setSuccess('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError(signInError.message);
          return;
        }

        window.location.href = MEMBER_AREA_REDIRECT;
        return;
      }

      if (password !== confirmPassword) {
        setError(copy.passwordMismatch);
        return;
      }

      if (password.length < 6) {
        setError(copy.passwordTooShort);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + MEMBER_AREA_REDIRECT,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session) {
        window.location.href = MEMBER_AREA_REDIRECT;
        return;
      }

      setSuccess(copy.checkEmail);
    } catch {
      setError(copy.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label={copy.close}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#e7dcc3] bg-white p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label={copy.close}
          className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 pr-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#C9A961]">Share2Inspire</p>
          <h2 className="text-2xl font-semibold text-slate-900">
            {mode === 'login' ? copy.loginTitle : copy.registerTitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {mode === 'login' ? copy.subtitle : copy.registerSubtitle}
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mb-4 rounded-xl border border-[#e7dcc3] bg-[#fffaf0] px-4 py-3 text-sm text-[#8a6a2f]">
            {success}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
              {copy.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={copy.emailPlaceholder}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#C9A961] focus:bg-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
              {copy.password}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition-colors focus:border-[#C9A961] focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                aria-label={showPassword ? copy.password : copy.confirmPassword}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {mode === 'register' ? (
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                {copy.confirmPassword}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-[#C9A961] focus:bg-white"
              />
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9A961] px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#b8954f] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === 'login' ? copy.login : copy.createAccount}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-slate-500">
          {mode === 'login' ? (
            <p>
              {copy.noAccount}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                  setSuccess('');
                }}
                className="font-semibold text-[#C9A961] transition-colors hover:text-[#b8954f]"
              >
                {copy.switchToRegister}
              </button>
            </p>
          ) : (
            <p>
              {copy.hasAccount}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccess('');
                }}
                className="font-semibold text-[#C9A961] transition-colors hover:text-[#b8954f]"
              >
                {copy.switchToLogin}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
