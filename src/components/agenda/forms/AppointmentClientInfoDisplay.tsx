
import React from 'react';
import { User } from 'lucide-react';

interface Client {
  id: string;
  name: string;
}

interface AppointmentClientInfoDisplayProps {
  client: Client | undefined;
  sessionType?: string;
}

const AppointmentClientInfoDisplay: React.FC<AppointmentClientInfoDisplayProps> = ({ 
  client, 
  sessionType 
}) => {
  if (sessionType === 'personal') return null;

  return (
    <div className="p-3 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        <User className="h-4 w-4 text-tanotado-blue" />
        <span className="text-sm font-medium">Cliente</span>
      </div>
      <p className="text-sm text-muted-foreground">
        {client?.name || 'Cliente não encontrado'}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        O cliente não pode ser alterado após o agendamento ser criado
      </p>
    </div>
  );
};

export default AppointmentClientInfoDisplay;
