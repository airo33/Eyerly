import AsyncStorage from '@react-native-async-storage/async-storage';

export type StreakState = {
  /** Local date (YYYY-MM-DD) of the most recent day with a completed session. */
  lastActiveDate: string | null;
  /** Consecutive-day count as of lastActiveDate. */
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  /** Sessions completed per local day, keyed by YYYY-MM-DD. */
  history: Record<string, number>;
};

export const DEFAULT_STREAK: StreakState = {
  lastActiveDate: null,
  currentStreak: 0,
  longestStreak: 0,
  totalSessions: 0,
  history: {},
};

export type DayBar = {
  key: string;
  count: number;
  weekday: number;
  isToday: boolean;
};

const STORAGE_KEY = 'eyerly.streak.v1';

/** Local calendar date as YYYY-MM-DD (not UTC). */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysBetween(a: string, b: string): number {
  // Parse as local midnights to avoid DST/UTC drift.
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const da = new Date(ay, am - 1, ad).getTime();
  const db = new Date(by, bm - 1, bd).getTime();
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

export async function loadStreak(): Promise<StreakState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STREAK;
    const parsed = JSON.parse(raw) as Partial<StreakState>;
    return { ...DEFAULT_STREAK, ...parsed, history: parsed.history ?? {} };
  } catch {
    return DEFAULT_STREAK;
  }
}

/** Drop history entries older than `keepDays` to bound storage growth. */
function pruneHistory(
  history: Record<string, number>,
  keepDays = 60,
): Record<string, number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - keepDays);
  const cutoffKey = localDateKey(cutoff);
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(history)) {
    if (k >= cutoffKey) out[k] = v;
  }
  return out;
}

async function saveStreak(state: StreakState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // best-effort
  }
}

/**
 * Record one completed session for today and return the updated streak.
 * - Same day again: only totalSessions increments.
 * - Consecutive day: currentStreak + 1.
 * - Gap of 2+ days: streak resets to 1.
 */
export async function recordSession(prev: StreakState): Promise<StreakState> {
  const today = localDateKey();
  const history = pruneHistory({
    ...prev.history,
    [today]: (prev.history[today] ?? 0) + 1,
  });

  let next: StreakState;
  if (prev.lastActiveDate === today) {
    next = { ...prev, totalSessions: prev.totalSessions + 1, history };
  } else {
    const gap =
      prev.lastActiveDate === null
        ? Infinity
        : daysBetween(prev.lastActiveDate, today);
    const currentStreak = gap === 1 ? prev.currentStreak + 1 : 1;
    next = {
      lastActiveDate: today,
      currentStreak,
      longestStreak: Math.max(prev.longestStreak, currentStreak),
      totalSessions: prev.totalSessions + 1,
      history,
    };
  }

  await saveStreak(next);
  return next;
}

/** Last `n` days ending today, oldest first. */
export function lastNDays(state: StreakState, n = 7): DayBar[] {
  const now = new Date();
  const bars: DayBar[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = localDateKey(d);
    bars.push({
      key,
      count: state.history[key] ?? 0,
      weekday: d.getDay(),
      isToday: i === 0,
    });
  }
  return bars;
}

/**
 * Streak to display right now. If the last active day is today or yesterday the
 * streak is still "alive"; older than that means it has lapsed → 0.
 */
export function displayStreak(state: StreakState): number {
  if (!state.lastActiveDate) return 0;
  const gap = daysBetween(state.lastActiveDate, localDateKey());
  if (gap <= 1) return state.currentStreak;
  return 0;
}

/** Whether a session has already been completed today. */
export function didSessionToday(state: StreakState): boolean {
  return state.lastActiveDate === localDateKey();
}
