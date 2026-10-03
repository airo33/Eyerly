import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_ACTIVE_END_HOUR,
  DEFAULT_ACTIVE_END_MINUTE,
  DEFAULT_ACTIVE_START_HOUR,
  DEFAULT_ACTIVE_START_MINUTE,
  DEFAULT_INTERVAL_MIN,
  IntervalMin,
} from '@/constants/eyerly';
import { LanguageCode } from '@/constants/languages';
import { SoundPreset } from '@/constants/sounds';

export type Settings = {
  enabled: boolean;
  intervalMin: IntervalMin;
  activeStartHour: number;
  activeStartMinute: number;
  activeEndHour: number;
  activeEndMinute: number;
  pausedUntil: number | null;
  onboardingDone: boolean;
  name: string;
  countryCode: string | null;
  language: LanguageCode | null;
  sound: boolean;
  vibration: boolean;
  soundPreset: SoundPreset;
};

export const DEFAULT_SETTINGS: Settings = {
  enabled: false,
  intervalMin: DEFAULT_INTERVAL_MIN,
  activeStartHour: DEFAULT_ACTIVE_START_HOUR,
  activeStartMinute: DEFAULT_ACTIVE_START_MINUTE,
  activeEndHour: DEFAULT_ACTIVE_END_HOUR,
  activeEndMinute: DEFAULT_ACTIVE_END_MINUTE,
  pausedUntil: null,
  onboardingDone: false,
  name: '',
  countryCode: null,
  language: null,
  sound: true,
  vibration: true,
  soundPreset: 'default',
};

const STORAGE_KEY = 'eyerly.settings.v1';

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // best-effort persistence; ignore write failures
  }
}

/** Whether reminders are currently paused (pause window hasn't elapsed). */
export function isPausedNow(settings: Pick<Settings, 'pausedUntil'>): boolean {
  return settings.pausedUntil !== null && settings.pausedUntil > Date.now();
}

export function formatTime(hour: number, minute: number): string {
  const h = hour.toString().padStart(2, '0');
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m}`;
}
