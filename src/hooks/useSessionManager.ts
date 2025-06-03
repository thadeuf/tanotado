
import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SESSION_TIMEOUT, isSessionExpired } from '@/utils/security';
import { toast } from '@/hooks/use-toast';

export const useSessionManager = () => {
  const { user, logout } = useAuth();

  const updateLastActivity = useCallback(() => {
    if (user) {
      localStorage.setItem('lastActivity', new Date().toISOString());
    }
  }, [user]);

  const checkSession = useCallback(async () => {
    const lastActivityStr = localStorage.getItem('lastActivity');
    
    if (!lastActivityStr || !user) return;
    
    const lastActivity = new Date(lastActivityStr);
    
    if (isSessionExpired(lastActivity)) {
      toast({
        title: "Sessão expirada",
        description: "Sua sessão expirou por inatividade. Faça login novamente.",
        variant: "destructive",
      });
      await logout();
    }
  }, [user, logout]);

  useEffect(() => {
    if (!user) return;

    // Update activity on component mount
    updateLastActivity();

    // Set up activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateLastActivity, true);
    });

    // Check session every minute
    const interval = setInterval(checkSession, 60000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateLastActivity, true);
      });
      clearInterval(interval);
    };
  }, [user, updateLastActivity, checkSession]);

  return { updateLastActivity };
};
