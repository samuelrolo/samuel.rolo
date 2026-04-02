import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { Redirect } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

type Props = {
  children: React.ReactNode;
  requireSubscription?: boolean;
};

export default function ProtectedRoute({ children, requireSubscription = false }: Props) {
  const { user, loading, hasActiveSubscription } = useAuth();
  const { openLoginModal } = useLoginModal();

  useEffect(() => {
    if (!loading && !user) {
      openLoginModal();
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Show a placeholder while modal is open
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-6 h-6 text-gold animate-spin mx-auto mb-4" />
          <p className="text-[#888] font-light text-sm">A aguardar autenticação...</p>
        </div>
      </div>
    );
  }

  if (requireSubscription && !hasActiveSubscription()) return <Redirect to="/planos" />;

  return <>{children}</>;
}
