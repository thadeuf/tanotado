
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { DollarSign } from 'lucide-react';
import { Control } from 'react-hook-form';

interface AppointmentFinancialSectionProps {
  control: Control<any>;
  watchCreateFinancialRecord: boolean;
}

const AppointmentFinancialSection: React.FC<AppointmentFinancialSectionProps> = ({ 
  control, 
  watchCreateFinancialRecord 
}) => {
  return (
    <FormField
      control={control}
      name="createFinancialRecord"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Lançar no Financeiro
          </FormLabel>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <span className="text-sm text-muted-foreground">
                {field.value ? 'Será criado registro financeiro' : 'Não será criado registro financeiro'}
              </span>
            </div>
            {watchCreateFinancialRecord && (
              <FormField
                control={control}
                name="price"
                render={({ field: priceField }) => (
                  <FormItem className="flex-shrink-0 w-32">
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0,00"
                        {...priceField} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default AppointmentFinancialSection;
