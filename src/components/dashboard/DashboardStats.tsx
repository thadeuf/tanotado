
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Users, Clock, UserX } from 'lucide-react';

const DashboardStats: React.FC = () => {
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
