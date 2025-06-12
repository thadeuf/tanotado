// src/components/admin/ClientInfoDialog.tsx

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// Tipagem ajustada para receber 'is_active'
type FullProfile = {
  profile_id: string;
  name: string;
  email: string;
  created_at: string;
  whatsapp: string | null;
  is_subscribed: boolean | null;
  is_active: boolean | null; // <<< CAMPO ADICIONADO
  cep: string | null;
  address: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_complement: string | null;
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

export const ClientInfoDialog: React.FC<ClientInfoDialogProps> = ({ profileId, isOpen, onOpenChange }) => {
  const { data: profile, isLoading, error } = useQuery<FullProfile | null, Error>({
    queryKey: ['profile_details', profileId],
    queryFn: async () => {
      if (!profileId) return null;
      
      const { data, error } = await supabase
        .rpc('get_profile_details_for_admin', { p_profile_id: profileId })
        .single();

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
          <DialogTitle className="text-2xl">
            {profile ? profile.name : 'Carregando Informações...'}
          </DialogTitle>
          <DialogDescription>
            {/* AJUSTE 1: Exibindo o ID completo do assinante */}
            {profile ? `Detalhes do assinante #${profile.profile_id}` : 'Aguarde enquanto buscamos os dados.'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : profile ? (
          <>
            <div className="flex justify-between items-center px-8 pt-4 mb-4">
                <span className="text-sm text-muted-foreground">Data de Registro: {format(parseISO(profile.created_at), 'dd/MM/yyyy')}</span>
                {/* AJUSTE 2: Lógica do badge agora usa a coluna 'is_active' */}
                <Badge variant={profile.is_active ? "default" : "secondary"}>
                    {profile.is_active ? 'Ativo' : 'Inativo'}
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
                      </div>
                  </section>
                  <Separator />
                  <section>
                      <h3 className="text-lg font-semibold mb-3">Endereço Atual</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                          <InfoItem label="CEP" value={profile.cep} />
                          <div className="md:col-span-2"><InfoItem label="Endereço" value={profile.address} /></div>
                          <InfoItem label="Número" value={profile.address_number} />
                          <InfoItem label="Bairro" value={profile.address_neighborhood} />
                          <InfoItem label="Cidade" value={profile.address_city} />
                          <InfoItem label="Estado" value={profile.address_state} />
                          <div className="md:col-span-2"><InfoItem label="Complemento" value={profile.address_complement} /></div>
                      </div>
                  </section>
                  <Separator />
                  <section>
                      <h3 className="text-lg font-semibold mb-3">Dados de Cobrança</h3>
                       <div className="p-4 text-center bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">Os campos de dados de cobrança (CNPJ, Nome Fantasia) não foram encontrados na tabela de perfis.</p>
                      </div>
                  </section>
              </div>
            </ScrollArea>
            
            <DialogFooter className="p-8 pt-6 border-t">
              <DialogClose asChild>
                <Button type="button" variant="outline">Voltar</Button>
              </DialogClose>
            </DialogFooter>
          </>
        ) : (
             <div className="text-center flex-1 flex flex-col items-center justify-center">
                <h3 className="font-semibold text-lg">Não foi possível carregar as informações</h3>
                <p className="text-muted-foreground text-sm mt-1">Verifique sua conexão ou se a função SQL foi criada corretamente no Supabase.</p>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
};