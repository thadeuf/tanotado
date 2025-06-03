
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
import { Calendar, User, Video, MapPin, DollarSign, Palette } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useClients } from '@/hooks/useClients';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Appointment } from '@/hooks/useAppointments';

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
  sessionType: z.enum(['unique', 'recurring', 'personal']),
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
      sessionType: (appointment.session_type as 'unique' | 'recurring' | 'personal') || 'unique',
    },
  });

  const watchAppointmentType = form.watch('appointmentType');
  const watchSessionType = form.watch('sessionType');
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
        session_type: data.sessionType,
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

            {/* Cliente (apenas exibição) */}
            {watchSessionType !== 'personal' && (
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
                    {watchSessionType === 'personal' ? 'Título do Compromisso' : 'Título da Consulta'}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={
                        watchSessionType === 'personal' 
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
            {watchAppointmentType === 'remoto' && (
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

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="scheduled">Pendente</SelectItem>
                      <SelectItem value="no_show">Faltou</SelectItem>
                      <SelectItem value="confirmed">Compareceu</SelectItem>
                      <SelectItem value="cancelled">Suspenso</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lançar Financeiro e Valor */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="createFinancialRecord"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Lançar no Financeiro
                    </FormLabel>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <span className="text-sm text-muted-foreground">
                          {field.value ? 'Será criado registro financeiro' : 'Não será criado registro financeiro'}
                        </span>
                      </div>
                      {watchCreateFinancialRecord && (
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field: priceField }) => (
                            <FormItem className="flex-shrink-0 w-32">
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  placeholder="0,00"
                                  {...priceField} 
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                  <div className="grid grid-cols-4 gap-2">
                    {COLORS.map((color) => (
                      <Button
                        key={color.value}
                        type="button"
                        variant="outline"
                        className={`h-12 flex items-center justify-center ${
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
