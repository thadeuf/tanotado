
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar, User } from 'lucide-react';
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

const editAppointmentSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  price: z.string().optional(),
  startTime: z.string().min(1, 'Horário de início é obrigatório'),
  endTime: z.string().min(1, 'Horário de fim é obrigatório'),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']),
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
      title: appointment.title,
      description: appointment.description || '',
      price: appointment.price ? appointment.price.toString() : '',
      startTime: startTime,
      endTime: endTime,
      status: appointment.status as 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show',
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
        title: data.title,
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

        {/* Date Info */}
        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg mb-4">
          <Calendar className="h-4 w-4 text-tanotado-blue" />
          <span className="text-sm">{format(appointmentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Cliente (apenas exibição) */}
            {appointment.session_type !== 'personal' && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-tanotado-blue" />
                  <span className="text-sm font-medium">Cliente</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedClient?.name || 'Cliente não encontrado'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  O cliente não pode ser alterado após o agendamento ser criado
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {appointment.session_type === 'personal' ? 'Título do Compromisso' : 'Título da Consulta'}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={
                        appointment.session_type === 'personal' 
                          ? "Ex: Reunião, Consulta médica..." 
                          : "Ex: Consulta inicial, Retorno..."
                      } 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AppointmentTimeFields control={form.control} />

            <AppointmentModalitySection 
              control={form.control} 
              watchAppointmentType={watchAppointmentType} 
            />

            <AppointmentStatusSelector control={form.control} />

            <AppointmentFinancialSection 
              control={form.control} 
              watchCreateFinancialRecord={watchCreateFinancialRecord} 
            />

            <AppointmentColorSelector control={form.control} />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Adicione observações sobre a consulta..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-tanotado-pink to-tanotado-purple hover:shadow-lg transition-all duration-200"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAppointmentForm;
