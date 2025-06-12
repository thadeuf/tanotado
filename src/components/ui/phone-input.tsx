import React, { useEffect } from 'react';
import { useIMask } from 'react-imask';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const CustomPhoneInput = React.forwardRef<HTMLInputElement, any>(
  ({ className, onChange, name, value, ...props }, forwardedRef) => {
    
    const {
      ref,
      setValue,
    } = useIMask(
      {
        mask: '(00) 00000-0000',
      },
      {
        onAccept: (acceptedValue: string) => {
          if (onChange) {
            const event = {
              target: {
                name: name || 'whatsapp',
                value: acceptedValue,
              },
            };
            onChange(event);
          }
        },
      }
    );

    useEffect(() => {
      setValue(value || '');
    }, [value, setValue]);

    React.useImperativeHandle(forwardedRef, () => ref.current as HTMLInputElement);

    return (
      <Input
        {...props}
        ref={ref}
        name={name}
        className={cn(className)}
        defaultValue={value}
        placeholder="(21) 99999-9999"
      />
    );
  }
);

CustomPhoneInput.displayName = 'CustomPhoneInput';

export { CustomPhoneInput };