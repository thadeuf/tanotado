
import React from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AppointmentDateTimeInfoProps {
  date: Date;
}

const AppointmentDateTimeInfo: React.FC<AppointmentDateTimeInfoProps> = ({ date }) => {
  return (
    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg mb-4">
      <Calendar className="h-4 w-4 text-tanotado-blue" />
      <span className="text-sm">{format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
    </div>
  );
};

export default AppointmentDateTimeInfo;
