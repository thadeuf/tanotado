import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, Edit, Trash2, CheckCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Payment {
  id: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_method: string | null;
  notes: string | null;
  client: {
    id: string;
    name: string;
  } | null;
}

interface PaymentsListProps {
  searchTerm: string;
  statusFilter: string;
}

const PaymentsList: React.FC<PaymentsListProps> = ({ searchTerm, statusFilter }) => {
  const { user } = useAuth();

  const { data: payments, isLoading, refetch } = useQuery({
    queryKey: ['payments', user?.id, searchTerm, statusFilter],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      let query = supabase
        .from('payments')
        .select(`
          *,
          client:clients(
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .order('due_date', { ascending: false });

      // Only apply status filter if it's a valid payment status
      if (statusFilter !== 'all' && ['pending', 'paid', 'overdue', 'cancelled'].includes(statusFilter)) {
        query = query.eq('status', statusFilter as 'pending' | 'paid' | 'overdue' | 'cancelled');
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by search term if provided
      let filteredData = data || [];
      if (searchTerm) {
        filteredData = filteredData.filter(payment =>
          payment.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.notes?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      return filteredData as Payment[];
    },
    enabled: !!user?.id,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Pago</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Vencido</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const markAsPaid = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'paid' as const,
          payment_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Pagamento atualizado",
        description: "Pagamento marcado como pago com sucesso!",
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar pagamento",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse flex-1"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagamentos</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Método</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum pagamento encontrado
                </TableCell>
              </TableRow>
            ) : (
              payments?.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {payment.client?.name || 'Cliente não encontrado'}
                  </TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>{formatDate(payment.due_date)}</TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell>{payment.payment_method || '-'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {payment.status !== 'paid' && (
                          <DropdownMenuItem onClick={() => markAsPaid(payment.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Marcar como pago
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PaymentsList;
