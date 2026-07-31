"use client";

import { useCallback, useState } from "react";
import { pickMovie, type Mood, type Movie } from "@/data/movies";
import { MoodSelector } from "@/components/MoodSelector";
import { MovieCard } from "@/components/MovieCard";
import { PopButton } from "@/components/PopButton";

export default function Home() {
  const [mood, setMood] = useState<Mood>("any");
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isPopping, setIsPopping] = useState(false);

  const handlePop = useCallback(() => {
    if (isPopping) return;

    setIsPopping(true);
    setMovie(null);

    setTimeout(() => {
      setMovie(pickMovie(mood));
      setIsPopping(false);
    }, 600);
  }, [isPopping, mood]);

  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* Cinema curtain edges */}
      <div
        className="fixed top-0 left-0 h-full w-8 sm:w-16 bg-gradient-to-r from-curtain/80 to-transparent z-10"
        aria-hidden="true"
      />
      <div
        className="fixed top-0 right-0 h-full w-8 sm:w-16 bg-gradient-to-l from-curtain/80 to-transparent z-10"
        aria-hidden="true"
      />

      <div className="cinema-glow fixed inset-0 pointer-events-none" />

      <div className="relative z-20 mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-8 px-6 py-16">
        <header className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-butter-600 mb-3">
            Movie Night
          </p>
          <h1
            className="text-5xl sm:text-6xl font-bold shimmer-text mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Butter Popcorn
          </h1>
          <p className="text-stone-400 text-lg max-w-md mx-auto">
            Pick a mood, pop the button, and let destiny choose tonight&apos;s
            film.
          </p>
        </header>

        <MoodSelector selected={mood} onChange={setMood} />

        <MovieCard movie={movie} />

        <PopButton
          onClick={handlePop}
          isPopping={isPopping}
          disabled={isPopping}
        />

        <footer className="text-center text-stone-600 text-xs mt-4">
          {movie
            ? "Not feeling it? Pop again for another pick."
            : `${mood === "any" ? "All" : mood.replace(/-/g, " ")} movies in the mix`}
        </footer>
      </div>
    </main>
  );
}
