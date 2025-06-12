// src/pages/AdminDashboard.tsx

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, UserPlus, UserX, MoreHorizontal, CheckCircle, Clock, Calendar as CalendarIcon, MessageSquare, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Tipos para os dados do dashboard
type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileWithCounts = Profile & {
  client_count: number;
  appointment_count: number;
  last_sign_in_at: string | null;
  login_count: number | null;
};

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    subscribed: true,
    trial: true,
    inactive: false,
  });

  const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery<ProfileWithCounts[], Error>({
    queryKey: ['all_users_admin_with_counts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_profiles_with_counts');
      if (error) {
        toast({ title: "Erro ao buscar dados do admin", description: error.message, variant: "destructive" });
        throw new Error(error.message);
      }
      return (data as ProfileWithCounts[]) || [];
    },
    enabled: user?.role === 'admin',
  });

  // Função para determinar o status do usuário (usado na lógica de filtro)
  const getUserStatus = (profile: Profile) => {
    if (profile.is_subscribed) return 'subscribed';
    if (profile.trial_ends_at && new Date(profile.trial_ends_at) < new Date()) return 'inactive';
    return 'trial';
  };

  const filteredUsers = useMemo(() => {
    const selectedStatuses: string[] = [];
    if (filters.subscribed) selectedStatuses.push('subscribed');
    if (filters.trial) selectedStatuses.push('trial');
    if (filters.inactive) selectedStatuses.push('inactive');

    return allUsers.filter(profile => {
      const lowerCaseSearch = searchTerm.toLowerCase();
      const matchesSearch = lowerCaseSearch === '' ||
        profile.name?.toLowerCase().includes(lowerCaseSearch) ||
        profile.email?.toLowerCase().includes(lowerCaseSearch) ||
        profile.whatsapp?.toLowerCase().includes(lowerCaseSearch);

      if (!matchesSearch) return false;

      if (selectedStatuses.length === 0) return true;

      const userStatus = getUserStatus(profile);
      return selectedStatuses.includes(userStatus);
    });
  }, [allUsers, searchTerm, filters]);

  const stats = useMemo(() => {
    if (!allUsers) return { totalUsers: 0, totalSubscribers: 0, newSubscribersCount: 0, cancellationsCount: 0 };
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const totalUsers = allUsers.length;
    const totalSubscribers = allUsers.filter(u => u.is_subscribed).length;
    const newSubscribersCount = allUsers.filter(u => u.subscribed_at && new Date(u.subscribed_at) >= startOfMonth).length;
    const cancellationsCount = allUsers.filter(u => u.canceled_at && new Date(u.canceled_at) >= startOfMonth).length;
    return { totalUsers, totalSubscribers, newSubscribersCount, cancellationsCount };
  }, [allUsers]);
  
  const adminStats = [
    { title: 'Total de Usuários', value: stats.totalUsers.toString(), icon: Users, color: 'from-blue-500 to-blue-400' },
    { title: 'Novos Assinantes (mês)', value: stats.newSubscribersCount.toString(), icon: UserPlus, color: 'from-green-500 to-green-400' },
    { title: 'Cancelamentos (mês)', value: stats.cancellationsCount.toString(), icon: UserX, color: 'from-red-500 to-red-400' },
    { title: 'Total de Assinantes', value: stats.totalSubscribers.toString(), icon: TrendingUp, color: 'from-purple-500 to-purple-400' },
  ];

  const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '';
  
  const handleRowClick = (profile: Profile) => {
    toast({
        title: `Cliente: ${profile.name}`,
        description: 'Em breve: um modal com detalhes completos será exibido aqui.'
    });
  };
  
  const formatDisplayWhatsApp = (phone: string | null): string => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    if (cleaned.length === 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    return phone;
  };

  const formatWhatsAppLink = (phone: string | null): string => {
    if (!phone) return '#';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 10 && cleaned.length <= 11) cleaned = `55${cleaned}`;
    return `https://api.whatsapp.com/send?phone=${cleaned}`;
  };

  const formatLastLogin = (dateString: string | null) => {
    if (!dateString) return 'Nenhum login';
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true, locale: ptBR });
  };

  const handleFilterChange = (filterName: keyof typeof filters, checked: boolean) => {
    setFilters(prev => ({ ...prev, [filterName]: checked }));
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-tanotado-navy">Dashboard Admin 👨‍💼</h1>
          <p className="text-muted-foreground mt-2">Olá {user?.name?.split(' ')[0]}, gerencie sua plataforma aqui</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoadingUsers ? (
            [...Array(4)].map((_, i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>)
          ) : (
            adminStats.map((stat, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                    </div>
                    <div className={`p-4 rounded-lg bg-gradient-to-r ${stat.color} shadow-lg`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-tanotado-navy">Usuários Cadastrados ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
              <div className="relative w-full sm:w-auto flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por nome, email, whatsapp..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="filter-subscribed" checked={filters.subscribed} onCheckedChange={(checked) => handleFilterChange('subscribed', !!checked)} />
                    <Label htmlFor="filter-subscribed" className="text-sm font-medium">Assinantes</Label>
                  </div>
                   <div className="flex items-center space-x-2">
                    <Checkbox id="filter-trial" checked={filters.trial} onCheckedChange={(checked) => handleFilterChange('trial', !!checked)} />
                    <Label htmlFor="filter-trial" className="text-sm font-medium">Em Teste</Label>
                  </div>
                   <div className="flex items-center space-x-2">
                    <Checkbox id="filter-inactive" checked={filters.inactive} onCheckedChange={(checked) => handleFilterChange('inactive', !!checked)} />
                    <Label htmlFor="filter-inactive" className="text-sm font-medium">Inativos</Label>
                  </div>
              </div>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                          <TableHead className="w-[35%]">Usuário</TableHead>
                          <TableHead>WhatsApp</TableHead>
                          <TableHead>Plano</TableHead>
                          <TableHead>Estatísticas</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingUsers ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-40" /></div></div></TableCell>
                                    <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            filteredUsers.map((profile) => (
                                <TableRow key={profile.id} onClick={() => handleRowClick(profile)} className="cursor-pointer">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar><AvatarImage src={profile.avatar_url || undefined} /><AvatarFallback className="bg-muted">{getInitials(profile.name)}</AvatarFallback></Avatar>
                                            <div>
                                                <p className="font-medium text-gray-800">{profile.name}</p>
                                                <p className="text-sm text-muted-foreground">{profile.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                      {profile.whatsapp ? (
                                          <Button variant="ghost" size="sm" asChild onClick={(e) => e.stopPropagation()} className="font-normal text-muted-foreground hover:text-green-600 h-auto p-1">
                                              <a href={formatWhatsAppLink(profile.whatsapp)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                                  <MessageSquare className="h-4 w-4" />
                                                  {formatDisplayWhatsApp(profile.whatsapp)}
                                              </a>
                                          </Button>
                                      ) : (
                                          <span className="text-muted-foreground">-</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                        {profile.is_subscribed ? (
                                            <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium"><CheckCircle className="h-4 w-4" /> Assinante</div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Clock className="h-4 w-4" />{profile.trial_ends_at ? `Expira em ${format(parseISO(profile.trial_ends_at), 'dd/MM/yy')}` : 'N/A'}</div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1.5 text-muted-foreground text-xs">
                                            <Tooltip>
                                                <TooltipTrigger asChild><div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{formatLastLogin(profile.last_sign_in_at)} ({profile.login_count ?? 0})</div></TooltipTrigger>
                                                <TooltipContent><p>Último login e contagem total de acessos</p></TooltipContent>
                                            </Tooltip>
                                            <div className="flex items-center gap-4">
                                                <Tooltip>
                                                    <TooltipTrigger asChild><div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{profile.client_count ?? 0} Clientes</div></TooltipTrigger>
                                                    <TooltipContent><p>Clientes cadastrados</p></TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild><div className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5" />{profile.appointment_count ?? 0} Agend.</div></TooltipTrigger>
                                                    <TooltipContent><p>Agendamentos criados</p></TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); alert('Forçar Login (lógica a ser implementada)'); }}>Forçar Login</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); alert('Desativar (lógica a ser implementada)'); }} className="text-red-600 focus:text-red-600">Desativar</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default AdminDashboard;