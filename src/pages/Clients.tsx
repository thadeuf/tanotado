
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Filter, Plus, Phone, Edit, Upload, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useClients } from '@/hooks/useClients';

const Clients: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('active');

  const { data: clients = [], isLoading, error } = useClients();

  const filteredClients = React.useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === 'all' || activeFilter === 'active';
      return matchesSearch && matchesFilter;
    });
  }, [clients, searchTerm, activeFilter]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-tanotado-purple',
      'bg-tanotado-blue', 
      'bg-tanotado-pink',
      'bg-tanotado-orange',
      'bg-tanotado-green'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return '-';
    return phone;
  };

  const handleClientClick = (clientId: string) => {
    navigate(`/clientes/${clientId}`);
  };

  const handleEditClick = (e: React.MouseEvent, clientId: string) => {
    e.stopPropagation();
    navigate(`/clientes/${clientId}/editar`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tanotado-purple mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando clientes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-muted-foreground">Erro ao carregar clientes. Tente novamente.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-tanotado-navy">
            {user?.clientNomenclature || 'Clientes'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {filteredClients.length} registros encontrados
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters and Actions */}
            <div className="flex items-center gap-3">
              {/* Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={activeFilter} onValueChange={setActiveFilter}>
                    <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="active">Ativos</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="inactive">Inativos</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Options Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Opções
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuItem className="gap-2">
                    <Upload className="h-4 w-4" />
                    Importar
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <Download className="h-4 w-4" />
                    Exportar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* New Client Button */}
              <Button 
                onClick={() => navigate('/clientes/novo')}
                className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple hover:shadow-lg transition-all duration-200 gap-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Novo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <Card>
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/30 font-medium text-sm text-muted-foreground">
            <div className="col-span-4">Nome e Sobrenome</div>
            <div className="col-span-2 text-center">CPF</div>
            <div className="col-span-2 text-center">WhatsApp</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-2 text-center">Ações</div>
          </div>

          {/* Table Body */}
          <div className="divide-y">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchTerm ? (
                  <div>
                    <p>Nenhum cliente encontrado para "{searchTerm}"</p>
                    <p className="text-sm mt-1">Tente ajustar os filtros ou termo de busca</p>
                  </div>
                ) : (
                  <div>
                    <p>Nenhum cliente cadastrado ainda</p>
                    <Button 
                      onClick={() => navigate('/clientes/novo')}
                      className="mt-4 bg-gradient-to-r from-tanotado-pink to-tanotado-purple hover:shadow-lg transition-all duration-200"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Cadastrar primeiro cliente
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              filteredClients.map((client) => (
                <div 
                  key={client.id} 
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => handleClientClick(client.id)}
                >
                  {/* Name */}
                  <div className="col-span-4 flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={client.photo_url || undefined} alt={client.name} />
                      <AvatarFallback className={`${getAvatarColor(client.name)} text-white font-medium`}>
                        {getInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-tanotado-navy hover:text-tanotado-purple transition-colors">{client.name}</span>
                  </div>

                  {/* CPF */}
                  <div className="col-span-2 text-center text-muted-foreground">
                    {client.cpf || '-'}
                  </div>

                  {/* WhatsApp */}
                  <div className="col-span-2 text-center">
                    {client.phone ? (
                      <div className="flex items-center justify-center gap-1 text-tanotado-blue">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm">{formatPhone(client.phone)}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-span-2 text-center">
                    <Badge 
                      variant="secondary"
                      className="bg-tanotado-blue/10 text-tanotado-blue hover:bg-tanotado-blue/20"
                    >
                      Ativo
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={(e) => handleEditClick(e, client.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Clients;
