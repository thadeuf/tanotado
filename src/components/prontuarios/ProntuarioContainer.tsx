import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Client } from '@/hooks/useClients';
import { toast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, FileText, Stethoscope, ClipboardList, PencilRuler, Heart, Info, FlaskConical, Plus, Save, Pencil, Trash2 } from 'lucide-react';

// Tipos e Estruturas de Dados (sem alterações)
type ProntuarioField = { id: string; label: string; };
type ProntuarioSection = { id: string; title: string; icon: string; fields: ProntuarioField[]; };
const recordContentSchema = z.record(z.string().optional());
const formSchema = z.object({ content: recordContentSchema, });
type FormData = z.infer<typeof formSchema>;
const icons: { [key: string]: React.ElementType } = { ClipboardList, Stethoscope, Heart, Info, PencilRuler, FlaskConical, FileText };
const defaultProntuarioStructure: ProntuarioSection[] = [
    { id: 'anamnese', title: 'Anamnese', icon: 'ClipboardList', fields: [ { id: 'motivoConsulta', label: 'Motivo da Consulta' }, { id: 'queixasAtuais', label: 'Queixas Atuais' }, { id: 'historiaDoencaAtual', label: 'História da Doença Atual' }, { id: 'interrogatorioDetalhado', label: 'Interrogatório Detalhado (segundo a área de atuação)' }, ]},
    { id: 'historico', title: 'Histórico Médico', icon: 'Stethoscope', fields: [ { id: 'historiaFamiliar', label: 'História Familiar (doenças hereditárias)' }, { id: 'historiaPatologica', label: 'História Patológica Pregressa (doenças anteriores)' }, { id: 'historiaSocial', label: 'História Social (hábitos, ocupação)' }, { id: 'reacoesMedicamentos', label: 'Reações a Medicamentos' }, ]},
    { id: 'evolucao', title: 'Evolução', icon: 'PencilRuler', fields: [ { id: 'evolucaoSessao', label: 'Notas de Evolução da Sessão' }, ]},
    { id: 'exames', title: 'Exames', icon: 'FlaskConical', fields: [ { id: 'examesResultados', label: 'Resultados e Análise de Exames (com cópias dos documentos)' }, ]},
    { id: 'tratamento', title: 'Tratamento', icon: 'Heart', fields: [ { id: 'diagnostico', label: 'Hipótese Diagnóstica (CID-10)' }, { id: 'prescricao', label: 'Prescrição de Medicamentos' }, { id: 'procedimentos', label: 'Procedimentos (com datas e horários)' }, { id: 'recomendacoes', label: 'Recomendações' }, { id: 'planoTratamento', label: 'Plano de Tratamento' }, ]},
    { id: 'outros', title: 'Observações', icon: 'Info', fields: [ { id: 'observacoes', label: 'Observações Gerais (comportamento, reações, etc.)' }, ]},
];
type ProntuarioSectionState = Omit<ProntuarioSection, 'icon'> & { icon: React.ElementType; }
type ItemToDelete = { type: 'section' | 'field'; sectionId: string; fieldId?: string; label: string; };

interface ProntuarioContainerProps { client: Client; }

