// src/components/admin/ClientInfoDialog.tsx

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componentes de UI
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, MessageSquare, MapPin, CreditCard } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Tipagem atualizada para incluir os dados da assinatura
type FullProfile = {
  profile_id: string;
  name: string;
  email: string;
  created_at: string;
  whatsapp: string | null;
  is_subscribed: boolean | null;
  is_active: boolean | null;
  cep: string | null;
  address: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_complement: string | null;
  instance_name: string | null;
  stripe_subscription_status: string | null;
  subscription_current_period_end: number | null; // <-- Tipo correto: number (timestamp)
};

interface ClientInfoDialogProps {
  profileId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const InfoItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground">{value || '-'}</span>
  </div>
);

// Função para formatar o status da assinatura em um Badge
const getSubscriptionStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="secondary">Não assinante</Badge>;
    
    switch (status) {
        case 'active':
        case 'trialing':
            return <Badge className="bg-green-100 text-green-800 border-green-300">Ativa</Badge>;
        case 'past_due':
        case 'unpaid':
            return <Badge variant="destructive">Pagamento Pendente</Badge>;
        case 'canceled':
            return <Badge variant="outline">Cancelada</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};


export const ClientInfoDialog: React.FC<ClientInfoDialogProps> = ({ profileId, isOpen, onOpenChange }) => {
  const { data: profile, isLoading, error } = useQuery<FullProfile | null, Error>({
    queryKey: ['profile_details', profileId],
    queryFn: async () => {
      if (!profileId) return null;
      const { data, error } = await supabase.rpc('get_profile_details_for_admin', { p_profile_id: profileId }).single();
      if (error) throw error;
      return data;
    },
    enabled: !!profileId && isOpen,
  });
  
  useEffect(() => {
    if (error) {
        toast({ title: "Erro ao carregar detalhes", description: error.message, variant: "destructive" });
    }
  }, [error]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0 flex flex-col h-[90vh]">
        
        <DialogHeader className="p-8 pb-4 border-b">
          <DialogTitle className="text-2xl">{profile ? profile.name : 'Carregando...'}</DialogTitle>
          <DialogDescription>{profile ? `Detalhes do assinante #${profile.profile_id}` : 'Aguarde...'}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center flex-1"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : profile ? (
          <>
            <div className="flex justify-between items-center px-8 pt-4 mb-4">
                <span className="text-sm text-muted-foreground">Data de Registro: {format(parseISO(profile.created_at), 'dd/MM/yyyy')}</span>
                <Badge variant={profile.is_active !== false ? "default" : "secondary"}>
                    {profile.is_active !== false ? 'Ativo' : 'Inativo'}
                </Badge>
            </div>
            
            <ScrollArea className="flex-1 px-8">
              <div className="space-y-6">
                  <section>
                      <h3 className="text-lg font-semibold mb-3">Informações Básicas</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                          <InfoItem label="Responsável" value={profile.name} />
                          <InfoItem label="Email" value={profile.email} />
                          <InfoItem label="Telefone" value={profile.whatsapp} />
                          <InfoItem label="Instância WhatsApp" value={
                              profile.instance_name ? (
                                <div className="flex items-center gap-2 font-semibold text-green-700">
                                  <MessageSquare className="h-4 w-4" />
                                  <span>{profile.instance_name}</span>
                                </div>
                              ) : 'Nenhuma'
                            }
                          />
                      </div>
                  </section>

                  <Separator />

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="address-section" className="border-b-0">
                      <AccordionTrigger className="text-lg font-semibold hover:no-underline py-2">
                        <div className="flex items-center gap-3"><MapPin className="h-5 w-5" />Endereço</div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4 space-y-4 animate-fade-in">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            <InfoItem label="CEP" value={profile.cep} />
                            <div className="md:col-span-2"><InfoItem label="Endereço" value={profile.address} /></div>
                            <InfoItem label="Número" value={profile.address_number} />
                            <InfoItem label="Bairro" value={profile.address_neighborhood} />
                            <InfoItem label="Cidade" value={profile.address_city} />
                            <InfoItem label="Estado" value={profile.address_state} />
                            <div className="md:col-span-2"><InfoItem label="Complemento" value={profile.address_complement} /></div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  
                  <Separator />
                  
                  <section>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-3">
                          <CreditCard className="h-5 w-5" />
                          Dados da Assinatura
                      </h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                          <InfoItem
                            label="Status"
                            value={getSubscriptionStatusBadge(profile.stripe_subscription_status)}
                          />
                          <InfoItem
                            label="Próxima Cobrança / Fim do Acesso"
                            value={
                              profile.subscription_current_period_end 
                                ? format(new Date(profile.subscription_current_period_end * 1000), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) 
                                : 'N/A'
                            }
                          />
                      </div>
                  </section>
              </div>
            </ScrollArea>
            
            <DialogFooter className="p-8 pt-6 border-t">
              <DialogClose asChild><Button type="button" variant="outline">Voltar</Button></DialogClose>
            </DialogFooter>
          </>
        ) : (
             <div className="text-center flex-1 flex flex-col items-center justify-center">
                <h3 className="font-semibold text-lg">Não foi possível carregar as informações</h3>
                <p className="text-muted-foreground text-sm mt-1">Verifique sua conexão ou se a função SQL foi criada corretamente.</p>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
};