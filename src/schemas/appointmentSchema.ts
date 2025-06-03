
import { z } from 'zod';

export const appointmentSchema = z.object({
  clientId: z.string().optional(),
  description: z.string().optional(),
  title: z.string().optional(),
  price: z.string().optional(),
  startTime: z.string().min(1, 'Horário de início é obrigatório'),
  endTime: z.string().min(1, 'Horário de fim é obrigatório'),
  appointmentType: z.enum(['presencial', 'remoto']),
  videoCallLink: z.string().optional(),
  createFinancialRecord: z.boolean(),
  color: z.string(),
  sessionType: z.enum(['unique', 'recurring', 'personal']),
  recurrenceType: z.enum(['weekly', 'biweekly', 'monthly']).optional(),
  recurrenceCount: z.number().min(1).max(52).optional(),
}).refine((data) => {
  if (data.sessionType !== 'personal' && !data.clientId) {
    return false;
  }
  return true;
}, {
  message: "Cliente é obrigatório para agendamentos que não sejam compromissos pessoais",
  path: ["clientId"]
}).refine((data) => {
  const start = data.startTime.split(':').map(Number);
  const end = data.endTime.split(':').map(Number);
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  return endMinutes > startMinutes;
}, {
  message: "Horário de fim deve ser posterior ao horário de início",
  path: ["endTime"]
}).refine((data) => {
  if (data.sessionType !== 'personal' && data.appointmentType === 'remoto' && !data.videoCallLink?.trim()) {
    return false;
  }
  return true;
}, {
  message: "Link da videochamada é obrigatório para agendamentos remotos",
  path: ["videoCallLink"]
}).refine((data) => {
  if (data.sessionType === 'recurring' && (!data.recurrenceType || !data.recurrenceCount)) {
    return false;
  }
  return true;
}, {
  message: "Tipo e quantidade de recorrência são obrigatórios para sessões recorrentes",
  path: ["recurrenceType"]
}).refine((data) => {
  // Validar que o preço é obrigatório quando vai gerar financeiro e não é compromisso pessoal
  if (data.sessionType !== 'personal' && data.createFinancialRecord && !data.price?.trim()) {
    return false;
  }
  return true;
}, {
  message: "Valor é obrigatório quando o registro financeiro está habilitado",
  path: ["price"]
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;
