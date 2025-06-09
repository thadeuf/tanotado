import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  CheckCircle,
  XCircle,
  User,
  FileText,
  MessageSquare,
  ClipboardList,
  DollarSign,
  Bell,
  File,
  Paperclip,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

type ClientData = {
  name: string;
  whatsapp?: string | null;
  email?: string | null;
  birth_date?: Date | null;
  avatar_url?: string | null;
};

interface ClientProfileSidebarProps {
  client: ClientData | null;
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

export const ClientProfileSidebar: React.FC<ClientProfileSidebarProps> = ({ client }) => {
  if (!client) return null;

  const menuItems = [
    { label: 'Dados principais', icon: User },
    { label: 'Prontuário', icon: FileText },
    { label: 'Anamnese', icon: ClipboardList },
    { label: 'Anotações da Sessão', icon: MessageSquare },
    { label: 'Financeiro', icon: DollarSign },
    { label: 'Cobranças', icon: Bell },
    { label: 'Documentos', icon: File },
    { label: 'Arquivos', icon: Paperclip },
  ];

  const handleExport = () => {
  if (!client) return;

  const data = {
    Nome: client.name,
    WhatsApp: client.whatsapp || '-',
    Email: client.email || '-',
    'Data de Nascimento': client.birth_date ? format(new Date(client.birth_date), 'dd/MM/yyyy') : '-',
    CPF: client.cpf || '-',
    Sexo: client.gender || '-',
    'Estado Civil': client.marital_status || '-',
    Endereço: client.address || '-',
    Bairro: client.neighborhood || '-',
    Cidade: client.city || '-',
    Estado: client.state || '-',
    'Valor da Sessão': client.session_value ? `R$ ${client.session_value.toFixed(2)}` : '-',
    'Total de Sessões': client.total_sessions || '-',
    'Sessões Atendidas': client.attended_sessions || '-',
    'Faltas': client.missed_sessions || '-',
    'Total Vencidos (R$)': client.total_due || '-',
  };

  const worksheet = XLSX.utils.json_to_sheet([data]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cliente');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

  saveAs(blob, `${client.name.replace(/\s+/g, '_')}_dados.xlsx`);
};

const formatPhoneNumber = (phone: string) => {
  const cleaned = phone.replace(/\D/g, ''); // remove tudo que não for número

  if (cleaned.length < 12) return phone; // retorna como veio se for inválido

  const country = cleaned.slice(0, 2);
  const ddd = cleaned.slice(2, 4);
  const first = cleaned.slice(4, 9);
  const second = cleaned.slice(9, 13);

  return `+${country} (${ddd}) ${first}-${second}`;
};


  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Bloco de Informações do Cliente */}
      <div className="flex flex-col items-center text-center">
        <Avatar className="w-20 h-20 mb-4 border-2 border-primary">
          <AvatarImage src={client.avatar_url || undefined} />
          <AvatarFallback className="text-2xl bg-muted">{getInitials(client.name)}</AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-bold text-foreground">{client.name}</h2>
        <p className="text-sm text-muted-foreground">{client.whatsapp ? formatPhoneNumber(client.whatsapp) : '-'}</p>
        <p className="text-sm text-muted-foreground">{client.email || '-'}</p>
        {client.birth_date && (
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {format(new Date(client.birth_date), 'dd/MM/yyyy')}
          </p>
        )}
      </div>

      {/* Bloco de Estatísticas */}
      <Card>
        <CardContent className="p-4 flex justify-around">
          <div className="text-center">
            <Calendar className="mx-auto h-6 w-6 text-primary mb-1" />
            <p className="text-xl font-bold">20</p>
            <p className="text-xs text-muted-foreground">Sessões</p>
          </div>
          <div className="text-center">
            <CheckCircle className="mx-auto h-6 w-6 text-green-500 mb-1" />
            <p className="text-xl font-bold">2</p>
            <p className="text-xs text-muted-foreground">Atendidas</p>
          </div>
          <div className="text-center">
            <XCircle className="mx-auto h-6 w-6 text-red-500 mb-1" />
            <p className="text-xl font-bold">2</p>
            <p className="text-xs text-muted-foreground">Faltas</p>
          </div>
        </CardContent>
      </Card>

      {/* Bloco Financeiro */}
      <div className="bg-primary/10 p-3 rounded-lg flex justify-between items-center">
        <span className="text-sm font-medium text-primary">Total vencidos:</span>
        <span className="text-lg font-bold text-primary">R$ 1.300,00</span>
      </div>

      {/* Menu de Ações */}
      <div className="flex flex-col gap-1">
        {menuItems.map((item) => (
          <Button key={item.label} variant="ghost" className="justify-start gap-3 px-3">
            <item.icon className="h-4 w-4 text-muted-foreground" />
            <span>{item.label}</span>
          </Button>
        ))}
      </div>

      {/* Botão de Exportar */}
      <div className="mt-auto">
        <Button variant="outline" className="w-full gap-2" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </div>
    </div>
  );
};
