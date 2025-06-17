// src/components/forms/ClientForm.tsx

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
// --- CORREÇÃO AQUI ---
import { Input } from '@/components/ui/input';
// --- FIM CORREÇÃO ---
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, User, MapPin, DollarSign, Heart, Shield, Briefcase, Upload, Camera } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { CustomPhoneInput } from '@/components/ui/phone-input';
import { CpfInput } from '@/components/ui/CpfInput';
import { DateInput } from '@/components/ui/DateInput';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Constants } from '@/integrations/supabase/types'; 

const formSchema = z.object({
  id: z.string().optional(),
  avatar_url: z.string().nullable().optional(),
  avatar_file: z.any().optional(),
  name: z.string().min(3, { message: "O nome completo é obrigatório." }),
  whatsapp: z.string().min(10, { message: "O WhatsApp é obrigatório." }),
  professional_responsible: z.string().optional(),
  group: z.string().optional(),
  video_call_link: z.string().url({ message: "URL inválida." }).optional().or(z.literal('')),
  email: z.string().email({ message: "Email inválido." }).optional().or(z.literal('')),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  cep: z.string().optional(),
  address: z.string().optional(),
  address_number: z.string().optional(),
  address_neighborhood: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  address_complement: z.string().optional(),
  session_value: z.coerce.number().positive().optional(),
  billing_day: z.coerce.number().min(1).max(31).optional(),
  send_billing_reminder: z.boolean().default(false),
  financial_responsible_name: z.string().optional(),
  financial_responsible_whatsapp: z.string().optional(),
  financial_responsible_email: z.string().email({ message: "Email inválido." }).optional().or(z.literal('')),
  financial_responsible_cpf: z.string().optional(),
  financial_responsible_rg: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_whatsapp: z.string().optional(),
  gender: z.string().optional(),
  birth_date: z.date().optional().nullable(),
  nationality: z.string().optional(),
  education: z.string().optional(),
  occupation: z.string().optional(),
  forwarding: z.string().optional(),
  marital_status: z.string().optional(),
  notes: z.string().optional(),
  send_session_reminder: z.boolean().default(true),
  is_active: z.boolean().default(true),
  approval_status: z.nativeEnum(Constants.public.Enums.client_approval_status).optional(),
});

type ClientFormData = z.infer<typeof formSchema>;

