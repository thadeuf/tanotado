import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { CpfInput } from './ui/CpfInput';
import { CustomPhoneInput } from './ui/phone-input';

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    whatsapp: '',
    cpf: ''
  });
  const { register, isLoading } = useAuth();

  // O handler genérico agora funciona para todos os campos, incluindo os mascarados
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    return cleanCPF.length === 11;
  };

  const validateWhatsApp = (whatsapp: string) => {
    const cleanPhone = whatsapp.replace(/[^\d]/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem", variant: "destructive" });
      return;
    }

    if (!formData.name.includes(' ')) {
      toast({ title: "Erro", description: "Por favor, insira seu nome completo", variant: "destructive" });
      return;
    }

    if (!validateCPF(formData.cpf)) {
      toast({ title: "Erro", description: "CPF inválido. Preencha todos os 11 dígitos.", variant: "destructive" });
      return;
    }

    if (!validateWhatsApp(formData.whatsapp)) {
      toast({ title: "Erro", description: "WhatsApp inválido.", variant: "destructive" });
      return;
    }

    try {
      // Limpa os dados da máscara ANTES de enviar para a função de registro
      const cleanCPF = formData.cpf.replace(/[^\d]/g, '');
      const cleanWhatsApp = formData.whatsapp.replace(/[^\d]/g, '');

      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        whatsapp: cleanWhatsApp,
        cpf: cleanCPF
      });
    } catch (error) {
      console.error('Register error:', error);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="João Silva"
              value={formData.name}
              onChange={handleChange}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="h-11"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <CustomPhoneInput
                id="whatsapp"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <CpfInput
                id="cpf"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                required
                className="h-11"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="h-11"
            />
          </div>
          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <p className="font-medium text-tanotado-navy mb-1">🎉 Teste Gratuito de 7 dias!</p>
            <p>Sem compromisso. Cancele quando quiser.</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full h-11 bg-gradient-to-r from-tanotado-pink to-tanotado-purple hover:shadow-lg transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? 'Criando conta...' : 'Começar Teste Gratuito'}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-tanotado-pink font-medium hover:underline">
              Faça login
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
};

export default RegisterForm;