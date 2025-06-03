
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Calendar } from 'lucide-react';
import { useAppointmentFormState } from '@/hooks/useAppointmentFormState';
import { useAppointmentMutations } from '@/hooks/useAppointmentMutations';
import { useAppointmentRecurrence } from '@/hooks/useAppointmentRecurrence';
import { AppointmentFormData } from '@/schemas/appointmentSchema';
import AppointmentTypeSelector from './forms/AppointmentTypeSelector';
import AppointmentClientSelector from './forms/AppointmentClientSelector';
import AppointmentTimeFields from './forms/AppointmentTimeFields';
import AppointmentModalitySection from './forms/AppointmentModalitySection';
import AppointmentFinancialSection from './forms/AppointmentFinancialSection';
import AppointmentColorSelector from './forms/AppointmentColorSelector';
import AppointmentObservations from './forms/AppointmentObservations';
import AppointmentDateSelector from './forms/AppointmentDateSelector';
import AppointmentConflictAlert from './forms/AppointmentConflictAlert';
import AppointmentFormActions from './forms/AppointmentFormActions';
import AppointmentRecurrenceSection from './forms/AppointmentRecurrenceSection';
import AppointmentRecurrenceConfirmDialog from './forms/AppointmentRecurrenceConfirmDialog';
import AppointmentTitleField from './forms/AppointmentTitleField';

interface AppointmentFormProps {
  selectedDate?: Date;
  selectedTime?: string;
  onClose: () => void;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ 
  selectedDate: initialSelectedDate, 
  selectedTime, 
  onClose 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createAppointmentMutation } = useAppointmentMutations();
  const { generateRecurrenceDates, checkRecurrenceConflicts } = useAppointmentRecurrence();

  const {
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
  } = useAppointmentFormState({ 
    selectedTime, 
    initialSelectedDate 
  });

  const onSubmit = async (data: AppointmentFormData) => {
    if (data.sessionType === 'recurring' && data.recurrenceType && data.recurrenceCount) {
      const dates = generateRecurrenceDates(selectedDate, data.recurrenceType, data.recurrenceCount);
      const conflicts = checkRecurrenceConflicts(dates, data.startTime, data.endTime);
      
      setRecurrenceDates(dates);
      setRecurrenceConflicts(conflicts);
      setPendingFormData(data);
      setShowRecurrenceDialog(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await createAppointmentMutation.mutateAsync({ data, selectedDate });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecurrenceConfirm = async () => {
    if (!pendingFormData) return;
    
    setIsSubmitting(true);
    setShowRecurrenceDialog(false);
    
    try {
      await createAppointmentMutation.mutateAsync({ 
        data: pendingFormData, 
        selectedDate 
      });
      onClose();
    } finally {
      setIsSubmitting(false);
      setPendingFormData(null);
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Novo Agendamento
            </DialogTitle>
          </DialogHeader>

          <AppointmentDateSelector 
            control={form.control}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />

          <AppointmentConflictAlert conflictMessage={timeConflictWarning} />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <AppointmentTypeSelector control={form.control} />
              
              <AppointmentTitleField 
                control={form.control} 
                sessionType={sessionType} 
              />
              
              <AppointmentClientSelector control={form.control} sessionType={sessionType} />
              <AppointmentTimeFields control={form.control} />
              
              <AppointmentRecurrenceSection 
                control={form.control} 
                sessionType={sessionType}
                watchRecurrenceType={recurrenceType || ''}
              />
              
              {sessionType !== 'personal' && (
                <AppointmentModalitySection 
                  control={form.control} 
                  watchAppointmentType={appointmentType} 
                />
              )}

              {sessionType !== 'personal' && (
                <AppointmentFinancialSection 
                  control={form.control} 
                  watchCreateFinancialRecord={watchCreateFinancialRecord} 
                />
              )}

              <AppointmentColorSelector control={form.control} />
              <AppointmentObservations control={form.control} sessionType={sessionType} />
              <AppointmentFormActions 
                onCancel={onClose} 
                isSubmitting={isSubmitting} 
                submitLabel="Criar Agendamento" 
              />
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AppointmentRecurrenceConfirmDialog
        isOpen={showRecurrenceDialog}
        onClose={() => {
          setShowRecurrenceDialog(false);
          setPendingFormData(null);
        }}
        onConfirm={handleRecurrenceConfirm}
        conflicts={recurrenceConflicts}
        recurrenceDates={recurrenceDates}
        isLoading={isSubmitting}
      />
    </>
  );
};

export default AppointmentForm;
