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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, User, Loader2, Check, ChevronsUpDown, Video, DollarSign, Palette, Users, Repeat, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useClients } from '@/hooks/useClients';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Tipos de sessão com ícones
const SESSION_TYPES = [
  { value: 'sessao_unica', label: 'Sessão Única', color: 'bg-blue-500', icon: UserCheck },
  { value: 'sessoes_recorrentes', label: 'Sessões recorrentes', color: 'bg-green-500', icon: Repeat },
  { value: 'compromisso_pessoal', label: 'Compromisso pessoal', color: 'bg-purple-500', icon: User },
] as const;

// Cores disponíveis para personalização
const APPOINTMENT_COLORS = [
  { value: '#3B82F6', label: 'Azul', color: 'bg-blue-500' },
  { value: '#EF4444', label: 'Vermelho', color: 'bg-red-500' },
  { value: '#10B981', label: 'Verde', color: 'bg-green-500' },
  { value: '#F59E0B', label: 'Amarelo', color: 'bg-yellow-500' },
  { value: '#8B5CF6', label: 'Roxo', color: 'bg-purple-500' },
  { value: '#EC4899', label: 'Rosa', color: 'bg-pink-500' },
  { value: '#06B6D4', label: 'Ciano', color: 'bg-cyan-500' },
  { value: '#84CC16', label: 'Lima', color: 'bg-lime-500' },
] as const;

