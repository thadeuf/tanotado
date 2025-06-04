
import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SESSION_TIMEOUT, isSessionExpired } from '@/utils/security';
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
      console.log('🔄 Activity updated:', now.toISOString());
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
      
      console.log('🕐 Session check - Time since activity:', timeSinceActivity, 'ms');
      
      // Only logout if REALLY expired (more than 2 hours)
      if (timeSinceActivity > 2 * 60 * 60 * 1000) {
        console.log('⚠️ Session expired, logging out');
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

    // Set up activity listeners with debounce
    let activityTimeout: NodeJS.Timeout;
    const debouncedUpdateActivity = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(updateLastActivity, 1000); // Debounce by 1 second
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, debouncedUpdateActivity, { passive: true });
    });

    // Check session every 5 minutes instead of every minute
    checkIntervalRef.current = setInterval(checkSession, 5 * 60 * 1000);

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
