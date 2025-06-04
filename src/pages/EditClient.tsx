
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

  const clientId = useMemo(() => id || '', [id]);

  const { 
    data: clientStats, 
    isLoading: statsLoading, 
    error: statsError 
  } = useClientStats(clientId);

  const { data: client, isLoading, error, isSuccess } = useQuery({
    queryKey: ['client', clientId, user?.id],
    queryFn: async () => {
      if (!clientId) {
        throw new Error('ID do cliente não fornecido');
      }
      
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Cliente não encontrado');
      }

      return data;
    },
    enabled: !!clientId && !!user?.id && !authLoading,
    retry: 2,
    retryDelay: 1000,
  });

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      sendMonthlyReminder: false,
      activateSessionReminder: false,
      activeRegistration: true,
    },
  });

  const [isMutating, setIsMutating] = useState(false);

  const updateClientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      if (!clientId) throw new Error('ID do cliente não fornecido');
      if (!user?.id) throw new Error('Usuário não autenticado');

      if (isMutating) {
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

      const { data: result, error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', clientId)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      setIsMutating(false);
      
      toast({
        title: "Cliente atualizado",
        description: "Cliente atualizado com sucesso!",
      });
      
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      
      setTimeout(() => {
        navigate('/clientes');
      }, 100);
    },
    onError: (error: any) => {
      setIsMutating(false);
      
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Ocorreu um erro ao atualizar o cliente.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsMutating(false);
    },
  });

  const resetFormWithClientData = useCallback((clientData: any) => {
    if (!clientData) return;
    
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

    form.reset(formData);
  }, [form]);

  useEffect(() => {
    if (client && isSuccess) {
      resetFormWithClientData(client);
    }
  }, [client, isSuccess, resetFormWithClientData]);

  const handleSubmit = useCallback((data: ClientFormData) => {
    if (updateClientMutation.isPending || isMutating) {
      return;
    }
    
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

  if (isLoading || authLoading) {
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
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
        </div>
      </div>
    );
  }

  if (!client) {
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
