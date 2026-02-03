/**
 * DELULU DIGITAL OPERATING SYSTEM
 * System Configuration Hook - Real-time config subscription
 */

import { useState, useEffect } from 'react';
import { SystemConfig, DEFAULT_SYSTEM_CONFIG, subscribeToSystemConfig } from '@/lib/systemConfig';

export const useSystemConfig = () => {
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_SYSTEM_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let didTimeout = false;

    // Safety timeout - if config doesn't load in 3 seconds, use defaults
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('System config timeout - using defaults');
        didTimeout = true;
        setIsLoading(false);
      }
    }, 3000);

    const unsubscribe = subscribeToSystemConfig((newConfig) => {
      if (!didTimeout) {
        clearTimeout(timeout);
        setConfig(newConfig);
        setIsLoading(false);
      }
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  return {
    config,
    isLoading,
    isMaintenanceMode: config.maintenanceMode,
    maintenanceMessage: config.maintenanceMessage,
    maintenanceEstimatedEnd: config.maintenanceEstimatedEnd,
    features: config.features,
    limits: config.limits,
    levelConfig: config.levelConfig,
    referralConfig: config.referralConfig,
  };
};

export default useSystemConfig;
