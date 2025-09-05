import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  nome: string;
  email: string;
  chips_limite: number;
  status: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Configurar listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Buscar perfil do usuário quando autenticado
          setTimeout(async () => {
            try {
              const { data: profile } = await supabase
                .from('saas_usuarios')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
              
              setUserProfile(profile);
            } catch (error) {
              console.error('Erro ao buscar perfil:', error);
            }
          }, 0);
        } else {
          setUserProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Buscar perfil do usuário
        setTimeout(async () => {
          try {
            const { data: profile } = await supabase
              .from('saas_usuarios')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            
            setUserProfile(profile);
          } catch (error) {
            console.error('Erro ao buscar perfil:', error);
          }
          setIsLoading(false);
        }, 0);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserProfile(null);
  };

  return {
    user,
    session,
    userProfile,
    isLoading,
    logout,
    isAuthenticated: !!session
  };
};