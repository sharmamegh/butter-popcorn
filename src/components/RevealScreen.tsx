"use client";

import { motion } from "framer-motion";
import type { Movie } from "@/types/movie";
import type { MatchResult, PublicRoom } from "@/lib/room-types";
import { getMovieById } from "@/data/movies";
import { ThemeTags } from "./MoviePickCard";

export function RevealScreen({
  movie,
  result,
  room,
  playerId,
  me,
  onNewRound,
  onVetoResponse,
}: {
  movie: Movie;
  result: MatchResult;
  room: PublicRoom;
  playerId: string;
  me: PublicRoom["players"][0];
  onNewRound: () => void;
  onVetoResponse: (response: "accept" | "veto") => void;
}) {
  const isHost = room.hostId === playerId;
  const needsMyResponse = me.vetoResponse === "pending";
  const canVeto = needsMyResponse && !me.vetoUsed;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-lg text-center space-y-6"
    >
      {movie.posterUrl ? (
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="mx-auto w-40 rounded-xl shadow-lg"
        />
      ) : (
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-7xl"
        >
          {movie.emoji}
        </motion.div>
      )}

      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-emerald-400 mb-2">
          The group is watching
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

      <p className="text-base text-stone-400 leading-relaxed max-w-md mx-auto text-left">
        {movie.description}
      </p>

      <ThemeTags themes={movie.themes} />

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

      {needsMyResponse && (
        <div className="space-y-3">
          <p className="text-stone-400">Happy with this pick?</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => onVetoResponse("accept")}
              className="rounded-2xl bg-gradient-to-b from-emerald-400 to-emerald-600 px-8 py-3 text-lg font-bold text-cinema-900 cursor-pointer"
            >
              Looks good!
            </button>
            {canVeto && (
              <button
                type="button"
                onClick={() => onVetoResponse("veto")}
                className="rounded-2xl border border-red-500/50 bg-red-500/10 px-8 py-3 text-lg font-bold text-red-300 cursor-pointer"
              >
                Veto (1 per room)
              </button>
            )}
          </div>
        </div>
      )}

      {!needsMyResponse && room.vetoPending && (
        <p className="text-stone-500">Waiting for others to respond...</p>
      )}

      <div className="rounded-2xl border border-cinema-600 bg-cinema-800/60 p-4 text-left">
        <p className="text-xs uppercase tracking-wider text-stone-500 mb-3">
          Compatibility scores
        </p>
        <div className="space-y-2">
          {result.scores.slice(0, 4).map((entry, i) => {
            const m = room.movies.find((mv) => mv.id === entry.movieId) ?? getMovieById(entry.movieId);
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

      <p className="text-xl font-bold text-stone-200">🎬 Time to press play!</p>

      {isHost && (
        <button
          type="button"
          onClick={onNewRound}
          className="rounded-2xl border border-cinema-600 px-6 py-3 text-stone-400 hover:text-stone-200 cursor-pointer"
        >
          New round with fresh movies
        </button>
      )}
    </motion.div>
  );
}
