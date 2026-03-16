import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'wouter';
import { Loader2 } from 'lucide-react';

type Props = {
  children: React.ReactNode;
  requireSubscription?: boolean;
};

export default function ProtectedRoute({ children, requireSubscription = false }: Props) {
  const { user, loading, hasActiveSubscription } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  if (!user) return <Redirect to="/auth" />;
  if (requireSubscription && !hasActiveSubscription()) return <Redirect to="/planos" />;

  return <>{children}</>;
}
