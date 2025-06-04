
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Search, Filter, Plus, DollarSign, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import FinancialStats from '@/components/financial/FinancialStats';
import PaymentsList from '@/components/financial/PaymentsList';
import ClientsFinancialOverview from '@/components/financial/ClientsFinancialOverview';
import CreatePaymentDialog from '@/components/financial/CreatePaymentDialog';

const Financial: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreatePayment, setShowCreatePayment] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-tanotado-navy">
            Financeiro
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie pagamentos e finanças dos seus clientes
          </p>
        </div>
        <Button 
          onClick={() => setShowCreatePayment(true)}
          className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple hover:shadow-lg transition-all duration-200 gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Pagamento
        </Button>
      </div>

      {/* Statistics */}
      <FinancialStats />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por cliente ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="payments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="clients">Visão por Cliente</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-6">
          <PaymentsList searchTerm={searchTerm} statusFilter={statusFilter} />
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <ClientsFinancialOverview searchTerm={searchTerm} />
        </TabsContent>
      </Tabs>

      {/* Create Payment Dialog */}
      <CreatePaymentDialog 
        open={showCreatePayment}
        onOpenChange={setShowCreatePayment}
      />
    </div>
  );
};

export default Financial;
