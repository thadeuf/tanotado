
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  User, 
  FileText, 
  PenTool, 
  DollarSign,
  ChevronRight 
} from 'lucide-react';

interface ClientOptionsMenuProps {
  clientId: string;
  onViewRecords: () => void;
  onViewNotes: () => void;
  onViewFinancial: () => void;
}

const ClientOptionsMenu: React.FC<ClientOptionsMenuProps> = ({
  clientId,
  onViewRecords,
  onViewNotes,
  onViewFinancial
}) => {
  const menuItems = [
    {
      icon: User,
      label: 'Dados principais',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      onClick: () => {
        // Scroll para o topo do formulário
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    {
      icon: FileText,
      label: 'Prontuário',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      onClick: onViewRecords
    },
    {
      icon: PenTool,
      label: 'Anotações da Sessão',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      onClick: onViewNotes
    },
    {
      icon: DollarSign,
      label: 'Financeiro',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      onClick: onViewFinancial
    }
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              onClick={item.onClick}
              className="w-full justify-between h-12 px-4 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.bgColor}`}>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <span className="font-medium">{item.label}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientOptionsMenu;
