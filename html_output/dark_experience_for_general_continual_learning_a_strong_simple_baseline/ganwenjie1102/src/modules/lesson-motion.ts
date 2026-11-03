/** Match D1's readable action windows; never squeeze multiple causal actions into one blink. */
export const LESSON_DURATIONS = {
  'der-step': [2200, 6200, 4600, 3400, 3200],
  augmentation: [5200, 3600, 5600, 4000],
  'der-plus': [4400, 4200, 4800],
} as const;
