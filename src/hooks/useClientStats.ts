
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
        throw new Error('Usuário não autenticado ou ID do cliente não fornecido');
      }

      console.log('Fetching client stats for:', clientId);

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

      return {
        totalSessions,
        attendedSessions,
        missedSessions,
        totalRevenue
      };
    },
    enabled: !!user?.id && !!clientId && !authLoading,
  });

  const memoizedData = useMemo(() => query.data, [query.data]);

  return {
    ...query,
    data: memoizedData,
  };
};