// INÍCIO DA MUDANÇA: O componente SortableAccordionItem agora recebe todas as props diretamente
function SortableAccordionItem(props: {
    section: ProntuarioSectionState;
    form: any;
    editingSectionId: string | null;
    currentEditingValue: string;
    setCurrentEditingValue: (value: string) => void;
    handleEditClick: (e: React.MouseEvent, sectionId: string, currentTitle: string) => void;
    handleTitleSave: () => void;
    handleInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    setItemToDelete: (item: ItemToDelete | null) => void;
    editingFieldId: string | null;
    currentFieldEditingValue: string;
    setCurrentFieldEditingValue: (value: string) => void;
    handleEditFieldClick: (e: React.MouseEvent, fieldId: string, currentLabel: string) => void;
    handleFieldLabelSave: () => void;
    handleFieldLabelKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    handleAddField: (sectionId: string) => void;
}) {
  const { section, form, ...rest } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent = section.icon || FileText;

  return (
    <div ref={setNodeRef} style={style}>
      <AccordionItem value={section.id}>
        <AccordionTrigger className="text-base font-semibold hover:no-underline">
          <div className="flex items-center gap-2 w-full">
            <div {...attributes} {...listeners} className="cursor-grab p-2 -ml-2">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <IconComponent className="h-5 w-5 text-tanotado-blue flex-shrink-0" />
            {rest.editingSectionId === section.id ? (
                <Input
                    value={rest.currentEditingValue}
                    onChange={(e) => rest.setCurrentEditingValue(e.target.value)}
                    onBlur={rest.handleTitleSave}
                    onKeyDown={rest.handleInputKeyDown}
                    autoFocus
                    className="h-8 text-base font-semibold flex-1"
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <div className="flex flex-1 items-center gap-2">
                    <span className="text-left">{section.title}</span>
                    <div role="button" className="h-7 w-7 flex-shrink-0 rounded-full flex items-center justify-center hover:bg-accent cursor-pointer" onClick={(e) => rest.handleEditClick(e, section.id, section.title)}><Pencil className="h-4 w-4 text-muted-foreground" /></div>
                    <div role="button" className="h-7 w-7 flex-shrink-0 rounded-full flex items-center justify-center hover:bg-destructive/10 text-destructive cursor-pointer" onClick={(e) => { e.stopPropagation(); rest.setItemToDelete({type: 'section', sectionId: section.id, label: section.title})}}><Trash2 className="h-4 w-4" /></div>
                </div>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2 pl-4 border-l-2 ml-4">
            {section.fields.map(fieldInfo => (
            <FormField key={fieldInfo.id} control={form.control} name={`content.${fieldInfo.id}`}
                render={({ field }) => (
                <FormItem>
                    <div className="flex items-center gap-2">
                        {rest.editingFieldId === fieldInfo.id ? (
                            <Input value={rest.currentFieldEditingValue} onChange={(e) => rest.setCurrentFieldEditingValue(e.target.value)} onBlur={rest.handleFieldLabelSave} onKeyDown={rest.handleFieldLabelKeyDown} autoFocus className="h-8 flex-1" />
                        ) : (
                        <>
                            <FormLabel>{fieldInfo.label}</FormLabel>
                            <div role="button" className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-accent cursor-pointer" onClick={(e) => rest.handleEditFieldClick(e, fieldInfo.id, fieldInfo.label)}><Pencil className="h-3 w-3 text-muted-foreground" /></div>
                            <div role="button" className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-destructive/10 text-destructive cursor-pointer" onClick={(e) => { e.stopPropagation(); rest.setItemToDelete({type: 'field', sectionId: section.id, fieldId: fieldInfo.id, label: fieldInfo.label})}}><Trash2 className="h-3 w-3" /></div>
                        </>
                        )}
                    </div>
                    <FormControl>
                        <Textarea placeholder="Digite aqui..." {...field} value={field.value || ''} rows={4} className="text-base"/>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            ))}
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => rest.handleAddField(section.id)}>
                <Plus className="h-4 w-4" /> Adicionar Campo
            </Button>
        </AccordionContent>
      </AccordionItem>
    </div>
  );
}
// FIM DA MUDANÇA


export const ProntuarioContainer: React.FC<ProntuarioContainerProps> = ({ client }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [prontuarioStructure, setProntuarioStructure] = useState<ProntuarioSectionState[]>(() => 
    defaultProntuarioStructure.map(s => ({...s, icon: icons[s.icon] || FileText }))
  );
  
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [currentEditingValue, setCurrentEditingValue] = useState('');
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [currentFieldEditingValue, setCurrentFieldEditingValue] = useState('');
  const [itemToDelete, setItemToDelete] = useState<ItemToDelete | null>(null);

  const { data: userSettings, isLoading: isLoadingUserSettings } = useQuery({
    queryKey: ['user_settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from('user_settings').select('prontuario_template').eq('user_id', user.id).single();
      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (userSettings?.prontuario_template) {
      const savedStructure = userSettings.prontuario_template as ProntuarioSection[];
      if(Array.isArray(savedStructure) && savedStructure.length > 0) {
        const rehydratedStructure = savedStructure.map(section => ({
            ...section,
            icon: icons[section.icon] || FileText 
        }));
        setProntuarioStructure(rehydratedStructure);
      }
    }
  }, [userSettings]);

  const { data: record, isLoading, error } = useQuery({
    queryKey: ['prontuario_content', client.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('medical_records').select('*').eq('client_id', client.id).maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { content: {} },
  });

  useEffect(() => {
    if (record?.content) {
      try {
        const parsedContent = typeof record.content === 'string' ? JSON.parse(record.content) : record.content;
        form.reset({ content: parsedContent || {} });
      } catch (e) {
        console.error("Erro ao carregar conteúdo do prontuário:", e);
        toast({ title: "Erro ao carregar dados", variant: "destructive" });
      }
    } else {
        form.reset({ content: {} });
    }
  }, [record, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!user) throw new Error("Usuário não autenticado.");
      const payload = { id: record?.id, user_id: user.id, client_id: client.id, title: record?.title || `Prontuário de ${client.name}`, session_date: record?.session_date || new Date().toISOString(), content: JSON.stringify(data.content), };
      const { error } = await supabase.from('medical_records').upsert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Prontuário salvo com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['prontuario_content', client.id] });
    },
    onError: (e: any) => toast({ title: "Erro ao salvar prontuário", description: e.message, variant: "destructive" }),
  });

  const updateStructureMutation = useMutation({
    mutationFn: async (newStructure: ProntuarioSectionState[]) => {
        if (!user) throw new Error("Usuário não autenticado");
        const dehydratedStructure = newStructure.map(section => {
            const iconName = Object.keys(icons).find(key => icons[key] === section.icon) || 'FileText';
            return { ...section, icon: iconName };
        });
        const { error } = await supabase.from('user_settings').upsert({ user_id: user.id, prontuario_template: dehydratedStructure as any }, { onConflict: 'user_id' });
        if (error) throw error;
    },
    onSuccess: () => {
        toast({ title: "Estrutura do prontuário salva!" });
        queryClient.invalidateQueries({ queryKey: ['user_settings', user?.id] });
    },
    onError: (e: any) => toast({ title: "Erro ao salvar estrutura", description: e.message, variant: "destructive" }),
  });
  
  const handleEditClick = (e: React.MouseEvent, sectionId: string, currentTitle: string) => { e.stopPropagation(); setEditingSectionId(sectionId); setCurrentEditingValue(currentTitle); };
  const handleTitleSave = () => { if (editingSectionId && currentEditingValue.trim()) { const newStructure = prontuarioStructure.map(section => section.id === editingSectionId ? { ...section, title: currentEditingValue.trim() } : section ); setProntuarioStructure(newStructure); updateStructureMutation.mutate(newStructure); } setEditingSectionId(null); setCurrentEditingValue(''); };
  const handleAddField = (sectionId: string) => { const newField: ProntuarioField = { id: uuidv4(), label: "Novo Campo (clique para editar)", }; const newStructure = prontuarioStructure.map(section => section.id === sectionId ? { ...section, fields: [...section.fields, newField] } : section ); setProntuarioStructure(newStructure); updateStructureMutation.mutate(newStructure); };
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); handleTitleSave(); } else if (e.key === 'Escape') { setEditingSectionId(null); setCurrentEditingValue(''); } };
  const handleEditFieldClick = (e: React.MouseEvent, fieldId: string, currentLabel: string) => { e.stopPropagation(); setEditingFieldId(fieldId); setCurrentFieldEditingValue(currentLabel); };
  const handleFieldLabelSave = () => { if (!editingFieldId || !currentFieldEditingValue.trim()) { setEditingFieldId(null); setCurrentFieldEditingValue(''); return; } const newStructure = prontuarioStructure.map(section => ({ ...section, fields: section.fields.map(field => field.id === editingFieldId ? { ...field, label: currentFieldEditingValue.trim() } : field ) })); setProntuarioStructure(newStructure); updateStructureMutation.mutate(newStructure); setEditingFieldId(null); setCurrentFieldEditingValue(''); };
  const handleFieldLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); handleFieldLabelSave(); } else if (e.key === 'Escape') { setEditingFieldId(null); setCurrentFieldEditingValue(''); } };
  const handleAddNewSection = () => { const newSection: ProntuarioSectionState = { id: uuidv4(), title: 'Nova Seção (clique para editar)', icon: FileText, fields: [] }; const newStructure = [...prontuarioStructure, newSection]; setProntuarioStructure(newStructure); updateStructureMutation.mutate(newStructure); toast({ title: "Nova seção adicionada!", description: "Agora você pode editar o título e adicionar campos." }); };
  const handleConfirmDelete = () => { if (!itemToDelete) return; let newStructure; if (itemToDelete.type === 'section') { newStructure = prontuarioStructure.filter(section => section.id !== itemToDelete.sectionId); } else { newStructure = prontuarioStructure.map(section => { if (section.id === itemToDelete.sectionId) { return { ...section, fields: section.fields.filter(field => field.id !== itemToDelete.fieldId) }; } return section; }); } setProntuarioStructure(newStructure); updateStructureMutation.mutate(newStructure); setItemToDelete(null); };

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    if (over && active.id !== over.id) {
      setProntuarioStructure((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const reorderedItems = arrayMove(items, oldIndex, newIndex);
        updateStructureMutation.mutate(reorderedItems);
        return reorderedItems;
      });
    }
  }

  if (isLoading || isLoadingUserSettings) {
    return (<Card><CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-24 w-full" /></CardContent></Card>);
  }

  if (error) {
    return <p className="text-destructive text-center">Erro ao carregar o prontuário: {error.message}</p>;
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Prontuário</CardTitle>
                <CardDescription>Informações principais do prontuário.</CardDescription>
              </div>
              <Button type="submit" disabled={saveMutation.isPending} className="gap-2">
                  {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar Alterações
              </Button>
            </CardHeader>
            <CardContent>
              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={prontuarioStructure.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <Accordion type="multiple" className="w-full" defaultValue={[]}>
                    {prontuarioStructure.map(section => (
                      <SortableAccordionItem 
                        key={section.id} 
                        section={section}
                        form={form}
                        editingSectionId={editingSectionId}
                        currentEditingValue={currentEditingValue}
                        setCurrentEditingValue={setCurrentEditingValue}
                        handleEditClick={handleEditClick}
                        handleTitleSave={handleTitleSave}
                        handleInputKeyDown={handleInputKeyDown}
                        setItemToDelete={setItemToDelete}
                        editingFieldId={editingFieldId}
                        currentFieldEditingValue={currentFieldEditingValue}
                        setCurrentFieldEditingValue={setCurrentFieldEditingValue}
                        handleEditFieldClick={handleEditFieldClick}
                        handleFieldLabelSave={handleFieldLabelSave}
                        handleFieldLabelKeyDown={handleFieldLabelKeyDown}
                        handleAddField={handleAddField}
                      />
                    ))}
                  </Accordion>
                </SortableContext>
              </DndContext>
              <div className="mt-6 flex justify-center border-t pt-6">
                  <Button
                      type="button"
                      variant="outline"
                      className="gap-2 border-dashed"
                      onClick={handleAddNewSection}
                  >
                      <Plus className="h-4 w-4" />
                      Adicionar Nova Seção
                  </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                    {itemToDelete?.type === 'section'
                        ? `Tem certeza que deseja excluir a seção inteira "${itemToDelete.label}" e todos os seus campos?`
                        : `Tem certeza que deseja excluir o campo "${itemToDelete?.label}"?`
                    }
                    <br />
                    <strong className="text-destructive mt-2 block">Esta ação não poderá ser desfeita.</strong>
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                    onClick={handleConfirmDelete}
                    className="bg-destructive hover:bg-destructive/90"
                >
                    Excluir
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};