const appointmentSchema = z.object({
  clientId: z.string().min(1, 'Selecione um cliente'),
  sessionType: z.enum(['sessao_unica', 'sessoes_recorrentes', 'compromisso_pessoal'], {
    required_error: 'Selecione o tipo de sessão',
  }),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Hora inválida. Use o formato HH:mm."),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Hora inválida. Use o formato HH:mm."),
  isOnline: z.boolean().default(false),
  onlineUrl: z.string().optional(),
  description: z.string().optional(),
  price: z.string().optional(),
  launchFinancial: z.boolean().default(false),
  color: z.string().default('#3B82F6'),
}).refine(data => data.end_time > data.start_time, {
  message: "O horário de término deve ser maior que o de início.",
  path: ["end_time"],
}).refine(data => {
  if (data.isOnline && data.onlineUrl && data.onlineUrl.trim()) {
    try {
      new URL(data.onlineUrl);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}, {
  message: "URL inválida para a sessão online.",
  path: ["onlineUrl"],
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  selectedDate: Date;
  selectedTime: string;
  onClose: () => void;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  selectedDate,
  selectedTime,
  onClose
}) => {
  const { user } = useAuth();
  const { data: clientsData, isLoading: clientsLoading, error: clientsError } = useClients();
  const queryClient = useQueryClient();
  
  const clients = Array.isArray(clientsData) ? clientsData : [];
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientComboOpen, setClientComboOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      clientId: '',
      sessionType: 'sessao_unica',
      description: '',
      price: '',
      start_time: selectedTime || '',
      end_time: '',
      isOnline: false,
      onlineUrl: '',
      launchFinancial: false,
      color: '#3B82F6',
    },
  });

  const watchedClient = form.watch('clientId');
  const watchedIsOnline = form.watch('isOnline');

  // Atualiza o preço quando o cliente é selecionado
  React.useEffect(() => {
    if (watchedClient) {
      const selectedClient = clients.find(c => c.id === watchedClient);
      if (selectedClient?.default_price) {
        form.setValue('price', selectedClient.default_price.toString());
      }
    }
  }, [watchedClient, clients, form]);

  const filteredClients = clients.filter(client => {
    const searchTerm = clientSearch.toLowerCase().trim();
    const clientName = client.name?.toLowerCase() || '';
    const clientEmail = client.email?.toLowerCase() || '';
    const clientPhone = client.phone || '';
    
    return clientName.includes(searchTerm) ||
           clientEmail.includes(searchTerm) ||
           clientPhone.includes(searchTerm);
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const selectedClient = clients.find(c => c.id === data.clientId);
      if (!selectedClient) {
        throw new Error("Cliente selecionado não encontrado.");
      }

      const [startHours, startMinutes] = data.start_time.split(':').map(Number);
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(startHours, startMinutes, 0, 0);

      const [endHours, endMinutes] = data.end_time.split(':').map(Number);
      const endDateTime = new Date(selectedDate);
      endDateTime.setHours(endHours, endMinutes, 0, 0);

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        throw new RangeError('O valor do horário fornecido é inválido.');
      }

      const appointmentData = {
        user_id: user.id,
        client_id: data.clientId,
        title: selectedClient.name,
        session_type: data.sessionType,
        description: data.description || null,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: 'scheduled' as const,
        price: data.price ? parseFloat(data.price) : null,
        payment_status: 'pending' as const,
        is_online: data.isOnline,
        online_url: data.isOnline && data.onlineUrl ? data.onlineUrl : null,
        color: data.color,
      };

      const { error } = await supabase
        .from('appointments')
        .insert([appointmentData]);

      if (error) {
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
      console.error('Erro ao criar agendamento:', error);
      toast({
        title: "Erro ao criar agendamento",
        description: error.message || "Não foi possível criar o agendamento. Tente novamente.",
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

  if (clientsError) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Erro ao carregar dados
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Não foi possível carregar a lista de clientes. Tente novamente.
            </p>
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const selectedClient = clients.find(client => client.id === form.watch('clientId'));

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Novo Agendamento
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-tanotado-blue" />
            <span>{format(selectedDate, "d 'de' MMMM 'de' uuuu", { locale: ptBR })}</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Cliente
                  </FormLabel>
                  <Popover open={clientComboOpen} onOpenChange={setClientComboOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={clientsLoading}
                        >
                          {clientsLoading ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Carregando clientes...
                            </div>
                          ) : selectedClient ? (
                            <div className="flex items-center gap-2 truncate">
                              <User className="h-4 w-4 shrink-0" />
                              <span className="truncate">{selectedClient.name}</span>
                            </div>
                          ) : clients.length === 0 ? (
                            "Nenhum cliente cadastrado"
                          ) : (
                            "Selecione um cliente"
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Buscar cliente..."
                          value={clientSearch}
                          onValueChange={setClientSearch}
                        />
                        <CommandList>
                          {clientsLoading ? (
                            <CommandEmpty>
                              <div className="flex items-center gap-2 py-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Carregando...
                              </div>
                            </CommandEmpty>
                          ) : filteredClients.length === 0 ? (
                            <CommandEmpty>
                              {clients.length === 0 
                                ? "Nenhum cliente cadastrado" 
                                : "Nenhum cliente encontrado"
                              }
                            </CommandEmpty>
                          ) : (
                            <CommandGroup>
                              {filteredClients.map((client) => (
                                <CommandItem
                                  key={client.id}
                                  value={client.id}
                                  onSelect={() => {
                                    field.onChange(client.id);
                                    setClientComboOpen(false);
                                    setClientSearch('');
                                  }}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <User className="h-4 w-4 shrink-0" />
                                    <div className="flex flex-col min-w-0 flex-1">
                                      <span className="font-medium truncate">{client.name}</span>
                                      {client.email && (
                                        <span className="text-xs text-muted-foreground truncate">
                                          {client.email}
                                        </span>
                                      )}
                                      {client.phone && (
                                        <span className="text-xs text-muted-foreground">
                                          {client.phone}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Check
                                    className={cn(
                                      "ml-2 h-4 w-4 shrink-0",
                                      client.id === field.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                  {clients.length === 0 && !clientsLoading && (
                    <p className="text-xs text-muted-foreground">
                      Nenhum cliente cadastrado. 
                      <span className="text-primary cursor-pointer hover:underline ml-1">
                        Cadastre um cliente primeiro.
                      </span>
                    </p>
                  )}
                </FormItem>
              )}
            />

            {/* Tipo de Sessão com ícones */}
            <FormField
              control={form.control}
              name="sessionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Sessão</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-3 gap-2">
                      {SESSION_TYPES.map((type) => {
                        const IconComponent = type.icon;
                        return (
                          <Button
                            key={type.value}
                            type="button"
                            variant={field.value === type.value ? "default" : "outline"}
                            className={cn(
                              "h-auto p-3 flex flex-col items-center gap-2",
                              field.value === type.value && "bg-gradient-to-r from-tanotado-pink to-tanotado-purple"
                            )}
                            onClick={() => field.onChange(type.value)}
                          >
                            <IconComponent className="w-4 h-4" />
                            <span className="text-xs font-medium text-center leading-tight">{type.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Início
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Término
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Switch Sessão Online */}
            <FormField
              control={form.control}
              name="isOnline"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="flex items-center gap-2 text-base">
                      <Video className="h-4 w-4" />
                      Sessão Online
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Ativar para sessões por videoconferência
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* URL da Sala Online */}
            {watchedIsOnline && (
              <FormField
                control={form.control}
                name="onlineUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Sala de Reunião (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://meet.google.com/xxx-xxxx-xxx"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Link para Google Meet, Zoom, Teams ou outra plataforma
                    </p>
                  </FormItem>
                )}
              />
            )}

            {/* Switch Lançar Financeiro */}
            <FormField
              control={form.control}
              name="launchFinancial"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="flex items-center gap-2 text-base">
                      <DollarSign className="h-4 w-4" />
                      Lançar no Financeiro
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Registrar valor automaticamente no controle financeiro
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  {selectedClient?.default_price && (
                    <p className="text-xs text-muted-foreground">
                      Valor padrão do cliente: R$ {selectedClient.default_price.toFixed(2).replace('.', ',')}
                    </p>
                  )}
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

            {/* Cor do Agendamento - apenas bolinhas coloridas */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Cor do Agendamento
                  </FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {APPOINTMENT_COLORS.map((colorOption) => (
                        <Button
                          key={colorOption.value}
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn(
                            "w-8 h-8 p-0 rounded-full border-2",
                            field.value === colorOption.value 
                              ? "ring-2 ring-offset-2 ring-primary border-primary" 
                              : "border-muted-foreground/20"
                          )}
                          onClick={() => field.onChange(colorOption.value)}
                        >
                          <div 
                            className="w-5 h-5 rounded-full"
                            style={{ backgroundColor: colorOption.value }}
                          />
                        </Button>
                      ))}
                    </div>
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
                disabled={isSubmitting || clientsLoading || clients.length === 0}
                className="flex-1 bg-gradient-to-r from-tanotado-pink to-tanotado-purple hover:shadow-lg transition-all duration-200"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Criando...
                  </div>
                ) : (
                  'Criar Agendamento'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentForm;