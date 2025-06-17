// src/components/settings/MyAccountForm.tsx

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

// Componentes da UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Upload, MapPin, User, Briefcase, Settings, Link as LinkIcon, Clock } from 'lucide-react';
import { CustomPhoneInput } from '@/components/ui/phone-input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Função utilitária para transformar string em slug
const slugify = (text: string) => {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

// Schema completo com todos os campos (antigos e novos)
const profileSchema = z.object({
  name: z.string().min(3, { message: "O nome é obrigatório." }),
  whatsapp: z.string().optional(),
  council_registration: z.string().optional(),
  about_you: z.string().optional(),
  cep: z.string().optional(),
  address: z.string().optional(),
  address_number: z.string().optional(),
  address_neighborhood: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  address_complement: z.string().optional(),
  avatar_url: z.string().nullable().optional(),
  avatar_file: z.any().optional(),
  public_booking_enabled: z.boolean().default(false),
  public_booking_url_slug: z.string().optional().refine(val => {
    // A validação de formato é a mesma
    if (val !== undefined && val !== null && val.trim() !== '') {
      return /^[a-z0-9-]+$/.test(val); 
    }
    return true; // Permite vazio se não for ativado ou não preenchido
  }, {
    message: "A URL amigável deve conter apenas letras minúsculas, números e hífens (ex: minha-url-perfeita).",
  }),
  working_hours: z.object({
    monday: z.object({ enabled: z.boolean(), start1: z.string().optional(), end1: z.string().optional(), start2: z.string().optional(), end2: z.string().optional(), }),
    tuesday: z.object({ enabled: z.boolean(), start1: z.string().optional(), end1: z.string().optional(), start2: z.string().optional(), end2: z.string().optional(), }),
    wednesday: z.object({ enabled: z.boolean(), start1: z.string().optional(), end1: z.string().optional(), start2: z.string().optional(), end2: z.string().optional(), }),
    thursday: z.object({ enabled: z.boolean(), start1: z.string().optional(), end1: z.string().optional(), start2: z.string().optional(), end2: z.string().optional(), }),
    friday: z.object({ enabled: z.boolean(), start1: z.string().optional(), end1: z.string().optional(), start2: z.string().optional(), end2: z.string().optional(), }),
    saturday: z.object({ enabled: z.boolean(), start1: z.string().optional(), end1: z.string().optional(), start2: z.string().optional(), end2: z.string().optional(), }),
    sunday: z.object({ enabled: z.boolean(), start1: z.string().optional(), end1: z.string().optional(), start2: z.string().optional(), end2: z.string().optional(), }),
  }).optional(),
}).superRefine((data, ctx) => {
  // Validação CONDICIONAL: se public_booking_enabled for true, public_booking_url_slug é obrigatório
  if (data.public_booking_enabled && (!data.public_booking_url_slug || data.public_booking_url_slug.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['public_booking_url_slug'],
      message: 'A URL amigável é obrigatória quando o autoagendamento está ativado.',
    });
  }
});


type ProfileFormData = z.infer<typeof profileSchema>;

interface MyAccountFormProps {
  onSuccess: () => void;
}

