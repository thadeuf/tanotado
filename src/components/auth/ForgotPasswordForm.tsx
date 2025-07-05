import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AuthLayout from '../AuthLayout';

const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-recovery-code', {
        body: { email },
      });

      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: "Verifique seu WhatsApp",
        description: "Se uma conta com este e-mail existir, um código de recuperação foi enviado.",
      });

      // Navega para a página de redefinição de senha, passando o e-mail como estado
      navigate('/redefinir-senha', { state: { email } });

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível processar sua solicitação.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Recuperar Senha"
      subtitle="Digite seu e-mail para receber um código de recuperação no WhatsApp."
    >
      <Card className="border-0 shadow-lg">
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-tanotado-pink to-tanotado-purple hover:shadow-lg transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? 'Enviando...' : 'Enviar Código'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Lembrou da senha?{' '}
              <Link to="/login" className="text-tanotado-pink font-medium hover:underline">
                Fazer login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  );
};

export default ForgotPasswordForm;
