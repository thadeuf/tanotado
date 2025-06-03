
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '../../contexts/AuthContext';

const SubscriptionBanner: React.FC = () => {
  const { user } = useAuth();

  if (user?.subscriptionStatus !== 'trial') {
    return null;
  }

  // Calcular dias restantes dinamicamente
  const getDaysRemaining = () => {
    if (!user?.trialEndsAt) return 0;
    
    const today = new Date();
    const trialEnd = new Date(user.trialEndsAt);
    const timeDifference = trialEnd.getTime() - today.getTime();
    const daysRemaining = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
    
    return Math.max(0, daysRemaining);
  };

  const daysRemaining = getDaysRemaining();

  return (
    <Card className="border-tanotado-yellow/50 bg-gradient-to-r from-tanotado-yellow/10 to-tanotado-orange/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-tanotado-navy">🎉 Teste Gratuito Ativo</h3>
            <p className="text-sm text-muted-foreground">
              {daysRemaining > 0 
                ? `Restam ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'} do seu teste`
                : 'Seu teste gratuito expirou hoje'
              }
            </p>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-tanotado-pink to-tanotado-purple text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all">
            Assinar Agora
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionBanner;
