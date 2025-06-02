
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, MapPin, Video } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Client {
  id: string;
  name: string;
  photo_url?: string;
}

interface Appointment {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  client?: Client;
  appointment_type?: 'presencial' | 'remoto';
}

interface TimeSlotsProps {
  selectedDate: Date;
  onTimeSelect: (time: string) => void;
  appointments: Appointment[];
}

const TimeSlots: React.FC<TimeSlotsProps> = ({ selectedDate, appointments }) => {
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
                className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
              >
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
