
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useClientStats = (clientId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client-stats', clientId],
    queryFn: async () => {
      if (!user?.id || !clientId) {
        throw new Error('Usuário não autenticado ou ID do cliente não fornecido');
      }

      console.log('Fetching client stats for client:', clientId);

      // Buscar todos os agendamentos do cliente
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', clientId)
        .eq('user_id', user.id);

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
        throw appointmentsError;
      }

      // Buscar dados financeiros (pagamentos relacionados ao cliente)
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('client_id', clientId)
        .eq('user_id', user.id);

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
        throw paymentsError;
      }

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

      console.log('Client stats calculated:', {
        totalSessions,
        attendedSessions,
        missedSessions,
        totalRevenue
      });

      return {
        totalSessions,
        attendedSessions,
        missedSessions,
        totalRevenue
      };
    },
    enabled: !!user?.id && !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
