
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
      <div 
        className="hidden lg:flex lg:w-1/2"
        style={{
          background: 'radial-gradient(at center top, #D15C04, #E2BD78)',
          backgroundImage: 'url(/fundo_vert.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img 
              src="/logo_home.png" 
              alt="tanotado" 
              className="w-32 h-32 mx-auto mb-4"
            />
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
