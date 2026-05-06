import { createContext, useContext, useState, ReactNode } from 'react';
import AuthModal from '@/components/auth/AuthModal';

interface AuthModalContextType {
  open: (tab?: 'login' | 'register') => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<'login' | 'register'>('login');

  const open = (tab: 'login' | 'register' = 'login') => {
    setDefaultTab(tab);
    setIsOpen(true);
  };

  return (
    <AuthModalContext.Provider value={{ open }}>
      {children}
      <AuthModal open={isOpen} onOpenChange={setIsOpen} defaultTab={defaultTab} />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal(): AuthModalContextType {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error('useAuthModal must be used within AuthModalProvider');
  return ctx;
}
