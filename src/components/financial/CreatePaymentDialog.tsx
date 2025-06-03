
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const paymentSchema = z.object({
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  amount: z.string().min(1, 'Valor é obrigatório'),
  dueDate: z.date({
    required_error: 'Data de vencimento é obrigatória',
  }),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface CreatePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreatePaymentDialog: React.FC<CreatePaymentDialogProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: clients } = useQuery({
    queryKey: ['clients', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && open,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
  });

  const selectedDate = watch('dueDate');

  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const paymentData = {
        user_id: user.id,
        client_id: data.clientId,
        amount: parseFloat(data.amount.replace(',', '.')),
        due_date: data.dueDate.toISOString().split('T')[0],
        payment_method: data.paymentMethod || null,
        notes: data.notes || null,
        status: 'pending' as const,
      };

      const { data: result, error } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Pagamento criado",
        description: "Pagamento criado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] });
      queryClient.invalidateQueries({ queryKey: ['clients-financial'] });
      reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar pagamento",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    createPaymentMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Pagamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientId">Cliente</Label>
            <Select onValueChange={(value) => setValue('clientId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.clientId && (
              <p className="text-sm text-red-600">{errors.clientId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <Input
              {...register('amount')}
              placeholder="0,00"
              type="text"
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Data de Vencimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => setValue('dueDate', date!)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.dueDate && (
              <p className="text-sm text-red-600">{errors.dueDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Método de Pagamento</Label>
            <Select onValueChange={(value) => setValue('paymentMethod', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              {...register('notes')}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createPaymentMutation.isPending}
              className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple hover:shadow-lg transition-all duration-200"
            >
              {createPaymentMutation.isPending ? 'Criando...' : 'Criar Pagamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePaymentDialog;
