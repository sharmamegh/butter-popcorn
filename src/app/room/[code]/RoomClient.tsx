"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CinemaShell } from "@/components/CinemaShell";
import { MovieRanker, WaitingForOthers } from "@/components/MovieRanker";
import { MovieSearch } from "@/components/MovieSearch";
import { RevealScreen } from "@/components/RevealScreen";
import { RoomInvite } from "@/components/RoomInvite";
import { RoomStatus } from "@/components/RoomStatus";
import {
  addCustomMovieApi,
  joinRoomApi,
  loadPlayer,
  newRoundApi,
  removeCustomMovieApi,
  savePlayer,
  setPicksReadyApi,
  startRoomApi,
  submitRankingsApi,
  useRoom,
  vetoApi,
} from "@/hooks/useRoom";

function roomStatusKind(
  error: string | null
): "missing" | "offline" | "error" {
  if (error === "Connection error") return "offline";
  if (error === "Couldn't load room") return "error";
  return "missing";
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!code) return;
    const saved = loadPlayer(code);
    if (saved) {
      setPlayerId(saved.playerId);
      setPlayerName(saved.name);
    }
  }, [code]);

  useEffect(() => {
    if (room?.status === "ranking") {
      setRankings([]);
      setSubmitted(false);
    }
  }, [room?.status, room?.movieIds.join("|")]);

  const isInRoom = room?.players.some((p) => p.id === playerId) ?? false;
  const isHost = room?.hostId === playerId;
  const me = room?.players.find((p) => p.id === playerId);
  const movies = room?.movies ?? [];
  const customPicks = room?.customPicks ?? [];
  const myPickIds = customPicks
    .filter((p) => p.addedBy === playerId)
    .map((p) => p.tmdbId);
  const readyCount = room?.players.filter((p) => p.picksReady).length ?? 0;

  const handleJoin = async () => {
    if (!joinInput.trim() || !code) return;
    setJoining(true);
    try {
      const data = await joinRoomApi(code, joinInput.trim());
      savePlayer(code, data.playerId, joinInput.trim());
      setPlayerId(data.playerId);
      setPlayerName(joinInput.trim());
      await refresh();
    } catch {
      alert("Couldn't join. Room may be full or already started.");
    } finally {
      setJoining(false);
    }
  };

  const handleStart = async () => {
    if (!playerId || !code) return;
    setStarting(true);
    try {
      await startRoomApi(code, playerId);
      await refresh();
    } catch {
      alert("Need at least two people to start.");
    } finally {
      setStarting(false);
    }
  };

  const handleReady = async (ready: boolean) => {
    if (!playerId || !code) return;
    setReadying(true);
    try {
      await setPicksReadyApi(code, playerId, ready);
      await refresh();
    } catch (err) {
      await refresh();
      alert(
        err instanceof Error
          ? err.message
          : "Couldn't update. Add a couple of movies first, or try again."
      );
    } finally {
      setReadying(false);
    }
  };

  const handleSubmit = async () => {
    if (!playerId || !code || rankings.length === 0) return;
    setSubmitting(true);
    try {
      await submitRankingsApi(code, playerId, rankings);
      setSubmitted(true);
      await refresh();
    } catch {
      alert("Couldn't lock in your list. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewRound = async () => {
    if (!playerId || !code) return;
    await newRoundApi(code, playerId);
    setRankings([]);
    setSubmitted(false);
    await refresh();
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
    await addCustomMovieApi(code, playerId, movie.tmdbId, movie);
    await refresh();
  };

  const handleRemoveCustom = async (tmdbId: number) => {
    if (!playerId || !code) return;
    await removeCustomMovieApi(code, playerId, tmdbId);
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
              Waiting for everyone to join...
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

          <div className="rounded-2xl border border-cinema-600 bg-cinema-800/60 p-4">
            <ul className="space-y-2">
              {room.players.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between text-stone-200"
                >
                  <span>
                    {p.name}
                    {p.isHost ? (
                      <span className="ml-1 text-sm text-butter-500">(host)</span>
                    ) : null}
                  </span>
                  <span
                    className={`text-sm ${
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
              selectedIds={myPickIds}
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
                Edit my picks
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
    const winner = room.movies.find((m) => m.id === room.result!.winnerId);
    if (!winner || !playerId || !me) return null;

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
    return (
      <CinemaShell>
        <WaitingForOthers names={waiting} />
      </CinemaShell>
    );
  }

  return (
    <CinemaShell>
      <p className="text-center text-sm text-stone-500">Hi {playerName}</p>

      <MovieRanker
        movies={movies}
        rankings={rankings}
        onChange={setRankings}
        disabled={submitting}
        action={
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || rankings.length === 0}
            className="mx-auto block w-full max-w-lg cursor-pointer rounded-2xl bg-gradient-to-b from-butter-300 to-butter-500 py-4 text-xl font-bold text-cinema-900 disabled:opacity-40"
          >
            {submitting ? "Locking in..." : "I'm happy with this list"}
          </button>
        }
      />
    </CinemaShell>
  );
}
