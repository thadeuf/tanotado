
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppointmentCard from './AppointmentCard';

const AppointmentsSection: React.FC = () => {
  const appointmentsToday = [
    { 
      time: '14:30 - 15:30', 
      patient: 'Paciente Teste A', 
      type: 'Consulta Inicial',
      professional: 'Dr. Thadeu',
      mode: 'presencial' as const,
      confirmed: false
    },
    { 
      time: '15:30 - 16:30', 
      patient: 'João Santos', 
      type: 'Retorno',
      professional: 'Dr. Thadeu',
      mode: 'online' as const,
      confirmed: true
    },
    { 
      time: '16:30 - 17:30', 
      patient: 'Ana Costa', 
      type: 'Terapia',
      professional: 'Dra. Maria',
      mode: 'presencial' as const,
      confirmed: true
    },
  ];

  const appointmentsTomorrow = [
    { 
      time: '09:00 - 10:00', 
      patient: 'Carlos Silva', 
      type: 'Avaliação',
      professional: 'Dr. Thadeu',
      mode: 'online' as const,
      confirmed: false
    },
    { 
      time: '10:30 - 11:30', 
      patient: 'Mariana Oliveira', 
      type: 'Retorno',
      professional: 'Dra. Maria',
      mode: 'presencial' as const,
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
      mode: 'presencial' as const,
      confirmed: true
    },
    { 
      time: 'Sex 16:00 - 17:00', 
      patient: 'Lucia Santos', 
      type: 'Terapia',
      professional: 'Dra. Maria',
      mode: 'online' as const,
      confirmed: false
    },
  ];

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
            <TabsTrigger value="hoje">Hoje</TabsTrigger>
            <TabsTrigger value="amanha">Amanhã</TabsTrigger>
            <TabsTrigger value="semana">Esta Semana</TabsTrigger>
          </TabsList>
          
          <TabsContent value="hoje" className="space-y-4 mt-4">
            {appointmentsToday.map((appointment, index) => (
              <AppointmentCard 
                key={index}
                appointment={appointment} 
                index={index} 
                onStartVideoCall={handleStartVideoCall}
              />
            ))}
          </TabsContent>
          
          <TabsContent value="amanha" className="space-y-4 mt-4">
            {appointmentsTomorrow.map((appointment, index) => (
              <AppointmentCard 
                key={index}
                appointment={appointment} 
                index={index} 
                onStartVideoCall={handleStartVideoCall}
              />
            ))}
          </TabsContent>
          
          <TabsContent value="semana" className="space-y-4 mt-4">
            {appointmentsWeek.map((appointment, index) => (
              <AppointmentCard 
                key={index}
                appointment={appointment} 
                index={index} 
                onStartVideoCall={handleStartVideoCall}
              />
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AppointmentsSection;
