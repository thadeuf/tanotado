
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface AppointmentConflictAlertProps {
  conflictMessage: string;
}

const AppointmentConflictAlert: React.FC<AppointmentConflictAlertProps> = ({ conflictMessage }) => {
  if (!conflictMessage) return null;

  return (
    <Alert className="mb-4 border-yellow-200 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        {conflictMessage}
      </AlertDescription>
    </Alert>
  );
};

export default AppointmentConflictAlert;
