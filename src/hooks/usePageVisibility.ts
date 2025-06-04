
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const usePageVisibility = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Page became visible, invalidating stale queries');
        // Revalida apenas queries que estão stale
        queryClient.invalidateQueries({ 
          refetchType: 'active',
          stale: true 
        });
      }
    };

    const handleFocus = () => {
      console.log('🔄 Window focused, checking for stale data');
      queryClient.invalidateQueries({ 
        refetchType: 'active',
        stale: true 
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [queryClient]);
};
