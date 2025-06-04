import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { clientSchema, ClientFormData } from '@/schemas/clientSchema';
import ResponsibleProfessionalSection from '@/components/client-form/ResponsibleProfessionalSection';
import PersonalInformationSection from '@/components/client-form/PersonalInformationSection';
import AddressSection from '@/components/client-form/AddressSection';
import FinancialSection from '@/components/client-form/FinancialSection';
import FinancialResponsibleSection from '@/components/client-form/FinancialResponsibleSection';
import EmergencyContactSection from '@/components/client-form/EmergencyContactSection';
import AdditionalDataSection from '@/components/client-form/AdditionalDataSection';
import ClientStatsCard from '@/components/client-details/ClientStatsCard';
import ClientOptionsMenu from '@/components/client-details/ClientOptionsMenu';
import { useClientStats } from '@/hooks/useClientStats';

const EditClient: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const isMultiUser = false;

  console.log('EditClient: Starting component with ID:', id);
  console.log('EditClient: User ID:', user?.id);

  // Memoize client ID to prevent unnecessary re-renders
  const clientId = useMemo(() => id || '', [id]);

  // Hook para buscar estatísticas do cliente
  const { 
    data: clientStats, 
    isLoading: statsLoading, 
    error: statsError 
  } = useClientStats(clientId);

  const { data: client, isLoading, error, isSuccess } = useQuery({
    queryKey: ['client', clientId, user?.id],
    queryFn: async () => {
      if (!clientId) {
        console.error('EditClient: No client ID provided');
        throw new Error('ID do cliente não fornecido');
      }
      
      if (!user?.id) {
        console.error('EditClient: No user ID available');
        throw new Error('Usuário não autenticado');
      }

      console.log('EditClient: Starting client fetch with ID:', clientId, 'for user:', user?.id);
      
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .eq('user_id', user?.id)
          .maybeSingle();

        if (error) {
          console.error('EditClient: Supabase error:', error);
          throw error;
        }

        console.log('EditClient: Client fetch completed. Data found:', !!data);
        
        if (!data) {
          console.error('EditClient: Client not found');
          throw new Error('Cliente não encontrado');
        }

        console.log('EditClient: Client data fetched successfully:', data.name);
        return data;
      } catch (error) {
        console.error('EditClient: Error in client fetch:', error);
        throw error;
      }
    },
    enabled: !!clientId && !!user?.id && !authLoading,
    staleTime: 0, // Sempre considerar dados como stale para forçar refetch
    gcTime: 1 * 60 * 1000, // 1 minuto no cache
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    networkMode: 'always', // Sempre tentar fazer requisições
    retry: (failureCount, error) => {
      console.log('EditClient: Query retry attempt', failureCount, error);
      
      if (error?.message?.includes('não autenticado') || error?.message?.includes('não encontrado')) {
        return false;
      }
      
      // Se a query ficou muito tempo tentando, força um reset
      if (failureCount > 2) {
        console.log('EditClient: Muitas tentativas falharam, forçando reset do cache...');
        queryClient.removeQueries({ queryKey: ['client', clientId] });
        return false;
      }
      
      return failureCount < 3;
    },
    retryDelay: attemptIndex => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 3000);
      console.log('EditClient: Retrying client fetch in', delay, 'ms');
      return delay;
    },
  });

  // Log dos estados da query com useEffect otimizado
  useEffect(() => {
    console.log('EditClient: Query states changed:', {
      isLoading,
      isSuccess,
      hasData: !!client,
      error: error?.message,
      clientId,
      userId: user?.id
    });
  }, [isLoading, isSuccess, client, error, clientId, user?.id]);

  // Timeout de emergência para detectar queries "presas"
  useEffect(() => {
    if (isLoading && clientId && user?.id) {
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ EditClient: Query stuck em loading por muito tempo, forçando reset...');
        queryClient.cancelQueries({ queryKey: ['client', clientId] });
        queryClient.removeQueries({ queryKey: ['client', clientId] });
        
        // Força uma nova query
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['client', clientId] });
        }, 100);
      }, 10000); // 10 segundos

      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, clientId, user?.id, queryClient]);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      sendMonthlyReminder: false,
      activateSessionReminder: false,
      activeRegistration: true,
    },
  });

  // Estado para controlar se a mutation está em andamento
  const [isMutating, setIsMutating] = useState(false);

  const updateClientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      if (!clientId) throw new Error('ID do cliente não fornecido');
      if (!user?.id) throw new Error('Usuário não autenticado');

      console.log('UpdateClient: Starting mutation with data:', data);
      console.log('UpdateClient: Client ID:', clientId, 'User ID:', user?.id);
      console.log('UpdateClient: Current mutation state - isMutating:', isMutating);

      if (isMutating) {
        console.warn('UpdateClient: Mutation already in progress, aborting');
        throw new Error('Salvamento já em andamento');
      }

      setIsMutating(true);

      const clientData = {
        name: data.name,
        email: data.email || null,
        phone: data.whatsapp || null,
        cpf: data.cpf || null,
        rg: data.rg || null,
        birth_date: data.birthDate || null,
        notes: data.observations || null,
        group_id: data.groupId || null,
        photo_url: data.photoUrl || null,
        video_call_link: data.videoCallLink || null,
        cep: data.cep || null,
        address: data.address || null,
        number: data.number || null,
        neighborhood: data.neighborhood || null,
        city: data.city || null,
        state: data.state || null,
        complement: data.complement || null,
        session_value: data.sessionValue || null,
        payment_day: data.paymentDay || null,
        send_monthly_reminder: data.sendMonthlyReminder || false,
        financial_responsible_name: data.financialResponsibleName || null,
        financial_responsible_whatsapp: data.financialResponsibleWhatsapp || null,
        financial_responsible_email: data.financialResponsibleEmail || null,
        financial_responsible_cpf: data.financialResponsibleCpf || null,
        financial_responsible_rg: data.financialResponsibleRg || null,
        emergency_contact_name: data.emergencyContactName || null,
        emergency_contact_whatsapp: data.emergencyContactWhatsapp || null,
        gender: data.gender || null,
        nationality: data.nationality || null,
        education: data.education || null,
        profession: data.profession || null,
        referral: data.referral || null,
        marital_status: data.maritalStatus || null,
        activate_session_reminder: data.activateSessionReminder || false,
        active_registration: data.activeRegistration,
      };

      console.log('UpdateClient: Prepared client data:', clientData);

      try {
        const { data: result, error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', clientId)
          .eq('user_id', user?.id)
          .select()
          .single();

        if (error) {
          console.error('UpdateClient: Supabase error:', error);
          throw error;
        }

        console.log('UpdateClient: Success result:', result);
        return result;
      } catch (error) {
        console.error('UpdateClient: Mutation error:', error);
        throw error;
      }
    },
    onMutate: () => {
      console.log('UpdateClient: Mutation starting...');
    },
    onSuccess: (data) => {
      console.log('UpdateClient: Mutation success:', data);
      setIsMutating(false);
      
      toast({
        title: "Cliente atualizado",
        description: "Cliente atualizado com sucesso!",
      });
      
      console.log('UpdateClient: Invalidating queries and navigating...');
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      
      setTimeout(() => {
        console.log('UpdateClient: Navigating to /clientes');
        navigate('/clientes');
      }, 100);
    },
    onError: (error: any) => {
      console.error('UpdateClient: Mutation error:', error);
      setIsMutating(false);
      
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Ocorreu um erro ao atualizar o cliente.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      console.log('UpdateClient: Mutation settled');
      setIsMutating(false);
    },
  });

  // Memoize form reset para evitar loops
  const resetFormWithClientData = useCallback((clientData: any) => {
    if (!clientData) return;
    
    console.log('EditClient: Setting form data from client:', clientData.name);
    
    const formData: ClientFormData = {
      responsibleProfessional: '',
      group: '',
      groupId: clientData.group_id || '',
      name: clientData.name || '',
      photoUrl: clientData.photo_url || '',
      whatsapp: clientData.phone || '',
      videoCallLink: clientData.video_call_link || '',
      email: clientData.email || '',
      cpf: clientData.cpf || '',
      rg: clientData.rg || '',
      cep: clientData.cep || '',
      address: clientData.address || '',
      number: clientData.number || '',
      neighborhood: clientData.neighborhood || '',
      city: clientData.city || '',
      state: clientData.state || '',
      complement: clientData.complement || '',
      sessionValue: clientData.session_value || '',
      paymentDay: clientData.payment_day || '',
      sendMonthlyReminder: clientData.send_monthly_reminder || false,
      financialResponsibleName: clientData.financial_responsible_name || '',
      financialResponsibleWhatsapp: clientData.financial_responsible_whatsapp || '',
      financialResponsibleEmail: clientData.financial_responsible_email || '',
      financialResponsibleCpf: clientData.financial_responsible_cpf || '',
      financialResponsibleRg: clientData.financial_responsible_rg || '',
      emergencyContactName: clientData.emergency_contact_name || '',
      emergencyContactWhatsapp: clientData.emergency_contact_whatsapp || '',
      gender: clientData.gender || '',
      birthDate: clientData.birth_date || '',
      nationality: clientData.nationality || '',
      education: clientData.education || '',
      profession: clientData.profession || '',
      referral: clientData.referral || '',
      maritalStatus: clientData.marital_status || '',
      observations: clientData.notes || '',
      activateSessionReminder: clientData.activate_session_reminder || false,
      activeRegistration: clientData.active_registration,
    };

    console.log('EditClient: Resetting form with data');
    form.reset(formData);
  }, [form]);

  useEffect(() => {
    if (client && isSuccess) {
      resetFormWithClientData(client);
    }
  }, [client, isSuccess, resetFormWithClientData]);

  // Memoize handlers para evitar re-renders
  const handleSubmit = useCallback((data: ClientFormData) => {
    console.log('EditClient: Form submitted with data:', data);
    console.log('EditClient: Current mutation states:', {
      isPending: updateClientMutation.isPending,
      isMutating,
    });
    
    if (updateClientMutation.isPending || isMutating) {
      console.log('EditClient: Mutation already in progress, ignoring submit');
      return;
    }
    
    console.log('EditClient: Proceeding with mutation');
    updateClientMutation.mutate(data);
  }, [updateClientMutation, isMutating]);

  const handleViewRecords = useCallback(() => {
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade de prontuários em desenvolvimento.",
    });
  }, []);

  const handleViewNotes = useCallback(() => {
    toast({
      title: "Em desenvolvimento", 
      description: "Funcionalidade de anotações em desenvolvimento.",
    });
  }, []);

  const handleViewFinancial = useCallback(() => {
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade financeira em desenvolvimento.",
    });
  }, []);

  const handleNavigateBack = useCallback(() => {
    navigate('/clientes');
  }, [navigate]);

  console.log('EditClient: Current render state - isLoading:', isLoading, 'error:', !!error, 'client:', !!client);

  // Loading state
  if (isLoading || authLoading) {
    console.log('EditClient: Showing loading state');
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleNavigateBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
          </div>
        </div>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tanotado-purple mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando cliente...</p>
            <Button 
              onClick={() => {
                console.log('🔄 Botão de refresh manual clicado');
                queryClient.cancelQueries({ queryKey: ['client', clientId] });
                queryClient.removeQueries({ queryKey: ['client', clientId] });
                setTimeout(() => {
                  queryClient.invalidateQueries({ queryKey: ['client', clientId] });
                }, 100);
              }}
              variant="outline"
              className="mt-4"
            >
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    console.error('EditClient: Showing error state:', error);
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleNavigateBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
        <div className="text-center p-8">
          <p className="text-muted-foreground">Erro ao carregar cliente: {error.message}</p>
          <Button 
            onClick={() => {
              console.log('🔄 Botão de retry clicado após erro');
              queryClient.removeQueries({ queryKey: ['client', clientId] });
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['client', clientId] });
              }, 100);
            }} 
            className="mt-4"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  // No client found state
  if (!client) {
    console.log('EditClient: Showing client not found state');
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleNavigateBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
        <div className="text-center p-8">
          <p className="text-muted-foreground">Cliente não encontrado</p>
        </div>
      </div>
    );
  }

  console.log('EditClient: Rendering main form for client:', client?.name);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleNavigateBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-tanotado-navy">
            {client?.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Editar informações do cliente
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Client Stats and Options */}
        <div className="lg:col-span-1 space-y-4">
          {statsError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">Erro ao carregar estatísticas</p>
            </div>
          ) : clientStats && !statsLoading ? (
            <ClientStatsCard
              totalSessions={clientStats.totalSessions}
              attendedSessions={clientStats.attendedSessions}
              missedSessions={clientStats.missedSessions}
              totalRevenue={clientStats.totalRevenue}
            />
          ) : (
            <div className="flex items-center justify-center p-8 bg-white rounded-lg border">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-tanotado-purple"></div>
              <span className="ml-2 text-muted-foreground">Carregando...</span>
            </div>
          )}

          <ClientOptionsMenu
            clientId={clientId}
            onViewRecords={handleViewRecords}
            onViewNotes={handleViewNotes}
            onViewFinancial={handleViewFinancial}
          />
        </div>

        {/* Right Column - Edit Form */}
        <div className="lg:col-span-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {isMultiUser && (
                <ResponsibleProfessionalSection control={form.control} />
              )}

              <PersonalInformationSection control={form.control} />
              <AddressSection control={form.control} setValue={form.setValue} />
              <FinancialSection control={form.control} />
              <FinancialResponsibleSection control={form.control} />
              <EmergencyContactSection control={form.control} />
              <AdditionalDataSection control={form.control} />

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleNavigateBack}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={updateClientMutation.isPending || isMutating}
                  className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple hover:shadow-lg transition-all duration-200"
                >
                  {updateClientMutation.isPending || isMutating ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default EditClient;
