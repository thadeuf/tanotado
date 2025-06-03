
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';

interface ClientStatsCardProps {
  totalSessions: number;
  attendedSessions: number;
  missedSessions: number;
  totalRevenue: number;
}

const ClientStatsCard: React.FC<ClientStatsCardProps> = ({
  totalSessions,
  attendedSessions,
  missedSessions,
  totalRevenue
}) => {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="grid grid-cols-3 gap-6 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-2 mx-auto">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-sm text-muted-foreground">Sessões</div>
            <div className="text-2xl font-bold">{totalSessions}</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-2 mx-auto">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-sm text-muted-foreground">Atendidas</div>
            <div className="text-2xl font-bold">{attendedSessions}</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mb-2 mx-auto">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="text-sm text-muted-foreground">Faltas</div>
            <div className="text-2xl font-bold">{missedSessions}</div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm text-purple-600 font-medium">Total vencidos:</div>
          <div className="text-xl font-bold text-purple-700">
            R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientStatsCard;
