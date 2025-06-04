
import { QueryClient } from '@tanstack/react-query';

// Configuração centralizada do React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos - dados ficam frescos
      gcTime: 10 * 60 * 1000, // 10 minutos - tempo no cache (React Query v5)
      refetchOnWindowFocus: true, // Atualiza quando volta para a aba
      refetchOnReconnect: true, // Atualiza quando reconecta
      refetchOnMount: true, // Atualiza ao montar se stale
      retry: 2, // Máximo 2 tentativas em caso de erro
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      networkMode: 'online', // Só executa quando online
    },
    mutations: {
      retry: 1, // Mutações tentam apenas 1 vez em caso de erro
      networkMode: 'online',
    },
  },
});

// Função para debug do estado da rede
export const checkNetworkStatus = () => {
  console.log('Navigator online:', navigator.onLine);
  console.log('React Query default network mode:', queryClient.getDefaultOptions().queries?.networkMode);
};

// Função para forçar invalidação de todas as queries
export const invalidateAllQueries = () => {
  queryClient.invalidateQueries();
};

// Função para limpar cache específico
export const clearQueryCache = (queryKey?: string[]) => {
  if (queryKey) {
    queryClient.removeQueries({ queryKey });
  } else {
    queryClient.clear();
  }
};
