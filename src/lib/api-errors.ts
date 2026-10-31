/** User-facing API error helpers. Keep messages distinct per failure mode. */

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function isStorageFailure(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const message =
    err instanceof Error
      ? err.message
      : "message" in err && typeof err.message === "string"
        ? err.message
        : String(err);
  const cause =
    err instanceof Error && err.cause
      ? String((err.cause as { code?: string; message?: string }).code ??
          (err.cause as { message?: string }).message ??
          err.cause)
      : "";
  const haystack = `${message} ${cause}`.toLowerCase();
  return (
    haystack.includes("fetch failed") ||
    haystack.includes("enotfound") ||
    haystack.includes("econnrefused") ||
    haystack.includes("etimedout") ||
    haystack.includes("upstash") ||
    haystack.includes("redis") ||
    haystack.includes("storage")
  );
}

export const ROOM_ERRORS = {
  notFound: "That room code isn't active. It may have expired, or the code is wrong.",
  storageDown:
    "Group rooms aren't saving right now. Try again in a bit, or watch solo from home.",
  storageMissing:
    "Group rooms aren't available on this site yet. You can still pick something solo from home.",
  createFailed: "Couldn't open a new room. Wait a moment and try again.",
  joinFull: "This room is already full.",
  joinStarted: "This night already started. Rejoin with the same name you used before.",
  joinFailed: "Couldn't get you into that room. Check the code and try again.",
  startNeedPeople: "Need at least one more person before you can start.",
  startNotHost: "Only the host can start the night.",
  startWrongPhase: "This room already left the lobby.",
  moodsLocked: "You're marked ready, so moods are locked. Unmark ready to change them.",
  moodsWrongPhase: "Moods can only change while you're still adding picks.",
  readyWrongPhase: "Ready only works while you're still adding picks.",
  readyNotInRoom: "You're not in this room anymore.",
  rankingsInvalid: "Those rankings don't match this list. Refresh and try again.",
  rankingsWrongPhase: "Ranking isn't open right now.",
  passWrongPhase: "You can only pass while you're ranking.",
  passNotInRoom: "You're not in this room anymore.",
  syncWrongPhase: "Favorites only update while the pass countdown is running.",
  resetNotHost: "Only the host can start a fresh round.",
  vetoWrongPhase: "There's nothing to accept or veto right now.",
  vetoAlready: "You already answered on this pick.",
  vetoUsed: "You already used your one veto for this room.",
  addWrongPhase: "Movies can only be added while you're still gathering picks.",
  addWhenReady: "Unmark ready before adding movies.",
  addNotInRoom: "You're not in this room anymore.",
  removeWrongPhase: "Movies can only be removed while you're still gathering picks.",
  removeWhenReady: "Unmark ready before changing the list.",
  removeNotYours: "You can only remove movies you added (hosts can remove any).",
  removeNotInRoom: "You're not in this room anymore.",
  unknownAction: "That room action isn't supported.",
  blankNeedPicks:
    "Add at least two movies before everyone taps ready.",
} as const;
