
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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

const EditClient: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMultiUser = false; // Por enquanto fixo, pode ser configurável no futuro

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      if (!id) throw new Error('ID do cliente não fornecido');
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching client:', error);
        toast({
          title: "Erro ao carregar cliente",
          description: "Não foi possível carregar os dados do cliente.",
          variant: "destructive",
        });
        throw error;
      }

      return data;
    },
    enabled: !!id && !!user?.id,
  });

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      sendMonthlyReminder: false,
      activateSessionReminder: false,
      activeRegistration: true,
    },
  });

  useEffect(() => {
    if (client) {
      console.log('Client data loaded:', client);
      form.reset({
        name: client.name || '',
        email: client.email || '',
        whatsapp: client.phone || '',
        cpf: client.cpf || '',
        birthDate: client.birth_date || '',
        address: client.address || '',
        observations: client.notes || '',
        photoUrl: client.photo_url || '',
        groupId: client.group_id || '',
        sendMonthlyReminder: false,
        activateSessionReminder: false,
        activeRegistration: true,
      });
    }
  }, [client, form]);

  const onSubmit = async (data: ClientFormData) => {
    try {
      if (!id) return;

      console.log('Submitting data:', data);

      const clientData = {
        name: data.name,
        email: data.email || null,
        phone: data.whatsapp || null,
        cpf: data.cpf || null,
        birth_date: data.birthDate || null,
        address: data.address || null,
        notes: data.observations || null,
        group_id: data.groupId || null,
        photo_url: data.photoUrl || null,
      };

      console.log('Prepared client data:', clientData);

      const { error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Supabase error:', error);
        toast({
          title: "Erro ao atualizar",
          description: `Erro: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Cliente atualizado",
        description: "Cliente atualizado com sucesso!",
      });

      navigate(`/clientes/${id}`);
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar o cliente.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tanotado-purple mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando cliente...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/clientes/${id}`)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-tanotado-navy">
            Editar Cliente
          </h1>
          <p className="text-muted-foreground mt-1">
            {client.name}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {isMultiUser && (
            <ResponsibleProfessionalSection control={form.control} />
          )}

          <PersonalInformationSection control={form.control} />
          <AddressSection control={form.control} />
          <FinancialSection control={form.control} />
          <FinancialResponsibleSection control={form.control} />
          <EmergencyContactSection control={form.control} />
          <AdditionalDataSection control={form.control} />

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/clientes/${id}`)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple hover:shadow-lg transition-all duration-200"
            >
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EditClient;
