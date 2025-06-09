import React from 'react';
import DatePicker from 'react-datepicker';
import { parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { Input } from '@/components/ui/input';

export const DateInput = React.forwardRef<
  HTMLInputElement,
  {
    value: Date | null;
    onChange: (date: Date | null) => void;
    placeholder?: string;
  }
>(({ value, onChange, placeholder = 'dd/mm/aaaa' }, ref) => {
  const handleRawChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e?.target?.value;
    if (rawInput) {
      const raw = rawInput.replace(/\D/g, '');
      if (raw.length === 8) {
        const formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`;
        const parsed = parse(formatted, 'dd/MM/yyyy', new Date());
        if (!isNaN(parsed.getTime())) {
          onChange(parsed);
        }
      }
    }
  };

  return (
    <DatePicker
      locale={ptBR}
      selected={value}
      onChange={onChange}
      dateFormat="dd/MM/yyyy"
      placeholderText={placeholder}
      customInput={<Input ref={ref} />}
      onChangeRaw={handleRawChange}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
    />
  );
});

DateInput.displayName = 'DateInput';
