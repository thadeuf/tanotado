
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Video, Edit, Trash2 } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Appointment } from '@/hooks/useAppointments';
import { useIsMobile } from '@/hooks/use-mobile';

interface TimeSlotsProps {
  selectedDate: Date;
  onTimeSelect: (time: string) => void;
  appointments: Appointment[];
}

const TimeSlots: React.FC<TimeSlotsProps> = ({ selectedDate, appointments }) => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

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

  const getAppointmentTypeText = (type?: string) => {
    return type === 'remoto' ? 'Remoto' : 'Presencial';
  };

  const deleteAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      console.log('Deleting appointment:', appointmentId);
      
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) {
        console.error('Error deleting appointment:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Agendamento excluído",
        description: "O agendamento foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (error) => {
      console.error('Error deleting appointment:', error);
      toast({
        title: "Erro ao excluir agendamento",
        description: "Não foi possível excluir o agendamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (appointmentId: string) => {
    // TODO: Implementar edição do agendamento
    toast({
      title: "Editar agendamento",
      description: "Funcionalidade em desenvolvimento",
    });
  };

  const handleDelete = (appointmentId: string) => {
    deleteAppointmentMutation.mutate(appointmentId);
  };

  // Ordenar agendamentos por horário
  const sortedAppointments = [...appointments].sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  return (
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
                className="p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                {isMobile ? (
                  // Layout mobile: cada informação em uma linha
                  <div className="space-y-2">
                    {/* Linha 1: Horário e status */}
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-base">
                        {format(new Date(appointment.start_time), 'HH:mm')} - {format(new Date(appointment.end_time), 'HH:mm')}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={getStatusColor(appointment.status)}
                      >
                        {getStatusText(appointment.status)}
                      </Badge>
                    </div>

                    {/* Linha 2: Nome do cliente com avatar */}
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

                    {/* Linha 3: Tipo de atendimento */}
                    <div className="flex items-center gap-2">
                      {getAppointmentTypeIcon(appointment.appointment_type)}
                      <span className="text-sm text-muted-foreground">
                        {getAppointmentTypeText(appointment.appointment_type)}
                      </span>
                    </div>

                    {/* Linha 4: Título do agendamento */}
                    <p className="text-sm text-muted-foreground">
                      {appointment.title}
                    </p>

                    {/* Linha 5: Ações */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-muted-foreground hover:text-tanotado-blue"
                        onClick={() => handleEdit(appointment.id)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-muted-foreground hover:text-red-600"
                        onClick={() => handleDelete(appointment.id)}
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
                    {/* Avatar do cliente */}
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={appointment.client?.photo_url} 
                        alt={appointment.client?.name}
                      />
                      <AvatarFallback className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple text-white font-medium text-sm">
                        {appointment.client?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CL'}
                      </AvatarFallback>
                    </Avatar>

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
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">
                          {appointment.client?.name || 'Cliente não informado'}
                        </span>
                        <div className="flex items-center gap-1">
                          {getAppointmentTypeIcon(appointment.appointment_type)}
                          <span className="text-xs text-muted-foreground">
                            {getAppointmentTypeText(appointment.appointment_type)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {appointment.title}
                      </p>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-tanotado-blue"
                        onClick={() => handleEdit(appointment.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-600"
                        onClick={() => handleDelete(appointment.id)}
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
  );
};

export default TimeSlots;
