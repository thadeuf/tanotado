
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useMemo } from 'react';

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

export const useClients = () => {
  const { user, isLoading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ['clients', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      console.log('🔄 Fetching clients for user:', user?.id);
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching clients:', error);
        toast({
          title: "Erro ao carregar clientes",
          description: "Não foi possível carregar a lista de clientes.",
          variant: "destructive",
        });
        throw error;
      }

      console.log('✅ Clients fetched successfully:', data?.length || 0, 'clients');
      return data as Client[];
    },
    enabled: !!user?.id && !authLoading,
    networkMode: 'always', // Sempre tentar fazer a requisição
  });

  const memoizedData = useMemo(() => query.data || [], [query.data]);

  return {
    ...query,
    data: memoizedData,
  };
};
