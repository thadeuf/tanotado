
import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-400 via-yellow-400 to-red-500 items-center justify-center p-12">
        <div className="text-center">
          <div className="mb-8">
            <img 
              src="/lovable-uploads/a142e49f-c405-4af5-96d0-7ae0ebbb6627.png" 
              alt="tanotado" 
              className="w-32 h-32 mx-auto mb-4"
            />
            <h1 className="text-6xl font-bold text-white mb-6">tanotado</h1>
          </div>
          <p className="text-white/90 text-xl max-w-md">
            O sistema de agendamento mais completo para profissionais liberais
          </p>
          <div className="mt-8 space-y-4 text-white/80">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
              <span>Agenda inteligente e automática</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
              <span>Prontuários personalizados</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
              <span>Controle financeiro completo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="lg:hidden mb-4">
              <img 
                src="/lovable-uploads/a142e49f-c405-4af5-96d0-7ae0ebbb6627.png" 
                alt="tanotado" 
                className="w-16 h-16 mx-auto mb-2"
              />
            </div>
            <h1 className="lg:hidden tanotado-logo text-4xl mb-4">tanotado</h1>
            <h2 className="text-2xl font-bold text-tanotado-navy">{title}</h2>
            {subtitle && (
              <p className="text-muted-foreground mt-2">{subtitle}</p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
