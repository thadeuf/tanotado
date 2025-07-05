//src/components/ui/CpfInput.tsx -- Ajustei o nome do arquivo

import React, { useEffect } from 'react';
import { useIMask } from 'react-imask';
import { Input } from '@/components/ui/input';

// O tipo 'any' foi usado para simplificar a passagem de props do react-hook-form,
// mas pode ser tipado de forma mais estrita se necessário.
export const CpfInput = React.forwardRef<HTMLInputElement, any>((props, forwardedRef) => {
  const { onChange, name, value, ...rest } = props;

  const {
    ref,
    setValue,
  } = useIMask(
    {
      mask: '000.000.000-00',
    },
    {
      // A função onAccept é chamada quando o valor é alterado e aceito pela máscara
      onAccept: (acceptedValue) => {
        if (onChange) {
          // Criamos um evento sintético para compatibilidade com handlers de formulário
          const event = {
            target: {
              name: name,
              value: acceptedValue,
            },
          };
          onChange(event);
        }
      },
    }
  );

  // Sincroniza o valor do estado do formulário com o valor interno da máscara
  useEffect(() => {
    setValue(value || '');
  }, [value, setValue]);
  
  // Combina o ref do 'useIMask' com o ref passado para o componente
  React.useImperativeHandle(forwardedRef, () => ref.current as HTMLInputElement);

  // Renderiza o componente Input do shadcn, garantindo que todas as props e estilos sejam aplicados
  return (
    <Input
      {...rest}
      ref={ref}
      name={name}
      defaultValue={value}
      placeholder="000.000.000-00"
    />
  );
});

CpfInput.displayName = 'CpfInput';