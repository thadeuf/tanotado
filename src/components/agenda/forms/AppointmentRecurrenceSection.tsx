
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Control } from 'react-hook-form';

interface AppointmentRecurrenceSectionProps {
  control: Control<any>;
  sessionType: string;
  watchRecurrenceType: string;
}

const AppointmentRecurrenceSection: React.FC<AppointmentRecurrenceSectionProps> = ({
  control,
  sessionType,
  watchRecurrenceType,
}) => {
  if (sessionType !== 'recurring') return null;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
      <h3 className="text-sm font-medium">Configurações de Recorrência</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="recurrenceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frequência</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="biweekly">Quinzenal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="recurrenceCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantidade de Repetições</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max="52"
                  placeholder="Ex: 5"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {watchRecurrenceType && (
        <p className="text-xs text-muted-foreground">
          {watchRecurrenceType === 'weekly' && 'Será criado um agendamento por semana'}
          {watchRecurrenceType === 'biweekly' && 'Será criado um agendamento a cada 2 semanas'}
          {watchRecurrenceType === 'monthly' && 'Será criado um agendamento por mês'}
        </p>
      )}
    </div>
  );
};

export default AppointmentRecurrenceSection;
