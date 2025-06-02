
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Plus } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface TimeSlotsProps {
  selectedDate: Date;
  onTimeSelect: (time: string) => void;
  appointments: Appointment[];
}

const TimeSlots: React.FC<TimeSlotsProps> = ({ selectedDate, onTimeSelect, appointments }) => {
  // Gerar horários base (9h às 18h, intervalos de 1 hora) para botões de agendamento rápido
  const generateQuickTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(time);
    }
    return slots;
  };

  const quickTimeSlots = generateQuickTimeSlots();

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
        {sortedAppointments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Agendamentos</h4>
            {sortedAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className="font-medium text-sm">
                    {format(new Date(appointment.start_time), 'HH:mm')} - {format(new Date(appointment.end_time), 'HH:mm')}
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{appointment.title}</span>
                  </div>
                </div>
                <Badge 
                  variant="secondary" 
                  className={getStatusColor(appointment.status)}
                >
                  {getStatusText(appointment.status)}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Horários de agendamento rápido */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Agendamento Rápido</h4>
          <div className="grid grid-cols-2 gap-2">
            {quickTimeSlots.map((time) => (
              <Button
                key={time}
                variant="outline"
                size="sm"
                className="justify-start hover:bg-tanotado-purple/10 hover:border-tanotado-purple hover:text-tanotado-purple transition-colors"
                onClick={() => onTimeSelect(time)}
              >
                <Plus className="h-3 w-3 mr-2" />
                {time}
              </Button>
            ))}
          </div>
        </div>

        {/* Botão para horário personalizado */}
        <Button
          variant="outline"
          className="w-full justify-center hover:bg-tanotado-purple/10 hover:border-tanotado-purple hover:text-tanotado-purple transition-colors"
          onClick={() => onTimeSelect('09:00')}
        >
          <Clock className="h-4 w-4 mr-2" />
          Horário Personalizado
        </Button>

        {appointments.length === 0 && (
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
