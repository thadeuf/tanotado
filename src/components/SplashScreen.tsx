
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
            src="/lovable-uploads/c8922f24-5bf7-4be8-a02f-2d0937d79070.png" 
            alt="tanotado" 
            className="w-32 h-32 mx-auto mb-4 animate-pulse"
          />
          <p className="text-white/70 text-lg">Agendamento Inteligente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 splash-screen flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="text-center animate-fade-in">
        <img 
          src="/lovable-uploads/c8922f24-5bf7-4be8-a02f-2d0937d79070.png" 
          alt="tanotado" 
          className="w-48 h-48 md:w-64 md:h-64 mx-auto mb-8"
        />
        <p className="text-white/70 text-lg">Agendamento Inteligente</p>
      </div>
    </div>
  );
};

export default SplashScreen;
