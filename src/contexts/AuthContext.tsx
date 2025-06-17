// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User, RegisterData } from '../types/auth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signOutFromAllDevices: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refetchUser: () => Promise<void>;
  forceAppUpdate: () => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
}

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
    // --- INÍCIO DA ALTERAÇÃO ---
    // A lógica de criação de perfil agora é tratada por um gatilho (Trigger)
    // diretamente no banco de dados para garantir a consistência dos dados.
    // Esta função no frontend agora pode apenas registrar o evento e
    // garantir que os dados mais recentes sejam buscados após a criação automática.
    console.log(`O perfil para o usuário ${authUser.id} será criado pelo gatilho do banco de dados. Recarregando dados...`); //
    
    // Aguarda um breve momento para garantir que o gatilho no DB tenha tempo de executar
    await new Promise(resolve => setTimeout(resolve, 1000)); //

    // Recarrega o perfil do usuário para obter os dados recém-criados pelo gatilho.
    await loadUserProfile(supabase.auth.getSession()?.data?.session); //
    // --- FIM DA ALTERAÇÃO ---
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
            // Se o perfil ainda não existe (devido a um pequeno atraso do gatilho),
            // a função createNewProfile será chamada para tentar recarregar.
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
              is_active: profile.is_active,
              // --- CARREGAR NOVOS CAMPOS ---
              public_booking_enabled: profile.public_booking_enabled ?? false,
              public_booking_url_slug: profile.public_booking_url_slug,
              // --- FIM CARREGAR NOVOS CAMPOS ---
            };
            setUser(userData);
            setIsLoading(false);
        }
    } catch (error) {
      console.error('Error loading user profile:', error); //
      setUser(null); //
      setIsLoading(false); //
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Pequeno atraso para garantir que o gatilho do DB tenha tempo de rodar antes da leitura
        setTimeout(() => {
          loadUserProfile(session);
        }, 500);
      }
    );

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
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password }); //
      if (authError) throw authError; //
      if (!authData.user) throw new Error("Usuário não encontrado após login."); //

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        await supabase.auth.signOut();
        throw new Error("Perfil de usuário não encontrado.");
      }
      
      if (profile.is_active === false) {
        await supabase.auth.signOut();
        toast({
            title: "Acesso Negado",
            description: "Sua conta foi desativada. Por favor, entre em contato com o suporte.",
            variant: "destructive",
        });
        setIsLoading(false);
        return; 
      }
      
      await loadUserProfile(authData.session); //
      toast({ title: "Login realizado com sucesso!", description: "Bem-vindo de volta!" }); //

    } catch (error: any) {
      console.error('Login error:', error); //
      toast({ title: "Erro no login", description: error.message || "Verifique suas credenciais e tente novamente", variant: "destructive" }); //
      setIsLoading(false); //
      throw error; //
    }
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    try {
      const cleanCPF = userData.cpf.replace(/[^\d]/g, ''); //

      // Chama a função RPC para verificar se o CPF existe
      const { data: cpfAlreadyExists, error: rpcError } = await supabase
        .rpc('cpf_exists', { cpf_to_check: cleanCPF }); //

      // Se a chamada da função der erro, interrompe o processo
      if (rpcError) {
        throw rpcError;
      }

      // Se a função retornar 'true', o CPF já existe
      if (cpfAlreadyExists) {
        toast({
          title: "Erro no Cadastro",
          description: "Este CPF já está cadastrado em nosso sistema. Por favor, entre em contato com o suporte.",
          variant: "destructive",
        });
        setIsLoading(false);
        return; // Sai da função sem registrar
      }

      // Se o CPF for único, prossegue com o cadastro
      const { error: signUpError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            whatsapp: userData.whatsapp,
            cpf: cleanCPF
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (signUpError) throw signUpError;

      toast({ title: "Cadastro realizado com sucesso!", description: "Vá para Login e Acesse sua conta." }); //
    } catch (error: any) {
      console.error('Register error:', error); //
      toast({ title: "Erro no cadastro", description: error.message || "Tente novamente.", variant: "destructive" }); //
      throw error; //
    } finally {
      setIsLoading(false); //
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return; //
    try {
      const profileUpdates: any = {
        name: updates.name,
        has_completed_onboarding: updates.hasCompletedOnboarding,
        client_nomenclature: updates.clientNomenclature,
        specialty: updates.specialty,
        // --- ENVIA NOVOS CAMPOS ---
        public_booking_enabled: updates.public_booking_enabled,
        public_booking_url_slug: updates.public_booking_url_slug,
        // --- FIM ENVIA NOVOS CAMPOS ---
      };
      const { error } = await supabase.from('profiles').update(profileUpdates).eq('id', user.id); //
      if (error) throw error; //
      setUser({ ...user, ...updates }); //
    } catch (error) {
      console.error('Error updating user:', error); //
      toast({ title: "Erro ao atualizar perfil", variant: "destructive" }); //
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut(); //
      setUser(null); //
      toast({ title: "Logout realizado", description: "Até a próxima!" }); //
    } catch (error) {
      console.error('Logout error:', error); //
    }
  };

  const signOutFromAllDevices = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' }); //
      if (error) throw error; //
      setUser(null); //
      toast({
        title: "Sessão encerrada em todos os dispositivos",
        description: "Você foi desconectado de todas as suas sessões ativas.",
      });
    } catch (error: any) {
      console.error('Global sign out error:', error); //
      toast({
        title: "Erro ao desconectar",
        description: "Não foi possível encerrar as outras sessões. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const forceAppUpdate = async () => {
    try {
      toast({
        title: "Atualizando o aplicativo...",
        description: "Limpando o cache para obter a versão mais recente.",
      });

      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log("Caches limpos com sucesso.");
      }

      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log("Service workers desregistrados.");
      }
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error("Erro ao forçar a atualização:", error); //
      toast({
        title: "Erro na atualização",
        description: "Não foi possível limpar o cache. Tente atualizar a página manualmente (Ctrl+Shift+R).",
        variant: "destructive",
      });
    }
  };

  const resetPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password }); //
    if (error) {
      toast({
        title: "Erro ao redefinir a senha",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
    toast({
      title: "Senha alterada com sucesso!",
    });
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
      signOutFromAllDevices,
      forceAppUpdate,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};