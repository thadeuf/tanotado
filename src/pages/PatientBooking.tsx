// src/pages/PatientBooking.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, parseISO, isPast, getDay, isSameDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, Calendar as CalendarIcon, Clock, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import { CpfInput } from '@/components/ui/CpfInput';
import { DateInput } from '@/components/ui/DateInput';
import { CustomPhoneInput } from '@/components/ui/phone-input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

// Hooks (reutilizando para obter configurações de agenda do profissional)
import { useUserSettings } from '@/hooks/useUserSettings';

import type { Database } from '@/integrations/supabase/types';

// Tipagem básica do perfil do profissional para exibir na página pública
type ProfessionalProfile = {
  id: string;
  name: string;
  specialty: string | null;
  avatar_url: string | null;
  about_you: string | null;
  public_booking_enabled: boolean;
  public_booking_url_slug: string;
  client_nomenclature: string;
  working_hours: any; 
  appointment_duration: number; 
};

// =========================================================
// ESQUEMAS DE VALIDAÇÃO
// =========================================================

// Esquema de identificação inicial do paciente
const identificationSchema = z.object({
  cpf: z.string().min(14, { message: "CPF inválido." }), 
  birth_date: z.date({ required_error: 'Data de nascimento é obrigatória.' }),
});

// Esquema de mini-cadastro para novos pacientes (se for o caso)
const newClientSchema = z.object({
  name: z.string().min(3, { message: "Nome completo é obrigatório." }),
  whatsapp: z.string().min(10, { message: "WhatsApp é obrigatório." }),
  email: z.string().email({ message: "E-mail inválido." }).optional().or(z.literal('')),
  initial_consultation_reason: z.string().optional(), 
});

// Esquema para o agendamento (se for cliente existente)
const scheduleSchema = z.object({
  selected_date: z.date({ required_error: 'Selecione uma data para o agendamento.' }),
  selected_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Hora inválida. Use o formato HH:mm."),
  notes: z.string().optional(),
});


// =========================================================
// COMPONENTE PatientBooking
// =========================================================

