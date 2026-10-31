/** How many people a room can hold (1 = solo explorer). */
export const MIN_PLAYERS = 1;
export const MAX_PLAYERS = 8;

export const PLAYER_SIZE_OPTIONS = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (_, i) => MIN_PLAYERS + i
);

/**
 * Fresh suggestions added on top of whatever the group already put in the mix.
 * Slate size = unique custom picks + this count (or this count alone when empty).
 */
export const DISCOVERY_FILL_COUNT = 10;

/** How long the group has after “none of these” before the slate resets. */
export const PASS_COUNTDOWN_SECONDS = 10;
export const PASS_COUNTDOWN_MS = PASS_COUNTDOWN_SECONDS * 1000;
