// src/pages/AdminDashboard.tsx

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    Users, 
    TrendingUp, 
    UserPlus, 
    UserX, 
    MoreHorizontal, 
    CheckCircle, 
    Clock, 
    Calendar as CalendarIcon, 
    History,
    MessageSquare,
    Search, 
    Loader2,
    AlertTriangle,
    UserCheck
} from 'lucide-react';
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
import { ClientInfoDialog } from '@/components/admin/ClientInfoDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileWithCounts = Profile & {
  client_count: number;
  appointment_count: number;
  last_sign_in_at: string | null;
  login_count: number | null;
  is_active: boolean;
};

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filters, setFilters] = useState({
    subscribed: true,
    trial: true,
    trial_expired: true,
    deactivated: true,
  });

  const [isClientInfoOpen, setIsClientInfoOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  
  const [userToDeactivate, setUserToDeactivate] = useState<ProfileWithCounts | null>(null);
  const [userToActivate, setUserToActivate] = useState<ProfileWithCounts | null>(null);

  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('deactivate_user_profile', { p_user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Usuário desativado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['all_users_admin_with_counts'] });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao desativar usuário", description: error.message, variant: "destructive" });
    },
    onSettled: () => {
      setUserToDeactivate(null);
    }
  });

  const activateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('activate_user_profile', { p_user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Usuário ativado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['all_users_admin_with_counts'] });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao ativar usuário", description: error.message, variant: "destructive" });
    },
    onSettled: () => {
      setUserToActivate(null);
    }
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

  const determineUserDisplayStatus = (profile: ProfileWithCounts) => {
    if (profile.is_active === false) {
      return { main: 'deactivated' };
    }
    if (profile.is_subscribed) {
      return { main: 'active', sub: 'subscribed' };
    }
    const trialHasExpired = profile.trial_ends_at && new Date(profile.trial_ends_at) < new Date();
    if (trialHasExpired) {
      return { main: 'active', sub: 'trial_expired' };
    }
    return { main: 'active', sub: 'trial' };
  };

  const filteredUsers = useMemo(() => {
    return allUsers.filter(profile => {
      const status = determineUserDisplayStatus(profile);
      
      const filterMap = {
        subscribed: status.sub === 'subscribed',
        trial: status.sub === 'trial',
        trial_expired: status.sub === 'trial_expired',
        deactivated: status.main === 'deactivated',
      };
      
      const matchesFilter = Object.entries(filters).some(([key, value]) => {
          return value && filterMap[key as keyof typeof filterMap];
      });

      if (!matchesFilter) return false;

      const lowerCaseSearch = searchTerm.toLowerCase();
      return lowerCaseSearch === '' ||
        profile.name?.toLowerCase().includes(lowerCaseSearch) ||
        profile.email?.toLowerCase().includes(lowerCaseSearch) ||
        profile.whatsapp?.toLowerCase().includes(lowerCaseSearch);
    });
  }, [allUsers, searchTerm, filters]);


  const getStatusBadge = (profile: ProfileWithCounts) => {
    const status = determineUserDisplayStatus(profile);

    if (status.main === 'deactivated') {
        return <div className="flex items-center gap-1.5 text-sm text-red-600 font-medium"><UserX className="h-4 w-4" /> Desativado</div>;
    }

    switch(status.sub) {
        case 'subscribed':
            return <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium"><CheckCircle className="h-4 w-4" /> Assinante</div>;
        case 'trial_expired':
            return <div className="flex items-center gap-1.5 text-sm text-orange-600 font-medium"><AlertTriangle className="h-4 w-4" /> Trial Expirado</div>;
        case 'trial':
        default:
            return <div className="flex items-center gap-1.5 text-sm text-blue-600 font-medium"><Clock className="h-4 w-4" /> Em Teste</div>;
    }
  };
  
  const stats = useMemo(() => {
    if (!allUsers) return { totalUsers: 0, totalSubscribers: 0, newSubscribersCount: 0, cancellationsCount: 0 };
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const totalUsers = allUsers.length;
    const totalSubscribers = allUsers.filter(u => u.is_subscribed && u.is_active).length;
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
  const handleRowClick = (profile: Profile) => { setSelectedProfileId(profile.id); setIsClientInfoOpen(true); };
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
  const handleFilterChange = (filterName: keyof typeof filters, checked: boolean) => { setFilters(prev => ({ ...prev, [filterName]: checked })); };

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-tanotado-navy">Dashboard Admin 👨‍💼</h1>
            <p className="text-muted-foreground mt-2">Olá {user?.name?.split(' ')[0]}, gerencie sua plataforma aqui</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link to="/admin/whatsapp-instances">
                <MessageSquare className="mr-2 h-4 w-4" />
                Instâncias WhatsApp
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/message-reports">
                <History className="mr-2 h-4 w-4" /> Relatório de Envios
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoadingUsers ? (
            [...Array(4)].map((_, i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>)
          ) : (
            adminStats.map((stat, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium text-muted-foreground">{stat.title}</p><p className="text-3xl font-bold text-gray-800">{stat.value}</p></div>
                    <div className={`p-4 rounded-lg bg-gradient-to-r ${stat.color} shadow-lg`}><stat.icon className="h-6 w-6 text-white" /></div>
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
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="filter-subscribed" checked={filters.subscribed} onCheckedChange={(checked) => handleFilterChange('subscribed', !!checked)} />
                    <Label htmlFor="filter-subscribed" className="text-sm font-medium">Assinantes</Label>
                  </div>
                   <div className="flex items-center space-x-2">
                    <Checkbox id="filter-trial" checked={filters.trial} onCheckedChange={(checked) => handleFilterChange('trial', !!checked)} />
                    <Label htmlFor="filter-trial" className="text-sm font-medium">Em Teste</Label>
                  </div>
                   <div className="flex items-center space-x-2">
                    <Checkbox id="filter-trial_expired" checked={filters.trial_expired} onCheckedChange={(checked) => handleFilterChange('trial_expired', !!checked)} />
                    <Label htmlFor="filter-trial_expired" className="text-sm font-medium">Trial Expirado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="filter-deactivated" checked={filters.deactivated} onCheckedChange={(checked) => handleFilterChange('deactivated', !!checked)} />
                    <Label htmlFor="filter-deactivated" className="text-sm font-medium">Desativados</Label>
                  </div>
              </div>
            </div>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                          <TableHead className="w-[35%]">Usuário</TableHead>
                          <TableHead>WhatsApp</TableHead>
                          <TableHead>Status</TableHead>
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
                                            <div><p className="font-medium text-gray-800">{profile.name}</p><p className="text-sm text-muted-foreground">{profile.email}</p></div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                      {profile.whatsapp ? (
                                          <Button variant="ghost" size="sm" asChild onClick={(e) => e.stopPropagation()} className="font-normal text-muted-foreground hover:text-green-600 h-auto p-1">
                                              <a href={formatWhatsAppLink(profile.whatsapp)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2"><MessageSquare className="h-4 w-4" />{formatDisplayWhatsApp(profile.whatsapp)}</a>
                                          </Button>
                                      ) : (<span className="text-muted-foreground">-</span>)}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(profile)}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1.5 text-muted-foreground text-xs">
                                            <Tooltip><TooltipTrigger asChild><div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{formatLastLogin(profile.last_sign_in_at)} ({profile.login_count ?? 0})</div></TooltipTrigger><TooltipContent><p>Último login e contagem total de acessos</p></TooltipContent></Tooltip>
                                            <div className="flex items-center gap-4">
                                                <Tooltip><TooltipTrigger asChild><div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{profile.client_count ?? 0} Clientes</div></TooltipTrigger><TooltipContent><p>Clientes cadastrados</p></TooltipContent></Tooltip>
                                                <Tooltip><TooltipTrigger asChild><div className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5" />{profile.appointment_count ?? 0} Agend.</div></TooltipTrigger><TooltipContent><p>Agendamentos criados</p></TooltipContent></Tooltip>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenuItem 
                                                    onSelect={(e) => { 
                                                        e.stopPropagation(); 
                                                        alert('Forçar Login (lógica a ser implementada)'); 
                                                    }}
                                                >
                                                    Forçar Login
                                                </DropdownMenuItem>
                                                
                                                {profile.is_active ? (
                                                    <DropdownMenuItem 
                                                        onSelect={(e) => { 
                                                            e.stopPropagation(); 
                                                            setUserToDeactivate(profile); 
                                                        }} 
                                                        className="text-red-600 focus:text-red-600"
                                                    >
                                                        <UserX className="mr-2 h-4 w-4" />Desativar
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem 
                                                        onSelect={(e) => { 
                                                            e.stopPropagation(); 
                                                            setUserToActivate(profile); 
                                                        }} 
                                                        className="text-green-600 focus:text-green-600"
                                                    >
                                                        <UserCheck className="mr-2 h-4 w-4" />Ativar
                                                    </DropdownMenuItem>
                                                )}
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

      <ClientInfoDialog 
        profileId={selectedProfileId}
        isOpen={isClientInfoOpen}
        onOpenChange={setIsClientInfoOpen}
      />
      
      <AlertDialog open={!!userToDeactivate} onOpenChange={() => setUserToDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Desativação</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja desativar o usuário <strong>{userToDeactivate?.name}</strong>? Ele não poderá mais acessar a plataforma.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={deactivateUserMutation.isPending}
              onClick={() => userToDeactivate && deactivateUserMutation.mutate(userToDeactivate.id)}
            >
              {deactivateUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar e Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!userToActivate} onOpenChange={() => setUserToActivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Ativação</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja ativar o usuário <strong>{userToActivate?.name}</strong>? Ele poderá acessar a plataforma novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              disabled={activateUserMutation.isPending}
              onClick={() => userToActivate && activateUserMutation.mutate(userToActivate.id)}
            >
              {activateUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar e Ativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </TooltipProvider>
  );
};

export default AdminDashboard;
