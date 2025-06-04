
import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from './contexts/AuthContext';
import SplashScreen from './components/SplashScreen';
import AppRoutes from './components/AppRoutes';

// Configuração mais agressiva do QueryClient para evitar problemas de "dormência"
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Sempre considerar dados como stale
      gcTime: 1 * 60 * 1000, // 1 minuto no cache (reduzido)
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      networkMode: 'always', // Sempre tentar fazer requisições
      retry: (failureCount, error: any) => {
        console.log(`🔄 Query retry attempt ${failureCount}:`, error?.message);
        
        // Para erros de autenticação, não tentar novamente
        if (error?.message?.includes('JWT') || 
            error?.message?.includes('session') || 
            error?.message?.includes('não autenticado')) {
          console.log('❌ Auth error, não tentando novamente');
          return false;
        }
        
        // Para outros erros, tentar até 3 vezes
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => {
        const delay = Math.min(1000 * 2 ** attemptIndex, 3000);
        console.log(`⏱️ Tentando novamente em ${delay}ms...`);
        return delay;
      },
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
      networkMode: 'always',
    },
  },
});

// Adiciona logging para debug
queryClient.getQueryCache().subscribe((event) => {
  console.log('📊 Query Cache Event:', event.type, event.query?.queryKey);
});

const AppContent: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
