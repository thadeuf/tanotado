
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface CepResponse {
  cep: string;
  address_type: string;
  address_name: string;
  address: string;
  state: string;
  district: string;
  lat: string;
  lng: string;
  city: string;
  city_ibge: string;
  ddd: string;
}

export const useCepLookup = () => {
  const [isLoading, setIsLoading] = useState(false);

  const lookupCep = async (cep: string): Promise<CepResponse | null> => {
    if (!cep || cep.length < 8) {
      return null;
    }

    // Remove any non-numeric characters
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      toast({
        title: "CEP inválido",
        description: "O CEP deve conter 8 dígitos.",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`https://cep.awesomeapi.com.br/json/${cleanCep}`);
      
      if (!response.ok) {
        throw new Error('CEP não encontrado');
      }
      
      const data = await response.json();
      
      // Check if the API returned an error
      if (data.status === 400) {
        throw new Error('CEP não encontrado');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching CEP:', error);
      toast({
        title: "Erro ao buscar CEP",
        description: "Não foi possível encontrar o endereço para este CEP.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { lookupCep, isLoading };
};
