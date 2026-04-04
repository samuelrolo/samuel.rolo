import { createContext, useContext, useState, type ReactNode } from 'react';
import LoginModal from '@/components/LoginModal';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';

type LoginModalContextType = {
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isOpen: boolean;
};

const LoginModalContext = createContext<LoginModalContextType | null>(null);

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const [, navigate] = useLocation();

  function openLoginModal() {
    if (user) {
      navigate('/membros');
    } else {
      setIsOpen(true);
    }
  }

  function closeLoginModal() {
    setIsOpen(false);
  }

  function handleSuccess() {
    setIsOpen(false);
    navigate('/membros');
  }

  return (
    <LoginModalContext.Provider value={{ openLoginModal, closeLoginModal, isOpen }}>
      {children}
      <LoginModal open={isOpen} onClose={closeLoginModal} onSuccess={handleSuccess} />
    </LoginModalContext.Provider>
  );
}

export function useLoginModal() {
  const ctx = useContext(LoginModalContext);
  if (!ctx) throw new Error('useLoginModal must be used within LoginModalProvider');
  return ctx;
}
