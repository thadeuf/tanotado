
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

export const useClientStats = (clientId: string) => {
  const { user, isLoading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ['client-stats', clientId, user?.id],
    queryFn: async () => {
      if (!user?.id || !clientId) {
        console.error('useClientStats: Missing user ID or client ID', { userId: user?.id, clientId });
        throw new Error('Usuário não autenticado ou ID do cliente não fornecido');
      }

      console.log('useClientStats: Starting fetch for client:', clientId);

      try {
        // Buscar todos os agendamentos do cliente em paralelo
        const [appointmentsResult, paymentsResult] = await Promise.all([
          supabase
            .from('appointments')
            .select('id, status')
            .eq('client_id', clientId)
            .eq('user_id', user.id),
          supabase
            .from('payments')
            .select('amount')
            .eq('client_id', clientId)
            .eq('user_id', user.id)
        ]);

        if (appointmentsResult.error) {
          console.error('useClientStats: Error fetching appointments:', appointmentsResult.error);
          throw appointmentsResult.error;
        }

        if (paymentsResult.error) {
          console.error('useClientStats: Error fetching payments:', paymentsResult.error);
          throw paymentsResult.error;
        }

        const appointments = appointmentsResult.data || [];
        const payments = paymentsResult.data || [];

        console.log('useClientStats: Data fetched - appointments:', appointments.length, 'payments:', payments.length);

        // Calcular estatísticas
        const totalSessions = appointments.length;
        const attendedSessions = appointments.filter(apt => 
          apt.status === 'completed' || apt.status === 'confirmed'
        ).length;
        const missedSessions = appointments.filter(apt => 
          apt.status === 'cancelled'
        ).length;
        
        // Calcular total de valores
        const totalRevenue = payments.reduce((total, payment) => {
          return total + (Number(payment.amount) || 0);
        }, 0);

        const stats = {
          totalSessions,
          attendedSessions,
          missedSessions,
          totalRevenue
        };

        console.log('useClientStats: Stats calculated:', stats);
        return stats;
      } catch (error) {
        console.error('useClientStats: Unexpected error:', error);
        throw error;
      }
    },
    enabled: !!user?.id && !!clientId && !authLoading,
    staleTime: 3 * 60 * 1000, // 3 minutos
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      console.log('useClientStats: Retry attempt', failureCount, error);
      if (error?.message?.includes('não autenticado')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: attemptIndex => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 5000);
      console.log('useClientStats: Retrying in', delay, 'ms');
      return delay;
    },
  });

  // Memoize o resultado para evitar re-renderizações desnecessárias
  const memoizedData = useMemo(() => query.data, [query.data]);

  return {
    ...query,
    data: memoizedData,
  };
};
