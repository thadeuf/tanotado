
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, User, MapPin, DollarSign, Users, Heart, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const clientSchema = z.object({
  responsibleProfessional: z.string().optional(),
  group: z.string().optional(),
  name: z.string().min(1, 'Nome é obrigatório'),
  whatsapp: z.string().optional(),
  videoCallLink: z.string().url().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  cep: z.string().optional(),
  address: z.string().optional(),
  number: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  complement: z.string().optional(),
  sessionValue: z.string().optional(),
  paymentDay: z.string().optional(),
  sendMonthlyReminder: z.boolean().default(false),
  financialResponsibleName: z.string().optional(),
  financialResponsibleWhatsapp: z.string().optional(),
  financialResponsibleEmail: z.string().email().optional().or(z.literal('')),
  financialResponsibleCpf: z.string().optional(),
  financialResponsibleRg: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactWhatsapp: z.string().optional(),
  gender: z.string().optional(),
  birthDate: z.string().optional(),
  nationality: z.string().optional(),
  education: z.string().optional(),
  profession: z.string().optional(),
  referral: z.string().optional(),
  maritalStatus: z.string().optional(),
  observations: z.string().optional(),
  activateSessionReminder: z.boolean().default(false),
  activeRegistration: z.boolean().default(true),
});

type ClientFormData = z.infer<typeof clientSchema>;

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
      const clientData = {
        name: data.name,
        email: data.email || null,
        phone: data.whatsapp || null,
        cpf: data.cpf || null,
        birth_date: data.birthDate || null,
        address: data.address || null,
        notes: data.observations || null,
        user_id: user?.id,
      };

      const { error } = await supabase
        .from('clients')
        .insert([clientData]);

      if (error) throw error;

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/clientes')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-tanotado-navy">
              Novo {user?.clientNomenclature || 'Cliente'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Preencha as informações do novo {user?.clientNomenclature?.toLowerCase() || 'cliente'}
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Profissional Responsável - só aparece em modo multi usuário */}
          {isMultiUser && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-tanotado-purple" />
                  Profissional Responsável
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="responsibleProfessional"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Profissional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="group"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Grupo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="grupo1">Grupo 1</SelectItem>
                            <SelectItem value="grupo2">Grupo 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Informações Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-tanotado-purple" />
                Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>🇧🇷+55 WhatsApp</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="videoCallLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link de vídeo chamada</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="rg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RG</FormLabel>
                      <FormControl>
                        <Input placeholder="RG" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-tanotado-purple" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input placeholder="00000-000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, Avenida..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input placeholder="123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input placeholder="Bairro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="Estado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="complement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complemento</FormLabel>
                    <FormControl>
                      <Input placeholder="Apto, casa, etc..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Financeiro */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-tanotado-purple" />
                Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sessionValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor por sessão</FormLabel>
                      <FormControl>
                        <Input placeholder="R$ 0,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="paymentDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dia de Cobrança</FormLabel>
                      <FormControl>
                        <Input placeholder="15" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="sendMonthlyReminder"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Enviar lembrete mensal de cobrança
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Responsável Financeiro */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-tanotado-purple" />
                Responsável Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="financialResponsibleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do responsável financeiro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="financialResponsibleWhatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>🇧🇷+55 WhatsApp</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="financialResponsibleEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="financialResponsibleCpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="financialResponsibleRg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RG</FormLabel>
                      <FormControl>
                        <Input placeholder="RG" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contato de Emergência */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-tanotado-purple" />
                Contato de Emergência
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emergencyContactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do contato de emergência" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="emergencyContactWhatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>🇧🇷+55 WhatsApp</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dados Adicionais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-tanotado-purple" />
                Dados Adicionais do Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gênero</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o gênero" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="feminino">Feminino</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                            <SelectItem value="nao-informar">Prefiro não informar</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Naturalidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade/Estado de nascimento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="education"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Escolaridade</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a escolaridade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fundamental-incompleto">Ensino Fundamental Incompleto</SelectItem>
                            <SelectItem value="fundamental-completo">Ensino Fundamental Completo</SelectItem>
                            <SelectItem value="medio-incompleto">Ensino Médio Incompleto</SelectItem>
                            <SelectItem value="medio-completo">Ensino Médio Completo</SelectItem>
                            <SelectItem value="superior-incompleto">Ensino Superior Incompleto</SelectItem>
                            <SelectItem value="superior-completo">Ensino Superior Completo</SelectItem>
                            <SelectItem value="pos-graduacao">Pós-graduação</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="profession"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profissão</FormLabel>
                      <FormControl>
                        <Input placeholder="Profissão" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="referral"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Encaminhamento</FormLabel>
                      <FormControl>
                        <Input placeholder="Como chegou até aqui" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="maritalStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado Civil</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o estado civil" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                          <SelectItem value="casado">Casado(a)</SelectItem>
                          <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                          <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                          <SelectItem value="uniao-estavel">União Estável</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="activateSessionReminder"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Ativar lembrete de sessão
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="activeRegistration"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Cadastro Ativo
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
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
              className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple hover:shadow-lg transition-all duration-200"
            >
              Cadastrar {user?.clientNomenclature || 'Cliente'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NewClient;
