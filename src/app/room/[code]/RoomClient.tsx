"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CinemaShell } from "@/components/CinemaShell";
import { MoodPicker } from "@/components/MoodPicker";
import { MovieRanker, WaitingForOthers } from "@/components/MovieRanker";
import { MovieSearch } from "@/components/MovieSearch";
import { RevealScreen } from "@/components/RevealScreen";
import { RoomInvite } from "@/components/RoomInvite";
import { RoomStatus } from "@/components/RoomStatus";
import {
  addCustomMovieApi,
  clearDraftRankings,
  ensurePlayer,
  joinRoomApi,
  loadDraftRankings,
  loadPlayer,
  newRoundApi,
  passOnMoviesApi,
  removeCustomMovieApi,
  saveDraftRankings,
  savePlayer,
  setPicksReadyApi,
  setPlayerMoodsApi,
  startRoomApi,
  submitRankingsApi,
  syncPassFavoritesApi,
  useRoom,
  vetoApi,
} from "@/hooks/useRoom";
import type { Mood } from "@/types/movie";
import { normalizeMoods } from "@/types/movie";

function roomStatusKind(
  error: string | null
): "missing" | "offline" | "error" {
  if (error === "Connection error") return "offline";
  if (error === "Couldn't load room") return "error";
  return "missing";
}

function moodSummary(moods: Mood[] | undefined): string {
  const normalized = normalizeMoods(moods ?? ["any"]);
  if (normalized.includes("any")) return "Open to anything";
  return normalized
    .map((id) => {
      switch (id) {
        case "feel-good":
          return "Feel Good";
        case "comedy":
          return "Comedy";
        case "action":
          return "Action";
        case "romance":
          return "Romance";
        case "sci-fi":
          return "Sci-Fi";
        case "horror":
          return "Horror";
        case "thriller":
          return "Thriller";
        case "drama":
          return "Drama";
        case "any":
          return "Surprise Me";
        default: {
          const _exhaustive: never = id;
          return _exhaustive;
        }
      }
    })
    .join(" · ");
}

