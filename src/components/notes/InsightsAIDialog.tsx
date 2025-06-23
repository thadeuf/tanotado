// src/components/notes/InsightsAIDialog.tsx
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Loader2, Sparkles } from 'lucide-react';
import { Client } from '@/hooks/useClients';
import { addMessageToThread, checkRunStatus, createThread, getAssistantResponse, runAssistant } from '@/lib/openai';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TiptapNodeToText from '@/lib/TiptapNodeToText';

const insightsAssistantId = 'asst_fNZC9kliHsfUSK2EOaYRJrvK';

interface InsightsAIDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  notes: any[];
}

export const InsightsAIDialog: React.FC<InsightsAIDialogProps> = ({ isOpen, onOpenChange, client, notes }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const saveInsightMutation = useMutation({
    mutationFn: async ({ content }: { content: any }) => {
      // 1. Encontrar o agendamento mais recente
      const { data: latestAppointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('id')
        .eq('client_id', client.id)
        .order('start_time', { ascending: false })
        .limit(1)
        .single();
      
      if (appointmentError || !latestAppointment) {
        throw new Error('Não foi possível encontrar um agendamento para associar o insight.');
      }

      // 2. Salvar a anotação
      const { error: noteError } = await supabase.from('session_notes').insert({
        user_id: user?.id,
        client_id: client.id,
        appointment_id: latestAppointment.id,
        content: content,
      });

      if (noteError) throw noteError;
    },
    onSuccess: () => {
      toast({ title: 'Insight de IA salvo!', description: 'A nova anotação foi adicionada à lista.' });
      queryClient.invalidateQueries({ queryKey: ['session_notes_list', client.id] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao salvar insight', description: error.message, variant: 'destructive' });
    }
  });

  const handleGenerateInsights = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Atenção', description: 'Por favor, descreva o que você deseja analisar.' });
      return;
    }
    setIsLoading(true);

    try {
      // 1. Converter todas as anotações para texto plano
      const allNotesText = notes
        .map(note => {
            const date = note.appointments ? format(parseISO(note.appointments.start_time), "'Sessão de' dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : `Anotação de ${format(parseISO(note.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`;
            const contentText = TiptapNodeToText(note.content);
            return `--- ANOTAÇÃO: ${date} ---\n${contentText}\n\n`;
        })
        .join('');
      
      if (!allNotesText) {
          throw new Error("Não há anotações existentes para analisar.");
      }

      // 2. Construir o prompt completo
      const fullPrompt = `**Contexto (Anotações do Cliente ${client.name}):**\n${allNotesText}\n**Tarefa Solicitada pelo Psicólogo:**\n${prompt}`;

      // 3. Interagir com a IA
      const threadId = await createThread();
      await addMessageToThread(threadId, fullPrompt);
      const runId = await runAssistant(threadId, insightsAssistantId);

      const pollStatus = async (): Promise<string> => {
        const status = await checkRunStatus(threadId, runId);
        if (status === 'completed') return getAssistantResponse(threadId);
        if (status === 'failed' || status === 'cancelled' || status === 'expired') throw new Error(`A execução falhou com status: ${status}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return pollStatus();
      };
      
      const aiResponse = await pollStatus();

      // 4. Formatar e salvar o conteúdo
      const insightContent = {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: `IA Insight: ${prompt}` }] },
          ...aiResponse.split('\n').map(paragraph => ({
            type: 'paragraph',
            content: paragraph ? [{ type: 'text', text: paragraph }] : [],
          })),
        ],
      };
      
      await saveInsightMutation.mutateAsync({ content: insightContent });

    } catch (error: any) {
      toast({
        title: 'Erro ao gerar insights',
        description: error.message,
        variant: 'destructive',
      });
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
            Insights com Inteligência Artificial
          </DialogTitle>
          <DialogDescription>
            Descreva o que você precisa ou que tipo de análise a IA deve fazer com base nas anotações deste cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <Label htmlFor="prompt-ia">O que você deseja que a IA faça?</Label>
          <Textarea
            id="prompt-ia"
            placeholder="Ex: Faça um resumo dos principais temas abordados, identifique possíveis padrões de comportamento, ou liste os sintomas de ansiedade mencionados."
            rows={5}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleGenerateInsights} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Gerar Insights
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};