
import React from 'react';
import { Button } from '@/components/ui/button';
import { Video, MapPin, AlertCircle, CheckCircle, Play } from 'lucide-react';

interface Appointment {
  time: string;
  patient: string;
  type: string;
  professional: string;
  mode: 'presencial' | 'online';
  confirmed: boolean;
}

interface AppointmentCardProps {
  appointment: Appointment;
  index: number;
  onStartVideoCall: (patientName: string) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, index, onStartVideoCall }) => {
  return (
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
              onClick={() => onStartVideoCall(appointment.patient)}
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
};

export default AppointmentCard;
