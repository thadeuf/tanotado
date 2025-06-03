
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Client {
  id: string;
  name: string;
  photo_url?: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  client_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  price: number | null;
  payment_status: 'pending' | 'paid' | 'overdue';
  recurrence_type: string | null;
  recurrence_end_date: string | null;
  created_at: string;
  updated_at: string;
  appointment_type?: 'presencial' | 'remoto';
  video_call_link?: string | null;
  create_financial_record?: boolean | null;
  color?: string | null;
  session_type?: 'unique' | 'recurring' | 'personal';
  client?: Client;
}

export const useAppointments = () => {
  const { user, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['appointments', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      console.log('Fetching appointments for user:', user?.id);
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          client:clients(
            id,
            name,
            photo_url
          )
        `)
        .eq('user_id', user?.id)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        toast({
          title: "Erro ao carregar agendamentos",
          description: "Não foi possível carregar a lista de agendamentos.",
          variant: "destructive",
        });
        throw error;
      }

      console.log('Appointments fetched:', data);
      return data as Appointment[];
    },
    enabled: !!user?.id && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
