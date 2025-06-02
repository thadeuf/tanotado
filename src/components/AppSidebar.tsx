
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  User, 
  FileText, 
  Settings,
  Shield,
  DollarSign,
  LayoutDashboard,
  LogOut
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';

const mainMenuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Agenda', url: '/agenda', icon: Calendar },
  { title: 'Clientes', url: '/clientes', icon: User },
  { title: 'Prontuários', url: '/prontuarios', icon: FileText },
  { title: 'Financeiro', url: '/financeiro', icon: DollarSign },
];

const adminItem = { title: 'Admin', url: '/admin', icon: Shield };
const configItem = { title: 'Configurações', url: '/configuracoes', icon: Settings };

export function AppSidebar() {
  const { state, setOpen } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const currentPath = location.pathname;
  const isCollapsed = state === 'collapsed';

  // Inicializar sempre fechado
  useEffect(() => {
    setOpen(false);
  }, [setOpen]);

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-gradient-to-r from-tanotado-pink/20 to-tanotado-purple/20 text-tanotado-navy font-medium" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  const handleLogout = async () => {
    try {
      await logout();
      setOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleMenuItemClick = (url: string) => {
    navigate(url);
    setOpen(false);
  };

  const handleMouseEnter = () => {
    setOpen(true);
  };

  const handleMouseLeave = () => {
    setOpen(false);
  };

  // Criar array de itens combinados baseado no papel do usuário
  const allMenuItems = [
    ...mainMenuItems,
    ...(user?.role === 'admin' ? [adminItem] : []),
    configItem
  ];

  return (
    <div 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative z-50"
    >
      <Sidebar className="border-r" collapsible="icon">
        <SidebarTrigger className={`m-2 ${isCollapsed ? 'self-center' : 'self-end'}`} />
        
        <SidebarContent className={isCollapsed ? 'px-0' : 'px-2'}>
          {/* Logo */}
          <div className="py-8 flex justify-center items-center">
            {!isCollapsed ? (
              <img 
                src="/lovable-uploads/e9f368d9-2772-4192-8ba9-cb42acd149c0.png" 
                alt="tanotado"
                className="h-24 w-auto"
              />
            ) : (
              <img 
                src="/lovable-uploads/e257a8ed-f41d-4910-acd6-6c1ef051df1d.png" 
                alt="tanotado"
                className="w-8 h-8"
              />
            )}
          </div>

          {/* Menu Principal */}
          <SidebarGroup className="mt-4">
            <SidebarGroupContent>
              <SidebarMenu>
                {allMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      className={`h-12 w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start px-3'}`}
                    >
                      <button
                        onClick={() => handleMenuItemClick(item.url)}
                        className={`${getNavCls({ isActive: isActive(item.url) })} w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} cursor-pointer`}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span className="ml-3">{item.title}</span>}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer com botão de logout */}
        <SidebarFooter className={isCollapsed ? 'p-0' : 'p-2'}>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                className={`h-12 w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start px-3'}`}
              >
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  className={`w-full text-muted-foreground hover:text-foreground hover:bg-muted/50 ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span className="ml-3">Sair</span>}
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
