// src/pages/PatientRegistration.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Componentes de UI
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, CheckCircle, AlertCircle } from 'lucide-react';
import { CpfInput } from '@/components/ui/CpfInput';
import { DateInput } from '@/components/ui/DateInput';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ClientForm } from '@/components/forms/ClientForm'; // Reutilizaremos o formulário de cliente
import { Skeleton } from '@/components/ui/skeleton';

// Tipos
type ProfessionalProfile = {
  id: string;
  name: string;
  specialty: string | null;
  avatar_url: string | null;
  client_nomenclature: string;
};

// Schema para a identificação inicial
const identificationSchema = z.object({
  cpf: z.string().min(14, { message: "CPF inválido." }),
  birth_date: z.date({ required_error: 'Data de nascimento é obrigatória.' }),
});

const PatientRegistration: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [professionalProfile, setProfessionalProfile] = useState<ProfessionalProfile | null>(null);
  const [loadingProfessional, setLoadingProfessional] = useState(true);
  const [errorProfessional, setErrorProfessional] = useState<string | null>(null);
  const [step, setStep] = useState<'identification' | 'form' | 'success'>('identification');
  const [clientData, setClientData] = useState<any>(null);

  const identificationForm = useForm<z.infer<typeof identificationSchema>>({
    resolver: zodResolver(identificationSchema),
  });

  // Busca o perfil do profissional baseado no 'slug' da URL
  useEffect(() => {
    const fetchProfessional = async () => {
      if (!slug) {
        setErrorProfessional("URL do profissional inválida.");
        setLoadingProfessional(false);
        return;
      }
      try {
        const { data, error } = await supabase.rpc('get_public_profile_by_slug', { p_slug: slug }).single();
        if (error) throw error;
        setProfessionalProfile(data);
      } catch (e: any) {
        setErrorProfessional("Página de cadastro não encontrada ou desativada.");
      } finally {
        setLoadingProfessional(false);
      }
    };
    fetchProfessional();
  }, [slug]);

  // Mutation para verificar o cliente
  const findClientMutation = useMutation({
    mutationFn: async (vars: { cpf: string; birth_date: Date; professionalId: string }) => {
      const cleanCpf = vars.cpf.replace(/[^\d]/g, '');
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('cpf', cleanCpf)
        .eq('user_id', vars.professionalId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignora o erro "nenhuma linha encontrada"

      if (data) {
        // Cliente já existe, verificar data de nascimento
        if (data.birth_date !== vars.birth_date.toISOString().split('T')[0]) {
            throw new Error('invalid_birth_date');
        }
        return { ...data, isNew: false };
      }
      return { cpf: cleanCpf, birth_date: vars.birth_date, isNew: true };
    },
    onSuccess: (data) => {
      setClientData(data);
      setStep('form');
      if (!data.isNew) {
         toast({ title: "Identificação confirmada!", description: `Bem-vindo(a) de volta, ${data.name?.split(' ')[0]}! Complete ou atualize seus dados.` });
      } else {
         toast({ title: "Ótimo!", description: "Agora preencha os seus dados de cadastro." });
      }
    },
    onError: (error: any) => {
      if (error.message.includes('invalid_birth_date')) {
          toast({
              title: "Dados Incorretos",
              description: "A data de nascimento não corresponde ao CPF informado. Por favor, verifique os dados ou entre em contato com o profissional.",
              variant: "destructive",
          });
      } else {
          toast({ title: "Erro na identificação", description: error.message || "Não foi possível identificá-lo(a).", variant: "destructive" });
      }
    },
  });

  const handleIdentificationSubmit = (data: z.infer<typeof identificationSchema>) => {
    if (professionalProfile) {
      findClientMutation.mutate({
        cpf: data.cpf,
        birth_date: data.birth_date,
        professionalId: professionalProfile.id,
      });
    }
  };
  
  const handleFormSuccess = () => {
    setStep('success'); // Avança para a tela de sucesso
  };

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '..';

  // Componente Header do Profissional
  const ProfessionalHeader = React.memo(({ profile }: { profile: ProfessionalProfile }) => (
    <div className="flex flex-col items-center text-center p-6 bg-white border-b rounded-t-lg">
      <Avatar className="w-24 h-24 mb-4 border-2 border-primary shadow-md">
        <AvatarImage src={profile.avatar_url || undefined} /><AvatarFallback className="text-3xl bg-gradient-to-r from-tanotado-pink to-tanotado-purple text-white">{getInitials(profile.name || '')}</AvatarFallback>
      </Avatar>
      <h1 className="text-2xl font-bold text-tanotado-navy">{profile.name}</h1><p className="text-lg text-muted-foreground">{profile.specialty}</p>
    </div>
  ));

  const ProfessionalHeaderSkeleton = () => (
      <div className="flex flex-col items-center text-center p-6 bg-white border-b rounded-t-lg">
        <Skeleton className="w-24 h-24 rounded-full mb-4" />
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-5 w-32" />
      </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50 p-4">
      <div className="text-center pt-8 pb-4">
        <img src="/lovable-uploads/4a78275e-0af1-4fd5-ae15-9d988197bca6.png" alt="Logotipo tanotado" className="w-40 h-auto mx-auto" />
        <p className="text-muted-foreground mt-2">Plataforma de Gestão para Profissionais</p>
      </div>

      <Card className="w-full max-w-4xl border-0 shadow-lg">
        {loadingProfessional ? <ProfessionalHeaderSkeleton /> : professionalProfile && <ProfessionalHeader profile={professionalProfile} />}
        <CardContent className="p-6">
            {errorProfessional && <div className="p-6 text-center text-red-600">{errorProfessional}</div>}
            {!loadingProfessional && !errorProfessional && (
              <>
                {step === 'identification' && (
                  <div className="space-y-6 animate-fade-in max-w-md mx-auto">
                    <div className="text-center space-y-2">
                        <User className="mx-auto h-12 w-12 text-tanotado-blue" />
                        <h2 className="text-xl font-semibold text-tanotado-navy">Identificação do Cliente</h2>
                        <p className="text-sm text-muted-foreground">Por favor, informe seu CPF e Data de Nascimento para iniciar.</p>
                    </div>
                    <Form {...identificationForm}>
                        <form onSubmit={identificationForm.handleSubmit(handleIdentificationSubmit)} className="space-y-4">
                            <FormField control={identificationForm.control} name="cpf" render={({ field }) => (<FormItem><FormLabel>CPF</FormLabel><FormControl><CpfInput {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={identificationForm.control} name="birth_date" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Data de Nascimento</FormLabel><FormControl><DateInput value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
                            <Button type="submit" className="w-full bg-tanotado-purple hover:bg-tanotado-purple/90" disabled={findClientMutation.isPending}>{findClientMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Continuar</Button>
                        </form>
                    </Form>
                  </div>
                )}
                
                {step === 'form' && clientData && professionalProfile && (
                    <div className="animate-fade-in">
                        <CardTitle className="mb-4">Formulário de Cadastro</CardTitle>
                        <CardDescription className="mb-6">
                            Por favor, preencha todos os campos abaixo. Suas informações serão enviadas de forma segura para <strong>{professionalProfile.name}</strong>.
                        </CardDescription>
                        <ClientForm
                            onSuccess={handleFormSuccess}
                            // Passa os dados iniciais, sejam de um cliente existente ou os novos (cpf/data)
                            initialData={{
                                ...clientData,
                                professional_responsible: professionalProfile.id, // Garante que o profissional responsável seja o correto
                            }}
                            onAvatarChange={() => {}} // Função vazia, pois o avatar é tratado dentro do ClientForm
                            contexto="publico"
                        />
                    </div>
                )}
                
                {step === 'success' && (
                     <div className="space-y-6 text-center animate-fade-in py-12">
                        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                        <h2 className="text-2xl font-semibold text-tanotado-navy">Cadastro Enviado com Sucesso!</h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Suas informações foram recebidas. <strong>{professionalProfile?.name}</strong> entrará em contato em breve para os próximos passos.
                        </p>
                        <Button onClick={() => navigate('/')}>Voltar para o início</Button>
                    </div>
                )}
              </>
            )}
        </CardContent>
      </Card>
      <footer className="text-center mt-6">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} <a href="https://tanotado.com.br" className="font-semibold text-tanotado-blue hover:underline">tanotado</a>. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default PatientRegistration;