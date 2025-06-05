
import React from 'react';
import { 
  Calendar, 
  User, 
  FileText, 
  Settings,
  Plus
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '../contexts/AuthContext';

const mainMenuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Calendar },
  { title: 'Agenda', url: '/agenda', icon: Calendar },
  { title: 'Clientes', url: '/clientes', icon: User },
  { title: 'Prontuários', url: '/prontuarios', icon: FileText },
];

const configItems = [
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-gradient-to-r from-tanotado-pink/20 to-tanotado-purple/20 text-tanotado-navy font-medium border-r-2 border-tanotado-pink" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarTrigger className="m-2 self-end" />
      
      <SidebarContent className="px-2">
        {/* Logo */}
        <div className="px-4 py-6 border-b">
          {!collapsed ? (
            <h1 className="tanotado-logo text-2xl">tanotado</h1>
          ) : (
            <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
          )}
        </div>

        {/* Menu Principal */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-tanotado-navy font-semibold">
            {!collapsed && "Menu Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12">
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="ml-3">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Botão Novo Agendamento */}
        <div className="px-2 my-4">
          <NavLink 
            to="/agenda/novo"
            className="flex items-center justify-center h-12 bg-gradient-to-r from-tanotado-pink to-tanotado-purple text-white rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            <Plus className="h-5 w-5" />
            {!collapsed && <span className="ml-2 font-medium">Novo Agendamento</span>}
          </NavLink>
        </div>

        {/* Configurações */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {configItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12">
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="ml-3">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Status da Assinatura */}
        {!collapsed && user && (
          <div className="mt-auto p-4 border-t">
            <div className="text-xs text-muted-foreground mb-2">Status da Conta</div>
            <div className={`px-3 py-2 rounded-lg text-xs font-medium ${
              user.subscriptionStatus === 'trial' 
                ? 'bg-tanotado-yellow/20 text-tanotado-navy' 
                : user.subscriptionStatus === 'active'
                ? 'bg-tanotado-green/20 text-tanotado-green'
                : 'bg-red-100 text-red-700'
            }`}>
              {user.subscriptionStatus === 'trial' && 'Teste Gratuito'}
              {user.subscriptionStatus === 'active' && 'Assinante Ativo'}
              {user.subscriptionStatus === 'expired' && 'Assinatura Expirada'}
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
