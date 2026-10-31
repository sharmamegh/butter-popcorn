import Link from "next/link";

type RoomStatusKind =
  | "loading"
  | "missing"
  | "offline"
  | "error"
  | "storage";

const COPY: Record<
  Exclude<RoomStatusKind, "loading">,
  { title: string; body: string }
> = {
  missing: {
    title: "That room isn’t here",
    body: "Wrong code, or it may have expired. Start fresh or try another code.",
  },
  offline: {
    title: "Can’t reach the room",
    body: "Check your connection, then try again. Or head home and start over.",
  },
  error: {
    title: "Room didn’t load",
    body: "Something glitched while opening this room. Try again in a moment.",
  },
  storage: {
    title: "Shared rooms are offline",
    body: "This site can’t save group rooms right now. Top recommends still works from home.",
  },
};

export function RoomStatus({
  kind,
  code,
  detail,
  onRetry,
}: {
  kind: RoomStatusKind;
  code?: string;
  /** Optional server message that clarifies the specific failure. */
  detail?: string | null;
  onRetry?: () => void;
}) {
  if (kind === "loading") {
    return (
      <div className="w-full max-w-md space-y-4 text-center">
        <p className="text-stone-400">Opening your room…</p>
        <Link
          href="/"
          className="inline-block text-sm text-stone-600 transition-colors hover:text-butter-400"
        >
          Back to start
        </Link>
      </div>
    );
  }

  const copy = COPY[kind];
  const canRetry =
    (kind === "offline" || kind === "error" || kind === "storage") && onRetry;
  const body =
    detail && detail !== copy.body && kind !== "missing" ? detail : copy.body;

  return (
    <div className="w-full max-w-md space-y-6 text-center">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-stone-100">{copy.title}</h2>
        <p className="text-stone-400 leading-relaxed">{body}</p>
        {code && kind === "missing" && (
          <p className="pt-1 font-mono text-sm tracking-[0.25em] text-stone-600">
            {code}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {canRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="w-full cursor-pointer rounded-2xl bg-gradient-to-b from-butter-300 to-butter-500 py-4 text-xl font-bold text-cinema-900"
          >
            Try again
          </button>
        ) : (
          <Link
            href="/"
            className="block w-full rounded-2xl bg-gradient-to-b from-butter-300 to-butter-500 py-4 text-xl font-bold text-cinema-900"
          >
            Back to start
          </Link>
        )}

        {kind === "missing" ? (
          <Link
            href="/?join=1"
            className="block w-full py-2 text-sm text-stone-500 transition-colors hover:text-butter-400"
          >
            Enter a different code
          </Link>
        ) : kind === "storage" ? (
          <Link
            href="/explore"
            className="block w-full py-2 text-sm text-stone-500 transition-colors hover:text-butter-400"
          >
            Try Top recommends instead
          </Link>
        ) : (
          <Link
            href="/"
            className="block w-full py-2 text-sm text-stone-500 transition-colors hover:text-butter-400"
          >
            Back to start
          </Link>
        )}
      </div>
    </div>
  );
}
