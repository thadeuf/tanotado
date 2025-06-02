
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Clock, UserX } from 'lucide-react';
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
      title: 'Atendimentos',
      value: '156',
      icon: Users,
      color: 'from-tanotado-blue to-tanotado-green'
    },
    {
      title: 'Agendamentos Hoje',
      value: '8',
      icon: Calendar,
      color: 'from-tanotado-orange to-tanotado-yellow'
    },
    {
      title: 'Faltas',
      value: '3',
      icon: UserX,
      color: 'from-tanotado-purple to-tanotado-pink'
    }
  ];

  const upcomingAppointments = [
    { time: '14:30', patient: 'Maria Silva', type: 'Consulta Inicial' },
    { time: '15:30', patient: 'João Santos', type: 'Retorno' },
    { time: '16:30', patient: 'Ana Costa', type: 'Terapia' },
  ];

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
        {/* Próximos Agendamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-tanotado-navy">Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-tanotado-pink rounded-full"></div>
                    <div>
                      <p className="font-medium">{appointment.patient}</p>
                      <p className="text-sm text-muted-foreground">{appointment.type}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-tanotado-navy">
                    {appointment.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-tanotado-navy">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 rounded-lg border-2 border-dashed border-tanotado-pink/30 hover:border-tanotado-pink hover:bg-tanotado-pink/5 transition-all text-center">
                <Calendar className="h-8 w-8 text-tanotado-pink mx-auto mb-2" />
                <span className="text-sm font-medium text-tanotado-pink">Novo Agendamento</span>
              </button>
              <button className="p-4 rounded-lg border-2 border-dashed border-tanotado-blue/30 hover:border-tanotado-blue hover:bg-tanotado-blue/5 transition-all text-center">
                <Users className="h-8 w-8 text-tanotado-blue mx-auto mb-2" />
                <span className="text-sm font-medium text-tanotado-blue">Novo {user?.clientNomenclature || 'Cliente'}</span>
              </button>
              <button className="p-4 rounded-lg border-2 border-dashed border-tanotado-green/30 hover:border-tanotado-green hover:bg-tanotado-green/5 transition-all text-center">
                <FileText className="h-8 w-8 text-tanotado-green mx-auto mb-2" />
                <span className="text-sm font-medium text-tanotado-green">Novo Prontuário</span>
              </button>
              <button className="p-4 rounded-lg border-2 border-dashed border-tanotado-purple/30 hover:border-tanotado-purple hover:bg-tanotado-purple/5 transition-all text-center">
                <Clock className="h-8 w-8 text-tanotado-purple mx-auto mb-2" />
                <span className="text-sm font-medium text-tanotado-purple">Relatórios</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
