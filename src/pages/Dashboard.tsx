// src/pages/Dashboard.tsx

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Clock, UserX, Video, MapPin, AlertCircle, CheckCircle, Play, Cake, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { useAppointments, Appointment } from '../hooks/useAppointments';
import { useClients } from '../hooks/useClients';
import { format, isToday, isTomorrow, startOfWeek, endOfWeek, isWithinInterval, parseISO, getMonth, getDate, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: appointments = [], isLoading: isLoadingAppointments } = useAppointments();
  const { data: clients = [], isLoading: isLoadingClients } = useClients();

  const isLoading = isLoadingAppointments || isLoadingClients;

  // Memoize processed appointments
  const { today, tomorrow, week } = useMemo(() => {
    if (isLoading) return { today: [], tomorrow: [], week: [] };
    const now = new Date();
    const todayAppointments = appointments.filter(app => isToday(parseISO(app.start_time))).sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    const tomorrowAppointments = appointments.filter(app => isTomorrow(parseISO(app.start_time))).sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    // Fix for start of week according to pt-BR (Sunday)
    const startOfThisWeek = startOfWeek(now, { locale: ptBR });
    const endOfThisWeek = endOfWeek(now, { locale: ptBR });
    const weekAppointments = appointments
      .filter(app => isWithinInterval(parseISO(app.start_time), { start: startOfThisWeek, end: endOfThisWeek }))
      .sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    return { today: todayAppointments, tomorrow: tomorrowAppointments, week: weekAppointments };
  }, [appointments, isLoading]);

  // Memoize dashboard stats
  const dashboardStats = useMemo(() => {
    if (isLoading) return [
      { title: 'Próximo Agendamento', value: '-', icon: Clock, color: 'from-tanotado-pink to-tanotado-purple' },
      { title: 'Agendamentos Hoje', value: '0', icon: Calendar, color: 'from-tanotado-orange to-tanotado-yellow' },
      { title: 'Atendimentos no Mês', value: '0', icon: Users, color: 'from-tanotado-blue to-tanotado-green' },
      { title: 'Faltas no Mês', value: '0', icon: UserX, color: 'from-tanotado-purple to-tanotado-pink' }
    ];

    const now = new Date();
    const upcomingToday = today
        .filter(app => new Date(app.start_time) > now && app.status !== 'cancelled' && app.status !== 'completed')
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    const nextAppointment = upcomingToday.length > 0 ? format(parseISO(upcomingToday[0].start_time), 'HH:mm') : '-';
    const appointmentsTodayCount = today.filter(app => app.status !== 'cancelled').length;
    
    const completedThisMonth = appointments.filter(app => {
        const appDate = parseISO(app.start_time);
        return (app.status === 'completed') && getMonth(appDate) === getMonth(now) && new Date(appDate).getFullYear() === new Date().getFullYear();
    }).length;

    const noShowThisMonth = appointments.filter(app => {
        const appDate = parseISO(app.start_time);
        return app.status === 'no_show' && getMonth(appDate) === getMonth(now) && new Date(appDate).getFullYear() === new Date().getFullYear();
    }).length;

    return [
      { title: 'Próximo Agendamento', value: nextAppointment, icon: Clock, color: 'from-tanotado-pink to-tanotado-purple' },
      { title: 'Agendamentos Hoje', value: String(appointmentsTodayCount), icon: Calendar, color: 'from-tanotado-orange to-tanotado-yellow' },
      { title: 'Atendimentos no Mês', value: String(completedThisMonth), icon: Users, color: 'from-tanotado-blue to-tanotado-green' },
      { title: 'Faltas no Mês', value: String(noShowThisMonth), icon: UserX, color: 'from-tanotado-purple to-tanotado-pink' }
    ];
  }, [appointments, today, isLoading]);

  // Memoize birthdays
  const birthdaysToday = useMemo(() => {
    if (isLoading) return [];
    const now = new Date();
    return clients.filter(client => {
      if (!client.birth_date) return false;
      try {
        const birthDate = parseISO(client.birth_date);
        return getDate(birthDate) === getDate(now) && getMonth(birthDate) === getMonth(now);
      } catch (e) {
        return false;
      }
    });
  }, [clients, isLoading]);
  
  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);
  
  const calculateAge = (birthDateString: string | null): number | null => {
      if (!birthDateString) return null;
      try {
        const birthDate = parseISO(birthDateString);
        return differenceInYears(new Date(), birthDate);
      } catch {
        return null;
      }
  };
  
  const formatWhatsAppLink = (phone: string | null) => {
    if (!phone) return '#';
    const cleaned = phone.replace(/\D/g, '');
    return `https://wa.me/${cleaned}`;
  }

  // <<< INÍCIO DA CORREÇÃO >>>
  // Função para obter o texto e a classe do status, similar à da Agenda.
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'scheduled': return { text: 'Agendado', className: 'bg-tanotado-blue/10 text-tanotado-blue border-tanotado-blue/20' };
      case 'confirmed': return { text: 'Confirmado', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      case 'completed': return { text: 'Concluído', className: 'bg-tanotado-green/10 text-tanotado-green border-tanotado-green/20' };
      case 'cancelled': return { text: 'Cancelado', className: 'bg-red-100 text-red-700 border-red-200' };
      case 'no_show': return { text: 'Faltou', className: 'bg-orange-100 text-orange-700 border-orange-200' };
      default: return { text: status, className: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  const renderAppointment = (appointment: Appointment, index: number) => {
    const client = appointment.client_id ? clientMap.get(appointment.client_id) : null;
    const timeLabel = `${format(parseISO(appointment.start_time), 'HH:mm')} - ${format(parseISO(appointment.end_time), 'HH:mm')}`;
    const displayName = client?.name || appointment.title;
    const statusInfo = getStatusInfo(appointment.status);

    return (
      <div key={appointment.id || index} className="relative p-4 border rounded-lg hover:bg-muted/50 transition-colors overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-2" style={{ backgroundColor: appointment.color || '#e2e8f0' }} />
        <div className="ml-4 space-y-2">
          <div className="flex items-start justify-between">
            <p className="font-bold text-tanotado-navy">{displayName}</p>
            {appointment.is_online && (
              <button 
                onClick={() => { /* Lógica para iniciar a video chamada será adicionada aqui */ }}
                className="flex items-center gap-1.5 text-sm text-tanotado-blue hover:underline cursor-pointer p-1 -mr-1 -mt-1"
              >
                <Video className="h-4 w-4" />
                <span>Vídeo Chamada</span>
              </button>
            )}
          </div>
          <div className="flex items-start text-sm text-muted-foreground">
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{timeLabel}</span>
              </div>
              <Badge variant="outline" className={`flex items-center gap-1 text-xs mt-2 w-fit ${statusInfo.className}`}>
                  <MessageSquare className="h-3 w-3" />
                  <span>{statusInfo.text}</span>
              </Badge>
            </div>
          </div>
        </div>
      </div>
    );
  };
  // <<< FIM DA CORREÇÃO >>>
  
  const renderEmptyState = (text: string) => (
    <div className="text-center py-10 text-muted-foreground">
        <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p>{text}</p>
    </div>
  );

  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center space-x-3">
                    <Skeleton className="h-full w-2 absolute left-0 top-0" />
                    <div className="space-y-2 ml-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
                <Skeleton className="h-4 w-20" />
            </div>
        ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-tanotado-navy">
          Bem-vindo, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted-foreground mt-2">
          Aqui está um resumo do seu dia
        </p>
      </div>

      {user && !user.isSubscribed && user.trialEndsAt && (
        <Card className="border-tanotado-yellow/50 bg-gradient-to-r from-tanotado-yellow/10 to-tanotado-orange/10">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h3 className="font-semibold text-tanotado-navy">🎉 Teste Gratuito Ativo</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(user.trialEndsAt) > new Date()
                    ? `Restam ${Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} dias do seu teste.`
                    : 'Seu período de teste terminou.'
                  }
                </p>
              </div>
              <Button asChild className="px-4 py-2 bg-gradient-to-r from-tanotado-pink to-tanotado-purple text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all w-full sm:w-auto">
                <Link to="/assinatura">
                  Assinar Agora
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
            [...Array(4)].map((_, i) => (
                <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))
        ) : (
            dashboardStats.map((stat, index) => (
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
            ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-tanotado-navy">Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="hoje" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="hoje">Hoje ({today.length})</TabsTrigger>
                <TabsTrigger value="amanha">Amanhã ({tomorrow.length})</TabsTrigger>
                <TabsTrigger value="semana">Semana ({week.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="hoje" className="space-y-4 mt-4">
                {isLoading ? renderLoadingSkeleton() : today.length > 0 ? today.map(renderAppointment) : renderEmptyState("Nenhum agendamento para hoje.")}
              </TabsContent>
              
              <TabsContent value="amanha" className="space-y-4 mt-4">
                {isLoading ? renderLoadingSkeleton() : tomorrow.length > 0 ? tomorrow.map(renderAppointment) : renderEmptyState("Nenhum agendamento para amanhã.")}
              </TabsContent>
              
              <TabsContent value="semana" className="space-y-4 mt-4">
                {isLoading ? renderLoadingSkeleton() : week.length > 0 ? week.map(renderAppointment) : renderEmptyState("Nenhum agendamento para esta semana.")}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-tanotado-navy flex items-center gap-2">
              <Cake className="h-5 w-5 text-tanotado-pink" />
              Aniversariantes de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            ) : birthdaysToday.length > 0 ? (
              <div className="space-y-4">
                {birthdaysToday.map((client, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-tanotado-pink/10 to-tanotado-purple/10">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-tanotado-pink to-tanotado-purple rounded-full flex items-center justify-center">
                        <Cake className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-tanotado-navy">{client.name}</p>
                        {client.birth_date && <p className="text-sm text-muted-foreground">{calculateAge(client.birth_date)} anos</p>}
                        {client.phone && <p className="text-xs text-muted-foreground">{client.phone}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <Button
                        asChild
                        size="sm"
                        className="bg-gradient-to-r from-tanotado-green to-tanotado-blue hover:shadow-lg text-white mt-1 h-8 px-3 text-xs"
                      >
                          <a href={formatWhatsAppLink(client.phone)} target='_blank' rel='noopener noreferrer'>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Parabenizar
                          </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Cake className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Nenhum aniversário hoje</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;