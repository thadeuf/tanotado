// src/pages/EditDocumentTemplate.tsx

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// --- INÍCIO DAS MUDANÇAS ---

// Definição das tags disponíveis para os documentos
const documentTags = {
  'Nome do Cliente': '{nome_cliente}',
  'Primeiro Nome do Cliente': '{primeiro_nome_cliente}',
  'Email do Cliente': '{email_cliente}',
  'WhatsApp do Cliente': '{whatsapp_cliente}',
  'CPF do Cliente': '{cpf_cliente}',
  'RG do Cliente': '{rg_cliente}',
  'Data de Nasc. do Cliente': '{data_nascimento_cliente}',
  'Endereço do Cliente': '{endereco_cliente}',
  'Nome do Profissional': '{nome_profissional}',
  'Email do Profissional': '{email_profissional}',
  'WhatsApp do Profissional': '{whatsapp_profissional}',
  'Data Atual': '{data_atual}',
  'Data Atual (Extenso)': '{data_atual_extenso}',
};

// --- FIM DAS MUDANÇAS ---

const templateSchema = z.object({
  title: z.string().min(3, { message: 'O título do modelo é obrigatório.' }),
  content: z.any().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

const EditDocumentTemplate: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEditing = !!templateId;

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  const { data: templateData, isLoading } = useQuery({
    queryKey: ['document_template', templateId],
    queryFn: async () => {
      if (!templateId || !user) return null;
      const { data, error } = await supabase
        .from('document_templates')
        .select('title, content')
        .eq('id', templateId)
        .eq('user_id', user.id)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (isEditing && templateData) {
      form.reset({
        title: templateData.title,
        content: templateData.content || '',
      });
    }
  }, [templateData, isEditing, form]);

  const mutation = useMutation({
    mutationFn: async (values: TemplateFormData) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const payload = {
        user_id: user.id,
        title: values.title,
        content: values.content,
        updated_at: new Date().toISOString(),
      };

      if (isEditing) {
        const { error } = await supabase.from('document_templates').update(payload).eq('id', templateId!);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('document_templates').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: `Modelo ${isEditing ? 'atualizado' : 'criado'} com sucesso!` });
      queryClient.invalidateQueries({ queryKey: ['document_templates'] });
      navigate('/configuracoes/modelos');
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold text-tanotado-navy">
              {isEditing ? 'Editar Modelo' : 'Novo Modelo de Documento'}
            </h1>
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Modelo
          </Button>
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Título do Modelo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Contrato de Prestação de Serviço" {...field} className="text-lg h-12" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Controller
          control={form.control}
          name="content"
          render={({ field }) => (
             <FormItem>
                <FormLabel className="text-base">Conteúdo</FormLabel>
                <FormControl>
                    {/* --- INÍCIO DA MUDANÇA --- */}
                    <RichTextEditor
                        content={field.value}
                        onChange={field.onChange}
                        tags={documentTags} // Passamos nosso objeto de tags aqui
                    />
                    {/* --- FIM DA MUDANÇA --- */}
                </FormControl>
                 <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

export default EditDocumentTemplate;