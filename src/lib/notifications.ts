import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { SOUND_FILES } from '@/constants/sounds';
import { deviceLanguage, i18n } from './i18n';
import type { Settings } from './settings';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const MESSAGE_KEYS = [
  { title: 'notif.blinkTitle', body: 'notif.blinkBody' },
  { title: 'notif.rule202020Title', body: 'notif.rule202020Body' },
  { title: 'notif.restTitle', body: 'notif.restBody' },
];

function pickMessage(index: number, locale: string) {
  const keys = MESSAGE_KEYS[index % MESSAGE_KEYS.length];
  return {
    title: i18n.t(keys.title, { locale }),
    body: i18n.t(keys.body, { locale }),
  };
}

export async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const req = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });
  return req.granted;
}

export function buildSlots(
  intervalMin: number,
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
) {
  const slots: { hour: number; minute: number }[] = [];
  const totalStartMin = startHour * 60 + startMinute;
  const totalEndMin = endHour * 60 + endMinute;
  for (let m = totalStartMin; m <= totalEndMin; m += intervalMin) {
    slots.push({ hour: Math.floor(m / 60), minute: m % 60 });
  }
  return slots;
}

export async function cancelReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function sendTestNotification(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Eyerly test',
      body: 'If you see this, notifications work.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3,
    },
  });
}

type TriggerInput = Notifications.SchedulableNotificationTriggerInput;

/** Next time (ms) the given wall-clock slot occurs, today if still ahead. */
function nextOccurrence(hour: number, minute: number, from: number): Date {
  const d = new Date(from);
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() <= from) d.setDate(d.getDate() + 1);
  return d;
}

/**
 * Triggers for one slot. Normally a daily repeat. If its next occurrence falls
 * inside the pause window, the slot is skipped just that once: it is scheduled
 * on the other six weekdays (weekly repeats) plus a one-off for the same
 * weekday next week. Local notifications can't run code when they fire, so
 * this is what lets reminders resume on their own after a pause even if the
 * app is never reopened. Opening the app restores the plain daily schedule.
 */
export function triggersForSlot(
  hour: number,
  minute: number,
  pausedUntil: number | null,
  now: number,
): TriggerInput[] {
  const next = nextOccurrence(hour, minute, now);
  const inPause = pausedUntil !== null && next.getTime() < pausedUntil;
  if (!inPause) {
    return [
      {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
      },
    ];
  }

  const skippedWeekday = next.getDay() + 1; // expo: 1 = Sunday
  const triggers: TriggerInput[] = [];
  for (let weekday = 1; weekday <= 7; weekday++) {
    if (weekday === skippedWeekday) continue;
    triggers.push({
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday,
      hour,
      minute,
    });
  }
  const nextWeek = new Date(next);
  nextWeek.setDate(nextWeek.getDate() + 7);
  triggers.push({
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: nextWeek,
  });
  return triggers;
}

export async function rescheduleReminders(settings: Settings): Promise<void> {
  if (Platform.OS === 'web') return;
  await cancelReminders();

  if (!settings.enabled) return;

  const now = Date.now();
  const pausedUntil =
    settings.pausedUntil !== null && settings.pausedUntil > now
      ? settings.pausedUntil
      : null;

  const allSlots = buildSlots(
    settings.intervalMin,
    settings.activeStartHour,
    settings.activeStartMinute,
    settings.activeEndHour,
    settings.activeEndMinute,
  );

  // iOS silently drops pending notifications beyond 64 per app. With wide active
  // hours + a 15-min interval we can exceed that (up to ~96), so cap here.
  const MAX_SCHEDULED = 60;
  const slots = allSlots.slice(0, MAX_SCHEDULED);

  const locale = settings.language ?? deviceLanguage();

  // In a real build a preset maps to a bundled sound file; 'default' → system
  // sound. In Expo Go all custom sounds fall back to the default.
  const sound: boolean | string = !settings.sound
    ? false
    : settings.soundPreset === 'default'
      ? true
      : SOUND_FILES[settings.soundPreset];

  // Normal daily slots first so that, if pause-skipped slots push us over the
  // cap, it's the extra weekday coverage that gets trimmed, not regular slots.
  const jobs: { index: number; trigger: TriggerInput; extra: boolean }[] = [];
  slots.forEach(({ hour, minute }, index) => {
    triggersForSlot(hour, minute, pausedUntil, now).forEach((trigger) => {
      jobs.push({
        index,
        trigger,
        extra:
          trigger.type !== Notifications.SchedulableTriggerInputTypes.CALENDAR,
      });
    });
  });
  jobs.sort((a, b) => Number(a.extra) - Number(b.extra));

  for (const { index, trigger } of jobs.slice(0, MAX_SCHEDULED)) {
    const msg = pickMessage(index, locale);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: msg.title,
        body: msg.body,
        sound,
      },
      trigger,
    });
  }
}
