import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Link, Navigate } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

import { AddressModal } from '@/components/stripe/AddressModal';
import { User } from '@/types/auth';

const Subscription: React.FC = () => {
    const { user, logout } = useAuth();
    const [isAnnual, setIsAnnual] = useState(false);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    
    const stripeTestLink = "https://buy.stripe.com/test_6oU9AVcgb8M51VqczKgfu00";

    const isTrialExpired = user && user.trialEndsAt && new Date(user.trialEndsAt) < new Date() && !user.isSubscribed;

    if (user?.isSubscribed) {
        return <Navigate to="/manage-subscription" replace />;
    }
    
    // --- FUNÇÃO ATUALIZADA ---
    const redirectToStripe = (currentUser: User) => {
        const userEmail = currentUser.email;
        const userId = currentUser.id; // O ID do seu usuário no Supabase

        // Adiciona os parâmetros à URL do link de pagamento da Stripe
        const finalStripeUrl = `${stripeTestLink}?prefilled_email=${encodeURIComponent(userEmail)}&client_reference_id=${userId}`;

        // Redireciona o usuário
        window.location.href = finalStripeUrl;
    };

    const handleSubscriptionClick = () => {
        if (user) {
            if (user.address && user.address_number) {
                redirectToStripe(user);
            } else {
                setIsAddressModalOpen(true);
            }
        }
    };

    const handleAddressSuccess = (updatedUser: User) => {
        setIsAddressModalOpen(false);
        redirectToStripe(updatedUser);
    };
    // --- FIM DA ATUALIZAÇÃO ---

    const plans = [
        {
            name: 'Individual Básico',
            priceMonthly: 'R$ 79',
            priceAnnual: 'R$ 790',
            description: 'Acesso essencial para organizar sua prática.',
            features: [
                'IA totalmente integrada',
                'Lembretes de Sessão por WhatsApp ilimitados',
                'Agenda personalizada e intuitiva',
                'Prontuários personalizáveis',
                'Emissão de recibos ilimitados',
                'Relatórios de cobrança',
                'Controle financeiro completo',
                'Integração total com Google Agenda',
                'Emissão de recibo via Receita Saúde',
                'Personalização das notificações',
            ],
            isPopular: false,
            action: handleSubscriptionClick,
        },
        {
            name: 'Individual Pró',
            priceMonthly: 'R$ 99',
            priceAnnual: 'R$ 990',
            description: 'O plano completo para profissionais que buscam mais.',
            features: [
                'IA totalmente integrada',
                'Lembretes de Sessão por WhatsApp ilimitados',
                'Incluir Atendentes ou Secretárias',
            ],
            isPopular: true,
            action: () => alert('Plano Pró em breve!'),
        },
        {
            name: 'Clínicas',
            price: 'Sob Consulta',
            description: 'Para clínicas e equipes com múltiplos profissionais.',
            features: [
                'Todos os recursos do plano Pró',
                'Usar seu próprio Whatsapp (cobrado à parte)',
            ],
            isPopular: false,
            action: () => alert('Entre em contato para planos de clínicas!'),
        },
    ];

    return (
        <>
            <div className="min-h-screen w-full bg-gray-50/50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
                <div className="max-w-5xl w-full text-center space-y-4">
                    <img
                        src="/lovable-uploads/4a78275e-0af1-4fd5-ae15-9d988197bca6.png"
                        alt="Logotipo tanotado"
                        className="w-40 h-auto mx-auto mb-6"
                    />

                    {isTrialExpired && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md text-left mb-8 max-w-4xl mx-auto">
                            <h3 className="font-bold">Seu período de teste acabou!</h3>
                            <p>Para continuar usando todos os recursos do tanotado, por favor, escolha um dos planos abaixo.</p>
                        </div>
                    )}
                    <div>
                        <h1 className="text-4xl font-bold text-tanotado-navy">Nossos Planos</h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            Escolha o plano que melhor se adapta às suas necessidades.
                        </p>
                    </div>

                    <div className="flex items-center justify-center space-x-3 py-4">
                        <Label htmlFor="billing-cycle" className={cn("font-medium", !isAnnual ? "text-tanotado-purple" : "text-muted-foreground")}>
                            Mensal
                        </Label>
                        <Switch
                            id="billing-cycle"
                            checked={isAnnual}
                            onCheckedChange={setIsAnnual}
                        />
                        <Label htmlFor="billing-cycle" className={cn("font-medium", isAnnual ? "text-tanotado-purple" : "text-muted-foreground")}>
                            Anual
                        </Label>
                        {isAnnual && (
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 animate-fade-in">
                                2 meses grátis
                            </Badge>
                        )}
                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
                        {plans.map((plan) => (
                            <Card
                                key={plan.name}
                                className={cn(
                                    "flex flex-col text-left transition-all duration-300",
                                    plan.isPopular ? "border-tanotado-purple border-2 shadow-2xl scale-105" : "hover:shadow-lg"
                                )}
                            >
                                <CardHeader>
                                    {plan.isPopular && (
                                        <div className="text-center mb-4">
                                            <span className="bg-tanotado-purple text-white px-3 py-1 text-sm font-semibold rounded-full">
                                                MAIS POPULAR
                                            </span>
                                        </div>
                                    )}
                                    <CardTitle className="text-2xl text-tanotado-navy">{plan.name}</CardTitle>
                                    <CardDescription>{plan.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    <p className="text-4xl font-bold">
                                        {plan.price ? plan.price : (isAnnual ? plan.priceAnnual : plan.priceMonthly)}
                                        <span className="text-lg font-normal text-muted-foreground">{plan.price ? '' : (isAnnual ? '/ano' : '/mês')}</span>
                                    </p>
                                    <ul className="space-y-3">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-muted-foreground">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button onClick={plan.action} className="w-full bg-gradient-to-r from-tanotado-pink to-tanotado-purple text-lg py-6">
                                        {plan.price === 'Sob Consulta' ? 'Fale Conosco' : 'Assinar Agora'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>

                    <div className="pt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-green-600" />
                            <span className="text-sm">Pagamento 100% seguro</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-green-600" />
                            <span className="text-sm">Certificado SSL</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-green-600" />
                            <span className="text-sm">Dados Criptografados</span>
                        </div>
                    </div>

                    <div className="pt-8 flex items-center justify-center gap-x-6">
                        {!isTrialExpired && (
                            <Button variant="link" asChild>
                                <Link to="/dashboard">Voltar para o Dashboard</Link>
                            </Button>
                        )}
                        <Button
                            variant="link"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={logout}
                        >
                            Sair desta página
                        </Button>
                    </div>
                </div>

                <footer className="w-full text-center text-muted-foreground mt-16 border-t pt-8">
                    <p className="text-sm">&copy; {new Date().getFullYear()} tanotado. Todos os direitos reservados.</p>
                    <p className="text-sm">Artideia Consultoria em Tecnologia da Informação - CNPJ: 12.113.578/0001-33</p>
                    <div className="flex justify-center gap-4 mt-2">
                        <a href="#" className="text-xs hover:underline">Termos de Serviço</a>
                        <a href="#" className="text-xs hover:underline">Política de Privacidade</a>
                        <a href="#" className="text-xs hover:underline">Contato</a>
                    </div>
                </footer>
            </div>
            
            {user && (
                <AddressModal
                    user={user}
                    isOpen={isAddressModalOpen}
                    onClose={() => setIsAddressModalOpen(false)}
                    onSuccess={handleAddressSuccess}
                />
            )}
        </>
    );
};

export default Subscription;