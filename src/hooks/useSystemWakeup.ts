
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useSystemWakeup = () => {
  const queryClient = useQueryClient();
  const lastActivityTime = useRef(Date.now());
  const wakeupTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const updateActivity = () => {
      lastActivityTime.current = Date.now();
    };

    const checkForWakeup = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityTime.current;
      
      // Se passou mais de 30 segundos sem atividade, consideramos que o sistema pode ter "dormido"
      if (timeSinceActivity > 30000) {
        console.log('🔄 Sistema detectou possível dormência, forçando revalidação...');
        
        // Cancela todas as queries em andamento que podem estar "presas"
        queryClient.cancelQueries();
        
        // Força a revalidação de todas as queries
        queryClient.invalidateQueries();
        
        // Reset do cache para garantir que queries frescas sejam feitas
        queryClient.clear();
        
        updateActivity();
      }
    };

    // Monitora eventos de atividade do usuário
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Monitora mudanças de visibilidade da página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Página ficou visível, verificando necessidade de wakeup...');
        updateActivity();
        checkForWakeup();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Monitora reconexão de rede
    const handleOnline = () => {
      console.log('🔄 Rede reconectada, forçando revalidação...');
      queryClient.invalidateQueries();
      updateActivity();
    };

    window.addEventListener('online', handleOnline);

    // Verifica periodicamente se o sistema pode ter "dormido"
    const intervalId = setInterval(checkForWakeup, 5000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      clearInterval(intervalId);
      if (wakeupTimeoutRef.current) {
        clearTimeout(wakeupTimeoutRef.current);
      }
    };
  }, [queryClient]);

  // Função para forçar wakeup manualmente
  const forceWakeup = () => {
    console.log('🔄 Forçando wakeup manual do sistema...');
    queryClient.cancelQueries();
    queryClient.invalidateQueries();
    lastActivityTime.current = Date.now();
  };

  return { forceWakeup };
};
