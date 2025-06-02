
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Clock, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const QuickActions: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-tanotado-navy">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <button className="p-4 rounded-lg border-2 border-dashed border-tanotado-pink/30 hover:border-tanotado-pink hover:bg-tanotado-pink/5 transition-all text-center">
            <Calendar className="h-8 w-8 text-tanotado-pink mx-auto mb-2" />
            <span className="text-sm font-medium text-tanotado-pink">Novo Agendamento</span>
          </button>
          <button 
            onClick={() => navigate('/clientes/novo')}
            className="p-4 rounded-lg border-2 border-dashed border-tanotado-blue/30 hover:border-tanotado-blue hover:bg-tanotado-blue/5 transition-all text-center"
          >
            <Users className="h-8 w-8 text-tanotado-blue mx-auto mb-2" />
            <span className="text-sm font-medium text-tanotado-blue">Novo {user?.clientNomenclature || 'Cliente'}</span>
          </button>
          <button className="p-4 rounded-lg border-2 border-dashed border-tanotado-green/30 hover:border-tanotado-green hover:bg-tanotado-green/5 transition-all text-center">
            <FileText className="h-8 w-8 text-tanotado-green mx-auto mb-2" />
            <span className="text-sm font-medium text-tanotado-green">Novo Prontuário</span>
          </button>
          <button className="p-4 rounded-lg border-2 border-dashed border-tanotado-purple/30 hover:border-tanotado-purple hover:bg-tanotado-purple/5 transition-all text-center">
            <Clock className="h-8 w-8 text-tanotado-purple mx-auto mb-2" />
            <span className="text-sm font-medium text-tanotado-purple">Relatórios</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
