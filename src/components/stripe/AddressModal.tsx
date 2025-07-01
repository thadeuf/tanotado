import React, { useEffect } from 'react'; // Importar useEffect
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@/types/auth';

const addressSchema = z.object({
  cep: z.string().min(8, "CEP é obrigatório."),
  address: z.string().min(3, "Endereço é obrigatório."),
  address_number: z.string().min(1, "Número é obrigatório."),
  address_neighborhood: z.string().min(2, "Bairro é obrigatório."),
  address_city: z.string().min(2, "Cidade é obrigatória."),
  address_state: z.string().min(2, "Estado é obrigatório."),
  address_complement: z.string().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
}

export const AddressModal: React.FC<AddressModalProps> = ({ user, isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const { refetchUser } = useAuth();

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    // Removido defaultValues daqui para evitar o erro
  });

  // --- ALTERAÇÃO AQUI: USANDO useEffect PARA PREENCHER O FORMULÁRIO ---
  useEffect(() => {
    if (user) {
      form.reset({
        cep: user.cep || '',
        address: user.address || '',
        address_number: user.address_number || '',
        address_neighborhood: user.address_neighborhood || '',
        address_city: user.address_city || '',
        address_state: user.address_state || '',
        address_complement: user.address_complement || '',
      });
    }
  }, [user, form]);
  // --- FIM DA ALTERAÇÃO ---

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: AddressFormData) => {
      const { error } = await supabase
        .from('profiles')
        .update(values)
        .eq('id', user.id);
      if (error) throw error;
      return { ...user, ...values };
    },
    onSuccess: async (updatedUser) => {
      toast({ title: "Endereço salvo com sucesso!" });
      await refetchUser();
      onSuccess(updatedUser);
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar endereço", description: error.message, variant: "destructive" });
    }
  });

  const handleCepBlur = async (event: React.FocusEvent<HTMLInputElement>) => {
    const cep = event.target.value.replace(/\D/g, '');
    if (cep.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) throw new Error('CEP não encontrado');
      const data = await response.json();
      if (data.erro) throw new Error('CEP inválido');
      form.setValue('address', data.logradouro || '');
      form.setValue('address_neighborhood', data.bairro || '');
      form.setValue('address_city', data.localidade || '');
      form.setValue('address_state', data.uf || '');
      form.setFocus('address_number');
    } catch (error) {
      toast({ title: "Erro ao buscar CEP", description: (error as Error).message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Complete seu endereço</DialogTitle>
                <DialogDescription>
                    Precisamos de mais alguns dados para finalizar a sua assinatura.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => mutate(data))} className="space-y-4 py-2">
                    <FormField control={form.control} name="cep" render={({ field }) => ( <FormItem><FormLabel>CEP</FormLabel><FormControl><Input placeholder="00000-000" {...field} onBlur={handleCepBlur} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Endereço</FormLabel><FormControl><Input placeholder="Rua, Avenida..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="address_number" render={({ field }) => ( <FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="address_complement" render={({ field }) => ( <FormItem><FormLabel>Complemento</FormLabel><FormControl><Input placeholder="Apto, Bloco..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                    <FormField control={form.control} name="address_neighborhood" render={({ field }) => ( <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <div className="grid grid-cols-3 gap-4">
                        <FormField control={form.control} name="address_city" render={({ field }) => ( <FormItem className="col-span-2"><FormLabel>Cidade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="address_state" render={({ field }) => ( <FormItem><FormLabel>UF</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar e ir para pagamento
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
};