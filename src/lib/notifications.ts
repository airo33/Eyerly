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

export async function rescheduleReminders(settings: Settings): Promise<void> {
  if (Platform.OS === 'web') return;
  await cancelReminders();

  const isPaused =
    settings.pausedUntil !== null && settings.pausedUntil > Date.now();
  if (!settings.enabled || isPaused) return;

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

  for (let i = 0; i < slots.length; i++) {
    const { hour, minute } = slots[i];
    const msg = pickMessage(i, locale);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: msg.title,
        body: msg.body,
        sound,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
      },
    });
  }
}
