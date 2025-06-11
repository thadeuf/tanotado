import React from 'react';
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
import { Loader2 } from 'lucide-react';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  })
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

    const { data: settings } = useQuery({
        queryKey: ['user_settings', user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data, error } = await supabase
                .from('user_settings')
                .select('working_hours, appointment_duration')
                .eq('user_id', user.id)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error;
            return data;
        },
        enabled: !!user,
    });


  const form = useForm<AgendaSettingsFormData>({
    resolver: zodResolver(agendaSettingsSchema),
    defaultValues: {
      start_time: "09:00",
      end_time: "18:00",
      interval: '30',
      working_days: {
        sunday: false,
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
      }
    },
  });

  React.useEffect(() => {
    if (settings) {
        const workingHours = settings.working_hours as any;
        const mappedDefaults = {
            start_time: "09:00",
            end_time: "18:00",
            interval: '30',
            working_days: {
                sunday: false,
                monday: true,
                tuesday: true,
                wednesday: true,
                thursday: true,
                friday: true,
                saturday: false,
            }
        };

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

        form.reset(mappedDefaults);
    }
  }, [settings, form]);


    const mutation = useMutation({
        mutationFn: async (data: AgendaSettingsFormData) => {
            if (!user) throw new Error("Usuário não autenticado.");

            const working_hours = {
                start_time: data.start_time,
                end_time: data.end_time,
                sunday: { enabled: data.working_days.sunday },
                monday: { enabled: data.working_days.monday },
                tuesday: { enabled: data.working_days.tuesday },
                wednesday: { enabled: data.working_days.wednesday },
                thursday: { enabled: data.working_days.thursday },
                friday: { enabled: data.working_days.friday },
                saturday: { enabled: data.working_days.saturday },
            }

            const { error } = await supabase
                .from('user_settings')
                .upsert({
                    user_id: user.id,
                    working_hours: working_hours as any,
                    appointment_duration: parseInt(data.interval, 10),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: "Configurações da agenda salvas com sucesso!" });
            queryClient.invalidateQueries({ queryKey: ['user_settings', user?.id] });
            onSuccess();
        },
        onError: (error: any) => {
            toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
        }
    });


  const daysOfWeek = [
    { id: 'monday', label: 'Segunda-feira' },
    { id: 'tuesday', label: 'Terça-feira' },
    { id: 'wednesday', label: 'Quarta-feira' },
    { id: 'thursday', label: 'Quinta-feira' },
    { id: 'friday', label: 'Sexta-feira' },
    { id: 'saturday', label: 'Sábado' },
    { id: 'sunday', label: 'Domingo' },
  ] as const;


  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="flex flex-col flex-1 min-h-0">
            <DialogHeader>
                <DialogTitle className="text-2xl">Configurações da Agenda</DialogTitle>
                <DialogDescription>
                  Defina seus horários de trabalho e intervalos de agendamento.
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 my-4 pr-6 -mr-6">
              <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <FormField
                          control={form.control}
                          name="start_time"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Início da agenda</FormLabel>
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
                                  <FormLabel>Fim da agenda</FormLabel>
                                  <FormControl>
                                      <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                  </div>
                  <FormField
                      control={form.control}
                      name="interval"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>Intervalo entre agendamentos</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                      <SelectItem value="5">5 minutos</SelectItem>
                                      <SelectItem value="10">10 minutos</SelectItem>
                                      <SelectItem value="15">15 minutos</SelectItem>
                                      <SelectItem value="30">30 minutos</SelectItem>
                                      <SelectItem value="35">35 minutos</SelectItem>
                                      <SelectItem value="40">40 minutos</SelectItem>
                                      <SelectItem value="50">50 minutos</SelectItem>
                                      <SelectItem value="60">60 minutos</SelectItem>
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
                  <div className="space-y-2 pt-4">
                      <FormLabel>Dias de trabalho</FormLabel>
                      {daysOfWeek.map(day => (
                          <FormField
                              key={day.id}
                              control={form.control}
                              name={`working_days.${day.id}`}
                              render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                      <div className="space-y-0.5">
                                          <FormLabel>{day.label}</FormLabel>
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
                      ))}
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