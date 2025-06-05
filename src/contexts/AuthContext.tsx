
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User, RegisterData, OnboardingData } from '../types/auth';
import { toast } from '@/hooks/use-toast';

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
    // Simular carregamento do usuário do localStorage
    const savedUser = localStorage.getItem('tanotado_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        // Convert date strings back to Date objects
        if (userData.trialEndsAt) {
          userData.trialEndsAt = new Date(userData.trialEndsAt);
        }
        if (userData.createdAt) {
          userData.createdAt = new Date(userData.createdAt);
        }
        setUser(userData);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('tanotado_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data
      const userData: User = {
        id: '1',
        email,
        name: 'Dr. João Silva',
        whatsapp: '(11) 99999-9999',
        cpf: '123.456.789-10',
        hasCompletedOnboarding: false,
        clientNomenclature: '',
        specialty: '',
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        isSubscribed: false,
        subscriptionStatus: 'trial',
        createdAt: new Date()
      };
      
      setUser(userData);
      localStorage.setItem('tanotado_user', JSON.stringify(userData));
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao tanotado",
      });
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Verifique suas credenciais e tente novamente",
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
      // Simular validações
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser: User = {
        id: '1',
        email: userData.email,
        name: userData.name,
        whatsapp: userData.whatsapp,
        cpf: userData.cpf,
        hasCompletedOnboarding: false,
        clientNomenclature: '',
        specialty: '',
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isSubscribed: false,
        subscriptionStatus: 'trial',
        createdAt: new Date()
      };
      
      setUser(newUser);
      localStorage.setItem('tanotado_user', JSON.stringify(newUser));
      
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Seu teste gratuito de 7 dias começou agora",
      });
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('tanotado_user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tanotado_user');
    toast({
      title: "Logout realizado",
      description: "Até a próxima!",
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
    }}>
      {children}
    </AuthContext.Provider>
  );
};
