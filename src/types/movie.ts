export type Movie = {
  id: string;
  tmdbId: number | null;
  title: string;
  year: number;
  tagline: string;
  description: string;
  themes: string[];
  runtime: string;
  emoji: string;
  genre: string;
  posterUrl: string | null;
};

export type Mood =
  | "any"
  | "feel-good"
  | "action"
  | "horror"
  | "romance"
  | "sci-fi"
  | "comedy"
  | "drama"
  | "thriller";

export const MOODS: { id: Mood; label: string; emoji: string }[] = [
  { id: "any", label: "Surprise Me", emoji: "🎲" },
  { id: "feel-good", label: "Feel Good", emoji: "☀️" },
  { id: "comedy", label: "Comedy", emoji: "😂" },
  { id: "action", label: "Action", emoji: "💥" },
  { id: "romance", label: "Romance", emoji: "💕" },
  { id: "sci-fi", label: "Sci-Fi", emoji: "🚀" },
  { id: "horror", label: "Horror", emoji: "👻" },
  { id: "thriller", label: "Thriller", emoji: "🔪" },
  { id: "drama", label: "Drama", emoji: "🎭" },
];

export function movieIdFromTmdb(tmdbId: number): string {
  return `tmdb-${tmdbId}`;
}

export function parseTmdbId(movieId: string): number | null {
  if (movieId.startsWith("tmdb-")) {
    const n = parseInt(movieId.slice(5), 10);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}
