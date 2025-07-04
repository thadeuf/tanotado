// src/pages/EditClient.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ClientForm } from '@/components/forms/ClientForm';
import { ClientProfileSidebar } from '@/components/ClientProfileSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { ProntuarioContainer } from '@/components/prontuarios/ProntuarioContainer';
import { GenerateDocumentDialog } from '@/components/documents/GenerateDocumentDialog';
import { useAuth } from '@/contexts/AuthContext';
import { SessionNotesList } from '@/components/notes/SessionNotesList';
import { ClientFinancialRecords } from '@/components/financial/ClientFinancialRecords';
import { SavedDocumentsList } from '@/components/documents/SavedDocumentsList';
import { ClientAppointmentsList } from '@/components/agenda/ClientAppointmentsList';

const EditClient: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [clientData, setClientData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState('dados');
  
  const { user } = useAuth();
  const [isGenerateDocOpen, setIsGenerateDocOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeView]);

  const fetchClient = async () => {
    if (!clientId) {
      setError("ID do cliente não fornecido.");
      setIsLoading(false);
      return;
    }
    
    try {
      const { data, error: fetchError } = await supabase
        .rpc('get_client_details_with_stats', { p_client_id: clientId })
        .single();

      if (fetchError) throw fetchError;
      
      setClientData(data);
      setAvatarPreview(data?.avatar_url || null);
    } catch (e: any) {
      console.error("Erro ao buscar detalhes do cliente:", e);
      setError("Não foi possível carregar os dados do cliente.");
      toast({ title: "Erro ao carregar", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
  }, [clientId]);

  const handleFormSuccess = () => {
    toast({ title: "Sucesso!", description: "Dados do cliente salvos." });
    fetchClient(); 
  };
  
  const handleAvatarChange = (newPreview: string | null) => {
    setAvatarPreview(newPreview);
  };

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-[320px_1fr] gap-8">
        <div className="space-y-6">
          <div className="flex flex-col items-center"><Skeleton className="h-20 w-20 rounded-full" /><Skeleton className="h-6 w-32 mt-4" /><Skeleton className="h-4 w-40 mt-2" /></div>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
          <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
        </div>
        <div className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive text-center">{error}</p>;
  }

  return (
    <>
      <div className="grid md:grid-cols-[320px_1fr] gap-8 items-start">
        <aside className="sticky top-6">
          <ClientProfileSidebar 
              client={{...clientData, avatar_url: avatarPreview }}
              activeView={activeView}
              onViewChange={setActiveView}
              onGenerateDocument={() => setIsGenerateDocOpen(true)}
          />
        </aside>

        <main>
          {activeView === 'dados' && (
              <Card>
                  <CardHeader>
                      <CardTitle>Editar Dados Principais</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <ClientForm 
                        onSuccess={handleFormSuccess} 
                        initialData={clientData} 
                        onAvatarChange={handleAvatarChange} 
                        contexto="interno"
                      />
                  </CardContent>
              </Card>
          )}

          {activeView === 'prontuario' && clientData && (
              // --- ✅ ALTERAÇÃO APLICADA AQUI ---
              <ProntuarioContainer client={clientData} prontuarioLabel={user?.specialty_label || 'Prontuário'} />
          )}

          {activeView === 'agendamentos' && clientData && (
              <ClientAppointmentsList client={clientData} appointmentLabel={user?.appointment_label || 'Agendamento'}/>
          )}

          {activeView === 'anotacoes' && clientData && (
              <SessionNotesList client={clientData} />
          )}

          {activeView === 'financeiro' && clientData && (
              <ClientFinancialRecords client={clientData} />
          )}
          
          {activeView === 'documentos' && clientData && (
              <SavedDocumentsList client={clientData} />
          )}
          
          {activeView !== 'dados' && activeView !== 'prontuario' && activeView !== 'agendamentos' && activeView !== 'anotacoes' && activeView !== 'financeiro' && activeView !== 'documentos' && (
              <Card>
                  <CardHeader>
                      <CardTitle className="capitalize">{activeView}</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-center py-8 text-muted-foreground">A seção de "{activeView}" será implementada aqui.</p>
                  </CardContent>
              </Card>
          )}
        </main>
      </div>
      
      <GenerateDocumentDialog
        client={clientData}
        isOpen={isGenerateDocOpen}
        onOpenChange={setIsGenerateDocOpen}
      />
    </>
  );
};

export default EditClient;