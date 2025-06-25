// src/hooks/useAppointments.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

// Este tipo representa um único agendamento como ele vem do banco de dados,
// com o acréscimo dos dados do cliente através do join.
export type Appointment = {
  id: string; // O ID é uma string (uuid)
  user_id: string;
  client_id: string | null;
  title: string;
  start_time: string; // ISO 8601 string
  end_time: string;   // ISO 8601 string
  description: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  price: number | null;
  is_online: boolean; // Campo existente no seu form, mas não no hook. Adicionando.
  online_url: string | null;
  color: string; // Campo existente no seu form, mas não no hook. Adicionando.
  recurrence_type: 'weekly' | 'biweekly' | 'monthly' | null;
  recurrence_group_id: string | null;
  created_at: string;
  updated_at: string;
  appointment_type: 'appointment' | 'block'; // <-- CAMPO ADICIONADO
  // --- INÍCIO DA ALTERAÇÃO ---
  session_notes: { id: string }[];
  // --- FIM DA ALTERAÇÃO ---
  clients: {
    id: string;
    name: string;
  } | null;
};


export const useAppointments = (month?: Date) => {
  const { user } = useAuth();
  
  const fetchAppointments = async () => {
    if (!user) return [];

    const dateToQuery = month || new Date();
    const startDate = startOfMonth(dateToQuery).toISOString();
    const endDate = endOfMonth(dateToQuery).toISOString();
    
    // --- INÍCIO DA ALTERAÇÃO ---
    // A query com select(`*, ...`) já busca todos os campos da tabela appointments.
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        clients (
          id,
          name
        ),
        session_notes (
          id
        )
      `)
      // --- FIM DA ALTERAÇÃO ---
      .eq('user_id', user.id)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      throw new Error(error.message);
    }
    
    return data as unknown as Appointment[]; // Faz o cast para o tipo corrigido
  };

  return useQuery<Appointment[], Error>({
    // Corrigindo a chave da query para ser única e válida
    queryKey: ['appointments', month ? month.toISOString().slice(0, 7) : 'current', user?.id],
    queryFn: fetchAppointments,
    enabled: !!user, // A query só executa se o usuário estiver logado
  });
};