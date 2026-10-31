"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { CinemaShell } from "@/components/CinemaShell";
import { createRoom, savePlayer } from "@/hooks/useRoom";
import { PLAYER_SIZE_OPTIONS } from "@/lib/constants";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [players, setPlayers] = useState(2);
  const [loading, setLoading] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("join") === "1") {
      setShowJoin(true);
    }
  }, []);

  const isSolo = players === 1;

  const handleCreate = async () => {
    setCreateError(null);

    // Solo: Top recommends; no name or shared room needed.
    if (isSolo) {
      setLoading(true);
      router.push("/explore");
      return;
    }

    if (!name.trim()) return;
    setLoading(true);

    try {
      const data = await createRoom(name.trim(), players);
      savePlayer(data.code, data.playerId, name.trim());
      router.push(`/room/${data.code}`);
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Couldn't open a new room. Try again."
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
        {!showJoin ? (
          <>
            <div className="block space-y-3">
              <button
                type="button"
                onClick={() => setPlayers(1)}
                aria-pressed={isSolo}
                className={`
                  w-full rounded-xl px-4 py-3 text-sm font-medium border cursor-pointer text-left
                  ${
                    isSolo
                      ? "border-butter-400 bg-butter-400/15 text-butter-200"
                      : "border-cinema-600 text-stone-400 hover:border-butter-500/40"
                  }
                `}
              >
                Just me
                <span className="mt-0.5 block text-xs font-normal text-stone-500">
                  Solo night. Choose a vibe and find something you&apos;ll
                  actually watch.
                </span>
              </button>

              <div>
                <span className="text-sm text-stone-400 mb-1.5 block">
                  Or a group of…
                </span>
                <div
                  className="grid grid-cols-7 gap-2"
                  role="group"
                  aria-label="Group size"
                >
                  {PLAYER_SIZE_OPTIONS.filter((n) => n >= 2).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPlayers(n)}
                      aria-pressed={players === n}
                      className={`
                        rounded-xl py-2.5 text-sm font-medium border cursor-pointer
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
            </div>

            {!isSolo && (
              <label className="block">
                <span className="text-sm text-stone-400 mb-1.5 block">
                  Your name
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Me"
                  className="w-full rounded-xl border border-cinema-600 bg-cinema-900 px-4 py-3 text-lg text-stone-100 placeholder:text-stone-600 focus:border-butter-400 focus:outline-none"
                />
              </label>
            )}

            {createError && (
              <div className="space-y-2 text-center" role="alert">
                <p className="text-sm text-red-300/90">{createError}</p>
                <button
                  type="button"
                  onClick={() => router.push("/explore")}
                  className="text-sm text-butter-400 hover:text-butter-300 cursor-pointer"
                >
                  Try Top recommends instead
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleCreate}
              disabled={loading || (!isSolo && !name.trim())}
              className="w-full rounded-2xl bg-gradient-to-b from-butter-300 to-butter-500 py-4 text-xl font-bold text-cinema-900 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading
                ? isSolo
                  ? "Opening…"
                  : "Creating..."
                : isSolo
                  ? "Top recommends 🍿"
                  : "Start a room 🍿"}
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
              <span className="text-sm text-stone-400 mb-1.5 block">Your name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Me"
                className="w-full rounded-xl border border-cinema-600 bg-cinema-900 px-4 py-3 text-lg text-stone-100 placeholder:text-stone-600 focus:border-butter-400 focus:outline-none"
              />
            </label>

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
        <li>2. Share what you&apos;re in the mood for, add movies, then tap ready</li>
        <li>3. Rank the shared list and find the winner</li>
      </ol>
    </CinemaShell>
  );
}
