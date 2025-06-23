// src/components/agenda/TimeSlots.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Loader2 } from 'lucide-react';
import { format, isToday, getDay, addMinutes, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useUserSettings } from '@/hooks/useUserSettings';

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
  const { data: settings, isLoading: isLoadingSettings } = useUserSettings();

  const isWorkingDay = (): boolean => {
    if (!settings?.working_hours) return true; // Permite se não houver configs
    
    const workingDays = settings.working_hours as any;
    const dayOfWeek = getDay(selectedDate); // 0: Domingo, 1: Segunda...
    const dayKeyMap: { [key: number]: string } = { 0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday' };
    const dayKey = dayKeyMap[dayOfWeek];

    // Retorna false apenas se a chave existir e for explicitamente false
    return workingDays[dayKey]?.enabled !== false;
  };
  
  const generateTimeSlots = () => {
    const slots = [];
    // Valores padrão
    let startHour = 9, startMinute = 0;
    let endHour = 18, endMinute = 0;
    let interval = 60;

    // Sobrescreve com as configurações do usuário, se existirem
    if (settings && settings.working_hours && settings.appointment_duration) {
      const workingHours = settings.working_hours as any;
      [startHour, startMinute] = (workingHours.start_time || "09:00").split(':').map(Number);
      [endHour, endMinute] = (workingHours.end_time || "18:00").split(':').map(Number);
      interval = settings.appointment_duration;
    }

    const startTime = new Date(selectedDate);
    startTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(selectedDate);
    endTime.setHours(endHour, endMinute, 0, 0);

    let currentTime = startTime;
    // O loop continua enquanto o início do próximo slot for antes ou igual ao horário final
    while (currentTime < endTime) {
      slots.push(format(currentTime, 'HH:mm'));
      currentTime = addMinutes(currentTime, interval);
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
      case 'scheduled': return 'bg-tanotado-blue/10 text-tanotado-blue';
      case 'completed': return 'bg-tanotado-green/10 text-tanotado-green';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'completed': return 'Compareceu';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };
  
  const renderContent = () => {
    if (isLoadingSettings) {
      return (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!isWorkingDay()) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Não há atendimento neste dia.</p>
        </div>
      );
    }
    
    const availableSlots = timeSlots.filter(time => !isSlotBooked(time));

    if (timeSlots.length === 0) {
      return (
         <div className="text-center py-6 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Não há horários disponíveis para este dia</p>
            </div>
      )
    }

    return (
      <div className="space-y-2">
        {timeSlots.map((time) => {
          const isBooked = isSlotBooked(time);
          const appointment = getAppointmentForSlot(time);
          
          if (isBooked && appointment) {
            return (
              <div key={time} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="font-medium text-sm">{time}</div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{appointment.title}</span>
                  </div>
                </div>
                <Badge variant="secondary" className={getStatusColor(appointment.status)}>
                  {getStatusText(appointment.status)}
                </Badge>
              </div>
            );
          }
          
          return (
            <Button key={time} variant="outline" className="w-full justify-start hover:bg-tanotado-purple/10 hover:border-tanotado-purple hover:text-tanotado-purple transition-colors" onClick={() => onTimeSelect(time)}>
              <Clock className="h-4 w-4 mr-2" />
              {time} - Disponível
            </Button>
          );
        })}
        
        {availableSlots.length === 0 && timeSlots.length > 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Todos os horários deste dia estão ocupados.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {isToday(selectedDate) ? 'Hoje' : format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default TimeSlots;