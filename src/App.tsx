
import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from './contexts/AuthContext';
import SplashScreen from './components/SplashScreen';
import AppRoutes from './components/AppRoutes';

// Simplified and conservative configuration to prevent conflicts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - keep data fresh longer
      gcTime: 10 * 60 * 1000, // 10 minutes in cache
      refetchOnWindowFocus: true, // Keep default behavior
      refetchOnReconnect: true,
      refetchOnMount: true,
      retry: 2, // Reduced retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      networkMode: 'online',
      // Add timeout to prevent hanging queries
      meta: {
        timeout: 30000, // 30 seconds
      },
    },
    mutations: {
      retry: 1, // Reduced retries for mutations
      networkMode: 'online',
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
