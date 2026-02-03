/**
 * USE PRESENCE HOOK
 * Real-time Präsenz-Management
 */

import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/lib/store';
import {
  updatePresence,
  setOffline,
  setIncognitoMode,
  recordProfileVisit,
  PRESENCE_CONFIG,
} from '@/lib/presenceSystem';

interface UsePresenceOptions {
  enabled?: boolean;
}

export const usePresence = (options: UsePresenceOptions = {}) => {
  const { enabled = true } = options;
  const { user } = useStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Track user activity
  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Update presence periodically
  useEffect(() => {
    if (!enabled || !user?.id) return;

    // Initial presence update
    updatePresence(user.id, 'online', window.location.pathname);

    // Set up activity listeners
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Periodic presence update
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityRef.current;

      // Determine status based on activity
      let status: 'online' | 'away' = 'online';
      if (timeSinceActivity > PRESENCE_CONFIG.onlineThreshold) {
        status = 'away';
      }

      updatePresence(user.id, status, window.location.pathname);
    }, PRESENCE_CONFIG.updateInterval);

    // Handle page visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence(user.id, 'away');
      } else {
        updatePresence(user.id, 'online', window.location.pathname);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle beforeunload
    const handleBeforeUnload = () => {
      setOffline(user.id);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Set offline on unmount
      if (user?.id) {
        setOffline(user.id);
      }
    };
  }, [enabled, user?.id, handleActivity]);

  // Toggle incognito mode
  const toggleIncognito = useCallback(async (isIncognito: boolean) => {
    if (!user?.id) return;
    await setIncognitoMode(user.id, isIncognito);
  }, [user?.id]);

  // Record profile visit
  const visitProfile = useCallback(async (visitedUserId: string) => {
    if (!user?.id || user.id === visitedUserId) return { shouldNotify: false };

    const result = await recordProfileVisit(
      user.id,
      user.username || 'Anonym',
      (user as any).avatar || 'pegasus',
      visitedUserId
    );

    return result;
  }, [user?.id, user?.username]);

  return {
    toggleIncognito,
    visitProfile,
  };
};

export default usePresence;
