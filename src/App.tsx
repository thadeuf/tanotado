// src/App.tsx

import React, { useState, useEffect } from 'react';
// --- INÍCIO DA ALTERAÇÃO: Importações adicionadas ---
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
// Ícone CreditCard adicionado
import { Settings as SettingsIconLucide, LogOut, CreditCard } from 'lucide-react';
// --- FIM DA ALTERAÇÃO ---
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import SplashScreen from './components/SplashScreen';
import OnboardingFlow from './components/OnboardingFlow';
import { AppSidebar } from './components/AppSidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Clients from './pages/Clients';
import NotFound from './pages/NotFound';
import 'react-datepicker/dist/react-datepicker.css';
import EditClient from './pages/EditClient';
import Agenda from './pages/Agenda';
import Financial from './pages/Financial';
import Prontuarios from './pages/Prontuarios';
import Settings from './pages/Settings';
import MessageSettings from './pages/MessageSettings';
import Subscription from './pages/Subscription';
import ManageSubscriptionPage from './pages/ManageSubscription';
import DocumentTemplates from './pages/DocumentTemplates';
import EditDocumentTemplate from './pages/EditDocumentTemplate';
import WhatsappInstances from './pages/admin/WhatsappInstances';
import MessageReports from './pages/admin/MessageReports';
import PatientBooking from './pages/PatientBooking';
import HelpPage from './pages/Help';
import AiPosts from './pages/AiPosts';
import IntegracaoReceitaSaude from './pages/IntegracaoReceitaSaude';
import PatientRegistration from './pages/PatientRegistration';

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};


const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();

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

  const isTrialExpired = user && new Date(user.trialEndsAt) < new Date() && !user.isSubscribed;

  if (isTrialExpired) {
    return <Navigate to="/assinatura" replace />;
  }

  if (!user.hasCompletedOnboarding) {
    return <OnboardingFlow />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50/50">
        <AppSidebar />
        
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 h-16 border-b bg-white flex items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <SidebarTrigger className="lg:hidden" />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-accent transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url || ""} alt={user.name} />
                    <AvatarFallback className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple text-white font-medium text-sm">
                      {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-foreground">
                      {user.name}
                    </div>
                    {user.role === 'admin' && (
                      <div className="text-xs text-tanotado-purple">
                        👑 Administrador
                      </div>
                    )}
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onSelect={() => navigate('/configuracoes')}>
                  <SettingsIconLucide className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>

                {/* --- NOVA OPÇÃO ADICIONADA AQUI --- */}
                <DropdownMenuItem onSelect={() => navigate('/assinatura')}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Minha Assinatura</span>
                </DropdownMenuItem>
                {/* --- FIM DA NOVA OPÇÃO --- */}

                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </header>
          
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

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

const SubscriptionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  return <>{children}</>;
}


const AppContent: React.FC = () => {
  const [isSplashActive, setIsSplashActive] = useState(!sessionStorage.getItem('splashScreenShown'));

  const handleSplashComplete = () => {
    sessionStorage.setItem('splashScreenShown', 'true'); 
    setIsSplashActive(false); 
  };

  if (isSplashActive) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={ <PublicRoute> <Login /> </PublicRoute> } />
          <Route path="/register" element={ <PublicRoute> <Register /> </PublicRoute> } />
          <Route path="/agendar/:slug" element={ <PatientBooking /> } />
          <Route path="/cadastrar/:slug" element={ <PatientRegistration /> } />

          {/* Rota para a página de assinatura */}
          <Route path="/assinatura" element={ <SubscriptionRoute> <Subscription /> </SubscriptionRoute> } />
          <Route path="/manage-subscription" element={ <ProtectedRoute> <ManageSubscriptionPage /> </ProtectedRoute> } />

          {/* Rotas protegidas */}
          <Route path="/dashboard" element={ <ProtectedRoute> <Dashboard /> </ProtectedRoute> } />
          <Route path="/admin" element={ <ProtectedRoute> <AdminRoute> <AdminDashboard /> </AdminRoute> </ProtectedRoute> } />
          <Route path="/admin/whatsapp-instances" element={ <ProtectedRoute> <AdminRoute> <WhatsappInstances /> </AdminRoute> </ProtectedRoute> } />
          <Route path="/admin/message-reports" element={ <ProtectedRoute> <AdminRoute> <MessageReports /> </AdminRoute> </ProtectedRoute> } />

          <Route path="/clientes" element={ <ProtectedRoute> <Clients /> </ProtectedRoute> } />
          <Route path="/clientes/editar/:clientId" element={ <ProtectedRoute> <EditClient /> </ProtectedRoute> } />
          <Route path="/financeiro" element={ <ProtectedRoute> <Financial /> </ProtectedRoute> } />
          <Route path="/prontuarios" element={ <ProtectedRoute> <Prontuarios /> </ProtectedRoute> } />
          <Route path="/configuracoes" element={ <ProtectedRoute> <Settings /> </ProtectedRoute> } />
          <Route path="/configuracoes/integracao-receita-saude" element={ <ProtectedRoute> <IntegracaoReceitaSaude /> </ProtectedRoute> } />
          <Route path="/configuracoes/mensagens" element={ <ProtectedRoute> <MessageSettings /> </ProtectedRoute> } />
          
          <Route path="/agenda" element={ <ProtectedRoute> <Agenda /> </ProtectedRoute> } />

          <Route path="/configuracoes/modelos" element={ <ProtectedRoute> <DocumentTemplates /> </ProtectedRoute> } />
          <Route path="/configuracoes/modelos/novo" element={ <ProtectedRoute> <EditDocumentTemplate /> </ProtectedRoute> } />
          <Route path="/configuracoes/modelos/editar/:templateId" element={ <ProtectedRoute> <EditDocumentTemplate /> </ProtectedRoute> } />
          <Route path="/ajuda" element={ <ProtectedRoute> <HelpPage /> </ProtectedRoute> } />

          <Route path="/posts-ia" element={ <ProtectedRoute> <AiPosts /> </ProtectedRoute> } />

          
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