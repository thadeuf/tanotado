// src/pages/Subscription.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const plans = [
  {
    name: 'Mensal',
    price: 'R$ 49,90',
    description: 'Ideal para começar a organizar sua rotina.',
    features: [
      'Agenda Inteligente',
      'Cadastro de Clientes',
      'Prontuários Digitais',
      'Controle Financeiro Básico',
      'Suporte via Email',
    ],
    isPopular: false,
  },
  {
    name: 'Anual',
    price: 'R$ 499,90',
    description: 'O melhor custo-benefício com 2 meses grátis.',
    features: [
      'Todos os recursos do plano Mensal',
      'Página de Agendamento Online',
      'Lembretes Automáticos (WhatsApp)',
      'Relatórios Avançados',
      'Suporte Prioritário',
    ],
    isPopular: true,
  },
  {
    name: 'Empresarial',
    price: 'Sob Consulta',
    description: 'Para clínicas e equipes com múltiplos profissionais.',
    features: [
      'Todos os recursos do plano Anual',
      'Múltiplos Usuários',
      'Gestão de Equipe',
      'Personalização da Marca',
      'Gerente de Contas Dedicado',
    ],
    isPopular: false,
  },
];

const Subscription: React.FC = () => {
    const { user, logout } = useAuth();
    const isTrialExpired = user && user.trialEndsAt && new Date(user.trialEndsAt) < new Date() && !user.isSubscribed;

    return (
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
                                <p className="text-4xl font-bold">{plan.price}</p>
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
                                <Button className="w-full bg-gradient-to-r from-tanotado-pink to-tanotado-purple text-lg py-6">
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
                
                {/* --- INÍCIO DA ALTERAÇÃO --- */}
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
                {/* --- FIM DA ALTERAÇÃO --- */}
            </div>

            <footer className="w-full text-center text-muted-foreground mt-16 border-t pt-8">
                <p className="text-sm">&copy; {new Date().getFullYear()} tanotado. Todos os direitos reservados.</p>
                <p className="text-sm">Tanotado Soluções Digitais LTDA - CNPJ: 99.999.999/0001-99</p>
                <div className="flex justify-center gap-4 mt-2">
                    <a href="#" className="text-xs hover:underline">Termos de Serviço</a>
                    <a href="#" className="text-xs hover:underline">Política de Privacidade</a>
                    <a href="#" className="text-xs hover:underline">Contato</a>
                </div>
            </footer>
        </div>
    );
};

export default Subscription;