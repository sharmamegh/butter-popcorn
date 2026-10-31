"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CinemaShell } from "@/components/CinemaShell";
import { MoodPicker } from "@/components/MoodPicker";
import { MovieRanker } from "@/components/MovieRanker";
import { MovieSearch } from "@/components/MovieSearch";
import { ThemeTags } from "@/components/MoviePickCard";
import { calculateMatch, completeRankings } from "@/lib/match";
import type { CustomPick, MatchResult, Room } from "@/lib/room-types";
import type { Mood, Movie } from "@/types/movie";
import { movieIdFromTmdb, normalizeMoods } from "@/types/movie";
import { motion } from "framer-motion";

type Phase = "build" | "ranking" | "revealed";

function SoloReveal({
  movie,
  insight,
  onAgain,
}: {
  movie: Movie;
  insight: string;
  onAgain: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-lg space-y-6 text-center"
    >
      {movie.posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="mx-auto w-40 rounded-xl shadow-lg"
        />
      ) : (
        <div className="text-7xl">{movie.emoji}</div>
      )}
      <div>
        <p className="mb-2 text-sm uppercase tracking-[0.35em] text-emerald-400">
          Tonight&apos;s pick
        </p>
        <h1
          className="text-4xl font-bold text-butter-100 sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {movie.title}
        </h1>
        <p className="mt-2 text-lg text-stone-400">
          {movie.year} · {movie.genre} · {movie.runtime}
        </p>
      </div>
      <p className="mx-auto max-w-md text-left text-base leading-relaxed text-stone-400">
        {movie.description}
      </p>
      <ThemeTags themes={movie.themes} />
      <div className="rounded-2xl border border-butter-400/30 bg-butter-400/10 px-5 py-4">
        <p className="text-lg font-medium text-butter-200">{insight}</p>
      </div>
      <button
        type="button"
        onClick={onAgain}
        className="w-full cursor-pointer rounded-2xl bg-gradient-to-b from-butter-300 to-butter-500 py-4 text-xl font-bold text-cinema-900"
      >
        Show me new options
      </button>
      <Link
        href="/"
        className="block py-2 text-sm text-stone-500 transition-colors hover:text-butter-400"
      >
        Back to start
      </Link>
    </motion.div>
  );
}

