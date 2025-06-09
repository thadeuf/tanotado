
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Clock, UserX, FileText, Video, MapPin, AlertCircle, CheckCircle, Play, Cake } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Próximo Agendamento',
      value: '14:30',
      icon: Clock,
      color: 'from-tanotado-pink to-tanotado-purple'
    },
    {
      title: 'Agendamentos Hoje',
      value: '8',
      icon: Calendar,
      color: 'from-tanotado-orange to-tanotado-yellow'
    },
    {
      title: 'Atendimentos',
      value: '156',
      icon: Users,
      color: 'from-tanotado-blue to-tanotado-green'
    },
    {
      title: 'Faltas',
      value: '3',
      icon: UserX,
      color: 'from-tanotado-purple to-tanotado-pink'
    }
  ];

  const appointmentsToday = [
    { 
      time: '14:30 - 15:30', 
      patient: 'Paciente Teste A', 
      type: 'Consulta Inicial',
      professional: 'Dr. Thadeu',
      mode: 'presencial',
      confirmed: false
    },
    { 
      time: '15:30 - 16:30', 
      patient: 'João Santos', 
      type: 'Retorno',
      professional: 'Dr. Thadeu',
      mode: 'online',
      confirmed: true
    },
    { 
      time: '16:30 - 17:30', 
      patient: 'Ana Costa', 
      type: 'Terapia',
      professional: 'Dra. Maria',
      mode: 'presencial',
      confirmed: true
    },
  ];

  const appointmentsTomorrow = [
    { 
      time: '09:00 - 10:00', 
      patient: 'Carlos Silva', 
      type: 'Avaliação',
      professional: 'Dr. Thadeu',
      mode: 'online',
      confirmed: false
    },
    { 
      time: '10:30 - 11:30', 
      patient: 'Mariana Oliveira', 
      type: 'Retorno',
      professional: 'Dra. Maria',
      mode: 'presencial',
      confirmed: true
    },
  ];

  const appointmentsWeek = [
    ...appointmentsToday,
    ...appointmentsTomorrow,
    { 
      time: 'Qui 14:00 - 15:00', 
      patient: 'Pedro Costa', 
      type: 'Consulta',
      professional: 'Dr. Thadeu',
      mode: 'presencial',
      confirmed: true
    },
    { 
      time: 'Sex 16:00 - 17:00', 
      patient: 'Lucia Santos', 
      type: 'Terapia',
      professional: 'Dra. Maria',
      mode: 'online',
      confirmed: false
    },
  ];

  // Aniversariantes do dia
  const birthdaysToday = [
    {
      name: 'Maria Silva',
      age: 28,
      phone: '(11) 99999-1234',
    },
    {
      name: 'João Santos',
      age: 35,
      phone: '(11) 98888-5678',
    },
    {
      name: 'Ana Costa',
      age: 42,
      phone: '(11) 97777-9012',
    }
  ];

  const handleStartVideoCall = (patientName: string) => {
    console.log(`Iniciando videochamada com ${patientName}`);
  };

  const renderAppointment = (appointment: any, index: number) => (
    <div key={index} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="w-2 h-2 bg-tanotado-pink rounded-full"></div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-tanotado-navy">{appointment.patient}</p>
            {appointment.mode === 'online' && (
              <Video className="h-4 w-4 text-tanotado-blue" />
            )}
            {appointment.mode === 'presencial' && (
              <MapPin className="h-4 w-4 text-tanotado-green" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">{appointment.professional}</p>
          <p className="text-sm text-muted-foreground">{appointment.type}</p>
          <div className="flex items-center gap-1 mt-1">
            {appointment.confirmed ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <AlertCircle className="h-3 w-3 text-yellow-500" />
            )}
            <span className="text-xs text-muted-foreground">
              {appointment.confirmed ? 'Confirmado' : 'Confirmação pendente'}
            </span>
          </div>
          {appointment.mode === 'online' && (
            <Button
              size="sm"
              onClick={() => handleStartVideoCall(appointment.patient)}
              className="bg-tanotado-blue hover:bg-tanotado-blue/90 text-white mt-2 h-6 px-2 text-xs"
            >
              <Play className="h-2 w-2 mr-1" />
              Iniciar
            </Button>
          )}
        </div>
      </div>
      <div className="text-right">
        <span className="text-sm font-medium text-tanotado-navy">
          {appointment.time}
        </span>
      </div>
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

      {/* Status da Assinatura */}
      {user?.subscriptionStatus === 'trial' && (
        <Card className="border-tanotado-yellow/50 bg-gradient-to-r from-tanotado-yellow/10 to-tanotado-orange/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-tanotado-navy">🎉 Teste Gratuito Ativo</h3>
                <p className="text-sm text-muted-foreground">
                  Restam {Math.ceil((user.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias do seu teste
                </p>
              </div>
              <button className="px-4 py-2 bg-gradient-to-r from-tanotado-pink to-tanotado-purple text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all">
                Assinar Agora
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de Estatísticas */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos Agendamentos com Abas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-tanotado-navy">Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="hoje" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="hoje">Hoje</TabsTrigger>
                <TabsTrigger value="amanha">Amanhã</TabsTrigger>
                <TabsTrigger value="semana">Esta Semana</TabsTrigger>
              </TabsList>
              
              <TabsContent value="hoje" className="space-y-4 mt-4">
                {appointmentsToday.map((appointment, index) => renderAppointment(appointment, index))}
              </TabsContent>
              
              <TabsContent value="amanha" className="space-y-4 mt-4">
                {appointmentsTomorrow.map((appointment, index) => renderAppointment(appointment, index))}
              </TabsContent>
              
              <TabsContent value="semana" className="space-y-4 mt-4">
                {appointmentsWeek.map((appointment, index) => renderAppointment(appointment, index))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Aniversariantes do Dia */}
        <Card>
          <CardHeader>
            <CardTitle className="text-tanotado-navy flex items-center gap-2">
              <Cake className="h-5 w-5 text-tanotado-pink" />
              Aniversariantes de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {birthdaysToday.length > 0 ? (
              <div className="space-y-4">
                {birthdaysToday.map((person, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-tanotado-pink/10 to-tanotado-purple/10">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-tanotado-pink to-tanotado-purple rounded-full flex items-center justify-center">
                        <Cake className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-tanotado-navy">{person.name}</p>
                        <p className="text-sm text-muted-foreground">{person.age} anos</p>
                        <p className="text-xs text-muted-foreground">{person.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-tanotado-navy">{person.nextAppointment}</p>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple hover:shadow-lg text-white mt-1 h-6 px-2 text-xs"
                      >
                        Parabenizar
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
