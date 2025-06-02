
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { ptBR } from 'date-fns/locale';

interface DateSelectorProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onDateSelect }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Selecionar Data
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onDateSelect(date)}
          className="rounded-md border-0 p-3 pointer-events-auto w-full"
          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
          locale={ptBR}
        />
      </CardContent>
    </Card>
  );
};

export default DateSelector;
