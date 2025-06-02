
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const MonthView: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Visão Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-8">
          Visão mensal em desenvolvimento...
        </p>
      </CardContent>
    </Card>
  );
};

export default MonthView;
