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
    "Shared rooms can't save right now. Reconnect Upstash Redis in the Vercel project Storage tab, then redeploy.",
  storageMissing:
    "Shared rooms aren't set up on this site yet. Add Upstash Redis in the Vercel project Storage tab, then redeploy.",
  createFailed: "Couldn't open a new room. Wait a moment and try again.",
  joinFull: "This room is already full.",
  joinStarted: "This night already started. Rejoin with the same name you used before.",
  joinFailed: "Couldn't get you into that room. Check the code and try again.",
  startNeedPeople: "Need at least one more person before you can start.",
  startNotHost: "Only the host can start the night.",
  startWrongPhase: "This room isn't waiting in the lobby anymore.",
  moodsLocked: "Moods are locked once you're marked ready.",
  moodsWrongPhase: "Moods can only change while you're still building the list.",
  readyWrongPhase: "Ready only works while you're still building the list.",
  readyNotInRoom: "You're not in this room anymore.",
  rankingsInvalid: "Those rankings don't match this list. Refresh and try again.",
  rankingsWrongPhase: "Ranking isn't open right now.",
  passWrongPhase: "You can only pass while ranking.",
  passNotInRoom: "You're not in this room anymore.",
  syncWrongPhase: "Favorites sync only while a reset countdown is running.",
  resetNotHost: "Only the host can start a fresh round.",
  vetoWrongPhase: "There's nothing to accept or veto right now.",
  vetoAlready: "You already answered on this pick.",
  vetoUsed: "You already used your one veto for this room.",
  addWrongPhase: "Movies can only be added while building the list.",
  addWhenReady: "Unmark ready before adding movies.",
  addNotInRoom: "You're not in this room anymore.",
  removeWrongPhase: "Movies can only be removed while building the list.",
  removeWhenReady: "Unmark ready before changing the mix.",
  removeNotYours: "You can only remove movies you added (hosts can remove any).",
  removeNotInRoom: "You're not in this room anymore.",
  unknownAction: "That room action isn't supported.",
  blankNeedPicks:
    "Blank slate mode needs at least two movies in the mix before everyone is ready.",
} as const;
