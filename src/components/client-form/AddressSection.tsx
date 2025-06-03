
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MapPin, Search } from 'lucide-react';
import { Control, UseFormSetValue } from 'react-hook-form';
import { ClientFormData } from '@/schemas/clientSchema';
import { useCepLookup } from '@/hooks/useCepLookup';

interface AddressSectionProps {
  control: Control<ClientFormData>;
  setValue: UseFormSetValue<ClientFormData>;
}

const AddressSection: React.FC<AddressSectionProps> = ({ control, setValue }) => {
  const { lookupCep, isLoading } = useCepLookup();

  const handleCepLookup = async (cep: string) => {
    const result = await lookupCep(cep);
    
    if (result) {
      setValue('address', result.address);
      setValue('neighborhood', result.district);
      setValue('city', result.city);
      setValue('state', result.state);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-tanotado-purple" />
          Endereço
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="cep"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CEP</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input 
                    placeholder="00000-000" 
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      // Auto-format CEP as user types
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 8) {
                        const formatted = value.replace(/(\d{5})(\d{3})/, '$1-$2');
                        field.onChange(formatted);
                      }
                    }}
                    maxLength={9}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCepLookup(field.value)}
                    disabled={isLoading || !field.value || field.value.replace(/\D/g, '').length !== 8}
                    className="gap-2"
                  >
                    <Search className="h-4 w-4" />
                    {isLoading ? 'Buscando...' : 'Buscar'}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input placeholder="Rua, Avenida..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número</FormLabel>
                <FormControl>
                  <Input placeholder="123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name="neighborhood"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bairro</FormLabel>
                <FormControl>
                  <Input placeholder="Bairro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade</FormLabel>
                <FormControl>
                  <Input placeholder="Cidade" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <FormControl>
                  <Input placeholder="Estado" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="complement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Complemento</FormLabel>
              <FormControl>
                <Input placeholder="Apto, casa, etc..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default AddressSection;
