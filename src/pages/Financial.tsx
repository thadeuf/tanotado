// src/pages/Financial.tsx

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isPast, addMonths, subMonths, addYears, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Hooks e Utilitários
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

// Componentes
import { TransactionForm } from '@/components/financial/TransactionForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DollarSign, TrendingUp, TrendingDown, Plus, Search, MoreHorizontal, Edit, Trash2, CheckCircle, ArrowUp, ArrowDown, Loader2, ChevronLeft, ChevronRight, FileSignature, FileCheck } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';



// --- DEFINIÇÃO DE TIPO ---
type PaymentWithClient = Database['public']['Tables']['payments']['Row'] & {
  clients: { name: string; avatar_url: string | null; cpf: string | null } | null;
};
type Receipt = Database['public']['Tables']['recibos_ecac']['Row'];

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
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  
  const [isDescriptionPromptOpen, setIsDescriptionPromptOpen] = useState(false);
  const [paymentForReceipt, setPaymentForReceipt] = useState<PaymentWithClient | null>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);


  const { data: allPayments = [], isLoading } = useQuery<PaymentWithClient[], Error>({
    queryKey: ['payments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from('payments').select(`*, clients (name, avatar_url, cpf)`).eq('user_id', user.id).order('due_date', { ascending: false });
      if (error) {
        toast({ title: "Erro ao buscar lançamentos.", description: error.message, variant: "destructive" });
        throw error;
      }
      return (data as PaymentWithClient[]) || [];
    },
    enabled: !!user?.id,
  });
  
  const { data: receiptsData = [] } = useQuery<Receipt[], Error>({
    queryKey: ['recibos_ecac', user?.id],
    queryFn: async () => {
        if (!user) return [];
        const { data, error } = await supabase.from('recibos_ecac').select('*').eq('id_profissional', user.id);
        if (error) {
            console.error("Erro ao buscar recibos:", error.message);
            return [];
        }
        return data || [];
    },
    enabled: !!user,
  });

  const receiptMap = useMemo(() => {
      const map = new Map<string, Receipt>();
      receiptsData.forEach(receipt => {
          if (receipt.payment_id) {
              map.set(receipt.payment_id, receipt);
          }
      });
      return map;
  }, [receiptsData]);


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

  const filteredPayments = useMemo(() => {
    return periodPayments.filter(p => {
      const matchesSearch = (p.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.clients?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
  
      if (filterType === 'income') {
        return (p.amount || 0) > 0;
      }
      if (filterType === 'expense') {
        return (p.amount || 0) < 0;
      }
      return true;
    });
  }, [periodPayments, searchTerm, filterType]);

  // EFEITO PARA LIMPAR A SELEÇÃO QUANDO OS FILTROS MUDAM
  useEffect(() => {
    setSelectedPayments([]);
  }, [searchTerm, filterType, currentDate, viewMode]);


  const formatCurrency = (v: number | null) => v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
  const formatDate = (d: string | null) => d ? format(parseISO(d), 'dd/MM/yyyy') : '—';
  
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
    { title: `Receitas em ${format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}`, value: formatCurrency(income), icon: TrendingUp, color: 'from-tanotado-green to-tanotado-blue' },
    { title: `Despesas em ${format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}`, value: formatCurrency(expenses), icon: TrendingDown, color: 'from-tanotado-pink to-tanotado-purple' },
    { title: `Saldo em ${format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}`, value: formatCurrency(balance), icon: DollarSign, color: 'from-tanotado-blue to-tanotado-purple' },
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

  const batchPayMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'paid', payment_date: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({ title: `${variables.length} lançamento(s) atualizado(s) para PAGO!` });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setSelectedPayments([]);
    },
    onError: (e: any) => toast({ title: "Erro ao atualizar.", description: e.message, variant: 'destructive' }),
  });
  
  const createReceiptMutation = useMutation({
    mutationFn: async (variables: { payment: PaymentWithClient; description?: string }) => {
        const { payment, description } = variables;
        if (!user || !payment.clients) throw new Error("Dados do profissional ou cliente incompletos.");

        const cleanCPF = (cpf: string | null | undefined) => cpf ? cpf.replace(/[^\d]/g, '') : null;

        const payload: Omit<Receipt, 'id' | 'created_at'> = {
            id_profissional: user.id,
            id_cliente: payment.client_id,
            payment_id: payment.id,
            cpf_profissional: cleanCPF(user.cpf),
            cpf_pagador: cleanCPF(payment.clients.cpf),
            cpf_beneficiario: cleanCPF(payment.clients.cpf),
            valor: payment.amount,
            data_pagamento: payment.payment_date,
            descricao: description || payment.notes,
            status: 'Pendente',
        };

        const { error } = await supabase.from('recibos_ecac').insert(payload);
        if (error) throw error;
    },
    onSuccess: () => {
        toast({ title: "Recibo em fila!", description: "O recibo foi adicionado à fila de emissão." });
        queryClient.invalidateQueries({ queryKey: ['recibos_ecac'] });
        setIsDescriptionPromptOpen(false);
        setPaymentForReceipt(null);
    },
    onError: (error: any) => {
        toast({ title: "Erro ao enfileirar recibo", description: error.message, variant: "destructive" });
        setIsDescriptionPromptOpen(false);
    }
  });

  const handleOpenReceiptPrompt = (payment: PaymentWithClient) => {
    setPaymentForReceipt(payment);
    setIsDescriptionPromptOpen(true);
  };

  const handleConfirmReceiptEmission = () => {
    if (!paymentForReceipt) return;
    const customDescription = descriptionInputRef.current?.value;
    createReceiptMutation.mutate({ payment: paymentForReceipt, description: customDescription });
  };

  const handleOpenForm = (payment: PaymentWithClient | null = null) => { setEditingPayment(payment); setIsFormOpen(true); };
  const handleCloseForm = () => { setIsFormOpen(false); setEditingPayment(null); };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const fn = direction === 'prev' ? (viewMode === 'month' ? subMonths : subYears) : (viewMode === 'month' ? addMonths : addYears);
    setCurrentDate(fn(currentDate, 1));
  };
  
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      const allPendingIds = filteredPayments
        .filter(p => p.status !== 'paid')
        .map(p => p.id);
      setSelectedPayments(allPendingIds);
    } else {
      setSelectedPayments([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedPayments(prev => [...prev, id]);
    } else {
      setSelectedPayments(prev => prev.filter(paymentId => paymentId !== id));
    }
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
            {format(currentDate, viewMode === 'month' ? "MMMM 'de' yyyy" : 'yyyy', { locale: ptBR })}
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por descrição ou cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <div className="flex items-center gap-2">
            {selectedPayments.length > 0 && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white animate-fade-in"
                onClick={() => batchPayMutation.mutate(selectedPayments)}
                disabled={batchPayMutation.isPending}
              >
                {batchPayMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Marcar como Pago ({selectedPayments.length})
              </Button>
            )}
            <ToggleGroup type="single" value={filterType} onValueChange={(value) => value && setFilterType(value as any)} size="sm">
                <ToggleGroupItem value="all">Todas</ToggleGroupItem>
                <ToggleGroupItem value="income">Receitas</ToggleGroupItem>
                <ToggleGroupItem value="expense">Despesas</ToggleGroupItem>
            </ToggleGroup>
        
            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'month' | 'year')} size="sm">
                <ToggleGroupItem value="month">Mês</ToggleGroupItem>
                <ToggleGroupItem value="year">Ano</ToggleGroupItem>
            </ToggleGroup>
        </div>
            
        </CardHeader>
        <CardContent className="p-0"><Table><TableHeader><TableRow>
          <TableHead className="w-[40px] px-2 text-center">
            <Checkbox
              onCheckedChange={handleSelectAll}
              checked={
                filteredPayments.filter(p => p.status !== 'paid').length > 0 &&
                selectedPayments.length === filteredPayments.filter(p => p.status !== 'paid').length
              }
              aria-label="Selecionar todos"
            />
          </TableHead>
          <TableHead className="w-[40px] text-center">Tipo</TableHead><TableHead>Descrição / Cliente</TableHead><TableHead className="text-right">Valor</TableHead>
          <TableHead className="text-center">Status</TableHead><TableHead>Vencimento</TableHead><TableHead className="text-right">Ações</TableHead>
        </TableRow></TableHeader><TableBody>
          {isLoading ? ([...Array(5)].map((_, i) => (<TableRow key={i}><TableCell className="text-center"><Skeleton className="h-5 w-5 rounded-full" /></TableCell><TableCell><Skeleton className="h-4 w-40" /></TableCell><TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell><TableCell className="text-center"><Skeleton className="h-6 w-24 mx-auto" /></TableCell><TableCell><Skeleton className="h-4 w-24" /></TableCell><TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell></TableRow>))) 
          : filteredPayments.length > 0 ? (
            filteredPayments.map(payment => {
              const isExpense = (payment.amount || 0) < 0;
              const isOverdue = isPast(parseISO(payment.due_date)) && payment.status === 'pending';
              const receipt = receiptMap.get(payment.id);

              return (
                <TableRow key={payment.id} className="hover:bg-muted/50" data-state={selectedPayments.includes(payment.id) ? 'selected' : ''}>
                  <TableCell className="px-2 text-center">
                    {payment.status !== 'paid' && (
                      <Checkbox
                        checked={selectedPayments.includes(payment.id)}
                        onCheckedChange={(checked) => handleSelectOne(payment.id, !!checked)}
                        aria-label="Selecionar pagamento"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-center">{isExpense ? <ArrowDown className="h-5 w-5 text-red-500 mx-auto" /> : <ArrowUp className="h-5 w-5 text-green-500 mx-auto" />}</TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-800 flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                            <AvatarImage src={payment.clients?.avatar_url || ''} />
                            <AvatarFallback className="text-xs">{payment.clients?.name?.substring(0,2)}</AvatarFallback>
                        </Avatar>
                        <span>{payment.clients?.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground pl-7">
                        {payment.notes}
                    </div>
                  </TableCell>
                  <TableCell className={`text-right font-bold ${isExpense ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`text-xs ${isOverdue ? 'border-red-300 bg-red-100 text-red-700' : 'border-gray-300'}`}>
                      {isOverdue ? 'Vencido' : translateStatus(payment.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(payment.due_date)}</TableCell>
                  <TableCell className="text-right">
                    {(() => {
                        if (receipt) {
                            if (receipt.status === 'Emitido') {
                                return (
                                    <a href={receipt.url_recibo || '#'} target="_blank" rel="noopener noreferrer" onClick={(e) => !receipt.url_recibo && e.preventDefault()}>
                                        <Badge role="button" className="mr-2 gap-2 text-xs cursor-pointer bg-green-100 text-green-800 border-green-300 hover:bg-green-200">
                                            <FileCheck className="h-3 w-3" />
                                            Baixar Recibo
                                        </Badge>
                                    </a>
                                );
                            } else { 
                                return (
                                    <Badge className="mr-2 gap-2 text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Pendente
                                    </Badge>
                                );
                            }
                        } else if (user?.receita_saude_enabled && payment.status === 'paid' && !isExpense) {
                            return (
                                <Badge 
                                    role="button"
                                    className="mr-2 gap-2 text-xs cursor-pointer bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200"
                                    onClick={() => handleOpenReceiptPrompt(payment)}
                                >
                                  <FileSignature className="h-3 w-3" />
                                  Emitir Recibo
                                </Badge>
                            );
                        }
                        return null;
                    })()}
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
          ) : (<TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">Nenhum lançamento encontrado para este período.</TableCell></TableRow>)}
        </TableBody></Table></CardContent>
      </Card>
      
      <AlertDialog open={isDescriptionPromptOpen} onOpenChange={setIsDescriptionPromptOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descrição para o Recibo</AlertDialogTitle>
            <AlertDialogDescription>
              Você pode usar a descrição padrão do lançamento ou adicionar uma personalizada para este recibo específico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="receipt-description">Descrição Personalizada (Opcional)</Label>
            <Textarea
              id="receipt-description"
              ref={descriptionInputRef}
              placeholder={paymentForReceipt?.notes || "Ex: Referente às sessões do mês de Junho..."}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReceiptEmission} disabled={createReceiptMutation.isPending}>
              {createReceiptMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enfileirar Emissão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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