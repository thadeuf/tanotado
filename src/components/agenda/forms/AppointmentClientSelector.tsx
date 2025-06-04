
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, RefreshCw } from 'lucide-react';
import { Control } from 'react-hook-form';
import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';

interface AppointmentClientSelectorProps {
  control: Control<any>;
  sessionType: string;
}

const AppointmentClientSelector: React.FC<AppointmentClientSelectorProps> = ({ 
  control, 
  sessionType 
}) => {
  const { data: clients = [], isLoading, error, refetch, isFetching } = useClients();

  console.log('🔍 AppointmentClientSelector rendered:', {
    clientsCount: clients.length,
    isLoading,
    error: error?.message,
    sessionType
  });

  if (sessionType === 'personal') return null;

  const handleRefresh = () => {
    console.log('🔄 Refreshing clients in selector');
    refetch();
  };

  return (
    <FormField
      control={control}
      name="clientId"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center justify-between">
            Cliente
            {error && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isFetching}
                className="h-6 px-2"
              >
                <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </FormLabel>
          <Select onValueChange={field.onChange} value={field.value || ''}>
            <FormControl>
              <SelectTrigger>
                <SelectValue 
                  placeholder={
                    isLoading ? "Carregando clientes..." : 
                    error ? "Erro ao carregar - clique para recarregar" :
                    "Selecione um cliente"
                  } 
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {isLoading ? (
                <SelectItem value="loading" disabled>
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-900"></div>
                    Carregando clientes...
                  </div>
                </SelectItem>
              ) : error ? (
                <SelectItem value="error" disabled>
                  <div className="flex items-center gap-2 text-red-600">
                    <span>Erro ao carregar clientes</span>
                  </div>
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
