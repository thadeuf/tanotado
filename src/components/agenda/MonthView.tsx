import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Appointment } from '@/hooks/useAppointments';
import { cn } from '@/lib/utils';
import EditAppointmentForm from './EditAppointmentForm';

interface MonthViewProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  onTimeSelect: (time: string) => void;
  getDayAppointments: (date: Date) => Appointment[];
}

const MonthView: React.FC<MonthViewProps> = ({
  selectedDate,
  setSelectedDate,
  onTimeSelect,
  getDayAppointments,
}) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const dateFormat = "d";
  const headerFormat = "MMMM yyyy";
  const dayFormat = "EEEEE";

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Pendente';
      case 'confirmed': return 'Compareceu';
      case 'no_show': return 'Faltou';
      case 'cancelled': return 'Suspensa';
      case 'completed': return 'Concluído';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'no_show': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAppointmentClick = (appointment: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAppointment(appointment);
    setShowEditForm(true);
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    onTimeSelect('09:00');
  };

  const handleAddAppointment = (day: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(day);
    onTimeSelect('09:00');
  };

  const header = () => {
    return (
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold capitalize">
          {format(currentMonth, headerFormat, { locale: ptBR })}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const daysOfWeek = () => {
    const days = [];
    let startDate = startOfWeek(new Date(), { weekStartsOn: 0 });

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center text-sm font-medium text-muted-foreground p-2">
          {format(addDays(startDate, i), dayFormat, { locale: ptBR }).toUpperCase()}
        </div>
      );
    }
    return <div className="grid grid-cols-7 border-b">{days}</div>;
  };

  const cells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const dayAppointments = getDayAppointments(day);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = isSameDay(day, selectedDate);
        const isTodayDate = isToday(day);

        days.push(
          <div
            key={day.toString()}
            className={cn(
              "min-h-24 p-1 border-r border-b cursor-pointer transition-colors group",
              !isCurrentMonth && "bg-muted/30 text-muted-foreground",
              isSelected && "bg-primary/10",
              isTodayDate && "bg-accent",
              "hover:bg-muted/50"
            )}
            onClick={() => handleDayClick(cloneDay)}
          >
            <div className="flex justify-between items-start mb-1">
              <span className={cn(
                "text-sm font-medium",
                !isCurrentMonth && "text-muted-foreground",
                isTodayDate && "text-primary font-bold"
              )}>
                {formattedDate}
              </span>
              {isCurrentMonth && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-primary/20"
                  onClick={(e) => handleAddAppointment(cloneDay, e)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            <div className="space-y-1">
              {dayAppointments.slice(0, 3).map((appointment) => (
                <div
                  key={appointment.id}
                  className={cn(
                    "text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity",
                    getStatusColor(appointment.status)
                  )}
                  style={{
                    backgroundColor: appointment.color ? `${appointment.color}20` : undefined,
                    borderLeft: appointment.color ? `3px solid ${appointment.color}` : undefined,
                  }}
                  onClick={(e) => handleAppointmentClick(appointment, e)}
                >
                  {format(new Date(appointment.start_time), 'HH:mm')} - {appointment.client?.name || 'Cliente não encontrado'}
                </div>
              ))}
              {dayAppointments.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{dayAppointments.length - 3} mais
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Calendário Mensal
            {header()}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border rounded-lg overflow-hidden">
            {daysOfWeek()}
            {cells()}
          </div>
        </CardContent>
      </Card>

      {/* Edit Appointment Modal */}
      {showEditForm && selectedAppointment && (
        <EditAppointmentForm
          appointment={selectedAppointment}
          onClose={() => {
            setShowEditForm(false);
            setSelectedAppointment(null);
          }}
        />
      )}
    </>
  );
};

export default MonthView;
