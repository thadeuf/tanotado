// src/components/notes/SessionNotesDialog.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { type Editor } from '@tiptap/react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment } from '@/hooks/useAppointments';
import { toast } from '@/hooks/use-toast';
import { addMessageToThread, checkRunStatus, createThread, getAssistantResponse, runAssistant, transcribeAudio } from '@/lib/openai';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Form, FormControl, FormItem, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Loader2, Save, User, Mic, Sparkles } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

import { InsightsAIDialog } from './InsightsAIDialog';
import { Client } from '@/hooks/useClients';

type SessionNote = {
  id: string;
  content: any;
  created_at: string;
  client_id: string;
  appointment_id: string;
  appointments: Appointment | null;
};

const noteSchema = z.object({
  content: z.any().optional(),
});
type NoteFormData = z.infer<typeof noteSchema>;

interface SessionNotesDialogProps {
  note?: SessionNote | null;
  appointment?: Appointment | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SessionNotesDialog: React.FC<SessionNotesDialogProps> = ({ note, appointment, isOpen, onOpenChange }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const editorRef = useRef<Editor | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);

  const { data: fetchedNote, isLoading: isLoadingNote } = useQuery({
    queryKey: ['session_note', appointment?.id],
    queryFn: async () => {
      if (!appointment) return null;
      const { data, error } = await supabase
        .from('session_notes')
        .select('*, appointments(*)')
        .eq('appointment_id', appointment.id)
        .maybeSingle();
      if (error) throw error;
      return data as SessionNote;
    },
    enabled: !!appointment && !note && isOpen,
  });

  const effectiveNote = note || fetchedNote;
  const isLoading = isLoadingNote && !note;
  const targetAppointment = note?.appointments || appointment;
  
    const { data: allNotes = [] } = useQuery<SessionNote[]>({
    queryKey: ['session_notes_list', targetAppointment?.client_id],
    queryFn: async () => {
      if (!targetAppointment?.client_id) return [];
      const { data, error } = await supabase
        .from('session_notes')
        .select('*, appointments(*)')
        .eq('client_id', targetAppointment.client_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SessionNote[];
    },
    enabled: !!targetAppointment?.client_id && isInsightsModalOpen,
  });

  const { data: clientData } = useQuery<Client | null>({
    queryKey: ['client_details_for_insights', targetAppointment?.client_id],
    queryFn: async () => {
        if (!targetAppointment?.client_id) return null;
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', targetAppointment.client_id)
            .single();
        if (error) throw new Error(error.message);
        return data;
    },
    enabled: !!targetAppointment?.client_id && isInsightsModalOpen,
  });


  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: { content: '' },
  });

  useEffect(() => {
    if (effectiveNote) {
      form.reset({ content: effectiveNote.content || '' });
    } else {
      form.reset({ content: '' });
    }
  }, [effectiveNote, form]);

  const upsertMutation = useMutation({
    mutationFn: async (data: NoteFormData) => {
      if (!user || !targetAppointment) throw new Error("Dados insuficientes para salvar.");
      
      const payload = {
        id: effectiveNote?.id,
        user_id: user.id,
        client_id: targetAppointment.client_id,
        appointment_id: targetAppointment.id,
        content: data.content,
      };
      const { error } = await supabase.from('session_notes').upsert(payload, { onConflict: 'appointment_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Anotação salva com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['session_notes_list', targetAppointment?.client_id] });
      queryClient.invalidateQueries({ queryKey: ['session_note', targetAppointment?.id] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao salvar anotação", description: error.message, variant: "destructive" });
    },
  });

  const handleStartRecording = () => { /* ... */ };
  const handleStopRecording = () => { /* ... */ };
  const handleGetInsights = () => {
    setIsInsightsModalOpen(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Anotações da Sessão</DialogTitle>
            {targetAppointment && (
              <DialogDescription className="flex items-center gap-4 pt-1">
                <span className="flex items-center gap-2"><User className="h-4 w-4" />{targetAppointment.title}</span>
                <span className="font-mono text-xs">{format(new Date(targetAppointment.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </DialogDescription>
            )}
          </DialogHeader>
          
          <div className="flex-grow min-h-0">
            {isLoading ? (
              <div className="space-y-2 p-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => upsertMutation.mutate(data))} className="h-full flex flex-col">
                  <Controller
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem className="flex-grow min-h-0">
                        <FormControl className="h-full">
                          <RichTextEditor
                            content={field.value}
                            onChange={field.onChange}
                            onEditorInstance={(editor: Editor | null) => { editorRef.current = editor; }}
                            isRecording={isRecording}
                            isTranscribing={isTranscribing}
                            onStartRecording={handleStartRecording}
                            onStopRecording={handleStopRecording}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex flex-col sm:flex-row gap-2 pt-4 mt-4 border-t">
                      <Button type="button" variant="outline" className="w-full gap-2" onClick={isRecording ? handleStopRecording : handleStartRecording} disabled={isTranscribing}>
                          {isTranscribing ? <><Loader2 className="h-4 w-4 animate-spin"/> Processando...</> : isRecording ? <> <Loader2 className="h-4 w-4 animate-spin text-red-500"/> Parar Gravação</> : <><Mic className="h-4 w-4"/> Transcrever com IA</>}
                      </Button>
                      <Button type="button" className="w-full gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:shadow-lg transition-all" onClick={handleGetInsights} disabled={isAnalyzing}>
                          {isAnalyzing ? <><Loader2 className="h-4 w-4 animate-spin"/> Analisando...</> : <><Sparkles className="h-4 w-4"/> IA Insights</>}
                      </Button>
                  </div>
                  <DialogFooter className="pt-4 mt-4 border-t">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit" disabled={upsertMutation.isPending}>
                      {upsertMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Salvar Anotações
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {clientData && (
        <InsightsAIDialog
          isOpen={isInsightsModalOpen}
          onOpenChange={setIsInsightsModalOpen}
          client={clientData}
          notes={allNotes}
        />
      )}
    </>
  );
};