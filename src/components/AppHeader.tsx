
import React from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '../contexts/AuthContext';

const AppHeader: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center space-x-4">
        <SidebarTrigger className="lg:hidden" />
      </div>

      <div className="flex items-center space-x-4">
        {/* Informações do usuário com foto */}
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt={user.name} />
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
      </div>
    </header>
  );
};

export default AppHeader;
