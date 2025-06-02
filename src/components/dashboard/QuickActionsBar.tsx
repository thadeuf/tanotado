
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Clock, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const QuickActionsBar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Novo Agendamento',
      icon: Calendar,
      color: 'bg-tanotado-pink hover:bg-tanotado-pink/90',
      onClick: () => console.log('Novo agendamento')
    },
    {
      label: `Novo ${user?.clientNomenclature || 'Cliente'}`,
      icon: Users,
      color: 'bg-tanotado-blue hover:bg-tanotado-blue/90',
      onClick: () => navigate('/clientes/novo')
    },
    {
      label: 'Novo Prontuário',
      icon: FileText,
      color: 'bg-tanotado-green hover:bg-tanotado-green/90',
      onClick: () => console.log('Novo prontuário')
    },
    {
      label: 'Relatórios',
      icon: Clock,
      color: 'bg-tanotado-purple hover:bg-tanotado-purple/90',
      onClick: () => console.log('Relatórios')
    }
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action, index) => (
        <Button
          key={index}
          onClick={action.onClick}
          className={`${action.color} text-white flex items-center gap-2 px-4 py-2 h-10`}
        >
          <action.icon className="h-4 w-4" />
          <span className="text-sm font-medium">{action.label}</span>
        </Button>
      ))}
    </div>
  );
};

export default QuickActionsBar;
