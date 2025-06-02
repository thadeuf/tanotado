
import React from 'react';
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
  const { state } = useSidebar();
  const location = useLocation();
  const { user, logout } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-gradient-to-r from-tanotado-pink/20 to-tanotado-purple/20 text-tanotado-navy font-medium" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Criar array de itens combinados baseado no papel do usuário
  const allMenuItems = [
    ...mainMenuItems,
    ...(user?.role === 'admin' ? [adminItem] : []),
    configItem
  ];

  return (
    <Sidebar className="border-r" collapsible="icon">
      <SidebarTrigger className="m-2 self-end" />
      
      <SidebarContent className="px-2">
        {/* Logo */}
        <div className="px-4 py-6 flex justify-center">
          {!collapsed ? (
            <img 
              src="/lovable-uploads/e9f368d9-2772-4192-8ba9-cb42acd149c0.png" 
              alt="tanotado"
              className="h-16 w-auto"
            />
          ) : (
            <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
          )}
        </div>

        {/* Menu Principal */}
        <SidebarGroup className="mt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              {allMenuItems.map((item) => (
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

      {/* Footer com botão de logout */}
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-12">
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="ml-3">Sair</span>}
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
