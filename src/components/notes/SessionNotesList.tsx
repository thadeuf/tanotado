// src/components/notes/SessionNotesList.tsx

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Supabase & Types
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Appointment } from '@/hooks/useAppointments';
import { Client } from '@/hooks/useClients';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { NotebookPen, MessageSquare, Edit } from 'lucide-react';

// Shared Dialog
import { SessionNotesDialog } from './SessionNotesDialog';

// Definindo o tipo para a anotação com o agendamento aninhado
type SessionNoteWithAppointment = Database['public']['Tables']['session_notes']['Row'] & {
  appointments: Appointment | null;
};

interface SessionNotesListProps {
  client: Client;
}

export const SessionNotesList: React.FC<SessionNotesListProps> = ({ client }) => {
  const [selectedAppointmentForNotes, setSelectedAppointmentForNotes] = useState<Appointment | null>(null);

  // Busca todas as anotações do cliente, trazendo junto os dados do agendamento relacionado
  const { data: notes, isLoading } = useQuery<SessionNoteWithAppointment[], Error>({
    queryKey: ['session_notes_list', client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_notes')
        .select(`
          *,
          appointments (
            *
          )
        `)
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as SessionNoteWithAppointment[]) || [];
    },
    enabled: !!client.id,
  });
  
  const handleNoteClick = (appointment: Appointment | null) => {
    if (appointment) {
      setSelectedAppointmentForNotes(appointment);
    }
  };

  const renderLoadingState = () => (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-16 text-muted-foreground">
      <MessageSquare className="mx-auto h-16 w-16 opacity-30" />
      <h3 className="mt-4 text-xl font-semibold">Nenhuma anotação encontrada</h3>
      <p className="mt-2 text-sm">
        Ainda não há anotações de sessão para {client.name}.
      </p>
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Anotações da Sessão</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? renderLoadingState() : (
            <div className="space-y-3">
              {notes && notes.length > 0 ? (
                notes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => handleNoteClick(note.appointments)}
                    className="w-full text-left border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <NotebookPen className="h-6 w-6 text-tanotado-blue" />
                      <div>
                        <p className="font-semibold">
                          Sessão de {note.appointments ? format(new Date(note.appointments.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data não encontrada'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Anotação criada em {format(new Date(note.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                        <Edit className="h-4 w-4" />
                        Ver / Editar
                    </div>
                  </button>
                ))
              ) : (
                renderEmptyState()
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <SessionNotesDialog
        appointment={selectedAppointmentForNotes}
        isOpen={!!selectedAppointmentForNotes}
        onOpenChange={(isOpen) => !isOpen && setSelectedAppointmentForNotes(null)}
      />
    </>
  );
};