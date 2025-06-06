
import React from 'react';
import { 
  Calendar, 
  User, 
  FileText, 
  Settings,
  Shield,
  DollarSign,
  LayoutDashboard
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '../contexts/AuthContext';

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  // Todos os itens do menu em uma única lista
  const menuItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Agenda', url: '/agenda', icon: Calendar },
    { title: 'Clientes', url: '/clientes', icon: User },
    { title: 'Prontuários', url: '/prontuarios', icon: FileText },
    { title: 'Financeiro', url: '/financeiro', icon: DollarSign },
    { title: 'Configurações', url: '/configuracoes', icon: Settings },
    ...(user?.role === 'admin' ? [{ title: 'Dashboard Admin', url: '/admin', icon: Shield }] : []),
  ];

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-gradient-to-r from-tanotado-pink/20 to-tanotado-purple/20 text-tanotado-navy font-medium" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-56"} collapsible="icon">
      <SidebarContent className="px-2">
        {/* Logo */}
        <div className="px-4 py-6 border-b flex justify-center">
          {!collapsed ? (
            <img 
              src="/lovable-uploads/4a78275e-0af1-4fd5-ae15-9d988197bca6.png" 
              alt="tanotado"
              className="h-12 w-auto"
            />
          ) : (
            <img 
              src="/lovable-uploads/4a78275e-0af1-4fd5-ae15-9d988197bca6.png" 
              alt="tanotado"
              className="h-8 w-8 object-contain"
            />
          )}
        </div>

        {/* Menu Único */}
        <SidebarGroup className="mt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className={`h-12 ${collapsed ? 'justify-center px-0' : ''}`}>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className={`h-5 w-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      {/* Trigger no final da sidebar */}
      <div className="p-2 border-t">
        <SidebarTrigger className="w-full" />
      </div>
    </Sidebar>
  );
}
