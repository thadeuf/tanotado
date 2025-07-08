// src/pages/EditClient.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [isGenerateDocOpen, setIsGenerateDocOpen] = useState(false);
  
  // --- CORREÇÃO APLICADA AQUI ---
  // O estado do preview do avatar é controlado aqui, no componente pai.
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
      // Define o avatar inicial vindo do banco de dados
      setAvatarPreview((data as any)?.avatar_url || null);
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
    fetchClient(); // Recarrega os dados do cliente para garantir consistência
  };
  
  const handleCancel = () => {
    navigate('/clientes');
  };

  // --- CORREÇÃO APLICADA AQUI ---
  // Esta função será passada como prop para o ClientForm.
  // Ela atualiza o estado do preview no componente pai.
  const handleAvatarChange = (newPreview: string | null) => {
    setAvatarPreview(newPreview);
  };

  if (isLoading) {
    // ... (seu código de skeleton, sem alterações)
  }

  if (error) {
    return <p className="text-destructive text-center">{error}</p>;
  }

  return (
    <>
      <div className="grid md:grid-cols-[320px_1fr] gap-8 items-start">
        <aside className="sticky top-6">
          <ClientProfileSidebar 
              // Passa o estado do preview para a barra lateral
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
                        onCancel={handleCancel}
                        initialData={clientData} 
                        // Passa a função de callback para o formulário
                        onAvatarChange={handleAvatarChange} 
                        contexto="interno"
                      />
                  </CardContent>
              </Card>
          )}
          
          {/* O restante das suas visualizações (prontuário, financeiro, etc.) permanece o mesmo */}
          {activeView === 'prontuario' && clientData && (
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