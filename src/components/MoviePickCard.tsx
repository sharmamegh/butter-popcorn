"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import type { Movie } from "@/types/movie";

export function ThemeTags({ themes }: { themes: string[] }) {
  if (themes.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {themes.map((theme) => (
        <span
          key={theme}
          className="rounded-full border border-cinema-600 bg-cinema-700/80 px-2 py-0.5 text-xs text-stone-400"
        >
          {theme}
        </span>
      ))}
    </div>
  );
}

function movieMeta(movie: Movie) {
  const parts = [String(movie.year), movie.genre];
  if (movie.runtime && movie.runtime !== "N/A") parts.push(movie.runtime);
  return parts.join(" · ");
}

/** Compact row for ranked list / drag reorder */
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
        relative flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-all
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
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-butter-400 text-sm font-bold text-cinema-900">
          {rank}
        </span>
      )}
      {movie.posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={movie.posterUrl}
          alt=""
          className="h-14 w-10 shrink-0 rounded-md object-cover bg-cinema-700"
        />
      ) : (
        <span className="flex h-14 w-10 shrink-0 items-center justify-center text-2xl">
          {movie.emoji}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-stone-100">{movie.title}</p>
        <p className="truncate text-xs text-stone-500">{movieMeta(movie)}</p>
      </div>
    </button>
  );
}

/** Poster-forward tile for the browse grid */
export function MoviePosterTile({
  movie,
  onOpen,
  disabled,
}: {
  movie: Movie;
  onOpen: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      className="group flex w-full min-w-0 flex-col gap-2 text-left disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-cinema-600 bg-cinema-800 transition-[border-color] group-hover:border-butter-500/50">
        {movie.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={movie.posterUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform group-active:scale-[0.98]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">
            {movie.emoji}
          </div>
        )}
      </div>
      <div className="min-w-0 w-full px-0.5">
        <p className="truncate text-sm font-medium text-stone-100">
          {movie.title}
        </p>
        <p className="truncate text-xs text-stone-500">{movie.year}</p>
      </div>
    </button>
  );
}

/** Full details when someone wants more before choosing */
export function MovieDetailSheet({
  movie,
  nextRank,
  onPick,
  onClose,
  disabled,
}: {
  movie: Movie;
  nextRank: number;
  onPick: () => void;
  onClose: () => void;
  disabled?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="movie-detail-title"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="relative z-10 flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-cinema-600 bg-cinema-800 sm:rounded-3xl"
      >
        <div className="flex gap-4 p-5 pb-3">
          {movie.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={movie.posterUrl}
              alt=""
              className="h-36 w-24 shrink-0 rounded-xl object-cover bg-cinema-700"
            />
          ) : (
            <div className="flex h-36 w-24 shrink-0 items-center justify-center rounded-xl bg-cinema-700 text-4xl">
              {movie.emoji}
            </div>
          )}
          <div className="min-w-0 flex-1 pt-1">
            <h3
              id="movie-detail-title"
              className="text-xl font-bold text-stone-100 leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {movie.title}
            </h3>
            <p className="mt-1 text-sm text-stone-500">{movieMeta(movie)}</p>
            {movie.tagline && (
              <p className="mt-2 text-sm italic text-stone-400 line-clamp-2">
                {movie.tagline}
              </p>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-3">
          <p className="text-sm leading-relaxed text-stone-300">
            {movie.description}
          </p>
          <ThemeTags themes={movie.themes} />
        </div>

        <div className="flex gap-2 border-t border-cinema-600 p-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-cinema-600 py-3.5 text-stone-400 hover:text-stone-200 cursor-pointer"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onPick}
            disabled={disabled}
            className="flex-[1.4] rounded-2xl bg-gradient-to-b from-butter-300 to-butter-500 py-3.5 text-lg font-bold text-cinema-900 disabled:opacity-40 cursor-pointer"
          >
            Pick as #{nextRank}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
