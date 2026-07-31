"use client";

import { useEffect, useState } from "react";
import type { Movie } from "@/types/movie";

export function MovieSearch({
  onAdd,
  onRemove,
  selectedIds,
  maxCount = 3,
}: {
  onAdd: (tmdbId: number) => void;
  onRemove: (tmdbId: number) => void;
  selectedIds: number[];
  maxCount?: number;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setEnabled(data.tmdbEnabled !== false);
        setResults(data.movies ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!enabled) {
    return (
      <p className="text-sm text-stone-500">
        Add a TMDB API key to search and add custom movies.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <span className="text-sm text-stone-400 block">
        Add your own picks ({selectedIds.length}/{maxCount})
      </span>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onRemove(id)}
              className="rounded-full bg-butter-400/15 border border-butter-400/40 px-3 py-1 text-xs text-butter-300 cursor-pointer"
            >
              Remove pick ✕
            </button>
          ))}
        </div>
      )}

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search any movie..."
        disabled={selectedIds.length >= maxCount}
        className="w-full rounded-xl border border-cinema-600 bg-cinema-900 px-4 py-2.5 text-stone-100 placeholder:text-stone-600 focus:border-butter-400 focus:outline-none disabled:opacity-50"
      />
      {loading && <p className="text-xs text-stone-500">Searching...</p>}
      {results.length > 0 && (
        <ul className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-cinema-600 bg-cinema-900/80 p-2">
          {results.map((movie) => {
            const id = movie.tmdbId!;
            const added = selectedIds.includes(id);
            return (
              <li key={movie.id}>
                <button
                  type="button"
                  onClick={() => !added && onAdd(id)}
                  disabled={added || selectedIds.length >= maxCount}
                  className="w-full flex items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-cinema-800 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {movie.posterUrl ? (
                    <img src={movie.posterUrl} alt="" className="w-8 h-12 object-cover rounded" />
                  ) : (
                    <span>{movie.emoji}</span>
                  )}
                  <span className="text-sm text-stone-200 truncate">
                    {movie.title} ({movie.year})
                  </span>
                  {added && <span className="text-xs text-butter-400 ml-auto">Added</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
