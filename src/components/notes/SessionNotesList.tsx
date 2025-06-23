// src/components/notes/SessionNotesList.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/hooks/useClients';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '../ui/button';
import { Sparkles, NotebookPen, Edit, Trash2, Loader2 } from 'lucide-react';
import { InsightsAIDialog } from './InsightsAIDialog';
import TiptapNodeToText from '@/lib/TiptapNodeToText';
import { SessionNotesDialog } from './SessionNotesDialog';
import { Appointment } from '@/hooks/useAppointments';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type SessionNoteWithAppointment = {
  id: string;
  content: any;
  created_at: string;
  client_id: string;
  appointment_id: string;
  appointments: Appointment | null;
};

interface SessionNotesListProps {
  client: Client;
}

export const SessionNotesList: React.FC<SessionNotesListProps> = ({ client }) => {
  const queryClient = useQueryClient();
  const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<SessionNoteWithAppointment | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<SessionNoteWithAppointment | null>(null);

  const { data: notes = [], isLoading } = useQuery<SessionNoteWithAppointment[], Error>({
    queryKey: ['session_notes_list', client.id],
    queryFn: async () => {
      if (!client) return [];
      const { data, error } = await supabase
        .from('session_notes')
        .select('*, appointments(*)')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SessionNoteWithAppointment[];
    },
    enabled: !!client.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase.from('session_notes').delete().eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Anotação excluída com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['session_notes_list', client.id] });
      setNoteToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      setNoteToDelete(null);
    },
  });

  const handleNoteClick = (note: SessionNoteWithAppointment) => {
    setSelectedNote(note);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Anotações da Sessão</CardTitle>
            <Button className="gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:shadow-lg transition-all" onClick={() => setIsInsightsModalOpen(true)}>
              <Sparkles className="h-4 w-4" />
              IA Insights
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {notes.length > 0 ? (
            <div className="space-y-3">
              {notes.map((note) => {
                const isInsightNote = TiptapNodeToText(note.content).startsWith('IA Insight:');
                const titleText = isInsightNote
                  ? TiptapNodeToText(note.content).split('\n')[0]
                  : `Sessão de ${note.appointments ? format(new Date(note.appointments.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data não disponível'}`;

                return (
                  <div key={note.id} className="w-full text-left border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <NotebookPen className="h-6 w-6 text-tanotado-blue" />
                      <div>
                        <p className="font-semibold">{titleText}</p>
                        <p className="text-sm text-muted-foreground">
                          Criado em {format(new Date(note.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleNoteClick(note)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setNoteToDelete(note)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma anotação de sessão encontrada para este cliente.
            </p>
          )}
        </CardContent>
      </Card>

      <InsightsAIDialog
        isOpen={isInsightsModalOpen}
        onOpenChange={setIsInsightsModalOpen}
        client={client}
        notes={notes}
      />
      <SessionNotesDialog
        note={selectedNote}
        isOpen={!!selectedNote}
        onOpenChange={(isOpen) => !isOpen && setSelectedNote(null)}
      />

      <AlertDialog open={!!noteToDelete} onOpenChange={() => setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta anotação? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => noteToDelete && deleteMutation.mutate(noteToDelete.id)} disabled={deleteMutation.isPending} className="bg-destructive hover:bg-destructive/90">
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};