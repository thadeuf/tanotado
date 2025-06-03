
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { addWeeks, addMonths } from 'date-fns';
import { AppointmentFormData } from '@/schemas/appointmentSchema';

export const useAppointmentMutations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  console.log('useAppointmentMutations - user:', user?.id);

  const generateRecurrenceDates = (
    startDate: Date,
    type: 'weekly' | 'biweekly' | 'monthly',
    count: number
  ): Date[] => {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);

    for (let i = 0; i < count; i++) {
      dates.push(new Date(currentDate));
      
      switch (type) {
        case 'weekly':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'biweekly':
          currentDate = addWeeks(currentDate, 2);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
      }
    }

    return dates;
  };

  const createAppointmentMutation = useMutation({
    mutationFn: async ({ data, selectedDate }: { data: AppointmentFormData; selectedDate: Date }) => {
      console.log('createAppointmentMutation - Starting mutation with data:', data);
      console.log('createAppointmentMutation - selectedDate:', selectedDate);
      console.log('createAppointmentMutation - user:', user);

      if (!user?.id) {
        console.error('createAppointmentMutation - No user ID found');
        throw new Error('Usuário não autenticado');
      }

      const appointments = [];
      const dates = data.sessionType === 'recurring' && data.recurrenceType && data.recurrenceCount
        ? generateRecurrenceDates(selectedDate, data.recurrenceType, data.recurrenceCount)
        : [selectedDate];

      console.log('createAppointmentMutation - dates to create:', dates);

      const recurrenceGroupId = data.sessionType === 'recurring' ? crypto.randomUUID() : null;

      for (const date of dates) {
        const [startHours, startMinutes] = data.startTime.split(':').map(Number);
        const [endHours, endMinutes] = data.endTime.split(':').map(Number);
        
        const startDateTime = new Date(date);
        startDateTime.setHours(startHours, startMinutes, 0, 0);
        
        const endDateTime = new Date(date);
        endDateTime.setHours(endHours, endMinutes, 0, 0);

        console.log('createAppointmentMutation - Processing date:', date);
        console.log('createAppointmentMutation - startDateTime:', startDateTime);
        console.log('createAppointmentMutation - endDateTime:', endDateTime);

        const appointmentData = {
          user_id: user.id,
          client_id: data.sessionType === 'personal' ? null : (data.clientId || null),
          description: data.description || null,
          title: data.title || null,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          status: 'scheduled' as const,
          price: data.price ? parseFloat(data.price) : null,
          payment_status: 'pending' as const,
          appointment_type: data.appointmentType,
          video_call_link: data.appointmentType === 'remoto' ? data.videoCallLink : null,
          create_financial_record: data.createFinancialRecord,
          color: data.color,
          session_type: data.sessionType,
          recurrence_type: data.sessionType === 'recurring' ? data.recurrenceType : 'none',
          recurrence_count: data.sessionType === 'recurring' ? data.recurrenceCount : 1,
          recurrence_group_id: recurrenceGroupId,
        };

        console.log('createAppointmentMutation - appointmentData:', appointmentData);
        appointments.push(appointmentData);
      }

      console.log('createAppointmentMutation - Final appointments array:', appointments);
      console.log('createAppointmentMutation - About to insert into database...');

      const { data: insertResult, error } = await supabase
        .from('appointments')
        .insert(appointments)
        .select();

      console.log('createAppointmentMutation - Insert result:', insertResult);
      console.log('createAppointmentMutation - Insert error:', error);

      if (error) {
        console.error('createAppointmentMutation - Database error:', error);
        throw error;
      }

      console.log('createAppointmentMutation - Success! Created appointments:', insertResult?.length);
      return appointments.length;
    },
    onSuccess: (count) => {
      console.log('createAppointmentMutation - onSuccess called with count:', count);
      toast({
        title: "Agendamento(s) criado(s)",
        description: `${count} agendamento(s) ${count > 1 ? 'foram criados' : 'foi criado'} com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (error) => {
      console.error('createAppointmentMutation - onError called with error:', error);
      toast({
        title: "Erro ao criar agendamento(s)",
        description: "Não foi possível criar o(s) agendamento(s). Tente novamente.",
        variant: "destructive",
      });
    },
  });

  console.log('useAppointmentMutations - mutation object:', createAppointmentMutation);

  return {
    createAppointmentMutation,
    generateRecurrenceDates,
  };
};
