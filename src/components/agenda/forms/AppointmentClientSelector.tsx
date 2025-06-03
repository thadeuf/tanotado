
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from 'lucide-react';
import { Control } from 'react-hook-form';
import { useClients } from '@/hooks/useClients';

interface AppointmentClientSelectorProps {
  control: Control<any>;
  sessionType: string;
}

const AppointmentClientSelector: React.FC<AppointmentClientSelectorProps> = ({ 
  control, 
  sessionType 
}) => {
  const { data: clients = [], isLoading, error } = useClients();

  console.log('AppointmentClientSelector - clients:', clients);
  console.log('AppointmentClientSelector - isLoading:', isLoading);
  console.log('AppointmentClientSelector - sessionType:', sessionType);
  console.log('AppointmentClientSelector - error:', error);

  if (sessionType === 'personal') return null;

  return (
    <FormField
      control={control}
      name="clientId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Cliente</FormLabel>
          <Select onValueChange={field.onChange} value={field.value || ''}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Carregando clientes..." : "Selecione um cliente"} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {isLoading ? (
                <SelectItem value="loading" disabled>
                  Carregando clientes...
                </SelectItem>
              ) : clients.length === 0 ? (
                <SelectItem value="no-clients" disabled>
                  Nenhum cliente encontrado
                </SelectItem>
              ) : (
                clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {client.name}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default AppointmentClientSelector;
