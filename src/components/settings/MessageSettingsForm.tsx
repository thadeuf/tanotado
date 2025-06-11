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

const messageSettingsSchema = z.object({
  billing_monthly: z.string().optional(),
  billing_manual: z.string().optional(),
  session_reminder: z.string().optional(),
  session_suspension_reminder: z.string().optional(),
  enable_cancellation: z.boolean().default(false),
});

type MessageSettingsFormData = z.infer<typeof messageSettingsSchema>;

type MessageSection = {
  id: keyof MessageSettingsFormData;
  title: string;
  tags: string[];
  hasSwitch?: boolean;
  switchLabel?: string;
  switchId?: keyof MessageSettingsFormData;
};

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
    hasSwitch: true,
    switchLabel: 'Habilitar cancelamento e reagendamento',
    switchId: 'enable_cancellation',
    tags: ['Nome do paciente', 'Primeiro nome do paciente', 'Meu contato', 'Link do meu contato', 'Primeiro nome do profissional', 'Nome do profissional', 'Data', 'Hora'],
  },
  {
    id: 'session_suspension_reminder',
    title: 'Lembrete de Sessão Suspensa',
    tags: ['Nome do paciente', 'Primeiro nome do paciente', 'Meu contato', 'Link do meu contato', 'Primeiro nome do profissional', 'Nome do profissional', 'Data', 'Hora'],
  }
];

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
    defaultValues: {
      billing_monthly: "Olá, {nome_paciente}. Tudo bem? Já emitiu sua nota fiscal desse mês?",
      billing_manual: "Olá, {nome_paciente}. Tudo bem? Quem fala é {nome_profissional}, consta o valor de {valor} em aberto, {descricao}.",
      session_reminder: "",
      session_suspension_reminder: "",
      enable_cancellation: false,
    },
  });

  useEffect(() => {
    if (settings?.message_templates) {
      const templates = settings.message_templates as any;
      form.reset({
        billing_monthly: templates.billing_monthly || '',
        billing_manual: templates.billing_manual || '',
        session_reminder: templates.session_reminder || '',
        session_suspension_reminder: templates.session_suspension_reminder || '',
        enable_cancellation: templates.enable_cancellation || false,
      });
    }
  }, [settings, form]);

  const mutation = useMutation({
    mutationFn: async (data: MessageSettingsFormData) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase.from('user_settings').upsert({
        user_id: user.id,
        message_templates: data as any,
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

  const handleTagClick = (fieldId: keyof MessageSettingsFormData, tag: string) => {
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
        {/* Cabeçalho da página */}
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

        {/* Container das seções, agora usando space-y para espaçamento */}
        <div className="space-y-12">
          {messageSections.map((section) => (
            <div key={section.id} className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">{section.title}</h2>
              <FormField
                control={form.control}
                name={section.id as keyof MessageSettingsFormData}
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
                      onClick={() => handleTagClick(section.id as keyof MessageSettingsFormData, tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {section.hasSwitch && section.switchId && section.switchLabel && (
                 <FormField
                    control={form.control}
                    name={section.switchId as keyof MessageSettingsFormData}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-4 rounded-lg border p-3">
                          <FormControl>
                              <Switch
                                  checked={field.value as boolean}
                                  onCheckedChange={field.onChange}
                                  id={section.switchId}
                              />
                          </FormControl>
                          <FormLabel htmlFor={section.switchId} className="text-sm font-normal cursor-pointer">
                            {section.switchLabel}
                          </FormLabel>
                      </FormItem>
                    )}
                  />
              )}
            </div>
          ))}
        </div>
      </form>
    </Form>
  );
};