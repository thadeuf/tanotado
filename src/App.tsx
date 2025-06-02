
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import SplashScreen from './components/SplashScreen';
import OnboardingFlow from './components/OnboardingFlow';
import { AppSidebar } from './components/AppSidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

// Componente para rotas protegidas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-tanotado-pink"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.hasCompletedOnboarding) {
    return <OnboardingFlow />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50/50">
        <AppSidebar />
        <main className="flex-1 overflow-hidden">
          <header className="h-16 border-b bg-white flex items-center px-6">
            <SidebarTrigger className="lg:hidden" />
            <div className="ml-auto flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                {user.name}
                {user.role === 'admin' && <span className="ml-2 text-tanotado-purple">👑 Admin</span>}
              </div>
            </div>
          </header>
          <div className="p-6 overflow-auto h-[calc(100vh-4rem)]">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

// Componente para rotas de admin
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Componente para rotas públicas (já logado redireciona)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-tanotado-pink"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />

          {/* Rotas protegidas */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* Rota do Admin */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/agenda" element={
            <ProtectedRoute>
              <div>Agenda (Em desenvolvimento)</div>
            </ProtectedRoute>
          } />
          <Route path="/clientes" element={
            <ProtectedRoute>
              <div>Clientes (Em desenvolvimento)</div>
            </ProtectedRoute>
          } />
          <Route path="/prontuarios" element={
            <ProtectedRoute>
              <div>Prontuários (Em desenvolvimento)</div>
            </ProtectedRoute>
          } />
          <Route path="/configuracoes" element={
            <ProtectedRoute>
              <div>Configurações (Em desenvolvimento)</div>
            </ProtectedRoute>
          } />

          {/* Redirecionamentos */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
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
