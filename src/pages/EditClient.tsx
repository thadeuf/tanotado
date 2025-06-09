// src/pages/EditClient.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ClientForm } from '@/components/forms/ClientForm';
import { ClientProfileSidebar } from '@/components/ClientProfileSidebar'; // Importa o novo componente
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EditClient: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [clientData, setClientData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClient = async () => {
      if (!clientId) {
        setError("ID do cliente não fornecido.");
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) {
        console.error("Erro ao buscar cliente:", error);
        setError("Não foi possível carregar os dados do cliente.");
        setIsLoading(false);
      } else {
        setClientData(data);
        setIsLoading(false);
      }
    };

    fetchClient();
  }, [clientId]);

  const handleSuccess = () => {
    navigate('/clientes'); // Volta para a lista após salvar
  };

  // Renderização principal do componente
  if (isLoading) {
    return (
        <div className="grid md:grid-cols-[320px_1fr] gap-8">
            {/* Skeleton da Sidebar */}
            <div className="space-y-6">
                <div className="flex flex-col items-center"><Skeleton className="h-20 w-20 rounded-full" /><Skeleton className="h-6 w-32 mt-4" /><Skeleton className="h-4 w-40 mt-2" /></div>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-12 w-full" />
                <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
            </div>
            {/* Skeleton do Formulário */}
            <div className="space-y-6"><Skeleton className="h-12 w-1/2" /><Skeleton className="h-64 w-full" /></div>
      </div>
    );
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="grid md:grid-cols-[320px_1fr] gap-8 items-start">
      {/* Coluna da Esquerda com as informações do cliente */}
      <aside className="sticky top-6">
        <ClientProfileSidebar client={clientData} />
      </aside>

      {/* Coluna da Direita com o formulário de edição */}
      <main>
        <Card>
          <CardHeader>
            <CardTitle>Editar Dados Principais</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientForm onSuccess={handleSuccess} initialData={clientData} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EditClient;