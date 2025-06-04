
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const queryClient = useQueryClient();

  const { data: payments, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['payments', user?.id, searchTerm, statusFilter],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      console.log('💰 Fetching payments for user:', user?.id);

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

      if (statusFilter !== 'all' && ['pending', 'paid', 'overdue', 'cancelled'].includes(statusFilter)) {
        query = query.eq('status', statusFilter as 'pending' | 'paid' | 'overdue' | 'cancelled');
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching payments:', error);
        throw error;
      }

      let filteredData = data || [];
      if (searchTerm) {
        filteredData = filteredData.filter(payment =>
          payment.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.notes?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      console.log('✅ Payments fetched successfully:', filteredData.length);
      return filteredData as Payment[];
    },
    enabled: !!user?.id,
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      console.log('💰 Marking payment as paid:', paymentId);
      
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'paid' as const,
          payment_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', paymentId);

      if (error) {
        console.error('❌ Error updating payment:', error);
        throw error;
      }
      
      console.log('✅ Payment marked as paid successfully');
    },
    onSuccess: () => {
      toast({
        title: "Pagamento atualizado",
        description: "Pagamento marcado como pago com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] });
    },
    onError: (error: any) => {
      console.error('❌ Error in markAsPaid mutation:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar pagamento",
        variant: "destructive",
      });
    },
  });

  const markAsPaid = (paymentId: string) => {
    console.log('🎯 markAsPaid called for payment:', paymentId);
    console.log('🔄 Mutation state:', {
      isPending: markAsPaidMutation.isPending,
      isIdle: markAsPaidMutation.isIdle,
    });
    
    if (markAsPaidMutation.isPending) {
      console.log('⏳ Mutation already in progress, ignoring click');
      return;
    }
    
    markAsPaidMutation.mutate(paymentId);
  };

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered for payments');
    refetch();
  };

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

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pagamentos</CardTitle>
          <Button onClick={handleRefresh} disabled={isFetching} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar pagamentos: {error.message}
              <br />
              <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-2">
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pagamentos</CardTitle>
        <Button onClick={handleRefresh} disabled={isFetching} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
                  <TableCell>
                    {payment.status !== 'paid' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => markAsPaid(payment.id)}
                        disabled={markAsPaidMutation.isPending}
                        className="h-8 w-8 p-0 hover:bg-green-100"
                        title="Marcar como pago"
                      >
                        <CheckCircle className={`h-4 w-4 text-green-600 ${markAsPaidMutation.isPending ? 'animate-pulse' : ''}`} />
                      </Button>
                    )}
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
