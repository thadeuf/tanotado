
import React from 'react';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Calendar, User } from 'lucide-react';
import { Control } from 'react-hook-form';

interface AppointmentTypeSelectorProps {
  control: Control<any>;
}

const APPOINTMENT_TYPES = [
  { value: 'unique', label: 'Sessão Única', icon: Calendar },
  { value: 'recurring', label: 'Sessão Recorrente', icon: Calendar },
  { value: 'personal', label: 'Compromisso Pessoal', icon: User },
];

const AppointmentTypeSelector: React.FC<AppointmentTypeSelectorProps> = ({ control }) => {
  return (
    <FormField
      control={control}
      name="sessionType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Tipo de Agendamento</FormLabel>
          <div className="grid grid-cols-3 gap-2">
            {APPOINTMENT_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <Button
                  key={type.value}
                  type="button"
                  variant={field.value === type.value ? "default" : "outline"}
                  className="h-20 flex flex-col gap-2"
                  onClick={() => field.onChange(type.value)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs text-center">{type.label}</span>
                </Button>
              );
            })}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default AppointmentTypeSelector;
