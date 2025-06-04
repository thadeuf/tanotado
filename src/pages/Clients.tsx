
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Search, Filter, Edit, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useClients } from '@/hooks/useClients';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Clients: React.FC = () => {
  const navigate = useNavigate();
  const { data: clients = [], isLoading, error, refetch, isFetching } = useClients();
  const [searchTerm, setSearchTerm] = React.useState('');

  console.log('🏠 Clients page rendered - clients count:', clients.length, 'isLoading:', isLoading, 'error:', error?.message);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  );

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    refetch();
  };

  if (error) {
    console.error('❌ Error in Clients page:', error);
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                Erro ao carregar clientes: {error.message}
              </AlertDescription>
            </Alert>
            <div className="space-x-2">
              <Button onClick={handleRefresh} disabled={isFetching}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                {isFetching ? 'Recarregando...' : 'Tentar novamente'}
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Recarregar página
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    console.log('⏳ Clients page loading...');
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-6 w-6" />
              Clientes
            </h1>
            <p className="text-gray-600 mt-1">
              Carregando clientes...
            </p>
          </div>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  console.log('✅ Clients page rendered successfully with', filteredClients.length, 'filtered clients');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Clientes
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie seus clientes e suas informações
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={() => navigate('/clientes/novo')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="default">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Clients Table */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm 
              ? 'Tente ajustar os termos de busca.' 
              : 'Comece adicionando seu primeiro cliente.'
            }
          </p>
          {!searchTerm && (
            <Button onClick={() => navigate('/clientes/novo')}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Cliente
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow 
                  key={client.id} 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    console.log('🔗 Navigating to client edit:', client.id);
                    navigate(`/clientes/${client.id}/editar`);
                  }}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={client.photo_url || ''} alt={client.name} />
                        <AvatarFallback className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple text-white text-xs">
                          {client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        {client.email && (
                          <div className="text-sm text-gray-500">{client.email}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {client.cpf || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {client.phone || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={client.active_registration ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {client.active_registration ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('✏️ Edit button clicked for client:', client.id);
                        navigate(`/clientes/${client.id}/editar`);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Clients;
