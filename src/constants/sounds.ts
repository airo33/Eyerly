export type SoundPreset = 'default' | 'chime' | 'bell' | 'soft';

export const SOUND_PRESETS: SoundPreset[] = ['default', 'chime', 'bell', 'soft'];

/** Bundled assets for in-app preview playback. */
export const SOUND_ASSETS: Record<Exclude<SoundPreset, 'default'>, number> = {
  chime: require('../../assets/sounds/chime.wav'),
  bell: require('../../assets/sounds/bell.wav'),
  soft: require('../../assets/sounds/soft.wav'),
};

/** Filenames used for the iOS notification sound (active in a real build). */
export const SOUND_FILES: Record<Exclude<SoundPreset, 'default'>, string> = {
  chime: 'chime.wav',
  bell: 'bell.wav',
  soft: 'soft.wav',
};
