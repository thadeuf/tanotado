
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, FileText, Settings, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  const adminStats = [
    {
      title: 'Usuários Totais',
      value: '1,247',
      icon: Users,
      color: 'from-tanotado-blue to-tanotado-green',
      change: '+12%'
    },
    {
      title: 'Assinantes Ativos',
      value: '856',
      icon: TrendingUp,
      color: 'from-tanotado-green to-tanotado-blue',
      change: '+8%'
    },
    {
      title: 'Usuários em Trial',
      value: '391',
      icon: Calendar,
      color: 'from-tanotado-orange to-tanotado-yellow',
      change: '+15%'
    },
    {
      title: 'Suporte Pendente',
      value: '23',
      icon: AlertCircle,
      color: 'from-tanotado-pink to-tanotado-purple',
      change: '-5%'
    }
  ];

  const recentUsers = [
    { name: 'Dr. Maria Silva', email: 'maria@email.com', status: 'trial', joinedDays: 2 },
    { name: 'João Santos', email: 'joao@email.com', status: 'active', joinedDays: 5 },
    { name: 'Ana Costa', email: 'ana@email.com', status: 'expired', joinedDays: 12 },
    { name: 'Pedro Lima', email: 'pedro@email.com', status: 'trial', joinedDays: 1 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-tanotado-green bg-tanotado-green/10';
      case 'trial': return 'text-tanotado-orange bg-tanotado-orange/10';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'trial': return 'Trial';
      case 'expired': return 'Expirado';
      default: return status;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-tanotado-navy">
          Dashboard Admin 👨‍💼
        </h1>
        <p className="text-muted-foreground mt-2">
          Olá {user?.name?.split(' ')[0]}, gerencie sua plataforma aqui
        </p>
      </div>

      {/* Cards de Estatísticas Administrativas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminStats.map((stat, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-tanotado-navy">{stat.value}</p>
                  <p className="text-xs text-tanotado-green mt-1">{stat.change} este mês</p>
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
        {/* Usuários Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-tanotado-navy">Usuários Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-tanotado-pink to-tanotado-purple rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {getStatusText(user.status)}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {user.joinedDays} dia{user.joinedDays !== 1 ? 's' : ''} atrás
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ações Administrativas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-tanotado-navy">Ações Administrativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 rounded-lg border-2 border-dashed border-tanotado-blue/30 hover:border-tanotado-blue hover:bg-tanotado-blue/5 transition-all text-center">
                <Users className="h-8 w-8 text-tanotado-blue mx-auto mb-2" />
                <span className="text-sm font-medium text-tanotado-blue">Gerenciar Usuários</span>
              </button>
              <button className="p-4 rounded-lg border-2 border-dashed border-tanotado-green/30 hover:border-tanotado-green hover:bg-tanotado-green/5 transition-all text-center">
                <TrendingUp className="h-8 w-8 text-tanotado-green mx-auto mb-2" />
                <span className="text-sm font-medium text-tanotado-green">Relatórios</span>
              </button>
              <button className="p-4 rounded-lg border-2 border-dashed border-tanotado-purple/30 hover:border-tanotado-purple hover:bg-tanotado-purple/5 transition-all text-center">
                <Settings className="h-8 w-8 text-tanotado-purple mx-auto mb-2" />
                <span className="text-sm font-medium text-tanotado-purple">Configurações</span>
              </button>
              <button className="p-4 rounded-lg border-2 border-dashed border-tanotado-pink/30 hover:border-tanotado-pink hover:bg-tanotado-pink/5 transition-all text-center">
                <AlertCircle className="h-8 w-8 text-tanotado-pink mx-auto mb-2" />
                <span className="text-sm font-medium text-tanotado-pink">Suporte</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Crescimento (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-tanotado-navy">Crescimento de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gradient-to-r from-tanotado-pink/10 to-tanotado-purple/10 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Gráfico de crescimento será implementado aqui</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
