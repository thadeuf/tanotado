// Conteúdo para: src/components/ui/phone-input.tsx

import React from 'react';
import PhoneInput, { type PhoneInputProps } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const CustomPhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <PhoneInput
        ref={ref}
        className={cn("flex items-center", className)}
        inputComponent={Input}
        defaultCountry="BR"
        international
        countryCallingCodeEditable={false}
        {...props}
      />
    );
  }
);
CustomPhoneInput.displayName = 'CustomPhoneInput';

export { CustomPhoneInput };