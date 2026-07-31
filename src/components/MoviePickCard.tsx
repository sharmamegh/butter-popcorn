"use client";

import type { Movie } from "@/data/movies";

export function MoviePickCard({
  movie,
  rank,
  onClick,
  disabled,
}: {
  movie: Movie;
  rank?: number;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const ranked = rank !== undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-full rounded-2xl border p-4 text-left transition-all
        ${onClick ? "cursor-pointer active:scale-[0.98]" : "cursor-default"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${
          ranked
            ? "border-butter-400/60 bg-butter-400/10"
            : "border-cinema-600 bg-cinema-800/80 hover:border-butter-500/40"
        }
      `}
    >
      {ranked && (
        <span className="absolute -top-2 -left-2 flex h-8 w-8 items-center justify-center rounded-full bg-butter-400 text-sm font-bold text-cinema-900">
          {rank}
        </span>
      )}
      <div className="flex items-start gap-3">
        <span className="text-3xl shrink-0">{movie.emoji}</span>
        <div className="min-w-0">
          <p className="font-semibold text-stone-100 truncate">{movie.title}</p>
          <p className="text-sm text-stone-500">
            {movie.year} · {movie.genre} · {movie.runtime}
          </p>
        </div>
      </div>
    </button>
  );
}
