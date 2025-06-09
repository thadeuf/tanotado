import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Aguarda a animação de saída (fade-out) antes de chamar onComplete
      setTimeout(onComplete, 300); 
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Para evitar repetição e garantir uma transição suave, definimos o conteúdo aqui
  const content = (
    <div className="text-center animate-fade-in">
      <img
        // Adicionei classes para controlar o tamanho da imagem, sinta-se à vontade para ajustar
        className="w-48 h-auto mx-auto mb-6" // mx-auto para centralizar
        src="https://chbpnnlfeazqmfwhafte.supabase.co/storage/v1/object/public/photos//logo_transp_mini.png"
        alt="Logotipo tanotado"
      />
      <p className="text-black/120 mt-4 text-lg">Agendamento Inteligente</p>
    </div>
  );

  // O 'return' agora é mais limpo e consistente
  return (
    <div
      className={`fixed inset-0 splash-screen flex items-center justify-center z-50 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {content}
    </div>
  );
};

export default SplashScreen;