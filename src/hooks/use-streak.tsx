import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  DEFAULT_STREAK,
  StreakState,
  loadStreak,
  recordSession,
} from '@/lib/streak';

type StreakContextValue = {
  streak: StreakState;
  hydrated: boolean;
  recordCompletedSession: () => Promise<void>;
};

const StreakContext = createContext<StreakContextValue | null>(null);

export function StreakProvider({ children }: { children: ReactNode }) {
  const [streak, setStreak] = useState<StreakState>(DEFAULT_STREAK);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadStreak().then((s) => {
      if (!cancelled) {
        setStreak(s);
        setHydrated(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const recordCompletedSession = useCallback(async () => {
    const current = await loadStreak();
    const next = await recordSession(current);
    setStreak(next);
  }, []);

  return (
    <StreakContext.Provider value={{ streak, hydrated, recordCompletedSession }}>
      {children}
    </StreakContext.Provider>
  );
}

export function useStreak(): StreakContextValue {
  const ctx = useContext(StreakContext);
  if (!ctx) {
    throw new Error('useStreak must be used within StreakProvider');
  }
  return ctx;
}
