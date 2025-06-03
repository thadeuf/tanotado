
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Control } from 'react-hook-form';

interface AppointmentTimeFieldsProps {
  control: Control<any>;
}

const AppointmentTimeFields: React.FC<AppointmentTimeFieldsProps> = ({ control }) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <FormField
        control={control}
        name="startTime"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Horário de Início</FormLabel>
            <FormControl>
              <Input 
                type="time" 
                {...field} 
                className="w-full"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="endTime"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Horário de Fim</FormLabel>
            <FormControl>
              <Input 
                type="time" 
                {...field} 
                className="w-full"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default AppointmentTimeFields;
