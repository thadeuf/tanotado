
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Filter, Plus, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import AgendaConfigDialog from './AgendaConfigDialog';

interface AgendaHeaderProps {
  viewMode: 'week' | 'month';
  setViewMode: (mode: 'week' | 'month') => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  onNewAppointment: () => void;
}

const AgendaHeader: React.FC<AgendaHeaderProps> = ({
  viewMode,
  setViewMode,
  filterStatus,
  setFilterStatus,
  onNewAppointment,
}) => {
  const [showConfigDialog, setShowConfigDialog] = useState(false);

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-tanotado-navy">Agenda</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus agendamentos e consultas
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                {viewMode === 'week' ? 'Semana' : 'Mês'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={viewMode} onValueChange={(value) => setViewMode(value as 'week' | 'month')}>
                <DropdownMenuRadioItem value="week">Visão Semanal</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="month">Visão Mensal</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={filterStatus} onValueChange={setFilterStatus}>
                <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="scheduled">Agendados</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="completed">Concluídos</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="cancelled">Cancelados</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Configurações */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfigDialog(true)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Configurar</span>
          </Button>

          {/* New Appointment */}
          <Button 
            onClick={onNewAppointment}
            className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple hover:shadow-lg transition-all duration-200 gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo Agendamento</span>
          </Button>
        </div>
      </div>

      {/* Dialog de Configuração */}
      <AgendaConfigDialog 
        open={showConfigDialog}
        onOpenChange={setShowConfigDialog}
      />
    </>
  );
};

export default AgendaHeader;
