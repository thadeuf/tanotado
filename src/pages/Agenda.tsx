import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Plus, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DateSelector from '@/components/agenda/DateSelector';
import TimeSlots from '@/components/agenda/TimeSlots';
import AppointmentForm from '@/components/agenda/AppointmentForm';
import { useAppointments } from '@/hooks/useAppointments';

const Agenda: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: appointments = [], isLoading } = useAppointments();

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedTime('');
  };

  const getWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const getDayAppointments = (date: Date) => {
    return appointments.filter(appointment => 
      isSameDay(new Date(appointment.start_time), date)
    );
  };

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
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-tanotado-navy">Agenda</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus agendamentos e consultas
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                {viewMode === 'week' ? 'Semana' : 'Mês'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={viewMode} onValueChange={(value) => setViewMode(value as 'week' | 'month')}>
                <DropdownMenuRadioItem value="week">Visão Semanal</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="month">Visão Mensal</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={filterStatus} onValueChange={setFilterStatus}>
                <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="scheduled">Agendados</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="completed">Concluídos</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="cancelled">Cancelados</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* New Appointment */}
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple hover:shadow-lg transition-all duration-200 gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo Agendamento</span>
          </Button>
        </div>
      </div>

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
            <>
              {/* Week Navigation */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {format(getWeekDays()[0], 'dd MMM', { locale: ptBR })} - {format(getWeekDays()[6], 'dd MMM yyyy', { locale: ptBR })}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedDate(addDays(selectedDate, -7))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedDate(new Date())}
                      >
                        Hoje
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedDate(addDays(selectedDate, 7))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {getWeekDays().map((day, index) => {
                      const dayAppointments = getDayAppointments(day);
                      const isSelected = isSameDay(day, selectedDate);
                      const isTodayDate = isToday(day);
                      
                      return (
                        <div 
                          key={index}
                          className={`p-3 text-center cursor-pointer rounded-lg transition-colors ${
                            isSelected 
                              ? 'bg-tanotado-purple text-white' 
                              : isTodayDate 
                                ? 'bg-tanotado-blue/10 text-tanotado-blue border border-tanotado-blue/20'
                                : 'hover:bg-muted'
                          }`}
                          onClick={() => setSelectedDate(day)}
                        >
                          <div className={`text-xs mb-1 ${
                            isSelected ? 'text-white' : 'text-muted-foreground'
                          }`}>
                            {format(day, 'EEE', { locale: ptBR })}
                          </div>
                          <div className="font-medium">
                            {format(day, 'd')}
                          </div>
                          {dayAppointments.length > 0 && (
                            <div className="mt-1">
                              <div className={`w-2 h-2 rounded-full mx-auto ${
                                isSelected ? 'bg-white' : 'bg-tanotado-pink'
                              }`} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Time Slots */}
              <TimeSlots 
                selectedDate={selectedDate}
                onTimeSelect={handleTimeSelect}
                appointments={getDayAppointments(selectedDate)}
              />
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Visão Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Visão mensal em desenvolvimento...
                </p>
              </CardContent>
            </Card>
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
