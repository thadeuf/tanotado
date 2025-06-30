// src/pages/Clients.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Plus, UserPlus, MessageCircle, Loader2, CheckCircle, XCircle } from 'lucide-react'; 
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ClientForm } from '@/components/forms/ClientForm';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Database } from '@/integrations/supabase/types'; 

// Re-importa a interface Client do hook para garantir a tipagem correta
import type { Client } from '@/hooks/useClients'; 


const Clients: React.FC = () => {
  const { user } = useAuth(); // Acessando o usuário autenticado aqui
  const queryClient = useQueryClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'active' | 'inactive' | 'pending' | 'all'>('active'); 
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [clientToChangeStatus, setClientToChangeStatus] = useState<Client | null>(null); 
  const [targetApprovalStatus, setTargetApprovalStatus] = useState<Database['public']['Enums']['client_approval_status'] | null>(null);


  const clientNomenclature = user?.clientNomenclature || 'Cliente'; 
  const pluralNomenclature = (word: string) => { 
    const capitalized = word.charAt(0).toUpperCase() + word.slice(1); 
    if (capitalized.endsWith('s')) return capitalized; 
    return `${capitalized}s`; 
  };
  const dynamicTitle = pluralNomenclature(clientNomenclature); 

  const fetchClients = useCallback(async () => {
    if (!user) return; 
    setIsLoading(true); 
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true }) 
      .eq('user_id', user.id); 

    if (error) { 
      console.error('Erro ao buscar clientes:', error); 
    } else if (data) {
      setClients(data as Client[]); 
    }
    setIsLoading(false); 
  }, [user]); 

  useEffect(() => {
    fetchClients(); 
  }, [fetchClients]); 

  const handleCreateSuccess = () => {
    setIsFormOpen(false); 
    fetchClients(); 
  };

  const filteredClients = clients.filter(client => {
    if (client.name.toLowerCase() === 'minha clínica') {
        return false;
    }
    const matchesSearch = searchTerm ? client.name.toLowerCase().includes(searchTerm.toLowerCase()) : true; 
    
    let matchesFilter = false;
    if (activeFilter === 'all') {
      matchesFilter = true;
    } else if (activeFilter === 'active') {
      matchesFilter = client.is_active === true;
    } else if (activeFilter === 'inactive') {
      matchesFilter = client.is_active === false && client.approval_status !== 'pending'; 
    } else if (activeFilter === 'pending') {
      matchesFilter = client.approval_status === 'pending';
    }

    return matchesSearch && matchesFilter; 
  });

  const getInitials = (name: string) => { 
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(); 
  };

  const getAvatarColor = (name: string) => { 
    const colors = ['bg-tanotado-purple', 'bg-tanotado-blue', 'bg-tanotado-pink', 'bg-tanotado-orange', 'bg-tanotado-green']; 
    const index = name.length % colors.length; 
    return colors[index]; 
  };
  
  const formatCPF = (cpf: string | null): string => { 
    if (!cpf) return '-'; 
    const cleaned = cpf.replace(/\D/g, ''); 
    if (cleaned.length !== 11) return cpf; 
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'); 
  };

  const formatWhatsApp = (phone: string | null): string => { 
    if (!phone) return '-'; 
    const cleaned = phone.replace(/\D/g, ''); 
    
    if (cleaned.startsWith('55') && cleaned.length === 13) { 
      const ddi = cleaned.slice(0, 2); 
      const ddd = cleaned.slice(2, 4); 
      const firstPart = cleaned.slice(4, 9); 
      const secondPart = cleaned.slice(9); 
      return `+${ddi} (${ddd}) ${firstPart}-${secondPart}`; 
    }
    return phone; 
  };

  const renderLoadingSkeleton = () => ( 
    <div className="divide-y">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="grid grid-cols-8 gap-4 p-4 items-center">
          <div className="col-span-4 flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-32" /></div>
          <div className="col-span-2 text-center"><Skeleton className="h-4 w-20 mx-auto" /></div>
          <div className="col-span-2 text-center"><Skeleton className="h-4 w-24 mx-auto" /></div>
        </div>
      ))}
    </div>
  );

  const renderEmptyState = () => ( 
    <div className="text-center py-16">
      <UserPlus className="mx-auto h-16 w-16 text-muted-foreground/50" />
      <h3 className="mt-4 text-xl font-semibold text-tanotado-navy">Nenhum {clientNomenclature.toLowerCase()} encontrado</h3>
      <p className="mt-2 text-sm text-muted-foreground">Parece que você ainda não tem nenhum {clientNomenclature.toLowerCase()} cadastrado.</p>
      <Button onClick={() => setIsFormOpen(true)} className="mt-6 bg-gradient-to-r from-tanotado-pink to-tanotado-purple hover:shadow-lg transition-all duration-200 gap-2">
        <Plus className="h-4 w-4" />
        Cadastrar primeiro {clientNomenclature.toLowerCase()}
      </Button>
    </div>
  );

  const updateApprovalStatusMutation = useMutation({
    mutationFn: async ({ clientId, status }: { clientId: string; status: Database['public']['Enums']['client_approval_status'] }) => {
      const new_is_active = status === 'approved'; 

      const { error } = await supabase
        .from('clients')
        .update({ approval_status: status, is_active: new_is_active }) 
        .eq('id', clientId);
      if (error) throw error;
    },
    onSuccess: (data, variables) => { 
      toast({ title: "Status do cliente atualizado!", description: `Cliente marcado como ${variables.status}.` }); 
      queryClient.invalidateQueries({ queryKey: ['clients'] }); 
      setClientToChangeStatus(null); 
      setTargetApprovalStatus(null); 
    },
    onError: (error: any) => { 
      toast({ title: "Erro ao atualizar status", description: error.message, variant: "destructive" }); 
    },
  });

  const handleOpenStatusChangeDialog = (client: Client, status: Database['public']['Enums']['client_approval_status']) => { 
    setClientToChangeStatus(client); 
    setTargetApprovalStatus(status); 
  };

  const handleConfirmStatusChange = () => { 
    if (clientToChangeStatus && targetApprovalStatus) { 
      updateApprovalStatusMutation.mutate({ clientId: clientToChangeStatus.id, status: targetApprovalStatus }); 
    }
  };


  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-tanotado-navy">{dynamicTitle}</h1>
          <p className="text-muted-foreground mt-1">{isLoading ? 'Carregando...' : `${filteredClients.length} registros encontrados`}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <div className="flex items-center gap-3">
              
              {/* Botões de filtro: Ativos, Inativos, Pendentes */}
              <div className="flex items-center gap-2">
                <Button 
                  variant={activeFilter === 'active' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setActiveFilter('active')} 
                  className={activeFilter === 'active' ? 'bg-tanotado-blue hover:bg-tanotado-blue/90' : ''}
                >
                  Ativos
                </Button>
                <Button 
                  variant={activeFilter === 'inactive' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setActiveFilter('inactive')} 
                  className={activeFilter === 'inactive' ? 'bg-gray-500 hover:bg-gray-500/90' : ''}
                >
                  Inativos
                </Button>
                {/* Botão "Pendentes" visível APENAS SE public_booking_enabled for true */}
                {user?.public_booking_enabled && (
                  <Button 
                    variant={activeFilter === 'pending' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setActiveFilter('pending')} 
                    className={activeFilter === 'pending' ? 'bg-orange-500 hover:bg-orange-500/90' : 'text-orange-500 border-orange-200 hover:bg-orange-50'}
                  >
                    Pendentes
                  </Button>
                )}
              </div>
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button type="button" className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple hover:shadow-lg transition-all duration-200 gap-2" size="sm">
                    <Plus className="h-4 w-4" />Novo
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo {clientNomenclature}</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="flex-grow pr-6 -mr-6">
                    <ClientForm onSuccess={handleCreateSuccess} onAvatarChange={() => {}} />
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-8 gap-4 p-4 border-b bg-muted/30 font-medium text-sm text-muted-foreground">
            <div className="col-span-4">Nome</div>
            <div className="col-span-2 text-center">CPF</div>
            <div className="col-span-2 text-center">WhatsApp</div>
          </div>
          {isLoading ? (
            renderLoadingSkeleton()
          ) : filteredClients.length > 0 ? (
            <div className="divide-y">
              {filteredClients.map((client) => (
                <div 
                  key={client.id}
                  className="grid grid-cols-8 gap-4 p-4 items-center hover:bg-muted/20 transition-colors"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={client.avatar_url || undefined} alt={client.name} />
                      <AvatarFallback className={`${getAvatarColor(client.name)} text-white font-medium`}>{getInitials(client.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <Link to={`/clientes/editar/${client.id}`} className="font-medium text-tanotado-navy hover:underline">
                            {client.name}
                        </Link>
                        {/* Exibição do status de aprovação */}
                        {client.approval_status === 'pending' && (
                            <span className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                                <Loader2 className="h-3 w-3 animate-spin"/> APROVAÇÃO PENDENTE
                            </span>
                        )}
                        {client.approval_status === 'rejected' && (
                            <span className="text-xs text-red-600 flex items-center gap-1 mt-1">
                                <XCircle className="h-3 w-3"/> REJEITADO
                            </span>
                        )}
                    </div>
                  </div>
                  <div className="col-span-2 text-center text-muted-foreground">{formatCPF(client.cpf)}</div>
                  <div className="col-span-2 text-center flex items-center justify-center gap-2">
                    {client.whatsapp ? (
                      <a 
                        href={`https://wa.me/${client.whatsapp.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center justify-center gap-1 text-tanotado-blue hover:underline"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm">{formatWhatsApp(client.whatsapp)}</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                    {/* Botões de Ação para mudar approval_status */}
                    {/* Botões de Aprovar/Rejeitar aparecem APENAS se o filtro ativo for 'pending' */}
                    {/* E, claro, apenas se o approval_status for 'pending' */}
                    {activeFilter === 'pending' && client.approval_status === 'pending' && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs bg-green-500 text-white hover:bg-green-600"
                                onClick={() => handleOpenStatusChangeDialog(client, 'approved')}
                            >
                                <CheckCircle className="h-3 w-3 mr-1" /> Aprovar
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200"
                                onClick={() => handleOpenStatusChangeDialog(client, 'rejected')}
                            >
                                <XCircle className="h-3 w-3 mr-1" /> Rejeitar
                            </Button>
                        </>
                    )}
                    {/* Fora do filtro 'pending', a gestão de status pode ser feita na tela de edição do cliente.
                        Removendo os botões adicionais para evitar confusão.
                        Apenas o link "Editar" que já leva para a página de edição deve bastar.
                    */}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            renderEmptyState()
          )}
        </CardContent>
      </Card>

      {/* AlertDialog para confirmar mudança de status */}
      <AlertDialog open={!!clientToChangeStatus} onOpenChange={() => setClientToChangeStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Mudança de Status</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja marcar o cliente <strong>{clientToChangeStatus?.name}</strong> como {' '}
              <strong>{targetApprovalStatus === 'approved' ? 'Aprovado' : targetApprovalStatus === 'rejected' ? 'Rejeitado' : 'Pendente'}</strong>?
              {targetApprovalStatus === 'approved' && " Ele(a) poderá fazer agendamentos diretos e será visível na sua agenda."}
              {targetApprovalStatus === 'rejected' && " Ele(a) não poderá fazer agendamentos diretos via link público."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
                onClick={handleConfirmStatusChange} 
                disabled={updateApprovalStatusMutation.isPending}
                className={
                    targetApprovalStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' : 
                    (targetApprovalStatus === 'rejected' ? 'bg-destructive hover:bg-destructive/90' : '')
                }
            >
              {updateApprovalStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Clients;