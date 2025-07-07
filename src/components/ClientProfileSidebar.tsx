// src/components/ClientProfileSidebar.tsx
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar, CheckCircle, XCircle, User, FileText, MessageSquare, DollarSign, Bell, Paperclip, Download, FileSignature,
} from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { cn } from '@/lib/utils';

type ClientData = {
  id: string;
  name: string;
  whatsapp?: string | null;
  email?: string | null;
  birth_date?: string | null;
  avatar_url?: string | null;
  cpf?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  address?: string | null;
  address_neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  session_value?: number | null;
  total_sessions?: number;
  attended_sessions?: number;
  missed_sessions?: number;
  total_due?: number;
};

interface ClientProfileSidebarProps {
  client: ClientData | null;
  activeView: string;
  onViewChange: (view: string) => void;
  onGenerateDocument: () => void;
}

const getInitials = (name: string) => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

const formatBirthDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    const dateParts = dateString.split('-').map(part => parseInt(part, 10));
    const localDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    return format(localDate, 'dd/MM/yyyy');
}

export const ClientProfileSidebar: React.FC<ClientProfileSidebarProps> = ({ client, activeView, onViewChange, onGenerateDocument }) => {
  const { user } = useAuth();

  if (!client) return null;
  
  const appointmentLabel = user?.appointment_label || 'Agendamento';
  // --- ✅ NOVA ALTERAÇÃO AQUI ---
  const prontuarioLabel = user?.specialty_label || 'Prontuário';

  const menuItems = [
    { id: 'dados', label: 'Dados principais', icon: User },
    // --- ✅ 'label' ATUALIZADO ---
    { id: 'prontuario', label: prontuarioLabel, icon: FileText },
    { id: 'agendamentos', label: `${appointmentLabel}`, icon: Calendar },
    { id: 'anotacoes', label: 'Anotações da Sessão', icon: MessageSquare },
    { id: 'generate-doc', label: 'Criar Documento', icon: FileSignature },
    { id: 'documentos', label: 'Documentos Salvos', icon: Paperclip },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
  ];

  const handleExport = () => {
    if (!client) return;
    const data = {
      Nome: client.name,
      WhatsApp: client.whatsapp || '-',
      Email: client.email || '-',
      'Data de Nascimento': formatBirthDate(client.birth_date),
      CPF: client.cpf || '-',
      Sexo: client.gender || '-',
      'Estado Civil': client.marital_status || '-',
      Endereço: client.address || '-',
      Bairro: client.address_neighborhood || '-',
      Cidade: client.city || '-',
      Estado: client.state || '-',
      'Valor da Sessão': client.session_value ? `R$ ${client.session_value.toFixed(2)}` : '-',
      'Total de Sessões': client.total_sessions || 0,
      'Sessões Atendidas': client.attended_sessions || 0,
      'Faltas': client.missed_sessions || 0,
      'Total Vencidos (R$)': client.total_due || 0,
    };
    const worksheet = XLSX.utils.json_to_sheet([data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cliente');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `${client.name.replace(/\s+/g, '_')}_dados.xlsx`);
  };
  
  const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 12) return phone;
    const country = cleaned.slice(0, 2);
    const ddd = cleaned.slice(2, 4);
    const first = cleaned.slice(4, 9);
    const second = cleaned.slice(9, 13);
    return `+${country} (${ddd}) ${first}-${second}`;
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-col items-center text-center">
        <Avatar className="w-20 h-20 mb-4 border-2 border-primary">
          <AvatarImage src={client.avatar_url || undefined} />
          <AvatarFallback className="text-2xl bg-muted">{getInitials(client.name)}</AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-bold text-foreground">{client.name}</h2>
        <p className="text-sm text-muted-foreground">{formatPhoneNumber(client.whatsapp)}</p>
        <p className="text-sm text-muted-foreground">{client.email || '-'}</p>
        {client.birth_date && (
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {formatBirthDate(client.birth_date)}
          </p>
        )}
      </div>

      <Card>
        <CardContent className="p-4 flex justify-around">
          <div className="text-center">
            <Calendar className="mx-auto h-6 w-6 text-primary mb-1" />
            <p className="text-xl font-bold">{client.total_sessions || 0}</p>
            <p className="text-xs text-muted-foreground">Sessões</p>
          </div>
          <div className="text-center">
            <CheckCircle className="mx-auto h-6 w-6 text-green-500 mb-1" />
            <p className="text-xl font-bold">{client.attended_sessions || 0}</p>
            <p className="text-xs text-muted-foreground">Atendidas</p>
          </div>
          <div className="text-center">
            <XCircle className="mx-auto h-6 w-6 text-red-500 mb-1" />
            <p className="text-xl font-bold">{client.missed_sessions || 0}</p>
            <p className="text-xs text-muted-foreground">Faltas</p>
          </div>
        </CardContent>
      </Card>

      <div className="bg-primary/10 p-3 rounded-lg flex justify-between items-center">
        <span className="text-sm font-medium text-primary">Total vencidos:</span>
        <span className="text-lg font-bold text-primary">R$ {(client.total_due || 0).toFixed(2)}</span>
      </div>

      <div className="flex flex-col gap-1">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={activeView === item.id ? "secondary" : "ghost"}
            className="justify-start gap-3 px-3"
            onClick={() => {
              if (item.id === 'generate-doc') {
                onGenerateDocument();
              } else {
                onViewChange(item.id);
              }
            }}
          >
            <item.icon className={cn(
                "h-4 w-4", 
                activeView === item.id ? "text-primary" : "text-muted-foreground",
                item.id === 'generate-doc' && 'text-tanotado-blue'
            )} />
            <span>{item.label}</span>
          </Button>
        ))}
      </div>

      <div className="mt-auto">
        <Button variant="outline" className="w-full gap-2" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </div>
    </div>
  );
};