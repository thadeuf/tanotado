
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useClientStats = (clientId: string) => {
  const { user, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['client-stats', clientId, user?.id],
    queryFn: async () => {
      if (!user?.id || !clientId) {
        throw new Error('Usuário não autenticado ou ID do cliente não fornecido');
      }

      console.log('Fetching stats for client:', clientId);

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
        throw appointmentsResult.error;
      }

      if (paymentsResult.error) {
        throw paymentsResult.error;
      }

      const appointments = appointmentsResult.data || [];
      const payments = paymentsResult.data || [];

      const totalSessions = appointments.length;
      const attendedSessions = appointments.filter(apt => 
        apt.status === 'completed' || apt.status === 'confirmed'
      ).length;
      const missedSessions = appointments.filter(apt => 
        apt.status === 'cancelled'
      ).length;
      
      const totalRevenue = payments.reduce((total, payment) => {
        return total + (Number(payment.amount) || 0);
      }, 0);

      const stats = {
        totalSessions,
        attendedSessions,
        missedSessions,
        totalRevenue
      };

      console.log('Client stats calculated:', stats);
      return stats;
    },
    enabled: !!user?.id && !!clientId && !authLoading,
    // Usa as configurações globais do queryClient
  });
};