export const MyAccountForm: React.FC<MyAccountFormProps> = ({ onSuccess }) => {
  const { user, refetchUser } = useAuth();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<string | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '', whatsapp: '', council_registration: '', about_you: '',
      cep: '', address: '', address_number: '', address_neighborhood: '',
      address_city: '', address_state: '', address_complement: '', avatar_url: null,
      public_booking_enabled: false,
      public_booking_url_slug: '',
      working_hours: {
        monday: { enabled: false, start1: '', end1: '', start2: '', end2: '' },
        tuesday: { enabled: false, start1: '', end1: '', start2: '', end2: '' },
        wednesday: { enabled: false, start1: '', end1: '', start2: '', end2: '' },
        thursday: { enabled: false, start1: '', end1: '', start2: '', end2: '' },
        friday: { enabled: false, start1: '', end1: '', start2: '', end2: '' },
        saturday: { enabled: false, start1: '', end1: '', start2: '', end2: '' },
        sunday: { enabled: false, start1: '', end1: '', start2: '', end2: '' },
      }
    },
  });

  const isBookingPageEnabled = form.watch('public_booking_enabled');
  // Obter o slug atual para exibir a URL completa após salvar (ou do user)
  const currentSlug = form.watch('public_booking_url_slug');


  const daysOfWeek = [
    { id: 'monday', label: 'Segunda-feira' },
    { id: 'tuesday', label: 'Terça-feira' },
    { id: 'wednesday', label: 'Quarta-feira' },
    { id: 'thursday', label: 'Quinta-feira' },
    { id: 'friday', label: 'Sexta-feira' },
    { id: 'saturday', label: 'Sábado' },
    { id: 'sunday', label: 'Domingo' },
  ] as const;

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || '',
        whatsapp: user.whatsapp || '',
        council_registration: user.council_registration || '',
        about_you: user.about_you || '',
        cep: user.cep || '',
        address: user.address || '',
        address_number: user.address_number || '',
        address_neighborhood: user.address_neighborhood || '',
        address_city: user.address_city || '',
        address_state: user.address_state || '',
        address_complement: user.address_complement || '',
        avatar_url: user.avatar_url || null,
        public_booking_enabled: user.public_booking_enabled ?? false,
        public_booking_url_slug: user.public_booking_url_slug || '',
      });
      setPreview(user.avatar_url || null);
    }
  }, [user, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
      form.setValue('avatar_file', file);
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormData) => {
      console.log("Valores a serem salvos (futuramente):", values);

      if (!user) throw new Error("Usuário não autenticado.");
      let avatarUrl = values.avatar_url;
      if (values.avatar_file instanceof File) {
        const fileExt = values.avatar_file.name.split('.').pop();
        const fileName = `profile-avatar-${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('photos').upload(fileName, values.avatar_file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName);
        avatarUrl = publicUrl;
      }
      
      const profileData = { 
        ...values, 
        id: user.id, 
        updated_at: new Date().toISOString(), 
        avatar_url: avatarUrl,
        public_booking_enabled: values.public_booking_enabled,
        public_booking_url_slug: values.public_booking_url_slug?.trim() || null, 
      };

      delete (profileData as any).avatar_file;
      const { error } = await supabase.from('profiles').update(profileData).eq('id', user.id);
      if (error) throw error;
      return profileData;
    },
    onSuccess: async () => {
      toast({ title: "Perfil atualizado com sucesso!" });
      await refetchUser();
      onSuccess();
    },
    onError: (error: any) => toast({ title: "Erro ao atualizar perfil", description: error.message, variant: "destructive" }),
  });

  const handleCepBlur = async (event: React.FocusEvent<HTMLInputElement>) => {
    const cep = event.target.value.replace(/\D/g, '');
    if (cep.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) throw new Error('CEP não encontrado');
      const data = await response.json();
      if (data.erro) throw new Error('CEP inválido');
      form.setValue('address', data.logradouro || '');
      form.setValue('address_neighborhood', data.bairro || '');
      form.setValue('address_city', data.localidade || '');
      form.setValue('address_state', data.uf || '');
      form.setFocus('address_number');
    } catch (error) {
      toast({ title: "Erro ao buscar CEP", description: (error as Error).message, variant: "destructive" });
    }
  };

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '..';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => updateProfileMutation.mutate(data))}>
        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            
            {/* SEÇÃO 1: INFORMAÇÕES PESSOAIS (RESTAURADA) */}
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><User className="h-5 w-5" />Informações Pessoais</h3>
                <div className="flex flex-col items-center gap-4 pt-2">
                  <Avatar className="h-28 w-28 border-4 border-muted">
                    <AvatarImage src={preview || undefined} />
                    <AvatarFallback className="bg-muted text-4xl">{getInitials(user?.name || '')}</AvatarFallback>
                  </Avatar>
                  <FormField name="avatar_file" control={form.control} render={() => (
                    <FormItem>
                      <FormControl>
                        <Button asChild variant="outline" size="sm">
                          <FormLabel className="cursor-pointer flex items-center gap-2 !m-0">
                            <Upload className="h-4 w-4" />
                            {preview ? "Trocar foto" : "Enviar foto"}
                            <Input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} />
                          </FormLabel>
                        </Button>
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" value={user?.email || ''} disabled className="cursor-not-allowed bg-muted/50" /></FormControl>
                  </FormItem>
                  <FormField control={form.control} name="whatsapp" render={({ field }) => (
                    <FormItem><FormLabel>WhatsApp</FormLabel><FormControl><CustomPhoneInput {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="council_registration" render={({ field }) => (
                    <FormItem><FormLabel>Registro Conselho</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
            </div>
            
            {/* SEÇÃO 2: SOBRE VOCÊ (RESTAURADA) */}
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><Briefcase className="h-5 w-5" />Sobre Você</h3>
                <FormField control={form.control} name="about_you" render={({ field }) => (
                  <FormItem><FormLabel>Resumo Profissional</FormLabel><FormControl><Textarea placeholder="Fale um pouco sobre sua especialidade..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>

            {/* SEÇÃO 3: PÁGINA DE AGENDAMENTO (INCLUÍDA CORRETAMENTE) */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                        <Settings className="h-5 w-5" />Página de Agendamento
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Configure aqui as informações que serão exibidas na página de agendamento.
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="public_booking_enabled" 
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 pt-1">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Ativar</FormLabel>
                      </FormItem>
                    )}
                  />
              </div>

              {isBookingPageEnabled && (
                <div className="space-y-4 pt-4 border-t animate-fade-in">
                  <FormField
                    control={form.control}
                    name="public_booking_url_slug" // NOVO CAMPO
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL da sua página</FormLabel>
                        <div className="relative">
                          
                          <Input
                            placeholder="Escolha uma URL" // Placeholder vazio para não ter texto truncado
                            {...field}
                            value={field.value === null ? '' : field.value} 
                            onChange={(e) => field.onChange(slugify(e.target.value))} 
                            //className="pl-[200px]" // Ajusta o padding para a URL base
                          />
                        </div>
                        <FormMessage />
                        {/* Exibir a URL completa após salvar */}
                        {user?.public_booking_url_slug && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Link direto: <a href={`${window.location.origin}/agendar/${user.public_booking_url_slug}`} target="_blank" rel="noopener noreferrer" className="text-tanotado-blue hover:underline">
                              {window.location.origin}/agendar/{user.public_booking_url_slug}
                            </a>
                          </p>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* INÍCIO DA NOVA SEÇÃO: Horários de Atendimento */}
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                    <Clock className="h-5 w-5" /> Horários de Atendimento
                </h3>
                <p className="text-sm text-muted-foreground">
                    Defina seus horários de trabalho para cada dia da semana. Estes horários influenciarão a sua página de agendamento.
                </p>
                <div className="space-y-4 pt-2">
                    {daysOfWeek.map(day => {
                        const isDayEnabled = form.watch(`working_hours.${day.id}.enabled`);
                        return (
                            <div key={day.id} className="p-3 border rounded-md transition-colors duration-300 ease-in-out">
                                <FormField
                                    control={form.control}
                                    name={`working_hours.${day.id}.enabled`}
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between">
                                            <FormLabel className="font-semibold">{day.label}</FormLabel>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                {isDayEnabled && (
                                    <div className="mt-4 pt-4 border-t space-y-4 animate-fade-in">
                                        {/* Time Slot 1 */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={form.control} name={`working_hours.${day.id}.start1`} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-1.5 text-xs"><Clock className="h-3 w-3" /> De</FormLabel>
                                                    <FormControl><Input type="time" {...field} /></FormControl>
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name={`working_hours.${day.id}.end1`} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-1.5 text-xs"><Clock className="h-3 w-3" /> Até</FormLabel>
                                                    <FormControl><Input type="time" {...field} /></FormControl>
                                                </FormItem>
                                            )} />
                                        </div>
                                        {/* Time Slot 2 */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={form.control} name={`working_hours.${day.id}.start2`} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-1.5 text-xs"><Clock className="h-3 w-3" /> De</FormLabel>
                                                    <FormControl><Input type="time" {...field} /></FormControl>
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name={`working_hours.${day.id}.end2`} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-1.5 text-xs"><Clock className="h-3 w-3" /> Até</FormLabel>
                                                    <FormControl><Input type="time" {...field} /></FormControl>
                                                </FormItem>
                                            )} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
            {/* FIM DA NOVA SEÇÃO */}


            {/* SEÇÃO 4: ENDEREÇO (RESTAURADA) */}
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><MapPin className="h-5 w-5" />Endereço</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="cep" render={({ field }) => (<FormItem className="md:col-span-1"><FormLabel>CEP</FormLabel><FormControl><Input {...field} onBlur={handleCepBlur} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="address" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Endereço</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="address_number" render={({ field }) => (<FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="address_neighborhood" render={({ field }) => (<FormItem><FormLabel>Bairro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="address_complement" render={({ field }) => (<FormItem><FormLabel>Complemento</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="address_city" render={({ field }) => (<FormItem><FormLabel>Cidade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="address_state" render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
            </div>

          </div>
        </ScrollArea>
        <div className="flex justify-end pt-6 border-t mt-6">
          <Button type="submit" disabled={updateProfileMutation.isPending} className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple">
            {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </div>
      </form>
    </Form>
  );
};