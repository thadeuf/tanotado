import React, { useEffect, useState } from 'react';
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMultiUser = false;

  console.log('EditClient: Starting component with ID:', id);
  console.log('EditClient: User ID:', user?.id);

  // Hook para buscar estatísticas do cliente
  const { 
    data: clientStats, 
    isLoading: statsLoading, 
    error: statsError 
  } = useClientStats(id || '');

  const { data: client, isLoading, error, isSuccess } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      if (!id) {
        console.error('EditClient: No client ID provided');
        throw new Error('ID do cliente não fornecido');
      }
      
      if (!user?.id) {
        console.error('EditClient: No user ID available');
        throw new Error('Usuário não autenticado');
      }

      console.log('EditClient: Starting client fetch with ID:', id, 'for user:', user?.id);
      
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', id)
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
    enabled: !!id && !!user?.id,
    retry: (failureCount, error) => {
      console.log('EditClient: Query retry attempt', failureCount, error);
      return failureCount < 2;
    },
    retryDelay: attemptIndex => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 5000);
      console.log('EditClient: Retrying client fetch in', delay, 'ms');
      return delay;
    },
  });

  // Log dos estados da query
  useEffect(() => {
    console.log('EditClient: Query states changed:', {
      isLoading,
      isSuccess,
      hasData: !!client,
      error: error?.message,
      clientId: id,
      userId: user?.id
    });
  }, [isLoading, isSuccess, client, error, id, user?.id]);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      sendMonthlyReminder: false,
      activateSessionReminder: false,
      activeRegistration: true,
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      if (!id) throw new Error('ID do cliente não fornecido');
      if (!user?.id) throw new Error('Usuário não autenticado');

      console.log('UpdateClient: Starting mutation with data:', data);
      console.log('UpdateClient: Client ID:', id, 'User ID:', user?.id);

      const clientData = {
        // Informações básicas
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
        
        // Endereço
        cep: data.cep || null,
        address: data.address || null,
        number: data.number || null,
        neighborhood: data.neighborhood || null,
        city: data.city || null,
        state: data.state || null,
        complement: data.complement || null,
        
        // Financeiro
        session_value: data.sessionValue || null,
        payment_day: data.paymentDay || null,
        send_monthly_reminder: data.sendMonthlyReminder || false,
        
        // Responsável financeiro
        financial_responsible_name: data.financialResponsibleName || null,
        financial_responsible_whatsapp: data.financialResponsibleWhatsapp || null,
        financial_responsible_email: data.financialResponsibleEmail || null,
        financial_responsible_cpf: data.financialResponsibleCpf || null,
        financial_responsible_rg: data.financialResponsibleRg || null,
        
        // Contato de emergência
        emergency_contact_name: data.emergencyContactName || null,
        emergency_contact_whatsapp: data.emergencyContactWhatsapp || null,
        
        // Dados adicionais
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

      const { data: result, error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) {
        console.error('UpdateClient: Supabase error:', error);
        throw error;
      }

      console.log('UpdateClient: Success result:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('UpdateClient: Mutation success:', data);
      toast({
        title: "Cliente atualizado",
        description: "Cliente atualizado com sucesso!",
      });
      
      // Invalidar cache e navegar
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      navigate('/clientes');
    },
    onError: (error: any) => {
      console.error('UpdateClient: Mutation error:', error);
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Ocorreu um erro ao atualizar o cliente.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (client) {
      console.log('EditClient: Setting form data from client:', client.name);
      
      const formData: ClientFormData = {
        // Profissional responsável
        responsibleProfessional: '',
        group: '',
        groupId: client.group_id || '',
        
        // Informações pessoais
        name: client.name || '',
        photoUrl: client.photo_url || '',
        whatsapp: client.phone || '',
        videoCallLink: client.video_call_link || '',
        email: client.email || '',
        cpf: client.cpf || '',
        rg: client.rg || '',
        
        // Endereço
        cep: client.cep || '',
        address: client.address || '',
        number: client.number || '',
        neighborhood: client.neighborhood || '',
        city: client.city || '',
        state: client.state || '',
        complement: client.complement || '',
        
        // Financeiro
        sessionValue: client.session_value || '',
        paymentDay: client.payment_day || '',
        sendMonthlyReminder: client.send_monthly_reminder || false,
        
        // Responsável financeiro
        financialResponsibleName: client.financial_responsible_name || '',
        financialResponsibleWhatsapp: client.financial_responsible_whatsapp || '',
        financialResponsibleEmail: client.financial_responsible_email || '',
        financialResponsibleCpf: client.financial_responsible_cpf || '',
        financialResponsibleRg: client.financial_responsible_rg || '',
        
        // Contato de emergência
        emergencyContactName: client.emergency_contact_name || '',
        emergencyContactWhatsapp: client.emergency_contact_whatsapp || '',
        
        // Dados adicionais
        gender: client.gender || '',
        birthDate: client.birth_date || '',
        nationality: client.nationality || '',
        education: client.education || '',
        profession: client.profession || '',
        referral: client.referral || '',
        maritalStatus: client.marital_status || '',
        observations: client.notes || '',
        activateSessionReminder: client.activate_session_reminder || false,
        activeRegistration: client.active_registration,
      };

      console.log('EditClient: Resetting form with data');
      form.reset(formData);
    }
  }, [client, form]);

  const onSubmit = (data: ClientFormData) => {
    console.log('Form submitted with data:', data);
    console.log('Mutation is pending:', updateClientMutation.isPending);
    
    if (updateClientMutation.isPending) {
      console.log('Mutation already in progress, ignoring submit');
      return;
    }
    
    updateClientMutation.mutate(data);
  };

  const handleViewRecords = () => {
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade de prontuários em desenvolvimento.",
    });
  };

  const handleViewNotes = () => {
    toast({
      title: "Em desenvolvimento", 
      description: "Funcionalidade de anotações em desenvolvimento.",
    });
  };

  const handleViewFinancial = () => {
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade financeira em desenvolvimento.",
    });
  };

  console.log('EditClient: Current render state - isLoading:', isLoading, 'error:', !!error, 'client:', !!client);

  // Loading state
  if (isLoading) {
    console.log('EditClient: Showing loading state');
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/clientes')} className="gap-2">
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
          <Button variant="ghost" onClick={() => navigate('/clientes')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
        <div className="text-center p-8">
          <p className="text-muted-foreground">Erro ao carregar cliente: {error.message}</p>
          <Button 
            onClick={() => window.location.reload()} 
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
          <Button variant="ghost" onClick={() => navigate('/clientes')} className="gap-2">
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

  console.log('EditClient: Rendering main form for client:', client.name);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/clientes')} className="gap-2">
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
            clientId={id || ''}
            onViewRecords={handleViewRecords}
            onViewNotes={handleViewNotes}
            onViewFinancial={handleViewFinancial}
          />
        </div>

        {/* Right Column - Edit Form */}
        <div className="lg:col-span-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  onClick={() => navigate('/clientes')}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={updateClientMutation.isPending}
                  className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple hover:shadow-lg transition-all duration-200"
                >
                  {updateClientMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
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
