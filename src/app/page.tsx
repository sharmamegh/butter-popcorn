"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { CinemaShell } from "@/components/CinemaShell";
import { MoodPicker } from "@/components/MoodPicker";
import { createRoom, savePlayer } from "@/hooks/useRoom";
import { PLAYER_SIZE_OPTIONS } from "@/lib/constants";
import type { Mood } from "@/types/movie";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [players, setPlayers] = useState(2);
  const [moods, setMoods] = useState<Mood[]>(["any"]);
  const [loading, setLoading] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("join") === "1") {
      setShowJoin(true);
    }
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setCreateError(null);
    try {
      const data = await createRoom(name.trim(), players, moods);
      savePlayer(data.code, data.playerId, name.trim());
      router.push(`/room/${data.code}`);
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Couldn't create a room. Try again."
      );
      setLoading(false);
    }
  };

  const handleJoin = () => {
    if (!name.trim() || joinCode.trim().length < 4) return;
    router.push(
      `/room/${joinCode.trim().toUpperCase()}?name=${encodeURIComponent(name.trim())}`
    );
  };

  return (
    <CinemaShell brand={false}>
      <header className="mb-4 text-center">
        <BrandMark size="hero" />
        <p className="mx-auto mt-3 max-w-lg text-lg text-stone-400">
          Stop arguing over what to watch. Find the movie everyone&apos;s
          actually happy with.
        </p>
      </header>

      <div className="w-full max-w-md space-y-4 rounded-2xl border border-cinema-600 bg-cinema-800/60 p-6">
        <label className="block">
          <span className="text-sm text-stone-400 mb-1.5 block">Your name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Me"
            className="w-full rounded-xl border border-cinema-600 bg-cinema-900 px-4 py-3 text-lg text-stone-100 placeholder:text-stone-600 focus:border-butter-400 focus:outline-none"
          />
        </label>

        {!showJoin ? (
          <>
            <div className="block">
              <span className="text-sm text-stone-400 mb-1.5 block">
                How many people in this room?
              </span>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Room size"
              >
                {PLAYER_SIZE_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPlayers(n)}
                    aria-pressed={players === n}
                    className={`
                      flex-1 min-w-[3rem] rounded-xl py-2.5 text-sm font-medium border cursor-pointer
                      ${
                        players === n
                          ? "border-butter-400 bg-butter-400/15 text-butter-200"
                          : "border-cinema-600 text-stone-500 hover:border-butter-500/40"
                      }
                    `}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <MoodPicker selected={moods} onChange={setMoods} />

            {createError && (
              <p className="text-sm text-red-300/90 text-center" role="alert">
                {createError}
              </p>
            )}

            <button
              type="button"
              onClick={handleCreate}
              disabled={!name.trim() || loading}
              className="w-full rounded-2xl bg-gradient-to-b from-butter-300 to-butter-500 py-4 text-xl font-bold text-cinema-900 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Start a room 🍿"}
            </button>

            <button
              type="button"
              onClick={() => setShowJoin(true)}
              className="w-full text-sm text-stone-500 hover:text-butter-400 cursor-pointer"
            >
              Have a code? Join a room
            </button>
          </>
        ) : (
          <>
            <label className="block">
              <span className="text-sm text-stone-400 mb-1.5 block">
                Room code
              </span>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABCDE"
                maxLength={5}
                className="w-full rounded-xl border border-cinema-600 bg-cinema-900 px-4 py-3 text-2xl font-mono tracking-[0.3em] text-center text-butter-300 placeholder:text-stone-600 focus:border-butter-400 focus:outline-none uppercase"
              />
            </label>

            <button
              type="button"
              onClick={handleJoin}
              disabled={!name.trim() || joinCode.trim().length < 4}
              className="w-full rounded-2xl bg-gradient-to-b from-butter-300 to-butter-500 py-4 text-xl font-bold text-cinema-900 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Join room
            </button>

            <button
              type="button"
              onClick={() => setShowJoin(false)}
              className="w-full text-sm text-stone-500 hover:text-butter-400 cursor-pointer"
            >
              ← Start a new room instead
            </button>
          </>
        )}
      </div>

      <ol className="text-sm text-stone-600 space-y-2 max-w-lg text-center list-none">
        <li>1. Everyone joins the room</li>
        <li>2. Add movies you want, then tap ready</li>
        <li>3. Rank the shared list and find the winner</li>
      </ol>
    </CinemaShell>
  );
}
