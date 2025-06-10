import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

// Estende o tipo padrão para incluir os dados do cliente que serão buscados em conjunto
export type PaymentWithClient = Database['public']['Tables']['payments']['Row'] & {
  clients: {
    name: string;
    avatar_url: string | null;
  } | null;
};

export const usePayments = () => {
  const { user, isLoading: authLoading } = useAuth();

  return useQuery<PaymentWithClient[], Error>({
    queryKey: ['payments', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      // Busca os pagamentos e junta informações da tabela 'clients'
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          clients (
            name,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .order('due_date', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        toast({
          title: "Erro ao carregar lançamentos",
          description: "Não foi possível carregar a lista de lançamentos financeiros.",
          variant: "destructive",
        });
        throw error;
      }

      return (data as PaymentWithClient[]) || [];
    },
    // A query só será executada se o usuário estiver autenticado
    enabled: !!user?.id && !authLoading,
  });
};