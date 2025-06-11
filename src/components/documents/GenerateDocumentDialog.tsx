// src/components/documents/GenerateDocumentDialog.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { renderTemplate } from '@/lib/templateUtils';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Printer, FileText } from 'lucide-react';

// Tipos (adapte conforme seu projeto)
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
  const { data: templates = [], isLoading: isLoadingTemplates } = useDocumentTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

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
  
  // Reseta o estado quando o diálogo é fechado
  useEffect(() => {
    if (!isOpen) {
        setSelectedTemplateId(null);
    }
  }, [isOpen]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const editorElement = document.getElementById('printable-document');
      if (editorElement) {
        printWindow.document.write('<html><head><title>Imprimir Documento</title>');
        // Adiciona estilos do Tailwind Prose para uma impressão bonita
        printWindow.document.write('<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">');
        printWindow.document.write('<style>body { padding: 2rem; } .prose { max-width: none; }</style>');
        printWindow.document.write('</head><body onload="window.print();window.close()">');
        printWindow.document.write(editorElement.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerar Documento para {client?.name}</DialogTitle>
          <DialogDescription>
            Selecione um modelo para preencher com os dados do cliente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="md:col-span-3">
                <Label htmlFor="template-select">Selecione o Modelo</Label>
                <Select
                    value={selectedTemplateId || ''}
                    onValueChange={setSelectedTemplateId}
                    disabled={isLoadingTemplates}
                >
                    <SelectTrigger id="template-select">
                        <SelectValue placeholder="Escolha um modelo de documento..." />
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
            <div className="md:col-span-1 self-end">
                <Button onClick={handlePrint} disabled={!renderedContent} className="w-full">
                    <Printer className="h-4 w-4 mr-2" /> Imprimir
                </Button>
            </div>
        </div>

        <div className="flex-1 overflow-auto mt-4 border rounded-lg" id="printable-document">
          {isLoadingTemplateContent ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : renderedContent ? (
            <RichTextEditor content={renderedContent} editable={false} />
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