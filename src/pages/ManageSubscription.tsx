// src/pages/ManageSubscription.tsx

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

const ManageSubscriptionPage: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-tanotado-navy">Gerenciar Assinatura</h1>
                <p className="text-muted-foreground mt-1">
                    Aqui você pode visualizar os detalhes do seu plano e informações de pagamento.
                </p>
            </div>

            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Detalhes do seu Plano</CardTitle>
                    <CardDescription>
                        Plano atual: <strong>Anual Pro</strong>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 border rounded-lg bg-muted/50">
                        <h3 className="font-semibold text-foreground">Status da Assinatura</h3>
                        <p className="text-sm text-green-600 font-medium">Ativa</p>
                        <p className="text-sm text-muted-foreground mt-1">Sua assinatura será renovada em: <strong>30 de Junho de 2026</strong></p>
                    </div>
                     <div className="p-4 border rounded-lg bg-muted/50">
                        <h3 className="font-semibold text-foreground">Método de Pagamento</h3>
                        <p className="text-sm text-muted-foreground">Cartão de Crédito final **** 1234</p>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6">
                   <div className="space-x-2">
                     <Button disabled>Alterar Plano (em breve)</Button>
                     <Button variant="outline" disabled>Cancelar Assinatura (em breve)</Button>
                   </div>
                   <p className="text-xs text-muted-foreground text-left sm:text-right">
                        Para alterações ou dúvidas, entre em contato com o suporte.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default ManageSubscriptionPage;