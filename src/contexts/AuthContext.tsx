import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '../services/api';

interface User {
  id: number;
  nome: string;
  email: string;
  cor?: string;
}

interface LoginResult {
  success: boolean;
  message?: string;
  needsVerification?: boolean;
}

interface AuthContextData {
  signed: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user } = response.data;

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
      setUser(user);

      return { success: true };
    } catch (error: any) {
      const status = error?.response?.status;
      const code = error?.response?.data?.code;
      const message = error?.response?.data?.message;

      if (status === 403 && code === 'ACCOUNT_NOT_VERIFIED') {
        return {
          success: false,
          needsVerification: true,
          message: message || 'Conta nao verificada. Confira seu email.',
        };
      }

      return {
        success: false,
        message: Array.isArray(message) ? message.join(', ') : message || 'Email ou senha invalidos.',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        signed: !!user,
        user,
        login,
        logout,
        loading,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}
