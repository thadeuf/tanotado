
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Client {
  id: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  created_at: string;
  birth_date: string | null;
  address: string | null;
  notes: string | null;
  group_id: string | null;
  updated_at: string;
  user_id: string;
  active_registration: boolean | null;
  session_value: string | null;
}

export const useClients = (forceRefresh = false) => {
  const { user, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['clients', user?.id],
    queryFn: async () => {
      console.log('useClients: Starting fetch for user:', user?.id);
      
      if (!user?.id) {
        console.log('useClients: No user ID available');
        throw new Error('Usuário não autenticado');
      }

      console.log('useClients: Fetching clients for user:', user.id);

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('useClients: Error fetching clients:', error);
        toast({
          title: "Erro ao carregar clientes",
          description: "Não foi possível carregar a lista de clientes.",
          variant: "destructive",
        });
        throw error;
      }

      console.log('useClients: Clients fetched successfully:', data?.length);
      return data as Client[];
    },
    enabled: !!user?.id && !authLoading,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: forceRefresh ? 0 : 5 * 60 * 1000,
    gcTime: forceRefresh ? 0 : 10 * 60 * 1000,
  });
};
