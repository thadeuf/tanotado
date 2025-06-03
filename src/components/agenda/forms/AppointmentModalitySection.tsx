
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Video, MapPin } from 'lucide-react';
import { Control, FieldValues } from 'react-hook-form';

interface AppointmentModalitySectionProps {
  control: Control<any>;
  watchAppointmentType: string;
}

const AppointmentModalitySection: React.FC<AppointmentModalitySectionProps> = ({ 
  control, 
  watchAppointmentType 
}) => {
  return (
    <>
      <FormField
        control={control}
        name="appointmentType"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Modalidade da Sessão
            </FormLabel>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={field.value === 'remoto'}
                  onCheckedChange={(checked) => 
                    field.onChange(checked ? 'remoto' : 'presencial')
                  }
                />
                <div className="flex items-center gap-2">
                  {field.value === 'remoto' ? (
                    <>
                      <Video className="h-4 w-4 text-blue-500" />
                      <span>Online</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 text-green-500" />
                      <span>Presencial</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {watchAppointmentType === 'remoto' && (
        <FormField
          control={control}
          name="videoCallLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link da Reunião Online</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://meet.google.com/..."
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
};

export default AppointmentModalitySection;
