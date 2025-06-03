
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useMemo } from 'react';
import { useAppointments } from '@/hooks/useAppointments';
import { isSameDay, format } from 'date-fns';
import { appointmentSchema, AppointmentFormData } from '@/schemas/appointmentSchema';

interface UseAppointmentFormStateProps {
  selectedTime?: string;
  initialSelectedDate?: Date;
}

export const useAppointmentFormState = ({ 
  selectedTime, 
  initialSelectedDate 
}: UseAppointmentFormStateProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(initialSelectedDate || new Date());
  const [timeConflictWarning, setTimeConflictWarning] = useState<string>('');
  const [showRecurrenceDialog, setShowRecurrenceDialog] = useState(false);
  const [recurrenceConflicts, setRecurrenceConflicts] = useState<any[]>([]);
  const [recurrenceDates, setRecurrenceDates] = useState<Date[]>([]);
  const [pendingFormData, setPendingFormData] = useState<AppointmentFormData | null>(null);

  const { data: appointments = [] } = useAppointments();

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      startTime: selectedTime || '09:00',
      endTime: selectedTime ? 
        `${String(parseInt(selectedTime.split(':')[0]) + 1).padStart(2, '0')}:${selectedTime.split(':')[1]}` : 
        '10:00',
      appointmentType: 'presencial',
      createFinancialRecord: true,
      color: '#8B5CF6',
      sessionType: 'unique',
      recurrenceCount: 4,
    },
  });

  // Watch form values
  const sessionType = useWatch({ control: form.control, name: 'sessionType' });
  const appointmentType = useWatch({ control: form.control, name: 'appointmentType' });
  const watchCreateFinancialRecord = useWatch({ control: form.control, name: 'createFinancialRecord' });
  const recurrenceType = useWatch({ control: form.control, name: 'recurrenceType' });
  const startTime = useWatch({ control: form.control, name: 'startTime' });
  const endTime = useWatch({ control: form.control, name: 'endTime' });

  // Memoize appointments for the selected date to avoid unnecessary recalculations
  const dayAppointments = useMemo(() => {
    return appointments.filter(appointment => 
      isSameDay(new Date(appointment.start_time), selectedDate)
    );
  }, [appointments, selectedDate]);

  // Check for time conflicts with debounced effect
  useEffect(() => {
    if (!startTime || !endTime || !selectedDate) {
      setTimeConflictWarning('');
      return;
    }

    const timeoutId = setTimeout(() => {
      const conflictingAppointment = dayAppointments.find(appointment => {
        const appointmentDate = new Date(appointment.start_time);
        const appointmentEndDate = new Date(appointment.end_time);
        
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        
        const newStartDateTime = new Date(selectedDate);
        newStartDateTime.setHours(startHours, startMinutes, 0, 0);
        
        const newEndDateTime = new Date(selectedDate);
        newEndDateTime.setHours(endHours, endMinutes, 0, 0);

        return (
          (newStartDateTime >= appointmentDate && newStartDateTime < appointmentEndDate) ||
          (newEndDateTime > appointmentDate && newEndDateTime <= appointmentEndDate) ||
          (newStartDateTime <= appointmentDate && newEndDateTime >= appointmentEndDate)
        );
      });

      if (conflictingAppointment) {
        const conflictTime = format(new Date(conflictingAppointment.start_time), 'HH:mm');
        setTimeConflictWarning(
          `Já existe um agendamento às ${conflictTime} para ${conflictingAppointment.client?.name || 'este horário'}.`
        );
      } else {
        setTimeConflictWarning('');
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [startTime, endTime, dayAppointments]);

  return {
    form,
    selectedDate,
    setSelectedDate,
    timeConflictWarning,
    showRecurrenceDialog,
    setShowRecurrenceDialog,
    recurrenceConflicts,
    setRecurrenceConflicts,
    recurrenceDates,
    setRecurrenceDates,
    pendingFormData,
    setPendingFormData,
    sessionType,
    appointmentType,
    watchCreateFinancialRecord,
    recurrenceType,
  };
};
