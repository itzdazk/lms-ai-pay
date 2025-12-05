import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../lib/api';
import type { User } from '../lib/api/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  userName: string;
  email: string;
  password: string;
  fullName: string;
  role?: 'student' | 'instructor';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = authApi.getStoredUser();
      if (storedUser && authApi.isAuthenticated()) {
        setUser(storedUser);
        // Optionally refresh user data from server
        authApi.getCurrentUser().catch(() => {
          // If token is invalid, clear everything
          authApi.logout();
        });
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { user } = await authApi.login({ email, password });
    setUser(user);
  };

  const register = async (data: RegisterData) => {
    const { user } = await authApi.register(data);
    setUser(user);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const updatedUser = await authApi.getCurrentUser();
      setUser(updatedUser);
    } catch (error) {
      // If token is invalid, logout
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}