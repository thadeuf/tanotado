
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const FormActions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex justify-end gap-4">
      <Button 
        type="button" 
        variant="outline" 
        onClick={() => navigate('/clientes')}
      >
        Cancelar
      </Button>
      <Button 
        type="submit"
        className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple hover:shadow-lg transition-all duration-200"
      >
        Cadastrar {user?.clientNomenclature || 'Cliente'}
      </Button>
    </div>
  );
};

export default FormActions;
