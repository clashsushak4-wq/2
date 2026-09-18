export const MAX_PULL_DISTANCE = 112;
export const REFRESH_THRESHOLD = 64;
export const REFRESH_HOLD_DISTANCE = 58;

export const getResistedPullDistance = (distance: number): number => {
  if (distance <= 0) return 0;

  return Math.min(
    MAX_PULL_DISTANCE,
    MAX_PULL_DISTANCE * (1 - Math.exp(-distance / 100)),
  );
};

export const getPullProgress = (distance: number): number => (
  Math.min(Math.max(distance / REFRESH_THRESHOLD, 0), 1)
);
