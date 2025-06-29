// src/pages/IntegracaoReceitaSaude.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { 
    Loader2, 
    Upload, 
    CheckCircle, 
    FileSearch, 
    Pointer, 
    Edit, 
    FileDown, 
    LogIn, 
    FileSignature, 
    KeyRound, 
    Send,
    FileCheck
} from 'lucide-react';

const IntegracaoReceitaSaude: React.FC = () => {
  const { user, refetchUser } = useAuth();
  const [isIntegrationEnabled, setIsIntegrationEnabled] = useState(false);
  const [procuracaoUrl, setProcuracaoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingSwitch, setIsSavingSwitch] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false); // Estado para controlar o drag-over

  const instructionSteps = [
    { text: 'Acesse o portal e-CAC', icon: LogIn, href: 'https://cav.receita.fazenda.gov.br/autenticacao/login' },
    { text: 'Clique em "Senhas e procurações"', icon: KeyRound },
    { text: 'Depois em "Cadastros, consultas e cancelamentos — Procuração para e-CAC"', icon: FileSearch },
    { text: 'Agora em "Cadastrar procuração"', icon: Edit },
    { text: 'Insira o CNPJ 12.113.578/0001-33 da Artideia (a razão social do tanotado) nos dados de outorgante', icon: Send },
    { text: 'Selecione "IRPF - Carnê Leão Web"', icon: Pointer },
    { text: 'Assine a procuração', icon: FileSignature },
    { text: 'Refaça até o passo 3 e depois clique em "Consultar por outorgante"', icon: FileSearch },
    { text: 'Baixe o arquivo da procuração assinada e anexe aqui', icon: FileDown },
  ];

  useEffect(() => {
    if (user) {
      setIsIntegrationEnabled(user.receita_saude_enabled || false);
      setProcuracaoUrl(user.procuracao_receita_saude_url || null);
    }
  }, [user]);

  const processFile = async (file: File) => {
    if (!user) return;

    if (file.type !== 'application/pdf') {
      toast({ title: 'Erro', description: 'Por favor, envie um arquivo no formato PDF.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    const fileName = `procuracoes-receita-saude/${user.id}/procuracao.pdf`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ procuracao_receita_saude_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProcuracaoUrl(publicUrl);
      await refetchUser();
      toast({ title: 'Sucesso!', description: 'Procuração enviada.' });
    } catch (error: any) {
      toast({ title: 'Erro no Upload', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  // Funções para o Drag and Drop
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) processFile(file);
  };
  
  const handleToggleIntegration = async (enabled: boolean) => {
    if (!user) return;

    setIsSavingSwitch(true);
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ receita_saude_enabled: enabled })
            .eq('id', user.id);
        
        if (error) throw error;
        
        setIsIntegrationEnabled(enabled);
        await refetchUser();
        toast({ title: `Integração ${enabled ? 'ativada' : 'desativada'} com sucesso!` });
    } catch (error: any) {
        toast({ title: 'Erro ao salvar configuração', description: error.message, variant: 'destructive' });
    } finally {
        setIsSavingSwitch(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-tanotado-navy">Integração Receita Saúde</h1>
        <p className="text-muted-foreground mt-2">Conecte sua conta para automação do Carnê Leão.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vídeo Explicativo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Seu vídeo aqui</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuração da Integração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label htmlFor="integration-switch" className="flex flex-col space-y-1">
                  <span className="font-medium">Ativar integração com Receita Saúde</span>
                  <span className="text-xs text-muted-foreground">
                    Permite a comunicação com o Carnê Leão Web.
                  </span>
                </Label>
                <Switch
                  id="integration-switch"
                  checked={isIntegrationEnabled}
                  onCheckedChange={handleToggleIntegration}
                  disabled={!procuracaoUrl || isSavingSwitch}
                />
              </div>
              {!procuracaoUrl && (
                  <p className="text-sm text-center text-destructive p-3 bg-destructive/10 rounded-lg">
                    É obrigatório fazer o upload da procuração em PDF para ativar a integração.
                  </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Para conectar a sua conta 👇</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <div className="space-y-3">
                {instructionSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <step.icon className="h-5 w-5 mt-1 text-tanotado-purple flex-shrink-0" />
                    <span>
                      {step.href ? (
                        <a href={step.href} target="_blank" rel="noopener noreferrer" className="text-tanotado-blue underline hover:text-tanotado-blue/80">
                          {step.text}
                        </a>
                      ) : (
                        step.text
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle>Anexar Procuração Digital</CardTitle>
                <CardDescription>Envie o arquivo PDF da procuração assinada.</CardDescription>
            </CardHeader>
            <CardContent>
                {procuracaoUrl ? (
                    <div className="p-4 border-dashed border-green-500 bg-green-50 rounded-lg text-center space-y-2">
                        <CheckCircle className="h-10 w-10 text-green-600 mx-auto"/>
                        <p className="font-medium text-green-700">Procuração enviada com sucesso!</p>
                        <a href={procuracaoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-tanotado-blue underline mt-1">Visualizar arquivo</a>
                         <Button variant="link" className="text-xs text-muted-foreground" onClick={() => document.getElementById('procuracao-pdf-replace')?.click()}>
                          Trocar arquivo
                        </Button>
                        <input id="procuracao-pdf-replace" type="file" accept=".pdf" onChange={handleFileChange} disabled={isUploading} className="hidden"/>
                    </div>
                ) : (
                    <div 
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={cn(
                            "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200",
                            isDragOver ? "border-tanotado-purple bg-tanotado-purple/10" : "border-muted-foreground/30 hover:border-tanotado-purple"
                        )}
                    >
                        <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                            <Upload className="h-8 w-8" />
                            <p className="font-medium">
                                <span className="text-tanotado-purple">Clique para enviar</span> ou arraste e solte o arquivo
                            </p>
                            <p className="text-xs">Apenas arquivos PDF são permitidos</p>
                        </div>
                        <input id="procuracao-pdf-initial" type="file" accept=".pdf" onChange={handleFileChange} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                        {isUploading && (
                            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
                                <Loader2 className="mr-2 h-6 w-6 animate-spin text-tanotado-purple"/>
                                <p className="mt-2 text-sm font-medium">Enviando...</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IntegracaoReceitaSaude;