// src/pages/PatientBooking.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, parseISO, isPast, getDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, type InputProps } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, Calendar as CalendarIcon, Clock, MessageSquare, AlertCircle, CheckCircle, CalendarCheck } from 'lucide-react';
import { CpfInput } from '@/components/ui/CpfInput';
import { DateInput } from '@/components/ui/DateInput';
import { CustomPhoneInput } from '@/components/ui/phone-input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';

import type { Database } from '@/integrations/supabase/types';

type ProfessionalProfile = {
  id: string;
  name: string;
  specialty: string | null;
  avatar_url: string | null;
  about_you: string | null;
  client_nomenclature: string;
};

const identificationSchema = z.object({
  cpf: z.string().min(14, { message: "CPF inválido." }),
  birth_date: z.date({ required_error: 'Data de nascimento é obrigatória.' }),
});

const newClientSchema = z.object({
  name: z.string().min(3, { message: "Nome completo é obrigatório." }),
  whatsapp: z.string().min(10, { message: "WhatsApp é obrigatório." }),
  email: z.string().email({ message: "E-mail inválido." }).optional().or(z.literal('')),
  initial_consultation_reason: z.string().optional(),
});

const scheduleSchema = z.object({
  selected_date: z.date({ required_error: 'Selecione uma data para o agendamento.' }),
  selected_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Hora inválida. Use o formato HH:mm."),
  notes: z.string().optional(),
});


