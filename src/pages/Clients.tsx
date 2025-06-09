import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Filter, Plus, UserPlus, MessageCircle } from 'lucide-react'; 
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ClientForm } from '@/components/forms/ClientForm';

type Client = {
  id: string;
  name: string;
  cpf: string | null;
  whatsapp: string | null;
  status: 'active' | 'inactive';
  avatar_url: string | null;
  user_id: string;
};

const Clients: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('active');
  const [isFormOpen, setIsFormOpen] = useState(false);

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
      .order('created_at', { ascending: false })
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
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || client.status === activeFilter;
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
              <Button variant="outline" size="sm" className="gap-2"><Filter className="h-4 w-4" />Filtros</Button>
              <div className="flex items-center gap-2">
                <Button variant={activeFilter === 'active' ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter('active')} className={activeFilter === 'active' ? 'bg-tanotado-blue hover:bg-tanotado-blue/90' : ''}>Ativos</Button>
                <Button variant={activeFilter === 'inactive' ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter('inactive')} className={activeFilter === 'inactive' ? 'bg-gray-500 hover:bg-gray-500/90' : ''}>Inativos</Button>
              </div>
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button type="button" className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple hover:shadow-lg transition-all duration-200 gap-2" size="sm">
                    <Plus className="h-4 w-4" />Novo
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo {clientNomenclature}</DialogTitle>
                  </DialogHeader>
                  <ClientForm onSuccess={handleCreateSuccess} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {/* MUDANÇA: Cabeçalho da tabela ajustado */}
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
                // MUDANÇA: A div da linha agora é um componente Link
                <Link
                  key={client.id}
                  to={`/clientes/editar/${client.id}`}
                  className="grid grid-cols-8 gap-4 p-4 items-center hover:bg-muted/20 transition-colors cursor-pointer"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={client.avatar_url || undefined} alt={client.name} />
                      <AvatarFallback className={`${getAvatarColor(client.name)} text-white font-medium`}>{getInitials(client.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-tanotado-navy">{client.name}</span>
                  </div>
                  <div className="col-span-2 text-center text-muted-foreground">{formatCPF(client.cpf)}</div>
                  <div className="col-span-2 text-center">
                    {client.whatsapp ? (
                      <div className="flex items-center justify-center gap-1 text-tanotado-blue">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm">{formatWhatsApp(client.whatsapp)}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            renderEmptyState()
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Clients;