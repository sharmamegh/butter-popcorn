import { DISCOVERY_FILL_COUNT } from "@/lib/constants";
import type { Mood, Movie } from "@/types/movie";
import { movieIdFromTmdb, normalizeMoods, parseTmdbId } from "@/types/movie";
import { MOVIE_CATALOG, getMovieById } from "@/data/movies";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE = "https://image.tmdb.org/t/p/w342";

const GENRE_EMOJI: Record<number, string> = {
  28: "💥",
  12: "🗺️",
  16: "🎨",
  35: "😂",
  80: "🔫",
  99: "📽️",
  18: "🎭",
  10751: "👨‍👩‍👧",
  14: "🧙",
  36: "📜",
  27: "👻",
  10402: "🎵",
  9648: "🔍",
  10749: "💕",
  878: "🚀",
  53: "😰",
  10752: "⚔️",
  37: "🤠",
};

const GENRE_NAME: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const MOOD_GENRES: Record<Mood, number[]> = {
  any: [],
  "feel-good": [35, 10751, 16, 12],
  comedy: [35],
  action: [28, 12],
  romance: [10749, 18],
  "sci-fi": [878, 14],
  horror: [27],
  thriller: [53, 80, 9648],
  drama: [18],
};

type TmdbMovie = {
  id: number;
  title: string;
  overview: string;
  release_date?: string;
  genre_ids?: number[];
  vote_average?: number;
  popularity?: number;
  poster_path?: string | null;
};

type TmdbMovieDetail = TmdbMovie & {
  genres?: { id: number; name: string }[];
  runtime?: number;
  tagline?: string;
};

/**
 * TMDB auth: use the v3 **API Key** (query param `api_key`).
 * The "API Read Access Token" is a Bearer token for a different auth style;
 * this app is wired for the API Key only.
 */
function hasTmdbKey(): boolean {
  return Boolean(process.env.TMDB_API_KEY);
}

