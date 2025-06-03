
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
            className="w-24 h-24 mx-auto mb-4 animate-pulse"
          />
          <div className="w-16 h-1 bg-white/30 rounded-full mx-auto">
            <div className="w-full h-full bg-white rounded-full animate-pulse"></div>
          </div>
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
          className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-8"
        />
        <div className="w-24 h-1 bg-white/30 rounded-full mx-auto">
          <div className="w-full h-full bg-white rounded-full animate-pulse"></div>
        </div>
        <p className="text-white/70 mt-4 text-lg">Agendamento Inteligente</p>
      </div>
    </div>
  );
};

export default SplashScreen;
