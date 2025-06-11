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
  RefreshCw
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MyAccountForm } from '@/components/settings/MyAccountForm';
import { GroupSettingsForm } from '@/components/settings/GroupSettingsForm';
import { AgendaSettingsForm } from '@/components/settings/AgendaSettingsForm';
import { useAuth } from '../contexts/AuthContext';

type SettingItem = {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: () => void;
  id: string;
};

const Settings: React.FC = () => {
  const [isMyAccountOpen, setIsMyAccountOpen] = useState(false);
  const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false);
  const [isAgendaSettingsModalOpen, setIsAgendaSettingsModalOpen] = useState(false);
  const [isSignOutAlertOpen, setIsSignOutAlertOpen] = useState(false);
  const [isUpdateAlertOpen, setIsUpdateAlertOpen] = useState(false);
  const navigate = useNavigate();

  const { signOutFromAllDevices, forceAppUpdate } = useAuth();

  const handleSignOutAllClick = async () => {
    await signOutFromAllDevices();
    setIsSignOutAlertOpen(false);
  };

  const handleForceUpdateClick = async () => {
    await forceAppUpdate();
    setIsUpdateAlertOpen(false);
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
    },
    {
      id: 'subscription',
      icon: CreditCard,
      title: 'Minha Assinatura',
      description: 'Gerencie seu plano, faturas e método de pagamento.',
    },
    {
      id: 'reset-password',
      icon: Lock,
      title: 'Redefinir senha',
      description: 'Altere sua senha de acesso para manter sua conta segura.',
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
    </>
  );
};

export default Settings;