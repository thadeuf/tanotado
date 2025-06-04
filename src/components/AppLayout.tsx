
import React from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from './AppSidebar';
import AppHeader from './AppHeader';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { useSystemWakeup } from '@/hooks/useSystemWakeup';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  // Usa o hook para detectar quando a página fica visível e revalidar dados
  usePageVisibility();
  
  // Usa o hook para detectar dormência do sistema e forçar wakeup
  useSystemWakeup();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50/50">
        <AppSidebar />
        <div className="flex-1 min-w-0 overflow-hidden">
          <AppHeader />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
