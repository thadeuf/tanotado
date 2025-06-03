
import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { addDays, startOfWeek, isSameDay, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DateSelector from '@/components/agenda/DateSelector';
import AgendaHeader from '@/components/agenda/AgendaHeader';
import WeekView from '@/components/agenda/WeekView';
import MonthView from '@/components/agenda/MonthView';
import AppointmentForm from '@/components/agenda/AppointmentForm';
import { useAppointments } from '@/hooks/useAppointments';
import { useIsMobile } from '@/hooks/use-mobile';

const Agenda: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [filterStatus, setFilterStatus] = useState('all');
  const isMobile = useIsMobile();

  const { data: appointments = [], isLoading, error } = useAppointments();

  const handleTimeSelect = useCallback((time: string) => {
    setSelectedTime(time);
    setShowForm(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setShowForm(false);
    setSelectedTime('');
  }, []);

  const getWeekDays = useCallback(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  const getDayAppointments = useCallback((date: Date) => {
    return appointments.filter(appointment => 
      isSameDay(new Date(appointment.start_time), date)
    );
  }, [appointments]);

  const formatWeekDayName = useCallback((date: Date) => {
    if (isMobile) {
      const dayNames = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
      return dayNames[date.getDay()];
    }
    return format(date, 'EEE', { locale: ptBR });
  }, [isMobile]);

  // Memoize week days para evitar recálculos desnecessários
  const weekDays = useMemo(() => getWeekDays(), [getWeekDays]);

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-destructive mb-4">Erro ao carregar agenda</p>
            <p className="text-muted-foreground text-sm">
              Tente recarregar a página ou entre em contato com o suporte.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tanotado-purple mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando agenda...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <AgendaHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        onNewAppointment={() => setShowForm(true)}
      />

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Calendar and Date Selection */}
        <div className="w-full xl:w-[280px] flex-shrink-0">
          <DateSelector 
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {viewMode === 'week' ? (
            <WeekView
              weekDays={weekDays}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              onDateSelect={setSelectedDate}
              onTimeSelect={handleTimeSelect}
              getDayAppointments={getDayAppointments}
              formatWeekDayName={formatWeekDayName}
            />
          ) : (
            <MonthView
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              onTimeSelect={handleTimeSelect}
              getDayAppointments={getDayAppointments}
            />
          )}
        </div>
      </div>

      {/* Appointment Form Modal */}
      {showForm && (
        <AppointmentForm
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default Agenda;
