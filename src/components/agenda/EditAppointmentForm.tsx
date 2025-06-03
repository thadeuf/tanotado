
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useClients } from '@/hooks/useClients';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Appointment } from '@/hooks/useAppointments';
import AppointmentTimeFields from './forms/AppointmentTimeFields';
import AppointmentModalitySection from './forms/AppointmentModalitySection';
import AppointmentStatusSelector from './forms/AppointmentStatusSelector';
import AppointmentFinancialSection from './forms/AppointmentFinancialSection';
import AppointmentColorSelector from './forms/AppointmentColorSelector';
import AppointmentObservations from './forms/AppointmentObservations';
import AppointmentDateTimeInfo from './forms/AppointmentDateTimeInfo';
import AppointmentClientInfoDisplay from './forms/AppointmentClientInfoDisplay';
import AppointmentFormActions from './forms/AppointmentFormActions';

const editAppointmentSchema = z.object({
  description: z.string().optional(),
  price: z.string().optional(),
  startTime: z.string().min(1, 'Horário de início é obrigatório'),
  endTime: z.string().min(1, 'Horário de fim é obrigatório'),
  status: z.enum(['scheduled', 'confirmed', 'no_show', 'cancelled']),
  appointmentType: z.enum(['presencial', 'remoto']),
  videoCallLink: z.string().optional(),
  createFinancialRecord: z.boolean(),
  color: z.string(),
}).refine((data) => {
  const start = data.startTime.split(':').map(Number);
  const end = data.endTime.split(':').map(Number);
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  return endMinutes > startMinutes;
}, {
  message: "Horário de fim deve ser posterior ao horário de início",
  path: ["endTime"]
});

type EditAppointmentFormData = z.infer<typeof editAppointmentSchema>;

interface EditAppointmentFormProps {
  appointment: Appointment;
  onClose: () => void;
}

const EditAppointmentForm: React.FC<EditAppointmentFormProps> = ({ 
  appointment, 
  onClose 
}) => {
  const { data: clients = [] } = useClients();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const appointmentDate = new Date(appointment.start_time);
  const startTime = format(new Date(appointment.start_time), 'HH:mm');
  const endTime = format(new Date(appointment.end_time), 'HH:mm');

  const form = useForm<EditAppointmentFormData>({
    resolver: zodResolver(editAppointmentSchema),
    defaultValues: {
      description: appointment.description || '',
      price: appointment.price ? appointment.price.toString() : '',
      startTime: startTime,
      endTime: endTime,
      status: appointment.status as 'scheduled' | 'confirmed' | 'no_show' | 'cancelled',
      appointmentType: (appointment.appointment_type as 'presencial' | 'remoto') || 'presencial',
      videoCallLink: appointment.video_call_link || '',
      createFinancialRecord: appointment.create_financial_record ?? true,
      color: appointment.color || '#8B5CF6',
    },
  });

  const watchAppointmentType = form.watch('appointmentType');
  const watchCreateFinancialRecord = form.watch('createFinancialRecord');

  const updateAppointmentMutation = useMutation({
    mutationFn: async (data: EditAppointmentFormData) => {
      const [startHours, startMinutes] = data.startTime.split(':').map(Number);
      const [endHours, endMinutes] = data.endTime.split(':').map(Number);
      
      const startDateTime = new Date(appointmentDate);
      startDateTime.setHours(startHours, startMinutes, 0, 0);
      
      const endDateTime = new Date(appointmentDate);
      endDateTime.setHours(endHours, endMinutes, 0, 0);

      const appointmentData = {
        description: data.description || null,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: data.status,
        price: data.price ? parseFloat(data.price) : null,
        appointment_type: data.appointmentType,
        video_call_link: data.videoCallLink || null,
        create_financial_record: data.createFinancialRecord,
        color: data.color,
        updated_at: new Date().toISOString(),
      };

      console.log('Updating appointment:', appointmentData);

      const { error } = await supabase
        .from('appointments')
        .update(appointmentData)
        .eq('id', appointment.id);

      if (error) {
        console.error('Error updating appointment:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Agendamento atualizado",
        description: "O agendamento foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onClose();
    },
    onError: (error) => {
      console.error('Error updating appointment:', error);
      toast({
        title: "Erro ao atualizar agendamento",
        description: "Não foi possível atualizar o agendamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: EditAppointmentFormData) => {
    setIsSubmitting(true);
    try {
      await updateAppointmentMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClient = clients.find(client => client.id === appointment.client_id);

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Editar Agendamento
          </DialogTitle>
        </DialogHeader>

        <AppointmentDateTimeInfo date={appointmentDate} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <AppointmentClientInfoDisplay 
              client={selectedClient} 
              sessionType={appointment.session_type} 
            />

            <AppointmentTimeFields control={form.control} />

            {appointment.session_type !== 'personal' && (
              <AppointmentModalitySection 
                control={form.control} 
                watchAppointmentType={watchAppointmentType} 
              />
            )}

            <AppointmentStatusSelector control={form.control} />

            {appointment.session_type !== 'personal' && (
              <AppointmentFinancialSection 
                control={form.control} 
                watchCreateFinancialRecord={watchCreateFinancialRecord} 
              />
            )}

            <AppointmentColorSelector control={form.control} />
            <AppointmentObservations 
              control={form.control} 
              sessionType={appointment.session_type || 'unique'} 
            />
            <AppointmentFormActions 
              onCancel={onClose} 
              isSubmitting={isSubmitting} 
              submitLabel="Salvar Alterações" 
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAppointmentForm;
