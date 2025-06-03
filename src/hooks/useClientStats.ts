
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useClientStats = (clientId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client-stats', clientId],
    queryFn: async () => {
      if (!user?.id || !clientId) {
        console.error('useClientStats: Missing user ID or client ID', { userId: user?.id, clientId });
        throw new Error('Usuário não autenticado ou ID do cliente não fornecido');
      }

      console.log('useClientStats: Starting fetch for client:', clientId);

      try {
        // Buscar todos os agendamentos do cliente
        console.log('useClientStats: Fetching appointments...');
        const { data: appointments, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*')
          .eq('client_id', clientId)
          .eq('user_id', user.id);

        if (appointmentsError) {
          console.error('useClientStats: Error fetching appointments:', appointmentsError);
          throw appointmentsError;
        }

        console.log('useClientStats: Appointments fetched:', appointments?.length || 0);

        // Buscar dados financeiros (pagamentos relacionados ao cliente)
        console.log('useClientStats: Fetching payments...');
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .eq('client_id', clientId)
          .eq('user_id', user.id);

        if (paymentsError) {
          console.error('useClientStats: Error fetching payments:', paymentsError);
          throw paymentsError;
        }

        console.log('useClientStats: Payments fetched:', payments?.length || 0);

        // Calcular estatísticas
        const totalSessions = appointments?.length || 0;
        const attendedSessions = appointments?.filter(apt => 
          apt.status === 'completed' || apt.status === 'confirmed'
        ).length || 0;
        const missedSessions = appointments?.filter(apt => 
          apt.status === 'cancelled'
        ).length || 0;
        
        // Calcular total de valores vencidos
        const totalRevenue = payments?.reduce((total, payment) => {
          return total + (Number(payment.amount) || 0);
        }, 0) || 0;

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
    enabled: !!user?.id && !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: (failureCount, error) => {
      console.log('useClientStats: Retry attempt', failureCount, error);
      return failureCount < 2;
    },
    retryDelay: attemptIndex => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 5000);
      console.log('useClientStats: Retrying in', delay, 'ms');
      return delay;
    },
  });
};
