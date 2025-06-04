
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export const useQueryErrorHandler = () => {
  const queryClient = useQueryClient();

  const handleQueryError = useCallback((error: any, queryKey: string[]) => {
    console.error(`❌ Query error for ${queryKey.join(',')}:`, error);
    
    // Check if it's a network/auth related error
    if (error?.message?.includes('JWT') || 
        error?.message?.includes('session') || 
        error?.message?.includes('network') ||
        error?.code === 'PGRST301') {
      
      console.log('🔑 Auth/Network error detected, invalidating queries');
      
      // Clear and refetch queries
      queryClient.invalidateQueries({ queryKey });
      
      toast({
        title: "Erro de conexão",
        description: "Recarregando dados automaticamente...",
        variant: "destructive",
      });
      
      return true; // Handled
    }
    
    return false; // Not handled
  }, [queryClient]);

  const retryQuery = useCallback((queryKey: string[]) => {
    console.log(`🔄 Manually retrying query: ${queryKey.join(',')}`);
    queryClient.refetchQueries({ queryKey });
  }, [queryClient]);

  const resetQuery = useCallback((queryKey: string[]) => {
    console.log(`🔄 Resetting query: ${queryKey.join(',')}`);
    queryClient.resetQueries({ queryKey });
  }, [queryClient]);

  return {
    handleQueryError,
    retryQuery,
    resetQuery,
  };
};
