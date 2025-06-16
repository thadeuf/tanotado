// src/components/documents/GenerateDocumentDialog.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { renderTemplate } from '@/lib/templateUtils';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Printer, FileText, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Client = { id: string; name: string; [key: string]: any; };
type User = { id: string; name: string; [key: string]: any; };
type DocumentTemplate = { id: string; title: string; content?: any; };

interface GenerateDocumentDialogProps {
  client: Client | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const useDocumentTemplates = () => {
  const { user } = useAuth();
  return useQuery<DocumentTemplate[], Error>({
    queryKey: ['document_templates_list', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('document_templates')
        .select('id, title')
        .eq('user_id', user.id)
        .order('title', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const GenerateDocumentDialog: React.FC<GenerateDocumentDialogProps> = ({ client, isOpen, onOpenChange }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: templates = [], isLoading: isLoadingTemplates } = useDocumentTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState<any>(null);

  const { data: selectedTemplate, isLoading: isLoadingTemplateContent } = useQuery({
    queryKey: ['document_template_content', selectedTemplateId],
    queryFn: async () => {
      if (!selectedTemplateId) return null;
      const { data, error } = await supabase
        .from('document_templates')
        .select('content')
        .eq('id', selectedTemplateId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTemplateId,
  });

  const renderedContent = useMemo(() => {
    if (selectedTemplate?.content && client && user) {
      return renderTemplate(selectedTemplate.content, client, user);
    }
    return null;
  }, [selectedTemplate, client, user]);

  useEffect(() => {
    if (renderedContent) {
      setEditorContent(renderedContent);
    }
  }, [renderedContent]);

  const saveMutation = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: any }) => {
      if (!client || !user || !selectedTemplateId) throw new Error("Dados insuficientes para salvar.");
      
      const { error } = await supabase.from('client_documents').insert({
        client_id: client.id,
        user_id: user.id,
        template_id: selectedTemplateId,
        title: title,
        content: content,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Documento salvo com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['client_documents', client?.id] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao salvar documento", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!isOpen) {
        setSelectedTemplateId(null);
        setEditorContent(null);
    }
  }, [isOpen]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const editorElement = document.getElementById('printable-document-generator');
      if (editorElement) {
        printWindow.document.write('<html><head><title>Imprimir Documento</title>');
        printWindow.document.write('<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">');
        printWindow.document.write('<style>body { padding: 2rem; } .prose { max-width: none; }</style>');
        printWindow.document.write('</head><body onload="window.print();window.close()">');
        printWindow.document.write(editorElement.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
      }
    }
  };

  const handleSave = () => {
    if (!editorContent || !selectedTemplateId) return;
    const templateTitle = templates.find(t => t.id === selectedTemplateId)?.title || 'Documento';
    const documentTitle = `${templateTitle} - ${client?.name}`;
    saveMutation.mutate({ title: documentTitle, content: editorContent });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* INÍCIO DA ALTERAÇÃO */}
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
      {/* FIM DA ALTERAÇÃO */}
        <DialogHeader>
          <DialogTitle>Gerar Documento para {client?.name}</DialogTitle>
          <DialogDescription>
            Selecione um modelo, edite se necessário e então salve ou imprima.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="md:col-span-2">
                <Label htmlFor="template-select">Selecione o Modelo</Label>
                <Select
                    value={selectedTemplateId || ''}
                    onValueChange={setSelectedTemplateId}
                    disabled={isLoadingTemplates}
                >
                    <SelectTrigger id="template-select">
                        <SelectValue placeholder="Escolha um modelo..." />
                    </SelectTrigger>
                    <SelectContent>
                        {templates.map(template => (
                            <SelectItem key={template.id} value={template.id}>
                                {template.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="md:col-span-2 self-end flex gap-2">
                <Button onClick={handleSave} disabled={!editorContent || saveMutation.isPending} className="w-full">
                    {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} 
                    Salvar
                </Button>
                <Button onClick={handlePrint} disabled={!editorContent} variant="outline" className="w-full">
                    <Printer className="h-4 w-4 mr-2" /> Imprimir
                </Button>
            </div>
        </div>

        <div className="flex-1 overflow-auto mt-4 border rounded-lg" id="printable-document-generator">
          {isLoadingTemplateContent ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : editorContent ? (
            <RichTextEditor 
                content={editorContent} 
                onChange={setEditorContent} 
                editable={true} 
            />
          ) : (
             <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <FileText className="h-12 w-12 mb-4" />
                <p>Selecione um modelo para começar.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};