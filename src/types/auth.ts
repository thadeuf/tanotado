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
  // Novos campos adicionados
  avatar_url?: string | null;
  council_registration?: string | null;
  about_you?: string | null;
  cep?: string | null;
  address?: string | null;
  address_number?: string | null;
  address_neighborhood?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_complement?: string | null;
  // --- NOVO CAMPO ADICIONADO ---
  public_booking_url_slug?: string | null;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refetchUser: () => Promise<void>; // Adicionada função para recarregar dados do usuário
  forceAppUpdate: () => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
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