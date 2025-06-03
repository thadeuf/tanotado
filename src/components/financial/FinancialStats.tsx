import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const FinancialStats: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['financial-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const totalRevenue = payments.reduce((sum, payment) => 
        payment.status === 'paid' ? sum + Number(payment.amount) : sum, 0
      );

      const pendingAmount = payments.reduce((sum, payment) => 
        payment.status === 'pending' ? sum + Number(payment.amount) : sum, 0
      );

      const overdueAmount = payments.reduce((sum, payment) => 
        payment.status === 'overdue' ? sum + Number(payment.amount) : sum, 0
      );

      const monthlyRevenue = payments
        .filter(payment => {
          if (payment.status !== 'paid' || !payment.payment_date) return false;
          const paymentDate = new Date(payment.payment_date);
          return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum, payment) => sum + Number(payment.amount), 0);

      return {
        totalRevenue,
        pendingAmount,
        overdueAmount,
        monthlyRevenue
      };
    },
    enabled: !!user?.id,
    staleTime: 0, // Force refresh on every render
  });

  // Listen for payments query updates to refresh stats
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe(({ query, type }) => {
      if (type === 'updated' && query.queryKey[0] === 'payments') {
        queryClient.invalidateQueries({ queryKey: ['financial-stats', user?.id] });
      }
    });

    return unsubscribe;
  }, [queryClient, user?.id]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-20 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats?.totalRevenue || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Pagamentos recebidos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(stats?.monthlyRevenue || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Mês atual
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">A Receber</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(stats?.pendingAmount || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Pagamentos pendentes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(stats?.overdueAmount || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Pagamentos vencidos
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialStats;
