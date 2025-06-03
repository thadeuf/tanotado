
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Users, Clock, UserX } from 'lucide-react';
import { useAppointments } from '../../hooks/useAppointments';
import { useClients } from '../../hooks/useClients';
import { format, isToday, parseISO } from 'date-fns';

const DashboardStats: React.FC = () => {
  const { data: appointments = [] } = useAppointments();
  const { data: clients = [] } = useClients();

  // Filtrar agendamentos de hoje
  const todayAppointments = appointments.filter(apt => 
    isToday(parseISO(apt.start_time))
  );

  // Próximo agendamento
  const nextAppointment = appointments
    .filter(apt => new Date(apt.start_time) > new Date() && apt.status !== 'cancelled')
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];

  // Contar atendimentos completados/confirmados
  const completedAppointments = appointments.filter(apt => 
    apt.status === 'completed' || apt.status === 'confirmed'
  ).length;

  // Contar faltas (no_show)
  const missedAppointments = appointments.filter(apt => 
    apt.status === 'no_show'
  ).length;

  const stats = [
    {
      title: 'Próximo Agendamento',
      value: nextAppointment ? format(parseISO(nextAppointment.start_time), 'HH:mm') : '--:--',
      icon: Clock,
      color: 'from-tanotado-pink to-tanotado-purple'
    },
    {
      title: 'Agendamentos Hoje',
      value: todayAppointments.length.toString(),
      icon: Calendar,
      color: 'from-tanotado-orange to-tanotado-yellow'
    },
    {
      title: 'Atendimentos',
      value: completedAppointments.toString(),
      icon: Users,
      color: 'from-tanotado-blue to-tanotado-green'
    },
    {
      title: 'Faltas',
      value: missedAppointments.toString(),
      icon: UserX,
      color: 'from-tanotado-purple to-tanotado-pink'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="overflow-hidden hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold text-tanotado-navy">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
