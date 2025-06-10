import React, { useState, useMemo, useCallback } from 'react';
// AQUI ESTÁ A CORREÇÃO: Adicionando useMutation ao import
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

// Hooks e Componentes
import { useAuth } from '@/contexts/AuthContext';
import { useClients, Client } from '@/hooks/useClients';
import { RecordForm } from '@/components/prontuarios/RecordForm';
import { Database } from '@/integrations/supabase/types';

// UI
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, FileText, UserPlus, Edit, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

type MedicalRecord = Database['public']['Tables']['medical_records']['Row'];

const Prontuarios: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: clients = [], isLoading: isLoadingClients } = useClients();
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<MedicalRecord | null>(null);

  const { data: records, isLoading: isLoadingRecords } = useQuery({
    queryKey: ['medical_records', selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('client_id', selectedClient.id)
        .order('session_date', { ascending: false });
      if (error) throw error;
      return data as MedicalRecord[];
    },
    enabled: !!selectedClient,
  });

  const deleteMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase.from('medical_records').delete().eq('id', recordId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Registro excluído com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['medical_records', selectedClient?.id] });
      setRecordToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir registro", description: error.message, variant: "destructive" });
    },
  });

  const filteredClients = useMemo(() =>
    clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [clients, searchTerm]);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingRecord(null);
  };

  const handleAddNewRecord = () => {
    setEditingRecord(null);
    setIsFormOpen(true);
  };
  
  const handleEditRecord = (record: MedicalRecord) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const getAvatarColor = (name: string) => {
    const colors = ['bg-tanotado-purple', 'bg-tanotado-blue', 'bg-tanotado-pink', 'bg-tanotado-orange', 'bg-tanotado-green'];
    return colors[name.length % colors.length];
  };

  return (
    <div className="grid lg:grid-cols-[400px_1fr] gap-6 h-[calc(100vh-8rem)] items-start animate-fade-in">
      {/* Coluna da Esquerda: Lista de Clientes */}
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Selecione o {user?.clientNomenclature || 'Cliente'}</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1">
          <ScrollArea className="h-full">
            {isLoadingClients ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredClients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors ${selectedClient?.id === client.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'}`}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={client.avatar_url || undefined} />
                      <AvatarFallback className={`${getAvatarColor(client.name)} text-white`}>{getInitials(client.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{client.name}</span>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Coluna da Direita: Prontuários do Cliente Selecionado */}
      <Card className="h-full flex flex-col">
        {selectedClient ? (
          <>
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11">
                  <AvatarImage src={selectedClient.avatar_url || undefined} />
                  <AvatarFallback className={`${getAvatarColor(selectedClient.name)} text-white`}>{getInitials(selectedClient.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{selectedClient.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">Prontuário Digital</p>
                </div>
              </div>
              <Button onClick={handleAddNewRecord} className="gap-2 bg-gradient-to-r from-tanotado-pink to-tanotado-purple">
                <Plus className="h-4 w-4" /> Novo Registro
              </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[calc(100vh-16rem)]">
                    <div className="p-4 space-y-3">
                    {isLoadingRecords ? (
                        [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
                    ) : records && records.length > 0 ? (
                        records.map(record => (
                        <div key={record.id} className="border rounded-lg p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <FileText className="h-6 w-6 text-tanotado-blue" />
                                <div>
                                    <p className="font-semibold">{record.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Data: {format(new Date(record.session_date), 'dd/MM/yyyy')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEditRecord(record)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setRecordToDelete(record)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </div>
                        ))
                    ) : (
                        <div className="text-center py-16">
                            <FileText className="mx-auto h-16 w-16 text-muted-foreground/50" />
                            <h3 className="mt-4 text-xl font-semibold text-tanotado-navy">Nenhum registro encontrado</h3>
                            <p className="mt-2 text-sm text-muted-foreground">Crie o primeiro registro para {selectedClient.name}.</p>
                            <Button onClick={handleAddNewRecord} className="mt-6 bg-gradient-to-r from-tanotado-pink to-tanotado-purple gap-2">
                                <Plus className="h-4 w-4" /> Criar Primeiro Registro
                            </Button>
                        </div>
                    )}
                    </div>
                </ScrollArea>
            </CardContent>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <UserPlus className="mx-auto h-20 w-20 text-muted-foreground/30" />
            <h3 className="mt-4 text-2xl font-semibold text-tanotado-navy">Selecione um {user?.clientNomenclature || 'Cliente'}</h3>
            <p className="mt-2 text-muted-foreground">
              Escolha um {user?.clientNomenclature || 'cliente'} na lista ao lado para visualizar ou adicionar seus prontuários.
            </p>
            <ArrowRight className="mt-8 h-10 w-10 text-muted-foreground/20 animate-pulse-horizontal" />
          </div>
        )}
      </Card>
      
      {/* Dialog para Criar/Editar Registro */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle className="text-xl">
                    {editingRecord ? `Editando registro de ${selectedClient?.name}` : `Novo registro para ${selectedClient?.name}`}
                </DialogTitle>
            </DialogHeader>
            {selectedClient && (
                <RecordForm 
                    client={selectedClient} 
                    onSuccess={handleFormSuccess}
                    initialData={editingRecord}
                />
            )}
        </DialogContent>
      </Dialog>

      {/* Alert para Excluir Registro */}
      <AlertDialog open={!!recordToDelete} onOpenChange={() => setRecordToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                    Tem certeza que deseja excluir o registro "{recordToDelete?.title}"? Esta ação não poderá ser desfeita.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={() => recordToDelete && deleteMutation.mutate(recordToDelete.id)} 
                    disabled={deleteMutation.isPending}
                    className="bg-destructive hover:bg-destructive/90"
                >
                    {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Excluir
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Prontuarios;