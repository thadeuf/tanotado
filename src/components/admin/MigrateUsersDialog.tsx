import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Users } from 'lucide-react';

type Instance = Database['public']['Tables']['instances']['Row'] & {
    associated_users_count?: number;
};

interface MigrateUsersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const migrationSchema = z.object({
  source_instance_id: z.string({ required_error: 'Selecione a instância de origem.' }),
  destination_instance_id: z.string({ required_error: 'Selecione a instância de destino.' }),
  user_count: z.coerce.number().int().min(1, 'A quantidade deve ser pelo menos 1.'),
}).refine(data => data.source_instance_id !== data.destination_instance_id, {
  message: "A instância de origem e destino não podem ser a mesma.",
  path: ["destination_instance_id"],
});

type MigrationFormData = z.infer<typeof migrationSchema>;

export const MigrateUsersDialog: React.FC<MigrateUsersDialogProps> = ({ isOpen, onOpenChange }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { data: instances = [], isLoading: isLoadingInstances } = useQuery<Instance[], Error>({
    queryKey: ['instances_with_user_count', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.rpc('get_instances_with_user_count');
      if (error) {
        toast({ title: 'Erro ao carregar instâncias.', description: error.message, variant: 'destructive' });
        throw error;
      }
      return (data as Instance[]) || [];
    },
    enabled: isOpen && !!user,
  });

  // --- INÍCIO DA CORREÇÃO ---
  const form = useForm<MigrationFormData>({
    resolver: zodResolver(migrationSchema),
    // Definir valores padrão para os campos do formulário para evitar o aviso de "uncontrolled input".
    defaultValues: {
      source_instance_id: undefined,
      destination_instance_id: undefined,
      user_count: 1,
    }
  });
  // --- FIM DA CORREÇÃO ---

  const migrationMutation = useMutation({
    mutationFn: async ({ source_instance_id, destination_instance_id, user_count }: MigrationFormData) => {
      const { data, error } = await supabase.rpc('migrate_random_users_between_instances', {
        p_source_instance_id: source_instance_id,
        p_destination_instance_id: destination_instance_id,
        p_user_count: user_count,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (moved_count) => {
      toast({
        title: "Migração Concluída!",
        description: `${moved_count ?? 0} usuário(s) foram movidos com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['instances_with_user_count'] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro na Migração",
        description: error.message || "Não foi possível mover os usuários.",
        variant: 'destructive',
      });
    }
  });

  const watchedSourceId = form.watch('source_instance_id');
  const sourceInstanceUserCount = instances.find(inst => inst.id === watchedSourceId)?.associated_users_count ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) form.reset();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Migrar Usuários em Lote</DialogTitle>
          <DialogDescription>
            Mova usuários aleatoriamente de uma instância para outra.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => migrationMutation.mutate(data))} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="source_instance_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>De (Origem)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingInstances}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a instância de origem..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {instances.map(inst => (
                        <SelectItem key={inst.id} value={inst.id}>
                          {inst.nome_instancia} ({inst.associated_users_count} usuários)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="destination_instance_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Para (Destino)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingInstances}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a instância de destino..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                       {instances.map(inst => (
                        <SelectItem key={inst.id} value={inst.id}>
                          {inst.nome_instancia} ({inst.associated_users_count} usuários)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="user_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade de Usuários</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      {...field}
                      max={sourceInstanceUserCount}
                      onChange={event => field.onChange(event.target.value === '' ? '' : Number(event.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                  {watchedSourceId && (
                     <p className="text-xs text-muted-foreground">
                        A instância de origem possui {sourceInstanceUserCount} usuário(s).
                     </p>
                  )}
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={migrationMutation.isPending}>
                {migrationMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Migrar Usuários
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};