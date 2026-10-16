import {
  DEFAULT_STREAK,
  didSessionToday,
  displayStreak,
  lastNDays,
  localDateKey,
  recordSession,
  type StreakState,
} from '../streak';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

/** Fake only Date so async storage promises keep working. */
function setToday(y: number, m: number, d: number) {
  jest.useFakeTimers({
    now: new Date(y, m, d, 10, 0, 0),
    doNotFake: [
      'nextTick',
      'setImmediate',
      'clearImmediate',
      'setInterval',
      'clearInterval',
      'setTimeout',
      'clearTimeout',
      'queueMicrotask',
      'performance',
      'hrtime',
    ],
  });
}

afterEach(() => {
  jest.useRealTimers();
});

describe('localDateKey', () => {
  it('zero-pads month and day and uses local time', () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(localDateKey(new Date(2026, 11, 31, 0, 1))).toBe('2026-12-31');
  });
});

describe('recordSession', () => {
  it('starts a streak of 1 on the first session', async () => {
    setToday(2026, 9, 5);
    const next = await recordSession(DEFAULT_STREAK);
    expect(next).toMatchObject({
      lastActiveDate: '2026-10-05',
      currentStreak: 1,
      longestStreak: 1,
      totalSessions: 1,
    });
    expect(next.history).toEqual({ '2026-10-05': 1 });
  });

  it('only counts the session when done twice on the same day', async () => {
    setToday(2026, 9, 5);
    const once = await recordSession(DEFAULT_STREAK);
    const twice = await recordSession(once);
    expect(twice.currentStreak).toBe(1);
    expect(twice.totalSessions).toBe(2);
    expect(twice.history['2026-10-05']).toBe(2);
  });

  it('extends the streak on consecutive days', async () => {
    setToday(2026, 9, 5);
    const day1 = await recordSession(DEFAULT_STREAK);
    setToday(2026, 9, 6);
    const day2 = await recordSession(day1);
    expect(day2.currentStreak).toBe(2);
    expect(day2.longestStreak).toBe(2);
  });

  it('extends the streak across a month boundary', async () => {
    setToday(2026, 9, 31);
    const day1 = await recordSession(DEFAULT_STREAK);
    setToday(2026, 10, 1);
    const day2 = await recordSession(day1);
    expect(day2.currentStreak).toBe(2);
  });

  it('resets after a gap but keeps the longest streak', async () => {
    setToday(2026, 9, 5);
    const a = await recordSession(DEFAULT_STREAK);
    setToday(2026, 9, 6);
    const b = await recordSession(a);
    setToday(2026, 9, 9); // skipped two days
    const c = await recordSession(b);
    expect(c.currentStreak).toBe(1);
    expect(c.longestStreak).toBe(2);
    expect(c.totalSessions).toBe(3);
  });

  it('prunes history older than 60 days', async () => {
    setToday(2026, 9, 5);
    const prev: StreakState = {
      ...DEFAULT_STREAK,
      lastActiveDate: '2026-06-01',
      currentStreak: 1,
      longestStreak: 1,
      totalSessions: 2,
      history: { '2026-06-01': 1, '2026-10-01': 1 },
    };
    const next = await recordSession(prev);
    expect(next.history).not.toHaveProperty('2026-06-01');
    expect(next.history).toHaveProperty('2026-10-01');
    expect(next.history).toHaveProperty('2026-10-05');
  });
});

describe('displayStreak', () => {
  const base: StreakState = {
    ...DEFAULT_STREAK,
    currentStreak: 4,
    longestStreak: 4,
  };

  it('is 0 when there has never been a session', () => {
    expect(displayStreak(DEFAULT_STREAK)).toBe(0);
  });

  it('stays alive if the last session was today or yesterday', () => {
    setToday(2026, 9, 5);
    expect(displayStreak({ ...base, lastActiveDate: '2026-10-05' })).toBe(4);
    expect(displayStreak({ ...base, lastActiveDate: '2026-10-04' })).toBe(4);
  });

  it('lapses to 0 after a missed day', () => {
    setToday(2026, 9, 5);
    expect(displayStreak({ ...base, lastActiveDate: '2026-10-03' })).toBe(0);
  });

  it('handles daylight-saving transitions', () => {
    // Last US DST change of 2026 is 1 Nov; yesterday must still count.
    setToday(2026, 10, 2);
    expect(displayStreak({ ...base, lastActiveDate: '2026-11-01' })).toBe(4);
  });
});

describe('didSessionToday', () => {
  it('is true only when the last session was today', () => {
    setToday(2026, 9, 5);
    expect(didSessionToday({ ...DEFAULT_STREAK, lastActiveDate: '2026-10-05' })).toBe(true);
    expect(didSessionToday({ ...DEFAULT_STREAK, lastActiveDate: '2026-10-04' })).toBe(false);
    expect(didSessionToday(DEFAULT_STREAK)).toBe(false);
  });
});

describe('lastNDays', () => {
  it('returns n days oldest first, ending today', () => {
    setToday(2026, 9, 5); // Monday
    const state: StreakState = {
      ...DEFAULT_STREAK,
      history: { '2026-10-05': 2, '2026-10-03': 1 },
    };
    const bars = lastNDays(state, 7);
    expect(bars).toHaveLength(7);
    expect(bars[0].key).toBe('2026-09-29');
    expect(bars[6]).toMatchObject({ key: '2026-10-05', count: 2, isToday: true, weekday: 1 });
    expect(bars.find((b) => b.key === '2026-10-03')?.count).toBe(1);
    expect(bars.filter((b) => b.isToday)).toHaveLength(1);
    expect(bars.find((b) => b.key === '2026-10-04')?.count).toBe(0);
  });
});
