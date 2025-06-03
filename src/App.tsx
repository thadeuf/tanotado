
import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from './contexts/AuthContext';
import SplashScreen from './components/SplashScreen';
import AppRoutes from './components/AppRoutes';

const queryClient = new QueryClient();

const AppContent: React.FC = () => {
  const [showSplash, setShowSplash] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Verifica se é o primeiro acesso
    try {
      const hasSeenSplash = localStorage.getItem('hasSeenSplash');
      console.log('hasSeenSplash:', hasSeenSplash);
      
      if (!hasSeenSplash) {
        console.log('First time user, showing splash');
        setShowSplash(true);
      } else {
        console.log('User has seen splash before, skipping');
        setShowSplash(false);
      }
    } catch (error) {
      console.error('Error checking localStorage:', error);
      setShowSplash(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const handleSplashComplete = () => {
    console.log('Splash completed');
    setShowSplash(false);
    try {
      localStorage.setItem('hasSeenSplash', 'true');
    } catch (error) {
      console.error('Error setting localStorage:', error);
    }
  };

  if (isChecking) {
    console.log('Still checking, showing null');
    return null;
  }

  if (showSplash) {
    console.log('Showing splash screen');
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  console.log('Showing main app');
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
