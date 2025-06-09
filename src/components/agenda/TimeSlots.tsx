
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, User } from 'lucide-react';
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
  // Gerar horários disponíveis (9h às 18h, intervalos de 1 hora)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(time);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const isSlotBooked = (time: string) => {
    return appointments.some(appointment => {
      const appointmentTime = format(new Date(appointment.start_time), 'HH:mm');
      return appointmentTime === time;
    });
  };

  const getAppointmentForSlot = (time: string) => {
    return appointments.find(appointment => {
      const appointmentTime = format(new Date(appointment.start_time), 'HH:mm');
      return appointmentTime === time;
    });
  };

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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {isToday(selectedDate) ? 'Hoje' : format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {timeSlots.map((time) => {
            const isBooked = isSlotBooked(time);
            const appointment = getAppointmentForSlot(time);
            
            if (isBooked && appointment) {
              return (
                <div
                  key={time}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="font-medium text-sm">{time}</div>
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
              );
            }
            
            return (
              <Button
                key={time}
                variant="outline"
                className="w-full justify-start hover:bg-tanotado-purple/10 hover:border-tanotado-purple hover:text-tanotado-purple transition-colors"
                onClick={() => onTimeSelect(time)}
              >
                <Clock className="h-4 w-4 mr-2" />
                {time} - Disponível
              </Button>
            );
          })}
          
          {timeSlots.every(time => isSlotBooked(time)) && (
            <div className="text-center py-6 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Não há horários disponíveis para este dia</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeSlots;