function PassCountdown({
  deadline,
  onElapsed,
}: {
  deadline: number;
  onElapsed: () => void;
}) {
  const [seconds, setSeconds] = useState(() =>
    Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
  );

  useEffect(() => {
    let fired = false;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSeconds(left);
      if (left <= 0 && !fired) {
        fired = true;
        onElapsed();
      }
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [deadline, onElapsed]);

  return (
    <div
      className="mx-auto w-full max-w-lg rounded-2xl border border-butter-500/40 bg-butter-500/10 px-4 py-3 text-center"
      role="status"
    >
      <p className="text-lg font-semibold text-butter-300">
        Starting over in {seconds}…
      </p>
      <p className="mt-1 text-sm text-stone-400">
        Favorites you&apos;re ranking will join the next mix.
      </p>
    </div>
  );
}

export default function RoomClient({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = use(params);
  const code = rawCode.toUpperCase();
  const searchParams = useSearchParams();
  const joinName = searchParams.get("name");

  const { room, error, loading, refresh } = useRoom(code);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [joinInput, setJoinInput] = useState(joinName ?? "");
  const [rankings, setRankings] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [joining, setJoining] = useState(false);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [readying, setReadying] = useState(false);
  const [passing, setPassing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [autoJoined, setAutoJoined] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [myMoods, setMyMoods] = useState<Mood[]>(["any"]);
  const [moodsSynced, setMoodsSynced] = useState(false);
  const moodSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const joinInFlight = useRef(false);

  useEffect(() => {
    if (!code) return;
    const saved = loadPlayer(code);
    if (saved) {
      setPlayerId(saved.playerId);
      setPlayerName(saved.name);
    }
  }, [code]);

  const slateKey = room?.movieIds.join("|") ?? "";

  // Restore draft favorites (and submitted flag) when the ranking slate loads.
  useEffect(() => {
    if (!room || room.status !== "ranking" || !playerId) {
      setDraftReady(false);
      return;
    }
    setRankings(loadDraftRankings(code, playerId, room.movieIds));
    const alreadyIn =
      room.players.find((p) => p.id === playerId)?.submitted ?? false;
    setSubmitted(alreadyIn);
    setDraftReady(true);
  }, [room?.status, slateKey, playerId, code]);

  // Keep draft favorites across refresh while still ranking.
  useEffect(() => {
    if (!draftReady || !code || !playerId || room?.status !== "ranking") return;
    if (submitted) {
      clearDraftRankings(code, playerId);
      return;
    }
    saveDraftRankings(code, playerId, room.movieIds, rankings);
  }, [draftReady, code, playerId, rankings, submitted, room?.status, slateKey]);

  // During a pass countdown, keep syncing local favorites so they join the mix.
  useEffect(() => {
    if (
      !code ||
      !playerId ||
      room?.status !== "ranking" ||
      room.passDeadline == null
    ) {
      return;
    }

    const timer = setTimeout(() => {
      void syncPassFavoritesApi(code, playerId, rankings);
    }, 350);

    return () => clearTimeout(timer);
  }, [code, playerId, room?.status, room?.passDeadline, rankings]);

  const refreshAfterPass = useCallback(() => {
    void refresh();
  }, [refresh]);

  const isInRoom = room?.players.some((p) => p.id === playerId) ?? false;
  const isHost = room?.hostId === playerId;
  const me = room?.players.find((p) => p.id === playerId);
  const movies = room?.movies ?? [];

  // Poll is the source of truth. A sticky local "submitted" flag would hide
  // the ranker after a lost write and leave the group waiting forever.
  useEffect(() => {
    if (!me || room?.status !== "ranking" || submitting) return;
    setSubmitted(me.submitted);
  }, [me, room?.status, submitting]);

  const customPicks = room?.customPicks ?? [];
  const myPicks = customPicks.filter((p) => p.addedBy === playerId);
  const readyCount = room?.players.filter((p) => p.picksReady).length ?? 0;

  // Pull your saved moods from the room once you're in the picking phase.
  useEffect(() => {
    if (!me || room?.status !== "picking") {
      setMoodsSynced(false);
      return;
    }
    if (!moodsSynced) {
      setMyMoods(normalizeMoods(me.moods));
      setMoodsSynced(true);
    }
  }, [me, room?.status, moodsSynced]);

  // If you leave picking (new round / lobby), resync next time.
  useEffect(() => {
    if (room?.status !== "picking") setMoodsSynced(false);
  }, [room?.status]);

  // Cleanup pending mood save on unmount.
  useEffect(() => {
    return () => {
      if (moodSaveTimer.current) clearTimeout(moodSaveTimer.current);
    };
  }, []);

  const handleJoin = async () => {
    if (!joinInput.trim() || !code || joinInFlight.current) return;
    joinInFlight.current = true;
    setJoining(true);
    setJoinError(null);
    try {
      const identity = ensurePlayer(code, joinInput.trim());
      const data = await joinRoomApi(
        code,
        joinInput.trim(),
        identity.playerId
      );
      savePlayer(code, data.playerId, joinInput.trim());
      setPlayerId(data.playerId);
      setPlayerName(joinInput.trim());
      await refresh();
    } catch {
      setJoinError(
        "Couldn't get you in. If the night already started, use the same name you joined with."
      );
    } finally {
      joinInFlight.current = false;
      setJoining(false);
    }
  };

  // Deep link ?name=… reattaches or joins without an extra tap when possible.
  useEffect(() => {
    if (!room || autoJoined || playerId || !joinName?.trim()) return;
    setAutoJoined(true);
    setJoinInput(joinName);
    void (async () => {
      if (joinInFlight.current) return;
      joinInFlight.current = true;
      setJoining(true);
      try {
        const identity = ensurePlayer(code, joinName.trim());
        const data = await joinRoomApi(code, joinName.trim(), identity.playerId);
        savePlayer(code, data.playerId, joinName.trim());
        setPlayerId(data.playerId);
        setPlayerName(joinName.trim());
        await refresh();
      } catch {
        // Fall through to the manual join form.
      } finally {
        joinInFlight.current = false;
        setJoining(false);
      }
    })();
  }, [room, autoJoined, playerId, joinName, code, refresh]);

  const handleStart = async () => {
    if (!playerId || !code) return;
    setStarting(true);
    try {
      await startRoomApi(code, playerId);
      await refresh();
    } catch {
      await refresh();
    } finally {
      setStarting(false);
    }
  };

  const handleMoodsChange = (moods: Mood[]) => {
    setMyMoods(moods);
    if (!playerId || !code || me?.picksReady) return;
    if (moodSaveTimer.current) clearTimeout(moodSaveTimer.current);
    moodSaveTimer.current = setTimeout(() => {
      void setPlayerMoodsApi(code, playerId, moods).catch(() => {
        // Poll will show the last saved moods.
      });
    }, 250);
  };

  const handleReady = async (ready: boolean) => {
    if (!playerId || !code) return;
    setReadying(true);
    try {
      await setPicksReadyApi(
        code,
        playerId,
        ready,
        ready ? myMoods : undefined
      );
    } catch {
      // Server recovers silently; refresh shows the real state.
    } finally {
      await refresh();
      setReadying(false);
    }
  };

  const handleSubmit = async () => {
    if (!playerId || !code || rankings.length === 0) return;
    setSubmitting(true);
    try {
      await submitRankingsApi(code, playerId, rankings);
      clearDraftRankings(code, playerId);
      setSubmitted(true);
    } catch {
      // refresh below
    } finally {
      await refresh();
      setSubmitting(false);
    }
  };

  const handleNewRound = async () => {
    if (!playerId || !code) return;
    await newRoundApi(code, playerId);
    clearDraftRankings(code, playerId);
    setRankings([]);
    setSubmitted(false);
    await refresh();
  };

  const handlePassOnMovies = async () => {
    if (!playerId || !code || passing) return;
    setPassing(true);
    try {
      await passOnMoviesApi(code, playerId, rankings);
    } catch {
      // refresh shows whether the countdown started
    } finally {
      await refresh();
      setPassing(false);
    }
  };

  const handleVeto = async (response: "accept" | "veto") => {
    if (!playerId || !code) return;
    await vetoApi(code, playerId, response);
    await refresh();
  };

  const handleAddCustom = async (movie: {
    tmdbId: number;
    title: string;
    year: number;
    posterUrl: string | null;
  }) => {
    if (!playerId || !code) return;
    try {
      await addCustomMovieApi(code, playerId, movie.tmdbId, movie);
    } catch {
      // refresh shows whether it landed
    }
    await refresh();
  };

  const handleRemoveCustom = async (tmdbId: number) => {
    if (!playerId || !code) return;
    try {
      await removeCustomMovieApi(code, playerId, tmdbId);
    } catch {
      // refresh shows whether it landed
    }
    await refresh();
  };

  const copyLink = useCallback(() => {
    const url = `${window.location.origin}/room/${code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  if (loading) {
    return (
      <CinemaShell>
        <RoomStatus kind="loading" />
      </CinemaShell>
    );
  }

  if (error || !room) {
    return (
      <CinemaShell>
        <RoomStatus
          kind={roomStatusKind(error)}
          code={code}
          onRetry={() => {
            void refresh();
          }}
        />
      </CinemaShell>
    );
  }

  if (!isInRoom) {
    return (
      <CinemaShell>
        <div className="w-full max-w-md space-y-4 text-center">
          <RoomInvite code={code} onCopy={copyLink} copied={copied} />
          <input
            type="text"
            value={joinInput}
            onChange={(e) => setJoinInput(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-xl border border-cinema-600 bg-cinema-900 px-4 py-3 text-lg text-stone-100 focus:border-butter-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleJoin}
            disabled={joining || !joinInput.trim()}
            className="w-full rounded-2xl bg-gradient-to-b from-butter-300 to-butter-500 py-4 text-xl font-bold text-cinema-900 disabled:opacity-40 cursor-pointer"
          >
            {joining ? "Joining..." : "Join 🍿"}
          </button>
          {joinError && (
            <p className="text-sm text-stone-400" role="alert">
              {joinError}
            </p>
          )}
          <Link
            href="/?join=1"
            className="block py-2 text-sm text-stone-500 transition-colors hover:text-butter-400"
          >
            Wrong code? Try another
          </Link>
        </div>
      </CinemaShell>
    );
  }

  if (room.status === "lobby") {
    return (
      <CinemaShell>
        <div className="w-full max-w-md space-y-6">
          <RoomInvite code={code} onCopy={copyLink} copied={copied} />

          <div className="rounded-2xl border border-cinema-600 bg-cinema-800/60 p-4">
            <p className="mb-3 text-sm text-stone-500">
              {room.players.length}/{room.expectedPlayers} joined
            </p>
            <ul className="space-y-2">
              {room.players.map((p) => (
                <li key={p.id} className="text-lg text-stone-200">
                  {p.name}{" "}
                  {p.isHost && (
                    <span className="text-sm text-butter-500">(host)</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {isHost ? (
            <button
              type="button"
              onClick={handleStart}
              disabled={starting || room.players.length < 2}
              className="w-full rounded-2xl bg-gradient-to-b from-butter-300 to-butter-500 py-4 text-xl font-bold text-cinema-900 disabled:opacity-40 cursor-pointer"
            >
              {starting
                ? "Starting..."
                : room.players.length < 2
                  ? "Need at least one more person"
                  : room.players.length < room.expectedPlayers
                    ? `Start with ${room.players.length} of ${room.expectedPlayers}`
                    : "Everyone's here. Start"}
            </button>
          ) : (
            <p className="text-center text-stone-500">
              {room.players.length >= 2
                ? `Waiting for ${
                    room.players.find((p) => p.isHost)?.name ?? "the host"
                  } to start…`
                : "Waiting for everyone to join…"}
            </p>
          )}
        </div>
      </CinemaShell>
    );
  }

  if (room.status === "picking") {
    const playerNameById = Object.fromEntries(
      room.players.map((p) => [p.id, p.name])
    );
    const iAmReady = Boolean(me?.picksReady);

    return (
      <CinemaShell>
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <p className="mb-1 text-sm uppercase tracking-[0.25em] text-butter-500">
              Build the list
            </p>
            <h2 className="text-2xl font-bold text-stone-100">
              What do you want to watch?
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              {readyCount}/{room.players.length} ready
              {customPicks.length > 0
                ? ` · ${customPicks.length} in the mix`
                : " · suggestions fill in if you skip adding"}
            </p>
          </div>

          {!iAmReady && (
            <MoodPicker selected={myMoods} onChange={handleMoodsChange} />
          )}

          <div className="rounded-2xl border border-cinema-600 bg-cinema-800/60 p-4">
            <ul className="space-y-2">
              {room.players.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 text-stone-200"
                >
                  <span className="min-w-0">
                    <span className="block truncate">
                      {p.name}
                      {p.isHost ? (
                        <span className="ml-1 text-sm text-butter-500">
                          (host)
                        </span>
                      ) : null}
                    </span>
                    <span className="block truncate text-xs text-stone-600">
                      {moodSummary(p.moods)}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-sm ${
                      p.picksReady ? "text-emerald-400" : "text-stone-600"
                    }`}
                  >
                    {p.picksReady ? "Ready" : "Still adding"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {room.tmdbEnabled && !iAmReady && (
            <MovieSearch
              selectedPicks={myPicks}
              onAdd={handleAddCustom}
              onRemove={handleRemoveCustom}
              label="Movies you want in the mix"
            />
          )}

          {customPicks.length > 0 && (
            <div className="space-y-3 rounded-2xl border border-cinema-600 bg-cinema-800/40 p-4">
              <p className="text-sm text-stone-400">
                In the mix · {customPicks.length}
              </p>
              <ul className="space-y-2">
                {customPicks.map((pick) => {
                  const canRemove =
                    !iAmReady && (isHost || pick.addedBy === playerId);
                  const by =
                    pick.addedBy === playerId
                      ? "you"
                      : playerNameById[pick.addedBy] || "someone";
                  return (
                    <li
                      key={pick.tmdbId}
                      className="flex items-center gap-3 text-left"
                    >
                      {pick.posterUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={pick.posterUrl}
                          alt=""
                          className="h-12 w-8 rounded object-cover bg-cinema-700"
                        />
                      ) : (
                        <span className="flex h-12 w-8 items-center justify-center text-lg">
                          🎬
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-stone-100">
                          {pick.title}
                          {pick.year ? ` (${pick.year})` : ""}
                        </p>
                        <p className="text-xs text-stone-500">added by {by}</p>
                      </div>
                      {canRemove && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCustom(pick.tmdbId)}
                          className="cursor-pointer text-xs text-stone-500 hover:text-red-300"
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {!room.tmdbEnabled && (
            <p className="text-center text-sm text-stone-500">
              Suggested movies will be used when everyone is ready.
            </p>
          )}

          {iAmReady ? (
            <div className="space-y-3">
              <p className="text-center text-stone-400">
                You&apos;re ready. Waiting on the others...
              </p>
              <button
                type="button"
                onClick={() => handleReady(false)}
                disabled={readying}
                className="w-full cursor-pointer rounded-2xl border border-cinema-600 py-3 text-stone-400 hover:text-stone-200 disabled:opacity-40"
              >
                Change my mood or picks
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleReady(true)}
              disabled={readying}
              className="w-full cursor-pointer rounded-2xl bg-gradient-to-b from-butter-300 to-butter-500 py-4 text-xl font-bold text-cinema-900 disabled:opacity-40"
            >
              {readying ? "Saving..." : "I'm ready"}
            </button>
          )}
        </div>
      </CinemaShell>
    );
  }

  if (room.status === "revealed" && room.result) {
    const winner =
      room.movies.find((m) => m.id === room.result!.winnerId) ?? {
        id: room.result.winnerId,
        tmdbId: null,
        title: "Tonight’s pick",
        year: 0,
        tagline: "",
        description: "The group landed on this one.",
        themes: [],
        runtime: "",
        emoji: "🍿",
        genre: "Movie",
        posterUrl: null,
      };

    if (!playerId || !me) {
      return (
        <CinemaShell>
          <div className="w-full max-w-md space-y-4 text-center">
            <p className="text-stone-300">
              Rejoin with the same name to see the reveal.
            </p>
            <input
              type="text"
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-cinema-600 bg-cinema-900 px-4 py-3 text-lg text-stone-100 focus:border-butter-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleJoin}
              disabled={joining || !joinInput.trim()}
              className="w-full rounded-2xl bg-gradient-to-b from-butter-300 to-butter-500 py-4 text-xl font-bold text-cinema-900 disabled:opacity-40 cursor-pointer"
            >
              {joining ? "Joining..." : "I’m in"}
            </button>
          </div>
        </CinemaShell>
      );
    }

    return (
      <CinemaShell>
        <RevealScreen
          movie={winner}
          result={room.result}
          room={room}
          playerId={playerId}
          me={me}
          onNewRound={handleNewRound}
          onVetoResponse={handleVeto}
        />
      </CinemaShell>
    );
  }

  if (submitted || me?.submitted) {
    const waiting = room.players.filter((p) => !p.submitted).map((p) => p.name);
    const passActive = room.passDeadline != null;
    return (
      <CinemaShell>
        <div className="w-full space-y-4">
          {passActive && (
            <PassCountdown
              deadline={room.passDeadline!}
              onElapsed={refreshAfterPass}
            />
          )}
          <WaitingForOthers
            names={waiting.length > 0 ? waiting : ["the final tally"]}
            action={
              passActive ? null : (
                <button
                  type="button"
                  onClick={handlePassOnMovies}
                  disabled={passing}
                  className="mx-auto block cursor-pointer text-sm text-stone-500 underline-offset-2 hover:text-stone-300 hover:underline disabled:opacity-40"
                >
                  {passing ? "Starting countdown…" : "None of these feel right"}
                </button>
              )
            }
          />
        </div>
      </CinemaShell>
    );
  }

  const passActive = room.passDeadline != null;

  return (
    <CinemaShell>
      <p className="text-center text-sm text-stone-500">Hi {playerName}</p>

      {passActive && (
        <PassCountdown
          deadline={room.passDeadline!}
          onElapsed={refreshAfterPass}
        />
      )}

      <MovieRanker
        movies={movies}
        rankings={rankings}
        onChange={setRankings}
        disabled={submitting}
        action={
          <div className="mx-auto w-full max-w-lg space-y-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || passActive || rankings.length === 0}
              className="block w-full cursor-pointer rounded-2xl bg-gradient-to-b from-butter-300 to-butter-500 py-4 text-xl font-bold text-cinema-900 disabled:opacity-40"
            >
              {submitting ? "Locking in..." : "I'm happy with this list"}
            </button>
            {!passActive && (
              <button
                type="button"
                onClick={handlePassOnMovies}
                disabled={passing || submitting}
                className="block w-full cursor-pointer py-2 text-sm text-stone-500 hover:text-stone-300 disabled:opacity-40"
              >
                {passing ? "Starting countdown…" : "None of these feel right"}
              </button>
            )}
          </div>
        }
      />
    </CinemaShell>
  );
}
