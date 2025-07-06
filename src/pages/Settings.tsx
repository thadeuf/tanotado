// src/pages/Settings.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import {
  User,
  Users,
  Calendar,
  MessageSquare,
  FileText,
  CreditCard,
  Lock,
  LogOut,
  ChevronRight,
  RefreshCw,
  Download,
  // Ícone para a nova integração, pode ser qualquer um da lucide-react
  HeartPulse 
} from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MyAccountForm } from '@/components/settings/MyAccountForm';
import { GroupSettingsForm } from '@/components/settings/GroupSettingsForm';
import { AgendaSettingsForm } from '@/components/settings/AgendaSettingsForm';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ResetPasswordForm } from '@/components/settings/ResetPasswordForm'; 
import { Button } from '@/components/ui/button';

type SettingItem = {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  action?: () => void;
};

const Settings: React.FC = () => {
  const [isMyAccountOpen, setIsMyAccountOpen] = useState(false);
  const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false);
  const [isAgendaSettingsModalOpen, setIsAgendaSettingsModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false); 
  const [isSignOutAlertOpen, setIsSignOutAlertOpen] = useState(false);
  const [isUpdateAlertOpen, setIsUpdateAlertOpen] = useState(false);
  const [isExportOptionsModalOpen, setIsExportOptionsModalOpen] = useState(false); // New state for export options modal
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();

  const { user, signOutFromAllDevices, forceAppUpdate } = useAuth();

  const handleSignOutAllClick = async () => {
    await signOutFromAllDevices();
    setIsSignOutAlertOpen(false);
  };

  const handleForceUpdateClick = async () => {
    await forceAppUpdate();
    setIsUpdateAlertOpen(false);
  };

  // Helper function to extract text from a TipTap/ProseMirror-like JSON structure
  const extractTextFromContent = (content: any): string => {
    if (!content) return '';
    if (Array.isArray(content)) {
      return content.map(extractTextFromContent).join('\n');
    }
    if (typeof content === 'object') {
      if (content.type === 'text' && typeof content.text === 'string') {
        return content.text;
      }
      if (content.content) {
        return extractTextFromContent(content.content);
      }
    }
    return '';
  };
  
  const exportPatientsToXLSX = async () => {
    setIsExporting(true);
    setIsExportOptionsModalOpen(false);
    toast({
      title: "Iniciando exportação de pacientes...",
      description: "Aguarde enquanto preparamos a listagem de pacientes.",
    });

    try {
      const { data: clients, error } = await supabase
        .from('clients')
        .select(`
          name, email, whatsapp, cpf, birth_date, address, notes,
          rg, cep, address_number, address_neighborhood, address_city,
          address_state, address_complement, session_value,
          financial_responsible_name, financial_responsible_whatsapp,
          financial_responsible_email, financial_responsible_cpf,
          financial_responsible_rg, emergency_contact_name,
          emergency_contact_whatsapp, gender, nationality, education,
          occupation, forwarding, marital_status
        `)
        .eq('user_id', user?.id)
        .order('name', { ascending: true });

      if (error) throw error;

      const formattedData = clients.map(client => ({
        "Nome": client.name || '-',
        "Email": client.email || '-',
        "WhatsApp": client.whatsapp || '-',
        "CPF": client.cpf || '-',
        "Data de Nascimento": client.birth_date ? format(new Date(client.birth_date), 'dd/MM/yyyy') : '-',
        "Endereço": client.address || '-',
        "Observações": client.notes || '-',
        "RG": client.rg || '-',
        "CEP": client.cep || '-',
        "Número do Endereço": client.address_number || '-',
        "Bairro": client.address_neighborhood || '-',
        "Cidade": client.address_city || '-',
        "Estado": client.address_state || '-',
        "Complemento do Endereço": client.address_complement || '-',
        "Valor da Sessão": client.session_value || '-',
        "Nome do Responsável Financeiro": client.financial_responsible_name || '-',
        "WhatsApp do Responsável Financeiro": client.financial_responsible_whatsapp || '-',
        "Email do Responsável Financeiro": client.financial_responsible_email || '-',
        "CPF do Responsável Financeiro": client.financial_responsible_cpf || '-',
        "RG do Responsável Financeiro": client.financial_responsible_rg || '-',
        "Nome do Contato de Emergência": client.emergency_contact_name || '-',
        "WhatsApp do Contato de Emergência": client.emergency_contact_whatsapp || '-',
        "Gênero": client.gender || '-',
        "Nacionalidade": client.nationality || '-',
        "Escolaridade": client.education || '-',
        "Ocupação": client.occupation || '-',
        "Encaminhamento": client.forwarding || '-',
        "Estado Civil": client.marital_status || '-',
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Pacientes');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, 'pacientes_tanotado.xlsx');

      toast({
        title: "Exportação de pacientes concluída!",
        description: "A listagem de pacientes foi baixada com sucesso.",
      });

    } catch (error: any) {
      console.error("Erro na exportação de pacientes:", error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível gerar o arquivo de pacientes. Tente novamente mais tarde ou contate o suporte.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportSessionNotesToXLSX = async () => {
    setIsExporting(true);
    setIsExportOptionsModalOpen(false);
    toast({
      title: "Iniciando exportação de anotações...",
      description: "Aguarde enquanto preparamos suas anotações de sessão.",
    });

    try {
      const { data: sessionNotes, error: notesError } = await supabase
        .from('session_notes')
        .select(`
          created_at,
          content,
          clients (
            name
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      const formattedData = sessionNotes.map(note => ({
        "Nome do Paciente": note.clients?.name || 'Paciente Desconhecido',
        "Data da Sessão": note.created_at ? format(new Date(note.created_at), 'dd/MM/yyyy HH:mm') : '-',
        "Anotações": extractTextFromContent(note.content),
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Anotacoes_Sessoes');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, 'anotacoes_sessoes_tanotado.xlsx');

      toast({
        title: "Exportação de anotações concluída!",
        description: "As anotações de sessão foram baixadas com sucesso.",
      });

    } catch (error: any) {
      console.error("Erro na exportação de anotações:", error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível gerar o arquivo de anotações. Tente novamente mais tarde ou contate o suporte.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Função para verificar se a especialidade do usuário é da área de saúde
  const isHealthProfessional = () => {
    if (!user?.specialty) return false;
    const healthSpecialties = [
      'psicologo', 
      'medico', 
      'dentista', 
      'nutricionista', 
      'fisioterapeuta', 
      'fonoaudiologo', 
      'otorrino'
    ];
    // Compara a especialidade em minúsculas para garantir a correspondência
    return healthSpecialties.includes(user.specialty.toLowerCase());
  };


  const settingsList: SettingItem[] = [
    {
      id: 'my-account',
      icon: User,
      title: 'Minha Conta',
      description: 'Edite suas informações pessoais, de perfil e preferências.',
      action: () => setIsMyAccountOpen(true),
    },
    {
      id: 'group-settings',
      icon: Users,
      title: 'Configurações de Grupos',
      description: 'Gerencie os grupos de clientes e suas nomenclaturas personalizadas.',
      action: () => setIsGroupsModalOpen(true),
    },
    {
      id: 'agenda-settings',
      icon: Calendar,
      title: 'Configurações da Agenda',
      description: 'Personalize horários, durações e bloqueios da sua agenda.',
      action: () => setIsAgendaSettingsModalOpen(true),
    },
    {
      id: 'message-settings',
      icon: MessageSquare,
      title: 'Configurações de Mensagens',
      description: 'Configure lembretes e mensagens automáticas para seus clientes.',
      action: () => navigate('/configuracoes/mensagens'),
    },
    {
      id: 'document-templates',
      icon: FileText,
      title: 'Modelos de Documentos',
      description: 'Crie e gerencie modelos de prontuários, contratos e recibos.',
      action: () => navigate('/configuracoes/modelos'), 
    },
    {
      id: 'subscription',
      icon: CreditCard,
      title: 'Minha Assinatura',
      description: 'Gerencie seu plano, faturas e método de pagamento.',
      action: () => navigate('/assinatura'),
    },
    {
      id: 'export-all-data',
      icon: Download,
      title: 'Exportar todos os dados',
      description: 'Baixe uma planilha com seus pacientes e anotações de sessões.',
      action: () => setIsExportOptionsModalOpen(true),
    },
    // Inserção condicional do novo item de menu
    ...(isHealthProfessional() ? [{
      id: 'integracao-receita-saude',
      icon: HeartPulse, // Ícone para a nova seção
      title: 'Integração Receita Saúde',
      description: 'Conecte sua conta para integrar com o Carnê Leão da Receita.',
      action: () => navigate('/configuracoes/integracao-receita-saude'),
    }] : []),
    {
      id: 'reset-password',
      icon: Lock,
      title: 'Redefinir senha',
      description: 'Altere sua senha de acesso para manter sua conta segura.',
      action: () => setIsResetPasswordModalOpen(true),
    },
    {
      id: 'logout-all',
      icon: LogOut,
      title: 'Sair em todos os dispositivos',
      description: 'Desconecte sua conta de todos os outros computadores e celulares.',
      action: () => setIsSignOutAlertOpen(true),
    },
    {
      id: 'update-app',
      icon: RefreshCw,
      title: 'Atualizar App',
      description: 'Verifique se há uma nova versão do aplicativo disponível.',
      action: () => setIsUpdateAlertOpen(true),
    }
  ];

  const renderSettingItem = (item: SettingItem) => (
    <button
      key={item.id}
      className="flex items-center w-full p-4 text-left hover:bg-muted/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={item.action}
      disabled={!item.action}
    >
      <item.icon className="h-6 w-6 mr-4 text-tanotado-blue flex-shrink-0" />
      <div className="flex-grow">
        <p className="font-semibold text-foreground">{item.title}</p>
        <p className="text-sm text-muted-foreground">{item.description}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground ml-4" />
    </button>
  );

  return (
    <>
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-tanotado-navy">Configurações</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas preferências e personalize a plataforma para o seu jeito de trabalhar.
          </p>
        </div>
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {settingsList.map(renderSettingItem)}
          </CardContent>
        </Card>
      </div>

      {/* Modal Minha Conta */}
      <Dialog open={isMyAccountOpen} onOpenChange={setIsMyAccountOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Informações básicas</DialogTitle>
            <DialogDescription>
                Atualize seus dados pessoais, de contato e endereço.
            </DialogDescription>
          </DialogHeader>
          <MyAccountForm onSuccess={() => setIsMyAccountOpen(false)} />
        </DialogContent>
      </Dialog>
      
      {/* Modal Configurações de Grupos */}
      <Dialog open={isGroupsModalOpen} onOpenChange={setIsGroupsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">Gerenciar Grupos de Clientes</DialogTitle>
            <DialogDescription>
              Adicione, edite ou remova os grupos para categorizar seus clientes.
            </DialogDescription>
          </DialogHeader>
          <GroupSettingsForm onSuccess={() => setIsGroupsModalOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Modal Configurações da Agenda */}
      <Dialog open={isAgendaSettingsModalOpen} onOpenChange={setIsAgendaSettingsModalOpen}>
        <DialogContent className="sm:max-w-lg h-[90vh] flex flex-col">
          <AgendaSettingsForm onSuccess={() => setIsAgendaSettingsModalOpen(false)} />
        </DialogContent>
      </Dialog>
      
      {/* Modal Redefinir Senha */}
      <Dialog open={isResetPasswordModalOpen} onOpenChange={setIsResetPasswordModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Redefinir Senha</DialogTitle>
            <DialogDescription>
              Crie uma nova senha forte e segura para sua conta.
            </DialogDescription>
          </DialogHeader>
          <ResetPasswordForm onSuccess={() => setIsResetPasswordModalOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* AlertDialog para Sair de Todos os Dispositivos */}
      <AlertDialog open={isSignOutAlertOpen} onOpenChange={setIsSignOutAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação desconectará sua conta de todos os dispositivos, incluindo este. Você precisará fazer login novamente em todos eles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOutAllClick} className="bg-destructive hover:bg-destructive/90">
              Confirmar e Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog para Atualizar o App */}
      <AlertDialog open={isUpdateAlertOpen} onOpenChange={setIsUpdateAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atualizar Aplicativo?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso limpará o cache local e recarregará a página para garantir que você esteja usando a versão mais recente do tanotado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleForceUpdateClick}>
              Atualizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal para Opções de Exportação */}
      <Dialog open={isExportOptionsModalOpen} onOpenChange={setIsExportOptionsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Opções de Exportação</DialogTitle>
            <DialogDescription>
              Escolha qual tipo de dado você gostaria de exportar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button 
              onClick={exportPatientsToXLSX} 
              disabled={isExporting} 
              className="w-full"
            >
              Exportar dados de todos os pacientes
            </Button>
            <Button 
              onClick={exportSessionNotesToXLSX} 
              disabled={isExporting} 
              className="w-full"
            >
              Exportar Anotações de Sessão
            </Button>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsExportOptionsModalOpen(false)} 
              disabled={isExporting}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Settings;
