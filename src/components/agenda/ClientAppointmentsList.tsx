// src/components/agenda/ClientAppointmentsList.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/hooks/useClients';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, HelpCircle, FileText, Calendar } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SessionNotesDialog } from '../notes/SessionNotesDialog';
import { Appointment } from '@/hooks/useAppointments';

type AppointmentWithSessionNotes = Appointment & {
  session_notes: { id: string }[];
};

interface ClientAppointmentsListProps {
  client: Client;
  appointmentLabel: string;
}

export const ClientAppointmentsList: React.FC<ClientAppointmentsListProps> = ({ client, appointmentLabel }) => {
  const [selectedAppointmentForNotes, setSelectedAppointmentForNotes] = useState<Appointment | null>(null);

  const { data: appointments = [], isLoading } = useQuery<AppointmentWithSessionNotes[], Error>({
    queryKey: ['client_appointments_full', client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, session_notes(id)')
        .eq('client_id', client.id)
        .order('start_time', { ascending: false });

      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!client.id,
  });

  const handleRowClick = (appointment: Appointment) => {
    if (appointment.appointment_type === 'block') return;
    setSelectedAppointmentForNotes(appointment);
  };

  const getStatusBadge = (status: AppointmentWithSessionNotes['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-400 bg-green-50"><CheckCircle className="h-3 w-3 mr-1" /> Compareceu</Badge>;
      case 'no_show':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Faltou</Badge>;
      case 'scheduled':
          return <Badge variant="outline" className="text-blue-600 border-blue-400 bg-blue-50">Agendado</Badge>;
      case 'confirmed':
          return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600/90"><CheckCircle className="h-3 w-3 mr-1" /> Confirmado</Badge>;
      case 'cancelled':
          return <Badge variant="secondary">Cancelado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const renderLoadingState = () => (
    [...Array(5)].map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-6 w-28" /></TableCell>
        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <>
      <TooltipProvider>
        <Card>
          <CardHeader>
            <CardTitle>Histórico de {appointmentLabel}s</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Anotações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? renderLoadingState() : appointments.length > 0 ? (
                    appointments.map(appointment => (
                      <TableRow 
                        key={appointment.id} 
                        onClick={() => handleRowClick(appointment)}
                        className="cursor-pointer"
                      >
                        <TableCell>{format(new Date(appointment.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</TableCell>
                        <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                        <TableCell>
                          {appointment.session_notes.length > 0 ? (
                              <Tooltip>
                                  <TooltipTrigger asChild>
                                      <span className="flex items-center gap-1.5 text-green-600 cursor-default">
                                          <FileText className="h-4 w-4" />
                                          Sim
                                      </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                      <p>Este agendamento possui anotações de sessão.</p>
                                  </TooltipContent>
                              </Tooltip>
                          ) : (
                               <Tooltip>
                                  <TooltipTrigger asChild>
                                      <span className="flex items-center gap-1.5 text-muted-foreground cursor-default">
                                          <HelpCircle className="h-4 w-4" />
                                          Não
                                      </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                      <p>Nenhuma anotação de sessão para este agendamento.</p>
                                  </TooltipContent>
                              </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-30 mb-2" />
                        Nenhum agendamento encontrado para este cliente.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>

      <SessionNotesDialog
        appointment={selectedAppointmentForNotes}
        isOpen={!!selectedAppointmentForNotes}
        onOpenChange={(isOpen) => !isOpen && setSelectedAppointmentForNotes(null)}
      />
    </>
  );
};