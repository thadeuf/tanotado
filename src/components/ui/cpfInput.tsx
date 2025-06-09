// src/components/ui/CpfInput.tsx

import React from 'react';
import { IMaskInput } from 'react-imask';
import { Input } from '@/components/ui/input';

// Usamos forwardRef para que o react-hook-form consiga se conectar a ele
export const CpfInput = React.forwardRef<HTMLInputElement, any>(
  (props, ref) => {
    const { onChange, ...rest } = props;

    return (
      <IMaskInput
        mask="000.000.000-00"
        as={Input} // Usa o estilo do seu componente de Input
        inputRef={ref} // Conecta a referência do react-hook-form
        onAccept={(value) => {
          // Garante que o onChange receba o valor correto (só os números)
          // Se precisar do valor com máscara, remova a propriedade `unmask`
          onChange({ target: { value } });
        }}
        unmask={true} // Salva apenas os números
        placeholder="000.000.000-00"
        {...rest} // Passa o resto das props, como 'value', 'name', etc.
      />
    );
  }
);

CpfInput.displayName = 'CpfInput';