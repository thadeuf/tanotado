// src/hooks/useClients.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types'; 

export interface Client {
  id: string;
  name: string;
  cpf: string | null;
  whatsapp: string | null;
  email: string | null; // Adicionado email, que é um campo padrão
  photo_url: string | null; // Alterado de avatar_url para photo_url para corresponder à tabela
  created_at: string;
  birth_date: string | null;
  address: string | null;
  notes: string | null;
  group_id: string | null;
  updated_at: string;
  user_id: string;
  session_value?: number | null;
  is_active: boolean; // Mantido
  approval_status: Database['public']['Enums']['client_approval_status']; // NOVO CAMPO
}

export const useClients = () => {
  const { user, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['clients', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      console.log('Fetching clients for user:', user?.id); 
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: false }); 

      if (error) { 
        console.error('Error fetching clients:', error); 
        toast({
          title: "Erro ao carregar clientes",
          description: "Não foi possível carregar a lista de clientes.",
          variant: "destructive",
        });
        throw error; 
      }

     
      return (data as Client[]) || []; 
    },
    enabled: !!user?.id && !authLoading, 
    
  });
};