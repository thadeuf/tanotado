
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Control } from 'react-hook-form';

interface AppointmentTitleFieldProps {
  control: Control<any>;
  sessionType: string;
}

const AppointmentTitleField: React.FC<AppointmentTitleFieldProps> = ({ 
  control, 
  sessionType 
}) => {
  if (sessionType !== 'personal') return null;

  return (
    <FormField
      control={control}
      name="title"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Título do Compromisso</FormLabel>
          <FormControl>
            <Input placeholder="Ex: Reunião, Consulta médica..." {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default AppointmentTitleField;
