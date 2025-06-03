
import React from 'react';
import { Button } from '@/components/ui/button';

interface AppointmentFormActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}

const AppointmentFormActions: React.FC<AppointmentFormActionsProps> = ({ 
  onCancel, 
  isSubmitting, 
  submitLabel 
}) => {
  return (
    <div className="flex gap-3 pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="flex-1"
      >
        Cancelar
      </Button>
      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="flex-1 bg-gradient-to-r from-tanotado-pink to-tanotado-purple hover:shadow-lg transition-all duration-200"
      >
        {isSubmitting ? 'Salvando...' : submitLabel}
      </Button>
    </div>
  );
};

export default AppointmentFormActions;
