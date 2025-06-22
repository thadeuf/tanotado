import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { addMessageToThread, checkRunStatus, createThread, getAssistantResponse, runAssistant } from '@/lib/openai';
import { Loader2, Sparkles, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const docAssistantId = import.meta.env.VITE_OPENAI_DOC_ASSISTANT_ID;

const suggestedDocuments = [
  'Prontuário Psicológico', 'Relatório Psicológico', 'Laudo Psicológico',
  'Parecer Psicológico', 'Atestado Psicológico', 'Declaração',
  'Encaminhamento', 'Ficha de Dados', 'Contrato de Atendimento Psicológico',
  'Informe para Reembolso de Convênio'
];

interface CreateWithAIDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (title: string, content: any) => void;
}

export const CreateWithAIDialog: React.FC<CreateWithAIDialogProps> = ({ isOpen, onOpenChange, onSuccess }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Atenção', description: 'Por favor, descreva o documento que você deseja criar.', variant: 'default' });
      return;
    }
    if (!docAssistantId) {
      toast({ title: 'Erro de Configuração', description: 'O ID do assistente de documentos não foi encontrado.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const threadId = await createThread();
      await addMessageToThread(threadId, prompt);
      const runId = await runAssistant(threadId, docAssistantId);

      const pollStatus = async (): Promise<string> => {
        const status = await checkRunStatus(threadId, runId);
        if (status === 'completed') {
          return getAssistantResponse(threadId);
        } else if (status === 'failed' || status === 'cancelled' || status === 'expired') {
          throw new Error(`A execução do assistente falhou com status: ${status}`);
        } else {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return pollStatus();
        }
      };
      
      const responseText = await pollStatus();
      let title: string;
      let content: any;

      // --- INÍCIO DA CORREÇÃO ---
      // Tentamos interpretar a resposta como JSON. Se falhar, tratamos como Markdown.
      try {
        const responseJson = JSON.parse(responseText);
        title = responseJson.title;
        content = responseJson.content;
      } catch (e) {
        console.warn("A resposta da IA não é um JSON válido. Tratando como Markdown.", e);

        const lines = responseText.split('\n').filter(line => line.trim() !== '');
        
        // Pega a primeira linha como título, removendo os '###'
        title = lines[0]?.replace(/#/g, '').trim() || 'Documento Gerado por IA';
        
        // Pega o resto do texto como corpo do documento
        const bodyText = lines.slice(1).join('\n');

        // Converte o texto simples em uma estrutura JSON que o editor TipTap entende
        content = {
            type: 'doc',
            content: bodyText.split('\n').map(paragraph => ({
                type: 'paragraph',
                content: paragraph ? [{ type: 'text', text: paragraph }] : [],
            })),
        };
      }
      // --- FIM DA CORREÇÃO ---
      
      toast({ title: "Documento gerado!", description: "O modelo foi criado com sucesso e está pronto para edição." });
      onSuccess(title, content);

    } catch (error: any) {
      console.error("Erro ao gerar documento com IA:", error);
      toast({ title: 'Erro ao gerar documento', description: 'Não foi possível se comunicar com a IA. Tente novamente.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-tanotado-purple" />
            Criar Modelo de Documento com IA
          </DialogTitle>
          <DialogDescription>
            Descreva o tipo de documento que você precisa, e a nossa IA irá gerar uma estrutura inicial para você.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="ai-prompt" className="font-medium flex items-center gap-2">
              Qual documento você deseja criar?
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs" side="right">
                    <p className="font-bold mb-2">Sugestões de Documentos:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {suggestedDocuments.map(doc => <li key={doc}>{doc}</li>)}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </label>
            <Input 
              id="ai-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Contrato de atendimento psicológico"
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Gerar Documento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};