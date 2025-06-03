
import { isSameDay, format, addWeeks, addMonths } from 'date-fns';
import { useAppointments } from '@/hooks/useAppointments';

export const useAppointmentRecurrence = () => {
  const { data: appointments = [] } = useAppointments();

  const generateRecurrenceDates = (
    startDate: Date,
    type: 'weekly' | 'biweekly' | 'monthly',
    count: number
  ): Date[] => {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);

    for (let i = 0; i < count; i++) {
      dates.push(new Date(currentDate));
      
      switch (type) {
        case 'weekly':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'biweekly':
          currentDate = addWeeks(currentDate, 2);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
      }
    }

    return dates;
  };

  const checkRecurrenceConflicts = (dates: Date[], startTime: string, endTime: string) => {
    const conflicts: any[] = [];
    
    dates.forEach(date => {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      const newStartDateTime = new Date(date);
      newStartDateTime.setHours(startHours, startMinutes, 0, 0);
      
      const newEndDateTime = new Date(date);
      newEndDateTime.setHours(endHours, endMinutes, 0, 0);

      const conflictingAppointment = appointments.find(appointment => {
        const appointmentDate = new Date(appointment.start_time);
        const appointmentEndDate = new Date(appointment.end_time);
        
        if (!isSameDay(appointmentDate, date)) {
          return false;
        }

        return (
          (newStartDateTime >= appointmentDate && newStartDateTime < appointmentEndDate) ||
          (newEndDateTime > appointmentDate && newEndDateTime <= appointmentEndDate) ||
          (newStartDateTime <= appointmentDate && newEndDateTime >= appointmentEndDate)
        );
      });

      if (conflictingAppointment) {
        conflicts.push({
          date,
          time: format(new Date(conflictingAppointment.start_time), 'HH:mm'),
          title: conflictingAppointment.title || 'Consulta'
        });
      }
    });

    return conflicts;
  };

  return {
    generateRecurrenceDates,
    checkRecurrenceConflicts,
  };
};
