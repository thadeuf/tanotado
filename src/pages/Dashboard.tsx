// src/pages/Dashboard.tsx
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Calendar, Users, Clock, UserX, Video, MapPin, AlertCircle, CheckCircle, Play, Cake, MessageSquare, NotebookPen, Send, Loader2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '../integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useAppointments, Appointment } from '../hooks/useAppointments';
import { useClients } from '../hooks/useClients';
import { format, isToday, isTomorrow, startOfWeek, endOfWeek, isWithinInterval, parseISO, getMonth, getDate, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { SessionNotesDialog } from '../components/notes/SessionNotesDialog';
import { ChatPopup } from '@/components/chat/ChatPopup';
import { toast } from '@/hooks/use-toast';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: appointments = [], isLoading: isLoadingAppointments } = useAppointments();
  const { data: clients = [], isLoading: isLoadingClients } = useClients();

  const [selectedAppointmentForNotes, setSelectedAppointmentForNotes] = useState<Appointment | null>(null);
  const [sendingLink, setSendingLink] = useState<string | null>(null);
  const [confirmingAppointment, setConfirmingAppointment] = useState<Appointment | null>(null);

  const appointmentLabel = user?.appointment_label || 'Agendamento';
  
  // --- INÍCIO DA ALTERAÇÃO CORRIGIDA ---
  const { data: pendingNotesCount, isLoading: isLoadingPendingNotes } = useQuery({
    queryKey: ['pendingNotesCount', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await supabase.rpc('get_pending_notes_count');
      if (error) {
        console.error("Erro ao buscar contagem de anotações pendentes:", error);
        toast({
          title: "Erro ao buscar lembrete",
          description: "Não foi possível verificar as anotações pendentes.",
          variant: "destructive"
        });
        return 0;
      }
      return data || 0;
    },
    enabled: !!user,
  });
  // --- FIM DA ALTERAÇÃO CORRIGIDA ---

  const isLoading = isLoadingAppointments || isLoadingClients || isLoadingPendingNotes;

  const { today, tomorrow, week } = useMemo(() => {
    if (isLoading) return { today: [], tomorrow: [], week: [] };
    const now = new Date();
    const todayAppointments = appointments.filter(app => isToday(parseISO(app.start_time))).sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    const tomorrowAppointments = appointments.filter(app => isTomorrow(parseISO(app.start_time))).sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    const startOfThisWeek = startOfWeek(now, { locale: ptBR });
    const endOfThisWeek = endOfWeek(now, { locale: ptBR });
    const weekAppointments = appointments
      .filter(app => isWithinInterval(parseISO(app.start_time), { start: startOfThisWeek, end: endOfThisWeek }))
      .sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    return { today: todayAppointments, tomorrow: tomorrowAppointments, week: weekAppointments };
  }, [appointments, isLoading]);

  const dashboardStats = useMemo(() => {
   const appointmentLabel = user?.appointment_label || 'Agendamento';

    if (isLoading) return [
      { title: `Próximo ${appointmentLabel}`, value: '-', icon: Clock, color: 'from-tanotado-pink to-tanotado-purple' },
      { title: `${appointmentLabel}s Hoje`, value: '0', icon: Calendar, color: 'from-tanotado-orange to-tanotado-yellow' },
      { title: 'Atendimentos no Mês', value: '0', icon: Users, color: 'from-tanotado-blue to-tanotado-green' },
      { title: 'Faltas no Mês', value: '0', icon: UserX, color: 'from-tanotado-purple to-tanotado-pink' }
    ];

    const now = new Date();
    const upcomingToday = today
        .filter(app => new Date(app.start_time) > now && app.status !== 'cancelled' && app.status !== 'completed')
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    const nextAppointment = upcomingToday.length > 0 ? format(parseISO(upcomingToday[0].start_time), 'HH:mm') : '-';
    const appointmentsTodayCount = today.filter(app => app.status !== 'cancelled').length;
    
    const completedThisMonth = appointments.filter(app => {
        const appDate = parseISO(app.start_time);
        return (app.status === 'completed') && getMonth(appDate) === getMonth(now) && new Date(appDate).getFullYear() === new Date().getFullYear();
    }).length;

    const noShowThisMonth = appointments.filter(app => {
        const appDate = parseISO(app.start_time);
        return app.status === 'no_show' && getMonth(appDate) === getMonth(now) && new Date(appDate).getFullYear() === new Date().getFullYear();
    }).length;

    return [
      { title: `Próximo ${appointmentLabel}`, value: nextAppointment, icon: Clock, color: 'from-tanotado-pink to-tanotado-purple' },
      { title: `${appointmentLabel}s Hoje`, value: String(appointmentsTodayCount), icon: Calendar, color: 'from-tanotado-orange to-tanotado-yellow' },
      { title: 'Atendimentos no Mês', value: String(completedThisMonth), icon: Users, color: 'from-tanotado-blue to-tanotado-green' },
      { title: 'Faltas no Mês', value: String(noShowThisMonth), icon: UserX, color: 'from-tanotado-purple to-tanotado-pink' }
    ];
  }, [appointments, today, isLoading, user]);

  const birthdaysToday = useMemo(() => {
    if (isLoading) return [];
    const now = new Date();
    return clients.filter(client => {
      if (!client.birth_date) return false;
      try {
        const birthDate = parseISO(client.birth_date);
        return getDate(birthDate) === getDate(now) && getMonth(birthDate) === getMonth(now);
      } catch (e) {
        return false;
      }
    });
  }, [clients, isLoading]);
  
  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);
  
  const calculateAge = (birthDateString: string | null): number | null => {
      if (!birthDateString) return null;
      try {
        const birthDate = parseISO(birthDateString);
        return differenceInYears(new Date(), birthDate);
      } catch {
        return null;
      }
  };
  
  const formatWhatsAppLink = (phone: string | null) => {
    if (!phone) return '#';
    const cleaned = phone.replace(/\D/g, '');
    return `https://wa.me/${cleaned}`;
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'scheduled': return { text: 'Agendado', className: 'bg-tanotado-blue/10 text-tanotado-blue border-tanotado-blue/20' };
      case 'confirmed': return { text: 'Confirmado', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      case 'completed': return { text: 'Compareceu', className: 'bg-tanotado-green/10 text-tanotado-green border-tanotado-green/20' };
      case 'cancelled': return { text: 'Cancelado', className: 'bg-red-100 text-red-700 border-red-200' };
      case 'no_show': return { text: 'Faltou', className: 'bg-orange-100 text-orange-700 border-orange-200' };
      default: return { text: status, className: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  const handleNotesClick = (appointment: Appointment) => {
    setSelectedAppointmentForNotes(appointment);
  };

  const handleSendVideoLink = async (appointment: Appointment | null) => {
    if (!appointment || sendingLink === appointment.id) return;

    setConfirmingAppointment(null);
    setSendingLink(appointment.id);

    try {
      const client = appointment.client_id ? clientMap.get(appointment.client_id) : null;
      if (!client || !client.whatsapp) {
        throw new Error("O cliente não possui um número de WhatsApp cadastrado.");
      }
      if (!appointment.online_url) {
        throw new Error("Este agendamento não possui um link de sala de vídeo.");
      }

      const { data: instanceData, error: instanceError } = await supabase
        .from('instances')
        .select('nome_instancia, status')
        .eq('user_id', appointment.user_id)
        .limit(1)
        .single();

      if (instanceError || !instanceData) {
        throw new Error("Nenhuma instância do WhatsApp encontrada para este profissional.");
      }

      if (instanceData.status !== 'connected') {
        toast({
          title: "Aviso: Instância Desconectada",
          description: "Sua instância do WhatsApp parece estar offline. A mensagem será enviada quando ela reconectar.",
          variant: "default",
        });
      }

      const payload = {
        clientName: client.name,
        videoLink: appointment.online_url,
        clientPhone: client.whatsapp,
        professionalInstance: instanceData.nome_instancia,
      };

      const webhookUrl = 'https://webhook.artideia.com.br/webhook/envia-link-video'; // URL de Produção
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`O servidor respondeu com um erro: ${response.statusText}`);
      }

      toast({
        title: "Link na fila de envio!",
        description: `O link da sala de vídeo foi enviado para a fila para ${client.name}.`
      });

    } catch (error: any) {
      toast({
        title: "Erro ao Enviar Link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingLink(null);
    }
  };

  const renderAppointment = (appointment: Appointment, index: number) => {
    const client = appointment.client_id ? clientMap.get(appointment.client_id) : null;
    const timeLabel = `${format(parseISO(appointment.start_time), 'HH:mm')} - ${format(parseISO(appointment.end_time), 'HH:mm')}`;
    const displayName = client?.name || appointment.title;
    const statusInfo = getStatusInfo(appointment.status);
    const isSending = sendingLink === appointment.id;

    return (
      <div key={appointment.id || index} className="relative p-4 border rounded-lg hover:bg-muted/50 transition-colors overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-2" style={{ backgroundColor: appointment.color || '#e2e8f0' }} />
        <div className="ml-4 space-y-3">
          <div className="flex items-start justify-between">
            <p className="font-bold text-tanotado-navy">{displayName}</p>
            <div className="flex items-center -mr-2 -mt-2">
              {client && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleNotesClick(appointment)}>
                    <NotebookPen className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{timeLabel}</span>
              </div>
              <Badge variant="outline" className={`flex items-center gap-1 text-xs ${statusInfo.className}`}>
                  <span>{statusInfo.text}</span>
              </Badge>
              {appointment.is_online && appointment.online_url && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Button asChild size="sm" variant="secondary" className="h-auto px-2 py-1 text-xs bg-tanotado-blue/10 text-tanotado-blue hover:bg-tanotado-blue/20">
                      <a href={appointment.online_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                          <Video className="h-3 w-3" />
                          Entrar na sala
                      </a>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="h-auto px-2 py-1 text-xs bg-green-500/10 text-green-600 hover:bg-green-500/20"
                    onClick={() => setConfirmingAppointment(appointment)}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3 mr-1.5" />
                    )}
                    Enviar Link
                  </Button>
                </div>
              )}
          </div>
        </div>
      </div>
    );
  };
  
  const renderEmptyState = (text: string) => (
    <div className="text-center py-10 text-muted-foreground">
        <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p>{text}</p>
    </div>
  );

  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center space-x-3">
                    <Skeleton className="h-full w-2 absolute left-0 top-0" />
                    <div className="space-y-2 ml-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
                <Skeleton className="h-4 w-20" />
            </div>
        ))}
    </div>
  );

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-tanotado-navy">
            Bem-vindo, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-2">
            Aqui está um resumo do seu dia
          </p>
        </div>

        {user && !user.isSubscribed && user.trialEndsAt && (
          <Card className="border-tanotado-yellow/50 bg-gradient-to-r from-tanotado-yellow/10 to-tanotado-orange/10">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <h3 className="font-semibold text-tanotado-navy">🎉 Teste Gratuito Ativo</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(user.trialEndsAt) > new Date()
                      ? `Restam ${Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} dias do seu teste.`
                      : 'Seu período de teste terminou.'
                    }
                  </p>
                </div>
                <Button asChild className="px-4 py-2 bg-gradient-to-r from-tanotado-pink to-tanotado-purple text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all w-full sm:w-auto">
                  <Link to="/assinatura">
                    Assinar Agora
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {user && (user.stripe_subscription_status === 'past_due' || user.stripe_subscription_status === 'unpaid') && (
          <Card className="border-red-500/50 bg-gradient-to-r from-red-500/10 to-orange-500/10">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <AlertCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-tanotado-navy">Pagamento da Assinatura Pendente</h3>
                    <p className="text-sm text-muted-foreground">
                      Não foi possível processar sua última fatura. Regularize sua situação para continuar usando o sistema.
                    </p>
                  </div>
                </div>
                <Button asChild className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium w-full sm:w-auto">
                  <Link to="/manage-subscription">
                    Resolver Pendência
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
              [...Array(4)].map((_, i) => (
                  <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
              ))
          ) : (
              dashboardStats.map((stat, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                      <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold text-tanotado-navy">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}>
                      <stat.icon className="h-6 w-6 text-white" />
                      </div>
                  </div>
                  </CardContent>
              </Card>
              ))
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-tanotado-navy">{`Próximos ${appointmentLabel}s`}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="hoje" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="hoje">Hoje ({today.length})</TabsTrigger>
                  <TabsTrigger value="amanha">Amanhã ({tomorrow.length})</TabsTrigger>
                  <TabsTrigger value="semana">Semana ({week.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="hoje" className="space-y-4 mt-4">
                  {isLoading ? renderLoadingSkeleton() : today.length > 0 ? today.map(renderAppointment) : renderEmptyState("Nenhum agendamento para hoje.")}
                </TabsContent>
                
                <TabsContent value="amanha" className="space-y-4 mt-4">
                  {isLoading ? renderLoadingSkeleton() : tomorrow.length > 0 ? tomorrow.map(renderAppointment) : renderEmptyState("Nenhum agendamento para amanhã.")}
                </TabsContent>
                
                <TabsContent value="semana" className="space-y-4 mt-4">
                  {isLoading ? renderLoadingSkeleton() : week.length > 0 ? week.map(renderAppointment) : renderEmptyState("Nenhum agendamento para esta semana.")}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <div className="space-y-6">
              {pendingNotesCount > 0 && (
                  <Card className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple text-white">
                      <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                              <div className="p-3 bg-white/20 rounded-full">
                                  <NotebookPen className="h-6 w-6 text-white"/>
                              </div>
                              <div>
                                  <p className="font-bold text-lg">Anotações Pendentes</p>
                                  <p className="text-sm opacity-90">
                                      Você tem {pendingNotesCount} sessões para atualizar as anotações.
                                  </p>
                              </div>
                          </div>
                      </CardContent>
                  </Card>
              )}

              <Card>
                  <CardHeader>
                      <CardTitle className="text-tanotado-navy flex items-center gap-2">
                          <Cake className="h-5 w-5 text-tanotado-pink" />
                          Aniversariantes de Hoje
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      {isLoading ? (
                          <div className="space-y-4">
                              <Skeleton className="h-16 w-full" />
                              <Skeleton className="h-16 w-full" />
                          </div>
                      ) : birthdaysToday.length > 0 ? (
                          <div className="space-y-4">
                              {birthdaysToday.map((client, index) => (
                                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-tanotado-pink/10 to-tanotado-purple/10">
                                      <div className="flex items-center space-x-3">
                                          <div className="w-10 h-10 bg-gradient-to-r from-tanotado-pink to-tanotado-purple rounded-full flex items-center justify-center">
                                              <Cake className="h-5 w-5 text-white" />
                                          </div>
                                          <div>
                                              <p className="font-medium text-tanotado-navy">{client.name}</p>
                                              {client.birth_date && <p className="text-sm text-muted-foreground">{calculateAge(client.birth_date)} anos</p>}
                                              {client.phone && <p className="text-xs text-muted-foreground">{client.phone}</p>}
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <Button
                                              asChild
                                              size="sm"
                                              className="bg-gradient-to-r from-tanotado-green to-tanotado-blue hover:shadow-lg text-white mt-1 h-8 px-3 text-xs"
                                          >
                                              <a href={formatWhatsAppLink(client.phone)} target='_blank' rel='noopener noreferrer'>
                                                  <MessageSquare className="h-4 w-4 mr-2" />
                                                  Parabenizar
                                              </a>
                                          </Button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="text-center py-8">
                              <Cake className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                              <p className="text-muted-foreground">Nenhum aniversário hoje</p>
                          </div>
                      )}
                  </CardContent>
              </Card>
          </div>

        </div>
      </div>
      
      <SessionNotesDialog
        appointment={selectedAppointmentForNotes}
        isOpen={!!selectedAppointmentForNotes}
        onOpenChange={(isOpen) => !isOpen && setSelectedAppointmentForNotes(null)}
      />
      
      <AlertDialog open={!!confirmingAppointment} onOpenChange={() => setConfirmingAppointment(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Envio de Link</AlertDialogTitle>
                <AlertDialogDescription>
                   Lembre-se de enviar o link somente após você já ter entrado na sala de vídeo!
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleSendVideoLink(confirmingAppointment)} disabled={!!sendingLink}>
                   {sendingLink ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Confirmar e Enviar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ChatPopup />
    </>
  );
};

export default Dashboard;