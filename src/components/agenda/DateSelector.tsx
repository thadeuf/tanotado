import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { ptBR } from 'date-fns/locale';
import { getDay } from 'date-fns';
import { useUserSettings } from '@/hooks/useUserSettings';

interface DateSelectorProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onDateSelect }) => {
  const { data: settings } = useUserSettings();

  const isDayDisabled = (date: Date): boolean => {
    // 1. Desabilita datas passadas
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
      return true;
    }

    // 2. Verifica as configurações de dias de trabalho
    if (settings && settings.working_hours) {
      const workingDays = settings.working_hours as any;
      const dayOfWeek = getDay(date); // 0: Domingo, 1: Segunda, ..., 6: Sábado

      const dayKeyMap: { [key: number]: string } = {
        0: 'sunday',
        1: 'monday',
        2: 'tuesday',
        3: 'wednesday',
        4: 'thursday',
        5: 'friday',
        6: 'saturday',
      };

      const dayKey = dayKeyMap[dayOfWeek];
      
      // Se a configuração para o dia da semana existir e estiver desmarcada (enabled: false)
      if (workingDays[dayKey] && workingDays[dayKey].enabled === false) {
        return true;
      }
    }
    
    // Se nenhuma regra de desativação for atendida, o dia é habilitado.
    return false;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Selecionar Data
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          locale={ptBR}
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onDateSelect(date)}
          className="rounded-md border-0 p-0 pointer-events-auto"
          disabled={isDayDisabled}
        />
      </CardContent>
    </Card>
  );
};

export default DateSelector;