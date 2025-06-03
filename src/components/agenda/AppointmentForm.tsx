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
import { Calendar } from 'lucide-react';
import { format, isSameDay, addWeeks, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useClients } from '@/hooks/useClients';
import { useAppointments } from '@/hooks/useAppointments';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import AppointmentTypeSelector from './forms/AppointmentTypeSelector';
import AppointmentClientSelector from './forms/AppointmentClientSelector';
import AppointmentTimeFields from './forms/AppointmentTimeFields';
import AppointmentModalitySection from './forms/AppointmentModalitySection';
import AppointmentFinancialSection from './forms/AppointmentFinancialSection';
import AppointmentColorSelector from './forms/AppointmentColorSelector';
import AppointmentObservations from './forms/AppointmentObservations';
import AppointmentDateSelector from './forms/AppointmentDateSelector';
import AppointmentConflictAlert from './forms/AppointmentConflictAlert';
import AppointmentFormActions from './forms/AppointmentFormActions';
import AppointmentRecurrenceSection from './forms/AppointmentRecurrenceSection';
import AppointmentRecurrenceConfirmDialog from './forms/AppointmentRecurrenceConfirmDialog';

const appointmentSchema = z.object({
  clientId: z.string().optional(),
  description: z.string().optional(),
  title: z.string().optional(),
  price: z.string().optional(),
  startTime: z.string().min(1, 'Horário de início é obrigatório'),
  endTime: z.string().min(1, 'Horário de fim é obrigatório'),
  appointmentType: z.enum(['presencial', 'remoto']),
  videoCallLink: z.string().optional(),
  createFinancialRecord: z.boolean(),
  color: z.string(),
  sessionType: z.enum(['unique', 'recurring', 'personal']),
  recurrenceType: z.enum(['weekly', 'biweekly', 'monthly']).optional(),
  recurrenceCount: z.number().min(1).max(52).optional(),
}).refine((data) => {
  if (data.sessionType !== 'personal' && !data.clientId) {
    return false;
  }
  return true;
}, {
  message: "Cliente é obrigatório para agendamentos que não sejam compromissos pessoais",
  path: ["clientId"]
}).refine((data) => {
  const start = data.startTime.split(':').map(Number);
  const end = data.endTime.split(':').map(Number);
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  return endMinutes > startMinutes;
}, {
  message: "Horário de fim deve ser posterior ao horário de início",
  path: ["endTime"]
}).refine((data) => {
  if (data.sessionType !== 'personal' && data.appointmentType === 'remoto' && !data.videoCallLink?.trim()) {
    return false;
  }
  return true;
}, {
  message: "Link da videochamada é obrigatório para agendamentos remotos",
  path: ["videoCallLink"]
}).refine((data) => {
  if (data.sessionType === 'recurring' && (!data.recurrenceType || !data.recurrenceCount)) {
    return false;
  }
  return true;
}, {
  message: "Tipo e quantidade de recorrência são obrigatórios para sessões recorrentes",
  path: ["recurrenceType"]
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  selectedDate?: Date;
  selectedTime?: string;
  onClose: () => void;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ 
  selectedDate: initialSelectedDate, 
  selectedTime, 
  onClose 
}) => {
  const { user } = useAuth();
  const { data: clients = [] } = useClients();
  const { data: appointments = [] } = useAppointments();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeConflictWarning, setTimeConflictWarning] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(initialSelectedDate || new Date());
  const [showRecurrenceDialog, setShowRecurrenceDialog] = useState(false);
  const [recurrenceConflicts, setRecurrenceConflicts] = useState<any[]>([]);
  const [recurrenceDates, setRecurrenceDates] = useState<Date[]>([]);
  const [pendingFormData, setPendingFormData] = useState<AppointmentFormData | null>(null);

  const getDefaultEndTime = (startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + 1;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      clientId: '',
      description: '',
      title: '',
      price: '',
      startTime: selectedTime || '09:00',
      endTime: selectedTime ? getDefaultEndTime(selectedTime) : '10:00',
      appointmentType: 'presencial',
      videoCallLink: '',
      createFinancialRecord: true,
      color: '#8B5CF6',
      sessionType: 'unique',
      recurrenceType: 'weekly',
      recurrenceCount: 1,
    },
  });

  const sessionType = form.watch('sessionType');
  const appointmentType = form.watch('appointmentType');
  const selectedClientId = form.watch('clientId');
  const watchCreateFinancialRecord = form.watch('createFinancialRecord');
  const startTime = form.watch('startTime');
  const endTime = form.watch('endTime');
  const recurrenceType = form.watch('recurrenceType');
  const recurrenceCount = form.watch('recurrenceCount');

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

  const checkRecurrenceConflicts = (dates: Date[], startTime: string, endTime: string) => {
    const conflicts: any[] = [];
    
    dates.forEach(date => {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      const newStartDateTime = new Date(date);
      newStartDateTime.setHours(startHours, startMinutes, 0, 0);
      
      const newEndDateTime = new Date(date);
      newEndDateTime.setHours(endHours, endMinutes, 0, 0);

      const conflictingAppointment = appointments.find(appointment => {
        const appointmentDate = new Date(appointment.start_time);
        const appointmentEndDate = new Date(appointment.end_time);
        
        if (!isSameDay(appointmentDate, date)) {
          return false;
        }

        return (
          (newStartDateTime >= appointmentDate && newStartDateTime < appointmentEndDate) ||
          (newEndDateTime > appointmentDate && newEndDateTime <= appointmentEndDate) ||
          (newStartDateTime <= appointmentDate && newEndDateTime >= appointmentEndDate)
        );
      });

      if (conflictingAppointment) {
        conflicts.push({
          date,
          time: format(new Date(conflictingAppointment.start_time), 'HH:mm'),
          title: conflictingAppointment.title || 'Consulta'
        });
      }
    });

    return conflicts;
  };

  const checkTimeConflict = (startTime: string, endTime: string) => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const newStartDateTime = new Date(selectedDate);
    newStartDateTime.setHours(startHours, startMinutes, 0, 0);
    
    const newEndDateTime = new Date(selectedDate);
    newEndDateTime.setHours(endHours, endMinutes, 0, 0);

    const conflictingAppointment = appointments.find(appointment => {
      const appointmentDate = new Date(appointment.start_time);
      const appointmentEndDate = new Date(appointment.end_time);
      
      if (!isSameDay(appointmentDate, selectedDate)) {
        return false;
      }

      return (
        (newStartDateTime >= appointmentDate && newStartDateTime < appointmentEndDate) ||
        (newEndDateTime > appointmentDate && newEndDateTime <= appointmentEndDate) ||
        (newStartDateTime <= appointmentDate && newEndDateTime >= appointmentEndDate)
      );
    });

    if (conflictingAppointment) {
      const conflictStart = format(new Date(conflictingAppointment.start_time), 'HH:mm');
      const conflictEnd = format(new Date(conflictingAppointment.end_time), 'HH:mm');
      return `Já existe um agendamento neste horário: ${conflictingAppointment.title} (${conflictStart} - ${conflictEnd})`;
    }

    return '';
  };

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const appointments = [];
      const dates = data.sessionType === 'recurring' && data.recurrenceType && data.recurrenceCount
        ? generateRecurrenceDates(selectedDate, data.recurrenceType, data.recurrenceCount)
        : [selectedDate];

      const recurrenceGroupId = data.sessionType === 'recurring' ? crypto.randomUUID() : null;

      for (const date of dates) {
        const [startHours, startMinutes] = data.startTime.split(':').map(Number);
        const [endHours, endMinutes] = data.endTime.split(':').map(Number);
        
        const startDateTime = new Date(date);
        startDateTime.setHours(startHours, startMinutes, 0, 0);
        
        const endDateTime = new Date(date);
        endDateTime.setHours(endHours, endMinutes, 0, 0);

        const appointmentData = {
          user_id: user.id,
          client_id: data.sessionType === 'personal' ? null : data.clientId || null,
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

        appointments.push(appointmentData);
      }

      console.log('Creating appointments:', appointments);

      const { error } = await supabase
        .from('appointments')
        .insert(appointments);

      if (error) {
        console.error('Error creating appointments:', error);
        throw error;
      }

      return appointments.length;
    },
    onSuccess: (count) => {
      toast({
        title: "Agendamento(s) criado(s)",
        description: `${count} agendamento(s) ${count > 1 ? 'foram criados' : 'foi criado'} com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onClose();
    },
    onError: (error) => {
      console.error('Error creating appointments:', error);
      toast({
        title: "Erro ao criar agendamento(s)",
        description: "Não foi possível criar o(s) agendamento(s). Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: AppointmentFormData) => {
    if (data.sessionType === 'recurring' && data.recurrenceType && data.recurrenceCount) {
      const dates = generateRecurrenceDates(selectedDate, data.recurrenceType, data.recurrenceCount);
      const conflicts = checkRecurrenceConflicts(dates, data.startTime, data.endTime);
      
      setRecurrenceDates(dates);
      setRecurrenceConflicts(conflicts);
      setPendingFormData(data);
      setShowRecurrenceDialog(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await createAppointmentMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecurrenceConfirm = async () => {
    if (!pendingFormData) return;
    
    setIsSubmitting(true);
    setShowRecurrenceDialog(false);
    
    try {
      await createAppointmentMutation.mutateAsync(pendingFormData);
    } finally {
      setIsSubmitting(false);
      setPendingFormData(null);
    }
  };

  React.useEffect(() => {
    if (startTime) {
      const defaultEnd = getDefaultEndTime(startTime);
      form.setValue('endTime', defaultEnd);
    }
  }, [startTime, form]);

  React.useEffect(() => {
    if (sessionType === 'personal') {
      form.setValue('clientId', '');
      form.setValue('createFinancialRecord', false);
      form.setValue('price', '');
    } else {
      form.setValue('createFinancialRecord', true);
    }
  }, [sessionType, form]);

  React.useEffect(() => {
    if (selectedClientId && sessionType !== 'personal') {
      const selectedClient = clients.find(client => client.id === selectedClientId);
      if (selectedClient && selectedClient.session_value) {
        form.setValue('price', selectedClient.session_value);
      }
    }
  }, [selectedClientId, clients, sessionType, form]);

  React.useEffect(() => {
    if (startTime && endTime && sessionType !== 'recurring') {
      const conflict = checkTimeConflict(startTime, endTime);
      setTimeConflictWarning(conflict);
    } else {
      setTimeConflictWarning('');
    }
  }, [startTime, endTime, appointments, selectedDate, sessionType]);

  return (
    <>
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Novo Agendamento
            </DialogTitle>
          </DialogHeader>

          <AppointmentDateSelector 
            control={form.control}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />

          <AppointmentConflictAlert conflictMessage={timeConflictWarning} />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <AppointmentTypeSelector control={form.control} />
              
              {sessionType === 'personal' && (
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
              
              <AppointmentClientSelector control={form.control} sessionType={sessionType} />
              <AppointmentTimeFields control={form.control} />
              
              <AppointmentRecurrenceSection 
                control={form.control} 
                sessionType={sessionType}
                watchRecurrenceType={recurrenceType || ''}
              />
              
              {sessionType !== 'personal' && (
                <AppointmentModalitySection 
                  control={form.control} 
                  watchAppointmentType={appointmentType} 
                />
              )}

              {sessionType !== 'personal' && (
                <AppointmentFinancialSection 
                  control={form.control} 
                  watchCreateFinancialRecord={watchCreateFinancialRecord} 
                />
              )}

              <AppointmentColorSelector control={form.control} />
              <AppointmentObservations control={form.control} sessionType={sessionType} />
              <AppointmentFormActions 
                onCancel={onClose} 
                isSubmitting={isSubmitting} 
                submitLabel="Criar Agendamento" 
              />
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AppointmentRecurrenceConfirmDialog
        isOpen={showRecurrenceDialog}
        onClose={() => {
          setShowRecurrenceDialog(false);
          setPendingFormData(null);
        }}
        onConfirm={handleRecurrenceConfirm}
        conflicts={recurrenceConflicts}
        recurrenceDates={recurrenceDates}
        isLoading={isSubmitting}
      />
    </>
  );
};

export default AppointmentForm;
