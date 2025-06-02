
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '../../contexts/AuthContext';

const SubscriptionBanner: React.FC = () => {
  const { user } = useAuth();

  if (user?.subscriptionStatus !== 'trial') {
    return null;
  }

  return (
    <Card className="border-tanotado-yellow/50 bg-gradient-to-r from-tanotado-yellow/10 to-tanotado-orange/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-tanotado-navy">🎉 Teste Gratuito Ativo</h3>
            <p className="text-sm text-muted-foreground">
              Restam {Math.ceil((user.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias do seu teste
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
