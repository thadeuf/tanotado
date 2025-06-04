
import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useConnectionManager = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const lastFocusRef = useRef<Date>(new Date());
  const isOnlineRef = useRef(navigator.onLine);

  const refreshAllQueries = useCallback(async () => {
    console.log('🔄 Refreshing all queries due to connection issue');
    
    // Cancel any ongoing queries first
    await queryClient.cancelQueries();
    
    // Clear all queries and refetch
    queryClient.invalidateQueries();
    
    // Force refetch critical data
    if (user?.id) {
      queryClient.refetchQueries({ queryKey: ['clients', user.id] });
      queryClient.refetchQueries({ queryKey: ['appointments', user.id] });
      queryClient.refetchQueries({ queryKey: ['payments', user.id] });
      queryClient.refetchQueries({ queryKey: ['financial-stats', user.id] });
    }
  }, [queryClient, user?.id]);

  const handleVisibilityChange = useCallback(() => {
    const now = new Date();
    const timeSinceLastFocus = now.getTime() - lastFocusRef.current.getTime();
    
    if (document.visibilityState === 'visible') {
      console.log('👁️ Tab became visible - time away:', timeSinceLastFocus, 'ms');
      
      // If tab was hidden for more than 30 seconds, refresh everything
      if (timeSinceLastFocus > 30000) {
        console.log('🔄 Tab was away for too long, refreshing queries');
        refreshAllQueries();
      }
      
      lastFocusRef.current = now;
    } else {
      console.log('👁️ Tab became hidden');
      lastFocusRef.current = now;
    }
  }, [refreshAllQueries]);

  const handleOnlineStatusChange = useCallback(() => {
    const isOnline = navigator.onLine;
    console.log('🌐 Online status changed:', isOnline);
    
    if (isOnline && !isOnlineRef.current) {
      console.log('🌐 Back online, refreshing queries');
      toast({
        title: "Conexão restaurada",
        description: "Atualizando dados...",
      });
      refreshAllQueries();
    } else if (!isOnline) {
      toast({
        title: "Sem conexão",
        description: "Verifique sua conexão com a internet",
        variant: "destructive",
      });
    }
    
    isOnlineRef.current = isOnline;
  }, [refreshAllQueries]);

  const handleFocus = useCallback(() => {
    const now = new Date();
    const timeSinceLastFocus = now.getTime() - lastFocusRef.current.getTime();
    
    console.log('🎯 Window focused - time away:', timeSinceLastFocus, 'ms');
    
    // If window was unfocused for more than 1 minute, refresh
    if (timeSinceLastFocus > 60000) {
      console.log('🔄 Window was unfocused for too long, refreshing queries');
      refreshAllQueries();
    }
    
    lastFocusRef.current = now;
  }, [refreshAllQueries]);

  const handleBeforeUnload = useCallback(() => {
    console.log('📤 Page unloading, canceling queries');
    queryClient.cancelQueries();
  }, [queryClient]);

  useEffect(() => {
    // Listen for visibility changes (tab switching)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for online/offline status
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);
    
    // Listen for window focus/blur
    window.addEventListener('focus', handleFocus);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [handleVisibilityChange, handleOnlineStatusChange, handleFocus, handleBeforeUnload]);

  return {
    refreshAllQueries,
    isOnline: isOnlineRef.current,
  };
};
