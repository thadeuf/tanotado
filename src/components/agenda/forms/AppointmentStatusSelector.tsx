
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Control } from 'react-hook-form';

interface AppointmentStatusSelectorProps {
  control: Control<any>;
}

const AppointmentStatusSelector: React.FC<AppointmentStatusSelectorProps> = ({ control }) => {
  return (
    <FormField
      control={control}
      name="status"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Status</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="scheduled">Pendente</SelectItem>
              <SelectItem value="no_show">Faltou</SelectItem>
              <SelectItem value="confirmed">Compareceu</SelectItem>
              <SelectItem value="cancelled">Suspenso</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default AppointmentStatusSelector;