const PatientBooking: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();

  const [professionalProfile, setProfessionalProfile] = useState<ProfessionalProfile | null>(null);
  const [loadingProfessional, setLoadingProfessional] = useState(true);
  const [errorProfessional, setErrorProfessional] = useState<string | null>(null);

  const [currentStep, setCurrentStep] = useState<'identification' | 'new_client_form' | 'schedule_selection' | 'confirmation_pending' | 'scheduling_success'>('identification');
  const [identifiedClient, setIdentifiedClient] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const identificationForm = useForm<z.infer<typeof identificationSchema>>({ resolver: zodResolver(identificationSchema) });
  const newClientForm = useForm<z.infer<typeof newClientSchema>>({ resolver: zodResolver(newClientSchema) });
  const scheduleForm = useForm<z.infer<typeof scheduleSchema>>({ resolver: zodResolver(scheduleSchema) });

  useEffect(() => {
    const fetchProfessional = async () => {
      if (!slug) {
        setErrorProfessional("URL do profissional inválida.");
        setLoadingProfessional(false);
        return;
      }
      setLoadingProfessional(true);
      setErrorProfessional(null);
      try {
        const { data, error } = await supabase.rpc('get_public_profile_by_slug', { p_slug: slug }).single();
        if (error) throw error;
        setProfessionalProfile(data);
      } catch (e: any) {
        setErrorProfessional("Página de agendamento não encontrada ou desativada.");
      } finally {
        setLoadingProfessional(false);
      }
    };
    fetchProfessional();
  }, [slug]);

  const { data: availableTimeSlots = [], isLoading: isLoadingAvailability } = useQuery({
    queryKey: ['availableSlots', professionalProfile?.id, selectedDate],
    queryFn: async () => {
        if (!professionalProfile?.id || !selectedDate) return [];
        const queryDate = format(selectedDate, 'yyyy-MM-dd');
        const { data, error } = await supabase.rpc('get_available_slots', {
            p_professional_id: professionalProfile.id,
            p_query_date: queryDate
        });
        if (error) {
            console.error('Error fetching available slots:', error);
            toast({ title: "Erro ao buscar horários", description: "Não foi possível verificar a disponibilidade.", variant: "destructive" });
            return [];
        }
        const slotsFromDB = (data || []).map(slot => slot.available_slot);
        if (isSameDay(selectedDate, new Date())) {
            const now = new Date();
            return slotsFromDB.filter(time => {
                const [hours, minutes] = time.split(':').map(Number);
                const slotTime = new Date(selectedDate);
                slotTime.setHours(hours, minutes, 0, 0);
                return slotTime > now;
            });
        }
        return slotsFromDB;
    },
    enabled: !!professionalProfile && !!selectedDate,
  });
  
  const cleanCpf = (cpf: string) => cpf.replace(/[^\d]/g, '');
  const cleanWhatsapp = (whatsapp: string) => whatsapp.replace(/\D/g, '');

  const findOrCreateClientMutation = useMutation({
    mutationFn: async (vars: { cpf: string; birth_date: Date; professionalId: string }) => {
      const { data, error } = await supabase.rpc('find_or_create_pending_client', { p_cpf: cleanCpf(vars.cpf), p_birth_date: vars.birth_date.toISOString().split('T')[0], p_professional_id: vars.professionalId });
      if (error) throw error;
      return data ? data[0] : null;
    },
    onSuccess: (data) => {
      if (data?.client_exists_and_active) {
        setIdentifiedClient(data); setCurrentStep('schedule_selection'); toast({ title: "Identificação confirmada!", description: `Bem-vindo(a) de volta, ${data.client_name?.split(' ')[0]}!` });
      } else if (data) {
        setIdentifiedClient(data); setCurrentStep('new_client_form'); newClientForm.reset({ name: data.client_name || '', whatsapp: data.client_whatsapp || '', email: data.client_email || '' }); toast({ title: "Cadastro necessário", description: "Por favor, complete seu cadastro para prosseguir." });
      }
    },
    // --- INÍCIO DA ALTERAÇÃO ---
    // Ajuste no tratamento de erro para exibir a mensagem correta.
    onError: (error: any) => {
        // Verifica se o erro é o nosso erro customizado de data de nascimento inválida
        if (error.message.includes('invalid_birth_date')) {
            toast({
                title: "Dados Incorretos",
                description: "A data de nascimento não corresponde ao CPF informado. Por favor, verifique os dados ou entre em contato com o profissional.",
                variant: "destructive",
            });
        } else {
            // Trata outros erros genéricos que possam ocorrer
            toast({
                title: "Erro na identificação",
                description: error.message || "Não foi possível identificá-lo(a).",
                variant: "destructive",
            });
        }
    },
    // --- FIM DA ALTERAÇÃO ---
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (vars: { clientId: string; professionalId: string; selected_date: Date; selected_time: string; notes?: string }) => {
      const [hours, minutes] = vars.selected_time.split(':').map(Number); const startDateTime = new Date(vars.selected_date); startDateTime.setHours(hours, minutes, 0, 0);
      const { data, error } = await supabase.rpc('create_public_appointment', { p_client_id: vars.clientId, p_professional_id: vars.professionalId, p_start_time: startDateTime.toISOString(), p_notes: vars.notes || null }).single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setCurrentStep('scheduling_success'); toast({ title: "Agendamento confirmado!", description: "Seu horário foi agendado com sucesso!" }); queryClient.invalidateQueries({ queryKey: ['availableSlots'] });
    },
    onError: (error: any) => toast({ title: "Erro ao agendar", description: error.message, variant: "destructive" }),
  });

  const createPendingClientMutation = useMutation({
    mutationFn: async (vars: { name: string; whatsapp: string; email?: string; initial_consultation_reason?: string }) => {
      const { error } = await supabase.from('clients').update({ name: vars.name, whatsapp: cleanWhatsapp(vars.whatsapp), email: vars.email || null, notes: vars.initial_consultation_reason || null }).eq('id', identifiedClient.client_id);
      if (error) throw error;
    },
    onSuccess: () => { setCurrentStep('confirmation_pending'); toast({ title: "Cadastro enviado!", description: "Seu cadastro aguarda aprovação. Você receberá um contato em breve!" }); },
    onError: (error: any) => toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" }),
  });

  const handleIdentificationSubmit = (data: z.infer<typeof identificationSchema>) => { if (professionalProfile) findOrCreateClientMutation.mutate({ cpf: data.cpf, birth_date: data.birth_date, professionalId: professionalProfile.id }); };
  const handleNewClientSubmit = (data: z.infer<typeof newClientSchema>) => { if (professionalProfile && identifiedClient?.client_id) createPendingClientMutation.mutate(data); };
  const handleScheduleSubmit = (data: z.infer<typeof scheduleSchema>) => { if (professionalProfile && identifiedClient?.client_id) createAppointmentMutation.mutate({ ...data, clientId: identifiedClient.client_id, professionalId: professionalProfile.id }); };
  const handleDateSelect = (date: Date) => { setSelectedDate(date); scheduleForm.setValue('selected_date', date); setSelectedTime(null); scheduleForm.setValue('selected_time', ''); };
  const handleTimeSelect = (time: string) => { setSelectedTime(time); scheduleForm.setValue('selected_time', time); };
  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '..';

  const isDayDisabled = useCallback((date: Date): boolean => {
    if (isPast(date) && !isSameDay(date, new Date())) return true;
    if (professionalProfile?.working_hours) {
      const dayKey = format(date, 'eeee', { locale: ptBR }).toLowerCase() as keyof typeof professionalProfile.working_hours;
      return professionalProfile.working_hours[dayKey]?.enabled === false;
    }
    return false;
  }, [professionalProfile]);

  const ProfessionalHeader = React.memo(({ profile }: { profile: ProfessionalProfile }) => (
    <div className="flex flex-col items-center text-center p-6 bg-white border-b rounded-t-lg">
      <Avatar className="w-24 h-24 mb-4 border-2 border-primary shadow-md">
        <AvatarImage src={profile.avatar_url || undefined} /><AvatarFallback className="text-3xl bg-gradient-to-r from-tanotado-pink to-tanotado-purple text-white">{getInitials(profile.name || '')}</AvatarFallback>
      </Avatar>
      <h1 className="text-2xl font-bold text-tanotado-navy">{profile.name}</h1><p className="text-lg text-muted-foreground">{profile.specialty}</p>{profile.about_you && <p className="text-sm text-gray-600 mt-2 max-w-prose">{profile.about_you}</p>}
    </div>
  ));

  const ProfessionalHeaderSkeleton = () => ( <div className="flex flex-col items-center text-center p-6 bg-white border-b rounded-t-lg"><Skeleton className="w-24 h-24 rounded-full mb-4" /> <Skeleton className="h-7 w-48 mb-2" /> <Skeleton className="h-5 w-32" /></div> );

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50 p-4">
      {/* --- INÍCIO DA ALTERAÇÃO --- */}
      <div className="text-center pt-8 pb-4">
        <img
          src="/lovable-uploads/4a78275e-0af1-4fd5-ae15-9d988197bca6.png"
          alt="Logotipo tanotado"
          className="w-40 h-auto mx-auto"
        />
        <p className="text-muted-foreground mt-2">
          Agendamento Inteligente
        </p>
      </div>
      {/* --- FIM DA ALTERAÇÃO --- */}

      <Card className="w-full max-w-4xl border-0 shadow-lg">
        {loadingProfessional ? <ProfessionalHeaderSkeleton /> : professionalProfile && <ProfessionalHeader profile={professionalProfile} />}
        <CardContent className="p-6">
          {errorProfessional && <div className="p-6 text-center text-red-600">{errorProfessional}</div>}
          {!loadingProfessional && !errorProfessional && (
            <>
              {currentStep === 'identification' && ( <div className="space-y-6 animate-fade-in"><div className="text-center space-y-2"><User className="mx-auto h-12 w-12 text-tanotado-blue" /><h2 className="text-xl font-semibold text-tanotado-navy">Primeiro, precisamos te identificar.</h2><p className="text-sm text-muted-foreground">Por favor, informe seu CPF e Data de Nascimento.</p></div><Form {...identificationForm}><form onSubmit={identificationForm.handleSubmit(handleIdentificationSubmit)} className="space-y-4"><FormField control={identificationForm.control} name="cpf" render={({ field }) => (<FormItem><FormLabel>CPF</FormLabel><FormControl><CpfInput {...field} /></FormControl><FormMessage /></FormItem>)} /><FormField control={identificationForm.control} name="birth_date" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Data de Nascimento</FormLabel><FormControl><DateInput value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} /><Button type="submit" className="w-full bg-tanotado-purple hover:bg-tanotado-purple/90" disabled={findOrCreateClientMutation.isPending}>{findOrCreateClientMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Continuar</Button></form></Form></div> )}
              {currentStep === 'new_client_form' && professionalProfile && ( <div className="space-y-6 animate-fade-in"><div className="text-center space-y-2"><h2 className="text-xl font-semibold text-tanotado-navy">Complete seu cadastro, {identifiedClient?.client_name?.split(' ')[0] || professionalProfile.client_nomenclature}!</h2><p className="text-sm text-muted-foreground">Seu cadastro aguarda aprovação do profissional. Você receberá um contato em breve!</p></div><Form {...newClientForm}><form onSubmit={newClientForm.handleSubmit(handleNewClientSubmit)} className="space-y-4 max-w-sm mx-auto"><FormField control={newClientForm.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Nome Completo</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} /><FormField control={newClientForm.control} name="whatsapp" render={({ field }) => ( <FormItem> <FormLabel>WhatsApp</FormLabel> <FormControl><CustomPhoneInput {...field} /></FormControl> <FormMessage /> </FormItem> )} /><FormField control={newClientForm.control} name="email" render={({ field }) => ( <FormItem> <FormLabel>Email (Opcional)</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} /><FormField control={newClientForm.control} name="initial_consultation_reason" render={({ field }) => ( <FormItem> <FormLabel>Motivo da Consulta (Opcional)</FormLabel> <FormControl><Textarea placeholder="Ex: Avaliação, Terapia de ansiedade..." {...field} /></FormControl> <FormMessage /> </FormItem> )} /><Button type="submit" className="w-full bg-tanotado-green hover:bg-tanotado-green/90" disabled={createPendingClientMutation.isPending}>{createPendingClientMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enviar Cadastro</Button></form></Form></div> )}
              {currentStep === 'schedule_selection' && professionalProfile && (
                <div className="space-y-6 animate-fade-in"><Form {...scheduleForm}><form onSubmit={scheduleForm.handleSubmit(handleScheduleSubmit)} className="space-y-6"><div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"><div className="flex flex-col"><h3 className="text-lg font-semibold mb-3 text-center text-tanotado-navy">1. Escolha a data</h3><Card><CardContent className="p-0 flex justify-center"><Calendar mode="single" selected={selectedDate} onSelect={(date) => date && handleDateSelect(date)} disabled={isDayDisabled} locale={ptBR} className="m-0" classNames={{ month: "space-y-4 p-3", caption_label: "text-lg font-medium" }} /></CardContent></Card></div><div className="flex flex-col"><h3 className="text-lg font-semibold mb-3 text-center text-tanotado-navy">2. Escolha o horário</h3><Card className="flex-grow min-h-[365px]"><CardContent className="p-4">{!selectedDate ? (<div className="text-center py-16 text-muted-foreground h-full flex flex-col items-center justify-center"><CalendarIcon className="h-10 w-10 mx-auto mb-3 opacity-30" /><p className="font-medium">Selecione uma data no calendário.</p></div>) : isLoadingAvailability ? (<div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-tanotado-purple" /></div>) : availableTimeSlots.length === 0 ? (<div className="text-center py-16 text-muted-foreground h-full flex flex-col items-center justify-center"><Clock className="h-10 w-10 mx-auto mb-3 opacity-30" /><p className="font-medium">Não há horários disponíveis.</p><p className="text-sm">Por favor, selecione outra data.</p></div>) : (<ScrollArea className="h-[320px]"><div className="grid grid-cols-3 gap-2 pr-4">{availableTimeSlots.map(time => (<Button key={time} variant={selectedTime === time ? 'default' : 'outline'} className="justify-center h-10 text-base" onClick={() => handleTimeSelect(time)} type="button"> {time} </Button>))}</div></ScrollArea>)}</CardContent></Card></div></div><div className="max-w-xl mx-auto space-y-4 pt-4"><Button type="submit" className="w-full bg-tanotado-blue hover:bg-tanotado-blue/90 h-12 text-lg" disabled={createAppointmentMutation.isPending || !selectedDate || !selectedTime}>{createAppointmentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmar Agendamento</Button></div></form></Form></div>
              )}
              {currentStep === 'confirmation_pending' && professionalProfile && ( <div className="space-y-6 text-center animate-fade-in"><AlertCircle className="mx-auto h-12 w-12 text-orange-500" /><h2 className="text-xl font-semibold text-tanotado-navy">Cadastro Enviado para Aprovação!</h2><p className="text-sm text-muted-foreground">Seu cadastro para <strong>{professionalProfile.name}</strong> foi enviado e aguarda a revisão. Você receberá um contato em breve.</p><p className="text-sm text-gray-500">Obrigado(a) por sua paciência!</p></div> )}
              {currentStep === 'scheduling_success' && professionalProfile && ( <div className="space-y-6 text-center animate-fade-in"><CheckCircle className="mx-auto h-12 w-12 text-green-500" /><h2 className="text-xl font-semibold text-tanotado-navy">Agendamento Confirmado!</h2><p className="text-sm text-muted-foreground">Sua sessão com <strong>{professionalProfile.name}</strong> foi agendada com sucesso para:</p><div className="bg-green-50 text-green-700 p-4 rounded-lg font-medium text-lg">{selectedDate && selectedTime ? `${format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })} às ${selectedTime}`: 'Data e Hora não disponíveis.'}</div><p className="text-sm text-gray-500">Você receberá um lembrete próximo à data da sessão.</p><Button onClick={() => window.location.reload()} className="w-full">Fazer Outro Agendamento</Button></div> )}
            </>
          )}
        </CardContent>
      </Card>
      <footer className="text-center mt-6">
        <p className="text-sm text-muted-foreground">© 2025 <a href="https://tanotado.com.br" className="font-semibold text-tanotado-blue hover:underline">tanotado</a>. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default PatientBooking;