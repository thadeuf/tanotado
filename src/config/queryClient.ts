
import { QueryClient } from '@tanstack/react-query';

// Configuração centralizada do React Query com configurações mais simples
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false, // Desabilitar temporariamente para debug
      refetchOnReconnect: true,
      refetchOnMount: true,
      retry: 1, // Reduzir tentativas para debug
      retryDelay: 1000,
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

// Função para debug do estado da rede
export const checkNetworkStatus = () => {
  console.log('Navigator online:', navigator.onLine);
  console.log('React Query default network mode:', queryClient.getDefaultOptions().queries?.networkMode);
  console.log('QueryClient instance:', queryClient);
};

// Função para forçar invalidação de todas as queries
export const invalidateAllQueries = () => {
  console.log('Invalidating all queries...');
  queryClient.invalidateQueries();
};

// Função para limpar cache específico
export const clearQueryCache = (queryKey?: string[]) => {
  if (queryKey) {
    console.log('Removing specific query cache:', queryKey);
    queryClient.removeQueries({ queryKey });
  } else {
    console.log('Clearing all cache...');
    queryClient.clear();
  }
};

// Função para debug de queries específicas
export const debugQuery = (queryKey: string[]) => {
  const query = queryClient.getQueryCache().find({ queryKey });
  console.log('Query debug:', {
    queryKey,
    state: query?.state,
    isStale: query?.isStale(),
    observers: query?.getObserversCount(),
  });
};
