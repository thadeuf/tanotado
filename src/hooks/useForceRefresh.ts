
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useForceRefresh = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const forceRefreshClients = async () => {
    if (!user?.id) return;
    
    console.log('Force refreshing clients...');
    await queryClient.invalidateQueries({ queryKey: ['clients', user.id] });
    await queryClient.refetchQueries({ queryKey: ['clients', user.id] });
    
    toast({
      title: "Dados atualizados",
      description: "Lista de clientes foi atualizada.",
    });
  };

  const forceRefreshAppointments = async () => {
    if (!user?.id) return;
    
    console.log('Force refreshing appointments...');
    await queryClient.invalidateQueries({ queryKey: ['appointments', user.id] });
    await queryClient.refetchQueries({ queryKey: ['appointments', user.id] });
    
    toast({
      title: "Dados atualizados",
      description: "Lista de agendamentos foi atualizada.",
    });
  };

  const forceRefreshAll = async () => {
    console.log('Force refreshing all data...');
    await queryClient.invalidateQueries();
    await queryClient.refetchQueries();
    
    toast({
      title: "Todos os dados atualizados",
      description: "Todas as informações foram atualizadas.",
    });
  };

  return {
    forceRefreshClients,
    forceRefreshAppointments,
    forceRefreshAll,
  };
};
