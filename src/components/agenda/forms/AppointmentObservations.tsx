
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Control } from 'react-hook-form';

interface AppointmentObservationsProps {
  control: Control<any>;
  sessionType: string;
}

const AppointmentObservations: React.FC<AppointmentObservationsProps> = ({ 
  control, 
  sessionType 
}) => {
  return (
    <FormField
      control={control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Observações (opcional)</FormLabel>
          <FormControl>
            <Textarea 
              placeholder={
                sessionType === 'personal' 
                  ? "Adicione observações sobre o compromisso..." 
                  : "Adicione observações sobre a consulta..."
              }
              className="min-h-[80px]"
              {...field} 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default AppointmentObservations;
