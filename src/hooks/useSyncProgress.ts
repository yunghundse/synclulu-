/**
 * useSyncProgress.ts
 * 🧠 REALTIME XP ENGINE - Flüssiges XP-Wachstum während aktiver Nutzung
 *
 * Diese Logik sorgt dafür, dass der Balken nicht statisch ist,
 * sondern während des Verweilens in einem Wölkchen flüssig wächst.
 * Psychologischer Effekt: Jede Sekunde in der App ist wertvoll.
 *
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';

interface SyncProgressResult {
  xp: number;
  level: number;
  progressInLevel: number;
  rankName: string;
  isLevelingUp: boolean;
}

// Rang-Namen basierend auf Level
const getRankName = (level: number): string => {
  if (level >= 50) return 'Sovereign';
  if (level >= 40) return 'Luminary';
  if (level >= 30) return 'Architect';
  if (level >= 20) return 'Pathfinder';
  if (level >= 15) return 'Pioneer';
  if (level >= 10) return 'Wanderer';
  if (level >= 5) return 'Explorer';
  return 'Newcomer';
};

// Level-Up Effekt triggern
const triggerLevelUpEffect = () => {
  // Haptisches Feedback
  if (window.navigator.vibrate) {
    window.navigator.vibrate([50, 30, 100]); // Doppel-Vibration für Level-Up
  }
  console.log('🎉 LEVEL UP: Aura-Synchronisation verstärkt.');
};

/**
 * Hook für flüssiges XP-Wachstum während der aktiven Nutzung
 * @param initialXP - Der Startwert vom Server
 * @param isInSync - Ob der User gerade in einem Wölkchen ist
 * @param xpPerInterval - XP pro Intervall (default: 0.5)
 * @param intervalMs - Intervall in Millisekunden (default: 2000)
 */
export const useSyncProgress = (
  initialXP: number = 0,
  isInSync: boolean = false,
  xpPerInterval: number = 0.5,
  intervalMs: number = 2000
): SyncProgressResult => {
  const [xp, setXp] = useState(initialXP);
  const [level, setLevel] = useState(Math.floor(initialXP / 100) + 1);
  const [isLevelingUp, setIsLevelingUp] = useState(false);

  // XP vom Server aktualisieren
  useEffect(() => {
    if (initialXP !== xp && !isInSync) {
      setXp(initialXP);
      setLevel(Math.floor(initialXP / 100) + 1);
    }
  }, [initialXP]);

  // Realtime XP-Wachstum während Sync
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isInSync) {
      interval = setInterval(() => {
        setXp((prevXp) => {
          const newXp = prevXp + xpPerInterval;

          // Level-Up Logik (Jedes Level braucht 100 XP)
          const newLevel = Math.floor(newXp / 100) + 1;
          if (newLevel > level) {
            setLevel(newLevel);
            setIsLevelingUp(true);
            triggerLevelUpEffect();

            // Level-Up Animation nach 2s beenden
            setTimeout(() => setIsLevelingUp(false), 2000);
          }

          return newXp;
        });
      }, intervalMs);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isInSync, level, xpPerInterval, intervalMs]);

  // Berechnet den Prozentwert für den Balken (0-100 innerhalb des Levels)
  const progressInLevel = Math.min(xp % 100, 100);
  const rankName = getRankName(level);

  return {
    xp,
    level,
    progressInLevel,
    rankName,
    isLevelingUp
  };
};

export default useSyncProgress;
