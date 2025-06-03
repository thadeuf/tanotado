
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Video, Edit, Trash2, User } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Appointment } from '@/hooks/useAppointments';
import { useIsMobile } from '@/hooks/use-mobile';
import EditAppointmentForm from './EditAppointmentForm';
import DeleteRecurrenceConfirmDialog from './forms/DeleteRecurrenceConfirmDialog';

interface TimeSlotsProps {
  selectedDate: Date;
  onTimeSelect: (time: string) => void;
  appointments: Appointment[];
}

const TimeSlots: React.FC<TimeSlotsProps> = ({ selectedDate, appointments }) => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);
  const [showDeleteRecurrenceDialog, setShowDeleteRecurrenceDialog] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-tanotado-blue/10 text-tanotado-blue';
      case 'completed':
        return 'bg-tanotado-green/10 text-tanotado-green';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Agendado';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getAppointmentTypeIcon = (type?: string) => {
    if (type === 'remoto') {
      return <Video className="h-4 w-4 text-tanotado-blue" />;
    }
    return <MapPin className="h-4 w-4 text-tanotado-green" />;
  };

  const deleteAppointmentMutation = useMutation({
    mutationFn: async ({ appointment, deleteType }: { appointment: Appointment; deleteType: 'single' | 'series' }) => {
      console.log('=== DELETION DEBUG ===');
      console.log('Deleting appointment:', appointment.id, 'Type:', deleteType);
      console.log('Appointment object:', appointment);
      
      if (deleteType === 'series' && appointment.recurrence_group_id) {
        console.log('Deleting series with recurrence_group_id:', appointment.recurrence_group_id);
        
        // First, let's check what appointments exist with this recurrence_group_id
        const { data: seriesAppointments, error: queryError } = await supabase
          .from('appointments')
          .select('*')
          .eq('recurrence_group_id', appointment.recurrence_group_id);

        console.log('Found appointments in series:', seriesAppointments);
        console.log('Query error (if any):', queryError);

        if (queryError) {
          console.error('Error querying series appointments:', queryError);
          throw queryError;
        }

        // Delete all appointments in the series
        const { data: deletedData, error } = await supabase
          .from('appointments')
          .delete()
          .eq('recurrence_group_id', appointment.recurrence_group_id)
          .select();

        console.log('Deletion result:', deletedData);
        console.log('Deletion error (if any):', error);

        if (error) {
          console.error('Error deleting appointment series:', error);
          throw error;
        }

        console.log('Successfully deleted', deletedData?.length || 0, 'appointments from series');
      } else {
        console.log('Deleting single appointment with ID:', appointment.id);
        
        // Delete only the single appointment
        const { data: deletedData, error } = await supabase
          .from('appointments')
          .delete()
          .eq('id', appointment.id)
          .select();

        console.log('Single deletion result:', deletedData);

        if (error) {
          console.error('Error deleting single appointment:', error);
          throw error;
        }
      }
    },
    onSuccess: (_, { deleteType }) => {
      const message = deleteType === 'series' 
        ? "Toda a série de agendamentos foi excluída com sucesso."
        : "Agendamento excluído com sucesso.";
      
      toast({
        title: "Agendamento(s) excluído(s)",
        description: message,
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setShowDeleteRecurrenceDialog(false);
      setDeletingAppointment(null);
    },
    onError: (error) => {
      console.error('Error deleting appointment:', error);
      toast({
        title: "Erro ao excluir agendamento",
        description: "Não foi possível excluir o agendamento. Tente novamente.",
        variant: "destructive",
      });
      setShowDeleteRecurrenceDialog(false);
      setDeletingAppointment(null);
    },
  });

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
  };

  const handleDelete = (appointment: Appointment) => {
    // Check if this is a recurring appointment
    if (appointment.session_type === 'recurring' && appointment.recurrence_group_id) {
      setDeletingAppointment(appointment);
      setShowDeleteRecurrenceDialog(true);
    } else {
      // For non-recurring appointments, delete directly
      deleteAppointmentMutation.mutate({ 
        appointment, 
        deleteType: 'single' 
      });
    }
  };

  const handleDeleteSingle = () => {
    if (deletingAppointment) {
      deleteAppointmentMutation.mutate({ 
        appointment: deletingAppointment, 
        deleteType: 'single' 
      });
    }
  };

  const handleDeleteSeries = () => {
    if (deletingAppointment) {
      deleteAppointmentMutation.mutate({ 
        appointment: deletingAppointment, 
        deleteType: 'series' 
      });
    }
  };

  const handleCloseEdit = () => {
    setEditingAppointment(null);
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteRecurrenceDialog(false);
    setDeletingAppointment(null);
  };

  // Ordenar agendamentos por horário
  const sortedAppointments = [...appointments].sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {isToday(selectedDate) ? 'Hoje' : format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Agendamentos existentes */}
          {sortedAppointments.length > 0 ? (
            <div className="space-y-3">
              {sortedAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors relative"
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: appointment.color || '#8B5CF6'
                  }}
                >
                  {isMobile ? (
                    // Layout mobile: cada informação em uma linha
                    <div className="space-y-2">
                      {/* Linha 1: Horário e status */}
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-base">
                          {format(new Date(appointment.start_time), 'HH:mm')} - {format(new Date(appointment.end_time), 'HH:mm')}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className={getStatusColor(appointment.status)}
                          >
                            {getStatusText(appointment.status)}
                          </Badge>
                          {appointment.session_type === 'recurring' && (
                            <Badge variant="outline" className="text-xs">
                              Recorrente
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Linha 2: Nome do cliente com avatar (se não for compromisso pessoal) */}
                      {appointment.session_type !== 'personal' && (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={appointment.client?.photo_url} 
                              alt={appointment.client?.name}
                            />
                            <AvatarFallback className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple text-white font-medium text-xs">
                              {appointment.client?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CL'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-foreground">
                            {appointment.client?.name || 'Cliente não informado'}
                          </span>
                        </div>
                      )}

                      {/* Linha 3: Tipo de atendimento (apenas para agendamentos normais) */}
                      {appointment.session_type !== 'personal' && (
                        <div className="flex items-center gap-2">
                          {getAppointmentTypeIcon(appointment.appointment_type)}
                        </div>
                      )}

                      {/* Linha 4: Título (apenas para compromissos pessoais) ou descrição */}
                      {appointment.session_type === 'personal' ? (
                        <p className="text-sm font-medium text-foreground">
                          {appointment.title || 'Compromisso Pessoal'}
                        </p>
                      ) : (
                        appointment.description && (
                          <p className="text-sm text-muted-foreground">
                            {appointment.description}
                          </p>
                        )
                      )}

                      {/* Linha 5: Ações */}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-muted-foreground hover:text-tanotado-blue"
                          onClick={() => handleEdit(appointment)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-muted-foreground hover:text-red-600"
                          onClick={() => handleDelete(appointment)}
                          disabled={deleteAppointmentMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Layout desktop: layout horizontal compacto
                    <div className="flex items-center gap-3">
                      {/* Avatar do cliente (se não for compromisso pessoal) */}
                      {appointment.session_type !== 'personal' ? (
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={appointment.client?.photo_url} 
                            alt={appointment.client?.name}
                          />
                          <AvatarFallback className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple text-white font-medium text-sm">
                            {appointment.client?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CL'}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-purple-600" />
                        </div>
                      )}

                      {/* Informações do agendamento */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {format(new Date(appointment.start_time), 'HH:mm')} - {format(new Date(appointment.end_time), 'HH:mm')}
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={getStatusColor(appointment.status)}
                          >
                            {getStatusText(appointment.status)}
                          </Badge>
                          {appointment.session_type === 'recurring' && (
                            <Badge variant="outline" className="text-xs">
                              Recorrente
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {appointment.session_type === 'personal' 
                              ? appointment.title || 'Compromisso Pessoal'
                              : appointment.client?.name || 'Cliente não informado'
                            }
                          </span>
                          {appointment.session_type !== 'personal' && (
                            <div className="flex items-center gap-1">
                              {getAppointmentTypeIcon(appointment.appointment_type)}
                            </div>
                          )}
                        </div>
                        {appointment.session_type !== 'personal' && appointment.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {appointment.description}
                          </p>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-tanotado-blue"
                          onClick={() => handleEdit(appointment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-600"
                          onClick={() => handleDelete(appointment)}
                          disabled={deleteAppointmentMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum agendamento para este dia</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Appointment Modal */}
      {editingAppointment && (
        <EditAppointmentForm
          appointment={editingAppointment}
          onClose={handleCloseEdit}
        />
      )}

      {/* Delete Recurrence Confirmation Dialog */}
      <DeleteRecurrenceConfirmDialog
        isOpen={showDeleteRecurrenceDialog}
        onClose={handleCloseDeleteDialog}
        onDeleteSingle={handleDeleteSingle}
        onDeleteSeries={handleDeleteSeries}
        isLoading={deleteAppointmentMutation.isPending}
      />
    </>
  );
};

export default TimeSlots;
