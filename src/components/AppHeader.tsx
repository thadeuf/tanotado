
import React, { useState } from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AppointmentForm from './agenda/AppointmentForm';

const AppHeader: React.FC = () => {
  const { user } = useAuth();
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);

  if (!user) return null;

  const handleNewAppointment = () => {
    setShowAppointmentForm(true);
  };

  const handleFormClose = () => {
    setShowAppointmentForm(false);
  };

  return (
    <>
      <header className="h-16 border-b bg-white flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <SidebarTrigger className="lg:hidden" />
        </div>

        <div className="flex items-center space-x-4">
          {/* Botão Novo Agendamento */}
          <Button
            onClick={handleNewAppointment}
            size="sm"
            className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple hover:shadow-lg transition-all duration-200 gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo Agendamento</span>
          </Button>

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

      {/* Modal do formulário de agendamento */}
      {showAppointmentForm && (
        <AppointmentForm
          selectedDate={new Date()}
          selectedTime="09:00"
          onClose={handleFormClose}
        />
      )}
    </>
  );
};

export default AppHeader;
