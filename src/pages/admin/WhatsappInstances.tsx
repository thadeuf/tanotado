// src/pages/admin/WhatsappInstances.tsx

import React, { useState, useEffect, useCallback } from 'react';
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
import { Plus, Loader2, QrCode, Trash2, Phone, LogOut, RefreshCw, Shuffle, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { MigrateUsersDialog } from '@/components/admin/MigrateUsersDialog';

type Instance = Database['public']['Tables']['instances']['Row'] & {
    telefone_conectado?: string | null;
    associated_users_count?: number;
};

type Proxy = {
    id: number;
    proxy_address: string;
    port: string;
    username: string;
    password: string;
};

const apiKey = import.meta.env.VITE_EVOLUTION_API_KEY;

const WhatsappInstances: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isQrCodeDialogOpen, setIsQrCodeDialogOpen] = useState(false);
  const [instanceName, setInstanceName] = useState('');
  const [useProxy, setUseProxy] = useState(false); 
  // --- INÍCIO DA ADIÇÃO 1: Estado para o novo switch ---
  const [useWebhook, setUseWebhook] = useState(true);
  // --- FIM DA ADIÇÃO 1 ---
  const [currentInstanceName, setCurrentInstanceName] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [instanceToDelete, setInstanceToDelete] = useState<Instance | null>(null);
  const [loggingOutInstance, setLoggingOutInstance] = useState<string | null>(null);
  const [restartingInstance, setRestartingInstance] = useState<string | null>(null);
  const [changingProxyInstance, setChangingProxyInstance] = useState<string | null>(null);
  const [isMigrateDialogOpen, setIsMigrateDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // --- INÍCIO DA ADIÇÃO 2: Query para buscar a URL do webhook ---
  const { data: webhookSettings } = useQuery({
    queryKey: ['admin_settings', 'reminder_response_webhook'],
    queryFn: async () => {
      if (!user || user.role !== 'admin') return null;
      const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'reminder_response_webhook')
        .maybeSingle();

      if (error) {
        // Não lançar um erro fatal, mas notificar o usuário
        toast({ title: "Aviso: Não foi possível carregar a URL do webhook.", description: error.message, variant: "default" });
        return null;
      }
      return data;
    },
    enabled: !!user && user.role === 'admin'
  });
  // --- FIM DA ADIÇÃO 2 ---

  const notifyDisconnection = useCallback(async (disconnectedInstanceName: string) => {
    const webhookUrl = 'https://webhook.artideia.com.br/webhook/zapCaiu';
    console.log(`%cWEBHOOK: Enviando notificação para a instância: ${disconnectedInstanceName}`, 'color: #f00');
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName: disconnectedInstanceName }),
      });
      toast({ title: "Notificação Enviada", description: `Webhook de desconexão para ${disconnectedInstanceName} foi acionado.` });
    } catch (error) {
      console.error('Falha ao enviar o webhook de desconexão:', error);
      toast({ title: "Erro de Webhook", description: "Não foi possível notificar o sistema sobre a desconexão.", variant: "destructive" });
    }
  }, []);

  const updateInstanceMutation = useMutation({
    mutationFn: async (payload: { id: string; newStatus: string; newPhoneNumber: string | null; }) => {
      const { error } = await supabase.from('instances')
        .update({ status: payload.newStatus, telefone_conectado: payload.newPhoneNumber })
        .eq('id', payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instances_with_user_count', user?.id] });
    },
    onError: (error: any) => {
        toast({ title: "Erro ao atualizar instância no banco.", description: error.message, variant: "destructive" });
    }
  });

  const { data: instances = [], isLoading: isLoadingInstances } = useQuery<Instance[], Error>({
    queryKey: ['instances_with_user_count', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.rpc('get_instances_with_user_count');
      if (error) {
        toast({ title: 'Erro ao buscar instâncias.', description: error.message, variant: 'destructive' });
        throw error;
      }
      return (data as Instance[]) || [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!isQrCodeDialogOpen || !currentInstanceName) return;
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`https://apievo.tanotado.com.br/instance/connectionState/${currentInstanceName}`, { headers: { 'apikey': apiKey } });
        if (response.ok) {
          const data = await response.json();
          if (data?.instance?.state === 'open') {
            clearInterval(intervalId);
            setIsQrCodeDialogOpen(false);
            toast({ title: 'Conectado com sucesso!', description: 'Buscando número de telefone...', className: 'bg-green-100 text-green-800' });
            const instanceToUpdate = instances.find(inst => inst.nome_instancia === currentInstanceName);
            if (!instanceToUpdate) {
                queryClient.invalidateQueries({ queryKey: ['instances_with_user_count', user?.id] });
                return;
            }
            try {
                const fullDetailsResponse = await fetch(`https://apievo.tanotado.com.br/instance/fetchInstances`, { headers: { 'apikey': apiKey } });
                const allInstancesData = await fullDetailsResponse.json();
                const connectedInstanceData = allInstancesData.find((inst: any) => inst.name === currentInstanceName);
                const newPhoneNumber = connectedInstanceData?.ownerJid ? connectedInstanceData.ownerJid.split('@')[0] : null;
                updateInstanceMutation.mutate({ id: instanceToUpdate.id, newStatus: 'connected', newPhoneNumber: newPhoneNumber, });
            } catch (e) {
                console.error("Não foi possível buscar o número do telefone após conectar, atualizando apenas o status.", e);
                updateInstanceMutation.mutate({ id: instanceToUpdate.id, newStatus: 'connected', newPhoneNumber: null, });
            }
          }
        }
      } catch (error) { clearInterval(intervalId); }
    }, 3000);
    return () => clearInterval(intervalId);
  }, [isQrCodeDialogOpen, currentInstanceName, queryClient, user?.id, instances, updateInstanceMutation]);
  
  useEffect(() => {
    const syncInstances = async () => {
      if (!user) return;
      
      console.log(`%c[SYNC] Inciando verificação... (${new Date().toLocaleTimeString()})`, 'color: #888');

      try {
        const { data: dbInstances, error: dbError } = await supabase.rpc('get_instances_with_user_count');
        if (dbError || !dbInstances) { console.error("[SYNC] Falha ao buscar dados do DB.", dbError); return; }
        
        console.log("[SYNC] Dados do DB:", dbInstances);

        const evoResponse = await fetch('https://apievo.tanotado.com.br/instance/fetchInstances', { headers: { 'apikey': apiKey } });
        if (!evoResponse.ok) return;
        const liveInstancesData = await evoResponse.json();

        console.log("[SYNC] Dados da API Evolution:", liveInstancesData);

        const liveInstanceMap = new Map(liveInstancesData.map((inst: any) => [inst.name, inst]));

        for (const dbInstance of dbInstances as Instance[]) {
          const liveInstance = liveInstanceMap.get(dbInstance.nome_instancia);
          const liveStatus = liveInstance?.connectionStatus === 'open' ? 'connected' : 'disconnected';
          
          console.log(`%c[SYNC] Verificando '${dbInstance.nome_instancia}': Status no DB: '${dbInstance.status}', Status na API: '${liveStatus}'`, 'color: #00f');
          
          if (dbInstance.status !== liveStatus) {
            console.log(`%c[SYNC] >> DIFERENÇA ENCONTRADA para '${dbInstance.nome_instancia}'!`, 'font-weight: bold; color: #f00');

            if (dbInstance.status === 'connected' && liveStatus === 'disconnected') {
              notifyDisconnection(dbInstance.nome_instancia);
            }
            
            const livePhoneNumber = liveInstance?.ownerJid ? liveInstance.ownerJid.split('@')[0] : null;
            updateInstanceMutation.mutate({ id: dbInstance.id, newStatus: liveStatus, newPhoneNumber: livePhoneNumber });
          }
        }
      } catch (error) {
        console.error("Falha na sincronização de instâncias em segundo plano:", error);
      }
    };

    syncInstances();
    const syncInterval = setInterval(syncInstances, 60000);
    return () => clearInterval(syncInterval);
  }, [user, updateInstanceMutation, notifyDisconnection]);

  // --- INÍCIO DA ADIÇÃO 3: Lógica principal de criação da instância ---
  const createInstanceMutation = useMutation({
    mutationFn: async ({ name, useProxy, useWebhook }: { name: string; useProxy: boolean; useWebhook: boolean }) => {
      if (!user) throw new Error("Usuário não autenticado.");

      const webhookUrl = (webhookSettings?.value as any)?.url;
      if (useWebhook && (!webhookUrl || webhookUrl.trim() === '')) {
        throw new Error("A ativação de webhook está ligada, mas nenhuma URL foi configurada nas Configurações de Admin.");
      }
      
      const payload: any = {
        instanceName: name,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
        groupsIgnore: true, // Adicionado conforme solicitado
      };

      if (useWebhook && webhookUrl) {
        payload.webhook = {
          url: webhookUrl,
          events: ["MESSAGES_UPSERT"],
        };
      }

      const evoResponse = await fetch('https://apievo.tanotado.com.br/instance/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
        body: JSON.stringify(payload)
      });
      
      if (!evoResponse.ok) {
        const errorData = await evoResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha ao criar na Evolution API.');
      }
      
      const evoData = await evoResponse.json();
      if (!evoData?.hash) throw new Error("Hash (token) não recebido da API.");
      
      const { error: dbError } = await supabase.from('instances').insert({ user_id: user.id, nome_instancia: name, status: 'disconnected', token: evoData.hash });
      if (dbError) throw new Error(`Erro ao salvar no banco de dados: ${dbError.message}`);
      
      if (useProxy) {
        const randomProxyId = Math.floor(Math.random() * 100) + 1;
        const { data: randomProxy } = await supabase.from('proxy').select('*').eq('id', randomProxyId).single<Proxy>();
        if (!randomProxy) throw new Error("Instância criada, mas não foi possível encontrar um proxy aleatório.");
        const proxyPayload = { enabled: true, host: randomProxy.proxy_address, port: randomProxy.port, protocol: "http", username: randomProxy.username, password: randomProxy.password };
        await fetch(`https://apievo.tanotado.com.br/proxy/set/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': apiKey }, body: JSON.stringify(proxyPayload) });
      }
      return { useProxy };
    },
    onSuccess: () => { 
      toast({ title: 'Instância criada com sucesso!', description: 'Clique em "Conectar" para ler o QR Code.' }); 
      queryClient.invalidateQueries({ queryKey: ['instances_with_user_count', user?.id] }); 
      setIsCreateDialogOpen(false); setInstanceName(''); setUseProxy(false); setUseWebhook(true);
    },
    onError: (error: any) => toast({ title: 'Erro ao criar instância', description: error.message, variant: 'destructive' })
  });
  // --- FIM DA ADIÇÃO 3 ---

  const restartInstanceMutation = useMutation({
    mutationFn: async (instanceName: string) => {
        setRestartingInstance(instanceName);
        const response = await fetch(`https://apievo.tanotado.com.br/instance/restart/${instanceName}`, { method: 'POST', headers: { 'apikey': apiKey } });
        if (!response.ok) { const errorData = await response.json().catch(() => ({})); throw new Error(errorData.message || 'Falha ao reiniciar a instância.'); }
        return response.json();
    },
    onSuccess: (data, instanceName) => {
        toast({ title: `Instância "${instanceName}" reiniciada!`, description: `Novo estado: ${data?.instance?.state}` });
        queryClient.invalidateQueries({ queryKey: ['instances_with_user_count', user?.id] });
    },
    onError: (error: any, instanceName) => toast({ title: `Erro ao reiniciar "${instanceName}"`, description: error.message, variant: 'destructive' }),
    onSettled: () => setRestartingInstance(null)
  });

  const connectInstanceMutation = useMutation({
    mutationFn: async (instanceNameToConnect: string) => {
      setQrCode(null); setCurrentInstanceName(instanceNameToConnect); setIsQrCodeDialogOpen(true);
      const response = await fetch(`https://apievo.tanotado.com.br/instance/connect/${instanceNameToConnect}`, { method: 'GET', headers: { 'apikey': apiKey } });
      if (!response.ok) throw new Error((await response.json()).message || 'Falha ao obter QR Code.');
      return response.json();
    },
    onSuccess: (data) => { if (data?.base64) setQrCode(data.base64); else throw new Error("QR Code (base64) não encontrado na API."); },
    onError: (error: any) => { toast({ title: "Erro ao conectar", description: error.message, variant: 'destructive' }); setIsQrCodeDialogOpen(false); }
  });

  const logoutInstanceMutation = useMutation({
    mutationFn: async (instance: Instance) => {
      setLoggingOutInstance(instance.id);
      await fetch(`https://apievo.tanotado.com.br/instance/logout/${instance.nome_instancia}`, { method: 'DELETE', headers: { 'apikey': apiKey } });
      await notifyDisconnection(instance.nome_instancia);
      updateInstanceMutation.mutate({ id: instance.id, newStatus: 'disconnected', newPhoneNumber: null });
    },
    onSuccess: () => { toast({ title: 'Instância desconectada com sucesso!' }); },
    onError: (error: any) => toast({ title: 'Erro ao desconectar instância', description: error.message, variant: 'destructive' }),
    onSettled: () => setLoggingOutInstance(null)
  });

  const deleteInstanceMutation = useMutation({
    mutationFn: async (instance: Instance) => {
      await fetch(`https://apievo.tanotado.com.br/instance/delete/${instance.nome_instancia}`, { method: 'DELETE', headers: { 'apikey': apiKey } });
      const { error: dbError } = await supabase.from('instances').delete().eq('id', instance.id);
      if (dbError) throw new Error(`Erro ao deletar do banco de dados: ${dbError.message}`);
    },
    onSuccess: () => { toast({ title: 'Instância excluída com sucesso!' }); queryClient.invalidateQueries({ queryKey: ['instances_with_user_count', user?.id] }); },
    onError: (error: any) => toast({ title: 'Erro ao excluir instância', description: error.message, variant: 'destructive' }),
    onSettled: () => setInstanceToDelete(null)
  });

  const changeProxyMutation = useMutation({
    mutationFn: async (instanceName: string) => {
        setChangingProxyInstance(instanceName);
        const randomProxyId = Math.floor(Math.random() * 100) + 1;
        const { data: randomProxy, error: proxyError } = await supabase.from('proxy').select('*').eq('id', randomProxyId).single<Proxy>();
        if (proxyError) throw new Error(`Falha ao buscar proxy aleatório: ${proxyError.message}`);
        if (!randomProxy) throw new Error("Não foi possível encontrar um proxy aleatório.");
        const proxyPayload = { enabled: true, host: randomProxy.proxy_address, port: randomProxy.port, protocol: "http", username: randomProxy.username, password: randomProxy.password };
        const proxySetResponse = await fetch(`https://apievo.tanotado.com.br/proxy/set/${instanceName}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': apiKey }, body: JSON.stringify(proxyPayload) });
        if (!proxySetResponse.ok) { const proxySetErrorData = await proxySetResponse.json().catch(() => ({})); throw new Error(`Falha ao configurar o novo proxy: ${proxySetErrorData.message || 'Erro desconhecido'}`); }
        return instanceName;
    },
    onSuccess: (instanceName) => { toast({ title: 'Proxy alterado com sucesso!', description: `A instância "${instanceName}" agora está usando um novo proxy.` }); },
    onError: (error: any) => { toast({ title: 'Erro ao trocar o proxy', description: error.message, variant: 'destructive' }); },
    onSettled: () => { setChangingProxyInstance(null); }
  });

  // --- INÍCIO DA ADIÇÃO 4: Ajuste no handler para passar o novo estado ---
  const handleCreateInstance = () => { 
    if (instanceName.trim()) { 
      createInstanceMutation.mutate({ name: instanceName.trim(), useProxy, useWebhook }); 
    } else { 
      toast({ title: 'Erro', description: 'O nome da instância é obrigatório.', variant: 'destructive' }); 
    }
  };
  // --- FIM DA ADIÇÃO 4 ---

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'connecting': return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">Conectando</Badge>;
      case 'connected': return <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">Conectado</Badge>;
      default: return <Badge variant="destructive">Desconectado</Badge>;
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold text-tanotado-navy">Instâncias do WhatsApp</h1><p className="text-muted-foreground mt-2">Gerencie as conexões para envio de mensagens.</p></div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsMigrateDialogOpen(true)}><Users className="mr-2 h-4 w-4" /> Migrar Usuários</Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Nova Instância</Button></DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Criar Nova Instância</DialogTitle><DialogDescription>Insira um nome único para a sua nova instância.</DialogDescription></DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="instanceName">Nome</Label>
                    <Input id="instanceName" value={instanceName} onChange={(e) => setInstanceName(e.target.value)} placeholder="Ex: ClinicaPrincipal" disabled={createInstanceMutation.isPending} />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch id="proxy-switch" checked={useProxy} onCheckedChange={setUseProxy} disabled={createInstanceMutation.isPending} />
                    <Label htmlFor="proxy-switch">Ativar Proxy</Label>
                  </div>
                  {/* --- INÍCIO DA ADIÇÃO 5: JSX do novo switch --- */}
                  <div className="flex items-center space-x-2">
                    <Switch id="webhook-switch" checked={useWebhook} onCheckedChange={setUseWebhook} disabled={createInstanceMutation.isPending} />
                    <Label htmlFor="webhook-switch">Ativar Webhook de Respostas</Label>
                  </div>
                  {/* --- FIM DA ADIÇÃO 5 --- */}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); setUseProxy(false); setUseWebhook(true); }}>Cancelar</Button>
                  <Button onClick={handleCreateInstance} disabled={createInstanceMutation.isPending}>{createInstanceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Criar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Card>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Nome da Instância</TableHead><TableHead>Pessoas</TableHead><TableHead>Status</TableHead><TableHead>Telefone Conectado</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {isLoadingInstances ? ([...Array(3)].map((_, i) => <TableRow key={i}><TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell><Skeleton className="h-4 w-12" /></TableCell><TableCell><Skeleton className="h-6 w-24" /></TableCell><TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell className="text-right"><Skeleton className="h-9 w-full max-w-[200px] ml-auto" /></TableCell></TableRow>))
                : instances.length > 0 ? (instances.map((instance) => (
                  <TableRow key={instance.id}>
                    <TableCell className="font-medium">{instance.nome_instancia}</TableCell>
                    <TableCell><div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /><span className="font-mono text-sm">{instance.associated_users_count ?? 0}</span></div></TableCell>
                    <TableCell>{getStatusBadge(instance.status)}</TableCell>
                    <TableCell>{instance.telefone_conectado ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4"/> +{instance.telefone_conectado}</div> : '-'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {instance.status === 'connected' ? 
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => logoutInstanceMutation.mutate(instance)} disabled={loggingOutInstance === instance.id}>{loggingOutInstance === instance.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4"/>} Desconectar</Button>
                          :
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => connectInstanceMutation.mutate(instance.nome_instancia)} disabled={connectInstanceMutation.isPending && currentInstanceName === instance.nome_instancia}>{(connectInstanceMutation.isPending && currentInstanceName === instance.nome_instancia) ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4"/>} Conectar</Button>
                      }
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => changeProxyMutation.mutate(instance.nome_instancia)} disabled={changingProxyInstance === instance.nome_instancia} title="Trocar Proxy Aleatoriamente">{changingProxyInstance === instance.nome_instancia ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shuffle className="h-4 w-4" />}</Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => restartInstanceMutation.mutate(instance.nome_instancia)} disabled={restartingInstance === instance.nome_instancia} title="Reiniciar Instância">{restartingInstance === instance.nome_instancia ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}</Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setInstanceToDelete(instance)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))) : <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Nenhuma instância foi criada ainda.</TableCell></TableRow>}
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
      <MigrateUsersDialog isOpen={isMigrateDialogOpen} onOpenChange={setIsMigrateDialogOpen} />
    </>
  );
};

export default WhatsappInstances;

