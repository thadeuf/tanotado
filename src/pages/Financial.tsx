import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isPast, addMonths, subMonths, addYears, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Hooks e Utilitários
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

// Componentes
import { TransactionForm } from '@/components/Financial/TransactionForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DollarSign, TrendingUp, TrendingDown, Plus, Search, MoreHorizontal, Edit, Trash2, CheckCircle, ArrowUp, ArrowDown, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';


// --- DEFINIÇÃO DE TIPO ---
type PaymentWithClient = Database['public']['Tables']['payments']['Row'] & {
  clients: { name: string; avatar_url: string | null; } | null;
};

// =================================================================================
// COMPONENTE PRINCIPAL DA PÁGINA FINANCEIRA
// =================================================================================
const Financial: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentWithClient | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentWithClient | null>(null);
  const [paymentToPay, setPaymentToPay] = useState<PaymentWithClient | null>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

  const { data: allPayments = [], isLoading } = useQuery<PaymentWithClient[], Error>({
    queryKey: ['payments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from('payments').select(`*, clients (name, avatar_url)`).eq('user_id', user.id).order('due_date', { ascending: false });
      if (error) {
        toast({ title: "Erro ao buscar lançamentos.", description: error.message, variant: "destructive" });
        throw error;
      }
      return (data as PaymentWithClient[]) || [];
    },
    enabled: !!user?.id,
  });

  const periodPayments = useMemo(() => {
    return allPayments.filter(p => {
      const paymentDate = parseISO(p.due_date);
      if (viewMode === 'year') {
        return paymentDate.getFullYear() === currentDate.getFullYear();
      }
      return paymentDate.getFullYear() === currentDate.getFullYear() && paymentDate.getMonth() === currentDate.getMonth();
    });
  }, [allPayments, currentDate, viewMode]);

  const { income, expenses, balance } = useMemo(() => {
    return periodPayments.reduce((acc, p) => {
      const amount = p.amount || 0;
      if (amount > 0) acc.income += amount; else acc.expenses += Math.abs(amount);
      acc.balance += amount;
      return acc;
    }, { income: 0, expenses: 0, balance: 0 });
  }, [periodPayments]);

  const filteredPayments = useMemo(() => (
    periodPayments.filter(p => (p.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.clients?.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
  ), [periodPayments, searchTerm]);

  // --- FUNÇÕES AUXILIARES ---
  const formatCurrency = (v: number | null) => v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
  const formatDate = (d: string | null) => d ? format(parseISO(d), 'dd/MM/yyyy') : '—';
  
  // <<< CORREÇÃO AQUI: Função para traduzir o status >>>
  const translateStatus = (status: 'pending' | 'paid' | 'overdue' | 'cancelled' | null) => {
    const statusMap = {
      pending: 'Pendente',
      paid: 'Pago',
      overdue: 'Vencido',
      cancelled: 'Cancelado',
    };
    return status ? statusMap[status] : 'Desconhecido';
  };
  
  const stats = [
    { title: `Receitas em ${format(currentDate, viewMode === 'month' ? 'MMMM' : 'yyyy', { locale: ptBR })}`, value: formatCurrency(income), icon: TrendingUp, color: 'from-tanotado-green to-tanotado-blue' },
    { title: `Despesas em ${format(currentDate, viewMode === 'month' ? 'MMMM' : 'yyyy', { locale: ptBR })}`, value: formatCurrency(expenses), icon: TrendingDown, color: 'from-tanotado-pink to-tanotado-purple' },
    { title: `Saldo em ${format(currentDate, viewMode === 'month' ? 'MMMM' : 'yyyy', { locale: ptBR })}`, value: formatCurrency(balance), icon: DollarSign, color: 'from-tanotado-blue to-tanotado-purple' },
  ];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supabase.from('payments').delete().eq('id', id),
    onSuccess: () => { toast({ title: "Lançamento excluído!"}); queryClient.invalidateQueries({ queryKey: ['payments'] }); },
    onError: (e: any) => toast({ title: "Erro ao excluir.", description: e.message, variant: 'destructive'}),
    onSettled: () => setPaymentToDelete(null),
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => supabase.from('payments').update({ status: 'paid', payment_date: new Date().toISOString() }).eq('id', id),
    onSuccess: () => { toast({ title: "Lançamento atualizado para PAGO!"}); queryClient.invalidateQueries({ queryKey: ['payments'] }); },
    onError: (e: any) => toast({ title: "Erro ao atualizar.", description: e.message, variant: 'destructive'}),
    onSettled: () => setPaymentToPay(null),
  });

  const handleOpenForm = (payment: PaymentWithClient | null = null) => { setEditingPayment(payment); setIsFormOpen(true); };
  const handleCloseForm = () => { setIsFormOpen(false); setEditingPayment(null); };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const fn = direction === 'prev' ? (viewMode === 'month' ? subMonths : subYears) : (viewMode === 'month' ? addMonths : addYears);
    setCurrentDate(fn(currentDate, 1));
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-3xl font-bold text-tanotado-navy">Financeiro</h1><p className="text-muted-foreground mt-1">Acompanhe suas receitas e despesas.</p></div>
        <Button size="sm" onClick={() => handleOpenForm()} className="gap-2 bg-gradient-to-r from-tanotado-pink to-tanotado-purple mt-4 md:mt-0 shadow-lg hover:shadow-xl transition-shadow"><Plus className="h-4 w-4" /> Novo Lançamento</Button>
      </div>

      <Card><CardContent className="p-3">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={() => handleDateChange('prev')}><ChevronLeft className="h-4 w-4" /></Button>
          <div className="text-center font-semibold text-lg text-tanotado-navy uppercase tracking-wider">
            {format(currentDate, viewMode === 'month' ? 'MMMM / yyyy' : 'yyyy', { locale: ptBR })}
          </div>
          <Button variant="outline" size="icon" onClick={() => handleDateChange('next')}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </CardContent></Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-lg transition-all"><CardContent className="p-6"><div className="flex items-center justify-between">
            <div><p className="text-sm font-medium text-muted-foreground">{stat.title}</p><p className="text-2xl font-bold text-tanotado-navy">{stat.value}</p></div>
            <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}><stat.icon className="h-6 w-6 text-white" /></div>
          </div></CardContent></Card>
        ))}
      </div>
      
      <Card>
        <CardHeader className="flex-row items-center justify-between">
            <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por descrição ou cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'month' | 'year')} size="sm">
                <ToggleGroupItem value="month">Mês</ToggleGroupItem>
                <ToggleGroupItem value="year">Ano</ToggleGroupItem>
            </ToggleGroup>
        </CardHeader>
        <CardContent className="p-0"><Table><TableHeader><TableRow>
          <TableHead className="w-[40px] text-center">Tipo</TableHead><TableHead>Descrição / Cliente</TableHead><TableHead className="text-right">Valor</TableHead>
          <TableHead className="text-center">Status</TableHead><TableHead>Vencimento</TableHead><TableHead className="text-right">Ações</TableHead>
        </TableRow></TableHeader><TableBody>
          {isLoading ? ([...Array(5)].map((_, i) => (<TableRow key={i}><TableCell className="text-center"><Skeleton className="h-5 w-5 rounded-full" /></TableCell><TableCell><Skeleton className="h-4 w-40" /></TableCell><TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell><TableCell className="text-center"><Skeleton className="h-6 w-24 mx-auto" /></TableCell><TableCell><Skeleton className="h-4 w-24" /></TableCell><TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell></TableRow>))) 
          : filteredPayments.length > 0 ? (
            filteredPayments.map(payment => {
              const isExpense = (payment.amount || 0) < 0;
              const isOverdue = isPast(parseISO(payment.due_date)) && payment.status === 'pending';
              return (
                <TableRow key={payment.id} className="hover:bg-muted/50">
                  <TableCell className="text-center">{isExpense ? <ArrowDown className="h-5 w-5 text-red-500 mx-auto" /> : <ArrowUp className="h-5 w-5 text-green-500 mx-auto" />}</TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-800">{payment.notes}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2"><Avatar className="h-5 w-5"><AvatarImage src={payment.clients?.avatar_url || ''} /><AvatarFallback className="text-xs">{payment.clients?.name?.substring(0,2)}</AvatarFallback></Avatar>{payment.clients?.name}</div>
                  </TableCell>
                  <TableCell className={`text-right font-bold ${isExpense ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(payment.amount)}</TableCell>
                  {/* <<< CORREÇÃO AQUI: Usando a função de tradução >>> */}
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`text-xs ${isOverdue ? 'border-red-300 bg-red-100 text-red-700' : 'border-gray-300'}`}>
                      {isOverdue ? 'Vencido' : translateStatus(payment.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(payment.due_date)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenForm(payment)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                        {payment.status !== 'paid' && <DropdownMenuItem onClick={() => setPaymentToPay(payment)}><CheckCircle className="mr-2 h-4 w-4 text-green-600"/>Marcar como Pago</DropdownMenuItem>}
                        <DropdownMenuItem onClick={() => setPaymentToDelete(payment)} className="text-red-600 focus:text-red-600 focus:bg-red-50"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (<TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Nenhum lançamento encontrado para este período.</TableCell></TableRow>)}
        </TableBody></Table></CardContent>
      </Card>
      
      <AlertDialog open={!!paymentToDelete} onOpenChange={(open) => !open && setPaymentToDelete(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir o lançamento "{paymentToDelete?.notes}"? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => paymentToDelete && deleteMutation.mutate(paymentToDelete.id)} disabled={deleteMutation.isPending} className="bg-red-600 hover:bg-red-700">{deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Confirmar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!paymentToPay} onOpenChange={(open) => !open && setPaymentToPay(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle><AlertDialogDescription>Deseja marcar o lançamento "{paymentToPay?.notes}" como pago na data de hoje?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => paymentToPay && payMutation.mutate(paymentToPay.id)} disabled={payMutation.isPending}>{payMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Confirmar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{editingPayment ? 'Editar Lançamento' : 'Novo Lançamento'}</DialogTitle></DialogHeader>
          <TransactionForm onSuccess={handleCloseForm} initialData={editingPayment} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Financial;