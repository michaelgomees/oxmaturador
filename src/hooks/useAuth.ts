import { useState, useEffect } from 'react';

export interface User {
  id: string;
  nome: string;
  email: string;
  chips_limite: number;
  status: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se há sessão salva no localStorage
    const savedSession = localStorage.getItem('ox-user-session');
    if (savedSession) {
      try {
        const userData = JSON.parse(savedSession);
        setUser(userData);
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
        localStorage.removeItem('ox-user-session');
      }
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('ox-user-session');
    setUser(null);
  };

  return {
    user,
    isLoading,
    logout,
    isAuthenticated: !!user
  };
};