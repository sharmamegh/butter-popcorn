"use client";

import { motion } from "framer-motion";
import type { Movie } from "@/data/movies";
import { MoviePickCard } from "./MoviePickCard";

export function MovieRanker({
  movies,
  rankings,
  onChange,
  disabled,
}: {
  movies: Movie[];
  rankings: string[];
  onChange: (rankings: string[]) => void;
  disabled?: boolean;
}) {
  const unranked = movies.filter((m) => !rankings.includes(m.id));
  const ranked = rankings
    .map((id) => movies.find((m) => m.id === id))
    .filter((m): m is Movie => !!m);

  const addMovie = (id: string) => {
    if (disabled || rankings.includes(id)) return;
    onChange([...rankings, id]);
  };

  const removeMovie = (id: string) => {
    if (disabled) return;
    onChange(rankings.filter((r) => r !== id));
  };

  const moveUp = (index: number) => {
    if (disabled || index === 0) return;
    const next = [...rankings];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  };

  const moveDown = (index: number) => {
    if (disabled || index === rankings.length - 1) return;
    const next = [...rankings];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  };

  const nextRank = rankings.length + 1;
  const done = rankings.length === movies.length;

  return (
    <div className="w-full max-w-lg space-y-6">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-butter-500 mb-1">
          Your picks
        </p>
        <h2 className="text-2xl font-bold text-stone-100">
          {done
            ? "All ranked! Ready to submit."
            : `Tap your #${nextRank} pick`}
        </h2>
        <p className="text-stone-500 mt-1">
          Most wanted at the top · {rankings.length}/{movies.length} ranked
        </p>
      </div>

      {ranked.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-stone-500 px-1">
            Your ranking
          </p>
          {ranked.map((movie, index) => (
            <div key={movie.id} className="flex items-center gap-2">
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={disabled || index === 0}
                  className="text-stone-600 hover:text-butter-400 disabled:opacity-30 text-xs cursor-pointer"
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(index)}
                  disabled={disabled || index === ranked.length - 1}
                  className="text-stone-600 hover:text-butter-400 disabled:opacity-30 text-xs cursor-pointer"
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>
              <div className="flex-1">
                <MoviePickCard
                  movie={movie}
                  rank={index + 1}
                  onClick={() => removeMovie(movie.id)}
                  disabled={disabled}
                  compact
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {unranked.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-stone-500 px-1">
            {ranked.length === 0 ? "Tonight's options" : "Still to rank"}
          </p>
          <div className="grid gap-2">
            {unranked.map((movie) => (
              <MoviePickCard
                key={movie.id}
                movie={movie}
                onClick={() => addMovie(movie.id)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function WaitingForOthers({ names }: { names: string[] }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center space-y-4 py-12"
    >
      <div className="text-5xl animate-pulse">🍿</div>
      <h2 className="text-2xl font-bold text-stone-100">Rankings locked in!</h2>
      <p className="text-stone-400">
        Waiting for {names.join(" & ")} to finish...
      </p>
    </motion.div>
  );
}
