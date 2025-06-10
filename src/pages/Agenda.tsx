import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Edit,
  Trash2,
  Loader2,
  Video,
  Repeat,
  Briefcase
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DateSelector from '@/components/agenda/DateSelector';
import AppointmentForm from '@/components/agenda/AppointmentForm';
import { useAppointments, Appointment } from '@/hooks/useAppointments';
import { useClients } from '@/hooks/useClients';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

import { Calendar as BigCalendar, Views } from 'react-big-calendar';
import { localizer } from '@/lib/calendarLocalizer';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Agenda.css';

const CustomEvent = ({ event }: { event: any }) => (
  <div className="rbc-event-content text-white text-xs p-1 h-full truncate">
    <strong>{format(event.start, 'HH:mm')}</strong> {event.title}
  </div>
);

const Agenda: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [formStartDate, setFormStartDate] = useState<Date | null>(null);
  const [formStartTime, setFormStartTime] = useState<string>('');
  
  // ==================================================================
  // INÍCIO DAS MUDANÇAS
  // ==================================================================
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);

  const { data: appointments = [], isLoading } = useAppointments();
  const { data: clients = [] } = useClients();
  const queryClient = useQueryClient();

  const deleteAppointmentMutation = useMutation({
    mutationFn: async ({ id, scope, recurrence_group_id }: { id: string; scope: 'one' | 'all'; recurrence_group_id?: string | null }) => {
      let response;
      if (scope === 'all' && recurrence_group_id) {
        // Excluir toda a série recorrente
        response = await supabase.from('appointments').delete().eq('recurrence_group_id', recurrence_group_id);
      } else {
        // Excluir apenas um agendamento
        response = await supabase.from('appointments').delete().eq('id', id);
      }
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast({ title: "Agendamento(s) excluído(s)!", description: "A sua agenda foi atualizada." });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setAppointmentToDelete(null); // Fecha o modal após a exclusão
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir", description: "Não foi possível remover o agendamento.", variant: "destructive" });
      console.error("Erro ao deletar agendamento:", error);
      setAppointmentToDelete(null);
    },
  });

  // Handler para abrir o modal de confirmação de exclusão
  const handleDeleteClick = (appointment: Appointment) => {
    setAppointmentToDelete(appointment);
  };

  const handleEditClick = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowForm(true);
  };
  // ==================================================================
  // FIM DAS MUDANÇAS
  // ==================================================================

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAppointment(null);
    setFormStartDate(null);
    setFormStartTime('');
  };

  const getWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const getDayAppointments = (date: Date) => {
    return appointments.filter(appointment => isSameDay(new Date(appointment.start_time), date));
  };
  
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'scheduled': return { text: 'Agendado', className: 'bg-tanotado-blue/10 text-tanotado-blue border-tanotado-blue/20' };
      case 'completed': return { text: 'Concluído', className: 'bg-tanotado-green/10 text-tanotado-green border-tanotado-green/20' };
      case 'cancelled': return { text: 'Cancelado', className: 'bg-red-100 text-red-700 border-red-200' };
      default: return { text: status, className: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  const events = useMemo(() => appointments.map(app => ({
    id: app.id,
    title: app.title,
    start: new Date(app.start_time),
    end: new Date(app.end_time),
    resource: { color: app.color },
  })), [appointments]);

  const eventStyleGetter = useCallback((event: any) => ({
    style: {
      backgroundColor: event.resource.color || '#3b82f6',
      borderRadius: '4px',
      color: 'white',
      border: 'none',
      display: 'block',
    },
  }), []);

  const handleSelectSlot = useCallback(({ start }: { start: Date }) => {
    setFormStartDate(start);
    setFormStartTime(format(start, 'HH:mm'));
    setShowForm(true);
    setEditingAppointment(null);
  }, []);

  const dailyAppointments = getDayAppointments(selectedDate);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-tanotado-purple mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando sua agenda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-tanotado-navy">Agenda</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus agendamentos e consultas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
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
          <Button onClick={() => handleSelectSlot({ start: new Date() })} className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple hover:shadow-lg transition-all duration-200 gap-2" size="sm">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo Agendamento</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 items-start">
        <aside>
          <DateSelector selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        </aside>

        <main className="space-y-6">
          {viewMode === 'month' ? (
            <Card className="h-[calc(100vh-12rem)]">
              <CardContent className="p-1 sm:p-2 h-full">
                <BigCalendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  defaultView={Views.MONTH}
                  view={Views.MONTH}
                  onNavigate={date => setSelectedDate(date)}
                  date={selectedDate}
                  style={{ height: '100%' }}
                  culture="pt-BR"
                  messages={{ next: "Próximo", previous: "Anterior", today: "Hoje", month: "Mês", week: "Semana", day: "Dia", noEventsInRange: "Não há agendamentos.", showMore: total => `+${total} mais` }}
                  eventPropGetter={eventStyleGetter}
                  onSelectSlot={handleSelectSlot}
                  onSelectEvent={(event) => { const app = appointments.find(a => a.id === event.id); if (app) handleEditClick(app); }}
                  selectable
                  components={{ event: CustomEvent, toolbar: () => null }}
                />
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {format(getWeekDays()[0], 'dd/MM')} - {format(getWeekDays()[6], 'dd/MM/yyyy', { locale: ptBR })}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, -7))}> <ChevronLeft className="h-4 w-4" /> </Button>
                      <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}> Hoje </Button>
                      <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 7))}> <ChevronRight className="h-4 w-4" /> </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {getWeekDays().map((day) => (
                      <div key={day.toString()} className={`p-3 text-center cursor-pointer rounded-lg transition-colors ${isSameDay(day, selectedDate) ? 'bg-tanotado-purple text-white' : isToday(day) ? 'bg-tanotado-blue/10 text-tanotado-blue border border-tanotado-blue/20' : 'hover:bg-muted'}`} onClick={() => setSelectedDate(day)}>
                        <div className={`text-xs mb-1 ${isSameDay(day, selectedDate) ? 'text-white/80' : 'text-muted-foreground'}`}>{format(day, 'EEE', { locale: ptBR })}</div>
                        <div className="font-medium">{format(day, 'd')}</div>
                        {getDayAppointments(day).length > 0 && <div className="mt-1"><div className={`w-2 h-2 rounded-full mx-auto ${isSameDay(day, selectedDate) ? 'bg-white' : 'bg-tanotado-pink'}`} /></div>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {isToday(selectedDate) ? 'Hoje' : format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dailyAppointments.length > 0 ? (
                      dailyAppointments.map(appointment => {
                        const client = clients.find(c => c.id === appointment.client_id);
                        return (
                          <div key={appointment.id} className="relative p-4 border rounded-lg flex items-start justify-between hover:bg-muted/30 transition-colors overflow-hidden">
                            <div className="absolute left-0 top-0 h-full w-2" style={{ backgroundColor: appointment.color || '#e2e8f0' }}/>
                            <div className="flex items-start gap-4 ml-4">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={client?.avatar_url || undefined} /> 
                                <AvatarFallback className="bg-tanotado-pink text-white font-medium">{getInitials(appointment.title)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center flex-wrap gap-2 mb-1">
                                  <span className="font-semibold text-sm">{format(new Date(appointment.start_time), 'HH:mm')} - {format(new Date(appointment.end_time), 'HH:mm')}</span>
                                  <Badge variant="secondary" className={getStatusInfo(appointment.status).className}>{getStatusInfo(appointment.status).text}</Badge>
                                  {/* INÍCIO DA MUDANÇA: BADGES CONDICIONAIS */}
                                  {appointment.recurrence_group_id && (
                                    <Badge variant="outline" className="border-tanotado-purple/50 text-tanotado-purple flex items-center gap-1">
                                      <Repeat className="h-3 w-3" /> Recorrente
                                    </Badge>
                                  )}
                                  {!appointment.client_id && (
                                    <Badge variant="outline" className="border-gray-500/50 text-gray-600 flex items-center gap-1">
                                      <Briefcase className="h-3 w-3" /> Compromisso
                                    </Badge>
                                  )}
                                  {/* FIM DA MUDANÇA: BADGES CONDICIONAIS */}
                                </div>
                                <div className="font-medium text-tanotado-navy">{appointment.title || 'Cliente não informado'}</div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                                  {appointment.is_online ? (<><Video className="h-4 w-4 text-tanotado-blue" /><span>Online</span></>) : (<><MapPin className="h-4 w-4 text-tanotado-green" /><span>Presencial</span></>)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(appointment)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDeleteClick(appointment)}>
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-10 text-muted-foreground">
                        <CalendarIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Não há agendamentos para este dia.</p>
                        <Button size="sm" className="mt-4" onClick={() => handleSelectSlot({ start: selectedDate })}>
                          <Plus className="h-4 w-4 mr-2" />
                          Agendar Horário
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
      
      {(showForm || editingAppointment) && (
        <AppointmentForm
          selectedDate={editingAppointment ? new Date(editingAppointment.start_time) : (formStartDate || new Date())}
          selectedTime={editingAppointment ? format(new Date(editingAppointment.start_time), 'HH:mm') : formStartTime}
          onClose={handleFormClose}
          initialData={editingAppointment}
        />
      )}
      
      {/* INÍCIO DA MUDANÇA: MODAL DE EXCLUSÃO ÚNICO */}
      <AlertDialog open={!!appointmentToDelete} onOpenChange={(isOpen) => !isOpen && setAppointmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {appointmentToDelete?.recurrence_group_id ? (
                `Este é um agendamento recorrente. Deseja excluir apenas este agendamento de ${format(new Date(appointmentToDelete.start_time), 'dd/MM/yyyy')} ou toda a série?`
              ) : (
                `Você tem certeza que deseja excluir o agendamento de ${appointmentToDelete?.title} em ${appointmentToDelete ? format(new Date(appointmentToDelete.start_time), "dd/MM/yyyy 'às' HH:mm") : ''}?`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAppointmentToDelete(null)}>Cancelar</AlertDialogCancel>
            {appointmentToDelete?.recurrence_group_id ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="destructive"
                  onClick={() => appointmentToDelete && deleteAppointmentMutation.mutate({ id: appointmentToDelete.id, scope: 'one' })}
                  disabled={deleteAppointmentMutation.isPending}
                >
                  {deleteAppointmentMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Excluir Somente Este
                </Button>
                <Button
                  variant="destructive"
                  className="bg-red-700 hover:bg-red-800"
                  onClick={() => appointmentToDelete && deleteAppointmentMutation.mutate({ id: appointmentToDelete.id, scope: 'all', recurrence_group_id: appointmentToDelete.recurrence_group_id })}
                  disabled={deleteAppointmentMutation.isPending}
                >
                  {deleteAppointmentMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Excluir Toda a Série
                </Button>
              </div>
            ) : (
              <AlertDialogAction
                onClick={() => appointmentToDelete && deleteAppointmentMutation.mutate({ id: appointmentToDelete.id, scope: 'one' })}
                disabled={deleteAppointmentMutation.isPending}
              >
                {deleteAppointmentMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirmar Exclusão
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* FIM DA MUDANÇA: MODAL DE EXCLUSÃO ÚNICO */}
    </div>
  );
};

export default Agenda;