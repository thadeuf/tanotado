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
import DeleteAppointmentFinancialConfirmDialog from './forms/DeleteAppointmentFinancialConfirmDialog';

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
  const [showDeleteFinancialDialog, setShowDeleteFinancialDialog] = useState(false);
  const [deleteType, setDeleteType] = useState<'single' | 'series'>('single');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-tanotado-blue/10 text-tanotado-blue';
      case 'completed':
        return 'bg-tanotado-green/10 text-tanotado-green';
      case 'confirmed':
        return 'bg-tanotado-green/10 text-tanotado-green';
      case 'no_show':
        return 'bg-red-100 text-red-700';
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
      case 'confirmed':
        return 'Compareceu';
      case 'no_show':
        return 'Faltou';
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
    mutationFn: async ({ 
      appointment, 
      deleteType, 
      deleteFinancial 
    }: { 
      appointment: Appointment; 
      deleteType: 'single' | 'series';
      deleteFinancial: boolean;
    }) => {
      console.log('🔥 MUTATION STARTED!');
      console.log('Input params:', {
        appointmentId: appointment.id,
        recurrenceGroupId: appointment.recurrence_group_id,
        sessionType: appointment.session_type,
        deleteType,
        deleteFinancial
      });

      try {
        if (deleteType === 'series' && appointment.recurrence_group_id) {
          console.log('🔄 DELETING SERIES');
          
          // Get all appointments in the series
          const { data: seriesAppointments, error: queryError } = await supabase
            .from('appointments')
            .select('id, client_id, price')
            .eq('recurrence_group_id', appointment.recurrence_group_id);

          console.log('📋 Series query result:', { seriesAppointments, queryError });

          if (queryError) {
            console.error('❌ Query error:', queryError);
            throw new Error(`Erro ao buscar agendamentos da série: ${queryError.message}`);
          }

          if (!seriesAppointments || seriesAppointments.length === 0) {
            console.log('⚠️ No appointments found, this might be the issue!');
            throw new Error('Nenhum agendamento encontrado na série');
          }

          console.log('✅ Found', seriesAppointments.length, 'appointments in series');

          // Delete financial records if requested
          if (deleteFinancial && seriesAppointments.length > 0) {
            console.log('💰 Deleting financial records...');
            const appointmentIds = seriesAppointments.map(apt => apt.id);
            
            const { data: deletedPayments, error: paymentsError } = await supabase
              .from('payments')
              .delete()
              .in('appointment_id', appointmentIds)
              .select('id');
            
            console.log('💰 Payment deletion result:', { deletedPayments, paymentsError });
            
            if (paymentsError) {
              throw new Error(`Erro ao excluir registros financeiros: ${paymentsError.message}`);
            }
          }

          // Delete appointments
          console.log('🗑️ Deleting appointments...');
          const { data: deletedAppointments, error: deleteError } = await supabase
            .from('appointments')
            .delete()
            .eq('recurrence_group_id', appointment.recurrence_group_id)
            .select('id');

          console.log('🗑️ Appointment deletion result:', { deletedAppointments, deleteError });

          if (deleteError) {
            throw new Error(`Erro ao excluir série de agendamentos: ${deleteError.message}`);
          }

          const deletedCount = deletedAppointments?.length || 0;
          console.log('✅ Successfully deleted', deletedCount, 'appointments');
          
          if (deletedCount === 0) {
            throw new Error('Nenhum agendamento foi excluído da série');
          }

          return deletedCount;
        } else {
          console.log('🔄 DELETING SINGLE APPOINTMENT');
          
          // Delete financial records if requested
          if (deleteFinancial) {
            console.log('💰 Deleting payment records...');
            const { data: deletedPayments, error: paymentsError } = await supabase
              .from('payments')
              .delete()
              .eq('appointment_id', appointment.id)
              .select('id');
            
            console.log('💰 Payment deletion result:', { deletedPayments, paymentsError });
            
            if (paymentsError) {
              throw new Error(`Erro ao excluir registros financeiros: ${paymentsError.message}`);
            }
          }
          
          // Delete the appointment
          const { data: deletedAppointment, error: deleteError } = await supabase
            .from('appointments')
            .delete()
            .eq('id', appointment.id)
            .select('id');

          console.log('🗑️ Single appointment deletion result:', { deletedAppointment, deleteError });

          if (deleteError) {
            throw new Error(`Erro ao excluir agendamento: ${deleteError.message}`);
          }

          if (!deletedAppointment || deletedAppointment.length === 0) {
            throw new Error('Agendamento não foi encontrado ou já foi excluído');
          }

          return 1;
        }
      } catch (error: any) {
        console.error('💥 DELETION ERROR:', error);
        throw error;
      }
    },
    onSuccess: (deletedCount, { deleteType, deleteFinancial }) => {
      console.log('🎉 Deletion successful! Count:', deletedCount);
      
      const message = deleteType === 'series' 
        ? `${deletedCount} agendamentos da série foram excluídos com sucesso${deleteFinancial ? ' junto com os registros financeiros' : ''}.`
        : `Agendamento excluído com sucesso${deleteFinancial ? ' junto com os registros financeiros' : ''}.`;
      
      toast({
        title: "Agendamento(s) excluído(s)",
        description: message,
      });
      
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] });
      
      setShowDeleteRecurrenceDialog(false);
      setShowDeleteFinancialDialog(false);
      setDeletingAppointment(null);
    },
    onError: (error: any) => {
      console.error('💥 Deletion failed with error:', error);
      toast({
        title: "Erro ao excluir agendamento",
        description: error.message || "Não foi possível excluir o agendamento. Tente novamente.",
        variant: "destructive",
      });
      setShowDeleteRecurrenceDialog(false);
      setShowDeleteFinancialDialog(false);
      setDeletingAppointment(null);
    },
  });

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
  };

  const handleDelete = (appointment: Appointment) => {
    console.log('🎯 handleDelete called with appointment:', appointment.id);
    console.log('📋 Appointment details:', {
      sessionType: appointment.session_type,
      recurrenceGroupId: appointment.recurrence_group_id,
      recurrenceType: appointment.recurrence_type
    });
    
    setDeletingAppointment(appointment);
    
    // Check if this is a recurring appointment
    if (appointment.session_type === 'recurring' && appointment.recurrence_group_id) {
      console.log('🔄 This is a recurring appointment, showing recurrence dialog');
      setShowDeleteRecurrenceDialog(true);
    } else {
      console.log('📅 This is a single appointment, going to financial dialog');
      setDeleteType('single');
      setShowDeleteFinancialDialog(true);
    }
  };

  const handleDeleteSingle = () => {
    console.log('🎯 handleDeleteSingle called');
    setDeleteType('single');
    setShowDeleteRecurrenceDialog(false);
    setShowDeleteFinancialDialog(true);
  };

  const handleDeleteSeries = () => {
    console.log('🎯 handleDeleteSeries called');
    setDeleteType('series');
    setShowDeleteRecurrenceDialog(false);
    setShowDeleteFinancialDialog(true);
  };

  const handleDeleteWithoutFinancial = () => {
    console.log('🎯 handleDeleteWithoutFinancial called');
    console.log('📋 Current state:', {
      deletingAppointment: deletingAppointment?.id,
      deleteType,
      mutationIsPending: deleteAppointmentMutation.isPending
    });
    
    if (deletingAppointment) {
      console.log('🚀 Starting mutation without financial deletion');
      deleteAppointmentMutation.mutate({ 
        appointment: deletingAppointment, 
        deleteType,
        deleteFinancial: false
      });
    } else {
      console.error('❌ No appointment to delete!');
    }
  };

  const handleDeleteWithFinancial = () => {
    console.log('🎯 handleDeleteWithFinancial called');
    console.log('📋 Current state:', {
      deletingAppointment: deletingAppointment?.id,
      deleteType,
      mutationIsPending: deleteAppointmentMutation.isPending
    });
    
    if (deletingAppointment) {
      console.log('🚀 Starting mutation with financial deletion');
      deleteAppointmentMutation.mutate({ 
        appointment: deletingAppointment, 
        deleteType,
        deleteFinancial: true
      });
    } else {
      console.error('❌ No appointment to delete!');
    }
  };

  const handleCloseEdit = () => {
    setEditingAppointment(null);
  };

  const handleCloseDeleteDialog = () => {
    console.log('🎯 handleCloseDeleteDialog called');
    setShowDeleteRecurrenceDialog(false);
    setDeletingAppointment(null);
  };

  const handleCloseDeleteFinancialDialog = () => {
    console.log('🎯 handleCloseDeleteFinancialDialog called');
    setShowDeleteFinancialDialog(false);
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

      {/* Delete Financial Confirmation Dialog */}
      <DeleteAppointmentFinancialConfirmDialog
        isOpen={showDeleteFinancialDialog}
        onClose={handleCloseDeleteFinancialDialog}
        onDeleteWithoutFinancial={handleDeleteWithoutFinancial}
        onDeleteWithFinancial={handleDeleteWithFinancial}
        isRecurring={deleteType === 'series'}
        isLoading={deleteAppointmentMutation.isPending}
      />
    </>
  );
};

export default TimeSlots;
