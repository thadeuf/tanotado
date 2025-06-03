
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Control } from 'react-hook-form';
import { Clock, CheckCircle, XCircle, Pause } from 'lucide-react';

interface AppointmentStatusSelectorProps {
  control: Control<any>;
}

const statusOptions = [
  { value: 'scheduled', label: 'Pendente', icon: Clock, color: 'text-blue-600' },
  { value: 'confirmed', label: 'Compareceu', icon: CheckCircle, color: 'text-green-600' },
  { value: 'no_show', label: 'Faltou', icon: XCircle, color: 'text-red-600' },
  { value: 'cancelled', label: 'Suspensa', icon: Pause, color: 'text-orange-600' },
];

const AppointmentStatusSelector: React.FC<AppointmentStatusSelectorProps> = ({ control }) => {
  return (
    <FormField
      control={control}
      name="status"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Status</FormLabel>
          <FormControl>
            <ToggleGroup
              type="single"
              value={field.value}
              onValueChange={field.onChange}
              className="grid grid-cols-2 gap-2"
            >
              {statusOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <ToggleGroupItem
                    key={option.value}
                    value={option.value}
                    className="flex items-center gap-2 p-3 h-auto data-[state=on]:bg-primary/10 data-[state=on]:text-primary border border-input"
                  >
                    <Icon className={`h-4 w-4 ${option.color}`} />
                    <span className="text-sm font-medium">{option.label}</span>
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default AppointmentStatusSelector;
