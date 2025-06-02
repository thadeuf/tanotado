
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import WeekNavigation from './WeekNavigation';
import TimeSlots from './TimeSlots';
import { Appointment } from '@/hooks/useAppointments';

interface WeekViewProps {
  weekDays: Date[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
  getDayAppointments: (date: Date) => Appointment[];
  formatWeekDayName: (date: Date) => string;
}

const WeekView: React.FC<WeekViewProps> = ({
  weekDays,
  selectedDate,
  setSelectedDate,
  onDateSelect,
  onTimeSelect,
  getDayAppointments,
  formatWeekDayName,
}) => {
  return (
    <>
      <WeekNavigation
        weekDays={weekDays}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        onDateSelect={onDateSelect}
        getDayAppointments={getDayAppointments}
        formatWeekDayName={formatWeekDayName}
      />

      <TimeSlots 
        selectedDate={selectedDate}
        onTimeSelect={onTimeSelect}
        appointments={getDayAppointments(selectedDate)}
      />
    </>
  );
};

export default WeekView;
