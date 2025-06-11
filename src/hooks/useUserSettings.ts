import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

// O tipo pode ser exportado para uso em outros lugares se necessário
export type UserSettings = Database['public']['Tables']['user_settings']['Row'];

export const useUserSettings = () => {
  const { user, isLoading: authLoading } = useAuth();

  return useQuery<UserSettings | null, Error>({
    // A chave da query inclui o user?.id para ser única por usuário
    queryKey: ['user_settings', user?.id],
    queryFn: async () => {
      // Não executa se não houver usuário
      if (!user?.id) {
        return null;
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single(); // .single() espera uma única linha ou nenhuma

      // Se o erro for 'PGRST116', significa que nenhuma linha foi encontrada, o que é um estado válido (usuário ainda não salvou config).
      // Não tratamos isso como um erro fatal.
      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar configurações do usuário:', error);
        throw error; // Lança outros erros para o React Query tratar
      }

      return data;
    },
    // A query só será ativada quando a autenticação não estiver mais carregando e houver um ID de usuário
    enabled: !authLoading && !!user?.id,
  });
};