
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isSameDay, format } from 'date-fns';
import { useClients } from '@/hooks/useClients';
import { useAppointments } from '@/hooks/useAppointments';
import { appointmentSchema, AppointmentFormData } from '@/schemas/appointmentSchema';

interface UseAppointmentFormStateProps {
  selectedTime?: string;
  initialSelectedDate?: Date;
}

export const useAppointmentFormState = ({ 
  selectedTime, 
  initialSelectedDate 
}: UseAppointmentFormStateProps) => {
  const { data: clients = [] } = useClients();
  const { data: appointments = [] } = useAppointments();
  const [timeConflictWarning, setTimeConflictWarning] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(initialSelectedDate || new Date());
  const [showRecurrenceDialog, setShowRecurrenceDialog] = useState(false);
  const [recurrenceConflicts, setRecurrenceConflicts] = useState<any[]>([]);
  const [recurrenceDates, setRecurrenceDates] = useState<Date[]>([]);
  const [pendingFormData, setPendingFormData] = useState<AppointmentFormData | null>(null);

  console.log('useAppointmentFormState - clients loaded:', clients?.length || 0);

  const getDefaultEndTime = (startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + 1;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      clientId: '',
      description: '',
      title: '',
      price: '',
      startTime: selectedTime || '09:00',
      endTime: selectedTime ? getDefaultEndTime(selectedTime) : '10:00',
      appointmentType: 'presencial',
      videoCallLink: '',
      createFinancialRecord: true,
      color: '#8B5CF6',
      sessionType: 'unique',
      recurrenceType: 'weekly',
      recurrenceCount: 1,
    },
  });

  const sessionType = form.watch('sessionType');
  const appointmentType = form.watch('appointmentType');
  const selectedClientId = form.watch('clientId');
  const watchCreateFinancialRecord = form.watch('createFinancialRecord');
  const startTime = form.watch('startTime');
  const endTime = form.watch('endTime');
  const recurrenceType = form.watch('recurrenceType');
  const recurrenceCount = form.watch('recurrenceCount');

  console.log('useAppointmentFormState - sessionType:', sessionType);
  console.log('useAppointmentFormState - selectedClientId:', selectedClientId);

  const checkTimeConflict = (startTime: string, endTime: string) => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const newStartDateTime = new Date(selectedDate);
    newStartDateTime.setHours(startHours, startMinutes, 0, 0);
    
    const newEndDateTime = new Date(selectedDate);
    newEndDateTime.setHours(endHours, endMinutes, 0, 0);

    const conflictingAppointment = appointments.find(appointment => {
      const appointmentDate = new Date(appointment.start_time);
      const appointmentEndDate = new Date(appointment.end_time);
      
      if (!isSameDay(appointmentDate, selectedDate)) {
        return false;
      }

      return (
        (newStartDateTime >= appointmentDate && newStartDateTime < appointmentEndDate) ||
        (newEndDateTime > appointmentDate && newEndDateTime <= appointmentEndDate) ||
        (newStartDateTime <= appointmentDate && newEndDateTime >= appointmentEndDate)
      );
    });

    if (conflictingAppointment) {
      const conflictStart = format(new Date(conflictingAppointment.start_time), 'HH:mm');
      const conflictEnd = format(new Date(conflictingAppointment.end_time), 'HH:mm');
      return `Já existe um agendamento neste horário: ${conflictingAppointment.title} (${conflictStart} - ${conflictEnd})`;
    }

    return '';
  };

  // Effects
  useEffect(() => {
    if (startTime) {
      const defaultEnd = getDefaultEndTime(startTime);
      form.setValue('endTime', defaultEnd);
    }
  }, [startTime, form]);

  useEffect(() => {
    console.log('useAppointmentFormState - sessionType effect:', sessionType);
    if (sessionType === 'personal') {
      form.setValue('clientId', '');
      form.setValue('createFinancialRecord', false);
      form.setValue('price', '');
    } else {
      form.setValue('createFinancialRecord', true);
    }
  }, [sessionType, form]);

  useEffect(() => {
    if (selectedClientId && sessionType !== 'personal') {
      const selectedClient = clients.find(client => client.id === selectedClientId);
      if (selectedClient && selectedClient.session_value) {
        form.setValue('price', selectedClient.session_value);
      }
    }
  }, [selectedClientId, clients, sessionType, form]);

  useEffect(() => {
    if (startTime && endTime && sessionType !== 'recurring') {
      const conflict = checkTimeConflict(startTime, endTime);
      setTimeConflictWarning(conflict);
    } else {
      setTimeConflictWarning('');
    }
  }, [startTime, endTime, appointments, selectedDate, sessionType]);

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
    selectedClientId,
    watchCreateFinancialRecord,
    startTime,
    endTime,
    recurrenceType,
    recurrenceCount,
    checkTimeConflict,
  };
};
