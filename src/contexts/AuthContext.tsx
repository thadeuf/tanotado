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

  const createNewProfile = async (authUser: any) => {
    try {
      console.log('Creating new profile for user:', authUser.id);
      
      const newProfile = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email.split('@')[0],
        whatsapp: authUser.user_metadata?.whatsapp || '',
        cpf: authUser.user_metadata?.cpf || '',
        role: 'user' as const,
        has_completed_onboarding: false,
        client_nomenclature: 'cliente',
        specialty: '',
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_subscribed: false,
        subscription_status: 'trial',
        avatar_url: authUser.user_metadata?.avatar_url || null,
      };

      const { data: profile, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        setIsLoading(false);
        return;
      }
      
      // Após criar, recarrega o perfil para garantir todos os dados
      await loadUserProfile(supabase.auth.getSession()?.data?.session);
      
    } catch (error) {
      console.error('Error creating new profile:', error);
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (session: Session | null) => {
    if (!session?.user) {
        setUser(null);
        setIsLoading(false);
        return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

        if (error && error.code === 'PGRST116') {
            // Perfil não encontrado, vamos criar um.
            await createNewProfile(session.user);
        } else if (error) {
            throw error;
        } else if (profile) {
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
              subscriptionStatus: (profile.subscription_status as any) || 'trial',
              createdAt: new Date(profile.created_at),
              avatar_url: profile.avatar_url,
              council_registration: profile.council_registration,
              about_you: profile.about_you,
              cep: profile.cep,
              address: profile.address,
              address_number: profile.address_number,
              address_neighborhood: profile.address_neighborhood,
              address_city: profile.address_city,
              address_state: profile.address_state,
              address_complement: profile.address_complement,
            };
            setUser(userData);
            setIsLoading(false);
        }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUser(null);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Restaurando a lógica original e mais estável
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // O setTimeout é crucial aqui para evitar o loop
        setTimeout(() => {
          loadUserProfile(session);
        }, 0);
      }
    );

    // Carrega a sessão inicial de forma assíncrona
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUserProfile(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refetchUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await loadUserProfile(session);
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "Login realizado com sucesso!", description: "Bem-vindo ao tanotado" });
    } catch (error: any) {
      console.error('Login error:', error);
      toast({ title: "Erro no login", description: error.message || "Verifique suas credenciais e tente novamente", variant: "destructive" });
      throw error;
    } finally {
        // O listener onAuthStateChange cuidará de setar o loading para false
    }
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: { name: userData.name, whatsapp: userData.whatsapp, cpf: userData.cpf },
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      if (error) throw error;
      toast({ title: "Cadastro realizado com sucesso!", description: "Verifique seu email para confirmar a conta." });
    } catch (error: any) {
      console.error('Register error:', error);
      toast({ title: "Erro no cadastro", description: error.message || "Tente novamente.", variant: "destructive" });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    try {
      const profileUpdates: any = {
        name: updates.name,
        has_completed_onboarding: updates.hasCompletedOnboarding,
        client_nomenclature: updates.clientNomenclature,
        specialty: updates.specialty,
      };
      const { error } = await supabase.from('profiles').update(profileUpdates).eq('id', user.id);
      if (error) throw error;
      setUser({ ...user, ...updates });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({ title: "Erro ao atualizar perfil", variant: "destructive" });
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast({ title: "Logout realizado", description: "Até a próxima!" });
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
      refetchUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};