import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos e Interfaces
import { Client } from '@/hooks/useClients';
import { Database } from '@/integrations/supabase/types';

// Componentes de UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DateInput } from '@/components/ui/DateInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Save, FileText, User, Heart, Stethoscope, Briefcase, Shield, ClipboardList, FlaskConical, PencilRuler, Info } from 'lucide-react';

// AQUI ESTÁ A MUDANÇA: Schema atualizado com os novos campos
const recordContentSchema = z.object({
  historiaFamiliar: z.string().optional(),
  historiaPatologica: z.string().optional(),
  historiaSocial: z.string().optional(),
  reacoesMedicamentos: z.string().optional(),
  motivoConsulta: z.string().optional(),
  queixasAtuais: z.string().optional(),
  historiaDoencaAtual: z.string().optional(),
  interrogatorioDetalhado: z.string().optional(),
  evolucao: z.string().optional(),
  examesResultados: z.string().optional(),
  diagnostico: z.string().optional(),
  prescricao: z.string().optional(),
  recomendacoes: z.string().optional(),
  planoTratamento: z.string().optional(),
  procedimentos: z.string().optional(),
  observacoes: z.string().optional(),
  dadosResponsavel: z.string().optional(),
  comunicacaoFamiliares: z.string().optional(),
});

const recordFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2, { message: "O título é obrigatório." }),
  session_date: z.date({ required_error: "A data é obrigatória." }),
  content: recordContentSchema,
});


type RecordFormData = z.infer<typeof recordFormSchema>;
type MedicalRecord = Database['public']['Tables']['medical_records']['Row'];

interface RecordFormProps {
  client: Client;
  onSuccess: () => void;
  initialData?: MedicalRecord | null;
}

export const RecordForm: React.FC<RecordFormProps> = ({ client, onSuccess, initialData }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEditing = !!initialData;

  const form = useForm<RecordFormData>({
    resolver: zodResolver(recordFormSchema),
    defaultValues: {
      title: `Sessão - ${format(new Date(), 'dd/MM/yyyy')}`,
      session_date: new Date(),
      content: {
        historiaFamiliar: '',
        historiaPatologica: '',
        historiaSocial: '',
        reacoesMedicamentos: '',
        motivoConsulta: '',
        queixasAtuais: '',
        historiaDoencaAtual: '',
        interrogatorioDetalhado: '',
        evolucao: '',
        examesResultados: '',
        diagnostico: '',
        prescricao: '',
        recomendacoes: '',
        planoTratamento: '',
        procedimentos: '',
        observacoes: '',
        dadosResponsavel: '',
        comunicacaoFamiliares: '',
      },
    },
  });

  useEffect(() => {
    if (isEditing && initialData) {
      let parsedContent = {};
      try {
        if (typeof initialData.content === 'string') {
          parsedContent = JSON.parse(initialData.content);
        } else if (typeof initialData.content === 'object' && initialData.content !== null) {
          parsedContent = initialData.content;
        }
      } catch (e) {
        console.error("Erro ao fazer parse do conteúdo do prontuário:", e);
        toast({ title: "Erro", description: "Não foi possível carregar o conteúdo do prontuário.", variant: "destructive" });
      }

      form.reset({
        id: initialData.id,
        title: initialData.title,
        session_date: new Date(initialData.session_date),
        content: parsedContent as z.infer<typeof recordContentSchema>,
      });
    }
  }, [initialData, isEditing, form]);

  const mutation = useMutation({
    mutationFn: async (data: RecordFormData) => {
      if (!user || !client) throw new Error("Usuário ou cliente não encontrado.");

      const recordPayload = {
        id: isEditing ? data.id : undefined,
        user_id: user.id,
        client_id: client.id,
        title: data.title,
        session_date: data.session_date.toISOString(),
        content: JSON.stringify(data.content), 
      };
      
      const { error } = await supabase
        .from('medical_records')
        .upsert(recordPayload)
        .select();

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: `Prontuário ${isEditing ? 'atualizado' : 'salvo'} com sucesso!` });
      queryClient.invalidateQueries({ queryKey: ['medical_records', client.id] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: "Erro ao salvar prontuário", description: error.message, variant: "destructive" });
    },
  });

  // AQUI ESTÁ A MUDANÇA: Seções do formulário atualizadas
  const accordionSections = [
    { id: 'anamnese', title: 'Anamnese', icon: ClipboardList, fields: [
      { name: 'content.motivoConsulta', label: 'Motivo da Consulta' },
      { name: 'content.queixasAtuais', label: 'Queixas Atuais' },
      { name: 'content.historiaDoencaAtual', label: 'História da Doença Atual' },
      { name: 'content.interrogatorioDetalhado', label: 'Interrogatório Detalhado (segundo a área de atuação)' },
    ]},
    { id: 'historico', title: 'Histórico Médico', icon: Stethoscope, fields: [
      { name: 'content.historiaFamiliar', label: 'História Familiar (doenças hereditárias)' },
      { name: 'content.historiaPatologica', label: 'História Patológica Pregressa (doenças anteriores)' },
      { name: 'content.historiaSocial', label: 'História Social (hábitos, ocupação)' },
      { name: 'content.reacoesMedicamentos', label: 'Reações a Medicamentos' },
    ]},
    { id: 'evolucao', title: 'Evolução', icon: PencilRuler, fields: [
      { name: 'content.evolucao', label: 'Notas de Evolução da Sessão' },
    ]},
    { id: 'exames', title: 'Exames', icon: FlaskConical, fields: [
      { name: 'content.examesResultados', label: 'Resultados e Análise de Exames (com cópias dos documentos)' },
    ]},
    { id: 'tratamento', title: 'Tratamento', icon: Heart, fields: [
      { name: 'content.diagnostico', label: 'Hipótese Diagnóstica (CID-10)' },
      { name: 'content.prescricao', label: 'Prescrição de Medicamentos' },
      { name: 'content.procedimentos', label: 'Procedimentos (com datas e horários)' },
      { name: 'content.recomendacoes', label: 'Recomendações' },
      { name: 'content.planoTratamento', label: 'Plano de Tratamento' },
    ]},
    { id: 'outros', title: 'Observações', icon: Info, fields: [
      { name: 'content.observacoes', label: 'Observações Gerais (comportamento, reações, etc.)' },
    ]},
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        <ScrollArea className="h-[calc(80vh-120px)] pr-4">
          <div className="space-y-4">
             <div className="p-4 border rounded-lg bg-muted/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Título do Registro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="session_date" render={({ field }) => ( <FormItem><FormLabel>Data da Sessão</FormLabel><FormControl><DateInput value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem> )} />
                </div>
            </div>

            <Accordion type="multiple" defaultValue={['anamnese', 'evolucao']} className="w-full">
              {accordionSections.map(section => (
                <AccordionItem key={section.id} value={section.id}>
                  <AccordionTrigger className="text-base font-semibold hover:no-underline">
                    <div className="flex items-center gap-3">
                      <section.icon className="h-5 w-5 text-tanotado-blue" />
                      {section.title}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    {section.fields.map(fieldInfo => (
                      <FormField
                        key={fieldInfo.name}
                        control={form.control}
                        name={fieldInfo.name as keyof RecordFormData}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{fieldInfo.label}</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Digite aqui..." {...field} rows={5} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </ScrollArea>
        
        <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onSuccess}>
                Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple">
                {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isEditing ? 'Salvar Alterações' : 'Criar Registro'}
            </Button>
        </div>
      </form>
    </Form>
  );
};