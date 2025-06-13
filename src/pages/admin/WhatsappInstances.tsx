// src/pages/admin/WhatsappInstances.tsx

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Loader2, QrCode, Trash2, Phone, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type Instance = Database['public']['Tables']['instances']['Row'] & {
    telefone_conectado?: string | null;
};

const WhatsappInstances: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isQrCodeDialogOpen, setIsQrCodeDialogOpen] = useState(false);
  const [instanceName, setInstanceName] = useState('');
  const [currentInstanceName, setCurrentInstanceName] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [instanceToDelete, setInstanceToDelete] = useState<Instance | null>(null);
  const [loggingOutInstance, setLoggingOutInstance] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const updateInstanceMutation = useMutation({
    mutationFn: async (payload: { id: string; newStatus: string; newPhoneNumber: string | null; }) => {
      const { error } = await supabase.from('instances')
        .update({ status: payload.newStatus, telefone_conectado: payload.newPhoneNumber })
        .eq('id', payload.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['db_instances'] }); },
  });

  const { data: instances = [], isLoading: isLoadingInstances } = useQuery<Instance[], Error>({
    queryKey: ['db_instances', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: dbInstances, error: dbError } = await supabase.from('instances').select('*').eq('user_id', user.id);
      if (dbError) { toast({ title: 'Erro ao buscar instâncias no DB.', description: dbError.message, variant: 'destructive' }); throw dbError; }
      if (!dbInstances) return [];
      
      try {
        const evoResponse = await fetch('https://apievo.tanotado.com.br/instance/fetchInstances', { headers: { 'apikey': 'b09fd007cb06707d5c18ec80ca2a0fde' } });
        const liveInstancesData = await evoResponse.json();
        const liveInstanceMap = new Map(liveInstancesData.map((inst: any) => [inst.name, inst]));

        const updatedInstances = dbInstances.map(dbInstance => {
            const liveInstance = liveInstanceMap.get(dbInstance.nome_instancia);
            const newStatus = liveInstance?.connectionStatus === 'open' ? 'connected' : 'disconnected';
            const newPhoneNumber = liveInstance?.ownerJid ? liveInstance.ownerJid.split('@')[0] : null;

            if (dbInstance.status !== newStatus || dbInstance.telefone_conectado !== newPhoneNumber) {
                updateInstanceMutation.mutate({ id: dbInstance.id, newStatus, newPhoneNumber });
            }
            
            return { ...dbInstance, status: newStatus, telefone_conectado: newPhoneNumber };
        });
        return updatedInstances;
      } catch (error) {
        console.error("Falha ao buscar status da Evolution API, mostrando dados locais.", error);
        return dbInstances;
      }
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!isQrCodeDialogOpen || !currentInstanceName) return;
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`https://apievo.tanotado.com.br/instance/connectionState/${currentInstanceName}`, { headers: { 'apikey': 'b09fd007cb06707d5c18ec80ca2a0fde' } });
        if (response.ok) {
          const data = await response.json();
          if (data?.instance?.state === 'open') {
            clearInterval(intervalId);
            setIsQrCodeDialogOpen(false);
            toast({ title: 'Conectado com sucesso!', className: 'bg-green-100 text-green-800' });
            queryClient.invalidateQueries({ queryKey: ['db_instances'] });
          }
        }
      } catch (error) { clearInterval(intervalId); }
    }, 3000);
    return () => clearInterval(intervalId);
  }, [isQrCodeDialogOpen, currentInstanceName, queryClient]);

  const createInstanceMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("Usuário não autenticado.");
      const evoResponse = await fetch('https://apievo.tanotado.com.br/instance/create', { method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': 'b09fd007cb06707d5c18ec80ca2a0fde' }, body: JSON.stringify({ instanceName: name, qrcode: true, integration: "WHATSAPP-BAILEYS" }) });
      if (!evoResponse.ok) throw new Error((await evoResponse.json()).message || 'Falha ao criar na Evolution API.');
      const evoData = await evoResponse.json();
      if (!evoData?.hash) throw new Error("Hash (token) não recebido da API.");
      const { error: dbError } = await supabase.from('instances').insert({ user_id: user.id, nome_instancia: name, status: evoData.instance.status || 'connecting', token: evoData.hash });
      if (dbError) throw new Error(`Erro ao salvar no banco de dados: ${dbError.message}`);
    },
    onSuccess: () => { toast({ title: 'Instância criada com sucesso!', description: 'Clique em "Conectar" para ler o QR Code.' }); queryClient.invalidateQueries({ queryKey: ['db_instances'] }); setIsCreateDialogOpen(false); setInstanceName(''); },
    onError: (error: any) => toast({ title: 'Erro ao criar instância', description: error.message, variant: 'destructive' })
  });

  const connectInstanceMutation = useMutation({
    mutationFn: async (instanceNameToConnect: string) => {
      setQrCode(null); setCurrentInstanceName(instanceNameToConnect); setIsQrCodeDialogOpen(true);
      const response = await fetch(`https://apievo.tanotado.com.br/instance/connect/${instanceNameToConnect}`, { method: 'GET', headers: { 'apikey': 'b09fd007cb06707d5c18ec80ca2a0fde' } });
      if (!response.ok) throw new Error((await response.json()).message || 'Falha ao obter QR Code.');
      return response.json();
    },
    onSuccess: (data) => { if (data?.base64) setQrCode(data.base64); else throw new Error("QR Code (base64) não encontrado na API."); },
    onError: (error: any) => { toast({ title: "Erro ao conectar", description: error.message, variant: 'destructive' }); setIsQrCodeDialogOpen(false); }
  });

  const logoutInstanceMutation = useMutation({
    mutationFn: async (instance: Instance) => {
      setLoggingOutInstance(instance.id);
      await fetch(`https://apievo.tanotado.com.br/instance/logout/${instance.nome_instancia}`, { method: 'DELETE', headers: { 'apikey': 'b09fd007cb06707d5c18ec80ca2a0fde' } });
      // A atualização no banco de dados será feita pelo polling, mas podemos forçar aqui para uma UI mais rápida
      updateInstanceMutation.mutate({ id: instance.id, newStatus: 'disconnected', newPhoneNumber: null });
    },
    onSuccess: () => { toast({ title: 'Instância desconectada com sucesso!' }); queryClient.invalidateQueries({ queryKey: ['db_instances'] }); },
    onError: (error: any) => toast({ title: 'Erro ao desconectar instância', description: error.message, variant: 'destructive' }),
    onSettled: () => setLoggingOutInstance(null)
  });

  const deleteInstanceMutation = useMutation({
    mutationFn: async (instance: Instance) => {
      await fetch(`https://apievo.tanotado.com.br/instance/delete/${instance.nome_instancia}`, { method: 'DELETE', headers: { 'apikey': 'b09fd007cb06707d5c18ec80ca2a0fde' } });
      const { error: dbError } = await supabase.from('instances').delete().eq('id', instance.id);
      if (dbError) throw new Error(`Erro ao deletar do banco de dados: ${dbError.message}`);
    },
    onSuccess: () => { toast({ title: 'Instância excluída com sucesso!' }); queryClient.invalidateQueries({ queryKey: ['db_instances'] }); },
    onError: (error: any) => toast({ title: 'Erro ao excluir instância', description: error.message, variant: 'destructive' }),
    onSettled: () => setInstanceToDelete(null)
  });

  const handleCreateInstance = () => { if (instanceName.trim()) createInstanceMutation.mutate(instanceName.trim()); else toast({ title: 'Erro', description: 'O nome da instância é obrigatório.', variant: 'destructive' }); };
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'connecting': return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">Conectando</Badge>;
      case 'connected': return <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">Conectado</Badge>;
      default: return <Badge variant="destructive">Desconectado</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-tanotado-navy">Instâncias do WhatsApp</h1><p className="text-muted-foreground mt-2">Gerencie as conexões para envio de mensagens.</p></div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Nova Instância</Button></DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Criar Nova Instância</DialogTitle><DialogDescription>Insira um nome único para a sua nova instância.</DialogDescription></DialogHeader>
            <div className="space-y-2 py-4"><Label htmlFor="instanceName">Nome</Label><Input id="instanceName" value={instanceName} onChange={(e) => setInstanceName(e.target.value)} placeholder="Ex: ClinicaPrincipal" disabled={createInstanceMutation.isPending} /></div>
            <DialogFooter><Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button><Button onClick={handleCreateInstance} disabled={createInstanceMutation.isPending}>{createInstanceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Criar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader><CardTitle>Lista de Instâncias</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Status</TableHead><TableHead>Telefone Conectado</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoadingInstances ? ([...Array(3)].map((_, i) => <TableRow key={i}><TableCell><Skeleton className="h-4 w-40" /></TableCell><TableCell><Skeleton className="h-6 w-24" /></TableCell><TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell className="text-right"><Skeleton className="h-9 w-full max-w-[200px] ml-auto" /></TableCell></TableRow>)) :
               instances.length > 0 ? (instances.map((instance) => (
                <TableRow key={instance.id}>
                  <TableCell className="font-medium">{instance.nome_instancia}</TableCell>
                  <TableCell>{getStatusBadge(instance.status)}</TableCell>
                  <TableCell>{instance.telefone_conectado ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4"/> +{instance.telefone_conectado}</div> : '-'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {instance.status === 'connected' ? 
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => logoutInstanceMutation.mutate(instance)} disabled={loggingOutInstance === instance.id}>{loggingOutInstance === instance.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4"/>} Desconectar</Button>
                        :
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => connectInstanceMutation.mutate(instance.nome_instancia)} disabled={connectInstanceMutation.isPending && currentInstanceName === instance.nome_instancia}>{(connectInstanceMutation.isPending && currentInstanceName === instance.nome_instancia) ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4"/>} Conectar</Button>
                    }
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setInstanceToDelete(instance)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))) :
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-10">Nenhuma instância foi criada ainda.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={isQrCodeDialogOpen} onOpenChange={setIsQrCodeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Conectar: {currentInstanceName}</DialogTitle><DialogDescription>Abra o WhatsApp, vá para Aparelhos Conectados e escaneie o código.</DialogDescription></DialogHeader>
          <div className="flex items-center justify-center p-4 min-h-[250px]">{qrCode ? <img src={qrCode} alt={`QR Code para ${currentInstanceName}`} className="rounded-lg border" /> : <div className="flex flex-col items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /><p className="mt-2 text-muted-foreground">Gerando QR Code...</p></div>}</div>
          <DialogFooter><Button onClick={() => setIsQrCodeDialogOpen(false)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!instanceToDelete} onOpenChange={() => setInstanceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir a instância <strong>"{instanceToDelete?.nome_instancia}"</strong>? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90" disabled={deleteInstanceMutation.isPending} onClick={() => { if (instanceToDelete) deleteInstanceMutation.mutate(instanceToDelete); }}>{deleteInstanceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WhatsappInstances;