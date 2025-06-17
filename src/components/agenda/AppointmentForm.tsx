import React, { useState, useEffect, useCallback } from 'react';
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, User, Loader2, Check, ChevronsUpDown, Video, Repeat, UserCheck, Briefcase, Lock, AlertCircle, DollarSign, UserX } from 'lucide-react';import { Badge } from '@/components/ui/badge';
import { format, addWeeks, addMonths, getDay, isSameDay, addMinutes, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useClients } from '@/hooks/useClients';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAppointments, Appointment } from '@/hooks/useAppointments';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { v4 as uuidv4 } from 'uuid';
import { useUserSettings } from '@/hooks/useUserSettings';

const SESSION_TYPES = [
  { value: 'sessao_unica', label: 'Sessão Única', icon: UserCheck },
  { value: 'sessoes_recorrentes', label: 'Sessões Recorrentes', icon: Repeat },
  { value: 'compromisso_pessoal', label: 'Compromisso Pessoal', icon: Briefcase },
  { value: 'bloqueio', label: 'Bloquear Horário', icon: Lock },
] as const;

const APPOINTMENT_COLORS = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Amarelo' },
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#06B6D4', label: 'Ciano' },
  { value: '#84CC16', label: 'Lima' },
] as const;

const appointmentSchema = z.object({
  clientId: z.string().optional(),
  title: z.string().optional(),
  // 1. Adicionamos 'bloqueio' à lista de tipos permitidos
  sessionType: z.enum(['sessao_unica', 'sessoes_recorrentes', 'compromisso_pessoal', 'bloqueio'], {
    required_error: 'Selecione o tipo de evento',
  }),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Hora inválida. Use o formato HH:mm."),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Hora inválida. Use o formato HH:mm."),
  isOnline: z.boolean().default(false),
  onlineUrl: z.string().optional(),
  description: z.string().optional(),
  price: z.string().optional(),
  launchFinancial: z.boolean().default(false),
  color: z.string().default('#3B82F6'),
  recurrence_frequency: z.string().optional(),
  recurrence_count: z.coerce.number().int().positive().optional(),
}).superRefine((data, ctx) => {
  // 2. Agrupamos a lógica para os tipos que não precisam de cliente
  if (data.sessionType === 'compromisso_pessoal' || data.sessionType === 'bloqueio') {
    if (!data.title || data.title.trim().length < 2) {
      // A mensagem de erro se adapta ao tipo selecionado
      const message = data.sessionType === 'bloqueio' ? 'O motivo do bloqueio é obrigatório.' : 'O título do compromisso é obrigatório.';
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['title'], message });
    }
  } else { // Esta lógica agora se aplica apenas aos tipos com cliente
    if (!data.clientId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['clientId'], message: 'Selecione um cliente.' });
    }
  }
  // O resto da validação permanece igual
  if (data.sessionType === 'sessoes_recorrentes') {
    if (!data.recurrence_count || data.recurrence_count <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['recurrence_count'], message: 'A quantidade de repetições deve ser maior que 0.' });
    }
    if (!data.recurrence_frequency) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'A frequência é obrigatória.', path: ['recurrence_frequency'] });
    }
  }
  if (data.end_time <= data.start_time) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['end_time'], message: 'O horário de término deve ser posterior ao de início.' });
  }
  if (data.isOnline && data.onlineUrl && data.onlineUrl.trim()) {
    try { new URL(data.onlineUrl); } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['onlineUrl'], message: 'URL da sessão online inválida.' });
    }
  }
  if (data.launchFinancial && (!data.price || parseFloat(data.price) <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['price'],
      message: 'O valor é obrigatório para fazer o lançamento financeiro.',
    });
  }
});


type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  selectedDate: Date;
  selectedTime: string;
  onClose: () => void;
  initialData?: Appointment | null;
}

