import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar, CheckCircle, XCircle, User, FileText, MessageSquare, ClipboardList, DollarSign, Bell, Paperclip, Download,
} from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { cn } from '@/lib/utils'; // Importar cn para classes condicionais

// Tipos da Ficha do Cliente (ajustados para refletir a estrutura completa)
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
  neighborhood?: string | null; // Corrigido de 'address_neighborhood' para 'neighborhood'
  city?: string | null; // Corrigido
  state?: string | null; // Corrigido
  session_value?: number | null;
  // Simulação de dados que viriam de outras tabelas
  total_sessions?: number;
  attended_sessions?: number;
  missed_sessions?: number;
  total_due?: number;
};

// Props do componente, agora recebendo a view ativa e a função para trocá-la
interface ClientProfileSidebarProps {
  client: ClientData | null;
  activeView: string;
  onViewChange: (view: string) => void;
}

const getInitials = (name: string) => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

export const ClientProfileSidebar: React.FC<ClientProfileSidebarProps> = ({ client, activeView, onViewChange }) => {
  if (!client) return null; // Retorna nulo se não houver cliente

  // Cada item do menu agora tem um 'id' para identificar a view
  const menuItems = [
    { id: 'dados', label: 'Dados principais', icon: User },
    { id: 'prontuario', label: 'Prontuário', icon: FileText },
    { id: 'anotacoes', label: 'Anotações da Sessão', icon: MessageSquare },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
    { id: 'cobrancas', label: 'Cobranças', icon: Bell },
    { id: 'documentos', label: 'Documentos', icon: Paperclip },
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
      {/* Bloco de Informações do Cliente */}
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
            {format(new Date(client.birth_date), 'dd/MM/yyyy')}
          </p>
        )}
      </div>

      {/* Bloco de Estatísticas (Simulado) */}
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

      {/* Bloco Financeiro (Simulado) */}
      <div className="bg-primary/10 p-3 rounded-lg flex justify-between items-center">
        <span className="text-sm font-medium text-primary">Total vencidos:</span>
        <span className="text-lg font-bold text-primary">R$ {(client.total_due || 0).toFixed(2)}</span>
      </div>

      {/* Menu de Ações Interativo */}
      <div className="flex flex-col gap-1">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={activeView === item.id ? "secondary" : "ghost"} // Estilo diferente para o item ativo
            className="justify-start gap-3 px-3"
            onClick={() => onViewChange(item.id)} // Chama a função para trocar a view
          >
            <item.icon className={cn("h-4 w-4", activeView === item.id ? "text-primary" : "text-muted-foreground")} />
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