const PatientBooking: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();

  const [professionalProfile, setProfessionalProfile] = useState<ProfessionalProfile | null>(null);
  const [loadingProfessional, setLoadingProfessional] = useState(true);
  const [errorProfessional, setErrorProfessional] = useState<string | null>(null);

  // Estados do fluxo
  const [currentStep, setCurrentStep] = useState<'identification' | 'new_client_form' | 'schedule_selection' | 'confirmation_pending' | 'scheduling_success'>('identification');
  const [identifiedClient, setIdentifiedClient] = useState<any | null>(null); 
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentAppointmentNotes, setCurrentAppointmentNotes] = useState<string>('');

  // Forms
  const identificationForm = useForm<z.infer<typeof identificationSchema>>({
    resolver: zodResolver(identificationSchema),
  });

  const newClientForm = useForm<z.infer<typeof newClientSchema>>({
    resolver: zodResolver(newClientSchema),
  });

  const scheduleForm = useForm<z.infer<typeof scheduleSchema>>({
    resolver: zodResolver(scheduleSchema),
  });

  // Fetch profissional profile by slug
  useEffect(() => {
    const fetchProfessional = async () => {
      if (!slug) {
        setErrorProfessional("URL do profissional inválida.");
        setLoadingProfessional(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            name,
            specialty,
            avatar_url,
            about_you,
            public_booking_enabled,
            public_booking_url_slug,
            client_nomenclature,
            user_settings (
              working_hours,
              appointment_duration
            )
          `)
          .eq('public_booking_url_slug', slug)
          .eq('public_booking_enabled', true) 
          .single();

        if (error) {
          if (error.code === 'PGRST116') { 
            setErrorProfessional("Página de agendamento não encontrada ou desativada.");
          } else {
            throw error;
          }
        } else if (data) {
          setProfessionalProfile({
            id: data.id,
            name: data.name,
            specialty: data.specialty,
            avatar_url: data.avatar_url,
            about_you: data.about_you,
            public_booking_enabled: data.public_booking_enabled,
            public_booking_url_slug: data.public_booking_url_slug!,
            client_nomenclature: data.client_nomenclature || 'cliente',
            working_hours: (data as any).user_settings?.working_hours,
            appointment_duration: (data as any).user_settings?.appointment_duration || 30, 
          });
        } else {
          setErrorProfessional("Página de agendamento não encontrada ou desativada.");
        }
      } catch (e: any) {
        console.error("Erro ao carregar perfil do profissional:", e);
        setErrorProfessional("Ocorreu um erro ao carregar a página. Tente novamente mais tarde.");
      } finally {
        setLoadingProfessional(false);
      }
    };
    fetchProfessional();
  }, [slug]);

  const { data: userSettings, isLoading: isLoadingSettings } = useUserSettings(); 

  const cleanCpf = (cpf: string) => cpf.replace(/[^\d]/g, ''); 

  const cleanWhatsapp = (whatsapp: string) => whatsapp.replace(/\D/g, ''); 


  // =========================================================
  // MUTATIONS (interações com o Supabase)
  // =========================================================

  const findOrCreateClientMutation = useMutation({
    mutationFn: async ({ cpf, birth_date, professionalId, name, whatsapp, email, initial_consultation_reason }: {
      cpf: string;
      birth_date: Date;
      professionalId: string;
      name?: string;
      whatsapp?: string;
      email?: string;
      initial_consultation_reason?: string;
    }) => {
      const { data, error } = await supabase.rpc('find_or_create_pending_client', {
        p_cpf: cleanCpf(cpf),
        p_birth_date: birth_date.toISOString().split('T')[0],
        p_professional_id: professionalId,
        p_name: name || null,
        p_whatsapp: whatsapp ? cleanWhatsapp(whatsapp) : null,
        p_email: email || null,
        p_initial_consultation_reason: initial_consultation_reason || null,
      });

      if (error) throw error;
      return data ? data[0] : null; 
    },
    onSuccess: (data) => {
      if (data && data.client_exists_and_active) { 
        setIdentifiedClient(data); 
        setCurrentStep('schedule_selection'); 
        toast({ title: "Identificação confirmada!", description: `Bem-vindo(a) de volta, ${data.client_name?.split(' ')[0]}!` }); 
      } else if (data) {
        setIdentifiedClient(data); 
        setCurrentStep('new_client_form'); 
        newClientForm.reset({
          name: data.client_name || '',
          whatsapp: data.client_whatsapp || '',
          email: data.client_email || '',
        });
        toast({ title: "Cadastro necessário", description: "Por favor, complete seu cadastro para prosseguir." }); 
      } else {
        toast({ title: "Erro na identificação", description: "Não foi possível identificar o cliente ou obter dados.", variant: "destructive" });
      }
    },
    onError: (error: any) => { 
      toast({ title: "Erro na identificação", description: error.message || "Não foi possível identificá-lo(a).", variant: "destructive" }); 
    },
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async ({ clientId, professionalId, selected_date, selected_time, notes }: {
      clientId: string;
      professionalId: string;
      selected_date: Date;
      selected_time: string;
      notes?: string;
    }) => {
      const [hours, minutes] = selected_time.split(':').map(Number); 
      const startDateTime = new Date(selected_date); 
      startDateTime.setHours(hours, minutes, 0, 0); 

      const appointmentDuration = professionalProfile?.appointment_duration || 30; 
      const endDateTime = new Date(startDateTime.getTime() + appointmentDuration * 60 * 1000); 

      const { data, error } = await supabase.from('appointments').insert({
        user_id: professionalId, 
        client_id: clientId, 
        title: identifiedClient?.client_name || 'Agendamento Paciente', 
        start_time: startDateTime.toISOString(), 
        end_time: endDateTime.toISOString(), 
        description: notes || null, 
        status: 'scheduled', 
        appointment_type: 'appointment', 
        is_online: false, 
        color: '#3B82F6', 
        price: professionalProfile?.session_value || null, 
      }).select().single(); 

      if (error) throw error; 
      return data; 
    },
    onSuccess: () => { 
      setCurrentStep('scheduling_success'); 
      toast({ title: "Agendamento confirmado!", description: "Seu horário foi agendado com sucesso!" }); 
      queryClient.invalidateQueries({ queryKey: ['appointments'] }); 
    },
    onError: (error: any) => { 
      toast({ title: "Erro ao agendar", description: error.message || "Não foi possível agendar seu horário.", variant: "destructive" }); 
    },
  });

  const createPendingClientMutation = useMutation({
    mutationFn: async ({ name, whatsapp, email, initial_consultation_reason, professionalId, cpf, birth_date }: {
      name: string;
      whatsapp: string;
      email?: string;
      initial_consultation_reason?: string;
      professionalId: string;
      cpf: string;
      birth_date: Date;
    }) => {
      const { error } = await supabase.from('clients')
        .update({
          name: name,
          whatsapp: cleanWhatsapp(whatsapp),
          email: email || null,
          notes: initial_consultation_reason || null,
        })
        .eq('id', identifiedClient.client_id); 
      
      if (error) throw error;
      return true; 
    },
    onSuccess: () => { 
      setCurrentStep('confirmation_pending'); 
      toast({ title: "Cadastro enviado!", description: "Seu cadastro aguarda aprovação do profissional. Você receberá um contato em breve!" }); 
      queryClient.invalidateQueries({ queryKey: ['clients'] }); 
    },
    onError: (error: any) => { 
      toast({ title: "Erro ao cadastrar", description: error.message || "Não foi possível enviar seu cadastro.", variant: "destructive" }); 
    },
  });


  // =========================================================
  // HANDLERS DO FORMULÁRIO E FLUXO
  // =========================================================

  const handleIdentificationSubmit = (data: z.infer<typeof identificationSchema>) => {
    if (professionalProfile) { 
      findOrCreateClientMutation.mutate({ 
        cpf: data.cpf, 
        birth_date: data.birth_date, 
        professionalId: professionalProfile.id, 
      });
    }
  };

  const handleNewClientSubmit = (data: z.infer<typeof newClientSchema>) => {
    if (professionalProfile && identifiedClient?.client_id) { 
      createPendingClientMutation.mutate({ 
        ...data, 
        cpf: identificationForm.getValues('cpf'), 
        birth_date: identificationForm.getValues('birth_date'), 
        professionalId: professionalProfile.id, 
      });
    } else {
      toast({title: "Erro interno", description: "Cliente não identificado para finalizar o cadastro.", variant: "destructive"})
    }
  };

  const handleScheduleSubmit = (data: z.infer<typeof scheduleSchema>) => {
    if (professionalProfile && identifiedClient?.client_id) { 
      createAppointmentMutation.mutate({ 
        clientId: identifiedClient.client_id, 
        professionalId: professionalProfile.id, 
        selected_date: data.selected_date, 
        selected_time: data.selected_time, 
        notes: data.notes, 
      });
    } else {
      toast({title: "Erro interno", description: "Cliente não identificado para agendamento.", variant: "destructive"})
    }
  };

  const handleDateSelect = (date: Date) => {
    if (!professionalProfile?.working_hours) { 
      toast({
        title: "Configuração de agenda ausente",
        description: "O profissional não configurou os horários de atendimento. Tente novamente mais tarde.",
        variant: "destructive"
      });
      return; 
    }

    if (isDayDisabled(date)) { 
      toast({
        title: "Dia não disponível",
        description: "Este dia não está disponível para agendamentos.",
        variant: "destructive"
      });
      return; 
    }
    setSelectedDate(date); 
    scheduleForm.setValue('selected_date', date); 
    scheduleForm.setValue('selected_time', '');
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time); 
    scheduleForm.setValue('selected_time', time); 
  };

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '..'; 


  // Lógica para gerar os horários disponíveis (reutiliza lógica de TimeSlots)
  const generateTimeSlots = () => {
    const slots = []; 
    if (!selectedDate || !professionalProfile?.working_hours || !professionalProfile?.appointment_duration) { 
      return []; 
    }

    const dayOfWeek = getDay(selectedDate); 
    const dayKeyMap: { [key: number]: string } = { 0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday' }; 
    const dayKey = dayKeyMap[dayOfWeek]; 
    const dayConfig = professionalProfile.working_hours[dayKey]; 

    if (!dayConfig || dayConfig.enabled === false) { 
      return []; 
    }
    
    const timeBlocks = []; 
    if (dayConfig.start1 && dayConfig.end1) { 
      timeBlocks.push({ start: dayConfig.start1, end: dayConfig.end1 }); 
    }
    if (dayConfig.start2 && dayConfig.end2) { 
      timeBlocks.push({ start: dayConfig.start2, end: dayConfig.end2 }); 
    }

    const interval = professionalProfile.appointment_duration; 
    
    // Obter agendamentos existentes para o dia selecionado (precisa de RPC para isso)
    // Por enquanto, apenas gera os slots.
    // Para uma implementação real, você precisaria de uma RPC para buscar os appointments do profissional para aquele dia.
    // Ex: supabase.rpc('get_professional_appointments_for_day', { p_professional_id: professionalProfile.id, p_date: format(selectedDate, 'yyyy-MM-dd') });
    // E então usar existingAppointments para filtrar os slots que já estão ocupados.


    for (const block of timeBlocks) { 
        const [startHour, startMinute] = block.start.split(':').map(Number); 
        const [endHour, endMinute] = block.end.split(':').map(Number); 

        let currentTime = new Date(selectedDate); 
        currentTime.setHours(startHour, startMinute, 0, 0); 

        const blockEndTime = new Date(selectedDate); 
        blockEndTime.setHours(endHour, endMinute, 0, 0); 

        while (currentTime < blockEndTime) { 
            if (currentTime > new Date()) { 
              slots.push(format(currentTime, 'HH:mm')); 
            }
            currentTime = new Date(currentTime.getTime() + interval * 60 * 1000); 
        }
    }
    return slots; 
  };

  const availableTimeSlots = generateTimeSlots(); 

  const isDayDisabled = (date: Date): boolean => {
    if (isPast(date) && !isSameDay(date, new Date())) { 
      return true; 
    }
    if (professionalProfile?.working_hours) { 
      const workingDays = professionalProfile.working_hours; 
      const dayOfWeek = getDay(date); 
      const dayKeyMap: { [key: number]: string } = { 
        0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday'
      };
      const dayKey = dayKeyMap[dayOfWeek]; 
      return workingDays[dayKey]?.enabled === false; 
    }
    return false; 
  };

  // =========================================================
  // SUB-COMPONENTE: ProfessionalHeader
  // =========================================================
  // Definindo o cabeçalho como um componente memoizado para melhor performance e reusabilidade.
  // Ele recebe as props que precisa do componente pai.
  const ProfessionalHeader = React.memo(({ profile, getInitialsFunc }: { profile: ProfessionalProfile; getInitialsFunc: (name: string) => string }) => (
    <div className="flex flex-col items-center text-center p-6 bg-white border-b rounded-t-lg">
        <Avatar className="w-24 h-24 mb-4 border-2 border-primary shadow-md">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-3xl bg-gradient-to-r from-tanotado-pink to-tanotado-purple text-white">
                {getInitialsFunc(profile.name)}
            </AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold text-tanotado-navy">{profile.name}</h1>
        <p className="text-lg text-muted-foreground">{profile.specialty}</p>
        {profile.about_you && (
            <p className="text-sm text-gray-600 mt-2 max-w-prose">{profile.about_you}</p>
        )}
    </div>
  ));

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50 p-4">
      <Card className="w-full max-w-3xl border-0 shadow-lg mt-8">
        {/* Renderiza o sub-componente ProfessionalHeader aqui */}
        {professionalProfile && <ProfessionalHeader profile={professionalProfile} getInitialsFunc={getInitials} />}

        <CardContent className="p-6">
          {/* ======================================= */}
          {/* PASSO 1: IDENTIFICAÇÃO DO PACIENTE */}
          {/* ======================================= */}
          {currentStep === 'identification' && ( 
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <User className="mx-auto h-12 w-12 text-tanotado-blue" />
                <h2 className="text-xl font-semibold text-tanotado-navy">Primeiro, precisamos te identificar.</h2>
                <p className="text-sm text-muted-foreground">
                  Por favor, informe seu CPF e Data de Nascimento.
                </p>
              </div>
              <Form {...identificationForm}>
                <form onSubmit={identificationForm.handleSubmit(handleIdentificationSubmit)} className="space-y-4">
                  <FormField
                    control={identificationForm.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl><CpfInput {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={identificationForm.control}
                    name="birth_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Nascimento</FormLabel>
                        <FormControl>
                          <DateInput value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-tanotado-purple hover:bg-tanotado-purple/90" disabled={findOrCreateClientMutation.isPending}>
                    {findOrCreateClientMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Continuar
                  </Button>
                </form>
              </Form>
            </div>
          )}

          {/* ======================================= */}
          {/* PASSO 2: MINI-CADASTRO DE NOVO PACIENTE */}
          {/* ======================================= */}
          {currentStep === 'new_client_form' && ( 
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-tanotado-navy">Complete seu cadastro, {identifiedClient?.client_name?.split(' ')[0] || professionalProfile.client_nomenclature}!</h2>
                <p className="text-sm text-muted-foreground">
                  Seu cadastro aguarda aprovação do profissional. Você receberá um contato para aprovação e agendamento em breve.
                </p>
              </div>
              <Form {...newClientForm}>
                <form onSubmit={newClientForm.handleSubmit(handleNewClientSubmit)} className="space-y-4">
                  <FormField
                    control={newClientForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newClientForm.control}
                    name="whatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl><CustomPhoneInput {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newClientForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Opcional)</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newClientForm.control}
                    name="initial_consultation_reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivo da Consulta (Opcional)</FormLabel>
                        <FormControl><Textarea placeholder="Ex: Avaliação, Terapia de ansiedade..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-tanotado-green hover:bg-tanotado-green/90" disabled={createPendingClientMutation.isPending}>
                    {createPendingClientMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar Cadastro
                  </Button>
                </form>
              </Form>
            </div>
          )}

          {/* ======================================= */}
          {/* PASSO 3: SELEÇÃO DE DATA E HORA */}
          {/* ======================================= */}
          {currentStep === 'schedule_selection' && professionalProfile && ( 
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-tanotado-navy">Olá, {identifiedClient?.client_name?.split(' ')[0]}! Selecione seu horário.</h2>
                <p className="text-sm text-muted-foreground">
                  Escolha a melhor data e horário para sua sessão.
                </p>
              </div>

              <Form {...scheduleForm}>
                <form onSubmit={scheduleForm.handleSubmit(handleScheduleSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* Date Selector */}
                    <Card className="flex flex-col">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CalendarIcon className="h-5 w-5" />
                          Selecionar Data
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow flex items-center justify-center p-0">
                        <Input type="hidden" {...scheduleForm.register('selected_date')} /> 
                        <Input type="hidden" {...scheduleForm.register('selected_time')} /> 

                        <div className="w-full">
                          <Label htmlFor="date-picker" className="sr-only">Data</Label>
                          <div className="w-full flex justify-center">
                            <DatePicker
                                selected={selectedDate}
                                onChange={handleDateSelect}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="Selecione a data..."
                                customInput={<Input id="date-picker" />}
                                locale={ptBR}
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                                filterDate={(date) => !isDayDisabled(date)}
                            />
                          </div>
                          <FormMessage>{scheduleForm.formState.errors.selected_date?.message}</FormMessage>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Time Slots */}
                    <Card className="flex flex-col">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Horários Disponíveis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 flex-grow">
                        {!selectedDate ? ( 
                          <div className="text-center py-6 text-muted-foreground">
                            <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Selecione uma data para ver os horários.</p>
                          </div>
                        ) : availableTimeSlots.length === 0 ? ( 
                          <div className="text-center py-6 text-muted-foreground">
                            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Nenhum horário disponível para o dia {format(selectedDate, 'dd/MM')}.</p>
                            <p className="text-sm">Tente outro dia.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {availableTimeSlots.map(time => (
                              <Button
                                key={time}
                                variant={selectedTime === time ? 'default' : 'outline'}
                                className="justify-center"
                                onClick={() => handleTimeSelect(time)}
                                type="button"
                              >
                                {time}
                              </Button>
                            ))}
                          </div>
                        )}
                        <FormMessage>{scheduleForm.formState.errors.selected_time?.message}</FormMessage>
                      </CardContent>
                    </Card>
                  </div>

                  <FormField
                    control={scheduleForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações (Opcional)</FormLabel>
                        <FormControl><Textarea placeholder="Alguma observação para sua sessão?" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-tanotado-blue hover:bg-tanotado-blue/90" disabled={createAppointmentMutation.isPending || !selectedDate || !selectedTime}>
                    {createAppointmentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirmar Agendamento
                  </Button>
                </form>
              </Form>
            </div>
          )}

          {/* ======================================= */}
          {/* PASSO 4: CONFIRMAÇÃO PENDENTE (NOVO CLIENTE) */}
          {/* ======================================= */}
          {currentStep === 'confirmation_pending' && ( 
            <div className="space-y-6 text-center animate-fade-in">
              <AlertCircle className="mx-auto h-12 w-12 text-orange-500" />
              <h2 className="text-xl font-semibold text-tanotado-navy">Cadastro Enviado para Aprovação!</h2>
              <p className="text-sm text-muted-foreground">
                Seu cadastro para o profissional **{professionalProfile.name}** foi enviado e aguarda a revisão dele(a). Você receberá um contato em breve confirmando sua aprovação e, então, poderá agendar sua sessão.
              </p>
              <p className="text-sm text-gray-500">
                Obrigado(a) por sua paciência!
              </p>
            </div>
          )}

          {/* ======================================= */}
          {/* PASSO 5: AGENDAMENTO CONFIRMADO (CLIENTE EXISTENTE) */}
          {/* ======================================= */}
          {currentStep === 'scheduling_success' && ( 
            <div className="space-y-6 text-center animate-fade-in">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h2 className="text-xl font-semibold text-tanotado-navy">Agendamento Confirmado!</h2>
              <p className="text-sm text-muted-foreground">
                Sua sessão com **{professionalProfile.name}** foi agendada com sucesso para:
              </p>
              <div className="bg-green-50 text-green-700 p-4 rounded-lg font-medium text-lg">
                {selectedDate && selectedTime ?
                  `${format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })} às ${selectedTime}`
                  : 'Data e Hora não disponíveis.'
                }
              </div>
              <p className="text-sm text-gray-500">
                Você deve receber um lembrete próximo à data da sua sessão.
              </p>
              <Button onClick={() => window.location.reload()} className="w-full">
                Fazer Outro Agendamento
              </Button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default PatientBooking;