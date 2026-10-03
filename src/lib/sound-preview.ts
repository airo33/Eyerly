import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

import { SOUND_ASSETS, SoundPreset } from '@/constants/sounds';

let current: AudioPlayer | null = null;

/** Play a short in-app preview of a sound preset (works in Expo Go). */
export function playPreview(preset: SoundPreset): void {
  if (preset === 'default') return;
  try {
    current?.remove();
  } catch {
    // ignore
  }
  try {
    const player = createAudioPlayer(SOUND_ASSETS[preset]);
    current = player;
    player.play();
  } catch {
    // audio unavailable; ignore
  }
}
