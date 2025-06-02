
export interface User {
  id: string;
  email: string;
  name: string;
  whatsapp: string;
  cpf: string;
  hasCompletedOnboarding: boolean;
  clientNomenclature: string;
  specialty: string;
  role: 'admin' | 'user';
  trialEndsAt: Date;
  isSubscribed: boolean;
  subscriptionStatus: 'active' | 'trial' | 'expired' | 'cancelled';
  createdAt: Date;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  whatsapp: string;
  cpf: string;
}

export interface OnboardingData {
  clientNomenclature: string;
  specialty: string;
}
