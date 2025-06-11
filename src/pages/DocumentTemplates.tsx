// src/pages/DocumentTemplates.tsx

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, FileText, FilePlus, MoreVertical, Edit, Trash2, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type DocumentTemplate = {
  id: string;
  title: string;
  updated_at: string;
};

const useDocumentTemplates = () => {
  const { user } = useAuth();
  return useQuery<DocumentTemplate[], Error>({
    queryKey: ['document_templates', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('document_templates')
        .select('id, title, updated_at')
        .eq('user_id', user.id)
        .order('title', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

const DocumentTemplates: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: templates, isLoading } = useDocumentTemplates();
  const [templateToDelete, setTemplateToDelete] = useState<DocumentTemplate | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase.from('document_templates').delete().eq('id', templateId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Modelo excluído com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['document_templates'] });
      setTemplateToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
      setTemplateToDelete(null);
    },
  });

  const renderEmptyState = () => (
    <div className="text-center py-16">
      <FilePlus className="mx-auto h-16 w-16 text-muted-foreground/50" />
      <h3 className="mt-4 text-xl font-semibold text-tanotado-navy">Nenhum modelo encontrado</h3>
      <p className="mt-2 text-sm text-muted-foreground">Crie seu primeiro modelo de documento para agilizar seu trabalho.</p>
      <Button onClick={() => navigate('/configuracoes/modelos/novo')} className="mt-6 bg-gradient-to-r from-tanotado-pink to-tanotado-purple hover:shadow-lg transition-all duration-200 gap-2">
        <Plus className="h-4 w-4" />
        Criar Primeiro Modelo
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-tanotado-navy">Modelos de Documentos</h1>
          <p className="text-muted-foreground mt-1">Crie e gerencie seus modelos de prontuários, contratos e recibos.</p>
        </div>
        <Button onClick={() => navigate('/configuracoes/modelos/novo')} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Modelo
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : templates && templates.length > 0 ? (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div className="space-y-1.5">
                      <CardTitle className="text-lg">{template.title}</CardTitle>
                    </div>
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/configuracoes/modelos/editar/${template.id}`)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTemplateToDelete(template)} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-xs text-muted-foreground">
                        <FileText className="h-4 w-4 mr-2" />
                        Atualizado em {new Date(template.updated_at).toLocaleDateString('pt-BR')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            renderEmptyState()
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o modelo "{templateToDelete?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => templateToDelete && deleteMutation.mutate(templateToDelete.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DocumentTemplates;