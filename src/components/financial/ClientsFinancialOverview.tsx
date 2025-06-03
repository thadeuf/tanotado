
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Eye, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ClientFinancialData {
  id: string;
  name: string;
  photo_url: string | null;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  paymentCount: number;
}

interface ClientsFinancialOverviewProps {
  searchTerm: string;
}

const ClientsFinancialOverview: React.FC<ClientsFinancialOverviewProps> = ({ searchTerm }) => {
  const { user } = useAuth();

  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['clients-financial', user?.id, searchTerm],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Buscar clientes
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, photo_url')
        .eq('user_id', user.id)
        .order('name');

      if (clientsError) throw clientsError;

      // Buscar pagamentos
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id);

      if (paymentsError) throw paymentsError;

      // Agrupar dados por cliente
      const clientsFinancial = clients.map(client => {
        const clientPayments = payments.filter(p => p.client_id === client.id);
        
        const totalAmount = clientPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const paidAmount = clientPayments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + Number(p.amount), 0);
        const pendingAmount = clientPayments
          .filter(p => p.status === 'pending')
          .reduce((sum, p) => sum + Number(p.amount), 0);
        const overdueAmount = clientPayments
          .filter(p => p.status === 'overdue')
          .reduce((sum, p) => sum + Number(p.amount), 0);

        return {
          ...client,
          totalAmount,
          paidAmount,
          pendingAmount,
          overdueAmount,
          paymentCount: clientPayments.length
        };
      });

      // Filtrar por termo de busca se fornecido
      let filteredData = clientsFinancial;
      if (searchTerm) {
        filteredData = clientsFinancial.filter(client =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      return filteredData as ClientFinancialData[];
    },
    enabled: !!user?.id,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPaymentProgress = (paid: number, total: number) => {
    if (total === 0) return 0;
    return (paid / total) * 100;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clientsData?.length === 0 ? (
        <div className="col-span-full text-center py-8 text-muted-foreground">
          Nenhum cliente encontrado
        </div>
      ) : (
        clientsData?.map((client) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={client.photo_url || ''} />
                    <AvatarFallback>
                      {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {client.paymentCount} pagamento(s)
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso dos Pagamentos</span>
                  <span>{Math.round(getPaymentProgress(client.paidAmount, client.totalAmount))}%</span>
                </div>
                <Progress 
                  value={getPaymentProgress(client.paidAmount, client.totalAmount)} 
                  className="h-2"
                />
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold">{formatCurrency(client.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pago</p>
                  <p className="font-semibold text-green-600">{formatCurrency(client.paidAmount)}</p>
                </div>
                {client.pendingAmount > 0 && (
                  <div>
                    <p className="text-muted-foreground">Pendente</p>
                    <p className="font-semibold text-orange-600">{formatCurrency(client.pendingAmount)}</p>
                  </div>
                )}
                {client.overdueAmount > 0 && (
                  <div>
                    <p className="text-muted-foreground">Vencido</p>
                    <p className="font-semibold text-red-600">{formatCurrency(client.overdueAmount)}</p>
                  </div>
                )}
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                {client.paidAmount > 0 && (
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    Em dia
                  </Badge>
                )}
                {client.pendingAmount > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                    Pendente
                  </Badge>
                )}
                {client.overdueAmount > 0 && (
                  <Badge className="bg-red-100 text-red-800 text-xs">
                    Atrasado
                  </Badge>
                )}
              </div>

              {/* Action Button */}
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Novo Pagamento
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default ClientsFinancialOverview;
