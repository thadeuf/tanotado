import React from 'react';
// ATENÇÃO: O ícone Sparkles foi adicionado para a nova página
import { Calendar, User, Settings, Shield, DollarSign, LayoutDashboard, LogOut, LifeBuoy, Sparkles } from 'lucide-react'; 
import { NavLink, useLocation } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '../contexts/AuthContext';

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, logout } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const getDynamicClientsTitle = () => {
    const nomenclature = user?.clientNomenclature || 'Cliente';
    const capitalized = nomenclature.charAt(0).toUpperCase() + nomenclature.slice(1);
    if (capitalized.endsWith('s')) {
      return capitalized;
    }
    return `${capitalized}s`;
  };

  const menuItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Agenda', url: '/agenda', icon: Calendar },
    { 
      title: getDynamicClientsTitle(),
      url: '/clientes', 
      icon: User 
    },
    { title: 'Financeiro', url: '/financeiro', icon: DollarSign },
    // NOVO ITEM DE MENU ADICIONADO ABAIXO
    { title: 'Posts com IA', url: '/posts-ia', icon: Sparkles },
    { title: 'Ajuda', url: '/ajuda', icon: LifeBuoy },
    { title: 'Configurações', url: '/configuracoes', icon: Settings },
    ...(user?.role === 'admin' ? [{ title: 'Dashboard Admin', url: '/admin', icon: Shield }] : [])
  ];

  const getNavCls = ({ isActive }: { isActive: boolean; }) =>
    isActive
      ? "bg-gradient-to-r from-tanotado-pink/20 to-tanotado-purple/20 text-tanotado-navy font-medium"
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  const handleLogout = () => {
    logout();
  };

  return (
    <Sidebar className="border-r" collapsible="icon">
      <SidebarContent className="px-0 flex flex-col">
        {/* Logo */}
        <div className="px-4 py-6 flex justify-center">
          {!collapsed ? (
            <img src="/lovable-uploads/4a78275e-0af1-4fd5-ae15-9d988197bca6.png" alt="tanotado" className="h-16 w-auto" />
          ) : (
            <div className="w-8 h-8 flex items-center justify-center">
              <img src="/lovable-uploads/4a78275e-0af1-4fd5-ae15-9d988197bca6.png" alt="tanotado" className="h-6 w-6 object-contain" />
            </div>
          )}
        </div>

        {/* --- INÍCIO DA CORREÇÃO DE LAYOUT --- */}
        <div className="flex-1 overflow-y-auto">
          <SidebarMenu className="px-2 py-4">
            {/* Itens principais do menu */}
            {menuItems.map(item => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild className={`h-12 ${collapsed ? 'justify-center px-3' : 'px-4'}`}>
                  <NavLink to={item.url} className={getNavCls}>
                    <item.icon className={`h-5 w-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} />
                    {!collapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}

            {/* Botão Sair de volta na lista principal */}
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} className={`h-12 w-full text-left hover:bg-destructive/10 hover:text-destructive ${collapsed ? 'justify-center px-3' : 'px-4'}`}>
                <LogOut className={`h-5 w-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} />
                {!collapsed && <span>Sair</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
        
        {/* Rodapé da Sidebar com o botão de recolher */}
        <div className="mt-auto p-2 border-t">
          <SidebarTrigger className="w-full" />
        </div>
        {/* --- FIM DA CORREÇÃO DE LAYOUT --- */}
      </SidebarContent>
    </Sidebar>
  );
}