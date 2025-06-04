
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const usePageVisibility = () => {
  const queryClient = useQueryClient();
  const wasHiddenRef = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      
      console.log('📱 Page visibility changed:', isVisible ? 'visible' : 'hidden');
      
      // Se a página estava escondida e agora está visível, revalidar queries importantes
      if (isVisible && wasHiddenRef.current) {
        console.log('🔄 Page became visible after being hidden, revalidating critical queries...');
        
        // Revalidar queries críticas
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        queryClient.invalidateQueries({ queryKey: ['client-stats'] });
        
        wasHiddenRef.current = false;
      } else if (!isVisible) {
        wasHiddenRef.current = true;
      }
    };

    // Adicionar listener para mudanças de visibilidade
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient]);

  return null;
};
