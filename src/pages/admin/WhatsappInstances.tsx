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
// INÍCIO DA ALTERAÇÃO: Adicionado o ícone 'Shuffle'
import { Plus, Loader2, QrCode, Trash2, Phone, LogOut, RefreshCw, Shuffle, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
// FIM DA ALTERAÇÃO
import { MigrateUsersDialog } from '@/components/admin/MigrateUsersDialog'; // <<< NOVO IMPORT

type Instance = Database['public']['Tables']['instances']['Row'] & {
    telefone_conectado?: string | null;
    associated_users_count?: number; // Este é o campo virtual que recebemos da função
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
  const [currentInstanceName, setCurrentInstanceName] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [instanceToDelete, setInstanceToDelete] = useState<Instance | null>(null);
  const [loggingOutInstance, setLoggingOutInstance] = useState<string | null>(null);
  const [restartingInstance, setRestartingInstance] = useState<string | null>(null);
  const [changingProxyInstance, setChangingProxyInstance] = useState<string | null>(null);
  const [isMigrateDialogOpen, setIsMigrateDialogOpen] = useState(false); // <<< NOVO ESTADO
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const updateInstanceMutation = useMutation({
    mutationFn: async (payload: { id: string; newStatus: string; newPhoneNumber: string | null; }) => {
      const { error } = await supabase.from('instances')
        .update({ status: payload.newStatus, telefone_conectado: payload.newPhoneNumber })
        .eq('id', payload.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['instances_with_user_count', user?.id] }); },
  });

  // =================================================================================
  // ESTA É A PARTE MAIS IMPORTANTE!
  // Note que estamos usando supabase.rpc('get_instances_with_user_count')
  // para chamar a função que calcula a contagem, em vez de ler a tabela diretamente.
  // =================================================================================
  const { data: instances = [], isLoading: isLoadingInstances } = useQuery<Instance[], Error>({
    queryKey: ['instances_with_user_count', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: instancesWithCount, error: rpcError } = await supabase.rpc('get_instances_with_user_count');
      
      if (rpcError) {
        toast({ title: 'Erro ao buscar instâncias.', description: rpcError.message, variant: 'destructive' });
        throw rpcError;
      }
      if (!instancesWithCount) return [];

      try {
        const evoResponse = await fetch('https://apievo.tanotado.com.br/instance/fetchInstances', { headers: { 'apikey': apiKey } });
        if (!evoResponse.ok) throw new Error('Falha ao buscar dados da API Evolution.');
        const liveInstancesData = await evoResponse.json();
        const liveInstanceMap = new Map(liveInstancesData.map((inst: any) => [inst.instanceName, inst]));

        const updatedInstances = (instancesWithCount as Instance[]).map(dbInstance => {
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
        console.error("Falha ao buscar status da Evolution API, mostrando dados do DB.", error);
        return instancesWithCount as Instance[];
      }
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  // ... (O restante do código do componente permanece o mesmo)
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
            toast({ title: 'Conectado com sucesso!', className: 'bg-green-100 text-green-800' });
            queryClient.invalidateQueries({ queryKey: ['instances_with_user_count', user?.id] });
          }
        }
      } catch (error) { clearInterval(intervalId); }
    }, 3000);
    return () => clearInterval(intervalId);
  }, [isQrCodeDialogOpen, currentInstanceName, queryClient]);

  const createInstanceMutation = useMutation({
    mutationFn: async ({ name, useProxy }: { name: string, useProxy: boolean }) => {
      if (!user) throw new Error("Usuário não autenticado.");

      const evoResponse = await fetch('https://apievo.tanotado.com.br/instance/create', { method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': apiKey }, body: JSON.stringify({ instanceName: name, qrcode: true, integration: "WHATSAPP-BAILEYS" }) });
      if (!evoResponse.ok) throw new Error((await evoResponse.json()).message || 'Falha ao criar na Evolution API.');
      const evoData = await evoResponse.json();
      if (!evoData?.hash) throw new Error("Hash (token) não recebido da API.");

      const { error: dbError } = await supabase.from('instances').insert({ user_id: user.id, nome_instancia: name, status: 'connecting', token: evoData.hash });
      if (dbError) throw new Error(`Erro ao salvar no banco de dados: ${dbError.message}`);

      if (useProxy) {
        const randomProxyId = Math.floor(Math.random() * 100) + 1;
        const { data: randomProxy, error: proxyError } = await supabase
            .from('proxy')
            .select('*')
            .eq('id', randomProxyId)
            .single<Proxy>();

        if (proxyError) throw new Error(`Instância criada, mas falha ao buscar proxy: ${proxyError.message}`);
        if (!randomProxy) throw new Error("Instância criada, mas não foi possível encontrar um proxy aleatório.");
        
        const proxyPayload = {
            enabled: true,
            host: randomProxy.proxy_address,
            port: randomProxy.port,
            protocol: "http",
            username: randomProxy.username,
            password: randomProxy.password,
        };

        const proxySetResponse = await fetch(`https://apievo.tanotado.com.br/proxy/set/${name}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
            body: JSON.stringify(proxyPayload)
        });

        if (!proxySetResponse.ok) {
            const proxySetErrorData = await proxySetResponse.json().catch(() => ({}));
            throw new Error(`Instância criada, mas falha ao configurar o proxy: ${proxySetErrorData.message || 'Erro desconhecido'}`);
        }
      }

      return { useProxy };
    },
    onSuccess: (result) => { 
      const description = result.useProxy 
        ? 'Proxy ativado com sucesso. Clique em "Conectar" para ler o QR Code.' 
        : 'Clique em "Conectar" para ler o QR Code.';
      toast({ title: 'Instância criada com sucesso!', description }); 
      queryClient.invalidateQueries({ queryKey: ['instances_with_user_count', user?.id] }); 
      setIsCreateDialogOpen(false); 
      setInstanceName(''); 
      setUseProxy(false);
    },
    onError: (error: any) => toast({ title: 'Erro ao criar instância', description: error.message, variant: 'destructive' })
  });

  const restartInstanceMutation = useMutation({
    mutationFn: async (instanceName: string) => {
        setRestartingInstance(instanceName);
        const response = await fetch(`https://apievo.tanotado.com.br/instance/restart/${instanceName}`, {
            method: 'POST',
            headers: { 'apikey': 'b09fd007cb06707d5c18ec80ca2a0fde' },
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Falha ao reiniciar a instância.');
        }
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
      updateInstanceMutation.mutate({ id: instance.id, newStatus: 'disconnected', newPhoneNumber: null });
    },
    onSuccess: () => { toast({ title: 'Instância desconectada com sucesso!' }); queryClient.invalidateQueries({ queryKey: ['instances_with_user_count', user?.id] }); },
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
        const { data: randomProxy, error: proxyError } = await supabase
            .from('proxy')
            .select('*')
            .eq('id', randomProxyId)
            .single<Proxy>();

        if (proxyError) throw new Error(`Falha ao buscar proxy aleatório: ${proxyError.message}`);
        if (!randomProxy) throw new Error("Não foi possível encontrar um proxy aleatório.");

        const proxyPayload = {
            enabled: true,
            host: randomProxy.proxy_address,
            port: randomProxy.port,
            protocol: "http",
            username: randomProxy.username,
            password: randomProxy.password,
        };

        const proxySetResponse = await fetch(`https://apievo.tanotado.com.br/proxy/set/${instanceName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
            body: JSON.stringify(proxyPayload)
        });

        if (!proxySetResponse.ok) {
            const proxySetErrorData = await proxySetResponse.json().catch(() => ({}));
            throw new Error(`Falha ao configurar o novo proxy: ${proxySetErrorData.message || 'Erro desconhecido'}`);
        }
        return instanceName;
    },
    onSuccess: (instanceName) => {
        toast({ title: 'Proxy alterado com sucesso!', description: `A instância "${instanceName}" agora está usando um novo proxy.` });
    },
    onError: (error: any) => {
        toast({ title: 'Erro ao trocar o proxy', description: error.message, variant: 'destructive' });
    },
    onSettled: () => {
        setChangingProxyInstance(null);
    }
  });

  const handleCreateInstance = () => { 
    if (instanceName.trim()) {
        createInstanceMutation.mutate({ name: instanceName.trim(), useProxy }); 
    } else {
        toast({ title: 'Erro', description: 'O nome da instância é obrigatório.', variant: 'destructive' }); 
    }
  };

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
          {/* INÍCIO DA ALTERAÇÃO */}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsMigrateDialogOpen(true)}>
              <Users className="mr-2 h-4 w-4" /> Migrar Usuários
            </Button>
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
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); setUseProxy(false); }}>Cancelar</Button>
                  <Button onClick={handleCreateInstance} disabled={createInstanceMutation.isPending}>{createInstanceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Criar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {/* FIM DA ALTERAÇÃO */}
        </div>
        <Card>
          
          <CardContent>
            <Table>
              <TableHeader>
                  <TableRow>
                      <TableHead>Nome da Instância</TableHead>
                      <TableHead>Pessoas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Telefone Conectado</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingInstances ? (
                  [...Array(3)].map((_, i) => <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-9 w-full max-w-[200px] ml-auto" /></TableCell>
                  </TableRow>)
                ) :
                instances.length > 0 ? (instances.map((instance) => (
                  <TableRow key={instance.id}>
                    <TableCell className="font-medium">{instance.nome_instancia}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span className="font-mono text-sm">{instance.associated_users_count ?? 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(instance.status)}</TableCell>
                    <TableCell>{instance.telefone_conectado ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4"/> +{instance.telefone_conectado}</div> : '-'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {instance.status === 'connected' ? 
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => logoutInstanceMutation.mutate(instance)} disabled={loggingOutInstance === instance.id}>{loggingOutInstance === instance.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4"/>} Desconectar</Button>
                          :
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => connectInstanceMutation.mutate(instance.nome_instancia)} disabled={connectInstanceMutation.isPending && currentInstanceName === instance.nome_instancia}>{(connectInstanceMutation.isPending && currentInstanceName === instance.nome_instancia) ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4"/>} Conectar</Button>
                      }
                      <Button
                        variant="ghost" size="icon" className="h-9 w-9"
                        onClick={() => changeProxyMutation.mutate(instance.nome_instancia)}
                        disabled={changingProxyInstance === instance.nome_instancia}
                        title="Trocar Proxy Aleatoriamente"
                      >
                        {changingProxyInstance === instance.nome_instancia ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shuffle className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-9 w-9"
                        onClick={() => restartInstanceMutation.mutate(instance.nome_instancia)}
                        disabled={restartingInstance === instance.nome_instancia}
                        title="Reiniciar Instância"
                      >
                        {restartingInstance === instance.nome_instancia ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      </Button>

                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setInstanceToDelete(instance)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))) :
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Nenhuma instância foi criada ainda.</TableCell></TableRow>}
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

      {/* <<< NOVO MODAL RENDERIZADO AQUI >>> */}
      <MigrateUsersDialog isOpen={isMigrateDialogOpen} onOpenChange={setIsMigrateDialogOpen} />
    </>
  );
};

export default WhatsappInstances;