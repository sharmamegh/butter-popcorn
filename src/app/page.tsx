"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CinemaShell } from "@/components/CinemaShell";
import { createRoom, savePlayer } from "@/hooks/useRoom";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [players, setPlayers] = useState(2);
  const [loading, setLoading] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const data = await createRoom(name.trim(), players);
      savePlayer(data.code, data.playerId, name.trim());
      router.push(`/room/${data.code}`);
    } catch {
      setLoading(false);
    }
  };

  const handleJoin = () => {
    if (!name.trim() || joinCode.trim().length < 4) return;
    router.push(`/room/${joinCode.trim().toUpperCase()}?name=${encodeURIComponent(name.trim())}`);
  };

  return (
    <CinemaShell>
      <header className="text-center mb-4">
        <p className="text-xs uppercase tracking-[0.35em] text-butter-600 mb-3">
          Movie Night
        </p>
        <h1
          className="text-4xl sm:text-6xl font-bold shimmer-text mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Butter Popcorn
        </h1>
        <p className="text-stone-400 text-lg max-w-lg mx-auto">
          Create a room, rank the same movies on your own device, and let the
          group reveal the best match. Any size crew, any night.
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
            <label className="block">
              <span className="text-sm text-stone-400 mb-1.5 block">
                How many people in this room?
              </span>
              <div className="flex flex-wrap gap-2">
                {[2, 3, 4, 5, 6, 8].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPlayers(n)}
                    className={`
                      flex-1 rounded-xl py-2.5 text-sm font-medium border cursor-pointer
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
            </label>

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
              <span className="text-sm text-stone-400 mb-1.5 block">Room code</span>
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
        <li>1. Host creates a room and shares the code or link</li>
        <li>2. Everyone joins on their own device and ranks 8 movies</li>
        <li>3. Grand reveal — the group&apos;s most compatible pick wins</li>
      </ol>
    </CinemaShell>
  );
}
