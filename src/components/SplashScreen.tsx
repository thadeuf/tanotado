
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
          <h1 className="text-6xl font-bold text-white mb-4 animate-pulse">tanotado</h1>
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
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 tracking-tight">
          tanotado
        </h1>
        <div className="w-24 h-1 bg-white/30 rounded-full mx-auto">
          <div className="w-full h-full bg-white rounded-full animate-pulse"></div>
        </div>
        <p className="text-white/70 mt-4 text-lg">Agendamento Inteligente</p>
      </div>
    </div>
  );
};

export default SplashScreen;
