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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, User, Video, MapPin, DollarSign, Users, Palette, AlertTriangle } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useClients } from '@/hooks/useClients';
import { useAppointments } from '@/hooks/useAppointments';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import AppointmentFinancialSection from './forms/AppointmentFinancialSection';

const appointmentSchema = z.object({
  clientId: z.string().optional(),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  price: z.string().optional(),
  startTime: z.string().min(1, 'Horário de início é obrigatório'),
  endTime: z.string().min(1, 'Horário de fim é obrigatório'),
  appointmentType: z.enum(['presencial', 'remoto']),
  videoCallLink: z.string().optional(),
  createFinancialRecord: z.boolean(),
  color: z.string(),
  sessionType: z.enum(['unique', 'recurring', 'personal']),
}).refine((data) => {
  // Validar se cliente foi selecionado quando não é compromisso pessoal
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
  // Validar link de videochamada quando é remoto
  if (data.appointmentType === 'remoto' && !data.videoCallLink?.trim()) {
    return false;
  }
  return true;
}, {
  message: "Link da videochamada é obrigatório para agendamentos remotos",
  path: ["videoCallLink"]
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  selectedDate: Date;
  selectedTime: string;
  onClose: () => void;
}

const COLORS = [
  { value: '#8B5CF6', color: 'bg-purple-500' },
  { value: '#3B82F6', color: 'bg-blue-500' },
  { value: '#10B981', color: 'bg-green-500' },
  { value: '#F59E0B', color: 'bg-yellow-500' },
  { value: '#EF4444', color: 'bg-red-500' },
  { value: '#EC4899', color: 'bg-pink-500' },
  { value: '#6366F1', color: 'bg-indigo-500' },
  { value: '#8B5A2B', color: 'bg-amber-700' },
];

const APPOINTMENT_TYPES = [
  { value: 'unique', label: 'Sessão Única', icon: Calendar },
  { value: 'recurring', label: 'Sessão Recorrente', icon: Calendar },
  { value: 'personal', label: 'Compromisso Pessoal', icon: User },
];

const AppointmentForm: React.FC<AppointmentFormProps> = ({ 
  selectedDate, 
  selectedTime, 
  onClose 
}) => {
  const { user } = useAuth();
  const { data: clients = [] } = useClients();
  const { data: appointments = [] } = useAppointments();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeConflictWarning, setTimeConflictWarning] = useState<string>('');

  // Calcular horário de fim padrão (1 hora após o início)
  const getDefaultEndTime = (startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + 1;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      clientId: '',
      title: '',
      description: '',
      price: '',
      startTime: selectedTime || '09:00',
      endTime: selectedTime ? getDefaultEndTime(selectedTime) : '10:00',
      appointmentType: 'presencial',
      videoCallLink: '',
      createFinancialRecord: true,
      color: '#8B5CF6',
      sessionType: 'unique',
    },
  });

  const sessionType = form.watch('sessionType');
  const appointmentType = form.watch('appointmentType');
  const selectedClientId = form.watch('clientId');
  const watchCreateFinancialRecord = form.watch('createFinancialRecord');
  const startTime = form.watch('startTime');
  const endTime = form.watch('endTime');

  // Função para verificar conflitos de horário
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
      
      // Verificar se é no mesmo dia
      if (!isSameDay(appointmentDate, selectedDate)) {
        return false;
      }

      // Verificar sobreposição de horários
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

      // Criar datetime para início e fim do agendamento
      const [startHours, startMinutes] = data.startTime.split(':').map(Number);
      const [endHours, endMinutes] = data.endTime.split(':').map(Number);
      
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(startHours, startMinutes, 0, 0);
      
      const endDateTime = new Date(selectedDate);
      endDateTime.setHours(endHours, endMinutes, 0, 0);

      const appointmentData = {
        user_id: user.id,
        client_id: data.sessionType === 'personal' ? null : data.clientId,
        title: data.title,
        description: data.description || null,
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
      };

      console.log('Creating appointment:', appointmentData);

      const { error } = await supabase
        .from('appointments')
        .insert(appointmentData);

      if (error) {
        console.error('Error creating appointment:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Agendamento criado",
        description: "O agendamento foi criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onClose();
    },
    onError: (error) => {
      console.error('Error creating appointment:', error);
      toast({
        title: "Erro ao criar agendamento",
        description: "Não foi possível criar o agendamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: AppointmentFormData) => {
    setIsSubmitting(true);
    try {
      await createAppointmentMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Watch startTime to update endTime automatically
  React.useEffect(() => {
    if (startTime) {
      const defaultEnd = getDefaultEndTime(startTime);
      form.setValue('endTime', defaultEnd);
    }
  }, [startTime, form]);

  // Reset client when switching to personal
  React.useEffect(() => {
    if (sessionType === 'personal') {
      form.setValue('clientId', '');
    }
  }, [sessionType, form]);

  // Update price when client is selected
  React.useEffect(() => {
    if (selectedClientId && sessionType !== 'personal') {
      const selectedClient = clients.find(client => client.id === selectedClientId);
      if (selectedClient && selectedClient.session_value) {
        form.setValue('price', selectedClient.session_value);
      }
    }
  }, [selectedClientId, clients, sessionType, form]);

  // Check for time conflicts when start or end time changes
  React.useEffect(() => {
    if (startTime && endTime) {
      const conflict = checkTimeConflict(startTime, endTime);
      setTimeConflictWarning(conflict);
    }
  }, [startTime, endTime, appointments, selectedDate]);

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Novo Agendamento
          </DialogTitle>
        </DialogHeader>

        {/* Date Info */}
        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg mb-4">
          <Calendar className="h-4 w-4 text-tanotado-blue" />
          <span className="text-sm">{format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
        </div>

        {/* Time Conflict Warning */}
        {timeConflictWarning && (
          <Alert className="mb-4 border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              {timeConflictWarning}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tipo de Agendamento */}
            <FormField
              control={form.control}
              name="sessionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Agendamento</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {APPOINTMENT_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <Button
                          key={type.value}
                          type="button"
                          variant={field.value === type.value ? "default" : "outline"}
                          className="h-20 flex flex-col gap-2"
                          onClick={() => field.onChange(type.value)}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-xs text-center">{type.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cliente (apenas se não for compromisso pessoal) */}
            {sessionType !== 'personal' && (
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {client.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {sessionType === 'personal' ? 'Título do Compromisso' : 'Título da Consulta'}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={
                        sessionType === 'personal' 
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

            {/* Time Fields */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Início</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        {...field} 
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Fim</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        {...field} 
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Modalidade da Sessão */}
            <FormField
              control={form.control}
              name="appointmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Modalidade da Sessão
                  </FormLabel>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={field.value === 'remoto'}
                        onCheckedChange={(checked) => 
                          field.onChange(checked ? 'remoto' : 'presencial')
                        }
                      />
                      <div className="flex items-center gap-2">
                        {field.value === 'remoto' ? (
                          <>
                            <Video className="h-4 w-4 text-blue-500" />
                            <span>Online</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4 text-green-500" />
                            <span>Presencial</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Link da Videochamada (se online) */}
            {appointmentType === 'remoto' && (
              <FormField
                control={form.control}
                name="videoCallLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link da Reunião Online</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://meet.google.com/..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Lançar Financeiro e Valor - usando o novo componente */}
            <AppointmentFinancialSection 
              control={form.control} 
              watchCreateFinancialRecord={watchCreateFinancialRecord} 
            />

            {/* Cor do Agendamento */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Cor do Agendamento
                  </FormLabel>
                  <div className="flex gap-1">
                    {COLORS.map((color) => (
                      <Button
                        key={color.value}
                        type="button"
                        variant="outline"
                        className={`h-8 w-8 p-0 rounded-full border-2 ${
                          field.value === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                        }`}
                        onClick={() => field.onChange(color.value)}
                      >
                        <div className={`w-6 h-6 rounded-full ${color.color}`} />
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={
                        sessionType === 'personal' 
                          ? "Adicione observações sobre o compromisso..." 
                          : "Adicione observações sobre a consulta..."
                      }
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
                {isSubmitting ? 'Criando...' : 'Criar Agendamento'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentForm;
