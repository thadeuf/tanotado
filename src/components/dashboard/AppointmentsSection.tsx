
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppointmentCard from './AppointmentCard';
import { useAppointments } from '../../hooks/useAppointments';
import { format, isToday, isTomorrow, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AppointmentsSection: React.FC = () => {
  const { data: appointments = [] } = useAppointments();

  // Filtrar agendamentos por período
  const todayAppointments = appointments
    .filter(apt => isToday(parseISO(apt.start_time)) && apt.status !== 'cancelled')
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .map(apt => ({
      time: `${format(parseISO(apt.start_time), 'HH:mm')} - ${format(parseISO(apt.end_time), 'HH:mm')}`,
      patient: apt.client?.name || 'Cliente não informado',
      type: apt.title || 'Sessão',
      professional: 'Dr. Profissional',
      mode: (apt.appointment_type === 'remoto' ? 'online' : 'presencial') as const,
      confirmed: apt.status === 'confirmed' || apt.status === 'completed'
    }));

  const tomorrowAppointments = appointments
    .filter(apt => isTomorrow(parseISO(apt.start_time)) && apt.status !== 'cancelled')
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .map(apt => ({
      time: `${format(parseISO(apt.start_time), 'HH:mm')} - ${format(parseISO(apt.end_time), 'HH:mm')}`,
      patient: apt.client?.name || 'Cliente não informado',
      type: apt.title || 'Sessão',
      professional: 'Dr. Profissional',
      mode: (apt.appointment_type === 'remoto' ? 'online' : 'presencial') as const,
      confirmed: apt.status === 'confirmed' || apt.status === 'completed'
    }));

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  
  const weekAppointments = appointments
    .filter(apt => {
      const aptDate = parseISO(apt.start_time);
      return aptDate >= weekStart && aptDate <= weekEnd && apt.status !== 'cancelled';
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .map(apt => {
      const aptDate = parseISO(apt.start_time);
      const timePrefix = isToday(aptDate) ? '' : 
                        isTomorrow(aptDate) ? 'Amanhã ' :
                        format(aptDate, 'EEE ', { locale: ptBR });
      
      return {
        time: `${timePrefix}${format(parseISO(apt.start_time), 'HH:mm')} - ${format(parseISO(apt.end_time), 'HH:mm')}`,
        patient: apt.client?.name || 'Cliente não informado',
        type: apt.title || 'Sessão',
        professional: 'Dr. Profissional',
        mode: (apt.appointment_type === 'remoto' ? 'online' : 'presencial') as const,
        confirmed: apt.status === 'confirmed' || apt.status === 'completed'
      };
    });

  const handleStartVideoCall = (patientName: string) => {
    console.log(`Iniciando videochamada com ${patientName}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-tanotado-navy">Próximos Agendamentos</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="hoje" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hoje">Hoje ({todayAppointments.length})</TabsTrigger>
            <TabsTrigger value="amanha">Amanhã ({tomorrowAppointments.length})</TabsTrigger>
            <TabsTrigger value="semana">Esta Semana ({weekAppointments.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="hoje" className="space-y-4 mt-4">
            {todayAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum agendamento para hoje
              </div>
            ) : (
              todayAppointments.map((appointment, index) => (
                <AppointmentCard 
                  key={index}
                  appointment={appointment} 
                  index={index} 
                  onStartVideoCall={handleStartVideoCall}
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="amanha" className="space-y-4 mt-4">
            {tomorrowAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum agendamento para amanhã
              </div>
            ) : (
              tomorrowAppointments.map((appointment, index) => (
                <AppointmentCard 
                  key={index}
                  appointment={appointment} 
                  index={index} 
                  onStartVideoCall={handleStartVideoCall}
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="semana" className="space-y-4 mt-4">
            {weekAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum agendamento para esta semana
              </div>
            ) : (
              weekAppointments.map((appointment, index) => (
                <AppointmentCard 
                  key={index}
                  appointment={appointment} 
                  index={index} 
                  onStartVideoCall={handleStartVideoCall}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AppointmentsSection;
