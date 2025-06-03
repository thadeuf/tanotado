import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useClients } from '@/hooks/useClients';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Appointment } from '@/hooks/useAppointments';
import { useAppointments } from '@/hooks/useAppointments';
import AppointmentTimeFields from './forms/AppointmentTimeFields';
import AppointmentModalitySection from './forms/AppointmentModalitySection';
import AppointmentStatusSelector from './forms/AppointmentStatusSelector';
import AppointmentFinancialSection from './forms/AppointmentFinancialSection';
import AppointmentColorSelector from './forms/AppointmentColorSelector';
import AppointmentObservations from './forms/AppointmentObservations';
import AppointmentDateTimeInfo from './forms/AppointmentDateTimeInfo';
import AppointmentClientInfoDisplay from './forms/AppointmentClientInfoDisplay';
import AppointmentFormActions from './forms/AppointmentFormActions';
import EditRecurrenceConfirmDialog from './forms/EditRecurrenceConfirmDialog';

const editAppointmentSchema = z.object({
  description: z.string().optional(),
  title: z.string().optional(),
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
  const { data: appointments = [] } = useAppointments();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEditRecurrenceDialog, setShowEditRecurrenceDialog] = useState(false);
  const [editConflicts, setEditConflicts] = useState<any[]>([]);
  const [pendingFormData, setPendingFormData] = useState<EditAppointmentFormData | null>(null);

  const appointmentDate = new Date(appointment.start_time);
  const startTime = format(new Date(appointment.start_time), 'HH:mm');
  const endTime = format(new Date(appointment.end_time), 'HH:mm');

  const form = useForm<EditAppointmentFormData>({
    resolver: zodResolver(editAppointmentSchema),
    defaultValues: {
      description: appointment.description || '',
      title: appointment.title || '',
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

  const checkTimeConflicts = (startTime: string, endTime: string, recurrenceGroupId?: string) => {
    const conflicts: any[] = [];
    
    if (!recurrenceGroupId) return conflicts;

    // Get all appointments in the same recurrence group
    const seriesAppointments = appointments.filter(apt => 
      apt.recurrence_group_id === recurrenceGroupId && apt.id !== appointment.id
    );

    seriesAppointments.forEach(seriesAppointment => {
      const seriesDate = new Date(seriesAppointment.start_time);
      const [newStartHours, newStartMinutes] = startTime.split(':').map(Number);
      const [newEndHours, newEndMinutes] = endTime.split(':').map(Number);
      
      const newStartDateTime = new Date(seriesDate);
      newStartDateTime.setHours(newStartHours, newStartMinutes, 0, 0);
      
      const newEndDateTime = new Date(seriesDate);
      newEndDateTime.setHours(newEndHours, newEndMinutes, 0, 0);

      // Check for conflicts with other appointments on the same date
      const conflictingAppointment = appointments.find(otherAppointment => {
        if (otherAppointment.recurrence_group_id === recurrenceGroupId) return false;
        
        const otherDate = new Date(otherAppointment.start_time);
        const otherEndDate = new Date(otherAppointment.end_time);
        
        if (!isSameDay(otherDate, seriesDate)) return false;

        return (
          (newStartDateTime >= otherDate && newStartDateTime < otherEndDate) ||
          (newEndDateTime > otherDate && newEndDateTime <= otherEndDate) ||
          (newStartDateTime <= otherDate && newEndDateTime >= otherEndDate)
        );
      });

      if (conflictingAppointment) {
        conflicts.push({
          date: seriesDate,
          time: format(new Date(conflictingAppointment.start_time), 'HH:mm'),
          title: conflictingAppointment.title || conflictingAppointment.client?.name || 'Agendamento'
        });
      }
    });

    return conflicts;
  };

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ data, editType }: { data: EditAppointmentFormData; editType: 'single' | 'series' }) => {
      const [startHours, startMinutes] = data.startTime.split(':').map(Number);
      const [endHours, endMinutes] = data.endTime.split(':').map(Number);
      
      const appointmentData = {
        description: data.description || null,
        title: data.title || null,
        status: data.status,
        price: data.price ? parseFloat(data.price) : null,
        appointment_type: data.appointmentType,
        video_call_link: data.videoCallLink || null,
        create_financial_record: data.createFinancialRecord,
        color: data.color,
        updated_at: new Date().toISOString(),
      };

      console.log('=== EDIT DEBUG ===');
      console.log('Editing appointment:', appointment.id, 'Type:', editType);
      console.log('Appointment data:', appointmentData);

      if (editType === 'series' && appointment.recurrence_group_id) {
        console.log('Editing series with recurrence_group_id:', appointment.recurrence_group_id);
        
        // For series edit, we need to handle time changes differently
        const timeDataForSeries = {
          ...appointmentData,
        };

        // Get all appointments in the series to update times individually
        const { data: seriesAppointments, error: queryError } = await supabase
          .from('appointments')
          .select('*')
          .eq('recurrence_group_id', appointment.recurrence_group_id);

        if (queryError) {
          console.error('Error querying series appointments:', queryError);
          throw queryError;
        }

        console.log('Found appointments in series:', seriesAppointments);

        // Update each appointment in the series with new times
        const updatePromises = seriesAppointments?.map(async (seriesAppointment) => {
          const seriesDate = new Date(seriesAppointment.start_time);
          
          const newStartDateTime = new Date(seriesDate);
          newStartDateTime.setHours(startHours, startMinutes, 0, 0);
          
          const newEndDateTime = new Date(seriesDate);
          newEndDateTime.setHours(endHours, endMinutes, 0, 0);

          return supabase
            .from('appointments')
            .update({
              ...timeDataForSeries,
              start_time: newStartDateTime.toISOString(),
              end_time: newEndDateTime.toISOString(),
            })
            .eq('id', seriesAppointment.id);
        }) || [];

        const results = await Promise.all(updatePromises);
        
        for (const result of results) {
          if (result.error) {
            console.error('Error updating appointment in series:', result.error);
            throw result.error;
          }
        }

        console.log('Successfully updated', results.length, 'appointments in series');
      } else {
        console.log('Editing single appointment with ID:', appointment.id);
        
        const startDateTime = new Date(appointmentDate);
        startDateTime.setHours(startHours, startMinutes, 0, 0);
        
        const endDateTime = new Date(appointmentDate);
        endDateTime.setHours(endHours, endMinutes, 0, 0);

        const { error } = await supabase
          .from('appointments')
          .update({
            ...appointmentData,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
          })
          .eq('id', appointment.id);

        if (error) {
          console.error('Error updating single appointment:', error);
          throw error;
        }
      }
    },
    onSuccess: (_, { editType }) => {
      const message = editType === 'series' 
        ? "Toda a série de agendamentos foi atualizada com sucesso."
        : "Agendamento atualizado com sucesso.";
      
      toast({
        title: "Agendamento(s) atualizado(s)",
        description: message,
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setShowEditRecurrenceDialog(false);
      setPendingFormData(null);
      onClose();
    },
    onError: (error) => {
      console.error('Error updating appointment:', error);
      toast({
        title: "Erro ao atualizar agendamento",
        description: "Não foi possível atualizar o agendamento. Tente novamente.",
        variant: "destructive",
      });
      setShowEditRecurrenceDialog(false);
      setPendingFormData(null);
    },
  });

  const onSubmit = async (data: EditAppointmentFormData) => {
    setIsSubmitting(true);
    
    try {
      // Check if this is a recurring appointment and if time is being changed
      const originalStartTime = format(new Date(appointment.start_time), 'HH:mm');
      const isTimeChanged = data.startTime !== originalStartTime || data.endTime !== endTime;
      
      if (appointment.session_type === 'recurring' && appointment.recurrence_group_id && isTimeChanged) {
        // Check for conflicts when editing the series
        const conflicts = checkTimeConflicts(data.startTime, data.endTime, appointment.recurrence_group_id);
        setEditConflicts(conflicts);
        setPendingFormData(data);
        setShowEditRecurrenceDialog(true);
        setIsSubmitting(false);
        return;
      }

      // For non-recurring appointments or recurring without time changes, update directly
      await updateAppointmentMutation.mutateAsync({ data, editType: 'single' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSingle = () => {
    if (pendingFormData) {
      updateAppointmentMutation.mutate({ 
        data: pendingFormData, 
        editType: 'single' 
      });
    }
  };

  const handleEditSeries = () => {
    if (pendingFormData) {
      updateAppointmentMutation.mutate({ 
        data: pendingFormData, 
        editType: 'series' 
      });
    }
  };

  const handleCloseEditDialog = () => {
    setShowEditRecurrenceDialog(false);
    setPendingFormData(null);
    setEditConflicts([]);
  };

  const selectedClient = clients.find(client => client.id === appointment.client_id);

  return (
    <>
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

              {appointment.session_type === 'personal' && (
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título do Compromisso</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Reunião, Consulta médica..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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
                isSubmitting={isSubmitting || updateAppointmentMutation.isPending} 
                submitLabel="Salvar Alterações" 
              />
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Recurrence Confirmation Dialog */}
      <EditRecurrenceConfirmDialog
        isOpen={showEditRecurrenceDialog}
        onClose={handleCloseEditDialog}
        onEditSingle={handleEditSingle}
        onEditSeries={handleEditSeries}
        conflicts={editConflicts}
        isLoading={updateAppointmentMutation.isPending}
      />
    </>
  );
};

export default EditAppointmentForm;