type FullAppointment = Appointment & {
  recurrence_group_id?: string | null;
  online_url?: string | null;
};

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  selectedDate,
  selectedTime,
  onClose,
  initialData
}) => {
  const { user } = useAuth();
  const { data: clientsData, isLoading: clientsLoading, error: clientsError } = useClients();
  const { data: allAppointmentsData = [] } = useAppointments();
  const { data: settings } = useUserSettings();
  const allAppointments = allAppointmentsData as FullAppointment[];
  const queryClient = useQueryClient();
  const clients = Array.isArray(clientsData) ? clientsData : [];

  const [appointmentDate, setAppointmentDate] = useState<Date>(initialData ? new Date(initialData.start_time) : selectedDate);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientComboOpen, setClientComboOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [timeConflict, setTimeConflict] = useState<FullAppointment | null>(null);
  const [isUpdateAlertOpen, setIsUpdateAlertOpen] = useState(false);
  const [formDataToUpdate, setFormDataToUpdate] = useState<AppointmentFormData | null>(null);

  const isEditing = !!initialData;
  const initial = initialData as FullAppointment | null;

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      sessionType: 'sessao_unica',
      start_time: selectedTime || '',
      isOnline: false,
      launchFinancial: false,
      color: '#3B82F6',
      recurrence_frequency: 'weekly',
      recurrence_count: 4,
    },
  });

  const isDayDisabled = useCallback((date: Date): boolean => {
    if (date < new Date(new Date().setHours(0, 0, 0, 0)) && !isSameDay(date, new Date())) {
      return true;
    }
    if (settings && settings.working_hours) {
        const workingDays = settings.working_hours as any;
        const dayOfWeek = getDay(date);
        const dayKeyMap: { [key: number]: string } = {
            0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday',
        };
        const dayKey = dayKeyMap[dayOfWeek];
        if (workingDays[dayKey] && workingDays[dayKey].enabled === false) {
            return true;
        }
    }
    return false;
  }, [settings]);

  useEffect(() => {
    if (isEditing && initial) {
        let sessionType: AppointmentFormData['sessionType'] = 'sessao_unica';
        // A lógica original já identifica um compromisso/bloqueio corretamente
        if (initial.recurrence_group_id) {
            sessionType = 'sessoes_recorrentes';
        } else if (!initial.client_id) {
            sessionType = 'compromisso_pessoal';
        }

        let recurrenceCount = 0;
        if (initial.recurrence_group_id && allAppointments.length > 0) {
            recurrenceCount = allAppointments.filter(
                app => app.recurrence_group_id === initial?.recurrence_group_id
            ).length;
        }

        form.reset({
            clientId: initial.client_id || undefined,
            title: initial.title || '',
            sessionType: sessionType,
            start_time: format(new Date(initial.start_time), 'HH:mm'),
            end_time: format(new Date(initial.end_time), 'HH:mm'),
            isOnline: initial.is_online,
            onlineUrl: initial.online_url || '',
            description: initial.description || '',
            price: initial.price?.toString() || '',
            launchFinancial: !!initial.price,
            color: initial.color || '#3B82F6',
            recurrence_frequency: initial.recurrence_type || 'weekly',
            recurrence_count: recurrenceCount > 0 ? recurrenceCount : undefined,
        });
    }
  }, [initial, isEditing, allAppointments, form]);

  const watchedStartTime = form.watch('start_time');
  const watchedEndTime = form.watch('end_time');
  const watchedClient = form.watch('clientId');
  const watchedIsOnline = form.watch('isOnline');
  const watchedSessionType = form.watch('sessionType');
  const watchedLaunchFinancial = form.watch('launchFinancial');

  useEffect(() => {
    if (!watchedStartTime || !watchedEndTime) {
      setTimeConflict(null);
      return;
    }
    try {
      const [startHours, startMinutes] = watchedStartTime.split(':').map(Number);
      const newStartTime = new Date(appointmentDate);
      newStartTime.setHours(startHours, startMinutes, 0, 0);

      const [endHours, endMinutes] = watchedEndTime.split(':').map(Number);
      const newEndTime = new Date(appointmentDate);
      newEndTime.setHours(endHours, endMinutes, 0, 0);

      const conflictingAppointment = allAppointments.find(app => {
        if (isEditing && app.id === initial?.id) return false;
        const existingStartTime = new Date(app.start_time);
        const existingEndTime = new Date(app.end_time);
        return newStartTime < existingEndTime && newEndTime > existingStartTime;
      });
      setTimeConflict(conflictingAppointment || null);
    } catch (e) {
      setTimeConflict(null);
    }
  }, [appointmentDate, watchedStartTime, watchedEndTime, allAppointments, isEditing, initial]);

  useEffect(() => {
    if (watchedClient && !isEditing) {
      const selectedClient = clients.find(c => c.id === watchedClient);
      if (selectedClient?.session_value) { 
        form.setValue('price', selectedClient.session_value.toString());
      }
    }
  }, [watchedClient, clients, form, isEditing]);

  const filteredClients = clients.filter(client => 
    client.name?.toLowerCase().includes(clientSearch.toLowerCase().trim())
  );
  
  const createMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const [startHours, startMinutes] = data.start_time.split(':').map(Number);
      const startDateTime = new Date(appointmentDate);
      startDateTime.setHours(startHours, startMinutes, 0, 0);
      const [endHours, endMinutes] = data.end_time.split(':').map(Number);
      const endDateTime = new Date(appointmentDate);
      endDateTime.setHours(endHours, endMinutes, 0, 0);
      
      let appointmentsToInsert = [];
      const baseAppointment = {
          user_id: user.id, description: data.description || null, status: 'scheduled' as const,
          price: data.price ? parseFloat(data.price) : null,
          is_online: data.isOnline, online_url: data.isOnline && data.onlineUrl ? data.onlineUrl : null,
          color: data.color
      };
      
      const getAppointmentType = (sessionType: (typeof SESSION_TYPES)[number]['value']) => {
          if (sessionType === 'bloqueio') return 'block';
          if (sessionType === 'compromisso_pessoal') return 'personal';
          return 'appointment';
      };

      if (data.sessionType === 'sessoes_recorrentes' && data.clientId) {
          const recurrence_group_id = uuidv4();
          const count = data.recurrence_count || 1;
          const selectedClient = clients.find(c => c.id === data.clientId);
          if (!selectedClient) throw new Error("Cliente não encontrado.");
          for (let i = 0; i < count; i++) {
              let nextStart = new Date(startDateTime);
              let nextEnd = new Date(endDateTime);
              if (i > 0) {
                  if (data.recurrence_frequency === 'weekly') { nextStart = addWeeks(nextStart, i); nextEnd = addWeeks(nextEnd, i); }
                  else if (data.recurrence_frequency === 'biweekly') { nextStart = addWeeks(nextEnd, i * 2); }
                  else if (data.recurrence_frequency === 'monthly') { nextStart = addMonths(nextStart, i); nextEnd = addMonths(nextEnd, i); }
              }
              appointmentsToInsert.push({
                  ...baseAppointment, client_id: data.clientId!, title: selectedClient.name,
                  start_time: nextStart.toISOString(), end_time: nextEnd.toISOString(),
                  recurrence_group_id, recurrence_type: data.recurrence_frequency as any,
                  appointment_type: 'appointment',
              });
          }
      } else {
          const selectedClient = data.clientId ? clients.find(c => c.id === data.clientId) : null;
          const isClientEvent = data.sessionType === 'sessao_unica';
          
          appointmentsToInsert.push({
              ...baseAppointment,
              client_id: isClientEvent ? data.clientId! : null,
              title: isClientEvent ? selectedClient!.name : data.title!,
              start_time: startDateTime.toISOString(), end_time: endDateTime.toISOString(),
              appointment_type: getAppointmentType(data.sessionType),
          });
      }

      const { data: newlyCreatedAppointments, error } = await supabase
          .from('appointments')
          .insert(appointmentsToInsert as any)
          .select();

      if (error) throw error;
      if (!newlyCreatedAppointments) return;

      if (data.launchFinancial && data.price && parseFloat(data.price) > 0 && (data.sessionType === 'sessao_unica' || data.sessionType === 'sessoes_recorrentes')) {
        const paymentsToInsert = newlyCreatedAppointments.map(app => ({
          user_id: user.id,
          client_id: app.client_id,
          appointment_id: app.id,
          amount: app.price,
          status: 'pending' as const,
          due_date: app.start_time,
          notes: `Sessão do dia ${format(parseISO(app.start_time), 'dd/MM/yyyy')}`
        }));

        if (paymentsToInsert.length > 0) {
          const { error: paymentError } = await supabase.from('payments').insert(paymentsToInsert as any);
          if (paymentError) {
            toast({
              title: "Atenção: Erro no Financeiro",
              description: "Os eventos foram criados, mas houve um erro ao gerar os lançamentos financeiros.",
              variant: "destructive",
            });
            console.error("Erro ao criar lançamentos financeiros:", paymentError);
          }
        }
      }
    },
    onSuccess: () => {
        toast({ title: "Sucesso!", description: "Seu(s) evento(s) foi/foram adicionado(s) com sucesso." });
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        onClose();
    },
    onError: (error) => { toast({ title: "Erro ao salvar", description: `Ocorreu um erro: ${(error as Error).message}`, variant: "destructive" }); },
    onSettled: () => { setIsSubmitting(false); }
  });

  const updateMutation = useMutation({
    mutationFn: async (vars: { scope: 'one' | 'all'; updates: Partial<AppointmentFormData> }) => {
        const { scope, updates } = vars;
        if (!initial) throw new Error("Agendamento inicial não encontrado para edição.");

        const getUpdatesPayload = (data: AppointmentFormData) => {
            const selectedClient = data.clientId ? clients.find(c => c.id === data.clientId) : null;
            const startDateTime = new Date(appointmentDate);
            const [startHours, startMinutes] = data.start_time.split(':').map(Number);
            startDateTime.setHours(startHours, startMinutes, 0, 0);
            const endDateTime = new Date(appointmentDate);
            const [endHours, endMinutes] = data.end_time.split(':').map(Number);
            endDateTime.setHours(endHours, endMinutes, 0, 0);

            // A sessionType vem dos valores do formulário, que são definidos no useEffect inicial
            const isBlock = data.sessionType === 'compromisso_pessoal';

            return {
                client_id: isBlock ? null : data.clientId,
                title: isBlock ? data.title : selectedClient?.name,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                is_online: data.isOnline,
                online_url: data.isOnline && data.onlineUrl ? data.onlineUrl : null,
                description: data.description,
                price: data.price ? parseFloat(data.price) : null,
                color: data.color,
                // ALTERAÇÃO 6: Garante que o tipo seja atualizado corretamente
                appointment_type: isBlock ? 'block' : 'appointment',
            };
        };

        const finalUpdates = getUpdatesPayload(updates as AppointmentFormData);

        if (scope === 'all' && initial.recurrence_group_id) {
            const newStartTimeOfDay = new Date(finalUpdates.start_time);
            const newEndTimeOfDay = new Date(finalUpdates.end_time);

            const seriesAppointments = allAppointments.filter(a => a.recurrence_group_id === initial?.recurrence_group_id);
            const updatePromises = seriesAppointments.map(app => {
                const currentStartDate = new Date(app.start_time);
                const newAppStartTime = new Date(currentStartDate.getFullYear(), currentStartDate.getMonth(), currentStartDate.getDate(), newStartTimeOfDay.getHours(), newStartTimeOfDay.getMinutes());
                const newAppEndTime = new Date(currentStartDate.getFullYear(), currentStartDate.getMonth(), currentStartDate.getDate(), newEndTimeOfDay.getHours(), newEndTimeOfDay.getMinutes());
                
                // Remove o appointment_type do payload de recorrência, pois ele não muda
                const { appointment_type, ...restOfUpdates } = finalUpdates;
                
                return supabase.from('appointments').update({ ...restOfUpdates, start_time: newAppStartTime.toISOString(), end_time: newAppEndTime.toISOString() }).eq('id', app.id);
            });
            const results = await Promise.all(updatePromises);
            const firstError = results.find(res => res.error)?.error;
            if (firstError) throw firstError;
        } else {
            const { error } = await supabase.from('appointments').update(finalUpdates).eq('id', initial.id);
            if (error) throw error;
        }
    },
    onSuccess: () => {
        toast({ title: "Agendamento atualizado!", description: "Sua agenda foi atualizada." });
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        onClose();
    },
    onError: (error: any) => { toast({ title: "Erro ao atualizar", description: `Ocorreu um erro: ${error.message}`, variant: "destructive" }); },
    onSettled: () => {
        setIsSubmitting(false);
        setFormDataToUpdate(null);
        setIsUpdateAlertOpen(false);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status }: { status: 'completed' | 'no_show' }) => {
      if (!initialData) throw new Error("Agendamento não encontrado para atualizar status.");
      
      const { error } = await supabase
        .from('appointments')
        .update({ status: status })
        .eq('id', initialData.id);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      const statusText = status === 'completed' ? 'Concluído' : 'Faltou';
      toast({ title: `Status atualizado para "${statusText}"!` });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar status", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = async (data: AppointmentFormData) => {
    if (isDayDisabled(appointmentDate)) {
      toast({
        title: "Data Inválida",
        description: "Não é possível criar ou mover um evento para um dia que você não atende.",
        variant: "destructive"
      });
      return;
    }
    
    if (settings && settings.working_hours) {
        const workingHours = settings.working_hours as any;
        const settingsStartTime = workingHours.start_time || '00:00';
        const settingsEndTime = workingHours.end_time || '23:59';

        if (data.start_time < settingsStartTime || data.end_time > settingsEndTime) {
            toast({
                title: "Horário fora do expediente",
                description: `Seu horário de atendimento neste dia é das ${settingsStartTime} às ${settingsEndTime}.`,
                variant: "destructive",
            });
            return;
        }
    }

    setIsSubmitting(true);
    if (isEditing && initial) {
        const dateChanged = new Date(initial.start_time).toDateString() !== appointmentDate.toDateString();
        const timeChanged = format(new Date(initial.start_time), 'HH:mm') !== data.start_time || format(new Date(initial.end_time), 'HH:mm') !== data.end_time;
        
        if (initial.recurrence_group_id && (dateChanged || timeChanged)) {
            setFormDataToUpdate(data);
            setIsUpdateAlertOpen(true);
            return;
        }
        updateMutation.mutate({ scope: 'one', updates: data });
    } else {
        createMutation.mutate(data);
    }
  };

  if (clientsError) {
    return ( <Dialog open={true} onOpenChange={onClose}><DialogContent><DialogHeader><DialogTitle>Erro</DialogTitle></DialogHeader><p className="text-red-500">Não foi possível carregar a lista de clientes.</p></DialogContent></Dialog> );
  }
  const selectedClient = clients.find(client => client.id === form.watch('clientId'));

  const isClientEvent = watchedSessionType === 'sessao_unica' || watchedSessionType === 'sessoes_recorrentes';

  return (
    <>
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {isEditing ? 'Editar Evento' : 'Novo Evento na Agenda'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="p-3 border rounded-lg flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm text-foreground">
                        {format(appointmentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </span>
                </div>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" type="button">Alterar</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                        <CalendarPicker 
                          mode="single" 
                          selected={appointmentDate} 
                          onSelect={(date) => { if (date) { setAppointmentDate(date); setIsDatePickerOpen(false); } }} 
                          initialFocus 
                          disabled={isDayDisabled}
                        />
                    </PopoverContent>
                </Popover>
            </div>
            
            {isEditing && initial && initial.client_id && ( // Só mostra status para agendamentos com cliente
              <div className="grid grid-cols-2 gap-2 pt-2 animate-fade-in">
                <Button
                  type="button"
                  variant={initial.status === 'completed' ? 'default' : 'outline'}
                  className={cn("h-auto py-2", initial.status === 'completed' ? 'bg-green-600 hover:bg-green-700' : 'border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700')}
                  onClick={() => updateStatusMutation.mutate({ status: 'completed' })}
                  disabled={updateStatusMutation.isPending}
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  {initial.status === 'completed' ? 'Compareceu' : 'Marcar Comparecimento'}
                </Button>
                <Button
                  type="button"
                  variant={initial.status === 'no_show' ? 'destructive' : 'outline'}
                  className={cn("h-auto py-2", initial.status !== 'no_show' && 'border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600')}
                  onClick={() => updateStatusMutation.mutate({ status: 'no_show' })}
                  disabled={updateStatusMutation.isPending}
                >
                  <UserX className="mr-2 h-4 w-4" />
                  {initial.status === 'no_show' ? 'Faltou' : 'Marcar Falta'}
                </Button>
              </div>
            )}
            
            {isEditing && initial ? (
              <div className="p-3 border rounded-lg bg-muted/30">
                  {/* ALTERAÇÃO 7: Ajusta label e ícone na edição */}
                  <FormLabel>{initial.client_id ? 'Cliente' : 'Bloqueio'}</FormLabel>
                  <div className="font-semibold text-foreground pt-1 flex items-center gap-2">
                    {initial.client_id ? <User className="h-4 w-4 text-muted-foreground"/> : <Lock className="h-4 w-4 text-muted-foreground"/>}
                    {initial.title}
                  </div>
              </div>
            ) : (
              <>
                <FormField
                  control={form.control} name="sessionType" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-2">
                          {SESSION_TYPES.map((type) => {
                            const IconComponent = type.icon;
                            return (
                              <Button key={type.value} type="button" variant={field.value === type.value ? "default" : "outline"}
                                className={cn("h-auto p-3 flex flex-col items-center gap-2 text-center", field.value === type.value && "bg-gradient-to-r from-tanotado-pink to-tanotado-purple text-white")}
                                onClick={() => field.onChange(type.value)}>
                                <IconComponent className="w-4 h-4" />
                                <span className="text-xs font-medium leading-tight">{type.label}</span>
                              </Button>
                            );
                          })}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              
              {isClientEvent ? (
    <FormField control={form.control} name="clientId" render={({ field }) => (
        <FormItem className="flex flex-col">
            <FormLabel className="flex items-center gap-2"><User className="h-4 w-4" />Cliente</FormLabel>
            <Popover open={clientComboOpen} onOpenChange={setClientComboOpen}>
                <PopoverTrigger asChild>
                    <FormControl>
                        <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")} disabled={clientsLoading}>
                            {clientsLoading ? (<><Loader2 className="h-4 w-4 animate-spin" />Carregando...</>) : selectedClient ? (<div className="flex items-center gap-2 truncate"><User className="h-4 w-4 shrink-0" /><span className="truncate">{selectedClient.name}</span></div>) : "Selecione um cliente"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput placeholder="Buscar cliente..." value={clientSearch} onValueChange={setClientSearch} />
                        <CommandList>
                            {filteredClients.length === 0 ? (<CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>) : (<CommandGroup>{filteredClients.map((client) => (<CommandItem key={client.id} value={client.id} onSelect={() => { field.onChange(client.id); setClientComboOpen(false); }}><Check className={cn("mr-2 h-4 w-4", field.value === client.id ? "opacity-100" : "opacity-0")} />{client.name}</CommandItem>))}</CommandGroup>)}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <FormMessage />
        </FormItem>
    )} />
) : (
    <FormField control={form.control} name="title" render={({ field }) => (
        <FormItem>
            <FormLabel>{watchedSessionType === 'bloqueio' ? 'Motivo do Bloqueio' : 'Título do Compromisso'}</FormLabel>
            <FormControl>
                <Input placeholder={watchedSessionType === 'bloqueio' ? "Ex: Almoço, Férias" : "Ex: Reunião de equipe"} {...field} />
            </FormControl>
            <FormMessage />
        </FormItem>
    )} />
)}
              </>
            )}
            
            {watchedSessionType === 'sessoes_recorrentes' && !isEditing && (
                <div className="p-3 border rounded-lg space-y-4 bg-muted/30">
                    <FormField control={form.control} name="recurrence_frequency" render={({ field }) => (
                        <FormItem><FormLabel>Frequência</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="weekly">Semanal</SelectItem><SelectItem value="biweekly">Quinzenal</SelectItem><SelectItem value="monthly">Mensal</SelectItem></SelectContent>
                        </Select><FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="recurrence_count" render={({ field }) => (
                        <FormItem><FormLabel>Repetir por</FormLabel>
                        <div className="flex items-center gap-2"><FormControl><Input type="number" min="1" className="w-20" {...field} /></FormControl><span className="text-sm text-muted-foreground">sessões</span></div>
                        <FormMessage />
                        </FormItem>
                    )} />
                </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <FormField 
                control={form.control} 
                name="start_time" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Início</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e); 
                          const startTimeValue = e.target.value;
                          if (startTimeValue && /^\d{2}:\d{2}$/.test(startTimeValue) && settings?.appointment_duration) {
                            const [hours, minutes] = startTimeValue.split(':').map(Number);
                            const startDate = new Date();
                            startDate.setHours(hours, minutes, 0, 0);
                            const newEndDate = addMinutes(startDate, settings.appointment_duration);
                            const newEndTime = format(newEndDate, 'HH:mm');
                            form.setValue('end_time', newEndTime, { shouldValidate: true });
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />
              <FormField control={form.control} name="end_time" render={({ field }) => (<FormItem><FormLabel>Término</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>

            {timeConflict && ( <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Atenção: Conflito de Horário!</AlertTitle><AlertDescription>Já existe um evento com <strong>"{timeConflict.title}"</strong> que se sobrepõe a este horário.</AlertDescription></Alert> )}
            
            <FormField control={form.control} name="isOnline" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center gap-2">
                            <Video className="h-4 w-4" />
                            Sessão Online
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                            Ativar para sessões por videoconferência
                        </p>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
            )} />
            
            {watchedIsOnline && (<FormField control={form.control} name="onlineUrl" render={({ field }) => (<FormItem><FormLabel>URL da Sala</FormLabel><FormControl><Input placeholder="https://meet.google.com/..." {...field} /></FormControl><FormMessage /></FormItem>)} />)}
            
            {isClientEvent && !isEditing && (
              <div className="space-y-4">
                  <FormField
                      control={form.control}
                      name="launchFinancial"
                      render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                  <FormLabel className="text-base flex items-center gap-2">
                                      <DollarSign className="h-4 w-4" />
                                      Lançar no Financeiro
                                  </FormLabel>
                                  <p className="text-sm text-muted-foreground">
                                      Registrar valor no controle financeiro
                                  </p>
                              </div>
                              <FormControl>
                                  <Switch disabled={isEditing} checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                          </FormItem>
                      )}
                  />

                  {watchedLaunchFinancial && (
                      <div className="animate-fade-in pl-4 border-l-2 border-primary/50">
                          <FormField
                              control={form.control}
                              name="price"
                              render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>Valor da sessão</FormLabel>
                                      <FormControl>
                                          <Input disabled={isEditing} type="number" step="0.01" placeholder="Ex: 150.00" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                      </div>
                  )}
              </div>
            )}
            
            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Observações (opcional)</FormLabel><FormControl><Textarea placeholder="Adicione observações importantes..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="color" render={({ field }) => (<FormItem><FormLabel>Cor do Evento</FormLabel><FormControl><div className="flex flex-wrap gap-2">{APPOINTMENT_COLORS.map(c => (<button type="button" key={c.value} onClick={() => field.onChange(c.value)} className={cn("w-8 h-8 rounded-full border-2", field.value === c.value ? 'ring-2 ring-offset-2 ring-primary border-primary' : 'border-transparent')} style={{ backgroundColor: c.value }} />))}</div></FormControl></FormItem>)} />

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
              <Button type="submit" disabled={isSubmitting || clientsLoading || updateMutation.isPending || createMutation.isPending} className="flex-1 bg-gradient-to-r from-tanotado-pink to-tanotado-purple hover:shadow-lg transition-all">
                {(isSubmitting || updateMutation.isPending || createMutation.isPending) ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</>) : (isEditing ? 'Salvar Alterações' : 'Criar Evento')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={isUpdateAlertOpen} onOpenChange={setIsUpdateAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Editar Agendamento Recorrente</AlertDialogTitle>
                <AlertDialogDescription>
                    Você alterou a data ou o horário de um agendamento recorrente. Deseja aplicar esta alteração apenas a este agendamento ou a toda a série?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
                <AlertDialogCancel onClick={() => setIsSubmitting(false)}>Cancelar</AlertDialogCancel>
                <Button
                  variant="outline"
                  onClick={() => formDataToUpdate && updateMutation.mutate({ scope: 'one', updates: formDataToUpdate })}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Alterar Somente Este
                </Button>
                <Button
                  onClick={() => formDataToUpdate && updateMutation.mutate({ scope: 'all', updates: formDataToUpdate })}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Alterar Toda a Série
                </Button>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default AppointmentForm;