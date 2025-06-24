import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, CheckCircle } from 'lucide-react';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '../ui/separator';

const agendaSettingsSchema = z.object({
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Hora inválida."),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Hora inválida."),
  interval: z.enum(['5', '10', '15', '30', '35', '40', '50', '60']),
  working_days: z.object({
    sunday: z.boolean().default(false),
    monday: z.boolean().default(true),
    tuesday: z.boolean().default(true),
    wednesday: z.boolean().default(true),
    thursday: z.boolean().default(true),
    friday: z.boolean().default(true),
    saturday: z.boolean().default(false),
  }),
  google_calendar_enabled: z.boolean().default(false),
}).superRefine((data, ctx) => {
    if (data.end_time <= data.start_time) {
        ctx.addIssue({
            path: ["end_time"],
            message: "O horário de término deve ser posterior ao de início.",
            code: z.ZodIssueCode.custom
        });
    }
});

type AgendaSettingsFormData = z.infer<typeof agendaSettingsSchema>;

interface AgendaSettingsFormProps {
  onSuccess: () => void;
}

export const AgendaSettingsForm: React.FC<AgendaSettingsFormProps> = ({ onSuccess }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [sessionToken, setSessionToken] = useState<string | null>(null);

    const { data: settingsData } = useQuery({
        queryKey: ['user_settings_and_profile', user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data: settings, error: settingsError } = await supabase
                .from('user_settings')
                .select('working_hours, appointment_duration, google_calendar_enabled')
                .eq('user_id', user.id)
                .maybeSingle();

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('google_refresh_token')
                .eq('id', user.id)
                .single();

            if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;
            if (profileError) throw profileError;

            return { settings, profile };
        },
        enabled: !!user,
    });

    const isGoogleConnected = !!settingsData?.profile?.google_refresh_token;

    useEffect(() => {
        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSessionToken(session?.access_token || null);
        };
        fetchSession();
    }, [user]);

    const form = useForm<AgendaSettingsFormData>({
        resolver: zodResolver(agendaSettingsSchema),
        defaultValues: {
            start_time: "09:00",
            end_time: "18:00",
            interval: '50',
            working_days: { sunday: false, monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, },
            google_calendar_enabled: false,
        },
    });

    React.useEffect(() => {
        if (settingsData?.settings) {
            const { settings } = settingsData;
            const workingHours = settings.working_hours as any;
            const mappedDefaults = { ...form.getValues() };

            if (workingHours) {
                mappedDefaults.start_time = workingHours.start_time || "09:00";
                mappedDefaults.end_time = workingHours.end_time || "18:00";
                mappedDefaults.working_days = {
                    sunday: workingHours.sunday?.enabled ?? false,
                    monday: workingHours.monday?.enabled ?? true,
                    tuesday: workingHours.tuesday?.enabled ?? true,
                    wednesday: workingHours.wednesday?.enabled ?? true,
                    thursday: workingHours.thursday?.enabled ?? true,
                    friday: workingHours.friday?.enabled ?? true,
                    saturday: workingHours.saturday?.enabled ?? false,
                };
            }
            if (settings.appointment_duration) {
                mappedDefaults.interval = settings.appointment_duration.toString() as any;
            }
            mappedDefaults.google_calendar_enabled = settings.google_calendar_enabled ?? false;

            form.reset(mappedDefaults);
        }
    }, [settingsData, form]);

    const mutation = useMutation({
        mutationFn: async (data: AgendaSettingsFormData) => {
            if (!user) throw new Error("Usuário não autenticado.");

            const working_hours = {
                start_time: data.start_time,
                end_time: data.end_time,
                sunday: { enabled: data.working_days.sunday }, monday: { enabled: data.working_days.monday }, tuesday: { enabled: data.working_days.tuesday }, wednesday: { enabled: data.working_days.wednesday }, thursday: { enabled: data.working_days.thursday }, friday: { enabled: data.working_days.friday }, saturday: { enabled: data.working_days.saturday },
            };

            const { error } = await supabase.from('user_settings').upsert({
                user_id: user.id,
                working_hours: working_hours as any,
                appointment_duration: parseInt(data.interval, 10),
                google_calendar_enabled: data.google_calendar_enabled,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: "Configurações da agenda salvas!" });
            queryClient.invalidateQueries({ queryKey: ['user_settings_and_profile', user?.id] });
            onSuccess();
        },
        onError: (error: any) => toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" }),
    });
    
    // --- INÍCIO DA ALTERAÇÃO PRINCIPAL ---
    const handleGoogleConnect = () => {
        if (!sessionToken) {
            toast({ title: 'Aguarde', description: 'Sessão de usuário não encontrada. Tente novamente em alguns segundos.', variant: 'default' });
            return;
        }

        const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        const redirectUri = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-auth-callback`;
        const scope = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email';
        
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.append('client_id', googleClientId);
        authUrl.searchParams.append('redirect_uri', redirectUri);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('scope', scope);
        authUrl.searchParams.append('access_type', 'offline');
        authUrl.searchParams.append('prompt', 'consent');
        authUrl.searchParams.append('state', sessionToken);

        // Define as dimensões e a posição do popup
        const width = 600;
        const height = 700;
        const left = (window.innerWidth / 2) - (width / 2);
        const top = (window.innerHeight / 2) - (height / 2);
        const features = `toolbar=no, menubar=no, width=${width}, height=${height}, top=${top}, left=${left}`;

        // Abre a URL em um popup
        const popup = window.open(authUrl.toString(), 'googleAuthPopup', features);

        // Cria um "ouvinte" para verificar quando o popup é fechado
        const timer = setInterval(() => {
            if (popup && popup.closed) {
                clearInterval(timer);
                // Quando o popup fechar, invalida a query para forçar a busca de novos dados
                // Isso atualizará o status para "Conectado" sem precisar recarregar a página
                toast({ title: "Verificando conexão...", description: "Atualizando status da integração." });
                queryClient.invalidateQueries({ queryKey: ['user_settings_and_profile', user?.id] });
            }
        }, 500); // Verifica a cada meio segundo
    };
    // --- FIM DA ALTERAÇÃO PRINCIPAL ---

    const googleCalendarEnabled = form.watch('google_calendar_enabled');

    const daysOfWeek = [
        { id: 'monday', label: 'Segunda-feira' }, { id: 'tuesday', label: 'Terça-feira' }, { id: 'wednesday', label: 'Quarta-feira' }, { id: 'thursday', label: 'Quinta-feira' }, { id: 'friday', label: 'Sexta-feira' }, { id: 'saturday', label: 'Sábado' }, { id: 'sunday', label: 'Domingo' },
    ] as const;

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="flex flex-col flex-1 min-h-0">
            <DialogHeader>
                <DialogTitle className="text-2xl">Configurações da Agenda</DialogTitle>
                <DialogDescription> Defina seus horários de trabalho e integrações. </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 my-4 pr-6">
              <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Horários de Atendimento</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="start_time" render={({ field }) => ( <FormItem><FormLabel>Início</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="end_time" render={({ field }) => ( <FormItem><FormLabel>Fim</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                  </div>

                  <FormField control={form.control} name="interval" render={({ field }) => ( <FormItem><FormLabel>Duração Padrão da Sessão</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent> <SelectItem value="30">30 minutos</SelectItem> <SelectItem value="50">50 minutos</SelectItem> <SelectItem value="60">60 minutos</SelectItem> </SelectContent></Select><FormMessage /></FormItem> )} />
                  
                  <div className="space-y-2"><FormLabel>Dias de Trabalho</FormLabel>
                      {daysOfWeek.map(day => (
                          <FormField key={day.id} control={form.control} name={`working_days.${day.id}`} render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3"><FormLabel>{day.label}</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
                      ))}
                  </div>

                  <Separator />
                  <div>
                      <h3 className="text-lg font-semibold mb-2">Integrações</h3>
                      <FormField
                          control={form.control}
                          name="google_calendar_enabled"
                          render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div>
                                      <FormLabel>Sincronizar com Google Agenda</FormLabel>
                                      <p className="text-xs text-muted-foreground">Cria eventos na sua agenda do Google para cada agendamento.</p>
                                  </div>
                                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                              </FormItem>
                          )}
                      />
                      {googleCalendarEnabled && (
                          <div className="mt-4 pl-4 border-l-2 border-primary animate-fade-in">
                              {isGoogleConnected ? (
                                  <div className="flex items-center gap-2 text-green-600 font-medium">
                                      <CheckCircle className="h-5 w-5" />
                                      <span>Conectado ao Google Agenda</span>
                                  </div>
                              ) : (
                                  <Button type="button" variant="outline" onClick={handleGoogleConnect}>Conectar com Google</Button>
                              )}
                          </div>
                      )}
                  </div>
              </div>
            </ScrollArea>
             <div className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações
                </Button>
            </div>
        </form>
    </Form>
  )
}