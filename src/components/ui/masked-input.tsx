import React from 'react';
import { Input, type InputProps } from "@/components/ui/input";

// Função simples para aplicar a máscara
const applyMask = (value: string, mask: string): string => {
  let i = 0;
  const v = value.replace(/\D/g, ''); // Remove tudo que não é dígito
  return mask.replace(/#/g, () => v[i++] || '');
};

interface MaskedInputProps extends InputProps {
  mask: string;
}

export const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, onChange, ...props }, ref) => {
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const unmaskedValue = e.target.value.replace(/\D/g, '');
      const maskedValue = applyMask(unmaskedValue, mask);
      
      // Criamos um evento "fake" para passar para o react-hook-form
      const event = {
        ...e,
        target: {
          ...e.target,
          value: maskedValue,
        },
      };

      // Chama o onChange do formulário com o valor mascarado
      if (onChange) {
        onChange(event);
      }
    };

    return <Input ref={ref} onChange={handleInputChange} {...props} />;
  }
);

MaskedInput.displayName = 'MaskedInput';