interface ClientFormProps {
  onSuccess: () => void;
  initialData?: Partial<ClientFormData> | null;
  onAvatarChange: (preview: string | null) => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({ onSuccess, initialData, onAvatarChange }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<ClientFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '', whatsapp: '', professional_responsible: '', group: '',
      video_call_link: '', email: '', cpf: '', rg: '', cep: '',
      address: '', address_number: '', address_neighborhood: '',
      address_city: '', address_state: '', address_complement: '',
      session_value: undefined, billing_day: undefined,
      send_billing_reminder: false, financial_responsible_name: '',
      financial_responsible_whatsapp: '', financial_responsible_email: '',
      financial_responsible_cpf: '', financial_responsible_rg: '',
      emergency_contact_name: '', emergency_contact_whatsapp: '',
      gender: '', birth_date: null, nationality: '', education: '',
      occupation: '', forwarding: '', marital_status: '', notes: '',
      send_session_reminder: true, 
      is_active: true, 
      approval_status: 'approved', 
      avatar_url: null,
    },
  });

  useEffect(() => {
    if (initialData) {
      const sanitizedData = { ...initialData };

      Object.keys(formSchema.shape).forEach(key => {
        if (sanitizedData[key as keyof typeof sanitizedData] === null) {
          sanitizedData[key as keyof typeof sanitizedData] = '';
        }
      });
      
      sanitizedData.birth_date = initialData.birth_date ? new Date(initialData.birth_date) : null;
      
      sanitizedData.session_value = initialData.session_value || undefined;
      sanitizedData.billing_day = initialData.billing_day || undefined;

      if (initialData.approval_status) { 
          sanitizedData.approval_status = initialData.approval_status; 
      }
      
      form.reset(sanitizedData as any);
    }
  }, [initialData, form]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onAvatarChange(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue('avatar_file', file);
    }
  };

  const onSubmit = async (values: ClientFormData) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let avatarUrl = values.avatar_url;
      
      if (values.avatar_file && values.avatar_file instanceof File) {
        try {
          const fileExt = values.avatar_file.name.split('.').pop();
          const fileName = `client-avatar-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const { data, error: uploadError } = await supabase.storage
            .from('photos')
            .upload(fileName, values.avatar_file);
          
          if (uploadError) {
            console.warn('Erro no upload da imagem:', uploadError);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('photos')
              .getPublicUrl(fileName);
            
            avatarUrl = publicUrl;
          }
        } catch (storageError) {
          console.warn('Erro ao acessar storage:', storageError);
        }
      }
      
      const clientData = {
        ...values,
        avatar_url: avatarUrl,
        user_id: user.id,
        professional_responsible: values.professional_responsible || user.id,
        birth_date: values.birth_date ? values.birth_date.toISOString().split('T')[0] : null,
        approval_status: 'approved' as Constants.public.Enums.client_approval_status,
        is_active: true,
      };
      
      delete clientData.avatar_file;
      
      if (initialData?.id) {
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', initialData.id);
        
        if (error) throw error;
        
        toast({
          title: "Cliente atualizado com sucesso!",
          description: "As informações foram salvas.",
        });
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([clientData]);
        
        if (error) throw error;
        
        toast({
          title: "Cliente cadastrado com sucesso!",
          description: "O cliente foi adicionado à sua lista.",
        });
      }
      
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o cliente. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCepBlur = async (event: React.FocusEvent<HTMLInputElement>) => {
    const cep = event.target.value.replace(/\D/g, '');

    if (cep.length !== 8) {
      return;
    }

    try {
      const response = await fetch(`https://cep.awesomeapi.com.br/json/${cep}`);
      if (!response.ok) {
        throw new Error('CEP não encontrado');
      }
      const data = await response.json();
      
      form.setValue('address', data.address || '');
      form.setValue('address_neighborhood', data.district || '');
      form.setValue('address_city', data.city || '');
      form.setValue('address_state', data.state || '');

      form.setFocus('address_number');

    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast({
        title: "CEP não encontrado",
        description: "Verifique o CEP digitado e tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-6">
            
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                    <Camera className="h-5 w-5" /> 
                    Foto de Perfil
                </h3>
                <FormField 
                    name="avatar_file" 
                    render={() => ( 
                        <FormItem>
                            <FormControl>
                                <Button asChild variant="outline" size="sm" className="w-full">
                                    <Label className="cursor-pointer flex items-center justify-center gap-2">
                                        <Upload className="h-4 w-4" /> 
                                        Enviar / Trocar foto
                                        <Input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/png, image/jpeg, image/webp" 
                                            onChange={handleFileChange} 
                                        />
                                    </Label>
                                </Button>
                            </FormControl>
                        </FormItem>
                    )} 
                />
            </div>

            <FormField control={form.control} name="professional_responsible" render={({ field }) => (<FormItem><FormLabel>Profissional Responsável</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione um profissional..." /></SelectTrigger></FormControl><SelectContent><SelectItem value={user?.id || ''}>{user?.name}</SelectItem></SelectContent></Select></FormItem>)} />
            
            <div className="space-y-4 p-4 border rounded-lg"><h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><User className="h-5 w-5" />Informações</h3> 
              <FormField control={form.control} name="group" render={({ field }) => (<FormItem><FormLabel>Grupo</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="adolescentes">Adolescentes</SelectItem><SelectItem value="adultos">Adultos</SelectItem><SelectItem value="casal">Casal</SelectItem><SelectItem value="criancas">Crianças</SelectItem><SelectItem value="familias">Famílias</SelectItem><SelectItem value="idosos">Idosos</SelectItem></SelectContent></Select></FormItem>)} />
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome *</FormLabel><FormControl><Input placeholder="Nome completo do cliente" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="whatsapp" render={({ field }) => ( <FormItem><FormLabel>WhatsApp *</FormLabel><FormControl><CustomPhoneInput {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="video_call_link" render={({ field }) => (<FormItem><FormLabel>Link de video chamada</FormLabel><FormControl><Input placeholder="https://meet.google.com/..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="email@exemplo.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <Controller control={form.control} name="cpf" render={({ field }) => (<FormItem><FormLabel>CPF</FormLabel><FormControl><CpfInput {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="rg" render={({ field }) => (<FormItem><FormLabel>RG</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
              </div>
            </div>

            <div className="space-y-4 p-4 border rounded-lg"><h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><MapPin className="h-5 w-5" />Endereço</h3> 
              <FormField control={form.control} name="cep" render={({ field }) => (<FormItem><FormLabel>CEP</FormLabel><FormControl><Input placeholder="00000-000" {...field} onBlur={handleCepBlur} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Endereço</FormLabel><FormControl><Input placeholder="Rua, Avenida, etc." {...field} /></FormControl></FormItem>)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="address_number" render={({ field }) => (<FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="address_neighborhood" render={({ field }) => (<FormItem><FormLabel>Bairro</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="address_city" render={({ field }) => (<FormItem><FormLabel>Cidade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="address_state" render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
              </div>
              <FormField control={form.control} name="address_complement" render={({ field }) => (<FormItem><FormLabel>Complemento</FormLabel><FormControl><Input placeholder="Apto, bloco, casa..." {...field} /></FormControl></FormItem>)} />
            </div>

            <div className="space-y-4 p-4 border rounded-lg"><h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><DollarSign className="h-5 w-5" />Financeiro</h3> 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="session_value" render={({ field }) => (<FormItem><FormLabel>Valor por sessão</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="billing_day" render={({ field }) => (<FormItem><FormLabel>Dia de Cobrança</FormLabel><FormControl><Input type="number" min="1" max="31" {...field} /></FormControl></FormItem>)} />
              </div>
              <FormField control={form.control} name="send_billing_reminder" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel>Enviar lembrete mensal de cobrança</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
            </div>

            <div className="space-y-4 p-4 border rounded-lg"><h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><Shield className="h-5 w-5" />Responsável Financeiro</h3> 
              <FormField control={form.control} name="financial_responsible_name" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="financial_responsible_whatsapp" render={({ field }) => (<FormItem><FormLabel>WhatsApp</FormLabel><FormControl><CustomPhoneInput {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="financial_responsible_email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl></FormItem>)} />
                <Controller control={form.control} name="financial_responsible_cpf" render={({ field }) => (<FormItem><FormLabel>CPF</FormLabel><FormControl><CpfInput {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="financial_responsible_rg" render={({ field }) => (<FormItem><FormLabel>RG</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
              </div>
            </div>

            <div className="space-y-4 p-4 border rounded-lg"><h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><Heart className="h-5 w-5" />Contato de emergência</h3> 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="emergency_contact_name" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="emergency_contact_whatsapp" render={({ field }) => (<FormItem><FormLabel>WhatsApp</FormLabel><FormControl><CustomPhoneInput {...field} /></FormControl></FormItem>)} />
              </div>
            </div>

            <div className="space-y-4 p-4 border rounded-lg"><h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><Briefcase className="h-5 w-5" />Dados Adicionais do {user?.clientNomenclature}</h3> 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <FormField control={form.control} name="gender" render={({ field }) => (<FormItem><FormLabel>Gênero</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="feminino">Feminino</SelectItem><SelectItem value="masculino">Masculino</SelectItem><SelectItem value="outro">Outro</SelectItem><SelectItem value="nao-informar">Prefiro não informar</SelectItem></SelectContent></Select></FormItem>)} />
                <Controller control={form.control} name="birth_date" render={({ field }) => (<FormItem className="flex flex-col gap-1"><FormLabel>Data de Nascimento</FormLabel><FormControl><DateInput value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="nationality" render={({ field }) => (<FormItem><FormLabel>Naturalidade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="education" render={({ field }) => (<FormItem><FormLabel>Escolaridade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="occupation" render={({ field }) => (<FormItem><FormLabel>Profissão</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="forwarding" render={({ field }) => (<FormItem><FormLabel>Encaminhamento</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="marital_status" render={({ field }) => (<FormItem><FormLabel>Estado Civil</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
              </div>
            </div>
            
            <div className="space-y-2">
                <Label>Observações</Label>
                <FormField control={form.control} name="notes" render={({ field }) => (<FormControl><Textarea placeholder="Adicione observações importantes..." {...field} /></FormControl>)} />
            </div>

            <div className='space-y-3 pt-4'>
                <FormField control={form.control} name="send_session_reminder" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Ativar lembrete de sessão</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                {/* O campo is_active agora é controlado pelo approval_status para clientes criados via autoagendamento
                    Mas ainda é útil para o profissional desativar/ativar manualmente independentemente do fluxo de aprovação. */}
                <FormField control={form.control} name="is_active" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Cadastro Ativo</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
            </div>

        </div>
        <div className="pt-6 flex justify-end space-x-2">
            <Button type="button" variant="ghost" onClick={onSuccess}>Cancelar</Button>
            <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple">
                {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
        </div>
      </form>
    </Form>
  );
};