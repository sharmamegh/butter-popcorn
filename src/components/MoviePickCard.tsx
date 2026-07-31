"use client";

import type { Movie } from "@/types/movie";

export function ThemeTags({ themes }: { themes: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {themes.map((theme) => (
        <span
          key={theme}
          className="rounded-full bg-cinema-700/80 border border-cinema-600 px-2 py-0.5 text-xs text-stone-400"
        >
          {theme}
        </span>
      ))}
    </div>
  );
}

export function MoviePickCard({
  movie,
  rank,
  onClick,
  disabled,
  compact,
}: {
  movie: Movie;
  rank?: number;
  onClick?: () => void;
  disabled?: boolean;
  compact?: boolean;
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
        <span className="absolute -top-2 -left-2 flex h-8 w-8 items-center justify-center rounded-full bg-butter-400 text-sm font-bold text-cinema-900 z-10">
          {rank}
        </span>
      )}
      <div className="flex items-start gap-3">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt=""
            className="w-14 h-20 object-cover rounded-lg shrink-0 bg-cinema-700"
          />
        ) : (
          <span className="text-3xl shrink-0 w-14 text-center">{movie.emoji}</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-stone-100">{movie.title}</p>
          <p className="text-sm text-stone-500">
            {movie.year} · {movie.genre} · {movie.runtime}
          </p>
          {!compact && (
            <>
              <p className="text-sm text-stone-300 mt-2 leading-relaxed line-clamp-3">
                {movie.description}
              </p>
              <ThemeTags themes={movie.themes} />
            </>
          )}
        </div>
      </div>
    </button>
  );
}
