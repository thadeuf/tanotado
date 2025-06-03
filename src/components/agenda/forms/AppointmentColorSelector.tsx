
import React from 'react';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';
import { Control } from 'react-hook-form';

interface AppointmentColorSelectorProps {
  control: Control<any>;
}

const COLORS = [
  { value: '#8B5CF6', color: 'bg-purple-500' },
  { value: '#3B82F6', color: 'bg-blue-500' },
  { value: '#10B981', color: 'bg-green-500' },
  { value: '#F59E0B', color: 'bg-yellow-500' },
  { value: '#EF4444', color: 'bg-red-500' },
  { value: '#EC4899', color: 'bg-pink-500' },
  { value: '#6366F1', color: 'bg-indigo-500' },
  { value: '#8B5A2B', color: 'bg-amber-700' },
];

const AppointmentColorSelector: React.FC<AppointmentColorSelectorProps> = ({ control }) => {
  return (
    <FormField
      control={control}
      name="color"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Cor do Agendamento
          </FormLabel>
          <div className="flex gap-1">
            {COLORS.map((color) => (
              <Button
                key={color.value}
                type="button"
                variant="outline"
                className={`h-8 w-8 p-0 rounded-full border-2 ${
                  field.value === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                }`}
                onClick={() => field.onChange(color.value)}
              >
                <div className={`w-6 h-6 rounded-full ${color.color}`} />
              </Button>
            ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default AppointmentColorSelector;
