import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Save } from 'lucide-react';

type ClientDocument = {
  id: string;
  title: string;
  content: any;
  client_id?: string;
};

const documentSchema = z.object({
  title: z.string().min(3, { message: "O título é obrigatório." }),
  content: z.any().optional(),
});

type DocumentFormData = z.infer<typeof documentSchema>;

interface EditSavedDocumentDialogProps {
  document: ClientDocument | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditSavedDocumentDialog: React.FC<EditSavedDocumentDialogProps> = ({ document, isOpen, onOpenChange }) => {
  const queryClient = useQueryClient();

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
  });

  useEffect(() => {
    if (document) {
      form.reset({
        title: document.title,
        content: document.content,
      });
    }
  }, [document, form]);

  const updateMutation = useMutation({
    mutationFn: async (values: DocumentFormData) => {
      if (!document) throw new Error("Documento não encontrado.");
      
      const { error } = await supabase
        .from('client_documents')
        .update({
          title: values.title,
          content: values.content,
        })
        .eq('id', document.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Documento atualizado com sucesso!" });
      if(document?.client_id) {
          queryClient.invalidateQueries({ queryKey: ['client_documents', document.client_id] });
      }
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });
  
  const handleClose = () => {
    onOpenChange(false);
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      {/* INÍCIO DA ALTERAÇÃO */}
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
      {/* FIM DA ALTERAÇÃO */}
        <DialogHeader>
          <DialogTitle>Editar Documento Salvo</DialogTitle>
          <DialogDescription>
            Faça as alterações necessárias no título ou no conteúdo do documento.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => updateMutation.mutate(data))} className="flex-1 flex flex-col min-h-0 space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Controller
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="flex-1 flex flex-col min-h-0">
                  <FormLabel>Conteúdo</FormLabel>
                  <FormControl className="flex-grow">
                    <RichTextEditor
                      content={field.value}
                      onChange={field.onChange}
                      editable={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4 border-t">
                <Button type="button" variant="outline" onClick={handleClose}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};