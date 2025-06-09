import { format, parse, startOfWeek, getDay } from 'date-fns';
import { dateFnsLocalizer } from 'react-big-calendar';
import { ptBR } from 'date-fns/locale';

const locales = {
  'pt-BR': ptBR,
};

export const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { locale: ptBR }),
  getDay,
  locales,
});