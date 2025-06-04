
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
      gcTime: 5 * 60 * 1000, // 5 minutos no cache
      refetchOnWindowFocus: true, // Reativar refetch on focus
      refetchOnReconnect: true,
      refetchOnMount: true, // Sempre refetch ao montar
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('JWT') || 
            error?.message?.includes('session') || 
            error?.message?.includes('não autenticado')) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
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
