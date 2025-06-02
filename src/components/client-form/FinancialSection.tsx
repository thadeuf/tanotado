
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DollarSign } from 'lucide-react';
import { Control } from 'react-hook-form';
import { ClientFormData } from '@/schemas/clientSchema';

interface FinancialSectionProps {
  control: Control<ClientFormData>;
}

const FinancialSection: React.FC<FinancialSectionProps> = ({ control }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-tanotado-purple" />
          Financeiro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="sessionValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor por sessão</FormLabel>
                <FormControl>
                  <Input placeholder="R$ 0,00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name="paymentDay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dia de Cobrança</FormLabel>
                <FormControl>
                  <Input placeholder="15" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="sendMonthlyReminder"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Enviar lembrete mensal de cobrança
                </FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default FinancialSection;
