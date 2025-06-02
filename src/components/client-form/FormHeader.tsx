
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const FormHeader: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/clientes')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-tanotado-navy">
            Novo {user?.clientNomenclature || 'Cliente'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Preencha as informações do novo {user?.clientNomenclature?.toLowerCase() || 'cliente'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FormHeader;
