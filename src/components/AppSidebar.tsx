
import React from 'react';
import { 
  Calendar, 
  User, 
  FileText, 
  Settings,
  Plus,
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
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '../contexts/AuthContext';

const mainMenuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Agenda', url: '/agenda', icon: Calendar },
  { title: 'Clientes', url: '/clientes', icon: User },
  { title: 'Prontuários', url: '/prontuarios', icon: FileText },
  { title: 'Financeiro', url: '/financeiro', icon: DollarSign },
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
      ? "bg-gradient-to-r from-tanotado-pink/20 to-tanotado-purple/20 text-tanotado-navy font-medium" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarTrigger className="m-2 self-end" />
      
      <SidebarContent className="px-2">
        {/* Botão Novo Agendamento - no topo */}
        <div className="px-2 my-4">
          <NavLink 
            to="/agenda/novo"
            className="flex items-center justify-center h-12 bg-gradient-to-r from-tanotado-pink to-tanotado-purple text-white rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            <Plus className="h-5 w-5" />
            {!collapsed && <span className="ml-2 font-medium">Novo Agendamento</span>}
          </NavLink>
        </div>

        {/* Logo */}
        <div className="px-4 py-6 border-b">
          {!collapsed ? (
            <img 
              src="/lovable-uploads/a142e49f-c405-4af5-96d0-7ae0ebbb6627.png" 
              alt="tanotado"
              className="h-8 w-auto"
            />
          ) : (
            <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
          )}
        </div>

        {/* Informações do usuário com foto */}
        {!collapsed && user && (
          <div className="px-4 py-3 border-b">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" alt={user.name} />
                <AvatarFallback className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple text-white font-medium">
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {user.name}
                </div>
                {user.role === 'admin' && (
                  <div className="text-xs text-tanotado-purple flex items-center">
                    👑 Administrador
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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

        {/* Menu Admin - Só aparece para admins */}
        {user?.role === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-tanotado-navy font-semibold">
              {!collapsed && "Administração"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="h-12">
                    <NavLink to="/admin" className={getNavCls}>
                      <Shield className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="ml-3">Dashboard Admin</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

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
      </SidebarContent>
    </Sidebar>
  );
}
