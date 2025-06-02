
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Filter, Plus, Phone, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Clients: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('active');

  // Mock data - será substituído por dados reais do Supabase
  const mockClients = [
    {
      id: '1',
      name: 'José',
      cpf: '-',
      whatsapp: '-',
      status: 'active',
      avatar: null
    },
    {
      id: '2',
      name: 'Paciente teste A',
      cpf: '-',
      whatsapp: '(21) 99999-9999',
      status: 'active',
      avatar: null
    },
    {
      id: '3',
      name: 'Paciente teste A1',
      cpf: '-',
      whatsapp: '(21) 96686-1333',
      status: 'active',
      avatar: null
    }
  ];

  const filteredClients = mockClients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || client.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

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
              {/* Filter Icon */}
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </Button>

              {/* Status Filters */}
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
              </div>

              {/* Options Button */}
              <Button variant="outline" size="sm">
                Opções
              </Button>

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
            {filteredClients.map((client) => (
              <div key={client.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/20 transition-colors">
                {/* Name */}
                <div className="col-span-4 flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={client.avatar} alt={client.name} />
                    <AvatarFallback className={`${getAvatarColor(client.name)} text-white font-medium`}>
                      {getInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-tanotado-navy">{client.name}</span>
                </div>

                {/* CPF */}
                <div className="col-span-2 text-center text-muted-foreground">
                  {client.cpf}
                </div>

                {/* WhatsApp */}
                <div className="col-span-2 text-center">
                  {client.whatsapp !== '-' ? (
                    <div className="flex items-center justify-center gap-1 text-tanotado-blue">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">{client.whatsapp}</span>
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
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Clients;
