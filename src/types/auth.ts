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
  public_booking_url_slug?: string | null;
  procuracao_receita_saude_url?: string | null;
  receita_saude_enabled?: boolean;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_subscription_status?: string | null;
  subscription_current_period_end?: string | null;
  appointment_label?: string | null;
  specialty_label?: string | null;
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