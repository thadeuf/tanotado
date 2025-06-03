
import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Aguarda animação de saída
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) {
    return (
      <div className="fixed inset-0 splash-screen flex items-center justify-center z-50 opacity-0 transition-opacity duration-300">
        <div className="text-center">
          <img 
            src="/lovable-uploads/997559be-cbfa-4975-a3c3-c43bc9ffa421.png" 
            alt="tanotado"
            className="w-48 h-48 mx-auto mb-8 animate-pulse"
          />
          <p className="text-white/70 mt-4 text-lg">Agendamento Inteligente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 splash-screen flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="text-center animate-fade-in">
        <img 
          src="/lovable-uploads/997559be-cbfa-4975-a3c3-c43bc9ffa421.png" 
          alt="tanotado"
          className="w-64 h-64 md:w-80 md:h-80 mx-auto mb-8"
        />
        <p className="text-white/70 mt-4 text-lg">Agendamento Inteligente</p>
      </div>
    </div>
  );
};

export default SplashScreen;
