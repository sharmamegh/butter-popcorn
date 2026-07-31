"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CinemaShell } from "@/components/CinemaShell";
import { MovieRanker, WaitingForOthers } from "@/components/MovieRanker";
import { RevealScreen } from "@/components/RevealScreen";
import { getMoviesByIds } from "@/data/movies";
import {
  joinRoomApi,
  loadPlayer,
  resetRoomApi,
  savePlayer,
  startRoomApi,
  submitRankingsApi,
  useRoom,
} from "@/hooks/useRoom";

export default function RoomClient({ params }: { params: Promise<{ code: string }> }) {
  const [code, setCode] = useState("");
  const searchParams = useSearchParams();
  const joinName = searchParams.get("name");

  useEffect(() => {
    params.then((p) => setCode(p.code.toUpperCase()));
  }, [params]);

  const { room, error, loading, refresh } = useRoom(code);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [joinInput, setJoinInput] = useState(joinName ?? "");
  const [rankings, setRankings] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [joining, setJoining] = useState(false);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!code) return;
    const saved = loadPlayer(code);
    if (saved) {
      setPlayerId(saved.playerId);
      setPlayerName(saved.name);
    }
  }, [code]);

  const isInRoom = room?.players.some((p) => p.id === playerId) ?? false;
  const isHost = room?.hostId === playerId;
  const me = room?.players.find((p) => p.id === playerId);
  const movies = room ? getMoviesByIds(room.movieIds) : [];

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
    } finally {
      setStarting(false);
    }
  };

  const handleSubmit = async () => {
    if (!playerId || !code || rankings.length !== movies.length) return;
    setSubmitting(true);
    try {
      await submitRankingsApi(code, playerId, rankings);
      setSubmitted(true);
      await refresh();
    } catch {
      alert("Couldn't submit. Make sure every movie is ranked.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlayAgain = async () => {
    if (!playerId || !code) return;
    await resetRoomApi(code, playerId);
    setRankings([]);
    setSubmitted(false);
    await refresh();
  };

  const copyLink = useCallback(() => {
    const url = `${window.location.origin}/room/${code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  if (!code || loading) {
    return (
      <CinemaShell>
        <p className="text-stone-500">Loading room...</p>
      </CinemaShell>
    );
  }

  if (error || !room) {
    return (
      <CinemaShell>
        <p className="text-stone-400">Room not found. Check the code and try again.</p>
      </CinemaShell>
    );
  }

  if (!isInRoom) {
    return (
      <CinemaShell>
        <div className="w-full max-w-md space-y-4 text-center">
          <p className="text-sm uppercase tracking-widest text-butter-500">Join room</p>
          <p className="text-4xl font-mono font-bold text-butter-300 tracking-[0.2em]">
            {code}
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
            {joining ? "Joining..." : "Join 🍿"}
          </button>
        </div>
      </CinemaShell>
    );
  }

  if (room.status === "lobby") {
    return (
      <CinemaShell>
        <div className="w-full max-w-md space-y-6 text-center">
          <div>
            <p className="text-sm uppercase tracking-widest text-butter-500 mb-2">
              Room code: send this to everyone
            </p>
            <p className="text-5xl font-mono font-bold text-butter-300 tracking-[0.15em]">
              {code}
            </p>
          </div>

          <button
            type="button"
            onClick={copyLink}
            className="w-full rounded-xl border border-cinema-600 py-3 text-stone-300 hover:border-butter-400/50 cursor-pointer"
          >
            {copied ? "Link copied!" : "Copy invite link"}
          </button>

          <div className="rounded-2xl border border-cinema-600 bg-cinema-800/60 p-4">
            <p className="text-sm text-stone-500 mb-3">
              {room.players.length}/{room.expectedPlayers} joined
            </p>
            <ul className="space-y-2">
              {room.players.map((p) => (
                <li key={p.id} className="text-lg text-stone-200">
                  {p.name}{" "}
                  {p.isHost && (
                    <span className="text-butter-500 text-sm">(host)</span>
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
                  ? "Waiting for everyone to join..."
                  : "Everyone's here! Start ranking!"}
            </button>
          ) : (
            <p className="text-stone-500">Waiting for the host to start...</p>
          )}
        </div>
      </CinemaShell>
    );
  }

  if (room.status === "revealed" && room.result) {
    const winner = getMoviesByIds([room.result.winnerId])[0];
    if (!winner || !playerId) return null;

    return (
      <CinemaShell>
        <RevealScreen
          movie={winner}
          result={room.result}
          room={room}
          playerId={playerId}
          onPlayAgain={handlePlayAgain}
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
      <p className="text-sm text-stone-500 text-center">
        Hi {playerName} · rank in private, then submit
      </p>

      <MovieRanker
        movies={movies}
        rankings={rankings}
        onChange={setRankings}
        disabled={submitting}
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || rankings.length !== movies.length}
        className="w-full max-w-lg rounded-2xl bg-gradient-to-b from-butter-300 to-butter-500 py-4 text-xl font-bold text-cinema-900 disabled:opacity-40 cursor-pointer"
      >
        {submitting ? "Submitting..." : "Lock in my rankings 🔒"}
      </button>
    </CinemaShell>
  );
}
