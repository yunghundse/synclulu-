/**
 * usePermissionGuard.ts
 * Persistent Permission Guard - GPS & Microphone
 * Ensures Delulu has the permissions needed to "breathe"
 */

import { useState, useEffect, useCallback } from 'react';

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unknown';

export interface PermissionStatus {
  geolocation: PermissionState;
  microphone: PermissionState;
  notifications: PermissionState;
}

export interface UsePermissionGuardResult {
  permissions: PermissionStatus;
  isBlocked: boolean;
  isLoading: boolean;
  missingPermissions: string[];
  checkPermissions: () => Promise<boolean>;
  requestGeolocation: () => Promise<boolean>;
  requestMicrophone: () => Promise<boolean>;
  requestNotifications: () => Promise<boolean>;
  openSystemSettings: () => void;
}

export function usePermissionGuard(): UsePermissionGuardResult {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    geolocation: 'unknown',
    microphone: 'unknown',
    notifications: 'unknown',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check all permissions
  const checkPermissions = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    const newStatus: PermissionStatus = {
      geolocation: 'unknown',
      microphone: 'unknown',
      notifications: 'unknown',
    };

    try {
      // Check Geolocation
      if ('permissions' in navigator) {
        try {
          const geoStatus = await navigator.permissions.query({
            name: 'geolocation',
          });
          newStatus.geolocation = geoStatus.state as PermissionState;

          // Listen for changes
          geoStatus.onchange = () => {
            setPermissions((prev) => ({
              ...prev,
              geolocation: geoStatus.state as PermissionState,
            }));
          };
        } catch (e) {
          // Fallback: try to get position
          try {
            await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
              });
            });
            newStatus.geolocation = 'granted';
          } catch {
            newStatus.geolocation = 'denied';
          }
        }
      }

      // Check Microphone
      if ('permissions' in navigator) {
        try {
          const micStatus = await navigator.permissions.query({
            name: 'microphone' as PermissionName,
          });
          newStatus.microphone = micStatus.state as PermissionState;

          micStatus.onchange = () => {
            setPermissions((prev) => ({
              ...prev,
              microphone: micStatus.state as PermissionState,
            }));
          };
        } catch (e) {
          // Microphone permission query not supported
          newStatus.microphone = 'prompt';
        }
      }

      // Check Notifications
      if ('Notification' in window) {
        const notifPermission = Notification.permission;
        newStatus.notifications =
          notifPermission === 'default' ? 'prompt' : (notifPermission as PermissionState);
      }

      setPermissions(newStatus);
      setIsLoading(false);

      // Return true only if geolocation is granted (minimum requirement)
      return newStatus.geolocation === 'granted';
    } catch (error) {
      console.error('Permission check error:', error);
      setIsLoading(false);
      return false;
    }
  }, []);

  // Request Geolocation
  const requestGeolocation = useCallback(async (): Promise<boolean> => {
    try {
      await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
        });
      });
      setPermissions((prev) => ({ ...prev, geolocation: 'granted' }));
      return true;
    } catch (error) {
      setPermissions((prev) => ({ ...prev, geolocation: 'denied' }));
      return false;
    }
  }, []);

  // Request Microphone
  const requestMicrophone = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately, we just needed permission
      stream.getTracks().forEach((track) => track.stop());
      setPermissions((prev) => ({ ...prev, microphone: 'granted' }));
      return true;
    } catch (error) {
      setPermissions((prev) => ({ ...prev, microphone: 'denied' }));
      return false;
    }
  }, []);

  // Request Notifications
  const requestNotifications = useCallback(async (): Promise<boolean> => {
    try {
      const permission = await Notification.requestPermission();
      const state = permission === 'default' ? 'prompt' : (permission as PermissionState);
      setPermissions((prev) => ({ ...prev, notifications: state }));
      return permission === 'granted';
    } catch (error) {
      return false;
    }
  }, []);

  // Open system settings (platform-specific hints)
  const openSystemSettings = useCallback(() => {
    // Can't directly open settings, but we can provide guidance
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      alert(
        'Öffne die Einstellungen-App → Delulu → Aktiviere Standort auf "Immer" und Mikrofon.'
      );
    } else if (isAndroid) {
      alert(
        'Öffne Einstellungen → Apps → Delulu → Berechtigungen → Aktiviere Standort und Mikrofon.'
      );
    } else {
      alert(
        'Bitte aktiviere Standort und Mikrofon in deinen Browser-Einstellungen für diese Seite.'
      );
    }
  }, []);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  // Calculate if blocked
  const isBlocked = permissions.geolocation === 'denied';

  // Get list of missing permissions
  const missingPermissions: string[] = [];
  if (permissions.geolocation !== 'granted') {
    missingPermissions.push('Standort (GPS)');
  }
  if (permissions.microphone !== 'granted') {
    missingPermissions.push('Mikrofon');
  }
  if (permissions.notifications !== 'granted') {
    missingPermissions.push('Benachrichtigungen');
  }

  return {
    permissions,
    isBlocked,
    isLoading,
    missingPermissions,
    checkPermissions,
    requestGeolocation,
    requestMicrophone,
    requestNotifications,
    openSystemSettings,
  };
}

export default usePermissionGuard;
