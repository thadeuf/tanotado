
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User, RegisterData } from '../types/auth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Configurar listener de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session);
        
        if (session?.user) {
          await loadUserProfile(session);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (session: Session) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (profile) {
        const userData: User = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          whatsapp: profile.whatsapp || '',
          cpf: profile.cpf || '',
          hasCompletedOnboarding: profile.has_completed_onboarding,
          clientNomenclature: profile.client_nomenclature || 'cliente',
          specialty: profile.specialty || '',
          role: profile.role || 'user',
          trialEndsAt: new Date(profile.trial_ends_at),
          isSubscribed: profile.is_subscribed,
          subscriptionStatus: profile.subscription_status || 'trial',
          createdAt: new Date(profile.created_at)
        };
        
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao tanotado",
      });
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Erro no login",
        description: error.message || "Verifique suas credenciais e tente novamente",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            whatsapp: userData.whatsapp,
            cpf: userData.cpf,
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Verifique seu email para confirmar a conta. Seu teste gratuito de 7 dias começará após a confirmação.",
      });
    } catch (error: any) {
      console.error('Register error:', error);
      toast({
        title: "Erro no cadastro",
        description: error.message || "Tente novamente em alguns instantes",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      const profileUpdates: any = {};
      
      if (updates.name !== undefined) profileUpdates.name = updates.name;
      if (updates.whatsapp !== undefined) profileUpdates.whatsapp = updates.whatsapp;
      if (updates.cpf !== undefined) profileUpdates.cpf = updates.cpf;
      if (updates.hasCompletedOnboarding !== undefined) profileUpdates.has_completed_onboarding = updates.hasCompletedOnboarding;
      if (updates.clientNomenclature !== undefined) profileUpdates.client_nomenclature = updates.clientNomenclature;
      if (updates.specialty !== undefined) profileUpdates.specialty = updates.specialty;
      if (updates.role !== undefined) profileUpdates.role = updates.role;

      const { error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Erro ao atualizar perfil",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast({
        title: "Logout realizado",
        description: "Até a próxima!",
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      register,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
