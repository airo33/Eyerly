export const INTERVAL_OPTIONS_MIN = [15, 20, 30] as const;
export type IntervalMin = (typeof INTERVAL_OPTIONS_MIN)[number];
export const DEFAULT_INTERVAL_MIN: IntervalMin = 20;

export const DEFAULT_ACTIVE_START_HOUR = 9;
export const DEFAULT_ACTIVE_START_MINUTE = 0;
export const DEFAULT_ACTIVE_END_HOUR = 22;
export const DEFAULT_ACTIVE_END_MINUTE = 0;

export type ExerciseAnim =
  | 'blink'
  | 'nearfar'
  | 'palming'
  | 'figure8'
  | 'circle'
  | 'horizontal'
  | 'vertical';

export type Exercise = {
  id: string;
  /** Base key into translations `ex.<i18nKey>Title` / `ex.<i18nKey>Sub`. */
  i18nKey: string;
  title: string;
  subtitle: string;
  durationSec: number;
  isPro: boolean;
  anim: ExerciseAnim;
};

export const EXERCISES: Exercise[] = [
  {
    id: 'rapid-blink',
    anim: 'blink',
    i18nKey: 'rapidBlink',
    title: 'Rapid blink',
    subtitle: 'Blink softly, 20 times',
    durationSec: 20,
    isPro: false,
  },
  {
    id: '20-20-20',
    anim: 'nearfar',
    i18nKey: 'r202020',
    title: '20-20-20 rule',
    subtitle: 'Look 20 ft away for 20 seconds',
    durationSec: 20,
    isPro: false,
  },
  {
    id: 'palming',
    anim: 'palming',
    i18nKey: 'palming',
    title: 'Palming',
    subtitle: 'Cover eyes, breathe, relax',
    durationSec: 30,
    isPro: false,
  },
  {
    id: 'figure-eight',
    anim: 'figure8',
    i18nKey: 'figure8',
    title: 'Figure eight',
    subtitle: 'Trace a horizontal 8 with your eyes',
    durationSec: 30,
    isPro: true,
  },
  {
    id: 'near-far',
    anim: 'nearfar',
    i18nKey: 'nearFar',
    title: 'Near-far focus',
    subtitle: 'Alternate focus, thumb → far away',
    durationSec: 45,
    isPro: true,
  },
  {
    id: 'eye-roll',
    anim: 'circle',
    i18nKey: 'eyeRoll',
    title: 'Eye rolls',
    subtitle: 'Slow circular motion, both directions',
    durationSec: 30,
    isPro: true,
  },
  {
    id: 'side-to-side',
    anim: 'horizontal',
    i18nKey: 'side',
    title: 'Side to side',
    subtitle: 'Sweep gaze left-right, slowly',
    durationSec: 30,
    isPro: true,
  },
  {
    id: 'up-down',
    anim: 'vertical',
    i18nKey: 'upDown',
    title: 'Up and down',
    subtitle: 'Move gaze up and down, no head motion',
    durationSec: 30,
    isPro: true,
  },
];
