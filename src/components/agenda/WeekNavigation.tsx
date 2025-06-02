
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WeekNavigationProps {
  weekDays: Date[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  onDateSelect: (date: Date) => void;
  getDayAppointments: (date: Date) => any[];
  formatWeekDayName: (date: Date) => string;
}

const WeekNavigation: React.FC<WeekNavigationProps> = ({
  weekDays,
  selectedDate,
  setSelectedDate,
  onDateSelect,
  getDayAppointments,
  formatWeekDayName,
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {format(weekDays[0], 'dd MMM', { locale: ptBR })} - {format(weekDays[6], 'dd MMM yyyy', { locale: ptBR })}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedDate(addDays(selectedDate, -7))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedDate(new Date())}
            >
              Hoje
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const dayAppointments = getDayAppointments(day);
            const isSelected = selectedDate.toDateString() === day.toDateString();
            const isTodayDate = new Date().toDateString() === day.toDateString();
            
            return (
              <div 
                key={index}
                className={`p-3 text-center cursor-pointer rounded-lg transition-colors ${
                  isSelected 
                    ? 'bg-tanotado-purple text-white' 
                    : isTodayDate 
                      ? 'bg-tanotado-blue/10 text-tanotado-blue border border-tanotado-blue/20'
                      : 'hover:bg-muted'
                }`}
                onClick={() => onDateSelect(day)}
              >
                <div className={`text-xs mb-1 ${
                  isSelected ? 'text-white' : 'text-muted-foreground'
                }`}>
                  {formatWeekDayName(day)}
                </div>
                <div className="font-medium">
                  {format(day, 'd')}
                </div>
                {dayAppointments.length > 0 && (
                  <div className="mt-1">
                    <div className={`w-2 h-2 rounded-full mx-auto ${
                      isSelected ? 'bg-white' : 'bg-tanotado-pink'
                    }`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeekNavigation;
