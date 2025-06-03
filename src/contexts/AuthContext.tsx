
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User, RegisterData } from '../types/auth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';
import { getGenericErrorMessage } from '@/utils/security';

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
    // Configure authentication listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session);
        
        if (session?.user) {
          await loadUserProfile(session);
          // Update last activity on successful auth
          localStorage.setItem('lastActivity', new Date().toISOString());
        } else {
          setUser(null);
          localStorage.removeItem('lastActivity');
        }
        setIsLoading(false);
      }
    );

    // Check existing session
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
          subscriptionStatus: (profile.subscription_status as 'active' | 'trial' | 'expired' | 'cancelled') || 'trial',
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
        email: email.trim().toLowerCase(),
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
      const errorMessage = getGenericErrorMessage(error);
      toast({
        title: "Erro no login",
        description: errorMessage,
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
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        options: {
          data: {
            name: userData.name.trim(),
            whatsapp: userData.whatsapp.replace(/\D/g, ''),
            cpf: userData.cpf.replace(/\D/g, ''),
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
      const errorMessage = getGenericErrorMessage(error);
      toast({
        title: "Erro no cadastro",
        description: errorMessage,
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
      
      if (updates.name !== undefined) profileUpdates.name = updates.name.trim();
      if (updates.whatsapp !== undefined) profileUpdates.whatsapp = updates.whatsapp.replace(/\D/g, '');
      if (updates.cpf !== undefined) profileUpdates.cpf = updates.cpf.replace(/\D/g, '');
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
      const errorMessage = getGenericErrorMessage(error);
      toast({
        title: "Erro ao atualizar perfil",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setUser(null);
      localStorage.removeItem('lastActivity');
      toast({
        title: "Logout realizado",
        description: "Até a próxima!",
      });
    } catch (error) {
      console.error('Logout error:', error);
      const errorMessage = getGenericErrorMessage(error);
      toast({
        title: "Erro no logout",
        description: errorMessage,
        variant: "destructive",
      });
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
