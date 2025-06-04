
import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useSessionManager = () => {
  const { user, logout } = useAuth();
  const lastActivityRef = useRef<Date>(new Date());
  const checkIntervalRef = useRef<NodeJS.Timeout>();
  const isCheckingRef = useRef(false);

  const updateLastActivity = useCallback(() => {
    if (user) {
      const now = new Date();
      lastActivityRef.current = now;
      localStorage.setItem('lastActivity', now.toISOString());
    }
  }, [user]);

  const checkSession = useCallback(async () => {
    // Prevent multiple simultaneous checks
    if (isCheckingRef.current || !user) return;
    
    isCheckingRef.current = true;
    
    try {
      const lastActivityStr = localStorage.getItem('lastActivity');
      
      if (!lastActivityStr) {
        updateLastActivity();
        return;
      }
      
      const lastActivity = new Date(lastActivityStr);
      const timeSinceActivity = Date.now() - lastActivity.getTime();
      
      // Only logout if REALLY expired (more than 4 hours)
      if (timeSinceActivity > 4 * 60 * 60 * 1000) {
        toast({
          title: "Sessão expirada",
          description: "Sua sessão expirou por inatividade. Faça login novamente.",
          variant: "destructive",
        });
        await logout();
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      isCheckingRef.current = false;
    }
  }, [user, logout, updateLastActivity]);

  useEffect(() => {
    if (!user) return;

    // Update activity on mount
    updateLastActivity();

    // Set up activity listeners with longer debounce
    let activityTimeout: NodeJS.Timeout;
    const debouncedUpdateActivity = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(updateLastActivity, 5000); // Debounce by 5 seconds
    };

    const events = ['mousedown', 'keypress', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, debouncedUpdateActivity, { passive: true });
    });

    // Check session every 15 minutes instead of 5
    checkIntervalRef.current = setInterval(checkSession, 15 * 60 * 1000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, debouncedUpdateActivity);
      });
      
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      
      clearTimeout(activityTimeout);
    };
  }, [user, updateLastActivity, checkSession]);

  return { updateLastActivity };
};
