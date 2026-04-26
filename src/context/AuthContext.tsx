import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'consumer' | 'merchant';
  merchantId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_USERS: Record<string, User & { password: string }> = {
  'mia@demo.momento': {
    id: 'user-mia',
    name: 'Mia Weber',
    email: 'mia@demo.momento',
    role: 'consumer',
    password: 'demo',
  },
  'hans@demo.momento': {
    id: 'user-hans',
    name: 'Hans Müller',
    email: 'hans@demo.momento',
    role: 'merchant',
    merchantId: 'cafe-mueller',
    password: 'demo',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('momento_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('momento_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string): boolean => {
    const entry = DEMO_USERS[email.toLowerCase()];
    if (!entry || entry.password !== password) return false;

    const { password: _, ...userData } = entry;
    setUser(userData);
    localStorage.setItem('momento_user', JSON.stringify(userData));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('momento_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
