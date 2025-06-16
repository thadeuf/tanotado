// src/components/financial/ClientFinancialRecords.tsx

import React, { useState, useMemo } from 'react';
import { usePayments, PaymentWithClient as Payment } from '@/hooks/usePayments'; // Usando tipo exportado
import { Client } from '@/hooks/useClients';
// <<< INÍCIO DA ALTERAÇÃO 1 >>>
// parseISO é importado para corrigir a exibição da data
import { format, parseISO } from 'date-fns';
// <<< FIM DA ALTERAÇÃO 1 >>>

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
// <<< INÍCIO DA ALTERAÇÃO 2 >>>
// Ícones adicionados para as novas ações
import { MoreHorizontal, Plus, DollarSign, Edit, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
// <<< FIM DA ALTERAÇÃO 2 >>>


// Shared Components
import { TransactionForm } from './TransactionForm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ClientFinancialRecordsProps {
  client: Client;
}

export const ClientFinancialRecords: React.FC<ClientFinancialRecordsProps> = ({ client }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Payment | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Payment | null>(null);
  // <<< INÍCIO DA ALTERAÇÃO 3 >>>
  // Estado para controlar o alerta de confirmação de pagamento
  const [paymentToPay, setPaymentToPay] = useState<Payment | null>(null);
  // <<< FIM DA ALTERAÇÃO 3 >>>

  const { data: allPayments = [], isLoading } = usePayments();
  const queryClient = useQueryClient();

  const clientPayments = useMemo(() => {
    return allPayments
      .filter(p => p.client_id === client.id)
      .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
  }, [allPayments, client.id]);
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
        const { error } = await supabase.from('payments').delete().eq('id', id);
        if (error) throw error;
    },
    onSuccess: () => {
        toast({ title: "Sucesso!", description: "Lançamento excluído." });
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        setTransactionToDelete(null);
    },
    onError: (error: any) => {
        toast({ title: "Erro ao excluir", description: error.message, variant: 'destructive' });
        setTransactionToDelete(null);
    }
  });

  // <<< INÍCIO DA ALTERAÇÃO 4 >>>
  // Mutation para marcar um lançamento como pago
  const payMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'paid', payment_date: new Date().toISOString() })
        .eq('id', paymentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Lançamento marcado como pago."});
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setPaymentToPay(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao processar pagamento", description: error.message, variant: 'destructive' });
      setPaymentToPay(null);
    }
  });
  // <<< FIM DA ALTERAÇÃO 4 >>>


  const handleEdit = (payment: Payment) => {
    setEditingTransaction(payment);
    setIsFormOpen(true);
  };
  
  const handleAddNew = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

  const getStatusVariant = (status: string | null): { text: string; variant: "default" | "destructive" | "outline" | "secondary" } => {
    switch (status) {
      case 'paid': return { text: 'Pago', variant: 'default' };
      case 'pending': return { text: 'Pendente', variant: 'secondary' };
      case 'overdue': return { text: 'Vencido', variant: 'destructive' };
      default: return { text: status || 'N/A', variant: 'outline' };
    }
  };

  const renderSkeleton = () => (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
    </div>
  );
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Histórico Financeiro</CardTitle>
          <Button onClick={handleAddNew} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Lançamento
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? renderSkeleton() : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientPayments.length > 0 ? (
                    clientPayments.map(payment => {
                      const status = getStatusVariant(payment.status);
                      const isOverdue = !payment.payment_date && new Date(payment.due_date) < new Date();
                      
                      return (
                        <TableRow key={payment.id}>
                          {/* <<< INÍCIO DA ALTERAÇÃO 5: Correção da data >>> */}
                          <TableCell>{format(parseISO(payment.due_date), 'dd/MM/yyyy')}</TableCell>
                          {/* <<< FIM DA ALTERAÇÃO 5 >>> */}
                          <TableCell className={`font-medium ${payment.amount < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                            {payment.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant} className={status.variant === 'default' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : isOverdue ? 'border-amber-500 text-amber-700' : ''}>
                              {isOverdue && status.text === 'Pendente' ? 'Vencido' : status.text}
                            </Badge>
                          </TableCell>
                           <TableCell className="max-w-[200px] truncate">{payment.notes || '-'}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(payment)}>
                                  <Edit className="mr-2 h-4 w-4" /> Editar
                                </DropdownMenuItem>
                                {/* <<< INÍCIO DA ALTERAÇÃO 6: Nova opção >>> */}
                                {payment.status !== 'paid' && (
                                    <DropdownMenuItem onClick={() => setPaymentToPay(payment)}>
                                        <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" /> Marcar como pago
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {/* <<< FIM DA ALTERAÇÃO 6 >>> */}
                                <DropdownMenuItem className="text-red-600" onClick={() => setTransactionToDelete(payment)}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <DollarSign className="mx-auto h-12 w-12 text-muted-foreground opacity-30 mb-2" />
                        Nenhum lançamento financeiro encontrado para este cliente.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {isFormOpen && (
        <TransactionForm
            onSuccess={() => setIsFormOpen(false)}
            initialData={editingTransaction}
        />
      )}
      
      <AlertDialog open={!!transactionToDelete} onOpenChange={(isOpen) => !isOpen && setTransactionToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                    Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90"
                    onClick={() => transactionToDelete && deleteMutation.mutate(transactionToDelete.id)}
                    disabled={deleteMutation.isPending}
                >
                    {deleteMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Excluindo...</> : "Confirmar Exclusão"}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    {/* <<< INÍCIO DA ALTERAÇÃO 7: Novo Dialog de Confirmação >>> */}
    <AlertDialog open={!!paymentToPay} onOpenChange={(isOpen) => !isOpen && setPaymentToPay(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
                <AlertDialogDescription>
                    Deseja registrar o pagamento deste lançamento na data de hoje?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => paymentToPay && payMutation.mutate(paymentToPay.id)}
                    disabled={payMutation.isPending}
                >
                    {payMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirmando...</> : "Confirmar Pagamento"}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    {/* <<< FIM DA ALTERAÇÃO 7 >>> */}
    </>
  );
};