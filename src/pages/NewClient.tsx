
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { clientSchema, ClientFormData } from '@/schemas/clientSchema';
import FormHeader from '@/components/client-form/FormHeader';
import ResponsibleProfessionalSection from '@/components/client-form/ResponsibleProfessionalSection';
import PersonalInformationSection from '@/components/client-form/PersonalInformationSection';
import AddressSection from '@/components/client-form/AddressSection';
import FinancialSection from '@/components/client-form/FinancialSection';
import FinancialResponsibleSection from '@/components/client-form/FinancialResponsibleSection';
import EmergencyContactSection from '@/components/client-form/EmergencyContactSection';
import AdditionalDataSection from '@/components/client-form/AdditionalDataSection';
import FormActions from '@/components/client-form/FormActions';

const NewClient: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMultiUser = false; // Por enquanto fixo, pode ser configurável no futuro

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      sendMonthlyReminder: false,
      activateSessionReminder: false,
      activeRegistration: true,
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    try {
      console.log('Form data:', data);

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
        user_id: user?.id,
      };

      console.log('Client data to insert:', clientData);

      const { error } = await supabase
        .from('clients')
        .insert([clientData]);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast({
        title: "Cliente cadastrado",
        description: "Cliente cadastrado com sucesso!",
      });

      navigate('/clientes');
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: "Erro ao cadastrar",
        description: "Ocorreu um erro ao cadastrar o cliente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <FormHeader />

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

          <FormActions />
        </form>
      </Form>
    </div>
  );
};

export default NewClient;
