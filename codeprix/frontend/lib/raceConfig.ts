export const START_LIGHT_COUNT = 5;
export const START_LIGHT_STEP_MS = 620;
export const START_LIGHT_REDIRECT_DELAY_MS = 260;

export const RACE_TIMER_SPEED_SCALE = 0.75;
export const RACE_TIMER_TICK_MS = 200;

export const getScaledElapsedMs = (startedAt: number | null, now = Date.now()) => {
  if (!startedAt) return 0;
  const elapsed = Math.max(0, now - startedAt);
  return Math.round(elapsed * RACE_TIMER_SPEED_SCALE);
};
