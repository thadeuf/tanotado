
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

      console.log('📊 Fetching stats for client:', clientId);

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

      console.log('✅ Client stats fetched successfully');
      return {
        totalSessions,
        attendedSessions,
        missedSessions,
        totalRevenue
      };
    },
    enabled: !!user?.id && !!clientId && !authLoading,
    staleTime: 2 * 60 * 1000, // 2 minutos para estatísticas
    gcTime: 10 * 60 * 1000,
    retry: 3,
  });
};
