"use client";

import { motion } from "framer-motion";
import type { Movie } from "@/data/movies";
import type { MatchResult, PublicRoom } from "@/lib/room-types";
import { getMovieById } from "@/data/movies";

export function RevealScreen({
  movie,
  result,
  room,
  playerId,
  onPlayAgain,
}: {
  movie: Movie;
  result: MatchResult;
  room: PublicRoom;
  playerId: string;
  onPlayAgain: () => void;
}) {
  const isHost = room.hostId === playerId;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-lg text-center space-y-6"
    >
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-7xl"
      >
        {movie.emoji}
      </motion.div>

      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-emerald-400 mb-2">
          Tonight you&apos;re watching
        </p>
        <h1
          className="text-4xl sm:text-5xl font-bold text-butter-100"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {movie.title}
        </h1>
        <p className="text-lg text-stone-400 mt-2">
          {movie.year} · {movie.genre} · {movie.runtime}
        </p>
      </div>

      <p className="text-xl text-stone-300 italic">
        &ldquo;{movie.tagline}&rdquo;
      </p>

      <p className="text-base text-stone-400 leading-relaxed max-w-md mx-auto">
        {movie.description}
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {movie.themes.map((theme) => (
          <span
            key={theme}
            className="rounded-full bg-cinema-700 border border-cinema-600 px-3 py-1 text-xs text-stone-400"
          >
            {theme}
          </span>
        ))}
      </div>

      <div className="rounded-2xl border border-butter-400/30 bg-butter-400/10 px-5 py-4">
        <p className="text-lg font-medium text-butter-200">{result.insight}</p>
        <div className="mt-3 space-y-1">
          {result.breakdown.map((entry) => (
            <p key={entry.playerId} className="text-sm text-stone-400">
              {entry.name} ranked it <span className="text-butter-300">#{entry.rank}</span>
            </p>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-cinema-600 bg-cinema-800/60 p-4 text-left">
        <p className="text-xs uppercase tracking-wider text-stone-500 mb-3">
          Compatibility scores
        </p>
        <div className="space-y-2">
          {result.scores.slice(0, 4).map((entry, i) => {
            const m = getMovieById(entry.movieId);
            if (!m) return null;
            const maxScore = result.scores[0]?.points ?? 1;
            const pct = Math.round((entry.points / maxScore) * 100);
            return (
              <div key={entry.movieId} className="flex items-center gap-3">
                <span className="text-lg w-6">{i === 0 ? "👑" : m.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm mb-0.5">
                    <span className={i === 0 ? "text-butter-300 font-medium" : "text-stone-400"}>
                      {m.title}
                    </span>
                    <span className="text-stone-600">{entry.points} pts</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-cinema-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${i === 0 ? "bg-butter-400" : "bg-cinema-600"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xl font-bold text-stone-200">
        🎬 Time to press play!
      </p>

      {isHost && (
        <button
          type="button"
          onClick={onPlayAgain}
          className="rounded-2xl border border-cinema-600 px-6 py-3 text-stone-400 hover:text-stone-200 cursor-pointer"
        >
          New round with fresh movies
        </button>
      )}
    </motion.div>
  );
}
