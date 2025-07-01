import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, fromUnixTime } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, Calendar, Download, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// A interface agora espera o link direto do PDF da fatura/recibo.
interface StripeInvoice {
  id: string;
  created: number;
  total: number;
  paid: boolean;
  invoice_pdf: string | null; // <-- O campo correto para o PDF
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
}

const ManageSubscriptionPage: React.FC = () => {
    const { user, isLoading: isUserLoading } = useAuth();
    const [invoices, setInvoices] = useState<StripeInvoice[]>([]);
    const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);

    useEffect(() => {
        const fetchInvoices = async () => {
            if (user) {
                try {
                    const { data, error } = await supabase.functions.invoke('get-stripe-invoices');
                    if (error) throw error;
                    setInvoices(data);
                } catch (error: any) {
                    toast({ title: "Erro ao buscar faturas", description: error.message, variant: "destructive" });
                } finally {
                    setIsLoadingInvoices(false);
                }
            }
        };

        if (!isUserLoading) {
            fetchInvoices();
        }
    }, [user, isUserLoading]);
    
    const getStatusInfo = () => {
        if (!user || !user.stripe_subscription_status) {
            return { text: 'Desconhecido', className: 'bg-gray-100 text-gray-800' };
        }
        
        switch (user.stripe_subscription_status) {
            case 'active':
            case 'trialing':
                return { text: 'Ativa', className: 'bg-green-100 text-green-800' };
            case 'past_due':
            case 'unpaid':
                return { text: 'Pagamento Pendente', className: 'bg-yellow-100 text-yellow-800' };
            case 'canceled':
                return { text: 'Cancelada', className: 'bg-red-100 text-red-800' };
            default:
                return { text: user.stripe_subscription_status, className: 'bg-gray-100 text-gray-800' };
        }
    };

    const renewalDate = user?.subscription_current_period_end 
        ? format(parseISO(user.subscription_current_period_end), "PPP", { locale: ptBR })
        : 'Não aplicável';

    const statusInfo = getStatusInfo();
    
    if (isUserLoading) {
        return (
            <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
                <Skeleton className="h-10 w-3/4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-tanotado-navy">Gerenciar Assinatura</h1>
                <p className="text-muted-foreground mt-1">
                    Aqui você pode visualizar os detalhes do seu plano e informações de pagamento.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="w-full">
                    <CardHeader className="flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-medium">Status da Assinatura</CardTitle>
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-tanotado-navy">
                            {statusInfo.text}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Baseado nas informações da sua fatura.
                        </p>
                    </CardContent>
                </Card>

                <Card className="w-full bg-gradient-to-r from-tanotado-pink to-tanotado-purple text-white">
                    <CardHeader className="flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-medium">Próxima Cobrança</CardTitle>
                        <Calendar className="h-5 w-5 text-white/80" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {renewalDate}
                        </div>
                        <p className="text-xs text-white/80">
                            {user?.stripe_subscription_status === 'active' 
                                ? "Data da renovação automática do seu plano."
                                : "A assinatura não será renovada."
                            }
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="w-full mt-6">
                <CardHeader>
                    <CardTitle>Histórico de Pagamentos</CardTitle>
                    <CardDescription>
                        Acesse aqui os recibos de todos os seus pagamentos anteriores.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Valor</TableHead>
                                    <TableHead className="text-right">Recibo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingInvoices ? (
                                    [...Array(3)].map((_, i) => (
                                        <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                                    ))
                                ) : invoices.length > 0 ? (
                                    invoices.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell className="font-medium">{format(fromUnixTime(invoice.created), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell>
                                                <Badge variant={invoice.paid ? "default" : "destructive"} className={invoice.paid ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}>
                                                    {invoice.status === 'paid' ? 'Pago' : 'Pendente'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {(invoice.total / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {/* --- O BOTÃO AGORA USA O CAMPO invoice_pdf --- */}
                                                {invoice.invoice_pdf && (
                                                    <Button variant="outline" size="icon" asChild>
                                                        <a href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer" title="Baixar Recibo (PDF)">
                                                            <Download className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                            Nenhum histórico de pagamento encontrado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                 <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4">
                   <div className="space-x-2">
                     <Button disabled>Alterar Plano (em breve)</Button>
                     <Button variant="outline" disabled>Cancelar Assinatura (em breve)</Button>
                   </div>
                   <p className="text-xs text-muted-foreground text-left sm:text-right">
                        Para alterações ou dúvidas, entre em contato com o suporte.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default ManageSubscriptionPage;