function ExploreInner() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name")?.trim() || "You";

  const [phase, setPhase] = useState<Phase>("build");
  const [moods, setMoods] = useState<Mood[]>(["any"]);
  const [picks, setPicks] = useState<CustomPick[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [rankings, setRankings] = useState<string[]>([]);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loadingSlate, setLoadingSlate] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [seed, setSeed] = useState(() => `solo-${Date.now()}`);

  const selectedPicks = useMemo(
    () =>
      picks.map((p) => ({
        tmdbId: p.tmdbId,
        title: p.title,
        year: p.year,
        posterUrl: p.posterUrl,
      })),
    [picks]
  );

  const handleAdd = (movie: {
    tmdbId: number;
    title: string;
    year: number;
    posterUrl: string | null;
  }) => {
    setPicks((prev) => {
      if (prev.some((p) => p.tmdbId === movie.tmdbId)) return prev;
      return [
        ...prev,
        {
          tmdbId: movie.tmdbId,
          addedBy: "solo",
          title: movie.title,
          year: movie.year,
          posterUrl: movie.posterUrl,
        },
      ];
    });
  };

  const handleRemove = (tmdbId: number) => {
    setPicks((prev) => prev.filter((p) => p.tmdbId !== tmdbId));
  };

  const startRanking = useCallback(async () => {
    setBuildError(null);
    setLoadingSlate(true);
    try {
      const params = new URLSearchParams({
        seed,
        moods: normalizeMoods(moods).join(","),
        count: String(Math.max(10, picks.length + 8)),
      });

      const res = await fetch(`/api/movies/discover?${params.toString()}`);
      const data = (await res.json()) as {
        movies?: Movie[];
        error?: string;
      };

      if (!res.ok && data.error) {
        setBuildError(data.error);
        return;
      }

      const discovered = data.movies ?? [];
      const byId = new Map<string, Movie>();

      for (const pick of picks) {
        const id = movieIdFromTmdb(pick.tmdbId);
        const fromDiscover = discovered.find((m) => m.tmdbId === pick.tmdbId);
        byId.set(
          id,
          fromDiscover ?? {
            id,
            tmdbId: pick.tmdbId,
            title: pick.title,
            year: pick.year || 0,
            tagline: "",
            description: "Added by you.",
            themes: [],
            runtime: "",
            emoji: "🎬",
            genre: "Movie",
            posterUrl: pick.posterUrl,
          }
        );
      }

      for (const movie of discovered) {
        if (!byId.has(movie.id)) byId.set(movie.id, movie);
      }

      const slate = [...byId.values()];
      if (slate.length < 2) {
        setBuildError(
          "Couldn't load recommendations. Try another mood, or add a couple titles yourself."
        );
        return;
      }

      setMovies(slate);
      setRankings([]);
      setResult(null);
      setPhase("ranking");
    } catch {
      setBuildError("Couldn't load recommendations. Check your connection.");
    } finally {
      setLoadingSlate(false);
    }
  }, [moods, picks, seed]);

  const lockIn = () => {
    const completed = completeRankings(
      rankings,
      movies.map((m) => m.id)
    );
    if (!completed) return;

    const fakeRoom: Room = {
      code: "SOLO",
      seed,
      moods: normalizeMoods(moods),
      movieIds: movies.map((m) => m.id),
      movies: Object.fromEntries(movies.map((m) => [m.id, m])),
      customPicks: picks,
      usedMovieIds: [],
      excludedMovieIds: [],
      expectedPlayers: 1,
      discoveryMode: "auto",
      status: "ranking",
      hostId: "solo",
      result: null,
      createdAt: Date.now(),
      passDeadline: null,
      passFavorites: {},
      players: [
        {
          id: "solo",
          name,
          isHost: true,
          picksReady: true,
          submitted: true,
          moods: normalizeMoods(moods),
          rankings: completed,
          pickedIds: rankings,
          vetoUsed: false,
          vetoResponse: "pending",
        },
      ],
    };

    const match = calculateMatch(fakeRoom);
    if (!match) {
      setBuildError("Couldn't pick a winner from that list.");
      return;
    }
    setResult(match);
    setPhase("revealed");
  };

  const reset = () => {
    setPhase("build");
    setRankings([]);
    setResult(null);
    setMovies([]);
    setBuildError(null);
    setSeed(`solo-${Date.now()}`);
  };

  useEffect(() => {
    void fetch(
      `/api/movies/discover?seed=${encodeURIComponent(seed)}&count=2`
    );
  }, [seed]);

  const winner = result && movies.find((m) => m.id === result.winnerId);

  if (phase === "revealed" && winner && result) {
    return (
      <CinemaShell>
        <SoloReveal
          movie={winner}
          insight={
            rankings[0] === winner.id
              ? "Your #1. Go make the popcorn."
              : result.insight
          }
          onAgain={reset}
        />
      </CinemaShell>
    );
  }

  if (phase === "ranking") {
    return (
      <CinemaShell>
        <div className="w-full max-w-lg space-y-4">
          <MovieRanker
            movies={movies}
            rankings={rankings}
            onChange={setRankings}
            action={
              <button
                type="button"
                onClick={lockIn}
                disabled={rankings.length === 0}
                className="w-full cursor-pointer rounded-2xl bg-gradient-to-b from-butter-300 to-butter-500 py-4 text-xl font-bold text-cinema-900 disabled:opacity-40"
              >
                Lock in my pick
              </button>
            }
          />
          <button
            type="button"
            onClick={reset}
            className="w-full cursor-pointer py-2 text-sm text-stone-500 hover:text-butter-400"
          >
            ← Start over
          </button>
        </div>
      </CinemaShell>
    );
  }

  return (
    <CinemaShell>
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <p className="mb-1 text-sm uppercase tracking-[0.25em] text-butter-500">
            Tonight
          </p>
          <h2 className="text-2xl font-bold text-stone-100">
            What are you in the mood for?
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Choose a vibe. We&apos;ll line up options for tonight.
          </p>
        </div>

        <MoodPicker selected={moods} onChange={setMoods} />

        <MovieSearch
          selectedPicks={selectedPicks}
          onAdd={handleAdd}
          onRemove={handleRemove}
          label="Already know something you want? (optional)"
        />

        {picks.length > 0 && (
          <p className="text-center text-sm text-stone-500">
            Keeping {picks.length} in for sure
          </p>
        )}

        {buildError && (
          <p className="text-center text-sm text-red-300/90" role="alert">
            {buildError}
          </p>
        )}

        <button
          type="button"
          onClick={() => void startRanking()}
          disabled={loadingSlate}
          className="w-full cursor-pointer rounded-2xl bg-gradient-to-b from-butter-300 to-butter-500 py-4 text-xl font-bold text-cinema-900 disabled:opacity-40"
        >
          {loadingSlate ? "Finding options…" : "Show me options"}
        </button>

        <Link
          href="/"
          className="block text-center text-sm text-stone-600 transition-colors hover:text-butter-400"
        >
          Back to start
        </Link>
      </div>
    </CinemaShell>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <CinemaShell>
          <p className="text-stone-400">One sec…</p>
        </CinemaShell>
      }
    >
      <ExploreInner />
    </Suspense>
  );
}
