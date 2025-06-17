import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// UI Components
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Search, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Trash2, 
  Send,
  Eye,
  Loader2
} from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator'; // <<< CORREÇÃO AQUI

// Types
type MessageQueueItem = Database['public']['Tables']['message_queue']['Row'];
type MessageToDelete = { id: string; recipient_whatsapp: string | null; };
type MessageToRequeue = { id: string; recipient_whatsapp: string | null; };

const ITEMS_PER_PAGE = 20;

const MessageReports: React.FC = () => {
  const [filters, setFilters] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [viewingMessage, setViewingMessage] = useState<MessageQueueItem | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<MessageToDelete | null>(null);
  const [messageToRequeue, setMessageToRequeue] = useState<MessageToRequeue | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<MessageQueueItem[], Error>({
    queryKey: ['message_queue_raw'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_queue')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({ title: "Erro ao buscar mensagens", description: error.message, variant: "destructive" });
        throw error;
      }
      
      return data || [];
    },
  });

  const filteredAndPaginatedMessages = useMemo(() => {
    if (!data) return { data: [], totalCount: 0 };

    let filtered = data;

    if (filters.length > 0) {
        filtered = filtered.filter(msg => msg.status && filters.includes(msg.status));
    }

    if (searchTerm) {
        const lowerCaseSearch = searchTerm.toLowerCase();
        filtered = filtered.filter(msg =>
            (msg.message_body || '').toLowerCase().includes(lowerCaseSearch) ||
            (msg.recipient_whatsapp || '').toLowerCase().includes(lowerCaseSearch) ||
            (msg.user_id || '').toLowerCase().includes(lowerCaseSearch) ||
            (msg.client_id || '').toLowerCase().includes(lowerCaseSearch) ||
            (msg.error_message || '').toLowerCase().includes(lowerCaseSearch)
        );
    }
    
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    
    return {
        data: filtered.slice(start, end),
        totalCount: filtered.length
    };
  }, [data, filters, searchTerm, page]);
  
  const totalPages = Math.ceil((filteredAndPaginatedMessages.totalCount || 0) / ITEMS_PER_PAGE);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('message_queue').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Mensagem excluída com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['message_queue_raw'] });
    },
    onError: (err: any) => toast({ title: "Erro ao excluir", description: err.message, variant: 'destructive' }),
    onSettled: () => setMessageToDelete(null)
  });

  const requeueMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('message_queue').update({ status: 'pending', error_message: null, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Mensagem reenfileirada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['message_queue_raw'] });
    },
    onError: (err: any) => toast({ title: "Erro ao reenfileirar", description: err.message, variant: 'destructive' }),
    onSettled: () => setMessageToRequeue(null)
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-400 text-yellow-600 bg-yellow-50"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'sent':
        return <Badge variant="outline" className="border-green-400 text-green-600 bg-green-50"><CheckCircle className="h-3 w-3 mr-1" />Enviado</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Desconhecido'}</Badge>;
    }
  };

  const handleFilterChange = (newFilters: string[]) => {
    setFilters(newFilters);
    setPage(1);
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
            <Button variant="ghost" size="sm" asChild className="mb-2 -ml-4">
                <Link to="/admin">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar ao Dashboard Admin
                </Link>
            </Button>
            <h1 className="text-3xl font-bold text-tanotado-navy">Relatório de Envios</h1>
            <p className="text-muted-foreground mt-2">Acompanhe o status das mensagens enviadas pelo sistema.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar..." className="pl-10" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} />
              </div>
              <ToggleGroup type="multiple" value={filters} onValueChange={handleFilterChange} className="justify-start">
                  <ToggleGroupItem value="pending">Pendente</ToggleGroupItem>
                  <ToggleGroupItem value="sent">Enviado</ToggleGroupItem>
                  <ToggleGroupItem value="error">Erro</ToggleGroupItem>
              </ToggleGroup>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Destinatário (WhatsApp)</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredAndPaginatedMessages.data.length > 0 ? (
                  filteredAndPaginatedMessages.data.map((item: MessageQueueItem) => (
                    <TableRow key={item.id}>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="font-medium">{item.recipient_whatsapp || 'N/A'}</TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono">{item.user_id}</TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">{item.message_body}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>{formatDistanceToNow(parseISO(item.created_at), { locale: ptBR, addSuffix: true })}</TooltipTrigger>
                            <TooltipContent>{format(parseISO(item.created_at), 'dd/MM/yyyy HH:mm:ss')}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingMessage(item)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={requeueMutation.isPending} onClick={() => setMessageToRequeue({id: item.id, recipient_whatsapp: item.recipient_whatsapp})}><Send className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={deleteMutation.isPending} onClick={() => setMessageToDelete({id: item.id, recipient_whatsapp: item.recipient_whatsapp})}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Nenhuma mensagem encontrada com os filtros selecionados.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">Mostrando {filteredAndPaginatedMessages.data.length} de {filteredAndPaginatedMessages.totalCount} resultados</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Anterior</Button>
              <span className="text-sm">Página {page} de {totalPages > 0 ? totalPages : 1}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Próximo</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Message Dialog */}
      <Dialog open={!!viewingMessage} onOpenChange={() => setViewingMessage(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Mensagem</DialogTitle>
            <DialogDescription>Para: {viewingMessage?.recipient_whatsapp}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <h3 className="font-semibold">Conteúdo da Mensagem</h3>
            <p className="text-sm bg-muted p-4 rounded-md whitespace-pre-wrap">{viewingMessage?.message_body}</p>
            {viewingMessage?.status === 'error' && viewingMessage.error_message && (
              <>
                <h3 className="font-semibold text-destructive">Mensagem de Erro</h3>
                <p className="text-sm bg-destructive/10 text-destructive p-4 rounded-md whitespace-pre-wrap">{viewingMessage.error_message}</p>
              </>
            )}
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-semibold">User ID:</span><p className="font-mono text-xs">{viewingMessage?.user_id}</p></div>
                <div><span className="font-semibold">Client ID:</span><p className="font-mono text-xs">{viewingMessage?.client_id || 'N/A'}</p></div>
                <div><span className="font-semibold">Instance ID:</span><p className="font-mono text-xs">{viewingMessage?.instance_id}</p></div>
                <div><span className="font-semibold">Appointment ID:</span><p className="font-mono text-xs">{viewingMessage?.appointment_id || 'N/A'}</p></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Requeue Confirmation */}
      <AlertDialog open={!!messageToRequeue} onOpenChange={() => setMessageToRequeue(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar Reenvio</AlertDialogTitle><AlertDialogDescription>Deseja marcar esta mensagem para ser enviada novamente? Ela voltará para o estado "Pendente".</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => requeueMutation.mutate(messageToRequeue!.id)} disabled={requeueMutation.isPending}>{requeueMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Reenviar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!messageToDelete} onOpenChange={() => setMessageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir esta mensagem da fila? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(messageToDelete!.id)} disabled={deleteMutation.isPending} className="bg-destructive hover:bg-destructive/90">{deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default MessageReports;