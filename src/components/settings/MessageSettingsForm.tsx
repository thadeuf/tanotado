// src/components/settings/MessageSettingsForm.tsx

import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { toast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


// <<< INÍCIO DA ALTERAÇÃO 1: Ajuste no Schema >>>
// Os campos `session_suspension_reminder` e `enable_cancellation` foram removidos.
const messageSettingsSchema = z.object({
  billing_monthly: z.string().optional(),
  billing_manual: z.string().optional(),
  session_reminder: z.string().optional(),
  enable_automatic_reminders: z.boolean().default(true),
  reminder_schedule: z.enum(['four_hours', 'twenty_four_hours']).default('four_hours'),
});
// <<< FIM DA ALTERAÇÃO 1 >>>


type MessageSettingsFormData = z.infer<typeof messageSettingsSchema>;

type MessageSection = {
  id: keyof Omit<MessageSettingsFormData, 'enable_automatic_reminders' | 'reminder_schedule'>;
  title: string;
  tags: string[];
};

// <<< INÍCIO DA ALTERAÇÃO 2: Ajuste nas Seções de Mensagem >>>
// A seção 'session_suspension_reminder' foi removida.
// O switch da seção 'session_reminder' foi removido.
const messageSections: MessageSection[] = [
  {
    id: 'billing_monthly',
    title: 'Mensagem de cobrança Mensal (Automático)',
    tags: ['Nome do paciente', 'Primeiro nome do paciente', 'Meu contato', 'Link do meu contato', 'Primeiro nome do profissional', 'Nome do profissional', 'Responsável financeiro', 'Detalhes', 'Valor', 'Valor por extenso', 'Valor da sessão'],
  },
  {
    id: 'billing_manual',
    title: 'Mensagem de cobrança (Manual)',
    tags: ['Nome do paciente', 'Primeiro nome do paciente', 'Meu contato', 'Link do meu contato', 'Primeiro nome do profissional', 'Nome do profissional', 'Responsável financeiro', 'Valor', 'Valor por extenso', 'Descrição'],
  },
  {
    id: 'session_reminder',
    title: 'Lembrete de Sessão',
    tags: ['Nome do paciente', 'Primeiro nome do paciente', 'Meu contato', 'Link do meu contato', 'Primeiro nome do profissional', 'Nome do profissional', 'Data', 'Hora'],
  },
];
// <<< FIM DA ALTERAÇÃO 2 >>>

const tagMap: { [key: string]: string } = {
  'Nome do paciente': '{nome_paciente}',
  'Primeiro nome do paciente': '{primeiro_nome_paciente}',
  'Meu contato': '{meu_contato}',
  'Link do meu contato': '{link_meu_contato}',
  'Primeiro nome do profissional': '{primeiro_nome_profissional}',
  'Nome do profissional': '{nome_profissional}',
  'Responsável financeiro': '{responsavel_financeiro}',
  'Detalhes': '{detalhes}',
  'Valor': '{valor}',
  'Valor por extenso': '{valor_por_extenso}',
  'Valor da sessão': '{valor_sessao}',
  'Descrição': '{descricao}',
  'Data': '{data}',
  'Hora': '{hora}',
};

export const MessageSettingsForm: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useUserSettings();
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});

  const form = useForm<MessageSettingsFormData>({
    resolver: zodResolver(messageSettingsSchema),
    // <<< INÍCIO DA ALTERAÇÃO 3: Ajuste nos Valores Padrão >>>
    // Os campos removidos do schema também foram removidos daqui.
    defaultValues: {
      billing_monthly: "Olá, {nome_paciente}. Tudo bem? Hoje é o dia de vencimento das suas sessões.",
      billing_manual: "Olá, {nome_paciente}. Tudo bem? Quem fala é {nome_profissional}, consta o valor de {valor} em aberto, {descricao}.",
      session_reminder: "",
      enable_automatic_reminders: true,
      reminder_schedule: 'four_hours',
    },
    // <<< FIM DA ALTERAÇÃO 3 >>>
  });

  useEffect(() => {
    if (settings?.message_templates) {
      const templates = settings.message_templates as any;
      
      let scheduleValue: 'four_hours' | 'twenty_four_hours' = 'four_hours';
      if (templates.reminder_schedules?.twenty_four_hours === true) {
        scheduleValue = 'twenty_four_hours';
      }
      
      // <<< INÍCIO DA ALTERAÇÃO 4: Lógica de reset do formulário ajustada >>>
      // Removida a atribuição dos campos que não existem mais.
      form.reset({
        billing_monthly: templates.billing_monthly || '',
        billing_manual: templates.billing_manual || '',
        session_reminder: templates.session_reminder || '',
        enable_automatic_reminders: templates.enable_automatic_reminders ?? true,
        reminder_schedule: scheduleValue,
      });
      // <<< FIM DA ALTERAÇÃO 4 >>>
    }
  }, [settings, form]);

  const mutation = useMutation({
    mutationFn: async (data: MessageSettingsFormData) => {
      if (!user) throw new Error("Usuário não autenticado");
      
      const message_templates_payload = {
        ...data,
        reminder_schedules: {
            four_hours: data.reminder_schedule === 'four_hours',
            twenty_four_hours: data.reminder_schedule === 'twenty_four_hours'
        }
      };
      delete (message_templates_payload as any).reminder_schedule;
      
      const { error } = await supabase.from('user_settings').upsert({
        user_id: user.id,
        message_templates: message_templates_payload as any,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Configurações salvas com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['user_settings', user?.id] });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  const handleTagClick = (fieldId: keyof Omit<MessageSettingsFormData, 'enable_automatic_reminders' | 'reminder_schedule'>, tag: string) => {
    const textarea = textareaRefs.current[fieldId];
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = form.getValues(fieldId) as string || '';
    const tagValue = tagMap[tag] || '';
    const newValue = currentValue.substring(0, start) + tagValue + currentValue.substring(end);

    form.setValue(fieldId, newValue, { shouldDirty: true });

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + tagValue.length;
    }, 0);
  };
  
  const onSubmit = (data: MessageSettingsFormData) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return <div>Carregando configurações...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold text-tanotado-navy">Configuração de Mensagens</h1>
                <p className="text-muted-foreground">Personalize os textos que serão enviados aos seus clientes.</p>
            </div>
            <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Alterações
            </Button>
        </div>

        <Separator />

        <div className="space-y-12">
          {messageSections.map((section) => (
            <div key={section.id} className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">{section.title}</h2>
              <FormField
                control={form.control}
                name={section.id}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Digite sua mensagem aqui..."
                        rows={5}
                        {...field}
                        ref={(el) => {
                            field.ref(el);
                            textareaRefs.current[section.id] = el;
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Clique nas tags abaixo para usar as informações necessárias:
                </p>
                <div className="flex flex-wrap gap-2">
                  {section.tags.map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary/20"
                      onClick={() => handleTagClick(section.id, tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              {/* <<< INÍCIO DA ALTERAÇÃO 5: Bloco do switch removido >>>
                  O bloco de código que renderizava o switch de cancelamento foi totalmente removido
                  pois a lógica foi retirada do array `messageSections`.
              // <<< FIM DA ALTERAÇÃO 5 >>> */}
            </div>
          ))}

          <Separator />
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Lembretes Automáticos de Sessão</h2>
            <FormField
              control={form.control}
              name="enable_automatic_reminders"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Ativar Lembretes Automáticos</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Enviar lembretes para os clientes antes das sessões.
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {form.watch('enable_automatic_reminders') && (
              <div className="pl-4 border-l-2 ml-2 space-y-4 pt-4 animate-fade-in">
                <FormField
                  control={form.control}
                  name="reminder_schedule"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Quando enviar o lembrete?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="twenty_four_hours" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              24 horas antes da sessão
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="four_hours" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              4 horas antes da sessão
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

        </div>
      </form>
    </Form>
  );
};