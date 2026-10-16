import { buildSlots, triggersForSlot } from '../notifications';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  SchedulableTriggerInputTypes: {
    CALENDAR: 'calendar',
    WEEKLY: 'weekly',
    DATE: 'date',
    TIME_INTERVAL: 'timeInterval',
  },
}));

jest.mock('../i18n', () => ({
  i18n: { t: (key: string) => key },
  deviceLanguage: () => 'en',
}));

describe('buildSlots', () => {
  it('includes both ends of the active window', () => {
    const slots = buildSlots(20, 9, 0, 22, 0);
    expect(slots).toHaveLength(40);
    expect(slots[0]).toEqual({ hour: 9, minute: 0 });
    expect(slots[slots.length - 1]).toEqual({ hour: 22, minute: 0 });
  });

  it('steps by the interval and rolls minutes into hours', () => {
    expect(buildSlots(30, 9, 30, 10, 30)).toEqual([
      { hour: 9, minute: 30 },
      { hour: 10, minute: 0 },
      { hour: 10, minute: 30 },
    ]);
  });

  it('produces 53 slots for 15 min over the default hours', () => {
    expect(buildSlots(15, 9, 0, 22, 0)).toHaveLength(53);
  });

  it('returns nothing when the end is before the start', () => {
    expect(buildSlots(20, 22, 0, 9, 0)).toEqual([]);
  });

  it('returns a single slot when start equals end', () => {
    expect(buildSlots(20, 9, 0, 9, 0)).toEqual([{ hour: 9, minute: 0 }]);
  });
});

describe('triggersForSlot', () => {
  // Monday 5 Oct 2026, 12:00 local.
  const now = new Date(2026, 9, 5, 12, 0, 0).getTime();
  const pausedUntil = new Date(2026, 9, 5, 13, 0, 0).getTime();

  it('is a single daily repeat when not paused', () => {
    expect(triggersForSlot(12, 20, null, now)).toEqual([
      { type: 'calendar', hour: 12, minute: 20, repeats: true },
    ]);
  });

  it('keeps slots outside the pause window as daily repeats', () => {
    // 15:00 is after the pause ends.
    expect(triggersForSlot(15, 0, pausedUntil, now)).toEqual([
      { type: 'calendar', hour: 15, minute: 0, repeats: true },
    ]);
    // 11:00 already passed today, so its next occurrence is tomorrow.
    expect(triggersForSlot(11, 0, pausedUntil, now)).toEqual([
      { type: 'calendar', hour: 11, minute: 0, repeats: true },
    ]);
  });

  it('treats a slot exactly at the pause end as outside the window', () => {
    expect(triggersForSlot(13, 0, pausedUntil, now)).toEqual([
      { type: 'calendar', hour: 13, minute: 0, repeats: true },
    ]);
  });

  it('skips a slot inside the window just once', () => {
    const triggers = triggersForSlot(12, 20, pausedUntil, now);

    // Six weekly repeats for every weekday except today's (Monday = 2).
    const weekly = triggers.filter((t) => t.type === 'weekly');
    expect(weekly).toHaveLength(6);
    expect(weekly.map((t) => (t as { weekday: number }).weekday).sort()).toEqual(
      [1, 3, 4, 5, 6, 7],
    );
    for (const t of weekly) {
      expect(t).toMatchObject({ hour: 12, minute: 20 });
    }

    // Plus a one-off for the same weekday next week.
    const dates = triggers.filter((t) => t.type === 'date');
    expect(dates).toHaveLength(1);
    expect((dates[0] as { date: Date }).date).toEqual(
      new Date(2026, 9, 12, 12, 20, 0, 0),
    );

    // Nothing that would fire again today.
    expect(triggers.some((t) => t.type === 'calendar')).toBe(false);
  });

  it('uses the weekday of the next occurrence', () => {
    // Sunday 11 Oct, 23:00 → the 23:30 slot's next occurrence is that night.
    const sunday = new Date(2026, 9, 11, 23, 0, 0).getTime();
    const until = new Date(2026, 9, 12, 0, 30, 0).getTime();
    const triggers = triggersForSlot(23, 30, until, sunday);
    const weekdays = triggers
      .filter((t) => t.type === 'weekly')
      .map((t) => (t as { weekday: number }).weekday);
    expect(weekdays).not.toContain(1); // Sunday is the skipped weekday
    expect(weekdays).toHaveLength(6);
  });
});
