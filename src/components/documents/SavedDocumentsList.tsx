import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/hooks/useClients';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Eye, Trash2, Loader2, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EditSavedDocumentDialog } from './EditSavedDocumentDialog';

type ClientDocument = {
  id: string;
  created_at: string;
  title: string;
  content: any;
  client_id: string;
};

interface SavedDocumentsListProps {
  client: Client;
}

export const SavedDocumentsList: React.FC<SavedDocumentsListProps> = ({ client }) => {
  const queryClient = useQueryClient();
  const [viewingDocument, setViewingDocument] = useState<ClientDocument | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<ClientDocument | null>(null);
  const [editingDocument, setEditingDocument] = useState<ClientDocument | null>(null);

  const { data: documents = [], isLoading } = useQuery<ClientDocument[], Error>({
    queryKey: ['client_documents', client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_documents')
        .select('id, created_at, title, content, client_id')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!client.id,
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
        const { error } = await supabase.from('client_documents').delete().eq('id', docId);
        if (error) throw error;
    },
    onSuccess: () => {
        toast({ title: "Documento excluído com sucesso."});
        queryClient.invalidateQueries({ queryKey: ['client_documents', client.id] });
        setDocumentToDelete(null);
    },
    onError: (error: any) => {
        toast({ title: "Erro ao excluir documento", description: error.message, variant: 'destructive' });
        setDocumentToDelete(null);
    }
  });

  const renderLoadingState = () => (
    <div className="space-y-3 p-6">
      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Documentos Salvos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? renderLoadingState() : (
            <div className="space-y-3">
              {documents.length > 0 ? (
                documents.map(doc => (
                  <div key={doc.id} className="w-full text-left border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <FileText className="h-6 w-6 text-tanotado-blue" />
                      <div>
                        <p className="font-semibold">{doc.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Criado em {format(new Date(doc.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingDocument(doc)}>
                          <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingDocument(doc)}>
                          <Edit className="h-4 w-4" />
                      </Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDocumentToDelete(doc)}>
                          <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                 <div className="text-center py-16 text-muted-foreground">
                    <FileText className="mx-auto h-16 w-16 opacity-30" />
                    <h3 className="mt-4 text-xl font-semibold">Nenhum documento salvo</h3>
                    <p className="mt-2 text-sm">Os documentos que você gerar e salvar para este cliente aparecerão aqui.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Document Dialog */}
      <Dialog open={!!viewingDocument} onOpenChange={(isOpen) => !isOpen && setViewingDocument(null)}>
        {/* INÍCIO DA ALTERAÇÃO */}
        <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
        {/* FIM DA ALTERAÇÃO */}
            <DialogHeader>
                <DialogTitle>{viewingDocument?.title}</DialogTitle>
                <DialogDescription>
                    Visualizando documento gerado em {viewingDocument ? format(new Date(viewingDocument.created_at), "dd/MM/yyyy 'às' HH:mm") : ''}.
                </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto mt-4 border rounded-lg">
                {viewingDocument && <RichTextEditor content={viewingDocument.content} editable={false} />}
            </div>
             <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setViewingDocument(null)}>
                    Fechar
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <EditSavedDocumentDialog
        document={editingDocument}
        isOpen={!!editingDocument}
        onOpenChange={(isOpen) => !isOpen && setEditingDocument(null)}
      />
      
       <AlertDialog open={!!documentToDelete} onOpenChange={(isOpen) => !isOpen && setDocumentToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                    Tem certeza que deseja excluir o documento "{documentToDelete?.title}"? Esta ação é irreversível.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90"
                    onClick={() => documentToDelete && deleteMutation.mutate(documentToDelete.id)}
                    disabled={deleteMutation.isPending}
                >
                    {deleteMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Excluindo...</> : "Confirmar Exclusão"}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
};