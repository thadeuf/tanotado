import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { addMonths, addWeeks, format, parseISO } from 'date-fns';

// Hooks e Utilitários
import { useClients } from '@/hooks/useClients';
import { PaymentWithClient } from '@/hooks/usePayments';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Componentes da UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Loader2, ArrowUp, ArrowDown, CalendarIcon, ChevronsUpDown, Check, Building, PlusCircle } from 'lucide-react';


const transactionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['income', 'expense'], { required_error: 'Selecione o tipo.' }),
  description: z.string().min(2, { message: 'A descrição é obrigatória.' }),
  amount: z.coerce.number().positive({ message: 'O valor deve ser maior que zero.' }),
  client_id: z.string({ required_error: "Selecione a relação para associar." }),
  due_date: z.date({ required_error: 'A data de vencimento é obrigatória.' }),
  is_recurring: z.boolean().default(false),
  recurrence_frequency: z.string().optional(),
  recurrence_count: z.coerce.number().int().positive().optional(),
}).superRefine((data, ctx) => {
  if (data.is_recurring) {
    if (!data.recurrence_frequency) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['recurrence_frequency'], message: 'A frequência é obrigatória.' });
    if (!data.recurrence_count || data.recurrence_count <= 0) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['recurrence_count'], message: 'A quantidade de repetições deve ser maior que 0.' });
  }
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  onSuccess: () => void;
  initialData?: PaymentWithClient | null;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSuccess, initialData }) => {
  const { user } = useAuth();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const queryClient = useQueryClient();
  const [clientComboOpen, setClientComboOpen] = useState(false);

  const isEditing = !!initialData;
  const businessClient = clients.find(c => c.name.toLowerCase() === 'minha clínica' || c.name.toLowerCase() === 'despesas gerais');

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { type: 'income', is_recurring: false },
  });

  useEffect(() => {
    if (isEditing && initialData) {
      form.reset({
        id: initialData.id,
        type: (initialData.amount || 0) >= 0 ? 'income' : 'expense',
        description: initialData.notes || '',
        amount: Math.abs(initialData.amount || 0),
        client_id: initialData.client_id,
        due_date: parseISO(initialData.due_date),
        is_recurring: false,
      });
    } else {
      form.reset({ type: 'income', is_recurring: false, recurrence_count: 1, recurrence_frequency: 'monthly' });
    }
  }, [isEditing, initialData, form]);

  const mutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      if (!user) throw new Error("Usuário não autenticado");
      if (data.id) {
        const { error } = await supabase.from('payments').update({
          notes: data.description, amount: data.type === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount),
          client_id: data.client_id, due_date: data.due_date.toISOString(),
        }).eq('id', data.id);
        if (error) throw error;
      } else {
        const transactionsToInsert = [];
        const baseAmount = data.type === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount);
        const loopCount = data.is_recurring ? data.recurrence_count || 1 : 1;
        for (let i = 0; i < loopCount; i++) {
          let nextDueDate = new Date(data.due_date);
          if (i > 0) {
            if (data.recurrence_frequency === 'weekly') nextDueDate = addWeeks(nextDueDate, i);
            else if (data.recurrence_frequency === 'monthly') nextDueDate = addMonths(nextDueDate, i);
          }
          
          // <<< AJUSTE AQUI: Adiciona um contador à descrição para recorrências >>>
          const descriptionWithCounter = loopCount > 1
            ? `${data.description} (${i + 1}/${loopCount})`
            : data.description;
            
          transactionsToInsert.push({ 
            user_id: user.id, 
            client_id: data.client_id, 
            amount: baseAmount, 
            notes: descriptionWithCounter, // Usa a nova descrição
            due_date: nextDueDate.toISOString(), 
            status: 'pending' as const 
          });
        }
        const { error } = await supabase.from('payments').insert(transactionsToInsert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: `Lançamento ${isEditing ? 'atualizado' : 'criado'} com sucesso!` });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      onSuccess();
    },
    onError: (error: any) => toast({ title: "Erro ao salvar", description: `Ocorreu um erro: ${error.message}`, variant: "destructive" }),
  });

  const createBusinessClientMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");
      const { data, error } = await supabase.from('clients').insert({
        name: 'Minha Clínica', user_id: user.id, is_active: true,
        notes: 'Cliente especial para registro de despesas e receitas internas.'
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (newClient) => {
      toast({ title: "Centro de Custo 'Minha Clínica' criado!" });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      if (newClient) {
        form.setValue('client_id', newClient.id);
        setClientComboOpen(false);
      }
    },
    onError: (error: any) => toast({ title: "Erro ao criar centro de custo", description: error.message, variant: "destructive" }),
  });
  
  const watchedIsRecurring = form.watch('is_recurring');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4 pt-4">
        {!isEditing && (
            <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem><FormLabel>Tipo de Lançamento</FormLabel><FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-4">
                        <Label className="flex items-center gap-3 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 has-[input:checked]:bg-green-100 has-[input:checked]:border-green-400 transition-colors"><RadioGroupItem value="income" id="r-income" /> <ArrowUp className="h-4 w-4 text-green-600" /> Receita</Label>
                        <Label className="flex items-center gap-3 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 has-[input:checked]:bg-red-100 has-[input:checked]:border-red-400 transition-colors"><RadioGroupItem value="expense" id="r-expense" /> <ArrowDown className="h-4 w-4 text-red-600" /> Despesa</Label>
                    </RadioGroup>
                </FormControl><FormMessage /></FormItem>
            )} />
        )}
        <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descrição</FormLabel><FormControl><Input placeholder="Ex: Consulta, Aluguel do consultório..." {...field} /></FormControl><FormMessage /></FormItem> )} />
        <FormField control={form.control} name="client_id" render={({ field }) => (
          <FormItem className="flex flex-col"><FormLabel>Relacionado a:</FormLabel>
            <Popover open={clientComboOpen} onOpenChange={setClientComboOpen}><PopoverTrigger asChild>
              <FormControl><Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")} disabled={clientsLoading}>
                {clientsLoading ? "Carregando..." : clients.find(c => c.id === field.value)?.name || "Selecione..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button></FormControl>
            </PopoverTrigger><PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command>
              <CommandInput placeholder="Buscar..." /><CommandList><CommandEmpty>Nenhum resultado.</CommandEmpty>
                {!businessClient && (
                  <CommandItem onSelect={() => createBusinessClientMutation.mutate()} disabled={createBusinessClientMutation.isPending} className="text-tanotado-blue cursor-pointer">
                    {createBusinessClientMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4"/>}
                    Criar centro de custo 'Minha Clínica'
                  </CommandItem>
                )}
                {businessClient && (<>
                  <CommandGroup heading="Centro de Custo"><CommandItem value={businessClient.id} key={businessClient.id} onSelect={() => { form.setValue("client_id", businessClient.id); setClientComboOpen(false); }}>
                    <Building className="mr-2 h-4 w-4 text-tanotado-blue"/>{businessClient.name}
                    <Check className={cn("ml-auto h-4 w-4", businessClient.id === field.value ? "opacity-100" : "opacity-0")} />
                  </CommandItem></CommandGroup><CommandSeparator />
                </>)}
                <CommandGroup heading="Clientes">
                  {clients.filter(c => c.id !== businessClient?.id).map(client => (<CommandItem value={client.id} key={client.id} onSelect={() => { form.setValue("client_id", client.id); setClientComboOpen(false); }}>
                    {client.name}<Check className={cn("ml-auto h-4 w-4", client.id === field.value ? "opacity-100" : "opacity-0")} />
                  </CommandItem>))}
                </CommandGroup>
              </CommandList></Command></PopoverContent></Popover>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="amount" render={({ field }) => ( <FormItem><FormLabel>Valor (R$)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0,00" {...field} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name="due_date" render={({ field }) => (
            <FormItem className="flex flex-col"><FormLabel>Vencimento</FormLabel>
              <Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                  {field.value ? format(field.value, 'dd/MM/yyyy') : <span>Selecione</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage />
            </FormItem>
          )} />
        </div>
        {!isEditing && (<>
            <FormField control={form.control} name="is_recurring" render={({ field }) => ( <FormItem className="flex items-center justify-between rounded-lg border p-3"><FormLabel>Lançamento recorrente?</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
            {watchedIsRecurring && (<div className="p-4 border rounded-lg space-y-4 bg-muted/50 animate-fade-in">
              <FormField control={form.control} name="recurrence_frequency" render={({ field }) => (
                <FormItem><FormLabel>Frequência</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-1">
                  <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="weekly" /> Semanal</Label>
                  <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="monthly" /> Mensal</Label>
                </RadioGroup></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="recurrence_count" render={({ field }) => (
                <FormItem><FormLabel>Repetir por</FormLabel><div className="flex items-center gap-2"><FormControl>
                  <Input type="number" min="1" className="w-20" {...field} />
                </FormControl><span className="text-sm text-muted-foreground">vez(es)</span></div><FormMessage /></FormItem>
              )} />
            </div>)}
        </>)}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>Cancelar</Button>
          <Button type="submit" disabled={mutation.isPending} className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple">
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {isEditing ? 'Salvar Alterações' : 'Criar Lançamento'}
          </Button>
        </div>
      </form>
    </Form>
  )
};