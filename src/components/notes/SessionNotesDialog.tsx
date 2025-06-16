// src/components/notes/SessionNotesDialog.tsx

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Supabase & Auth
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment } from '@/hooks/useAppointments';
import { toast } from '@/hooks/use-toast';

// UI Components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Form, FormControl, FormItem, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Loader2, Save, User } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

// Schema para o formulário de anotações
const noteSchema = z.object({
  content: z.any().optional(),
});
type NoteFormData = z.infer<typeof noteSchema>;

interface SessionNotesDialogProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SessionNotesDialog: React.FC<SessionNotesDialogProps> = ({ appointment, isOpen, onOpenChange }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Busca a anotação existente para este agendamento
  const { data: note, isLoading } = useQuery({
    queryKey: ['session_note', appointment?.id],
    queryFn: async () => {
      if (!appointment) return null;
      const { data, error } = await supabase
        .from('session_notes')
        .select('content, id')
        .eq('appointment_id', appointment.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // Ignora erro "not found"
      return data;
    },
    enabled: !!appointment && isOpen,
  });

  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: { content: '' },
  });

  // Popula o formulário quando a nota é carregada
  useEffect(() => {
    if (note?.content) {
      form.reset({ content: note.content });
    } else {
      form.reset({ content: '' }); // Limpa se não houver nota
    }
  }, [note, form]);

  const upsertMutation = useMutation({
    mutationFn: async (data: NoteFormData) => {
      if (!user || !appointment) throw new Error("Dados insuficientes.");

      const payload = {
        id: note?.id, // Se a nota já existe, o upsert usará o id para atualizar
        user_id: user.id,
        client_id: appointment.client_id,
        appointment_id: appointment.id,
        content: data.content,
      };

      const { error } = await supabase.from('session_notes').upsert(payload);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Anotação salva com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['session_note', appointment?.id] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao salvar anotação", description: error.message, variant: "destructive" });
    },
  });

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Anotações da Sessão</DialogTitle>
          <DialogDescription className="flex items-center gap-4 pt-1">
            <span className="flex items-center gap-2"><User className="h-4 w-4" />{appointment.title}</span>
            <span className="font-mono text-xs">{format(new Date(appointment.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow min-h-0">
          {isLoading ? (
            <div className="space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => upsertMutation.mutate(data))} className="h-full flex flex-col">
                <Controller
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="flex-grow min-h-0">
                      <FormControl className="h-full">
                        <RichTextEditor content={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-6 border-t mt-4">
                  <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                  <Button type="submit" disabled={upsertMutation.isPending}>
                    {upsertMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Salvar Anotações
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};