function tmdbUrl(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", process.env.TMDB_API_KEY ?? "");
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }
  return url.toString();
}

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) >>> 0;
  }
  return h || 1;
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  let h = hashSeed(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const j = h % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function genreEmoji(genreIds: number[]): string {
  for (const id of genreIds) {
    if (GENRE_EMOJI[id]) return GENRE_EMOJI[id];
  }
  return "🎬";
}

function primaryGenre(genreIds: number[]): string {
  for (const id of genreIds) {
    if (GENRE_NAME[id]) return GENRE_NAME[id];
  }
  return "Film";
}

function themeTags(genreIds: number[], voteAverage?: number): string[] {
  const themes = genreIds
    .map((id) => GENRE_NAME[id])
    .filter(Boolean)
    .slice(0, 3);
  if (voteAverage && voteAverage >= 7.5) themes.push("Highly rated");
  return themes.slice(0, 4);
}

function formatRuntime(minutes?: number): string {
  if (!minutes) return "N/A";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function tmdbToMovie(item: TmdbMovie | TmdbMovieDetail): Movie {
  const genreIds =
    item.genre_ids ??
    ("genres" in item && item.genres ? item.genres.map((g) => g.id) : []);
  const year = item.release_date
    ? parseInt(item.release_date.slice(0, 4), 10)
    : 0;

  return {
    id: movieIdFromTmdb(item.id),
    tmdbId: item.id,
    title: item.title,
    year: Number.isNaN(year) ? 0 : year,
    tagline:
      "tagline" in item && item.tagline
        ? item.tagline
        : item.overview.slice(0, 80) + (item.overview.length > 80 ? "..." : ""),
    description: item.overview || "No description available.",
    themes: themeTags(genreIds, item.vote_average),
    runtime: formatRuntime("runtime" in item ? item.runtime : undefined),
    emoji: genreEmoji(genreIds),
    genre: primaryGenre(genreIds),
    posterUrl: item.poster_path
      ? `${TMDB_IMAGE}${item.poster_path}`
      : null,
  };
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const res = await fetch(tmdbUrl(path, params), {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

export async function searchTmdbMovies(query: string): Promise<Movie[]> {
  if (!hasTmdbKey() || query.trim().length < 2) return [];

  const data = await tmdbFetch<{ results: TmdbMovie[] }>("/search/movie", {
    query: query.trim(),
    include_adult: "false",
    language: "en-US",
    page: "1",
  });

  return data.results
    .filter((m) => m.poster_path && m.overview)
    .slice(0, 8)
    .map(tmdbToMovie);
}

async function discoverPage(
  moods: Mood[],
  page: number
): Promise<TmdbMovie[]> {
  const genreIds = [
    ...new Set(
      normalizeMoods(moods).flatMap((mood) => MOOD_GENRES[mood] ?? [])
    ),
  ];
  const params: Record<string, string> = {
    sort_by: "popularity.desc",
    include_adult: "false",
    language: "en-US",
    page: String(page),
    "vote_count.gte": "200",
    "vote_average.gte": "6.0",
  };

  // Pipe = OR so comedy + horror means either vibe, not both at once
  if (genreIds.length > 0) {
    params.with_genres = genreIds.join("|");
  }

  const data = await tmdbFetch<{ results: TmdbMovie[] }>(
    "/discover/movie",
    params
  );

  return data.results.filter((m) => m.poster_path && m.overview);
}

export async function fetchTmdbMovieDetails(tmdbId: number): Promise<Movie | null> {
  if (!hasTmdbKey()) return null;
  try {
    const data = await tmdbFetch<TmdbMovieDetail>(`/movie/${tmdbId}`, {
      language: "en-US",
    });
    return tmdbToMovie(data);
  } catch {
    return null;
  }
}

export async function buildSessionMovies(options: {
  seed: string;
  moods: Mood[];
  count?: number;
  excludeIds?: string[];
  customTmdbIds?: number[];
  /** When false, only custom picks are returned (no discovery padding). */
  fillFromDiscovery?: boolean;
}): Promise<Movie[]> {
  const {
    seed,
    moods,
    count = DISCOVERY_FILL_COUNT,
    excludeIds = [],
    customTmdbIds = [],
    fillFromDiscovery = true,
  } = options;

  const exclude = new Set(excludeIds);
  const customIds = [...new Set(customTmdbIds)];
  const normalizedMoods = normalizeMoods(moods);

  if (!hasTmdbKey()) {
    const staticMovies = getStaticSessionMovies(seed, Math.max(count, customIds.length));
    const pool = staticMovies.filter((m) => !exclude.has(m.id));
    return pool.slice(0, Math.max(count, 1));
  }

  const customMovies: Movie[] = [];
  for (const id of customIds) {
    const movie = await fetchTmdbMovieDetails(id);
    if (movie && !exclude.has(movie.id)) customMovies.push(movie);
  }

  if (!fillFromDiscovery) {
    return customMovies;
  }

  if (customMovies.length >= count) {
    return customMovies;
  }

  const h = hashSeed(seed);
  const startPage = (h % 40) + 1;
  const candidates: TmdbMovie[] = [];

  for (let i = 0; i < 3; i++) {
    const page = startPage + i;
    const results = await discoverPage(normalizedMoods, page);
    candidates.push(...results);
  }

  const customIdSet = new Set(customIds);
  const seen = new Set<string>([...exclude]);
  const unique: TmdbMovie[] = [];

  for (const c of candidates) {
    const id = movieIdFromTmdb(c.id);
    if (seen.has(id) || customIdSet.has(c.id)) continue;
    seen.add(id);
    unique.push(c);
  }

  const shuffled = seededShuffle(unique, seed);
  const slots = Math.max(0, count - customMovies.length);
  const pickedRaw = shuffled.slice(0, slots);
  const picked = await Promise.all(
    pickedRaw.map(async (item) => {
      const detailed = await fetchTmdbMovieDetails(item.id);
      return detailed ?? tmdbToMovie(item);
    })
  );

  return [...customMovies, ...picked];
}

export async function resolveMovies(movieIds: string[]): Promise<Movie[]> {
  const results: Movie[] = [];

  for (const id of movieIds) {
    const cached = getMovieById(id);
    if (cached) {
      results.push(cached);
      continue;
    }

    const tmdbId = parseTmdbId(id);
    if (tmdbId && hasTmdbKey()) {
      const movie = await fetchTmdbMovieDetails(tmdbId);
      if (movie) results.push(movie);
    }
  }

  return results;
}

function getStaticSessionMovies(seed: string, count: number): Movie[] {
  const shuffled = [...MOVIE_CATALOG];
  let h = hashSeed(seed);
  for (let i = shuffled.length - 1; i > 0; i--) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const j = h % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

export function isTmdbEnabled(): boolean {
  return hasTmdbKey();
}
