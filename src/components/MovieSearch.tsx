"use client";

import { useEffect, useState } from "react";
import type { Movie } from "@/types/movie";

type SelectedPick = {
  tmdbId: number;
  title: string;
  year: number;
  posterUrl: string | null;
};

export function MovieSearch({
  onAdd,
  onRemove,
  selectedPicks,
  label = "Add movies you want",
}: {
  onAdd: (movie: {
    tmdbId: number;
    title: string;
    year: number;
    posterUrl: string | null;
  }) => void;
  onRemove: (tmdbId: number) => void;
  /** Server-known picks (source of truth for chip titles). */
  selectedPicks: SelectedPick[];
  label?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  /** Optimistic chips until the parent refresh confirms them. */
  const [pending, setPending] = useState<SelectedPick[]>([]);

  const selectedIds = selectedPicks.map((p) => p.tmdbId);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/movies/search?q=")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setEnabled(data.tmdbEnabled !== false);
      })
      .catch(() => {
        if (!cancelled) setEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Drop optimistic entries once the server list includes them.
  useEffect(() => {
    const confirmed = new Set(selectedPicks.map((p) => p.tmdbId));
    setPending((prev) => prev.filter((p) => !confirmed.has(p.tmdbId)));
  }, [selectedPicks]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/movies/search?q=${encodeURIComponent(query)}`
        );
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

  const handleAdd = (movie: Movie) => {
    const id = movie.tmdbId;
    if (id == null || selectedIds.includes(id)) return;

    const entry: SelectedPick = {
      tmdbId: id,
      title: movie.title,
      year: movie.year,
      posterUrl: movie.posterUrl,
    };
    setPending((prev) => [...prev.filter((p) => p.tmdbId !== id), entry]);
    onAdd(entry);
    setQuery("");
    setResults([]);
  };

  const chips: SelectedPick[] = [
    ...selectedPicks,
    ...pending.filter((p) => !selectedIds.includes(p.tmdbId)),
  ];

  if (enabled === null || !enabled) {
    return null;
  }

  return (
    <div className="space-y-2">
      <span className="text-sm text-stone-400 block">{label}</span>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((pick) => (
            <button
              key={pick.tmdbId}
              type="button"
              onClick={() => onRemove(pick.tmdbId)}
              className="rounded-full bg-butter-400/15 border border-butter-400/40 px-3 py-1 text-xs text-butter-300 cursor-pointer"
            >
              {pick.title} ✕
            </button>
          ))}
        </div>
      )}

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search any movie..."
        className="w-full rounded-xl border border-cinema-600 bg-cinema-900 px-4 py-2.5 text-stone-100 placeholder:text-stone-600 focus:border-butter-400 focus:outline-none"
      />
      {loading && <p className="text-xs text-stone-500">Searching...</p>}
      {results.length > 0 && (
        <ul className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-cinema-600 bg-cinema-900/80 p-2">
          {results.map((movie) => {
            const id = movie.tmdbId!;
            const added =
              selectedIds.includes(id) ||
              pending.some((p) => p.tmdbId === id);
            return (
              <li key={movie.id}>
                <button
                  type="button"
                  onClick={() => handleAdd(movie)}
                  disabled={added}
                  className="w-full flex items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-cinema-800 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {movie.posterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={movie.posterUrl}
                      alt=""
                      className="w-8 h-12 object-cover rounded"
                    />
                  ) : (
                    <span>{movie.emoji}</span>
                  )}
                  <span className="text-sm text-stone-200 truncate">
                    {movie.title} ({movie.year})
                  </span>
                  {added && (
                    <span className="text-xs text-butter-400 ml-auto">Added</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
