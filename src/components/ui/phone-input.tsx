import React from 'react';
import 'react-phone-number-input/style.css';
import PhoneInput, { type PhoneInputProps } from 'react-phone-number-input';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

type CustomPhoneInputProps = Omit<PhoneInputProps, 'onChange'> & {
  onChange: (value?: string) => void;
  className?: string;
};

const CustomPhoneInput = React.forwardRef<HTMLInputElement, CustomPhoneInputProps>(
  ({ className, onChange, ...props }, ref) => {
    return (
      <PhoneInput
        international
        withCountryCallingCode
        defaultCountry="BR"
        // --- INÍCIO DA ALTERAÇÃO ---
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          'phone-input-container', // Mantemos esta classe para estilos específicos
          className
        )}
        // --- FIM DA ALTERAÇÃO ---
        inputComponent={Input}
        onChange={onChange}
        {...props}
        ref={ref}
      />
    );
  }
);

CustomPhoneInput.displayName = 'CustomPhoneInput';

export { CustomPhoneInput };