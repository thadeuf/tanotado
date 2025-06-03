
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Clock, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface WorkingHours {
  [key: string]: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface AgendaConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  const time = `${hour.toString().padStart(2, '0')}:${minute}`;
  return { value: time, label: time };
});

const INTERVAL_OPTIONS = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1 hora e 30 minutos' },
  { value: 120, label: '2 horas' },
];

const AgendaConfigDialog: React.FC<AgendaConfigDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    monday: { enabled: true, start: '09:00', end: '18:00' },
    tuesday: { enabled: true, start: '09:00', end: '18:00' },
    wednesday: { enabled: true, start: '09:00', end: '18:00' },
    thursday: { enabled: true, start: '09:00', end: '18:00' },
    friday: { enabled: true, start: '09:00', end: '18:00' },
    saturday: { enabled: false, start: '09:00', end: '12:00' },
    sunday: { enabled: false, start: '09:00', end: '12:00' },
  });
  const [appointmentDuration, setAppointmentDuration] = useState(60);
  const [breakTime, setBreakTime] = useState(15);

  // Buscar configurações do usuário
  const { data: userSettings } = useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Carregar configurações quando disponíveis
  useEffect(() => {
    if (userSettings) {
      if (userSettings.working_hours) {
        setWorkingHours(userSettings.working_hours as WorkingHours);
      }
      if (userSettings.appointment_duration) {
        setAppointmentDuration(userSettings.appointment_duration);
      }
      if (userSettings.break_time) {
        setBreakTime(userSettings.break_time);
      }
    }
  }, [userSettings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          working_hours: workingHours,
          appointment_duration: appointmentDuration,
          break_time: breakTime,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Configurações salvas",
        description: "As configurações da agenda foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error saving settings:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleDayToggle = (day: string, enabled: boolean) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled },
    }));
  };

  const handleTimeChange = (day: string, type: 'start' | 'end', time: string) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [type]: time },
    }));
  };

  const handleSave = () => {
    saveSettingsMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configurar Agenda
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Horários de funcionamento */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <Label className="text-sm font-medium">Exibir dias da semana:</Label>
            </div>
            
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{day.label}</Label>
                  <Switch
                    checked={workingHours[day.key]?.enabled || false}
                    onCheckedChange={(enabled) => handleDayToggle(day.key, enabled)}
                  />
                </div>
                
                {workingHours[day.key]?.enabled && (
                  <div className="flex items-center gap-2 ml-4">
                    <Select
                      value={workingHours[day.key]?.start || '09:00'}
                      onValueChange={(time) => handleTimeChange(day.key, 'start', time)}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time.value} value={time.value}>
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <span className="text-sm text-muted-foreground">às</span>
                    
                    <Select
                      value={workingHours[day.key]?.end || '18:00'}
                      onValueChange={(time) => handleTimeChange(day.key, 'end', time)}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time.value} value={time.value}>
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Duração dos agendamentos */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Intervalos da agenda</Label>
            <Select
              value={appointmentDuration.toString()}
              onValueChange={(value) => setAppointmentDuration(Number(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVAL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Voltar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saveSettingsMutation.isPending}
              className="flex-1 bg-gradient-to-r from-tanotado-pink to-tanotado-purple hover:shadow-lg transition-all duration-200"
            >
              {saveSettingsMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgendaConfigDialog;
