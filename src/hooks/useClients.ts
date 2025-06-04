
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
      
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Error fetching clients:', error);
          
          // Check if it's an auth error
          if (error.message?.includes('JWT') || error.message?.includes('session')) {
            console.log('🔑 Auth error detected, will retry after refresh');
            throw new Error('Session expired - will retry');
          }
          
          toast({
            title: "Erro ao carregar clientes",
            description: "Não foi possível carregar a lista de clientes.",
            variant: "destructive",
          });
          throw error;
        }

        console.log('✅ Clients fetched successfully:', data?.length || 0, 'clients');
        return data as Client[];
      } catch (error) {
        console.error('💥 Unexpected error in useClients:', error);
        throw error;
      }
    },
    enabled: !!user?.id && !authLoading,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true, // Enable refetch on focus
    refetchOnReconnect: true, // Enable refetch on reconnect
    retry: (failureCount, error) => {
      console.log(`🔄 Retry attempt ${failureCount} for useClients:`, error?.message);
      
      // Don't retry auth errors immediately
      if (error?.message?.includes('não autenticado')) {
        return false;
      }
      
      // Retry session errors
      if (error?.message?.includes('Session expired')) {
        return failureCount < 3;
      }
      
      return failureCount < 2;
    },
    retryDelay: attemptIndex => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 10000);
      console.log(`⏳ Retrying useClients in ${delay}ms`);
      return delay;
    },
  });

  // Memoize o resultado para evitar re-renderizações desnecessárias
  const memoizedData = useMemo(() => query.data || [], [query.data]);

  // Log query state changes for debugging
  console.log('📊 useClients state:', {
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error?.message,
    dataLength: memoizedData.length,
    enabled: !!user?.id && !authLoading
  });

  return {
    ...query,
    data: memoizedData,
  };
};
