// src/components/admin/AdminSettingsForm.tsx

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Link } from 'lucide-react';
import { DialogFooter } from '@/components/ui/dialog';

const SETTINGS_KEY = 'reminder_response_webhook';

const settingsSchema = z.object({
  webhookUrl: z.string().url({ message: "Por favor, insira uma URL válida." }).or(z.literal('')),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface AdminSettingsFormProps {
  onSuccess: () => void;
}

export const AdminSettingsForm: React.FC<AdminSettingsFormProps> = ({ onSuccess }) => {
  const queryClient = useQueryClient();

  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ['admin_settings', SETTINGS_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', SETTINGS_KEY)
        .maybeSingle(); // <<< CORREÇÃO APLICADA AQUI

      if (error) throw error;
      return data;
    }
  });

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      webhookUrl: '',
    },
  });

  useEffect(() => {
    if (currentSettings?.value) {
      form.setValue('webhookUrl', (currentSettings.value as any)?.url || '');
    }
  }, [currentSettings, form]);

  const mutation = useMutation({
    mutationFn: async (values: SettingsFormData) => {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          key: SETTINGS_KEY,
          value: { url: values.webhookUrl },
          description: 'Webhook para receber respostas dos lembretes de agendamento.',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Configuração salva com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['admin_settings', SETTINGS_KEY] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    }
  });

  if (isLoading) {
    return (
        <div className="space-y-4 py-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-10 w-full" />
            <div className="flex justify-end pt-4">
                <Skeleton className="h-10 w-24" />
            </div>
        </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(data => mutation.mutate(data))} className="space-y-6 pt-4">
        <FormField
          control={form.control}
          name="webhookUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-base">
                <Link className="h-4 w-4" />
                URL do Webhook para Respostas
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="https://sua-automacao.com/webhook/..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};