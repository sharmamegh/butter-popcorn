/** How many people a room can hold */
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;

export const PLAYER_SIZE_OPTIONS = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (_, i) => MIN_PLAYERS + i
);

/**
 * When nobody adds movies, fill the slate from discovery.
 * When the group adds picks, every unique pick is ranked (no hard cap).
 */
export const DISCOVERY_FILL_COUNT = 10;
